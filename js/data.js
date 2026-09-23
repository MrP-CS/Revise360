// Revise 360 data boards: binary and hex conversion, binary addition and shifts,
// a pixel grid and a sound sampling board. Canvas + abstract pointer events, so the
// same code works with a mouse on a laptop and as a floating board in VR.
(function () {
  const C = { bg: "#0e1628", grid: "#16223a", line: "#3c5a87", fg: "#f0f4fa", soft: "#b4c4dc", edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", on: "#1e4f7a" };
  const W = 1000, H = 620;
  const HEX = "0123456789ABCDEF";
  const bits8 = (n, b) => Array.from({ length: b || 8 }, (_, i) => (n >> ((b || 8) - 1 - i)) & 1);
  const fromBits = a => a.reduce((t, v, i) => t + v * (1 << (a.length - 1 - i)), 0);

  function base() { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
  function rr(x, px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
  function bg(x) { x.fillStyle = C.bg; x.fillRect(0, 0, W, H); x.strokeStyle = C.grid; x.lineWidth = 1;
    for (let i = 0; i < W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (let j = 0; j < H; j += 40) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); } }
  function label(x, text, px, py, size, color, align) { x.fillStyle = color || C.soft; x.font = `${size > 26 ? "700 " : ""}${size}px Segoe UI, sans-serif`; x.textAlign = align || "left"; x.textBaseline = "middle"; x.fillText(text, px, py); }
  function key(x, hits, id, text, px, py, w, h, style, hover) {
    const hov = hover === id;
    rr(x, px, py, w, h, 12); x.fillStyle = style === "on" ? C.on : style === "ok" ? "#143a2c" : style === "bad" ? "#40161c" : style === "primary" ? (hov ? "#ffe07a" : C.edge) : hov ? "#1d2f52" : "#15223b"; x.fill();
    x.lineWidth = hov ? 5 : 3; x.strokeStyle = style === "on" ? C.edge : style === "ok" ? C.ok : style === "bad" ? C.bad : style === "primary" ? C.edge : C.line; x.stroke();
    x.fillStyle = style === "primary" ? "#0f1626" : C.fg; x.font = `700 ${Math.min(34, h * .45)}px Segoe UI, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(text, px + w / 2, py + h / 2 + 1);
    if (hits) hits.push({ id, px, py, w, h });
  }
  // a row of bit cells, with place values above
  function bitRow(x, hits, bits, px, py, cw, ch, opts) {
    opts = opts || {};
    bits.forEach((b, i) => {
      const bx = px + i * (cw + 8);
      if (opts.places !== false) label(x, String(1 << (bits.length - 1 - i)), bx + cw / 2, py - 18, 18, C.soft, "center");
      rr(x, bx, py, cw, ch, 10);
      x.fillStyle = opts.marks ? (opts.marks[i] ? "#143a2c" : "#40161c") : b ? C.on : "#12192a"; x.fill();
      x.lineWidth = opts.hover === (opts.id + i) ? 5 : 3; x.strokeStyle = opts.marks ? (opts.marks[i] ? C.ok : C.bad) : b ? C.edge : C.line; x.stroke();
      x.fillStyle = b ? C.edge : C.soft; x.font = `700 ${ch * .5}px Segoe UI, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(String(b), bx + cw / 2, py + ch / 2 + 1);
      if (hits && opts.id) hits.push({ id: opts.id + i, px: bx, py, w: cw, h: ch });
    });
  }

  // ---------------- 1. denary / binary / hexadecimal conversion ----------------
  function Convert(opts) {
    const cv = base(), x = cv.getContext("2d");
    const from = opts.from || "denary", to = opts.to || "binary", value = opts.value;
    const st = { bits: new Array(8).fill(0), typed: "", locked: false, marks: null, hover: null, hits: [] };
    const target = value;
    const shown = from === "denary" ? String(value) : from === "binary" ? bits8(value).join("") : HEX[value >> 4] + HEX[value & 15];
    function draw() {
      st.hits = []; bg(x);
      label(x, "Convert this " + from + " value", 40, 60, 24, C.soft);
      rr(x, 40, 84, W - 80, 96, 16); x.fillStyle = "#15223b"; x.fill(); x.strokeStyle = C.line; x.lineWidth = 3; x.stroke();
      x.fillStyle = C.fg; x.font = "700 60px Consolas, monospace"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(from === "binary" ? shown.replace(/(.{4})/g, "$1 ").trim() : shown, W / 2, 134);
      label(x, "into " + to, 40, 208, 24, C.edge);
      if (to === "binary") {
        bitRow(x, st.hits, st.bits, 60, 250, 96, 90, { id: "b", hover: st.hover, marks: st.marks });
        const tot = fromBits(st.bits);
        label(x, "Your binary makes " + tot, W / 2, 400, 30, tot === target && st.locked ? C.ok : C.fg, "center");
        label(x, "Tap a bit to turn it on or off. The place values are shown above each bit.", W / 2, 440, 22, C.soft, "center");
        const keys = [["clr", "Clear"], ["<<", "Shift left"], [">>", "Shift right"]];
        keys.forEach(([id, t], i) => key(x, st.hits, id, t, 280 + i * 160, 480, 145, 60, null, st.hover));
      } else {
        const digits = to === "hex" ? HEX : "0123456789";
        label(x, "Your answer: " + (st.typed || "–"), W / 2, 270, 46, st.marks === null ? C.fg : st.marks ? C.ok : C.bad, "center");
        const per = to === "hex" ? 8 : 5, cw = 92, ch = 66;
        [...digits].forEach((d, i) => { const r = Math.floor(i / per), c = i % per;
          key(x, st.hits, "d" + d, d, (W - (per * (cw + 10) - 10)) / 2 + c * (cw + 10), 330 + r * (ch + 12), cw, ch, null, st.hover); });
        key(x, st.hits, "back", "⌫", W / 2 - 80, 480, 160, 60, null, st.hover);
        label(x, to === "hex" ? "Hexadecimal uses 0 to 9 then A to F." : "Type the denary number.", W / 2, 566, 22, C.soft, "center");
      }
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return; const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); if (!h) return;
        const id = h.id;
        if (id[0] === "b" && id.length > 1) st.bits[+id.slice(1)] ^= 1;
        else if (id === "clr") st.bits = new Array(8).fill(0);
        else if (id === "<<") st.bits = st.bits.slice(1).concat(0);
        else if (id === ">>") st.bits = [0].concat(st.bits.slice(0, 7));
        else if (id === "back") st.typed = st.typed.slice(0, -1);
        else if (id[0] === "d") { if (st.typed.length < (to === "hex" ? 2 : 3)) st.typed += id.slice(1); }
        draw(); },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); const id = h ? h.id : null; if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.bits = new Array(8).fill(0); st.typed = ""; draw(); },
      filled() { return to === "binary" || st.typed.length > 0; },
      check() {
        st.locked = true;
        if (to === "binary") {
          const want = bits8(target); st.marks = st.bits.map((b, i) => b === want[i]); draw();
          const ok = fromBits(st.bits) === target;
          return { ok, got: ok ? 1 : 0, max: 1, msg: ok ? `Correct: ${shown} is ${want.join("")} in 8-bit binary.` : `Not quite. ${shown} is ${want.join("")}. Add the place values above the 1s to check: they should total ${target}.` };
        }
        const got = to === "hex" ? parseInt(st.typed, 16) : parseInt(st.typed, 10);
        const ok = got === target; st.marks = ok; draw();
        const right = to === "hex" ? HEX[target >> 4] + HEX[target & 15] : String(target);
        return { ok, got: ok ? 1 : 0, max: 1, msg: ok ? `Correct: ${shown} is ${right}.` : `Not quite: ${shown} is ${right}.` };
      },
      lock() { st.locked = true; draw(); }, solve() { if (to === "binary") st.bits = bits8(target); else st.typed = to === "hex" ? HEX[target >> 4] + HEX[target & 15] : String(target); draw(); }
    };
    draw(); return api;
  }

  // ---------------- 2. binary addition and shifts ----------------
  function AddShift(opts) {
    const cv = base(), x = cv.getContext("2d");
    const mode = opts.mode || "add";
    const a = opts.a, b = opts.b, value = opts.value, dir = opts.dir || "left", places = opts.places || 1;
    const sum = mode === "add" ? a + b : dir === "left" ? value << places : value >> places;
    const answer = mode === "add" ? (sum & 255) : (sum & 255);
    const over = mode === "add" ? sum > 255 : dir === "left" ? (value << places) > 255 : false;
    const st = { bits: new Array(8).fill(0), flag: false, locked: false, marks: null, hover: null, hits: [] };
    function draw() {
      st.hits = []; bg(x);
      if (mode === "add") {
        label(x, "Add these two 8-bit binary numbers", 40, 50, 26, C.edge);
        bitRow(x, null, bits8(a), 60, 110, 96, 62, { places: true });
        label(x, "+", 20, 141, 40, C.fg);
        bitRow(x, null, bits8(b), 60, 205, 96, 62, { places: false });
        x.strokeStyle = C.line; x.lineWidth = 3; x.beginPath(); x.moveTo(40, 285); x.lineTo(W - 40, 285); x.stroke();
        label(x, "Your answer", 40, 315, 22, C.soft);
        bitRow(x, st.hits, st.bits, 60, 340, 96, 76, { id: "b", hover: st.hover, marks: st.marks, places: false });
        key(x, st.hits, "flag", (st.flag ? "☑" : "☐") + "  Overflow: the answer needs a 9th bit", 60, 450, 620, 62, st.flag ? "on" : null, st.hover);
        label(x, "Work right to left, carrying 1 when a column makes 2.", 60, 545, 22, C.soft);
      } else {
        label(x, `Shift this number ${places} place${places > 1 ? "s" : ""} to the ${dir}`, 40, 50, 26, C.edge);
        bitRow(x, null, bits8(value), 60, 120, 96, 70, { places: true });
        label(x, dir === "left" ? "⟵  each bit moves left, a 0 comes in at the right" : "each bit moves right, a 0 comes in at the left  ⟶", W / 2, 230, 24, C.soft, "center");
        label(x, "Your answer", 40, 285, 22, C.soft);
        bitRow(x, st.hits, st.bits, 60, 310, 96, 76, { id: "b", hover: st.hover, marks: st.marks, places: false });
        label(x, `${bits8(value).join("")} is ${value} in denary. Your answer is ${fromBits(st.bits)}.`, 60, 430, 24, C.fg);
        label(x, dir === "left" ? "A left shift of 1 multiplies by 2." : "A right shift of 1 divides by 2 (any remainder is lost).", 60, 470, 24, C.soft);
        key(x, st.hits, "copy", "Copy the original", 60, 505, 300, 60, null, st.hover);
        key(x, st.hits, "shift", dir === "left" ? "Shift mine left" : "Shift mine right", 380, 505, 300, 60, null, st.hover);
      }
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return; const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); if (!h) return;
        if (h.id === "flag") st.flag = !st.flag;
        else if (h.id === "copy") st.bits = bits8(value);
        else if (h.id === "shift") st.bits = dir === "left" ? st.bits.slice(1).concat(0) : [0].concat(st.bits.slice(0, 7));
        else if (h.id[0] === "b") st.bits[+h.id.slice(1)] ^= 1;
        draw(); },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); const id = h ? h.id : null; if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.bits = new Array(8).fill(0); st.flag = false; draw(); },
      filled() { return true; },
      check() {
        st.locked = true; const want = bits8(answer); st.marks = st.bits.map((v, i) => v === want[i]); draw();
        const bitsOk = fromBits(st.bits) === answer, flagOk = mode !== "add" || st.flag === over, ok = bitsOk && flagOk;
        let msg;
        if (mode === "add") msg = ok ? (over ? `Correct: ${a} + ${b} = ${sum}, which needs 9 bits, so there's an overflow error.` : `Correct: ${a} + ${b} = ${sum}.`)
          : `${a} + ${b} = ${sum}. The 8-bit answer is ${want.join("")}${over ? ", and because the answer is over 255 there is an overflow error" : ", with no overflow"}.`;
        else msg = ok ? `Correct: ${value} shifted ${places} ${dir} gives ${answer}${dir === "left" ? ` (${value} × ${1 << places})` : ` (${value} ÷ ${1 << places}, rounded down)`}.`
          : `Not quite: the answer is ${want.join("")}, which is ${answer}.`;
        return { ok, got: ok ? 1 : 0, max: 1, msg };
      },
      lock() { st.locked = true; draw(); }, solve() { st.bits = bits8(answer); st.flag = over; draw(); }
    };
    draw(); return api;
  }

  // ---------------- 3. pixel grid ----------------
  function Pixels(opts) {
    const cv = base(), x = cv.getContext("2d");
    const gw = opts.w || 8, gh = opts.h || 8, depth = opts.depth || 1;
    const PALS = { 1: ["#0e1628", "#f0f4fa"], 2: ["#0e1628", "#ff5f5f", "#50dc96", "#f0f4fa"] };
    const pal = PALS[depth] || PALS[1], names = depth === 1 ? ["Black (0)", "White (1)"] : ["Black (00)", "Red (01)", "Green (10)", "White (11)"];
    const target = opts.target;
    const st = { cells: Array.from({ length: gh }, () => new Array(gw).fill(0)), sel: 1, locked: false, marks: null, hover: null, hits: [], paint: false };
    const cell = Math.min(46, Math.floor(420 / Math.max(gw, gh))), gx = 60, gy = 120;
    const tx = gx + gw * cell + 90, tcell = Math.min(26, cell);
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || "Colour the grid", 40, 50, 26, C.edge);
      label(x, `${gw} × ${gh} pixels · colour depth ${depth} bit${depth > 1 ? "s" : ""}`, 40, 84, 22, C.soft);
      for (let r = 0; r < gh; r++) for (let c = 0; c < gw; c++) {
        const px = gx + c * cell, py = gy + r * cell;
        x.fillStyle = pal[st.cells[r][c]]; x.fillRect(px, py, cell - 2, cell - 2);
        x.lineWidth = st.hover === `p${r}_${c}` ? 3 : 1;
        x.strokeStyle = st.marks ? (st.marks[r][c] ? C.ok : C.bad) : st.hover === `p${r}_${c}` ? C.edge : C.line;
        x.strokeRect(px + .5, py + .5, cell - 3, cell - 3);
        st.hits.push({ id: `p${r}_${c}`, px, py, w: cell, h: cell });
      }
      if (target) {
        label(x, "Copy this image", tx, gy - 26, 22, C.soft);
        for (let r = 0; r < gh; r++) for (let c = 0; c < gw; c++) { x.fillStyle = pal[target[r][c]]; x.fillRect(tx + c * tcell, gy + r * tcell, tcell - 2, tcell - 2); }
      }
      pal.forEach((col, i) => { const px = gx + i * 150, py = gy + gh * cell + 24;
        rr(x, px, py, 140, 56, 10); x.fillStyle = "#15223b"; x.fill(); x.lineWidth = st.sel === i ? 5 : 3; x.strokeStyle = st.sel === i ? C.edge : C.line; x.stroke();
        x.fillStyle = col; x.fillRect(px + 10, py + 12, 32, 32); x.strokeStyle = C.line; x.lineWidth = 1; x.strokeRect(px + 10, py + 12, 32, 32);
        label(x, names[i], px + 52, py + 28, 17, C.fg);
        st.hits.push({ id: "pal" + i, px, py, w: 140, h: 56 }); });
      const bits = gw * gh * depth;
      label(x, `File size: ${gw} × ${gh} × ${depth} = ${bits} bits (${bits / 8} bytes), plus metadata`, 40, H - 40, 24, C.edge);
      api.dirty = true;
    }
    const paintAt = (px, py) => { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); if (!h) return;
      if (h.id.startsWith("pal")) { st.sel = +h.id.slice(3); draw(); return; }
      const [r, c] = h.id.slice(1).split("_").map(Number); st.cells[r][c] = st.sel; draw(); };
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return; st.paint = true; paintAt(px, py); },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); const id = h ? h.id : null;
        if (st.paint && !st.locked && id && id[0] === "p" && !id.startsWith("pal")) { paintAt(px, py); return; }
        if (id !== st.hover) { st.hover = id; draw(); } },
      up() { st.paint = false; }, leave() { st.paint = false; st.hover = null; draw(); },
      clear() { if (st.locked) return; st.cells = Array.from({ length: gh }, () => new Array(gw).fill(0)); draw(); },
      filled() { return true; },
      check() {
        st.locked = true;
        if (!target) { draw(); return { ok: true, got: 1, max: 1, msg: `This image uses ${gw * gh * depth} bits (${gw * gh * depth / 8} bytes) before metadata.` }; }
        st.marks = st.cells.map((row, r) => row.map((v, c) => v === target[r][c]));
        const wrong = st.marks.flat().filter(v => !v).length; draw();
        return { ok: !wrong, got: wrong ? 0 : 1, max: 1, msg: wrong ? `${wrong} pixel${wrong > 1 ? "s are" : " is"} the wrong colour: they're outlined in red.` : `Every pixel matches. Stored raw, this image is ${gw * gh * depth} bits.` };
      },
      lock() { st.locked = true; draw(); }, solve() { if (target) st.cells = target.map(r => r.slice()); draw(); }
    };
    draw(); return api;
  }

  // ---------------- 4. sound sampling ----------------
  function Sound(opts) {
    const cv = base(), x = cv.getContext("2d");
    const samples = opts.samples || 8, depth = opts.depth || 3, levels = 1 << depth;
    const wave = opts.wave || ((t) => .5 + .45 * Math.sin(t * Math.PI * 2));
    const st = { picked: new Array(samples).fill(null), locked: false, marks: null, hover: null, hits: [] };
    const gx = 120, gy = 90, gwid = W - 260, ghei = 380;
    const colW = gwid / samples, rowH = ghei / levels;
    const wantLevel = i => { const v = wave(i / (samples - 1)); return Math.max(0, Math.min(levels - 1, Math.round(v * (levels - 1)))); };
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || "Sample the sound wave", 40, 46, 26, C.edge);
      label(x, `Sample rate: ${samples} samples · bit depth: ${depth} bits (${levels} levels)`, 40, 74, 22, C.soft);
      x.strokeStyle = C.line; x.lineWidth = 2;
      for (let l = 0; l <= levels; l++) { const y = gy + ghei - l * rowH; x.beginPath(); x.moveTo(gx, y); x.lineTo(gx + gwid, y); x.stroke();
        if (l < levels) label(x, l.toString(2).padStart(depth, "0"), gx - 12, y - rowH / 2, 18, C.soft, "right"); }
      for (let i = 0; i <= samples; i++) { const px = gx + i * colW; x.beginPath(); x.moveTo(px, gy); x.lineTo(px, gy + ghei); x.stroke(); }
      x.strokeStyle = "#5ab4ff"; x.lineWidth = 4; x.beginPath();
      for (let p = 0; p <= 200; p++) { const t = p / 200, px = gx + t * (gwid - colW) + colW / 2, py = gy + ghei - wave(t) * ghei; p ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke();
      for (let i = 0; i < samples; i++) for (let l = 0; l < levels; l++) {
        const px = gx + i * colW, py = gy + ghei - (l + 1) * rowH, id = `s${i}_${l}`;
        const chosen = st.picked[i] === l;
        if (chosen || st.hover === id) { rr(x, px + 6, py + 4, colW - 12, rowH - 8, 8);
          x.fillStyle = chosen ? (st.marks ? (st.marks[i] ? "#143a2c" : "#40161c") : C.on) : "#1d2f52"; x.fill();
          x.lineWidth = 3; x.strokeStyle = chosen ? (st.marks ? (st.marks[i] ? C.ok : C.bad) : C.edge) : C.line; x.stroke(); }
        st.hits.push({ id, px, py, w: colW, h: rowH });
      }
      if (st.marks) for (let i = 0; i < samples; i++) { const l = wantLevel(i), px = gx + i * colW + colW / 2, py = gy + ghei - (l + .5) * rowH;
        x.beginPath(); x.arc(px, py, 7, 0, 7); x.fillStyle = C.ok; x.fill(); }
      const bits = samples * depth;
      label(x, `Tap the level nearest the wave in each column. File size = samples × bit depth = ${samples} × ${depth} = ${bits} bits`, 40, H - 60, 23, C.fg);
      label(x, "Doubling the sample rate or the bit depth doubles the file size, and improves the quality.", 40, H - 28, 21, C.soft);
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return; const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); if (!h) return;
        const [i, l] = h.id.slice(1).split("_").map(Number); st.picked[i] = st.picked[i] === l ? null : l; draw(); },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h); const id = h ? h.id : null; if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.picked = new Array(samples).fill(null); draw(); },
      filled() { return st.picked.every(v => v !== null); },
      check() {
        st.locked = true; st.marks = st.picked.map((v, i) => v === wantLevel(i)); draw();
        const got = st.marks.filter(Boolean).length;
        return { ok: got === samples, got: got === samples ? 1 : 0, max: 1,
          msg: got === samples ? `Every sample is at the nearest level. This sound needs ${samples} × ${depth} = ${samples * depth} bits.`
                               : `${got} of ${samples} samples are at the nearest level. The correct samples are marked with green dots.` };
      },
      lock() { st.locked = true; draw(); }, solve() { st.picked = st.picked.map((_, i) => wantLevel(i)); draw(); }
    };
    draw(); return api;
  }

  // Binary blitz: random conversion questions
  function blitz(level) {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const kinds = level === 0 ? [["denary", "binary"], ["binary", "denary"]]
      : level === 1 ? [["denary", "binary"], ["binary", "denary"], ["denary", "hex"], ["hex", "denary"]]
      : [["denary", "binary"], ["binary", "denary"], ["denary", "hex"], ["hex", "denary"], ["binary", "hex"], ["hex", "binary"]];
    const [from, to] = pick(kinds);
    const value = level === 0 ? 1 + Math.floor(Math.random() * 62) : 1 + Math.floor(Math.random() * 254);
    const shown = from === "denary" ? String(value) : from === "binary" ? bits8(value).join("") : HEX[value >> 4] + HEX[value & 15];
    const ans = to === "denary" ? String(value) : to === "binary" ? bits8(value).join("") : HEX[value >> 4] + HEX[value & 15];
    return { t: "convert", from, to, value, key: from + to + value, answer: ans,
      q: `Convert ${shown} from ${from} into ${to === "hex" ? "hexadecimal" : to}.` };
  }

  function make(task) {
    if (task.t === "convert") return Convert(task);
    if (task.t === "addshift") return AddShift(task);
    if (task.t === "pixels") return Pixels(task);
    if (task.t === "sound") return Sound(Object.assign({}, task, task.waveSrc ? { wave: new Function("t", "return " + task.waveSrc) } : {}));
    return null;
  }
  window.R360Data = { make, blitz, Convert, AddShift, Pixels, Sound, bits8, fromBits, TYPES: ["convert", "addshift", "pixels", "sound"] };
})();
