/* Revise 360 - the diagrams themselves. js/diagrams.js holds the engine.
 *
 * Each one is R360Diagrams.add(name, () => ({ w, h, steps, render })). See the
 * header of js/diagrams.js for the drawing helper, and `fde` below for the
 * house style: one idea per step, something moving, one annotation that says
 * the thing the picture alone cannot.
 */
(function () {
  "use strict";
  const A = window.R360Diagrams.add;

  // ---------------------------------------------------------------- 1.1
  /* The fetch-execute cycle. The single hardest thing in 1.1 to carry in text:
   * five registers, two buses and memory, and the whole point is the order. */
  A("fde", function () {
    const W = 980, H = 580;
    // The registers sit on the right of the CPU, next to memory, so the two
    // buses run straight out of them. With the registers on the left the address
    // bus had to cross the control unit to get anywhere.
    const CPU = { x: 40, y: 64, w: 560, h: 404 };
    const MEM = { x: 740, y: 64, w: 200, h: 404 };
    const CU = { x: 68, y: 118, w: 220, h: 112 };
    const ALU = { x: 68, y: 258, w: 220, h: 112 };
    const RX = 330, RW = 250;
    const reg = i => ({ x: RX, y: 104 + i * 70, w: RW, h: 54 });
    const R = { PC: reg(0), MAR: reg(1), MDR: reg(2), CIR: reg(3), ACC: reg(4) };
    const ABUS_Y = R.MAR.y + 27, DBUS_Y = R.MDR.y + 27;

    const steps = [
      { name: "1. Address", caption: "The program counter holds the address of the next instruction. That address is copied into the memory address register." },
      { name: "2. Address bus", caption: "The address travels to main memory along the address bus. This bus only ever carries addresses, and only ever away from the CPU." },
      { name: "3. Fetch", caption: "Memory finds what is stored at that address and sends it back along the data bus into the memory data register." },
      { name: "4. Decode", caption: "The instruction moves into the current instruction register, and the control unit works out what it means: which operation, and on what data." },
      { name: "5. Execute", caption: "The control unit sets the rest of the CPU to work. Here the ALU adds, and the result is held in the accumulator." },
      { name: "6. Increment", caption: "The program counter moves on to the next address, and the whole cycle begins again - billions of times a second." }
    ];

    return { w: W, h: H, steps, render(d, s, t) {
      const c = d.c;
      d.title("The fetch - decode - execute cycle");

      d.box(CPU.x, CPU.y, CPU.w, CPU.h, { fill: "#16233c", stroke: c.line, r: 16 });
      d.text(CPU.x + 18, CPU.y + 24, "CPU", { size: 15, weight: 800, fill: c.soft, baseline: "middle" });
      d.box(MEM.x, MEM.y, MEM.w, MEM.h, { fill: "#16233c", stroke: c.line, r: 16 });
      d.text(MEM.x + 16, MEM.y + 24, "Main memory (RAM)", { size: 13, weight: 800, fill: c.soft, baseline: "middle" });

      const rows = ["100  LOAD 200", "101  ADD 201", "102  STORE 202", "200  14", "201  9", "202  --"];
      rows.forEach((r, i) => {
        const on = s >= 1 && s <= 3 && i === 1;
        d.box(MEM.x + 16, MEM.y + 52 + i * 56, MEM.w - 32, 44,
              { fill: on ? "#2a3f68" : c.panel, stroke: on ? c.teal : c.line, on,
                label: s >= 4 && i === 5 ? "202  23" : r, size: 13.5 });
      });

      const bOn = n => s === n;
      d.arrow(RX + RW + 6, ABUS_Y, MEM.x - 6, ABUS_Y,
              { stroke: bOn(1) ? c.teal : c.line, width: bOn(1) ? 4 : 2.5, glow: bOn(1),
                label: "address bus", labelFill: bOn(1) ? c.teal : c.dim, ly: -22 });
      d.arrow(MEM.x - 6, DBUS_Y, RX + RW + 6, DBUS_Y,
              { stroke: bOn(2) ? c.ok : c.line, width: bOn(2) ? 4 : 2.5, glow: bOn(2),
                label: "data bus", labelFill: bOn(2) ? c.ok : c.dim, ly: 24 });

      const lit = { 0: ["PC", "MAR"], 1: ["MAR"], 2: ["MDR"], 3: ["MDR", "CIR"], 4: ["ACC"], 5: ["PC"] }[s] || [];
      const vals = { PC: s >= 5 ? "102" : "101", MAR: s >= 1 ? "101" : "--",
                     MDR: s >= 2 ? "ADD 201" : "--", CIR: s >= 3 ? "ADD 201" : "--",
                     ACC: s >= 4 ? "23" : "14" };
      d.text(RX, 96, "Registers", { size: 12, weight: 700, fill: c.dim, baseline: "bottom" });
      Object.keys(R).forEach(k => {
        const r = R[k], on = lit.indexOf(k) >= 0;
        d.box(r.x, r.y, r.w, r.h, { fill: on ? "#2a3f68" : c.panel, stroke: on ? c.edge : c.line,
                                    on, label: k + "   " + vals[k], size: 15 });
      });

      const cuOn = s === 3 || s === 4;
      d.box(CU.x, CU.y, CU.w, CU.h, { fill: cuOn ? "#3a2a56" : c.panel, stroke: cuOn ? c.violet : c.line,
                                      on: cuOn, label: "Control unit", sub: "decodes, then directs", r: 12 });
      d.box(ALU.x, ALU.y, ALU.w, ALU.h, { fill: s === 4 ? "#1d4a35" : c.panel, stroke: s === 4 ? c.ok : c.line,
                                          on: s === 4, label: "ALU", r: 12,
                                          sub: s === 4 ? "14 + 9 = 23" : "arithmetic and logic" });

      const mid = r => [r.x + r.w / 2, r.y + r.h / 2];
      const fly = (from, to, label, col, bend) => {
        const p = d.onCurve(from[0], from[1], to[0], to[1], bend === undefined ? -40 : bend, d.seg(t, .15, .85));
        d.chip(p[0], p[1], label, { fill: col, glow: true });
      };
      if (s === 0) fly([R.PC.x + 40, R.PC.y + 27], [R.MAR.x + 40, R.MAR.y + 27], "101", c.edge, -46);
      if (s === 1) d.chip(d.lerp(RX + RW + 20, MEM.x - 20, d.seg(t, .1, .9)), ABUS_Y, "101", { fill: c.teal, glow: true });
      if (s === 2) d.chip(d.lerp(MEM.x - 20, RX + RW + 20, d.seg(t, .1, .9)), DBUS_Y, "ADD 201", { fill: c.ok, glow: true });
      if (s === 3) fly([R.MDR.x + 40, R.MDR.y + 27], [R.CIR.x + 40, R.CIR.y + 27], "ADD 201", c.edge, -46);
      if (s === 4) fly([CU.x + CU.w / 2, CU.y + CU.h], [ALU.x + ALU.w / 2, ALU.y], "do it", c.violet, 0);
      if (s === 5) d.chip(R.PC.x + RW - 46, R.PC.y + 27, "+1", { fill: c.edge, glow: true, alpha: d.seg(t, .1, .5) });

      const notes = [
        ["Why two registers?", "The PC remembers where we are up to. The MAR holds the one address being looked up right now.", [R.PC.x, R.PC.y + 27]],
        ["One way only", "Addresses go out, never back, so this bus is drawn with a single arrowhead.", [(RX + RW + MEM.x) / 2, ABUS_Y - 12]],
        ["Both ways", "The data bus is bidirectional: it carries values to memory as well as back from it.", [(RX + RW + MEM.x) / 2, DBUS_Y + 12]],
        ["Decode is a lookup", "The control unit matches the instruction against the set of operations this CPU was built to carry out.", [CU.x + CU.w, CU.y + CU.h / 2]],
        ["The accumulator", "A register that holds the result of the last calculation, ready for the next one.", [R.ACC.x, R.ACC.y + 27]],
        ["Not always +1", "A jump instruction writes a different address into the PC. That is how loops and branches work.", [R.PC.x, R.PC.y + 27]]
      ];
      const n = notes[s];
      d.caption(steps[s].caption);
      if (n) d.note(590, 492, n[1], { title: n[0], to: n[2], w: 360, anchor: "centre", alpha: d.seg(t, 0, .25) });
    } };
  });
})();
