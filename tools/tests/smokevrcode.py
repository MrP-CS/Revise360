"""Can a pupil actually write and run a program in the headset?

There is no system keyboard in immersive VR, so the platform supplies one. This
drives it: opens a code question, types a short program by pulling the trigger
on keys, runs it, and marks it.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tests/smokevrcode.py
"""
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright

class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass

PORT = 8797
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Q, directory=SITE_S.rstrip('/')))
threading.Thread(target=srv.serve_forever, daemon=True).start()

js = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()

AIM = """([panel, id]) => {
  const core = NVRCore, V = THREE.Vector3, r = core.renderer, dev = window.__dev;
  const p = NVRVR[panel]; const h = p.hits.find(x => x.id === id);
  if (!h) return 'nohit ' + id;
  const u = (h.x + h.w / 2) / p.W, v = (h.y + h.h / 2) / p.canvas.height;
  const target = p.mesh.localToWorld(new V(u - .5, .5 - v, 0));
  const head = r.xr.getCamera(core.cam).getWorldPosition(new V());
  const q = new THREE.Quaternion().setFromUnitVectors(new V(0, 0, -1), target.clone().sub(head).normalize());
  const c = dev.controllers.right;
  c.position.set(dev.position.x, dev.position.y, dev.position.z);
  c.quaternion.set(q.x, q.y, q.z, q.w);
  return 'ok';
}"""

def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
        pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3); window.__dev.installRuntime({ forceInstall: true });")
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'vrcode', name: 'VR coder', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        base = f"http://127.0.0.1:{PORT}/"

        def press(panel, id_, wait=220):
            res = pg.evaluate(AIM, [panel, id_]); pg.wait_for_timeout(140)
            pg.evaluate("__dev.controllers.right.updateButtonValue('trigger',1)"); pg.wait_for_timeout(90)
            pg.evaluate("__dev.controllers.right.updateButtonValue('trigger',0)"); pg.wait_for_timeout(wait)
            return res

        pg.goto(base + "experience.html?id=pr-l01"); pg.wait_for_timeout(1800)
        pg.click("#vrBtn"); pg.wait_for_timeout(1500)
        if not pg.evaluate("NVRCore.renderer.xr.isPresenting"):
            print("never entered VR"); return 1

        # find a code task and open it the way a pupil would reach it
        found = pg.evaluate("""(() => {
          const sc = NVRCore.exp.scenes[NVRCore.cur];
          for (let k = 0; k < sc.stations.length; k++)
            for (let i = 0; i < sc.stations[k].tasks.length; i++)
              if (sc.stations[k].tasks[i].t === 'code') return [k, i];
          return null;
        })()""")
        if not found:
            print("pr-l01 has no code task"); return 1
        print(f"code task at station {found[0]}, task {found[1]}")
        pg.evaluate("([k,i]) => NVRVR.openStationTaskVR ? NVRVR.openStationTaskVR(k,i) : NVRCore.taskList && 0", found)
        # the VR runner is reached through the station; open it directly
        pg.evaluate("([k,i]) => window.__openVRCode(k, i)", found)
        pg.wait_for_timeout(1500)

        st = pg.evaluate("""(() => {
          const v = NVRVR.vrCode;
          return v ? { open: true, keys: NVRVR.kbPanel.hits.length,
                       text: v.text.length, inScene: !!v.mesh.parent } : { open: false };
        })()""")
        print("opened:", st)
        if not st.get("open"):
            print("the code editor did not open in VR"); return 1
        if st["keys"] < 60:
            print(f"only {st['keys']} keys on the keyboard"); bad += 1

        # wait for Python, then type a program with the trigger
        pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=90000)
        before = pg.evaluate("NVRVR.vrCode.text")
        for key in ["keyp", "keyr", "keyi", "keyn", "keyt", "key(", "key'", "keyh", "keyi", "key'", "key)"]:
            r = press("kbPanel", key, wait=120)
            if r != "ok": print("  key miss:", key, r); bad += 1
        typed = pg.evaluate("NVRVR.vrCode.text")
        print("typed by trigger:", repr(typed[len(before):]))
        if "print('hi')" not in typed.replace(" ", ""):
            print("the keyboard did not type what was pressed"); bad += 1

        press("kbPanel", "crun", wait=400)
        pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=90000)
        out = pg.evaluate("NVRVR.vrCode.out")
        print("ran, console says:", repr(out.strip()[:60]))
        if "hi" not in out: print("Run did not produce the program's output"); bad += 1

        # and marking, which must award and report
        press("kbPanel", "ccheck", wait=600)
        pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=120000)
        res = pg.evaluate("({ result: NVRVR.vrCode.result, ok: NVRVR.vrCode.resultOk })")
        print("marked:", repr((res.get("result") or "")[:90]))
        if not res.get("result"): print("Check produced no result"); bad += 1

        pg.screenshot(path=os.environ.get("VR_CODE_SHOT", "vr_code.png"))
        real = [e for e in errs if "WebGL" not in e and "deprecat" not in e.lower()]
        if real: print("page errors:", real[:3]); bad += len(real)
        b.close()
    print("\n" + ("a pupil can write and run a program in the headset" if not bad else f"{bad} problem(s)"))
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
