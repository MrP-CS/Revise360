import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, urllib.request, pathlib
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8889)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8879), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8889/')
def call(**b):
    r=urllib.request.Request("http://127.0.0.1:8889/", data=json.dumps(b).encode()); return json.loads(urllib.request.urlopen(r).read())
TK=call(action="issue", teacherKey="test-teacher-key", school="Riverside", schoolCode="K7M3QP")["teacherKey"]
made=call(action="roster_add", teacherKey=TK, cls="11A", names=["24smithj","24jonesa"])["students"]
user, pin = made[0]["name"], made[0]["pin"]
print("created", [(m["name"], m["pin"]) for m in made])
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8879/"
    pg.goto(base); pg.wait_for_timeout(500)
    print("fields on form:", pg.locator("#f .field:not([hidden])").count(), "| school field hidden:", pg.locator("#scwrap").is_hidden())
    # wrong PIN
    pg.fill("#n", user); pg.fill("#p","0000"); pg.click("button[type=submit]"); pg.wait_for_timeout(900)
    print("wrong PIN:", pg.inner_text("#err")[:60])
    # right PIN: class and school arrive from the record
    pg.fill("#p", pin); pg.click("button[type=submit]"); pg.wait_for_timeout(1200)
    st=pg.evaluate("Store.student()")
    print("signed in:", st and (st["name"], st["cls"], st["school"]), "| topics:", pg.locator(".topic").count())
    # progress saves and reaches the teacher
    pg.goto(base+"experience.html?id=bl-lesson1"); pg.wait_for_timeout(1200)
    pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(200); pg.locator(".opt").first.click(); pg.wait_for_timeout(120)
    pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(2500)
    print("rows for this school:", len(call(action="all", teacherKey=TK)["rows"]))
    # guest mode is gone: the sign-in page must not offer it
    print("guest link removed:", pg.locator("#guest").count() == 0)
    # lockout after repeated wrong PINs
    for i in range(11):
        call(action="login", name="24jonesa", pin="1111")
    print("after 11 bad tries:", call(action="login", name="24jonesa", pin="1111"))
    print("errors:", errs[:3]); b.close()
srv.shutdown(); api.shutdown()
