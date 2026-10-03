"""What does the normal Python screen actually measure?

The onscreen interface is the design authority for the headset's virtual
monitor, and the way to build from it is to measure it rather than to read the
stylesheet and guess how it resolves. This opens a real Python activity in a
browser and reports the box of every region, as a fraction of the window it is
drawn in, so the headset can lay the same thing out at any size.

  R360_THREE=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/measurescreen.py [lesson-id] > build/parity/screen-layout.json
"""
import os, sys, json, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT
from playwright.sync_api import sync_playwright

PORT = 8819


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


MEASURE = r"""(() => {
  const box = document.querySelector("#box");
  const B = box.getBoundingClientRect();
  const of = sel => {
    const e = document.querySelector(sel); if (!e) return null;
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return { x: +((r.x - B.x) / B.width).toFixed(4), y: +((r.y - B.y) / B.height).toFixed(4),
             w: +(r.width / B.width).toFixed(4), h: +(r.height / B.height).toFixed(4),
             px: { x: Math.round(r.x - B.x), y: Math.round(r.y - B.y),
                   w: Math.round(r.width), h: Math.round(r.height) },
             font: cs.fontSize, weight: cs.fontWeight, family: cs.fontFamily.split(",")[0],
             colour: cs.color, bg: cs.backgroundColor, border: cs.borderColor,
             radius: cs.borderTopLeftRadius, pad: cs.padding };
  };
  const all = sel => [...document.querySelectorAll(sel)].map(e => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return { text: e.textContent.trim().slice(0, 40),
             px: { x: Math.round(r.x - B.x), y: Math.round(r.y - B.y),
                   w: Math.round(r.width), h: Math.round(r.height) },
             font: cs.fontSize, colour: cs.color };
  });
  return {
    window: { w: innerWidth, h: innerHeight },
    box: { w: Math.round(B.width), h: Math.round(B.height),
           bg: getComputedStyle(box).backgroundColor,
           border: getComputedStyle(box).borderColor,
           radius: getComputedStyle(box).borderTopLeftRadius },
    regions: {
      head:      of("#box .head"),
      wrap:      of(".codewrap"),
      left:      of(".codewrap > .pyside"),
      leftScroll:of(".pyscroll"),
      right:     of(".codewrap > .pystage"),
      stageHead: of(".pystage-head"),
      chip:      of(".pychip"),
      task:      of(".pytask"),
      taskHead:  of(".pytaskhead h3"),
      steps:     of(".pysteps"),
      brief:     of(".pybrief"),
      teach:     of(".pyteach"),
      teachEg:   of(".pyteach .pyeg"),
      result:    of(".pyresult"),
      editor:    of("#pyed"),
      gutter:    of(".pygut"),
      source:    of(".pysrc"),
      ideBar:    of(".pyidebar"),
      runEg:     of(".pyrun"),
      outHead:   of(".pyouth"),
      out:       of(".pyout"),
      act:       of(".pyact")
    },
    buttons: all(".pyidebar button, .pyact button, .pytaskhead button, #box .head button"),
    headings: all(".pytaskhead h3, .pyouth, .pyrunh, .pyteach h4"),
    keyline:   all(".pykeys")[0] || null
  };
})()"""


def main():
    lid = (sys.argv[1:] or ["pr-l01"])[0]
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    base = f"http://127.0.0.1:{PORT}/"
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'measure', name: 'Measure', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        pg.goto(base + "experience.html?id=" + lid); pg.wait_for_timeout(1500)
        where = pg.evaluate("""(() => {
          const sc = NVRCore.exp.scenes[NVRCore.cur];
          for (let k = 0; k < sc.stations.length; k++)
            for (let i = 0; i < sc.stations[k].tasks.length; i++) {
              const t = sc.stations[k].tasks[i];
              if (t.t === 'code' && !['try','predict'].includes(t.kind || 'build')) return [k, i];
            }
          return null; })()""")
        pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
        pg.wait_for_selector(".pysrc", timeout=20000); pg.wait_for_timeout(500)
        out = pg.evaluate(MEASURE)
        out["lesson"] = lid; out["at"] = where
        b.close()
    (OUT / "parity").mkdir(parents=True, exist_ok=True)
    (OUT / "parity" / f"screen-layout-{lid}.json").write_text(json.dumps(out, indent=1))
    print(json.dumps(out, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
