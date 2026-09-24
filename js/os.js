// Revise 360 systems software boards: memory allocation, CPU time slicing,
// file permissions and disk defragmentation. Canvas plus abstract pointer events,
// so each works with a mouse and in VR, like the other boards.
(function () {
  const C = { bg: "#0e1628", grid: "#16223a", line: "#3c5a87", fg: "#f0f4fa", soft: "#b4c4dc",
              edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", ram: "#1e4f7a", disk: "#3a2f55" };
  const W = 1000, H = 620;
  const PAL = ["#40c4ff", "#ff785a", "#50dc96", "#c88cff", "#ffd046", "#ff5fa2"];

  function base() { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
  const rr = (x, px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
  function bg(x) { x.fillStyle = C.bg; x.fillRect(0, 0, W, H); x.strokeStyle = C.grid; x.lineWidth = 1;
    for (let i = 0; i < W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (let j = 0; j < H; j += 40) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); } }
  function label(x, t, px, py, size, col, align, bold) {
    x.fillStyle = col || C.soft; x.font = `${bold || size > 26 ? "700 " : ""}${size}px Segoe UI, sans-serif`;
    x.textAlign = align || "left"; x.textBaseline = "middle"; x.fillText(t, px, py);
  }
  function button(x, hits, id, text, px, py, w, h, style, hover) {
    const hov = hover === id;
    rr(x, px, py, w, h, 12);
    x.fillStyle = style === "primary" ? (hov ? "#ffe07a" : C.edge) : style === "on" ? C.ram : hov ? "#1d2f52" : "#15223b"; x.fill();
    x.lineWidth = hov ? 5 : 3; x.strokeStyle = style === "primary" ? C.edge : style === "on" ? C.edge : C.line; x.stroke();
    label(x, text, px + w / 2, py + h / 2, Math.min(26, h * .42), style === "primary" ? "#0f1626" : C.fg, "center", true);
    if (hits) hits.push({ id, px, py, w, h });
  }

  // ---------------- 1. memory manager ----------------
  // Programs are dragged into RAM. When RAM is full, the rest must go to virtual memory.
  function Memory(opts) {
    const cv = base(), x = cv.getContext("2d");
    const ramBlocks = opts.ram || 8;                       // blocks of RAM available
    const progs = (opts.programs || []).map((p, i) => Object.assign({ i, placed: null }, p));
    const st = { drag: null, ptr: null, locked: false, marks: null, hover: null, hits: [] };
    const RX = 60, RY = 150, RW = 820, RH = 90, cell = RW / ramBlocks;
    const VX = 60, VY = 330, VW = 820, VH = 74;

    const used = () => progs.filter(p => p.placed === "ram").reduce((t, p) => t + p.size, 0);
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || "Fit the programs into memory", 40, 46, 26, C.edge);
      label(x, `RAM: ${ramBlocks} blocks · ${used()} used · ${ramBlocks - used()} free`, 40, 82, 22,
            used() > ramBlocks ? C.bad : C.soft);
      // RAM strip
      rr(x, RX, RY, RW, RH, 12); x.fillStyle = "#12192a"; x.fill(); x.lineWidth = 3; x.strokeStyle = C.line; x.stroke();
      for (let i = 1; i < ramBlocks; i++) { x.beginPath(); x.moveTo(RX + i * cell, RY); x.lineTo(RX + i * cell, RY + RH);
        x.strokeStyle = C.grid; x.lineWidth = 2; x.stroke(); }
      label(x, "RAM", RX - 14, RY + RH / 2, 22, C.fg, "right", true);
      let at = 0;
      progs.filter(p => p.placed === "ram").forEach(p => {
        const px = RX + at * cell, w = p.size * cell - 6;
        rr(x, px + 3, RY + 8, Math.max(20, w), RH - 16, 8);
        x.fillStyle = PAL[p.i % PAL.length]; x.globalAlpha = .85; x.fill(); x.globalAlpha = 1;
        const fit = Math.max(11, Math.min(18, (Math.max(20, w) - 10) / (p.name.length * 0.52)));
        label(x, p.name, px + 3 + Math.max(20, w) / 2, RY + RH / 2, fit, "#0f1626", "center", true);
        at += p.size;
      });
      // virtual memory strip
      rr(x, VX, VY, VW, VH, 12); x.fillStyle = "#171130"; x.fill(); x.lineWidth = 3; x.strokeStyle = "#5a4a86"; x.stroke();
      label(x, "Virtual memory (on disk)", VX + 12, VY + VH / 2, 19, "#a68cff");
      let vat = 0;
      progs.filter(p => p.placed === "disk").forEach(p => {
        const w = p.size * 46;
        rr(x, VX + 250 + vat, VY + 10, w, VH - 20, 8); x.fillStyle = PAL[p.i % PAL.length]; x.globalAlpha = .55; x.fill(); x.globalAlpha = 1;
        label(x, p.name, VX + 250 + vat + w / 2, VY + VH / 2, 17, "#0f1626", "center", true);
        vat += w + 8;
      });
      // programs waiting
      label(x, "Programs to open (drag each one into RAM, or onto the disk if RAM is full)", 40, 450, 20, C.soft);
      progs.filter(p => !p.placed).forEach((p, k) => {
        const px = 60 + k * 175, py = 480, w = 160, h = 66;
        rr(x, px, py, w, h, 10); x.fillStyle = st.drag && st.drag.p === p ? "#1d2f52" : "#15223b"; x.fill();
        x.lineWidth = 3; x.strokeStyle = PAL[p.i % PAL.length]; x.stroke();
        label(x, p.name, px + w / 2, py + 26, 19, C.fg, "center", true);
        label(x, p.size + (p.size === 1 ? " block" : " blocks"), px + w / 2, py + 48, 17, C.soft, "center");
        st.hits.push({ id: "p" + p.i, px, py, w, h });
      });
      if (st.drag && st.ptr) {
        const p = st.drag.p, w = 150;
        rr(x, st.ptr.x - w / 2, st.ptr.y - 26, w, 52, 10);
        x.fillStyle = PAL[p.i % PAL.length]; x.globalAlpha = .75; x.fill(); x.globalAlpha = 1;
        label(x, p.name, st.ptr.x, st.ptr.y, 18, "#0f1626", "center", true);
      }
      if (st.marks) label(x, st.marks.msg, 40, H - 30, 21, st.marks.ok ? C.ok : C.bad);
      api.dirty = true;
    }
    const inRam = p => p && p.x > RX && p.x < RX + RW && p.y > RY - 20 && p.y < RY + RH + 20;
    const inDisk = p => p && p.x > VX && p.x < VX + VW && p.y > VY - 10 && p.y < VY + VH + 10;
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return; st.ptr = { x: px, y: py };
        const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        if (h && h.id[0] === "p") st.drag = { p: progs[+h.id.slice(1)] };
        // tapping a placed program takes it out again
        else { const at = progs.find(p => p.placed); if (inRam({ x: px, y: py }) || inDisk({ x: px, y: py })) {
          let acc = 0; progs.filter(p => p.placed === "ram").forEach(p => { const w = p.size * cell;
            if (px > RX + acc && px < RX + acc + w && inRam({ x: px, y: py })) p.placed = null; acc += w; });
          let vacc = 0; progs.filter(p => p.placed === "disk").forEach(p => { const w = p.size * 46 + 8;
            if (px > VX + 250 + vacc && px < VX + 250 + vacc + w && inDisk({ x: px, y: py })) p.placed = null; vacc += w; });
        } }
        draw(); },
      move(px, py) { st.ptr = { x: px, y: py };
        const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        st.hover = h ? h.id : null; if (st.drag || h) draw(); },
      up(px, py) { const d = st.drag; st.drag = null;
        if (d) { if (inRam({ x: px, y: py })) d.p.placed = "ram"; else if (inDisk({ x: px, y: py })) d.p.placed = "disk"; }
        draw(); },
      leave() { st.drag = null; st.ptr = null; draw(); },
      clear() { if (st.locked) return; progs.forEach(p => p.placed = null); st.marks = null; draw(); },
      filled() { return progs.every(p => p.placed); },
      check() {
        st.locked = true;
        const over = used() > ramBlocks;
        const onDisk = progs.filter(p => p.placed === "disk");
        const fits = progs.filter(p => p.placed === "ram").reduce((t, p) => t + p.size, 0) <= ramBlocks;
        // Correct when RAM isn't over-filled and only the overflow went to virtual memory
        const spare = ramBlocks - used();
        const couldFit = onDisk.some(p => p.size <= spare);
        const ok = fits && !couldFit;
        st.marks = { ok, msg: ok
          ? `Correct: ${used()} of ${ramBlocks} blocks of RAM are in use, and only what didn't fit went to virtual memory.`
          : over ? `You've put ${used()} blocks into ${ramBlocks} blocks of RAM. Move the extra programs to virtual memory.`
                 : "There's still room in RAM, so move a program back from virtual memory: RAM is far faster." };
        draw();
        return { ok, got: ok ? 1 : 0, max: 1, msg: st.marks.msg };
      },
      lock() { st.locked = true; draw(); },
      solve() {   // used by automated tests
        progs.forEach(p => p.placed = null);
        let left = ramBlocks;
        progs.forEach(p => { if (p.size <= left) { p.placed = "ram"; left -= p.size; } else p.placed = "disk"; });
        draw();
      }
    };
    draw(); return api;
  }

  // ---------------- 2. file permissions ----------------
  function Permissions(opts) {
    const cv = base(), x = cv.getContext("2d");
    const groups = opts.groups, files = opts.files;          // files: [{name, want: {group: level}}]
    const LEVELS = opts.levels || ["None", "Read", "Read/write"];
    const st = { set: files.map(() => groups.map(() => 0)), locked: false, marks: null, hover: null, hits: [] };
    const X0 = 300, Y0 = 170, CW = Math.min(200, (W - X0 - 60) / groups.length), RH = 74;
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || "Set the access levels", 40, 46, 26, C.edge);
      label(x, "Tap a cell to move it through None, Read, then Read/write.", 40, 82, 21, C.soft);
      groups.forEach((g, c) => label(x, g, X0 + c * CW + CW / 2, Y0 - 24, 21, C.fg, "center", true));
      files.forEach((f, r) => {
        label(x, f.name, X0 - 20, Y0 + r * RH + RH / 2, 21, C.fg, "right");
        groups.forEach((g, c) => {
          const px = X0 + c * CW, py = Y0 + r * RH, v = st.set[r][c], id = `c${r}_${c}`;
          rr(x, px + 4, py + 4, CW - 10, RH - 12, 10);
          x.fillStyle = st.marks ? (st.marks[r][c] ? "#143a2c" : "#40161c")
            : v === 0 ? "#12192a" : v === 1 ? "#14304a" : "#1e4f7a";
          x.fill();
          x.lineWidth = st.hover === id ? 5 : 3;
          x.strokeStyle = st.marks ? (st.marks[r][c] ? C.ok : C.bad) : v ? C.edge : C.line; x.stroke();
          label(x, LEVELS[v], px + CW / 2 - 3, py + RH / 2 - 2, 19, v ? C.fg : C.soft, "center", v > 0);
          if (st.marks && !st.marks[r][c]) label(x, "→ " + LEVELS[f.want[g]], px + CW / 2 - 3, py + RH - 14, 15, C.ok, "center");
          st.hits.push({ id, px, py, w: CW, h: RH });
        });
      });
      if (opts.note) label(x, opts.note, 40, H - 34, 20, C.soft);
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return;
        const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        if (h) { const [r, c] = h.id.slice(1).split("_").map(Number); st.set[r][c] = (st.set[r][c] + 1) % 3; }
        draw(); },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        const id = h ? h.id : null; if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.set = files.map(() => groups.map(() => 0)); st.marks = null; draw(); },
      filled() { return true; },
      check() {
        st.locked = true;
        st.marks = files.map((f, r) => groups.map((g, c) => st.set[r][c] === f.want[g]));
        const wrong = st.marks.flat().filter(v => !v).length; draw();
        return { ok: !wrong, got: wrong ? 0 : 1, max: 1,
          msg: wrong ? `${wrong} setting${wrong > 1 ? "s are" : " is"} wrong: the right level is shown in green.`
                     : "Correct: every group has exactly the access it needs, and no more." };
      },
      lock() { st.locked = true; draw(); },
      solve() { st.set = files.map(f => groups.map(g => f.want[g])); draw(); }
    };
    draw(); return api;
  }

  // ---------------- 3. defragmentation ----------------
  function Defrag(opts) {
    const cv = base(), x = cv.getContext("2d");
    const COLS = 20, ROWS = 6, N = COLS * ROWS;
    // disk[i] = 0 for free, or a file number
    const start = opts.disk || [1,1,0,2,0,1,3,0,2,2,0,3,1,0,0,2,3,0,1,0,
                                0,3,1,0,2,0,0,1,3,2,0,1,0,3,2,0,1,0,0,2,
                                3,0,1,2,0,3,0,1,2,0,3,1,0,2,0,3,1,0,2,0,
                                1,0,2,3,0,1,0,2,3,0,1,2,0,3,1,0,2,0,3,1,
                                0,2,1,0,3,2,0,1,0,2,3,1,0,2,0,1,3,0,2,1,
                                2,0,1,3,0,2,1,0,3,0,2,1,0,3,2,0,1,2,0,3];
    const st = { disk: start.slice(), moves: 0, locked: false, sel: null, hover: null, hits: [], anim: 0 };
    const GX = 60, GY = 190, CS = Math.min(42, (W - 120) / COLS), GW = CS * COLS, GH = CS * ROWS;
    const cols = ["#12192a", "#40c4ff", "#ff785a", "#50dc96", "#c88cff"];

    const tidy = d => {                      // how tidy is the disk: every file in one run?
      const runs = {};
      let last = null;
      d.forEach(v => { if (v && v !== last) runs[v] = (runs[v] || 0) + 1; last = v; });
      return runs;
    };
    const gaps = d => { let g = 0, seen = false;
      for (let i = 0; i < d.length; i++) { if (d[i]) seen = true; else if (seen && d.slice(i).some(v => v)) g++; }
      return g; };
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || "Defragment the disk", 40, 46, 26, C.edge);
      label(x, "Drag a block to a free space, or press Defragment to do it in one pass.", 40, 80, 21, C.soft);
      const runs = tidy(st.disk), frag = Object.values(runs).reduce((t, n) => t + (n - 1), 0);
      label(x, `Files split into pieces: ${frag}   ·   Gaps the head must skip: ${gaps(st.disk)}   ·   Your moves: ${st.moves}`,
            40, 120, 21, frag ? C.bad : C.ok);
      // read head travel, drawn as a line hopping between pieces of file 1
      rr(x, GX - 8, GY - 8, GW + 16, GH + 16, 10); x.fillStyle = "#0b1322"; x.fill(); x.strokeStyle = C.line; x.lineWidth = 3; x.stroke();
      for (let i = 0; i < N; i++) {
        const r = Math.floor(i / COLS), c = i % COLS, px = GX + c * CS, py = GY + r * CS, v = st.disk[i];
        x.fillStyle = cols[v] || cols[0];
        if (v) { rr(x, px + 2, py + 2, CS - 4, CS - 4, 5); x.fill(); }
        else { x.fillStyle = "#0e1628"; x.fillRect(px + 2, py + 2, CS - 4, CS - 4); }
        x.lineWidth = st.sel === i ? 4 : 1; x.strokeStyle = st.sel === i ? C.edge : C.grid;
        x.strokeRect(px + 2, py + 2, CS - 4, CS - 4);
        st.hits.push({ id: "b" + i, px, py, w: CS, h: CS });
      }
      // key
      ["Free", "File A", "File B", "File C"].forEach((t, i) => {
        const px = 60 + i * 190, py = GY + GH + 34;
        x.fillStyle = cols[i]; rr(x, px, py, 26, 26, 5); x.fill(); x.strokeStyle = C.line; x.lineWidth = 2; x.stroke();
        label(x, t, px + 36, py + 13, 19, C.fg);
      });
      button(x, st.hits, "auto", "Defragment", W - 320, GY + GH + 84, 190, 50, "primary", st.hover);
      button(x, st.hits, "reset", "Start again", W - 520, GY + GH + 84, 175, 50, null, st.hover);
      api.dirty = true;
    }
    function compact() {
      const files = st.disk.filter(v => v);
      files.sort((a, b) => a - b);
      st.disk = files.concat(new Array(N - files.length).fill(0));
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return;
        const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        if (!h) return;
        if (h.id === "auto") { compact(); st.moves++; draw(); return; }
        if (h.id === "reset") { st.disk = start.slice(); st.moves = 0; st.sel = null; draw(); return; }
        const i = +h.id.slice(1);
        if (st.sel === null) { if (st.disk[i]) st.sel = i; }
        else { if (!st.disk[i]) { st.disk[i] = st.disk[st.sel]; st.disk[st.sel] = 0; st.moves++; } st.sel = null; }
        draw();
      },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        const id = h ? h.id : null; if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.disk = start.slice(); st.moves = 0; st.sel = null; draw(); },
      filled() { return true; },
      check() {
        const runs = tidy(st.disk), frag = Object.values(runs).reduce((t, n) => t + (n - 1), 0);
        const g = gaps(st.disk);
        const ok = frag === 0 && g === 0;
        st.locked = ok; draw();
        return { ok, got: ok ? 1 : 0, max: 1, incomplete: !ok,
          msg: ok ? `Defragmented: every file is in one piece and the free space is all together at the end. The read/write head no longer jumps about, so files open faster.`
                  : `Not there yet: ${frag} file${frag === 1 ? " is" : "s are"} still split up and there ${g === 1 ? "is 1 gap" : "are " + g + " gaps"} between the used blocks. Keep going, or press Defragment.` };
      },
      lock() { st.locked = true; draw(); },
      solve() { compact(); draw(); }
    };
    draw(); return api;
  }

  // Stakeholders and impacts, for 1.6: who is affected by a change, and how
  function Impact(opts) {
    return Permissions({
      title: opts.title || "Who is affected, and how?",
      note: opts.note || "Tap a cell to move it through the choices.",
      groups: opts.groups,
      files: opts.stakeholders.map(s => ({ name: s.name, want: s.want })),
      levels: opts.levels || ["No real effect", "Benefits", "Loses out"],
      q: opts.q
    });
  }

  // "Name that Act": a scenario appears, you choose the law it falls under
  const ACTS = ["Data Protection Act 2018", "Computer Misuse Act 1990", "Copyright, Designs and Patents Act 1988", "No law broken"];
  const CASES = [
    // [scenario, correct act index, difficulty 0-2]
    ["A hospital emails a patient list to the wrong address", 0, 0],
    ["A pupil uses a teacher's password to read a mark sheet", 1, 0],
    ["A market stall sells copied games on memory sticks", 2, 0],
    ["A shop keeps ten years of CCTV for no stated reason", 0, 0],
    ["Someone releases malware that deletes company files", 1, 0],
    ["A website uses a photographer's pictures without asking", 2, 0],
    ["A charity loses an unencrypted laptop of donor records", 0, 1],
    ["A student writes their own program and shares it freely", 3, 1],
    ["An employee copies the customer database for a rival", 1, 1],
    ["A teacher shows a film they bought, to their own class", 3, 1],
    ["An app sells children's data to advertisers", 0, 1],
    ["A band samples a song without clearing the rights", 2, 1],
    ["A user guesses a colleague's password but changes nothing", 1, 1],
    ["A company keeps applicants' CVs for fifteen years", 0, 2],
    ["A firm reverse-engineers software against its licence", 2, 2],
    ["A pupil reports a security flaw without exploiting it", 3, 2],
    ["A shop's app records your location while it is closed", 0, 2],
    ["Someone floods a council's website to take it offline", 1, 2],
    ["A YouTuber uses 8 seconds of a track in a review", 3, 2],
    ["A site streams films it has no licence to show", 2, 2]
  ];
  function lawCase(level) {
    const pool = CASES.filter(c => c[2] <= level);
    const c = pool[Math.floor(Math.random() * pool.length)];
    return { t: "law", key: c[0], q: c[0], answer: ACTS[c[1]], options: ACTS, correct: c[1] };
  }

  // The board the sprint engine shows for one case: four big buttons
  function LawBoard(q) {
    const cv = base(), x = cv.getContext("2d");
    const st = { pick: null, locked: false, hover: null, hits: [] };
    function draw() {
      st.hits = []; bg(x);
      label(x, "Which law does this fall under?", 40, 48, 26, C.edge);
      const lines = [];
      let cur = "";
      x.font = "700 30px Segoe UI, sans-serif";
      q.q.split(" ").forEach(w => { const t = (cur + " " + w).trim();
        if (x.measureText(t).width < W - 120) cur = t; else { lines.push(cur); cur = w; } });
      if (cur) lines.push(cur);
      lines.forEach((ln, i) => label(x, ln, 40, 120 + i * 44, 30, C.fg, "left", true));
      q.options.forEach((o, i) => {
        const py = 270 + i * 82;
        const chosen = st.pick === i;
        const right = st.locked && i === q.correct;
        const wrong = st.locked && chosen && i !== q.correct;
        rr(x, 40, py, W - 80, 68, 12);
        x.fillStyle = right ? "#143a2c" : wrong ? "#40161c" : st.hover === "o" + i ? "#1d2f52" : "#15223b"; x.fill();
        x.lineWidth = right || wrong || chosen ? 5 : 3;
        x.strokeStyle = right ? C.ok : wrong ? C.bad : chosen ? C.edge : C.line; x.stroke();
        label(x, o, 66, py + 34, 25, C.fg, "left", true);
        st.hits.push({ id: "o" + i, px: 40, py, w: W - 80, h: 68 });
      });
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return;
        const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        if (h) st.pick = +h.id.slice(1);
        draw(); },
      move(px, py) { const h = st.hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);
        const id = h ? h.id : null; if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (!st.locked) { st.pick = null; draw(); } },
      filled() { return st.pick !== null; },
      check() { st.locked = true; const ok = st.pick === q.correct; draw();
        return { ok, got: ok ? 1 : 0, max: 1, msg: ok ? "Correct." : "The answer is " + q.answer + "." }; },
      lock() { st.locked = true; draw(); },
      solve() { st.pick = q.correct; draw(); }
    };
    draw(); return api;
  }

  function make(task) {
    if (task.t === "law") return LawBoard(task);
    if (task.t === "impact") return Impact(task);
    if (task.t === "memory") return Memory(task);
    if (task.t === "permissions") return Permissions(task);
    if (task.t === "defrag") return Defrag(task);
    return null;
  }
  window.R360OS = { make, Memory, Permissions, Defrag, Impact, LawBoard, lawCase, TYPES: ["memory", "permissions", "defrag", "impact", "law"] };
})();
