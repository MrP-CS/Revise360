"""Does the headset's screen obviously look like the same interface?

The test the brief sets is a visual one, so this makes it possible to answer
honestly: for each lesson it captures the real Python window as the page draws
it, the headset's screen as js/pyscreen.js draws it, and the headset's screen
hanging in the 360 room, and stacks the first two one above the other at the
same width for comparison.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/sidebyside.py [lesson-id ...]

Writes build/parity/compare-<id>.png (page above, headset below) and
build/parity/room-<id>.png (the same screen in the room).
"""
import os, sys, base64, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

PORT = 8823
LESSONS = ["pr-l01", "pr-l03", "pr-l06", "pr-l10", "pr-l13"]


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


# Draw the headset's screen onto a plain canvas and hand back the PNG. This is
# the same code and the same state the headset paints, with no 3D in the way.
FLAT = r"""(() => {
  const S = window.R360PyScreen, V = NVRVR.vrCode;
  if (!S || !V) return null;
  const cv = document.createElement("canvas");
  const SS = 2;
  cv.width = S.W * SS; cv.height = S.H * SS;
  const c = cv.getContext("2d");
  c.setTransform(SS, 0, 0, SS, 0, 0);
  S.draw(c, NVRVR.state());            // the live state, drawn flat
  return cv.toDataURL("image/png");
})()"""


def stack(top_png, bottom_png, out, labels):
    a = Image.open(top_png).convert("RGB")
    b = Image.open(bottom_png).convert("RGB")
    w = max(a.width, b.width)
    a2 = a.resize((w, round(a.height * w / a.width)), Image.LANCZOS)
    b2 = b.resize((w, round(b.height * w / b.width)), Image.LANCZOS)
    gap, band = 14, 34
    img = Image.new("RGB", (w, a2.height + b2.height + gap + band * 2), (10, 16, 30))
    d = ImageDraw.Draw(img)
    d.text((12, 9), labels[0], fill=(255, 208, 70))
    img.paste(a2, (0, band))
    d.text((12, band + a2.height + gap + 9), labels[1], fill=(255, 208, 70))
    img.paste(b2, (0, band + a2.height + gap + band))
    img.save(out)


def main():
    ids = [a for a in sys.argv[1:] if not a.startswith("-")] or LESSONS
    outdir = OUT / "parity"; outdir.mkdir(parents=True, exist_ok=True)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
    base = f"http://127.0.0.1:{PORT}/"

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        for lid in ids:
            pg = b.new_page(viewport={"width": 1440, "height": 900})
            errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                      "\nwindow.__dev.installRuntime({ forceInstall: true });")
            pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
              JSON.stringify({ key: 'compare', name: 'Compare', cls: '11A', school: 'MCS' })); } catch (e) {}""")
            # the lesson lock: give the pupil the earlier lessons as finished
            pg.goto(base + "index.html"); pg.wait_for_timeout(200)
            pg.evaluate(r"""async (eid) => {
              const m = eid.match(/^([a-z]+)-l(\d+)$/); if (!m) return;
              const all = {};
              for (let i = 1; i < +m[2]; i++) {
                const id = m[1] + "-l" + String(i).padStart(2, "0");
                const r = await fetch("experiences/" + id + ".json"); if (!r.ok) continue;
                const exp = await r.json(), prog = { v: 1, scenes: {}, review: {}, info: [] };
                exp.scenes.forEach(sc => { const done = {};
                  sc.stations.forEach((_, k) => { done[k] = true; });
                  prog.scenes[sc.id] = { ans: {}, done }; });
                all[id] = prog;
              }
              localStorage.setItem("nvr:v1:p:compare", JSON.stringify(all));
            }""", lid)
            pg.goto(base + "experience.html?id=" + lid); pg.wait_for_timeout(1600)
            where = pg.evaluate("""(() => {
              const sc = NVRCore.exp.scenes[NVRCore.cur];
              for (let k = 0; k < sc.stations.length; k++)
                for (let i = 0; i < sc.stations[k].tasks.length; i++) {
                  const t = sc.stations[k].tasks[i];
                  if (t.t === 'code' && !['try','predict'].includes(t.kind || 'build') && t.teach) return [k, i];
                }
              return null; })()""")
            if not where:
                print(f"{lid}: no written code activity with a worked example"); pg.close(); continue

            # ---- the page
            pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
            pg.wait_for_selector(".pysrc", timeout=20000)
            pg.wait_for_function("() => { const b = document.querySelector('#pyrun');"
                                 " return b && !b.disabled; }", timeout=180000)
            pg.wait_for_timeout(400)
            a_png = str(outdir / f"page-{lid}.png")
            pg.locator("#box").screenshot(path=a_png)
            pg.evaluate("(() => { const b = document.querySelector('#box .head button'); if (b) b.click(); })()")
            pg.wait_for_timeout(300)

            # ---- the headset, same activity
            pg.click("#vrBtn"); pg.wait_for_timeout(1300)
            pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
            pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=180000)
            pg.wait_for_timeout(500)
            pg.screenshot(path=str(outdir / f"room-{lid}.png"))
            url = pg.evaluate(FLAT)
            if not url:
                print(f"{lid}: could not draw the headset screen flat"); pg.close(); continue
            b_png = str(outdir / f"vrflat-{lid}.png")
            open(b_png, "wb").write(base64.b64decode(url.split(",", 1)[1]))
            stack(a_png, b_png, str(outdir / f"compare-{lid}.png"),
                  [f"{lid}  station {where[0] + 1} activity {where[1] + 1}  —  THE PAGE",
                   "THE HEADSET'S SCREEN"])
            real = [e for e in errs if "WebGL" not in e][:2]
            print(f"  {lid}  station {where[0] + 1} activity {where[1] + 1}"
                  + (f"   page errors: {real}" if real else ""))
            pg.close()
        b.close()
    print("\ncompare-*.png in build/parity: the page above, the headset below")
    return 0


if __name__ == "__main__":
    sys.exit(main())
