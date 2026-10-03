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
  /* Python is about twelve megabytes, and it arrives over whatever network the
   * school has. On a desktop that is a few seconds. In a headset it can be a
   * minute, and the thing that made it look broken was not the wait: it was
   * that the wait said nothing, could not end, and could not be tried again.
   *
   * So the runtime has four states a pupil can be shown, every one of them
   * reachable from every other:
   *
   *   cold     nothing has been asked for yet
   *   loading  it is on its way, and `note` says what it is doing
   *   ready    it works
   *   error    it did not arrive, `error` says so, and reset() tries again
   *
   * (`running` is `ready` with a program in it.) Nothing waits for ever, a
   * failure is never remembered as a success, and reset() is a real way back. */
  const LOAD_MS = 180000;   // the longest a load may take before it has failed
  const SLOW = "Python did not finish loading. It is about 12 MB, so a slow or " +
    "blocked connection is the usual cause. Press the button to try again.";
  const GONE = "Python could not start in this browser.";

  const RUN = {
    worker: null, seq: 0, waiting: new Map(),
    state: "cold", note: "", error: null, started: 0, listeners: [],
    on(f) { RUN.listeners.push(f); return () => { const i = RUN.listeners.indexOf(f); if (i >= 0) RUN.listeners.splice(i, 1); }; },
    say(s, note) {
      RUN.state = s;
      if (note !== undefined) RUN.note = note;
      const st = status();
      // a listener that throws must not stop the rest of them hearing
      RUN.listeners.forEach(f => { try { f(st.state, st); } catch (e) { /* carry on */ } });
    }
  };
  const status = () => ({ state: RUN.state, note: RUN.note, error: RUN.error,
    seconds: RUN.started ? Math.round((Date.now() - RUN.started) / 1000) : 0 });

  let readyOnce = null;

  /* The worker is gone and whatever was waiting on it will never be answered.
   * `readyOnce` goes with it: a load that failed must not be remembered as one
   * that worked, or every question after it skips the loading state and runs
   * against a runtime that is not there. */
  function lost(msg, state) {
    RUN.waiting.forEach(h => h.resolve({ kind: "result", stdout: "", error: msg }));
    RUN.waiting.clear();
    if (RUN.worker) { try { RUN.worker.terminate(); } catch (e) { /* already gone */ } RUN.worker = null; }
    readyOnce = null;
    RUN.error = state === "error" ? msg : null;
    RUN.say(state || "error", "");
  }

  function spawn() {
    const w = new Worker("js/pyworker.js", { type: "module" });
    w.onmessage = (e) => {
      const { id, kind, note } = e.data || {};
      // what it is doing, so a long wait can say so rather than sit still
      if (kind === "progress") { RUN.say(RUN.state, note || ""); return; }
      const hit = RUN.waiting.get(id);
      if (!hit) return;
      if (kind === "ready" || kind === "result") { RUN.waiting.delete(id); hit.resolve(e.data); }
    };
    w.onerror = (e) => lost(GONE + ((e && e.message) ? " (" + e.message + ")" : ""), "error");
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
        if (RUN.worker) { try { RUN.worker.terminate(); } catch (e) { /* gone */ } RUN.worker = null; }
        readyOnce = null;          // the next call loads it again, properly
        RUN.say("cold", "");
        resolve({ kind: "result", stdout: "", error: "__timeout__" });
      }, timeoutMs);
    });
  }

  /* Loads the runtime, and says so while it does. Resolves to { ok } rather
   * than throwing, so a caller that forgets to catch cannot leave a pupil
   * looking at a panel that never changes. */
  function ready() {
    if (readyOnce) return readyOnce;
    RUN.error = null; RUN.started = Date.now();
    RUN.say("loading", "Starting Python");
    readyOnce = post({ kind: "init" }, LOAD_MS).then(r => {
      if (r.error === "__timeout__") { lost(SLOW, "error"); return { ok: false, error: SLOW }; }
      if (r.error) { lost(r.error, "error"); return { ok: false, error: r.error }; }
      RUN.say("ready", "");
      return { ok: true };
    });
    return readyOnce;
  }

  /* Start fetching it before anybody asks, without blocking anything. Called
   * from the page once the scene is up, so a pupil who opens their first Python
   * question thirty seconds later finds it already there - and, in a headset,
   * so the download is not competing with the moment they put it on. It never
   * awaits, so it cannot consume the gesture a WebXR session has to start on. */
  function warm() { try { ready(); } catch (e) { /* warming is best effort */ } return status(); }

  /* A way back. The runtime is thrown away and the next call loads it again
   * from nothing, so a pupil whose Python failed has something to press rather
   * than a session to abandon. */
  function reset() { lost("", "cold"); RUN.error = null; RUN.note = ""; return status(); }

  /* Runs code and returns { stdout, error, timedOut }. `error` is Python's own
   * message, tidied, because a pupil should learn to read the real one. */
  async function run(code, opts) {
    opts = opts || {};
    /* If the runtime never arrived, say that rather than reporting it as a
     * fault in the pupil's program. They did not write the bug. */
    const up = await ready();
    if (up && up.ok === false) return { stdout: "", error: up.error, noRuntime: true };
    RUN.say("running");
    const r = await post({ kind: "run", code, stdin: opts.stdin || [], echo: !!opts.echo,
                          files: opts.files || {} }, opts.timeoutMs || 6000);
    if (RUN.state === "running") RUN.say("ready");
    if (r.error === "__timeout__")
      return { stdout: "", error: "Your program was still running after " +
        Math.round((opts.timeoutMs || 6000) / 1000) + " seconds, so it was stopped. " +
        "The usual cause is a loop whose condition never becomes false.", timedOut: true };
    return { stdout: r.stdout || "", error: r.error ? friendly(r.error) : null, timedOut: false };
  }

  /* Python's tracebacks name files the pupil has never seen. The last line is
   * the part that matters, and a few of the common ones get a plain-English
   * sentence after them.
   *
   * An error is said in three parts, and they are kept apart on purpose. The
   * first is Python's own words, which a pupil has to learn to read. The second
   * is what it probably means - probably, because the message names a symptom
   * and not always the cause, and telling a pupil the cause confidently and
   * wrongly sends them hunting in the wrong place. The third is a short list of
   * things to look at, which is what a teacher leaning over the desk would
   * actually say. Errors are a normal part of programming and the wording says
   * so rather than treating one as a failure. */
  const HINTS = [
    [/^IndentationError/, "Python uses the spaces at the start of a line to see what is inside a loop or an if.",
      ["Is every line inside the block indented by the same amount?", "Did you mix tabs and spaces?", "Does the line after a : go in four spaces?"]],
    [/^NameError: name '(.+)'/, "Nothing called $1 exists yet.",
      ["Is $1 spelled the same everywhere?", "Did you give $1 a value before using it?", "If $1 is text, does it need quotation marks around it?"]],
    [/^TypeError: can only concatenate str/, "You tried to join text and a number with +.",
      ["Put the number inside str( ) to turn it into text.", "Or print the parts separately, one in each print()."]],
    [/^TypeError: unsupported operand type\(s\) for [-+*\/]: 'str'/, "You tried to do a sum with text.",
      ["input() always gives text, even when the user types digits.", "Put it inside int( ) before doing sums with it."]],
    [/^ValueError: invalid literal for int/, "int( ) was given something that is not a whole number.",
      ["Does the value have a decimal point in it? float( ) handles those.", "Is there a space or a letter in the value?"]],
    [/^IndexError/, "You asked for a position that is not there.",
      ["The first item is at 0, so the last one is at len( ) - 1.", "Is the list as long as you think? print() it and look."]],
    [/^ZeroDivisionError/, "Something was divided by zero.",
      ["Could the value you divided by be 0?", "Check the count before dividing by it."]],
    [/^SyntaxError/, "Python could not make sense of that line.",
      ["Is a : missing at the end of an if, for, while or def?", "Are the quotation marks in a pair?", "Is a bracket missing or spare?"]],
    [/^EOFError/, "The program asked for more typed-in values than it was given.",
      ["Count the input() lines: is one more than the task needs?", "Is an input() inside a loop that runs too many times?"]]
  ];
  function friendly(msg) {
    const lines = String(msg).trim().split("\n");
    const last = lines[lines.length - 1].trim();
    for (const [re, means, checks] of HINTS) {
      const m = last.match(re);
      if (!m) continue;
      const fill = s => s.replace(/\$1/g, m[1] || "");
      return last + "\n\nWhat this probably means\n" + fill(means) +
        "\n\nCheck these things\n" + checks.map(c => "• " + fill(c)).join("\n");
    }
    return last;
  }

  // ---------------------------------------------------------------- editor
  /* The lexer and the colours live in js/pytok.js and css/pytok.css, so the
   * editor, the instructions, the headset and the printed worksheets all split
   * and colour Python the same way. This file used to carry its own copy of
   * both, in two slightly different versions. */
  const TOK = window.R360Tok;

  /* Highlights the program into HTML. The editor is a textarea with this drawn
   * behind it, which keeps real typing, selection, undo and screen-reader
   * support rather than reimplementing all of it on a div. */
  const paint = src => TOK.html(src, "i");

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
      if (e.key === "Escape") {
        /* Tab has to indent inside an editor, which would otherwise trap anyone
         * working from the keyboard. Escape is the way out: it moves to the
         * buttons rather than closing the window, and it does not reach the
         * window's own Escape handler, so no one loses their program by
         * pressing it. The line under the editor says so. */
        e.preventDefault(); e.stopPropagation();
        const row = host.closest(".pystage") || document;
        /* The first button that can actually take focus. Run is disabled while
         * the Python runtime is still downloading, and focusing a disabled
         * button does nothing at all - which left a keyboard user shut in the
         * editor for exactly as long as the wait lasted. */
        const live = [...row.querySelectorAll("button"), ...document.querySelectorAll("#box .head button")]
          .find(x => !x.disabled);
        if (live) live.focus();
        return;
      }
      if (e.key === "Tab") {
        // Tab indents rather than leaving the editor; Escape is how you leave.
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

  /* The same split, as data rather than HTML, so the headset can paint code
   * onto a canvas with the identical colours. One lexer, one colour table: the
   * canvas and the editor cannot disagree about what a token is or how it is
   * coloured, because neither of them decides. */
  const tokens = line => TOK.lex(line).map(x => ({ t: x.t, c: TOK.colours[x.k] }));

  window.R360Py = {
    ready, run, editor, paint, tokens, warm, reset,
    get colours() { return TOK.colours; },
    on: RUN.on, get state() { return RUN.state; }, get status() { return status(); }
  };
})();
