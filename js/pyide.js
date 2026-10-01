/* The Revise 360 Python editor.
 *
 * A small editor with line numbers, syntax highlighting and a Run button, and
 * a runtime that is real CPython (Pyodide, served from this site rather than a
 * CDN) running in a worker so an infinite loop can be stopped.
 *
 * It is deliberately not a full IDE. A pupil writing an answer to Paper 2
 * Section B needs to type a dozen lines, run them, and see what came out.
 * Anything more is in the way.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- runtime
  const RUN = {
    worker: null, seq: 0, waiting: new Map(), state: "cold", listeners: [],
    on(f) { RUN.listeners.push(f); return () => { const i = RUN.listeners.indexOf(f); if (i >= 0) RUN.listeners.splice(i, 1); }; },
    say(s) { RUN.state = s; RUN.listeners.forEach(f => { try { f(s); } catch (e) { /* a listener must not stop the rest */ } }); }
  };

  function spawn() {
    const w = new Worker("js/pyworker.js", { type: "module" });
    w.onmessage = (e) => {
      const { id, kind } = e.data || {};
      const hit = RUN.waiting.get(id);
      if (!hit) return;
      if (kind === "ready" || kind === "result") { RUN.waiting.delete(id); hit.resolve(e.data); }
    };
    w.onerror = () => {
      // the whole worker fell over; fail everything outstanding rather than hang
      RUN.waiting.forEach(h => h.resolve({ kind: "result", stdout: "", error: "Python could not start." }));
      RUN.waiting.clear(); RUN.worker = null; RUN.say("error");
    };
    return w;
  }

  function post(msg, timeoutMs) {
    if (!RUN.worker) RUN.worker = spawn();
    const id = ++RUN.seq;
    return new Promise(resolve => {
      RUN.waiting.set(id, { resolve });
      RUN.worker.postMessage(Object.assign({ id }, msg));
      if (timeoutMs) setTimeout(() => {
        if (!RUN.waiting.has(id)) return;
        /* Nothing can interrupt Python mid-loop, so the thread goes and a fresh
         * one is started for the next run. This is what makes `while True:`
         * survivable rather than a page you have to close. */
        RUN.waiting.delete(id);
        if (RUN.worker) { RUN.worker.terminate(); RUN.worker = null; }
        RUN.say("idle");
        resolve({ kind: "result", stdout: "", error: "__timeout__" });
      }, timeoutMs);
    });
  }

  let readyOnce = null;
  function ready() {
    if (readyOnce) return readyOnce;
    RUN.say("loading");
    readyOnce = post({ kind: "init" }).then(r => { RUN.say("idle"); return r; });
    return readyOnce;
  }

  /* Runs code and returns { stdout, error, timedOut }. `error` is Python's own
   * message, tidied, because a pupil should learn to read the real one. */
  async function run(code, opts) {
    opts = opts || {};
    await ready();
    RUN.say("running");
    const r = await post({ kind: "run", code, stdin: opts.stdin || [], echo: !!opts.echo,
                          files: opts.files || {} }, opts.timeoutMs || 6000);
    RUN.say("idle");
    if (r.error === "__timeout__")
      return { stdout: "", error: "Your program was still running after " +
        Math.round((opts.timeoutMs || 6000) / 1000) + " seconds, so it was stopped. " +
        "The usual cause is a loop whose condition never becomes false.", timedOut: true };
    return { stdout: r.stdout || "", error: r.error ? friendly(r.error) : null, timedOut: false };
  }

  /* Python's tracebacks name files the pupil has never seen. The last line is
   * the part that matters, and a few of the common ones get a plain-English
   * sentence after them. */
  const HINTS = [
    [/^IndentationError/, "Python uses indentation to show what is inside a loop or an if. Check the spaces at the start of your lines."],
    [/^NameError: name '(.+)'/, "Nothing called $1 exists yet. Check the spelling, and that you gave it a value before using it."],
    [/^TypeError: can only concatenate str/, "You cannot join text and a number with +. Put the number inside str( )."],
    [/^TypeError: unsupported operand type\(s\) for [-+*\/]: 'str'/, "input() always gives text. Put it inside int( ) before doing sums with it."],
    [/^ValueError: invalid literal for int/, "int( ) was given something that is not a whole number."],
    [/^IndexError/, "You asked for a position that is not in the list. Remember the first item is at 0."],
    [/^ZeroDivisionError/, "Something divided by zero."],
    [/^SyntaxError/, "Python could not make sense of that line. Check for a missing colon, bracket or quotation mark."],
    [/^EOFError/, "The program asked for more input than this test gives it."]
  ];
  function friendly(msg) {
    const lines = String(msg).trim().split("\n");
    const last = lines[lines.length - 1].trim();
    for (const [re, hint] of HINTS) {
      const m = last.match(re);
      if (m) return last + "\n" + hint.replace("$1", m[1] || "");
    }
    return last;
  }

  // ---------------------------------------------------------------- editor
  const KEY = ("False None True and as assert async await break class continue def del elif else " +
    "except finally for from global if import in is lambda nonlocal not or pass raise return try " +
    "while with yield").split(" ");
  const BUILT = ("abs all any bool chr dict enumerate float input int len list max min open ord " +
    "print range reversed round set sorted str sum tuple type zip append").split(" ");
  const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  /* Highlights one line into HTML. The editor is a textarea with this drawn
   * behind it, which keeps real typing, selection, undo and screen-reader
   * support rather than reimplementing all of it on a div. */
  function paint(src) {
    let out = "";
    const re = /(#[^\n]*)|('''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
    let m;
    while ((m = re.exec(src))) {
      if (m[1]) out += `<i class="c">${esc(m[1])}</i>`;
      else if (m[2]) out += `<i class="s">${esc(m[2])}</i>`;
      else if (m[3]) out += `<i class="n">${esc(m[3])}</i>`;
      else if (m[4]) out += KEY.indexOf(m[4]) >= 0 ? `<i class="k">${m[4]}</i>`
                          : BUILT.indexOf(m[4]) >= 0 ? `<i class="b">${m[4]}</i>` : esc(m[4]);
      else if (m[5]) out += m[5];
      else out += `<i class="o">${esc(m[6])}</i>`;
    }
    return out;
  }

  /* Builds the editor into `host`. Returns { get, set, focus, destroy }. */
  function editor(host, initial) {
    host.classList.add("pyed");
    host.innerHTML = '<div class="pygut" aria-hidden="true"></div>' +
      '<div class="pywrap"><pre class="pyhl" aria-hidden="true"></pre>' +
      '<textarea class="pysrc" spellcheck="false" autocapitalize="off" autocomplete="off" ' +
      'autocorrect="off" aria-label="Your Python program"></textarea></div>';
    const gut = host.querySelector(".pygut");
    const hl = host.querySelector(".pyhl");
    const ta = host.querySelector(".pysrc");
    ta.value = initial || "";

    function sync() {
      const src = ta.value;
      hl.innerHTML = paint(src) + "\n";
      const n = src.split("\n").length;
      let g = "";
      for (let i = 1; i <= n; i++) g += i + "\n";
      gut.textContent = g;
      gut.scrollTop = ta.scrollTop;
      hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft;
    }
    ta.addEventListener("input", sync);
    ta.addEventListener("scroll", () => { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; });
    ta.addEventListener("keydown", e => {
      if (e.key === "Tab") {
        // Tab indents rather than leaving the editor. Escape then Tab still gets
        // out, so the window is still reachable from the keyboard alone.
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        if (s === en && !e.shiftKey) {
          ta.value = v.slice(0, s) + "    " + v.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 4;
        } else {
          const a = v.lastIndexOf("\n", s - 1) + 1;
          const block = v.slice(a, en);
          const done = e.shiftKey ? block.replace(/^ {1,4}/gm, "") : block.replace(/^/gm, "    ");
          ta.value = v.slice(0, a) + done + v.slice(en);
          ta.selectionStart = a; ta.selectionEnd = a + done.length;
        }
        sync();
      } else if (e.key === "Enter") {
        // keep the indentation of the line you were on, and add one after a colon
        const s = ta.selectionStart, v = ta.value;
        const line = v.slice(v.lastIndexOf("\n", s - 1) + 1, s);
        const pad = (line.match(/^ */) || [""])[0] + (/:\s*$/.test(line) ? "    " : "");
        if (!pad) return;
        e.preventDefault();
        ta.value = v.slice(0, s) + "\n" + pad + v.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 1 + pad.length;
        sync();
      }
    });
    sync();
    return {
      get: () => ta.value,
      set: v => { ta.value = v; sync(); },
      focus: () => ta.focus(),
      el: ta
    };
  }

  /* The same split the editor's highlighter uses, as data rather than HTML, so
   * the headset can paint code onto a canvas with the identical colours. */
  const COLS = { k: "#c792ea", b: "#7fb2ff", s: "#9fe6a0", n: "#ffcb6b", c: "#5d7290", o: "#b4c4dc", t: "#f0f4fa" };
  function tokens(line) {
    const out = [];
    const re = /(#[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
    let m;
    while ((m = re.exec(line))) {
      if (m[1]) out.push({ t: m[1], c: COLS.c });
      else if (m[2]) out.push({ t: m[2], c: COLS.s });
      else if (m[3]) out.push({ t: m[3], c: COLS.n });
      else if (m[4]) out.push({ t: m[4], c: KEY.indexOf(m[4]) >= 0 ? COLS.k : BUILT.indexOf(m[4]) >= 0 ? COLS.b : COLS.t });
      else if (m[5]) out.push({ t: m[5], c: COLS.t });
      else out.push({ t: m[6], c: COLS.o });
    }
    return out;
  }

  window.R360Py = { ready, run, editor, paint, tokens, colours: COLS, on: RUN.on, get state() { return RUN.state; } };
})();
