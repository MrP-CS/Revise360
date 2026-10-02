/* Revise 360 - programming fundamentals (OCR J277 2.2).
 *
 * pr-l01..pr-l13: the three constructs, strings, files, SQL, 1D and 2D arrays,
 * sub-programs, and pseudo-random numbers.
 *
 * Every trace in here was worked by hand first and the rendered frames checked
 * against it. The numbers shown are the numbers actually drawn:
 *
 *   constructs  Python 3. Nine written lines; the order they RUN in is
 *               1,2,3,4,7,8,7,8,7,8,7,9 - twelve steps, lines 5 and 6 never.
 *               score 0 -> 10 -> 11 -> 12 -> 13, printed 13.
 *   strslice    OCR Exam Reference Language, word = "Revision" (8 characters,
 *               indexes 0-7).  word.length -> 8
 *               word.substring(3, 4) -> "isio"    (i s i o, from index 3)
 *               word.upper -> "REVISION", word.lower -> "revision"
 *               word.substring(0, 3) + " 360" -> "Rev 360"
 *               word.substring(6, 4) -> fails, only "on" is left after index 6
 *   filelines   Python 3. scores.txt holds Ava,24 / Ben,31 / Cara,18.
 *               readline() four times: the fourth returns "" - that is the end.
 *               "Dev,21" appended, so the file ends with four lines.
 *   sqlwhere    SELECT name, points FROM pupil WHERE year = 10
 *               5 records, 4 fields -> 3 records, 2 fields (Ava 24, Cara 18,
 *               Eli 12).  WHERE points > 20 instead -> Ava 24, Ben 31, Dev 27.
 *   arrayindex  Python 3. scores = [14, 9, 22, 7, 31]
 *               scores[2] -> 22; scores[1] = 40 -> [14, 40, 22, 7, 31]
 *               loop total 14+40+22+7+31 = 114; scores[5] is out of range.
 *   array2d     Python 3. 4 rows x 5 columns.
 *               grid[2][1] -> 6, grid[1][2] -> 9  (not the same cell)
 *               row 2 is 4,6,3,8,2 -> total 23; whole grid is 20 cells.
 *   callreturn  Python 3. vat(40): price 40, tax 8.0, returns 48.0.
 *               vat(120): price 120, tax 24.0, returns 144.0.
 *   randomdist  seed 7, next = (seed * 21 + 11) MOD 256,
 *               value = 1 + next MOD 6.
 *               seeds  7 -> 158 -> 1 -> 32 -> 171 -> 110 -> 61 -> 20 ...
 *               draws  3, 2, 3, 4, 1, 2, 5, 4, 5, 4
 *               tally after 10   [1, 2, 2, 3, 2, 0]   (6 never came up)
 *               tally after 600  [98, 100, 97, 102, 105, 98]
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  // One line of program text. Code is set a little smaller and lighter than a
  // box label so a panel of it reads as code rather than as prose.
  function code(d, tx, ty, s, o) {
    o = o || {};
    return d.text(tx, ty, s, {
      size: o.size || 15, weight: o.weight || 600, baseline: "middle",
      fill: o.fill || d.c.fg, max: o.max || 320, alpha: o.alpha, align: o.align
    });
  }

  // The language badge. Every diagram that shows code says which language it is
  // in, because mixing Python and the exam reference language loses marks.
  function lang(d, s) {
    const w = Math.max(112, Math.ceil(d.measure(s, 12, 700)) + 26);
    d.chip(944 - w / 2, 30, s, { fill: d.c.panel2, stroke: d.c.line, h: 24, size: 12,
                                 w, labelFill: d.c.soft });
  }

  // ================================================================== pr-l01/03/04
  A("constructs", function () {
    const W = 980, H = 580;
    const LINES = [
      "score = 0",
      "lives = 3",
      "if lives > 0:",
      "    score = score + 10",
      "else:",
      "    score = -1",
      "for n in range(3):",
      "    score = score + 1",
      "print(score)"
    ];
    // the order the lines actually run in
    const ORDER = [1, 2, 3, 4, 7, 8, 7, 8, 7, 8, 7, 9];
    const LY = i => 108 + i * 36;                     // 108 .. 396
    const GROUPS = [[0, 1], [2, 5], [6, 7]];
    const GNAME = ["Sequence", "Selection", "Iteration"];
    const GCOL = d => [d.c.info, d.c.violet, d.c.orange];

    function run(k) {
      let score = null, lives = null, out = null, n = null, laps = 0;
      for (let i = 0; i < k; i++) {
        const L = ORDER[i];
        if (L === 1) score = 0;
        else if (L === 2) lives = 3;
        else if (L === 4) score += 10;
        else if (L === 7) n = laps < 3 ? laps : null;
        else if (L === 8) { score += 1; laps++; }
        else if (L === 9) out = score;
      }
      return { score, lives, out, n };
    }

    const steps = [
      { name: "1. Nine lines", caption: "One short program, written in nine lines. Three kinds of structure are hiding in it, and each one controls what runs next." },
      { name: "2. Sequence", caption: "The program counter starts at the top and goes down one line at a time. Nothing is skipped and nothing is repeated: that is sequence." },
      { name: "3. Selection", caption: "lives is 3, so the if is true. Line 4 runs, then the counter jumps straight over lines 5 and 6 - the else is never touched." },
      { name: "4. Iteration", caption: "Line 8 adds one to score, then the counter jumps back up to line 7 to go round again. Three laps, so score goes 11, 12, 13." },
      { name: "5. Out of the loop", caption: "On the fourth visit to line 7 there are no values left in range(3), so the loop ends and the counter drops through to line 9." },
      { name: "6. Written vs run", caption: "Nine lines written, twelve steps run. Lines 5 and 6 never ran at all, and lines 7 and 8 ran three times each." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c, GC = GCOL(d);
      d.title("The three programming constructs");
      lang(d, "Python 3");

      // ---- where the program counter is ----------------------------------
      let k = 0, sweep = -1;
      if (s === 1) k = Math.floor(d.seg(t, .05, .92) * 2.999);
      else if (s === 2) k = 2 + Math.floor(d.seg(t, .05, .92) * 2.999);
      else if (s === 3) k = 4 + Math.floor(d.seg(t, .03, .96) * 6.999);
      else if (s === 4) k = 10 + Math.floor(d.seg(t, .08, .9) * 2.999);
      else if (s === 5) { k = 12; sweep = Math.floor(d.seg(t, .02, .97) * 11.999); }
      const finished = k >= ORDER.length;                  // the program has ended
      const pcLine = finished ? 9 : ORDER[k];              // 1-based line number
      const st = run(k);
      const litLine = s === 0 ? -1 : s === 5 ? ORDER[sweep] : pcLine;

      // ---- the code panel -------------------------------------------------
      d.box(34, 72, 456, 356, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(54, 94, "the program as written", { size: 12.5, weight: 800, fill: c.dim,
                                                 baseline: "middle", max: 260 });
      // construct brackets down the left-hand gutter
      const gcyc = s === 0 ? Math.floor(d.seg(t, .62, .99) * 2.999) : -1;
      GROUPS.forEach((g, gi) => {
        const lit = gcyc === gi || (s === 1 && gi === 0) || (s === 2 && gi === 1) ||
                    ((s === 3 || s === 4) && gi === 2);
        const y1 = LY(g[0]) - 16, y2 = LY(g[1]) + 16;
        d.path([[48, y1], [42, y1], [42, y2], [48, y2]],
               { stroke: lit ? GC[gi] : "#2a3b56", width: lit ? 3 : 1.6, glow: lit });
      });

      const fade = s === 0 ? i => d.seg(t, i * .055, .14 + i * .055) : () => 1;
      LINES.forEach((L, i) => {
        const y = LY(i), num = i + 1;
        const isLit = litLine === num;
        const dead = s === 5 && (num === 5 || num === 6);
        if (isLit) d.box(66, y - 15, 408, 30, { fill: "#2a3f68", stroke: c.edge, on: true, r: 7 });
        d.text(94, y, String(num), { size: 11.5, weight: 700, align: "right", baseline: "middle",
                                     fill: isLit ? c.edge : c.dim, alpha: fade(i), max: 24 });
        code(d, 108, y, L, { max: 346, alpha: dead ? .35 : fade(i),
                             fill: isLit ? c.fg : dead ? c.dim : c.soft });
        if (dead) d.line(106, y, 106 + Math.min(344, d.measure(L, 15, 600)), y,
                         { stroke: c.bad, width: 2 });
      });

      // the program counter marker
      if (!finished && s > 0 && s < 5) {
        const y = LY(pcLine - 1);
        d.path([[50, y - 9], [72, y], [50, y + 9]], { fill: c.edge, stroke: c.edge, width: 1 });
        d.text(44, y - 24, "PC", { size: 11, weight: 800, baseline: "middle", fill: c.edge, max: 30 });
      }

      // the two jumps, drawn in the margin to the right of the code
      const selJump = s === 2 && k >= 4;
      d.curve(496, LY(3), 496, LY(6), 44, {
        stroke: selJump ? c.violet : "#2a3b56", width: selJump ? 3 : 1.6, glow: selJump,
        dash: selJump ? null : [4, 4] });
      d.text(546, (LY(3) + LY(6)) / 2, "skips", { size: 11.5, weight: 800, baseline: "middle",
                                                  fill: selJump ? c.violet : c.dim, max: 50 });
      const itJump = s === 3;
      d.curve(496, LY(7), 496, LY(6), 30, {
        stroke: itJump ? c.orange : "#2a3b56", width: itJump ? 3 : 1.6, glow: itJump,
        dash: itJump ? null : [4, 4] });
      d.text(540, LY(7) + 16, "back", { size: 11.5, weight: 800, baseline: "middle",
                                        fill: itJump ? c.orange : c.dim, max: 50 });

      // ---- variables -------------------------------------------------------
      d.box(600, 72, 346, 104, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(620, 94, "variables", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle", max: 140 });
      d.box(620, 108, 142, 52, { fill: c.panel, stroke: c.edge, on: s >= 1 && s < 5,
                                 label: st.score === null ? "-" : String(st.score),
                                 size: 24, sub: "score", subFill: c.soft, max: 118 });
      d.box(784, 108, 142, 52, { fill: c.panel, stroke: c.info,
                                 label: st.lives === null ? "-" : String(st.lives),
                                 size: 24, sub: "lives", subFill: c.soft, max: 118 });

      // ---- the order they ran in ------------------------------------------
      d.box(600, 192, 346, 130, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(620, 214, "the order the lines ran in", { size: 12.5, weight: 800, fill: c.dim,
                                                       baseline: "middle", max: 220 });
      const fills = {};
      for (let i = 0; i < ORDER.length; i++) {
        if (s === 5) { if (i === sweep) fills[i] = c.edge; }
        else if (i === k - 1) fills[i] = c.edge;
      }
      const seen = ORDER.map((v, i) => (i < k ? String(v) : ""));
      d.cells(620, 240, seen, { cw: 24, ch: 30, gap: 3, fills, size: 13 });
      d.text(620, 298, (s === 5 ? 12 : k) + " of 12 steps run", { size: 12, weight: 700,
             baseline: "middle", fill: s === 5 ? c.ok : c.soft, max: 200 });

      // ---- output ----------------------------------------------------------
      d.box(600, 338, 346, 90, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(620, 360, "output", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle", max: 140 });
      d.text(620, 392, st.out === null ? "(nothing printed yet)" : String(st.out),
             { size: st.out === null ? 14 : 26, weight: 800, baseline: "middle",
               fill: st.out === null ? c.dim : c.ok, max: 300 });

      // ---- the three names -------------------------------------------------
      GNAME.forEach((g, gi) => {
        const lit = gcyc === gi || (s === 1 && gi === 0) || (s === 2 && gi === 1) ||
                    ((s === 3 || s === 4) && gi === 2);
        d.box(34 + gi * 158, 442, 148, 24, {
          fill: lit ? "#243a60" : c.panel, stroke: lit ? GC[gi] : c.line, r: 12,
          label: g, size: 12.5, labelFill: lit ? c.fg : c.dim, max: 128 });
      });

      const notes = [
        ["Three structures", "Lines 1-2 are sequence, lines 3-6 a selection, lines 7-8 an iteration. Every program is built from these three.", [44, LY(4)]],
        ["One at a time", "The program counter holds the line about to run. Sequence simply means it moves on by one.", [72, LY(1)]],
        ["The else is skipped", "Only one branch of an if ever runs. Lines 5 and 6 are written but never reached on this run.", [520, LY(4)]],
        ["Jumping backwards", "Nothing in the written order goes upwards. Iteration is the counter being sent back to a line it has already run.", [520, LY(6) + 20]],
        ["How a loop stops", "range(3) hands out 0, 1, 2 and then nothing. The fourth check finds nothing left, so the loop is finished.", [72, LY(6)]],
        ["Written order is not run order", "Reading a program top to bottom tells you what it says. Only tracing the counter tells you what it does.", [792, 266]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 120, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ===================================================================== pr-l06
  A("strslice", function () {
    const W = 980, H = 580;
    const WORD = "Revision";
    const CH = WORD.split("");
    const CW = 56, CELLH = 54, GAP = 7;
    const ROW = CH.length * (CW + GAP) - GAP;              // 497
    const X0 = Math.round(490 - ROW / 2);                  // 242
    const at = i => X0 + i * (CW + GAP) + CW / 2;

    const OPS = [
      ["word.length", "8", 0],
      ["word.substring(3, 4)", "\"isio\"", 2],
      ["word.upper", "\"REVISION\"", 3],
      ["word.lower", "\"revision\"", 3],
      ["word.substring(0, 3) + \" 360\"", "\"Rev 360\"", 4],
      ["word.substring(6, 4)", "error", 5]
    ];

    const steps = [
      { name: "1. Positions", caption: "A string is a row of characters, each with a position. The first character is at position 0, so the eight letters sit at 0 to 7." },
      { name: "2. Length", caption: "word.length counts the characters: eight. Watch the counter and the index numbers - the length is 8 but the last position is 7." },
      { name: "3. A substring", caption: "word.substring(3, 4) starts at position 3 and takes four characters: i, s, i, o. The 4 is how many, not where to stop." },
      { name: "4. Case", caption: "word.upper and word.lower hand back a new string. The original word is untouched, which is why the top row never changes." },
      { name: "5. Joining", caption: "A plus between two strings joins them end to end. \"Rev\" and \" 360\" become one seven-character string, space and all." },
      { name: "6. Off the end", caption: "Only two characters exist from position 6. Asking for four runs past the end of the string, and the program stops with an error." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Strings: positions, length, substrings");
      lang(d, "OCR reference language");

      // ---- the word --------------------------------------------------------
      const pop = i => (s === 0 ? d.seg(t, .04 + i * .05, .2 + i * .05) : 1);
      // which characters are picked out this step
      let lo = -1, hi = -1, bad = false;
      if (s === 1) { lo = 0; hi = Math.floor(d.seg(t, .1, .9) * 7.999); }
      else if (s === 2) { lo = 3; hi = 3 + Math.min(3, Math.floor(d.seg(t, .12, .62) * 3.999)); }
      else if (s === 4) { lo = 0; hi = 2; }
      else if (s === 5) { lo = 6; hi = 6 + Math.min(3, Math.floor(d.seg(t, .12, .66) * 3.999)); bad = hi > 7; }

      const caseMix = s === 3 ? Math.floor(d.seg(t, .08, .72) * 8.999) : -1;
      CH.forEach((ch2, i) => {
        const inSel = lo >= 0 && i >= lo && i <= hi;
        let show = ch2;
        if (s === 3 && i < caseMix) show = ch2.toUpperCase();
        d.box(X0 + i * (CW + GAP), 96, CW, CELLH, {
          fill: inSel ? (bad ? "#4a1d1d" : "#2a3f68") : c.panel,
          stroke: inSel ? (bad ? c.bad : c.edge) : c.line, on: inSel, r: 8,
          label: show, size: 26, alpha: pop(i) });
        d.text(at(i), 96 + CELLH + 16, String(i), {
          size: 12, weight: 700, align: "center", baseline: "middle",
          fill: inSel ? c.edge : c.dim, alpha: pop(i), max: 30 });
      });
      // the seat that does not exist, for step 6
      if (s === 5) {
        for (let i = 8; i < 10; i++) {
          const gone = hi >= i;
          d.box(X0 + i * (CW + GAP), 96, CW, CELLH, {
            fill: "#1a1020", stroke: gone ? c.bad : "#3a2a3a", r: 8, label: "?",
            size: 24, labelFill: gone ? c.bad : "#4a3a4a" });
          d.text(at(i), 96 + CELLH + 16, String(i), { size: 12, weight: 700, align: "center",
                 baseline: "middle", fill: gone ? c.bad : c.dim, max: 30 });
        }
      }

      // ---- the measuring bracket ------------------------------------------
      if (lo >= 0) {
        const x1 = X0 + lo * (CW + GAP), x2 = X0 + (hi + 1) * (CW + GAP) - GAP;
        const col = bad ? c.bad : c.edge;
        d.path([[x1, 182], [x1, 190], [x2, 190], [x2, 182]], { stroke: col, width: 2.5 });
        d.text((x1 + x2) / 2, 204, (hi - lo + 1) + (hi - lo === 0 ? " character" : " characters") +
               " from position " + lo, { size: 12.5, weight: 700, align: "center",
               baseline: "middle", fill: col, max: 400 });
      }

      // ---- the expression being worked out --------------------------------
      const op = OPS[s === 3 ? 2 : s === 4 ? 4 : s === 5 ? 5 : s === 2 ? 1 : 0];
      const reveal = d.seg(t, s === 0 ? .55 : .66, s === 0 ? .9 : .95);
      d.box(40, 226, 900, 56, { fill: "#16233c", stroke: c.line, r: 12 });
      code(d, 64, 254, s === 0 ? "word = \"Revision\"" : op[0], { size: 19, max: 430, fill: c.fg });
      if (s > 0) {
        d.arrow(560, 254, 614, 254, { stroke: c.dim, width: 2, size: 8, alpha: reveal });
        code(d, 636, 254, op[1], { size: 19, max: 280,
             fill: s === 5 ? c.bad : c.ok, alpha: reveal });
      }

      // ---- the result ------------------------------------------------------
      let res = null;
      if (s === 1) res = null;
      else if (s === 2) res = "isio".split("");
      else if (s === 3) res = (caseMix >= 8 ? "REVISION" : "Revision").split("");
      else if (s === 4) res = "Rev 360".split("");
      const RL = 46, RH = 44, RG = 6;
      if (res) {
        const rw = res.length * (RL + RG) - RG, rx = Math.round(490 - rw / 2);
        d.text(rx - 18, 318, "out", { size: 12, weight: 800, align: "right", baseline: "middle",
                                      fill: c.dim, max: 50 });
        res.forEach((ch2, i) => {
          d.box(rx + i * (RL + RG), 296, RL, RH, {
            fill: "#1d4a35", stroke: c.ok, r: 7, label: ch2 === " " ? "␣" : ch2,
            size: 21, alpha: reveal });
        });
      } else if (s === 1) {
        d.box(410, 296, 160, 46, { fill: "#1d4a35", stroke: c.ok, on: true, r: 10,
                                   label: String(hi + 1), size: 26, alpha: reveal, max: 130 });
        d.text(392, 318, "out", { size: 12, weight: 800, align: "right", baseline: "middle",
                                  fill: c.dim, max: 50 });
      } else if (s === 5) {
        d.box(330, 296, 320, 46, { fill: "#4a1d1d", stroke: c.bad, on: bad, r: 10,
               label: "string index out of range", size: 15, labelFill: c.fg,
               alpha: bad ? 1 : .3, max: 296 });
      } else {
        d.box(300, 296, 380, 46, { fill: c.panel, stroke: c.line, r: 10,
               label: "eight characters, positions 0 to 7", size: 15,
               labelFill: c.soft, alpha: reveal, max: 356 });
      }

      // ---- the reference list ---------------------------------------------
      d.box(40, 358, 900, 92, { fill: "#16233c", stroke: c.line, r: 12 });
      const LEFT = [OPS[0], OPS[1], OPS[2]], RIGHT = [OPS[3], OPS[4], OPS[5]];
      [[LEFT, 64, 268], [RIGHT, 520, 760]].forEach(col2 => {
        col2[0].forEach((o, i) => {
          const y = 382 + i * 26, done = s >= o[2];
          code(d, col2[1], y, o[0], { size: 13, max: col2[2] - col2[1] - 14,
               fill: done ? c.soft : c.dim, alpha: done ? 1 : .55 });
          code(d, col2[2], y, o[1], { size: 13, max: 160,
               fill: done ? (o[1] === "error" ? c.bad : c.ok) : c.dim, alpha: done ? 1 : .55 });
        });
      });

      const notes = [
        ["Zero, not one", "The eighth letter is at position 7. Almost every off-by-one bug in string handling starts here.", [at(0), 96 + CELLH + 4]],
        ["Length and last index", "length gives you a count. Positions are a count that started at zero, so the last one is always length - 1.", [at(7), 96 + CELLH + 4]],
        ["How many, not where", "substring(3, 4) is read as \"from 3, take 4\". It does not mean \"from 3 up to 4\".", [at(4), 190]],
        ["A new string comes back", "upper and lower do not change word. If you want the capitals kept, you have to store what came back.", [at(1), 150]],
        ["Joining is not adding", "Plus between numbers adds. Plus between strings sticks them together, so \"2\" + \"2\" is \"22\".", [at(1), 190]],
        ["Check before you cut", "Before taking n characters from position p, make sure p + n is not past length. That test is the fix.", [at(8), 150]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 120, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ===================================================================== pr-l10
  A("filelines", function () {
    const W = 980, H = 580;
    const DISK = ["Ava,24", "Ben,31", "Cara,18"];
    const EXTRA = "Dev,21";
    const SLOTY = [126, 170, 214, 258];
    const READ = [
      "f = open(\"scores.txt\", \"r\")",
      "line = f.readline()",
      "while line != \"\":",
      "    line = f.readline()"
    ];
    const APPEND = [
      "f = open(\"scores.txt\", \"a\")",
      "f.write(\"Dev,21\\n\")",
      "f.close()"
    ];

    const steps = [
      { name: "1. On disk", caption: "scores.txt sits on the disk with three lines in it. The program cannot see any of them yet, because the file is closed." },
      { name: "2. Open it", caption: "open() builds a link between the program and the file, and puts a read pointer just before the first line." },
      { name: "3. Read a line", caption: "readline() hands back the line the pointer is on and then moves the pointer down by one. The line is now in memory as well as on disk." },
      { name: "4. Keep reading", caption: "Each readline() takes the next line, never the same one twice. Past the last line it hands back an empty string, which is how the loop knows to stop." },
      { name: "5. Write a line", caption: "Opening in append mode puts the pointer at the end. write() hands over \"Dev,21\" - but it is sitting in memory, not yet on the disk." },
      { name: "6. Close it", caption: "close() flushes what is waiting onto the disk and breaks the link. Only now does the file really have four lines in it." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("File handling: open, read, write, close");
      lang(d, "Python 3");

      // how far down the pointer is: 0..3 is a line, 4 is past the end
      let ptr = -1, reads = 0;
      if (s === 1) ptr = d.seg(t, .45, .85) > .4 ? 0 : -1;
      else if (s === 2) { ptr = d.seg(t, .55, .9) > .5 ? 1 : 0; reads = ptr; }
      else if (s === 3) { reads = 1 + Math.floor(d.seg(t, .05, .9) * 3.999); ptr = Math.min(4, reads); }
      else if (s >= 4) { ptr = 3 + (s === 5 ? 1 : 1); reads = 4; }
      const open2 = s >= 1 && s <= 4;
      const mode = s >= 4 ? "a" : "r";
      const pending = s === 4 && d.seg(t, .4, .8) > .4;
      const committed = s === 5 && d.seg(t, .25, .7) > .3;
      const lineVar = s === 3 ? DISK[Math.min(2, reads - 1)] : s === 2 ? DISK[0] : null;
      const endOfFile = s === 3 && reads >= 4;

      // ---- the file on disk ------------------------------------------------
      d.box(34, 66, 330, 302, { fill: "#16233c", stroke: committed || s === 5 ? c.ok : c.line,
                                r: 14, on: s === 5 });
      d.text(54, 90, "scores.txt", { size: 14, weight: 800, fill: c.fg, baseline: "middle", max: 150 });
      d.text(344, 90, "on disk", { size: 11.5, weight: 700, align: "right", baseline: "middle",
                                   fill: c.dim, max: 90 });
      DISK.forEach((L, i) => {
        const here = ptr === i;
        const past = ptr > i;
        d.box(62, SLOTY[i], 280, 36, {
          fill: here ? "#2a3f68" : c.panel, stroke: here ? c.edge : c.line, on: here, r: 7,
          label: L, size: 16, labelFill: past ? c.dim : c.fg, max: 250 });
      });
      // the fourth slot: empty, then pending, then written
      d.box(62, SLOTY[3], 280, 36, {
        fill: committed ? "#1d4a35" : "#141f36", stroke: committed ? c.ok : "#2a3b56",
        on: committed, r: 7, label: committed ? EXTRA : (pending ? "" : ""),
        size: 16, max: 250 });
      if (!committed)
        d.text(202, SLOTY[3] + 18, pending ? "nothing here yet" : "(end of file)",
               { size: 12, weight: 700, align: "center", baseline: "middle",
                 fill: pending ? c.orange : c.dim, max: 240 });

      // read pointer
      if (ptr >= 0) {
        const py = ptr >= 4 ? SLOTY[3] + 18 : SLOTY[ptr] + 18;
        d.path([[42, py - 9], [58, py], [42, py + 9]], { fill: c.edge, stroke: c.edge, width: 1 });
        d.text(54, 318, (s >= 4 ? "the pointer sits after the last line"
                                : "the pointer moves down as you read"),
               { size: 11.5, weight: 700, baseline: "middle", fill: c.edge, max: 290 });
      }
      d.box(54, 334, 290, 24, {
        fill: open2 ? "#1d4a35" : c.panel, stroke: open2 ? c.ok : c.line, r: 12,
        label: open2 ? "open, mode \"" + mode + "\"" : "closed", size: 12,
        labelFill: open2 ? c.fg : c.dim, max: 260 });

      // ---- the program ------------------------------------------------------
      d.box(420, 62, 526, 154, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(442, 84, "reading it", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle", max: 200 });
      READ.forEach((L, i) => {
        const lit = (s === 1 && i === 0) || (s === 2 && i === 1) || (s === 3 && i >= 2);
        code(d, 442, 112 + i * 30, L, { size: 15, max: 480, fill: lit ? c.fg : c.soft,
                                        alpha: lit ? 1 : .55 });
      });
      d.box(420, 232, 526, 134, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(442, 254, "adding to it", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle", max: 200 });
      APPEND.forEach((L, i) => {
        const lit = (s === 4 && i <= 1) || (s === 5 && i === 2);
        code(d, 442, 284 + i * 30, L, { size: 15, max: 480, fill: lit ? c.fg : c.soft,
                                        alpha: lit ? 1 : .45 });
      });

      // the link between program and file
      const linkCol = open2 ? c.ok : s === 5 ? c.dim : "#2a3b56";
      d.curve(416, 150, 370, 110, 18, { stroke: linkCol, width: open2 ? 3 : 1.6,
              glow: open2, dash: open2 ? null : [5, 5] });
      d.text(392, 76, open2 ? "open" : "no link", { size: 11.5, weight: 800, align: "center",
             baseline: "middle", fill: linkCol, max: 70 });

      // ---- memory ----------------------------------------------------------
      d.box(34, 378, 912, 62, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(54, 400, "in memory", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle", max: 120 });
      d.box(170, 390, 300, 38, {
        fill: lineVar || endOfFile ? c.panel : "#141f36",
        stroke: endOfFile ? c.edge : lineVar ? c.info : "#2a3b56", on: !!lineVar || endOfFile, r: 8,
        label: endOfFile ? "line = \"\"  (end of file)" : lineVar ? "line = \"" + lineVar + "\"" : "line not set yet",
        size: 15, labelFill: lineVar || endOfFile ? c.fg : c.dim, max: 272 });
      d.box(510, 390, 300, 38, {
        fill: pending ? "#3a2f1a" : "#141f36",
        stroke: pending ? c.orange : committed ? c.ok : "#2a3b56", on: pending, r: 8,
        label: pending ? "waiting to be written: \"Dev,21\"" : committed ? "written to disk" : "nothing waiting",
        size: 13.5, labelFill: pending ? c.fg : committed ? c.ok : c.dim, max: 272 });

      // the line in flight, from disk into memory
      if (s === 3 && reads <= 3) {
        const f = d.seg(t, .05 + (reads - 1) * .3, .3 + (reads - 1) * .3);
        if (f > 0 && f < 1) {
          const p = d.onCurve(202, SLOTY[reads - 1] + 18, 320, 409, 70, f);
          d.chip(p[0], p[1], DISK[reads - 1], { fill: c.info, glow: true, size: 13, h: 26 });
        }
      }
      if (s === 4 && pending) {
        const f = d.seg(t, .42, .78);
        if (f > 0 && f < .92) {
          const p = d.onCurve(560, 300, 660, 409, 40, f);
          d.chip(p[0], p[1], EXTRA, { fill: c.orange, glow: true, size: 13, h: 26 });
        }
      }
      if (s === 5 && committed) {
        const f = d.seg(t, .3, .72);
        if (f > 0 && f < .92) {
          const p = d.onCurve(660, 409, 202, SLOTY[3] + 18, 90, f);
          d.chip(p[0], p[1], EXTRA, { fill: c.ok, glow: true, size: 13, h: 26 });
        }
      }

      const notes = [
        ["Closed means invisible", "A closed file is just bytes on a disk. Nothing in the program can reach it until open() is called.", [202, SLOTY[1] + 18]],
        ["Mode matters", "\"r\" reads, \"w\" wipes the file and starts again, \"a\" adds to the end. Choosing \"w\" by mistake destroys the data.", [46, 346]],
        ["The pointer moved", "readline() has a side effect: it leaves the pointer one line further on. That is why a loop reads a different line each time.", [50, SLOTY[1] + 18]],
        ["Empty is not nothing", "A real line always has at least a newline in it. A completely empty string can only mean the end of the file.", [320, 409]],
        ["Not on disk yet", "write() usually drops the text in a buffer. Pull the plug now and \"Dev,21\" is gone.", [660, 409]],
        ["close() is not optional", "Closing flushes the buffer and lets other programs have the file. Forgetting it is how written data goes missing.", [202, SLOTY[3] + 18]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ===================================================================== pr-l13
  A("sqlwhere", function () {
    const W = 980, H = 580;
    const FIELD = ["name", "year", "club", "points"];
    const FX = [62, 200, 288, 426], FW = [130, 80, 130, 90];
    const ROWS = [
      ["Ava", 10, "Chess", 24],
      ["Ben", 9, "Chess", 31],
      ["Cara", 10, "Drama", 18],
      ["Dev", 11, "Chess", 27],
      ["Eli", 10, "Art", 12]
    ];
    const RY = [202, 242, 282, 322, 362];
    const KEEP = [0, 3];                                   // name, points
    const COND = [
      { sql: "year = 10", test: r => r[1] === 10, field: 1 },
      { sql: "points > 20", test: r => r[3] > 20, field: 3 }
    ];

    const steps = [
      { name: "1. The table", caption: "One table called pupil: five records down, four fields across. A query never changes it - it reports back a smaller table." },
      { name: "2. FROM", caption: "FROM names the table to work on. Every one of the five records is a candidate at this point; nothing has been ruled out." },
      { name: "3. WHERE", caption: "WHERE tests the condition once per record, top to bottom. Ben, Dev and their whole rows fail year = 10 and drop out." },
      { name: "4. SELECT", caption: "Only now are the fields chosen. SELECT name, points keeps two of the four columns; year and club are dropped from the answer." },
      { name: "5. The answer", caption: "Three records and two fields come back. Five rows became three because of WHERE, four columns became two because of SELECT." },
      { name: "6. A different test", caption: "Change only the condition and the rows change. WHERE decides which records; SELECT still decides which fields, whatever the condition is." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("A SQL query running: FROM, WHERE, SELECT");

      const cond = COND[s === 5 ? 1 : 0];
      // how far the WHERE walk has got
      let walk = -1;
      if (s === 2) walk = Math.floor(d.seg(t, .04, .92) * 5.999);
      else if (s === 5) walk = Math.floor(d.seg(t, .04, .72) * 5.999);
      else if (s >= 3) walk = 5;
      // a record is only struck out once the walk has moved past it, so the row
      // being tested shows its verdict first and drops out a beat later
      const decided = i => walk > i;
      const alive = i => !decided(i) || cond.test(ROWS[i]);
      const colFade = s === 3 ? d.seg(t, .2, .8) : s >= 4 ? 1 : 0;
      // the answer only assembles once SELECT has been applied
      const kept = ROWS.map((r, i) => i)
        .filter(i => s >= 3 && walk >= 5 && cond.test(ROWS[i]));

      // ---- the query -------------------------------------------------------
      d.box(40, 60, 560, 50, { fill: "#16233c", stroke: c.line, r: 12 });
      const QQ = [
        ["SELECT", c.violet, s >= 3],
        ["name, points", c.fg, s >= 3],
        ["FROM", c.teal, s >= 1],
        ["pupil", c.fg, s >= 1],
        ["WHERE", c.orange, s === 2 || s >= 4],
        [cond.sql, c.fg, s === 2 || s >= 4]
      ];
      let qx = 54;
      QQ.forEach((q, i) => {
        code(d, qx, 85, q[0], { size: 16, weight: 800, max: 170,
             fill: q[2] ? q[1] : c.dim, alpha: q[2] ? 1 : .5 });
        qx += Math.ceil(d.measure(q[0], 16, 800)) + (i % 2 ? 20 : 8);
      });

      // ---- the running count ----------------------------------------------
      d.box(620, 60, 320, 50, { fill: "#16233c", stroke: c.line, r: 12 });
      const nRows = walk < 0 ? 5 : ROWS.filter((r, i) => alive(i)).length;
      const nCols = colFade > .5 ? 2 : 4;
      code(d, 644, 85, nRows + (nRows === 1 ? " record" : " records") + ", " +
           nCols + " fields", { size: 16, weight: 800, max: 272,
           fill: walk >= 4 && colFade > .5 ? c.ok : c.soft });

      // ---- the table -------------------------------------------------------
      d.box(40, 130, 560, 300, { fill: "#16233c", stroke: s >= 1 ? c.teal : c.line,
                                 r: 14, on: s === 1 });
      d.text(62, 152, "pupil", { size: 14, weight: 800, fill: s >= 1 ? c.teal : c.soft,
                                 baseline: "middle", max: 120 });
      FIELD.forEach((f, j) => {
        const drop = colFade > 0 && KEEP.indexOf(j) < 0;
        const a = drop ? 1 - colFade * .78 : 1;
        d.text(FX[j] + FW[j] / 2, 180, f, { size: 13, weight: 800, align: "center",
               baseline: "middle", max: FW[j] - 6, alpha: a,
               fill: colFade > 0 && !drop ? c.violet : c.dim });
      });
      const appear = i => (s === 0 ? d.seg(t, .08 + i * .1, .3 + i * .1) : 1);
      ROWS.forEach((r, i) => {
        const live = alive(i), here = walk === i && s !== 3 && s !== 4;
        const y = RY[i];
        if (here) d.box(56, y - 2, 528, 36, { fill: "#2a3f68", stroke: c.edge, on: true, r: 7 });
        r.forEach((v, j) => {
          const drop = colFade > 0 && KEEP.indexOf(j) < 0;
          let a = appear(i) * (live ? 1 : .3) * (drop ? 1 - colFade * .8 : 1);
          const testing = here && j === cond.field;
          d.text(FX[j] + FW[j] / 2, y + 16, String(v), {
            size: 15, weight: testing ? 800 : 600, align: "center", baseline: "middle",
            max: FW[j] - 6, alpha: a,
            fill: !live ? c.dim : testing ? c.edge : colFade > 0 && !drop ? c.fg : c.soft });
        });
        if (!live) d.line(58, y + 16, 580, y + 16, { stroke: c.bad, width: 2, alpha: .85 });
        if (here) d.text(556, y + 16, cond.test(r) ? "✓" : "✗",
                         { size: 19, weight: 800, align: "center", baseline: "middle",
                           fill: cond.test(r) ? c.ok : c.bad, max: 24 });
      });
      d.text(62, 406, "5 records, 4 fields - the table itself never changes",
             { size: 12, weight: 700, baseline: "middle", fill: c.dim, max: 520 });

      // ---- the result ------------------------------------------------------
      d.box(620, 130, 320, 300, { fill: "#16233c", stroke: kept.length ? c.ok : c.line,
                                  r: 14, on: s === 4 });
      d.text(644, 152, "what comes back", { size: 14, weight: 800,
             fill: kept.length ? c.ok : c.dim, baseline: "middle", max: 200 });
      const RFX = [648, 800], RFW = [130, 110];
      KEEP.forEach((j, k) => {
        d.text(RFX[k] + RFW[k] / 2, 180, FIELD[j], { size: 13, weight: 800, align: "center",
               baseline: "middle", fill: kept.length ? c.violet : c.dim, max: RFW[k] - 6 });
      });
      if (!kept.length)
        d.text(780, 280, "run the query to see", { size: 13, weight: 700, align: "center",
               baseline: "middle", fill: c.dim, max: 260 });
      kept.forEach((i, k) => {
        const y = 202 + k * 40;
        const a = s === 4 ? d.seg(t, .25 + k * .18, .55 + k * .18) : 1;
        d.box(636, y - 2, 288, 36, { fill: "#1d4a35", stroke: c.ok, r: 7, alpha: a });
        KEEP.forEach((j, kk) => {
          d.text(RFX[kk] + RFW[kk] / 2, y + 16, String(ROWS[i][j]), {
            size: 15, weight: 700, align: "center", baseline: "middle",
            fill: c.fg, max: RFW[kk] - 6, alpha: a });
        });
      });

      const notes = [
        ["Records and fields", "A row is one pupil, a column is one piece of information. SQL only ever works in whole rows and whole columns.", [300, RY[1] + 16]],
        ["FROM comes first", "Written last but worked out first: the database has to know which table before it can test anything.", [330, 152]],
        ["Rows before columns", "WHERE can use year even though SELECT never asks for it, because filtering happens while the whole row is still there.", [FX[1] + 40, RY[1] + 16]],
        ["SELECT is not a filter", "SELECT changes the shape of the answer, never which records are in it. SELECT * would keep all four fields.", [FX[2] + 65, 180]],
        ["Smaller both ways", "Three of five records, two of four fields. The original table on the left still has every row and column it started with.", [780, 222]],
        ["One condition, many answers", "points > 20 keeps Ava, Ben and Dev - a different three. Nothing about the SELECT had to change.", [FX[3] + 45, RY[1] + 16]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ===================================================================== pr-l07
  A("arrayindex", function () {
    const W = 980, H = 580;
    const START = [14, 9, 22, 7, 31];
    const NAMES = ["score1", "score2", "score3", "score4", "score5"];
    const CW = 92, CH2 = 56;

    const steps = [
      { name: "1. One name", caption: "Five separate variables need five names and five lines of code. An array holds the same five values under one name." },
      { name: "2. Positions", caption: "Each value gets a position, counted from 0. Five values, so the positions run 0, 1, 2, 3, 4 - there is no position 5." },
      { name: "3. Reading", caption: "scores[2] does not mean 2. It means \"the value at position 2\", which is 22. The index is where to look, not what is there." },
      { name: "4. Changing", caption: "scores[1] = 40 overwrites what was at position 1. The array is still five long; one of its values is simply different now." },
      { name: "5. A loop", caption: "range(len(scores)) hands out 0 to 4, so one loop body visits every element. The total builds up as i walks along." },
      { name: "6. Off the end", caption: "len is 5, so the last valid index is 4. Asking for scores[5] reaches past the end of the array and the program stops." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("One-dimensional arrays: the index is a position");
      lang(d, "Python 3");

      const changed = s === 3 && d.seg(t, .3, .7) > .45;
      const list = START.slice();
      if (s >= 3) list[1] = s === 3 && !changed ? 9 : 40;
      if (s < 3) list[1] = 9;

      // ---- the code strip --------------------------------------------------
      const CODES = [
        ["score1 = 14", "score2 = 9      ... and three more names"],
        ["scores = [14, 9, 22, 7, 31]", ""],
        ["print(scores[2])", ""],
        ["scores[1] = 40", ""],
        ["for i in range(len(scores)):", "    total = total + scores[i]"],
        ["print(scores[5])", ""]
      ];
      d.box(40, 66, 900, 72, { fill: "#16233c", stroke: c.line, r: 12 });
      code(d, 64, 92, CODES[s][0], { size: 18, max: 600, fill: c.fg });
      if (CODES[s][1]) code(d, 64, 118, CODES[s][1], { size: 18, max: 600, fill: c.soft });
      else d.text(64, 118, s === 0 ? "" : "len(scores) is 5", { size: 13, weight: 700,
                  baseline: "middle", fill: c.dim, max: 300 });

      // ---- the array -------------------------------------------------------
      const g = s === 0 ? d.lerp(46, 8, d.seg(t, .18, .86)) : 8;
      const tot = 5 * (CW + g) - g;
      const bx = Math.round(490 - tot / 2);
      const at = i => bx + i * (CW + g) + CW / 2;
      const merged = s > 0 || d.seg(t, .18, .86) > .55;

      // which cell the pointer is on
      let cur = -1, over = false;
      if (s === 1) cur = Math.floor(d.seg(t, .1, .9) * 4.999);
      else if (s === 2) cur = 2;
      else if (s === 3) cur = 1;
      else if (s === 4) cur = Math.floor(d.seg(t, .05, .9) * 4.999);
      else if (s === 5) { cur = Math.min(5, Math.floor(d.seg(t, .1, .8) * 5.999)); over = cur >= 5; }

      list.forEach((v, i) => {
        const on = cur === i;
        d.box(bx + i * (CW + g), 176, CW, CH2, {
          fill: on ? "#2a3f68" : c.panel, stroke: on ? c.edge : c.line, on, r: 8,
          label: String(v), size: 24 });
        // separate names above, index numbers below
        if (!merged)
          d.text(at(i), 158, NAMES[i], { size: 12, weight: 700, align: "center",
                 baseline: "middle", fill: c.dim, max: CW - 6 });
        const ia = s === 1 ? d.seg(t, .08 + i * .1, .26 + i * .1) : merged ? 1 : 0;
        d.text(at(i), 176 + CH2 + 16, String(i), { size: 13, weight: 700, align: "center",
               baseline: "middle", fill: on ? c.edge : c.dim, alpha: ia, max: 40 });
      });
      if (merged)
        d.text(bx - 16, 204, "scores", { size: 14, weight: 800, align: "right",
               baseline: "middle", fill: c.soft, max: 150 });
      // the slot that is not there
      if (s === 5) {
        const gone = cur >= 5;
        d.box(bx + 5 * (CW + g), 176, CW, CH2, {
          fill: "#1a1020", stroke: gone ? c.bad : "#3a2a3a", r: 8, label: "?", size: 24,
          labelFill: gone ? c.bad : "#4a3a4a" });
        d.text(at(5), 176 + CH2 + 16, "5", { size: 13, weight: 700, align: "center",
               baseline: "middle", fill: gone ? c.bad : c.dim, max: 40 });
      }
      // the pointer
      if (cur >= 0 && s > 0) {
        const px = at(cur);
        d.path([[px - 9, 160], [px + 9, 160], [px, 172]],
               { fill: over ? c.bad : c.edge, stroke: null, width: 0 });
      }
      // ---- variables -------------------------------------------------------
      d.box(40, 290, 430, 150, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(64, 312, "variables", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 160 });
      let total = 0;
      if (s === 4) for (let i = 0; i <= cur && i < 5; i++) total += list[i];
      d.box(66, 334, 130, 64, { fill: c.panel, stroke: c.edge, on: s === 4,
            label: s === 4 ? String(cur) : "-", size: 26, sub: "i",
            subFill: c.soft, max: 106 });
      d.box(216, 334, 230, 64, { fill: c.panel, stroke: c.violet, on: s === 4,
            label: s === 4 ? String(total) : "-", size: 26, sub: "total", subFill: c.soft, max: 206 });
      d.text(66, 418, "last valid index is len(scores) - 1 = 4", { size: 12.5, weight: 700,
             baseline: "middle", fill: s === 5 ? c.bad : c.dim, max: 390 });

      // ---- output ----------------------------------------------------------
      d.box(500, 290, 440, 150, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(524, 312, "output", { size: 12.5, weight: 800, fill: c.dim, baseline: "middle", max: 160 });
      if (s === 2 && d.seg(t, .7, .9) > .5)
        d.text(524, 352, "22", { size: 30, weight: 800, baseline: "middle", fill: c.ok, max: 380 });
      else if (s === 4)
        d.text(524, 352, "total so far: " + total, { size: 22, weight: 800, baseline: "middle",
               fill: c.violet, max: 380 });
      else if (s === 5 && over)
        d.wrap(524, 336, "IndexError: list index out of range", 390, { size: 17, fill: c.bad });
      else if (s === 3 && changed)
        d.text(524, 352, "[14, 40, 22, 7, 31]", { size: 20, weight: 800, baseline: "middle",
               fill: c.edge, max: 390 });
      else
        d.text(524, 352, "(nothing printed yet)", { size: 15, weight: 700, baseline: "middle",
               fill: c.dim, max: 380 });
      // values in flight, drawn last so no panel can be painted over them
      if (s === 2) {
        const f = d.seg(t, .3, .75);
        if (f > 0 && f < .96) {
          const p = d.onCurve(at(2), 204, 620, 350, 70, f);
          d.chip(p[0], p[1], "22", { fill: c.ok, glow: true, size: 16, h: 30 });
        }
      }
      if (s === 3) {
        const f = d.seg(t, .22, .62);
        if (f > 0 && f < 1) {
          const p = d.onCurve(at(1), 120, at(1), 196, -40, f);
          d.chip(p[0], p[1], "40", { fill: c.edge, glow: true, size: 16, h: 30 });
        }
      }

      const notes = [
        ["Why arrays exist", "With five names you cannot loop. With one name and an index you can, however many values there are.", [at(2), 158]],
        ["Count from zero", "The fifth value is at index 4. Length and last index are never the same number.", [at(4) - 24, 176 + CH2 + 16]],
        ["Position, not value", "scores[2] is 22. There is nothing at all stored at \"2\" - 2 is the address you looked at.", [at(2), 180]],
        ["In place", "Assigning to scores[1] replaces one element. Nothing shuffles along and the array does not get longer.", [at(1), 180]],
        ["Length drives the loop", "Writing range(5) works until someone adds a value. range(len(scores)) is right whatever the length is.", [at(4), 176 + CH2 + 16]],
        ["Out of range", "Indexes 0 to 4 exist; 5 does not. Checking the index before you use it is what stops this crash.", [at(5), 180]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ===================================================================== pr-l08
  A("array2d", function () {
    const W = 980, H = 580;
    const GRID = [
      [3, 8, 1, 6, 4],
      [7, 2, 9, 5, 0],
      [4, 6, 3, 8, 2],
      [9, 1, 5, 7, 6]
    ];
    const CW = 74, CH2 = 58, GX = 6, GY = 6;
    const X0 = 196, Y0 = 176;
    const cxA = c2 => X0 + c2 * (CW + GX) + CW / 2;
    const cyA = r => Y0 + r * (CH2 + GY) + CH2 / 2;

    const steps = [
      { name: "1. A grid", caption: "A two-dimensional array is an array of arrays: four rows, each holding five values. One name, two numbers to reach a cell." },
      { name: "2. Row then column", caption: "grid[2][1] reads outwards in: pick row 2 first, then column 1 inside it. The two markers meet on one cell, holding 6." },
      { name: "3. The other way", caption: "grid[1][2] uses the same two numbers in the other order and lands somewhere else entirely - row 1, column 2, holding 9." },
      { name: "4. Changing a cell", caption: "grid[3][4] = 0 writes to one cell only. The row it sits in, and every other row, is otherwise untouched." },
      { name: "5. Walking a row", caption: "Hold the row still and let the column index move. One loop across row 2 adds 4, 6, 3, 8 and 2 to make 23." },
      { name: "6. Walking it all", caption: "A loop inside a loop: for each row, the column loop runs the whole way across. Four rows times five columns is twenty visits." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Two-dimensional arrays: row first, then column");
      lang(d, "Python 3");

      const CODES = [
        ["grid = [[3, 8, 1, 6, 4],", "        [7, 2, 9, 5, 0], ... ]"],
        ["print(grid[2][1])", ""],
        ["print(grid[1][2])", ""],
        ["grid[3][4] = 0", ""],
        ["for c in range(5):", "    total = total + grid[2][c]"],
        ["for r in range(4):", "    for c in range(5):"]
      ];
      d.box(40, 62, 900, 68, { fill: "#16233c", stroke: c.line, r: 12 });
      code(d, 64, 86, CODES[s][0], { size: 17, max: 560, fill: c.fg });
      if (CODES[s][1]) code(d, 64, 112, CODES[s][1], { size: 17, max: 560, fill: c.soft });

      // ---- which cell is being addressed ----------------------------------
      let rr = -1, cc = -1, visited = 0, rowSweep = -1;
      if (s === 1) { rr = d.seg(t, .08, .4) > .1 ? 2 : -1; cc = d.seg(t, .42, .72) > .1 ? 1 : -1; }
      else if (s === 2) { rr = 1; cc = 2; }
      else if (s === 3) { rr = 3; cc = 4; }
      else if (s === 4) { rr = 2; cc = Math.floor(d.seg(t, .06, .9) * 4.999); rowSweep = 2; }
      else if (s === 5) {
        visited = Math.floor(d.seg(t, .03, .96) * 19.999);
        rr = Math.floor(visited / 5); cc = visited % 5;
      }
      const written = s === 3 && t >= .4;          // the instant the chip lands
      const rowsIn = s === 0 ? Math.floor(d.seg(t, .08, .78) * 3.999) : 3;

      // column and row headings
      for (let j = 0; j < 5; j++)
        d.text(cxA(j), 156, "col " + j, { size: 12, weight: 800, align: "center",
               baseline: "middle", fill: cc === j ? c.teal : c.dim, max: CW - 4 });
      for (let i = 0; i < 4; i++)
        d.text(186, cyA(i), "row " + i, { size: 12.5, weight: 800, align: "right",
               baseline: "middle", fill: rr === i ? c.orange : c.dim, alpha: i <= rowsIn ? 1 : .3,
               max: 90 });

      // the row and column bands
      if (rr >= 0 && rr <= rowsIn)
        d.box(X0 - 5, Y0 + rr * (CH2 + GY) - 5, 5 * (CW + GX) - GX + 10, CH2 + 10,
              { fill: "#2c2415", stroke: c.orange, r: 10 });
      if (cc >= 0)
        d.box(X0 + cc * (CW + GX) - 5, Y0 - 5, CW + 10, 4 * (CH2 + GY) - GY + 10,
              { fill: "rgba(64,196,255,0.12)", stroke: c.teal, r: 10 });

      GRID.forEach((row, i) => {
        row.forEach((v, j) => {
          const hit = rr === i && cc === j;
          const show = written && i === 3 && j === 4 ? 0 : v;
          const inRow = rowSweep === i && j <= cc;
          d.box(X0 + j * (CW + GX), Y0 + i * (CH2 + GY), CW, CH2, {
            fill: hit ? "#2a3f68" : inRow ? "#1d4a35" : c.panel,
            stroke: hit ? c.edge : inRow ? c.ok : c.line, on: hit, r: 8,
            label: String(show), size: 23, alpha: i <= rowsIn ? 1 : .18 });
        });
      });

      // ---- the readout -----------------------------------------------------
      d.box(640, 150, 300, 278, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(664, 172, "the address being used", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 260 });
      d.box(666, 192, 124, 56, { fill: c.panel, stroke: c.orange, on: rr >= 0,
            label: rr >= 0 ? String(rr) : "-", size: 26, sub: "row", subFill: c.soft, max: 100 });
      d.box(806, 192, 124, 56, { fill: c.panel, stroke: c.teal, on: cc >= 0,
            label: cc >= 0 ? String(cc) : "-", size: 26, sub: "column", subFill: c.soft, max: 100 });
      const addr = rr >= 0 && cc >= 0 ? "grid[" + rr + "][" + cc + "]" : "grid[r][c]";
      code(d, 666, 276, addr, { size: 19, max: 264, fill: c.fg });
      let big = "-", lab = "value there", col = c.edge;
      if (s === 4) {
        let tot = 0;
        for (let j = 0; j <= cc; j++) tot += GRID[2][j];
        big = String(tot); lab = "total across row 2"; col = c.ok;
      } else if (s === 5) {
        big = (visited + 1) + " of 20"; lab = "cells visited"; col = c.violet;
      } else if (rr >= 0 && cc >= 0) {
        big = String(written && rr === 3 && cc === 4 ? 0 : GRID[rr][cc]);
      }
      d.box(666, 300, 264, 68, { fill: c.panel, stroke: col, on: s >= 1,
            label: big, size: 30, sub: lab, subFill: c.soft, max: 240 });
      d.text(666, 396, s === 5 ? "the inner loop finishes first"
                               : "two numbers, always this order", {
        size: 12.5, weight: 700, baseline: "middle", fill: c.dim, max: 262 });

      // values in flight, drawn last so the readout panel cannot cover them
      if (s === 1 || s === 2) {
        const f = d.seg(t, s === 1 ? .74 : .3, s === 1 ? .95 : .7);
        if (f > 0 && f < .96) {
          const p = d.onCurve(cxA(cc), cyA(rr), 760, 316, 60, f);
          d.chip(p[0], p[1], String(GRID[rr][cc]), { fill: c.ok, glow: true, size: 17, h: 32 });
        }
      }
      if (s === 3 && !written) {
        const f = d.seg(t, .08, .4);
        if (f < 1) {
          const p = d.onCurve(700, 120, cxA(4), cyA(3), -60, f);
          d.chip(p[0], p[1], "0", { fill: c.edge, glow: true, size: 17, h: 32 });
        }
      }

      const notes = [
        ["An array of arrays", "grid[2] on its own is a whole row: [4, 6, 3, 8, 2]. The second index then picks inside that row.", [618, cyA(2)]],
        ["Outer index first", "The row number is written first because it is applied first. Rows are the outer array, columns the inner one.", [cxA(1) - 30, cyA(2) - 26]],
        ["Not the same cell", "grid[2][1] is 6 and grid[1][2] is 9. Swapping the two numbers is the commonest 2D array mistake there is.", [cxA(2) - 30, cyA(1) - 26]],
        ["One cell only", "A 2D array is written to the same way it is read. Both indexes together name exactly one place.", [cxA(4) - 30, cyA(3) - 26]],
        ["Row fixed, column moving", "grid[2][c] keeps the row still. Swap them round, grid[r][2], and you walk down a column instead.", [618, cyA(2)]],
        ["Loop inside loop", "The outer loop runs four times, the inner one five times for each of those: 4 x 5 = 20 cells, every time.", [618, cyA(3)]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ===================================================================== pr-l09
  A("callreturn", function () {
    const W = 980, H = 580;
    const MAIN = ["total = vat(40)", "print(total)", "print(tax)"];
    const SUB = ["def vat(price):", "    tax = price * 0.2", "    return price + tax"];

    const steps = [
      { name: "1. Two parts", caption: "The def block describes a job but does not do it. Nothing inside vat runs until something in the main program calls it." },
      { name: "2. The call", caption: "vat(40) hands 40 over. 40 is the argument; price is the parameter that catches it. The main program now waits." },
      { name: "3. Inside", caption: "price * 0.2 is worked out and stored in tax. tax is created inside vat, so only the lines inside vat can see it." },
      { name: "4. Return", caption: "return sends one value - 48.0 - back to exactly where the call was made, and total catches it on the way out." },
      { name: "5. Local and gone", caption: "The moment vat finishes, price and tax are destroyed. print(tax) in the main program has nothing to print, so it fails." },
      { name: "6. Call it again", caption: "vat(120) runs the very same three lines with a different argument and gives back 144.0. One sub-program, any number of calls." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Sub-programs: arguments in, one value back");
      lang(d, "Python 3");

      const arg = s === 5 ? 120 : 40;
      const tax = arg * 0.2, ret = arg + tax, retTxt = ret.toFixed(1);
      /* Where we are in the round trip. Step 6 replays the whole journey inside
       * one step, so its phases are cut from t rather than taken from s. */
      const going = s === 1 ? d.seg(t, .18, .78) : s === 5 ? d.seg(t, .05, .3) : -1;
      const inside = s === 2 || (s === 5 && t >= .28 && t < .72);
      const coming = s === 3 ? d.seg(t, .18, .78)
                   : s === 5 ? (t >= .66 ? d.seg(t, .66, .92) : -1) : -1;
      const haveTotal = (s === 3 && coming > .9) || s === 4 || (s === 5 && t >= .88);
      const liveLocals = (s === 1 && going > .9) || s === 2 || s === 3 ||
                         (s === 5 && t >= .28 && t < .88);
      const wiped = s === 4;
      const showTax = s === 2 || s === 3 || (s === 5 && t >= .42 && t < .88);

      // ---- the main program ------------------------------------------------
      d.box(34, 58, 388, 236, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 80, "main program", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 200 });
      MAIN.forEach((L, i) => {
        const y = 118 + i * 36;
        const lit = (i === 0 && (s === 1 || s === 3 || (s === 5 && t < .3))) ||
                    (i === 1 && haveTotal) || (i === 2 && s === 4);
        const txt = i === 0 ? "total = vat(" + arg + ")" : L;
        if (lit) d.box(48, y - 15, 356, 30, { fill: i === 2 ? "#4a1d1d" : "#2a3f68",
                 stroke: i === 2 ? c.bad : c.edge, on: true, r: 7 });
        code(d, 62, y, txt, { size: 16, max: 320,
             fill: i === 2 ? (s === 4 ? c.fg : c.dim) : lit ? c.fg : c.soft,
             alpha: i === 2 && s !== 4 ? .5 : 1 });
      });
      if (haveTotal)
        d.text(266, 154, retTxt, { size: 16, weight: 800, baseline: "middle",
               fill: c.ok, max: 120 });
      if (s === 4)
        d.text(62, 240, "NameError: name 'tax' is not defined", { size: 13.5, weight: 700,
               baseline: "middle", fill: c.bad, max: 348 });
      if (s === 0)
        d.text(62, 240, "this is where the program starts", { size: 13, weight: 700,
               baseline: "middle", fill: c.dim, max: 348 });

      // ---- the sub-program -------------------------------------------------
      d.box(558, 58, 388, 236, { fill: "#16233c", stroke: inside ? c.violet : c.line,
                                 r: 14, on: inside });
      d.text(580, 80, "sub-program", { size: 12.5, weight: 800,
             fill: inside ? c.violet : c.dim, baseline: "middle", max: 200 });
      SUB.forEach((L, i) => {
        const y = 118 + i * 36;
        const lit = (i === 0 && !inside && going > .9 && (s !== 5 || t < .3)) ||
                    (i === 1 && inside && (s === 2 || t < .52)) ||
                    (i === 2 && (s === 3 || (s === 5 && t >= .52 && t < .92)));
        if (lit) d.box(572, y - 15, 356, 30, { fill: "#2f2347", stroke: c.violet, on: true, r: 7 });
        code(d, 586, y, L, { size: 16, max: 340, fill: lit ? c.fg : c.soft, alpha: lit ? 1 : .7 });
      });
      if (s === 0)
        d.text(586, 240, "written once, never runs on its own", { size: 13, weight: 700,
               baseline: "middle", fill: c.dim, max: 340 });

      // ---- the two journeys ------------------------------------------------
      const inCol = going > 0 ? c.edge : "#2a3b56";
      d.arrow(428, 130, 552, 130, { stroke: inCol, width: going > 0 ? 3 : 1.6,
              glow: going > 0, dash: going > 0 ? null : [5, 5], size: 9 });
      d.text(490, 102, "argument", { size: 12, weight: 800, align: "center",
             baseline: "middle", fill: inCol, max: 120 });
      const outCol = coming > 0 ? c.ok : "#2a3b56";
      d.arrow(552, 252, 428, 252, { stroke: outCol, width: coming > 0 ? 3 : 1.6,
              glow: coming > 0, dash: coming > 0 ? null : [5, 5], size: 9 });
      d.text(490, 282, "return value", { size: 12, weight: 800, align: "center",
             baseline: "middle", fill: outCol, max: 120 });
      if (going > 0 && going < 1)
        d.chip(d.lerp(432, 548, going), 130, String(arg),
               { fill: c.edge, glow: true, size: 15, h: 30 });
      if (coming > 0 && coming < 1)
        d.chip(d.lerp(548, 432, coming), 252, retTxt,
               { fill: c.ok, glow: true, size: 15, h: 30 });

      // ---- what exists in memory -------------------------------------------
      d.box(34, 316, 912, 124, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 338, "what exists in memory right now", { size: 12.5, weight: 800,
             fill: c.dim, baseline: "middle", max: 400 });
      d.box(56, 356, 420, 70, { fill: "#141f36", stroke: c.line, r: 10 });
      d.text(76, 374, "the main program", { size: 11.5, weight: 800, fill: c.soft,
             baseline: "middle", max: 180 });
      d.box(76, 384, 180, 32, { fill: c.panel, stroke: haveTotal ? c.ok : "#2a3b56",
            on: haveTotal, r: 8, label: haveTotal ? "total = " + retTxt : "total not set yet",
            size: 14, labelFill: haveTotal ? c.fg : c.dim, max: 158 });
      d.box(500, 356, 426, 70, {
        fill: liveLocals ? "#2f2347" : "#141f36",
        stroke: liveLocals ? c.violet : wiped ? c.bad : "#2a3b56", r: 10,
        on: liveLocals });
      d.text(520, 374, liveLocals ? "inside vat - while it is running"
                                  : wiped ? "inside vat - destroyed when it returned"
                                          : "inside vat - not running",
             { size: 11.5, weight: 800, fill: liveLocals ? c.violet : wiped ? c.bad : c.dim,
               baseline: "middle", max: 390 });
      [["price = " + arg, 520, liveLocals], ["tax = " + tax.toFixed(1), 700, showTax]]
        .forEach(v => {
          d.box(v[1], 384, 170, 32, {
            fill: v[2] ? c.panel : "#141f36", stroke: v[2] ? c.violet : "#2a3b56",
            on: v[2], r: 8, label: v[2] ? v[0] : s === 0 ? "not created" : "gone", size: 14,
            labelFill: v[2] ? c.fg : wiped ? c.bad : c.dim, max: 148 });
        });

      const notes = [
        ["Defining is not running", "A def block is a recipe card. The program skips straight past it until a call asks for the job to be done.", [860, 118]],
        ["Argument and parameter", "The value in the brackets at the call is the argument. The name in the brackets at the def is the parameter.", [490, 148]],
        ["Local means local", "tax is created by a line inside vat, so it lives only there. Another sub-program could have its own tax and never clash.", [900, 391]],
        ["One value back", "return both ends the sub-program and hands a value to the exact spot the call was written in.", [460, 252]],
        ["Scope, in one picture", "The right-hand half of memory has emptied. Nothing outside vat was ever able to see what was in it.", [900, 391]],
        ["Why sub-programs pay", "Change the 0.2 once and every call is fixed. That is reuse, and it is the whole point of writing one.", [860, 154]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });

  // ===================================================================== pr-l12
  A("randomdist", function () {
    const W = 980, H = 580;
    const SEEDS = [7, 158, 1, 32, 171, 110, 61, 20, 175, 198, 161];
    const SEQ = [3, 2, 3, 4, 1, 2, 5, 4, 5, 4];
    const T10 = [1, 2, 2, 3, 2, 0];
    const T600 = [98, 100, 97, 102, 105, 98];
    const BW = 56, BG = 22;
    const BX0 = 470, BASE = 406, BTOP = 126;
    const bx = i => BX0 + i * (BW + BG);
    // the feedback loop runs round the left of the chain, clear of every box
    const LOOP = [[166, 310], [66, 310], [66, 132], [166, 132]];

    const steps = [
      { name: "1. A seed goes in", caption: "Nothing random happens here. A starting number - the seed - is fed into an ordinary piece of arithmetic." },
      { name: "2. A number comes out", caption: "The arithmetic gives 158, and 1 + 158 MOD 6 squeezes it into the range 1 to 6. The first draw is a 3." },
      { name: "3. It becomes the next seed", caption: "158 is kept and used as the seed for the next draw. One starting number therefore fixes the entire sequence that follows." },
      { name: "4. Ten draws", caption: "Ten draws in, the tally is lumpy: three 4s, only one 1, and 6 has not come up at all. Small samples always look unfair." },
      { name: "5. Six hundred draws", caption: "Keep going and the bars level off near 100 each. Every value in 1 to 6 is equally likely, which only shows up over many draws." },
      { name: "6. Same seed, same run", caption: "Start from seed 7 again and you get the identical ten numbers. Useful for testing a program, useless for making a password." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Pseudo-random numbers: an algorithm, not luck");
      lang(d, "Python 3");

      const step2 = s === 1 ? d.seg(t, .25, .8) : s >= 2 ? 1 : 0;
      const loop = s === 2 ? d.seg(t, .2, .85) : s > 2 ? 1 : 0;
      const seedShown = s >= 2 && loop > .9 ? SEEDS[1] : SEEDS[0];
      const pairStep = s === 5 ? Math.floor(d.seg(t, .06, .95) * 10.999) : -1;
      const draws = s === 3 ? Math.floor(d.seg(t, .04, .95) * 10.999)
                   : s === 4 ? Math.round(d.lerp(10, 600, d.seg(t, .04, .92)))
                   : s === 5 ? Math.min(10, pairStep + 1)
                   : s >= 1 && step2 > .6 ? 1 : 0;

      // ---- the generator ---------------------------------------------------
      d.box(34, 60, 386, 290, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 82, "the generator", { size: 12.5, weight: 800, fill: c.dim,
             baseline: "middle", max: 200 });
      d.box(170, 106, 160, 52, { fill: c.panel, stroke: c.edge, on: s === 0 || loop > .9,
            label: String(seedShown), size: 24, sub: "seed", subFill: c.soft, max: 136 });
      const feeding = s === 0 ? d.seg(t, .2, .7) : 1;
      d.arrow(250, 160, 250, 182, { stroke: feeding > .5 ? c.edge : "#2a3b56",
              width: feeding > .5 ? 3 : 1.6, size: 8 });
      d.box(110, 186, 286, 76, { fill: c.panel, stroke: c.violet, on: step2 > .3,
            label: "next = (seed * 21 + 11) MOD 256", size: 13,
            sub: "value = 1 + next MOD 6", subFill: c.soft, max: 266 });
      d.arrow(250, 264, 250, 284, { stroke: step2 > .6 ? c.ok : "#2a3b56",
              width: step2 > .6 ? 3 : 1.6, size: 8 });
      d.box(170, 286, 160, 48, { fill: step2 > .6 ? "#1d4a35" : c.panel,
            stroke: step2 > .6 ? c.ok : "#2a3b56", on: step2 > .6,
            label: step2 > .6 ? "next " + SEEDS[1] + " → " + SEQ[0] : "-",
            size: 14, max: 136 });
      // the seed travelling in
      if (s === 0 && feeding > 0 && feeding < 1)
        d.chip(250, d.lerp(142, 206, feeding), String(SEEDS[0]),
               { fill: c.edge, glow: true, size: 14, h: 28 });
      // the feedback loop, round the outside of the chain
      const lc = loop > 0 ? c.orange : "#2a3b56";
      d.path(LOOP.slice(0, 3), { stroke: lc, width: loop > 0 ? 3 : 1.6,
             glow: loop > 0, dash: loop > 0 ? null : [5, 5] });
      d.arrow(66, 132, 164, 132, { stroke: lc, width: loop > 0 ? 3 : 1.6,
              glow: loop > 0, dash: loop > 0 ? null : [5, 5], size: 8 });
      d.text(116, 334, "next seed", { size: 11.5, weight: 800, align: "center",
             baseline: "middle", fill: lc, max: 96 });
      if (loop > 0 && loop < 1) {
        const p = d.onPath(LOOP, loop);
        d.chip(p[0], p[1], String(SEEDS[1]), { fill: c.orange, glow: true, size: 13, h: 26 });
      }

      // ---- the sequence ----------------------------------------------------
      d.box(34, 360, 386, 80, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(56, 376, s === 5 ? "two separate runs, both from seed 7"
                              : "the numbers drawn, in order",
             { size: 11.5, weight: 800, fill: c.dim, baseline: "middle", max: 350 });
      const shownA = SEQ.map((v, i) => (s === 5 ? (i <= pairStep ? String(v) : "")
                                                : (i < Math.min(10, draws) ? String(v) : "")));
      const fA = {};
      if (s === 5 && pairStep >= 0 && pairStep < 10) fA[pairStep] = c.edge;
      else if (s === 3 && draws >= 1 && draws <= 10) fA[draws - 1] = c.edge;
      d.cells(54, 390, shownA, { cw: 28, ch: 22, gap: 4, fills: fA, size: 13 });
      if (s === 5) {
        const fB = {};
        if (pairStep >= 0 && pairStep < 10) fB[pairStep] = c.ok;
        d.cells(54, 416, shownA, { cw: 28, ch: 22, gap: 4, fills: fB, size: 13 });
        d.text(378, 401, "run 1", { size: 11, weight: 700, baseline: "middle",
               fill: c.dim, max: 44 });
        d.text(378, 427, "run 2", { size: 11, weight: 700, baseline: "middle",
               fill: c.dim, max: 44 });
      }

      // ---- the tally -------------------------------------------------------
      d.box(440, 60, 506, 380, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(462, 84, "how many times each value came out", { size: 12.5, weight: 800,
             fill: c.dim, baseline: "middle", max: 330 });
      d.text(924, 84, (s >= 3 ? draws : 0) + " draws", { size: 13, weight: 800, align: "right",
             baseline: "middle", fill: s >= 3 ? c.edge : c.dim, max: 140 });
      d.text(462, 106, s >= 3 ? "dashed line = an equal share, " + Math.round(draws / 6) + " each"
                              : "nothing drawn yet",
             { size: 12, weight: 700, baseline: "middle", fill: s >= 3 ? c.teal : c.dim, max: 440 });

      // counts for the current moment
      const counts = [0, 0, 0, 0, 0, 0];
      if (s === 3 || s === 5) {
        for (let i = 0; i < Math.min(10, draws); i++) counts[SEQ[i] - 1]++;
      } else if (s === 4) {
        const f = d.clamp((draws - 10) / 590, 0, 1);
        for (let i = 0; i < 6; i++) counts[i] = Math.round(d.lerp(T10[i], T600[i], f));
      } else if (draws > 0) counts[SEQ[0] - 1] = 1;
      const peak = Math.max(1, Math.max.apply(null, counts));
      const span = BASE - BTOP;
      const scale = span / Math.max(peak * 1.15, 3);

      d.line(462, BASE, 924, BASE, { stroke: c.line, width: 2 });
      // the equal-share line
      const share = (s >= 3 ? draws : 0) / 6;
      if (s >= 3) {
        const y = BASE - share * scale;
        d.line(462, y, 924, y, { stroke: c.teal, width: 1.6, dash: [6, 5] });
      }
      for (let i = 0; i < 6; i++) {
        const h = Math.max(0, counts[i] * scale);
        const hot = ((s === 3 || s === 5) && draws >= 1 && SEQ[Math.min(9, draws - 1)] === i + 1) ||
                    (s < 3 && draws > 0 && i + 1 === SEQ[0]);
        if (h > 2)
          d.box(bx(i), BASE - h, BW, h, { fill: hot ? "#3a2f1a" : "#243a60",
                stroke: hot ? c.edge : c.info, on: hot, r: 6 });
        if (counts[i] > 0)
          d.text(bx(i) + BW / 2, BASE - h - 14, String(counts[i]), { size: 13, weight: 800,
                 align: "center", baseline: "middle", fill: hot ? c.edge : c.soft, max: BW });
        d.text(bx(i) + BW / 2, BASE + 18, String(i + 1), { size: 15, weight: 800,
               align: "center", baseline: "middle", fill: c.soft, max: BW });
      }
      d.text(693, BASE + 40, "the six possible values", { size: 12, weight: 700,
             align: "center", baseline: "middle", fill: c.dim, max: 440 });

      const notes = [
        ["Not really random", "There is no dice in a computer. A seed and a sum give a number that only looks unpredictable.", [250, 132]],
        ["Squeezing the range", "MOD 6 gives 0 to 5, so 1 is added to reach 1 to 6. Every one of the six leftovers is as common as the others.", [250, 258]],
        ["One seed, whole sequence", "Because each number sets up the next, the seed alone decides all of them. Many languages seed from the clock to hide this.", [66, 224]],
        ["Small samples lie", "Ten draws cannot show an even spread. Judging a generator on a handful of numbers tells you nothing.", [bx(5) + BW / 2, BASE - 20]],
        ["Equally likely", "Equally likely does not mean equal counts. It means the counts drift towards equal as the number of draws grows.", [693, BASE - share * scale]],
        ["Repeatable is a trade", "The same seed replaying the same test is a gift when debugging. For keys and passwords it is the whole weakness.", [44, 414]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 130, alpha: d.seg(t, 0, .25) });
    } };
  });
})();
