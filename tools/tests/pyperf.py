"""How long does a pupil wait, and for what?

Two numbers, measured rather than claimed:

  page load          -> Python ready
  choosing a question -> an editor that can be typed in

on the page and inside an immersive session, with and without the pre-warm, and
again with the network slowed to something like a school's.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/pyperf.py

This is a build machine serving over loopback. It establishes what the code
costs, not what a Quest on school WiFi costs - docs/VR-HEADSET-QA.md has the
line for the number only a headset can give.
"""
import os, sys, time, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
from playwright.sync_api import sync_playwright

PORT = 8815


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
    rows = []

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])

        def run(label, vr, warm, slow_kbps=None):
            pg = b.new_page(viewport={"width": 1280, "height": 720})
            pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            if vr:
                pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                          "\nwindow.__dev.installRuntime({ forceInstall: true });")
            pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
              JSON.stringify({ key: 'perf', name: 'Perf', cls: '11A', school: 'MCS' })); } catch (e) {}""")
            if not warm:
                # the pre-warm off, to measure what it is worth
                pg.add_init_script("window.__noWarm = true;")
            if slow_kbps:
                # a crude throttle on the big one: delay it by its size at this rate
                def slow(route):
                    time.sleep(9598218 / 1024 / slow_kbps)
                    route.continue_()
                pg.route("**/pyodide.asm.wasm", slow)

            t0 = time.time()
            pg.goto(base + "experience.html?id=pr-l01")
            pg.wait_for_function("() => !!window.R360Py", timeout=30000)
            if vr:
                pg.click("#vrBtn"); pg.wait_for_timeout(1000)
            # page load -> Python ready
            pg.wait_for_function("() => R360Py.state === 'ready'", timeout=300000)
            ready = round((time.time() - t0) * 1000)

            where = pg.evaluate("""(() => {
              const sc = NVRCore.exp.scenes[NVRCore.cur];
              for (let k = 0; k < sc.stations.length; k++)
                for (let i = 0; i < sc.stations[k].tasks.length; i++)
                  if (sc.stations[k].tasks[i].t === 'code') return [k, i];
              return null; })()""")
            # choosing a question -> an editor that can be typed in
            t1 = time.time()
            if vr:
                pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
                pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=120000)
            else:
                pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
                pg.wait_for_function("() => { const b = document.querySelector('#pyrun');"
                                     " return b && !b.disabled; }", timeout=120000)
            usable = round((time.time() - t1) * 1000)
            mem = pg.evaluate("performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null")
            # opening and closing a question repeatedly must not pile things up
            for _ in range(6):
                if vr:
                    pg.evaluate("NVRVR.closeCodeVR()")
                    pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
                else:
                    pg.evaluate("(() => { const b = document.querySelector('#box .head button'); if (b) b.click(); })()")
                    pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
                pg.wait_for_timeout(180)
            mem2 = pg.evaluate("performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null")
            tex = pg.evaluate("NVRCore.renderer.info.memory.textures")
            rows.append((label, ready, usable, mem, mem2, tex))
            pg.close()

        run("screen, pre-warm on", False, True)
        run("screen, pre-warm off", False, False)
        run("headset, pre-warm on", True, True)
        run("headset, pre-warm off", True, False)
        run("headset, ~1 MB/s network", True, True, slow_kbps=1024)
        b.close()

    print(f"{'':<28}{'page -> ready':>14}{'question -> editor':>20}"
          f"{'heap':>8}{'after 7 opens':>15}{'textures':>10}")
    for label, ready, usable, mem, mem2, tex in rows:
        print(f"{label:<28}{ready:>11} ms{usable:>17} ms"
              f"{(str(mem) + ' MB') if mem else '-':>8}{(str(mem2) + ' MB') if mem2 else '-':>15}{tex:>10}")
    print("\nLoopback on a build machine, not a headset on school WiFi.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
