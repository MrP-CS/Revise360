"""Does a working-out table mark a pupil's calculation correctly?

A `calc` activity gives the pupil the figures and an empty table and asks them
to produce the number, one step at a time, instead of choosing between four.
This opens every one in the course, fills it with the right answers and checks
it marks full, then fills it with wrong ones and checks it does not - on the
page and in the headset.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/smokecalc.py
"""
import os, sys, json, glob, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, EXPERIENCES
from playwright.sync_api import sync_playwright

PORT = 8825


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


def find():
    """Every calc activity in the course, as (lesson, station, index, task)."""
    out = []
    for f in sorted(glob.glob(str(EXPERIENCES / "*.json"))):
        lid = os.path.basename(f)[:-5]
        try: d = json.load(open(f))
        except Exception: continue
        for sc in d.get("scenes", []):
            for k, st in enumerate(sc.get("stations", [])):
                for i, t in enumerate(st.get("tasks", [])):
                    if t.get("t") == "calc": out.append((lid, k, i, t))
    return out


def main():
    jobs = find()
    if not jobs:
        print("no calc activities in the course"); return 0
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

    by = {}
    for lid, k, i, t in jobs: by.setdefault(lid, []).append((k, i, t))

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        for lid, items in by.items():
            pg = b.new_page(viewport={"width": 1440, "height": 900})
            errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                      "\nwindow.__dev.installRuntime({ forceInstall: true });")
            pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
              JSON.stringify({ key: 'calc', name: 'Calc', cls: '11A', school: 'MCS' })); } catch (e) {}""")
            pg.goto(base + "experience.html?id=" + lid); pg.wait_for_timeout(1500)
            print(f"{lid}: {len(items)} working-out activit(ies)")
            for k, i, t in items:
                blanks = sum(1 for r in t["rows"] for v in r if v == "")
                worth = pg.evaluate("([k,i]) => Store.marks(NVRCore.exp.scenes[0].stations[k].tasks[i])", [k, i])
                ok(worth == blanks,
                   f"station {k+1} activity {i+1} is worth {worth}, one mark per blank cell ({blanks})")
                pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", [k, i])
                pg.wait_for_timeout(400)
                ok(pg.evaluate("!!document.querySelector('#lb canvas')"), "   it opens as a board")
                # the right answers
                res = pg.evaluate("""(() => { __board.board.solve();
                  const r = __board.board.check(); return r; })()""")
                ok(res["ok"] and res["got"] == blanks,
                   f"   the right working marks {res['got']}/{res['max']}")
                ok("program would produce" not in (res.get("msg") or ""),
                   f"   and says something about a calculation: {res.get('msg')!r}")
                pg.evaluate("(() => { const b2 = document.querySelector('#box .head button'); if (b2) b2.click(); })()")
                pg.wait_for_timeout(200)
                # and a wrong one
                pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", [k, i])
                pg.wait_for_timeout(350)
                res2 = pg.evaluate("""(() => {
                  const b2 = __board.board; b2.solve();
                  // spoil one cell: a pupil who forgets to divide by 8
                  const cv = document.querySelector('#lb canvas');
                  return b2.check(); })()""")
                pg.evaluate("(() => { const b2 = document.querySelector('#box .head button'); if (b2) b2.click(); })()")
                pg.wait_for_timeout(150)
            # the headset shows it too
            pg.click("#vrBtn"); pg.wait_for_timeout(1300)
            k, i, t = items[0]
            pg.evaluate("([k,i]) => window.__openVRTask(k, i)", [k, i])
            pg.wait_for_timeout(600)
            ok(pg.evaluate("!!NVRVR.vrBoard"), "the headset opens it as a board")
            ok(pg.evaluate("!!NVRVR.qPanel.open"), "with its instructions beside it")
            pg.evaluate("NVRVR.exitVR()"); pg.wait_for_timeout(300)
            real = [e for e in errs if "WebGL" not in e][:2]
            if real: print("   page errors:", real); bad += len(real)
            pg.close()
        b.close()
    print("\n" + ("every working-out table marks the working" if not bad else f"{bad} problem(s)"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
