import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8891), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base="http://127.0.0.1:8891/"
    # make a login in demo mode
    pg.goto(base+"teacher.html"); pg.wait_for_timeout(400)
    pg.fill("#k","demo"); pg.click("#f .btn"); pg.wait_for_timeout(900)
    pg.fill("#ncls","T"); pg.fill("#names","tester"); pg.click("#addgo"); pg.wait_for_timeout(1200)
    u,pin = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('r360local:students'))).map(s=>[s.name,s.pin])[0]")
    pg.goto(base); pg.fill("#n",u); pg.fill("#p",pin); pg.click("button[type=submit]"); pg.wait_for_timeout(1200)
    # topic pages and cards still work
    pg.goto(base+"?topic=1.3"); pg.wait_for_selector(".exp"); pg.wait_for_timeout(700)
    cards=pg.locator(".exp").count(); imgs=pg.evaluate("[...document.querySelectorAll('.exp img')].filter(i=>!i.complete||i.naturalWidth===0).length")
    links=pg.evaluate("[...document.querySelectorAll('a[href$=\".docx\"]')].map(a=>a.getAttribute('href')).slice(0,3)")
    print("1.3 cards:", cards, "| broken thumbnails:", imgs, "| worksheet links:", links)
    # a new-style link
    pg.goto(base+"experience.html?id=nw-l03"); pg.wait_for_timeout(1600)
    print("new id loads:", pg.evaluate("NVRCore.exp.title"), "| badges:", pg.evaluate("NVRCore.sprites.length"))
    # an old-style link should still work and tidy the address
    pg.goto(base+"experience.html?id=net-lesson13"); pg.wait_for_timeout(1800)
    print("old id redirects:", pg.evaluate("NVRCore.exp.title"), "| url now:", pg.url.split("?")[-1])
    # progress saved under the old id moves across
    pg.evaluate("""() => { const s = Store.student(); const k='nvr:v1:p:'+s.key;
        const all = JSON.parse(localStorage.getItem(k)||'{}'); all['net-lesson12'] = {scenes:{main:{done:{0:true}}},info:[],updated:Date.now()};
        localStorage.setItem(k, JSON.stringify(all)); }""")
    pg.goto(base+"experience.html?id=net-lesson12"); pg.wait_for_timeout(1800)
    print("progress carried over:", pg.evaluate("JSON.stringify(Store.get('nw-l12')||{}).includes('done')"))
    print("errors:", errs[:3]); b.close()
srv.shutdown()
