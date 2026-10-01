import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8805), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page(viewport={"width":1280,"height":900})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base="http://127.0.0.1:8805/"
    pg.goto(base); pg.fill("#n","24sprint"); pg.select_option("#c","MCS 11A"); pg.fill("#p","1234"); pg.click("button[type=submit]"); pg.wait_for_selector(".topic")
    for rnd in range(2):
        pg.goto(base+"experience.html?id=bl-sprint"); pg.wait_for_timeout(1200)
        pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(200); pg.click("#go"); pg.wait_for_timeout(300)
        for i in range(5 + rnd*2):
            q=pg.evaluate("__sprint.q"); ok = (i != 2)
            pg.evaluate("__sprint.board.solve(%s)" % ('__sprint.q.expr' if ok else '"A OR B"'))
            pg.locator("#mrow .btn:not(.ghost)").click(); pg.wait_for_timeout(250)
            print(f"  round {rnd} q{i} {q['t']:7s} {q['expr']:22s} ->", pg.inner_text("#fb")[:40].replace("\n"," "))
            if i == 0 and rnd == 0: pg.screenshot(path="sprint_q.png")
            pg.wait_for_timeout(2300 if not ok else 900)
        pg.evaluate("__sprint.s.dur = performance.now() - __sprint.s.t0 + 300"); pg.wait_for_timeout(2600)
        print(" end:", pg.inner_text(".box")[:150].replace("\n"," | "))
        if rnd==1: pg.screenshot(path="sprint_end.png")
    pg.goto(base+"?topic=2.4"); pg.wait_for_selector(".exp"); pg.wait_for_timeout(500)
    print("card:", [t.replace("\n"," | ")[:120] for t in pg.locator(".exp").all_inner_texts() if "sprint" in t.lower()])
    pg.screenshot(path="topic24.png", full_page=True)
    print("errors", errs); b.close()
srv.shutdown()
