"""What happens when Python does not arrive?

The headset showed "Starting Python..." and never changed. That was not the
download being slow; it was that a load which never finished had no end, no
error and no way to try again, on either the screen or the headset.

So this breaks it on purpose - the runtime is blocked at the network - and
checks that a pupil is told, is offered a way back, and that the way back works
once the network does. Then it does the same inside an immersive session.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/smokepyfail.py
"""
import os, sys, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
from playwright.sync_api import sync_playwright

PORT = 8803


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

        # ------------------------------------------------ the runtime, broken
        print("with vendor/pyodide blocked at the network")
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
        blocked = {"on": True}
        pg.route("**/vendor/pyodide/**",
                 lambda r: r.abort() if blocked["on"] else r.continue_())
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'pyfail', name: 'Py fail', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        pg.goto(base + "experience.html?id=pr-l01"); pg.wait_for_timeout(1500)
        where = pg.evaluate("""(() => {
          const sc = NVRCore.exp.scenes[NVRCore.cur];
          for (let k = 0; k < sc.stations.length; k++)
            for (let i = 0; i < sc.stations[k].tasks.length; i++) {
              const t = sc.stations[k].tasks[i];
              if (t.t === 'code' && !['try','predict'].includes(t.kind || 'build')) return [k, i];
            }
          return null; })()""")
        pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
        # the failure has to arrive on its own, without anyone pressing anything
        pg.wait_for_function("() => R360Py.state === 'error'", timeout=90000)
        ok(True, "the runtime reaches the error state by itself, with nothing pressed")
        pg.wait_for_timeout(400)
        shown = pg.evaluate("(document.querySelector('#pyout')||{}).textContent || ''")
        ok("Python" in shown and len(shown) > 40,
           "the pupil is told, where the output goes: " + repr(shown.strip()[:70]))
        ok(pg.evaluate("!!document.querySelector('#pyretry')"),
           "there is a button to try again")
        ok(pg.evaluate("!document.querySelector('#pyhint') || !document.querySelector('#pyhint').disabled"),
           "the hint is still available while Python is not")
        ok(pg.evaluate("!document.querySelector('#pyhelp').disabled"),
           "asking the teacher is still available")
        ok(pg.evaluate("document.querySelector('#pyrun').disabled"),
           "Run is held back, because there is nothing to run it with")
        # the fault that started all this: a failed load must not be remembered
        # as a good one, or every question after it skips loading entirely
        ok(pg.evaluate("R360Py.status.error && R360Py.status.state === 'error'"),
           "the failure is reported rather than cached as a success")
        r2 = pg.evaluate("() => R360Py.run('print(1)').then(r => r.noRuntime === true)")
        ok(r2, "running a program says the runtime is missing, not that the program is wrong")

        # "Python didn't work" is not something a teacher can act on, so there
        # is a code - and nothing in it may be about the pupil.
        d = pg.evaluate("R360Py.diagnostic()")
        ok(bool(d.get("code")) and d["code"].startswith("PY-"),
           "there is a code to report: " + str(d.get("code")))
        ok(d.get("category") not in ("none", "ok", None),
           "and it names the kind of failure: " + str(d.get("category")))
        shown = pg.evaluate("(document.querySelector('#pyout')||{}).textContent || ''")
        ok(d["code"] in shown, "the code is on the screen where it can be read out")
        blob = (str(d) + pg.evaluate("JSON.stringify(R360Py.history())")).lower()
        for private in ("py fail", "pyfail", "print(", "/home/", "mozilla/"):
            ok(private not in blob,
               f"nothing in the report is about the pupil or this machine ({private})")
        ok(len(pg.evaluate("R360Py.history()")) >= 1,
           "and it is kept on the device for a teacher to find later")
        labels = pg.evaluate("[...document.querySelectorAll('#mrow button')].map(b => b.textContent)")
        ok(len(labels) >= 3, f"the pupil is given something to do: {labels}")

        # ------------------------------------------------ and the way back
        print("with the network restored and the pupil pressing the button")
        blocked["on"] = False
        pg.evaluate("document.querySelector('#pyretry').click()")
        pg.wait_for_function("() => R360Py.state === 'ready'", timeout=180000)
        ok(True, "the retry loads the runtime from nothing and it comes up")
        pg.evaluate("document.querySelector('#pyrun').click()")
        pg.wait_for_function("() => !document.querySelector('#pyrun').disabled", timeout=60000)
        out = pg.evaluate("document.querySelector('#pyout').textContent")
        ok("Line one" in out or out.strip() != "",
           "and the program runs: " + repr(out.strip()[:50]))
        pg.close()

        # ------------------------------------------------ the same, in a headset
        print("the same, inside an immersive session")
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
        blocked2 = {"on": True}
        pg.route("**/vendor/pyodide/**",
                 lambda r: r.abort() if blocked2["on"] else r.continue_())
        pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                  "\nwindow.__dev.installRuntime({ forceInstall: true });")
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'pyfail', name: 'Py fail', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        pg.goto(base + "experience.html?id=pr-l01"); pg.wait_for_timeout(1500)
        pg.click("#vrBtn"); pg.wait_for_timeout(1400)
        ok(pg.evaluate("NVRCore.renderer.xr.isPresenting"), "the session opened")
        pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
        pg.wait_for_function("() => R360Py.state === 'error'", timeout=90000)
        pg.wait_for_timeout(500)
        st = pg.evaluate("""(() => { const v = NVRVR.vrCode; if (!v) return null;
          return { state: v.state, result: v.result, busy: v.busy,
                   keys: NVRVR.kbPanel.hits.map(h => h.id) }; })()""")
        ok(st is not None, "the code panel is still there")
        if st:
            said = (st.get("state") or "") + " " + (st.get("result") or "")
            ok("Python" in said,
               "the headset says the runtime did not start: " + repr(said.strip()[:70]))
            ok(any("retry" in i or "again" in i for i in st["keys"]),
               "and offers a key to try again")
        blocked2["on"] = False
        hit = pg.evaluate("""(() => { const h = NVRVR.kbPanel.hits.find(x => /retry|again/.test(x.id));
          if (!h) return false; h.fn(); return true; })()""")
        if hit:
            pg.wait_for_function("() => R360Py.state === 'ready'", timeout=180000)
            ok(True, "and the retry works in the headset too")
            ok(pg.evaluate("!!NVRVR.vrCode && NVRVR.vrCode.text.length > 0"),
               "with the pupil's program still in front of them")
        pg.close(); b.close()

    print("\n" + ("a failed runtime is said, and can be tried again" if not bad
                  else f"{bad} problem(s)"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
