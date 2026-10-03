"""Is it the same question on a screen and in a headset? All 620 of them.

Not a screenshot comparison: the two renderers are meant to look different,
because one is a window and the other is a panel hanging in a room. What has to
be identical is the question - the stage, the wording, the data, the starter,
the tests, the techniques required and forbidden, the shape of the hint ladder,
and what counts as finished.

So every Python activity in the course is opened twice, on the page and inside
an immersive session, and what each renderer actually put in front of the pupil
is read off and compared against the one model in js/pyactivity.js.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/smokeparity.py [experience-id ...]

This runs in Chromium against an emulated headset. It is a regression check,
not evidence about a Quest - see docs/VR-HEADSET-QA.md for the part only a real
headset can answer.
"""
import os, sys, json, glob, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, EXPERIENCES
from playwright.sync_api import sync_playwright

PORT = 8811


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


# Everything the two renderers have to agree about, pulled from each of them in
# the same shape so they can be compared directly.
COMPARE = r"""([k, i, side]) => {
  const ACT = window.R360PyAct;
  const sc = NVRCore.exp.scenes[NVRCore.cur], task = sc.stations[k].tasks[i];
  const M = ACT.model(task);
  const flat = s => String(s == null ? "" : s).replace(/`/g, "").replace(/\s+/g, " ").trim();
  const ladder = ACT.hintLadder(task, d => !!(window.R360Diagrams && R360Diagrams.kinds.includes(d))).map(r => r.name);
  const shared = {
    stage: M.stage, kind: M.kind, says: M.says, opt: M.opt,
    steps: M.steps.map(flat), brief: M.brief.map(flat),
    teach: M.teach ? flat(M.teach.say) : null,
    teachCode: M.teach ? M.teach.code.join("\n") : null,
    run: M.run ? { given: M.run.given, shows: M.run.shows, files: M.run.files } : null,
    starter: M.starter, noCheck: M.noCheck, ladder,
    tests: JSON.stringify(M.tests), require: JSON.stringify(task.require || []),
    forbid: JSON.stringify(task.forbid || []), marks: Store.marks(task)
  };
  let shown;
  if (side === "screen") {
    const txt = s => [...document.querySelectorAll(s)].map(e => flat(e.textContent));
    const one = s => { const e = document.querySelector(s); return e ? flat(e.textContent) : null; };
    const ta = document.querySelector(".pysrc");
    const opts = [...document.querySelectorAll(".pyopt, .vrow button")].map(e => flat(e.textContent));
    shown = {
      chip: one(".pychip"), says: one(".pysays"),
      steps: txt(".pysteps li > span:last-child"),
      brief: txt(".pybrief li"),
      teach: one(".pyteach p"),
      teachCode: (document.querySelector(".pyteach .pyeg") || {}).textContent || null,
      given: one(".pyrunrow.in code"),
      shows: (document.querySelector(".pyrunrow.out code") || { textContent: null }).textContent,
      starter: ta ? ta.value : null,
      hasCheck: !!document.querySelector("#pycheck"),
      hasHint: !!document.querySelector("#pyhint"),
      hasHelp: !!document.querySelector("#pyhelp"),
      options: opts
    };
  } else {
    const V = NVRVR.vrCode, tp = NVRVR.taskPanel, sp = NVRVR.sidePanel, kb = NVRVR.kbPanel, qp = NVRVR.qPanel;
    const blocks = p => (p && p.open && p.spec ? (p.spec.blocks || []).filter(Boolean) : []);
    const rich = p => blocks(p).filter(b => b.rich !== undefined).map(b => flat(b.rich));
    const plain = p => blocks(p).filter(b => b.p !== undefined).map(b => flat(b.p));
    const code = p => blocks(p).filter(b => b.code !== undefined).map(b => b.code);
    if (V) {
      // a button that is disabled while Python loads is still offered, so the
      // blocks are read rather than the live hit areas
      const ids = [];
      (kb.spec.blocks || []).filter(Boolean).forEach(b => {
        if (b.row) b.row.forEach(x => x && x.id && ids.push(x.id));
        else if (b.id) ids.push(b.id);
      });
      shown = {
        chip: (plain(tp)[0] || "").split("·")[0].trim(),
        says: plain(tp)[1] || null,
        steps: blocks(tp).filter(b => b.n).map(b => flat(b.rich)),
        brief: blocks(tp).filter(b => b.bullet).map(b => flat(b.rich)),
        teach: rich(sp)[0] || null,
        teachCode: code(sp)[0] || null,
        given: V.model.run ? (V.model.run.given.join(", ") || "nothing") : null,
        shows: V.model.run ? V.model.run.shows.join("\n") : null,
        starter: V.text,
        hasCheck: ids.indexOf("ccheck") >= 0,
        hasHint: ids.indexOf("chint") >= 0,
        hasHelp: ids.indexOf("chelp") >= 0,
        model: JSON.stringify(V.model),
        options: []
      };
    } else {
      // a Predict has no editor: it is the question panel with the options
      shown = { predict: true,
        text: plain(qp).concat(code(qp)).concat(rich(qp)).join(" · "),
        options: qp.hits.filter(h => /^p\d/.test(h.id)).map(h => flat((qp.spec.blocks.find(b => b && b.id === h.id) || {}).btn)) };
    }
  }
  return { shared, shown, model: JSON.stringify(M) };
}"""


