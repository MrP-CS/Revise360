"""Where does Python actually get to, link by link?

experience.html -> pyide.js -> Worker -> pyworker.js -> vendor/pyodide/pyodide.mjs
-> WASM -> R360Py.ready()

This walks that chain and times each link, on the page and again inside an
immersive session, and prints what each one did. It records; it does not guess.
A pass here is evidence about THIS browser on THIS machine and is not evidence
about a Quest headset.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/pytrace.py
"""
import os, sys, json, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
from playwright.sync_api import sync_playwright

PORT = 8801


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


# Each link, tried in order, with the real error kept rather than summarised.
CHAIN = r"""async () => {
  const t0 = performance.now(), log = [], ms = () => Math.round(performance.now() - t0);
  const step = async (name, fn) => {
    const a = performance.now();
    try { const v = await fn(); log.push({ step: name, ok: true, ms: Math.round(performance.now() - a), note: v || "" }); return v; }
    catch (e) { log.push({ step: name, ok: false, ms: Math.round(performance.now() - a), error: String(e && e.stack || e) }); throw e; }
  };
  try {
    await step("WebAssembly present", async () => typeof WebAssembly === "object" ? "yes" : (() => { throw new Error("no WebAssembly"); })());
    await step("module worker supported", async () => {
      let ok = false;
      const blob = URL.createObjectURL(new Blob(["export default 1;"], { type: "text/javascript" }));
      const w = new Worker(blob, { type: "module" }); ok = true; w.terminate(); URL.revokeObjectURL(blob);
      return ok ? "yes" : "no";
    });
    await step("fetch pyworker.js", async () => {
      const r = await fetch("js/pyworker.js");
      return r.status + " " + (r.headers.get("content-type") || "(no content-type)");
    });
    await step("fetch pyodide.mjs", async () => {
      const r = await fetch("vendor/pyodide/pyodide.mjs");
      return r.status + " " + (r.headers.get("content-type") || "(no content-type)");
    });
    await step("fetch pyodide.asm.wasm (head)", async () => {
      const r = await fetch("vendor/pyodide/pyodide.asm.wasm");
      const ct = r.headers.get("content-type") || "(no content-type)";
      const b = await r.arrayBuffer();
      return r.status + " " + ct + " " + b.byteLength + " bytes";
    });
    await step("WebAssembly.compile the real wasm", async () => {
      const r = await fetch("vendor/pyodide/pyodide.asm.wasm");
      const m = await WebAssembly.compileStreaming(r.clone());
      return "compiled, " + WebAssembly.Module.exports(m).length + " exports";
    });
    await step("spawn the real worker", async () => new Promise((res, rej) => {
      const w = new Worker("js/pyworker.js", { type: "module" });
      const to = setTimeout(() => { w.terminate(); rej(new Error("worker never answered an init in 180s")); }, 180000);
      w.onerror = e => { clearTimeout(to); rej(new Error("worker onerror: " + (e.message || "(no message)") + " @" + (e.filename || "?") + ":" + (e.lineno || "?"))); };
      w.onmessage = e => { clearTimeout(to); w.terminate(); res("init answered: " + JSON.stringify(e.data)); };
      w.postMessage({ id: 1, kind: "init" });
    }));
    await step("R360Py.ready()", async () => { await window.R360Py.ready(); return "state=" + window.R360Py.state; });
    await step("R360Py.run a program", async () => {
      const r = await window.R360Py.run("print(2+2)", { timeoutMs: 20000 });
      if (r.error) throw new Error(r.error);
      return JSON.stringify(r.stdout);
    });
  } catch (e) { /* the log already holds it */ }
  return { total: ms(), log, state: window.R360Py ? window.R360Py.state : "(no R360Py)" };
}"""


def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
    base = f"http://127.0.0.1:{PORT}/"
    out = {}

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        for mode in ("screen", "vr"):
            pg = b.new_page(viewport={"width": 1280, "height": 720})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append("console." + m.type + ": " + m.text) if m.type == "error" else None)
            pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            if mode == "vr":
                pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                          "\nwindow.__dev.installRuntime({ forceInstall: true });")
            pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
              JSON.stringify({ key: 'pytrace', name: 'Py trace', cls: '11A', school: 'MCS' })); } catch (e) {}""")
            pg.goto(base + "experience.html?id=pr-l01"); pg.wait_for_timeout(1500)
            if mode == "vr":
                pg.click("#vrBtn"); pg.wait_for_timeout(1400)
                if not pg.evaluate("NVRCore.renderer.xr.isPresenting"):
                    out[mode] = {"error": "never entered VR"}; pg.close(); continue
            out[mode] = pg.evaluate(CHAIN)
            out[mode]["page_errors"] = [e for e in errs if "WebGL" not in e][:6]
            pg.close()
        b.close()

    for mode, rec in out.items():
        print("=" * 62)
        print(mode.upper() + f"   total {rec.get('total', '?')} ms   final state {rec.get('state')}")
        for s in rec.get("log", []):
            mark = "ok  " if s["ok"] else "FAIL"
            print(f"  {mark} {s['ms']:>7} ms  {s['step']}")
            if s.get("note"): print(f"              {s['note']}")
            if s.get("error"): print(f"              {s['error'][:400]}")
        if rec.get("page_errors"): print("  page errors:", rec["page_errors"])
    print("\nThis ran in Chromium on a build machine. It is not evidence about a headset.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
