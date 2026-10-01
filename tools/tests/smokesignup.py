import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, urllib.request
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8885)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8883), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
good=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8885/')
bad =open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:9999/')  # nothing listening
with sync_playwright() as p:
    b=p.chromium.launch(); 
    # 1. backend up: the request is stored
    pg=b.new_page(); pg.route("**/js/config.js", lambda r: r.fulfill(body=good, content_type="application/javascript"))
    pg.goto("http://127.0.0.1:8883/signup.html"); pg.wait_for_timeout(400)
    pg.fill("#name","A Teacher"); pg.fill("#email","a@school.sch.uk"); pg.fill("#school","Riverside"); pg.click("#go"); pg.wait_for_timeout(800)
    print("backend up  ->", "Request sent" in pg.inner_text("#done"), "| stored:", con.execute("SELECT COUNT(*) FROM requests").fetchone()[0])
    # 2. backend down: the email fallback appears, already filled in
    pg2=b.new_page(); pg2.route("**/js/config.js", lambda r: r.fulfill(body=bad, content_type="application/javascript"))
    pg2.goto("http://127.0.0.1:8883/signup.html"); pg2.wait_for_timeout(400)
    pg2.fill("#name","B Teacher"); pg2.fill("#email","b@school.sch.uk"); pg2.fill("#school","Hillside"); pg2.fill("#note","Two Year 11 classes")
    pg2.click("#go"); pg2.wait_for_timeout(2500)
    href = pg2.get_attribute("#mailfall","href") or ""
    print("backend down ->", "couldn't reach the server" in pg2.inner_text("#err"), "| mail draft has school:", "Hillside" in href, "| has note:", "Year%2011" in href or "Year+11" in href)
    b.close()
srv.shutdown(); api.shutdown()
