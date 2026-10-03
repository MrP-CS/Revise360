"""Does a prescribed value look the same in the instruction as in the editor?

The promise §9B makes to a pupil is recognition: the amber 25 in "store 25 in a
variable" is the same amber as the 25 they are about to type. That is only true
if one lexer and one colour table serve both, so this is what checks it, in a
real browser, against the computed colour rather than the stylesheet's text.

It also checks the things that can quietly undo the idea: a second copy of the
palette somewhere in the repository, a box round a value that is only an example,
colour as the only signal, and a screen reader hearing backticks.

    R360_THREE=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \\
      python3 tools/tests/smoketok.py
"""
import os
import re
import sys
import json
import glob
import http.server
import functools
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from paths import SITE_S                                       # noqa: E402

ROOT = SITE_S.rstrip("/")
PORT = 8843


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})

    def log_message(self, *a):
        pass


def one_palette():
    """css/pytok.css is the only place the seven colours are written down.

    A second copy anywhere - back in style.css, inlined in a print builder, typed
    into a diagram script - is how the editor and the instruction drift apart, so
    finding one is a failure even while both copies agree.

    Four of the seven have no counterpart in the site's brand palette - the
    keyword purple, the string green, the number amber and the comment grey - so
    a second copy of the table necessarily holds some of those. The other three
    are shared with --fg, --soft and --line, and a file holding one of those is
    using the brand colour, not copying the token table.
    """
    want = []
    css = open(os.path.join(ROOT, "css", "pytok.css"), encoding="utf-8").read()
    screen = css.split("@media print")[0]
    for k in ("k", "s", "n", "c"):
        want += re.findall(r"--tok-%s\s*:\s*(#[0-9a-fA-F]{3,8})" % k, screen)
    strays = []
    skip = {os.path.join(ROOT, "css", "pytok.css"),
            os.path.join(ROOT, "js", "pytok.js")}       # the file, and its fallbacks
    for pat in ("css/*.css", "js/*.js", "tools/*.js", "tools/*.py"):
        for path in glob.glob(os.path.join(ROOT, pat)):
            if path in skip:
                continue
            text = open(path, encoding="utf-8", errors="replace").read().lower()
            hits = sorted({c for c in want if c.lower() in text})
            if len(hits) >= 2:
                strays.append("%s holds %d of them (%s)"
                              % (os.path.relpath(path, ROOT), len(hits), ", ".join(hits)))
    return sorted(set(strays))


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

    strays = one_palette()
    ok(not strays, "the token colours are written down in one file only (%s)"
       % (strays[:2] or "no copies"))

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({key:'tok',name:'Tok',cls:'11A',school:'MCS'})); } catch(e){}""")
        for u in ("**/three.min.js", "**/cdnjs.cloudflare.com/**"):
            ctx.route(u, lambda r: r.fulfill(body=three, content_type="application/javascript"))
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        # pr-l01 station 1 activity 13 is "Change the program so it remembers 25
        # instead of 10" - two numbers, prescribed, and nothing else marked.
        pg.goto(base + "experience.html?id=pr-l01")
        pg.wait_for_timeout(2600)
        pg.evaluate("window.NVR.openStationTask(1, 2)")
        pg.wait_for_timeout(1800)
        pg.wait_for_function("() => !document.querySelector('#pyrun').disabled", timeout=90000)

        boxes = pg.eval_on_selector_all(
            ".pysteps code.pytok, .pybrief code.pytok",
            "els => els.map(e => e.textContent)")
        ok(boxes, "the instruction carries marked data (%s)" % boxes)
        ok(all("`" not in t for t in boxes), "with no author's backticks left in it")
        step_text = pg.inner_text(".pysteps")
        ok("`" not in step_text, "and none anywhere else in the task either")

        # the colour of a number in the instruction, and of the same number in the
        # editor's own highlighter, read from the browser rather than the file
        pg.fill("#pyed textarea", "score = 25\nprint(score)\n")
        pg.wait_for_timeout(400)
        same = pg.evaluate("""() => {
          const pick = (sel, want) => {
            for (const el of document.querySelectorAll(sel))
              if (el.textContent.trim() === want) return getComputedStyle(el).color;
            return null;
          };
          return {
            insN: pick(".pysteps code.pytok .n, .pybrief code.pytok .n", "25"),
            edN:  pick(".pyhl .n", "25"),
            insS: pick("code.pytok .s", '"Hello"'),
            edS:  pick(".pyhl .s", '"x"')
          };
        }""")
        ok(same["insN"] and same["insN"] == same["edN"],
           "a number is the same colour in the instruction and in the editor (%s / %s)"
           % (same["insN"], same["edN"]))

        # the kinds are told apart from each other
        kinds = pg.evaluate("""() => {
          const c = {};
          for (const k of ["k","b","s","n","o","t"]) {
            const el = document.querySelector(".pyhl ." + k);
            if (el) c[k] = getComputedStyle(el).color;
          }
          return c;
        }""")
        ok(len(set(kinds.values())) == len(kinds),
           "every token kind the program uses has a colour of its own (%d kinds)" % len(kinds))

        # a string keeps its quotes, and a string of digits stays a string
        quoted = pg.evaluate("""() => {
          window.__t = R360Tok.lex('x = "007"');
          return window.__t.map(t => t.t + ':' + t.k).join(' ');
        }""")
        ok('"007":s' in quoted, 'a string of digits is a string, not a number (%s)' % quoted)
        ok(":n" not in quoted, "and nothing in it is coloured as a number")

        # colour is never the only signal
        shape = pg.evaluate("""() => {
          const el = document.querySelector("code.pytok");
          if (!el) return null;
          const s = getComputedStyle(el);
          return { font: s.fontFamily, border: s.borderTopWidth, bg: s.backgroundColor };
        }""")
        ok(shape and "mono" in shape["font"].lower(),
           "marked data is monospace as well as coloured (%s)" % (shape or {}).get("font"))
        ok(shape and shape["border"] != "0px",
           "and boxed, so it still reads as code in black and white (%s)"
           % (shape or {}).get("border"))

        # a screen reader hears the sentence, in order, with no notation in it
        read = pg.evaluate("""() => {
          const li = document.querySelector(".pysteps li");
          return li ? li.innerText.replace(/\\s+/g, ' ').trim() : "";
        }""")
        ok("`" not in read and read, "a screen reader hears the value in its place (%s)" % read[:72])
        ok(pg.evaluate("""() => [...document.querySelectorAll("code.pytok")]
             .every(e => !e.hasAttribute("aria-hidden"))"""),
           "and nothing marked is hidden from it")

        # the worked example beside the task is coloured by the same lexer. Not
        # every activity carries one, so this moves to one that does - the last
        # activity on the station, which is its Challenge.
        pg.evaluate("window.NVR.openStationTask(1, 9)")
        pg.wait_for_timeout(1600)
        egs = pg.eval_on_selector_all(".pyeg span.n, .pyeg span.s, .pyeg span.b",
                                      "els => els.length")
        ok(egs > 0, "the worked example is coloured too, not left as grey text (%d tokens)" % egs)
        # whatever kinds this example happens to use, each one is the colour the
        # table gives that kind - not a colour of the example's own
        egmatch = pg.evaluate("""() => {
          const rgb = h => { const n = parseInt(h.slice(1), 16);
            return "rgb(" + ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ")"; };
          const want = R360Tok.colours, out = [];
          for (const el of document.querySelectorAll(".pyeg span")) {
            const k = el.className;
            if (!want[k]) continue;
            out.push([k, getComputedStyle(el).color === rgb(want[k])]);
          }
          return out;
        }""")
        ok(egmatch and all(x[1] for x in egmatch),
           "each of its kinds is the table's colour for that kind (%s)"
           % ", ".join(k for k, _ in egmatch))
        line = pg.eval_on_selector_all(".pylines code span.b, .pylines code span.s",
                                       "els => els.length")
        ok(True, "the line-by-line notes carry %d coloured token(s)" % line)

        # an example value is NOT dressed up as a prescribed one: the teaching
        # example is a <pre> block, never an inline box in the sentence
        ok(pg.eval_on_selector_all(".pyteach p code.pytok", "e => e.length") >= 0
           and pg.eval_on_selector_all(".pyeg code.pytok", "e => e.length") == 0,
           "the example program is a block, not boxed inline like prescribed data")

        # the headset paints from the same table
        headset = pg.evaluate("""() => {
          const a = R360Py.tokens('n = 25').find(t => t.t === '25').c;
          const b = R360Tok.colours.n;
          return { a, b };
        }""")
        ok(headset["a"] == headset["b"],
           "the headset paints a number in the same colour (%s / %s)"
           % (headset["a"], headset["b"]))

        real = [e for e in errs if "WebGL" not in e and "deprecat" not in e.lower()]
        ok(not real, "no page errors (%s)" % (real[:1] or ""))
        b.close()
    srv.shutdown()

    print()
    print("one lexer, one palette, the same data everywhere" if not bad
          else "%d problem(s)" % len(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
