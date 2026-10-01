import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8811), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page(viewport={"width":1280,"height":900})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base="http://127.0.0.1:8811/"
    pg.goto(base); pg.fill("#n","24full"); pg.select_option("#c","MCS 11A"); pg.fill("#p","1234"); pg.click("button[type=submit]"); pg.wait_for_selector(".topic")
    for eid in ("ns-lesson1","ns-lesson2","ns-lesson3","ns-lesson4","ns-lesson5"):
        pg.goto(base+f"experience.html?id={eid}"); pg.wait_for_timeout(1000)
        n=pg.evaluate("NVRCore.exp.scenes[0].stations.length")
        for k in range(n):
            pg.evaluate(f"NVR.openStation({k})")
            for _ in range(8):
                if not pg.locator("#modal.open").count() or pg.locator("#mt", has_text="complete").count(): break
                if pg.locator("#lb canvas").count() and pg.locator("#mrow .btn:not(.ghost)").inner_text().startswith("Check"):
                    task=pg.evaluate("__board.task"); pg.evaluate("__board.board.solve(__board.task.expr)")
                    pg.locator("#mrow .btn:not(.ghost)").click(); pg.wait_for_timeout(150)
                elif pg.locator(".mbody select").count():
                    task=pg.evaluate("NVRCore.exp.scenes[0].stations[%d].tasks" % k)
                    for i in range(pg.locator(".mbody select").count()):
                        sel=pg.locator(".mbody select").nth(i); left=pg.locator(".mbody .pair, .mbody label").nth(i).inner_text() if False else None
                    # answer match correctly using task data
                    pairs=[t for t in task if t["t"]=="match"][0]["pairs"]
                    rows=pg.locator(".mbody select")
                    for i in range(rows.count()):
                        lbl=pg.evaluate("el => el.closest('div,li,tr').innerText", rows.nth(i).element_handle())
                        ans=[r for l,r in pairs if l in lbl][0]; rows.nth(i).select_option(label=ans)
                    pg.locator("#mrow .btn").last.click()
                elif pg.locator(".opt:not([disabled])").count():
                    task=pg.evaluate("NVRCore.exp.scenes[0].stations[%d].tasks" % k)
                    q=pg.inner_text(".q"); t=[t for t in task if t.get("q")==q][0]
                    pg.locator(".opt", has_text=t["a"][0]).first.click()
                pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(100)
        s=pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)")
        print(f"{eid} done {s['done']}/{s['count']} score {s['score']}/{s['total']}")
    print("errors", errs[:3]); b.close()
srv.shutdown()
