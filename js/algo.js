// Revise 360 algorithm boards for topic 2.1: trace tables, finding the faulty line,
// stepping through a search, and stepping through a sort. Same pointer interface as the
// other boards, so each one works with a mouse, on a tablet and in VR.
(function () {
  const C = { bg: "#0e1628", grid: "#16223a", line: "#3c5a87", fg: "#f0f4fa", soft: "#b4c4dc",
              edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", pale: "#15223b", dim: "#49556e" };
  const W = 1000, H = 620;
  function base() { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
  const rr = (x, px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
  function bg(x) { x.fillStyle = C.bg; x.fillRect(0, 0, W, H); x.strokeStyle = C.grid; x.lineWidth = 1;
    for (let i = 0; i < W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (let j = 0; j < H; j += 40) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); } }
  function label(x, t, px, py, size, col, align, bold, mono) {
    x.fillStyle = col || C.soft;
    x.font = `${bold ? "700 " : ""}${size}px ${mono ? "Consolas, monospace" : "Segoe UI, sans-serif"}`;
    x.textAlign = align || "left"; x.textBaseline = "middle"; x.fillText(t, px, py);
  }
  const hitAt = (hits, px, py) => hits.find(h => px > h.px && px < h.px + h.w && py > h.py && py < h.py + h.h);

  /* ---------- syntax highlighting ----------
   * Code on these boards is OCR Exam Reference Language, and it was being drawn
   * in one flat colour, which is harder to read than it needs to be and is not
   * what any editor a student has used looks like. This splits a line into
   * tokens and draws each in its own colour, keeping a monospace font so the
   * indentation still lines up down the page.
   */
  /* The colours are the Python editor's, from js/pytok.js and css/pytok.css.
   * Exam Reference Language is not Python, but a pupil who has learnt that amber
   * means a number should not have to learn it twice, so the two share one table
   * rather than two that happen to agree. Read at draw time, not at load time,
   * so the stylesheet has certainly arrived. */
  const CODE = () => {
    const c = window.R360Tok.colours;
    return { key: c.k, built: c.b, str: c.s, num: c.n, comment: c.c, op: c.o, name: c.t };
  };
  const KEYWORDS = ("if then else elseif endif for to step next while endwhile do until " +
    "switch case default endswitch function endfunction procedure endprocedure return " +
    "and or not true false global array new").split(" ");
  const BUILTINS = ("print input len substring left right int str float bool real " +
    "random round mod div ucase lcase position open readline writeline close endoffile " +
    "range append remove append").split(" ");
  // Longest first, so <= is never read as < followed by =
  const OPS = ["==", "!=", "<=", ">=", "<-", "+=", "-=", "*=", "/=", "<", ">", "=", "+", "-",
               "*", "/", "^", "(", ")", "[", "]", "{", "}", ",", ":", ".", ";"];

  function tokenise(line) {
    const C = CODE();
    const out = [];
    let i = 0;
    while (i < line.length) {
      const c = line[i];
      if (c === " " || c === "\t") { let j = i; while (j < line.length && (line[j] === " " || line[j] === "\t")) j++;
                                      out.push({ t: line.slice(i, j), c: C.name }); i = j; continue; }
      if (c === "/" && line[i + 1] === "/") { out.push({ t: line.slice(i), c: C.comment }); break; }
      if (c === "#") { out.push({ t: line.slice(i), c: C.comment }); break; }
      if (c === "'" || c === '"') {                       // a string, closed or not
        let j = i + 1; while (j < line.length && line[j] !== c) j++;
        out.push({ t: line.slice(i, Math.min(j + 1, line.length)), c: C.str });
        i = j + 1; continue;
      }
      if (c >= "0" && c <= "9") { let j = i; while (j < line.length && /[0-9.]/.test(line[j])) j++;
                                  out.push({ t: line.slice(i, j), c: C.num }); i = j; continue; }
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
        const w = line.slice(i, j), lw = w.toLowerCase();
        out.push({ t: w, c: KEYWORDS.indexOf(lw) >= 0 ? C.key
                        : BUILTINS.indexOf(lw) >= 0 ? C.built : C.name });
        i = j; continue;
      }
      const op = OPS.find(o => line.startsWith(o, i));
      if (op) { out.push({ t: op, c: C.op }); i += op.length; continue; }
      out.push({ t: c, c: C.name }); i++;
    }
    return out;
  }

  /* Draws a line of code, token by token, and returns the width it took.
   * `fade` dims the whole line, for code that is not the focus right now. */
  function codeLine(x, line, px, py, size, fade) {
    x.font = `${size}px Consolas, "DejaVu Sans Mono", monospace`;
    x.textAlign = "left"; x.textBaseline = "middle";
    let w = 0;
    if (fade) x.save(), x.globalAlpha = fade;
    for (const tok of tokenise(line)) {
      x.fillStyle = tok.c;
      x.fillText(tok.t, px + w, py);
      w += x.measureText(tok.t).width;
    }
    if (fade) x.restore();
    return w;
  }

  // ---------- 1. trace table ----------
  // Code down the left, a trace table on the right. Tap a cell, then type with the keypad.
  function Trace(opts) {
    const cv = base(), x = cv.getContext("2d");
    const cols = opts.columns, rows = opts.rows, want = opts.answer;
    const st = { grid: rows.map(r => r.slice()), sel: null, locked: false, marks: null, hover: null, hits: [] };
    /* A trace table sits to the right of the program it is tracing. A working-out
     * table has no program, so the 470px reserved for one was dead space on the
     * left and squeezed the columns into the right-hand third.
     *
     * The column width also has to hold the heading. "Full boxes (eggs DIV 12)"
     * is the teaching, not decoration, and at a fixed 118px two headings printed
     * on top of each other. Columns grow to the widest heading or value they
     * carry, up to whatever room there is. */
    const CX = (opts.code && opts.code.length) ? 470 : 36, CY = 152, RH = 44;
    const widest = (() => {
      x.font = "700 17px Consolas, monospace";
      let w = 0;
      cols.forEach(c => { w = Math.max(w, x.measureText(String(c)).width); });
      x.font = "700 19px Consolas, monospace";
      rows.forEach((r, i) => r.forEach((v, j) => {
        w = Math.max(w, x.measureText(String(want[i][j] || v)).width);
      }));
      return w + 26;
    })();
    const CW = Math.max(72, Math.min(widest, (W - CX - 46) / cols.length));
    /* Where the keypad sits, and how tall the board needs to be. Neither
     * depends on what the pupil has typed, so both are worked out once. A trace
     * of a nine-line program fills the canvas; a three-cell calculation does
     * not, and `fit` cuts the board down to what it uses rather than leaving a
     * third of it empty. */
    const used = Math.max(CY + rows.length * RH, 106 + (opts.code || []).length * 29) + 34;
    const KEYTOP = Math.min(H - 118, Math.max(used, 240));
    const HH = opts.fit ? Math.min(H, KEYTOP + 152) : H;
    cv.height = HH;
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || "Complete the trace table", 36, 42, 25, C.edge, "left", true);
      (opts.code || []).forEach((ln, i) => {
        label(x, String(i + 1).padStart(2, " "), 36, 106 + i * 29, 16, "#587193", "left", false, true);
        codeLine(x, ln, 74, 106 + i * 29, 17);
      });
      cols.forEach((c, i) => {
        rr(x, CX + i * CW, CY - 40, CW - 4, 34, 6); x.fillStyle = "#1b2b48"; x.fill();
        label(x, c, CX + i * CW + (CW - 4) / 2, CY - 23, 17, C.edge, "center", true, true);
      });
      st.grid.forEach((row, r) => row.forEach((v, c) => {
        const px = CX + c * CW, py = CY + r * RH, id = `c${r}_${c}`, fixed = rows[r][c] !== "";
        rr(x, px, py, CW - 4, RH - 4, 6);
        x.fillStyle = st.marks ? (st.marks[r][c] === 1 ? "#143a2c" : st.marks[r][c] === -1 ? "#40161c" : "#101a2e")
                     : fixed ? "#101a2e" : st.sel === id ? "#1d2f52" : C.pale;
        x.fill();
        x.lineWidth = st.sel === id ? 4 : 2;
        x.strokeStyle = st.marks ? (st.marks[r][c] === 1 ? C.ok : st.marks[r][c] === -1 ? C.bad : C.grid)
                        : st.sel === id ? C.edge : C.line;
        x.stroke();
        const yMid = st.marks && st.marks[r][c] === -1 ? py + RH / 2 - 9 : py + RH / 2 - 2;
        label(x, v, px + (CW - 4) / 2, yMid, 19, fixed ? C.soft : C.fg, "center", !fixed, true);
        if (st.marks && st.marks[r][c] === -1)
          label(x, String(want[r][c]), px + (CW - 4) / 2, py + RH - 13, 15, C.ok, "center", true, true);
        if (!fixed) st.hits.push({ id, px, py, w: CW - 4, h: RH - 4 });
      }));
      ["0","1","2","3","4","5","6","7","8","9",".","←"].forEach((k, i) => {
        const px = 36 + (i % 6) * 68, py = KEYTOP + Math.floor(i / 6) * 54, w = 60, h = 46;
        rr(x, px, py, w, h, 8);
        x.fillStyle = st.hover === "k" + k ? "#1d2f52" : C.pale; x.fill();
        x.lineWidth = 2; x.strokeStyle = C.line; x.stroke();
        label(x, k, px + w / 2, py + h / 2, 21, C.fg, "center", true);
        st.hits.push({ id: "k" + k, px, py, w, h });
      });
      label(x, opts.foot || "Tap a cell, then use the keypad. Only fill a cell when that variable changes.",
            36, KEYTOP + 124, 16, C.soft);
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return;
        const h = hitAt(st.hits, px, py); if (!h) return;
        if (h.id[0] === "c") st.sel = h.id;
        else if (st.sel) {
          const [r, c] = st.sel.slice(1).split("_").map(Number), k = h.id.slice(1);
          if (k === "←") st.grid[r][c] = st.grid[r][c].slice(0, -1);
          /* A trace table holds a loop counter; a capacity calculation holds
           * 6,400,000. The cap is the widest value a cell can show, not a rule
           * about what may be typed. */
          else if (st.grid[r][c].length < (opts.maxlen || 6)) st.grid[r][c] += k;
        }
        draw(); },
      move(px, py) { const h = hitAt(st.hits, px, py); const id = h ? h.id : null;
        if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.grid = rows.map(r => r.slice()); st.marks = null; st.sel = null; draw(); },
      filled() { return st.grid.some((r, i) => r.some((v, c) => rows[i][c] === "" && v !== "")); },
      check() {
        st.locked = true;
        let right = 0, total = 0;
        st.marks = st.grid.map((row, r) => row.map((v, c) => {
          if (rows[r][c] !== "") return 0;
          total++;
          const ok = v.trim() === String(want[r][c]).trim();
          if (ok) right++;
          return ok ? 1 : -1;
        }));
        draw();
        return { ok: right === total, got: right, max: total,
          msg: right === total
               ? (opts.msgOk || "Every value matches what the program would produce.")
               : `${right} of ${total} cells right. The correct values are shown in green.` };
      },
      lock() { st.locked = true; draw(); },
      solve() { st.grid = want.map(r => r.map(v => String(v))); draw(); }
    };
    draw(); return api;
  }

  // ---------- 2. find the faulty line ----------
  function BugLine(opts) {
    const cv = base(), x = cv.getContext("2d");
    const code = opts.code, lineNo = opts.line, kind = opts.kind;
    const st = { pick: null, kindPick: null, locked: false, hover: null, hits: [] };
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || "Find the error", 36, 42, 25, C.edge, "left", true);
      label(x, "Tap the line with the error, then say which kind of error it is.", 36, 74, 18, C.soft);
      code.forEach((ln, i) => {
        const py = 112 + i * 33, n = i + 1, picked = st.pick === n;
        const right = st.locked && n === lineNo, wrong = st.locked && picked && n !== lineNo;
        rr(x, 36, py - 15, W - 316, 30, 6);
        if (right || wrong || picked || st.hover === "l" + n) {
          x.fillStyle = right ? "#143a2c" : wrong ? "#40161c" : picked ? "#1d2f52" : "#16233d"; x.fill();
        }
        if (right || wrong) { x.lineWidth = 3; x.strokeStyle = right ? C.ok : C.bad; x.stroke(); }
        label(x, String(n).padStart(2, " "), 48, py, 16, "#587193", "left", false, true);
        codeLine(x, ln, 88, py, 18);
        st.hits.push({ id: "l" + n, px: 36, py: py - 15, w: W - 316, h: 30 });
      });
      ["Syntax", "Logic"].forEach((k, i) => {
        const px = W - 248, py = 150 + i * 96, w = 200, h = 74;
        const picked = st.kindPick === k;
        const right = st.locked && k === kind, wrong = st.locked && picked && k !== kind;
        rr(x, px, py, w, h, 12);
        x.fillStyle = right ? "#143a2c" : wrong ? "#40161c" : picked || st.hover === "k" + k ? "#1d2f52" : C.pale; x.fill();
        x.lineWidth = right || wrong || picked ? 5 : 3;
        x.strokeStyle = right ? C.ok : wrong ? C.bad : picked ? C.edge : C.line; x.stroke();
        label(x, k + " error", px + w / 2, py + h / 2, 22, C.fg, "center", true);
        st.hits.push({ id: "k" + k, px, py, w, h });
      });
      if (st.locked && opts.fix) label(x, "Fix: " + opts.fix, 36, H - 30, 18, C.ok);
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return;
        const h = hitAt(st.hits, px, py); if (!h) return;
        if (h.id[0] === "l") st.pick = +h.id.slice(1); else st.kindPick = h.id.slice(1);
        draw(); },
      move(px, py) { const h = hitAt(st.hits, px, py); const id = h ? h.id : null;
        if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.pick = null; st.kindPick = null; draw(); },
      filled() { return st.pick !== null && st.kindPick !== null; },
      check() {
        st.locked = true;
        const lineOk = st.pick === lineNo, kindOk = st.kindPick === kind;
        const got = (lineOk ? 1 : 0) + (kindOk ? 1 : 0);
        draw();
        return { ok: got === 2, got, max: 2,
          msg: got === 2 ? "Correct: right line, right kind of error."
               : `${lineOk ? "Right line" : "The error is on line " + lineNo}, and it is a ${kind.toLowerCase()} error.` };
      },
      lock() { st.locked = true; draw(); },
      solve() { st.pick = lineNo; st.kindPick = kind; draw(); }
    };
    draw(); return api;
  }

  // ---------- 3. stepping a search ----------
  function SearchStep(opts) {
    const cv = base(), x = cv.getContext("2d");
    const list = opts.list, target = opts.target, mode = opts.mode || "binary";
    const wanted = (() => {
      const seq = [];
      if (mode === "linear") { for (let i = 0; i < list.length; i++) { seq.push(i); if (list[i] === target) break; } }
      else { let lo = 0, hi = list.length - 1;
        while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); seq.push(mid);
          if (list[mid] === target) break; if (list[mid] < target) lo = mid + 1; else hi = mid - 1; } }
      return seq;
    })();
    const st = { step: 0, wrong: 0, locked: false, hover: null, hits: [], dead: [] };
    const CW = Math.min(88, (W - 90) / list.length), CY = 248;
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || (mode === "binary" ? "Step through the binary search" : "Step through the linear search"),
            36, 42, 25, C.edge, "left", true);
      label(x, `Find ${target}. Tap the item the algorithm checks next.`, 36, 78, 20, C.fg);
      label(x, `Checks so far: ${st.step}${st.wrong ? "   ·   wrong taps: " + st.wrong : ""}`, 36, 110, 18, st.wrong ? C.bad : C.soft);
      list.forEach((v, i) => {
        const px = 46 + i * CW, checked = wanted.slice(0, st.step).includes(i), out = st.dead.includes(i);
        rr(x, px, CY, CW - 8, 76, 10);
        x.fillStyle = checked ? "#143a2c" : out ? "#161d2d" : st.hover === "i" + i ? "#1d2f52" : C.pale; x.fill();
        x.lineWidth = checked ? 4 : 2; x.strokeStyle = checked ? C.ok : out ? C.grid : C.line; x.stroke();
        label(x, String(v), px + (CW - 8) / 2, CY + 38, 22, out ? C.dim : C.fg, "center", true);
        label(x, String(i), px + (CW - 8) / 2, CY + 98, 15, C.soft, "center");
        st.hits.push({ id: "i" + i, px, py: CY, w: CW - 8, h: 76 });
      });
      label(x, "index", 40, CY + 98, 15, C.soft, "right");
      label(x, mode === "binary"
            ? "A binary search halves what is left each time: anything greyed out has been ruled out."
            : "A linear search checks every item in turn, starting from the left.", 36, H - 38, 18, C.soft);
      api.dirty = true;
    }
    function ruleOut(mid) {
      if (mode !== "binary") { for (let i = 0; i <= mid; i++) if (!st.dead.includes(i)) st.dead.push(i); return; }
      if (list[mid] === target) return;
      if (list[mid] < target) { for (let i = 0; i <= mid; i++) if (!st.dead.includes(i)) st.dead.push(i); }
      else { for (let i = mid; i < list.length; i++) if (!st.dead.includes(i)) st.dead.push(i); }
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return;
        const h = hitAt(st.hits, px, py); if (!h) return;
        const i = +h.id.slice(1);
        if (i === wanted[st.step]) { ruleOut(i); st.step++; } else st.wrong++;
        draw(); },
      move(px, py) { const h = hitAt(st.hits, px, py); const id = h ? h.id : null;
        if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.step = 0; st.wrong = 0; st.dead = []; draw(); },
      filled() { return st.step > 0; },
      check() {
        const done = st.step >= wanted.length;
        const ok = done && st.wrong === 0;
        st.locked = ok; draw();
        return { ok, got: ok ? 1 : 0, max: 1, incomplete: !done,
          msg: ok ? `Correct: ${wanted.length} check${wanted.length === 1 ? "" : "s"} to find ${target}.`
               : !done ? `Keep going: the algorithm hasn't reached ${target} yet.`
               : `Found, but with ${st.wrong} wrong tap${st.wrong === 1 ? "" : "s"}. Press Clear and follow the algorithm exactly.` };
      },
      lock() { st.locked = true; draw(); },
      solve() { st.step = 0; st.dead = []; wanted.forEach(i => { ruleOut(i); st.step++; }); st.wrong = 0; draw(); }
    };
    draw(); return api;
  }

  // ---------- 4. stepping a sort ----------
  function SortStep(opts) {
    const cv = base(), x = cv.getContext("2d");
    const mode = opts.mode || "bubble";
    const start = opts.list.slice();
    const st = { list: start.slice(), sel: null, swaps: 0, locked: false, hover: null, hits: [], marks: null };
    const target = (() => {
      const a = start.slice();
      if (mode === "bubble") { for (let i = 0; i < a.length - 1; i++) if (a[i] > a[i + 1]) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; } return a; }
      return a.slice().sort((p, q) => p - q);
    })();
    const CW = Math.min(104, (W - 90) / start.length), CY = 258;
    function draw() {
      st.hits = []; bg(x);
      label(x, opts.title || (mode === "bubble" ? "Complete one pass of a bubble sort" : "Sort the list with an insertion sort"),
            36, 42, 25, C.edge, "left", true);
      label(x, mode === "bubble"
            ? "Compare each neighbouring pair from the left. Tap two items to swap them."
            : "Build the sorted list from the left. Tap two items to swap them.", 36, 76, 19, C.fg);
      label(x, `Swaps: ${st.swaps}`, 36, 108, 18, C.soft);
      st.list.forEach((v, i) => {
        const px = 46 + i * CW, sel = st.sel === i, right = st.marks && st.marks[i];
        rr(x, px, CY, CW - 10, 86, 12);
        x.fillStyle = right === true ? "#143a2c" : right === false ? "#40161c" : sel || st.hover === "i" + i ? "#1d2f52" : C.pale;
        x.fill();
        x.lineWidth = sel ? 5 : 3;
        x.strokeStyle = right === true ? C.ok : right === false ? C.bad : sel ? C.edge : C.line; x.stroke();
        label(x, String(v), px + (CW - 10) / 2, CY + 43, 26, C.fg, "center", true);
        st.hits.push({ id: "i" + i, px, py: CY, w: CW - 10, h: 86 });
      });
      label(x, mode === "bubble" ? "One pass only: afterwards the largest value should have bubbled to the right."
                                 : "Insertion sort: take each item and move it left until it sits in the right place.",
            36, H - 38, 18, C.soft);
      api.dirty = true;
    }
    const api = {
      canvas: cv, dirty: true,
      down(px, py) { if (st.locked) return;
        const h = hitAt(st.hits, px, py); if (!h) return;
        const i = +h.id.slice(1);
        if (st.sel === null) st.sel = i;
        else if (st.sel === i) st.sel = null;
        else { const t = st.list[st.sel]; st.list[st.sel] = st.list[i]; st.list[i] = t; st.swaps++; st.sel = null; }
        draw(); },
      move(px, py) { const h = hitAt(st.hits, px, py); const id = h ? h.id : null;
        if (id !== st.hover) { st.hover = id; draw(); } },
      up() {}, leave() { st.hover = null; draw(); },
      clear() { if (st.locked) return; st.list = start.slice(); st.swaps = 0; st.sel = null; st.marks = null; draw(); },
      filled() { return true; },   // a pass that needs no swaps is still an answer
      check() {
        st.locked = true;
        st.marks = st.list.map((v, i) => v === target[i]);
        const ok = st.marks.every(Boolean);
        draw();
        return { ok, got: ok ? 1 : 0, max: 1,
          msg: ok ? (mode === "bubble" ? `Correct: after one pass the list reads ${target.join(", ")}.`
                                       : `Sorted: ${target.join(", ")}.`)
               : `Not yet. It should read ${target.join(", ")}. Work from the left, one comparison at a time.` };
      },
      lock() { st.locked = true; draw(); },
      solve() { st.list = target.slice(); st.sel = null; st.swaps = Math.max(st.swaps, 1); draw(); }
    };
    draw(); return api;
  }

  // ---------- Algorithm arena: a timed mix of the topic's skills ----------
  const shuffled = n => { const a = []; while (a.length < n) { const v = 2 + Math.floor(Math.random() * 60); if (!a.includes(v)) a.push(v); } return a; };
  const ARENA_BUGS = [
    [["total = 0", "for i = 1 to 5", "  total = total + i", "next j"], 4, "Syntax", "next i, to match the loop variable", 0],
    [["print('Hello)"], 1, "Syntax", "Close the quotation mark", 0],
    [["if mark > 50 then", "  print('Pass')", "endif"], 1, "Logic", "Use >= so exactly 50 passes", 0],
    [["n = 5", "while n > 0", "  print(n)", "  n = n + 1", "endwhile"], 4, "Logic", "Change to n = n - 1", 1],
    [["x = input('Number: ')", "if x = 10 then", "  print('Ten')", "endif"], 2, "Syntax", "Use == to compare", 1],
    [["for i = 1 to 3", "  print(i)", "next i", "print(total)"], 4, "Logic", "total was never given a value", 2],
    [["a = [4, 7, 2]", "print(a[3])"], 2, "Logic", "The last index is 2, not 3", 2],
    [["whlie count < 10", "  count = count + 1", "endwhile"], 1, "Syntax", "Spell it while", 0]
  ];
  function arenaCase(level) {
    const pick = Math.floor(Math.random() * 3);
    if (pick === 0) {
      const sorted = shuffled(level < 1 ? 7 : 9).sort((a, b) => a - b);
      const target = sorted[Math.floor(Math.random() * sorted.length)];
      const mode = level < 1 ? "linear" : "binary";
      return { t: "searchstep", key: `s${mode}${target}${sorted[0]}`, list: sorted, target, mode,
               answer: mode === "binary" ? "binary search" : "linear search",
               q: `Run a ${mode} search for ${target}.` };
    }
    if (pick === 1) {
      const list = shuffled(level < 1 ? 4 : 6);
      const mode = level < 2 ? "bubble" : "insertion";
      return { t: "sortstep", key: `o${mode}${list.join("")}`, list, mode,
               answer: mode === "bubble" ? "one pass of a bubble sort" : "an insertion sort",
               q: mode === "bubble" ? "Complete one pass of a bubble sort." : "Sort the list with an insertion sort." };
    }
    const pool = ARENA_BUGS.filter(b => b[4] <= level);
    const b = pool[Math.floor(Math.random() * pool.length)];
    return { t: "bugline", key: "b" + b[0].join(""), code: b[0], line: b[1], kind: b[2], fix: b[3],
             answer: `line ${b[1]}, a ${b[2].toLowerCase()} error`, q: "Find the error." };
  }

  function make(task) {
    /* A working-out table. The same board as a trace, because the interaction
     * is the same - point at a cell, type the value - but a different thing to
     * do: the pupil works out each step of a calculation rather than following
     * a program. It is a separate type so a lesson record, a plan and a teacher
     * can tell the two apart. */
    if (task.t === "calc") return Trace(Object.assign({
      foot: "Tap a cell, then use the keypad. Show every step of your working.",
      // the window already says "Correct!" above this, so it does not say it again
      msgOk: "Every step of the working is right.",
      fit: true, maxlen: 10 }, task));
    if (task.t === "trace") return Trace(task);
    if (task.t === "bugline") return BugLine(task);
    if (task.t === "searchstep") return SearchStep(task);
    if (task.t === "sortstep") return SortStep(task);
    return null;
  }
  window.R360Algo = { make, Trace, BugLine, SearchStep, SortStep, arenaCase, codeLine, tokenise, CODE,
                      TYPES: ["calc", "trace", "bugline", "searchstep", "sortstep"] };
})();
