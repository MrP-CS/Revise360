import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8790), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
iwer=open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
AIM = """([kind, a, b]) => {
  const core = NVRCore, V = THREE.Vector3, r = core.renderer, dev = window.__dev;
  let target;
  if (kind === 'sprite') { const s = core.sprites.filter(x => x.userData.type === a)[b]; target = s.getWorldPosition(new V()); }
  else { const p = NVRVR[a]; const h = p.hits.find(x => x.id === b); if (!h) return 'nohit ' + b + ' ' + p.hits.map(x=>x.id).join(',');
    const u = (h.x + h.w/2) / p.W, v = (h.y + h.h/2) / p.canvas.height; target = p.mesh.localToWorld(new V(u - .5, .5 - v, 0)); }
  const head = r.xr.getCamera(core.cam).getWorldPosition(new V());
  const dir = target.clone().sub(head).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new V(0,0,-1), dir);
  const c = dev.controllers.right; c.position.set(dev.position.x, dev.position.y, dev.position.z); c.quaternion.set(q.x, q.y, q.z, q.w);
  return 'ok';
}"""
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]); pg=b.new_page(viewport={"width":1280,"height":720})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type in ("error","warning") and errs.append(m.text[:200]))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3); window.__dev.installRuntime({ forceInstall: true });")
    base="http://127.0.0.1:8790/"
    pg.goto(base); pg.fill("#n","24vrtest"); pg.select_option("#c","MCS 11A"); pg.fill("#p","4321"); pg.click("button[type=submit]"); pg.wait_for_selector(".topic")
    print("hub vr note visible:", pg.locator("#vrnote").is_visible())
    def click(kind,a,b2, wait=250):
        res = pg.evaluate(AIM, [kind,a,b2]); pg.wait_for_timeout(350)
        pg.evaluate("__dev.controllers.right.updateButtonValue('trigger',1)"); pg.wait_for_timeout(120)
        pg.evaluate("__dev.controllers.right.updateButtonValue('trigger',0)"); pg.wait_for_timeout(wait)
        return res
    import sys
    for expid in sys.argv[1:]:
        pg.goto(base+f"experience.html?id={expid}"); pg.wait_for_timeout(1500)
        print(expid, "vr button:", pg.locator("#vrBtn").is_visible())
        pg.click("#vrBtn"); pg.wait_for_timeout(1500)
        print("presenting:", pg.evaluate("NVRCore.renderer.xr.isPresenting"), "hi tex:", pg.evaluate("NVRCore.mat.map && NVRCore.mat.map.image && NVRCore.mat.map.image.width"))
        nsc = pg.evaluate("NVRCore.exp.scenes.length")
        for sc in range(nsc):
            if sc>0: pg.evaluate(f"NVRCore.loadScene({sc})"); pg.wait_for_timeout(500)
            print(" info:", click("sprite","info",0), pg.evaluate("NVRVR.infoPanel.open"))
            nst = pg.evaluate("NVRCore.exp.scenes[NVRCore.cur].stations.length")
            for k in range(nst):
                print("  st",k, click("sprite","st",k), "open:", pg.evaluate("NVRVR.qPanel.open"))
                for step in range(20):
                    if not pg.evaluate("NVRVR.qPanel.open"): break
                    ids = pg.evaluate("NVRVR.qPanel.hits.map(h=>h.id)")
                    title = pg.evaluate("NVRVR.qPanel.spec.title")
                    if "complete" in title:
                        if expid=="lesson6" and sc==0: pg.screenshot(path="vr_complete.png")
                        nxt=[i for i in ids if i in ("go","exit")]
                        if "go" in ids: click("panel","qPanel","go")
                        else: click("panel","qPanel","__close")
                        break
                    H = lambda: pg.evaluate("NVRVR.qPanel.hits.map(h=>h.id)")
                    if "next" in ids: click("panel","qPanel","next"); continue
                    opts=[i for i in ids if i.startswith("o")]
                    if opts:
                        if expid=="lesson2" and k==0 and step==0: pg.screenshot(path="vr_q.png")
                        click("panel","qPanel",opts[0]); continue
                    if any(i.startswith("m") for i in ids):
                        click("panel","qPanel",[i for i in ids if i.startswith("m")][0]); click("panel","qPanel","check"); continue
                    if any(i.startswith("s") for i in ids):
                        for rr in sorted(set(i[1] for i in ids if i.startswith("s"))):
                            click("panel","qPanel",[i for i in H() if i.startswith("s"+rr)][0])
                        click("panel","qPanel","check"); continue
                    if any(i.startswith("r") and i!="reset" for i in ids):
                        for _ in range(12):
                            if "check" in H(): break
                            click("panel","qPanel",[i for i in H() if i.startswith("r") and i!="reset"][0])
                        if expid=="lesson2": pg.screenshot(path="vr_match.png")
                        click("panel","qPanel","check"); continue
                    if any(i.startswith("p") for i in ids):
                        while any(i.startswith("p") for i in H()): click("panel","qPanel",[i for i in H() if i.startswith("p")][0])
                        click("panel","qPanel","check"); continue
                    print("   stuck", ids); break
        print(" hud:", pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)").get("score"), "/", pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)").get("total"), "done", pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog).done"))
        print(" menu:", click("panel","menuBtn","menu"), pg.evaluate("NVRVR.menuPanel.open"))
        pg.screenshot(path=f"vr_menu_{expid}.png")
        print(" prog:", click("panel","menuPanel","prog"), pg.evaluate("NVRVR.menuPanel.spec.title"))
        print(" back:", click("panel","menuPanel","back"))
        print(" exit:", click("panel","menuPanel","exit", 800), "presenting:", pg.evaluate("NVRCore.renderer.xr.isPresenting"))
    print("errors:", errs[:8])
    b.close()
srv.shutdown()
