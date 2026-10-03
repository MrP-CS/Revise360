/* What a Python activity IS, said once.
 *
 * A pupil may start a question on a computer and finish it in a headset. The
 * two renderers look nothing alike - one is a window, the other is a panel
 * floating in a room - but the question has to be the same question: the same
 * stage, the same words, the same example, the same ladder of hints, the same
 * rule about when the next one opens, the same sentence when it goes wrong.
 *
 * So none of that lives in a renderer. js/player.js and js/vr.js both ask this
 * file what the activity is and what to say about it, and neither of them
 * decides. Nothing in here touches the DOM, a canvas or three.js: it is the
 * model, and the two renderers are views of it.
 *
 * What is NOT here, because it already has one home: what an activity is worth
 * (Store.marks), whether it is finished, and whether the next station opens
 * (core.gated / isComplete / lockedStation). Those were shared already.
 */
(function (root, factory) {
  const API = factory();
  if (typeof module === "object" && module.exports) module.exports = API;
  if (root) root.R360PyAct = API;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  /* The course releases a technique in stages - watch it work, say what it will
   * print, change one thing, fill a gap, fix a broken one, write it - and the
   * pupil is shown which stage they are on, because a task that says "Try it"
   * is read differently from one that says "Build it". The labels are
   * deliberately about the action, never about how able the pupil is: there is
   * no easy, medium or hard anywhere in this course. */
  const KINDS = {
    try:      { label: "Try it",      says: "Run this program and watch what it does. Nothing is marked." },
    predict:  { label: "Predict",     says: "Read the program and say what it will display. Then you will see." },
    change:   { label: "Change it",   says: "The program already works. Change the one thing asked for." },
    complete: { label: "Complete it", says: "Part of the program is missing. Fill in the gap." },
    debug:    { label: "Fix it",      says: "This program is broken. Find the mistake and put it right." },
    build:    { label: "Build it",    says: "Write the program yourself." }
  };
  const ORDER = ["try", "predict", "change", "complete", "debug", "build"];
  const kindOf = t => (t && KINDS[t.kind]) ? t.kind : "build";
  const stageOf = t => (t && t.opt) ? "Challenge" : KINDS[kindOf(t)].label;
  const OPT_SAYS = "The hardest one on this station. Take your time over it.";
  const saysOf = t => (t && t.opt) ? OPT_SAYS : KINDS[kindOf(t)].says;

  /* The house wording is one sentence per step - ask, work out, display - so
   * the sentences are the steps. The split has to step over the marked data:
   * "Display `Done!` on the next line" is one step, not two, and a task that
   * prescribes `3.5` or `Mr. Patel` must not break in the middle of it. */
  function splitSteps(q) {
    const s = String(q == null ? "" : q);
    const held = [];
    const masked = s.replace(/`[^`]*`/g, m => { held.push(m); return "\u0000" + (held.length - 1) + "\u0000"; });
    return masked.split(/(?<=[.?!])\s+(?=[A-Z])/)
      .map(x => x.trim().replace(/\u0000(\d+)\u0000/g, (_, i) => held[+i]))
      .filter(Boolean);
  }

  const arr = v => v == null ? [] : (Array.isArray(v) ? v : [v]);

  /* Which version of a question a saved draft belongs to.
   *
   * A pupil's half-written program is only worth restoring against the question
   * they were answering. If the starter changes, or the tests change, the draft
   * is answering a question that no longer exists and handing it back would be
   * worse than handing back nothing. So a draft carries this, and a draft whose
   * version does not match is dropped rather than shown.
   *
   * Deliberately not a cryptographic hash: it has to be computed the instant a
   * question opens, on both renderers, without waiting for anything. */
  function version(task) {
    const t = task || {};
    const src = String(t.starter || "") + "\u0000" + JSON.stringify(t.tests || [])
      + "\u0000" + JSON.stringify(t.require || []) + JSON.stringify(t.forbid || []);
    let h = 0;
    for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) | 0;
    return "v" + (h >>> 0).toString(36);
  }

  /* Everything a renderer needs in order to show one Python activity, in the
   * order a pupil meets it. A renderer picks what it can afford to draw; it
   * does not get to invent a different version of any of it. */
  function model(task) {
    const t = task || {};
    const kind = kindOf(t);
    const teach = t.teach || null;
    /* On a Try it the worked example and the program in the editor are the same
     * thing, so printing it again is the same lines twice. The sentence and the
     * line-by-line notes stay; the code itself is where it can be run. */
    const sameAsEditor = kind === "try";
    const code = teach && teach.code ? arr(teach.code) : [];
    /* What the program is given and what it must print, as one real run. Built
     * from the first test rather than written by hand, so it is on every
     * question, in the same place, and can never disagree with marking. This is
     * what stops a pupil guessing whether a value is typed in or just written
     * into the program - the commonest way a correct-looking answer fails. */
    const t0 = (t.tests || [])[0] || {};
    const shows = arr(t0.out);
    return {
      kind,
      stage: stageOf(t),
      says: saysOf(t),
      opt: !!t.opt,
      /* The question as steps rather than a paragraph. Backticks are left in:
       * marking the prescribed data is the renderer's job, and a voice wants
       * the sentence without them. */
      steps: splitSteps(t.q),
      question: String(t.q == null ? "" : t.q),
      brief: arr(t.brief),
      img: t.img || null,
      teach: !teach ? null : {
        say: teach.say || "",
        code: sameAsEditor ? [] : code,
        out: sameAsEditor ? [] : arr(teach.out),
        /* The line-by-line notes, already paired with the line they describe.
         * `n` is the line's number in the example, kept because a note may be
         * missing from the middle of a program and the numbering has to go on
         * matching the lines above it. */
        lines: (t.lines && code.length)
          ? code.map((c, i) => t.lines[i] ? { n: i + 1, code: String(c).trim(), note: t.lines[i] } : null).filter(Boolean)
          : []
      },
      run: !shows.length ? null : {
        files: Object.keys(t0.files || {}),
        given: arr(t0.in),
        shows
      },
      starter: t.starter || "",
      tests: t.tests || [],
      // A Try it has nothing to mark: running it is the activity.
      noCheck: kind === "try",
      hasHint: !!t.hint,
      /* What the first Run is given, so both renderers run the same thing. A
       * question with no tests at all - a Try it, usually - still names what is
       * typed in, on the task itself. */
      runInput: (t.tests || []).length
        ? { stdin: arr(t0.in).slice(), files: t0.files || {} }
        : { stdin: arr(t.in).slice(), files: {} }
    };
  }

  /* A hint is a ladder, not a door. The first rung names the idea, the second
   * shows the shape of the Python, the third shows how it starts, and the last
   * one animates the technique. Nobody is handed the finished program: the top
   * of the ladder is still only the technique on different data.
   *
   * `hasDiagram` is asked rather than assumed, because the screen and the
   * headset mount a diagram differently and a kind one of them cannot draw must
   * not appear as a rung it then cannot climb. */
  function hintLadder(task, hasDiagram) {
    const raw = task && task.hint;
    if (!raw) return [];
    const h = typeof raw === "string" ? { diagram: raw } : raw;
    const rungs = [];
    if (h.think) rungs.push({ name: "Think", kind: "say", text: h.think });
    if (h.syntax) rungs.push({ name: "The Python you need", kind: "code", code: arr(h.syntax) });
    if (h.start) rungs.push({ name: "How it starts", kind: "code", code: arr(h.start) });
    if (h.walk) rungs.push({ name: "Work it through", kind: "steps", steps: arr(h.walk) });
    if (h.diagram && (!hasDiagram || hasDiagram(h.diagram)))
      rungs.push({ name: "Watch the technique", kind: "diagram", diagram: h.diagram });
    return rungs;
  }

  /* Some activities cannot be judged by their output at all - a program told to
   * pick a random number between 4 and 4 looks exactly like one that prints 4 -
   * so the technique itself is required, or a shortcut is forbidden. Used only
   * where running the code genuinely cannot tell, never for style. Returns the
   * feedback to give, or null to go on and run the tests. */
  function rules(task, src) {
    const text = String(src == null ? "" : src);
    const broke = (task.forbid || []).find(f => text.indexOf(f[0]) >= 0);
    if (broke) return { ok: false, head: "Not allowed here.", text: broke[1] };
    const absent = (task.require || []).find(f => text.indexOf(f[0]) < 0);
    if (absent) return { ok: false, head: "Not quite.", text: absent[1] };
    return null;
  }

  /* Programming is trial and error, so a code question is never locked after one
   * check the way a multiple-choice question is: the pupil keeps the best mark
   * they reach, and the help gets more specific the more they try. */
  function grade(max, passed, total) {
    return { passed, total, max, got: total ? Math.round(max * passed / total) : 0,
             all: total > 0 && passed === total };
  }

  /* Every sentence either renderer says to a pupil about a Python activity. One
   * copy, so a pupil cannot be told two different things about the same answer
   * depending on what they are wearing. */
  const SAY = {
    // the line under the result while they keep trying
    tryLine(attempts, all) {
      if (all) return "";
      if (attempts <= 1) return "Change one thing and check again. Keeping your best mark.";
      if (attempts === 2) return "Still not there. The Hint button explains the technique this question needs.";
      return `Attempt ${attempts}. Open the hint, then come back and change one thing at a time.`;
    },
    // what a finished activity says: a plain tick and the technique named
    doneHead: "✓ Nice work.",
    doneAll: (task, total) => `${(task && task.fb) || ""} All ${total} tests passed.`,
    doneTry: task => (task && task.fb) || "You ran a Python program and saw what it displayed.",
    // and what an unfinished one says
    missHead: (passed, total, best, max) =>
      `${passed} of ${total} tests passed - best so far ${best} of ${max} marks.`,
    missText: task => (task && task.fb) ||
      "Look at the first test that failed and work out what your program displayed instead.",
    // a Try it that was broken before it was run
    tryBroken: "That program should run as it is. Put back anything you have changed, then press Run again.",
    emptyOutput: "Your program ran but displayed nothing.",
    beforeRun: "Press Run and anything your program displays appears here.",
    // one failed test, said in a sentence - used where there is no room for rows
    whyFailed(t, result) {
      const want = ((t && t.out) || []).join("\n");
      const given = ((t && t.in) || []).join(", ");
      const head = given ? `With ${given} it should print ${want}. ` : `It should print ${want}. `;
      return head + (result.error ? String(result.error).split("\n")[0]
        : "Yours printed " + ((result.stdout || "").trim() || "nothing") + ".");
    },
    // the hint ladder's own framing
    hintWhere: (shown, total) => total > 1
      ? `Step ${shown} of ${total}. Each step tells you a little more. None of them is the answer.`
      : "How this technique works — not the answer to this question.",
    hintKept: "Your program is still behind this panel, exactly as you left it.",
    hintMore: left => `Show me more (${left} left)`,
    /* Asking for help is an ordinary thing to do. It says so, it says nobody has
     * been told, and it says the question still has to be finished - because a
     * help button that quietly unlocked the next one would be a way round the
     * course rather than a way through it. */
    help: {
      title: "Asking for help",
      lead: "Nothing here is marked, and asking costs you nothing.",
      body: [
        "Not sure what to do next? That is OK. You can use a hint or ask your teacher for help. Show them this question and your code. Complete this question before moving on.",
        "Your teacher cannot see this screen. Put your hand up, or send them a message the way your school normally does, and show them this question.",
        "Something wrong with the question itself? Tell your teacher so it can be looked at. Reporting a fault does not finish the question."
      ],
      buttons: { hint: "Show a hint", example: "Review the example", back: "Keep trying" }
    },
    // the way on, and the way back round
    next: "Next question",
    finish: "Finish",
    again: "Try this one again",
    // what the runtime is doing
    starting: "Starting Python…",
    running: "Running…",
    marking: "Marking…",
    /* Python is a twelve-megabyte download. While it is on its way the hint and
     * the example are still there, because a pupil who cannot run anything can
     * still be reading, and a failure is something to press rather than
     * something to sit in front of. */
    runtimeRetry: "Try loading Python again",
    runtimeWaiting: "Python is still loading. The hint and the example are there while you wait.",
    runtimeStillHelp: "The hint and the example are still here, and so is your program.",
    /* When it will not start at all. It says what has not happened, what it has
     * not done - nothing is marked, nothing is unlocked, nothing is lost - and
     * gives a code to report, because "Python didn't work" is not something a
     * teacher or anybody else can act on. */
    down: {
      title: "Python could not start",
      body: "Your program is safe and nothing has been marked. This question is still to be completed.",
      connection: "Check the connection first: Python is about 12 MB and has to be downloaded. On school WiFi it can take a minute.",
      report: "Tell your teacher this code:",
      buttons: { retry: "Try again", close: "Close this question", teacher: "Ask your teacher" }
    }
  };

  return { KINDS, ORDER, kindOf, stageOf, saysOf, splitSteps, model, version, hintLadder, rules, grade, SAY };
});
