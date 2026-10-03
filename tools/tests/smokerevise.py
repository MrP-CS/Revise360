"""Can a learner actually revise? The page, in a real browser.

Not a unit test of the engine - the engine is checked by the tools beside this
one. This opens revise.html the way a pupil would, answers questions of every
kind the bank contains, and holds the things that would make the feature a lie
if they were not true:

  * a question appears, inside the 360 room, with its mark value on it;
  * a right answer earns its marks and a wrong one does not;
  * a wrong written answer says which mark points were missed, and offers to
    improve - and the improved attempt does NOT overwrite the first;
  * marks recovered are counted, and counted separately;
  * a lost mark points at a station, and the link opens that station;
  * changing topics mid-session loses nothing;
  * the session total is marks, not questions;
  * nothing anywhere turns it into a grade.

  R360_THREE=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \\
    python3 tools/tests/smokerevise.py
"""
import functools
import http.server
import json
import os
import sys
import threading

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from paths import SITE_S                                           # noqa: E402
from playwright.sync_api import sync_playwright                    # noqa: E402

PORT = 8821


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})

    def log_message(self, *a):
        pass


def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
                                          functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE",
                                "node_modules/three/build/three.min.js")).read()
    bad = 0

    def ok(cond, said):
        nonlocal bad
        print(("  ok   " if cond else "  FAIL ") + said)
        if not cond:
            bad += 1

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1280, "height": 860})
        pg.route("**/three.min.js",
                 lambda r: r.fulfill(body=three, content_type="application/javascript"))
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'rev', name: 'Revision Tester', cls: '11A', school: 'MCS' }));
          } catch (e) {}""")
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto("http://127.0.0.1:%d/revise.html" % PORT)
        pg.wait_for_function("() => window.NVRRevise && NVRRevise.current", timeout=20000)
        pg.wait_for_timeout(400)

        ok(not errors, "the page loads without a script error (%s)" % (errors[:1] or "none"))
        ok(pg.locator("#modal.open").count() == 1, "a question window is open")
        # Read it before judging it: building the message from inner_text() threw
        # when the badge was missing, so the one fault this line exists to catch
        # crashed the run instead of being reported.
        worth = pg.locator(".qmeta .marks")
        ok(worth.count() == 1, "the question shows what it is worth: "
           + (worth.first.inner_text() if worth.count() else "nothing"))
        ok(pg.evaluate("() => !!document.querySelector('#v canvas')"),
           "the 360 room is being drawn behind it")

        # ---- answer one of every kind the bank has, right and wrong
        kinds = pg.evaluate("""() => {
          const seen = {};
          R360Engine.bank.forEach(q => { seen[q.type] = (seen[q.type] || 0) + 1; });
          return seen; }""")
        print("the bank loaded here holds: " + ", ".join(
            "%s %d" % (k, v) for k, v in sorted(kinds.items())))

        def answer(qid, how):
            """Put a question on screen and answer it. `how` is 'right' or 'wrong'."""
            return pg.evaluate("""([id, how]) => {
              const q = R360Bank.question(id);
              const E = R360Engine;
              const resp = (() => {
                switch (q.type) {
                  case "mcq": case "tf":
                    return how === "right" ? q.options[q.correct]
                         : q.options[(q.correct + 1) % q.options.length];
                  case "multi": return how === "right" ? q.correct.slice()
                         : q.options.filter(o => q.correct.indexOf(o) < 0).slice(0, 1);
                  case "match": { const o = {};
                    q.pairs.forEach((p, i) => o[i] = how === "right" ? p[1]
                       : q.pairs[(i + 1) % q.pairs.length][1]); return o; }
                  case "order": return how === "right" ? q.steps.slice() : q.steps.slice().reverse();
                  case "sort": { const o = {};
                    q.items.forEach((it, i) => o[i] = how === "right" ? it[1]
                       : q.cats[(q.cats.indexOf(it[1]) + 1) % q.cats.length]); return o; }
                  case "short": case "written": case "extended":
                    return how === "right" ? q.example : "I do not know.";
                  case "truth": case "trace": { const o = {};
                    q.answer.forEach((row, r) => row.forEach((v2, c) => {
                      if (q.rows[r][c] === "") o[r + "," + c] = how === "right" ? v2 : "9"; }));
                    return o; }
                  default:
                    return how === "right" ? String(q.answer) : "nonsense";
                }
              })();
              const res = q.type === "extended"
                ? E.selfReview(q, how === "right" ? q.markPoints.map(m => m.concept) : [], {})
                : E.submit(q, resp, {});
              return { got: res.got, max: res.max, type: q.type, source: res.source,
                       canImprove: res.canImprove, missed: res.missed.length,
                       earned: res.earned.length };
            }""", [qid, how])

        by_kind = pg.evaluate("""() => {
          const out = {};
          R360Engine.bank.forEach(q => { if (!out[q.type]) out[q.type] = q.id; });
          return out; }""")
        wrong_right = []
        for kind, qid in sorted(by_kind.items()):
            r = answer(qid, "right")
            w = answer(pg.evaluate("""(t) => {
                const qs = R360Engine.bank.filter(q => q.type === t);
                return qs[qs.length - 1].id; }""", kind), "wrong")
            good = r["got"] == r["max"] and w["got"] < w["max"]
            wrong_right.append((kind, r, w, good))
            ok(good, "%-9s a right answer scores %d/%d and a wrong one %d/%d"
               % (kind, r["got"], r["max"], w["got"], w["max"]))

        # ---- the first attempt is never overwritten
        imp = pg.evaluate("""() => {
          const E = R360Engine;
          /* A question where stating one mark point really does fall short. Not
           * every first exemplar does - some of them say enough to earn a second
           * point as well, and picking the first written question in the bank
           * found one of those and failed this for the wrong reason. */
          let q = null, poor = null;
          for (const c of E.bank.filter(x => x.type === "written" && x.marks >= 2
                                            && !E.state.q[x.id])) {
            const trial = R360Mark.mark(c, c.markPoints[0].exemplar);
            if (trial.got > 0 && trial.got < trial.max) { q = c; poor = c.markPoints[0].exemplar; break; }
          }
          if (!q) return { none: true };
          const a = E.submit(q, poor, {});
          const b = E.submit(q, q.example, { improve: true });
          const r = E.state.q[q.id];
          return { id: q.id, first: r.first.got, best: r.best.got, max: r.first.max,
                   recovered: r.recovered || 0, totalRecovered: E.state.totals.recovered,
                   firstTotal: E.state.totals.firstGot, attempts: r.attempts,
                   missedFirst: a.missed.length, improvedFull: b.got === b.max }; }""")
        ok(not imp.get("none"), "there is a written question a partial answer falls short on")
        ok(imp["first"] < imp["best"], "an improved answer scores more (%d then %d of %d)"
           % (imp["first"], imp["best"], imp["max"]))
        ok(imp["first"] < imp["max"],
           "the first attempt is still recorded as the %d it earned" % imp["first"])
        ok(imp["recovered"] == imp["best"] - imp["first"],
           "marks recovered is the difference (%d)" % imp["recovered"])
        ok(imp["missedFirst"] >= 1, "the first attempt was told what it missed")

        # ---- a lost mark points at a station, and the link goes there
        rev = pg.evaluate("""() => {
          const q = R360Engine.bank.find(x => x.revisitStationId);
          const r = R360Bank.revisit(q);
          return r ? { label: r.label, href: r.href, lesson: r.lessonId } : null; }""")
        ok(bool(rev) and "station" in (rev or {}).get("label", ""),
           "a question names the station to revisit: " + ((rev or {}).get("label") or "none"))
        if rev:
            pg2 = b.new_page(viewport={"width": 1100, "height": 800})
            pg2.add_init_script("""try { localStorage.setItem('nvr:v1:student',
              JSON.stringify({ key: 'rev', name: 'Revision Tester', cls: '11A', school: 'MCS' }));
              } catch (e) {}""")
            pg2.route("**/three.min.js",
                      lambda r: r.fulfill(body=three, content_type="application/javascript"))
            pg2.goto("http://127.0.0.1:%d/%s" % (PORT, rev["href"]))
            pg2.wait_for_timeout(2200)
            here = pg2.evaluate("() => (window.NVRCore && NVRCore.exp) ? NVRCore.exp.id : null")
            ok(here == rev["lesson"], "and that link opens %s (got %s)" % (rev["lesson"], here))
            ok(pg2.locator("#homeBtn").inner_text().lower().find("revision") >= 0,
               "with a way back into the revision session")
            pg2.close()

        # ---- changing topics loses nothing
        before = pg.evaluate("() => ({ got: R360Engine.state.totals.firstGot, "
                             "q: R360Engine.state.totals.questions, "
                             "sess: R360Engine.session().questions })")
        pg.evaluate("""async () => { R360Engine.setPaper(2); await R360Engine.refresh(); }""")
        after = pg.evaluate("() => ({ got: R360Engine.state.totals.firstGot, "
                            "q: R360Engine.state.totals.questions, "
                            "sess: R360Engine.session().questions })")
        ok(before == after, "changing topics mid-session keeps the marks and the session")
        pg.evaluate("""async () => { R360Engine.setTopics(R360Bank.topics()); "
                    await R360Engine.refresh(); }""".replace('"', ""))

        # ---- the session is counted in marks
        sess = pg.evaluate("() => R360Engine.session()")
        ok(sess["avail"] > sess["questions"],
           "the session is counted in marks (%d of %d marks over %d questions)"
           % (sess["firstGot"], sess["avail"], sess["questions"]))

        # ---- selection does not repeat itself
        picks = pg.evaluate("""() => { const out = [];
          for (let i = 0; i < 25; i++) { const q = R360Engine.pick(); if (!q) break;
            out.push(q.id); R360Engine.session().asked.push(q.id); }
          return out; }""")
        ok(len(set(picks)) == len(picks),
           "twenty-five questions in a row are twenty-five different questions (%d)" % len(picks))
        topics_hit = pg.evaluate("""() => { const seen = {};
          R360Engine.session().asked.forEach(id => { const q = R360Bank.question(id);
            if (q) seen[q.topic] = (seen[q.topic] || 0) + 1; });
          return seen; }""")
        print("    topics drawn from: " + json.dumps(topics_hit))

        # ---- nothing claims to be a grade
        page_text = pg.evaluate("() => document.body.innerText")
        pg.evaluate("() => NVRRevise.progress()")
        pg.wait_for_timeout(250)
        page_text += pg.evaluate("() => document.body.innerText")
        pg.evaluate("() => NVRRevise.finish()")
        pg.wait_for_timeout(250)
        page_text += pg.evaluate("() => document.body.innerText")
        lower = page_text.lower()
        ok("grade" not in lower or "not a grade" in lower or "does not" in lower,
           "nothing on the page offers a grade")
        import re as _re
        # The page says, in so many words, that it does not predict a grade, so
        # looking for the phrase found its own disclaimer. What must not be
        # there is a grade: those have numbers on them.
        ok(not _re.search(r"(working at|predicted)\s+grade\s*\d", lower),
           "and nothing predicts one")
        ok("marks recovered" in lower or "recovered" in lower,
           "the summary reports marks recovered")

        ok(not errors, "no script errors anywhere in that (%s)" % (errors[:2] or "none"))
        b.close()

    print()
    print("a learner can revise, and the marks mean what they say" if not bad
          else "%d problem(s)" % bad)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
