/* Revise 360 - diagrams for 1.1 systems architecture and 1.2 systems software.
 *
 * Registered here: buses, cpuperf, scheduling, permissions, defrag.
 * House style is `fde` in js/diagrams-set.js: one idea per step, something
 * moving in every step, and one annotation that says what the picture cannot.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  /* The CPU / memory / queue containers all look the same, so the five
   * drawings read as one set rather than five unrelated pictures. */
  function shell(d, b, title, o) {
    o = o || {};
    d.box(b.x, b.y, b.w, b.h, {
      fill: o.fill || "#16233c", stroke: o.stroke || d.c.line,
      r: 14, alpha: o.alpha, on: o.on
    });
    if (title !== undefined)
      d.text(b.x + 14, b.y + 22, title, {
        size: o.size || 12.5, weight: 800, fill: o.titleFill || d.c.soft,
        baseline: "middle", max: b.w - 28, alpha: o.alpha
      });
  }

  /* The caption and the one annotation, drawn the same way everywhere. A short
   * maxLead keeps the leader from being dragged right across the picture. */
  function foot(d, steps, s, t, note) {
    d.caption(steps[s].caption);
    d.note(590, 492, note[1], {
      title: note[0], to: note[2], w: 360, anchor: "centre",
      maxLead: 150, alpha: d.seg(t, 0, .25)
    });
  }

  // a small yes / no square, used by the permissions table
  function flag(d, cx, cy, yes, o) {
    o = o || {};
    const c = d.c;
    d.box(cx - 22, cy - 17, 44, 34, {
      fill: yes ? "#1d4a35" : "#3a2030", stroke: yes ? c.ok : c.bad,
      on: !!o.on, r: 8, label: yes ? "Y" : "N", size: 15,
      labelFill: yes ? c.ok : c.bad, alpha: o.alpha
    });
  }

  // =====================================================================
  // 1.1  Von Neumann architecture: one memory, three buses, one bottleneck
  // =====================================================================
  A("buses", function () {
    const W = 980, H = 580;
    const CPU = { x: 36, y: 62, w: 400, h: 326 };
    const MEM = { x: 724, y: 62, w: 216, h: 326 };
    const CU = { x: 56, y: 104, w: 172, h: 84 };
    const ALU = { x: 244, y: 104, w: 172, h: 84 };
    const REG = { x: 56, y: 202, w: 360, h: 72 };
    const CSH = { x: 56, y: 288, w: 360, h: 72 };
    const L = 436, R = 724, MID = 580;
    const AY = 150, DY = 228, CY = 306;

    // Instructions (1) and data (0) sitting in the one memory. That mixture is
    // the stored-program concept, and the reason for the bottleneck later.
    const MROW = [
      ["40  LOAD 61", 1], ["41  ADD 62", 1], ["42  STORE 63", 1],
      ["61  8", 0], ["62  5", 0], ["63  --", 0]
    ];
    const rowY = i => 108 + i * 41;

    const steps = [
      { name: "1. One memory", caption: "A program is loaded into main memory, and so is the data it works on. Both live in the same memory, in numbered addresses." },
      { name: "2. Address bus", caption: "The CPU puts the address it wants onto the address bus. Addresses only ever travel away from the CPU, never back." },
      { name: "3. Data bus", caption: "Whatever is stored at that address comes back along the data bus. The same bus carries values out again when the CPU saves a result." },
      { name: "4. Control bus", caption: "The control bus carries the signals that say what to do: read or write, and a reply to say the transfer is finished." },
      { name: "5. One at a time", caption: "An instruction such as ADD 62 needs two trips: one to collect the instruction, then another to collect the value it adds." },
      { name: "6. The bottleneck", caption: "Only one thing can cross at a time, so the CPU often sits waiting for memory. That limit is the von Neumann bottleneck." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Von Neumann architecture - one memory, three buses");

      // ---- the two boxes ------------------------------------------------
      shell(d, CPU, "CPU", { stroke: s === 5 ? c.bad : c.line });
      shell(d, MEM, "Main memory (RAM)");

      const cuOn = s === 3;
      d.box(CU.x, CU.y, CU.w, CU.h, {
        fill: cuOn ? "#3a2a56" : c.panel, stroke: cuOn ? c.violet : c.line, on: cuOn,
        label: "Control unit", sub: "sends the signals", r: 12
      });
      d.box(ALU.x, ALU.y, ALU.w, ALU.h, {
        fill: c.panel, stroke: c.line, label: "ALU", sub: "arithmetic and logic", r: 12
      });
      const regOn = s === 1 || s === 2 || s === 4;
      d.box(REG.x, REG.y, REG.w, REG.h, {
        fill: regOn ? "#2a3f68" : c.panel, stroke: regOn ? c.edge : c.line, on: regOn,
        label: "Registers", sub: "PC  MAR  MDR  CIR  ACC", r: 12
      });
      d.box(CSH.x, CSH.y, CSH.w, CSH.h, {
        fill: c.panel, stroke: s === 5 ? c.ok : c.line, label: "Cache", r: 12,
        sub: "a small copy kept inside the CPU"
      });

      if (s === 5)
        d.text(CPU.x + CPU.w - 16, CPU.y + 22, "waiting for memory", {
          size: 12.5, weight: 800, align: "right", baseline: "middle",
          fill: c.bad, max: 200, alpha: .4 + .6 * d.pulse(t * 2)
        });

      // ---- what is in memory -------------------------------------------
      const litRow = (s >= 1 && s <= 3) ? 1 : (s === 4 ? (t < .5 ? 1 : 4) : -1);
      MROW.forEach((r, i) => {
        const al = s === 0 ? d.seg(t, .05 + i * .1, .3 + i * .1) : 1;
        if (al < .02) return;
        const on = i === litRow;
        d.box(MEM.x + 14, rowY(i), MEM.w - 28, 34, {
          fill: on ? "#2a3f68" : c.panel, stroke: on ? c.edge : (r[1] ? c.violet : c.teal),
          on, label: r[0], size: 13.5, alpha: al, r: 8
        });
      });

      // ---- the three buses ---------------------------------------------
      const bus = (y, label, hint, twoWay, lit, col) => {
        const st = lit ? col : c.line;
        d.line(L + (twoWay ? 14 : 0), y, R - 14, y,
               { stroke: st, width: lit ? 4.5 : 2.5, glow: lit });
        d.head(R, y, 0, { stroke: st, size: 10 });
        if (twoWay) d.head(L, y, Math.PI, { stroke: st, size: 10 });
        d.text(s === 5 ? 656 : MID, y - 23, label, {
          size: 12.5, weight: 800, align: "center", baseline: "middle",
          fill: lit ? col : c.dim, max: 150
        });
        if (s !== 5) d.text(MID, y + 21, hint, {
          size: 11.5, weight: 600, align: "center", baseline: "middle",
          fill: lit ? c.soft : c.dim, max: 268
        });
      };
      const aLit = s === 1 || (s === 4 && (t < .24 || (t >= .5 && t < .74)));
      const dLit = s === 2 || (s === 4 && !aLit) || s === 5;
      bus(AY, "address bus", "which address - CPU to memory only", false, aLit, c.teal);
      bus(DY, "data bus", "the value itself - in both directions", true, dLit, c.ok);
      bus(CY, "control bus", "read or write, and the reply", true, s === 3, c.violet);

      // ---- the moving thing --------------------------------------------
      const out = (y, p, label, col) =>
        d.chip(d.lerp(L + 24, R - 24, p), y, label, { fill: col, glow: true });
      const back = (y, p, label, col) =>
        d.chip(d.lerp(R - 24, L + 24, p), y, label, { fill: col, glow: true });

      if (s === 0) out(DY, d.seg(t, 0, .9), "program + data", c.ok);
      if (s === 1) out(AY, d.seg(t, .08, .92), "41", c.teal);
      if (s === 2) back(DY, d.seg(t, .08, .92), "ADD 62", c.ok);
      if (s === 3) {
        if (t < .68) out(CY, d.seg(t, .04, .66), "READ", c.violet);
        else back(CY, d.seg(t, .7, .98), "done", c.violet);
      }
      if (s === 4) {
        if (t < .24) out(AY, d.seg(t, 0, .22), "41", c.teal);
        else if (t < .5) back(DY, d.seg(t, .26, .48), "ADD 62", c.ok);
        else if (t < .74) out(AY, d.seg(t, .5, .72), "62", c.teal);
        else back(DY, d.seg(t, .76, .98), "5", c.ok);
        d.chip(866, 412, "trip " + (t < .5 ? 1 : 2) + " of 2", { fill: c.edge, w: 148 });
      }
      if (s === 5) {
        d.chip(510, DY - 34, "fetch its data",
               { fill: c.panel2, stroke: c.bad, w: 132, labelFill: c.soft });
        d.chip(510, DY + 34, "store the answer",
               { fill: c.panel2, stroke: c.bad, w: 132, labelFill: c.soft });
        d.chip(d.lerp(506, 696, d.seg(t, .1, .95)), DY, "fetch instruction",
               { fill: c.ok, w: 132, glow: true });
      }

      // ---- the line that carries the idea ------------------------------
      if (s === 5)
        d.text(36, 412, "The von Neumann bottleneck: everything shares one route, so the CPU waits.",
               { size: 14.5, weight: 800, baseline: "middle", fill: c.bad, max: 760 });
      else
        d.text(36, 412, "Purple rows are instructions, blue rows are data - the one memory holds both.",
               { size: 13, weight: 700, baseline: "middle", fill: c.dim, max: 760 });

      const notes = [
        ["Stored program", "Because the program sits in memory like any other data, the same machine can run a different program just by loading one.", [MEM.x + MEM.w / 2, 227]],
        ["Count the arrowheads", "One arrowhead means one direction. The CPU asks for an address; memory never sends an address back.", [712, AY]],
        ["Two arrowheads", "Reading and writing both use this bus, so its width matters: a wider data bus moves more bits per transfer.", [712, DY]],
        ["Not the data", "Nothing useful travels here. These are the signals that keep the CPU and memory in step with each other.", [712, CY]],
        ["Why it is slow", "Instructions and data queue for the same route, so the CPU cannot collect both at once.", [MEM.x - 14, 227]],
        ["How it is eased", "Cache keeps copies inside the CPU, so many fetches never need the bus at all. It is eased, not removed.", [CSH.x + CSH.w - 40, CSH.y + 36]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // =====================================================================
  // 1.1  What actually makes a CPU faster
  // =====================================================================
  A("cpuperf", function () {
    const W = 980, H = 580;
    const TASKS = 10, TX = 236, TCW = 46, TGAP = 6;
    const TW = TASKS * (TCW + TGAP) - TGAP;          // 236 -> 750
    const LAB = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const FACTS = ["Clock speed", "Number of cores", "Cache size"];

    const steps = [
      { name: "1. The clock", caption: "Every tick of the clock the CPU does a little more work. A task here takes four ticks to finish." },
      { name: "2. Clock speed", caption: "Three times the ticks per second, three times the work in the same time. 3 GHz means three billion ticks a second." },
      { name: "3. Two cores", caption: "Same clock, but two cores means two tasks being worked on at once, so the queue drains twice as fast." },
      { name: "4. If the software allows", caption: "A program written as one single task cannot be split, so the second core has nothing to do and the extra speed never appears." },
      { name: "5. Cache or RAM", caption: "If what the CPU wants is already in cache it arrives in a few cycles. If not, the trip out to RAM takes hundreds." },
      { name: "6. A bigger cache", caption: "A bigger cache holds more, so more requests are hits. Ten requests, same program, very different amounts of waiting." }
    ];

    function lane(d, ly, o) {
      const c = d.c, done = d.clamp(Math.floor(o.prog), 0, TASKS);
      const workers = o.idle ? 1 : (o.cores || 1);
      shell(d, { x: 36, y: ly, w: 180, h: 110 }, undefined, { stroke: o.accent });
      d.text(126, ly + 28, o.name, { size: 16, weight: 800, align: "center",
        baseline: "middle", fill: c.fg, max: 158 });
      d.text(126, ly + 50, o.sub, { size: 11.5, weight: 600, align: "center",
        baseline: "middle", fill: c.soft, max: 158 });

      if (o.cores) {
        for (let i = 0; i < o.cores; i++) {
          const busy = !(o.idle && i === 1);
          d.chip(o.cores === 1 ? 126 : 86 + i * 80, ly + 82,
                 busy ? "core " + (i + 1) : "core 2 idle",
                 { w: 76, h: 22, size: 10.5, fill: busy ? o.accent : c.panel,
                   stroke: busy ? undefined : c.bad,
                   labelFill: busy ? "#0f1626" : c.soft });
        }
      }

      const fills = {}, on = [];
      for (let i = 0; i < done; i++) fills[i] = c.ok;
      for (let i = done; i < Math.min(TASKS, done + workers); i++) on.push(i);
      d.cells(TX, ly + 14, LAB, { cw: TCW, ch: 46, gap: TGAP, fills, on,
                                  accent: o.accent, size: 15 });

      // the clock comb: same width always, so a denser comb means a faster clock
      if (o.ticks) {
        const gapT = TW / (o.ticks - 1), reached = (o.ticks - 1) * o.tt;
        for (let i = 0; i < o.ticks; i++) {
          const hit = i <= reached;
          d.line(TX + i * gapT, ly + 72, TX + i * gapT, ly + 88,
                 { stroke: hit ? o.accent : c.line, width: hit ? 2.4 : 1.4 });
        }
      }

      d.text(766, ly + 36, done + " / " + TASKS, { size: 25, weight: 800,
        fill: done ? c.ok : c.dim, max: 170 });
      d.text(766, ly + 60, "tasks finished", { size: 12, weight: 600,
        fill: c.soft, max: 170 });
      if (o.ticks) d.text(766, ly + 84, o.ticks + " clock ticks", { size: 11.5,
        weight: 700, baseline: "middle", fill: c.dim, max: 170 });
    }

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("What makes a processor faster");

      const active = s <= 1 ? 0 : s <= 3 ? 1 : 2;
      FACTS.forEach((f, i) => {
        const on = i === active;
        d.chip(128 + i * 186, 64, f, { w: 172, h: 28, size: 12.5,
          fill: on ? c.edge : c.panel, stroke: on ? undefined : c.line,
          labelFill: on ? "#0f1626" : c.dim });
      });

      // ---------------------------------------------------- clock + cores
      if (s <= 3) {
        const tt = d.seg(t, .05, .95);
        if (s === 0) {
          lane(d, 184, { name: "1 GHz", sub: "one core", accent: c.info,
                         prog: 12 * tt / 4, ticks: 12, tt });
        } else if (s === 1) {
          lane(d, 118, { name: "1 GHz", sub: "one core", accent: c.info,
                         prog: 12 * tt / 4, ticks: 12, tt });
          lane(d, 250, { name: "3 GHz", sub: "one core", accent: c.ok,
                         prog: 36 * tt / 4, ticks: 36, tt });
        } else {
          lane(d, 118, { name: "2 GHz", sub: "one core", accent: c.info,
                         prog: 16 * tt / 4, cores: 1, ticks: 16, tt });
          lane(d, 250, { name: "2 GHz", sub: "two cores", accent: s === 3 ? c.bad : c.ok,
                         prog: (s === 3 ? 16 : 32) * tt / 4, cores: 2,
                         idle: s === 3, ticks: 16, tt });
        }
        d.line(TX, 400, TX + TW, 400, { stroke: c.line, width: 2 });
        d.dot(d.lerp(TX, TX + TW, tt), 400, 6, { fill: c.edge, glow: true });
        d.text(TX, 424, s === 0 ? "one slice of time, four ticks to a task"
                                : "the same slice of time for both",
               { size: 12, weight: 700, fill: c.dim, max: 360 });
        d.text(766, 400, "elapsed time", { size: 12, weight: 700,
          baseline: "middle", fill: c.dim, max: 170 });
      }

      // ---------------------------------------------------- cache latency
      if (s === 4) {
        const cyc = 200 * d.seg(t, .08, .96);
        d.box(40, 120, 150, 96, { fill: c.panel, stroke: c.line, r: 12,
          label: "CPU", sub: "needs a value" });
        d.box(230, 120, 150, 96, { fill: "#1d4a35", stroke: c.ok, on: true, r: 12,
          label: "Cache", sub: "inside the CPU" });
        d.box(780, 120, 160, 96, { fill: c.panel, stroke: c.bad, r: 12,
          label: "RAM", sub: "off the chip" });
        d.line(194, 168, 226, 168, { stroke: c.ok, width: 3 });
        d.head(230, 168, 0, { stroke: c.ok, size: 8 });
        d.head(190, 168, Math.PI, { stroke: c.ok, size: 8 });
        d.line(394, 168, 772, 168, { stroke: c.bad, width: 3 });
        d.head(778, 168, 0, { stroke: c.bad, size: 8 });
        d.head(382, 168, Math.PI, { stroke: c.bad, size: 8 });
        d.text(585, 148, "a long way, and shared with everything else", {
          size: 12, weight: 700, align: "center", baseline: "middle",
          fill: c.bad, max: 360 });
        d.chip(d.lerp(772, 400, d.seg(t, .08, .96)), 192, "the value",
               { fill: c.bad, w: 92, glow: true });

        d.text(40, 250, "How long the CPU waits", { size: 13, weight: 800,
          fill: c.soft, max: 300 });
        const track = (y, label, col, fill, status) => {
          d.text(40, y, label, { size: 13, weight: 700, baseline: "middle",
            fill: col, max: 130 });
          d.box(180, y - 13, 700, 26, { fill: c.panel, stroke: c.line, r: 7 });
          if (fill > 2) d.box(180, y - 13, fill, 26, { fill: col, stroke: col, r: 7 });
          d.text(880, y - 27, status, { size: 12, weight: 700, align: "right",
            baseline: "middle", fill: col, max: 400 });
        };
        track(296, "Cache hit", c.ok, 4 / 200 * 700, "about 4 cycles - already finished");
        track(360, "Cache miss", c.bad, cyc / 200 * 700,
              "still waiting: " + Math.round(cyc) + " cycles");
        [0, 50, 100, 150, 200].forEach((v, i) =>
          d.text(180 + i * 175, 388, String(v), { size: 11, weight: 600,
            align: "center", baseline: "middle", fill: c.dim, max: 60 }));
        d.text(880, 410, "cycles the CPU spends waiting", { size: 11.5, weight: 600,
          align: "right", baseline: "middle", fill: c.dim, max: 320 });
      }

      // ---------------------------------------------------- hit rate
      if (s === 5) {
        const HIT = [
          { name: "Small cache", sub: "3 hits in 10", y: 132, col: c.bad,
            hits: [0, 0, 1, 0, 0, 0, 1, 0, 1, 0] },
          { name: "Bigger cache", sub: "8 hits in 10", y: 272, col: c.ok,
            hits: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1] }
        ];
        HIT.forEach(r => {
          shell(d, { x: 36, y: r.y, w: 180, h: 78 }, undefined, { stroke: r.col });
          d.text(126, r.y + 30, r.name, { size: 15, weight: 800, align: "center",
            baseline: "middle", fill: c.fg, max: 158 });
          d.text(126, r.y + 52, r.sub, { size: 12, weight: 600, align: "center",
            baseline: "middle", fill: c.soft, max: 158 });
          let cost = 0, shown = 0;
          r.hits.forEach((h, i) => {
            const al = d.seg(t, i * .07, i * .07 + .22);
            if (al > .5) { cost += h ? 4 : 200; shown++; }
            if (al < .02) return;
            d.chip(271 + i * 70, r.y + 30, h ? "Y" : "N",
                   { w: 56, h: 34, size: 15, fill: h ? c.ok : c.bad, alpha: al });
          });
          d.text(936, r.y + 58, shown + " requests so far - about " + cost +
                 " cycles of waiting", { size: 12, weight: 700, align: "right",
            baseline: "middle", fill: r.col, max: 480 });
          d.box(236, r.y + 66, 700, 18, { fill: c.panel, stroke: c.line, r: 6 });
          const w2 = cost / 1412 * 700;
          if (w2 > 2) d.box(236, r.y + 66, w2, 18, { fill: r.col, stroke: r.col, r: 6 });
        });
        d.text(36, 392, "Y = found in cache, about 4 cycles.    N = a trip out to RAM, about 200 cycles.",
               { size: 12.5, weight: 700, fill: c.soft, max: 900 });
        d.text(36, 418, "Same program, same clock speed, same number of cores.",
               { size: 12, weight: 600, fill: c.dim, max: 900 });
      }

      const notes = [
        ["Ticks, not tasks", "Clock speed counts cycles, not finished jobs. A long instruction may need many cycles.", [TX + TW + 20, 236]],
        ["Not the whole story", "Doubling the clock does not double real speed: the CPU still waits for memory and for the disk.", [TX - 14, 282]],
        ["Cores, not clock", "Both combs are the same here. The second lane is quicker only because two cores share the work.", [TX + 160, 338]],
        ["Written to split", "Work has to be broken into parts that can run independently. Plenty of older software never was.", [208, 332]],
        ["Why cache is tiny", "Cache is fast but expensive, so there is only a little of it - megabytes, against gigabytes of RAM.", [305, 226]],
        ["Hit rate is the point", "Cache size helps by raising the share of requests it can answer. Going from 3 hits to 8 cuts the waiting enormously.", [586, 348]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // =====================================================================
  // 1.2  Multitasking: the scheduler and round robin time slices
  // =====================================================================
  A("scheduling", function () {
    const W = 980, H = 580;
    const QUEUE = { x: 36, y: 86, w: 190, h: 230 };
    const CPU = { x: 292, y: 150, w: 180, h: 130 };
    const BLK = { x: 548, y: 150, w: 190, h: 130 };
    const SEEN = { x: 764, y: 150, w: 180, h: 130 };
    const STRIP = { x: 540, y: 80, w: 404, h: 52 };
    const GX = 36, GY = 376, GH = 52;

    const steps = [
      { name: "1. Three processes", caption: "Three programs are running, so three processes are in memory. There is one core, so only one of them can actually be executing." },
      { name: "2. Dispatch", caption: "The scheduler takes the process at the front of the ready queue and gives it the CPU, along with a small slice of time." },
      { name: "3. Time slice over", caption: "When the slice runs out the operating system saves exactly where that process had got to, and starts the next one. That swap is a context switch." },
      { name: "4. Round robin", caption: "Each process gets a turn in order, over and over. The strip along the bottom records which one held the CPU in each slice." },
      { name: "5. Blocked on input", caption: "A process waiting for a keypress cannot use the CPU, so it is set aside and the next ready process runs instead of the CPU sitting idle." },
      { name: "6. Fast enough to fool you", caption: "A slice is only a few milliseconds, so the swapping happens dozens of times a second. It looks simultaneous, but it is taking turns." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("Multitasking: taking turns on one processor");
      const P = [
        { n: "Browser", col: c.info }, { n: "Notes", col: c.violet },
        { n: "Music", col: c.teal }
      ];

      const SEQ = s === 4 ? [0, 1, 2, 0, 2, 0, 2, 0, 2] : [0, 1, 2, 0, 1, 2, 0, 1, 2];
      const SKIP = 4;                                   // the slice Notes misses
      const nSlice = s === 5 ? 18 : 9;
      const sliceW = 900 / nSlice;
      const playhead = s === 0 ? 0
        : s === 1 ? d.lerp(0, .9, d.seg(t, .25, 1))
        : s === 2 ? d.lerp(.9, 2, d.seg(t, .1, .9))
        : s === 3 ? d.lerp(0, 8.6, d.clamp((t - .02) / .94, 0, 1))
        : s === 4 ? d.lerp(3, 8.6, d.clamp((t - .02) / .94, 0, 1))
        : d.lerp(0, 17.6, d.clamp((t - .02) / .94, 0, 1));
      const idx = Math.min(Math.floor(playhead), nSlice - 1);
      const running = s === 0 ? -1 : SEQ[idx % SEQ.length];
      const switches = s === 0 ? 0 : Math.max(0, Math.floor(playhead));
      const blocked = s === 4 ? 1 : -1;

      // ---- ready queue --------------------------------------------------
      shell(d, QUEUE, "Ready queue");
      const inQueue = P.map((p, i) => i).filter(i => i !== running && i !== blocked);
      inQueue.forEach((pi, slot) => {
        const al = s === 0 ? d.seg(t, .1 + pi * .18, .4 + pi * .18) : 1;
        d.box(48, 128 + slot * 56, 166, 48, {
          fill: c.panel, stroke: P[pi].col, label: P[pi].n, size: 15, r: 10, alpha: al
        });
      });
      if (!inQueue.length)
        d.text(131, 160, "empty", { size: 13, weight: 700, align: "center",
          baseline: "middle", fill: c.dim, max: 150 });

      // ---- the CPU ------------------------------------------------------
      shell(d, CPU, "CPU - one core", { stroke: running >= 0 ? c.edge : c.line });
      if (running >= 0)
        d.box(304, 190, 156, 74, {
          fill: "#2a3f68", stroke: P[running].col, on: true, label: P[running].n,
          sub: "running now", size: 17, r: 10
        });
      else
        d.text(382, 225, "nothing yet", { size: 14, weight: 700, align: "center",
          baseline: "middle", fill: c.dim, max: 150 });

      // ---- waiting for input / output -----------------------------------
      shell(d, BLK, "Waiting for input/output", { stroke: blocked >= 0 ? c.orange : c.line });
      if (blocked >= 0)
        d.box(562, 190, 162, 50, { fill: c.panel, stroke: c.orange, on: true,
          label: P[blocked].n, sub: "wants a keypress", size: 15, r: 10,
          alpha: d.seg(t, 0, .3) });
      else
        d.text(643, 215, "nobody waiting", { size: 13, weight: 700, align: "center",
          baseline: "middle", fill: c.dim, max: 160 });

      // ---- what the user sees -------------------------------------------
      shell(d, SEEN, "On screen");
      P.forEach((p, i) => {
        const al = s === 0 ? d.seg(t, .25 + i * .18, .55 + i * .18) : 1;
        d.chip(854, 202 + i * 30, p.n + " - open", { w: 152, h: 24, size: 11.5,
          fill: p.col, alpha: al });
      });

      // ---- the slice clock ----------------------------------------------
      shell(d, STRIP, undefined);
      d.text(556, 106, "Time slice", { size: 13, weight: 800, baseline: "middle",
        fill: c.soft, max: 90 });
      d.box(662, 97, 150, 18, { fill: c.panel, stroke: c.line, r: 6 });
      if (s > 0) {
        const left = 1 - (playhead - Math.floor(playhead));
        d.box(662, 97, Math.max(4, 150 * left), 18, { fill: c.edge, stroke: c.edge, r: 6 });
      }
      d.text(936, 106, switches + " switches", { size: 13, weight: 800,
        align: "right", baseline: "middle", fill: c.edge, max: 110 });

      // ---- the arrows ----------------------------------------------------
      d.arrow(226, 215, 286, 215, { stroke: s === 1 ? c.edge : c.line,
        width: s === 1 ? 3.5 : 2, label: "dispatch", labelSize: 11,
        labelFill: s === 1 ? c.edge : c.dim, ly: -11 });
      d.arrow(478, 205, 542, 205, { stroke: s === 4 ? c.orange : c.line,
        width: s === 4 ? 3.5 : 2, label: "needs input", labelSize: 10.5,
        labelFill: s === 4 ? c.orange : c.dim, ly: -12 });
      const ret = s === 2 ? c.edge : c.line;
      d.path([[336, 280], [336, 302], [140, 302], [140, 312]],
             { stroke: ret, width: s === 2 ? 3.5 : 2 });
      d.head(140, 316, Math.PI / 2, { stroke: ret, size: 8 });
      d.text(282, 293, "slice over", { size: 11, weight: 700, align: "center",
        baseline: "middle", fill: s === 2 ? c.edge : c.dim, max: 100 });
      d.path([[643, 280], [643, 338], [90, 338], [90, 312]],
             { stroke: c.line, width: 2 });
      d.head(90, 316, Math.PI / 2, { stroke: c.line, size: 8 });
      d.text(400, 329, "input arrives - ready again", { size: 11, weight: 700,
        align: "center", baseline: "middle", fill: c.dim, max: 240 });

      // ---- the record of slices ------------------------------------------
      d.box(GX, GY, 900, GH, { fill: c.panel, stroke: c.line, r: 10 });
      if (s === 0)
        d.text(GX + 450, GY + GH / 2, "nothing has had a turn yet", { size: 13,
          weight: 700, align: "center", baseline: "middle", fill: c.dim, max: 400 });
      for (let i = 0; i < nSlice; i++) {
        if (playhead <= i) continue;
        const pi = SEQ[i % SEQ.length], x0 = GX + i * sliceW;
        const part = d.clamp(playhead - i, 0, 1);
        d.box(x0 + 2, GY + 4, Math.max(4, (sliceW - 4) * part), GH - 8, {
          fill: P[pi].col, stroke: P[pi].col, r: 6,
          label: (nSlice > 12 || part < .45) ? "" : P[pi].n,
          size: 12.5, labelFill: "#0f1626"
        });
        if (s === 4 && i === SKIP && part > .4)
          d.text(x0 + sliceW / 2, GY - 12, "Notes was skipped", { size: 11,
            weight: 800, align: "center", baseline: "middle", fill: c.orange, max: 140 });
      }
      if (playhead > 0)
        d.line(GX + playhead * sliceW, GY - 4, GX + playhead * sliceW, GY + GH + 4,
               { stroke: c.edge, width: 2 });
      d.text(GX, 444, "time, one slice at a time  (about 20 ms each)", {
        size: 12, weight: 700, fill: c.dim, max: 420 });
      if (s === 5) d.text(936, 444, "roughly 50 slices every second", {
        size: 12.5, weight: 800, align: "right", baseline: "middle",
        fill: c.edge, max: 320 });

      const notes = [
        ["Program or process?", "A program is the file on disk. A process is that program loaded and running, with its own slice of memory.", [754, 215]],
        ["Not just the front", "Schedulers also use priority, so something time-critical like audio is not left behind a long background job.", [256, 232]],
        ["Switching is not free", "Saving and restoring takes time too, which is why opening far too many programs slows everything down.", [336, 291]],
        ["Round robin", "Everybody gets a turn and nobody is forgotten - a fair scheme, and the easiest one to picture.", [GX + 450, GY + GH + 10]],
        ["Why set it aside", "A keypress can take a whole second in CPU terms. Leaving the core idle for that would waste millions of cycles.", [643, 262]],
        ["One core, truly", "With one core nothing ever runs at the same instant. Several cores can genuinely run several processes at once.", [GX + 820, GY + GH / 2]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // =====================================================================
  // 1.2  User accounts, groups and file permissions
  // =====================================================================
  A("permissions", function () {
    const W = 980, H = 580;
    const USERS = { x: 36, y: 86, w: 216, h: 330 };
    const TABLE = { x: 292, y: 86, w: 652, h: 330 };
    const CX = [752, 828, 904];
    const ACC = [
      { k: "Student", g: "group: students", col: "info" },
      { k: "Teacher", g: "group: staff", col: "violet" },
      { k: "Admin", g: "full control of the machine", col: "bad" }
    ];
    const FILES = [
      { n: "coursework.docx", sub: "in the student's own folder" },
      { n: "lesson-notes.pdf", sub: "shared folder, put there by staff" },
      { n: "marks.xlsx", sub: "staff folder" },
      { n: "paint.exe", sub: "an installed program" }
    ];
    const PERM = [
      [[1, 1, 0], [1, 0, 0], [0, 0, 0], [1, 0, 1]],
      [[1, 0, 0], [1, 1, 0], [1, 1, 0], [1, 0, 1]],
      [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]]
    ];
    const rowY = i => 154 + i * 60;
    const userY = i => 128 + i * 94;

    const steps = [
      { name: "1. Separate accounts", caption: "Everyone who uses the machine gets an account. The operating system then knows who is asking before it hands over any file." },
      { name: "2. Read, write, execute", caption: "Three separate permissions. Being allowed to read a file does not mean being allowed to change it, or to run it." },
      { name: "3. Allowed", caption: "The student opens their own coursework. The operating system checks the permissions, finds read and write, and lets it through." },
      { name: "4. Refused", caption: "The same student tries to open the marks file. No permission, so the request is refused - not hidden, refused." },
      { name: "5. Groups", caption: "Permissions are given to groups, not to one person at a time. The teacher account is in staff, so it reaches every staff file." },
      { name: "6. Why not browse as admin", caption: "Anything you run gets your permissions. As admin, one bad download can rewrite anything on the machine." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("User accounts and file permissions");
      const who = s <= 3 ? 0 : s === 4 ? 1 : 2;
      const perm = PERM[who];
      const target = s === 2 ? 0 : s === 3 ? 2 : -1;

      // ---- accounts -------------------------------------------------------
      shell(d, USERS, "Accounts");
      ACC.forEach((a, i) => {
        const al = s === 0 ? d.seg(t, .08 + i * .2, .4 + i * .2) : 1;
        const on = i === who && s > 0;
        d.box(48, userY(i), 192, 84, {
          fill: on ? "#2a3f68" : c.panel, stroke: c[a.col], on,
          label: a.k, sub: a.g, size: 17, r: 11, alpha: al
        });
      });

      // ---- the table ------------------------------------------------------
      shell(d, TABLE, s === 0 ? "Files on this computer"
                              : "What the " + ACC[who].k + " account may do", {
        stroke: s === 0 ? c.line : c[ACC[who].col],
        titleFill: s === 0 ? c.soft : c[ACC[who].col], size: 13.5 });
      d.text(320, 136, "File", { size: 12, weight: 800, fill: c.dim,
        baseline: "middle", max: 200 });
      ["Read", "Write", "Execute"].forEach((h, j) =>
        d.text(CX[j], 136, h, { size: 12, weight: 800, align: "center",
          baseline: "middle", fill: c.dim, max: 68 }));

      FILES.forEach((f, i) => {
        const y = rowY(i), hot = i === target;
        d.box(304, y, 628, 54, {
          fill: hot ? "#22304e" : c.panel, stroke: hot ? c.edge : c.line, on: hot, r: 10
        });
        d.text(320, y + 21, f.n, { size: 14.5, weight: 700, fill: c.fg, max: 290 });
        d.text(320, y + 39, f.sub, { size: 11, weight: 600, fill: c.dim, max: 290 });

        let reveal = 1;
        if (s === 0) reveal = .3;
        else if (s === 1) reveal = d.seg(t, .08 + i * .12, .34 + i * .12);
        else if (s === 4) reveal = d.seg(t, .08 + i * .12, .34 + i * .12);
        perm[i].forEach((p, j) => {
          if (reveal < .05) return;
          flag(d, CX[j], y + 28, !!p, { alpha: reveal, on: hot && j < 2 });
        });

        if (s === 4 && i >= 1 && i <= 2 && reveal > .6)
          d.text(668, y + 28, "via staff", { size: 12, weight: 800, align: "center",
            baseline: "middle", fill: c.violet, max: 110, alpha: reveal });
        if (s === 5) {
          const al = d.seg(t, .34 + i * .14, .62 + i * .14);
          if (al > .05) d.text(668, y + 28, "could be rewritten", { size: 11.5,
            weight: 800, align: "center", baseline: "middle", fill: c.bad,
            max: 110, alpha: al });
        }
      });

      // ---- an attempt crossing the gap ------------------------------------
      if (target >= 0) {
        if (t < .33) {
          const p = d.onCurve(244, userY(0) + 42, 668, rowY(target) + 28, -40,
                              d.seg(t, .02, .3));
          d.chip(p[0], p[1], "open it", { fill: c.edge, w: 86, glow: true });
        }
        const al = d.seg(t, .3, .45);
        if (al > .05)
          d.chip(668, rowY(target) + 28, s === 2 ? "allowed" : "refused",
                 { fill: s === 2 ? c.ok : c.bad, w: 104, h: 28, alpha: al, glow: true });
      }
      if (s === 5 && t < .34) {
        const p = d.onCurve(244, userY(2) + 42, 650, rowY(0) + 28, -60,
                            d.seg(t, .02, .3));
        d.chip(p[0], p[1], "downloaded file", { fill: c.bad, w: 136, glow: true });
      }

      // ---- what the three permissions mean --------------------------------
      const MEAN = [
        ["Read", "open it and look at what is inside"],
        ["Write", "change it, save over it or delete it"],
        ["Execute", "run it, because it is a program"]
      ];
      MEAN.forEach((m, i) => {
        const al = s === 1 ? d.seg(t, .05 + i * .18, .35 + i * .18) : .45;
        d.box(36 + i * 308, 424, 292, 44, {
          fill: c.panel, stroke: s === 1 ? c.edge : c.line, r: 10,
          label: m[0], sub: m[1], size: 14, subSize: 11, alpha: al
        });
      });

      const notes = [
        ["Who is asking", "Signing in is how the system knows which rules to apply. Without accounts there is only one set of files for everybody.", [90, 108]],
        ["Three, not one", "Exam questions often turn on this: read-only still lets you open a file, it just stops you changing it.", [182, 446]],
        ["Least privilege", "Give each account only what its job needs. The student can change their own work and nothing else.", [866, rowY(0) + 28]],
        ["Refused, not hidden", "The file is still there. The operating system simply will not open it for this account, so the data stays private.", [866, rowY(2) + 28]],
        ["Why groups", "A school has a thousand students. Setting permissions one by one would be impossible to keep right.", [866, rowY(2) + 28]],
        ["Use a normal account", "Sign in as a standard user for everyday work, and only become admin to install something. Every Write here says Y, which is the danger.", [866, rowY(1) + 28]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });

  // =====================================================================
  // 1.2  Fragmentation and defragmentation
  // =====================================================================
  A("defrag", function () {
    const N = 24, BX = 36, BCW = 34, BGAP = 3, BCH = 38;
    const at = i => BX + i * (BCW + BGAP);
    const mid = i => at(i) + BCW / 2;
    const AY = 146, BY = 268;
    const HA = AY + BCH + 22, HB = BY + BCH + 22;       // the head travel lines

    // one line per state of the same 24 blocks. F is the file we follow.
    const CLEAN = "AAABBBBCCDDDEEGGGHH-----";
    const GAPS  = "AAA----CC---EE---HH-----";
    const FRAG  = "AAAFFFFCCFFFEEFFFHHFF---";
    const TIDY  = "AAACCEEHHFFFFFFFFFFFF---";
    // where each block of the tidy layout came from
    const SRC = [0, 1, 2, 7, 8, 12, 13, 17, 18, 3, 4, 5, 6, 9, 10, 11, 14, 15, 16, 19, 20];
    const RUNS = [[3, 6], [9, 11], [14, 16], [19, 20]];   // the four pieces of F
    const SIZES = [["A", 3], ["B", 4], ["C", 2], ["D", 3],
                   ["E", 2], ["G", 3], ["H", 2], ["free", 5]];

    const steps = [
      { name: "1. Blocks", caption: "A hard disk is divided into blocks of a fixed size. A file is given as many blocks as it needs, and at first they are next to each other." },
      { name: "2. Gaps appear", caption: "Files are deleted, leaving gaps. A new file of twelve blocks will not fit in any single gap, so it is split across four of them." },
      { name: "3. Collecting the pieces", caption: "To read that file the head has to move to each piece in turn. Four separate trips for one file." },
      { name: "4. Defragmenting", caption: "The utility moves blocks about so each file sits in one run, and gathers the free space together at the end." },
      { name: "5. One sweep", caption: "Now the same file is one run of blocks. The head moves into position once and reads straight through." },
      { name: "6. Not for SSDs", caption: "A solid state drive has no head to move, so scattered blocks cost it nothing - and defragmenting one only wears it out." }
    ];

    // yellow is the file we are following, purple is every other file
    const colOf = (d, ch) => ch === "F" ? d.c.edge : d.c.violet;

    function block(d, i, by, ch, o) {
      o = o || {};
      const c = d.c, free = ch === "-", col = colOf(d, ch);
      d.box(o.x === undefined ? at(i) : o.x, by, BCW, BCH, {
        fill: free ? "#131e34" : (o.on ? "#2a3f68" : c.panel),
        stroke: free ? c.line : col, on: !!o.on, r: 6,
        label: free ? "" : ch, size: 15, alpha: o.alpha,
        labelFill: free ? c.dim : col
      });
    }
    function row(d, by, str, o) {
      o = o || {};
      for (let i = 0; i < N; i++) {
        const al = o.alphaOf ? o.alphaOf(i) : o.alpha;
        if (al !== undefined && al < .02) continue;
        block(d, i, by, str[i], { alpha: al, on: o.lit && o.lit.indexOf(i) >= 0 });
      }
    }
    function headAt(d, hy, x, col) {
      d.line(BX, hy, at(N - 1) + BCW, hy, { stroke: d.c.line, width: 1.6, dash: [5, 5] });
      d.line(x, hy - 33, x, hy - 11, { stroke: col, width: 2 });
      d.chip(x, hy, "head", { w: 58, h: 22, size: 11, fill: col, glow: true });
    }

    return { w: 980, h: 580, steps, render(d, s, t) {
      const c = d.c;
      d.title("Fragmentation and defragmentation");

      // --------------------------------------------------- the upper track
      // Step 4 draws both track labels on plates of their own further down, so
      // drawing this one as well put "Before defragmenting" on top of itself.
      const topLabel = s === 5 ? "Magnetic hard disk - one head, and it has to move"
        : s === 2 ? "Reading video.mp4"
        : s === 4 ? "Before defragmenting" : "The disk, block by block";
      if (s !== 3) d.text(BX, 118, topLabel, { size: 13.5, weight: 800, baseline: "middle",
        fill: c.soft, max: 520 });

      if (s === 0) {
        row(d, AY, CLEAN, { alphaOf: i => d.seg(t, i * .028, i * .028 + .2) });
      } else if (s === 1) {
        row(d, AY, GAPS, {});
        const gone = 1 - d.seg(t, .04, .22);
        for (let i = 0; i < N; i++)
          if (CLEAN[i] !== "-" && GAPS[i] === "-" && gone > .02)
            block(d, i, AY, CLEAN[i], { alpha: gone });
        let k = 0;
        for (let i = 0; i < N; i++) if (FRAG[i] === "F") {
          const al = d.seg(t, .26 + k * .045, .38 + k * .045);
          k++;
          if (al > .02) block(d, i, AY, "F", { alpha: al, on: true });
        }
      } else if (s === 3) {
        row(d, AY, FRAG, { alpha: .22 });
      } else if (s === 2) {
        const order = [];
        RUNS.forEach(r => { for (let i = r[0]; i <= r[1]; i++) order.push(i); });
        const n = Math.floor(d.seg(t, .06, .96) * order.length + 1e-4);
        row(d, AY, FRAG, { lit: order.slice(0, n) });
      } else {
        row(d, AY, FRAG, {});
      }

      // --------------------------------------------------- the lower track
      if (s === 3) {
        for (let i = 0; i < N; i++)
          d.box(at(i), BY, BCW, BCH, { fill: "#131e34", stroke: c.line, r: 6 });
        SRC.forEach((src, dst) => {
          const p = d.seg(t, dst * .022, dst * .022 + .5);
          block(d, dst, d.lerp(AY, BY, p), FRAG[src],
                { x: d.lerp(at(src), at(dst), p), on: p < .98 });
        });
        // the labels go on last, on a plate, so sliding blocks cannot hide them
        [[118, "Before defragmenting"], [240, "After defragmenting"]].forEach(l => {
          d.box(30, l[0] - 13, 196, 26, { fill: "#0e1628", stroke: "#0e1628", r: 4 });
          d.text(BX, l[0], l[1], { size: 13.5, weight: 800, baseline: "middle",
            fill: c.soft, max: 186 });
        });
      } else if (s === 4) {
        d.text(BX, 240, "After defragmenting", { size: 13.5, weight: 800,
          baseline: "middle", fill: c.soft, max: 520 });
        const order = [];
        for (let i = 9; i <= 20; i++) order.push(i);
        const n = Math.floor(d.seg(t, .12, .92) * order.length + 1e-4);
        row(d, BY, TIDY, { lit: order.slice(0, n) });
      } else if (s === 5) {
        d.text(BX, 240, "Solid state drive - no moving parts at all", {
          size: 13.5, weight: 800, baseline: "middle", fill: c.soft, max: 520 });
        const pul = .65 + .35 * d.pulse(t * 2);
        for (let i = 0; i < N; i++) {
          const isF = FRAG[i] === "F";
          block(d, i, BY, FRAG[i], { on: isF, alpha: isF ? pul : 1 });
        }
        d.text(BX, HB, "every block answers in the same time, so the order does not matter",
          { size: 12.5, weight: 700, baseline: "middle", fill: c.ok, max: 880 });
      }

      // --------------------------------------------------- the read head
      if (s === 2) {
        const pts = [[mid(0), 0]];
        RUNS.forEach(r => { pts.push([mid(r[0]), 0]); pts.push([mid(r[1]), 0]); });
        const frac = d.seg(t, .06, .96);
        const p = d.onPath(pts, frac);
        let moves = 1;
        RUNS.forEach((r, i) => { if (frac > (i + .05) / RUNS.length) moves = i + 1; });
        RUNS.forEach((r, i) =>
          d.text((mid(r[0]) + mid(r[1])) / 2, 132, "piece " + (i + 1), {
            size: 11, weight: 800, align: "center", baseline: "middle",
            fill: c.edge, max: 110 }));
        headAt(d, HA, p[0], c.edge);
        d.text(936, 118, "head moves: " + moves, { size: 13, weight: 800,
          align: "right", baseline: "middle", fill: c.bad, max: 220 });
      } else if (s === 4) {
        headAt(d, HB, mid(9 + d.seg(t, .12, .92) * 11), c.ok);
        d.text(936, 118, "head moves: 4", { size: 13, weight: 800, align: "right",
          baseline: "middle", fill: c.bad, max: 220 });
        d.text(936, 240, "head moves: 1", { size: 13, weight: 800, align: "right",
          baseline: "middle", fill: c.ok, max: 220 });
      } else if (s === 5) {
        headAt(d, HA, mid(3 + 16 * d.seg(t, .08, .92)), c.bad);
        d.text(936, 118, "head moves: 4", { size: 13, weight: 800, align: "right",
          baseline: "middle", fill: c.bad, max: 220 });
        d.text(936, 240, "no head at all", { size: 13, weight: 800, align: "right",
          baseline: "middle", fill: c.ok, max: 220 });
      }

      // --------------------------------------------------- the lower band
      if (s <= 2) {
        const leg = [["F", "video.mp4 - the file we follow", c.edge],
                     ["A", "other files on the disk", c.violet],
                     ["", "free blocks", c.dim]];
        leg.forEach((g, i) => {
          const x0 = BX + i * 300;
          d.box(x0, 246, 30, 30, { fill: g[0] ? c.panel : "#131e34",
            stroke: g[0] ? g[2] : c.line, r: 6, label: g[0], size: 14, labelFill: g[2] });
          d.text(x0 + 42, 261, g[1], { size: 12.5, weight: 700, baseline: "middle",
            fill: g[2], max: 250 });
        });
      }
      if (s === 0) {
        d.text(BX, 320, "What is on the disk now", { size: 12.5, weight: 800,
          baseline: "middle", fill: c.dim, max: 400 });
        SIZES.forEach((f, i) => {
          const al = d.seg(t, .25 + i * .06, .5 + i * .06);
          d.chip(BX + 56 + i * 114, 352, f[0] + " - " + f[1] + " blocks",
                 { w: 110, h: 26, size: 11, fill: f[0] === "free" ? c.panel : c.violet,
                   stroke: f[0] === "free" ? c.line : undefined,
                   labelFill: f[0] === "free" ? c.soft : "#0f1626", alpha: al });
        });
      }
      if (s === 1)
        d.text(BX, 330, "B, D and G are deleted. video.mp4 then needs 12 blocks, and the biggest single gap is only 4.",
               { size: 13, weight: 700, baseline: "middle",
                 fill: d.seg(t, .25, .5) > .5 ? c.edge : c.dim, max: 900 });

      if (s === 2 || s === 4) {
        const bar = (y, label, n, col) => {
          d.text(BX, y, label, { size: 12.5, weight: 700, baseline: "middle",
            fill: col, max: 230 });
          d.box(276, y - 14, 240, 28, { fill: c.panel, stroke: c.line, r: 7 });
          d.box(276, y - 14, 60 * n, 28, { fill: col, stroke: col, r: 7,
            label: n + (n === 1 ? " trip" : " trips"), size: 13, labelFill: "#0f1626" });
        };
        if (s === 2) bar(340, "Scattered across four pieces", 4, c.bad);
        if (s === 4) {
          bar(372, "Scattered across four pieces", 4, c.bad);
          bar(414, "Gathered into one run", 1, c.ok);
        }
      }
      if (s === 5) {
        d.text(BX, 372, "Magnetic hard disk: defragmenting really does cut the time spent seeking.",
               { size: 13, weight: 700, baseline: "middle", fill: c.soft, max: 900 });
        d.text(BX, 402, "Solid state drive: never defragment one. The drive looks after itself.",
               { size: 13, weight: 700, baseline: "middle", fill: c.ok, max: 900 });
      }

      const notes = [
        ["Why blocks", "The drive can only read or write a whole block at a time, so a tiny file still uses one complete block.", [mid(5), AY + BCH + 8]],
        ["Nothing is broken", "A fragmented file is complete and correct. The only cost is the time spent reaching all its pieces.", [mid(15), AY + BCH + 8]],
        ["Where the time goes", "Moving the head is mechanical, measured in milliseconds. Reading the blocks once it is there is far quicker.", [mid(22), HA]],
        ["It writes a lot", "Defragmenting shifts huge numbers of blocks about, so it is run when the machine is not needed - and never on a drive that is nearly full.", [mid(22), BY + BCH + 8]],
        ["The honest size of the win", "Four trips against one looks small. A real disk holds millions of blocks, and files in hundreds of pieces.", [mid(22), BY + BCH + 8]],
        ["Wear, not speed", "Flash cells only survive so many writes. Defragmenting an SSD spends that lifetime for no gain at all.", [mid(22), BY + BCH + 8]]
      ];
      foot(d, steps, s, t, notes[s]);
    } };
  });
})();
