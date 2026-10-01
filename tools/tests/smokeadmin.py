import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8893)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8875), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8893/')
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8875/"
    # a teacher asks for a key
    pg.goto(base+"signup.html"); pg.fill("#name","A Teacher"); pg.fill("#email","a.teacher@school.sch.uk"); pg.fill("#school","Riverside Academy"); pg.fill("#note","Two Year 10 classes")
    pg.click("#go"); pg.wait_for_timeout(600)
    # wrong owner key refused
    pg.goto(base+"admin.html"); pg.wait_for_timeout(400)
    pg.fill("#k","wrong"); pg.click("#f .btn"); pg.wait_for_timeout(700)
    print("bad owner key ->", pg.inner_text(".err")[:40])
    pg.fill("#k","test-teacher-key"); pg.click("#f .btn"); pg.wait_for_timeout(900)
    print("requests listed:", pg.locator("table").first.locator("tr").count()-1, "| waiting flagged:", "1 request waiting" in pg.inner_text(".lead"))
    pg.click("[data-fill]"); pg.wait_for_timeout(300)
    print("prefilled school:", pg.input_value("#school"), "| email:", pg.input_value("#email"))
    pg.click("#go"); pg.wait_for_timeout(1200)
    issued=pg.inner_text("#issued")
    print("issued:", "Key issued" in issued, "| shows code:", con.execute("SELECT school_code FROM teachers").fetchone())
    print("request marked:", con.execute("SELECT status FROM requests").fetchone())
    pg.wait_for_timeout(600)
    print("keys table rows:", pg.locator("table").last.locator("tr").count()-1)
    pg.click("#done"); pg.wait_for_timeout(900)
    pg.locator("[data-toggle]").first.click(); pg.wait_for_timeout(900)
    print("after switch off, active =", con.execute("SELECT active FROM teachers").fetchone()[0])
    pg.screenshot(path="admin.png", full_page=True)
    print("errors:", errs[:3]); b.close()
srv.shutdown(); api.shutdown()
