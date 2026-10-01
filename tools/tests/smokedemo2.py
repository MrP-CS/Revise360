# Does a demo student's progress survive closing the browser and coming back?
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8889), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
    c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base="http://127.0.0.1:8889/"
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(400)
    pg.fill("#k","demo"); pg.click("#f .btn"); pg.wait_for_timeout(1000)
    pg.fill("#ncls","10B"); pg.fill("#names","pupil1"); pg.click("#addgo"); pg.wait_for_timeout(1200)
    user, pin = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('r360local:students'))).map(s=>[s.name,s.pin])[0]")
    pg.goto(base); pg.fill("#n",user); pg.fill("#p",pin); pg.click("button[type=submit]"); pg.wait_for_timeout(1200)
    pg.goto(base+"experience.html?id=bl-lesson1"); pg.wait_for_timeout(1400)
    # answer a whole station correctly
    pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(250)
    for _ in range(6):
        if not pg.locator("#modal.open").count(): break
        if pg.locator(".opt:not([disabled])").count():
            q=pg.inner_text(".q"); t=pg.evaluate("NVRCore.exp.scenes[0].stations[0].tasks")
            want=[x for x in t if x.get("q")==q]
            pg.locator(".opt", has_text=want[0]["a"][0]).first.click() if want else pg.locator(".opt").first.click()
            pg.wait_for_timeout(150)
        pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(200)
    state = pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)")
    print("before closing: done", state["done"], "score", state["score"])
    stored = c.storage_state()
    pg.close(); c.close()
    # reopen with the same stored data, as if the student came back the next day
    c2=b.new_context(storage_state=stored); pg2=c2.new_page()
    pg2.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg2.goto(base+"experience.html?id=bl-lesson1"); pg2.wait_for_timeout(1600)
    s2 = pg2.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)")
    print("after reopening:  done", s2["done"], "score", s2["score"], "| still signed in as", pg2.evaluate("Store.student().name"))
    pg2.goto(base+"teacher.html"); pg2.wait_for_timeout(800)
    pg2.fill("#k","demo"); pg2.click("#f .btn"); pg2.wait_for_timeout(1400)
    print("teacher still sees it:", user in pg2.inner_text("#main"), "| demo notice:", "Demo mode" in pg2.inner_text("#main"))
    print("errors:", errs[:3]); b.close()
srv.shutdown()
