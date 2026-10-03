"""What does the same Python activity actually show, on a screen and in a headset?

Opens one code activity twice - once as the page renders it, once as the headset
renders it - and records what each one puts in front of the pupil. It reports;
it does not judge. The parity table in docs/VR-PARITY.md is written from what
this prints, so the table is a record of a run rather than a reading of the
source.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/parityprobe.py [lesson-id] [--kind build]

Writes build/parity/screen-<id>.png, vr-<id>.png and parity-<id>.json.
"""
import os, sys, json, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT
from playwright.sync_api import sync_playwright

PORT = 8799
OUTDIR = OUT / "parity"


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


# ---------------------------------------------------------------- what the page shows
SCREEN = r"""(() => {
  const txt = s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; };
  const all = s => [...document.querySelectorAll(s)].map(e => e.textContent.trim());
  const ta = document.querySelector(".pysrc");
  const tokcount = sel => [...document.querySelectorAll(sel)].length;
  return {
    stage_chip:   txt(".pychip"),
    stage_says:   txt(".pysays"),
    where:        txt(".pywhere"),
    dots:         document.querySelectorAll(".pydots li").length,
    steps:        all(".pysteps li > span:last-child"),
    brief:        all(".pybrief li"),
    teach_head:   txt(".pyteach h4"),
    teach_say:    txt(".pyteach p"),
    teach_code:   txt(".pyteach .pyeg"),
    teach_out:    txt(".pyegout"),
    line_notes:   all(".pylines li span:last-child"),
    run_eg:       { file: txt(".pyrunrow:not(.in):not(.out) code"),
                    you_type: txt(".pyrunrow.in code"),
                    displays: txt(".pyrunrow.out code") },
    starter:      ta ? ta.value : null,
    output_placeholder: txt(".pyout"),
    buttons:      [...document.querySelectorAll(".pystage button, .pyidebar button, .pytaskhead button")]
                    .map(b => b.textContent.trim()),
    read_aloud:   !!document.querySelector("#pysay"),
    keyboard_line: txt(".pykeys"),
    // how many inline prescribed values are coloured, and in how many kinds
    inline_values: tokcount("code.pytok"),
    token_kinds:   [...new Set([...document.querySelectorAll("code.pytok span, .pyeg span")]
                     .map(s => s.className))].sort(),
    raw_backticks: (document.querySelector(".codewrap") || {textContent:""}).textContent.includes("`")
  };
})()"""

# ---------------------------------------------------------------- what the headset shows
VRSHOW = r"""(() => {
  const v = NVRVR.vrCode; if (!v) return { open: false };
  const kb = NVRVR.kbPanel;
  return {
    open: true,
    // every string paintCode() puts on the canvas, in the order it paints them
    painted_question: v.task.q,
    painted_brief:    v.task.brief || [],
    painted_teach:    v.task.teach ? "e.g.  " + (v.task.teach.code || []).join("    ").slice(0, 74) : null,
    teach_say_shown:  false,
    teach_out_shown:  false,
    line_notes_shown: false,
    run_eg_shown:     false,
    stage_chip_shown: false,
    dots_shown:       false,
    starter:          v.text,
    console:          v.out || "Press Run to try your program.",
    state:            v.state,
    buttons:          kb.hits.filter(h => !/^key/.test(h.id)).map(h => h.id),
    keys:             kb.hits.filter(h => /^key/.test(h.id)).length,
    raw_backticks:    String(v.task.q).includes("`")
                        || (v.task.brief || []).some(b => String(b).includes("`")),
    brief_lines_budget: 240,
    palette_source:   "js/vr.js COL literal"
  };
})()"""


