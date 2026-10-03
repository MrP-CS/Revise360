"""Nothing covers the programming monitor, and the menu can always be pressed.

Six defects, each of which was real, and each of which this fails on:

  * an opaque panel over the monitor or across the top of the keyboard;
  * the monitor, the keyboard and the menu overlapping where a pupil sits;
  * the menu button drifting with the head instead of staying put;
  * the menu left out of the raycast while the Python workspace is open;
  * a station badge behind the monitor still being selectable;
  * either of them coming loose from the workspace on a recentre.

The geometry is not worked out again here. js/vr.js reports it, through
NVRVR.workspaceBounds(), so this cannot drift from the layout it is checking -
and because it reads the layout rather than a screenshot, it catches an overlap
that happens to look fine from one viewing position.

Every surface in the workspace is drawn with depthTest off, which means what is
in front is decided by renderOrder and nothing else. So "they do not overlap"
is not a nicety: it is the only reason a ray can reach the right one.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/smokevrbounds.py
"""
import os, sys, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
from playwright.sync_api import sync_playwright

PORT = 8819
GAP = 2.0          # degrees of clear air required between any two surfaces


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


# Everything drawn in front of the scene while the workspace is open, with what
# decides whether it covers something else: renderOrder, because depthTest is
# off. A mesh that is dark, nearly opaque and ordered above the keyboard is the
# defect this exists for.
DRAWN = r"""(() => {
  const V = NVRVR.vrCode, out = [];
  NVRVR.scene.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    const m = o.material; if (!m) return;
    const bb = new THREE.Box3().setFromObject(o);
    out.push({
      pyscreen: !!o.userData.pyscreen,
      panel: !!o.userData.panel,
      order: o.renderOrder,
      opacity: m.transparent ? m.opacity : 1,
      hasMap: !!m.map,
      colour: m.color ? m.color.getHex() : null,
      w: +(bb.max.x - bb.min.x).toFixed(3), h: +(bb.max.y - bb.min.y).toFixed(3),
      depthTest: !!m.depthTest,
    });
  });
  return out;
})()"""


def overlap(a, b):
    """Do two angular rectangles share any air, allowing for the required gap?"""
    def seg(lo1, hi1, lo2, hi2):
        return min(hi1, hi2) - max(lo1, lo2) > -GAP
    return (seg(a["yaw0"], a["yaw1"], b["yaw0"], b["yaw1"])
            and seg(a["pitch0"], a["pitch1"], b["pitch0"], b["pitch1"]))


