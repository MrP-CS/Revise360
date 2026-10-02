/* Revise 360 - hint diagrams for the Python course (topic PY).
 *
 * Every coding question on the course carries a Hint button. These are what it
 * opens: the technique the question needs, never that question's answer.
 *
 * The reader is a fourteen-year-old who has just got the question wrong twice.
 * That is the whole design brief. So each one of these is deliberately bare:
 *
 *   - one idea per step, three or four steps;
 *   - at most two boxes on screen at once, usually one plus the thing it is
 *     acting on;
 *   - no history strips, no running tallies, no second "taken apart" panel;
 *   - nothing smaller than 18px, code at 20-22, headings at 26;
 *   - one caption per step, twelve words at the outside;
 *   - no annotations at all - if a picture needs a paragraph beside it, the
 *     picture is wrong;
 *   - a lot of empty canvas, because a pupil who is stuck cannot afford to
 *     hunt for the one thing that matters.
 *
 * All seven are Python 3. Every number drawn below was worked by hand first:
 *
 *   pyoutput    score = 0 -> score = 7.  print(score) shows 7.
 *               print("score") shows the five letters s c o r e.
 *   pyinput     input() returns "7" (str).  "7" + 2 is a TypeError.
 *               int("7") -> 7, and then 7 + 2 -> 9.
 *   pyarith     17 and 5.  17 / 5 -> 3.4   17 // 5 -> 3   17 % 5 -> 2
 *               (three whole fives, two counters left over)
 *   pyrange     range(5)    -> 0 1 2 3 4     5 is never handed out
 *               range(1, 5) -> 1 2 3 4       5 is never handed out
 *               range(1, 6) -> 1 2 3 4 5     6 is never handed out
 *   pyif        mark = 55.  55 >= 70 False, 55 >= 50 True -> "Merit",
 *               the last elif and the else are never looked at.
 *   pywhile     count = 3.  Prints 3, 2, 1, then 0 > 0 is False -> "Go!".
 *               Drop count = count - 1 and the test is True for ever.
 *   pyvalidate  while mark < 0 or mark > 100.  150 rejected, 72 accepted.
 *               Screen: Mark? 150 / Must be 0 to 100 / Mark? 72 / Thank you.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  const SZ = { title: 26, head: 18, body: 20, code: 22, value: 44, mid: 30 };

  // The language, said once, quietly, in the corner. No chip: it is not a thing
  // on the stage, it is a footnote.
  function lang(d) {
    d.text(952, 30, "Python 3", { size: SZ.head, weight: 700, align: "right",
                                  baseline: "middle", fill: d.c.dim, max: 160 });
  }

  /* The step caption. The engine's d.caption is 17px and 560 wide because it
   * shares the line with an annotation; these seven carry no annotation, so the
   * caption gets the whole width and a readable size. d.noCaption is honoured
   * exactly as the engine does it: on the web the caption is real text beside
   * the canvas, so the canvas copy is left out there. */
  function cap(d, s) {
    if (d.noCaption) return 0;
    return d.wrap(40, 498, s, 900, { size: SZ.body, lh: 26, fill: d.c.soft });
  }

  // A quiet 18px heading for the one thing it names.
  function head(d, hx, hy, s, col, align) {
    d.text(hx, hy, s, { size: SZ.head, weight: 700, baseline: "middle",
                        align: align || "left", fill: col || d.c.dim, max: 420 });
  }

  // A value in flight. Big enough to read while it moves.
  function flying(d, px, py, label, col) {
    d.chip(px, py, label, { fill: col, glow: true, size: 24, h: 42,
                            w: Math.max(56, d.measure(label, 24, 700) + 26) });
  }

  /* The program. Plain text, no panel around it: a box drawn round code is one
   * more region to take in, and the indentation already says where it starts.
   * The line being run gets a bar beside it rather than a filled highlight. */
  function prog(d, lines, px, y0, dy, o) {
    o = o || {};
    const c = d.c, size = o.size || SZ.code, max = o.max || 420;
    lines.forEach((L, i) => {
      const y = y0 + i * dy;
      const on = i === o.lit;
      const dead = o.dead && o.dead.indexOf(i) >= 0;
      if (on) d.line(px - 20, y - dy * .4, px - 20, y + dy * .4,
                     { stroke: c.edge, width: 5 });
      const size2 = d.text(px, y, L, {
        size, weight: 600, baseline: "middle", max,
        fill: on ? c.fg : dead ? c.dim : c.soft, alpha: dead ? .5 : 1 });
      if (dead && o.strike)
        d.line(px - 3, y, px + Math.min(max, d.measure(L, size2, 600)) + 3, y,
               { stroke: c.bad, width: 2.2, alpha: .8 });
    });
  }

  // A value sitting in a box, drawn big and centred. The box carries one thing.
  function value(d, b, s, o) {
    o = o || {};
    const c = d.c;
    d.box(b[0], b[1], b[2], b[3], {
      fill: o.fill || c.panel, stroke: o.stroke || c.line, on: o.on, r: 14 });
    if (s !== undefined && s !== null)
      d.text(b[0] + b[2] / 2, b[1] + b[3] / 2, String(s), {
        size: o.size || SZ.value, weight: 800, align: "center", baseline: "middle",
        fill: o.textFill || c.fg, max: b[2] - 36 });
  }

  // A small pointer triangle above something, for "this one".
  function tip(d, px, py, col) {
    d.path([[px - 10, py - 14], [px + 10, py - 14], [px, py]],
           { fill: col, stroke: null, width: 0 });
  }

  // =============================================================== PY: print
  A("pyoutput", function () {
    const H = 580;
    const LINES = ["score = 0", "score = 7", "print(score)", "print(\"score\")"];
    const LY = i => 140 + i * 56;                        // 140 .. 308
    const BOX = [560, 120, 340, 126];
    const SCR = [560, 302, 340, 128];

    const steps = [
      { name: "1. A name and a box", caption: "= puts a value into a box called score." },
      { name: "2. Replacing it", caption: "Storing 7 wipes the 0. One value at a time." },
      { name: "3. print shows it", caption: "print(score) shows what is in the box." },
      { name: "4. Quotes change it", caption: "Quotes print the word itself, not the box." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Variables: = stores it, print shows it", { size: SZ.title });
      lang(d);

      const land = d.seg(t, .18, .68);                   // the value arriving
      const val = s === 0 ? (land > .92 ? "0" : null)
                : s === 1 ? (land > .92 ? "7" : "0") : "7";

      prog(d, LINES, 76, 140, 56, { lit: s, max: 400 });

      // ---- the box -------------------------------------------------------
      // On the last step the box is never looked at, so it is left dim rather
      // than labelled: one less thing to read.
      head(d, BOX[0] + BOX[2], BOX[1] - 26, "score", null, "right");
      value(d, BOX, val === null ? "empty" : val, {
        fill: val === null ? "#141f36" : c.panel,
        stroke: s === 3 ? c.line : c.edge, on: s !== 3,
        size: val === null ? 24 : SZ.value,
        textFill: val === null ? c.dim : s === 3 ? c.dim : c.fg });

      // ---- the screen, only once something is printed ---------------------
      if (s >= 2) {
        head(d, SCR[0] + SCR[2], SCR[1] - 26, "the screen", null, "right");
        d.box(SCR[0], SCR[1], SCR[2], SCR[3], { fill: "#16233c", stroke: c.line, r: 14 });
        const printed = s === 2 ? d.seg(t, .3, .72) > .9 : true;
        if (printed)
          d.text(SCR[0] + 30, SCR[1] + 40, "7",
                 { size: 28, weight: 700, baseline: "middle", fill: c.ok, max: 280 });
        else
          d.text(SCR[0] + 30, SCR[1] + 40, "nothing yet",
                 { size: SZ.body, weight: 700, baseline: "middle", fill: c.dim, max: 280 });
        if (s === 3) {
          // typed out letter by letter: these are letters, not a value
          const n = Math.min(5, Math.floor(d.seg(t, .2, .8) * 5.999));
          if (n > 0)
            d.text(SCR[0] + 30, SCR[1] + 90, "score".slice(0, n),
                   { size: 28, weight: 700, baseline: "middle", fill: c.violet, max: 280 });
        }
      }

      // ---- what moves ------------------------------------------------------
      if (s <= 1 && land > 0 && land < 1) {
        const p = d.onCurve(250, LY(s), BOX[0] + BOX[2] / 2, BOX[1] + BOX[3] / 2, 40, land);
        flying(d, p[0], p[1], s === 0 ? "0" : "7", c.edge);
      }
      if (s === 2) {
        const f = d.seg(t, .3, .72);
        if (f > 0 && f < 1) {
          const p = d.onCurve(BOX[0] + 70, BOX[1] + BOX[3], SCR[0] + 42, SCR[1] + 30, -24, f);
          flying(d, p[0], p[1], "7", c.ok);
        }
      }

      cap(d, steps[s].caption);
    } };
  });

  // =============================================================== PY: input
  A("pyinput", function () {
    const H = 580;
    const LA = [90, 186, 300, 136], LB = [590, 186, 300, 136];
    const CODE = [
      "age = input(\"Age? \")",
      "print(age + 2)",
      "age = int(input(\"Age? \"))"
    ];

    const steps = [
      { name: "1. It comes back as text", caption: "input() hands back text, even when you type digits." },
      { name: "2. Text will not add", caption: "Text plus number stops the program. Python will not guess." },
      { name: "3. int() converts it", caption: "int() turns the text into a number. Now it adds." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("input() gives you text", { size: SZ.title });
      lang(d);

      prog(d, [CODE[s]], 76, 112, 56, { lit: 0, max: 740 });

      const f = d.seg(t, .22, .74);
      const arrived = f > .9;

      // ---- left: where the value comes from -------------------------------
      head(d, LA[0], LA[1] - 26, s === 0 ? "the user types" : s === 1 ? "age" : "input() gave");
      value(d, LA, s === 0 ? "Age? 7" : "\"7\"", {
        stroke: s === 0 ? c.info : c.violet, on: true,
        size: s === 0 ? SZ.mid : SZ.value });
      if (s > 0) head(d, LA[0], LA[1] + LA[3] + 24, "text (str)", c.violet);

      // ---- right: what happens to it --------------------------------------
      const bad = s === 1;
      head(d, LB[0], LB[1] - 26, s === 0 ? "age" : bad ? "age + 2" : "int() gives");
      if (s === 0) {
        value(d, LB, arrived ? "\"7\"" : "empty", {
          fill: arrived ? c.panel : "#141f36", stroke: arrived ? c.violet : c.line,
          on: arrived, size: arrived ? SZ.value : 24,
          textFill: arrived ? c.fg : c.dim });
        if (arrived) head(d, LB[0], LB[1] + LB[3] + 24, "text (str), not the number 7", c.violet);
      } else if (bad) {
        value(d, LB, arrived ? "TypeError" : "?", {
          fill: arrived ? "#4a1d1d" : c.panel, stroke: arrived ? c.bad : c.line,
          on: arrived, size: arrived ? SZ.mid : SZ.value,
          textFill: arrived ? c.fg : c.dim });
        if (arrived) head(d, LB[0], LB[1] + LB[3] + 24, "text and number will not add", c.bad);
      } else {
        value(d, LB, arrived ? "7" : "?", {
          fill: arrived ? "#1d4a35" : c.panel, stroke: arrived ? c.ok : c.line,
          on: arrived, textFill: arrived ? c.fg : c.dim });
        if (arrived) head(d, LB[0], LB[1] + LB[3] + 24, "number (int), so 7 + 2 is 9", c.ok);
      }

      // ---- the crossing ----------------------------------------------------
      const col = s === 0 ? c.violet : s === 1 ? c.bad : c.ok;
      const mid = LA[1] + LA[3] / 2;
      d.arrow(LA[0] + LA[2] + 24, mid, LB[0] - 24, mid, {
        stroke: col, width: 2.5, size: 10,
        label: s === 0 ? "input()" : s === 1 ? "+ 2" : "int()",
        labelSize: SZ.head, labelFill: col, ly: -40 });
      /* The value changes as it crosses: that swap is the whole lesson, so it
       * happens in flight rather than in a second panel. */
      if (f > 0 && f < 1) {
        const px = d.lerp(LA[0] + LA[2] + 30, LB[0] - 30, f);
        const late = f > .5;
        flying(d, px, mid,
               s === 0 ? (late ? "\"7\"" : "7") : s === 2 ? (late ? "7" : "\"7\"") : "\"7\"",
               s === 0 ? (late ? c.violet : c.info)
                       : s === 2 ? (late ? c.ok : c.violet) : c.violet);
      }

      cap(d, steps[s].caption);
    } };
  });

  // ============================================================ PY: arithmetic
  A("pyarith", function () {
    const H = 580;
    const OPS = [["17 / 5", "3.4"], ["17 // 5", "3"], ["17 % 5", "2"]];
    const BOX = [300, 110, 380, 128];
    const DY = 332;
    // 17 counters: three fives, then the two that are left over
    const DX = (function () {
      const out = []; let px = 132;
      for (let g = 0; g < 4; g++) {
        for (let i = 0; i < (g < 3 ? 5 : 2); i++) { out.push(px); px += 36; }
        px += 30;
      }
      return out;
    })();

    const steps = [
      { name: "1. / gives a decimal", caption: "17 / 5 is 3.4. A slash always gives a decimal." },
      { name: "2. // keeps whole lots", caption: "17 // 5 is 3: how many whole fives fit." },
      { name: "3. % keeps the leftover", caption: "17 % 5 is 2: what is left over." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("17 and 5: three ways to divide", { size: SZ.title });
      lang(d);

      const grow = s === 0 ? Math.min(17, Math.floor(d.seg(t, .05, .8) * 17.999)) : 17;
      const lit = s === 1 ? Math.floor(d.seg(t, .1, .8) * 3.999) : 3;
      const over = s === 2 ? d.seg(t, .15, .7) > .5 : false;

      // ---- the one box: the sum and its answer ----------------------------
      const ans = s === 0 ? (grow >= 17 ? OPS[0][1] : "")
                : s === 1 ? (lit > 0 ? String(Math.min(3, lit)) : "")
                : over ? OPS[2][1] : "";
      d.box(BOX[0], BOX[1], BOX[2], BOX[3], {
        fill: c.panel, stroke: c.edge, on: true, r: 14 });
      d.text(BOX[0] + BOX[2] / 2, BOX[1] + 38, OPS[s][0], {
        size: 28, weight: 700, align: "center", baseline: "middle",
        fill: c.soft, max: BOX[2] - 40 });
      d.text(BOX[0] + BOX[2] / 2, BOX[1] + 90, ans || "...", {
        size: SZ.value, weight: 800, align: "center", baseline: "middle",
        fill: ans ? c.edge : c.dim, max: BOX[2] - 40 });

      // ---- seventeen counters, in fives -----------------------------------
      head(d, DX[0] - 13, DY - 50, "seventeen counters, five at a time");
      DX.forEach((px, i) => {
        if (i >= grow) return;
        const group = i < 15 ? Math.floor(i / 5) : 3;
        const leftover = group === 3;
        let col = c.soft, glow = false;
        if (s === 1) {
          if (!leftover && group < lit) { col = c.edge; glow = true; }
          else if (leftover) col = "#3b4a63";
        } else if (s === 2) {
          if (leftover && over) { col = c.orange; glow = true; }
          else if (!leftover) col = "#3b4a63";
        }
        d.dot(px, DY, 13, { fill: col, glow });
      });

      cap(d, steps[s].caption);
    } };
  });

  // =============================================================== PY: range
  A("pyrange", function () {
    const H = 580;
    const ROWS = [
      { call: "for i in range(5):", vals: [0, 1, 2, 3, 4], stop: 5 },
      { call: "for i in range(1, 5):", vals: [1, 2, 3, 4], stop: 5 },
      { call: "for i in range(1, 6):", vals: [1, 2, 3, 4, 5], stop: 6 }
    ];
    const CW = 76, CH = 76, PITCH = 88, X0 = 120, CY = 244;

    const steps = [
      { name: "1. Up to, not including", caption: "range(5) hands out 0 to 4. The 5 never arrives." },
      { name: "2. A start value", caption: "range(1, 5) starts at 1 and still stops before 5." },
      { name: "3. Getting 1 to 5", caption: "Want 1 to 5? Write range(1, 6)." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("range(): the stop value is left out", { size: SZ.title });
      lang(d);

      const R = ROWS[s];
      const n = R.vals.length;
      const walk = Math.min(n - 1, Math.floor(d.seg(t, .08, .78) * (n - .001)));
      const crossed = d.seg(t, .8, .96);

      prog(d, [R.call], 76, 122, 50, { lit: 0, max: 740 });

      // ---- the values it really hands out ---------------------------------
      head(d, X0, CY - 36, "the values i is given");
      R.vals.forEach((v, k) => {
        const on = k === walk;
        const bx = X0 + k * PITCH;
        d.box(bx, CY, CW, CH, {
          fill: on ? "#2a3f68" : c.panel, stroke: on ? c.edge : c.line, on, r: 12 });
        d.text(bx + CW / 2, CY + CH / 2, String(v), {
          size: SZ.mid, weight: 800, align: "center", baseline: "middle",
          fill: k <= walk ? c.fg : c.dim, max: CW - 20, alpha: k <= walk ? 1 : .3 });
      });
      tip(d, X0 + walk * PITCH + CW / 2, CY - 8, c.edge);

      // ---- the stop value, on the far side of the fence -------------------
      const fx = X0 + n * PITCH + 18;
      d.line(fx, CY - 24, fx, CY + CH + 24, { stroke: c.dim, width: 2, dash: [6, 7] });
      const sx = fx + 34;
      d.box(sx, CY, CW, CH, { fill: "#1a1020", stroke: "#53345a", r: 12 });
      // cross first, number second: the pupil has to be able to read which
      // number it is that never arrives
      if (crossed > 0) {
        d.line(sx + 16, CY + 16, sx + CW - 16, CY + CH - 16,
               { stroke: c.bad, width: 3, alpha: crossed * .85 });
        d.line(sx + CW - 16, CY + 16, sx + 16, CY + CH - 16,
               { stroke: c.bad, width: 3, alpha: crossed * .85 });
      }
      d.text(sx + CW / 2, CY + CH / 2, String(R.stop), {
        size: SZ.mid, weight: 800, align: "center", baseline: "middle",
        fill: "#d2b6d8", max: CW - 20 });
      head(d, sx - 14, CY + CH + 34, "never handed out", c.bad);

      cap(d, steps[s].caption);
    } };
  });

  // ============================================================== PY: if/elif
  A("pyif", function () {
    const H = 580;
    const LINES = ["mark = 55", "if mark >= 70:", "    print(\"Distinction\")",
                   "elif mark >= 50:", "    print(\"Merit\")", "elif mark >= 40:",
                   "    print(\"Pass\")", "else:", "    print(\"Fail\")"];
    const LY = i => 108 + i * 37;                        // 108 .. 404
    const TEST = [548, 150, 360, 128];
    const OUT = [548, 326, 360, 118];

    const steps = [
      { name: "1. The first test fails", caption: "Tried from the top. 55 >= 70 is False." },
      { name: "2. The first true one runs", caption: "55 >= 50 is True, so Merit is printed." },
      { name: "3. The rest are skipped", caption: "Nothing below it is even looked at." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("if / elif / else: the first true one wins", { size: SZ.title });
      lang(d);

      const settled = d.seg(t, .15, .5) > .6;
      const lit = s === 0 ? 1 : s === 1 ? (settled ? 4 : 3) : 4;
      const dead = s === 2 ? [5, 6, 7, 8] : s === 0 ? [2] : [];

      prog(d, LINES, 76, 108, 37, { lit, max: 420, size: SZ.body,
                                    dead, strike: s === 2 });

      // ---- the test being asked ------------------------------------------
      if (s < 2) {
        const yes = s === 1 && settled;
        const no = s === 0 && settled;
        head(d, TEST[0], TEST[1] - 26, "the test being asked");
        d.box(TEST[0], TEST[1], TEST[2], TEST[3], {
          fill: yes ? "#1d4a35" : no ? "#4a1d1d" : c.panel,
          stroke: yes ? c.ok : no ? c.bad : c.line, on: settled, r: 14 });
        d.text(TEST[0] + TEST[2] / 2, TEST[1] + 44, s === 0 ? "55 >= 70" : "55 >= 50", {
          size: SZ.mid, weight: 800, align: "center", baseline: "middle",
          fill: c.fg, max: TEST[2] - 40 });
        d.text(TEST[0] + TEST[2] / 2, TEST[1] + 92,
               settled ? (yes ? "True" : "False") : "working it out", {
          size: settled ? 28 : SZ.body, weight: 800, align: "center", baseline: "middle",
          fill: yes ? c.ok : no ? c.bad : c.dim, max: TEST[2] - 40 });
      }

      // ---- what reached the screen ----------------------------------------
      const shown = (s === 1 && settled && d.seg(t, .6, .92) > .9) || s === 2;
      if (s >= 1) {
        head(d, OUT[0], OUT[1] - 26, "the screen");
        d.box(OUT[0], OUT[1], OUT[2], OUT[3], { fill: "#16233c", stroke: c.line, r: 14 });
        d.text(OUT[0] + 30, OUT[1] + OUT[3] / 2, shown ? "Merit" : "nothing yet", {
          size: shown ? 28 : SZ.body, weight: 700, baseline: "middle",
          fill: shown ? c.ok : c.dim, max: OUT[2] - 50 });
      }

      // ---- the jump past everything below ---------------------------------
      if (s === 2) {
        const g = d.seg(t, .15, .7);
        d.curve(452, LY(4) + 6, 452, LY(8) + 18, 54,
                { stroke: c.edge, width: 3.5, glow: true, alpha: g });
        head(d, 420, LY(6), "jumps past", c.edge, "right");
      }
      if (s === 1) {
        const f = d.seg(t, .6, .92);
        if (f > 0 && f < 1) {
          const p = d.onPath([[340, LY(4)], [470, OUT[1] + 56], [OUT[0] + 40, OUT[1] + 56]], f);
          d.chip(p[0], p[1], "Merit", { fill: c.ok, glow: true, size: SZ.body, h: 36 });
        }
      }

      cap(d, steps[s].caption);
    } };
  });

  // =============================================================== PY: while
  A("pywhile", function () {
    const H = 580;
    const LINES = ["count = 3", "while count > 0:", "    print(count)",
                   "    count = count - 1", "print(\"Go!\")"];
    const LY = i => 128 + i * 48;                        // 128 .. 320
    const CBOX = [566, 124, 342, 120];
    const TBOX = [566, 302, 342, 128];

    const steps = [
      { name: "1. The test comes first", caption: "Before any pass, Python asks: is count > 0?" },
      { name: "2. A pass, then back", caption: "True, so the body runs. count drops to 2." },
      { name: "3. The test goes false", caption: "More passes, until count is 0 and the test is False." },
      { name: "4. The loop with no end", caption: "Nothing changes count, so it never stops." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("while: test first, and something must change", { size: SZ.title });
      lang(d);

      const broken = s === 3;
      const beat = d.seg(t, .15, .7);

      let count, lit;
      if (broken) { count = 3; lit = t % .5 < .25 ? 1 : 2; }
      else if (s === 0) { count = 3; lit = 1; }
      // the value drops as the line that drops it is reached, not after it
      else if (s === 1) { count = t > .58 ? 2 : 3; lit = t < .45 ? 2 : 3; }
      else { count = beat > .6 ? 0 : 1; lit = count === 0 ? 4 : 2; }

      const test = count > 0;
      const settled = s === 0 ? beat > .5 : true;

      prog(d, LINES, 76, 128, 48, {
        lit, max: 420, dead: broken ? [3] : [], strike: broken });

      // ---- the variable ---------------------------------------------------
      head(d, CBOX[0], CBOX[1] - 26, "count");
      value(d, CBOX, count, { stroke: broken ? c.bad : c.edge, on: true });

      // ---- the test, asked before every pass ------------------------------
      head(d, TBOX[0], TBOX[1] - 26, "the test, before every pass");
      d.box(TBOX[0], TBOX[1], TBOX[2], TBOX[3], {
        fill: test ? "#1d4a35" : "#4a1d1d", stroke: test ? c.ok : c.bad,
        on: settled, r: 14 });
      d.text(TBOX[0] + TBOX[2] / 2, TBOX[1] + 44, count + " > 0", {
        size: SZ.mid, weight: 800, align: "center", baseline: "middle",
        fill: c.fg, max: TBOX[2] - 40 });
      d.text(TBOX[0] + TBOX[2] / 2, TBOX[1] + 92,
             settled ? (test ? "True, run the body" : "False, leave the loop") : "working it out", {
        size: SZ.body, weight: 800, align: "center", baseline: "middle",
        fill: settled ? (test ? c.ok : c.bad) : c.dim, max: TBOX[2] - 40 });

      // ---- the way back round ---------------------------------------------
      const round = broken ? 1 : s === 1 ? d.seg(t, .55, .95) : 0;
      d.curve(432, LY(3) + 6, 432, LY(1) + 8, 46, {
        stroke: round > .2 ? c.orange : "#2a3b56", width: round > .2 ? 3.5 : 1.8,
        glow: round > .2, dash: round > .2 ? null : [5, 5] });
      if (broken) {
        const p = d.onCurve(432, LY(3) + 6, 432, LY(1) + 8, 46, (t * 2.4) % 1);
        d.dot(p[0], p[1], 9, { fill: c.bad, glow: true });
      }

      cap(d, steps[s].caption);
    } };
  });

  // ============================================================ PY: validation
  A("pyvalidate", function () {
    const H = 580;
    const LINES = ["mark = int(input(\"Mark? \"))", "while mark < 0 or mark > 100:",
                   "    print(\"Must be 0 to 100\")", "    mark = int(input(\"Mark? \"))",
                   "print(\"Thank you\")"];
    const LY = i => 122 + i * 46;                        // 122 .. 306
    const SCR = [552, 118, 390, 230];
    const OUT = [["Mark? 150", "soft"], ["Must be 0 to 100", "bad"],
                 ["Mark? 72", "soft"], ["Thank you", "ok"]];

    const steps = [
      { name: "1. Ask once first", caption: "Ask once, above the loop. The user types 150." },
      { name: "2. Check the rule", caption: "Too big, so the loop runs and asks again." },
      { name: "3. Reject, then ask again", caption: "Say what is wrong, then ask again." },
      { name: "4. Accept and move on", caption: "In range, so the loop ends." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Validation: ask again until it is right", { size: SZ.title });
      lang(d);

      const beat = d.seg(t, .2, .72);
      const lines = s === 0 ? (beat > .7 ? 1 : 0)
                  : s === 1 ? 1
                  : s === 2 ? (beat > .8 ? 3 : beat > .3 ? 2 : 1)
                  : (beat > .5 ? 4 : 3);
      const lit = s === 0 ? 0 : s === 1 ? 1 : s === 2 ? (lines >= 3 ? 3 : 2) : 4;

      prog(d, LINES, 72, 122, 46, { lit, max: 460, size: SZ.body });

      // ---- the test, said in words, under the program ---------------------
      if (s === 1 || s === 3) {
        const ok = s === 3;
        d.text(72, 400, ok ? "72 is in range, so the test is False"
                           : "150 is over 100, so the test is True", {
          size: SZ.body, weight: 800, baseline: "middle",
          fill: ok ? c.ok : c.bad, max: 440, alpha: d.seg(t, .05, .35) });
      }

      // ---- the only box: what the user sees -------------------------------
      head(d, SCR[0], SCR[1] - 26, "what the user sees");
      d.box(SCR[0], SCR[1], SCR[2], SCR[3], { fill: "#16233c", stroke: c.line, r: 14 });
      if (!lines)
        d.text(SCR[0] + 30, SCR[1] + 46, "waiting", {
          size: SZ.body, weight: 700, baseline: "middle", fill: c.dim, max: 320 });
      for (let i = 0; i < lines; i++)
        d.text(SCR[0] + 30, SCR[1] + 46 + i * 48, OUT[i][0], {
          size: SZ.code, weight: 700, baseline: "middle",
          fill: OUT[i][1] === "bad" ? c.bad : OUT[i][1] === "ok" ? c.ok : c.soft,
          max: 330 });

      // ---- the way back round, drawn only when it is taken ----------------
      const round = s === 2 ? d.seg(t, .35, .9) : 0;
      d.curve(486, LY(3) + 6, 486, LY(1) + 8, 44, {
        stroke: round > .2 ? c.bad : "#2a3b56", width: round > .2 ? 3.5 : 1.8,
        glow: round > .2, dash: round > .2 ? null : [5, 5] });

      cap(d, steps[s].caption);
    } };
  });
})();
