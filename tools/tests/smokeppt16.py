import os
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8930), functools.partial(Q, directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "revise360")))
threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={"width":1280,"height":1000}); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**fonts.googleapis.com**", lambda r: r.fulfill(status=200, body="", content_type="text/css"))
    pg.route("**fonts.gstatic.com**", lambda r: r.abort())
    base="http://127.0.0.1:8930/"
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(500)
    pg.fill("#k","demo"); pg.click("#f .btn"); pg.wait_for_timeout(900)
    pg.fill("#ncls","T"); pg.fill("#names","ppt16"); pg.click("#addgo"); pg.wait_for_timeout(1200)
    u,pin = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('r360local:students'))).map(s=>[s.name,s.pin])[0]")
    pg.goto(base+"topics.html"); pg.fill("#n",u); pg.fill("#p",pin); pg.click("button[type=submit]"); pg.wait_for_timeout(1000)
    for topic in ["1.6","2.1"]:
        pg.goto(base+f"topics.html?topic={topic}"); pg.wait_for_selector(".exp"); pg.wait_for_timeout(700)
        links = pg.evaluate("""[...document.querySelectorAll('.exp a')]
            .filter(a=>/PowerPoint/i.test(a.textContent)).map(a=>a.getAttribute('href'))""")
        ok = pg.evaluate("""(async()=>{const u=[...document.querySelectorAll('.exp a')]
            .filter(a=>/PowerPoint/i.test(a.textContent)).map(a=>a.getAttribute('href'));
            let bad=[];for(const x of u){const r=await fetch(x);if(!r.ok)bad.push(x);}
            return {n:u.length,bad};})()""")
        print(f"topic {topic}: PowerPoint links on cards = {len(links)} | broken = {ok['bad'] or 'none'}")
        if topic=="1.6": print("   e.g.", links[0] if links else "-")
    pg.goto(base+"topics.html?topic=1.6"); pg.wait_for_selector(".exp"); pg.wait_for_timeout(600)
    pg.screenshot(path="t16cards.png", clip={"x":90,"y":300,"width":1100,"height":560})
    print("errors:", errs[:3]); b.close()
srv.shutdown()
