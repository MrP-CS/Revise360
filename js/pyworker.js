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

/* A twelve-megabyte download over a school network is not instant, and in a
 * headset it can be a minute. Saying which part is happening is the difference
 * between a wait and a hang, so each stage is reported as it starts. Pyodide
 * itself offers no byte counter, so these are stages rather than a percentage -
 * which is honest, where an invented bar would not be. */
function say(id, note) { self.postMessage({ id, kind: "progress", note }); }

function load(id) {
  if (loading) return loading;
  loading = (async () => {
    say(id, "Downloading Python (about 12 MB)");
    py = await loadPyodide({ indexURL: "../vendor/pyodide/" });
    say(id, "Starting it up");
    // Pupils' programs are self-contained; nothing here should be reaching out.
    py.runPython("import sys\nsys.setrecursionlimit(300)\n");
    return py;
  })();
  return loading;
}

self.onmessage = async (e) => {
  const { id, kind, code, stdin, echo, files } = e.data || {};
  try {
    if (kind === "init") { await load(id); self.postMessage({ id, kind: "ready" }); return; }
    if (kind !== "run") return;
    await load(id);

    /* File-handling questions need their file to exist. Pyodide has a virtual
     * filesystem, so each test writes its own fixtures before the program runs
     * and they are removed afterwards - otherwise a file written by one test
     * would still be there for the next one, and a program that never creates
     * it would pass. */
    const made = [];
    for (const name of Object.keys(files || {})) {
      try { py.FS.writeFile(name, files[name]); made.push(name); } catch (err) { /* nothing to undo */ }
    }

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
      /* A prompt belongs inside input() - it is how everyone writes Python, and
       * how every textbook teaches it. It used to be printed even while marking,
       * which put the prompt into the output being checked, so questions had to
       * tell pupils to leave the brackets empty. Now the prompt shows when they
       * press Run, where it is useful, and is left out of marking, where it is
       * noise. Either style passes. */
      "    if prompt and __r360_echo: print(prompt, end='')",
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
    // tidy up, including anything the program itself created
    for (const name of made) { try { py.FS.unlink(name); } catch (err) { /* already gone */ } }
    self.postMessage({ id, kind: "result", stdout: out, error });
  } catch (err) {
    self.postMessage({ id, kind: "result", stdout: "", error: String(err && err.message || err) });
  }
};
