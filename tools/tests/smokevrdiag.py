"""Does a 2D diagram actually open, animate and step inside VR?

The web viewer owns a DOM element and its own loop, so in a headset the same
render() is driven by the frame hook onto a canvas texture on a plane. That is a
separate code path, and nothing else exercises it.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \\
    python3 tests/smokevrdiag.py nw-l13
"""
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

PORT = 8793
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Q, directory=SITE_S.rstrip('/')))
threading.Thread(target=srv.serve_forever, daemon=True).start()

js = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()

AIM = """([kind, a, b]) => {
  const core = NVRCore, V = THREE.Vector3, r = core.renderer, dev = window.__dev;
  let target;
  if (kind === 'sprite') { const s = core.sprites.filter(x => x.userData.type === a)[b];
                           if (!s) return 'nosprite'; target = s.getWorldPosition(new V()); }
  else { const p = NVRVR[a]; const h = p.hits.find(x => x.id === b);
         if (!h) return 'nohit ' + b + ' :: ' + p.hits.map(x => x.id).join(',');
         const u = (h.x + h.w / 2) / p.W, v = (h.y + h.h / 2) / p.canvas.height;
         target = p.mesh.localToWorld(new V(u - .5, .5 - v, 0)); }
  const head = r.xr.getCamera(core.cam).getWorldPosition(new V());
  const dir = target.clone().sub(head).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new V(0, 0, -1), dir);
  const c = dev.controllers.right;
  c.position.set(dev.position.x, dev.position.y, dev.position.z);
  c.quaternion.set(q.x, q.y, q.z, q.w);
  return 'ok';
}"""

