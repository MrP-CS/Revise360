import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8888), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base="http://127.0.0.1:8888/"       # no backend at all, config.backendUrl is empty
    # 1. teacher creates a class with no backend
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(500)
    print("demo hint on sign-in:", "Demo mode" in pg.inner_text("#main"))
    pg.fill("#k","demo"); pg.click("#f .btn"); pg.wait_for_timeout(1200)
    pg.fill("#ncls","11A"); pg.fill("#names","demo01\ndemo02\ndemo03"); pg.click("#addgo"); pg.wait_for_timeout(1200)
    pins = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('r360local:students'))).map(s => [s.name, s.pin])")
    print("created locally:", pins)
    print("cards offered:", "logins ready" in pg.inner_text("#newcards"))
    # 2. a student signs in with one of those cards, in the same browser
    user, pin = pins[0]
    pg.goto(base); pg.wait_for_timeout(500)
    pg.fill("#n", user); pg.fill("#p", pin); pg.click("button[type=submit]"); pg.wait_for_timeout(1200)
    st=pg.evaluate("Store.student()")
    print("student signed in:", st and (st["name"], st["cls"]), "| topics:", pg.locator(".topic").count())
    # 3. progress saves and survives a reload
    pg.goto(base+"experience.html?id=bl-lesson1"); pg.wait_for_timeout(1400)
    pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(250); pg.locator(".opt").first.click(); pg.wait_for_timeout(150)
    pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(1500)
    pg.reload(); pg.wait_for_timeout(1800)
    sm = pg.evaluate("Store.summarise(NVRCore.exp, NVRCore.prog)")
    saved = pg.evaluate("JSON.stringify(Store.get('bl-lesson1')||{}).length")
    print("progress kept after reload: stations done", sm["done"], "| answers stored:", saved > 20, "| status:", pg.evaluate("document.querySelector('#sync')?document.querySelector('#sync').textContent:''"))
    # 4. the teacher sees it on the dashboard
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(1400)
    print("dashboard shows the student:", user in pg.inner_text("#main"))
    # 5. wrong PIN still refused
    pg.evaluate("Store.signOut()"); pg.goto(base); pg.wait_for_timeout(500)
    pg.fill("#n", user); pg.fill("#p","000000"); pg.click("button[type=submit]"); pg.wait_for_timeout(900)
    print("wrong PIN refused:", pg.locator(".topic").count()==0, "|", pg.inner_text("#err")[:50])
    print("errors:", errs[:3]); b.close()
srv.shutdown()