def main():
    lid = next((a for a in sys.argv[1:] if not a.startswith("-")), "pr-l01")
    OUTDIR.mkdir(parents=True, exist_ok=True)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
    base = f"http://127.0.0.1:{PORT}/"
    rec = {"lesson": lid}

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])

        def page(vr):
            pg = b.new_page(viewport={"width": 1440, "height": 900})
            pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            if vr:
                pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                          "\nwindow.__dev.installRuntime({ forceInstall: true });")
            pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
              JSON.stringify({ key: 'parity', name: 'Parity probe', cls: '11A', school: 'MCS' })); } catch (e) {}""")
            return pg

        # which activity: the first written, marked question carrying a hint ladder
        pick = """(() => {
          const sc = NVRCore.exp.scenes[NVRCore.cur];
          for (let k = 0; k < sc.stations.length; k++)
            for (let i = 0; i < sc.stations[k].tasks.length; i++) {
              const t = sc.stations[k].tasks[i];
              if (t.t === 'code' && !['try','predict'].includes(t.kind || 'build') && t.hint)
                return [k, i];
            }
          return null; })()"""

        # ---- A. the page
        pg = page(False)
        pg.goto(base + "experience.html?id=" + lid); pg.wait_for_timeout(1600)
        where = pg.evaluate(pick)
        if not where:
            print("no written code activity in " + lid); return 1
        rec["station"], rec["task"] = where
        pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", where)
        pg.wait_for_timeout(900)
        pg.wait_for_function("() => !document.querySelector('#pyrun') || !document.querySelector('#pyrun').disabled",
                             timeout=120000)
        rec["screen"] = pg.evaluate(SCREEN)
        pg.screenshot(path=str(OUTDIR / f"screen-{lid}.png"))
        # the hint ladder, rung by rung, as the page gives it
        pg.evaluate("document.querySelector('#pyhint') && document.querySelector('#pyhint').click()")
        pg.wait_for_timeout(400)
        for _ in range(5):
            if not pg.evaluate("!!document.querySelector('#hmore')"): break
            pg.evaluate("document.querySelector('#hmore').click()"); pg.wait_for_timeout(250)
        rec["screen"]["hint_rungs"] = pg.evaluate(
            "[...document.querySelectorAll('.hrung h4')].map(h => h.textContent.trim())")
        rec["screen"]["hint_where"] = pg.evaluate(
            "(document.querySelector('#hwhere')||{textContent:null}).textContent")
        pg.screenshot(path=str(OUTDIR / f"screen-hint-{lid}.png"))
        pg.evaluate("document.querySelector('#hintclose').click()"); pg.wait_for_timeout(250)
        # and the teacher-help panel
        pg.evaluate("document.querySelector('#pyhelp').click()"); pg.wait_for_timeout(400)
        rec["screen"]["teacher_help"] = pg.evaluate(
            "[...document.querySelectorAll('.helpbody p')].map(e => e.textContent.trim())")
        rec["screen"]["teacher_help_buttons"] = pg.evaluate(
            "[...document.querySelectorAll('.helpbody button')].map(e => e.textContent.trim())")
        pg.close()

        # ---- B. the headset
        pg = page(True)
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(base + "experience.html?id=" + lid); pg.wait_for_timeout(1600)
        pg.click("#vrBtn"); pg.wait_for_timeout(1400)
        if not pg.evaluate("NVRCore.renderer.xr.isPresenting"):
            print("never entered VR"); return 1
        pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
        pg.wait_for_timeout(900)
        pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=120000)
        rec["vr"] = pg.evaluate(VRSHOW)
        pg.screenshot(path=str(OUTDIR / f"vr-{lid}.png"))
        # the hint ladder in the headset
        said = []
        for _ in range(5):
            pg.evaluate("NVRVR.vrCode && NVRVR.kbPanel.hits.find(h=>h.id==='chint') && NVRVR.kbPanel.hits.find(h=>h.id==='chint').fn()")
            pg.wait_for_timeout(300)
            r = pg.evaluate("NVRVR.vrCode ? NVRVR.vrCode.result : null")
            if r and r not in said: said.append(r)
            if pg.evaluate("!!NVRVR.vrDiag"): said.append("[diagram opened]"); break
        rec["vr"]["hint_rungs"] = said
        rec["vr"]["teacher_help"] = pg.evaluate(
            "NVRVR.kbPanel.hits.some(h => /help/i.test(h.id)) ? 'present' : 'absent'")
        pg.screenshot(path=str(OUTDIR / f"vr-hint-{lid}.png"))
        rec["vr"]["page_errors"] = [e for e in errs if "WebGL" not in e][:5]
        pg.close(); b.close()

    out = OUTDIR / f"parity-{lid}.json"
    out.write_text(json.dumps(rec, indent=2))
    print(json.dumps(rec, indent=2))
    print("\nwritten to " + str(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
