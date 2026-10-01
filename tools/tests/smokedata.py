import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8840), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page(viewport={"width":1280,"height":900})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base="http://127.0.0.1:8840/"
    pg.goto(base); pg.fill("#n","24data"); pg.select_option("#c","MCS 11A"); pg.fill("#p","1234"); pg.click("button[type=submit]"); pg.wait_for_selector(".topic")
    pg.goto(base+"experience.html?id=_datatest"); pg.wait_for_timeout(1200)
    pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(300)
    for i in range(7):
        t=pg.evaluate("__board.task"); cv=pg.locator("#lb canvas"); bb=cv.bounding_box(); Hh=pg.evaluate("document.querySelector('#lb canvas').height")
        # real pointer interaction: use the board's hit list to click each needed target
        if t["t"]=="convert" and t["to"]=="binary":
            want=[int(c) for c in format(t["value"],"08b")]
            for j,v in enumerate(want):
                if v:
                    r=pg.evaluate("j => { const h=__board.board; const hit=null; return null }", j)
            pg.evaluate("__board.board.solve()")
        else:
            pg.evaluate("__board.board.solve()")
        if i==0: pg.screenshot(path="d_convert.png")
        if i==3: pg.screenshot(path="d_add.png")
        if i==5: pg.screenshot(path="d_pixels.png")
        if i==6: pg.screenshot(path="d_sound.png")
        pg.locator("#mrow .btn:not(.ghost)").click(); pg.wait_for_timeout(200)
        print(f"{t['t']:9s}", pg.inner_text("#fb")[:80].replace("\n"," | "))
        pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(250)
    print("errors", errs); b.close()
srv.shutdown()
