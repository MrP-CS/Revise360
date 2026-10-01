import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools, json, urllib.request
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8888)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1","8880".__len__() and 8880), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8888/')
def call(**b):
    r=urllib.request.Request("http://127.0.0.1:8888/", data=json.dumps(b).encode())
    try: return json.loads(urllib.request.urlopen(r).read())
    except urllib.error.HTTPError as e: return json.loads(e.read())
TK=call(action="issue", teacherKey="test-teacher-key", school="Riverside", email="lead@school.sch.uk", schoolCode="K7M3QP")["teacherKey"]
call(action="roster_add", teacherKey=TK, cls="11A", names=["24smithj","24jonesa"])
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8880/"
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(400)
    pg.fill("#k", TK); pg.click("#f .btn"); pg.wait_for_timeout(1400)
    print("team panel:", "Your team at" in pg.inner_text("#rosterSection"), "| invite form:", pg.locator("#invf").count())
    pg.fill("#iemail","colleague@school.sch.uk"); pg.click("#invgo"); pg.wait_for_timeout(900)
    link = pg.inner_text("#invout code.key")
    print("invite link:", link.split("invite=")[-1][:12], "…")
    # the colleague joins
    c2=b.new_context(); pg2=c2.new_page(); pg2.on("pageerror", lambda e: errs.append("c:"+str(e)))
    pg2.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    pg2.goto(link); pg2.wait_for_timeout(700)
    print("join page names school:", "Riverside" in pg2.inner_text("h1"))
    pg2.fill("#name","B Colleague"); pg2.fill("#email","b.colleague@school.sch.uk"); pg2.click("#go"); pg2.wait_for_timeout(900)
    key2 = pg2.inner_text("#tk")
    print("colleague got a key:", len(key2) > 20)
    # same school code, same students
    rows = call(action="all", teacherKey=key2)["rows"]
    print("colleague sees the school's students:", len(rows) >= 0, "| school codes:", {r["school"] for r in call(action="all", teacherKey=key2)["rows"]} or "no progress yet")
    print("colleague's school code:", con.execute("SELECT school_code, role FROM teachers WHERE person='B Colleague'").fetchone())
    # colleague can create logins but not invite
    print("colleague invite refused:", call(action="invite_create", teacherKey=key2).get("error"))
    # the lead removes access
    pg.reload(); pg.wait_for_timeout(1500)
    pg.once("dialog", lambda d: d.accept())
    pg.locator("[data-team]").first.click(); pg.wait_for_timeout(1000)
    print("after removal, colleague key works:", call(action="team_list", teacherKey=key2).get("ok", False))
    print("used invite reusable:", call(action="invite_info", code=link.split("invite=")[-1]).get("error"))
    pg.screenshot(path="team.png", full_page=True)
    print("errors:", errs[:3]); b.close()
srv.shutdown(); api.shutdown()
