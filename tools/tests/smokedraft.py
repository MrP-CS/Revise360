"""Does a half-written program survive, and follow the pupil between the two?

Typing a program by pointing at keys takes minutes. The standard this is
checking is the one at the end of the brief: a pupil may start a Python lesson
on a computer, continue it inside a headset, leave VR and continue again on a
computer without losing work.

So: type on the screen, close, reopen, check. Then enter VR and check the same
characters are there. Then change it in the headset, leave VR, and check the
computer has the change. Then reload the page entirely. Then change the
question's starter and check the stale draft is dropped rather than handed back
as an answer to a question nobody is asking any more.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/smokedraft.py
"""
import os, sys, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
from playwright.sync_api import sync_playwright

PORT = 8805
MINE = "# mine\nprint('typed on the computer')\n"
HEADSET = "print('typed in the headset')\n"


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
    base = f"http://127.0.0.1:{PORT}/"
    bad = 0

    def ok(cond, said):
        nonlocal bad
        print(("  ok  " if cond else "  FAIL ") + said)
        if not cond: bad += 1

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
        pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                  "\nwindow.__dev.installRuntime({ forceInstall: true });")
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'drafts', name: 'Draft keeper', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        pg.goto(base + "experience.html?id=pr-l01"); pg.wait_for_timeout(1600)
        where = pg.evaluate("""(() => {
          const sc = NVRCore.exp.scenes[NVRCore.cur];
          for (let k = 0; k < sc.stations.length; k++)
            for (let i = 0; i < sc.stations[k].tasks.length; i++) {
              const t = sc.stations[k].tasks[i];
              if (t.t === 'code' && !['try','predict'].includes(t.kind || 'build')) return [k, i];
            }
          return null; })()""")
        print("the question:", where)

        # ---- typed on the computer
        pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
        pg.wait_for_selector(".pysrc", timeout=20000)
        pg.evaluate("t => { const e = document.querySelector('.pysrc'); e.value = t;"
                    " e.dispatchEvent(new Event('input')); }", MINE)
        pg.wait_for_timeout(900)
        pg.evaluate("document.querySelector('#modal .head button, #box .head button').click()")
        pg.wait_for_timeout(400)
        pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
        pg.wait_for_selector(".pysrc", timeout=20000)
        ok(pg.evaluate("document.querySelector('.pysrc').value") == MINE,
           "closing and reopening the question gives the program back")

        # ---- and the headset sees the same one
        pg.evaluate("document.querySelector('#modal .head button, #box .head button').click()")
        pg.wait_for_timeout(300)
        pg.click("#vrBtn"); pg.wait_for_timeout(1400)
        ok(pg.evaluate("NVRCore.renderer.xr.isPresenting"), "the session opened")
        pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
        pg.wait_for_timeout(900)
        ok(pg.evaluate("NVRVR.vrCode && NVRVR.vrCode.text") == MINE,
           "the headset opens the program that was typed on the computer")

        # ---- changed in the headset, and the computer has the change
        pg.evaluate("t => { NVRVR.vrCode.text = t; NVRVR.vrCode.caret = t.length; }", HEADSET)
        pg.evaluate("NVRVR.typeKey('Space')")       # one real key press, to save it
        pg.wait_for_timeout(900)
        pg.evaluate("NVRVR.closeCodeVR()"); pg.wait_for_timeout(300)
        pg.evaluate("NVRVR.exitVR()"); pg.wait_for_timeout(800)
        pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
        pg.wait_for_selector(".pysrc", timeout=20000)
        got = pg.evaluate("document.querySelector('.pysrc').value")
        ok(got.startswith(HEADSET.rstrip("\n")),
           f"leaving VR, the computer has what was typed in the headset: {got.strip()[:44]!r}")

        # ---- and it survives the page going away entirely
        pg.evaluate("document.querySelector('#modal .head button, #box .head button').click()")
        pg.wait_for_timeout(500)
        pg.reload(); pg.wait_for_timeout(1800)
        pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
        pg.wait_for_selector(".pysrc", timeout=20000)
        ok(pg.evaluate("document.querySelector('.pysrc').value").startswith(HEADSET.rstrip("\n")),
           "and after a full reload")

        # ---- a draft for a question that has changed is dropped, not handed back
        stale = pg.evaluate("""([k, i]) => {
          const sc = NVRCore.exp.scenes[NVRCore.cur], task = sc.stations[k].tasks[i];
          const was = NVRCore.getDraft(k, i, task);
          // the same question with a different starter is a different question
          const changed = Object.assign({}, task, { starter: task.starter + "\\n# changed\\n" });
          return { was: was, now: NVRCore.getDraft(k, i, changed) }; }""", where)
        ok(stale["was"] is not None, "the draft is there for the question it was written for")
        ok(stale["now"] is None, "and is not offered for a question whose starter has changed")

        # ---- there is no second store
        # VR is another client of the same progress model, so nothing may appear
        # beside it. Anything outside the keys Store itself writes is a second
        # store by definition, whatever it is called.
        extra = pg.evaluate("""(() => {
          const s = JSON.parse(localStorage.getItem('nvr:v1:student') || '{}');
          const known = ['nvr:v1:student', 'nvr:v1:roster', 'nvr:v1:queue', 'nvr:v1:p:' + s.key];
          return Object.keys(localStorage).filter(k => known.indexOf(k) < 0); })()""")
        ok(not extra, f"VR wrote nothing outside the one progress store ({extra})")
        # and the draft is inside that store, with the answers, not beside it
        inside = pg.evaluate("""(() => {
          const s = JSON.parse(localStorage.getItem('nvr:v1:student') || '{}');
          const all = JSON.parse(localStorage.getItem('nvr:v1:p:' + s.key) || '{}');
          const sc = (all['pr-l01'] || {}).scenes || {};
          return Object.values(sc).some(x => x.drafts && Object.keys(x.drafts).length); })()""")
        ok(inside, "and the draft is kept inside it, with the answers")
        pg.close(); b.close()

    print("\n" + ("a program follows the pupil between the screen and the headset" if not bad
                  else f"{bad} problem(s)"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
