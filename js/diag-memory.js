/* Revise 360 - Memory and storage / Data representation diagrams.
 *
 * ms-l02 virtual memory, ms-l08 binary addition, ms-l10 binary shifts,
 * ms-l13 images as binary, ms-l14 sound sampling, ms-l15 compression.
 *
 * Engine and drawing helper: js/diagrams.js. House style: `fde` in
 * js/diagrams-set.js. Each diagram draws the whole frame every call.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  /* Caption strip plus the one annotation, drawn the same way in every
   * diagram so the whole batch lines up with the rest of the set. */
  function foot(d, steps, s, t, n) {
    d.caption(steps[s].caption);
    if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, maxLead: 210,
                                    anchor: "centre", alpha: d.seg(t, 0, .25) });
  }

  // ===================================================================== ms-l02
  /* Virtual memory. The hard part in text is that two journeys happen - out to
   * the drive and back again - and that the drive is the slow part. */
  A("virtualmemory", function () {
    const W = 980, H = 580;
    const NEWB = { x: 40, y: 56, w: 330, h: 56 };
    const RAM = { x: 40, y: 140, w: 330, h: 258 };
    const SEC = { x: 560, y: 140, w: 390, h: 258 };
    const SWAP = { x: 578, y: 182, w: 354, h: 104 };
    const REST = { x: 578, y: 302, w: 354, h: 82 };
    const slot = i => ({ x: RAM.x + 18, y: 182 + i * 52, w: RAM.w - 36, h: 46 });
    const sy = i => 182 + i * 52 + 23;
    const OUT_Y = 240, IN_Y = 330, GL = 376, GR = 554;

    const steps = [
      { name: "1. RAM is full", caption: "Every section of RAM is already holding something. There is no free space left for anything new." },
      { name: "2. No room", caption: "A new program wants to start, but it cannot be given a section of RAM, because none is free." },
      { name: "3. Pick a victim", caption: "The operating system looks for a section that is not being used at this moment. The music player has been sitting idle." },
      { name: "4. Move it out", caption: "That section is written out to a reserved area of secondary storage called the swap file. The RAM it was using is now free." },
      { name: "5. New program loads", caption: "The video editor is loaded into the section that has just been freed, and starts running." },
      { name: "6. Swap it back", caption: "The user clicks the music player again. It has to be read back into RAM, so something else has to be moved out to make room for it." },
      { name: "7. Why it drags", caption: "Every swap is a round trip to a device thousands of times slower than RAM. Virtual memory stops the machine refusing to run things; it does not make it fast." }
    ];

    const base = ["Operating system", "Web browser", "Music player", "Spreadsheet"];
    const idle = ["in use", "in use", "idle - not used lately", "in use"];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Virtual memory - borrowing secondary storage when RAM runs out");

      // --- the program waiting to start ---------------------------------
      const wantOn = s >= 1 && s <= 4;
      d.box(NEWB.x, NEWB.y, NEWB.w, NEWB.h, {
        fill: wantOn ? c.panel2 : c.panel, stroke: wantOn ? c.orange : c.line,
        on: wantOn, r: 12, label: "Video editor wants to start",
        sub: "it needs one section of RAM", size: 15, max: NEWB.w - 24
      });

      // --- RAM -----------------------------------------------------------
      d.box(RAM.x, RAM.y, RAM.w, RAM.h, { fill: c.panel, stroke: c.line, r: 16 });
      d.text(RAM.x + 18, RAM.y + 22, "RAM (main memory)",
             { size: 14, weight: 800, fill: c.soft, baseline: "middle" });
      const freeSlot = s === 3 || s === 4 ? 2 : (s === 5 ? 3 : -1);
      d.chip(RAM.x + RAM.w - 50, RAM.y + 22, freeSlot >= 0 ? "3 of 4" : "4 of 4 - FULL",
             { fill: freeSlot >= 0 ? c.ok : c.bad, size: 11,
               glow: s === 0 && d.seg(t, .25, .55) > .5 });

      const labels = base.slice(), subs = idle.slice();
      if (s === 3) { labels[2] = "(free)"; }
      if (s >= 4) { labels[2] = "Video editor"; subs[2] = "in use"; }
      if (s >= 5) { subs[3] = "idle - not used lately"; }
      if (s === 5) { labels[3] = "(free)"; }
      if (s === 6) { labels[3] = "Music player"; subs[3] = "in use"; subs[2] = "idle - not used lately"; }

      // step 1 lights the four slots in turn, so the "all taken" point moves
      const seqLit = i => s === 0 && d.seg(t, .05 + i * .07, .18 + i * .07) > .5
                              && d.seg(t, .5, .62) < .5;
      // step 3 scans down the slots and settles on the idle one
      const scan = s === 2 ? Math.min(2, Math.floor(d.seg(t, .05, .4) * 3.2)) : -1;

      for (let i = 0; i < 4; i++) {
        const r = slot(i), free = labels[i] === "(free)";
        const lit = seqLit(i) || scan === i || (s === 2 && scan >= 2 && i === 2)
                    || (s === 4 && i === 2) || (s === 6 && i === 3);
        d.box(r.x, r.y, r.w, r.h, {
          fill: free ? c.bg : (lit ? c.panel2 : c.panel),
          stroke: free ? c.ok : (lit ? c.edge : c.line), on: lit, r: 10,
          label: labels[i], sub: free ? "ready for something new" : subs[i],
          size: 15, max: r.w - 20,
          subFill: free ? c.ok : (subs[i] === idle[2] ? c.edge : c.dim)
        });
      }

      // --- secondary storage ---------------------------------------------
      d.box(SEC.x, SEC.y, SEC.w, SEC.h, { fill: c.panel, stroke: c.line, r: 16 });
      d.text(SEC.x + 18, SEC.y + 22, "Secondary storage (SSD or hard disk)",
             { size: 14, weight: 800, fill: c.soft, baseline: "middle", max: SEC.w - 36 });
      const swapOn = s >= 3;
      d.box(SWAP.x, SWAP.y, SWAP.w, SWAP.h, {
        fill: swapOn ? c.panel2 : c.panel, stroke: swapOn ? c.violet : c.line,
        on: swapOn, r: 12
      });
      d.text(SWAP.x + 16, SWAP.y + 20, "Virtual memory (the swap file)",
             { size: 13, weight: 800, fill: swapOn ? c.violet : c.dim,
               baseline: "middle", max: SWAP.w - 32 });
      const parked = s < 3 ? "empty so far" : (s === 5 ? "swapping..." : (s >= 6 ? "Spreadsheet" : "Music player"));
      d.box(SWAP.x + 16, SWAP.y + 38, SWAP.w - 32, 48, {
        fill: s < 3 ? c.bg : c.panel, stroke: s < 3 ? c.line : c.violet, r: 10,
        label: parked, sub: s < 3 ? "" : "parked on the drive, not in RAM",
        size: 14, max: SWAP.w - 52, subFill: c.dim
      });
      d.box(REST.x, REST.y, REST.w, REST.h, {
        fill: c.panel, stroke: c.line, r: 12, label: "Your files and installed programs",
        sub: "this is a storage device, not memory", size: 13.5, max: REST.w - 24
      });

      // --- the two journeys ------------------------------------------------
      const outOn = s === 3 || s === 5, inOn = s === 5;
      d.arrow(GL, OUT_Y, GR, OUT_Y, {
        stroke: outOn ? c.bad : c.line, width: outOn ? 4 : 2, glow: outOn,
        label: "moved out", labelFill: outOn ? c.bad : c.dim, ly: -26, labelSize: 12
      });
      d.arrow(GR, IN_Y, GL, IN_Y, {
        stroke: inOn ? c.ok : c.line, width: inOn ? 4 : 2, glow: inOn,
        label: "read back in", labelFill: inOn ? c.ok : c.dim, ly: 30, labelSize: 12
      });

      const p = d.seg(t, .15, .85);
      if (s === 1) {
        // the new program tries to move in and is turned away at the door
        const bob = Math.abs(Math.sin(t * Math.PI * 3)) * 14;
        d.line(RAM.x + 6, RAM.y, RAM.x + RAM.w - 6, RAM.y,
               { stroke: c.bad, width: 4, dash: [7, 5] });
        d.chip(205, NEWB.y + NEWB.h + 14 + bob, "Video editor", { fill: c.orange, glow: true });
      }
      if (s === 3) d.chip(d.lerp(GL + 10, GR - 10, p), OUT_Y, "Music player", { fill: c.bad, glow: true });
      if (s === 4) d.chip(205, d.lerp(NEWB.y + NEWB.h + 14, sy(2), p), "Video editor",
                          { fill: c.orange, glow: true });
      if (s === 5) {
        d.chip(d.lerp(GL + 10, GR - 10, p), OUT_Y, "Spreadsheet", { fill: c.bad, glow: true });
        d.chip(d.lerp(GR - 10, GL + 10, p), IN_Y, "Music player", { fill: c.ok, glow: true });
      }

      // --- the speed point ---------------------------------------------------
      d.text(40, 416, "Time to reach one piece of data:",
             { size: 13, weight: 800, fill: s === 6 ? c.fg : c.dim, baseline: "middle" });
      const rows = [
        ["RAM", "about 80 nanoseconds", c.ok, 40],
        ["SSD", "about 80 microseconds - 1,000 times longer", c.orange, 340],
        ["Hard disk", "about 10 milliseconds", c.bad, 660]
      ];
      rows.forEach((r, i) => {
        const al = s === 6 ? d.lerp(.25, 1, d.seg(t, .05 + i * .1, .25 + i * .1)) : .3;
        d.text(r[3], 440, r[0], { size: 14, weight: 800, fill: r[2], baseline: "middle",
                                  alpha: al, max: 270 });
        d.text(r[3], 460, r[1], { size: 12, weight: 600, fill: c.soft, baseline: "middle",
                                  alpha: al, max: 280 });
      });

      const notes = [
        ["Full is normal", "RAM is meant to be busy. Trouble only starts when something new asks for space and there is none.",
         [slot(1).x + slot(1).w - 20, sy(1)]],
        ["Not an error", "Without virtual memory the program would simply refuse to start. This is the fallback that lets it run.",
         [205, NEWB.y + NEWB.h]],
        ["Least recently used", "The operating system tracks which sections have been touched most recently, and picks one it can spare.",
         [slot(2).x + slot(2).w - 20, sy(2)]],
        ["It is a file", "The swap file sits on the drive like any other file. Reading and writing it is as slow as any other drive access.",
         [SWAP.x + SWAP.w - 30, SWAP.y + 60]],
        ["Same RAM, new tenant", "Nothing was added. The video editor is simply using the space the music player had to give up.",
         [slot(2).x + 30, sy(2)]],
        ["Two trips, not one", "Bringing one section back means writing another one out first, so a single click can cost two drive accesses.",
         [(GL + GR) / 2, IN_Y]],
        ["Fitting more RAM is the fix", "Virtual memory buys time. If swapping happens constantly the machine crawls, and only real RAM solves that.",
         [330, 424]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // ===================================================================== ms-l08
  /* Binary addition, then the same method overflowing. The arithmetic below is
   * fixed in the arrays and checked in the comments: 61 + 22 = 83 fits in eight
   * bits, 181 + 92 = 273 does not. */
  A("binaryadd", function () {
    const W = 980, H = 580;
    const BX = 318, CW = 46, CH = 42, GAP = 5;
    const cx = i => BX + i * (CW + GAP) + CW / 2;
    const RIGHT = BX + 8 * (CW + GAP) - GAP;        // 318 + 403 = 721
    const PV = ["128", "64", "32", "16", "8", "4", "2", "1"];
    const YA = 126, YB = 182, YR = 254, YC = 100, YPV = 78;
    const LBL = BX - (CW + GAP) - 16;               // clear of the overflow column

    // 00111101 = 32+16+8+4+1 = 61 ; 00010110 = 16+4+2 = 22
    // 01010011 = 64+16+2+1   = 83 ; carries into columns 1,2,3,4
    const S1 = {
      a: [0, 0, 1, 1, 1, 1, 0, 1], b: [0, 0, 0, 1, 0, 1, 1, 0],
      r: [0, 1, 0, 1, 0, 0, 1, 1], c: [0, 1, 1, 1, 1, 0, 0, 0],
      out: 0, da: 61, db: 22, dr: 83
    };
    // 10110101 = 128+32+16+4+1 = 181 ; 01011100 = 64+16+8+4 = 92
    // 181 + 92 = 273. Eight bits hold 00010001 = 17, with 1 carried out.
    const S2 = {
      a: [1, 0, 1, 1, 0, 1, 0, 1], b: [0, 1, 0, 1, 1, 1, 0, 0],
      r: [0, 0, 0, 1, 0, 0, 0, 1], c: [1, 1, 1, 1, 1, 0, 0, 0],
      out: 1, da: 181, db: 92, dr: 273
    };

    const steps = [
      { name: "1. Line them up", caption: "Write the two numbers one above the other, lined up by place value, and work from the right-hand column just like denary addition." },
      { name: "2. Start at the right", caption: "1 + 0 is 1, and 0 + 1 is 1. Nothing to carry yet, so these two columns are easy." },
      { name: "3. Carry a one", caption: "1 + 1 is 2, which is 10 in binary. Write 0 in this column and carry the 1 into the next column to the left." },
      { name: "4. The carry rolls on", caption: "Each column adds the two bits plus any carry. Three ones make 11: write 1, carry 1. The answer is 01010011." },
      { name: "5. A bigger sum", caption: "Now try 181 + 92. Both numbers still fit in eight bits, and the method is exactly the same." },
      { name: "6. Overflow", caption: "The left-hand column produces a carry with nowhere to go. That carry out is an overflow error: the true answer 273 needs nine bits." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Binary addition - carrying, and running out of bits");

      const two = s >= 4;
      const S = two ? S2 : S1;
      // how many columns are finished, counted from the right
      const targ = [0, 2, 3, 8, 0, 8][s], prev = [0, 0, 2, 3, 0, 0][s];
      const done = Math.round(d.lerp(prev, targ, d.seg(t, .05, .38)));
      const act = done > 0 && done < 8 ? 8 - done : -1;   // column being worked on
      const resolved = i => i >= 8 - done;

      // place values
      d.text(LBL, YPV, "place value", { size: 11.5, weight: 700, fill: c.dim,
                                        align: "right", baseline: "middle" });
      PV.forEach((p, i) => d.text(cx(i), YPV, p, {
        size: 12.5, weight: 700, fill: resolved(i) ? c.soft : c.dim,
        align: "center", baseline: "middle" }));

      // carry row
      d.text(LBL, YC, "carry", { size: 12.5, weight: 700, fill: c.edge,
                                 align: "right", baseline: "middle" });
      for (let i = 0; i < 8; i++) {
        if (S.c[i] && resolved(i))
          d.chip(cx(i), YC, "1", { fill: c.edge, h: 22, w: 24, size: 12,
                                   glow: i === act + 0 });
      }
      if (S.out && done === 8)
        d.chip(cx(-1), YC, "1", { fill: c.bad, h: 22, w: 24, size: 12, glow: true });

      // the two numbers
      const lab = (y, s2) => d.text(LBL, y + CH / 2, s2,
        { size: 12.5, weight: 700, fill: c.soft, align: "right", baseline: "middle", max: 190 });
      lab(YA, "first number");
      lab(YB, "second number");
      lab(YR, "answer");
      d.text(LBL - 128, YB + CH / 2, "+", { size: 24, weight: 800, fill: c.soft,
                                            align: "center", baseline: "middle" });

      const rowOn = i => (act === i ? [i] : []);
      d.cells(BX, YA, S.a.map(String), { cw: CW, ch: CH, gap: GAP, on: rowOn(act), accent: c.teal });
      d.cells(BX, YB, S.b.map(String), { cw: CW, ch: CH, gap: GAP, on: rowOn(act), accent: c.teal });

      d.line(BX - 6, YR - 12, RIGHT + 6, YR - 12, { stroke: c.line, width: 2 });

      // answer row - a cell only gains its digit once that column is finished
      for (let i = 0; i < 8; i++) {
        const got = resolved(i);
        d.box(BX + i * (CW + GAP), YR, CW, CH, {
          fill: got ? c.panel2 : c.bg, stroke: got ? c.ok : c.line, on: got, r: 7,
          label: got ? String(S.r[i]) : "", size: 16
        });
      }
      if (S.out) {
        const got = done === 8;
        d.box(BX - (CW + GAP), YR, CW, CH, {
          fill: got ? c.panel2 : c.bg, stroke: got ? c.bad : c.line, on: got, r: 7,
          label: got ? "1" : "", size: 16, labelFill: c.fg
        });
        d.text(BX - (CW + GAP) + CW / 2, YR + CH + 16, "9th bit", {
          size: 11, weight: 700, fill: got ? c.bad : c.dim, align: "center",
          baseline: "middle" });
      }

      // the column being worked on
      if (act >= 0) {
        const x0 = BX + act * (CW + GAP) - 4;
        d.box(x0, YA - 10, CW + 8, YR + CH + 10 - (YA - 10), {
          fill: c.bg, stroke: c.edge, alpha: .22, r: 10 });
      }

      // denary check
      const P = { x: 752, y: 96, w: 198, h: 220 };
      d.box(P.x, P.y, P.w, P.h, { fill: c.panel, stroke: c.line, r: 12 });
      d.text(P.x + P.w / 2, P.y + 24, "Denary check", { size: 13, weight: 800,
        fill: c.soft, align: "center", baseline: "middle" });
      const dv = [String(S.da), "+   " + S.db, "", String(S.dr)];
      dv.forEach((v, i) => {
        if (!v) { d.line(P.x + 48, P.y + 48 + i * 36 + 10, P.x + P.w - 24, P.y + 48 + i * 36 + 10,
                         { stroke: c.line, width: 2 }); return; }
        const fin = i === 3;
        d.text(P.x + P.w - 24, P.y + 54 + i * 36, v, {
          size: 22, weight: 800, align: "right", baseline: "middle",
          fill: fin ? (two ? c.bad : c.ok) : c.fg,
          alpha: fin ? (done === 8 ? 1 : .2) : 1 });
      });
      d.wrap(P.x + 16, P.y + 188, two ? "273 is more than 255, so it cannot fit."
                                      : "Eight bits hold 0 to 255, so 83 fits.",
             P.w - 32, { size: 11.5, fill: two ? c.bad : c.ok });

      // the working, shown for whichever column is live
      const WK = { x: 318, y: 334, w: 632, h: 108 };
      const over = s === 5;
      d.box(WK.x, WK.y, WK.w, WK.h, { fill: c.panel, stroke: over ? c.bad : (act >= 0 ? c.edge : c.line),
        on: over || act >= 0, r: 12 });
      if (over) {
        d.text(WK.x + 18, WK.y + 26, "OVERFLOW ERROR", { size: 15, weight: 800, fill: c.bad,
          baseline: "middle" });
        d.wrap(WK.x + 18, WK.y + 42, "A carry has come out of the left-hand column. The true "
             + "answer 273 needs nine bits, but only eight are kept: 00010001, which is 17. "
             + "That carry out is the overflow error - the result will not fit in the number "
             + "of bits available.", WK.w - 36, { size: 13, fill: c.soft });
      } else if (act >= 0) {
        const a1 = S.a[act], b1 = S.b[act], cin = S.c[act];
        const tot = a1 + b1 + cin, cout = act > 0 ? S.c[act - 1] : S.out;
        d.text(WK.x + 18, WK.y + 26, "The " + PV[act] + "s column", { size: 14, weight: 800,
          fill: c.edge, baseline: "middle", max: WK.w - 36 });
        d.text(WK.x + 18, WK.y + 58, a1 + " + " + b1 + (cin ? " + carry 1" : "") + "  =  " + tot
          + (tot >= 2 ? ",  which is " + tot.toString(2) + " in binary" : ""),
          { size: 19, weight: 800, fill: c.fg, baseline: "middle", max: WK.w - 36 });
        d.text(WK.x + 18, WK.y + 88, "Write " + S.r[act] + " in this column"
          + (cout ? " and carry 1 into the " + (act > 0 ? PV[act - 1] + "s" : "next") + " column."
                  : ". There is nothing to carry."),
          { size: 13.5, weight: 700, fill: cout ? c.edge : c.soft, baseline: "middle",
            max: WK.w - 36 });
      } else if (done === 8) {
        d.text(WK.x + 18, WK.y + 26, "Check it", { size: 14, weight: 800, fill: c.ok,
          baseline: "middle" });
        d.text(WK.x + 18, WK.y + 58, "01010011  =  64 + 16 + 2 + 1  =  83", { size: 19,
          weight: 800, fill: c.ok, baseline: "middle", max: WK.w - 36 });
        d.text(WK.x + 18, WK.y + 88, "The same answer denary addition gives, so the method works.",
          { size: 13.5, weight: 700, fill: c.soft, baseline: "middle", max: WK.w - 36 });
      } else {
        d.text(WK.x + 18, WK.y + 26, "The four rules", { size: 14, weight: 800, fill: c.soft,
          baseline: "middle" });
        d.wrap(WK.x + 18, WK.y + 42, "0 + 0 = 0      1 + 0 = 1      1 + 1 = 10 (write 0, carry 1)"
             + "      1 + 1 + 1 = 11 (write 1, carry 1)", WK.w - 36, { size: 14, fill: c.fg, lh: 26 });
      }

      const notes = [
        ["Why line them up", "The right-hand column is the ones column in both numbers. Addition only works if matching place values sit above each other.",
         [cx(7), YPV - 18]],
        ["Same rules as denary", "You already carry when a column reaches ten. Binary carries when a column reaches two, which happens far more often.",
         [cx(6), YR + CH]],
        ["Ten in binary is two", "10 here is not ten. It is one two and no ones, so the 1 is worth 2 and belongs one column to the left.",
         [cx(5), YC]],
        ["Three ones", "A column can hold three 1s once a carry arrives: 1 + 1 + 1 = 3, which is 11 in binary. Write 1 and carry 1.",
         [cx(3), YC]],
        ["Still legal so far", "181 and 92 each fit in eight bits on their own. Overflow is about the answer, not the numbers you start with.",
         [cx(0), YA]],
        ["What a computer does", "It cannot grow a ninth bit, so it sets an overflow flag and keeps the wrong eight-bit answer. Use more bits to avoid it.",
         [cx(-1), YC]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // ===================================================================== ms-l10
  /* Binary shifts. Every pair below was worked out by hand:
   *   00010110 = 22  -> left 1  00101100 = 44   (x2)
   *                  -> left 2  01011000 = 88   (x4)
   *                  -> right 1 00001011 = 11   (/2)
   *   00001011 = 11  -> right 1 00000101 = 5    (11/2 = 5.5, the .5 is lost)
   *   10110100 = 180 -> left 1  01101000 = 104  (should be 360, a 1 is lost)
   */
  A("binaryshift", function () {
    const W = 980, H = 580;
    const BX = 234, CW = 50, CH = 46, GAP = 6;
    const RW = 8 * (CW + GAP) - GAP;                     // 442, so 234..676
    const cx = i => BX + i * (CW + GAP) + CW / 2;
    const YPV = 94, Y1 = 110, Y2 = 236;
    const PV = ["128", "64", "32", "16", "8", "4", "2", "1"];
    const val = b => b.reduce((a, v, i) => a + v * (1 << (7 - i)), 0);

    const steps = [
      { name: "1. The number", caption: "Each column is worth twice the one to its right. 00010110 is 16 + 4 + 2, which is 22 in denary." },
      { name: "2. Left shift 1", caption: "Every bit moves one place left and a 0 fills the gap on the right. Each bit is now worth twice as much, so 22 becomes 44." },
      { name: "3. Left shift 2", caption: "Shifting two places moves every bit into a column worth four times as much. A shift of n places multiplies by 2 to the power n." },
      { name: "4. Right shift 1", caption: "Shifting right moves every bit into a column worth half as much, so 22 becomes 11. A right shift of n places divides by 2 to the power n." },
      { name: "5. Lost precision", caption: "Shift 11 right and the 1 in the ones column falls off the end. 11 divided by 2 is 5.5, but there is nowhere to keep the half, so 5 is stored." },
      { name: "6. Lost value", caption: "Shift 180 left and the 1 in the 128s column falls off the left end. The answer should be 360, but 104 is stored instead." }
    ];

    // from, shift amount, direction (+1 = left), and the exact expected result
    const CASE = [
      null,
      { from: [0, 0, 0, 1, 0, 1, 1, 0], n: 1, left: true },
      { from: [0, 0, 0, 1, 0, 1, 1, 0], n: 2, left: true },
      { from: [0, 0, 0, 1, 0, 1, 1, 0], n: 1, left: false },
      { from: [0, 0, 0, 0, 1, 0, 1, 1], n: 1, left: false },
      { from: [1, 0, 1, 1, 0, 1, 0, 0], n: 1, left: true }
    ];
    // destination column for bit i, or null if it falls off the end
    function dest(i, k) { const j = k.left ? i - k.n : i + k.n; return (j < 0 || j > 7) ? null : j; }
    function after(k) {
      const out = [0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 8; i++) { const j = dest(i, k); if (j !== null) out[j] = k.from[i]; }
      return out;
    }

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Binary shifts - multiplying, dividing, and bits falling off");

      const k = CASE[s] || { from: [0, 0, 0, 1, 0, 1, 1, 0], n: 0, left: true };
      const res = s === 0 ? k.from : after(k);
      const v0 = val(k.from), v1 = val(res);
      const reveal = d.seg(t, .05, .38), fly = d.seg(t, .15, .85);

      // place values
      PV.forEach((p, i) => d.text(cx(i), YPV, p, { size: 12.5, weight: 700,
        fill: c.dim, align: "center", baseline: "middle" }));
      d.text(BX - 14, YPV, "place value", { size: 11.5, weight: 700, fill: c.dim,
        align: "right", baseline: "middle" });

      // top row: the number we start with
      d.text(BX - 14, Y1 + CH / 2, "before", { size: 13, weight: 700, fill: c.soft,
        align: "right", baseline: "middle" });
      const litBefore = s === 0 ? k.from.map((b, i) => b ? i : -1).filter(i => i >= 0)
                                     .filter((_, n) => n < Math.ceil(reveal * 3)) : [];
      d.cells(BX, Y1, k.from.map(String), { cw: CW, ch: CH, gap: GAP, on: litBefore, accent: c.edge });
      if (s === 0) litBefore.forEach(i => d.text(cx(i), Y1 + CH + 20, String(PV[i]),
        { size: 11.5, weight: 700, fill: c.edge, align: "center", baseline: "middle", max: CW - 4 }));

      // bottom row: the result
      if (s > 0) {
        d.text(BX - 14, Y2 + CH / 2, "after", { size: 13, weight: 700, fill: c.soft,
          align: "right", baseline: "middle" });
        for (let i = 0; i < 8; i++) {
          const filled = s > 0 && reveal > .35;
          d.box(BX + i * (CW + GAP), Y2, CW, CH, {
            fill: filled ? c.panel2 : c.bg, stroke: filled ? c.ok : c.line,
            on: filled, r: 7, label: filled ? String(res[i]) : "", size: 16
          });
        }
        // the zeros that come in from the empty end
        const fillCols = [];
        for (let i = 0; i < k.n; i++) fillCols.push(k.left ? 7 - i : i);
        fillCols.forEach(i => d.text(cx(i), Y2 + CH + 16, "new 0",
          { size: 11, weight: 700, fill: c.info, align: "center", baseline: "middle" }));

        // each bit travels from its old column to its new one
        for (let i = 0; i < 8; i++) {
          if (!k.from[i]) continue;
          const j = dest(i, k);
          const x0 = cx(i), y0 = Y1 + CH / 2;
          if (j === null) {
            // off the end, and lost
            const ex = k.left ? BX - 54 : BX + RW + 24;
            d.chip(d.lerp(x0, ex, fly), d.lerp(y0, Y2 + CH / 2, fly), "1",
                   { fill: c.bad, glow: true, w: 30, alpha: 1 - fly * .35 });
            d.text(ex, Y2 + CH + 22, "lost", { size: 12.5, weight: 800, fill: c.bad,
              align: "center", baseline: "middle" });
          } else {
            d.chip(d.lerp(x0, cx(j), fly), d.lerp(y0, Y2 + CH / 2, fly), "1",
                   { fill: c.edge, glow: true, w: 30 });
          }
        }
        // the direction of travel, kept clear of the bits in flight
        const dirTxt = (k.left ? "shift left " : "shift right ") + k.n
                       + (k.n === 1 ? " place" : " places");
        d.text(118, 182, dirTxt, { size: 13.5, weight: 800, fill: c.violet,
          align: "center", baseline: "middle", max: 180 });
        if (k.left) d.arrow(190, 208, 46, 208, { stroke: c.violet, width: 3, glow: true });
        else d.arrow(46, 208, 190, 208, { stroke: c.violet, width: 3, glow: true });
      }

      // denary panel
      const P = { x: 710, y: 100, w: 240, h: 196 };
      d.box(P.x, P.y, P.w, P.h, { fill: c.panel, stroke: c.line, r: 12 });
      d.text(P.x + P.w / 2, P.y + 24, "In denary", { size: 13, weight: 800, fill: c.soft,
        align: "center", baseline: "middle" });
      d.text(P.x + P.w / 2, P.y + 62, String(v0), { size: 30, weight: 800, fill: c.fg,
        align: "center", baseline: "middle" });
      if (s > 0) {
        d.text(P.x + P.w / 2, P.y + 96, k.left ? "x " + (1 << k.n) : "/ " + (1 << k.n),
          { size: 16, weight: 800, fill: c.violet, align: "center", baseline: "middle" });
        const exact = k.left ? v0 * (1 << k.n) : v0 / (1 << k.n);
        const wrong = exact !== v1;
        d.text(P.x + P.w / 2, P.y + 134, String(v1), { size: 30, weight: 800,
          fill: wrong ? c.bad : c.ok, align: "center", baseline: "middle",
          alpha: reveal > .35 ? 1 : .15 });
        if (wrong)
          d.text(P.x + P.w / 2, P.y + 168, "should be " + exact, { size: 12.5, weight: 700,
            fill: c.bad, align: "center", baseline: "middle", max: P.w - 24,
            alpha: reveal > .35 ? 1 : .15 });
        else
          d.text(P.x + P.w / 2, P.y + 168, "exactly right", { size: 12.5, weight: 700,
            fill: c.ok, align: "center", baseline: "middle", alpha: reveal > .35 ? 1 : .15 });
      } else {
        d.text(P.x + P.w / 2, P.y + 110, "16 + 4 + 2", { size: 18, weight: 700, fill: c.edge,
          align: "center", baseline: "middle", alpha: reveal });
        d.text(P.x + P.w / 2, P.y + 150, "the three 1s, added up", { size: 12.5, weight: 600,
          fill: c.soft, align: "center", baseline: "middle", max: P.w - 24, alpha: reveal });
      }

      // value bars, so doubling and halving can be seen as well as read
      const BAR = { x: 234, y: 352, w: 560 };
      const bar = (y, v, col, label) => {
        d.box(BAR.x, y, BAR.w, 20, { fill: c.bg, stroke: c.line, r: 6 });
        const w = Math.max(4, BAR.w * Math.min(v, 255) / 255);
        d.box(BAR.x, y, w, 20, { fill: col, stroke: col, r: 6 });
        d.text(BAR.x - 14, y + 10, label, { size: 12, weight: 700, fill: c.soft,
          align: "right", baseline: "middle", max: 190 });
        d.text(BAR.x + BAR.w + 12, y + 10, String(v), { size: 13, weight: 800, fill: col,
          align: "left", baseline: "middle", max: 120 });
      };
      d.text(BAR.x, BAR.y - 18, "How big the stored number is (the bar is the full 0 to 255 range)",
        { size: 12, weight: 700, fill: c.dim, baseline: "middle" });
      bar(BAR.y, v0, c.edge, "before");
      if (s > 0) bar(BAR.y + 38, v1, v1 === (k.left ? v0 * (1 << k.n) : Math.floor(v0 / (1 << k.n)))
                     ? c.ok : c.bad, "after");

      const notes = [
        ["Columns, not digits", "A shift does not change any 1 into a 0. It moves the 1s into columns worth more or less, and that is what changes the value.",
         [cx(3), Y1 - 2]],
        ["The gap must be filled", "A column cannot be left blank, so a 0 is written into the place the bits moved away from.",
         [cx(7), Y2 - 8]],
        ["Two shifts in one", "Shifting two places is the same as shifting one place twice: x2 then x2 again, which is x4.",
         [cx(1), Y2 - 8]],
        ["Fast division", "Shifting is far quicker for a CPU than real division, so compilers use it whenever they are dividing by 2, 4, 8 and so on.",
         [cx(6), Y2 - 8]],
        ["Rounded down, not rounded", "The half is not rounded to the nearest whole number, it is simply dropped. Shift back left and you get 10, not 11.",
         [cx(7), Y1 - 2]],
        ["Overflow again", "Shifting left past the most significant bit loses the biggest part of the number, so the stored answer is badly wrong, not slightly wrong.",
         [cx(0), Y1 - 2]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // ===================================================================== ms-l13
  /* Images as binary. File sizes, all checked:
   *   8 x 8 x 1 bit      = 64 bits      = 8 bytes
   *   8 x 8 x 4 bits     = 256 bits     = 32 bytes
   *   16 x 16 x 4 bits   = 1,024 bits   = 128 bytes
   *   1920 x 1080 x 24   = 49,766,400 bits = 6,220,800 bytes = about 5.9 MB
   *   49,766,400 / 1,024 = 48,600 exactly, so the photo is 48,600x the 8x8.
   */
  A("pixels", function () {
    const W = 980, H = 580;
    const G = { x: 48, y: 100, s: 240 };
    const BIG = { x: 344, y: 104, w: 104, h: 104 };
    const P = { x: 466, y: 86, w: 484, h: 248 };
    // an 8 x 8 bitmap: 1 = ink
    const PIC = [
      "00111100", "01111110", "11011011", "11111111",
      "11011011", "11100111", "01111110", "00111100"
    ];
    const bit = (r, c) => PIC[r].charAt(c) === "1" ? 1 : 0;
    // a 4-bit value for every pixel, so the same picture can be shown in
    // 16 colours instead of 2. Deterministic, so the picture never flickers.
    const nib = (r, c) => bit(r, c) ? 10 + ((r + c) % 6) : ((r * 3 + c * 5) % 4);
    const SW = ["panel2", "panel", "line", "dim", "soft", "info", "teal", "ok",
                "violet", "edge", "orange", "pink", "bad", "fg", "soft", "teal"];

    const steps = [
      { name: "1. A grid", caption: "Zoom far enough into any bitmap image and it stops being a picture. It is a grid of single coloured squares called pixels." },
      { name: "2. Resolution", caption: "Resolution is how many pixels there are: the number across multiplied by the number down. This picture is 8 by 8, so 64 pixels." },
      { name: "3. One pixel, one number", caption: "Each pixel is stored as a binary number for its colour. With 1 bit per pixel there are only two possible colours." },
      { name: "4. Colour depth", caption: "Colour depth is the number of bits used per pixel. Four bits give 2 to the power 4, which is 16 possible colours, and four times the file size." },
      { name: "5. More pixels", caption: "Double the pixels across and down and the resolution is four times higher, so the file is four times bigger again." },
      { name: "6. A real photo", caption: "A full HD photo is 1920 by 1080 pixels at 24 bits per pixel. That is 49,766,400 bits, which is about 5.9 megabytes before any compression." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Images as binary - resolution and colour depth");
      const col = n => c[SW[n]] || c.soft;
      const reveal = d.seg(t, .05, .38);

      // ---- the picture ---------------------------------------------------
      const fine = s >= 4;
      const n = fine ? 16 : 8, cell = G.s / n;
      d.text(G.x, 68, s === 5 ? "our tiny picture, for comparison"
                              : (fine ? "the same picture at 16 x 16" : "the picture at 8 x 8"),
        { size: 12.5, weight: 700, fill: c.dim, baseline: "middle", max: 240 });
      d.box(G.x - 6, G.y - 6, G.s + 12, G.s + 12, { fill: c.panel, stroke: c.line, r: 10 });
      // grid lines fade in during step 1; the 16x16 split draws in during step 5
      const gridA = s === 0 ? reveal : 1;
      const splitA = s === 4 ? reveal : 1;
      for (let r = 0; r < n; r++) for (let cc = 0; cc < n; cc++) {
        const sr = fine ? r >> 1 : r, sc = fine ? cc >> 1 : cc;
        let fill;
        if (s <= 2) fill = bit(sr, sc) ? c.fg : c.panel2;
        else fill = col(nib(sr, sc));
        const isSplit = fine && ((r & 1) || (cc & 1));
        d.box(G.x + cc * cell, G.y + r * cell, cell, cell, {
          fill, stroke: c.bg, r: 1, alpha: isSplit ? splitA : 1
        });
      }
      // grid lines
      for (let i = 0; i <= n; i++) {
        const al = (i % (fine ? 2 : 1) ? splitA : 1) * gridA * .7;
        d.line(G.x + i * cell, G.y, G.x + i * cell, G.y + G.s, { stroke: c.line, width: 1, alpha: al });
        d.line(G.x, G.y + i * cell, G.x + G.s, G.y + i * cell, { stroke: c.line, width: 1, alpha: al });
      }
      // counting the pixels in step 2
      if (s === 1) {
        const shown = Math.ceil(d.seg(t, .05, .5) * 8);
        for (let i = 0; i < shown && i < 8; i++) {
          d.text(G.x + (i + .5) * (G.s / 8), G.y - 16, String(i + 1), { size: 11,
            weight: 700, fill: c.teal, align: "center", baseline: "middle" });
          d.text(G.x - 16, G.y + (i + .5) * (G.s / 8), String(i + 1), { size: 11,
            weight: 700, fill: c.teal, align: "center", baseline: "middle" });
        }
      }

      // ---- one pixel blown up ---------------------------------------------
      const PR = 2, PC = 6;                        // the pixel we zoom into
      const srcX = G.x + PC * (fine ? cell * 2 : cell), srcY = G.y + PR * (fine ? cell * 2 : cell);
      const srcS = fine ? cell * 2 : cell;
      const pxCol = s <= 2 ? (bit(PR, PC) ? c.fg : c.panel2) : col(nib(PR, PC));
      if (s >= 2) {
        const z = s === 2 ? d.seg(t, .1, .55) : 1;
        d.box(srcX, srcY, srcS, srcS, { fill: pxCol, stroke: c.edge, on: true, r: 2 });
        d.line(srcX + srcS, srcY, BIG.x, BIG.y, { stroke: c.edge, width: 1.2, dash: [4, 4], alpha: .7 });
        d.line(srcX + srcS, srcY + srcS, BIG.x, BIG.y + BIG.h,
               { stroke: c.edge, width: 1.2, dash: [4, 4], alpha: .7 });
        const bx = d.lerp(srcX, BIG.x, z), by = d.lerp(srcY, BIG.y, z);
        const bw = d.lerp(srcS, BIG.w, z), bh = d.lerp(srcS, BIG.h, z);
        const pv = s <= 2 ? (bit(PR, PC) ? 1 : 0) : nib(PR, PC);
        d.box(bx, by, bw, bh, { fill: pxCol, stroke: c.edge, on: true, r: 6 });
        d.text(BIG.x + BIG.w / 2, BIG.y - 16, "one pixel", { size: 12, weight: 700,
          fill: c.edge, align: "center", baseline: "middle", alpha: z });
        // its colour value in binary
        const bits = s <= 2 ? [String(pv)] : pv.toString(2).padStart(4, "0").split("");
        const cwid = s <= 2 ? 44 : 30;
        const tot = bits.length * (cwid + 4) - 4;
        d.cells(BIG.x + BIG.w / 2 - tot / 2, BIG.y + BIG.h + 22, bits,
                { cw: cwid, ch: 36, gap: 4, size: 15, alpha: z });
        d.text(BIG.x + BIG.w / 2, BIG.y + BIG.h + 76,
               (s <= 2 ? "1 bit" : "4 bits") + " = " + (s <= 2 ? "2" : "16") + " colours",
               { size: 12.5, weight: 700, fill: c.soft, align: "center", baseline: "middle",
                 max: 170, alpha: z });
        d.text(BIG.x + BIG.w / 2, BIG.y + BIG.h + 98, "value " + pv + " in denary",
               { size: 12, weight: 600, fill: c.dim, align: "center", baseline: "middle",
                 max: 170, alpha: z });
      }

      // ---- the sum --------------------------------------------------------
      d.box(P.x, P.y, P.w, P.h, { fill: c.panel, stroke: c.line, r: 14 });
      d.text(P.x + 20, P.y + 26, "File size = resolution x colour depth",
        { size: 15, weight: 800, fill: c.fg, baseline: "middle", max: P.w - 40 });
      const SZ = [
        { res: "8 x 8", px: 64, bits: 1 },
        { res: "8 x 8", px: 64, bits: 1 },
        { res: "8 x 8", px: 64, bits: 1 },
        { res: "8 x 8", px: 64, bits: 4 },
        { res: "16 x 16", px: 256, bits: 4 },
        { res: "1920 x 1080", px: 2073600, bits: 24 }
      ][s];
      const cm = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const totBits = SZ.px * SZ.bits, totBytes = totBits / 8;
      const lines = [
        ["pixels across, pixels down", SZ.res + " = " + cm(SZ.px) + " pixels"],
        ["bits for each pixel", SZ.bits + " bit" + (SZ.bits === 1 ? "" : "s") +
                                " = " + cm(Math.pow(2, SZ.bits)) + " colours"],
        ["pixels x bits per pixel", cm(SZ.px) + " x " + SZ.bits + " = " + cm(totBits) + " bits"],
        ["bits / 8", cm(totBytes) + " bytes" + (totBytes >= 1048576
            ? " (about " + (totBytes / 1048576).toFixed(1) + " MB)"
            : (totBytes >= 1024 ? " (" + (totBytes / 1024).toFixed(0) + " KB)" : ""))]
      ];
      lines.forEach((l, i) => {
        const al = s < 2 && i >= 2 ? .18 : d.lerp(.35, 1, d.seg(t, .05 + i * .07, .3 + i * .07));
        d.text(P.x + 20, P.y + 64 + i * 40, l[0], { size: 12, weight: 600, fill: c.dim,
          baseline: "middle", max: 168, alpha: al });
        d.text(P.x + P.w - 20, P.y + 64 + i * 40, l[1], { size: 17, weight: 800,
          fill: i === 3 ? c.ok : c.fg, align: "right", baseline: "middle",
          max: 272, alpha: al });
      });
      d.wrap(P.x + 20, P.y + 202, "A real file adds a little metadata too: width, height, "
           + "colour depth and the date it was made.", P.w - 40, { size: 11.5, fill: c.dim });

      // ---- the comparison bars ---------------------------------------------
      d.text(48, 356, "File size in bits, drawn to scale",
        { size: 12.5, weight: 800, fill: c.dim, baseline: "middle" });
      const BARS = [
        ["8 x 8, 1 bit", 64, 2, c.info],
        ["8 x 8, 4 bits", 256, 3, c.teal],
        ["16 x 16, 4 bits", 1024, 4, c.violet],
        ["1920 x 1080, 24 bits", 49766400, 5, c.orange]
      ];
      BARS.forEach((b, i) => {
        const y = 372 + i * 26;
        const live = s >= b[2];
        const grow = s === b[2] ? d.seg(t, .1, .6) : (live ? 1 : 0);
        d.box(208, y, 552, 18, { fill: c.bg, stroke: c.line, r: 5 });
        if (live) {
          const full = Math.min(552, 552 * b[1] / 1024);
          d.box(208, y, Math.max(5, full * grow), 18, { fill: b[3], stroke: b[3], r: 5 });
        }
        d.text(200, y + 9, b[0], { size: 11.5, weight: 700,
          fill: live ? c.soft : c.dim, align: "right", baseline: "middle", max: 148 });
        d.text(768, y + 9, cm(b[1]) + " bits", { size: 11.5, weight: 700,
          fill: live ? b[3] : c.dim, align: "left", baseline: "middle", max: 120 });
        if (i === 3 && live)
          d.text(748, y + 9, "off the scale - 48,600 times the top bar", { size: 11.5,
            weight: 800, fill: c.bg, align: "right", baseline: "middle", max: 420 });
      });

      const notes = [
        ["Bitmap, not vector", "This is why a photo goes blocky when you enlarge it: there are no extra pixels to show, so each one is just drawn bigger.",
         [G.x + G.s / 2, G.y + G.s / 2]],
        ["Resolution is a count", "1920 x 1080 is a resolution. Dots per inch is something different: that is how tightly those pixels are printed.",
         [G.x + G.s - 4, G.y + G.s - 4]],
        ["One number per pixel", "The computer stores no shapes and no lines, only a long list of colour numbers, read back row by row.",
         [BIG.x + BIG.w / 2, BIG.y + BIG.h + 40]],
        ["Doubling the bits", "Each extra bit doubles the number of colours available, and adds that bit to every single pixel in the image.",
         [BIG.x + BIG.w / 2, BIG.y + BIG.h / 2]],
        ["Four times, not twice", "16 x 16 is double in each direction, so 256 pixels instead of 64. Quality costs more than people expect.",
         [G.x + G.s / 2, G.y + 30]],
        ["Why compression exists", "Nobody sends 5.9 MB for one photo. Compression is what makes images small enough to put on a web page.",
         [760, 450]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // ===================================================================== ms-l14
  /* Analogue sound to digital. Numbers used, all checked:
   *   toy example: 8 samples a second x 2 bits = 16 bits per second
   *                16 samples a second x 2 bits = 32 bits per second
   *                16 samples a second x 4 bits = 64 bits per second
   *   real CD quality: 44,100 x 16 = 705,600 bits per second
   *                    705,600 / 8 = 88,200 bytes = about 86 KB per second
   *                    stereo doubles it, so about 172 KB per second
   */
  A("sampling", function () {
    const W = 980, H = 580;
    const PL = { x: 86, y: 92, w: 600, h: 212 };    // plot area
    const RP = { x: 716, y: 78, w: 234, h: 238 };
    const BOT = { x: 60, y: 404, w: 890, h: 58 };
    const wave = u => .5 + .34 * Math.sin(u * Math.PI * 3) + .12 * Math.sin(u * Math.PI * 7 + 1);
    const px = u => PL.x + u * PL.w;
    const py = v => PL.y + PL.h - v * PL.h;

    const steps = [
      { name: "1. The wave", caption: "Sound reaching a microphone is analogue: a smooth pressure wave that can take any value at any moment in time." },
      { name: "2. Sampling", caption: "The computer cannot store something smooth, so it measures the height of the wave at fixed intervals. How often it measures is the sample rate." },
      { name: "3. Rounding", caption: "Each measurement has to be written as a binary number, so it is rounded to the nearest level the bit depth allows. Two bits give only four levels." },
      { name: "4. What is stored", caption: "All that is kept is a list of binary numbers. Played back, they make a stair-step shape, not the original curve." },
      { name: "5. Higher sample rate", caption: "Measure twice as often and the stair-steps are narrower, so the stored shape follows the wave much more closely." },
      { name: "6. More bits per sample", caption: "Four bits instead of two gives 16 levels instead of 4, so each measurement sits much nearer the true height of the wave." },
      { name: "7. The cost", caption: "File size is sample rate multiplied by bit depth multiplied by the number of seconds. Better quality always means a bigger file." }
    ];

    const CFG = [
      { n: 8, bits: 2, show: 0 },      // 0 nothing sampled yet
      { n: 8, bits: 2, show: 1 },      // 1 sample points
      { n: 8, bits: 2, show: 2 },      // 2 rounded to levels
      { n: 8, bits: 2, show: 3 },      // 3 stair-step stored
      { n: 16, bits: 2, show: 3 },
      { n: 16, bits: 4, show: 3 },
      { n: 16, bits: 4, show: 3 }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Sampling sound - turning an analogue wave into binary");
      const K = CFG[s], L = Math.pow(2, K.bits);
      const lvl = v => Math.round(v * (L - 1));
      const reveal = d.seg(t, .05, .4), grow = d.seg(t, .1, .6);

      d.box(PL.x - 26, PL.y - 24, PL.w + 52, PL.h + 56, { fill: c.panel, stroke: c.line, r: 14 });
      d.text(PL.x + 16, PL.y - 10, "loudness", { size: 11.5, weight: 700, fill: c.dim,
        baseline: "middle" });
      d.text(PL.x + PL.w - 10, PL.y + PL.h + 20, "time", { size: 11.5, weight: 700,
        fill: c.dim, align: "right", baseline: "middle" });

      // the levels the bit depth allows
      if (s >= 2) {
        const la = s === 5 ? reveal : 1;
        for (let i = 0; i < L; i++) {
          const y = py(i / (L - 1));
          const isNew = s === 5 && (i % 5 !== 0);
          d.line(PL.x, y, PL.x + PL.w, y, { stroke: c.line, width: 1, dash: [3, 5],
            alpha: isNew ? la * .8 : .8 });
          if (L <= 8 || i % 3 === 0)
            d.text(PL.x - 8, y, i.toString(2).padStart(K.bits, "0"), { size: 10.5,
              weight: 700, fill: c.dim, align: "right", baseline: "middle",
              alpha: isNew ? la : 1 });
        }
        d.text(PL.x + 16, PL.y + PL.h + 20, L + " levels, " + K.bits + " bits each",
          { size: 11.5, weight: 800, fill: c.violet, baseline: "middle", max: 200 });
      }

      // the analogue wave - drawn progressively in step 1
      const span = s === 0 ? Math.max(.04, reveal) : 1;
      const pts = [];
      for (let i = 0; i <= 160; i++) { const u = (i / 160) * span; pts.push([px(u), py(wave(u))]); }
      d.path(pts, { stroke: c.teal, width: 3, glow: s === 0 });
      if (s === 0) d.dot(px(span), py(wave(span)), 6, { fill: c.teal, glow: true });

      // the stair-step that is actually stored
      if (K.show >= 3) {
        // a proper step path, clipped by how far the drawing has got
        const lim = px(Math.min(1, grow));
        const sp2 = [];
        for (let i = 0; i < K.n; i++) {
          const u0 = i / K.n, u1 = (i + 1) / K.n;
          const y = py(lvl(wave(u0 + .5 / K.n)) / (L - 1));
          const x0 = px(u0), x1 = px(u1);
          if (x0 > lim) break;
          sp2.push([x0, y], [Math.min(x1, lim), y]);
        }
        if (sp2.length) d.path(sp2, { stroke: c.orange, width: 3.5, glow: true });
      }

      // the sample points
      if (K.show >= 1) {
        for (let i = 0; i < K.n; i++) {
          const u = i / K.n + .5 / K.n, x = px(u), vt = wave(u);
          const appear = d.seg(t, .05 + (i / K.n) * .3, .2 + (i / K.n) * .3);
          if (appear <= 0) continue;
          d.line(x, PL.y + PL.h, x, py(vt), { stroke: c.edge, width: 1.4, dash: [3, 4],
            alpha: .75 * appear });
          d.dot(x, py(vt), 5, { fill: c.teal, stroke: c.fg, width: 1.5, alpha: appear });
          if (K.show >= 2) {
            const yq = py(lvl(vt) / (L - 1));
            const snap = s === 2 ? d.seg(t, .25 + (i / K.n) * .3, .45 + (i / K.n) * .3) : 1;
            d.line(x, py(vt), x, d.lerp(py(vt), yq, snap), { stroke: c.bad, width: 2.5,
              alpha: .9 * appear });
            d.dot(x, d.lerp(py(vt), yq, snap), 5.5, { fill: c.orange, glow: true, alpha: appear });
          }
        }
      }

      // the binary that comes out
      if (K.show >= 2) {
        const codes = [];
        for (let i = 0; i < K.n; i++)
          codes.push(lvl(wave(i / K.n + .5 / K.n)).toString(2).padStart(K.bits, "0"));
        const cw = K.n > 8 ? 46 : 60, tot = K.n * (cw + 4) - 4;
        d.text(60, 352, "stored as binary:", { size: 12, weight: 800, fill: c.soft,
          baseline: "middle" });
        const shown = Math.ceil(d.seg(t, .1, .55) * K.n);
        d.cells(Math.max(60, (W - tot) / 2), 364, codes.map((v, i) => i < shown ? v : ""),
                { cw, ch: 32, gap: 4, size: 13 });
      }

      // the settings panel
      d.box(RP.x, RP.y, RP.w, RP.h, { fill: c.panel, stroke: c.line, r: 14 });
      d.text(RP.x + RP.w / 2, RP.y + 24, "Settings", { size: 13, weight: 800,
        fill: c.soft, align: "center", baseline: "middle" });
      const rateChanged = s === 4, depthChanged = s === 5;
      const rows = [
        ["sample rate", K.n + " a second", rateChanged ? c.ok : c.fg],
        ["bit depth", K.bits + " bits", depthChanged ? c.ok : c.fg],
        ["levels (2^bits)", String(L), depthChanged ? c.ok : c.fg],
        ["size each second", (K.n * K.bits) + " bits", c.orange]
      ];
      rows.forEach((r, i) => {
        const y = RP.y + 60 + i * 44;
        d.text(RP.x + 16, y, r[0], { size: 11.5, weight: 600, fill: c.dim, baseline: "middle",
          max: RP.w - 32 });
        d.text(RP.x + 16, y + 20, r[1], { size: 19, weight: 800, fill: r[2],
          baseline: "middle", max: RP.w - 32 });
        if ((i === 0 && rateChanged) || (i >= 1 && i <= 2 && depthChanged))
          d.chip(RP.x + RP.w - 34, y + 14, "x2", { fill: c.ok, size: 11, w: 30,
            alpha: d.seg(t, .05, .3) });
      });

      // the real numbers
      const real = s === 6;
      d.box(BOT.x, BOT.y, BOT.w, BOT.h, { fill: c.panel,
        stroke: real ? c.orange : c.line, on: real, r: 12 });
      if (real) {
        const al = d.seg(t, .05, .35);
        d.text(BOT.x + 18, BOT.y + 20, "CD quality, one second of mono sound:",
          { size: 13, weight: 800, fill: c.orange, baseline: "middle", alpha: al, max: 330 });
        d.text(BOT.x + 18, BOT.y + 42,
          "44,100 samples x 16 bits = 705,600 bits = 88,200 bytes = about 86 KB",
          { size: 14, weight: 800, fill: c.fg, baseline: "middle", alpha: al, max: 530 });
        d.text(BOT.x + BOT.w - 18, BOT.y + 20, "stereo doubles it",
          { size: 12, weight: 700, fill: c.soft, align: "right", baseline: "middle",
            alpha: al, max: 260 });
        d.text(BOT.x + BOT.w - 18, BOT.y + 42, "about 172 KB a second, 10 MB a minute",
          { size: 12.5, weight: 800, fill: c.pink, align: "right", baseline: "middle",
            alpha: al, max: 260 });
      } else {
        d.text(BOT.x + 18, BOT.y + 29, "File size = sample rate x bit depth x seconds"
          + "   (and x2 again for stereo)",
          { size: 13.5, weight: 700, fill: c.dim, baseline: "middle", max: BOT.w - 36 });
      }

      const notes = [
        ["Why it cannot be stored", "Between any two moments there is another moment, and between any two heights another height. A file has to be a finite list.",
         [px(.5), py(wave(.5))]],
        ["Measured in hertz", "44,100 Hz means 44,100 measurements every second. The gaps between them are what the recording cannot see.",
         [px(.56), PL.y + PL.h]],
        ["This gap is the error", "The gap is how far each sample had to move to reach a storable level. That difference is lost for good.",
         [px(.31), py(.55)]],
        ["Playback is the steps", "A speaker is driven by these stored numbers, so what you hear is the stair-step, smoothed a little by the hardware.",
         [px(.72), py(.33)]],
        ["Nyquist, roughly", "To capture a sound you need to sample at more than twice its highest frequency, which is why 44,100 Hz covers human hearing.",
         [px(.2), PL.y + PL.h]],
        ["Bit depth is loudness detail", "Sample rate decides which pitches survive. Bit depth decides how finely the loudness of each one is recorded.",
         [PL.x - 8, py(.5)]],
        ["Always an approximation", "No sample rate or bit depth makes it exact, because the original was smooth. Lossy formats like MP3 trade more accuracy for size.",
         [BOT.x + BOT.w - 150, BOT.y + 10]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // ===================================================================== ms-l15
  /* Compression. The run-length example, checked:
   *   20 pixels, 1 byte per pixel  = 20 bytes raw
   *   runs 6 light, 2 dark, 9 light, 3 dark -> 6+2+9+3 = 20 pixels, 4 runs
   *   4 runs x (1 byte count + 1 byte colour) = 8 bytes, a saving of 12
   *   alternating row -> 20 runs x 2 bytes = 40 bytes, bigger than the original
   */
  A("compression", function () {
    const W = 980, H = 580;
    const CWP = 36, GAPP = 4, BXP = 92, YROW = 96, YDEC = 388;
    const RUNS = [[6, 1], [2, 0], [9, 1], [3, 0]];     // length, 1 = light
    const row = [];
    RUNS.forEach(r => { for (let i = 0; i < r[0]; i++) row.push(r[1]); });
    const alt = []; for (let i = 0; i < 20; i++) alt.push(i % 2);
    const xp = i => BXP + i * (CWP + GAPP);

    const steps = [
      { name: "1. The raw row", caption: "One row of 20 pixels. At one byte per pixel that is 20 bytes, and most of those bytes are repeats of the one before." },
      { name: "2. Find the runs", caption: "Run length encoding looks for runs: stretches of neighbouring pixels that are all the same colour. There are four runs here." },
      { name: "3. Count and colour", caption: "Each run is stored as two values: how many pixels, then which colour. Four runs need eight bytes instead of twenty." },
      { name: "4. Lossless", caption: "Decoding just writes each colour out the stated number of times. Every original pixel comes back exactly, so nothing has been lost." },
      { name: "5. When it backfires", caption: "On a row with no runs, every pixel becomes its own count-and-colour pair, and the file ends up twice the size of the original." },
      { name: "6. Lossy", caption: "Lossy compression makes a file smaller by throwing detail away. It gets far smaller, but the discarded detail cannot be got back." },
      { name: "7. Which to use", caption: "Lossless where every byte matters and must be restorable. Lossy where a small drop in quality is worth a much smaller file." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Compression - run length encoding, and what lossy gives up");
      const reveal = d.seg(t, .05, .4);
      const pxFill = v => v ? c.soft : c.bg;

      // ================= steps 1 to 5: run length encoding ==================
      if (s <= 4) {
        const data = s === 4 ? alt : row;
        const runs = s === 4 ? alt.map(v => [1, v]) : RUNS;

        d.text(BXP, YROW - 20, s === 4 ? "a row with no runs at all: every pixel differs from its neighbour"
                                       : "one row of an image, 20 pixels wide",
          { size: 12.5, weight: 700, fill: c.dim, baseline: "middle", max: 790 });
        // the pixels, appearing left to right so the row is seen being read
        const shown = s === 0 || s === 4 ? Math.ceil(d.seg(t, .05, .5) * 20) : 20;
        data.forEach((v, i) => {
          if (i >= shown) return;
          d.box(xp(i), YROW, CWP, CWP, { fill: pxFill(v), stroke: v ? c.soft : c.line, r: 4 });
        });

        // run brackets
        if (s >= 1 && s <= 3) {
          let at = 0;
          RUNS.forEach((r, ri) => {
            const al = s === 1 ? d.seg(t, .04 + ri * .07, .22 + ri * .07) : 1;
            const x0 = xp(at) - 3, x1 = xp(at + r[0] - 1) + CWP + 3;
            d.box(x0, YROW - 6, x1 - x0, CWP + 12, { fill: c.bg, stroke: c.edge,
              alpha: .3 * al, r: 8 });
            d.line(x0, YROW + CWP + 12, x1, YROW + CWP + 12, { stroke: c.edge, width: 2.5,
              alpha: al });
            d.text((x0 + x1) / 2, YROW + CWP + 32, r[0] + " x " + (r[1] ? "light" : "dark"),
              { size: 12.5, weight: 800, fill: c.edge, align: "center", baseline: "middle",
                max: x1 - x0 - 4, alpha: al });
            at += r[0];
          });
        }

        // the encoded pairs
        if (s >= 2) {
          d.text(BXP, 186, "what gets written to the file:", { size: 12.5, weight: 800,
            fill: c.soft, baseline: "middle" });
          if (s === 4) {
            const n = Math.ceil(d.seg(t, .05, .5) * 20);
            alt.forEach((v, i) => {
              if (i >= n) return;
              d.box(xp(i), 198, CWP, 50, { fill: c.panel, stroke: c.bad, r: 6,
                label: "1", sub: v ? "L" : "D", size: 13, max: CWP - 6, subFill: c.dim });
            });
            d.text(BXP, 266, "20 pairs - one for every single pixel",
              { size: 12.5, weight: 800, fill: c.bad, baseline: "middle", max: 600 });
          } else {
            RUNS.forEach((r, ri) => {
              const al = s === 2 ? d.seg(t, .05 + ri * .1, .28 + ri * .1) : 1;
              const bx = BXP + ri * 178;
              d.box(bx, 198, 150, 54, { fill: c.panel, stroke: c.ok, on: al > .6, r: 10,
                alpha: Math.max(.12, al) });
              d.text(bx + 38, 225, String(r[0]), { size: 24, weight: 800, fill: c.ok,
                align: "center", baseline: "middle", alpha: al });
              d.box(bx + 86, 209, 32, 32, { fill: pxFill(r[1]), stroke: r[1] ? c.soft : c.line,
                r: 4, alpha: al });
              d.text(bx + 38, 264, "count", { size: 11, weight: 700, fill: c.dim,
                align: "center", baseline: "middle", alpha: al });
              d.text(bx + 102, 264, "colour", { size: 11, weight: 700, fill: c.dim,
                align: "center", baseline: "middle", alpha: al });
            });
            d.text(950, 216, "4 pairs,", { size: 13, weight: 800, fill: c.ok,
              align: "right", baseline: "middle", max: 130 });
            d.text(950, 238, "2 bytes each", { size: 13, weight: 800, fill: c.ok,
              align: "right", baseline: "middle", max: 130 });
          }
        }

        // decoding back again
        if (s === 3) {
          d.text(BXP, YDEC - 18, "decoded straight back from those four pairs:",
            { size: 12.5, weight: 700, fill: c.ok, baseline: "middle", max: 370 });
          const n = Math.ceil(d.seg(t, .05, .6) * 20);
          row.forEach((v, i) => {
            if (i >= n) return;
            d.box(xp(i), YDEC, CWP, CWP, { fill: pxFill(v), stroke: v ? c.soft : c.line, r: 4 });
          });
          if (n >= 20) d.chip(620, YDEC - 18, "identical to the original", { fill: c.ok, size: 11 });
        }

        // size bars
        const BY = 304;
        d.text(BXP, BY - 16, "file size in bytes", { size: 12.5, weight: 800, fill: c.dim,
          baseline: "middle" });
        const bar = (y, bytes, col, label, live) => {
          d.box(238, y, 580, 20, { fill: c.bg, stroke: c.line, r: 5 });
          if (live) d.box(238, y, Math.max(6, 580 * Math.min(bytes, 40) / 40 * (s >= 1 ? 1 : reveal)),
                          20, { fill: col, stroke: col, r: 5 });
          d.text(230, y + 10, label, { size: 12, weight: 700, fill: live ? c.soft : c.dim,
            align: "right", baseline: "middle", max: 136 });
          d.text(830, y + 10, live ? bytes + " bytes" : "?", { size: 12.5, weight: 800,
            fill: live ? col : c.dim, align: "left", baseline: "middle", max: 110 });
        };
        bar(BY, 20, c.info, "original row", true);
        bar(BY + 28, s === 4 ? 40 : 8, s === 4 ? c.bad : c.ok, "after RLE", s >= 2);
        if (s >= 2)
          d.wrap(830, BY + 52, s === 4 ? "20 bytes bigger, not smaller"
                                       : "12 bytes saved, 60% smaller",
                 140, { size: 12, fill: s === 4 ? c.bad : c.ok, weight: 800 });
      }

      // ================= step 6: lossy ======================================
      if (s === 5) {
        const L = { x: 72, y: 96, w: 236, h: 192 }, R = { x: 452, y: 96, w: 236, h: 192 };
        const DP = { x: 724, y: 96, w: 226, h: 192 };
        const drawImg = (B, blocks, fine) => {
          d.box(B.x - 6, B.y - 6, B.w + 12, B.h + 12, { fill: c.panel, stroke: c.line, r: 10 });
          const cw = B.w / blocks, ch = B.h / blocks;
          for (let r = 0; r < blocks; r++) for (let cc = 0; cc < blocks; cc++) {
            const u = cc / blocks, v = r / blocks;
            const k = Math.floor((Math.sin(u * 7) + Math.cos(v * 5) + 2) * 2.6);
            const pal = [c.panel2, c.line, c.info, c.teal, c.ok, c.violet, c.orange, c.pink,
                         c.edge, c.soft, c.dim, c.panel];
            d.box(B.x + cc * cw, B.y + r * ch, cw, ch,
                  { fill: pal[k % pal.length], stroke: c.bg, r: fine ? 0 : 2 });
          }
        };
        drawImg(L, 24, true);
        const blocks = Math.round(d.lerp(24, 6, d.seg(t, .08, .42)));
        drawImg(R, Math.max(4, blocks), false);
        d.text(L.x, L.y - 20, "the original photo", { size: 12.5, weight: 800, fill: c.soft,
          baseline: "middle", max: L.w });
        d.text(R.x, R.y - 20, "after lossy compression", { size: 12.5, weight: 800,
          fill: c.orange, baseline: "middle", max: R.w });
        d.text(L.x, L.y + L.h + 24, "about 5.9 MB", { size: 17, weight: 800, fill: c.info,
          baseline: "middle", max: L.w });
        d.text(R.x, R.y + R.h + 24, "about 600 KB", { size: 17, weight: 800, fill: c.orange,
          baseline: "middle", max: R.w });
        d.arrow(L.x + L.w + 18, L.y + L.h / 2, R.x - 18, R.y + R.h / 2,
          { stroke: c.orange, width: 4, glow: true, label: "detail discarded",
            labelFill: c.orange, ly: -16, labelSize: 13 });
        d.curve(R.x + 20, R.y + R.h + 56, L.x + L.w - 20, L.y + L.h + 56, -26,
          { stroke: c.bad, width: 3, dash: [6, 5] });
        d.chip((L.x + L.w + R.x) / 2, R.y + R.h + 88, "cannot be undone",
               { fill: c.bad, size: 11 });

        // the discarded detail drifting away
        d.box(DP.x, DP.y, DP.w, DP.h, { fill: c.panel, stroke: c.bad, r: 12 });
        d.text(DP.x + 16, DP.y + 24, "Thrown away", { size: 13, weight: 800, fill: c.bad,
          baseline: "middle", max: DP.w - 32 });
        ["fine shade differences", "sharp edge detail", "quiet sounds, in audio",
         "frequencies few people hear"].forEach((s2, i) => {
          const al = d.seg(t, .05 + i * .06, .25 + i * .06);
          d.text(DP.x + 16, DP.y + 56 + i * 32, "- " + s2, { size: 12, weight: 600,
            fill: c.soft, baseline: "middle", max: DP.w - 32, alpha: al });
        });
        d.text(72, 414, "A lossy file is a new, simpler file. The original pixels are not "
          + "hidden or packed away, they are gone.",
          { size: 13.5, weight: 700, fill: c.soft, baseline: "middle", max: 878 });
        d.text(72, 442, "Compress a lossy file again and again and the quality keeps "
          + "dropping, because each pass throws more away.",
          { size: 13, weight: 600, fill: c.dim, baseline: "middle", max: 878 });
      }

      // ================= step 7: which to use ===============================
      if (s === 6) {
        const cols = [
          { x: 70, w: 420, t: "Lossless", col: c.ok,
            sub: "Nothing is thrown away. The original is rebuilt bit for bit.",
            use: ["text, code and spreadsheets", "ZIP archives and backups",
                  "PNG and GIF images", "FLAC audio for archiving",
                  "anything where one wrong byte matters"],
            cost: "Smaller savings. Some files barely shrink at all." },
          { x: 510, w: 420, t: "Lossy", col: c.orange,
            sub: "Detail a person is unlikely to notice is removed for good.",
            use: ["photos on web pages (JPEG)", "streamed music (MP3, AAC)",
                  "video (MP4 and similar)", "video calls over slow connections",
                  "anything where size beats perfection"],
            cost: "Much bigger savings. Quality drops and cannot be recovered." }
        ];
        cols.forEach((o, ci) => {
          const al = d.seg(t, .05 + ci * .12, .3 + ci * .12);
          d.box(o.x, 78, o.w, 376, { fill: c.panel, stroke: o.col, on: true, r: 14, alpha: al });
          d.text(o.x + 20, 106, o.t, { size: 20, weight: 800, fill: o.col,
            baseline: "middle", max: o.w - 40, alpha: al });
          d.wrap(o.x + 20, 122, o.sub, o.w - 40, { size: 12.5, fill: c.soft });
          o.use.forEach((u, i) => {
            const a2 = d.seg(t, .08 + ci * .04 + i * .04, .26 + ci * .04 + i * .04);
            d.box(o.x + 20, 170 + i * 42, o.w - 40, 34, { fill: c.bg, stroke: c.line, r: 8,
              alpha: Math.max(.1, a2), label: u, size: 13.5, max: o.w - 60 });
          });
          d.wrap(o.x + 20, 392, o.cost, o.w - 40, { size: 12.5, fill: o.col });
        });
      }

      const notes = [
        ["Why images repeat", "Backgrounds, flat colour, screenshots and cartoons have long stretches of identical pixels. RLE lives on those.",
         [xp(3) + CWP / 2, YROW + CWP]],
        ["Runs, not totals", "It is not 15 light and 5 dark. The order matters, so each stretch is recorded separately as it is met.",
         [xp(7) + CWP / 2, YROW + CWP + 12]],
        ["Two bytes a run", "A count byte can hold up to 255, and a colour byte holds the colour. A run of 1 still costs two bytes.",
         [BXP + 240, 242]],
        ["That is what lossless means", "The compressed file holds everything needed to rebuild the original exactly. Nothing is approximated.",
         [xp(10) + CWP / 2, YDEC]],
        ["Check before you compress", "This is why a photo in a ZIP hardly shrinks. Real compressors test whether their method actually helps.",
         [xp(10) + CWP / 2, YROW + CWP]],
        ["Fewer, bigger blocks", "A JPEG stores an approximation of each small block of the image. Push it too far and the blocks become visible.",
         [570, 192]],
        ["Both make files smaller", "The question is never which is better. It is whether an exact copy is needed, or whether a close one will do.",
         [280, 300]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });
})();
