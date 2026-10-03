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
#
# Read off the panels themselves - the blocks each one was given, and where its
# mesh ended up - rather than off the task data, so this records what a pupil
# would see and not what the code intended to show them.
VRSHOW = r"""(() => {
  const v = NVRVR.vrCode; if (!v) return { open: false };
  const kb = NVRVR.kbPanel, task = NVRVR.taskPanel, side = NVRVR.sidePanel;
  const blocks = p => (p && p.open && p.spec ? (p.spec.blocks || []).filter(Boolean) : []);
  const text = p => blocks(p).map(b => b.rich !== undefined ? b.rich
                                  : b.code !== undefined ? b.code
                                  : b.p !== undefined ? b.p
                                  : b.kv ? b.kv.filter(x => typeof x === "string").join(" ") : "")
                             .filter(s => s !== "");
  // a backtick that survives into PLAIN text is one the pupil would see; in a
  // rich block it is the mark the renderer turns into a boxed, coloured value
  const anyBacktick = p => blocks(p).some(b => b && b.p !== undefined && /`/.test(String(b.p)));
  // where each surface ended up, as degrees from where the pupil is looking
  const a = NVRVR.anchor;
  const place = m => {
    if (!a || !m || !m.visible) return null;
    const d = m.position.clone().sub(a.pos);
    const yaw = Math.atan2(d.x, d.z) - a.yaw;
    return { dist: +d.length().toFixed(2),
             yaw: Math.round(Math.atan2(Math.sin(yaw), Math.cos(yaw)) * 180 / Math.PI),
             pitch: Math.round(Math.asin(Math.max(-1, Math.min(1, d.y / d.length()))) * 180 / Math.PI) };
  };
  const M = v.model;
  return {
    open: true,
    task_panel:       text(task),
    task_title:       task.open && task.spec ? task.spec.title : null,
    side_panel:       text(side),
    side_title:       side.open && side.spec ? side.spec.title : null,
    stage_chip_shown: text(task).some(s => String(s).indexOf(M.stage) === 0),
    steps_numbered:   blocks(task).filter(b => b.n).length,
    teach_say_shown:  !!(M.teach && text(side).includes(M.teach.say)),
    teach_code_shown: !!(M.teach && M.teach.code.length && text(side).includes(M.teach.code.join("\n"))),
    teach_out_shown:  !!(M.teach && M.teach.out.length && text(side).includes(M.teach.out.join("\n"))),
    line_notes_shown: !!(M.teach && M.teach.lines.length),
    run_eg_shown:     !!M.run,
    starter:          v.text,
    console:          v.out || "Press Run to try your program.",
    state:            v.state,
    buttons:          kb.hits.filter(h => !/^key/.test(h.id)).map(h => h.id),
    keys:             kb.hits.filter(h => /^key/.test(h.id)).length,
    raw_backticks:    anyBacktick(task) || anyBacktick(side),
    layout:           { task: place(task.mesh), code: place(v.mesh),
                        side: place(side.mesh), keys: place(kb.mesh) },
    // the brand colours the panels are actually drawn in, and where they came from
    palette:          NVRVR.COL,
    palette_source:   "css/style.css :root, read at draw time"
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
        # the hint ladder in the headset: one rung, then "show me more"
        pg.evaluate("NVRVR.showHint()"); pg.wait_for_timeout(350)
        for _ in range(5):
            if not pg.evaluate("NVRVR.padPanel.hits.some(h => h.id === 'hmore')"): break
            pg.evaluate("NVRVR.padPanel.hits.find(h => h.id === 'hmore').fn()")
            pg.wait_for_timeout(350)
        rec["vr"]["hint_rungs"] = pg.evaluate(
            "(NVRVR.padPanel.spec.blocks||[]).filter(b => b && b.p && /^Step \\d+ of \\d+ \\u2014/.test(b.p)).map(b => b.p)")
        rec["vr"]["hint_where"] = pg.evaluate(
            "((NVRVR.padPanel.spec.blocks||[])[0]||{}).p || null")
        rec["vr"]["hint_diagram"] = pg.evaluate("!!NVRVR.vrDiag")
        rec["vr"]["program_kept"] = pg.evaluate("!!NVRVR.vrCode && NVRVR.vrCode.text.length > 0")
        pg.screenshot(path=str(OUTDIR / f"vr-hint-{lid}.png"))
        pg.evaluate("NVRVR.padPanel.hits.find(h => h.id === 'hclose').fn()"); pg.wait_for_timeout(300)
        # and the teacher-help panel
        pg.evaluate("NVRVR.showHelp()"); pg.wait_for_timeout(350)
        rec["vr"]["teacher_help"] = pg.evaluate(
            "(NVRVR.padPanel.spec.blocks||[]).filter(b => b && b.p).map(b => b.p)")
        rec["vr"]["teacher_help_buttons"] = pg.evaluate(
            "NVRVR.padPanel.hits.map(h => h.id)")
        pg.evaluate("NVRVR.padPanel.hits.find(h => h.id === 'hback').fn()"); pg.wait_for_timeout(250)
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
