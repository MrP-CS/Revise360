/* The Revise 360 Python screen, drawn on a canvas.
 *
 * In a headset there is no DOM to lay out, but a pupil should not meet a
 * different course because of that. So this draws the same interface the page
 * draws - the same two columns in the same proportions, the same boxes in the
 * same order, the same headings, the same colours, the same buttons in the same
 * places - into a 2D context, which js/vr.js then hangs in the room as one
 * large screen with a keyboard under it.
 *
 * The geometry is not invented. tools/tests/measurescreen.py opens a real
 * Python activity in a browser and reports the box of every region; the numbers
 * below are those measurements, in the same 1397x864 space the window occupies
 * at 1440x900. The colours are read from css/style.css at draw time, so there
 * is still one palette.
 *
 * It knows nothing about three.js, WebXR or controllers. It takes a state and
 * draws it, and returns where everything ended up so the caller can work out
 * what was pointed at.
 */
(function (root, factory) {
  const API = factory();
  if (typeof module === "object" && module.exports) module.exports = API;
  if (root) root.R360PyScreen = API;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  // ---- the measured geometry, in layout pixels -------------------------
  const W = 1397, H = 864;
  const L = {
    pad: 19, headH: 64, top: 81, bottom: 843,
    leftX: 19, leftW: 725,
    rightX: 760, rightW: 618,
    edY: 81, edH: 270, gutW: 33,
    barY: 361, barH: 78,
    runY: 449, runH: 95,
    outhY: 553, outY: 582, outH: 205,
    actY: 797, actH: 46
  };

  const FONT = '"Segoe UI", system-ui, sans-serif';
  const MONO = "Consolas, monospace";

  /* One palette, read off :root when it is drawn, so a colour changed in
   * css/style.css changes here too and nothing has to be kept in step. */
  const FALLBACK = { panel: "#1c2c4a", bg2: "#0e1628", line: "#3c5a87", fg: "#f0f4fa",
                     soft: "#b4c4dc", edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", info: "#5ab4ff" };
  function palette() {
    const out = {};
    let cs = null;
    try { cs = getComputedStyle(document.documentElement); } catch (e) { /* no document */ }
    const get = (name, fb) => {
      if (!cs) return fb;
      const v = cs.getPropertyValue(name).trim();
      return v || fb;
    };
    out.panel = get("--panel", FALLBACK.panel); out.bg2 = get("--bg2", FALLBACK.bg2);
    out.line = get("--line", FALLBACK.line); out.fg = get("--fg", FALLBACK.fg);
    out.soft = get("--soft", FALLBACK.soft); out.edge = get("--edge", FALLBACK.edge);
    out.ok = get("--ok", FALLBACK.ok); out.bad = get("--bad", FALLBACK.bad);
    out.info = get("--info", FALLBACK.info);
    // the surfaces the stylesheet names directly rather than through a token
    out.task = "#13203a"; out.teach = "#122a3d"; out.editor = "#0b1322";
    out.gutter = "#0a1120"; out.strip = "#101c31"; out.eg = "#0b1424";
    out.ink = "#0f1626"; out.dim = "#4a5a78"; out.errText = "#ff9a9a";
    out.runIn = "#ffd98a"; out.runFile = "#cfe3ff";
    return out;
  }

  // ---- small drawing helpers ------------------------------------------
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function box(c, x, y, w, h, r, fill, stroke, lw) {
    rr(c, x, y, w, h, r);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.stroke(); }
  }
  function wrap(c, text, font, maxW) {
    c.font = font;
    const out = [];
    String(text == null ? "" : text).split("\n").forEach(par => {
      let line = "";
      par.split(/\s+/).forEach(w2 => {
        if (!w2) return;
        const t = line ? line + " " + w2 : w2;
        if (c.measureText(t).width > maxW && line) { out.push(line); line = w2; } else line = t;
      });
      out.push(line);
    });
    return out;
  }

  /* A sentence with prescribed data in it. The authors write `25`; on the page
   * that becomes a boxed, monospace span in the amber a number is drawn in, and
   * it is the same thing here because it is the same lexer and the same
   * colours. Colour is never the only signal: it is boxed and monospace too. */
  function layoutRich(c, text, font, mono, maxW) {
    const TOK = typeof window !== "undefined" ? window.R360Tok : null;
    const pieces = [];
    String(text == null ? "" : text).split(/(`[^`]*`)/).forEach(s => {
      if (!s) return;
      if (s.length > 1 && s[0] === "`" && s[s.length - 1] === "`") {
        const inner = s.slice(1, -1);
        pieces.push({ t: inner, code: true, toks: TOK ? TOK.lex(inner) : [{ t: inner, k: "t" }] });
      } else s.split(/(\s+)/).forEach(w2 => { if (w2) pieces.push({ t: w2, code: false }); });
    });
    const lines = [[]]; let w2 = 0;
    const last = () => lines[lines.length - 1];
    pieces.forEach(p => {
      const blank = /^\s+$/.test(p.t);
      if (blank && !last().length) return;
      c.font = p.code ? mono : font;
      const pw = c.measureText(p.t).width + (p.code ? 12 : 0);
      if (w2 + pw > maxW && last().length) { lines.push([]); w2 = 0; if (blank) return; }
      last().push({ t: p.t, code: p.code, toks: p.toks, w: pw });
      w2 += pw;
    });
    return lines.filter(l => l.length);
  }
  function drawRich(c, lines, x, y, lh, font, mono, colour, size, P) {
    const TOK = typeof window !== "undefined" ? window.R360Tok : null;
    lines.forEach((ln, i) => {
      let px = x; const ty = y + i * lh;
      ln.forEach(p => {
        if (p.code) {
          rr(c, px, ty - 2, p.w, size * 1.3, 5);
          c.fillStyle = "rgba(255,255,255,.07)"; c.fill();
          c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,.16)"; c.stroke();
          c.font = mono; c.textAlign = "left"; c.textBaseline = "top";
          let tx = px + 6;
          (p.toks || []).forEach(tk => {
            c.fillStyle = (TOK && TOK.colours[tk.k]) || colour;
            c.fillText(tk.t, tx, ty); tx += c.measureText(tk.t).width;
          });
        } else {
          c.font = font; c.fillStyle = colour; c.textAlign = "left"; c.textBaseline = "top";
          c.fillText(p.t, px, ty);
        }
        px += p.w;
      });
    });
  }
  // a whole program, coloured by the one lexer
  function drawProgram(c, src, x, y, size, lh, P) {
    const Py = typeof window !== "undefined" ? window.R360Py : null;
    c.textAlign = "left"; c.textBaseline = "top";
    String(src).split("\n").forEach((line, i) => {
      let px = x;
      c.font = size + "px " + MONO;
      for (const tok of (Py ? Py.tokens(line) : [{ t: line, c: P.fg }])) {
        c.fillStyle = tok.c; c.fillText(tok.t, px, y + i * lh);
        px += c.measureText(tok.t).width;
      }
    });
  }

  /* A button, drawn as css/style.css draws one: .btn is the amber one, .ghost
   * is outlined. The hit area returned is larger than the paint, because a
   * controller ray is not a mouse - the picture matches the page and the target
   * does not have to. */
  const HIT_GROW = 14;
  function button(c, hits, b, P) {
    const size = b.small ? 14 : 15;
    c.font = "700 " + size + "px " + FONT;
    const tw = c.measureText(b.label).width;
    const padX = b.small ? 12 : 18, padY = b.small ? 7 : 10;
    const w = b.w || Math.round(tw + padX * 2), h = b.h || Math.round(size * 1.35 + padY * 2);
    const x = b.right ? b.x - w : b.x, y = b.y;
    c.globalAlpha = b.disabled ? 0.4 : 1;
    if (b.ghost) box(c, x, y, w, h, b.small ? 10 : 12, null, b.on ? P.edge : P.line, 2);
    else box(c, x, y, w, h, b.small ? 10 : 12, P.edge, null);
    if (b.hover && !b.disabled) box(c, x - 3, y - 3, w + 6, h + 6, 15, null, P.edge, 2);
    c.fillStyle = b.ghost ? (b.on ? P.edge : P.fg) : P.ink;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(b.label, x + w / 2, y + h / 2 + 1);
    c.globalAlpha = 1;
    /* A disabled control is still there - Run while Python downloads, the way
     * on before the activity is finished - so it is still a hit area, marked
     * as disabled. A press on it does nothing; leaving it out of the list
     * would say the control does not exist. */
    if (b.id)
      hits.push({ id: b.id, x: x - HIT_GROW, y: y - HIT_GROW,
                  w: w + HIT_GROW * 2, h: h + HIT_GROW * 2, disabled: !!b.disabled });
    return { x, y, w, h };
  }

  // =====================================================================
  function draw(c, s) {
    const P = palette(), hits = [];
    const M = s.model;
    c.save();
    c.clearRect(0, 0, W, H);

    // ---- the window itself: the same panel, the same border in the station's
    // colour, the same radius as #box
    box(c, 2, 2, W - 4, H - 4, 22, P.panel, s.titleColour || P.ok, 3);

    // ---- the title bar
    c.save(); rr(c, 3, 3, W - 6, L.headH, 18); c.clip();
    c.fillStyle = s.titleColour || P.ok; c.fillRect(3, 3, W - 6, L.headH);
    c.restore();
    c.fillStyle = P.ink; c.font = "700 19px " + FONT;
    c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText(s.title || "", 22, 3 + L.headH / 2);
    // the close cross, where the page puts it, and a recentre beside it -
    // the one control the page has no need for
    button(c, hits, { id: "recentre", label: "⌖ Recentre", x: W - 72, y: 17, right: true,
                      ghost: true, small: true, hover: s.hover === "recentre" }, P);
    c.fillStyle = P.ink; c.font = "26px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("×", W - 41, 3 + L.headH / 2);
    hits.push({ id: "close", x: W - 41 - 30, y: 3, w: 60, h: L.headH });

    const r = s.runtimeDown ? null : 1;
    // ======================= the left column ==========================
    const leftBottom = drawLeft(c, hits, s, P, M);
    // ======================= the right column =========================
    drawRight(c, hits, s, P, M);

    // ---- an overlay, over the whole window, the way the page puts the hint
    // pane over the editor rather than in a window of its own
    let over = null;
    if (s.overlay) over = drawOverlay(c, hits, s, P);

    c.restore();
    return { hits, caret: s._caret || null, leftContentH: leftBottom, overlay: over };
  }

  // ---------------------------------------------------------------------
  function drawLeft(c, hits, s, P, M) {
    /* Everything to read, in one box each, with the marking below it - and the
     * reading scrolls while the marking stays where it is, exactly as the page
     * behaves when a long question meets a short window. */
    const x = L.leftX, w = L.leftW;
    const resultH = Math.min(260, measureResult(c, s, P, w));
    const scrollTop = L.top, scrollH = L.bottom - L.top - (resultH ? resultH + 12 : 0);

    c.save();
    c.beginPath(); c.rect(x, scrollTop, w, scrollH); c.clip();
    const off = -(s.scrollLeft || 0);
    let y = scrollTop + off;

    // the stage: the chip, where they are, and what the stage means
    c.font = "700 14px " + FONT;
    const chipW = Math.round(c.measureText(M.stage).width + 26);
    box(c, x, y, chipW, 31, 999, P.panel, stageColour(M, P), 2);
    c.fillStyle = stageColour(M, P); c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(M.stage, x + chipW / 2, y + 16);
    c.textAlign = "left"; c.font = "700 16px " + FONT; c.fillStyle = P.fg;
    c.fillText(`Activity ${s.n + 1} of ${s.total}`, x + chipW + 14, y + 16);
    const whereW = c.measureText(`Activity ${s.n + 1} of ${s.total}`).width;
    c.font = "15px " + FONT; c.fillStyle = P.soft;
    c.fillText(M.says, x + chipW + 28 + whereW, y + 16);
    y += 40;

    // one bubble per activity, the one they are on filled in
    if (s.total > 1) {
      s.dots.forEach((d, i) => {
        const bx = x + i * 34;
        box(c, bx, y, 27, 27, 999, d.now ? P.edge : null, d.now ? P.edge : (d.done ? P.ok : P.line), 2);
        c.fillStyle = d.now ? "#10203a" : (d.done ? P.ok : P.soft);
        c.font = "700 14px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(String(i + 1), bx + 13, y + 14);
      });
      y += 36;
    }

    // YOUR TASK
    const taskTop = y;
    c.font = "17px " + FONT;
    const stepLines = M.steps.map(st => layoutRich(c, st, "17px " + FONT, "16px " + MONO, w - 32 - 38));
    const briefLines = M.brief.map(b => layoutRich(c, b, "16px " + FONT, "15px " + MONO, w - 32 - 22));
    let th = 20 + 28 + 10;
    stepLines.forEach(l => { th += Math.max(28, l.length * 25) + 8; });
    if (briefLines.length) { th += 10; briefLines.forEach(l => { th += l.length * 23 + 4; }); }
    th += 14;
    box(c, x, taskTop, w, th, 14, P.task, P.line, 2);
    c.fillStyle = P.edge; c.font = "700 14px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("YOUR TASK", x + 16, taskTop + 20);
    if (s.canSpeak)
      button(c, hits, { id: "say", label: s.speaking ? "■ Stop reading" : "🔊 Read aloud",
                        x: x + w - 16, y: taskTop + 14, right: true, ghost: true, small: true,
                        on: s.speaking, hover: s.hover === "say" }, P);
    let ty = taskTop + 56;
    stepLines.forEach((l, i) => {
      box(c, x + 16, ty - 2, 28, 28, 999, P.edge, null);
      c.fillStyle = "#10203a"; c.font = "700 15px " + FONT;
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(i + 1), x + 30, ty + 12);
      c.textAlign = "left";
      drawRich(c, l, x + 54, ty + 3, 25, "17px " + FONT, "16px " + MONO, P.fg, 17, P);
      ty += Math.max(28, l.length * 25) + 8;
    });
    if (briefLines.length) {
      c.strokeStyle = P.line; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x + 16, ty + 2); c.lineTo(x + w - 16, ty + 2); c.stroke();
      ty += 10;
      briefLines.forEach(l => {
        c.beginPath(); c.arc(x + 24, ty + 9, 3, 0, 7); c.fillStyle = P.soft; c.fill();
        drawRich(c, l, x + 36, ty, 23, "16px " + FONT, "15px " + MONO, P.fg, 16, P);
        ty += l.length * 23 + 4;
      });
    }
    y = taskTop + th + 10;

    // Learn
    if (M.teach) {
      const top = y;
      const sayLines = layoutRich(c, M.teach.say, "16px " + FONT, "15px " + MONO, w - 36);
      let eh = 18 + 23 + 6 + sayLines.length * 23 + 8;
      if (M.teach.code.length) eh += M.teach.code.length * 21 + 22;
      if (M.teach.out.length) eh += M.teach.out.length * 22 + 10;
      const notes = M.teach.lines.map(l => ({ l, lines: layoutRich(c, l.note, "15px " + FONT, "14px " + MONO, w - 120) }));
      notes.forEach(n2 => { eh += Math.max(22, n2.lines.length * 21) + 6; });
      eh += 14;
      box(c, x, top, w, eh, 10, P.teach, null);
      c.fillStyle = P.info; c.fillRect(x, top + 2, 5, eh - 4);
      c.fillStyle = P.fg; c.font = "700 16px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText("Learn", x + 17, top + 18);
      let ey = top + 47;
      drawRich(c, sayLines, x + 17, ey, 23, "16px " + FONT, "15px " + MONO, P.fg, 16, P);
      ey += sayLines.length * 23 + 8;
      if (M.teach.code.length) {
        const ch = M.teach.code.length * 21 + 14;
        box(c, x + 17, ey, w - 34, ch, 8, P.eg, null);
        drawProgram(c, M.teach.code.join("\n"), x + 27, ey + 8, 15, 21, P);
        ey += ch + 8;
      }
      if (M.teach.out.length) {
        c.fillStyle = P.info; c.font = "700 13px " + FONT; c.fillText("SHOWS", x + 17, ey + 3);
        c.fillStyle = P.soft; c.font = "16px " + FONT;
        M.teach.out.forEach((o, i) => c.fillText(o, x + 85, ey + i * 22));
        ey += M.teach.out.length * 22 + 10;
      }
      notes.forEach(n2 => {
        c.fillStyle = P.eg; rr(c, x + 17, ey - 1, 86, 20, 5); c.fill();
        drawProgram(c, n2.l.code.slice(0, 11), x + 22, ey + 2, 13, 18, P);
        drawRich(c, n2.lines, x + 112, ey, 21, "15px " + FONT, "14px " + MONO, P.soft, 15, P);
        ey += Math.max(22, n2.lines.length * 21) + 6;
      });
      y = top + eh + 10;
    }
    c.restore();

    // the scrollbar, where there is more than fits
    const contentH = y - scrollTop + (s.scrollLeft || 0);
    if (contentH > scrollH) {
      const frac = scrollH / contentH, barH = Math.max(40, scrollH * frac);
      const barY = scrollTop + (scrollH - barH) * ((s.scrollLeft || 0) / (contentH - scrollH));
      box(c, x + w + 2, scrollTop, 6, scrollH, 3, "rgba(255,255,255,.06)", null);
      box(c, x + w + 2, barY, 6, barH, 3, P.line, null);
      button(c, hits, { id: "leftUp", label: "▲", x: x + w - 86, y: L.bottom - resultH - 46,
                        ghost: true, small: true, hover: s.hover === "leftUp" }, P);
      button(c, hits, { id: "leftDown", label: "▼", x: x + w - 42, y: L.bottom - resultH - 46,
                        ghost: true, small: true, hover: s.hover === "leftDown" }, P);
    }

    // ---- the marking, pinned below the reading, as the page pins it
    if (resultH) drawResult(c, hits, s, P, x, L.bottom - resultH, w, resultH);
    return contentH;
  }

  function measureResult(c, s, P, w) {
    if (!s.tryLine && !(s.tests || []).length && !s.result) return 0;
    let h = 10;
    if (s.tryLine) h += wrap(c, s.tryLine, "15px " + FONT, w - 10).length * 21 + 6;
    (s.tests || []).forEach(t => {
      h += 24;
      if (!t.ok && t.why) h += wrap(c, t.why, "14px " + FONT, w - 70).length * 19;
      h += 10;
    });
    if (s.result) h += wrap(c, s.result, "16px " + FONT, w - 40).length * 22 + 20;
    return h + 8;
  }
  function drawResult(c, hits, s, P, x, y, w, h) {
    c.save(); c.beginPath(); c.rect(x, y, w, h + 4); c.clip();
    let ry = y + 4;
    if (s.tryLine) {
      c.fillStyle = P.edge; c.font = "15px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
      wrap(c, s.tryLine, c.font, w - 10).forEach((l, i) => c.fillText(l, x, ry + i * 21));
      ry += wrap(c, s.tryLine, c.font, w - 10).length * 21 + 6;
    }
    (s.tests || []).forEach(t => {
      const why = !t.ok && t.why ? wrap(c, t.why, "14px " + FONT, w - 70) : [];
      const rh = 24 + why.length * 19;
      box(c, x, ry, w, rh, 10, "#15223b", t.ok ? P.ok : P.bad, 2);
      c.fillStyle = t.ok ? P.ok : P.bad; c.font = "700 15px " + MONO;
      c.textAlign = "left"; c.textBaseline = "top";
      c.fillText(t.ok ? "✓" : "✗", x + 10, ry + 4);
      c.fillStyle = P.fg; c.font = "14px " + FONT;
      c.fillText((t.given ? "Input " + t.given + " → " : "") + "expected " + String(t.want).replace(/\n/g, " · "), x + 34, ry + 5);
      c.fillStyle = P.soft;
      why.forEach((l, i) => c.fillText(l, x + 34, ry + 24 + i * 19));
      ry += rh + 10;
    });
    if (s.result) {
      const lines = wrap(c, s.result, "16px " + FONT, w - 40);
      const fh = lines.length * 22 + 16;
      box(c, x, ry, w, fh, 14, s.resultOk ? "#143a2c" : "#40161c", s.resultOk ? P.ok : P.bad, 1);
      c.fillStyle = P.fg; c.font = "16px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
      lines.forEach((l, i) => c.fillText(l, x + 14, ry + 9 + i * 22));
    }
    c.restore();
  }

  function stageColour(M, P) {
    if (M.opt) return P.ok;
    if (M.kind === "try" || M.kind === "predict") return "#8fd4ff";
    if (M.kind === "debug") return "#ffc48c";
    if (M.kind === "change" || M.kind === "complete") return "#cdb8ff";
    return P.edge;
  }

  // ---------------------------------------------------------------------
  function drawRight(c, hits, s, P, M) {
    const x = L.rightX, w = L.rightW;
    /* The run example is as tall as it needs to be, up to a cap, and the output
     * takes whatever is left - the same trade the page's flex column makes.
     * A question whose test types in six lines used to draw them straight out
     * of the box and over the heading below it. */
    const hasRun = !!M.run;
    const runRows = hasRun
      ? (M.run.files.length ? 1 : 0) + Math.max(1, M.run.given.length) + M.run.shows.length : 0;
    const runH = hasRun ? Math.min(210, 44 + runRows * 21) : 0;
    const outY = (hasRun ? L.runY + runH + 10 : L.runY) + 29;
    const outH = 787 - outY;

    // ---- the editor
    box(c, x, L.edY, w, L.edH, 14, P.editor, P.line, 2);
    box(c, x + 2, L.edY + 2, L.gutW, L.edH - 4, 0, P.gutter, null);
    const SZ = 15, LH = 22, TXT = x + 2 + L.gutW + 10, TOP = L.edY + 10;
    const shown = Math.floor((L.edH - 20) / LH);
    const lines = s.text.split("\n");
    const before = s.text.slice(0, s.caret).split("\n");
    const cl = before.length - 1, cc = before[before.length - 1].length;
    let view = Math.max(0, Math.min(s.scrollEditor || 0, Math.max(0, lines.length - shown)));
    if (cl < view) view = cl;
    else if (cl >= view + shown) view = Math.min(cl - shown + 1, Math.max(0, lines.length - shown));
    c.save(); c.beginPath(); c.rect(x + 2, L.edY + 2, w - 4, L.edH - 4); c.clip();
    c.font = SZ + "px " + MONO;
    const chw = c.measureText("0").width;
    for (let i = view; i < Math.min(lines.length, view + shown); i++) {
      const ly = TOP + (i - view) * LH;
      c.font = "14px " + MONO; c.fillStyle = P.dim;
      c.textAlign = "right"; c.textBaseline = "top"; c.fillText(String(i + 1), x + 2 + L.gutW - 8, ly + 1);
      c.textAlign = "left";
      drawProgram(c, lines[i], TXT, ly, SZ, LH, P);
      if (i === cl) { c.fillStyle = P.edge; c.fillRect(TXT + cc * chw, ly - 2, 2, SZ + 6); }
    }
    c.restore();
    if (lines.length > shown) {
      c.fillStyle = P.soft; c.font = "12px " + FONT; c.textAlign = "right"; c.textBaseline = "bottom";
      c.fillText(`line ${cl + 1} of ${lines.length}`, x + w - 12, L.edY + L.edH - 6);
    }
    // pointing anywhere in the editor puts the caret there
    hits.push({ id: "editor", x: x, y: L.edY, w: w, h: L.edH, editor: true });
    s._caret = { x: TXT, y: TOP, lh: LH, chw, first: view, shown };

    // ---- the bar under the editor: Run sits between the program and its output
    box(c, x, L.barY, w, L.barH, 12, P.strip, P.line, 2);
    button(c, hits, { id: "run", label: "▶ Run", x: x + 13, y: L.barY + 9, h: 60, w: 100,
                      disabled: s.busy, hover: s.hover === "run" }, P);
    let sx = x + 124;
    if (s.canRef) {
      const rb = button(c, hits, { id: "ref", label: "Syntax reminder", x: x + 124, y: L.barY + 11, h: 56,
                                   ghost: true, small: true, hover: s.hover === "ref" }, P);
      sx = rb.x + rb.w + 14;
    }
    if (s.runtimeNote) {
      c.fillStyle = s.runtimeDown ? P.bad : P.edge; c.font = "700 14px " + FONT;
      c.textAlign = "left"; c.textBaseline = "top";
      wrap(c, s.runtimeNote, c.font, w - (sx - x) - 16).slice(0, 2)
        .forEach((l, i) => c.fillText(l, sx, L.barY + 16 + i * 19));
    } else {
      c.fillStyle = P.soft; c.font = "13px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
      wrap(c, "Point at the program to move the caret · the keyboard below types into it",
           c.font, w - (sx - x) - 16).forEach((l, i) => c.fillText(l, sx, L.barY + 20 + i * 18));
    }

    // ---- what one run has to display, above what this run did display
    if (hasRun) {
      box(c, x, L.runY, w, runH, 12, P.strip, P.line, 2);
      c.save(); c.beginPath(); c.rect(x + 2, L.runY + 2, w - 4, runH - 4); c.clip();
      c.fillStyle = P.edge; c.font = "700 13px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText("ONE RUN OF YOUR PROGRAM", x + 14, L.runY + 10);
      let ry = L.runY + 34;
      const row = (label, value, colour) => {
        c.fillStyle = P.soft; c.font = "700 13px " + FONT; c.fillText(label, x + 14, ry + 3);
        c.fillStyle = colour; c.font = "15px " + MONO;
        String(value).split("\n").forEach((l, i) => c.fillText(l, x + 128, ry + i * 21));
        ry += Math.max(1, String(value).split("\n").length) * 21 + 2;
      };
      if (M.run.files.length) row("FILE", M.run.files.join(", "), P.runFile);
      row("YOU TYPE", M.run.given.length ? M.run.given.join("\n") : "nothing", P.runIn);
      row("IT DISPLAYS", M.run.shows.join("\n"), P.ok);
      c.restore();
      if (ry > L.runY + runH) {
        // more than fits, as the page's own panel also shows
        c.fillStyle = P.soft; c.font = "12px " + FONT; c.textAlign = "right"; c.textBaseline = "bottom";
        c.fillText("\u2026 more below", x + w - 12, L.runY + runH - 4);
      }
    }

    // ---- the output
    c.fillStyle = P.edge; c.font = "700 13px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("PROGRAM OUTPUT", x, outY - 29);
    box(c, x, outY, w, outH, 14, P.gutter, P.line, 2);
    c.save(); c.beginPath(); c.rect(x + 2, outY + 2, w - 4, outH - 4); c.clip();
    c.font = "15px " + MONO; c.textAlign = "left"; c.textBaseline = "top";
    const outLines = [];
    String(s.out || s.beforeRun).split("\n").forEach(l => {
      const ws = wrap(c, l, "15px " + MONO, w - 28);
      (ws.length ? ws : [""]).forEach(x2 => outLines.push(x2));
    });
    const room = Math.floor((outH - 20) / 21);
    const oFirst = Math.max(0, Math.min(s.scrollOut || 0, Math.max(0, outLines.length - room)));
    c.fillStyle = s.err ? P.errText : (s.out ? P.fg : P.dim);
    outLines.slice(oFirst, oFirst + room).forEach((l, i) => c.fillText(l, x + 14, outY + 10 + i * 21));
    c.restore();
    if (outLines.length > room) {
      button(c, hits, { id: "outUp", label: "▲", x: x + w - 86, y: outY + outH - 42,
                        ghost: true, small: true, hover: s.hover === "outUp" }, P);
      button(c, hits, { id: "outDown", label: "▼", x: x + w - 42, y: outY + outH - 42,
                        ghost: true, small: true, hover: s.hover === "outDown" }, P);
    }

    // ---- the controls that end the attempt, where the page puts them
    /* The way on has the rightmost place whether or not it is available yet,
     * so the row does not shuffle when an activity is finished - and so the
     * unavailable one cannot land on top of the button beside it, which is what
     * it did and what hid "I need help" behind it. */
    let bx = x + w;
    if (s.mayGoOn) {
      const b = button(c, hits, { id: "next", label: s.isLast ? "Finish" : "Next question",
                                  x: bx, y: L.actY, right: true, hover: s.hover === "next" }, P);
      bx = b.x - 10;
    } else if (s.attempts) {
      const b = button(c, hits, { id: "again", label: s.againLabel, x: bx, y: L.actY,
                                  right: true, ghost: true, disabled: true }, P);
      bx = b.x - 10;
    }
    const help = button(c, hits, { id: "help", label: "I need help", x: bx, y: L.actY, right: true,
                                   ghost: true, hover: s.hover === "help" }, P);
    bx = help.x - 10;
    if (!M.noCheck) {
      const ch = button(c, hits, { id: "check", label: "Check my answer", x: bx, y: L.actY, right: true,
                                   disabled: s.busy, hover: s.hover === "check" }, P);
      bx = ch.x - 10;
    }
    if (M.hasHint)
      button(c, hits, { id: "hint", label: "Hint", x: bx, y: L.actY, right: true, ghost: true,
                        on: s.nudgeHint, hover: s.hover === "hint" }, P);
    if (s.runtimeDown)
      button(c, hits, { id: "retry", label: "Try again", x: x, y: L.actY, hover: s.hover === "retry" }, P);
  }

  // ---------------------------------------------------------------------
  /* The hint, the help and the syntax reference are panes over the window, the
   * way the page lays .hintpane over #box - not windows of their own. The
   * program is still behind, exactly as it was left. */
  function drawOverlay(c, hits, s, P) {
    const o = s.overlay;
    box(c, 3, 3, W - 6, H - 6, 20, P.eg, P.line, 2);
    const x = 24, w = W - 48;
    c.fillStyle = P.edge; c.font = "700 20px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText(o.title, x, 26);
    c.fillStyle = P.soft; c.font = "15px " + FONT;
    const lead = wrap(c, o.lead || "", c.font, w - 320);
    lead.forEach((l, i) => c.fillText(l, x + 18 + c.measureText(o.title).width * 0 + 180, 29 + i * 20));
    button(c, hits, { id: "overClose", label: o.closeLabel || "Close", x: W - 28, y: 22, right: true,
                      ghost: true, hover: s.hover === "overClose" }, P);

    let y = 78;
    c.save(); c.beginPath(); c.rect(x, y, w, H - y - 86); c.clip();
    y -= (o.scroll || 0);
    (o.blocks || []).forEach(b => {
      if (b.rung) {
        c.fillStyle = P.info; c.fillRect(x, y, 4, b.h || 24);
        c.fillStyle = P.edge; c.font = "700 14px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
        c.fillText(b.rung.toUpperCase(), x + 18, y); y += 24;
      } else if (b.say !== undefined) {
        const lines = layoutRich(c, b.say, (b.big ? "18px " : "16px ") + FONT, "16px " + MONO, w - 24);
        drawRich(c, lines, x + 18, y, b.big ? 26 : 23, (b.big ? "18px " : "16px ") + FONT, "16px " + MONO, P.fg, b.big ? 18 : 16, P);
        y += lines.length * (b.big ? 26 : 23) + 10;
      } else if (b.code !== undefined) {
        const n = String(b.code).split("\n").length, h = n * 22 + 16;
        box(c, x + 18, y, w - 36, h, 8, P.editor, null);
        drawProgram(c, b.code, x + 30, y + 8, 16, 22, P);
        y += h + 10;
      } else if (b.note !== undefined) {
        const lines = wrap(c, b.note, "15px " + FONT, w - 36);
        c.fillStyle = P.soft; c.font = "15px " + FONT; c.textAlign = "left"; c.textBaseline = "top";
        lines.forEach((l, i) => c.fillText(l, x + 18, y + i * 21));
        y += lines.length * 21 + 10;
      } else if (b.gap) y += b.gap;
    });
    c.restore();

    const foot = H - 72;
    c.fillStyle = P.soft; c.font = "15px " + FONT; c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText(o.foot || "", x, foot + 24);
    let bx = W - 28;
    (o.buttons || []).forEach(b => {
      const r = button(c, hits, { id: b.id, label: b.label, x: bx, y: foot, right: true,
                                  ghost: !b.primary, disabled: b.disabled, hover: s.hover === b.id }, P);
      bx = r.x - 10;
    });
    if ((o.blocks || []).length) {
      button(c, hits, { id: "overUp", label: "▲", x: x, y: foot, ghost: true, small: true,
                        hover: s.hover === "overUp" }, P);
      button(c, hits, { id: "overDown", label: "▼", x: x + 46, y: foot, ghost: true, small: true,
                        hover: s.hover === "overDown" }, P);
    }
    return { y };
  }

  return { W, H, L, draw, palette, layoutRich, drawRich, drawProgram, rr, wrap, FONT, MONO };
});
