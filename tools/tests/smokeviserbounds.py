"""Revision 360 in a headset: one question, controls that stay put, no overlap.

Section 72 asks for three things that a screenshot cannot settle: one question on
screen at a time, controls in a fixed safe place, and no panel on top of another.
Section 69 to 71 ask that a long written answer is never forced onto a headset
keyboard. This checks all of it through js/vr.js's own geometry, the way
tools/tests/smokevrbounds.py checks the programming workspace - because a layout
that looks fine from where the test happens to stand can still be unreachable
from where a pupil sits.

Each check below fails if its rule is taken out. The ones that found something:

  * the control bar and the question screen sharing air at the seated pitch;
  * the keyboard, which is placed by its top edge, coming up into the question;
  * the menu button not being reachable while a question is open;
  * two questions on screen at once after a topic change;
  * a six-mark written question offering nothing but the headset keyboard;
  * the controls moving when the head moves.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/smokeviserbounds.py
"""
import os, sys, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
from playwright.sync_api import sync_playwright

PORT = 8826
GAP = 2.0          # degrees of clear air required between any two surfaces


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


def overlap(a, b):
    def seg(lo1, hi1, lo2, hi2):
        return min(hi1, hi2) - max(lo1, lo2) > -GAP
    return (seg(a["yaw0"], a["yaw1"], b["yaw0"], b["yaw1"])
            and seg(a["pitch0"], a["pitch1"], b["pitch0"], b["pitch1"]))


def clear(bounds, ok, said):
    """Every pair of showing surfaces has clear air between it."""
    for i in range(len(bounds)):
        for j in range(i + 1, len(bounds)):
            a, c = bounds[i], bounds[j]
            ok(not overlap(a, c),
               "%s and %s have %s° of clear air %s"
               % (a["name"], c["name"], GAP, said))


def show(bounds, head):
    print(head)
    for s in bounds:
        print("  %-9s yaw %6.1f to %-6.1f  pitch %6.1f to %-6.1f  at %.2f m"
              % (s["name"], s["yaw0"], s["yaw1"], s["pitch0"], s["pitch1"], s["dist"]))


# What can be pointed at, named by which panel it belongs to.
TARGETS = """(() => {
  const V = NVRVR, R = NVRReviseVR, t = V.targets ? V.targets() : null;
  if (!t) return null;
  return { names: t.panels.map(m =>
      m.userData.panel === R.qp ? 'question' :
      m.userData.panel === R.bar ? 'controls' :
      m.userData.panel === V.kbPanel ? 'keyboard' :
      m.userData.panel === V.menuBtn ? 'menu' :
      m.userData.panel === V.menuPanel ? 'menuPanel' : 'other'),
    sprites: t.sprites.length }; })()"""

# Every panel of the revision renderer that is currently showing something.
SHOWING = """(() => {
  const R = NVRReviseVR;
  return { question: !!R.qp.mesh.visible, controls: !!R.bar.mesh.visible,
           keyboard: !!NVRVR.kbPanel.mesh.visible,
           stem: (NVRCore.revision.current || {}).q || null }; })()"""


