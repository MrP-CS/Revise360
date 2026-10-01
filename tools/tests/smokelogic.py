import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import threading, http.server, functools
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8801), functools.partial(Q, directory=SITE_S.rstrip('/'))); threading.Thread(target=srv.serve_forever,daemon=True).start()
js=open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"]); pg=b.new_page(viewport={"width":1280,"height":900})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.route("**/three.min.js", lambda r: r.fulfill(body=js, content_type="application/javascript"))
    base="http://127.0.0.1:8801/"
    pg.goto(base); pg.fill("#n","24logic"); pg.select_option("#c","MCS 11A"); pg.fill("#p","1234"); pg.click("button[type=submit]"); pg.wait_for_selector(".topic")
    pg.goto(base+"experience.html?id=_logictest"); pg.wait_for_timeout(1200)
    pg.evaluate("NVR.openStation(0)"); pg.wait_for_timeout(300)
    cv=pg.locator("#lb canvas"); bb=cv.bounding_box(); H=pg.evaluate("document.querySelector('#lb canvas').height")
    P=lambda x,y:(bb["x"]+x*bb["width"]/1000, bb["y"]+y*bb["height"]/H)
    def drag(a,b):
        pg.mouse.move(*P(*a)); pg.mouse.down(); pg.mouse.move(*P((a[0]+b[0])/2,(a[1]+b[1])/2)); pg.mouse.move(*P(*b)); pg.mouse.up()
    drag((75,41),(400,300))          # AND gate from palette
    drag((74,257.5),(331,283))       # A -> in0
    drag((74,472.5),(331,317))       # B -> in1
    drag((467,300),(916,365))        # out -> Q
    pg.screenshot(path="lg_circuit.png")
    pg.click("#mrow .btn:not(.ghost)"); pg.wait_for_timeout(200); print("circuit:", pg.inner_text("#fb")[:90].replace("\n"," | "))
    pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(300)
    # expression: palette tiles: vars A,B then AND OR NOT ( ) ⌫ ; compute rects like logic.js
    cv=pg.locator("#lb canvas"); bb=cv.bounding_box(); H=pg.evaluate("document.querySelector('#lb canvas').height")
    pal=["A","B","AND","OR","NOT","(",")","⌫"]; xs={}; px=30
    for t in pal:
        w=90 if t=="⌫" else (96 if len(t)>1 else 64); xs[t]=px+w/2; px+=w+14
    for t in ["NOT","(","A","OR"]: pg.mouse.click(*P(xs[t],545))
    drag((xs["B"],545),(700,413))     # drag B into row end
    pg.mouse.click(*P(xs[")"],545))
    pg.screenshot(path="lg_expr.png")
    pg.click("#mrow .btn:not(.ghost)"); pg.wait_for_timeout(200); print("expr:", pg.inner_text("#fb")[:90].replace("\n"," | "))
    pg.locator("#mrow .btn").last.click(); pg.wait_for_timeout(300)
    # table: click cells; correct values for X,Y,Z
    cv=pg.locator("#lb canvas"); bb=cv.bounding_box(); H=pg.evaluate("document.querySelector('#lb canvas').height")
    import itertools
    cols=6; cw=min(140,(1000-80)/cols); left=(1000-cw*cols)/2; rowH=34; top=300
    for r,(T,U,W) in enumerate(itertools.product([0,1],repeat=3)):
        X=1-T; Y=U&W; Z=X&Y
        for j,v in ((3,X),(4,Y),(5,Z)):
            cx=left+j*cw+cw/2; cy=top+(r+1)*rowH+rowH/2
            for _ in range(1 if v==0 else 2): pg.mouse.click(*P(cx,cy))
    pg.screenshot(path="lg_table.png")
    pg.click("#mrow .btn:not(.ghost)"); pg.wait_for_timeout(200); print("table:", pg.inner_text("#fb")[:90].replace("\n"," | "))
    print("errors", errs); b.close()
srv.shutdown()
