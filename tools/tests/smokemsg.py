import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, urllib.request, pathlib, re
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8884)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8886), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8884/')
def call(**b):
    r=urllib.request.Request("http://127.0.0.1:8884/", data=json.dumps(b).encode())
    try: return json.loads(urllib.request.urlopen(r).read())
    except urllib.error.HTTPError as e: return json.loads(e.read())
TK=call(action="issue", teacherKey="test-teacher-key", school="Riverside", schoolCode="K7M3QP")["teacherKey"]
m=call(action="roster_add", teacherKey=TK, cls="11A", names=["24smithj"])["students"][0]
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8886/"
    pg.goto(base); pg.wait_for_timeout(500)
    print("sign-in fields:", pg.locator("#f .field").count(), "| school code box:", pg.locator("#sc").count(), "| guest link:", pg.locator("#guest").count())
    pg.fill("#n", m["name"]); pg.fill("#p", m["pin"]); pg.click("button[type=submit]"); pg.wait_for_timeout(1500)
    print("signed in:", pg.locator(".topic").count() > 0)
    # no page should still tell students to type a school code or invent a PIN
    bad = []
    for f in sorted(pathlib.Path(SITE_S.rstrip('/')).glob("*.html")):
        t = f.read_text()
        for phrase in ["a PIN they choose", "make one up", "school code that your students type", "Give students the school code", "as a guest"]:
            if phrase in t: bad.append((f.name, phrase))
    print("stale phrases:", bad or "none")
    for page in ["signup.html","guides.html","about.html","teachers.html"]:
        pg.goto(base+page); pg.wait_for_timeout(300)
        t=pg.inner_text("body")
        print(f"{page:15s} mentions: teacher key {'✓' if 'teacher key' in t.lower() else '✗'} | login cards {'✓' if 'card' in t.lower() else '✗'} | invite {'✓' if 'invite' in t.lower() else '✗'}")
    print("errors:", errs[:3]); b.close()
srv.shutdown(); api.shutdown()
