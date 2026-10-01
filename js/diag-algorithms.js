/* Revise 360 - algorithms: searching, sorting and flowcharts (OCR J277 2.1).
 *
 * al-l04 flowcharts, al-l06 linear search, al-l07 binary search,
 * al-l08 bubble sort, al-l09 merge sort.
 *
 * Every trace in here was worked by hand first and the rendered frames checked
 * against it. The counts shown are the counts actually drawn:
 *
 *   searches    [3,7,12,19,26,31,40,48], target 40
 *               linear  3,7,12,19,26,31,40            -> 7 comparisons
 *               binary  mid 19, mid 31, mid 40        -> 3 comparisons
 *   bubblesort  [5,1,4,2,8]
 *               pass 1  4 comparisons, 3 swaps -> [1,4,2,5,8]
 *               pass 2  3 comparisons, 1 swap  -> [1,2,4,5,8]
 *               pass 3  2 comparisons, 0 swaps -> stop
 *               totals  9 comparisons, 4 swaps, 3 passes
 *   mergesort   [8,3,5,1,9,6,2,7]
 *               -> [3,8][1,5][6,9][2,7] -> [1,3,5,8][2,6,7,9]
 *               -> [1,2,3,5,6,7,8,9]
 *   flowchart   numbers 4, 7, 2, -1 -> total 0, 4, 11, 13 -> output 13
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  // A filled outline shape (parallelogram, diamond) with a centred label.
  function shape(d, pts, lx, ly, maxw, o) {
    o = o || {};
    const ac = o.stroke || d.c.line;
    d.path(pts, {
      fill: o.fill || d.c.panel, stroke: o.on ? ac : (o.stroke || d.c.line),
      width: o.on ? 3.5 : 1.6, glow: o.on, alpha: o.alpha
    });
    if (o.label !== undefined)
      d.text(lx, ly + (o.sub ? -8 : 0), o.label, {
        size: o.size || 14, weight: 700, align: "center", baseline: "middle",
        fill: o.labelFill || d.c.fg, max: maxw, alpha: o.alpha
      });
    if (o.sub !== undefined)
      d.text(lx, ly + 12, o.sub, {
        size: 11.5, weight: 600, align: "center", baseline: "middle",
        fill: o.subFill || d.c.soft, max: maxw, alpha: o.alpha
      });
  }

  // ------------------------------------------------------------------ al-l06/07
  A("searches", function () {
    const W = 980, H = 580;
    const LIST = [3, 7, 12, 19, 26, 31, 40, 48], TARGET = 40;
    const CW = 46, GAP = 4, CY = 128, CH = 44;
    const LP = { x: 30, y: 78, w: 440, h: 368 };
    const RP = { x: 510, y: 78, w: 440, h: 368 };
    const ROW = 8 * (CW + GAP) - GAP;
    const cx = (p, i) => p.x + (p.w - ROW) / 2 + i * (CW + GAP);

    const LIN = [
      "1. index 0: 3 = 40? no", "2. index 1: 7 = 40? no", "3. index 2: 12 = 40? no",
      "4. index 3: 19 = 40? no", "5. index 4: 26 = 40? no", "6. index 5: 31 = 40? no",
      "7. index 6: 40 = 40? yes"
    ];
    const BIN = [
      { lo: 0, hi: 7, mid: 3, line: "1. low 0, high 7, middle 3: 19 < 40, look right" },
      { lo: 4, hi: 7, mid: 5, line: "2. low 4, high 7, middle 5: 31 < 40, look right" },
      { lo: 6, hi: 7, mid: 6, line: "3. low 6, high 7, middle 6: 40 found" }
    ];

    const steps = [
      { name: "1. Same job", caption: "One sorted list, one target. Both searches look for 40 in exactly the same eight values, so the comparison is fair." },
      { name: "2. Linear", caption: "Linear search checks index 0, then 1, then 2, and keeps going. It reaches 40 at index 6, so that is seven comparisons." },
      { name: "3. Halve it", caption: "Binary search starts in the middle. 19 is smaller than 40, so 40 cannot be in the left half - throw all four of those away." },
      { name: "4. Halve again", caption: "The same move on what is left. The middle of index 4 to 7 is 31, still too small, so the left of that goes too." },
      { name: "5. Found", caption: "Two values remain. The middle of index 6 to 7 is 40, which is the target, after only three comparisons." },
      { name: "6. The catch", caption: "Binary search wins here - but it only works on a sorted list, and sorting eight values costs far more comparisons than searching them." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Linear search and binary search");
      d.chip(490, 56, "target = " + TARGET, { fill: c.edge, h: 26, size: 13, glow: true });

      // panels ---------------------------------------------------------------
      [[LP, "Linear search", "check one at a time", c.orange],
       [RP, "Binary search", "halve the range", c.teal]].forEach(p => {
        d.box(p[0].x, p[0].y, p[0].w, p[0].h, { fill: "#16233c", stroke: c.line, r: 14 });
        d.text(p[0].x + 20, p[0].y + 24, p[1], { size: 15, weight: 800, fill: p[3], baseline: "middle", max: 190 });
        d.text(p[0].x + p[0].w - 20, p[0].y + 24, p[2], { size: 12, weight: 600, align: "right",
                                                          baseline: "middle", fill: c.dim, max: 190 });
      });

      // ---- linear ----------------------------------------------------------
      const pop = i => (s === 0 ? d.seg(t, .02 + i * .035, .24 + i * .035) : 1);

      const linCur = s === 1 ? Math.min(6, Math.floor(d.clamp(d.seg(t, .02, .98), 0, .999) * 7))
                             : (s >= 2 ? 6 : -1);
      const linFound = linCur === 6;
      for (let i = 0; i < 8; i++) {
        let fill = c.panel, stroke = c.line, on = false, lf = c.fg;
        if (linCur >= 0) {
          if (i < linCur) { stroke = c.bad; lf = c.soft; }
          else if (i === linCur && linFound) { fill = "#1d4a35"; stroke = c.ok; on = true; }
          else if (i === linCur) { fill = "#3a2f1a"; stroke = c.orange; on = true; }
        }
        d.box(cx(LP, i), CY, CW, CH, { fill, stroke, on, r: 7, label: String(LIST[i]), size: 17,
                                       labelFill: lf, alpha: pop(i) });
        d.text(cx(LP, i) + CW / 2, CY + CH + 14, String(i),
               { size: 11, weight: 600, align: "center", baseline: "middle", fill: c.dim, alpha: pop(i) });
      }
      if (linCur >= 0) {
        const px = cx(LP, linCur) + CW / 2;
        d.path([[px - 8, CY - 16], [px + 8, CY - 16], [px, CY - 5]],
               { fill: linFound ? c.ok : c.orange, stroke: null, width: 0 });
        d.line(cx(LP, 0), 200, cx(LP, linCur) + CW, 200, { stroke: c.orange, width: 3 });
      }
      for (let i = 0; i <= linCur; i++)
        d.text(LP.x + 22, 214 + i * 21, LIN[i],
               { size: 12.5, weight: 600, baseline: "middle", max: 400,
                 fill: i === 6 ? c.ok : c.soft });

      // ---- binary ----------------------------------------------------------
      const binR = s === 2 ? 0 : s === 3 ? 1 : s >= 4 ? 2 : -1;
      const binDisc = (s === 2 || s === 3) && d.seg(t, .55, .95) > .5;
      for (let i = 0; i < 8; i++) {
        let fill = c.panel, stroke = c.line, on = false, lf = c.fg;
        if (binR >= 0) {
          const r = BIN[binR];
          if (i < r.lo) { fill = "#131d31"; stroke = "#2a3b56"; lf = c.dim; }
          else if (i === r.mid && binR === 2) { fill = "#1d4a35"; stroke = c.ok; on = true; }
          else if (i === r.mid && binDisc) { stroke = c.bad; lf = c.soft; }
          else if (i === r.mid) { fill = "#14364a"; stroke = c.teal; on = true; }
          else if (binDisc && i < r.mid) { fill = "#131d31"; stroke = "#2a3b56"; lf = c.dim; }
        }
        d.box(cx(RP, i), CY, CW, CH, { fill, stroke, on, r: 7, label: String(LIST[i]), size: 17,
                                       labelFill: lf, alpha: pop(i) });
        d.text(cx(RP, i) + CW / 2, CY + CH + 14, String(i),
               { size: 11, weight: 600, align: "center", baseline: "middle", fill: c.dim, alpha: pop(i) });
      }
      if (binR >= 0) {
        const r = BIN[binR];
        const lo = binDisc && binR < 2 ? BIN[binR + 1].lo : r.lo;
        d.line(cx(RP, lo), 200, cx(RP, r.hi) + CW, 200, { stroke: c.teal, width: 3 });
        const mx = cx(RP, r.mid) + CW / 2;
        d.path([[mx - 8, CY - 16], [mx + 8, CY - 16], [mx, CY - 5]],
               { fill: binR === 2 ? c.ok : (binDisc ? c.bad : c.teal), stroke: null, width: 0 });
        for (let i = 0; i <= binR; i++)
          d.text(RP.x + 22, 214 + i * 21, BIN[i].line,
                 { size: 12.5, weight: 600, baseline: "middle", max: 400,
                   fill: i === 2 ? c.ok : c.soft });
      }

      // ---- counters --------------------------------------------------------
      const fin = s === 5, gl = .62 + .38 * d.pulse(t);
      d.box(LP.x + 20, 382, LP.w - 40, 52, {
        fill: fin ? "#3a2f1a" : c.panel, stroke: c.orange, on: fin, alpha: fin ? gl : 1,
        label: (linCur < 0 ? 0 : linCur + 1) + (linCur + 1 === 1 ? " comparison" : " comparisons"),
        size: 22, sub: fin ? "works on any list, sorted or not" : "", max: 340 });
      d.box(RP.x + 20, 382, RP.w - 40, 52, {
        fill: fin ? "#14364a" : c.panel, stroke: c.teal, on: fin, alpha: fin ? gl : 1,
        label: (binR < 0 ? 0 : binR + 1) + (binR + 1 === 1 ? " comparison" : " comparisons"),
        size: 22, sub: fin ? "only works if the list is sorted" : "", max: 340 });
      if (s === 0 && t > .45) {
        d.wrap(LP.x + 22, 216, "Start at index 0 and look at every value in turn, until you find the target or run out of list.",
               400, { size: 13, fill: c.soft });
        d.wrap(RP.x + 22, 216, "Look at the middle value, work out which half the target must be in, and throw the other half away.",
               400, { size: 13, fill: c.soft });
      }
      if (fin) {
        const a = d.seg(t, .15, .6);
        d.text(LP.x + 22, 362, "Worst case on eight values: 8 comparisons.",
               { size: 12.5, weight: 600, baseline: "middle", fill: c.dim, alpha: a, max: 400 });
        d.text(RP.x + 22, 300, "Bubble sorting the eight values first: up to 28 comparisons.",
               { size: 12.5, weight: 600, baseline: "middle", fill: c.bad, alpha: a, max: 400 });
      }

      const notes = [
        ["Sorted already", "Binary search cannot start unless the values are in order. This list is, so both searches can run.", [cx(RP, 3) + CW / 2, CY + CH + 2]],
        ["Worst case", "The target was near the end. If 40 were not in the list at all, linear search would still have to check all eight.", [cx(LP, 6) + CW / 2, CY + CH + 2]],
        ["Why the half goes", "Because the list is sorted, everything left of 19 must also be below 40. Four values are ruled out by one comparison.", [cx(RP, 1) + CW / 2, CY + CH + 2]],
        ["Integer division", "The middle index is (low + high) DIV 2, so (4 + 7) DIV 2 gives 5, not 5.5.", [cx(RP, 5) + CW / 2, CY + CH + 2]],
        ["Three, not seven", "Each comparison throws away about half of what is left, so doubling the list adds only one more comparison.", [cx(RP, 6) + CW / 2, CY + CH + 2]],
        ["When linear wins", "For a one-off search of an unsorted list, sorting it first costs more than just walking through it. Binary search pays off when you search the same list again and again.", [RP.x + 200, 314]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 120, alpha: d.seg(t, 0, .25) });
    } };
  });

  // --------------------------------------------------------------------- al-l08
  A("bubblesort", function () {
    const W = 980, H = 580;
    const CW = 54, CH = 46, GAP = 8, CX = 150;
    const ROWY = [92, 168, 244, 320];
    const at = i => CX + i * (CW + GAP) + CW / 2;
    const LABEL = ["Start", "After pass 1", "After pass 2", "After pass 3"];
    const START = [5, 1, 4, 2, 8];

    // Every comparison, in order, with the state either side of it.
    const E = [
      { p: 1, i: 0, b: [5, 1, 4, 2, 8], sw: true,  a: [1, 5, 4, 2, 8], cm: 1, sp: 1 },
      { p: 1, i: 1, b: [1, 5, 4, 2, 8], sw: true,  a: [1, 4, 5, 2, 8], cm: 2, sp: 2 },
      { p: 1, i: 2, b: [1, 4, 5, 2, 8], sw: true,  a: [1, 4, 2, 5, 8], cm: 3, sp: 3 },
      { p: 1, i: 3, b: [1, 4, 2, 5, 8], sw: false, a: [1, 4, 2, 5, 8], cm: 4, sp: 3 },
      { p: 2, i: 0, b: [1, 4, 2, 5, 8], sw: false, a: [1, 4, 2, 5, 8], cm: 5, sp: 3 },
      { p: 2, i: 1, b: [1, 4, 2, 5, 8], sw: true,  a: [1, 2, 4, 5, 8], cm: 6, sp: 4 },
      { p: 2, i: 2, b: [1, 2, 4, 5, 8], sw: false, a: [1, 2, 4, 5, 8], cm: 7, sp: 4 },
      { p: 3, i: 0, b: [1, 2, 4, 5, 8], sw: false, a: [1, 2, 4, 5, 8], cm: 8, sp: 4 },
      { p: 3, i: 1, b: [1, 2, 4, 5, 8], sw: false, a: [1, 2, 4, 5, 8], cm: 9, sp: 4 }
    ];
    const PASS = { 1: E.slice(0, 4), 2: E.slice(4, 7), 3: E.slice(7, 9) };
    const DONE = { 1: [1, 4, 2, 5, 8], 2: [1, 2, 4, 5, 8], 3: [1, 2, 4, 5, 8] };
    const LIVE = { 1: 1, 3: 2, 4: 3 };          // step -> pass animating

    const steps = [
      { name: "1. The list", caption: "Five values, badly out of order. Bubble sort only ever looks at one neighbouring pair at a time." },
      { name: "2. Pass 1", caption: "Compare 5 and 1, swap. Compare 5 and 4, swap. Compare 5 and 2, swap. Compare 5 and 8, leave it. Four comparisons, three swaps." },
      { name: "3. 8 has settled", caption: "The biggest value has been pushed all the way to the end, and nothing can move it again. Pass 2 can stop one place earlier." },
      { name: "4. Pass 2", caption: "Three comparisons this time: 1 and 4 stay, 4 and 2 swap, 4 and 5 stay. Now 5 is settled too." },
      { name: "5. Pass 3", caption: "Two comparisons, and neither pair needs swapping. A pass with no swaps at all means the list is already sorted, so stop." },
      { name: "6. The cost", caption: "Nine comparisons and four swaps to sort five values. Bubble sort is easy to write but slow, because the work grows roughly with the square of the list length." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Bubble sort");

      const live = LIVE[s] || 0;
      const ev = live ? PASS[live] : null;
      let k = 0, u = 0, e = null;
      if (ev) {
        const prog = d.clamp(t, 0, .9999) * ev.length;
        k = Math.floor(prog); u = prog - k; e = ev[k];
      }

      // what each row shows ------------------------------------------------
      function rowList(r) {
        if (r === 0) return START;
        const p = r;
        if (live === p) return u < .5 ? e.b : e.a;
        return DONE[p];
      }
      function rowVisible(r) { return r === 0 || (r === 1 ? s >= 1 : r === 2 ? s >= 3 : s >= 4); }
      function fillsFor(r) {
        const f = {};
        if (r === 1 && s >= 2) f[4] = c.ok;
        if (r === 2 && s >= 3) { f[4] = c.ok; if (s >= 4 || t > .82) f[3] = c.ok; }
        if (r === 3 && s >= 4) { f[4] = c.ok; f[3] = c.ok; }
        if (r === 3 && s >= 5) {
          const n = Math.floor(d.seg(t, 0, .7) * 5.999);
          for (let i = 0; i < Math.min(5, n + 1); i++) f[i] = c.ok;
          f[3] = c.ok; f[4] = c.ok;
        }
        return f;
      }

      for (let r = 0; r < 4; r++) {
        const vis = rowVisible(r);
        const y = ROWY[r];
        d.text(CX - 16, y + CH / 2, LABEL[r], { size: 13, weight: 700, align: "right",
                                                baseline: "middle", fill: vis ? c.soft : c.dim,
                                                alpha: vis ? 1 : .5, max: 118 });
        if (!vis) { d.cells(CX, y, [null, null, null, null, null], { cw: CW, ch: CH, gap: GAP, alpha: .16 }); continue; }
        const list = rowList(r).slice();
        const demo = s === 0 && r === 0 ? Math.min(3, Math.floor(d.clamp(t, 0, .999) * 4)) : -1;
        const on = (live === r && r > 0) ? [e.i, e.i + 1] : (demo >= 0 ? [demo, demo + 1] : []);
        const hiding = live === r && r > 0 && e.sw && u > .28 && u < .72;
        if (hiding) { list[e.i] = null; list[e.i + 1] = null; }
        d.cells(CX, y, list, { cw: CW, ch: CH, gap: GAP, on, fills: fillsFor(r),
                               accent: c.edge, size: 19 });
        if (hiding) {
          const f = d.ease(d.clamp((u - .28) / .44, 0, 1)), cyy = y + CH / 2;
          const pa = d.onCurve(at(e.i), cyy, at(e.i + 1), cyy, -64, f);
          const pb = d.onCurve(at(e.i + 1), cyy, at(e.i), cyy, -64, f);
          d.chip(pa[0], pa[1], String(e.b[e.i]), { fill: c.edge, glow: true, size: 14, h: 26 });
          d.chip(pb[0], pb[1], String(e.b[e.i + 1]), { fill: c.info, glow: true, size: 14, h: 26 });
        }
      }

      // the shrinking "still to check" bar ---------------------------------
      const barRow = s === 0 ? 0 : s === 1 || s === 2 ? 1 : s === 3 ? 2 : s === 4 ? 3 : -1;
      if (barRow >= 0) {
        let last = s === 0 || s === 1 ? 4 : s === 3 ? 3 : s === 4 ? 2 : 4;
        if (s === 2) last = d.lerp(4, 3, d.seg(t, .35, .8));
        const y = ROWY[barRow] + CH + 9;
        d.line(CX, y, CX + last * (CW + GAP) + CW, y, { stroke: c.edge, width: 3 });
        d.text(CX, y + 11, "still to check", { size: 10.5, weight: 700, baseline: "middle", fill: c.edge });
      }

      // counters -------------------------------------------------------------
      d.box(520, 84, 430, 290, { fill: "#16233c", stroke: c.line, r: 14 });
      d.text(540, 108, "Running totals", { size: 14, weight: 800, fill: c.soft, baseline: "middle", max: 200 });
      let cm = 0, sp = 0, ps = 0;
      if (s === 2) { cm = 4; sp = 3; ps = 1; }
      else if (s === 5) { cm = 9; sp = 4; ps = 3; }
      else if (e) { cm = e.cm; sp = (e.sw && u < .5) ? e.sp - 1 : e.sp; ps = e.p; }
      [[540, cm, "comparisons", c.edge], [674, sp, "swaps", c.violet], [808, ps, "passes", c.info]]
        .forEach(b => d.box(b[0], 130, 124, 70, {
          fill: c.panel, stroke: b[3], on: s === 5, label: String(b[1]), size: 30,
          sub: b[2], subFill: c.soft, max: 104 }));
      d.wrap(540, 220, "The rule: compare each neighbouring pair and swap them only if the left value is the bigger one. Keep passing through the list until a whole pass makes no swaps.",
             390, { size: 12.5, fill: c.soft });

      // the strip ------------------------------------------------------------
      let lab, sub, col = c.edge;
      if (s === 0) { lab = "Compare neighbours, swap if the left one is bigger";
                     sub = "one pass through five values looks at these four pairs in turn"; col = c.edge; }
      else if (s === 2) { lab = "8 is in its final place"; sub = "pass 2 only needs to check the first four values"; col = c.ok; }
      else if (s === 5) { lab = "Sorted: 9 comparisons, 4 swaps, 3 passes"; sub = "the third pass did no work - that is how the algorithm knows to stop"; col = c.ok; }
      else if (s === 4 && k === 1 && u > .5) { lab = "No swaps in this whole pass"; sub = "the list is already in order, so bubble sort stops here"; col = c.ok; }
      else if (e) {
        const a = e.b[e.i], b = e.b[e.i + 1];
        lab = "Pass " + e.p + ": is " + a + " bigger than " + b + "? " + (e.sw ? "yes - swap them" : "no - leave them");
        sub = "comparing index " + e.i + " and index " + (e.i + 1);
        col = e.sw ? c.bad : c.ok;
      }
      d.box(40, 400, 910, 48, { fill: c.panel, stroke: col, on: s === 5, label: lab, size: 17,
                                sub, subFill: c.soft, max: 880 });

      const notes = [
        ["Neighbours only", "Bubble sort never jumps about. It can only ever swap two values that are next to each other.", [at(2), ROWY[0] + CH]],
        ["Why it bubbles", "5 keeps winning its comparisons, so it is carried along the list until something bigger stops it.", [at(4), ROWY[1] + CH + 4]],
        ["One fewer each time", "After n passes the last n values are final, so each pass has one fewer pair to check.", [CX + 4 * (CW + GAP) + CW / 2, ROWY[1] + CH + 9]],
        ["Swapped, not sorted", "4 and 2 were the wrong way round even though the pass before had already looked at them. One pass is never enough.", [at(1), ROWY[2] + CH + 4]],
        ["The early finish", "Without this check the algorithm would keep making passes right down to a list of one. A swap counter is all it takes.", [at(2), ROWY[3] - 8]],
        ["Comparisons, not time", "Counting comparisons and swaps is how you compare two sorting algorithms fairly, whatever computer they run on.", [674 + 62, 200]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 120, alpha: d.seg(t, 0, .25) });
    } };
  });

  // --------------------------------------------------------------------- al-l09
  A("mergesort", function () {
    const W = 980, H = 580;
    const CW = 36, CH = 34, GAP = 3, GG = 26, MID = 550;
    const RY = [54, 109, 164, 219, 274, 329, 384];
    const LAB = ["The list", "Split in two", "Split again", "Single items",
                 "Merged into 2s", "Merged into 4s", "Sorted"];
    const ROWS = [
      [[8, 3, 5, 1, 9, 6, 2, 7]],
      [[8, 3, 5, 1], [9, 6, 2, 7]],
      [[8, 3], [5, 1], [9, 6], [2, 7]],
      [[8], [3], [5], [1], [9], [6], [2], [7]],
      [[3, 8], [1, 5], [6, 9], [2, 7]],
      [[1, 3, 5, 8], [2, 6, 7, 9]],
      [[1, 2, 3, 5, 6, 7, 8, 9]]
    ];

    // Each take: which source cell (flat index in the row above) is lifted, and
    // which two cells were at the front of the two sorted lists at that moment.
    const TAKES = {
      4: [{ src: 1, lk: 0, rk: 1, txt: "8 against 3: take the smaller, 3" },
          { src: 0, lk: 0, rk: -1, txt: "only the 8 is left, so it follows" },
          { src: 3, lk: 2, rk: 3, txt: "5 against 1: take the smaller, 1" },
          { src: 2, lk: 2, rk: -1, txt: "only the 5 is left, so it follows" },
          { src: 5, lk: 4, rk: 5, txt: "9 against 6: take the smaller, 6" },
          { src: 4, lk: 4, rk: -1, txt: "only the 9 is left, so it follows" },
          { src: 6, lk: 6, rk: 7, txt: "2 against 7: take the smaller, 2" },
          { src: 7, lk: -1, rk: 7, txt: "only the 7 is left, so it follows" }],
      5: [{ src: 2, lk: 0, rk: 2, txt: "front items 3 and 1: take 1" },
          { src: 0, lk: 0, rk: 3, txt: "front items 3 and 5: take 3" },
          { src: 3, lk: 1, rk: 3, txt: "front items 8 and 5: take 5" },
          { src: 1, lk: 1, rk: -1, txt: "right list empty, take 8" },
          { src: 6, lk: 4, rk: 6, txt: "front items 6 and 2: take 2" },
          { src: 4, lk: 4, rk: 7, txt: "front items 6 and 7: take 6" },
          { src: 7, lk: 5, rk: 7, txt: "front items 9 and 7: take 7" },
          { src: 5, lk: 5, rk: -1, txt: "right list empty, take 9" }],
      6: [{ src: 0, lk: 0, rk: 4, txt: "front items 1 and 2: take 1" },
          { src: 4, lk: 1, rk: 4, txt: "front items 3 and 2: take 2" },
          { src: 1, lk: 1, rk: 5, txt: "front items 3 and 6: take 3" },
          { src: 2, lk: 2, rk: 5, txt: "front items 5 and 6: take 5" },
          { src: 5, lk: 3, rk: 5, txt: "front items 8 and 6: take 6" },
          { src: 6, lk: 3, rk: 6, txt: "front items 8 and 7: take 7" },
          { src: 3, lk: 3, rk: 7, txt: "front items 8 and 9: take 8" },
          { src: 7, lk: -1, rk: 7, txt: "left list empty, take 9" }]
    };
    const MERGE = { 2: 4, 3: 5, 4: 6 };          // step -> row being filled

    function lay(groups, gg) {
      if (gg === undefined) gg = GG;
      const w = groups.map(g => g.length * (CW + GAP) - GAP);
      const total = w.reduce((a, b) => a + b, 0) + gg * (groups.length - 1);
      let x = MID - total / 2;
      const out = [];
      groups.forEach((g, gi) => {
        out.push({ x, w: w[gi], cells: g.map((v, i) => ({ v, x: x + i * (CW + GAP) })) });
        x += w[gi] + gg;
      });
      return out;
    }
    function flat(groups, gg) {
      const L = lay(groups, gg), out = [];
      L.forEach(g => g.cells.forEach(cl => out.push(cl)));
      return { groups: L, cells: out };
    }

    const steps = [
      { name: "1. Split", caption: "Merge sort starts by cutting the list straight down the middle. It does not look at the values at all yet." },
      { name: "2. Keep splitting", caption: "Split each part again, and again, until every part holds a single value. A list of one is already in order." },
      { name: "3. Merge in pairs", caption: "Now build back up. Put two single values side by side and write out the smaller one first - that gives a sorted pair." },
      { name: "4. Merge the pairs", caption: "Look only at the front value of each sorted list, take the smaller, and move that list's front on by one. Repeat until both are empty." },
      { name: "5. The last merge", caption: "The same move on the two sorted halves. Eight values come out in order using only seven comparisons, because each one is used once." },
      { name: "6. Done", caption: "Three rounds of splitting and three rounds of merging. Merge sort is much faster than bubble sort on long lists, but it needs extra memory to hold the parts." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Merge sort");

      const tgt = MERGE[s] || -1;
      const tk = TAKES[tgt] || null;
      let cur = -1, u = 0;
      if (tk) { const p = d.clamp(t, 0, .9999) * 8; cur = Math.floor(p); u = p - cur; }

      function shown(r) {
        if (r === 0) return true;
        if (r === 1) return s >= 0;
        if (r === 2 || r === 3) return s >= 1;
        return s >= r - 2;
      }
      function rowAlpha(r) {
        if (!shown(r)) return .2;
        if (s === 0 && r === 1) return d.seg(t, .1, .5);
        if (s === 1 && r === 2) return d.seg(t, .02, .26);
        if (s === 1 && r === 3) return d.seg(t, .22, .52);
        return 1;
      }
      // the halves of row 1 slide apart out of row 0 as the list is cut
      const splitGap = r => (s === 0 && r === 1 ? d.lerp(GAP, GG, d.seg(t, .12, .55)) : undefined);
      const done = s === 5 ? Math.floor(d.seg(t, 0, .8) * 8.999) : -1;

      for (let r = 0; r < 7; r++) {
        const vis = shown(r), al = rowAlpha(r), f = flat(ROWS[r], splitGap(r));
        d.text(302, RY[r] + CH / 2, LAB[r], { size: 12.5, weight: 700, align: "right",
                                              baseline: "middle", fill: vis ? c.soft : c.dim,
                                              alpha: vis ? Math.max(al, .25) : .4, max: 200 });
        // how many cells of this row exist yet
        let limit = vis ? f.cells.length : 0;
        if (tgt === r) limit = cur + (u > .62 ? 1 : 0);
        const srcRow = tgt === r ? flat(ROWS[r - 1]) : null;
        f.cells.forEach((cl, i) => {
          const blank = i >= limit;
          const justIn = tgt === r && i === limit - 1;
          const green = justIn || (r === 6 && s === 5 && i <= done);
          d.box(cl.x, RY[r], CW, CH, {
            fill: blank ? "#131d31" : (green ? "#1d4a35" : c.panel),
            stroke: blank ? "#2a3b56" : (green ? c.ok : c.line),
            on: justIn, r: 7, alpha: blank ? (vis ? .55 : .4) : al,
            label: blank ? "" : String(cl.v), size: 15 });
        });
        // front-of-list carets on the row being read from
        if (srcRow && cur >= 0 && cur < 8) {
          const e = tk[cur];
          [[e.lk, c.info], [e.rk, c.pink]].forEach(m => {
            if (m[0] < 0) return;
            const sx = srcRow.cells[m[0]].x + CW / 2, sy = RY[r - 1] + CH + 3;
            d.path([[sx - 7, sy + 11], [sx + 7, sy + 11], [sx, sy + 1]], { fill: m[1], stroke: null, width: 0 });
          });
          // the value in flight
          const e2 = tk[cur], sxx = srcRow.cells[e2.src].x + CW / 2;
          const g = d.ease(d.clamp(u / .62, 0, 1));
          const fx = d.lerp(sxx, f.cells[cur].x + CW / 2, g);
          const fy = d.lerp(RY[r - 1] + CH / 2, RY[r] + CH / 2, g) - 20 * Math.sin(Math.PI * g);
          if (u < .68) d.chip(fx, fy, String(f.cells[cur].v), { fill: c.edge, glow: true, size: 13, h: 22, w: 28 });
        }
        // dim the source cells already used up
        if (srcRow && cur >= 0) {
          srcRow.cells.forEach((cl, i) => {
            const used = tk.slice(0, cur + (u > .2 ? 1 : 0)).some(x => x.src === i);
            if (used) d.box(cl.x, RY[r - 1], CW, CH, { fill: "#131d31", stroke: "#2a3b56", r: 7,
                                                       label: String(cl.v), size: 15, labelFill: c.dim });
          });
        }
      }

      // the cut lines that make the split visible
      if (s === 0) {
        const f = flat(ROWS[0]), xm = (f.cells[3].x + CW + f.cells[4].x) / 2;
        const h = d.seg(t, 0, .3) * (CH + 12);
        d.line(xm, RY[0] - 6, xm, RY[0] - 6 + h, { stroke: c.edge, width: 3, dash: [5, 4] });
      }
      if (s === 1) {
        const f = flat(ROWS[1]);
        [[1, 2], [5, 6]].forEach(p => {
          const xm = (f.cells[p[0]].x + CW + f.cells[p[1]].x) / 2;
          d.line(xm, RY[1] - 6, xm, RY[1] + CH + 6, { stroke: c.edge, width: 3, dash: [5, 4],
                                                      alpha: d.seg(t, 0, .22) });
        });
        const g = flat(ROWS[2]);
        [[0, 1], [2, 3], [4, 5], [6, 7]].forEach(p => {
          const xm = (g.cells[p[0]].x + CW + g.cells[p[1]].x) / 2;
          d.line(xm, RY[2] - 4, xm, RY[2] + CH + 6, { stroke: c.edge, width: 3, dash: [5, 4],
                                                      alpha: d.seg(t, .3, .5) });
        });
      }

      // status line
      let st = "", col = c.soft;
      if (s === 0) st = "one list of eight, cut into two lists of four";
      else if (s === 1) st = "eight lists of one - and a list of one is always sorted";
      else if (tk && cur >= 0 && cur < 8) { st = tk[cur].txt; col = c.edge; }
      else if (s === 5) st = "three splits, three merges, and only seven comparisons in the final merge";
      d.text(MID, 442, st, { size: 13.5, weight: 700, align: "center", baseline: "middle",
                             fill: col, max: 560 });
      if (tk) {
        d.chip(820, 442, "taken: " + Math.max(0, Math.min(8, cur + (u > .62 ? 1 : 0))) + " of 8",
               { fill: c.panel, stroke: c.edge, labelFill: c.edge, size: 12, h: 24 });
      }

      const notes = [
        ["No comparing yet", "Splitting is mechanical: find the middle and cut. The values are only compared once merging starts.", [MID, RY[1] + CH / 2]],
        ["Always the same depth", "Eight values take three splits, sixteen take four. That slow growth is why merge sort copes with long lists.", [MID, RY[3] + CH / 2]],
        ["A sorted pair", "Merging two lists of one is just picking the smaller. The output is sorted, which is what the next merge relies on.", [lay(ROWS[4])[0].x + 36, RY[4] + CH]],
        ["Only the front matters", "Both lists are already sorted, so the smallest value left must be at the front of one of them. The blue and pink markers show where you are looking.", [lay(ROWS[5])[0].x + 70, RY[5] + CH + 6]],
        ["Each value once", "The merge never goes back. Every comparison moves one value into the output, so eight values need at most seven comparisons.", [MID, RY[6] + CH + 6]],
        ["Divide and conquer", "A big problem is broken into smaller copies of itself until they are trivial, then the answers are combined.", [MID + 155, RY[6] + CH / 2]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 110, alpha: d.seg(t, 0, .25) });
    } };
  });

  // --------------------------------------------------------------------- al-l04
  A("flowchart", function () {
    const W = 980, H = 580;
    const MX = 455;                                        // main column centre
    const N = {
      start: { x: 380, y: 70, w: 150, h: 36 },
      set:   { x: 340, y: 134, w: 230, h: 44 },
      inp:   { x: 340, y: 212, w: 230, h: 44 },
      dec:   { cx: MX, cy: 323, w: 250, h: 66 },
      add:   { x: 340, y: 390, w: 230, h: 44 },
      out:   { x: 700, y: 301, w: 220, h: 44 },
      stop:  { x: 760, y: 392, w: 100, h: 36 }
    };
    const LOOP = [[MX, 434], [MX, 456], [302, 456], [302, 234], [336, 234]];
    /* The token rides a clear lane at x = 556: inside the boxes, but to the right
     * of every centred label, so a moving value never sits on top of text. */
    const TX = 556;
    const ENTER = [[516, 88], [TX, 120], [TX, 156], [TX, 198], [TX, 234]];
    const LAP = [[TX, 234], [TX, 323], [TX, 412], [TX, 440], [480, 456], [302, 456],
                 [302, 214], [360, 198], [480, 198], [TX, 214], [TX, 234]];
    const EXIT = [[TX, 323], [620, 323], [726, 323], [762, 344], [810, 384]];
    const RUN = [{ n: "-", v: 0 }, { n: "4", v: 4 }, { n: "7", v: 11 }, { n: "2", v: 13 }, { n: "-1", v: 13 }];

    const LEG = [
      ["term", "Terminal", "Terminal - the single place a program starts, and where it stops."],
      ["proc", "Process", "Process - do something, such as working out or storing a value."],
      ["io", "In / Out", "Input / output - read a value in, or print a value out."],
      ["dec", "Decision", "Decision - a yes/no question with exactly two labelled ways out."]
    ];

    const steps = [
      { name: "1. The shapes", caption: "The shape of a symbol tells you what the step does, before you read a word of it. Watch each kind light up in the flowchart." },
      { name: "2. Two ways out", caption: "A decision is the only symbol with two exits, and both must be labelled. No goes round the loop; Yes leaves it." },
      { name: "3. First number", caption: "total is set to 0, then 4 is read in. 4 is not the sentinel, so it is added on and the flow goes back for another number." },
      { name: "4. Round again", caption: "7 makes the total 11, then 2 makes it 13. The same three symbols run again each time - that is what a loop is." },
      { name: "5. The sentinel", caption: "-1 is the agreed stop value. The decision is now Yes, so the flow leaves the loop, prints the total and stops." },
      { name: "6. The whole run", caption: "Four numbers were read but only three were added. The sentinel ends the loop, it is never part of the total." }
    ];

    function term(d, n, o) { d.box(n.x, n.y, n.w, n.h, Object.assign({ r: n.h / 2 }, o)); }
    function proc(d, n, o) { d.box(n.x, n.y, n.w, n.h, Object.assign({ r: 5 }, o)); }
    function io(d, n, o) {
      const s = 16;
      shape(d, [[n.x + s, n.y], [n.x + n.w, n.y], [n.x + n.w - s, n.y + n.h], [n.x, n.y + n.h]],
            n.x + n.w / 2, n.y + n.h / 2, n.w - s * 2 - 10, o);
    }
    function dec(d, n, o) {
      shape(d, [[n.cx, n.cy - n.h / 2], [n.cx + n.w / 2, n.cy], [n.cx, n.cy + n.h / 2], [n.cx - n.w / 2, n.cy]],
            n.cx, n.cy, n.w * .52, o);
    }

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Flowcharts: the symbols, and one running");

      // which numbers have been read by now -------------------------------
      let rows = 0;
      if (s === 2) rows = (t > .15 ? 1 : 0) + (t > .55 ? 1 : 0);
      else if (s === 3) rows = 2 + (t > .25 ? 1 : 0) + (t > .75 ? 1 : 0);
      else if (s === 4) rows = 4 + (t > .6 ? 1 : 0);
      else if (s === 5) rows = 5;
      const total = rows <= 1 ? 0 : RUN[rows - 1].v;
      const reading = s === 2 ? "4" : s === 3 ? (t < .5 ? "7" : "2") : s === 4 ? "-1" : null;

      // legend --------------------------------------------------------------
      const cyc = s === 0 ? Math.min(3, Math.floor(d.clamp(t, 0, .999) * 4)) : -1;
      d.text(24, 56, "What each shape means", { size: 13, weight: 800, fill: c.soft, baseline: "middle", max: 246 });
      LEG.forEach((L, i) => {
        const y = 76 + i * 96, lit = cyc === i;
        const o = { label: L[1], size: 12, fill: lit ? "#2a3f68" : c.panel,
                    stroke: lit ? c.edge : c.line, on: lit };
        const wide = L[0] === "dec" ? 124 : 96;   // a diamond gives its label only its middle
        const n = { x: 34, y, w: wide, h: 40, cx: 34 + wide / 2, cy: y + 20 };
        if (L[0] === "term") term(d, n, o);
        else if (L[0] === "proc") proc(d, n, o);
        else if (L[0] === "io") io(d, n, o);
        else dec(d, n, o);
        d.wrap(142, y - 2, L[2], 124, { size: 11.5, fill: lit ? c.fg : c.soft });
      });

      // flowchart ------------------------------------------------------------
      const base = s === 0 ? .4 : 1;
      const grp = k => (s === 0 && cyc === k ? { on: true, alpha: 1, stroke: c.edge, fill: "#2a3f68" }
                                            : { alpha: base });
      const act = (k, cond) => {
        const g = grp(k);
        if (s > 0 && cond) { g.on = true; g.stroke = c.edge; g.fill = "#2a3f68"; }
        return g;
      };

      const inLoop = s >= 2 && s <= 3;
      term(d, N.start, Object.assign({ label: "Start", size: 14 }, act(0, s === 2 && t < .2)));
      proc(d, N.set, Object.assign({ label: "total = 0", size: 15 },
                                   act(1, s === 2 && t > .1 && t < .4)));
      io(d, N.inp, Object.assign({ label: "INPUT number", size: 15 },
                                 act(2, (inLoop || s === 4) && !!reading)));
      dec(d, N.dec, Object.assign({ label: "number = -1?", size: 14 },
                                  act(3, s === 1 || s === 4)));
      const outRun = s >= 4 && (s === 5 || t > .55);
      proc(d, N.add, Object.assign({ label: "total = total + number",
                                    sub: s < 4 && rows > 1 && rows < 5 ? (RUN[rows - 2] ? RUN[rows - 2].v : 0) + " + " + RUN[rows - 1].n + " = " + RUN[rows - 1].v : "",
                                    size: 12 }, act(1, inLoop)));
      io(d, N.out, Object.assign({ label: "OUTPUT total", sub: outRun ? "prints 13" : "", size: 15 },
                                 act(2, outRun)));
      term(d, N.stop, Object.assign({ label: "Stop", size: 14 },
                                    act(0, s >= 4 && (s === 5 || t > .8))));

      // arrows
      const lineCol = s === 0 ? "#2a3b56" : c.line;
      const ar = (x1, y1, x2, y2, lit, lab, ly) =>
        d.arrow(x1, y1, x2, y2, { stroke: lit ? c.edge : lineCol, width: lit ? 3 : 2,
                                  glow: lit, label: lab, labelFill: lit ? c.edge : c.dim, ly });
      ar(MX, 106, MX, 134, false);
      ar(MX, 178, MX, 212, false);
      ar(MX, 256, MX, 290, false);
      const noLit = s === 1 ? t < .5 : inLoop;
      const yesLit = s === 1 ? t >= .5 : s >= 4;
      d.arrow(MX, 356, MX, 390, { stroke: noLit ? c.orange : lineCol, width: noLit ? 3 : 2, glow: noLit });
      d.text(MX + 14, 373, "No", { size: 13, weight: 800, baseline: "middle",
                                   fill: noLit ? c.orange : c.soft });
      d.arrow(580, 323, 704, 323, { stroke: yesLit ? c.ok : lineCol, width: yesLit ? 3 : 2, glow: yesLit });
      d.text(642, 309, "Yes", { size: 13, weight: 800, align: "center", baseline: "middle",
                                fill: yesLit ? c.ok : c.soft });
      d.arrow(810, 345, 810, 392, { stroke: yesLit ? c.ok : lineCol, width: yesLit ? 3 : 2, glow: yesLit });
      d.path(LOOP.slice(0, 4), { stroke: noLit ? c.orange : lineCol, width: noLit ? 3 : 2, glow: noLit });
      d.arrow(302, 234, 336, 234, { stroke: noLit ? c.orange : lineCol, width: noLit ? 3 : 2, glow: noLit });
      d.text(372, 446, "loop back", { size: 11, weight: 700, align: "center",
                                                    baseline: "middle", fill: noLit ? c.orange : c.dim, max: 132 });

      // the number just read
      if (reading && s >= 2)
        d.chip(372, 273, "number = " + reading, { fill: c.info, glow: true, size: 12, h: 24,
                                                  alpha: s === 3 ? 1 : d.seg(t, .08, .3) });

      // the token on its route ----------------------------------------------
      function tok(pts, f, label, w) {
        const p = d.onPath(pts, f);
        d.chip(p[0], p[1], label, { fill: c.edge, glow: true, size: 12, h: 23, w: w || 30 });
      }
      if (s >= 2)
        d.text(TX, 58, "the total", { size: 10.5, weight: 700, align: "center",
                                      baseline: "middle", fill: c.dim, max: 70 });
      if (s === 1) {
        const no = [[TX, 323], [TX, 412], [TX, 440], [480, 456], [302, 456], [302, 300]];
        if (t < .5) tok(no, d.seg(t, .05, .48), "No", 38);
        else tok(EXIT, d.seg(t, .52, .95), "Yes", 40);
      } else if (s === 2) {
        if (t < .4) tok(ENTER, d.clamp(t / .4, 0, 1), "0");
        else tok(LAP, d.clamp((t - .4) / .6, 0, 1), String(total));
      } else if (s === 3) {
        const f = t < .5 ? t / .5 : (t - .5) / .5;
        tok(LAP, d.clamp(f, 0, 1), String(total));
      } else if (s === 4) {
        if (t > .3) tok(EXIT, d.clamp((t - .3) / .65, 0, 1), "13");
      } else if (s === 5) {
        const legs = [ENTER, LAP, LAP, LAP, EXIT], seg = Math.min(4, Math.floor(d.clamp(t, 0, .999) * 5));
        tok(legs[seg], d.clamp(d.clamp(t, 0, .999) * 5 - seg, 0, 1), String(RUN[Math.min(4, seg)].v));
      }

      // trace table ----------------------------------------------------------
      d.box(660, 68, 290, 150, { fill: "#16233c", stroke: c.line, r: 12 });
      d.text(676, 88, "number read", { size: 12, weight: 800, fill: c.dim, baseline: "middle", max: 110 });
      d.text(930, 88, "total", { size: 12, weight: 800, fill: c.dim, baseline: "middle", align: "right", max: 70 });
      RUN.forEach((r, i) => {
        const vis = i < rows;
        const y = 112 + i * 23;
        d.text(676, y, vis ? (i === 0 ? "(before the loop)" : r.n) : "-",
               { size: 12.5, weight: 700, baseline: "middle", fill: vis ? c.fg : c.dim,
                 alpha: vis ? 1 : .5, max: 160 });
        d.text(930, y, vis ? (i === 4 ? "13 printed" : String(r.v)) : "-",
               { size: 12.5, weight: 700, align: "right", baseline: "middle",
                 fill: vis ? (i === 4 ? c.ok : c.edge) : c.dim, alpha: vis ? 1 : .5, max: 110 });
      });

      const notes = [
        ["Shape before words", "An examiner can tell a process from an input just by its outline, so using the wrong shape loses the mark.", [362, 234]],
        ["Exactly two", "Never one exit, never three. If you need a third option, use a second decision underneath.", [N.dec.cx + 60, N.dec.cy + 16]],
        ["Set up before the loop", "total = 0 sits outside the loop. Inside it, the total would be wiped every time round.", [368, 156]],
        ["Same path, new value", "Nothing in the flowchart changes - only the value in the box does. One drawing covers any number of numbers.", [302, 350]],
        ["A sentinel", "An agreed value that means stop. It has to be one that could never be real data, which is why -1 works for counting.", [372, 290]],
        ["Trace tables", "Writing out the variables after every step is how you check a flowchart without running it.", [800, 214]]
      ];
      const n = notes[s];
      d.wrap(24, 496, steps[s].caption, 520, { size: 14, fill: c.soft });
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre",
                                      maxLead: 120, alpha: d.seg(t, 0, .25) });
    } };
  });
})();
