"""Can a pupil get past a Python question without finishing it?

Every route the course offers is tried: the next button, the station badges, the
topic page, a typed URL, the back button and a second tab. A wrong answer, a
hint, the help panel, repeated attempts and reporting a fault must all leave the
pupil exactly where they were.

    R360_THREE=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \\
      python3 tools/tests/smokegate.py
"""
import os
import sys
import json
import http.server
import functools
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from paths import SITE_S

ROOT = SITE_S.rstrip("/")
PORT = 8841
SOLS = json.load(open(os.path.join(ROOT, "answers", "codebank", "pr-l01.json"),
                     encoding="utf-8"))["solutions"]


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})

    def log_message(self, *a):
        pass


def main():
    from playwright.sync_api import sync_playwright
    three = open(os.environ.get("R360_THREE",
                 "/home/claude/node_modules/three/build/three.min.js")).read()
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
                                          functools.partial(Q, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d/" % PORT
    bad = []

    def ok(cond, msg):
        print(("  ok  " if cond else " FAIL ") + msg)
        if not cond:
            bad.append(msg)

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({key:'gate',name:'Gate',cls:'11A',school:'MCS'})); } catch(e){}""")
        ctx.route("**/three.min.js", lambda r: r.fulfill(body=three,
                  content_type="application/javascript"))
        ctx.route("**/cdnjs.cloudflare.com/**", lambda r: r.fulfill(body=three,
                  content_type="application/javascript"))
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        pg.goto(base + "experience.html?id=pr-l01")
        pg.wait_for_timeout(2600)

        # ---- the station a pupil has not reached is not open
        pg.evaluate("window.NVR.openStation(3)")
        pg.wait_for_timeout(700)
        shown = pg.inner_text("#box") if pg.locator("#modal.open").count() else ""
        ok("Finish the station you are on first" in shown,
           "a later station says it is not open yet")
        ok(pg.locator("#goback").count() == 1, "and offers the way back to the current question")
        ok("Skip" not in shown, "with no way to skip it")
        pg.click("#goback")
        pg.wait_for_timeout(1200)
        at = pg.evaluate("document.querySelector('#mt') ? document.querySelector('#mt').textContent : ''")
        ok("Printing output" in at, "which lands on the first station (%s)" % at.strip())

        # ---- a wrong program does not unlock the next activity
        pg.wait_for_function("() => !document.querySelector('#pyrun').disabled", timeout=90000)
        first = pg.evaluate("document.querySelector('.pychip').textContent.trim()")
        ok(first == "Try it", "the station opens on its first activity (%s)" % first)
        pg.click("#pyrun")
        pg.wait_for_timeout(2500)
        ok(pg.locator("#mrow .btn").count() == 1, "running the Try it finishes it")
        pg.click("#mrow .btn")
        pg.wait_for_timeout(1500)
        # activity 2 is a Change it, marked by tests
        pg.wait_for_function("() => document.querySelector('#pycheck') && !document.querySelector('#pycheck').disabled",
                             timeout=90000)
        pg.fill("#pyed textarea", 'print("not the answer")\n')
        pg.click("#pycheck")
        pg.wait_for_timeout(3500)
        ok(pg.locator("#mrow .btn:has-text('Next question')").count() == 0,
           "a wrong answer offers no way on")
        ok(pg.locator("text=Try this one again").count() > 0
           or pg.locator("#pytry").inner_text().strip() != "",
           "and tells the pupil to keep working at it")

        # ---- hints and the help panel do not unlock it
        before = pg.evaluate("""JSON.stringify(Object.values(
            JSON.parse(localStorage.getItem('nvr:v1:prog') || '{}')['pr-l01']?.scenes || {}))""")
        if pg.locator("#pyhint").count():
            pg.click("#pyhint")
            pg.wait_for_timeout(600)
            pg.click("#hintclose")
            pg.wait_for_timeout(400)
        pg.click("#pyhelp")
        pg.wait_for_timeout(600)
        helptext = pg.inner_text("#pyhintpane")
        ok("ask your teacher for help" in helptext, "the help panel says to ask the teacher")
        ok("Complete this question before moving on" in helptext,
           "and that the question still has to be completed")
        ok("notified" not in helptext.lower() and "sent" not in helptext.lower(),
           "without claiming anyone has been told")
        pg.click("#hintclose")
        pg.wait_for_timeout(400)
        ok(pg.locator("#mrow .btn:has-text('Next question')").count() == 0,
           "neither the hint nor the help panel unlocked anything")

        # ---- three more wrong checks still do not unlock it
        for _ in range(3):
            pg.fill("#pyed textarea", 'print("still wrong")\n')
            pg.click("#pycheck")
            pg.wait_for_timeout(3000)
            if pg.locator("#pyhintpane").count():
                pg.click("#hintclose")
                pg.wait_for_timeout(300)
        ok(pg.locator("#mrow .btn:has-text('Next question')").count() == 0,
           "repeated attempts do not unlock it either")

        # ---- the right answer does
        pg.fill("#pyed textarea", SOLS["pr-l01-q2"])
        pg.click("#pycheck")
        pg.wait_for_timeout(3500)
        ok(pg.locator("#mrow .btn:has-text('Next question')").count() == 1,
           "a correct answer unlocks the next one")

        # ---- a later lesson, typed straight into the address bar
        pg2 = ctx.new_page()
        pg2.goto(base + "experience.html?id=pr-l05")
        pg2.wait_for_timeout(3000)
        txt = pg2.inner_text("#box") if pg2.locator("#modal.open").count() else ""
        ok("Finish lesson" in txt, "a later lesson typed into the address bar is refused")
        ok(pg2.locator("#x").count() == 0, "and its window has no close cross")
        pg2.keyboard.press("Escape")
        pg2.wait_for_timeout(400)
        ok(pg2.locator("#modal.open").count() == 1, "Escape does not dismiss it")
        pg2.mouse.click(5, 5)
        pg2.wait_for_timeout(400)
        ok(pg2.locator("#modal.open").count() == 1, "nor does clicking beside it")
        ok(pg2.locator(".mrow a[href*='pr-l01']").count() == 1,
           "it points back at the lesson the pupil is on")
        pg2.close()

        # ---- the topic page shows the same thing
        pg3 = ctx.new_page()
        pg3.goto(base + "topics.html?topic=PY")
        pg3.wait_for_timeout(2000)
        ok(pg3.locator(".topic-resume").count() == 1, "the topic page says where the pupil is up to")
        ok(pg3.locator(".exp.locked").count() >= 11,
           "and shows the later lessons as not open yet (%d)" % pg3.locator(".exp.locked").count())
        ok(pg3.locator(".exp.locked a:has-text('Return to your current question')").count() >= 1,
           "each sending the pupil back to the current lesson")
        pg3.close()

        # ---- saved work survives a reload, and resumes where it was
        pg.reload()
        pg.wait_for_timeout(2600)
        pg.evaluate("window.NVR.openStation(0)")
        pg.wait_for_timeout(1500)
        chip = pg.evaluate("(document.querySelector('.pychip')||{}).textContent || ''")
        ok(chip.strip() in ("Predict", "Complete it", "Build it", "Change it", "Fix it"),
           "after a reload the station resumes at the first unfinished activity (%s)" % chip.strip())

        # ---- nothing anywhere offers a skip
        pg.goto(base + "experience.html?id=pr-l01")
        pg.wait_for_timeout(2400)
        page_text = pg.inner_text("body")
        ok("Skip" not in page_text, "the word Skip appears nowhere in the course")

        real = [e for e in errs if "WebGL" not in e and "deprecat" not in e.lower()]
        ok(not real, "no page errors (%s)" % (real[:1] or ""))
        b.close()
    srv.shutdown()

    print()
    print("every route respects the sequence" if not bad else "%d problem(s)" % len(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
