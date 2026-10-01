import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
reg=json.load(open(SITE_S + 'experiences/registry.json'))
import sys
ids=[e["id"] for e in reg["experiences"] if e.get("type")!="worksheet"]
ids=[i for i in ids if i.startswith(sys.argv[3])][int(sys.argv[1]):int(sys.argv[2])] if len(sys.argv)>3 else ids[int(sys.argv[1]):int(sys.argv[2])]
PORT=8820+int(sys.argv[1])
srv=http.server.ThreadingHTTPServer(("127.0.0.1",PORT), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page(viewport={"width":1280,"height":800})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base=f"http://127.0.0.1:{PORT}/"
    pg.goto(base); pg.fill("#n","24tester"); pg.select_option("#c","MCS 11A"); pg.fill("#p","1234"); pg.click("button[type=submit]"); pg.wait_for_selector(".topic")
    for t in (("1.3","2.3") if sys.argv[1]=="0" else ()):
        pg.goto(base+f"?topic={t}"); pg.wait_for_selector(".exp"); print(t, "cards:", pg.locator(".exp").count(), "ws buttons:", pg.locator("a[download]").count())
        pg.screenshot(path=f"topic_{t}.png", full_page=True)
    for eid in ids:
        pg.goto(base+f"experience.html?id={eid}"); pg.wait_for_timeout(900)
        n=pg.evaluate("NVRCore.exp.scenes.length")
        for sc in range(n):
            if sc: pg.evaluate(f"NVR.loadScene({sc})")
            for k in range(pg.evaluate("NVRCore.exp.scenes[NVRCore.cur].stations.length")):
                pg.evaluate(f"NVR.openStation({k})")
                for _ in range(10):
                    if not pg.locator("#modal.open").count(): break
                    if pg.locator("#mt", has_text="complete").count(): pg.click("#x"); break
                    if pg.locator("#pool").count():
                        while pg.locator("#pool .opt:not([disabled])").count(): pg.locator("#pool .opt:not([disabled])").first.click()
                        pg.locator("#mrow .btn").last.click()
                    elif pg.locator(".mbody select").count():
                        for i in range(pg.locator(".mbody select").count()): pg.locator(".mbody select").nth(i).select_option(index=1)
                        pg.locator("#mrow .btn").last.click()
                    elif pg.locator(".seg").count():
                        for i in range(pg.locator(".item").count()): pg.locator(".item").nth(i).locator(".seg button").first.click()
                        pg.locator("#mrow .btn").last.click()
                    elif pg.locator(".chip:not([disabled])").count(): pg.locator(".chip").first.click(); pg.locator("#mrow .btn").last.click()
                    elif pg.locator(".opt:not([disabled])").count(): pg.locator(".opt").first.click()
                    pg.locator("#mrow .btn").last.click()
        s=pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)")
        print(f"{eid:14s} done {s['done']}/{s['count']} score {s['score']}/{s['total']} info {s['infoTotal']}")
        if eid=="rp-lesson1":
            pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(100)
    print("errors:", errs[:5]); b.close()
srv.shutdown()