def main(ids):
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
        pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3); window.__dev.installRuntime({ forceInstall: true });")
        # sign in by seeding the store, so the test needs no backend
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'diagvr', name: 'VR tester', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        base = f"http://127.0.0.1:{PORT}/"

        def click(kind, a, b2, wait=400):
            res = pg.evaluate(AIM, [kind, a, b2]); pg.wait_for_timeout(300)
            pg.evaluate("__dev.controllers.right.updateButtonValue('trigger',1)"); pg.wait_for_timeout(120)
            pg.evaluate("__dev.controllers.right.updateButtonValue('trigger',0)"); pg.wait_for_timeout(wait)
            return res

        for eid in ids:
            pg.goto(base + f"experience.html?id={eid}"); pg.wait_for_timeout(1600)
            pg.click("#vrBtn"); pg.wait_for_timeout(1500)
            if not pg.evaluate("NVRCore.renderer.xr.isPresenting"):
                print(f"{eid}: never entered VR"); bad += 1; continue
            n = pg.evaluate("NVRCore.sprites.filter(x => x.userData.type === 'diagram').length")
            print(f"{eid}: {n} diagram marker(s) in the scene")
            if not n:
                print(f"{eid}: no diagram to open"); bad += 1; continue
            print("  open:", click("sprite", "diagram", 0))
            st = pg.evaluate("""(() => {
              const v = NVRVR.vrDiag;
              if (!v) return { open: false };
              return { open: true, steps: v.dg.steps.length, step: v.step, playing: v.playing,
                       panel: NVRVR.diagPanel.open,
                       buttons: NVRVR.diagPanel.hits.map(h => h.id),
                       inScene: !!v.mesh.parent };
            })()""")
            print("  state:", st)
            if not st.get("open") or not st.get("panel") or not st.get("inScene"):
                print(f"{eid}: the diagram did not open in VR"); bad += 1; continue
            # the texture has to be getting painted, not left blank
            pg.wait_for_timeout(1200)
            ink = pg.evaluate("""(() => {
              const v = NVRVR.vrDiag, c = v.cx.canvas;
              const d = v.cx.getImageData(0, 0, c.width, c.height).data;
              let lit = 0;
              for (let i = 0; i < d.length; i += 64) if (d[i] + d[i+1] + d[i+2] > 150) lit++;
              return lit;
            })()""")
            print("  painted pixels (sampled):", ink)
            if ink < 200:
                print(f"{eid}: the diagram texture is blank"); bad += 1
            # stepping
            if "dnext" in st["buttons"]:
                before = pg.evaluate("NVRVR.vrDiag.step")
                click("panel", "diagPanel", "dnext")
                after = pg.evaluate("NVRVR.vrDiag.step")
                print(f"  step {before} -> {after}")
                if after == before: print(f"{eid}: Next did not move the step"); bad += 1
            else:
                print(f"{eid}: no Next button on the panel"); bad += 1
            # the windows must stay where they were put. Turning the head used to
            # bring them along, because each new question re-read the head pose.
            before = pg.evaluate("""(() => {
              const m = NVRVR.vrDiag.mesh.position, p = NVRVR.diagPanel.mesh.position;
              return [m.x, m.y, m.z, p.x, p.y, p.z].map(v => +v.toFixed(4));
            })()""")
            pg.evaluate("__dev.quaternion.set(0, Math.sin(0.6), 0, Math.cos(0.6))")
            pg.wait_for_timeout(700)
            click("panel", "diagPanel", "dnext")
            after = pg.evaluate("""(() => {
              const m = NVRVR.vrDiag.mesh.position, p = NVRVR.diagPanel.mesh.position;
              return [m.x, m.y, m.z, p.x, p.y, p.z].map(v => +v.toFixed(4));
            })()""")
            moved = max(abs(a - b2) for a, b2 in zip(before, after))
            print(f"  largest movement after turning the head and stepping: {moved:.4f}m")
            if moved > 0.01:
                print(f"{eid}: the windows followed the head"); bad += 1
            # and the panel sits below the picture, not beside it
            geom = pg.evaluate("""(() => {
              const m = NVRVR.vrDiag.mesh.position, p = NVRVR.diagPanel.mesh.position;
              return { dx: +(p.x - m.x).toFixed(3), dy: +(p.y - m.y).toFixed(3), dz: +(p.z - m.z).toFixed(3) };
            })()""")
            lateral = (geom["dx"] ** 2 + geom["dz"] ** 2) ** .5
            print(f"  panel offset from the picture: {geom['dy']:.2f}m down, {lateral:.2f}m sideways")
            if geom["dy"] > -0.2 or lateral > 0.35:
                print(f"{eid}: the panel is not stacked under the picture"); bad += 1
            pg.screenshot(path=os.environ.get("VR_SHOT", "vr_diagram.png"))
            click("panel", "diagPanel", "dclose")
            if pg.evaluate("!!NVRVR.vrDiag"): print(f"{eid}: close left it open"); bad += 1
        # ---- a board station: this is the path where each new question used to
        # re-read the head pose, so the board and its question walked round with
        # the viewer. Turning the head between questions must change nothing.
        for eid in (os.environ.get("VR_BOARD") or "bl-l01").split(","):
            pg.goto(base + f"experience.html?id={eid}"); pg.wait_for_timeout(1600)
            pg.click("#vrBtn"); pg.wait_for_timeout(1500)
            opened = None
            for k in range(6):
                click("sprite", "st", k)
                if pg.evaluate("!!NVRVR.vrBoard"): opened = k; break
                if pg.evaluate("NVRVR.qPanel.open"): click("panel", "qPanel", "__close")
            if opened is None:
                print(f"{eid}: found no board station to test"); bad += 1; continue
            print(f"{eid}: board station {opened}")
            pos0 = pg.evaluate("""(() => {
              const b = NVRVR.vrBoard.mesh.position, q = NVRVR.qPanel.mesh.position;
              return [b.x, b.y, b.z, q.x, q.y, q.z].map(v => +v.toFixed(4));
            })()""")
            off = pg.evaluate("""(() => {
              const b = NVRVR.vrBoard.mesh.position, q = NVRVR.qPanel.mesh.position;
              return { dy: +(q.y - b.y).toFixed(3),
                       lat: +Math.hypot(q.x - b.x, q.z - b.z).toFixed(3) };
            })()""")
            print(f"  question sits {off['dy']:.2f}m below the board, {off['lat']:.2f}m sideways")
            if off["dy"] > -0.2 or off["lat"] > 0.4:
                print(f"{eid}: the question is not stacked under the board"); bad += 1
            # turn a long way, then answer so the next question is set up
            pg.evaluate("__dev.quaternion.set(0, Math.sin(0.75), 0, Math.cos(0.75))")
            pg.wait_for_timeout(700)
            ids = pg.evaluate("NVRVR.qPanel.hits.map(h => h.id)")
            tgt = ([i for i in ids if i == "next"] + [i for i in ids if i.startswith("o")]
                   + [i for i in ids if i == "check"])
            if tgt: click("panel", "qPanel", tgt[0], wait=700)
            if pg.evaluate("!!NVRVR.vrBoard"):
                pos1 = pg.evaluate("""(() => {
                  const b = NVRVR.vrBoard.mesh.position, q = NVRVR.qPanel.mesh.position;
                  return [b.x, b.y, b.z, q.x, q.y, q.z].map(v => +v.toFixed(4));
                })()""")
                moved = max(abs(a - b2) for a, b2 in zip(pos0, pos1))
                print(f"  largest movement after turning the head and answering: {moved:.4f}m")
                if moved > 0.01:
                    print(f"{eid}: the board or its question followed the head"); bad += 1
            else:
                print("  (the station closed after that answer, so nothing to re-check)")
            pg.screenshot(path=os.environ.get("VR_BOARD_SHOT", "vr_board.png"))

            # Walking the UI does not necessarily reach the code that re-places a
            # panel, so the contract is tested directly: turn the head, place the
            # panel again, and it must land in exactly the same spot.
            if pg.evaluate("!!NVRVR.vrBoard"):
                p0 = pg.evaluate("NVRVR.qPanel.mesh.position.toArray().map(v => +v.toFixed(4))")
                pg.evaluate("__dev.quaternion.set(0, Math.sin(1.2), 0, Math.cos(1.2))")
                pg.wait_for_timeout(600)
                pg.evaluate("NVRVR.atAnchor(NVRVR.qPanel.mesh, 1.55, -24)")
                p1 = pg.evaluate("NVRVR.qPanel.mesh.position.toArray().map(v => +v.toFixed(4))")
                drift = max(abs(a - b2) for a, b2 in zip(p0, p1))
                print(f"  re-placing the panel after a 137 degree turn moved it {drift:.4f}m")
                if drift > 0.01:
                    print(f"{eid}: placement still follows the head"); bad += 1

        real = [e for e in errs if "WebGL" not in e and "deprecat" not in e.lower()]
        if real: print("page errors:", real[:5]); bad += len(real)
        b.close()
    print("\n" + ("VR diagrams OK" if not bad else f"{bad} problem(s)"))
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or ["nw-l13"]))
