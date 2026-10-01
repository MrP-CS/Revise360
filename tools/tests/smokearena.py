import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8911), functools.partial(Q, directory=SITE_S.rstrip('/')))
threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
    c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**fonts.googleapis.com**", lambda r: r.fulfill(status=200, body="", content_type="text/css"))
    pg.route("**fonts.gstatic.com**", lambda r: r.abort())
    base="http://127.0.0.1:8911/"
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(500)
    pg.fill("#k","demo"); pg.click("#f .btn"); pg.wait_for_timeout(1000)
    pg.fill("#ncls","T"); pg.fill("#names","algotest"); pg.click("#addgo"); pg.wait_for_timeout(1300)
    u,pin = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('r360local:students'))).map(s=>[s.name,s.pin])[0]")
    pg.goto(base+"topics.html"); pg.fill("#n",u); pg.fill("#p",pin); pg.click("button[type=submit]"); pg.wait_for_timeout(1200)
    for eid in ["al-bonus"]:
        pg.goto(base+f"experience.html?id={eid}"); pg.wait_for_timeout(1500)
        title=pg.evaluate("NVRCore.exp.title"); n=pg.evaluate("NVRCore.sprites.length")
        print(f"{eid}: {title} | badges {n}")
        for k in range(1):
            pg.evaluate(f"NVR.openStation({k})"); pg.wait_for_timeout(250)
            for step in range(12):
                if not pg.locator("#modal.open").count(): break
                if pg.locator("#mt", has_text="complete").count(): pg.click("#x"); break
                if pg.locator("#lb canvas").count():
                    t=pg.evaluate("(window.__sprint && __sprint.q && __sprint.q.t) || (__board && __board.task.t)")
                    pg.evaluate("(window.__sprint ? __sprint.board : __board.board).solve()")
                    bs=pg.locator("#mrow .btn:not(.ghost):not([disabled])")
                    if bs.count(): bs.last.click(); pg.wait_for_timeout(250)
                    print("   ", t, "->", pg.inner_text("#fb")[:58].replace("\n"," "))
                elif pg.locator(".opt:not([disabled])").count(): pg.locator(".opt").first.click(); pg.wait_for_timeout(120)
                elif pg.locator(".pool .opt:not([disabled])").count(): pg.locator(".pool .opt").first.click(); pg.wait_for_timeout(120)
                bt=pg.locator("#mrow .btn:not([disabled])")
                if bt.count(): bt.last.click()
                pg.wait_for_timeout(150)
        s=pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)")
        print(f"   done {s['done']}/{s['count']}  score {s['score']}/{s['total']}")
    print("errors:", errs[:3]); b.close()
srv.shutdown()
