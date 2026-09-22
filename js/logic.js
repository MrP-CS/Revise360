// Revise 360 logic engine: Boolean expressions, logic diagrams, and three interactive boards
// (circuit builder, expression builder, truth table). Boards draw to a canvas and take
// abstract pointer events, so the same code works with a mouse and in VR.
(function () {
  // ---------------- expressions ----------------
  function tokenize(src) {
    const out = [], re = /\s*(AND|OR|NOT|∧|∨|¬|\(|\)|[A-Za-z])\s*/gy; let m, i = 0;
    src = String(src).trim();
    while (i < src.length) {
      re.lastIndex = i; m = re.exec(src); if (!m) throw new Error("I don't recognise '" + src.slice(i, i + 5) + "'");
      let t = m[1].toUpperCase(); if (t === "∧") t = "AND"; if (t === "∨") t = "OR"; if (t === "¬") t = "NOT"; out.push(t); i = re.lastIndex;
    }
    return out;
  }
  function parse(src) {
    const toks = Array.isArray(src) ? src.slice() : tokenize(src); let p = 0;
    const peek = () => toks[p], eat = t => { if (toks[p] !== t) throw new Error(t === ")" ? "A bracket isn't closed." : "Expected " + t); p++; };
    function expr() { let n = term(); while (peek() === "OR") { p++; n = { op: "OR", a: n, b: term() }; } return n; }
    function term() { let n = factor(); while (peek() === "AND") { p++; n = { op: "AND", a: n, b: factor() }; } return n; }
    function factor() {
      const t = peek();
      if (t === "NOT") { p++; return { op: "NOT", a: factor() }; }
      if (t === "(") { p++; const n = expr(); eat(")"); return n; }
      if (t && /^[A-Z]$/.test(t)) { p++; return { v: t }; }
      throw new Error(t === undefined ? "The expression ends too early." : "'" + t + "' is in the wrong place.");
    }
    if (!toks.length) throw new Error("The expression is empty.");
    const n = expr(); if (p < toks.length) throw new Error("'" + toks[p] + "' is in the wrong place."); return n;
  }
  const evalN = (n, env) => n.v ? env[n.v] : n.op === "NOT" ? !evalN(n.a, env) : n.op === "AND" ? (evalN(n.a, env) && evalN(n.b, env)) : (evalN(n.a, env) || evalN(n.b, env));
  function vars(n, s) { s = s || new Set(); if (n.v) s.add(n.v); else { vars(n.a, s); if (n.b) vars(n.b, s); } return [...s].sort(); }
  function rows(vs) { const r = []; for (let i = 0; i < 1 << vs.length; i++) { const e = {}; vs.forEach((v, j) => e[v] = !!(i >> (vs.length - 1 - j) & 1)); r.push(e); } return r; }
  function text(n, parent) {
    if (n.v) return n.v;
    if (n.op === "NOT") return "NOT " + (n.a.v || n.a.op === "NOT" ? text(n.a, "NOT") : "(" + text(n.a) + ")");
    const s = text(n.a, n.op) + " " + n.op + " " + text(n.b, n.op);
    return parent && parent !== n.op ? "(" + s + ")" : s;
  }

  // ---------------- drawing gates ----------------
  const C = { bg: "#0e1628", grid: "#16223a", line: "#3c5a87", fg: "#f0f4fa", soft: "#b4c4dc", edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", wire: "#7fb2ff", on: "#50dc96" };
  const GW = 110, GH = 70;
  function gatePath(x, type, px, py, w, h) {
    x.beginPath();
    if (type === "AND") { x.moveTo(px, py); x.lineTo(px + w * .5, py); x.arc(px + w * .5, py + h / 2, h / 2, -Math.PI / 2, Math.PI / 2); x.lineTo(px, py + h); x.closePath(); }
    else if (type === "OR") { x.moveTo(px, py); x.quadraticCurveTo(px + w * .6, py, px + w, py + h / 2); x.quadraticCurveTo(px + w * .6, py + h, px, py + h); x.quadraticCurveTo(px + w * .25, py + h / 2, px, py); x.closePath(); }
    else { x.moveTo(px, py); x.lineTo(px + w * .8, py + h / 2); x.lineTo(px, py + h); x.closePath(); }
  }
  function drawGate(x, type, px, py, opts) {
    opts = opts || {}; const w = opts.w || GW, h = opts.h || GH;
    gatePath(x, type, px, py, w, h); x.fillStyle = opts.fill || "#1c2c4a"; x.fill(); x.lineWidth = opts.lw || 4; x.strokeStyle = opts.stroke || C.fg; x.stroke();
    if (type === "NOT") { x.beginPath(); x.arc(px + w * .8 + 9, py + h / 2, 9, 0, 7); x.fillStyle = "#1c2c4a"; x.fill(); x.stroke(); }
    if (opts.label !== false) { x.fillStyle = opts.labelColor || C.soft; x.font = "bold 17px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(type, px + (type === "NOT" ? w * .32 : w * .42), py + h / 2); }
  }
  const inPorts = (g) => g.type === "NOT" ? [{ x: g.x - 14, y: g.y + GH / 2 }] : [{ x: g.x - 14, y: g.y + 18 }, { x: g.x - 14, y: g.y + GH - 18 }];
  const outPort = (g) => ({ x: g.x + GW + (g.type === "NOT" ? 14 : 12), y: g.y + GH / 2 });
  function wirePath(x, a, b, color, lw) {
    x.beginPath(); x.moveTo(a.x, a.y); const mx = (a.x + b.x) / 2; x.bezierCurveTo(Math.max(mx, a.x + 30), a.y, Math.min(mx, b.x - 30), b.y, b.x, b.y);
    x.strokeStyle = color || C.wire; x.lineWidth = lw || 5; x.stroke();
  }
  function stub(x, a, b) { x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.strokeStyle = C.fg; x.lineWidth = 4; x.stroke(); }

  // Draw an expression as a standard logic diagram inside a box
  function drawDiagram(x, node, box, opts) {
    opts = opts || {}; const labels = opts.labels || {};
    const depth = n => n.v ? 0 : 1 + Math.max(depth(n.a), n.b ? depth(n.b) : 0);
    const D = depth(node); let leaf = 0; const leaves = [];
    (function count(n) { if (n.v) leaves.push(n); else { count(n.a); if (n.b) count(n.b); } })(node);
    const colW = Math.min(190, (box.w - 150) / Math.max(1, D)), rowH = Math.min(90, (box.h - 20) / Math.max(1, leaves.length));
    const top = box.y + (box.h - rowH * leaves.length) / 2 + rowH / 2;
    function place(n, d) {
      if (n.v) { n._x = box.x + 40; n._y = top + rowH * leaf++; return; }
      place(n.a, d + 1); if (n.b) place(n.b, d + 1);
      n._x = box.x + 90 + (D - d - 1) * colW; n._y = n.b ? (n.a._y + n.b._y) / 2 : n.a._y;
    }
    place(node, 0);
    const outOf = n => n.v ? { x: n._x + 22, y: n._y } : { x: n._x + GW * .8 + (n.op === "NOT" ? 18 : GW * .2), y: n._y };
    (function draw(n) {
      if (n.v) { x.fillStyle = C.fg; x.font = "bold 30px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(n.v, n._x, n._y); return; }
      draw(n.a); if (n.b) draw(n.b);
      const gx = n._x, gy = n._y - GH / 2;
      const ins = n.op === "NOT" ? [{ x: gx, y: n._y }] : [{ x: gx + 6, y: gy + 18 }, { x: gx + 6, y: gy + GH - 18 }];
      [n.a, n.b].forEach((c, i) => { if (!c) return; const o = outOf(c), t = ins[i]; x.beginPath(); x.moveTo(o.x, o.y); const mx = (o.x + t.x) / 2 - 10; x.lineTo(mx, o.y); x.lineTo(mx, t.y); x.lineTo(t.x, t.y); x.strokeStyle = C.fg; x.lineWidth = 4; x.stroke(); });
      drawGate(x, n.op, gx, gy, { label: opts.gateLabels !== false });
      const key = text(n); if (labels[key]) { const o = outOf(n); x.fillStyle = C.edge; x.font = "bold 22px Segoe UI, sans-serif"; x.textAlign = "left"; x.fillText(labels[key], o.x + 6, o.y - 16); }
    })(node);
    const o = outOf(node); x.beginPath(); x.moveTo(o.x, o.y); x.lineTo(o.x + 40, o.y); x.strokeStyle = C.fg; x.lineWidth = 4; x.stroke();
    x.fillStyle = C.fg; x.font = "bold 30px Segoe UI, sans-serif"; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText(opts.out || "Q", o.x + 48, o.y);
  }

  function roundRect(x, px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
  function base(W, H) { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
  function clearBg(x, W, H) { x.fillStyle = C.bg; x.fillRect(0, 0, W, H); x.strokeStyle = C.grid; x.lineWidth = 1; for (let i = 0; i < W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let j = 0; j < H; j += 40) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); } }

  // ---------------- 1. circuit builder ----------------
  function CircuitBoard(opts) {
    const W = 1000, H = 620, cv = base(W, H), x = cv.getContext("2d"), vs = opts.inputs, hit = opts.hit || 26;
    const st = { gates: [], wires: [], drag: null, ptr: null, locked: false, bad: null, id: 1 };
    const terms = vs.map((v, i) => ({ id: "in" + v, v, x: 40, y: 150 + (i + .5) * (430 / vs.length) }));
    const outNode = { id: "Q", x: 950, y: 365 };
    const PAL = [["AND", 30], ["OR", 190], ["NOT", 350]], BIN = { x: 830, y: 12, w: 150, h: 66 };
    const srcPort = id => { if (id.startsWith("in")) { const t = terms.find(t => t.id === id); return { x: t.x + 34, y: t.y }; } const g = st.gates.find(g => g.id === id); return g && outPort(g); };
    const dstPort = (id, k) => id === "Q" ? { x: outNode.x - 34, y: outNode.y } : inPorts(st.gates.find(g => g.id === id))[k];
    function findPort(px, py, kind) {
      let best = null, bd = hit;
      const test = (p, info) => { const d = Math.hypot(p.x - px, p.y - py); if (d < bd) { bd = d; best = info; } };
      if (kind !== "in") { terms.forEach(t => test(srcPort(t.id), { kind: "out", id: t.id })); st.gates.forEach(g => test(outPort(g), { kind: "out", id: g.id })); }
      if (kind !== "out") { st.gates.forEach(g => inPorts(g).forEach((p, k) => test(p, { kind: "in", id: g.id, k }))); test(dstPort("Q"), { kind: "in", id: "Q", k: 0 }); }
      return best;
    }
    const gateAt = (px, py) => [...st.gates].reverse().find(g => px >= g.x - 4 && px <= g.x + GW + 10 && py >= g.y - 4 && py <= g.y + GH + 4);
    function draw() {
      clearBg(x, W, H);
      x.fillStyle = "#15223b"; x.fillRect(0, 0, W, 90); x.strokeStyle = C.line; x.beginPath(); x.moveTo(0, 90); x.lineTo(W, 90); x.stroke();
      PAL.forEach(([t, px]) => drawGate(x, t, px + 18, 10, { w: 100, h: 62, labelColor: C.fg }));
      x.fillStyle = C.soft; x.font = "15px Segoe UI, sans-serif"; x.textAlign = "left"; x.fillText("Drag a gate onto the board", 510, 36); x.fillText("Drag from an output ● to an input ○ to wire it", 510, 60);
      roundRect(x, BIN.x, BIN.y, BIN.w, BIN.h, 12); x.fillStyle = st.drag && st.drag.gate && overBin(st.ptr) ? "#5a1d24" : "#2a1c24"; x.fill(); x.strokeStyle = C.bad; x.lineWidth = 3; x.stroke();
      x.fillStyle = C.bad; x.font = "bold 20px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🗑 Bin", BIN.x + BIN.w / 2, BIN.y + BIN.h / 2);
      st.wires.forEach(w => wirePath(x, srcPort(w.from), dstPort(w.to, w.k), st.locked ? (st.bad ? C.bad : C.ok) : C.wire));
      if (st.drag && st.drag.wire) wirePath(x, srcPort(st.drag.from), st.ptr, C.edge, 4);
      terms.forEach(t => { x.fillStyle = C.fg; x.font = "bold 34px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(t.v, t.x, t.y); stub(x, { x: t.x + 18, y: t.y }, srcPort(t.id)); });
      stub(x, dstPort("Q"), { x: outNode.x - 18, y: outNode.y }); x.fillStyle = C.fg; x.font = "bold 34px Segoe UI, sans-serif"; x.fillText("Q", outNode.x, outNode.y);
      st.gates.forEach(g => { inPorts(g).forEach(p => stub(x, p, { x: g.x + 4, y: p.y })); stub(x, { x: g.x + GW * .8 + (g.type === "NOT" ? 18 : GW * .2), y: g.y + GH / 2 }, outPort(g)); drawGate(x, g.type, g.x, g.y, { labelColor: C.fg }); });
      const hov = st.ptr && !st.locked ? findPort(st.ptr.x, st.ptr.y, st.drag && st.drag.wire ? "in" : null) : null;
      const dot = (p, filled, hl) => { x.beginPath(); x.arc(p.x, p.y, hl ? 13 : 9, 0, 7); x.fillStyle = filled ? C.edge : C.bg; x.fill(); x.lineWidth = 4; x.strokeStyle = hl ? "#fff" : C.edge; x.stroke(); };
      terms.forEach(t => dot(srcPort(t.id), true, hov && hov.id === t.id));
      st.gates.forEach(g => { dot(outPort(g), true, hov && hov.kind === "out" && hov.id === g.id); inPorts(g).forEach((p, k) => dot(p, false, hov && hov.kind === "in" && hov.id === g.id && hov.k === k)); });
      dot(dstPort("Q"), false, hov && hov.id === "Q");
      if (st.drag && st.drag.gate && !st.gates.includes(st.drag.gate)) drawGate(x, st.drag.gate.type, st.drag.gate.x, st.drag.gate.y, { labelColor: C.fg });
      api.dirty = true;
    }
    const overBin = p => p && p.x > BIN.x && p.x < BIN.x + BIN.w && p.y > BIN.y && p.y < BIN.y + BIN.h;
    const api = {
      canvas: cv, dirty: true,
      down(px, py) {
        if (st.locked) return; st.ptr = { x: px, y: py };
        const pal = PAL.find(([t, gx]) => px > gx && px < gx + 150 && py < 88);
        if (pal) { st.drag = { gate: { id: "g" + st.id++, type: pal[0], x: px - GW / 2, y: py - GH / 2 }, dx: GW / 2, dy: GH / 2, fresh: true }; draw(); return; }
        const p = findPort(px, py);
        if (p && p.kind === "out") { st.drag = { wire: true, from: p.id }; draw(); return; }
        if (p && p.kind === "in") { const w = st.wires.find(w => w.to === p.id && w.k === p.k); if (w) { st.wires = st.wires.filter(z => z !== w); st.drag = { wire: true, from: w.from }; draw(); return; } }
        const g = gateAt(px, py); if (g) { st.gates = st.gates.filter(z => z !== g).concat(g); st.drag = { gate: g, dx: px - g.x, dy: py - g.y }; }
        draw();
      },
      move(px, py) { st.ptr = { x: px, y: py }; if (st.drag && st.drag.gate) { st.drag.gate.x = Math.max(70, Math.min(W - 190, px - st.drag.dx)); st.drag.gate.y = Math.max(100, Math.min(H - GH - 10, py - st.drag.dy)); } draw(); },
      up(px, py) {
        const d = st.drag; st.drag = null; if (!d) { draw(); return; }
        if (d.wire) { const p = findPort(px, py, "in"); if (p) { st.wires = st.wires.filter(w => !(w.to === p.id && w.k === p.k)); if (p.id !== d.from) st.wires.push({ from: d.from, to: p.id, k: p.k }); } }
        if (d.gate) {
          d.gate.x = Math.max(70, Math.min(W - 190, px - d.dx)); d.gate.y = Math.max(100, Math.min(H - GH - 10, py - d.dy));
          if (overBin({ x: px, y: py }) || py < 95) { st.gates = st.gates.filter(g => g !== d.gate); st.wires = st.wires.filter(w => w.from !== d.gate.id && w.to !== d.gate.id); }
          else if (!st.gates.includes(d.gate)) st.gates.push(d.gate);
        }
        draw();
      },
      leave() { st.ptr = null; draw(); },
      clear() { if (st.locked) return; st.gates = []; st.wires = []; draw(); },
      value(env) {
        const seen = new Set();
        const val = (id) => { if (id.startsWith("in")) return env[id.slice(2)]; if (seen.has(id)) throw new Error("loop"); seen.add(id);
          const g = st.gates.find(g => g.id === id), ins = inPorts(g).map((_, k) => { const w = st.wires.find(w => w.to === id && w.k === k); if (!w) throw new Error("empty"); return val(w.from); });
          seen.delete(id); return g.type === "NOT" ? !ins[0] : g.type === "AND" ? ins[0] && ins[1] : ins[0] || ins[1]; };
        const w = st.wires.find(w => w.to === "Q"); if (!w) throw new Error("noout"); return val(w.from);
      },
      check(target) {
        const t = parse(target), vv = vs; let wrong = [];
        try { rows(vv).forEach(e => { if (api.value(e) !== evalN(t, e)) wrong.push(e); }); }
        catch (e) { const why = { noout: "Nothing is connected to the output Q yet.", empty: "At least one gate has an input with nothing connected to it.", loop: "Your circuit loops back on itself." }[e.message] || e.message; return { ok: false, got: 0, max: 1, msg: why, incomplete: true }; }
        st.locked = true; st.bad = wrong.length > 0; draw();
        if (!wrong.length) return { ok: true, got: 1, max: 1, msg: "Your circuit gives the right output for every combination of inputs." };
        return { ok: false, got: 0, max: 1, msg: `Your circuit gives the wrong output for ${wrong.length} of the ${1 << vv.length} input combinations, for example when ${vv.map(v => v + " = " + (wrong[0][v] ? 1 : 0)).join(", ")}.` };
      },
      lock() { st.locked = true; draw(); }, unlock() { st.locked = false; st.bad = null; draw(); },
      solve(target) { api.showAnswer(target); st.locked = false; draw(); },   // used by automated tests
      showAnswer(target) { st.gates = []; st.wires = []; st.locked = true; st.bad = null;
        const n = parse(target); let id = 1; const colW = 180;
        const D = (function depth(q) { return q.v ? 0 : 1 + Math.max(depth(q.a), q.b ? depth(q.b) : 0); })(n);
        const build = (q, d, y0, y1) => { if (q.v) return "in" + q.v; const g = { id: "a" + id++, type: q.op, x: 780 - d * colW - GW, y: (y0 + y1) / 2 - GH / 2 }; st.gates.push(g);
          if (q.b) { const m = (y0 + y1) / 2; st.wires.push({ from: build(q.a, d + 1, y0, m), to: g.id, k: 0 }); st.wires.push({ from: build(q.b, d + 1, m, y1), to: g.id, k: 1 }); }
          else st.wires.push({ from: build(q.a, d + 1, y0, y1), to: g.id, k: 0 }); return g.id; };
        st.wires.push({ from: build(n, 0, 110, H - 10), to: "Q", k: 0 }); draw(); }
    };
    draw(); return api;
  }

  // ---------------- 2. expression builder ----------------
  function ExprBoard(opts) {
    const W = 1000, H = 620, cv = base(W, H), x = cv.getContext("2d");
    const node = parse(opts.expr), vs = vars(node);
    const palette = [...vs, "AND", "OR", "NOT", "(", ")", "⌫"];
    const st = { toks: [], drag: null, ptr: null, locked: false, result: null, downAt: null };
    const tw = t => t.length > 1 && t !== "⌫" ? 96 : 64;
    const palRects = () => { let px = 30; return palette.map(t => { const r = { t, x: px, y: 510, w: t === "⌫" ? 90 : tw(t), h: 70 }; px += r.w + 14; return r; }); };
    const rowRects = () => { let px = 40; return st.toks.map((t, i) => { const r = { t, i, x: px, y: 380, w: tw(t), h: 66 }; px += r.w + 10; return r; }); };
    const insertIndex = px => { const rr = rowRects(); let i = rr.findIndex(r => px < r.x + r.w / 2); return i < 0 ? rr.length : i; };
    const inRow = p => p && p.y > 360 && p.y < 470;
    function tile(t, r, style) { roundRect(x, r.x, r.y, r.w, r.h, 12); x.fillStyle = style === "ghost" ? "rgba(255,208,70,.25)" : /^[A-Z]$/.test(t) ? "#1e4f7a" : t === "⌫" ? "#40161c" : "#2a1f4a"; x.fill();
      x.lineWidth = 3; x.strokeStyle = style === "ok" ? C.ok : style === "bad" ? C.bad : C.line; x.stroke();
      x.fillStyle = C.fg; x.font = `bold ${t.length > 1 && t !== "⌫" ? 26 : 32}px Segoe UI, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(t, r.x + r.w / 2, r.y + r.h / 2 + 2); }
    function draw() {
      clearBg(x, W, H);
      roundRect(x, 20, 16, W - 40, 330, 16); x.fillStyle = "#101c33"; x.fill(); x.strokeStyle = C.line; x.lineWidth = 2; x.stroke();
      drawDiagram(x, parse(opts.expr), { x: 40, y: 26, w: W - 120, h: 310 }, { out: opts.out || "Q" });
      x.fillStyle = C.soft; x.font = "18px Segoe UI, sans-serif"; x.textAlign = "left"; x.fillText((opts.out || "Q") + " =", 40, 360);
      roundRect(x, 30, 372, W - 60, 82, 14); x.fillStyle = "#15223b"; x.fill(); x.strokeStyle = st.result ? (st.result.ok ? C.ok : C.bad) : C.edge; x.lineWidth = 3; x.stroke();
      const rr = rowRects(); rr.forEach(r => { if (!(st.drag && st.drag.from === "row" && st.drag.i === r.i)) tile(r.t, r, st.result ? (st.result.ok ? "ok" : "bad") : null); });
      if (!st.toks.length && !st.drag) { x.fillStyle = C.soft; x.font = "20px Segoe UI, sans-serif"; x.textAlign = "left"; x.fillText("Drag tiles here, or click a tile to add it to the end", 60, 414); }
      if (st.drag && inRow(st.ptr)) { const i = insertIndex(st.ptr.x), r = rr[i]; const cx = r ? r.x - 5 : (rr.length ? rr[rr.length - 1].x + rr[rr.length - 1].w + 5 : 45); x.fillStyle = C.edge; x.fillRect(cx - 3, 380, 6, 66); }
      x.fillStyle = C.soft; x.font = "18px Segoe UI, sans-serif"; x.fillText("Tiles", 30, 500);
      palRects().forEach(r => tile(r.t, r));
      if (st.drag) tile(st.drag.t, { x: st.ptr.x - tw(st.drag.t) / 2, y: st.ptr.y - 33, w: tw(st.drag.t), h: 66 }, "ghost");
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return; st.ptr = { x: px, y: py }; st.downAt = { x: px, y: py };
        const p = palRects().find(r => px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h);
        if (p) { if (p.t === "⌫") { st.toks.pop(); draw(); return; } st.drag = { t: p.t, from: "pal" }; draw(); return; }
        const r = rowRects().find(r => px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h); if (r) { st.drag = { t: r.t, from: "row", i: r.i }; draw(); } },
      move(px, py) { st.ptr = { x: px, y: py }; if (st.drag) draw(); },
      up(px, py) { const d = st.drag; st.drag = null; if (!d) return; const click = st.downAt && Math.hypot(px - st.downAt.x, py - st.downAt.y) < 8;
        if (d.from === "row") { st.toks.splice(d.i, 1); if (!click && inRow({ x: px, y: py })) { const i = insertIndex(px); st.toks.splice(i, 0, d.t); } }
        else if (click) st.toks.push(d.t); else if (inRow({ x: px, y: py })) st.toks.splice(insertIndex(px), 0, d.t);
        draw(); },
      leave() { st.ptr = null; st.drag = null; draw(); },
      clear() { if (st.locked) return; st.toks = []; draw(); },
      check() {
        let n; try { n = parse(st.toks); } catch (e) { return { ok: false, got: 0, max: 1, msg: "That expression isn't complete yet: " + e.message, incomplete: true }; }
        const bad = rows(vs).filter(e => evalN(n, e) !== evalN(node, e)); st.locked = true; st.result = { ok: !bad.length }; draw();
        return bad.length ? { ok: false, got: 0, max: 1, msg: `Your expression gives a different output from the diagram for ${bad.length} of the ${1 << vs.length} input combinations. A correct answer is ${text(node)}.` }
                          : { ok: true, got: 1, max: 1, msg: "Your expression matches the diagram for every combination of inputs." };
      },
      lock() { st.locked = true; draw(); },
      solve(target) { st.toks = tokenize(target); draw(); }   // used by automated tests
    };
    draw(); return api;
  }

  // ---------------- 3. truth table ----------------
  function TableBoard(opts) {
    const node = parse(opts.expr), vs = opts.inputs || vars(node), extra = (opts.cols || []).map(([name, e]) => ({ name, node: parse(e) }));
    const outName = opts.out || "Q", cols = [...vs.map(v => ({ name: v, input: true })), ...extra, { name: outName, node }];
    const R = rows(vs), diagram = opts.diagram !== false;
    const W = 1000, rowH = vs.length > 2 ? 34 : 44, top = diagram ? 300 : 20, H = Math.max(620, top + rowH * (R.length + 1) + 20);
    const cv = base(W, H), x = cv.getContext("2d");
    const cw = Math.min(140, (W - 80) / cols.length), left = (W - cw * cols.length) / 2;
    const st = { cells: R.map(() => cols.map(() => null)), locked: false, marks: null, ptr: null };
    const labels = {}; extra.forEach(c => labels[text(c.node)] = c.name);
    const cellAt = (px, py) => { const r = Math.floor((py - top - rowH) / rowH), c = Math.floor((px - left) / cw); return r >= 0 && r < R.length && c >= vs.length && c < cols.length ? { r, c } : null; };
    function draw() {
      clearBg(x, W, H);
      if (diagram) { roundRect(x, 20, 12, W - 40, 276, 16); x.fillStyle = "#101c33"; x.fill(); x.strokeStyle = C.line; x.lineWidth = 2; x.stroke(); drawDiagram(x, parse(opts.expr), { x: 40, y: 20, w: W - 120, h: 260 }, { labels, out: outName }); }
      const hov = st.ptr && !st.locked ? cellAt(st.ptr.x, st.ptr.y) : null;
      cols.forEach((c, j) => { const px = left + j * cw; x.fillStyle = c.input ? "#24385e" : "#3a2f14"; x.fillRect(px + 2, top, cw - 4, rowH - 4); x.fillStyle = c.input ? C.fg : C.edge; x.font = "bold 22px Segoe UI, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(c.name, px + cw / 2, top + rowH / 2 - 2); });
      R.forEach((e, i) => cols.forEach((c, j) => {
        const px = left + j * cw, py = top + (i + 1) * rowH; let v = c.input ? (e[c.name] ? 1 : 0) : st.cells[i][j];
        let fill = c.input ? "#15223b" : "#0b1322"; if (hov && hov.r === i && hov.c === j) fill = "#2a3a5a";
        if (st.marks && !c.input) fill = st.marks[i][j] ? "#143a2c" : "#40161c";
        x.fillStyle = fill; x.fillRect(px + 2, py, cw - 4, rowH - 4);
        if (!c.input) { x.strokeStyle = C.line; x.lineWidth = 2; x.strokeRect(px + 3, py + 1, cw - 6, rowH - 6); }
        x.fillStyle = v === null ? "rgba(180,196,220,.4)" : C.fg; x.font = "bold 24px Segoe UI, sans-serif"; x.fillText(v === null ? "?" : String(v), px + cw / 2, py + rowH / 2 - 1);
        if (st.marks && !c.input && !st.marks[i][j]) { x.fillStyle = C.ok; x.font = "bold 15px Segoe UI, sans-serif"; x.fillText("→" + (evalN(c.node, e) ? 1 : 0), px + cw - 22, py + 12); }
      }));
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true, height: H, marks: R.length,
      down(px, py) { if (st.locked) return; const h = cellAt(px, py); if (h) { const v = st.cells[h.r][h.c]; st.cells[h.r][h.c] = v === null ? 0 : v === 0 ? 1 : 0; } draw(); },
      move(px, py) { st.ptr = { x: px, y: py }; draw(); }, up() {}, leave() { st.ptr = null; draw(); },
      clear() { if (st.locked) return; st.cells = R.map(() => cols.map(() => null)); draw(); },
      solve() { st.cells = R.map((e, i) => cols.map(c => c.input ? null : (evalN(c.node, e) ? 1 : 0))); draw(); },   // used by automated tests
      filled() { return st.cells.every(r => r.every((v, j) => cols[j].input || v !== null)); },
      check() {
        st.marks = R.map((e, i) => cols.map((c, j) => c.input || st.cells[i][j] === (evalN(c.node, e) ? 1 : 0)));
        const got = st.marks.filter(r => r.every(Boolean)).length; st.locked = true; draw();
        return { ok: got === R.length, got, max: R.length, msg: got === R.length ? "Every row is correct." : `${got} of ${R.length} rows are fully correct. The right values are shown in green in the wrong cells.` };
      },
      lock() { st.locked = true; draw(); }
    };
    draw(); return api;
  }

  // ---------------- random questions for Logic sprint ----------------
  function randomExpr(level) {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const vs = level < 2 ? ["A", "B"] : ["A", "B", "C"];
    const op = () => pick(["AND", "OR"]);
    const shapes = [
      () => `A ${op()} B`, () => "NOT A", () => `NOT A ${op()} B`, () => `NOT (A ${op()} B)`, () => `A ${op()} NOT B`,
      () => `(A ${op()} B) ${op()} C`, () => `A ${op()} (B ${op()} C)`, () => `NOT (A ${op()} B) ${op()} C`, () => `(A ${op()} B) ${op()} NOT C`, () => `NOT A ${op()} (B ${op()} C)`];
    const pool = level === 0 ? shapes.slice(0, 2) : level === 1 ? shapes.slice(0, 5) : shapes.slice(3);
    return pick(pool)();
  }

  // Logic sprint: timed rounds of random circuit and expression questions
  function Sprint(duration) {
    const s = { score: 0, streak: 0, bestStreak: 0, correct: 0, answered: 0, level: 0, dur: (duration || 120) * 1000, t0: performance.now(), qStart: 0, q: null, last: null };
    s.timeLeft = () => Math.max(0, s.dur - (performance.now() - s.t0)) / 1000;
    s.next = () => {
      s.level = s.correct < 3 ? 0 : s.correct < 7 ? 1 : 2;
      let e; do { e = randomExpr(s.level); } while (e === s.last); s.last = e;
      const type = Math.random() < .5 ? "circuit" : "expr";
      s.q = { t: type, expr: e, q: type === "circuit" ? "Build the circuit for Q = " + e : "Write the Boolean expression for this diagram." };
      s.qStart = performance.now(); return s.q;
    };
    s.mark = ok => {
      s.answered++;
      if (!ok) { s.streak = 0; return { pts: 0 }; }
      s.correct++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak);
      const secs = (performance.now() - s.qStart) / 1000, bonus = Math.max(0, Math.round(60 - secs * 3)), mult = 1 + Math.min(s.streak - 1, 4) * .5;
      const pts = Math.round((100 + bonus) * mult); s.score += pts; return { pts, bonus, mult };
    };
    return s;
  }
  function recordSprint(prog, s) {
    const r = prog.sprint || (prog.sprint = { best: 0, attempts: 0, history: [] });
    const isBest = s.score > r.best; r.attempts++; r.best = Math.max(r.best, s.score); r.lastScore = s.score;
    r.history = [[s.score, s.correct, s.answered, Date.now()]].concat(r.history || []).slice(0, 10);
    return isBest;
  }

  window.R360Logic = { Sprint, recordSprint, tokenize, parse, evaluate: evalN, vars, rows, text, drawGate, drawDiagram, CircuitBoard, ExprBoard, TableBoard, randomExpr };
})();