def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
    bad = 0

    def ok(cond, said):
        nonlocal bad
        print(("  ok   " if cond else "  FAIL ") + said)
        if not cond: bad += 1

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.route("**/three.min.js",
                 lambda r: r.fulfill(body=three, content_type="application/javascript"))
        pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                  "\nwindow.__dev.installRuntime({ forceInstall: true });")
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'vrbounds', name: 'Vee Arr', cls: '11A',
                           school: 'MCS' })); } catch (e) {}""")
        pg.goto("http://127.0.0.1:%d/revise.html" % PORT)
        pg.wait_for_function("() => window.NVRCore && NVRCore.revision", timeout=60000)
        pg.wait_for_timeout(1200)

        ok(pg.evaluate("() => !!document.querySelector('#vrBtn')"),
           "the revision room offers a headset button")
        pg.click("#vrBtn")
        pg.wait_for_function("() => window.NVRReviseVR && NVRReviseVR.qp.mesh.visible",
                             timeout=60000)
        pg.wait_for_timeout(900)

        # ---- 1. one question, and the controls under it
        st = pg.evaluate(SHOWING)
        ok(st["question"], "a question is on screen")
        ok(st["controls"], "the controls are showing under it")
        ok(bool(st["stem"]), "and the engine says which question it is")
        bounds = pg.evaluate("NVRReviseVR.reviseBounds()")
        show(bounds, "where each surface sits, in degrees from the anchor:")
        names = [s["name"] for s in bounds]
        ok("question" in names and "controls" in names,
           "the renderer reports both of its surfaces (%s)" % ", ".join(names))
        clear(bounds, ok, "with a question open")

        # ---- 2. everything that should be reachable, is
        tg = pg.evaluate(TARGETS)
        ok(tg is not None, "the renderer reports what can be pointed at")
        if tg:
            ok("question" in tg["names"],
               "the question's own answer controls can be pointed at (%s)"
               % ", ".join(sorted(set(tg["names"]))))
            ok("controls" in tg["names"], "the control bar can be pointed at")
            ok("menu" in tg["names"], "the menu button can be pointed at")
            ok(tg["sprites"] == 0,
               "nothing behind the question is selectable (%d offered)" % tg["sprites"])

        # ---- 3. the controls do not follow the head
        start = pg.evaluate("NVRReviseVR.bar.mesh.position.toArray()")
        pg.evaluate("""(() => { const d = window.__dev;
          d.position.set(0.35, 1.72, 0.25);
          if (d.quaternion && d.quaternion.set) {
            const h = -0.5, s = Math.sin(h), c = Math.cos(h);
            d.quaternion.set(0, s, 0, c);
          } })()""")
        pg.wait_for_timeout(900)
        moved = pg.evaluate("NVRReviseVR.bar.mesh.position.toArray()")
        drift = max(abs(x - y) for x, y in zip(start, moved))
        ok(drift < 0.01,
           "the controls stay put while the head moves and turns (%.1f cm)" % (drift * 100))

        # ---- 4. and come with the question when it is recentred
        before = pg.evaluate("NVRReviseVR.bar.mesh.position.toArray()")
        pg.evaluate("() => { NVRVR.setAnchor(true); NVRReviseVR.place(); }")
        pg.wait_for_timeout(400)
        after = pg.evaluate("NVRReviseVR.bar.mesh.position.toArray()")
        shifted = max(abs(x - y) for x, y in zip(before, after))
        ok(shifted > 0.01,
           "the controls move with the question when it is recentred (%.0f cm)"
           % (shifted * 100))
        clear(pg.evaluate("NVRReviseVR.reviseBounds()"), ok, "after a recentre")

        # ---- 5. the keyboard, which grows upward towards the question
        wrote = pg.evaluate("""(() => {
          const R = NVRCore.revision, E = R.engine;
          const q = (E.bank || []).filter(x => x.type === 'written' && (x.marks || 0) <= 2)[0];
          if (!q) return null;
          R.current = q; R.confidence = null; NVRReviseVR.answer = '';
          NVRReviseVR.paint();
          return q.id; })()""")
        ok(bool(wrote), "there is a short written question to type into (%s)" % wrote)
        if wrote:
            pg.evaluate("""() => { const h = NVRReviseVR.qp.hits.find(x => x.id === 'kb');
              if (h && h.fn) h.fn(); }""")
            pg.wait_for_timeout(600)
            st = pg.evaluate(SHOWING)
            ok(st["keyboard"], "the keyboard opens for a short written answer")
            ok(not st["controls"],
               "and the control bar is put away rather than left underneath it")
            kbb = pg.evaluate("NVRReviseVR.reviseBounds()")
            show(kbb, "with the keyboard up:")
            clear(kbb, ok, "with the keyboard up")
            tgk = pg.evaluate(TARGETS)
            ok(tgk and "keyboard" in tgk["names"], "the keyboard can be pointed at")
            ok(tgk and "menu" in tgk["names"],
               "and the menu is still reachable while typing")

            # Every symbol showing is the tallest the keyboard gets, and it is
            # anchored by its top edge for exactly this reason.
            pg.evaluate("""() => { const h = NVRVR.kbPanel.hits.find(x => x.id === 'kmore');
              if (h && h.fn) h.fn(); }""")
            pg.wait_for_timeout(500)
            wide = pg.evaluate("NVRReviseVR.reviseBounds()")
            kb = [x for x in wide if x["name"] == "keyboard"]
            if kb:
                print("  with every symbol showing the keyboard spans %.1f to %.1f degrees"
                      % (kb[0]["pitch0"], kb[0]["pitch1"]))
            clear(wide, ok, "with every symbol showing")
            pg.evaluate("""() => { const h = NVRReviseVR.qp.hits.find(x => x.id === 'kb');
              if (h && h.fn) h.fn(); }""")
            pg.wait_for_timeout(500)

        # ---- 6. a long written answer is never only a headset keyboard
        long_q = pg.evaluate("""(() => {
          const R = NVRCore.revision, E = R.engine;
          const q = (E.bank || []).filter(x =>
            (x.type === 'written' || x.type === 'extended') && (x.marks || 0) >= 4)[0];
          if (!q) return null;
          R.current = q; NVRReviseVR.answer = '';
          NVRReviseVR.paint();
          return { id: q.id, marks: q.marks,
                   offered: NVRReviseVR.qp.hits.map(h => h.id) }; })()""")
        ok(bool(long_q), "there is a long written question in the bank")
        if long_q:
            offered = long_q["offered"]
            print("  a %d-mark written question offers: %s"
                  % (long_q["marks"], ", ".join(offered)))
            ok("paper" in offered,
               "it offers answering on paper instead of in the headset")
            ok("later" in offered, "it offers saving the question for a desktop")
            ok("inVR" in offered,
               "and it still allows typing it here for anyone who wants to")
            clear(pg.evaluate("NVRReviseVR.reviseBounds()"), ok,
                  "on a long written question")

        # ---- 7. one question at a time, across a topic change
        pg.evaluate("""() => { const h = NVRReviseVR.bar.hits.find(x => x.id === 'topics');
          if (h && h.fn) h.fn(); }""")
        pg.wait_for_timeout(600)
        after_topics = pg.evaluate("""(() => {
          const R = NVRReviseVR;
          const vis = [['question', R.qp.mesh.visible], ['controls', R.bar.mesh.visible]];
          return vis.filter(v => v[1]).map(v => v[0]); })()""")
        print("  showing while the topic list is open: %s"
              % (", ".join(after_topics) or "nothing"))
        pg.evaluate("() => { NVRReviseVR.ask(); }")
        pg.wait_for_timeout(700)
        st = pg.evaluate(SHOWING)
        ok(st["question"] and st["controls"],
           "a new question and its controls come back after a topic change")
        back = pg.evaluate("NVRReviseVR.reviseBounds()")
        clear(back, ok, "after a topic change")
        ok(len([x for x in back if x["name"] == "question"]) == 1,
           "there is exactly one question screen, not two")

        ok(not errs, "no script errors anywhere in that (%s)"
                     % (errs[0][:90] if errs else "none"))
        b.close()

    print()
    print("the question is clear, the controls stay put, and nobody is forced to "
          "write an essay in a headset" if not bad else "%d problem(s)" % bad)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
