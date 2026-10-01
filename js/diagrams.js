/* Revise 360 - annotated, animated 2D diagrams.
 *
 * The 3D models show what a thing looks like. These show what a thing *does*:
 * the fetch-execute cycle running, a packet being split and routed, a wave being
 * sampled, a list being sorted. Anything where the teaching point is a process
 * over time, or a structure whose shape is the point, and a paragraph of text
 * cannot carry it.
 *
 * A diagram is a function returning:
 *
 *   { w, h, steps: [{ name, caption }], render(d, step, t) }
 *
 * w and h are diagram units; the viewer scales to fit, so write to a fixed
 * canvas and never worry about the container. `step` is the index of the step
 * being shown and `t` runs 0 -> 1 across it, so a step can animate within
 * itself. render() draws the whole frame every time: there is no retained
 * scene, which keeps each diagram a single readable function.
 *
 * `d` is the drawing helper below. Everything it draws is in diagram units and
 * uses the site palette, so the diagrams look like one set rather than 29
 * separate drawings.
 */
(function () {
  "use strict";

  const PAL = {
    bg: "#0e1628", panel: "#1c2c4a", panel2: "#24395f", line: "#3c5a87",
    fg: "#f0f4fa", soft: "#b4c4dc", dim: "#6c82a6",
    edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", info: "#5ab4ff",
    violet: "#aa6eeb", orange: "#ffa028", teal: "#40c4ff", pink: "#ff7eb6"
  };

  const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

  function Draw(x, W, H) {
    const d = {
      x, W, H, c: PAL,

      // ---- timing helpers -------------------------------------------------
      ease: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
      clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
      lerp: (a, b, t) => a + (b - a) * d.clamp(t, 0, 1),
      // progress through a window of the step: seg(t, .2, .6) is 0 before .2,
      // 1 after .6, and eases between. Lets one step hold several beats.
      seg: (t, a, b) => d.ease(d.clamp((t - a) / Math.max(b - a, 1e-6), 0, 1)),
      pulse: t => .5 + .5 * Math.sin(t * Math.PI * 2),

      // ---- text -----------------------------------------------------------
      font(size, weight) { x.font = `${weight || 600} ${size}px ${FONT}`; return x; },
      measure(s, size, weight) { d.font(size, weight); return x.measureText(s).width; },
      // shrink until it fits, so a long label never runs out of its box
      fit(s, maxW, size, weight) {
        let fs = size;
        while (fs > 9 && d.measure(s, fs, weight) > maxW) fs -= 1;
        return fs;
      },
      text(tx, ty, s, o) {
        o = o || {};
        const size = o.max ? d.fit(s, o.max, o.size || 16, o.weight) : (o.size || 16);
        d.font(size, o.weight);
        x.fillStyle = o.fill || PAL.fg;
        x.textAlign = o.align || "left";
        x.textBaseline = o.baseline || "alphabetic";
        if (o.alpha !== undefined) { x.save(); x.globalAlpha = o.alpha; }
        x.fillText(s, tx, ty);
        if (o.alpha !== undefined) x.restore();
        return size;
      },
      // word-wrapped block; returns the height it used
      wrap(tx, ty, s, maxW, o) {
        o = o || {};
        const size = o.size || 14, lh = o.lh || size * 1.35;
        d.font(size, o.weight);
        const words = String(s).split(" "), lines = [];
        let line = "";
        for (const w of words) {
          const t2 = line ? line + " " + w : w;
          if (x.measureText(t2).width > maxW && line) { lines.push(line); line = w; } else line = t2;
        }
        if (line) lines.push(line);
        x.fillStyle = o.fill || PAL.soft;
        x.textAlign = o.align || "left";
        x.textBaseline = "top";
        lines.forEach((l, i) => x.fillText(l, tx, ty + i * lh));
        return lines.length * lh;
      },

      // ---- shapes ---------------------------------------------------------
      rr(bx, by, bw, bh, r) {
        r = Math.min(r === undefined ? 10 : r, bw / 2, bh / 2);
        x.beginPath();
        x.moveTo(bx + r, by);
        x.arcTo(bx + bw, by, bx + bw, by + bh, r);
        x.arcTo(bx + bw, by + bh, bx, by + bh, r);
        x.arcTo(bx, by + bh, bx, by, r);
        x.arcTo(bx, by, bx + bw, by, r);
        x.closePath();
      },
      /* A labelled box. opts:
       *   label, sub      heading and a second line
       *   fill, stroke    colours; stroke doubles as the accent
       *   on              true = lit up (thicker edge, glow, brighter text)
       *   alpha           fade the whole thing
       *   r               corner radius
       */
      box(bx, by, bw, bh, o) {
        o = o || {};
        const ac = o.stroke || PAL.line;
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        d.rr(bx, by, bw, bh, o.r);
        x.fillStyle = o.fill || PAL.panel;
        x.fill();
        if (o.on) { x.shadowColor = ac; x.shadowBlur = 18; }
        x.lineWidth = o.on ? 3.5 : 1.6;
        x.strokeStyle = o.on ? ac : (o.stroke || PAL.line);
        x.stroke();
        x.shadowBlur = 0;
        // Padding has to scale: 10px each side of a 28px cell leaves 8px for the
        // text, so a single letter was being shrunk to 9px to fit.
        const pad = Math.min(10, bw * .12);
        if (o.label !== undefined) {
          const ly = o.sub ? by + bh / 2 - 8 : by + bh / 2;
          d.text(bx + bw / 2, ly, o.label, {
            size: o.size || 16, weight: 700, align: "center", baseline: "middle",
            fill: o.labelFill || (o.on ? PAL.fg : PAL.fg), max: bw - pad * 2
          });
        }
        if (o.sub !== undefined) {
          d.text(bx + bw / 2, by + bh / 2 + 13, o.sub, {
            size: o.subSize || 12, weight: 500, align: "center", baseline: "middle",
            fill: o.subFill || PAL.soft, max: bw - pad * 2
          });
        }
        x.restore();
      },
      dot(cx, cy, r, o) {
        o = o || {};
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
        x.fillStyle = o.fill || PAL.edge;
        if (o.glow) { x.shadowColor = o.fill || PAL.edge; x.shadowBlur = 14; }
        x.fill(); x.shadowBlur = 0;
        if (o.stroke) { x.lineWidth = o.width || 2; x.strokeStyle = o.stroke; x.stroke(); }
        if (o.label !== undefined)
          d.text(cx, cy + 1, o.label, { size: o.size || 12, weight: 700, align: "center",
                                        baseline: "middle", fill: o.labelFill || "#0f1626", max: r * 2.1 });
        x.restore();
      },
      // a small pill, for a packet, a bit of data, a token moving along a wire
      chip(cx, cy, label, o) {
        o = o || {};
        const h = o.h || 24, w = o.w || Math.max(34, d.measure(label, o.size || 12, 700) + 18);
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        d.rr(cx - w / 2, cy - h / 2, w, h, h / 2);
        x.fillStyle = o.fill || PAL.edge;
        if (o.glow) { x.shadowColor = o.fill || PAL.edge; x.shadowBlur = 14; }
        x.fill(); x.shadowBlur = 0;
        if (o.stroke) { x.lineWidth = 2; x.strokeStyle = o.stroke; x.stroke(); }
        d.text(cx, cy + 1, label, { size: o.size || 12, weight: 700, align: "center",
                                    baseline: "middle", fill: o.labelFill || "#0f1626", max: w - 10 });
        x.restore();
        return { w, h };
      },

      // ---- lines and arrows -------------------------------------------------
      line(x1, y1, x2, y2, o) {
        o = o || {};
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2);
        x.lineWidth = o.width || 2; x.strokeStyle = o.stroke || PAL.line;
        x.lineCap = o.cap || "round";
        if (o.dash) x.setLineDash(o.dash);
        if (o.glow) { x.shadowColor = o.stroke || PAL.edge; x.shadowBlur = 12; }
        x.stroke();
        x.restore();
      },
      head(px, py, ang, o) {
        o = o || {};
        const s = o.size || 9;
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        x.translate(px, py); x.rotate(ang);
        x.beginPath(); x.moveTo(0, 0); x.lineTo(-s * 1.6, s * .8); x.lineTo(-s * 1.6, -s * .8); x.closePath();
        x.fillStyle = o.stroke || PAL.line; x.fill();
        x.restore();
      },
      arrow(x1, y1, x2, y2, o) {
        o = o || {};
        const ang = Math.atan2(y2 - y1, x2 - x1), s = (o.size || 9) * 1.5;
        d.line(x1, y1, x2 - Math.cos(ang) * s, y2 - Math.sin(ang) * s, o);
        d.head(x2, y2, ang, o);
        if (o.label !== undefined) {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          d.text(mx + (o.lx || 0), my + (o.ly || -8), o.label,
                 { size: o.labelSize || 12, weight: 700, align: "center", baseline: "middle",
                   fill: o.labelFill || o.stroke || PAL.soft, alpha: o.alpha });
        }
      },
      // a curved arrow; bend is how far the midpoint is pushed sideways
      curve(x1, y1, x2, y2, bend, o) {
        o = o || {};
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1;
        const cx = mx + nx / L * bend, cy = my + ny / L * bend;
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        x.beginPath(); x.moveTo(x1, y1); x.quadraticCurveTo(cx, cy, x2, y2);
        x.lineWidth = o.width || 2; x.strokeStyle = o.stroke || PAL.line; x.lineCap = "round";
        if (o.dash) x.setLineDash(o.dash);
        if (o.glow) { x.shadowColor = o.stroke || PAL.edge; x.shadowBlur = 12; }
        x.stroke();
        x.restore();
        d.head(x2, y2, Math.atan2(y2 - cy, x2 - cx), o);
        if (o.label !== undefined)
          d.text((x1 + 2 * cx + x2) / 4, (y1 + 2 * cy + y2) / 4 - 6, o.label,
                 { size: o.labelSize || 12, weight: 700, align: "center", baseline: "middle",
                   fill: o.labelFill || o.stroke || PAL.soft, alpha: o.alpha });
      },
      // a point along that same curve, for sending something down it
      onCurve(x1, y1, x2, y2, bend, t) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1;
        const cx = mx + nx / L * bend, cy = my + ny / L * bend;
        const u = 1 - t;
        return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
      },
      // a point along a polyline, by fraction of its total length
      onPath(pts, t) {
        let total = 0; const segs = [];
        for (let i = 1; i < pts.length; i++) {
          const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          segs.push(L); total += L;
        }
        let want = d.clamp(t, 0, 1) * total;
        for (let i = 0; i < segs.length; i++) {
          if (want <= segs[i] || i === segs.length - 1) {
            const f = segs[i] ? want / segs[i] : 0;
            return [d.lerp(pts[i][0], pts[i + 1][0], f), d.lerp(pts[i][1], pts[i + 1][1], f)];
          }
          want -= segs[i];
        }
        return pts[pts.length - 1];
      },
      path(pts, o) {
        o = o || {};
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
        x.lineWidth = o.width || 2; x.strokeStyle = o.stroke || PAL.line;
        x.lineJoin = "round"; x.lineCap = "round";
        if (o.dash) x.setLineDash(o.dash);
        if (o.glow) { x.shadowColor = o.stroke || PAL.edge; x.shadowBlur = 12; }
        if (o.fill) { x.fillStyle = o.fill; x.fill(); }
        if (o.stroke !== null) x.stroke();
        x.restore();
      },

      // ---- annotation -------------------------------------------------------
      /* A note with a leader line to the thing it is about. This is what makes a
       * diagram annotated rather than just drawn: say where it points and the
       * line is worked out for you. opts.to is [x, y]; opts.w the text width. */
      note(nx, ny, s, o) {
        o = o || {};
        const w = o.w || 190, col = o.fill || PAL.edge;
        if (o.to) {
          const sx = nx + (o.anchor === "right" ? -6 : o.anchor === "centre" ? 0 : w + 6), sy = ny + 7;
          const len = Math.hypot(o.to[0] - sx, o.to[1] - sy);
          // A leader right across the picture is more clutter than help, so past
          // a certain length it becomes a short stub off the marker instead.
          const lead = o.maxLead || 300;
          const a = Math.atan2(sy - o.to[1], sx - o.to[0]);
          const ex = len > lead ? o.to[0] + Math.cos(a) * 34 : sx;
          const ey = len > lead ? o.to[1] + Math.sin(a) * 34 : sy;
          d.line(ex, ey, o.to[0], o.to[1],
                 { stroke: col, width: 1.4, dash: [4, 4], alpha: (o.alpha === undefined ? 1 : o.alpha) * .8 });
          d.dot(o.to[0], o.to[1], 3.5, { fill: col, alpha: o.alpha });
        }
        x.save();
        if (o.alpha !== undefined) x.globalAlpha = o.alpha;
        if (o.title) {
          d.text(nx, ny, o.title, { size: 13, weight: 800, fill: col, baseline: "top",
                                    align: o.align || "left", max: w });
          ny += 17;
        }
        d.wrap(nx, ny, s, w, { size: 12.5, fill: o.textFill || PAL.soft, align: o.align || "left" });
        x.restore();
      },
      // a caption strip along the bottom of the diagram
      banner(s, o) {
        o = o || {};
        const h = 1;
        void h;
        d.wrap(24, H - 54, s, W - 48, { size: 15, fill: o.fill || PAL.soft });
      },
      title(s, o) {
        o = o || {};
        d.text(o.x === undefined ? 24 : o.x, o.y === undefined ? 30 : o.y, s,
               { size: o.size || 18, weight: 800, fill: o.fill || PAL.fg, baseline: "middle" });
      },

      // ---- data shapes used by several diagrams -----------------------------
      /* A row of bits or bytes. cells is an array of strings. opts.on is an
       * array of indices to light up; opts.fills maps index -> colour. */
      cells(bx, by, list, o) {
        o = o || {};
        const cw = o.cw || 40, ch = o.ch || 40, gap = o.gap === undefined ? 4 : o.gap;
        const on = o.on || [], fills = o.fills || {};
        list.forEach((v, i) => {
          const cx2 = bx + i * (cw + gap);
          const lit = on.indexOf(i) >= 0;
          d.box(cx2, by, cw, ch, {
            fill: fills[i] || (lit ? PAL.panel2 : PAL.panel),
            stroke: fills[i] ? PAL.fg : (lit ? (o.accent || PAL.edge) : PAL.line),
            on: lit, r: o.r === undefined ? 7 : o.r,
            label: v === null || v === undefined ? "" : String(v),
            size: o.size || 16, alpha: o.alpha,
            labelFill: fills[i] ? "#0f1626" : PAL.fg
          });
          if (o.index) d.text(cx2 + cw / 2, by + ch + 14, String(i), {
            size: 11, weight: 600, align: "center", baseline: "middle", fill: PAL.dim, alpha: o.alpha });
        });
        return { w: list.length * (cw + gap) - gap, cw, ch, gap,
                 at: i => bx + i * (cw + gap) + cw / 2 };
      }
    };
    return d;
  }

  // =========================================================================
  // The diagrams. Each returns { w, h, steps, render }.
  // =========================================================================
  const BUILD = {};

  // =========================================================================
  // Viewer: the same shape as R360Models.viewer, so the player opens both the
  // same way. onStep(i, step) fires whenever the step changes.
  // =========================================================================
  function build(kind) {
    const f = BUILD[kind] || BUILD[Object.keys(BUILD)[0]];
    if (!f) throw new Error("no diagrams registered");
    return f();
  }

  function viewer(container, kind, onStep) {
    const dg = build(kind);
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;border-radius:12px";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Diagram. The caption below describes each step.");
    container.appendChild(canvas);
    const x = canvas.getContext("2d");
    const d = Draw(x, dg.w, dg.h);

    // mode: "all" runs on through the steps, "one" animates the chosen step and
    // holds it finished, false is frozen. Picking a step must not leave t at 0,
    // or everything that fades in during a step is invisible while paused.
    let step = 0, t = 0, mode = "all", alive = true, last = performance.now();
    const DWELL = 3400;                                 // ms a step is shown for

    function size() {
      const cw = container.clientWidth || dg.w, ch = container.clientHeight || dg.h;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      const k = Math.min(cw / dg.w, ch / dg.h);
      x.setTransform(dpr * k, 0, 0, dpr * k, dpr * (cw - dg.w * k) / 2, dpr * (ch - dg.h * k) / 2);
    }
    size();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(size) : null;
    if (ro) ro.observe(container);

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(now - last, 100); last = now;
      if (mode) {
        t += dt / DWELL;
        if (t >= 1) {
          if (mode === "one") { t = 1; mode = false; api.announce(); }
          else if (step < dg.steps.length - 1) { t = 0; step++; api.announce(); }
          else { t = 1; mode = false; api.announce(); }
        }
      }
      x.save();
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, canvas.width, canvas.height);
      x.restore();
      x.fillStyle = PAL.bg;
      x.fillRect(-dg.w, -dg.h, dg.w * 3, dg.h * 3);
      dg.render(d, step, Math.min(t, 1));
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const api = {
      steps: dg.steps,
      get step() { return step; },
      get playing() { return mode === "all"; },
      select(i) { step = Math.max(0, Math.min(dg.steps.length - 1, i)); t = 0; mode = "one"; api.announce(); },
      play() { if (step >= dg.steps.length - 1 && t >= 1) step = 0; t = 0; mode = "all"; api.announce(); },
      pause() { if (mode) { t = 1; mode = false; } api.announce(); },
      toggle() { mode === "all" ? api.pause() : api.play(); },
      next() { api.select(step + 1); },
      prev() { api.select(step - 1); },
      announce() { if (onStep) onStep(step, dg.steps[step], mode === "all"); },
      dispose() { alive = false; if (ro) ro.disconnect(); canvas.remove(); }
    };
    // No announce here: it would fire the caller's callback before viewer()
    // has returned, so anything the caller holds the handle in is still null.
    // The caller calls announce() once it has the handle.
    return api;
  }

  /* Diagrams register themselves, so the engine and the 29 drawings stay in
   * separate files: js/diagrams.js is the machinery, js/diagrams-set.js the
   * content. Each one is independent, so a batch can be written and rendered on
   * its own without touching anything else. */
  function add(name, fn) { BUILD[name] = fn; }

  window.R360Diagrams = {
    build, viewer, add, palette: PAL, Draw,
    get kinds() { return Object.keys(BUILD); }
  };
})();
