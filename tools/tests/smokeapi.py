import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, sqlite3
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8899)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8870), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
CFG='window.APP_CONFIG=Object.assign({},window.APP_CONFIG,{backendUrl:"http://127.0.0.1:8899/"});'
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
    def page(ctx):
        pg=ctx.new_page(); pg.on("pageerror", lambda e: print("ERR", e))
        pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
        pg.add_init_script(CFG)  # applied after config.js? use init script that patches on load
        return pg
    base="http://127.0.0.1:8870/"
    c1=b.new_context(); pg=c1.new_page(); pg.on("pageerror", lambda e: print("ERR", e))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8899/'), content_type="application/javascript"))
    pg.goto(base); pg.fill("#n","24sync"); pg.select_option("#c","MCS 11A"); pg.fill("#p","4321"); pg.click("button[type=submit]"); pg.wait_for_selector(".topic")
    pg.goto(base+"experience.html?id=bl-lesson1"); pg.wait_for_timeout(1200)
    pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(300)
    pg.locator(".opt").first.click(); pg.wait_for_timeout(150); pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(2500)
    print("status:", pg.evaluate("document.querySelector('#sync')?document.querySelector('#sync').textContent:'n/a'"))
    print("server rows:", json.loads(open('/dev/null').read() or '{}') if False else con.execute("SELECT COUNT(*) FROM progress").fetchone()[0])
    # second device: same credentials, fresh browser profile
    c2=b.new_context(); pg2=c2.new_page(); pg2.on("pageerror", lambda e: print("ERR2", e))
    pg2.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg2.route("**/js/config.js", lambda r: r.fulfill(body=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8899/'), content_type="application/javascript"))
    pg2.goto(base); pg2.fill("#n","24sync"); pg2.select_option("#c","MCS 11A"); pg2.fill("#p","4321"); pg2.click("#f .btn"); pg2.wait_for_selector(".topic"); pg2.wait_for_timeout(1200)
    got=pg2.evaluate("Store.get('bl-lesson1')")
    print("second device sees progress:", bool(got), (got or {}).get("scenes") and "scenes ok")
    # teacher dashboard with the key
    pg2.goto(base+"teacher.html"); pg2.wait_for_timeout(600)
    pg2.fill("#k","test-teacher-key"); pg2.click("#f .btn"); pg2.wait_for_timeout(1200)
    print("teacher rows:", pg2.locator("table tbody tr").count(), "| page:", pg2.inner_text("#main")[:80].replace("\n"," | "))
    # wrong key
    pg2.evaluate("sessionStorage.clear()"); pg2.reload(); pg2.wait_for_timeout(500)
    pg2.fill("#k","nope"); pg2.click("#f .btn"); pg2.wait_for_timeout(800)
    print("bad key ->", pg2.inner_text("#main")[:70].replace("\n"," | "))
    b.close()
srv.shutdown(); api.shutdown()
