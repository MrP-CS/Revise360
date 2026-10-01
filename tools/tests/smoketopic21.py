import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8920), functools.partial(Q, directory=SITE_S.rstrip('/')))
threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={"width":1280,"height":1000}); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    fails=[]; pg.on("requestfailed", lambda r: fails.append(r.url.split("/")[-1]))
    pg.route("**fonts.googleapis.com**", lambda r: r.fulfill(status=200, body="", content_type="text/css"))
    pg.route("**fonts.gstatic.com**", lambda r: r.abort())
    base="http://127.0.0.1:8920/"
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(500)
    pg.fill("#k","demo"); pg.click("#f .btn"); pg.wait_for_timeout(900)
    pg.fill("#ncls","T"); pg.fill("#names","t21"); pg.click("#addgo"); pg.wait_for_timeout(1200)
    u,pin = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('r360local:students'))).map(s=>[s.name,s.pin])[0]")
    pg.goto(base+"topics.html"); pg.fill("#n",u); pg.fill("#p",pin); pg.click("button[type=submit]"); pg.wait_for_timeout(1000)
    # the topics list
    pg.goto(base+"topics.html"); pg.wait_for_selector(".topic"); pg.wait_for_timeout(600)
    print("topics listed:", pg.evaluate("[...document.querySelectorAll('.topic h3, .topic h2')].map(e=>e.textContent.trim()).slice(0,12)"))
    # the 2.1 page
    pg.goto(base+"topics.html?topic=2.1"); pg.wait_for_selector(".exp"); pg.wait_for_timeout(900)
    titles=pg.evaluate("[...document.querySelectorAll('.exp h3')].map(e=>e.textContent.trim())")
    broken=pg.evaluate("""(async()=>{const u=[...document.querySelectorAll('.exp .thumb')]
        .map(d=>(d.style.backgroundImage.match(/url\\("?([^")]+)/)||[])[1]).filter(Boolean);
        let bad=[];for(const x of u){const r=await fetch(x);if(!r.ok)bad.push(x.split('/').pop());}return bad;})()""")
    print("2.1 cards:", len(titles))
    for t in titles: print("   ", t)
    print("broken thumbnails:", broken)
    pg.screenshot(path="topic21.png")
    print("failed requests:", sorted(set(fails))[:6])
    print("errors:", errs[:3]); b.close()
srv.shutdown()
