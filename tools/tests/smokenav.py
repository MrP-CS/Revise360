import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
import pathlib
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stubapi.py")).read())
api=serve(8896)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8872), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
cfg=open(SITE_S + 'js/config.js').read().replace('https://api.revise360.co.uk','http://127.0.0.1:8896/')
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    pg.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    base="http://127.0.0.1:8872/"
    for page in ["index.html","about.html","teachers.html","privacy.html","data-protection.html","dpa.html","teacher.html"]:
        pg.goto(base+page); pg.wait_for_timeout(500)
        links=pg.locator("header .nav a").all_inner_texts()
        print(f"{page:15s} nav:", " | ".join(links))
    # nav works while signed out, then signed in
    pg.goto(base); pg.fill("#n","24nav"); pg.fill("#p","2222"); pg.click("button[type=submit]"); pg.wait_for_timeout(900)
    print("after sign-in nav:", " | ".join(pg.locator("header .nav a").all_inner_texts()))
    pg.goto(base+'about.html'); pg.wait_for_timeout(500)
    print("about page:", pg.locator("h1").first.inner_text(), "| cards:", pg.locator(".cards .c").count(), "| faq:", pg.locator(".faq details").count())
    pg.goto(base+"data-protection.html"); pg.wait_for_timeout(400)
    print("policy page:", pg.locator("h2").count(), "sections |", pg.locator("table.info").count(), "tables")
    import re
    for f in ["index.html","about.html","privacy.html","teachers.html","teacher.html","data-protection.html","dpa.html"]:
        txt=pathlib.Path(SITE_S+f).read_text()
        assert "Creative Commons" not in txt, f
        assert "All rights reserved" in txt, f
    print("licence wording: all rights reserved on every page")
    pg.screenshot(path="about.png", full_page=True)
    # mobile menu
    pg2=c.new_page(); pg2.set_viewport_size({"width":390,"height":780})
    pg2.route("**/js/config.js", lambda r: r.fulfill(body=cfg, content_type="application/javascript"))
    pg2.goto(base+"about.html"); pg2.wait_for_timeout(400)
    vis_before=pg2.locator("header .nav ul").is_visible()
    pg2.click("header .navbtn"); pg2.wait_for_timeout(300)
    print("mobile menu hidden first:", not vis_before, "| open after tap:", pg2.locator("header .nav ul").is_visible())
    pg2.screenshot(path="mobilenav.png")
    print("errors:", errs); b.close()
srv.shutdown(); api.shutdown()