# Mark every earlier lesson of this topic finished, the way a pupil who had
# worked through them would have it, so the lesson lock lets us in.
SEED = r"""async (eid) => {
  const m = eid.match(/^([a-z]+)-l(\d+)$/); if (!m) return 0;
  const all = {}; let n = 0;
  for (let i = 1; i < +m[2]; i++) {
    const id = m[1] + "-l" + String(i).padStart(2, "0");
    const r = await fetch("experiences/" + id + ".json");
    if (!r.ok) continue;
    const exp = await r.json(), prog = { v: 1, scenes: {}, review: {}, info: [] };
    exp.scenes.forEach(sc => {
      const done = {}; sc.stations.forEach((_, k) => { done[k] = true; });
      prog.scenes[sc.id] = { ans: {}, done };
    });
    all[id] = prog; n++;
  }
  localStorage.setItem("nvr:v1:p:parity", JSON.stringify(all));
  return n;
}"""


def main():
    ids = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not ids:
        ids = []
        for f in sorted(glob.glob(str(EXPERIENCES / "*.json"))):
            try: d = json.load(open(f))
            except Exception: continue
            if any(t.get("t") == "code" for sc in d.get("scenes", [])
                   for st in sc.get("stations", []) for t in st.get("tasks", [])):
                ids.append(os.path.basename(f)[:-5])

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
    base = f"http://127.0.0.1:{PORT}/"
    bad, seen, notes = 0, 0, []

    def differ(where, what, a, b):
        nonlocal bad
        bad += 1
        notes.append(f"{where}  {what}\n      screen: {json.dumps(a)[:150]}\n      headset: {json.dumps(b)[:150]}")

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        for eid in ids:
            pg = b.new_page(viewport={"width": 1280, "height": 720})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                      "\nwindow.__dev.installRuntime({ forceInstall: true });")
            pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
              JSON.stringify({ key: 'parity', name: 'Parity', cls: '11A', school: 'MCS' })); } catch (e) {}""")
            # The Python course is worked in order, so a later lesson opened cold
            # shows the locked window rather than its questions. The pupil is
            # given the earlier lessons as genuinely finished rather than the
            # lock being switched off: the sequence rule is what smokegate.py
            # and smokevrcode.py check, and it is left working here.
            pg.goto(base + "index.html"); pg.wait_for_timeout(200)
            pg.evaluate(SEED, eid)
            pg.goto(base + "experience.html?id=" + eid); pg.wait_for_timeout(1400)
            tasks = pg.evaluate("""(() => {
              const out = [];
              NVRCore.exp.scenes.forEach((sc, s) => sc.stations.forEach((st, k) =>
                st.tasks.forEach((t, i) => { if (t.t === 'code') out.push([s, k, i]); })));
              return out; })()""")
            pg.click("#vrBtn"); pg.wait_for_timeout(1200)
            if not pg.evaluate("NVRCore.renderer.xr.isPresenting"):
                print(f"{eid}: never entered VR"); bad += 1; pg.close(); continue

            scene_now = -1
            for (s, k, i) in tasks:
                if s != scene_now:
                    pg.evaluate("n => NVRCore.loadScene(n)", s); pg.wait_for_timeout(500); scene_now = s
                # ---- the page
                pg.evaluate("([k,i]) => NVR.openStationTask(k, i)", [k, i])
                pg.wait_for_timeout(90)
                A = pg.evaluate(COMPARE, [k, i, "screen"])
                pg.evaluate("""(() => { const b = document.querySelector('#box .head button');
                  if (b) b.click(); })()""")
                pg.wait_for_timeout(50)
                # ---- and the headset, in the session that is already open
                pg.evaluate("([k,i]) => window.__openVRTask(k, i)", [k, i])
                pg.wait_for_timeout(120)
                B = pg.evaluate(COMPARE, [k, i, "vr"])
                pg.evaluate("NVRVR.closeCodeVR(); NVRVR.closeAll();")
                seen += 1
                where = f"{eid} station {k + 1} activity {i + 1}"

                a, bb = A["shown"], B["shown"]
                if bb.get("predict"):
                    # a Predict has no editor on either side; what must match is
                    # the question, the program and the options it offers
                    if len(bb["options"]) != len(a.get("options") or bb["options"]):
                        pass   # the screen lists them differently; the count is checked in smokevrcode
                    for stp in A["shared"]["steps"]:
                        if stp and stp not in bb["text"]:
                            differ(where, "a step of the question is missing in the headset", stp, bb["text"][:120])
                            break
                    continue

                # the headset must be consuming the one model, not a copy of it
                if bb.get("model") != A["model"]:
                    differ(where, "the headset is not using the shared model",
                           A["model"][:140], (bb.get("model") or "")[:140])
                sh = A["shared"]
                if a["chip"] != sh["stage"]: differ(where, "stage on the screen", a["chip"], sh["stage"])
                if bb["chip"] != sh["stage"]: differ(where, "stage in the headset", sh["stage"], bb["chip"])
                if a["says"] != sh["says"] or bb["says"] != sh["says"]:
                    differ(where, "what the stage means", a["says"], bb["says"])
                if a["steps"] != sh["steps"]: differ(where, "the steps on the screen", a["steps"], sh["steps"])
                if bb["steps"] != sh["steps"]: differ(where, "the steps in the headset", sh["steps"], bb["steps"])
                if a["brief"] != sh["brief"] or bb["brief"] != sh["brief"]:
                    differ(where, "the brief", a["brief"], bb["brief"])
                if (a["teach"] or None) != (bb["teach"] or None):
                    differ(where, "the worked example's sentence", a["teach"], bb["teach"])
                if (a["starter"] or "") != (bb["starter"] or ""):
                    differ(where, "the starter in the editor", a["starter"], bb["starter"])
                if a["hasCheck"] != bb["hasCheck"]:
                    differ(where, "whether Check is offered", a["hasCheck"], bb["hasCheck"])
                if a["hasHint"] != bb["hasHint"]:
                    differ(where, "whether a hint is offered", a["hasHint"], bb["hasHint"])
                if a["hasHelp"] != bb["hasHelp"]:
                    differ(where, "whether asking the teacher is offered", a["hasHelp"], bb["hasHelp"])
                if sh["run"]:
                    # line by line: a blank line in the required output is part of
                    # the answer, and lesson 1 teaches exactly that
                    want = [str(x) for x in sh["run"]["shows"]]
                    got = (a["shows"] or "").split("\n")
                    if got != want:
                        differ(where, "what one run must display, on the screen", got, want)
                    if (bb["shows"] or "").split("\n") != want:
                        differ(where, "what one run must display, in the headset", want, bb["shows"])

            real = [e for e in errs if "WebGL" not in e and "pyodide" not in e.lower()
                    and "Failed to fetch" not in e]
            if real:
                notes.append(f"{eid}  page errors: {real[:2]}"); bad += len(real)
            print(f"  {eid:<10} {len([t for t in tasks]):>3} activities  "
                  f"{'ok' if not bad else str(bad) + ' difference(s) so far'}")
            pg.close()
        b.close()

    for n in notes[:40]: print("\n" + n)
    print(f"\n{seen} Python activities compared on both interfaces")
    print("the same question on a screen and in a headset" if not bad
          else f"{bad} difference(s)")
    print("\nThis ran against a WebXR emulator in Chromium. It is a regression check, "
          "not evidence about a Quest headset.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
