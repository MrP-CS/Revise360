import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, urllib.request, pathlib
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8890)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8878), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8890/')
def call(**b):
    r=urllib.request.Request("http://127.0.0.1:8890/", data=json.dumps(b).encode()); return json.loads(urllib.request.urlopen(r).read())
TK=call(action="issue", teacherKey="test-teacher-key", school="Riverside", schoolCode="K7M3QP")["teacherKey"]
# a typical MIS export: header row, extra columns, emails as usernames, two classes
pathlib.Path("/tmp/class.csv").write_text(
"Surname,Forename,UPN,Reg Group,Year\n"
'"Smith","Jo","24smithj@school.sch.uk","11A",11\n'
'"Jones","Ali","24jonesa@school.sch.uk","11A",11\n'
'"Patel","Ravi","24patelr@school.sch.uk","10C",10\n'
'"Chen","Li","24chenl@school.sch.uk","10C",10\n')
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8878/"
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(500)
    pg.fill("#k", TK); pg.click("#f .btn"); pg.wait_for_timeout(1200)
    pg.set_input_files("#csvfile", "/tmp/class.csv"); pg.wait_for_timeout(700)
    print("column guessed:", pg.locator("#ucol option:checked").inner_text(), "| class col:", pg.locator("#ccol option:checked").inner_text())
    print("preview:", pg.inner_text("#csvprev")[:90])
    pg.click("#csvuse"); pg.wait_for_timeout(2000)
    print("created:", con.execute("SELECT cls, name, pin FROM students ORDER BY cls, name").fetchall())
    print("cards offered:", "logins ready" in pg.inner_text("#newcards"))
    # save + copy paths
    with pg.expect_download() as dl:
        pg.click("#snow")
    print("saved file:", dl.value.suggested_filename)
    pg.context.grant_permissions(["clipboard-read","clipboard-write"])
    pg.click("#cnow"); pg.wait_for_timeout(500)
    txt=pg.evaluate("navigator.clipboard.readText()")
    print("copied text starts:", txt.split("\n")[0], "| has a PIN line:", any("PIN" in l for l in txt.split("\n")))
    pg.screenshot(path="csv.png", full_page=True)
    print("errors:", errs[:3]); b.close()
srv.shutdown(); api.shutdown()
