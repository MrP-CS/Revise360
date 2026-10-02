/* Revise 360 - plain hint diagrams for the middle of the Python course (topic PY).
 *
 * The companion to js/diag-pyhint.js, and written to the same standard. These
 * six replace the hints that used to point at the taught-lesson diagrams in
 * js/diag-prog.js (strslice, arrayindex, array2d, callreturn, filelines). Those
 * are good lessons and bad hints: six steps, three panels, a history strip and a
 * paragraph of annotation is a lot to take in when you are already stuck, and
 * the teacher's word for them was "quite overwhelming".
 *
 * So, exactly as in diag-pyhint.js:
 *
 *   - one idea per step, three or four steps;
 *   - at most two things on the stage at once - the thing being worked on, and
 *     the answer it produced;
 *   - no history strips, no running tallies, no second annotation panel;
 *   - nothing smaller than 18px, code at 22, headings at 18, answers at 44;
 *   - one caption per step, twelve words at the outside;
 *   - no d.note anywhere;
 *   - a lot of empty canvas.
 *
 * All six are Python 3, and every value drawn below was worked by hand and then
 * checked against python3 before it was written down:
 *
 *   pystring   word = "Python".  len(word) -> 6, last position 5.
 *              word[2] -> "t".   word[0:3] -> "Pyt" (0, 1, 2 - not 3).
 *   pylist     scores = [7, 4, 9].  scores[0] -> 7.  len(scores) -> 3.
 *              scores[2] = 5 leaves [7, 4, 5].
 *   pygrid     grid = [[1,2,3],[4,5,6],[7,8,9]].
 *              grid[1][2] -> 6.   grid[2][1] -> 8.  Same digits, other cell.
 *   pyfunc     def double(n): return n * 2.  answer = double(5) -> 10.
 *              One value in, one value back.
 *   pyfile     names.txt holds Ava, Ben, Cara. Three readline() calls take them
 *              in order, never the same one twice. close() breaks the link.
 *   pyround    round(3.456)    -> 3     (.456 is under a half)
 *              round(3.456, 2) -> 3.46  (the 6 pushes 3.45 up)
 *              round(3.456, 1) -> 3.5   (.456 is over .45)
 *   pypower    3 ** 2 is 3 * 3     -> 9    two 3s
 *              2 ** 3 is 2 * 2 * 2 -> 8    three 2s
 *              Same two digits, the other way round, a different answer.
 *
 * pypower exists because pyarith was cut back to /, // and %, which left the
 * two ** questions in lesson 2 with nothing sensible to open.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  const SZ = { title: 26, head: 18, body: 20, code: 22, value: 44, mid: 30 };

  // The language, said once, quietly, in the corner.
  function lang(d) {
    d.text(952, 30, "Python 3", { size: SZ.head, weight: 700, align: "right",
                                  baseline: "middle", fill: d.c.dim, max: 160 });
  }

  /* The step caption, the full width of the canvas because nothing shares the
   * line with it. d.noCaption is honoured exactly as the engine does it: on the
   * web the caption is real text beside the canvas, so the canvas copy is left
   * out there. */
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
  function flying(d, px, py, label, col, alpha) {
    d.chip(px, py, label, { fill: col, glow: true, size: 24, h: 42, alpha,
                            w: Math.max(56, d.measure(label, 24, 700) + 26) });
  }

  /* The program. Plain text, no panel around it: a box drawn round code is one
   * more region to take in. The line being run gets a bar beside it. */
  function prog(d, lines, px, y0, dy, o) {
    o = o || {};
    const c = d.c, size = o.size || SZ.code, max = o.max || 420;
    lines.forEach((L, i) => {
      const y = y0 + i * dy;
      const on = i === o.lit;
      const dead = o.dead && o.dead.indexOf(i) >= 0;
      if (on) d.line(px - 20, y - dy * .4, px - 20, y + dy * .4,
                     { stroke: c.edge, width: 5 });
      d.text(px, y, L, { size, weight: 600, baseline: "middle", max,
                         fill: on ? c.fg : dead ? c.dim : c.soft, alpha: dead ? .45 : 1 });
    });
  }

  // A value sitting in a box, drawn big and centred. The box carries one thing.
  function value(d, b, s, o) {
    o = o || {};
    const c = d.c;
    d.box(b[0], b[1], b[2], b[3], {
      fill: o.fill || c.panel, stroke: o.stroke || c.line, on: o.on, r: 14,
      alpha: o.alpha });
    if (s !== undefined && s !== null)
      d.text(b[0] + b[2] / 2, b[1] + b[3] / 2, String(s), {
        size: o.size || SZ.value, weight: 800, align: "center", baseline: "middle",
        fill: o.textFill || c.fg, max: b[2] - 36, alpha: o.alpha });
  }

  // A small pointer triangle above something, for "this one".
  function tip(d, px, py, col) {
    d.path([[px - 10, py - 14], [px + 10, py - 14], [px, py]],
           { fill: col, stroke: null, width: 0 });
  }

  // The same, lying on its side, for a read pointer beside a line of a file.
  function rtip(d, px, py, col) {
    d.path([[px, py - 11], [px, py + 11], [px + 15, py]],
           { fill: col, stroke: null, width: 0 });
  }

  // ============================================================== PY: strings
  A("pystring", function () {
    const H = 580;
    const CH = "Python".split("");
    const CW = 92, GAP = 12, BH = 92, X0 = 184, CY = 150;
    const at = i => X0 + i * (CW + GAP) + CW / 2;        // 230 334 438 542 646 750
    const ANS = [340, 340, 300, 112];
    const EXPR = ["word = \"Python\"", "len(word)", "word[2]", "word[0:3]"];

    const steps = [
      { name: "1. Positions from 0", caption: "Every character has a position, counting from 0." },
      { name: "2. len() counts them", caption: "len() gives 6. The last position is 5." },
      { name: "3. One character", caption: "word[2] is the character at position 2." },
      { name: "4. A slice", caption: "word[0:3] takes 0, 1 and 2. It stops before 3." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Strings: positions count from 0", { size: SZ.title });
      lang(d);
      prog(d, [EXPR[s]], 76, 104, 50, { lit: 0, max: 740 });

      const pop = i => s === 0 ? d.seg(t, .04 + i * .09, .28 + i * .09) : 1;
      const counted = s === 1 ? Math.min(6, Math.floor(d.seg(t, .08, .74) * 6.999)) : 0;
      const sliceTo = s === 3 ? Math.min(2, Math.floor(d.seg(t, .08, .6) * 2.999)) : -1;

      // ---- the one word ----------------------------------------------------
      CH.forEach((ch, i) => {
        let on = false, faded = false;
        if (s === 1) on = i < counted;
        else if (s === 2) on = i === 2;
        else if (s === 3) { on = i <= sliceTo; faded = i >= 3; }
        const a = faded ? .25 : pop(i);
        d.box(X0 + i * (CW + GAP), CY, CW, BH, {
          fill: on ? "#2a3f68" : c.panel, stroke: on ? c.edge : c.line, on, r: 12,
          label: ch, size: 38, alpha: a });
        d.text(at(i), CY + BH + 28, String(i), {
          size: SZ.head, weight: 700, align: "center", baseline: "middle",
          fill: on ? c.edge : c.dim, max: 44, alpha: a });
      });

      // the slice stops short: a fence rather than a sentence about a fence
      if (s === 3) {
        const fx = X0 + 3 * (CW + GAP) - GAP / 2;         // 490
        d.line(fx, CY - 20, fx, CY + BH + 46,
               { stroke: c.bad, width: 2.4, dash: [7, 6], alpha: d.seg(t, .12, .5) });
      }
      if (s === 2) tip(d, at(2), CY - 10, c.edge);

      // ---- the answer ------------------------------------------------------
      if (s >= 1) {
        const landed = s === 1 ? counted >= 6 : d.seg(t, .5, .9) > .8;
        const txt = s === 1 ? (counted > 0 ? String(counted) : "...")
                  : s === 2 ? (landed ? "\"t\"" : "...")
                  : (landed ? "\"Pyt\"" : "...");
        // the heading sits on the far side of the box, clear of the value
        // coming down into it
        head(d, ANS[0] + ANS[2], ANS[1] - 26, "the answer", null, "right");
        value(d, ANS, txt, {
          stroke: txt === "..." ? c.line : landed ? c.ok : c.edge, on: txt !== "...",
          size: txt === "..." ? SZ.mid : SZ.value,
          textFill: txt === "..." ? c.dim : c.fg });
      }

      // ---- what moves ------------------------------------------------------
      if (s === 2 || s === 3) {
        const f = d.seg(t, s === 2 ? .22 : .3, s === 2 ? .68 : .76);
        if (f > 0 && f < 1) {
          const from = s === 2 ? at(2) : at(1);
          const p = d.onCurve(from, CY + BH + 46, ANS[0] + ANS[2] / 2, ANS[1] - 6, 26, f);
          flying(d, p[0], p[1], s === 2 ? "t" : "Pyt", c.edge);
        }
      }

      cap(d, steps[s].caption);
    } };
  });

  // ================================================================ PY: lists
  A("pylist", function () {
    const H = 580;
    const CW = 120, GAP = 16, BH = 104, X0 = 294, CY = 170;
    const at = i => X0 + i * (CW + GAP) + CW / 2;         // 354 490 626
    const ANS = [330, 364, 320, 100];
    const EXPR = ["scores = [7, 4, 9]", "scores[0]", "len(scores)", "scores[2] = 5"];

    const steps = [
      { name: "1. Values in positions", caption: "A list holds several values, each with a position." },
      { name: "2. Reading one", caption: "scores[0] reads the value at position 0." },
      { name: "3. Counting them", caption: "len() gives 3. The last position is 2." },
      { name: "4. Changing one", caption: "scores[2] = 5 replaces the 9 at position 2." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Lists: every value has a position", { size: SZ.title });
      lang(d);
      prog(d, [EXPR[s]], 76, 104, 50, { lit: 0, max: 740 });

      const pop = i => s === 0 ? d.seg(t, .06 + i * .17, .36 + i * .17) : 1;
      const counted = s === 2 ? Math.min(3, Math.floor(d.seg(t, .1, .68) * 3.999)) : 0;
      const swap = s === 3 ? d.seg(t, .22, .66) : 0;
      const vals = [7, 4, s === 3 && swap > .9 ? 5 : 9];

      // ---- the one short list ----------------------------------------------
      vals.forEach((v, i) => {
        let on = false;
        if (s === 1) on = i === 0;
        else if (s === 2) on = i < counted;
        else if (s === 3) on = i === 2;
        d.box(X0 + i * (CW + GAP), CY, CW, BH, {
          fill: on ? "#2a3f68" : c.panel, stroke: on ? c.edge : c.line, on, r: 12,
          label: String(v), size: SZ.value, alpha: pop(i) });
        d.text(at(i), CY + BH + 24, String(i), {
          size: SZ.head, weight: 700, align: "center", baseline: "middle",
          fill: on ? c.edge : c.dim, max: 44, alpha: pop(i) });
      });
      if (s === 1) tip(d, at(0), CY - 10, c.edge);
      if (s === 3) tip(d, at(2), CY - 10, c.edge);

      // ---- the answer, when there is one -----------------------------------
      // An assignment hands nothing back, so step 4 has no answer box at all.
      if (s === 1 || s === 2) {
        const landed = s === 2 ? counted >= 3 : d.seg(t, .5, .9) > .8;
        const txt = s === 2 ? (counted > 0 ? String(counted) : "...")
                            : (landed ? "7" : "...");
        head(d, ANS[0] + ANS[2], ANS[1] - 26, "the answer", null, "right");
        value(d, ANS, txt, {
          stroke: txt === "..." ? c.line : landed ? c.ok : c.edge, on: txt !== "...",
          size: txt === "..." ? SZ.mid : SZ.value,
          textFill: txt === "..." ? c.dim : c.fg });
      }

      // ---- what moves -------------------------------------------------------
      if (s === 1) {
        const f = d.seg(t, .22, .68);
        if (f > 0 && f < 1) {
          const p = d.onCurve(at(0), CY + BH + 42, ANS[0] + ANS[2] / 2, ANS[1] - 6, 30, f);
          flying(d, p[0], p[1], "7", c.edge);
        }
      }
      if (s === 3 && swap > 0 && swap < 1) {
        const p = d.onCurve(250, 104, at(2), CY - 20, 60, swap);
        flying(d, p[0], p[1], "5", c.ok);
      }

      cap(d, steps[s].caption);
    } };
  });

  // =============================================================== PY: 2-D list
  A("pygrid", function () {
    const H = 580;
    const G = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    const CW = 86, BH = 78, GAP = 10, X0 = 280, Y0 = 156;
    const cx = j => X0 + j * (CW + GAP) + CW / 2;         // 323 419 515
    const cy = i => Y0 + i * (BH + GAP) + BH / 2;         // 195 283 371
    const ANS = [672, 240, 224, 112];
    const EXPR = ["grid = [[1,2,3], [4,5,6], [7,8,9]]", "grid[1]", "grid[1][2]", "grid[2][1]"];

    const steps = [
      { name: "1. A list of rows", caption: "A two-dimensional list is a list of rows." },
      { name: "2. The row first", caption: "grid[1] picks out row 1, the whole row." },
      { name: "3. Then the column", caption: "Then [2] takes column 2 of that row: 6." },
      { name: "4. The other way round", caption: "grid[2][1] is 8. Swap them and you land elsewhere." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("2-D lists: row first, then column", { size: SZ.title });
      lang(d);
      prog(d, [EXPR[s]], 76, 104, 50, { lit: 0, max: 740 });

      const rowPop = i => s === 0 ? d.seg(t, .06 + i * .2, .36 + i * .2) : 1;
      const sweep = s === 1 ? Math.min(2, Math.floor(d.seg(t, .1, .7) * 2.999)) : -1;
      const picked = s === 2 ? [1, 2] : s === 3 ? [2, 1] : null;
      const land = picked ? d.seg(t, .2, .68) : 0;

      // ---- the one grid ----------------------------------------------------
      G.forEach((row, i) => {
        const a = rowPop(i);
        d.text(X0 - 24, cy(i), String(i), {
          size: SZ.head, weight: 700, baseline: "middle", align: "right", max: 44,
          alpha: a, fill: (s === 1 && i === 1) || (picked && picked[0] === i)
                          ? c.edge : c.dim });
        row.forEach((v, j) => {
          const inRow = s === 1 && i === 1 && j <= sweep;
          const isPicked = picked && picked[0] === i && picked[1] === j;
          // on step 4 the cell the other order would have found is left outlined,
          // so "somewhere else" is visible rather than described
          const was = s === 3 && i === 1 && j === 2;
          const on = inRow || isPicked;
          d.box(X0 + j * (CW + GAP), Y0 + i * (BH + GAP), CW, BH, {
            fill: on ? "#2a3f68" : c.panel,
            stroke: on ? c.edge : was ? "#8a5fc0" : c.line, on, r: 12,
            label: String(v), size: SZ.mid, alpha: a });
        });
      });
      // column numbers along the top, shown once the rows are there
      G[0].forEach((_, j) => d.text(cx(j), Y0 - 24, String(j), {
        size: SZ.head, weight: 700, align: "center", baseline: "middle",
        fill: picked && picked[1] === j ? c.edge : c.dim, max: 44, alpha: rowPop(0) }));

      // ---- the answer ------------------------------------------------------
      if (picked) {
        const got = land > .9;
        head(d, ANS[0], ANS[1] - 26, "the answer");
        value(d, ANS, got ? String(G[picked[0]][picked[1]]) : "...", {
          stroke: got ? c.ok : c.line, on: got,
          size: got ? SZ.value : SZ.mid, textFill: got ? c.fg : c.dim });
        if (land > 0 && land < 1) {
          const p = d.onCurve(cx(picked[1]) + 40, cy(picked[0]),
                              ANS[0] - 8, ANS[1] + ANS[3] / 2, 20, land);
          flying(d, p[0], p[1], String(G[picked[0]][picked[1]]), c.edge);
        }
      }

      cap(d, steps[s].caption);
    } };
  });

  // ============================================================ PY: functions
  A("pyfunc", function () {
    const H = 580;
    const LINES = ["def double(n):", "    return n * 2", "", "answer = double(5)"];
    const LY = i => 130 + i * 56;                          // 130 186 242 298
    const PAR = [566, 118, 340, 118];
    const OUT = [566, 296, 340, 118];

    const steps = [
      { name: "1. The value goes in", caption: "The call sends 5 in as the parameter n." },
      { name: "2. The function runs", caption: "Inside, n is 5, so n * 2 makes 10." },
      { name: "3. return sends it back", caption: "return hands that one value back to the call." },
      { name: "4. Where it ends up", caption: "answer holds 10. The function is finished." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Functions: a value in, one value back", { size: SZ.title });
      lang(d);

      const f = d.seg(t, .2, .7);
      prog(d, LINES, 76, 130, 56, { lit: s === 1 || s === 2 ? 1 : 3, max: 420 });

      // ---- the parameter, inside the function ------------------------------
      const inPar = s === 0 ? (f > .9 ? "5" : "empty") : "5";
      const gone = s === 3 ? 1 - d.seg(t, .12, .6) * .66 : 1;
      head(d, PAR[0], PAR[1] - 26, "n, inside the function", s === 3 ? c.dim : null);
      value(d, PAR, inPar, {
        fill: inPar === "empty" ? "#141f36" : c.panel,
        stroke: inPar === "empty" ? c.line : c.edge, on: inPar !== "empty",
        size: inPar === "empty" ? SZ.mid : SZ.value,
        textFill: inPar === "empty" ? c.dim : c.fg, alpha: gone });

      // ---- where the answer comes back to ----------------------------------
      const back = s === 3 ? "10" : s === 2 ? (f > .9 ? "10" : "empty") : "empty";
      head(d, OUT[0], OUT[1] - 26, "answer, back at the call");
      value(d, OUT, back, {
        fill: back === "empty" ? "#141f36" : "#1d4a35",
        stroke: back === "empty" ? c.line : c.ok, on: back !== "empty",
        size: back === "empty" ? SZ.mid : SZ.value,
        textFill: back === "empty" ? c.dim : c.fg });

      // ---- what moves -------------------------------------------------------
      if (s === 0 && f > 0 && f < 1) {
        const p = d.onCurve(310, LY(3), PAR[0] - 8, PAR[1] + PAR[3] / 2, 46, f);
        flying(d, p[0], p[1], "5", c.edge);
      }
      if (s === 1) {
        // the answer forming beside the line that works it out
        const grow = d.seg(t, .25, .75);
        if (grow > .04) flying(d, 476, LY(1), "10", c.ok, Math.min(1, grow * 1.2));
      }
      if (s === 2 && f > 0 && f < 1) {
        const p = d.onPath([[476, LY(1)], [476, LY(3) + 24], [OUT[0] - 8, OUT[1] + OUT[3] / 2]], f);
        flying(d, p[0], p[1], "10", c.ok);
      }

      cap(d, steps[s].caption);
    } };
  });

  // ================================================================ PY: files
  A("pyfile", function () {
    const H = 580;
    const DISK = ["Ava", "Ben", "Cara"];
    const FILE = [66, 178, 320, 244], PROGM = [594, 178, 320, 244];
    const FY = i => 232 + i * 60;                          // 232 292 352
    const LINK = [402, 578, 300];
    const CODE = ["f = open(\"names.txt\")", "line = f.readline()",
                  "line = f.readline()", "f.close()"];

    const steps = [
      { name: "1. Open it", caption: "open() connects the program to the file." },
      { name: "2. Read a line", caption: "readline() hands back the first line, then moves on." },
      { name: "3. Read the next", caption: "Each readline() takes the next one, never the same." },
      { name: "4. Close it", caption: "close() breaks the link when you have finished." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Files: open, read a line, close", { size: SZ.title });
      lang(d);
      prog(d, [CODE[s]], 76, 104, 50, { lit: 0, max: 740 });

      const f2 = s === 2 ? d.seg(t, .06, .44) : 0;
      const f3 = s === 2 ? d.seg(t, .5, .88) : 0;
      let reads = 0, ptr = -1;
      if (s === 0) ptr = 0;
      else if (s === 1) { reads = d.seg(t, .5, .88) > .85 ? 1 : 0; ptr = reads; }
      else if (s === 2) { reads = 1 + (f2 > .9 ? 1 : 0) + (f3 > .9 ? 1 : 0);
                          ptr = reads < 3 ? reads : -1; }
      else reads = 3;

      // ---- the file on the disk --------------------------------------------
      head(d, FILE[0], FILE[1] - 26, "names.txt on the disk");
      d.box(FILE[0], FILE[1], FILE[2], FILE[3],
            { fill: "#16233c", stroke: s === 3 ? c.line : c.info, r: 14 });
      DISK.forEach((L, i) => d.text(FILE[0] + 46, FY(i), L, {
        size: SZ.code, weight: 700, baseline: "middle", max: 240,
        fill: i < reads ? c.dim : c.soft }));
      if (ptr >= 0 && ptr < 3) rtip(d, FILE[0] + 18, FY(ptr), c.edge);

      // ---- what the program has read ---------------------------------------
      head(d, PROGM[0], PROGM[1] - 26, "what the program has read");
      d.box(PROGM[0], PROGM[1], PROGM[2], PROGM[3],
            { fill: c.panel, stroke: reads ? c.ok : c.line, r: 14, on: reads >= 3 });
      if (!reads)
        d.text(PROGM[0] + 46, FY(0), "nothing yet", {
          size: SZ.body, weight: 700, baseline: "middle", fill: c.dim, max: 240 });
      for (let i = 0; i < reads; i++)
        d.text(PROGM[0] + 46, FY(i), DISK[i], {
          size: SZ.code, weight: 700, baseline: "middle", fill: c.ok, max: 240 });

      // ---- the link, drawn only while it exists ----------------------------
      const grow = s === 0 ? d.seg(t, .15, .78) : s === 3 ? 1 - d.seg(t, .15, .75) : 1;
      if (grow > .02)
        d.arrow(LINK[0], LINK[2], d.lerp(LINK[0] + 14, LINK[1], grow), LINK[2],
                { stroke: s === 3 ? c.dim : c.info, width: 2.5, size: 10 });

      // ---- a line crossing over --------------------------------------------
      const fly = s === 1 ? d.seg(t, .2, .72) : f2 > 0 && f2 < 1 ? f2 : f3;
      const which = s === 1 ? 0 : f2 > 0 && f2 < 1 ? 1 : 2;
      if ((s === 1 || s === 2) && fly > 0 && fly < 1) {
        const p = d.onPath([[FILE[0] + 150, FY(which)], [LINK[0] + 40, LINK[2]],
                            [LINK[1] - 40, LINK[2]], [PROGM[0] + 70, FY(which)]], fly);
        flying(d, p[0], p[1], DISK[which], c.ok);
      }

      cap(d, steps[s].caption);
    } };
  });

  // ================================================================ PY: round
  A("pyround", function () {
    const H = 580;
    const NUM = [90, 196, 380, 152], ANS = [600, 196, 300, 152];
    const CALLS = ["round(3.456)", "round(3.456, 2)", "round(3.456, 1)"];
    // keep | the digit that decides | the rest, for one number through all three
    const PARTS = [["3", ".", "4", "56"], ["3.45", "", "6", ""], ["3.4", "", "5", "6"]];
    const OUT = ["3", "3.46", "3.5"];

    const steps = [
      { name: "1. To a whole number", caption: "No second number, so the nearest whole number: 3." },
      { name: "2. To 2 decimal places", caption: "A 2 keeps two places. The 6 rounds it up." },
      { name: "3. Choosing the places", caption: "A 1 keeps one place, so 3.456 becomes 3.5." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("round(): how many places to keep", { size: SZ.title });
      lang(d);
      prog(d, [CALLS[s]], 76, 108, 50, { lit: 0, max: 740 });

      const fade = d.seg(t, .12, .55);
      const dropA = 1 - fade * .82;                        // the dropped tail
      const decA = 1 - d.seg(t, .46, .86) * .72;           // the digit that decided
      const got = d.seg(t, .5, .88) > .78;

      // ---- the number, with the part being dropped fading away -------------
      head(d, NUM[0], NUM[1] - 26, "the number");
      d.box(NUM[0], NUM[1], NUM[2], NUM[3], { fill: c.panel, stroke: c.edge, on: true, r: 14 });
      const P = PARTS[s];
      const wk = d.measure(P[0], SZ.value, 800), wp = d.measure(P[1], SZ.value, 800);
      const wd = d.measure(P[2], SZ.value, 800), wr = d.measure(P[3], SZ.value, 800);
      let px = NUM[0] + NUM[2] / 2 - (wk + wp + wd + wr) / 2;
      const my = NUM[1] + NUM[3] / 2;
      const big = { size: SZ.value, weight: 800, baseline: "middle" };
      d.text(px, my, P[0], Object.assign({ fill: c.fg }, big)); px += wk;
      if (P[1]) { d.text(px, my, P[1], Object.assign({ fill: c.dim, alpha: dropA }, big)); px += wp; }
      d.text(px, my, P[2], Object.assign({ fill: c.orange, alpha: decA }, big)); px += wd;
      if (P[3]) d.text(px, my, P[3], Object.assign({ fill: c.dim, alpha: dropA }, big));

      // ---- the answer ------------------------------------------------------
      head(d, ANS[0], ANS[1] - 26, "the answer");
      value(d, ANS, got ? OUT[s] : "...", {
        stroke: got ? c.ok : c.line, on: got,
        size: got ? SZ.value : SZ.mid, textFill: got ? c.fg : c.dim });

      // ---- the number crossing over ----------------------------------------
      const cross = d.seg(t, .38, .9);
      d.arrow(NUM[0] + NUM[2] + 22, my, ANS[0] - 22, my,
              { stroke: got ? c.ok : c.line, width: 2.5, size: 10 });
      if (cross > 0 && cross < 1)
        d.dot(d.lerp(NUM[0] + NUM[2] + 26, ANS[0] - 26, cross), my, 9,
              { fill: c.edge, glow: true });

      cap(d, steps[s].caption);
    } };
  });

  // =============================================================== PY: powers
  A("pypower", function () {
    const H = 580;
    // the same two rectangles in all three steps, so nothing jumps about
    const L = [90, 196, 380, 152], R = [600, 196, 300, 152];
    const MY = L[1] + L[3] / 2;                            // 272
    const CALLS = ["3 ** 2", "2 ** 3", "3 ** 2   and   2 ** 3"];
    const BASE = ["3", "2"], TIMES = [2, 3], GOT = ["9", "8"];

    const steps = [
      { name: "1. 3 ** 2", caption: "3 ** 2 is 3 multiplied by itself twice: 9." },
      { name: "2. 2 ** 3", caption: "2 ** 3 is 2 multiplied by itself three times: 8." },
      { name: "3. The order matters", caption: "Swap the two numbers and the answer changes." }
    ];

    return { w: 980, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("**: how many times it is multiplied", { size: SZ.title });
      lang(d);
      prog(d, [CALLS[s]], 76, 108, 50, { lit: 0, max: 740 });

      if (s < 2) {
        // ---- one power, written out one factor at a time -------------------
        const n = TIMES[s];
        const grow = Math.min(n, 1 + Math.floor(d.seg(t, .1, .62) * (n - .001)));
        const got = grow >= n && d.seg(t, .55, .9) > .5;

        head(d, L[0], L[1] - 26, "what " + CALLS[s] + " means");
        d.box(L[0], L[1], L[2], L[3], { fill: c.panel, stroke: c.edge, on: true, r: 14 });
        /* Laid out from where the finished row will start, not centred on what
         * is drawn so far, so the factors already there hold still while the
         * next one arrives. */
        const full = Array(n).fill(BASE[s]).join(" * ");
        const fw = d.measure(full, SZ.value, 800);
        d.text(L[0] + L[2] / 2 - fw / 2, MY, Array(grow).fill(BASE[s]).join(" * "),
               { size: SZ.value, weight: 800, baseline: "middle", fill: c.fg });

        head(d, R[0], R[1] - 26, "the answer");
        value(d, R, got ? GOT[s] : "...", {
          stroke: got ? c.ok : c.line, on: got,
          size: got ? SZ.value : SZ.mid, textFill: got ? c.fg : c.dim });

        d.arrow(L[0] + L[2] + 22, MY, R[0] - 22, MY,
                { stroke: got ? c.ok : c.line, width: 2.5, size: 10 });
        const cross = d.seg(t, .58, .92);
        if (cross > 0 && cross < 1)
          d.dot(d.lerp(L[0] + L[2] + 26, R[0] - 26, cross), MY, 9, { fill: c.edge, glow: true });

      } else {
        // ---- the two of them side by side, and the numbers trading places ---
        const showL = d.seg(t, .04, .26) > .5, showR = d.seg(t, .62, .9) > .5;
        const cell = (b, label, made, ans, col, lit) => {
          head(d, b[0], b[1] - 26, label, col);
          d.box(b[0], b[1], b[2], b[3], { fill: c.panel, stroke: col, on: lit, r: 14 });
          d.text(b[0] + b[2] / 2, b[1] + 50, made, {
            size: SZ.mid, weight: 700, align: "center", baseline: "middle",
            fill: c.soft, max: b[2] - 40 });
          d.text(b[0] + b[2] / 2, b[1] + 108, lit ? ans : "...", {
            size: lit ? SZ.value : SZ.mid, weight: 800, align: "center",
            baseline: "middle", fill: lit ? col : c.dim, max: b[2] - 40 });
        };
        cell(L, "3 ** 2", "3 * 3", "9", c.edge, showL);
        cell(R, "2 ** 3", "2 * 2 * 2", "8", c.violet, showR);

        /* The swap itself, in the empty strip under the boxes. Both routes stay
         * drawn once they have started, so the crossing is still the picture in
         * the frame the step comes to rest on. */
        const sw = d.seg(t, .3, .72);
        if (sw > 0) {
          const lx = L[0] + L[2] / 2, rx = R[0] + R[2] / 2;
          d.curve(lx, 400, rx, 400, 46, { stroke: c.edge, width: 2, size: 8, alpha: .5 });
          d.curve(rx, 400, lx, 400, 46, { stroke: c.violet, width: 2, size: 8, alpha: .5 });
          if (sw < 1) {
            const a = d.onCurve(lx, 400, rx, 400, 46, sw);
            const b = d.onCurve(rx, 400, lx, 400, 46, sw);
            flying(d, a[0], a[1], "3", c.edge);
            flying(d, b[0], b[1], "2", c.violet);
          }
        }
      }

      cap(d, steps[s].caption);
    } };
  });
})();
