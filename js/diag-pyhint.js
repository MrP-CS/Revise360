/* Revise 360 - hint diagrams for the Python course (topic PY).
 *
 * Every coding question on the course carries a Hint button. These are what it
 * opens: the technique the question needs, never that question's answer. The
 * reader is a beginner who is already stuck, so each one shows one small
 * machine working and says the thing the picture cannot.
 *
 * All seven are Python 3 and say so on the badge, because the course is Python
 * and the 2.2 set next door is partly exam reference language.
 *
 * Every number drawn below was worked by hand first:
 *
 *   pyoutput    score = 0 -> score = 7 -> score = score + 3 -> 10.
 *               print(score) puts 10 on the screen; print("score") puts the
 *               five letters s c o r e. The box has held 0, 7, 10; only 10 is
 *               still there.
 *   pyinput     input() returns "7" (str). "7" + "2" -> "72". "7" + 2 fails.
 *               int("7") -> 7, then 7 + 2 -> 9. float("3.5") -> 3.5.
 *               int("3.5") fails - 3.5 is not a whole number.
 *   pyarith     17 and 5.  17 / 5 -> 3.4   17 // 5 -> 3   17 % 5 -> 2
 *               17 ** 5 -> 1419857  (17, 289, 4913, 83521, 1419857)
 *               round(3.4) -> 3     round(10 / 3, 2) -> 3.33
 *               10 / 5 -> 2.0, not 2.
 *   pyrange     range(5)        -> 0 1 2 3 4        5 passes
 *               range(1, 5)     -> 1 2 3 4          4 passes
 *               range(0, 10, 2) -> 0 2 4 6 8        5 passes
 *               range(1, 6)     -> 1 2 3 4 5        5 passes
 *   pyif        mark = 55.  55 >= 70 False, 55 >= 50 True -> "Merit",
 *               the last elif and the else are never checked.
 *               Four separate ifs instead: "Merit" AND "Pass" both print.
 *               mark = 35: all three tests False, else prints "Fail".
 *   pywhile     count = 5. Printed 5 4 3 2 1, then 0 > 0 is False, "Go!".
 *               count = 0 at the start: nought passes, just "Go!".
 *               Drop count = count - 1 and the test is True for ever.
 *   pyvalidate  while mark < 0 or mark > 100.  150 rejected, 72 accepted.
 *               Screen: Mark? / Must be 0 to 100 / Mark? / Thank you.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  /* One line of program text. Local copies of the two helpers the 2.2 set uses,
   * so this file can be loaded on its own. */
  function code(d, tx, ty, s, o) {
    o = o || {};
    return d.text(tx, ty, s, {
      size: o.size || 15, weight: o.weight || 600, baseline: "middle",
      fill: o.fill || d.c.fg, max: o.max || 320, alpha: o.alpha, align: o.align
    });
  }

  // The language badge, top right. Python 3 on all seven.
  function lang(d, s) {
    const w = Math.max(112, Math.ceil(d.measure(s, 12, 700)) + 26);
    d.chip(944 - w / 2, 30, s, { fill: d.c.panel2, stroke: d.c.line, h: 24, size: 12,
                                 w, labelFill: d.c.soft });
  }

  /* A value in flight with its type written above it. The type tag is the whole
   * point of pyinput: a beginner cannot see that "7" and 7 are different things
   * until the difference is drawn on the value itself. */
  function flying(d, cx, cy, label, type, o) {
    o = o || {};
    const col = o.fill || d.c.edge;
    d.chip(cx, cy, label, { fill: col, glow: true, size: o.size || 16, h: 32, alpha: o.alpha });
    if (type)
      d.chip(cx, cy - 31, type, { fill: "#16233c", stroke: col, h: 20, size: 11,
                                  labelFill: col, alpha: o.alpha });
  }

  // A small pointer triangle above something, for "this one".
  function tip(d, px, py, col) {
    d.path([[px - 9, py - 12], [px + 9, py - 12], [px, py]], { fill: col, stroke: null, width: 0 });
  }

  // =============================================================== PY: print
  A("pyoutput", function () {
    const W = 980, H = 580;
    const LINES = ["score = 0", "score = 7", "score = score + 3",
                   "print(score)", "print(\"score\")"];
    const LY = i => 112 + i * 36;                       // 112 .. 256
    const HIST = [0, 7, 10];
    const BOXX = 560, BOXY = 272, BOXW = 290, BOXH = 68;
    const PILL = [660, 104, 266, 56];                   // right-hand side of the =

    const steps = [
      { name: "1. A name and a box", caption: "score = 0 makes a box called score and puts 0 in it. The name goes on the left, the value on the right." },
      { name: "2. Replacing it", caption: "score = 7 does not compare anything. It replaces what was in the box, so the 0 is gone." },
      { name: "3. Read, then write", caption: "The right side is worked out first. score is read as 7, 7 + 3 is 10, then 10 goes in." },
      { name: "4. print shows it", caption: "print(score) looks in the box and shows a copy. The box still holds 10 afterwards." },
      { name: "5. Quotes change it", caption: "print(\"score\") has quotes, so it shows the five letters. No box is looked at." },
      { name: "6. Only the latest", caption: "The box has held 0, then 7, then 10. Only 10 is still there. The earlier values are lost." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Variables: a name, a box, and print");
      lang(d, "Python 3");

      // ---- what is in the box right now ----------------------------------
      const land = d.seg(t, .22, .72);                 // the value arriving
      let val = null;
      if (s === 0) val = land > .9 ? 0 : null;
      else if (s === 1) val = land > .9 ? 7 : 0;
      else if (s === 2) val = d.seg(t, .25, .6) > .9 ? 10 : 7;
      else val = 10;

      // how many values the box has ever held
      let histN = 3;
      if (s === 0) histN = land > .9 ? 1 : 0;
      else if (s === 1) histN = land > .9 ? 2 : 1;
      const strike = s === 5 ? Math.floor(d.seg(t, .2, .85) * 2.999) : 0;

      // ---- the program ----------------------------------------------------
      d.box(34, 62, 420, 230, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 80, "the program", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 160 });
      LINES.forEach((L, i) => {
        const y = LY(i), lit = i === s && s < 5;
        if (lit) d.box(50, y - 15, 388, 30, { fill: "#2a3f68", stroke: c.edge, on: true, r: 7 });
        d.text(74, y, String(i + 1), { size: 11.5, weight: 700, align: "right",
               baseline: "middle", fill: lit ? c.edge : c.dim, max: 22 });
        code(d, 88, y, L, { max: 340, fill: lit ? c.fg : c.soft });
      });

      // ---- every value it has held ---------------------------------------
      d.box(34, 306, 420, 142, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 328, "every value score has held", { size: 12.5, weight: 800,
             fill: c.dim, baseline: "middle", max: 280 });
      HIST.forEach((v, i) => {
        const shown = i < histN, gone = i < strike, last = i === 2;
        d.box(56 + i * 84, 348, 78, 48, {
          fill: gone ? "#1a1020" : last && s === 5 ? "#1d4a35" : c.panel,
          stroke: gone ? "#3a2a3a" : last && s === 5 ? c.ok : c.line,
          on: last && s === 5, r: 8, label: shown ? String(v) : "", size: 24,
          labelFill: gone ? c.dim : c.fg, alpha: shown ? 1 : .25 });
        if (shown)
          d.text(95 + i * 84, 410, "line " + (i + 1), { size: 11, weight: 700,
                 align: "center", baseline: "middle", fill: gone ? c.bad : c.dim, max: 72 });
        if (gone)
          d.line(62 + i * 84, 372, 128 + i * 84, 372, { stroke: c.bad, width: 2.5 });
      });
      d.text(56, 432, s === 5 ? "the first two no longer exist anywhere"
                              : "a box keeps one value at a time",
             { size: 13, weight: 700, baseline: "middle",
               fill: s === 5 ? c.bad : c.dim, max: 380 });

      // ---- the line being run, taken apart --------------------------------
      d.box(466, 62, 480, 160, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(488, 84, "the line, taken apart", { size: 12.5, weight: 800,
             fill: c.dim, baseline: "middle", max: 240 });
      if (s <= 2) {
        d.box(490, 104, 124, 56, { fill: c.panel, stroke: c.info, r: 10,
              label: "score", size: 19, sub: "the name", subFill: c.soft });
        d.text(632, 132, "=", { size: 30, weight: 800, align: "center",
               baseline: "middle", fill: c.edge, max: 30 });
        const rhs = s === 0 ? "0" : s === 1 ? "7"
                  : t < .1 ? "score + 3" : t < .24 ? "7 + 3" : "10";
        d.box(PILL[0], PILL[1], PILL[2], PILL[3], { fill: c.panel, stroke: c.edge, on: true,
              r: 10, label: rhs, size: 22, sub: "worked out first", subFill: c.soft });
      } else if (s === 5) {
        d.box(490, 104, 436, 56, { fill: c.panel, stroke: c.ok, on: true, r: 10,
              label: "score", size: 22, sub: "one name, one value: the latest", subFill: c.soft });
      } else {
        d.box(490, 104, 436, 56, { fill: c.panel, stroke: s === 4 ? c.violet : c.edge,
              on: true, r: 10, label: s === 3 ? "print(score)" : "print(\"score\")", size: 22,
              sub: s === 3 ? "no =, so nothing is stored" : "quotes, so the letters themselves",
              subFill: c.soft });
      }

      // ---- memory ---------------------------------------------------------
      d.box(466, 236, 480, 104, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 258, "memory", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 140 });
      d.box(BOXX, BOXY, BOXW, BOXH, {
        fill: val === null ? "#141f36" : c.panel, stroke: s === 4 ? c.line : c.edge,
        on: s !== 4 && s !== 5 ? true : s === 5, r: 10,
        label: val === null ? "empty" : String(val), size: val === null ? 16 : 32,
        labelFill: val === null ? c.dim : c.fg, sub: "score", subFill: c.soft });
      if (s === 4) {
        // the box is not looked at at all, so say so beside it
        d.text(512, 306, "not read", { size: 13, weight: 800, baseline: "middle",
               fill: c.bad, align: "center", max: 80 });
      }

      // ---- the screen -----------------------------------------------------
      d.box(466, 354, 480, 94, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 376, "the screen", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 160 });
      const typed = s === 4 ? Math.min(5, Math.floor(d.seg(t, .25, .8) * 5.999)) : 5;
      const shown10 = s === 3 ? d.seg(t, .25, .6) > .85 : s > 3;
      const outs = s < 3 ? [] : s === 3 ? (shown10 ? [["10", c.ok]] : [])
                 : [["10", c.ok], ["score".slice(0, typed), c.violet]];
      if (!outs.length)
        d.text(490, 408, "nothing printed yet", { size: 14, weight: 700,
               baseline: "middle", fill: c.dim, max: 300 });
      outs.forEach((o, i) => {
        if (!o[0]) return;
        code(d, 490, 404 + i * 26, o[0], { size: 20, max: 300, fill: o[1] });
      });

      // ---- the journeys, drawn last ---------------------------------------
      if (s <= 1 && land > 0 && land < 1) {
        const p = d.onCurve(PILL[0] + PILL[2] / 2, PILL[1] + PILL[3], BOXX + 145, BOXY, 40, land);
        d.chip(p[0], p[1], String(s === 0 ? 0 : 7), { fill: c.edge, glow: true, size: 17, h: 32 });
      }
      if (s === 2) {
        const up = d.seg(t, .02, .2), down = d.seg(t, .25, .6);
        if (up > 0 && up < 1) {
          const p = d.onCurve(BOXX + 60, BOXY, 700, PILL[1] + PILL[3], -46, up);
          d.chip(p[0], p[1], "7", { fill: c.info, glow: true, size: 17, h: 32 });
        }
        if (down > 0 && down < 1) {
          const p = d.onCurve(PILL[0] + PILL[2] / 2, PILL[1] + PILL[3], BOXX + 145, BOXY, 40, down);
          d.chip(p[0], p[1], "10", { fill: c.edge, glow: true, size: 17, h: 32 });
        }
      }
      if (s === 3) {
        const f = d.seg(t, .25, .6);
        if (f > 0 && f < 1) {
          const p = d.onCurve(BOXX + 100, BOXY + BOXH, 560, 404, -30, f);
          d.chip(p[0], p[1], "10", { fill: c.ok, glow: true, size: 17, h: 32 });
        }
      }
      if (s === 4) {
        // the route print(score) would have taken, crossed out
        d.line(BOXX + 100, BOXY + BOXH, 592, 396, { stroke: "#4a3a4a", width: 2, dash: [5, 5] });
        const g = d.seg(t, .1, .5);
        d.line(612, 352, 652, 392, { stroke: c.bad, width: 3.5, alpha: g });
        d.line(652, 352, 612, 392, { stroke: c.bad, width: 3.5, alpha: g });
      }

      const notes = [
        ["Not maths", "= means put this in here. It is an instruction, not a claim that two things are equal.", [632, 132]],
        ["The old value is gone", "A box holds one value. Storing 7 wipes the 0. There is no undo and no history.", [BOXX + 14, BOXY + 56]],
        ["Read, then write", "The right side uses the old value. Only when it has an answer does the name get it.", [700, PILL[1] + PILL[3]]],
        ["Showing is not storing", "print puts a copy on the screen. Nothing is saved, so you cannot use it again later.", [560, 404]],
        ["Quotes mean these letters", "print(score) shows what is in the box. print(\"score\") shows the word itself.", [478, 306]],
        ["One value at a time", "A variable is a box, not a list. Only the latest value is still there to use.", [140, 372]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =============================================================== PY: input
  A("pyinput", function () {
    const W = 980, H = 580;
    const CODES = [
      ["age = input(\"Age? \")", "the program stops here and waits for the user"],
      ["age = input(\"Age? \")", "age now holds the text \"7\", not the number 7"],
      ["print(\"7\" + \"2\")", "both sides are text, so + sticks them together"],
      ["print(\"7\" + 2)", "one text, one number - Python will not guess"],
      ["age = int(input(\"Age? \"))", "int() turns the text into a whole number"],
      ["mass = float(input(\"Mass? \"))", "float() keeps the decimal point"]
    ];
    // what the variable at the end of the lane holds, per step
    const VAR = [
      ["age", "", null], ["age", "\"7\"", "str"], ["age", "\"7\"", "str"],
      ["age", "\"7\"", "str"], ["age", "7", "int"], ["mass", "3.5", "float"]
    ];
    const LANE = 190;                                  // the lane's centre line

    const steps = [
      { name: "1. The user types", caption: "input() prints the prompt and waits. The user types 7 and presses Enter." },
      { name: "2. It comes back as text", caption: "What comes back is text. The quotes show it: age holds \"7\", not 7." },
      { name: "3. Plus joins text", caption: "Both sides are text here, so plus sticks them together. You get \"72\", not 9." },
      { name: "4. Text plus number fails", caption: "Text plus number stops the program. Python will not turn one into the other." },
      { name: "5. int() converts", caption: "int() takes the text and hands back a whole number. Now 7 + 2 really is 9." },
      { name: "6. float() for decimals", caption: "float() keeps the decimal point. int(\"3.5\") fails, because 3.5 is not whole." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("input() always hands back text");
      lang(d, "Python 3");

      const gate = s === 4 ? "int()" : s === 5 ? "float()" : null;
      const gateCol = s === 5 ? c.teal : c.ok;
      const typed = s === 0 ? Math.min(1, Math.floor(d.seg(t, .04, .22) * 1.999)) : 1;

      // ---- the line being run ---------------------------------------------
      d.box(40, 58, 900, 74, { fill: "#16233c", stroke: c.line, r: 12 });
      code(d, 64, 86, CODES[s][0], { size: 19, max: 620, fill: c.fg });
      d.text(64, 114, CODES[s][1], { size: 13.5, weight: 700, baseline: "middle",
             fill: c.dim, max: 850 });

      // ---- the lane: user -> input() -> maybe a gate -> the variable -------
      const dim = s === 2 || s === 3 ? .45 : 1;
      const prompt = s === 5 ? "Mass? 3.5" : s === 0 && !typed ? "Age?" : "Age? 7";
      d.box(60, 150, 180, 80, { fill: c.panel, stroke: c.info, alpha: dim, r: 12,
            label: prompt, size: 20, sub: "the user types", subFill: c.soft });
      d.box(300, 150, 180, 80, { fill: c.panel, stroke: c.edge, on: s === 0, alpha: dim,
            r: 12, label: "input()", size: 20, sub: "hands back text", subFill: c.soft });
      if (gate)
        d.box(520, 150, 130, 80, { fill: "#1d4a35", stroke: gateCol, on: true, r: 12,
              label: gate, size: 19, sub: "converts", subFill: c.soft });
      d.box(680, 150, 180, 80, {
        fill: c.panel, stroke: VAR[s][2] === "str" ? c.violet : gate ? gateCol : c.line,
        on: s === 1 || !!gate, alpha: dim, r: 12,
        label: VAR[s][1] || "empty", size: 22, labelFill: VAR[s][1] ? c.fg : c.dim,
        sub: VAR[s][0], subFill: c.soft });
      // the type tag that rides with the value
      if (VAR[s][2])
        d.chip(770, 138, VAR[s][2], { fill: "#16233c", stroke: VAR[s][2] === "str" ? c.violet : gateCol,
               h: 20, size: 11, labelFill: VAR[s][2] === "str" ? c.violet : gateCol, alpha: dim });
      d.arrow(244, LANE, 296, LANE, { stroke: c.line, width: 2, size: 8, alpha: dim });
      if (gate) {
        d.arrow(484, LANE, 516, LANE, { stroke: c.line, width: 2, size: 8 });
        d.arrow(654, LANE, 676, LANE, { stroke: gateCol, width: 2.5, size: 8 });
      } else {
        d.arrow(484, LANE, 676, LANE, { stroke: c.line, width: 2, size: 8, alpha: dim });
      }

      // ---- what + does ----------------------------------------------------
      const joinLive = s === 2, failLive = s === 3;
      d.box(40, 258, 440, 190, { fill: "#16233c", stroke: joinLive || failLive ? c.edge : c.line,
            r: 14, on: joinLive || failLive });
      d.text(62, 280, "what + does", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 200 });
      // text + text
      const jf = joinLive ? d.seg(t, .2, .75) : s > 2 ? 1 : 0;
      d.box(62, 302, 72, 44, { fill: c.panel, stroke: c.violet, r: 9, label: "\"7\"",
            size: 20, alpha: joinLive || s > 2 ? 1 : .3 });
      d.text(150, 324, "+", { size: 20, weight: 800, align: "center", baseline: "middle",
             fill: c.soft, max: 24, alpha: joinLive || s > 2 ? 1 : .3 });
      d.box(166, 302, 72, 44, { fill: c.panel, stroke: c.violet, r: 9, label: "\"2\"",
            size: 20, alpha: joinLive || s > 2 ? 1 : .3 });
      d.arrow(252, 324, 288, 324, { stroke: c.dim, width: 2, size: 8, alpha: jf });
      d.box(300, 302, 158, 44, { fill: "#2f2347", stroke: c.violet, on: jf > .8, r: 9,
            label: "\"72\"", size: 20, alpha: jf });
      // text + number
      const ff = failLive ? d.seg(t, .2, .75) : s > 3 ? 1 : 0;
      d.box(62, 368, 72, 44, { fill: c.panel, stroke: c.violet, r: 9, label: "\"7\"",
            size: 20, alpha: failLive || s > 3 ? 1 : .3 });
      d.text(150, 390, "+", { size: 20, weight: 800, align: "center", baseline: "middle",
             fill: c.soft, max: 24, alpha: failLive || s > 3 ? 1 : .3 });
      d.box(166, 368, 72, 44, { fill: c.panel, stroke: c.ok, r: 9, label: "2",
            size: 20, alpha: failLive || s > 3 ? 1 : .3 });
      d.arrow(252, 390, 288, 390, { stroke: c.dim, width: 2, size: 8, alpha: ff });
      d.box(300, 368, 158, 44, { fill: "#4a1d1d", stroke: c.bad, on: ff > .8, r: 9,
            label: "TypeError", size: 15, alpha: ff });

      // ---- converting -----------------------------------------------------
      const intLive = s === 4, fltLive = s === 5;
      d.box(500, 258, 440, 190, { fill: "#16233c", stroke: intLive || fltLive ? c.ok : c.line,
            r: 14, on: intLive || fltLive });
      d.text(522, 280, "converting", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 200 });
      const kf = intLive ? d.seg(t, .2, .75) : s > 4 ? 1 : 0;
      d.box(522, 302, 84, 44, { fill: c.panel, stroke: c.violet, r: 9, label: "\"7\"",
            size: 20, alpha: intLive || s > 4 ? 1 : .3 });
      d.arrow(614, 324, 648, 324, { stroke: c.ok, width: 2, size: 8, alpha: kf,
              label: "int()", labelSize: 11, ly: -14 });
      d.box(660, 302, 70, 44, { fill: "#1d4a35", stroke: c.ok, on: kf > .8, r: 9,
            label: "7", size: 20, alpha: kf });
      d.text(748, 324, "then 7 + 2 is 9", { size: 15, weight: 700, baseline: "middle",
             fill: kf > .8 ? c.ok : c.dim, max: 180, alpha: Math.max(kf, .3) });
      const lf = fltLive ? d.seg(t, .2, .75) : 0;
      d.box(522, 368, 84, 44, { fill: c.panel, stroke: c.violet, r: 9, label: "\"3.5\"",
            size: 19, alpha: fltLive ? 1 : .3 });
      d.arrow(614, 390, 648, 390, { stroke: c.teal, width: 2, size: 8, alpha: lf,
              label: "float()", labelSize: 11, ly: -14 });
      d.box(660, 368, 90, 44, { fill: "#143a4a", stroke: c.teal, on: lf > .8, r: 9,
            label: "3.5", size: 20, alpha: lf });
      d.text(766, 390, "int(\"3.5\") fails", { size: 15, weight: 700, baseline: "middle",
             fill: lf > .8 ? c.bad : c.dim, max: 170, alpha: Math.max(lf, .3) });

      // ---- the value in flight, drawn last --------------------------------
      if (s === 0) {
        // the keystroke going from the user into input()
        const f = d.seg(t, .28, .72);
        if (f > 0 && f < 1)
          flying(d, d.lerp(150, 390, f), LANE, "7", null, { fill: c.info });
      }
      if (s === 1) {
        const f = d.seg(t, .12, .7);
        if (f > 0 && f < 1)
          flying(d, d.lerp(390, 680, f), LANE, "\"7\"", "str", { fill: c.violet });
      }
      if (gate) {
        /* The value disappears into the converter and comes out the other side
         * with a different type written on it. That swap is the whole lesson. */
        const f = d.seg(t, .05, .5);
        const px = d.lerp(490, 664, f);
        if (f > 0 && f < 1 && (px < 548 || px > 648)) {
          const done = px > 585;
          flying(d, px, LANE, done ? VAR[s][1] : s === 5 ? "\"3.5\"" : "\"7\"",
                 done ? VAR[s][2] : "str", { fill: done ? gateCol : c.violet });
        }
      }

      const notes = [
        ["It always waits", "input() stops the program dead. Nothing else happens until Enter is pressed.", [390, 230]],
        ["Digits are still text", "The quotes are the giveaway. \"7\" is a one-character string, not the number seven.", [748, 140]],
        ["Joining, not adding", "Plus between two strings sticks them together. \"7\" + \"2\" is \"72\".", [308, 340]],
        ["Python will not guess", "It refuses to mix text and numbers. The error is the rule, not a fault in your code.", [308, 406]],
        ["Convert as you read", "int(input(...)) does both jobs in one line. Most input bugs vanish once you do this.", [585, 150]],
        ["int or float?", "int() will not read \"3.5\" at all. Use float() for anything that is measured.", [585, 232]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ============================================================ PY: arithmetic
  A("pyarith", function () {
    const W = 980, H = 580;
    const TILES = [["17 / 5", "3.4"], ["17 // 5", "3"], ["17 % 5", "2"],
                   ["17 ** 5", "1419857"], ["round(10 / 3, 2)", "3.33"]];
    const TW = 172, TG = 12;
    const tx = i => 36 + i * (TW + TG);                 // 36 .. 772, ends 944
    const POW = [17, 289, 4913, 83521, 1419857];
    const GX = [60, 236, 412, 588], GW = [168, 168, 168, 100];

    const steps = [
      { name: "1. Seventeen into fives", caption: "Seventeen split into fives gives three full fives and two left over. Both numbers matter." },
      { name: "2. / gives a decimal", caption: "17 / 5 is 3.4. A single slash always gives a decimal, even when it divides exactly." },
      { name: "3. // keeps whole lots", caption: "17 // 5 is 3: how many whole fives fit. The leftover is thrown away, not rounded." },
      { name: "4. % keeps the leftover", caption: "17 % 5 is 2: what is left after the whole fives. That is the remainder." },
      { name: "5. ** is power", caption: "17 ** 5 multiplies 17 by itself five times. Powers get very big very fast." },
      { name: "6. round() tidies it", caption: "round(3.4) is 3. A second number inside the brackets says how many decimals to keep." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Dividing, powers and rounding");
      lang(d, "Python 3");

      const dots = s === 0 ? Math.min(17, Math.floor(d.seg(t, .05, .9) * 17.999)) : 17;
      const litFull = s === 2 ? Math.floor(d.seg(t, .12, .75) * 3.999) : s === 1 ? 3 : 0;
      const litOver = s === 3 ? d.seg(t, .15, .7) > .5 : false;
      const faded = s >= 4 ? .4 : 1;

      // ---- 17 counters, in fives ------------------------------------------
      GX.forEach((gx, gi) => {
        const full = gi < 3;
        const on = (full && s === 2 && gi < litFull) || (!full && litOver);
        d.box(gx, 78, GW[gi], 86, {
          fill: on ? (full ? "#2a3f68" : "#4a3a1d") : c.panel,
          stroke: on ? (full ? c.edge : c.orange) : c.line, on, r: 12, alpha: faded,
          label: "", sub: full ? "a five" : "left over", subSize: 12,
          subFill: on ? (full ? c.edge : c.orange) : c.dim });
        const n = full ? 5 : 2;
        for (let j = 0; j < n; j++) {
          const idx = full ? gi * 5 + j : 15 + j;
          if (idx >= dots) continue;
          d.dot(gx + (full ? 20 : 34) + j * 32, 108, 11, {
            fill: on ? (full ? c.edge : c.orange) : c.soft, glow: on, alpha: faded });
        }
      });
      d.box(704, 78, 242, 86, { fill: "#16233c", stroke: c.line, r: 12,
            label: "17 = 3 x 5 + 2", size: 20,
            sub: dots < 17 ? "counting: " + dots : "three whole fives, 2 over",
            subFill: c.soft, alpha: faded });

      // ---- the five operators, side by side -------------------------------
      TILES.forEach((T, i) => {
        const live = i === s - 1;
        const shown = s - 1 >= i;
        let res = T[1];
        if (i === 3 && live) res = String(POW[Math.min(4, Math.floor(d.seg(t, .12, .88) * 4.999))]);
        if (i === 4 && live) res = d.seg(t, .2, .6) > .5 ? "3.33" : "3.3333333";
        d.box(tx(i), 206, TW, 86, {
          fill: live ? "#2a3f68" : c.panel, stroke: live ? c.edge : c.line, on: live, r: 12,
          alpha: shown ? 1 : .35 });
        d.text(tx(i) + TW / 2, 234, T[0], { size: 16, weight: 700, align: "center",
               baseline: "middle", fill: shown ? c.fg : c.dim, max: TW - 20 });
        d.text(tx(i) + TW / 2, 268, shown ? res : "?", { size: 24, weight: 800,
               align: "center", baseline: "middle",
               fill: shown ? (live ? c.edge : c.ok) : c.dim, max: TW - 20 });
      });

      // ---- the working ----------------------------------------------------
      const WORK = [
        ["Three fives fit inside seventeen, and two counters are left over.",
         "Python gives you those two answers with two different operators.", ""],
        ["17 / 5  ->  3.4", "10 / 5  ->  2.0        a slash gives a decimal even here",
         "To store a whole number afterwards, use int() or //."],
        ["17 // 5  ->  3", "19 // 5  ->  3         still 3, so // is not rounding",
         "// answers: how many whole fives fit?"],
        ["17 % 5  ->  2", "20 % 5  ->  0          nothing left over, so 20 is a multiple of 5",
         "n % 2 == 0 is the usual test for an even number."],
        ["17 ** 5  =  17 x 17 x 17 x 17 x 17", "17, 289, 4913, 83521, 1419857",
         "Two stars. In Python the ^ key means something else entirely."],
        ["round(3.4)  ->  3", "round(10 / 3, 2)  ->  3.33",
         "round hands back a number, so you can still calculate with it."]
      ];
      d.box(36, 320, 908, 128, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(58, 342, "the working", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 200 });
      const rows = WORK[s];
      const reveal = i => d.seg(t, .1 + i * .22, .4 + i * .22);
      code(d, 58, 374, rows[0], { size: 17, max: 860, fill: c.fg, alpha: reveal(0) });
      if (rows[1]) code(d, 58, 402, rows[1], { size: 15.5, max: 860, fill: c.soft, alpha: reveal(1) });
      if (rows[2]) d.text(58, 430, rows[2], { size: 14, weight: 700, baseline: "middle",
                          fill: c.edge, max: 860, alpha: reveal(2) });

      // ---- the answer travelling out of the counters ----------------------
      if (s >= 1 && s <= 3) {
        const f = d.seg(t, .3, .85);
        if (f > 0 && f < 1) {
          const from = s === 3 ? 638 : 320;
          const p = d.onCurve(from, 164, tx(s - 1) + TW / 2, 206, 36, f);
          d.chip(p[0], p[1], TILES[s - 1][1], { fill: s === 3 ? c.orange : c.edge,
                 glow: true, size: 16, h: 30 });
        }
      }

      const notes = [
        ["Two answers, not one", "Splitting 17 into fives gives a count and a leftover. Python has an operator for each.", [320, 108]],
        ["Always a decimal", "One slash gives a decimal every time. 10 / 5 is 2.0, not 2.", [tx(0) + 10, 288]],
        ["Cut, not rounded", "// throws the leftover away. 19 // 5 is still 3, even though 19 is nearly 20.", [tx(1) + 10, 288]],
        ["The remainder is useful", "% 2 tells you odd or even. % 10 peels the last digit off a number.", [tx(2) + 10, 288]],
        ["Two stars, not a hat", "** is power in Python. The ^ key does something completely different.", [tx(3) + 10, 288]],
        ["round() is for showing", "Keep the full decimal while you calculate. Round it at the moment you print it.", [tx(4) + 10, 288]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =============================================================== PY: range
  A("pyrange", function () {
    const W = 980, H = 580;
    const ROWS = [
      { call: "range(5)", vals: [0, 1, 2, 3, 4], stop: 5 },
      { call: "range(1, 5)", vals: [1, 2, 3, 4], stop: 5 },
      { call: "range(0, 10, 2)", vals: [0, 2, 4, 6, 8], stop: 10 },
      { call: "range(1, 6)", vals: [1, 2, 3, 4, 5], stop: 6 }
    ];
    const RY = [134, 200, 266, 332], CW = 52, CH = 44, CG = 6, X0 = 196;
    const cx = k => X0 + k * (CW + CG) + CW / 2;
    const CODES = [
      ["range(5)", "the values it hands out, one at a time"],
      ["for i in range(5):", "    print(i)"],
      ["for i in range(1, 5):", "    print(i)"],
      ["for i in range(0, 10, 2):", "    print(i)"],
      ["how many passes?", "(stop - start) divided by step"],
      ["for i in range(1, 6):", "    print(i)"]
    ];
    const ROWOF = [0, 0, 1, 2, -1, 3];                  // which row each step is about

    const steps = [
      { name: "1. The values", caption: "range(5) hands out 0, 1, 2, 3, 4. The 5 is where it stops, so 5 never appears." },
      { name: "2. The loop variable", caption: "The for loop puts each value into i in turn. Five values means five passes." },
      { name: "3. A start value", caption: "With two numbers the first one is the start. range(1, 5) gives 1, 2, 3, 4." },
      { name: "4. A step value", caption: "With three numbers the last one is the step. range(0, 10, 2) counts up in twos." },
      { name: "5. How many passes", caption: "Count the values, not the numbers in the brackets. range(1, 5) runs four times." },
      { name: "6. Getting 1 to 5", caption: "To count 1 to 5, write range(1, 6). The stop is always one past the last value." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("range(): the stop value is never reached");
      lang(d, "Python 3");

      const row = ROWOF[s];
      const R = row >= 0 ? ROWS[row] : null;
      // how many values of this row have been handed out
      const walk = R ? Math.min(R.vals.length - 1, Math.floor(d.seg(t, .08, .88) * (R.vals.length - .001))) : -1;
      const grow = s === 0 ? Math.min(5, Math.floor(d.seg(t, .05, .72) * 5.999)) : 99;
      const counted = s === 4 ? Math.floor(d.seg(t, .1, .9) * 3.999) : 99;

      // ---- the line being run ---------------------------------------------
      d.box(36, 58, 908, 66, { fill: "#16233c", stroke: c.line, r: 12 });
      code(d, 60, 80, CODES[s][0], { size: 18, max: 860, fill: c.fg });
      code(d, 60, 106, CODES[s][1], { size: 15, max: 860, fill: c.soft });

      // ---- the four ranges, as the values they really make ----------------
      ROWS.forEach((Rw, ri) => {
        const live = ri === row;
        const dim = live ? 1 : s === 4 ? 1 : .34;
        d.text(182, RY[ri] + 14, Rw.call, { size: 14, weight: 800, align: "right",
               baseline: "middle", fill: live ? c.edge : c.soft, max: 150, alpha: dim });
        const nShown = live && s === 0 ? Math.min(Rw.vals.length, grow) : Rw.vals.length;
        d.text(182, RY[ri] + 36, (ri <= counted || s !== 4 ? Rw.vals.length + " values" : "?"),
               { size: 12.5, weight: 700, align: "right", baseline: "middle",
                 fill: s === 4 && ri <= counted ? c.ok : c.dim, max: 150, alpha: dim });
        Rw.vals.forEach((v, k) => {
          const on = live && k === walk && s !== 0 && s !== 4;
          d.box(X0 + k * (CW + CG), RY[ri], CW, CH, {
            fill: on ? "#2a3f68" : c.panel, stroke: on ? c.edge : c.line, on, r: 8,
            label: k < nShown ? String(v) : "", size: 20, alpha: k < nShown ? dim : .12 });
        });
        // the stop value, which is never handed out
        const sk = Rw.vals.length;
        const sx = X0 + sk * (CW + CG);
        const showStop = !live || s !== 0 || grow >= 5;
        d.box(sx, RY[ri], CW, CH, { fill: "#1a1020", stroke: live ? c.bad : "#3a2a3a", r: 8,
              label: String(Rw.stop), size: 20, labelFill: live ? c.bad : "#58445a",
              alpha: showStop ? dim : .12 });
        if (showStop) {
          d.line(sx + 8, RY[ri] + 8, sx + CW - 8, RY[ri] + CH - 8,
                 { stroke: live ? c.bad : "#58445a", width: 2.5, alpha: dim });
          d.line(sx + CW - 8, RY[ri] + 8, sx + 8, RY[ri] + CH - 8,
                 { stroke: live ? c.bad : "#58445a", width: 2.5, alpha: dim });
        }
        if (live && walk >= 0 && s !== 0 && s !== 4) tip(d, cx(walk), RY[ri] - 2, c.edge);
      });

      // ---- the loop variable ----------------------------------------------
      d.box(560, 128, 386, 96, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 150, "the loop variable", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 220 });
      const iv = R && walk >= 0 && s !== 0 && s !== 4 ? R.vals[walk] : null;
      d.box(640, 158, 230, 56, { fill: iv === null ? "#141f36" : c.panel,
            stroke: iv === null ? c.line : c.edge, on: iv !== null, r: 10,
            label: iv === null ? "not set" : String(iv), size: iv === null ? 15 : 24,
            labelFill: iv === null ? c.dim : c.fg, sub: "i", subFill: c.soft });

      // ---- the screen -----------------------------------------------------
      d.box(560, 238, 386, 210, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 260, "the screen", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 160 });
      if (R && s !== 0 && s !== 4) {
        for (let k = 0; k <= walk; k++)
          code(d, 584, 292 + k * 26, String(R.vals[k]), { size: 20, max: 300, fill: c.ok });
        d.text(584, 292 + (R.vals.length + 0.4) * 26, (walk + 1) + " of " + R.vals.length + " passes",
               { size: 13, weight: 700, baseline: "middle", fill: c.soft, max: 300 });
      } else if (s === 4) {
        const L = ["range(5): 5 - 0 = 5 values", "range(1, 5): 5 - 1 = 4 values",
                   "range(0, 10, 2): 10 / 2 = 5 values", "range(1, 6): 6 - 1 = 5 values"];
        L.forEach((l, i) => d.text(584, 296 + i * 30, l, { size: 14.5, weight: 700,
                  baseline: "middle", fill: i <= counted ? c.ok : c.dim, max: 340 }));
      } else {
        d.text(584, 296, "nothing printed yet", { size: 14, weight: 700,
               baseline: "middle", fill: c.dim, max: 300 });
      }

      // ---- the rule -------------------------------------------------------
      d.box(36, 392, 500, 56, { fill: "#16233c", stroke: c.line, r: 12 });
      d.text(58, 414, "last value = stop - step, never stop itself",
             { size: 14.5, weight: 800, baseline: "middle", fill: c.edge, max: 456 });
      d.text(58, 434, "the crossed cell is the stop. It is never handed out.",
             { size: 13, weight: 700, baseline: "middle", fill: c.soft, max: 456 });

      const notes = [
        ["Stop is a fence", "range(5) stops before 5. The values are 0, 1, 2, 3 and 4 - five of them.", [cx(5), RY[0] + 22]],
        ["i is handed each value", "i is not a counter you add to. The loop drops the next value into it.", [660, 186]],
        ["One number or two", "range(5) starts at 0. range(1, 5) starts at 1. The stop is still left out.", [cx(0), RY[1] + 22]],
        ["The third number jumps", "range(0, 10, 2) adds 2 each time. It lands on 8, and 10 is one jump too far.", [cx(4), RY[2] + 22]],
        ["Count, do not guess", "Passes = stop minus start, divided by the step. For range(1, 5) that is four.", [192, RY[1] + 36]],
        ["Stop one past the end", "Want 1 to 5? Write range(1, 6). This is the commonest off-by-one slip there is.", [cx(4), RY[3] + 22]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ============================================================== PY: if/elif
  A("pyif", function () {
    const W = 980, H = 580;
    const ELIF = ["mark = 55", "if mark >= 70:", "    print(\"Distinction\")",
                  "elif mark >= 50:", "    print(\"Merit\")", "elif mark >= 40:",
                  "    print(\"Pass\")", "else:", "    print(\"Fail\")"];
    const IFS = ["mark = 55", "if mark >= 70:", "    print(\"Distinction\")",
                 "if mark >= 50:", "    print(\"Merit\")", "if mark >= 40:",
                 "    print(\"Pass\")", "if mark < 40:", "    print(\"Fail\")"];
    const LY = i => 100 + i * 31;                       // 100 .. 348
    const TESTS = [[70, "Distinction"], [50, "Merit"], [40, "Pass"]];
    const TY = [102, 170, 238, 306];

    const steps = [
      { name: "1. A ladder of tests", caption: "mark holds 55. Below it sits a ladder of tests, tried from the top downwards." },
      { name: "2. The first is false", caption: "55 >= 70 is False, so the Distinction line is skipped. Python moves to the next test." },
      { name: "3. First true one wins", caption: "55 >= 50 is True, so Merit prints. This is the first test that came out true." },
      { name: "4. The rest are skipped", caption: "The last elif and the else are never even checked. One branch runs, and that is all." },
      { name: "5. Separate ifs", caption: "Change elif to if and every test is asked. 55 passes two of them, so two lines print." },
      { name: "6. else catches the rest", caption: "With mark = 35 every test is False. else has no test, so it catches what is left." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("if / elif / else: only one branch runs");
      lang(d, "Python 3");

      const sep = s === 4;                               // the separate-ifs version
      const mark = s === 5 ? 35 : 55;
      const LINES = (sep ? IFS : ELIF).slice();
      LINES[0] = "mark = " + mark;

      /* Which tests have been worked out, and what each one came to. With elif,
       * everything below the first true test is never looked at. */
      const reveal = s === 0 ? -1
                   : s === 1 ? (d.seg(t, .1, .4) > .5 ? 0 : -1)
                   : s === 2 ? (d.seg(t, .1, .4) > .5 ? 1 : 0)
                   : s === 3 ? 2
                   : Math.floor(d.seg(t, .1, .8) * 3.999);
      const verdict = i => mark >= TESTS[i][0];
      let firstTrue = -1;
      for (let i = 0; i < 3; i++) if (verdict(i)) { firstTrue = i; break; }
      const checked = i => (sep ? i <= reveal : i <= reveal && (firstTrue < 0 || i <= firstTrue));
      const ranBody = i => (sep ? verdict(i) && i <= reveal
                                : i === firstTrue && reveal >= i);
      const elseRan = s === 5 && firstTrue < 0 && reveal >= 3;

      // ---- the program ----------------------------------------------------
      d.box(34, 56, 470, 316, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 78, sep ? "four separate ifs" : "if, elif, elif, else",
             { size: 12.5, weight: 800, fill: sep ? c.bad : c.dim, baseline: "middle", max: 260 });
      LINES.forEach((L, i) => {
        const y = LY(i);
        const testIdx = i === 1 ? 0 : i === 3 ? 1 : i === 5 ? 2 : -1;
        const bodyIdx = i === 2 ? 0 : i === 4 ? 1 : i === 6 ? 2 : -1;
        const isElse = i === 7, isElseBody = i === 8;
        let lit = false, dead = false;
        if (i === 0) lit = s === 0;
        else if (testIdx >= 0) { lit = checked(testIdx); dead = !sep && !checked(testIdx) && s > 0; }
        else if (bodyIdx >= 0) { lit = ranBody(bodyIdx); dead = s > 0 && !ranBody(bodyIdx); }
        else if (isElse) { lit = sep ? reveal >= 3 : elseRan; dead = s > 0 && !sep && !elseRan && s !== 5; }
        else if (isElseBody) { lit = elseRan; dead = s > 0 && !elseRan && s !== 5; }
        if (lit) d.box(50, y - 13, 436, 26, { fill: "#2a3f68", stroke: c.edge, on: true, r: 6 });
        d.text(74, y, String(i + 1), { size: 11, weight: 700, align: "right",
               baseline: "middle", fill: lit ? c.edge : c.dim, max: 22 });
        code(d, 88, y, L, { max: 384, size: 14.5,
             fill: lit ? c.fg : dead ? c.dim : c.soft, alpha: dead ? .5 : 1 });
        if (dead && s >= 3)
          d.line(86, y, 86 + Math.min(382, d.measure(L, 14.5, 600)), y,
                 { stroke: c.bad, width: 1.8, alpha: .8 });
      });

      // ---- the tests, in the order they are tried -------------------------
      d.box(524, 56, 422, 316, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(546, 78, "each test, in order", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 200 });
      d.chip(888, 78, "mark = " + mark, { fill: c.panel2, stroke: c.info, h: 24, size: 12,
             labelFill: c.info });
      TESTS.forEach((T, i) => {
        const done = checked(i), ran = ranBody(i), v = verdict(i);
        const skipped = !sep && firstTrue >= 0 && i > firstTrue && reveal >= firstTrue;
        d.box(544, TY[i], 382, 56, {
          fill: ran ? "#1d4a35" : done ? (v ? "#1d4a35" : "#4a1d1d") : c.panel,
          stroke: ran || (done && v) ? c.ok : done ? c.bad : skipped ? "#3a2a3a" : c.line,
          on: done, r: 10, label: mark + " >= " + T[0], size: 18,
          labelFill: skipped ? c.dim : c.fg,
          sub: done ? (v ? "True  ->  print(\"" + T[1] + "\")" : "False  ->  skip these lines")
                    : skipped ? "not even checked" : "waiting",
          subFill: done ? (v ? c.ok : c.bad) : c.dim, subSize: 13 });
      });
      d.box(544, TY[3], 382, 56, {
        fill: elseRan ? "#1d4a35" : c.panel,
        stroke: elseRan ? c.ok : sep ? c.line : "#3a2a3a", on: elseRan, r: 10,
        label: sep ? mark + " < 40" : "else", size: 18,
        labelFill: elseRan || sep ? c.fg : c.dim,
        sub: elseRan ? "True  ->  print(\"Fail\")"
           : sep ? (mark < 40 ? "True" : "False  ->  skip these lines")
           : firstTrue >= 0 && reveal >= firstTrue ? "not even checked" : "no test of its own",
        subFill: elseRan ? c.ok : sep && mark >= 40 ? c.bad : c.dim, subSize: 13 });

      // ---- the screen -----------------------------------------------------
      d.box(34, 388, 912, 60, { fill: "#16233c", stroke: c.line, r: 12 });
      d.text(56, 406, "the screen", { size: 12, weight: 800, fill: c.dim,
             baseline: "middle", max: 160 });
      const flight = s === 2 ? d.seg(t, .45, .9) : 1;
      const out = [];
      for (let i = 0; i < 3; i++) if (ranBody(i) && flight > .92) out.push(TESTS[i][1]);
      if (elseRan) out.push("Fail");
      if (!out.length)
        d.text(200, 428, "nothing printed yet", { size: 14, weight: 700,
               baseline: "middle", fill: c.dim, max: 240 });
      out.forEach((o, i) => {
        d.box(200 + i * 196, 414, 182, 28, { fill: "#1d4a35", stroke: c.ok, on: true, r: 8,
              label: o, size: 16 });
      });
      if (sep && out.length > 1)
        d.text(600, 428, "two lines, from one value", { size: 13.5, weight: 800,
               baseline: "middle", fill: c.bad, max: 330 });

      // ---- the value arriving, and the jump past the rest -----------------
      if (s === 0) {
        const f = d.seg(t, .25, .8);
        if (f > 0 && f < 1)
          d.chip(d.lerp(220, 860, f), 94, "55", { fill: c.info, glow: true, size: 16, h: 30 });
      }
      if (s === 2) {
        const f = flight;
        if (f > 0 && f < 1) {
          const p = d.onCurve(300, LY(4), 291, 414, -40, f);
          d.chip(p[0], p[1], "Merit", { fill: c.ok, glow: true, size: 15, h: 30 });
        }
      }
      if (s === 3) {
        const g = d.seg(t, .2, .8);
        d.curve(498, LY(4), 498, LY(8) + 16, 38, { stroke: c.edge, width: 3, glow: true,
                alpha: g });
        d.text(512, LY(6), "jumps", { size: 11.5, weight: 800, baseline: "middle",
               fill: c.edge, max: 46, alpha: g });
      }

      const notes = [
        ["Order is everything", "Python starts at the top and works down. The order you write the tests in is the order tried.", [568, TY[0] + 28]],
        ["False skips its own body", "A false test skips only the lines indented under it. The next elif still gets a turn.", [568, TY[0] + 28]],
        ["First true one wins", "As soon as a test is true its body runs. Nothing below it is tried at all.", [568, TY[1] + 28]],
        ["Skipped means not read", "Python never even works out the other tests. That is what elif buys you.", [568, TY[2] + 28]],
        ["if is not elif", "Separate ifs are separate questions. 55 answers two of them, so two lines print.", [487, 414]],
        ["else is the catch-all", "else has no test of its own. Leave it out and a mark of 35 prints nothing.", [568, TY[3] + 28]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // =============================================================== PY: while
  A("pywhile", function () {
    const W = 980, H = 580;
    const FULL = ["count = 5", "while count > 0:", "    print(count)",
                  "    count = count - 1", "print(\"Go!\")"];
    const LY = i => 104 + i * 38;                       // 104 .. 256

    const steps = [
      { name: "1. Test first", caption: "count is 5. Before anything in the body runs, Python asks: is count > 0?" },
      { name: "2. The body runs", caption: "True, so the body runs. It prints 5, then takes 1 away from count." },
      { name: "3. Back to the test", caption: "Back to the test every time. Four more passes print 4, 3, 2 and 1." },
      { name: "4. The test goes false", caption: "count is now 0, so 0 > 0 is False. The loop is left and Go! prints." },
      { name: "5. No passes at all", caption: "Start with count = 0 and the test is False straight away. The body never runs." },
      { name: "6. The loop with no end", caption: "Take out the line that changes count and the test stays True. This loop never stops." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("while: the test comes before every pass");
      lang(d, "Python 3");

      const broken = s === 5;                            // nothing changes count
      const zero = s === 4;                              // false on the very first test
      const LINES = FULL.slice();
      if (zero) LINES[0] = "count = 0";

      /* count, how many passes have finished, and what the test came to. Step 3
       * replays four passes inside one step, so its phase comes from t. */
      let count, passes, printed;
      if (zero) { count = 0; passes = 0; printed = []; }
      else if (broken) {
        passes = Math.min(6, Math.floor(d.seg(t, .08, .9) * 6.999));
        count = 5; printed = new Array(passes).fill(5);
      } else if (s === 0) { count = 5; passes = 0; printed = []; }
      else if (s === 1) {
        const f = d.seg(t, .08, .6);
        count = f > .9 ? 4 : 5; passes = f > .9 ? 1 : 0; printed = f > .35 ? [5] : [];
      } else if (s === 2) {
        passes = 1 + Math.min(4, Math.floor(d.seg(t, .06, .92) * 4.999));
        count = 5 - passes; printed = [5, 4, 3, 2, 1].slice(0, passes);
      } else { count = 0; passes = 5; printed = [5, 4, 3, 2, 1]; }

      const testTrue = count > 0;
      const left = s === 3 && d.seg(t, .3, .7) > .5;     // the loop has been left
      const shout = s === 3 ? left : zero && d.seg(t, .3, .7) > .5;

      // which written line is lit
      let litLine = -1;
      if (s === 0) litLine = t < .4 ? 0 : 1;
      else if (s === 1) litLine = t < .5 ? 2 : 3;
      else if (s === 2) litLine = t % .4 < .2 ? 2 : 3;
      else if (s === 3) litLine = left ? 4 : 1;
      else if (zero) litLine = shout ? 4 : 1;
      else litLine = t % .4 < .2 ? 1 : 2;

      // ---- the program ----------------------------------------------------
      d.box(34, 58, 440, 250, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 80, broken ? "the line that moves count has gone" : "the program",
             { size: 12.5, weight: 800, fill: broken ? c.bad : c.dim,
               baseline: "middle", max: 380 });
      LINES.forEach((L, i) => {
        const y = LY(i), gone = (broken && i === 3) || (zero && (i === 2 || i === 3));
        const lit = i === litLine && !gone;
        if (lit) d.box(50, y - 15, 408, 30, { fill: "#2a3f68", stroke: c.edge, on: true, r: 7 });
        d.text(74, y, String(i + 1), { size: 11.5, weight: 700, align: "right",
               baseline: "middle", fill: lit ? c.edge : c.dim, max: 22 });
        code(d, 88, y, L, { max: 356, fill: lit ? c.fg : gone ? "#58445a" : c.soft,
             alpha: gone ? .6 : 1 });
        if (gone)
          d.line(86, y, 86 + Math.min(354, d.measure(L, 15, 600)), y,
                 { stroke: c.bad, width: 2.2 });
      });
      // the jump back to the test
      const jump = (s === 2 || broken) ? 1 : .25;
      d.curve(486, LY(broken ? 2 : 3) + 4, 486, LY(1) + 6, 26,
              { stroke: jump > .5 ? c.orange : "#2a3b56", width: jump > .5 ? 3 : 1.6,
                glow: jump > .5, dash: jump > .5 ? null : [4, 4] });

      // ---- the variable ---------------------------------------------------
      d.box(520, 58, 426, 100, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 80, "the variable", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 200 });
      d.box(560, 96, 346, 48, { fill: c.panel, stroke: broken ? c.bad : c.edge, on: true,
            r: 10, label: String(count), size: 24, sub: "count", subFill: c.soft });

      // ---- the test -------------------------------------------------------
      d.box(520, 172, 426, 104, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 194, "the test, before every pass", { size: 12.5, weight: 800,
             fill: c.dim, baseline: "middle", align: "right", max: 300 });
      const vShow = s === 0 ? d.seg(t, .4, .8) : 1;
      d.box(560, 208, 346, 52, {
        fill: testTrue ? "#1d4a35" : "#4a1d1d", stroke: testTrue ? c.ok : c.bad,
        on: true, r: 10, label: count + " > 0", size: 20,
        sub: vShow > .5 ? (testTrue ? "True  ->  run the body" : "False  ->  leave the loop")
                        : "working it out", subFill: testTrue ? c.ok : c.bad, subSize: 13 });

      // ---- the screen -----------------------------------------------------
      d.box(520, 290, 426, 158, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 312, "the screen", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 160 });
      const shown = printed.slice(0, broken ? 4 : 5);
      if (!shown.length && !shout)
        d.text(544, 338, "nothing printed yet", { size: 14, weight: 700,
               baseline: "middle", fill: c.dim, max: 300 });
      shown.forEach((v, i) => code(d, 544, 334 + i * 20, String(v),
            { size: 18, max: 300, fill: broken ? c.bad : c.ok }));
      if (broken && passes > 5)
        d.text(544, 424, "and on, and on, for ever", { size: 14, weight: 800,
               baseline: "middle", fill: c.bad, max: 340 });
      if (shout)
        code(d, 544, 334 + shown.length * 20, "Go!", { size: 18, max: 300, fill: c.info });

      // ---- the values count has held --------------------------------------
      d.box(34, 324, 440, 124, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 346, "the values count has held", { size: 12.5, weight: 800,
             fill: c.dim, baseline: "middle", max: 280 });
      const seen = broken ? [5, 5, 5, 5, 5, 5] : zero ? [0] : [5, 4, 3, 2, 1, 0].slice(0, passes + 1);
      for (let i = 0; i < 6; i++) {
        const has = i < seen.length;
        d.box(56 + i * 62, 366, 56, 44, {
          fill: has ? (seen[i] === 0 && !broken ? "#4a1d1d" : c.panel) : "#141f36",
          stroke: has ? (seen[i] === 0 && !broken ? c.bad : c.line) : "#223148", r: 8,
          label: has ? String(seen[i]) : "", size: 20, alpha: has ? 1 : .3 });
      }
      const done = s === 3 || zero;
      d.text(56, 428, broken ? "it never moves, so the test never goes false"
                   : zero ? "the test was false before the first pass"
                   : passes + (passes === 1 ? " pass" : " passes") +
                     (done ? " finished, then the test went false" : " finished so far"),
             { size: 13, weight: 700, baseline: "middle",
               fill: broken ? c.bad : c.soft, max: 400 });

      const notes = [
        ["Check, then do", "A while loop tests first. If the test is false at the start the body never runs.", [584, 234]],
        ["One pass is the whole body", "Every line of the body runs, top to bottom. Then control goes back to the test.", [584, 120]],
        ["Something must move", "count = count - 1 is what drags the test towards false. That line is the engine.", [486, LY(2) + 20]],
        ["False means leave", "The test is only looked at between passes, never halfway through the body.", [584, 234]],
        ["No passes is normal", "A while loop can run nought times. That is often exactly what you want.", [584, 234]],
        ["Spot it before you run it", "If no line in the body changes the tested variable, the loop can never stop.", [280, LY(3)]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ============================================================ PY: validation
  A("pyvalidate", function () {
    const W = 980, H = 580;
    const LINES = ["mark = int(input(\"Mark? \"))", "while mark < 0 or mark > 100:",
                   "    print(\"Must be 0 to 100\")", "    mark = int(input(\"Mark? \"))",
                   "print(\"Thank you\")"];
    const LY = i => 100 + i * 36;                       // 100 .. 244
    // the flow boxes: ask, check, accept, reject
    const ASK = [544, 98, 150, 50], CHK = [544, 170, 150, 50];
    const ACC = [544, 242, 150, 50], REJ = [764, 170, 160, 50];
    const mid = b => [b[0] + b[2] / 2, b[1] + b[3] / 2];

    const steps = [
      { name: "1. Ask once first", caption: "The program asks once, above the loop. The user types 150." },
      { name: "2. Check the rule", caption: "The test asks whether the value is bad. 150 is over 100, so it is True." },
      { name: "3. Reject and say why", caption: "Inside the loop a message says what was wrong. Then the loop asks again." },
      { name: "4. Ask again, inside", caption: "The second input is inside the loop. The user types 72, so mark changes." },
      { name: "5. Check again, accept", caption: "Now the test is False, because 72 is in range. The loop ends and Thank you prints." },
      { name: "6. One loop, two tries", caption: "Both values went through the same loop. Bad ones go round again, good ones fall out." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Validation: keep asking until it is right");
      lang(d, "Python 3");

      /* Where we are in the journey. Step 6 replays both attempts inside one
       * step, so its phase comes from t rather than from s. */
      const mark = s === 5 ? (t < .52 ? 150 : 72) : s >= 3 ? 72 : 150;
      const bad = mark > 100;
      const accepted = s === 4 ? d.seg(t, .2, .55) > .5 : s === 5 ? t >= .86 : false;
      const phase = s === 5 ? (t < .18 ? 0 : t < .36 ? 1 : t < .52 ? 2 : t < .68 ? 0 : t < .86 ? 1 : 3)
                  : s === 0 ? 0 : s === 1 ? 1 : s === 2 ? 2 : s === 3 ? 0
                  : accepted ? 3 : 1;
      // 0 ask, 1 check, 2 reject, 3 accept
      const litLine = phase === 0 ? (s >= 3 || (s === 5 && t >= .52) ? 3 : 0)
                    : phase === 1 ? 1 : phase === 2 ? 2 : 4;

      // ---- the program ----------------------------------------------------
      d.box(34, 56, 452, 244, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 78, "the validation loop", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 260 });
      LINES.forEach((L, i) => {
        const y = LY(i), lit = i === litLine;
        if (lit) d.box(48, y - 14, 420, 28, { fill: "#2a3f68", stroke: c.edge, on: true, r: 6 });
        d.text(72, y, String(i + 1), { size: 11, weight: 700, align: "right",
               baseline: "middle", fill: lit ? c.edge : c.dim, max: 22 });
        code(d, 86, y, L, { max: 372, size: 14.5, fill: lit ? c.fg : c.soft });
      });
      const pending = phase === 0;
      d.text(56, 274, pending ? "this value has not been checked yet"
             : mark + " < 0 or " + mark + " > 100   ->   " +
               (bad ? "True, go round again" : "False, leave the loop"),
             { size: 14, weight: 700, baseline: "middle",
               fill: pending ? c.dim : bad ? c.bad : c.ok, max: 410 });

      // ---- the shape of the loop ------------------------------------------
      d.box(506, 56, 440, 244, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 78, "the shape of the loop", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 260 });
      d.box(ASK[0], ASK[1], ASK[2], ASK[3], { fill: phase === 0 ? "#2a3f68" : c.panel,
            stroke: phase === 0 ? c.edge : c.line, on: phase === 0, r: 10,
            label: "ask", size: 17, sub: "input()", subFill: c.soft });
      d.box(CHK[0], CHK[1], CHK[2], CHK[3], { fill: phase === 1 ? "#2a3f68" : c.panel,
            stroke: phase === 1 ? c.edge : c.line, on: phase === 1, r: 10,
            label: "check", size: 17, sub: "while test", subFill: c.soft });
      d.box(ACC[0], ACC[1], ACC[2], ACC[3], { fill: phase === 3 ? "#1d4a35" : c.panel,
            stroke: phase === 3 ? c.ok : c.line, on: phase === 3, r: 10,
            label: "accept", size: 17, sub: "carry on", subFill: c.soft });
      d.box(REJ[0], REJ[1], REJ[2], REJ[3], { fill: phase === 2 ? "#4a1d1d" : c.panel,
            stroke: phase === 2 ? c.bad : c.line, on: phase === 2, r: 10,
            label: "reject", size: 17, sub: "say what is wrong", subFill: c.soft });
      d.arrow(619, 148, 619, 166, { stroke: c.line, width: 2, size: 7 });
      d.arrow(619, 220, 619, 238, { stroke: phase === 3 ? c.ok : c.line,
              width: phase === 3 ? 3 : 2, size: 7, label: "good", lx: -36, ly: 6,
              labelFill: phase === 3 ? c.ok : c.dim });
      d.arrow(698, 195, 760, 195, { stroke: phase === 2 ? c.bad : c.line,
              width: phase === 2 ? 3 : 2, size: 7, label: "bad", ly: -12,
              labelFill: phase === 2 ? c.bad : c.dim });
      d.line(844, 166, 844, 122, { stroke: phase === 2 ? c.bad : c.line,
             width: phase === 2 ? 3 : 2 });
      d.arrow(844, 122, 700, 122, { stroke: phase === 2 ? c.bad : c.line,
              width: phase === 2 ? 3 : 2, size: 7, label: "ask again", ly: -12,
              labelFill: phase === 2 ? c.bad : c.dim });

      // ---- what the user sees ---------------------------------------------
      const SCREEN = [["Mark? 150", c.soft], ["Must be 0 to 100", c.bad],
                      ["Mark? 72", c.soft], ["Thank you", c.ok]];
      let lines = 0;
      if (s === 0) lines = 1;
      else if (s === 1) lines = 1;
      else if (s === 2) lines = 2;
      else if (s === 3) lines = 3;
      else if (s === 4) lines = accepted ? 4 : 3;
      else lines = t < .18 ? 1 : t < .36 ? 1 : t < .52 ? 2 : t < .68 ? 3 : t < .86 ? 3 : 4;
      d.box(34, 318, 452, 130, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 340, "what the user sees", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 260 });
      for (let i = 0; i < lines; i++)
        code(d, 58, 366 + i * 22, SCREEN[i][0], { size: 16, max: 406, fill: SCREEN[i][1] });

      // ---- the two attempts ------------------------------------------------
      d.box(506, 318, 440, 130, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(926, 340, "the two attempts", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", align: "right", max: 260 });
      const a1 = s === 5 ? t >= .18 : s >= 1;
      const a2 = s === 5 ? t >= .68 : s === 4 && accepted;
      d.box(528, 358, 180, 36, { fill: a1 ? "#4a1d1d" : c.panel, stroke: a1 ? c.bad : c.line,
            on: a1, r: 8, label: "typed 150", size: 15, labelFill: a1 ? c.fg : c.dim });
      d.box(724, 358, 200, 36, { fill: a1 ? "#4a1d1d" : c.panel, stroke: a1 ? c.bad : c.line,
            on: a1, r: 8, label: a1 ? "too big, go again" : "waiting", size: 15,
            labelFill: a1 ? c.fg : c.dim });
      d.box(528, 400, 180, 36, { fill: a2 ? "#1d4a35" : c.panel, stroke: a2 ? c.ok : c.line,
            on: a2, r: 8, label: "typed 72", size: 15, labelFill: a2 ? c.fg : c.dim });
      d.box(724, 400, 200, 36, { fill: a2 ? "#1d4a35" : c.panel, stroke: a2 ? c.ok : c.line,
            on: a2, r: 8, label: a2 ? "in range, accepted" : "waiting", size: 15,
            labelFill: a2 ? c.fg : c.dim });

      // ---- the value going round, drawn last ------------------------------
      if (s === 0 || s === 3) {
        const f = d.seg(t, .25, .85);
        if (f > 0 && f < 1) {
          const p = d.onCurve(474, LY(s === 0 ? 0 : 3), 600, 112, -26, f);
          d.chip(p[0], p[1], String(mark), { fill: bad ? c.bad : c.ok, glow: true,
                 size: 16, h: 30 });
        }
      } else if (s === 2) {
        const f = d.seg(t, .25, .85);
        if (f > 0 && f < 1) {
          const p = d.onPath([[844, 196], [844, 122], [702, 122]], f);
          d.chip(p[0], p[1], "150", { fill: c.bad, glow: true, size: 16, h: 30 });
        }
      } else if (s === 5) {
        const badPath = [mid(ASK), mid(CHK), mid(REJ), [844, 122], [700, 122], mid(ASK)];
        const goodPath = [mid(ASK), mid(CHK), mid(ACC)];
        const f = t < .52 ? d.clamp(t / .52, 0, 1) : d.clamp((t - .52) / .46, 0, 1);
        const p = d.onPath(t < .52 ? badPath : goodPath, f);
        d.chip(p[0], p[1], t < .52 ? "150" : "72",
               { fill: t < .52 ? c.bad : c.ok, glow: true, size: 16, h: 30 });
      }

      const notes = [
        ["Ask before you test", "You cannot check a value you have not got. The first input sits above the while.", [619, 123]],
        ["or means either one", "Bad if it is too small OR too big. One true half makes the whole test true.", [619, 195]],
        ["Say what the rule is", "\"Invalid\" tells the user nothing. \"Must be 0 to 100\" tells them what to type.", [772, 122]],
        ["Ask again inside", "input appears twice: once above the loop, once inside it. Miss the second and it never ends.", [619, 123]],
        ["The test describes the bad values", "The loop runs while the value is wrong. Getting that the wrong way round loops for ever.", [556, 250]],
        ["One loop, any number of tries", "The same three lines cope with one bad value or twenty. That is why it is a loop.", [844, 122]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });
})();
