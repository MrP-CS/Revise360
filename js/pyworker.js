/* The Python runtime, kept in a worker.
 *
 * Two reasons it is not on the page. A pupil's first loop is quite often an
 * infinite one, and there is no way to interrupt Python once it is running -
 * the only cure is to kill the thread, which you can only do to a worker.
 * And loading it takes a few seconds, which would freeze the page.
 *
 * It is a module worker: Pyodide dropped classic-worker support, so
 * importScripts cannot load it any more.
 *
 * Messages in:  { id, kind: "init" }
 *               { id, kind: "run", code, stdin }
 * Messages out: { id, kind: "ready" | "result" | "progress", ... }
 */
import { loadPyodide } from "../vendor/pyodide/pyodide.mjs";

let py = null, loading = null;

function load() {
  if (loading) return loading;
  loading = (async () => {
    py = await loadPyodide({ indexURL: "../vendor/pyodide/" });
    // Pupils' programs are self-contained; nothing here should be reaching out.
    py.runPython("import sys\nsys.setrecursionlimit(300)\n");
    return py;
  })();
  return loading;
}

self.onmessage = async (e) => {
  const { id, kind, code, stdin, echo } = e.data || {};
  try {
    if (kind === "init") { await load(); self.postMessage({ id, kind: "ready" }); return; }
    if (kind !== "run") return;
    await load();

    const lines = (stdin || []).slice();
    let out = "";
    py.setStdout({ batched: (s) => { out += s + "\n"; } });
    py.setStderr({ batched: (s) => { out += s + "\n"; } });
    /* input() has to come from the test's own lines rather than block. Running
     * out of them is a real mistake a pupil makes - asking for more input than
     * the task gives - so it says so rather than returning empty strings for
     * ever and looking like a hang. */
    py.globals.set("__r360_lines", lines);
    py.globals.set("__r360_echo", !!echo);
    py.runPython([
      "import builtins",
      "def __r360_input(prompt=''):",
      "    if prompt: print(prompt, end='')",
      "    if len(__r360_lines) == 0:",
      "        raise EOFError('The program asked for more input than this test provides.')",
      "    v = __r360_lines.pop(0)",
      // Echoed when a pupil presses Run, so the console reads like a real one.
      // Not when marking, or the echo would end up in the output being checked.
      "    if __r360_echo: print(v)",
      "    return v",
      "builtins.input = __r360_input"
    ].join("\n"));

    let error = null;
    try {
      await py.runPythonAsync(code);
    } catch (err) {
      error = String(err.message || err);
    }
    self.postMessage({ id, kind: "result", stdout: out, error });
  } catch (err) {
    self.postMessage({ id, kind: "result", stdout: "", error: String(err && err.message || err) });
  }
};