def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
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
          JSON.stringify({ key: 'bounds', name: 'Bounds', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        pg.goto(f"http://127.0.0.1:{PORT}/experience.html?id=pr-l01"); pg.wait_for_timeout(1600)
        pg.click("#vrBtn"); pg.wait_for_timeout(1400)
        where = pg.evaluate("""(() => {
          const sc = NVRCore.exp.scenes[NVRCore.cur];
          for (let k = 0; k < sc.stations.length; k++)
            for (let i = 0; i < sc.stations[k].tasks.length; i++) {
              const t = sc.stations[k].tasks[i];
              if (t.t === 'code' && !['try','predict'].includes(t.kind || 'build')) return [k, i];
            }
          return null; })()""")
        pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
        pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=120000)

        # ---- 1. nothing dark and opaque is drawn over the workspace
        drawn = pg.evaluate(DRAWN)
        workspace = [d for d in drawn if d["pyscreen"] or d["panel"]]
        blockers = [d for d in drawn
                    if not d["pyscreen"] and not d["panel"] and not d["hasMap"]
                    and d["opacity"] > 0.25 and d["w"] > 0.5 and d["h"] > 0.5]
        print("drawn in front of the scene while coding:")
        for d in sorted(drawn, key=lambda x: -x["order"])[:8]:
            what = ("screen" if d["pyscreen"] else "panel" if d["panel"]
                    else "mesh" if d["hasMap"] else "untextured mesh")
            print(f"  order {d['order']:>3}  {what:<16} {d['w']:>5} x {d['h']:<5} m  "
                  f"opacity {d['opacity']}")
        ok(not blockers,
           f"no untextured panel is drawn over the workspace ({len(blockers)} found)")

        # ---- 2. the monitor, the keyboard and the menu cannot overlap
        bounds = pg.evaluate("NVRVR.workspaceBounds()")
        by = {x["name"]: x for x in bounds}
        print("where each surface sits, in degrees from the anchor:")
        for s in bounds:
            print(f"  {s['name']:<9} yaw {s['yaw0']:>6.1f} to {s['yaw1']:<6.1f}  "
                  f"pitch {s['pitch0']:>6.1f} to {s['pitch1']:<6.1f}")
        names = [s["name"] for s in bounds]
        ok(set(names) >= {"monitor", "keyboard", "menu"},
           f"the workspace reports all three of its surfaces ({', '.join(names)})")
        for i in range(len(bounds)):
            for j in range(i + 1, len(bounds)):
                a, c = bounds[i], bounds[j]
                ok(not overlap(a, c),
                   f"{a['name']} and {c['name']} have at least {GAP}° of clear air between them")

        # ---- 3. the menu is selectable while the workspace is open
        tg = pg.evaluate("""(() => {
          const t = NVRVR.targets ? NVRVR.targets() : null;
          return { has: !!t, names: t ? t.panels.map(m =>
            m.userData.pyscreen ? 'screen' :
            m.userData.panel === NVRVR.kbPanel ? 'keyboard' :
            m.userData.panel === NVRVR.menuBtn ? 'menu' :
            m.userData.panel === NVRVR.menuPanel ? 'menuPanel' : 'other') : [],
            sprites: t ? t.sprites.length : -1 }; })()""")
        ok(tg["has"], "the workspace reports what can be pointed at")
        ok("menu" in tg["names"],
           f"the menu button can be pointed at while coding ({', '.join(tg['names'])})")
        ok("screen" in tg["names"], "the monitor's own controls can be pointed at")
        ok("keyboard" in tg["names"], "the keyboard can be pointed at")
        ok(tg["sprites"] == 0,
           f"no station badge behind the monitor is selectable ({tg['sprites']} offered)")

        # ---- 4. the menu does not drift with the head, and recentres with the rest
        # A gaze-following button is caught by moving the head and comparing
        # where the button was BEFORE with where it is after - not by sampling
        # twice afterwards, which is still only measuring a stationary head.
        start = pg.evaluate("NVRVR.menuBtn.mesh.position.toArray()")
        pg.evaluate("""(() => { const d = window.__dev;
          d.position.set(0.4, 1.7, 0.3);
          if (d.quaternion && d.quaternion.set) {
            const h = 0.55, s = Math.sin(h), c = Math.cos(h);
            d.quaternion.set(0, s, 0, c);
          }
        })()""")
        pg.wait_for_timeout(900)
        after_turn = pg.evaluate("NVRVR.menuBtn.mesh.position.toArray()")
        drift = max(abs(x - y) for x, y in zip(start, after_turn))
        ok(drift < 0.01,
           f"the menu button stays put while the head moves and turns ({drift * 100:.1f} cm)")

        before = pg.evaluate("NVRVR.menuBtn.mesh.position.toArray()")
        pg.evaluate("() => NVRVR.recentre()")
        pg.wait_for_timeout(400)
        after = pg.evaluate("""(() => {
          const t = NVRVR.workspaceBounds();
          return { menu: NVRVR.menuBtn.mesh.position.toArray(), bounds: t }; })()""")
        shifted = max(abs(x - y) for x, y in zip(before, after["menu"]))
        ok(shifted > 0.01,
           f"the menu button moves with the workspace when it is recentred ({shifted * 100:.0f} cm)")
        bb = after["bounds"]
        clean = all(not overlap(bb[i], bb[j])
                    for i in range(len(bb)) for j in range(i + 1, len(bb)))
        ok(clean, "the three surfaces still do not overlap after a recentre")

        tg2 = pg.evaluate("""(() => { const t = NVRVR.targets();
          return t.panels.some(m => m.userData.panel === NVRVR.menuBtn); })()""")
        ok(tg2, "the menu button is still selectable after a recentre")

        # ---- 5. and with every symbol showing, which is the tallest it gets
        # "More symbols" adds three rows and a number row. The keyboard is
        # anchored at its middle, so it grows upward as well as down - towards
        # the screen. The clearance has to hold in that state too, and it is the
        # state nobody looks at.
        pg.evaluate("""() => { const h = NVRVR.kbPanel.hits.find(x => x.id === 'kmore');
          if (h && h.fn) h.fn(); }""")
        pg.wait_for_timeout(400)
        wide = pg.evaluate("NVRVR.workspaceBounds()")
        kb = [x for x in wide if x["name"] == "keyboard"]
        ok(bool(kb), "the keyboard is still there with every symbol showing")
        if kb:
            print(f"  with every symbol showing the keyboard spans "
                  f"{kb[0]['pitch0']:.1f} to {kb[0]['pitch1']:.1f} degrees")
        for i in range(len(wide)):
            for j in range(i + 1, len(wide)):
                a, c = wide[i], wide[j]
                ok(not overlap(a, c),
                   f"{a['name']} and {c['name']} stay clear with every symbol showing")
        b.close()

    print()
    print("the monitor is clear, and the menu is always there" if not bad
          else f"{bad} problem(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
