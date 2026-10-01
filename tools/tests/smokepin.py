import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, urllib.request
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8883)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8887), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8883/')
def call(**b):
    r=urllib.request.Request("http://127.0.0.1:8883/", data=json.dumps(b).encode())
    try: return json.loads(urllib.request.urlopen(r).read())
    except urllib.error.HTTPError as e: return json.loads(e.read())
# two schools, same username in each
A=call(action="issue", teacherKey="test-teacher-key", school="Riverside", schoolCode="AAA111")["teacherKey"]
B=call(action="issue", teacherKey="test-teacher-key", school="Hillside",  schoolCode="BBB222")["teacherKey"]
sa=call(action="roster_add", teacherKey=A, cls="11A", names=["24smithj","24jonesa"])["students"]
sb=call(action="roster_add", teacherKey=B, cls="10X", names=["24smithj"])["students"]
print("school A pins:", [(s["name"], s["pin"]) for s in sa])
print("school B pins:", [(s["name"], s["pin"]) for s in sb])
print("6 digits:", all(len(s["pin"])==6 for s in sa+sb), "| same username, different PIN:", sa[0]["pin"] != sb[0]["pin"])
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8887/"
    pg.goto(base); pg.wait_for_timeout(400)
    pg.fill("#n","24smithj"); pg.fill("#p", sb[0]["pin"]); pg.click("button[type=submit]"); pg.wait_for_timeout(1400)
    st=pg.evaluate("Store.student()")
    print("signed into the right school:", st and st["school"], "(expected BBB222)")
    # a 4-digit PIN from before the change still works
    con.execute("INSERT INTO students (key,name,cls,school_code,pin,roster,first_seen,last_seen) VALUES (?,?,?,?,?,1,?,?)",
        (__import__("hashlib").sha256("9Z|oldpupil|4321".encode()).hexdigest(),"oldpupil","9Z","AAA111","4321",1,1)); con.commit()
    print("legacy 4-digit login:", call(action="login", name="oldpupil", pin="4321").get("ok"))
    print("errors:", errs[:3]); b.close()
srv.shutdown(); api.shutdown()
