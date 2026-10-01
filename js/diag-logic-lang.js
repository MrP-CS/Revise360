/* Revise 360 - logic and languages.
 *
 * Four diagrams:
 *   gates       2.4  AND, OR and NOT, with the truth table row lighting up
 *   circuit     2.4  a two-gate circuit, signals propagating, table built up
 *   testdata    2.3  test data on a number line, iterative vs final testing
 *   translators 2.5  compiler vs interpreter on the same source code
 *
 * Engine and drawing helper: js/diagrams.js. House style: `fde` in
 * js/diagrams-set.js. render() draws the whole frame; nothing is retained.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  /* d.wrap ignores alpha, and several blocks here fade in, so this is the
   * same line breaking done with d.text, which does not. */
  function wrapA(d, tx, ty, s, maxW, o) {
    o = o || {};
    const size = o.size || 12.5, lh = o.lh || size * 1.35, wt = o.weight || 500;
    const words = String(s).split(" "), lines = [];
    let line = "";
    for (const w of words) {
      const t2 = line ? line + " " + w : w;
      if (d.measure(t2, size, wt) > maxW && line) { lines.push(line); line = w; } else line = t2;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => d.text(tx, ty + i * lh, l, {
      size: size, weight: wt, fill: o.fill || d.c.soft,
      alpha: o.alpha, baseline: "top", align: o.align
    }));
    return lines.length * lh;
  }

  // =======================================================================
  // Gate symbols. Drawn as polylines so they use the same d.path as
  // everything else: AND is flat-backed with a semicircular front, OR is
  // curved at the back and pointed at the front, NOT is a triangle with a
  // small circle at its tip.
  // =======================================================================
  function qpts(p0, p1, p2, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0],
                v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]]);
    }
    return out;
  }

  function andPts(x0, cy, w, h) {
    const r = h / 2, cx = x0 + w - r, p = [[x0, cy - r], [cx, cy - r]];
    for (let i = 1; i < 26; i++) {
      const a = -Math.PI / 2 + Math.PI * i / 26;
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    p.push([cx, cy + r], [x0, cy + r], [x0, cy - r]);
    return p;
  }

  function orPts(x0, cy, w, h) {
    const r = h / 2, tip = [x0 + w, cy];
    const top = qpts([x0, cy - r], [x0 + w * 0.60, cy - r], tip, 20);
    const bot = qpts(tip, [x0 + w * 0.60, cy + r], [x0, cy + r], 20);
    const back = qpts([x0, cy + r], [x0 + h * 0.36, cy], [x0, cy - r], 16);
    return top.concat(bot.slice(1), back.slice(1));
  }

  const BR = 9;                                   // the NOT bubble radius
  function notPts(x0, cy, w, h) {
    const tipx = x0 + w - BR * 2;
    return [[x0, cy - h / 2], [tipx, cy], [x0, cy + h / 2], [x0, cy - h / 2]];
  }

  /* kind is "and" | "or" | "not". x0 is the left of the body, w its full
   * width including the NOT bubble, so x0 + w is always the output pin. */
  function gate(d, kind, x0, cy, w, h, o) {
    o = o || {};
    const col = o.stroke || d.c.line, fill = o.fill || d.c.panel;
    const pts = kind === "and" ? andPts(x0, cy, w, h)
              : kind === "or" ? orPts(x0, cy, w, h)
              : notPts(x0, cy, w, h);
    d.path(pts, { fill: fill, stroke: col, width: o.on ? 3.5 : 2, glow: o.on, alpha: o.alpha });
    if (kind === "not")
      d.dot(x0 + w - BR, cy, BR, { fill: fill, stroke: col, width: o.on ? 3.5 : 2, alpha: o.alpha });
    const lx = x0 + w * (kind === "and" ? 0.42 : kind === "or" ? 0.34 : 0.30);
    d.text(lx, cy, o.label === undefined ? kind.toUpperCase() : o.label, {
      size: o.size || 15, weight: 800, align: "center", baseline: "middle",
      fill: o.labelFill || d.c.fg, max: w * 0.6, alpha: o.alpha
    });
  }

  // where an input wire meets the body: OR's back curves in, so stop short
  const backX = (kind, x0, h) => kind === "or" ? x0 + h * 0.18 : x0;

  // =======================================================================
  // A truth table. One row per combination, the live row lit and its output
  // cells filled in green for 1 and blue for 0. Rows past `shown` are drawn
  // blank, so a table can be built up a row at a time.
  // =======================================================================
  function tbl(d, tx, ty, head, rows, o) {
    o = o || {};
    const CW = o.cw || 76, GAP = o.gap === undefined ? 6 : o.gap;
    const CH = o.ch || 36, PITCH = o.pitch || CH + 8;
    const lit = o.lit === undefined ? -1 : o.lit;
    const shown = o.shown === undefined ? rows.length : o.shown;
    const accent = o.accent || d.c.edge;
    const qc = o.qcols || [head.length - 1];
    const litA = o.litAlpha === undefined ? 1 : o.litAlpha;
    const colX = i => tx + i * (CW + GAP);
    const rowTop = i => ty + 16 + i * PITCH;

    head.forEach((hh, i) => d.text(colX(i) + CW / 2, ty, hh, {
      size: o.hsize || 13, weight: 800, align: "center", baseline: "middle",
      fill: qc.indexOf(i) >= 0 ? accent : d.c.dim, max: CW - 4
    }));
    rows.forEach((r, i) => {
      const on = i === lit;
      const blank = !on && i >= shown;
      const a = on ? litA : (blank ? 0.3 : 1);
      d.cells(tx, rowTop(i), r.map(v => blank ? "" : String(v)), {
        cw: CW, ch: CH, gap: GAP, on: on ? r.map((_, j) => j) : [],
        accent: accent, size: o.size || 15, alpha: a
      });
      if (!on) return;
      qc.forEach(j => {
        const col = String(r[j]) === "1" ? d.c.ok : d.c.info;
        d.box(colX(j), rowTop(i), CW, CH, {
          fill: col, stroke: col, on: true, r: 7, label: String(r[j]),
          size: o.size || 15, labelFill: d.c.bg, alpha: a
        });
      });
    });
    const api = {
      at: i => colX(i) + CW / 2,
      rowY: i => rowTop(i) + CH / 2,
      right: tx + head.length * (CW + GAP) - GAP,
      w: head.length * (CW + GAP) - GAP
    };
    if (lit >= 0) d.head(tx - 9, api.rowY(lit), 0, { stroke: accent, size: 9, alpha: litA });
    return api;
  }

  // =========================================================== 2.4  bl-l01
  A("gates", function () {
    const W = 980, H = 580;
    const CY = 142, GW = 96, GH = 66, EY = 214;
    const G = [
      { k: "and", x: 150, oc: "teal",   expr: "Q = A AND B", two: true },
      { k: "or",  x: 440, oc: "orange", expr: "Q = A OR B",  two: true },
      { k: "not", x: 750, oc: "violet", expr: "Q = NOT A",   two: false }
    ];
    const COMBO = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const AND = (a, b) => (a === 1 && b === 1) ? 1 : 0;
    const OR = (a, b) => (a === 1 || b === 1) ? 1 : 0;
    const NOT = a => a === 1 ? 0 : 1;
    const out = (k, a, b) => k === "and" ? AND(a, b) : k === "or" ? OR(a, b) : NOT(a);

    // worked by hand, then checked against the rendered tables:
    //   AND  00->0  01->0  10->0  11->1
    //   OR   00->0  01->1  10->1  11->1
    //   NOT   0->1   1->0
    const T_AND = COMBO.map(c => [c[0], c[1], AND(c[0], c[1])]);
    const T_OR = COMBO.map(c => [c[0], c[1], OR(c[0], c[1])]);
    const T_NOT = [[0, NOT(0)], [1, NOT(1)]];
    const T_ALL = COMBO.map(c => [c[0], c[1], AND(c[0], c[1]), OR(c[0], c[1]), NOT(c[0])]);

    const steps = [
      { name: "1. Ones and zeros", caption: "Every wire in a logic circuit carries one of only two values: 1 for on and 0 for off. A gate reads its inputs and decides its single output." },
      { name: "2. AND", caption: "AND gives 1 only when both inputs are 1. The inputs step through all four combinations, and the matching row of the truth table lights up each time." },
      { name: "3. OR", caption: "OR gives 1 when at least one input is 1. Only 0 with 0 gives an output of 0, so three of the four rows end in 1." },
      { name: "4. NOT", caption: "NOT takes a single input and flips it. There are only two rows to its truth table, because there is only one input to vary." },
      { name: "5. All three", caption: "The same pair of inputs fed to all three gates at once. One row of this table, read across, gives you all three outputs." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Logic gates: AND, OR and NOT");
      const active = (s >= 1 && s <= 3) ? s - 1 : -1;
      const live = s === 0 || s === 4;

      // the combination being tried
      let a, b, row;
      if (s === 3) { row = t < 0.5 ? 0 : 1; a = row; b = 0; }
      else { row = Math.min(3, Math.floor(d.clamp(t, 0, 0.999) * 4)); a = COMBO[row][0]; b = COMBO[row][1]; }
      if (s === 0) { a = 1; b = 1; }
      const vcol = v => v === 1 ? c.ok : c.info;

      G.forEach((g, i) => {
        const hot = live || i === active;
        const ac = c[g.oc];
        const al = hot ? 1 : 0.32;
        const bx = backX(g.k, g.x, GH);
        const pins = g.two ? [CY - 17, CY + 17] : [CY];
        const vals = g.two ? [a, b] : [a];
        const names = g.two ? ["A", "B"] : ["A"];
        const q = out(g.k, a, b);

        pins.forEach((py, j) => {
          const wcol = hot ? vcol(vals[j]) : c.line;
          d.line(g.x - 42, py, bx, py, { stroke: wcol, width: hot ? 3 : 2, alpha: al });
          if (hot) {
            const ph = (t * 2.2 + j * 0.4) % 1;
            d.dot(d.lerp(g.x - 42, bx, ph), py, 6, { fill: vcol(vals[j]), glow: true, alpha: 0.9 });
          }
          d.chip(g.x - 78, py, names[j] + " = " + (hot ? vals[j] : "?"),
                 { w: 68, fill: hot ? vcol(vals[j]) : c.panel2, stroke: hot ? undefined : c.line,
                   labelFill: hot ? undefined : c.soft, glow: hot, alpha: al, size: 13 });
        });

        gate(d, g.k, g.x, CY, GW, GH, {
          stroke: hot ? ac : c.line, fill: hot ? c.panel2 : c.panel, on: hot, alpha: al,
          labelFill: hot ? c.fg : c.soft
        });

        const ox = g.x + GW;
        d.line(ox, CY, ox + 80, CY, { stroke: hot ? vcol(q) : c.line, width: hot ? 3 : 2, alpha: al });
        if (hot) {
          const ph = (t * 2.2 + 0.6) % 1;
          d.dot(d.lerp(ox, ox + 80, ph), CY, 6, { fill: vcol(q), glow: true, alpha: 0.9 });
        }
        d.chip(ox + 42, CY, "Q = " + (hot ? q : "?"),
               { w: 70, fill: hot ? vcol(q) : c.panel2, stroke: hot ? undefined : c.line,
                 labelFill: hot ? undefined : c.soft, glow: hot, alpha: al, size: 13 });
        d.text(g.x + GW / 2, EY, g.expr, {
          size: 17, weight: 800, align: "center", baseline: "middle",
          fill: hot ? ac : c.dim, max: 230, alpha: al
        });
      });

      let noteTo;
      if (s === 0) {
        const say = [
          ["AND: output is 1 only when BOTH inputs are 1", "teal"],
          ["OR: output is 1 when AT LEAST ONE input is 1", "orange"],
          ["NOT: one input only, and the output is the opposite", "violet"]
        ];
        say.forEach((ss, i) => d.box(210, 262 + i * 64, 520, 54, {
          fill: c.panel, stroke: c[ss[1]], label: ss[0], size: 15,
          alpha: d.seg(t, 0.05 + i * 0.1, 0.22 + i * 0.1)
        }));
        d.box(756, 262, 200, 182, { fill: c.panel, stroke: c.line, r: 12 });
        d.text(856, 286, "What a wire carries", { size: 12.5, weight: 700, align: "center",
                                                  baseline: "middle", fill: c.dim, max: 180 });
        const kp = (y, v, words, col) => {
          d.chip(802, y, String(v), { w: 42, h: 30, fill: col, size: 16, glow: true,
                                      alpha: 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 2 + (v ? 0 : 1.6))) });
          d.text(836, y, words, { size: 13, weight: 700, baseline: "middle", fill: c.soft, max: 112 });
        };
        kp(332, 1, "on, true", c.ok);
        kp(396, 0, "off, false", c.info);
        noteTo = [802, 396];
      } else {
        const def = [
          null,
          { head: ["A", "B", "Q"], rows: T_AND, tx: 370, ac: c.teal, qc: [2], cw: 76, ch: 36, pitch: 44 },
          { head: ["A", "B", "Q"], rows: T_OR, tx: 370, ac: c.orange, qc: [2], cw: 76, ch: 36, pitch: 44 },
          { head: ["A", "Q"], rows: T_NOT, tx: 377, ac: c.violet, qc: [1], cw: 110, ch: 46, pitch: 56 },
          { head: ["A", "B", "A AND B", "A OR B", "NOT A"], rows: T_ALL, tx: 288, ac: c.edge, qc: [2, 3, 4], cw: 76, ch: 36, pitch: 44 }
        ][s];
        d.text(490, 240, "Truth table", { size: 13, weight: 800, align: "center",
                                          baseline: "middle", fill: c.soft, max: 300 });
        const T = tbl(d, def.tx, 262, def.head, def.rows, {
          lit: row, qcols: def.qc, accent: def.ac, cw: def.cw, ch: def.ch, pitch: def.pitch,
          hsize: def.head.length > 3 ? 11.5 : 13
        });
        noteTo = [T.right + 12, T.rowY(row)];
        if (s === 3) {
          d.box(300, 396, 380, 58, { fill: c.panel, stroke: c.violet, r: 10 });
          wrapA(d, 320, 412, "A NOT gate is also called an inverter. Put two in a row and they cancel out: NOT NOT A is simply A again.",
                340, { size: 13, fill: c.soft });
          noteTo = [826, 176];
        }
      }

      const notes = [
        ["Only two values", "There is no maybe and no halfway. The output is decided completely by the inputs, every single time."],
        ["Both, not either", "Three of the four rows give 0. Only the last row, where A and B are both 1, lights the output."],
        ["Spot the difference", "Compare this with AND: the two tables only agree on the first row and the last."],
        ["The little circle", "The circle at the tip of the triangle is the part that means invert. You will meet it on other gate symbols too."],
        ["Reading a truth table", "Find the row that matches your inputs, then read across to the column for the gate you want."]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: noteTo, w: 360, anchor: "centre",
                               maxLead: 150, alpha: d.seg(t, 0, 0.2) });
    } };
  });

  // =========================================================== 2.4  bl-l03
  A("circuit", function () {
    const W = 980, H = 580;
    const NX = 180, NW = 86, NH = 56, NY = 130;         // NOT gate
    const AX = 400, AW = 100, AH = 72, AY = 216;        // AND gate
    const AI = [AY - 19, AY + 19];
    const TX = 668, TY = 120, TCW = 66, TGAP = 6, TPITCH = 56;
    const COMBO = [[0, 0], [0, 1], [1, 0], [1, 1]];
    // Q = NOT A AND B, worked by hand:
    //   A=0 B=0  NOT A=1  1 AND 0 = 0
    //   A=0 B=1  NOT A=1  1 AND 1 = 1
    //   A=1 B=0  NOT A=0  0 AND 0 = 0
    //   A=1 B=1  NOT A=0  0 AND 1 = 0
    const ROWS = COMBO.map(cb => {
      const p = cb[0] === 1 ? 0 : 1;
      return [cb[0], cb[1], p, (p === 1 && cb[1] === 1) ? 1 : 0];
    });

    const steps = [
      { name: "1. The circuit", caption: "Two gates wired together. A goes through a NOT gate first, and that result becomes one of the two inputs to an AND gate. Signals only ever travel left to right." },
      { name: "2. A=0, B=0", caption: "A is 0, so NOT A is 1. The AND gate then has 1 and 0, so Q is 0. That is the first row of the table filled in." },
      { name: "3. A=0, B=1", caption: "A is 0 again, so NOT A is still 1. This time B is 1 as well, so the AND gate has 1 and 1 and Q is 1." },
      { name: "4. A=1, B=0", caption: "A is 1, so NOT A is 0. Once either input to an AND gate is 0 the output must be 0, whatever B does." },
      { name: "5. A=1, B=1", caption: "A is 1, so NOT A is 0 once more. Even with B at 1, the AND gate still gives 0." },
      { name: "6. The finished table", caption: "All four combinations tried. Only one of them makes Q equal to 1, and the pointer scans down the rows to show which." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("A two-gate circuit: Q = NOT A AND B");
      const vcol = v => v === 1 ? c.ok : c.info;
      const known = s >= 1;

      // ---- the expression, with NOT A marked off as one thing -------------
      let ex = 40;
      const put = (str, col, sz) => {
        const z = sz || 22;
        d.text(ex, 76, str, { size: z, weight: 800, fill: col, baseline: "middle", max: 260 });
        ex += d.measure(str, z, 800);
      };
      put("Q  =  ", c.soft);
      const nx0 = ex; put("NOT A", c.violet); const nx1 = ex;
      put("  AND  ", c.soft);
      const bx0 = ex; put("B", c.teal);
      d.line(nx0, 93, nx1, 93, { stroke: c.violet, width: 2.5 });
      d.text(bx0 + 30, 70, "the NOT applies to A on its own,", {
        size: 12.5, weight: 600, baseline: "middle", fill: c.dim, max: 320 });
      d.text(bx0 + 30, 88, "so it is worked out first", {
        size: 12.5, weight: 600, baseline: "middle", fill: c.dim, max: 320 });

      // ---- values ---------------------------------------------------------
      const row = s === 5 ? Math.min(3, Math.floor(d.clamp(t, 0, 0.999) * 4)) : s - 1;
      const a = known ? COMBO[Math.max(0, row)][0] : "?";
      const b = known ? COMBO[Math.max(0, row)][1] : "?";
      const p = known ? (a === 1 ? 0 : 1) : "?";
      const q = known ? ((p === 1 && b === 1) ? 1 : 0) : "?";

      // reveal beats: all in by t = 0.39, then the frame holds
      const v1 = s === 5 ? 1 : d.seg(t, 0.02, 0.14);
      const kp = s === 5 ? 1 : d.seg(t, 0.12, 0.19);
      const v2 = s === 5 ? 1 : d.seg(t, 0.15, 0.26);
      const kq = s === 5 ? 1 : d.seg(t, 0.26, 0.32);
      const v3 = s === 5 ? 1 : d.seg(t, 0.27, 0.38);
      const rowA = s === 5 ? 1 : d.seg(t, 0.30, 0.39);

      const wA = [[108, NY], [NX, NY]];
      const wP = [[NX + NW, NY], [350, NY], [350, AI[0]], [AX, AI[0]]];
      const wB = [[108, 300], [330, 300], [330, AI[1]], [AX, AI[1]]];
      const wQ = [[AX + AW, AY], [600, AY]];

      const wire = (pts, v, lit) => d.path(pts, {
        stroke: known && lit ? vcol(v) : c.line, width: known && lit ? 3.2 : 2.4
      });
      wire(wA, a, true);
      wire(wP, p, kp > 0.5);
      wire(wB, b, true);
      wire(wQ, q, kq > 0.5);

      gate(d, "not", NX, NY, NW, NH, { stroke: c.violet, fill: c.panel2, on: known && v1 > 0.9 });
      gate(d, "and", AX, AY, AW, AH, { stroke: c.teal, fill: c.panel2, on: known && v2 > 0.9 });
      d.text(308, 112, "NOT A", { size: 12.5, weight: 800, align: "center", baseline: "middle",
                                  fill: c.violet, max: 80 });

      // travelling signals, each carrying its own 1 or 0
      const run = (pts, v, f) => {
        if (!known || f <= 0) return;
        const pt = d.onPath(pts, f);
        d.dot(pt[0], pt[1], 11, { fill: vcol(v), glow: true, label: String(v), size: 12 });
      };
      if (s === 5) {
        const loop = (t * 1.3) % 1;
        run(wA, a, loop); run(wP, p, loop); run(wB, b, loop); run(wQ, q, loop);
      } else {
        run(wA, a, v1 < 1 ? v1 : 0);
        run(wB, b, v2 < 1 ? Math.max(v1 * 0.5, v2) : 0);
        run(wP, p, v2 < 1 && v2 > 0 ? v2 : 0);
        run(wQ, q, v3 < 1 && v3 > 0 ? v3 : 0);
      }
      if (!known) {
        const pt = d.onPath(wA.concat(wP.slice(1)).concat(wQ), (t * 0.9) % 1);
        d.dot(pt[0], pt[1], 8, { fill: c.edge, glow: true });
      }

      // chips last, so a signal passing underneath never hides a label
      d.chip(72, NY, "A = " + a, { w: 68, fill: known ? vcol(a) : c.panel2,
                                   stroke: known ? undefined : c.line, labelFill: known ? undefined : c.soft,
                                   glow: known, size: 13 });
      d.chip(72, 300, "B = " + b, { w: 68, fill: known ? vcol(b) : c.panel2,
                                    stroke: known ? undefined : c.line, labelFill: known ? undefined : c.soft,
                                    glow: known, size: 13 });
      if (known) d.chip(350, 166, String(p), { w: 40, fill: vcol(p), glow: true, size: 15, alpha: kp });
      d.chip(560, AY, "Q = " + q, { w: 70, fill: known ? vcol(q) : c.panel2,
                                    stroke: known ? undefined : c.line, labelFill: known ? undefined : c.soft,
                                    glow: known, size: 13, alpha: known ? Math.max(0.35, kq) : 1 });

      // ---- the working, in words -----------------------------------------
      d.box(40, 360, 600, 82, { fill: c.panel, stroke: known ? c.edge : c.line, r: 10 });
      if (known) {
        d.text(58, 386, "A = " + a + ",  so  NOT A = " + p, {
          size: 15, weight: 700, baseline: "middle", fill: c.fg, max: 564, alpha: rowA });
        d.text(58, 414, "NOT A AND B  =  " + p + " AND " + b + "  =  " + q + ",   so  Q = " + q, {
          size: 15, weight: 700, baseline: "middle", fill: c.fg, max: 564, alpha: rowA });
      } else {
        wrapA(d, 58, 378, "Nothing is stored anywhere in here. Change an input and the output changes straight away, which is why one row of the table is enough to describe each combination.",
              564, { size: 13.5, fill: c.soft });
      }

      // ---- the truth table ------------------------------------------------
      d.text(TX, 100, "Truth table", { size: 13, weight: 800, baseline: "middle",
                                       fill: c.soft, max: 282 });
      const T = tbl(d, TX, TY, ["A", "B", "NOT A", "Q"], ROWS, {
        cw: TCW, gap: TGAP, ch: 42, pitch: TPITCH, lit: row >= 0 ? row : -1, litAlpha: rowA,
        shown: s === 5 ? 4 : Math.max(0, s - 1), qcols: [2, 3], accent: c.edge, size: 16, hsize: 12
      });
      const side = [T.right + 10, T.rowY(Math.max(0, row))];

      const notes = [
        ["Read it left to right", "The output of the NOT gate becomes an input to the AND gate. An intermediate value like that often gets its own column in the truth table.", [330, 150]],
        ["Start at the top", "One row per combination, always in counting order: 00, 01, 10, 11. That way you can never miss one out.", side],
        ["The only 1", "This is the single combination that opens the gate: A off and B on. Every other row gives 0.", side],
        ["AND is strict", "A 0 on either input of an AND gate forces the output to 0. You do not even need to look at the other input.", [AX + 10, AI[0]]],
        ["Two inputs, four rows", "Two inputs give 2 x 2 = 4 combinations. Three inputs would give 8, and four would give 16.", side],
        ["Checking your work", "Count the 1s in the Q column. If a circuit with one AND gate gives more than one row of 1, something has gone wrong.", side]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                               maxLead: 150, alpha: d.seg(t, 0, 0.2) });
    } };
  });

  // =========================================================== 2.3  rp-l05
  A("testdata", function () {
    const W = 980, H = 580;
    const LY = 200, L0 = 120, L1 = 850;
    const px = v => L0 + (v + 6) * ((L1 - L0) / 62);        // -6 .. 56
    const BAND0 = px(0), BAND1 = px(50);
    const BOUND = [-1, 0, 50, 51];
    const COL = [56, 206, 392, 650], CMAX = [142, 178, 244, 288];

    const PLAN = [
      ["Normal", "27", "accepted", "a value a user would really type"],
      ["Boundary", "-1, 0, 50, 51", "0 and 50 pass, -1 and 51 fail", "the values right on the edge of the rule"],
      ["Invalid", "73", "rejected", "the right type, but not an allowed value"],
      ["Erroneous", "forty", "rejected", "the wrong type of data altogether"]
    ];

    const steps = [
      { name: "1. The rule", caption: "A mark must be a whole number from 0 to 50, and 0 and 50 themselves are allowed. The green stretch is everything the program should accept." },
      { name: "2. Normal data", caption: "Normal data is an ordinary value from the middle of the range. 27 is well inside 0 to 50, so it is accepted." },
      { name: "3. Boundary", caption: "Boundary data is the values right on the edge: -1, 0, 50 and 51. 0 and 50 must be accepted, and -1 and 51 must be rejected." },
      { name: "4. Invalid data", caption: "Invalid data is the right type but a value the rule forbids. 73 is a perfectly good whole number - it is simply too big." },
      { name: "5. Erroneous data", caption: "Erroneous data is the wrong type altogether. The word forty cannot even be compared with 0 and 50, so it has no place on the line." },
      { name: "6. When you test", caption: "Iterative testing happens while you are still writing the program. Final testing happens once it is finished, on the whole thing at once." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Test data and testing");
      const drop = d.seg(t, 0.05, 0.3), verd = d.seg(t, 0.3, 0.44);

      // which value is on trial
      const bj = Math.min(3, Math.floor(d.clamp(t, 0, 0.999) * 4));
      let val = null, lbl = "", okv = false, why = "";
      if (s === 1) { val = 27; lbl = "27"; okv = true; why = "inside the range"; }
      if (s === 2) {
        val = BOUND[bj]; lbl = String(val); okv = (val === 0 || val === 50);
        why = val === -1 ? "one below the lowest allowed" : val === 0 ? "the lowest allowed value"
            : val === 50 ? "the highest allowed value" : "one above the highest allowed";
      }
      if (s === 3) { val = 73; lbl = "73"; okv = false; why = "a whole number, but above 50"; }
      if (s === 4) { val = null; lbl = "forty"; okv = false; why = "not a number at all"; }

      // ---- rule and verdict ----------------------------------------------
      d.box(40, 58, 620, 52, {
        fill: c.panel, stroke: c.edge, r: 10,
        label: "Rule: a mark must be a whole number from 0 to 50",
        sub: "inclusive - 0 and 50 are both allowed", size: 16, subSize: 12.5
      });
      if (s === 0 || s === 5) {
        d.box(690, 58, 266, 52, {
          fill: c.panel, stroke: c.line, r: 10,
          label: s === 0 ? "Four kinds of test data" : "Two kinds of testing",
          sub: s === 0 ? "normal, boundary, invalid, erroneous" : "iterative, then final",
          size: 14, subSize: 12
        });
      } else {
        d.box(690, 58, 266, 52, {
          fill: c.panel2, stroke: okv ? c.ok : c.bad, on: true, r: 10,
          label: okv ? "ACCEPTED" : "REJECTED", sub: why, size: 17, subSize: 12,
          labelFill: okv ? c.ok : c.bad, alpha: Math.max(0.25, verd)
        });
      }

      let noteTo;
      if (s !== 5) {
        // ---- number line -------------------------------------------------
        d.line(L0, LY, BAND0, LY, { stroke: c.bad, width: 9, alpha: 0.5 });
        d.line(BAND0, LY, d.lerp(BAND0, BAND1, s === 0 ? d.seg(t, 0.05, 0.35) : 1), LY,
               { stroke: c.ok, width: 11, glow: s === 0 });
        d.line(BAND1, LY, L1, LY, { stroke: c.bad, width: 9, alpha: 0.5 });
        [0, 10, 20, 30, 40, 50].forEach(v => {
          d.line(px(v), LY - 10, px(v), LY + 10, { stroke: c.soft, width: 2 });
          d.text(px(v), LY + 22, String(v), { size: 13, weight: 700, align: "center",
                                              baseline: "middle", fill: c.soft, max: 40 });
        });
        d.text((BAND0 + BAND1) / 2, LY + 42, "accepted: 0 to 50 inclusive", {
          size: 13, weight: 800, align: "center", baseline: "middle", fill: c.ok, max: 300 });
        d.text(px(-3), LY + 42, "too low", { size: 12, weight: 700, align: "center",
                                             baseline: "middle", fill: c.bad, max: 70 });
        d.text(px(53), LY + 42, "too high", { size: 12, weight: 700, align: "center",
                                              baseline: "middle", fill: c.bad, max: 70 });
        // the line is broken here, so a value well off the end still has a place
        d.line(856, LY - 14, 866, LY + 14, { stroke: c.dim, width: 2 });
        d.line(866, LY - 14, 876, LY + 14, { stroke: c.dim, width: 2 });
        d.line(880, LY, 946, LY, { stroke: c.bad, width: 9, alpha: 0.5 });
        d.text(910, LY + 22, "73", { size: 13, weight: 700, align: "center",
                                     baseline: "middle", fill: c.soft, max: 40 });

        // ---- the value being tested --------------------------------------
        const tx2 = val === null ? 490 : (val === 73 ? 910 : px(val));
        const bounce = val === null ? Math.sin(Math.PI * d.clamp(verd, 0, 1)) * -22 : 0;
        const cw = Math.max(56, d.measure(lbl, 17, 700) + 26);
        const cx = d.lerp(490, tx2, drop), cy = d.lerp(126, 164, drop) + bounce;
        if (val !== null && drop > 0.95)
          d.line(cx, 180, cx, LY - 7, { stroke: okv ? c.ok : c.bad, width: 2, dash: [4, 4] });
        if (val === null && drop > 0.95) {
          d.line(cx, 182, cx, LY - 7, { stroke: c.bad, width: 2, dash: [4, 4], alpha: 0.6 });
          d.line(cx - 11, LY - 11, cx + 11, LY + 11, { stroke: c.bad, width: 4 });
          d.line(cx + 11, LY - 11, cx - 11, LY + 11, { stroke: c.bad, width: 4 });
        }
        d.chip(cx, cy, lbl, { w: cw, h: 32, size: 17,
                              fill: verd > 0.4 ? (okv ? c.ok : c.bad) : c.edge, glow: true });
        if (verd > 0.1) {
          const mx = cx + cw / 2 + 20;
          if (okv) d.path([[mx - 9, cy], [mx - 3, cy + 7], [mx + 10, cy - 9]],
                          { stroke: c.ok, width: 4, alpha: verd });
          else {
            d.line(mx - 9, cy - 9, mx + 9, cy + 9, { stroke: c.bad, width: 4, alpha: verd });
            d.line(mx + 9, cy - 9, mx - 9, cy + 9, { stroke: c.bad, width: 4, alpha: verd });
          }
        }

        // ---- the detail panel --------------------------------------------
        if (s === 2) {
          const zoom = (bx, vs, low, caps, head) => {
            d.box(bx, 252, 300, 88, { fill: c.panel, stroke: c.edge, r: 10 });
            d.text(bx + 150, 266, head, { size: 11.5, weight: 700, align: "center",
                                          baseline: "middle", fill: c.dim, max: 282 });
            const zx = i => bx + 50 + i * 100;
            const cut = bx + 26 + (low ? 74 : 174);
            d.line(bx + 26, 308, cut, 308, { stroke: low ? c.bad : c.ok, width: 8, alpha: 0.75 });
            d.line(cut, 308, bx + 274, 308, { stroke: low ? c.ok : c.bad, width: 8, alpha: 0.75 });
            vs.forEach((v, i) => {
              const on = v === val;
              d.chip(zx(i), 286, String(v), { w: 46, h: 24, size: 14, glow: on,
                                              fill: (low ? i >= 1 : i <= 1) ? c.ok : c.bad,
                                              alpha: on ? 1 : 0.5 });
              d.line(zx(i), 300, zx(i), 316, { stroke: c.soft, width: on ? 3 : 1.5, alpha: on ? 1 : 0.5 });
              d.text(zx(i), 329, caps[i], { size: 11, weight: 700, align: "center", baseline: "middle",
                                            fill: on ? c.fg : c.dim, max: 96 });
            });
          };
          zoom(150, [-1, 0, 1], true, ["outside", "just inside", "inside"], "close up: the bottom edge");
          zoom(530, [49, 50, 51], false, ["inside", "just inside", "just outside"], "close up: the top edge");
          noteTo = [300, 286];
        } else {
          const say = [
            "The rule is the thing being tested. Every test you write is asking the same question: does the program actually follow it?",
            "If normal data fails there is no point testing anything else. Always start here, then push outwards towards the edges.",
            "",
            "73 is the right type of data, so the program will happily compare it with 0 and 50. It simply has to say no.",
            "A program with no validation will often crash on erroneous data rather than reject it politely."
          ][s];
          d.box(150, 252, 680, 88, { fill: c.panel, stroke: c.line, r: 10 });
          wrapA(d, 172, 278, say, 636, { size: 14, fill: c.soft });
          noteTo = [val === null ? 490 : (val === 73 ? 910 : px(val)), LY];
        }
      } else {
        // ---- iterative testing vs final testing --------------------------
        d.text(40, 148, "1.  Iterative testing - while the program is being written", {
          size: 15, weight: 800, baseline: "middle", fill: c.edge, max: 600 });
        d.line(60, 232, 652, 232, { stroke: c.line, width: 6 });
        const mods = ["ask for the mark", "check 0 to 50", "work out grade", "print the result"];
        mods.forEach((m, i) => {
          const bx = 60 + i * 150;
          const in1 = d.seg(t, 0.03 + i * 0.05, 0.11 + i * 0.05);
          d.box(bx, 209, 134, 46, { fill: c.panel, stroke: in1 > 0.5 ? c.ok : c.line,
                                    on: in1 > 0.9, label: m, size: 12.5, r: 8 });
          d.chip(bx + 67, 176, "tested", { h: 22, size: 11, fill: c.ok, glow: true, alpha: in1 });
        });
        d.curve(344, 258, 212, 258, -30, { stroke: c.orange, width: 2.5, dash: [5, 4],
                                           label: "fix it, then test it again", labelSize: 11.5,
                                           alpha: d.seg(t, 0.16, 0.3) });
        d.arrow(656, 232, 686, 232, { stroke: c.info, width: 3, alpha: d.seg(t, 0.26, 0.34) });
        const fa = Math.max(0.25, d.seg(t, 0.28, 0.38));
        d.box(692, 186, 250, 96, { fill: c.panel, stroke: c.info, on: fa > 0.9, r: 10, alpha: fa });
        d.text(708, 210, "2.  Final testing", { size: 15, weight: 800, baseline: "middle",
                                                fill: c.info, max: 220, alpha: fa });
        wrapA(d, 708, 224, "the finished program, run against the original requirements with the full set of test data",
              222, { size: 12, fill: c.soft, alpha: fa });
        wrapA(d, 40, 300, "Iterative testing finds the mistake in the part you have just written, while you still remember how it works. Final testing checks that the whole finished program does what it was asked to do.",
              900, { size: 14, fill: c.soft });
        noteTo = [818, 282];
      }

      // ---- the test plan ---------------------------------------------------
      const litRow = (s >= 1 && s <= 4) ? s - 1 : -1;
      ["Kind of test data", "Test data", "Expected result", "Why you use it"].forEach((h, i) =>
        d.text(COL[i], 352, h, { size: 12, weight: 800, baseline: "middle", fill: c.dim, max: CMAX[i] }));
      PLAN.forEach((r, i) => {
        const on = i === litRow;
        d.box(40, 366 + i * 24, 900, 22, { fill: on ? c.panel2 : c.panel,
                                           stroke: on ? c.edge : c.line, on: on, r: 5,
                                           alpha: on ? 1 : 0.78 });
        r.forEach((cell, j) => d.text(COL[j], 377 + i * 24, cell, {
          size: 12.5, weight: j === 0 ? 800 : 600, baseline: "middle",
          fill: on ? c.fg : c.soft, max: CMAX[j], alpha: on ? 1 : 0.8 }));
      });
      if (litRow >= 0) d.head(32, 377 + litRow * 24, 0, { stroke: c.edge, size: 8 });

      const notes = [
        ["Inclusive matters", "Writing < 50 where the rule says up to and including 50 is one of the commonest validation bugs there is."],
        ["Start in the middle", "A test that passes still counts as a test. It proves the program accepts the data it is supposed to accept."],
        ["Just inside, just outside", "Test both sides of each edge. 0 and 50 must pass; -1 and 51 must fail. Getting one of the four wrong is how off-by-one errors survive."],
        ["Invalid, not erroneous", "Invalid data is a value the rule rejects. Erroneous data is not even the right type. Examiners want the difference."],
        ["Nowhere to put it", "You cannot mark this on the number line at all, because it is not a number. The program has to check the type before it checks the range."],
        ["Both, not either", "Iterative testing on its own misses problems between the parts. Final testing on its own leaves you hunting a bug through the whole program."]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: noteTo, w: 360, anchor: "centre",
                               maxLead: 150, alpha: d.seg(t, 0, 0.2) });
    } };
  });

  // =========================================================== 2.5  pl-l03
  A("translators", function () {
    const W = 980, H = 580;
    const SRC = ["score = 0", "bonus = 5", 'print("Start")', "score = score + + bonus", "print(score)"];
    const FIX = "score = score + bonus";
    const BITS = "1011010011000101001110100101101100101110";
    const LY0 = 212, LGAP = 30;

    const steps = [
      { name: "1. Machine code only", caption: "A processor can only execute machine code. Anything written in a high level language has to be translated first, and there are two ways of doing it." },
      { name: "2. Compile it all", caption: "A compiler translates the whole program in one go before any of it runs. It checks every line, so it finds the mistake on line 4 while the program is still standing still." },
      { name: "3. Then it runs alone", caption: "With line 4 fixed, the compiler produces an executable file of machine code. That file runs on the processor by itself - the compiler is not needed again." },
      { name: "4. One line at a time", caption: "An interpreter translates a line, runs it, then moves on. Lines 1 to 3 are translated and run straight away, so Start is already printed." },
      { name: "5. The first error", caption: "The interpreter only reaches line 4 after lines 1 to 3 have already run. It stops there, so line 5 never runs at all." },
      { name: "6. Which to use", caption: "The same faulty program, both ways. The compiler refuses to produce anything; the interpreter gets three lines in before it notices." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Translators: compiler and interpreter");
      const comp = s === 1 || s === 2 || s === 5;
      const inte = s === 3 || s === 4 || s === 5;
      const errV = s === 1 || s === 5;                 // the faulty program
      const fixed = s === 2;
      const busy = s === 2 || s === 3;

      // ---- source code -----------------------------------------------------
      d.box(24, 150, 232, 230, { fill: c.panel, stroke: c.line, r: 12 });
      d.text(40, 172, "Source code", { size: 14, weight: 800, baseline: "middle", fill: c.fg, max: 200 });
      d.text(40, 190, "high level, written by a person", { size: 11.5, weight: 600,
                                                           baseline: "middle", fill: c.dim, max: 200 });
      SRC.forEach((ln, i) => {
        const y = LY0 + i * LGAP;
        const bad = i === 3 && !fixed;
        const txt = (i === 3 && fixed) ? FIX : ln;
        const hi = (i === 3 && (s === 1 || s === 2 || s === 4 || s === 5)) || (s === 3 && i <= 2);
        if (hi) d.box(34, y - 13, 212, 26, {
          fill: c.panel2, stroke: bad ? c.bad : c.ok, on: true, r: 6,
          alpha: 0.45 + 0.55 * d.seg(t, 0.05, 0.25) });
        d.text(42, y, String(i + 1), { size: 12, weight: 700, baseline: "middle",
                                       fill: bad ? c.bad : c.dim, max: 16 });
        d.text(62, y, txt, { size: 13, weight: 600, baseline: "middle",
                             fill: bad ? c.bad : (i === 3 && fixed ? c.ok : c.soft), max: 178 });
      });
      d.text(40, 364, fixed ? "line 4 fixed" : "line 4 has a syntax error", {
        size: 12, weight: 700, baseline: "middle", fill: fixed ? c.ok : c.bad, max: 200 });

      // ---- processor -------------------------------------------------------
      d.box(800, 150, 156, 230, { fill: c.panel, stroke: busy ? c.edge : c.line, on: busy, r: 12 });
      d.text(878, 178, "Processor", { size: 15, weight: 800, align: "center", baseline: "middle",
                                      fill: c.fg, max: 136 });
      d.wrap(814, 194, "it can only execute machine code", 128, { size: 11.5, fill: c.dim });
      const off = Math.floor(t * 10) % 12;
      for (let i = 0; i < 5; i++)
        d.text(878, 250 + i * 24, BITS.substr((off + i * 3) % 24, 8) + " " + BITS.substr((off + i * 3 + 9) % 24, 8), {
          size: 12.5, weight: 700, align: "center", baseline: "middle",
          fill: busy ? c.ok : c.dim, max: 136, alpha: busy ? 1 : 0.45 });
      d.text(878, 366, busy ? "running" : "waiting", { size: 12, weight: 800, align: "center",
                                                       baseline: "middle", fill: busy ? c.ok : c.dim, max: 136 });

      // ---- compiler lane ---------------------------------------------------
      const cal = s === 0 ? 0.16 : comp ? 1 : 0.4;
      d.box(280, 62, 500, 176, { fill: c.panel, stroke: comp ? c.teal : c.line, on: comp, r: 12, alpha: cal });
      d.text(296, 84, "Compiler", { size: 15, weight: 800, baseline: "middle", fill: c.teal, max: 160, alpha: cal });
      d.text(766, 85, "translates the whole program, then stops", {
        size: 11.5, weight: 600, align: "right", baseline: "middle", fill: c.dim, max: 300, alpha: cal });
      const st = [
        ["Translate", "all 5 lines at once", c.teal],
        errV ? ["Error report", "line 4: syntax error", c.bad] : ["Executable", "a machine code file", c.ok],
        errV ? ["Nothing runs", "no executable made", c.bad] : ["It runs", "output: Start then 5", c.ok]
      ];
      st.forEach((bb, i) => {
        const bx = 296 + i * 170;
        const on = comp && d.seg(t, 0.06 + i * 0.1, 0.18 + i * 0.1) > 0.8;
        d.box(bx, 104, 140, 68, { fill: on ? c.panel2 : c.panel, stroke: on ? bb[2] : c.line, on: on,
                                  label: bb[0], sub: bb[1], size: 15, subSize: 11.5, r: 10, alpha: cal });
        if (i < 2) d.arrow(bx + 144, 138, bx + 164, 138, { stroke: on ? bb[2] : c.line, width: 2.5, alpha: cal });
      });
      const nTr = comp ? Math.min(5, Math.floor(d.seg(t, 0.02, 0.3) * 5.4)) : 0;
      d.cells(296, 186, ["1", "2", "3", "4", "5"], {
        cw: 30, ch: 30, gap: 6, size: 13, alpha: cal, accent: c.teal,
        on: comp ? [0, 1, 2, 3, 4].slice(0, nTr) : [] });
      d.text(490, 201, comp ? "all 5 lines translated before anything runs" : "lines translated",
             { size: 12, weight: 700, baseline: "middle", fill: c.soft, max: 280, alpha: cal });
      if (comp && !errV) {
        d.arrow(772, 150, 796, 194, { stroke: c.ok, width: 3, alpha: cal });
        const f = (t * 1.4) % 1;
        d.dot(d.lerp(772, 793, f), d.lerp(150, 189, f), 7, { fill: c.ok, glow: true, alpha: cal });
      }

      // ---- interpreter lane ------------------------------------------------
      const ial = s === 0 ? 0.16 : inte ? 1 : 0.4;
      d.box(280, 268, 500, 200, { fill: c.panel, stroke: inte ? c.violet : c.line, on: inte, r: 12, alpha: ial });
      d.text(296, 290, "Interpreter", { size: 15, weight: 800, baseline: "middle", fill: c.violet, max: 160, alpha: ial });
      d.text(766, 291, "one line at a time", {
        size: 11.5, weight: 600, align: "right", baseline: "middle", fill: c.dim, max: 140, alpha: ial });
      const reach = s === 3 ? Math.min(3, 1 + Math.floor(d.seg(t, 0.04, 0.3) * 3.2)) : inte ? 4 : 0;
      for (let i = 0; i < 5; i++) {
        const ix = 296 + i * 68, done = i + 1 <= Math.min(reach, 3);
        const err = inte && i === 3 && s !== 3;
        const livei = i + 1 === reach && s === 3;
        d.box(ix, 306, 60, 44, {
          fill: (done || err) ? c.panel2 : c.panel,
          stroke: err ? c.bad : done ? c.ok : c.line, on: err || livei || done,
          label: "line " + (i + 1), size: 12, r: 8,
          alpha: ial * (i === 4 && inte ? 0.5 : 1) });
        if (done) d.path([[ix + 20, 362], [ix + 27, 370], [ix + 42, 352]],
                         { stroke: c.ok, width: 3.5, alpha: ial });
        if (err) {
          const e = d.seg(t, 0.06, 0.26);
          d.line(ix + 20, 352, ix + 40, 372, { stroke: c.bad, width: 3.5, alpha: ial * e });
          d.line(ix + 40, 352, ix + 20, 372, { stroke: c.bad, width: 3.5, alpha: ial * e });
        }
        if (i === 4 && inte) d.text(ix + 30, 362, s === 3 ? "not yet" : "never runs", {
          size: 10.5, weight: 700, align: "center", baseline: "middle", fill: c.dim, max: 58, alpha: ial });
        if (livei) d.chip(ix + 30, 288, "here", { h: 20, size: 10.5, fill: c.violet, glow: true, alpha: ial });
        if (err) d.chip(ix + 30, 288, "stops", { h: 20, size: 10.5, fill: c.bad, glow: true,
                                                 alpha: ial * d.seg(t, 0.1, 0.3) });
      }
      d.box(296, 384, 220, 74, { fill: c.panel, stroke: c.line, r: 10, alpha: ial });
      d.text(312, 404, "Output so far", { size: 12, weight: 700, baseline: "middle", fill: c.dim, max: 190, alpha: ial });
      d.text(312, 430, inte ? "Start" : "-", { size: 16, weight: 700, baseline: "middle",
                                               fill: inte ? c.ok : c.dim, max: 190, alpha: ial });
      const stopped = s === 4 || s === 5;
      d.box(536, 384, 230, 74, {
        fill: c.panel, stroke: stopped ? c.bad : s === 3 ? c.violet : c.line, on: inte, r: 10, alpha: ial });
      d.text(552, 404, stopped ? "Error on line 4" : s === 3 ? "Still running" : "Status",
             { size: 13, weight: 800, baseline: "middle", fill: stopped ? c.bad : c.violet, max: 200, alpha: ial });
      wrapA(d, 552, 418, stopped ? "found only on reaching it, after lines 1 to 3 had run"
                       : s === 3 ? "three lines translated and run, nothing checked beyond them"
                       : "the translator has to be there every time the program is run",
            200, { size: 11.5, fill: c.soft, alpha: ial });
      if (inte) {
        d.arrow(640, 328, 796, 300, { stroke: s === 3 ? c.violet : c.dim, width: 2.5, alpha: ial * 0.8 });
        if (s === 3) {
          const f = (t * 1.2) % 1;
          d.dot(d.lerp(644, 790, f), d.lerp(328, 301, f), 7, { fill: c.violet, glow: true, alpha: ial });
        }
      }

      // ---- the gap between the lanes --------------------------------------
      if (s === 0) {
        d.arrow(262, 253, 794, 253, { stroke: c.bad, width: 3, dash: [8, 6] });
        const ph = (t * 1.6) % 1, f = ph < 0.6 ? ph / 0.6 : 1 - (ph - 0.6) / 0.4;
        d.chip(d.lerp(292, 460, f), 253, "score = 0", { fill: c.edge, glow: true, size: 11.5, h: 22 });
        d.line(519, 242, 541, 264, { stroke: c.bad, width: 5 });
        d.line(541, 242, 519, 264, { stroke: c.bad, width: 5 });
        d.text(530, 228, "a processor cannot run high level code as it is", {
          size: 13, weight: 800, align: "center", baseline: "middle", fill: c.bad, max: 460 });
      }
      // The gap between the two lanes is 36px, which is not enough for a two-line
      // summary without it landing on one box edge or the other. The step caption
      // and the note already make the same contrast, so it is said once.

      const notes = [
        ["Two ways, same job", "Both end up producing machine code for this processor. They differ in when they do it, and in what you are left with afterwards.", [529, 253]],
        ["Nothing has run yet", "Not one line has been executed, so the program cannot have printed anything or changed any data. The error is found cold.", [366, 172]],
        ["What you hand out", "Finished software is normally shipped compiled, so the user needs no translator and never sees the source code.", [696, 172]],
        ["Translate, run, repeat", "Each line is translated again every time it is reached, which is why an interpreted loop is slower than a compiled one.", [326, 352]],
        ["Same error, found later", "The compiler caught this before anything happened. The interpreter only caught it after Start had already been printed.", [530, 288]],
        ["Horses for courses", "Interpreters suit writing and testing, because you can run a half-finished program. Compilers suit releasing it.", [530, 254]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                               maxLead: 150, alpha: d.seg(t, 0, 0.2) });
    } };
  });
})();
