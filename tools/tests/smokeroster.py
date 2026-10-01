import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, urllib.request
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8892)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8876), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8892/')
def call(**b):
    r=urllib.request.Request("http://127.0.0.1:8892/", data=json.dumps(b).encode())
    return json.loads(urllib.request.urlopen(r).read())
issued=call(action="issue", teacherKey="test-teacher-key", school="Riverside", email="t@s.sch.uk", schoolCode="K7M3QP")
TK=issued["teacherKey"]
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8876/"
    # teacher creates logins
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(500)
    pg.fill("#k", TK); pg.click("#f .btn"); pg.wait_for_timeout(1200)
    print("roster section:", pg.locator("#rosterSection").count(), "| school code shown:", "K7M3QP" in pg.inner_text("#rosterSection"))
    pg.fill("#ncls","11A"); pg.fill("#names","24smithj\n24jonesa\n24patelr"); pg.click("#addgo"); pg.wait_for_timeout(1400)
    rows=con.execute("SELECT name,cls,pin,school_code FROM students ORDER BY name").fetchall()
    print("created:", rows)
    print("cards offer shown:", "Print cards" in pg.inner_text("#newcards"))
    pin = rows[2][2]; user = rows[2][0]
    # the student signs in with the card details
    pg2=b.new_context().new_page(); pg2.on("pageerror", lambda e: errs.append("s:"+str(e)))
    pg2.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    pg2.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg2.goto(base+"?school=K7M3QP"); pg2.wait_for_timeout(400)
    pg2.fill("#n", user); pg2.select_option("#c","__other"); pg2.wait_for_timeout(200); pg2.fill("#c2","11A"); pg2.fill("#p", pin)
    pg2.click("button[type=submit]"); pg2.wait_for_timeout(1200)
    print("card login works:", pg2.locator(".topic").count() > 0)
    # a wrong PIN on a claimed username is refused rather than making a duplicate
    pg3=b.new_context().new_page(); pg3.on("pageerror", lambda e: errs.append("s3:"+str(e)))
    pg3.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    pg3.goto(base+"?school=K7M3QP"); pg3.wait_for_timeout(400)
    pg3.fill("#n", user); pg3.select_option("#c","__other"); pg3.wait_for_timeout(200); pg3.fill("#c2","11A"); pg3.fill("#p","9999")
    pg3.click("button[type=submit]"); pg3.wait_for_timeout(1200)
    print("wrong PIN refused:", pg3.locator(".topic").count() == 0, "|", pg3.inner_text("#err")[:70])
    # roster enforcement blocks an invented username
    pg.check("#enforce"); pg.wait_for_timeout(600)
    pg4=b.new_context().new_page(); pg4.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    pg4.goto(base+"?school=K7M3QP"); pg4.wait_for_timeout(400)
    pg4.fill("#n","bignoodle"); pg4.fill("#p","1357"); pg4.click("button[type=submit]"); pg4.wait_for_timeout(1200)
    print("invented username blocked:", pg4.locator(".topic").count() == 0, "|", pg4.inner_text("#err")[:60])
    # PIN reset keeps progress
    pg.reload(); pg.wait_for_timeout(1400)
    pg.once("dialog", lambda d: d.accept())
    pg.locator("[data-reset]").first.click(); pg.wait_for_timeout(300)
    pg.once("dialog", lambda d: d.accept()); pg.wait_for_timeout(900)
    print("pins after reset:", con.execute("SELECT name,pin FROM students ORDER BY name").fetchall())
    pg.screenshot(path="roster.png", full_page=True)
    print("errors:", errs[:3]); b.close()
srv.shutdown(); api.shutdown()
