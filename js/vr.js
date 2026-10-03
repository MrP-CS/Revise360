// VR mode for headsets such as Meta Quest 3 (WebXR).
// Uses the same experience data, scoring and saving as the normal page;
// only the way questions are shown and answered is different.
(function () {
  function start(core) {
    if (!navigator.xr || !window.THREE) return;
    const T = THREE, r = core.renderer, scene = core.scene, cam = core.cam, grp = core.grp;
    const btn = document.getElementById("vrBtn");
    navigator.xr.isSessionSupported("immersive-vr").then(ok => {
      if (!ok) return;
      btn.hidden = false;
      const hint = document.getElementById("vrHint"); if (hint) hint.hidden = false;
    }).catch(() => {});
    btn.onclick = enter;

    let session = null;
    async function enter() {
      try {
        session = await navigator.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor", "hand-tracking"] });
      } catch (e) { alert("VR couldn't start: " + e.message); return; }
      core.closeUI();
      core.inVR = true; core.toastHook = toast;
      core.mat.map = core.texFor(core.cur); core.mat.needsUpdate = true;
      grp.rotation.y = -Math.PI / 2;            // start facing the scene's front wall
      session.addEventListener("end", leave);
      await r.xr.setSession(session);
      root.visible = true; placeMenuButton(true);
      setTimeout(() => toast("Point with a controller and pull the trigger (or pinch) to select. Look down for the menu. Use the thumbstick to turn."), 800);
    }
    function leave() {
      session = null; core.inVR = false; core.toastHook = null;
      grp.rotation.y = 0; root.visible = false; stopSprint(); closeCodeVR(); closeAll(); closeModelVR(); closeBoard();
      core.mat.map = core.texFor(core.cur); core.mat.needsUpdate = true;
      core.refreshSprites(); core.hud(); core.drawNav();
    }
    const exitVR = () => { if (session) session.end(); };

    // ---------------- canvas panels ----------------
    /* The headset's colours are the site's colours, read off :root at the moment
     * they are used rather than written down again here. This file used to carry
     * its own copy of the whole brand palette: the same seven values, in a second
     * place, which is the fault that was found in js/algo.js for the token
     * palette and fixed there. Change --panel in css/style.css and the panels in
     * here change with it; nothing has to be kept in step by hand.
     *
     * The fallbacks are what the site shipped with, for the case where the
     * stylesheet has not arrived yet - a panel in the wrong blue is better than
     * a panel in no colour at all. */
    const CSSVAR = (name, fallback) => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
      } catch (e) { return fallback; }
    };
    const THEME = { bg: ["--panel", "#1c2c4a"], deep: ["--bg2", "#0e1628"], line: ["--line", "#3c5a87"],
                    fg: ["--fg", "#f0f4fa"], soft: ["--soft", "#b4c4dc"], edge: ["--edge", "#ffd046"],
                    ok: ["--ok", "#50dc96"], bad: ["--bad", "#ff5f5f"], info: ["--info", "#5ab4ff"] };
    const COL = {};
    Object.keys(THEME).forEach(k => Object.defineProperty(COL, k, {
      enumerable: true, get: () => CSSVAR(THEME[k][0], THEME[k][1]) }));
    // the button face is the deepest surface the site has, under the panel
    Object.defineProperty(COL, "btn", { enumerable: true, get: () => COL.deep });
    const BAND = { get g() { return COL.ok; }, get a() { return COL.edge; },
                   get r() { return COL.bad; }, n: "#51607a" };
    const FONT = '"Segoe UI", system-ui, sans-serif';
    const root = new T.Group(); root.visible = false; scene.add(root);

    class Panel {
      constructor(widthM, px) {
        this.W = px || 1200; this.widthM = widthM;
        this.canvas = document.createElement("canvas"); this.canvas.width = this.W; this.canvas.height = 200;
        this.ctx = this.canvas.getContext("2d");
        this.tex = new T.CanvasTexture(this.canvas); this.tex.minFilter = T.LinearFilter; this.tex.generateMipmaps = false;
        this.mesh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }));
        this.mesh.renderOrder = 20; this.mesh.visible = false; this.mesh.userData.panel = this;
        root.add(this.mesh); this.hits = []; this.hover = null;
      }
      set(spec) { this.spec = spec; this.hover = null; this.draw(); this.mesh.visible = true; }
      hide() { this.mesh.visible = false; this.spec = null; }
      get open() { return this.mesh.visible; }
      wrap(text, font, maxW) {
        const c = this.ctx; c.font = font; const out = [];
        String(text).split("\n").forEach(par => {
          let line = "";
          par.split(" ").forEach(w => { const tst = line ? line + " " + w : w; if (c.measureText(tst).width > maxW && line) { out.push(line); line = w; } else line = tst; });
          out.push(line);
        });
        return out;
      }
      draw() {
        const s = this.spec; if (!s) return;
        const W = this.W, P = 36, IW = W - 2 * P, ops = []; let y = 0; this.hits = [];
        const scale = s.scale || 1;
        if (s.title) { ops.push({ k: "title", y: 0, h: 84 * scale }); y = 84 * scale + 24; } else y = P;
        const addText = (b) => {
          // A program is read, not prose: it needs a fixed-width font or the
          // indentation that gives Python its meaning lines up with nothing.
          const size = (b.size || 32) * scale;
          const font = `${b.bold ? "700 " : ""}${size}px ${b.mono ? "Consolas, monospace" : FONT}`;
          const lines = this.wrap(b.p, font, IW); const lh = size * 1.3;
          ops.push({ k: "text", y, lines, font, lh, color: b.color || COL.fg, align: b.align, size });
          y += lines.length * lh + 10;
        };
        const btnH = (b, w) => { const size = (b.size || 30) * scale; const lines = this.wrap(b.btn, `600 ${size}px ${FONT}`, w - 48); return { lines, size, h: Math.max(66 * scale, lines.length * size * 1.25 + 30) }; };
        /* A sentence the authors marked prescribed data in, laid out with the
         * data boxed and coloured exactly as the screen shows it. `n` numbers
         * it, for the task's steps. */
        const addRich = (b) => {
          const size = (b.size || 32) * scale;
          const font = `${b.bold ? "700 " : ""}${size}px ${FONT}`;
          const mono = `${Math.round(size * .94)}px Consolas, monospace`;
          const ind = b.n ? 46 * scale : (b.bullet ? 26 * scale : 0);
          const lines = layoutRich(c0, b.rich, font, mono, IW - ind);
          const lh = size * 1.36;
          ops.push({ k: "rich", y, lines, font, mono, lh, color: b.color || COL.fg, size, ind, n: b.n, bullet: b.bullet });
          y += lines.length * lh + (b.tight ? 4 : 10);
        };
        // A program, in the editor's own colours, as a block rather than inline.
        const addCode = (b) => {
          const size = (b.size || 26) * scale, lh = size * 1.28;
          const rows = String(b.code).split("\n").length;
          ops.push({ k: "code", y, code: b.code, size, lh, h: rows * lh + 22 });
          y += rows * lh + 32;
        };
        const c0 = this.ctx;
        (s.blocks || []).forEach(b => {
          if (!b) return;
          if (b.rich !== undefined) addRich(b);
          else if (b.code !== undefined) addCode(b);
          else if (b.p !== undefined) addText(b);
          else if (b.gap) y += b.gap;
          else if (b.big) { ops.push({ k: "big", y, text: b.big }); y += 110; }
          else if (b.img) { if (b.img.complete && b.img.naturalWidth) { const h = IW * b.img.naturalHeight / b.img.naturalWidth; ops.push({ k: "img", y, img: b.img, h }); y += h + 14; } else { b.img.onload = () => this.draw(); } }
          else if (b.kv) { ops.push({ k: "kv", y, kv: b.kv }); y += 50 * scale; }
          else if (b.btn !== undefined) { const m = btnH(b, IW); ops.push({ k: "btn", y, x: P, w: IW, b, ...m }); y += m.h + 12; }
          else if (b.row) {
            const n = b.row.length, gap = 14, w = (IW - gap * (n - 1)) / n;
            const ms = b.row.map(x => btnH(x, w)), h = Math.max(...ms.map(m => m.h));
            b.row.forEach((x, i) => ops.push({ k: "btn", y, x: P + i * (w + gap), w, b: x, ...ms[i], h }));
            y += h + 12;
          }
        });
        const H = Math.ceil(y + P);
        if (this.canvas.height !== H) this.canvas.height = H;
        const c = this.ctx; c.clearRect(0, 0, W, H);
        rr(c, 0, 0, W, H, 34); c.fillStyle = "rgba(20,32,56,.97)"; c.fill(); c.lineWidth = 6; c.strokeStyle = s.color || COL.edge; c.stroke();
        ops.forEach(o => {
          if (o.k === "title") {
            c.save(); rr(c, 0, 0, W, o.h, 34); c.clip(); c.fillStyle = s.color || COL.edge; c.fillRect(0, 0, W, o.h); c.restore();
            c.fillStyle = "#0f1626"; c.font = `700 ${36 * scale}px ${FONT}`; c.textBaseline = "middle"; c.textAlign = "left";
            c.fillText(this.wrap(s.title, c.font, W - 180)[0], P, o.h / 2);
            if (s.onClose) {
              const cw = 120 * scale; rr(c, W - cw - 14, 12, cw, o.h - 24, 14); c.fillStyle = this.hover === "__close" ? "#ffffff" : "rgba(15,22,38,.18)"; c.fill();
              c.fillStyle = "#0f1626"; c.textAlign = "center"; c.font = `700 ${28 * scale}px ${FONT}`; c.fillText("Close", W - cw / 2 - 14, o.h / 2);
              this.hits.push({ id: "__close", x: W - cw - 14, y: 12, w: cw, h: o.h - 24, fn: s.onClose });
            }
          } else if (o.k === "text") {
            c.font = o.font; c.fillStyle = o.color; c.textBaseline = "top"; c.textAlign = o.align || "left";
            o.lines.forEach((ln, i) => c.fillText(ln, o.align === "center" ? W / 2 : P, o.y + i * o.lh));
          } else if (o.k === "rich") {
            if (o.n) {   // the numbered step, the same circle the page draws
              const r0 = 15 * (o.size / 32);
              c.beginPath(); c.arc(P + r0, o.y + o.size * .62, r0 + 3, 0, 7); c.fillStyle = COL.edge; c.fill();
              c.fillStyle = "#0f1626"; c.font = `700 ${Math.round(o.size * .72)}px ${FONT}`;
              c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(o.n), P + r0, o.y + o.size * .62);
            } else if (o.bullet) {
              c.beginPath(); c.arc(P + 7, o.y + o.size * .62, 4, 0, 7); c.fillStyle = COL.soft; c.fill();
            }
            drawRich(c, o.lines, P + o.ind, o.y, o.lh, o.font, o.mono, o.color, o.size);
          } else if (o.k === "code") {
            rr(c, P, o.y, IW, o.h, 12); c.fillStyle = COL.deep; c.fill();
            c.lineWidth = 2; c.strokeStyle = COL.line; c.stroke();
            drawProgram(c, o.code, P + 14, o.y + 11, o.size, IW - 28, o.lh);
          } else if (o.k === "big") {
            c.font = `800 ${96 * scale}px ${FONT}`; c.fillStyle = COL.edge; c.textAlign = "center"; c.textBaseline = "top"; c.fillText(o.text, W / 2, o.y);
          } else if (o.k === "img") { c.drawImage(o.img, P, o.y, IW, o.h); }
          else if (o.k === "kv") {
            const [a, b2, band] = o.kv; c.font = `${30 * scale}px ${FONT}`; c.textBaseline = "top"; c.textAlign = "left"; c.fillStyle = COL.fg;
            c.fillText(this.wrap(a, c.font, IW - 420)[0], P, o.y);
            if (band) {
              const lab = band[1]; c.font = `700 ${24 * scale}px ${FONT}`; const lw = c.measureText(lab).width + 28;
              rr(c, W - P - lw, o.y - 2, lw, 38 * scale, 19); c.fillStyle = BAND[band[0]]; c.fill();
              c.fillStyle = band[0] === "n" ? COL.fg : "#0f1626"; c.textAlign = "center"; c.fillText(lab, W - P - lw / 2, o.y + 4);
              c.font = `${30 * scale}px ${FONT}`; c.textAlign = "right"; c.fillStyle = COL.fg; c.fillText(b2, W - P - lw - 16, o.y);
            } else { c.textAlign = "right"; c.fillText(b2, W - P, o.y); }
            c.strokeStyle = COL.line; c.lineWidth = 2; c.beginPath(); c.moveTo(P, o.y + 44 * scale); c.lineTo(W - P, o.y + 44 * scale); c.stroke();
          } else if (o.k === "btn") {
            const b = o.b, st = b.state || "", hov = this.hover === b.id && !b.disabled;
            const fill = st === "right" ? "#143a2c" : st === "wrong" ? "#40161c" : st === "on" ? "#2a2a1a" : b.primary ? COL.edge : COL.btn;
            const stroke = st === "right" ? COL.ok : st === "wrong" ? COL.bad : st === "on" ? COL.edge : hov ? (s.color || COL.edge) : COL.line;
            c.globalAlpha = b.disabled && !st ? .45 : 1;
            rr(c, o.x, o.y, o.w, o.h, 18); c.fillStyle = hov && !st && !b.primary ? "#1d2f52" : fill; c.fill(); c.lineWidth = hov ? 7 : 4; c.strokeStyle = stroke; c.stroke();
            c.fillStyle = b.primary ? "#0f1626" : st === "on" ? COL.edge : COL.fg; c.font = `600 ${o.size}px ${FONT}`; c.textBaseline = "middle";
            c.textAlign = b.center || b.primary ? "center" : "left";
            const lh = o.size * 1.25, top = o.y + o.h / 2 - (o.lines.length - 1) * lh / 2;
            o.lines.forEach((ln, i) => c.fillText(ln, b.center || b.primary ? o.x + o.w / 2 : o.x + 24, top + i * lh));
            c.globalAlpha = 1;
            if (!b.disabled && b.id) this.hits.push({ id: b.id, x: o.x, y: o.y, w: o.w, h: o.h, fn: b.onClick });
          }
        });
        this.tex.needsUpdate = true;
        this.mesh.scale.set(this.widthM, this.widthM * H / W, 1);
      }
      hitAt(uv) { const x = uv.x * this.W, y = (1 - uv.y) * this.canvas.height; return this.hits.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || null; }
      setHover(id) { if (id !== this.hover) { this.hover = id; this.draw(); return true; } return false; }
    }
    function rr(c, x, y, w, h, rad) { c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + w, y, x + w, y + h, rad); c.arcTo(x + w, y + h, x, y + h, rad); c.arcTo(x, y + h, x, y, rad); c.arcTo(x, y, x + w, y, rad); c.closePath(); }

    /* ---------------- a sentence with Python in it ----------------
     *
     * An author writes "Change it so it remembers `25`". On the screen that
     * becomes a boxed, monospace span in the amber a number is drawn in, and
     * the point of it is recognition: the pupil sees the value in the colour
     * they are about to type it in. In here the same sentence used to be
     * painted with the backticks still in it, as characters, which is the
     * clearest sign the headset was showing a different course.
     *
     * So it is laid out properly: the marked data is boxed and monospace as
     * well as coloured, exactly as on paper and on the page, and the colours
     * come from R360Tok. Colour is never the only signal, here either.
     */
    function layoutRich(c, text, font, mono, maxW) {
      const TOK = window.R360Tok;
      const pieces = [];
      String(text == null ? "" : text).split(/(`[^`]*`)/).forEach(s => {
        if (!s) return;
        if (s.length > 1 && s[0] === "`" && s[s.length - 1] === "`") {
          const inner = s.slice(1, -1);
          pieces.push({ t: inner, code: true, toks: TOK ? TOK.lex(inner) : [{ t: inner, k: "t" }] });
        } else s.split(/(\s+)/).forEach(w => { if (w) pieces.push({ t: w, code: false }); });
      });
      const lines = [[]]; let w = 0;
      const last = () => lines[lines.length - 1];
      pieces.forEach(p => {
        const blank = /^\s+$/.test(p.t);
        if (blank && !last().length) return;            // never start a line with a space
        c.font = p.code ? mono : font;
        const pw = c.measureText(p.t).width + (p.code ? 14 : 0);
        if (w + pw > maxW && last().length) { lines.push([]); w = 0; if (blank) return; }
        last().push({ t: p.t, code: p.code, toks: p.toks, w: pw });
        w += pw;
      });
      return lines.filter(l => l.length);
    }
    function drawRich(c, lines, x, y, lh, font, mono, colour, size) {
      lines.forEach((ln, i) => {
        let px = x; const ty = y + i * lh;
        ln.forEach(p => {
          if (p.code) {
            rr(c, px, ty - 3, p.w, size * 1.32, 6);
            c.fillStyle = "rgba(255,255,255,.07)"; c.fill();
            c.lineWidth = 1.5; c.strokeStyle = "rgba(255,255,255,.16)"; c.stroke();
            c.font = mono; c.textAlign = "left"; c.textBaseline = "top";
            let tx = px + 7;
            (p.toks || []).forEach(tk => {
              c.fillStyle = (window.R360Tok && R360Tok.colours[tk.k]) || colour;
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
    // A whole program, coloured by the one lexer, wrapped to the panel.
    function drawProgram(c, src, x, y, size, maxW, lh) {
      const mono = size + "px Consolas, monospace";
      c.font = mono; c.textAlign = "left"; c.textBaseline = "top";
      let row = 0;
      String(src).split("\n").forEach(line => {
        let px = x;
        for (const tk of (window.R360Py ? R360Py.tokens(line) : [{ t: line, c: COL.fg }])) {
          const w = c.measureText(tk.t).width;
          if (px + w > x + maxW && px > x) { row++; px = x + 22; }
          c.fillStyle = tk.c; c.fillText(tk.t, px, y + row * lh); px += w;
        }
        row++;
      });
      return row * lh;
    }

    const qPanel = new Panel(1.5), infoPanel = new Panel(.8, 1000), menuPanel = new Panel(.8, 1000), toastPanel = new Panel(.7, 1000), menuBtn = new Panel(.2, 360);
    const panels = [qPanel, infoPanel, menuPanel, toastPanel, menuBtn];
    toastPanel.mesh.renderOrder = 30;

    // ---------------- placement ----------------
    const vHead = new T.Vector3(), vDir = new T.Vector3(), q = new T.Quaternion();
    function headPose() {
      const xc = r.xr.getCamera(cam); xc.getWorldPosition(vHead); xc.getWorldDirection(vDir);
      return { pos: vHead.clone(), dir: vDir.clone() };
    }
    function placeInFront(panel, dist, pitchDeg, yawOffDeg) {
      const { pos, dir } = headPose();
      const yaw = Math.atan2(dir.x, dir.z) + T.MathUtils.degToRad(yawOffDeg || 0);
      const pitch = T.MathUtils.degToRad(pitchDeg);
      const off = new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(dist);
      panel.mesh.position.copy(pos).add(off); panel.mesh.lookAt(pos);
    }
    function gazePitch() { const { dir } = headPose(); return T.MathUtils.radToDeg(Math.asin(T.MathUtils.clamp(dir.y, -1, 1))); }

    /* A board or a diagram and the panel that explains it are one thing to read,
     * so they are stacked: the picture straight ahead, its words directly
     * underneath at the same yaw. They used to sit side by side about 60 degrees
     * apart, which meant turning your head to take in one window.
     *
     * The anchor is taken once, when a station or a diagram opens, and every
     * panel after that is placed against it. Re-reading the head pose for each
     * new question is what made the windows seem to follow the viewer around. */
    let anchor = null;
    function setAnchor(force) {
      if (anchor && !force) return anchor;
      const { pos, dir } = headPose();
      anchor = { pos: pos.clone(), yaw: Math.atan2(dir.x, dir.z),
                 pitch: T.MathUtils.degToRad(T.MathUtils.clamp(gazePitch(), -14, 8)) };
      return anchor;
    }
    function clearAnchor() { anchor = null; }
    /* `yawOffDeg` places a surface to one side of the anchor rather than
     * straight ahead. A workspace with several surfaces needs it: what to do
     * above, the example to the left, the marking to the right. Everything
     * still faces the viewer, so nothing is read at an angle. */
    function atAnchor(mesh, dist, pitchOffDeg, yawOffDeg) {
      const a = setAnchor();
      const pitch = a.pitch + T.MathUtils.degToRad(pitchOffDeg || 0);
      const yaw = a.yaw + T.MathUtils.degToRad(yawOffDeg || 0);
      mesh.position.set(a.pos.x + Math.sin(yaw) * Math.cos(pitch) * dist,
                        a.pos.y + Math.sin(pitch) * dist,
                        a.pos.z + Math.cos(yaw) * Math.cos(pitch) * dist);
      mesh.lookAt(a.pos);
    }
    let menuYaw = null;
    function placeMenuButton(force) {
      const { pos, dir } = headPose(); const yaw = Math.atan2(dir.x, dir.z);
      if (menuYaw === null || force) menuYaw = yaw;
      let d = yaw - menuYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) > .5) menuYaw += d * .08;   // lazily follow the user's gaze
      /* Normally just below the line of sight. While a Python workspace is
       * open the keys are there, so it goes further down and out of their way -
       * it used to sit on top of them, covering Tab, the arrows and Check. */
      const pitch = T.MathUtils.degToRad(vrCode ? -74 : -42), dist = .75;
      menuBtn.mesh.position.set(pos.x + Math.sin(menuYaw) * Math.cos(pitch) * dist, pos.y + Math.sin(pitch) * dist, pos.z + Math.cos(menuYaw) * Math.cos(pitch) * dist);
      menuBtn.mesh.lookAt(pos);
    }
    function closeAll() { panels.forEach(p => p !== menuBtn && p.hide()); }

    // ---------------- toasts, info, menu ----------------
    let toastT;
    function toast(msg) {
      toastPanel.set({ blocks: [{ p: msg, size: 30, align: "center" }], color: COL.line });
      /* While a Python workspace is open it goes below the keys rather than in
       * front of the program: a message that covers the thing it is about is
       * worse than no message. */
      if (vrCode) atAnchor(toastPanel.mesh, 1.30, -58, 0);
      else placeInFront(toastPanel, 1.2, Math.max(-20, Math.min(20, gazePitch())) + 14);
      clearTimeout(toastT); toastT = setTimeout(() => toastPanel.hide(), 4500);
    }
    function showInfo(u) {
      core.markInfo(u.id);
      const sc = core.exp.scenes[core.cur], n = (sc.info || []).length, seen = (sc.info || []).filter(f => core.prog.info.includes(sc.id + ":" + f.id)).length;
      infoPanel.set({ title: u.inf.title, color: COL.info, onClose: () => infoPanel.hide(), blocks: [
        { p: u.inf.text, size: 32 }, { gap: 6 }, { p: `Fact ${seen} of ${n} found in this scene. Keep looking for blue i markers.`, size: 24, color: COL.soft }] });
      placeInFront(infoPanel, 1.3, T.MathUtils.clamp(gazePitch(), -25, 20), 0);
    }
    function drawMenuBtn() {
      menuBtn.set({ blocks: [{ btn: "☰  Menu", id: "menu", center: true, size: 44, onClick: () => menuPanel.open ? menuPanel.hide() : showMenu() }] });
    }
    function showMenu() {
      const sc = core.exp.scenes[core.cur], s = Store.summarise(core.exp, core.prog);
      let got = 0, tot = 0, d = 0; sc.stations.forEach((_, k) => { const st = core.stationState(sc, k); got += st.got; tot += st.tot; if (st.done) d++; });
      const blocks = [
        { p: `${core.student.name} · ${core.student.cls}`, size: 26, color: COL.soft },
        { p: `${sc.title}: ${got} / ${tot}  ·  ${d} of ${sc.stations.length} stations`, size: 32, bold: true },
        core.exp.scenes.length > 1 ? { p: `Lesson total ${s.score} / ${s.total}`, size: 28 } : null,
        { gap: 8 }];
      if (core.exp.scenes.length > 1) blocks.push({ row: core.exp.scenes.map((x, i) => ({ btn: x.title, id: "sc" + i, center: true, size: 24, state: i === core.cur ? "on" : "", onClick: () => { closeAll(); core.loadScene(i); toast("Now in " + x.title + "."); } })) });
      blocks.push({ row: [
        { btn: "My progress", id: "prog", center: true, onClick: showProgress },
        { btn: "Review mode: " + (core.reviewMode ? "on" : "off"), id: "rev", center: true, state: core.reviewMode ? "on" : "", onClick: () => { core.setReview(!core.reviewMode); showMenu(); } }] });
      blocks.push({ btn: "Exit VR", id: "exit", center: true, onClick: exitVR });
      menuPanel.set({ title: core.exp.title, color: COL.edge, onClose: () => menuPanel.hide(), blocks });
      placeInFront(menuPanel, 1.1, -22);
    }
    function showProgress() {
      const s = Store.summarise(core.exp, core.prog), blocks = [{ p: `${s.score} / ${s.total} · ${s.done} of ${s.count} stations done`, size: 30, bold: true }];
      s.stations.forEach(st => {
        blocks.push({ kv: [(core.exp.scenes.length > 1 ? st.sceneTitle + ": " : "") + st.name, st.done ? `${st.got}/${st.tot}` : "", [st.band, st.done ? Store.BAND_LABEL[st.band] : "Not started"]] });
      });
      const toFix = s.stations.filter(st => st.done && st.wrongTasks > st.fixed && st.scene === core.exp.scenes[core.cur].id);
      if (toFix.length) blocks.push({ gap: 8 }, { p: "Retry your mistakes in this scene:", size: 26, color: COL.soft },
        { row: toFix.slice(0, 4).map(st => ({ btn: st.name, id: "fix" + st.k, center: true, size: 24, onClick: () => { if (!core.reviewMode) core.setReview(true); menuPanel.hide(); openStation(st.k); } })) });
      blocks.push({ btn: "Back", id: "back", center: true, onClick: showMenu });
      menuPanel.set({ title: "My progress", color: COL.edge, onClose: () => menuPanel.hide(), blocks });
    }

    // ---------------- 3D models ----------------
    let vrModel = null, lit = false; const modelPanel = new Panel(.75, 1000); panels.push(modelPanel);
    function openModelVR(u) {
      if (!window.R360Models) return;
      closeModelVR(); infoPanel.hide(); menuPanel.hide();
      if (!lit) { R360Models.lights(scene, r); lit = true; }
      core.markInfo(u.id);
      const b = R360Models.build(u.md.model); const holder = new T.Group(); holder.add(b.group);
      setAnchor(true);
      atAnchor(holder, 1.15, -2);
      holder.scale.setScalar(.12 * b.scale / .7); b.group.rotation.x = .35; scene.add(holder);
      vrModel = { b, holder, sel: -1, u };
      showModelPanel(-1);
      atAnchor(modelPanel.mesh, 1.5, -24);          // its words below it, not beside it
      toast("Point at a part and pull the trigger to learn about it. Push the thumbstick to turn the model.");
    }
    function showModelPanel(i) {
      const m = vrModel; if (!m) return; m.sel = i; R360Models.highlight(m.b, i);
      const p = i >= 0 ? m.b.parts[i] : null;
      modelPanel.set({ title: m.u.md.title, color: "#ffa028", onClose: closeModelVR, blocks: [
        { p: p ? p.name : "Select a part", size: 32, bold: true, color: "#ffd046" }, { p: p ? p.text : (m.u.md.text || "Point at the model and pull the trigger."), size: 28 }, { gap: 6 },
        { row: m.b.parts.slice(0, 3).map((q, j) => ({ btn: q.name, id: "mp" + j, center: true, size: 22, state: j === i ? "on" : "", onClick: () => showModelPanel(j) })) },
        m.b.parts.length > 3 ? { row: m.b.parts.slice(3, 6).map((q, j) => ({ btn: q.name, id: "mp" + (j + 3), center: true, size: 22, state: j + 3 === i ? "on" : "", onClick: () => showModelPanel(j + 3) })) } : null,
        m.b.parts.length > 6 ? { row: m.b.parts.slice(6, 9).map((q, j) => ({ btn: q.name, id: "mp" + (j + 6), center: true, size: 22, state: j + 6 === i ? "on" : "", onClick: () => showModelPanel(j + 6) })) } : null,
        { btn: "Close model", id: "mclose", center: true, onClick: closeModelVR }] });
    }
    function closeModelVR() { if (!vrModel) return; scene.remove(vrModel.holder); vrModel = null; modelPanel.hide(); clearAnchor(); core.refreshSprites(); }

    // ---------------- 2D diagrams ----------------
    // A diagram draws to a canvas, so in here it becomes a texture on a plane in
    // front of the viewer, driven by the frame hook rather than by the web
    // viewer's own loop - that one owns a DOM element and a ResizeObserver.
    let vrDiag = null; const diagPanel = new Panel(1.8, 1200); panels.push(diagPanel);
    const DIAG_DWELL = 3400;
    function openDiagramVR(u) {
      if (!window.R360Diagrams) return;
      closeDiagramVR(); closeModelVR(); infoPanel.hide(); menuPanel.hide();
      core.markInfo(u.id);
      const dg = R360Diagrams.build(u.dg.diagram);
      const cv = document.createElement("canvas"); cv.width = dg.w; cv.height = dg.h;
      const cx = cv.getContext("2d");
      const tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
      // What decides whether the lettering can be read is how much of the view
      // this fills, not how big the plane is - pushing it further away cancels
      // out making it wider. 2.3m at 1.8m is 65 degrees across, against 48 before.
      const mesh = new T.Mesh(new T.PlaneGeometry(2.3, 2.3 * dg.h / dg.w),
        new T.MeshBasicMaterial({ map: tex, depthTest: false, depthWrite: false }));
      mesh.renderOrder = 19;
      setAnchor(true);
      atAnchor(mesh, 1.8, 8);
      scene.add(mesh);
      vrDiag = { dg, cx, tex, mesh, u, d: R360Diagrams.Draw(cx, dg.w, dg.h), step: 0, t: 0, playing: true };
      showDiagPanel();
      atAnchor(diagPanel.mesh, 1.8, -25);          // the words directly under the picture
      toast("It plays through on its own. Use the buttons to go back over a step.");
    }
    function showDiagPanel() {
      const v = vrDiag; if (!v) return;
      const st = v.dg.steps[v.step];
      diagPanel.set({ title: v.u.dg.title, color: "#40c4ff", onClose: closeDiagramVR, blocks: [
        { p: st.name, size: 32, bold: true, color: "#40c4ff" },
        { p: st.caption, size: 28 }, { gap: 6 },
        { row: [
          { btn: "Back", id: "dback", center: true, size: 24, state: v.step === 0 ? "off" : "", onClick: () => stepDiag(-1) },
          { btn: v.playing ? "Pause" : "Replay", id: "dplay", center: true, size: 24, onClick: () => {
              v.playing = !v.playing; if (v.playing && v.step >= v.dg.steps.length - 1 && v.t >= 1) v.step = 0;
              if (v.playing) v.t = 0; showDiagPanel(); } },
          { btn: "Next", id: "dnext", center: true, size: 24, state: v.step === v.dg.steps.length - 1 ? "off" : "", onClick: () => stepDiag(1) }] },
        { btn: "Close diagram", id: "dclose", center: true, onClick: closeDiagramVR }] });
    }
    function stepDiag(n) {
      const v = vrDiag; if (!v) return;
      v.step = Math.max(0, Math.min(v.dg.steps.length - 1, v.step + n));
      v.t = 1; v.playing = false; showDiagPanel();
    }
    function closeDiagramVR() {
      if (!vrDiag) return;
      scene.remove(vrDiag.mesh); vrDiag.tex.dispose(); vrDiag = null;
      diagPanel.hide(); clearAnchor(); core.refreshSprites();
    }
    core.frameHooks.push((dt) => {
      const v = vrDiag; if (!v || !r.xr.isPresenting) return;
      if (v.playing) {
        v.t += Math.min(dt || 16, 100) / DIAG_DWELL;
        if (v.t >= 1) {
          if (v.step < v.dg.steps.length - 1) { v.t = 0; v.step++; showDiagPanel(); }
          else { v.t = 1; v.playing = false; showDiagPanel(); }
        }
      }
      v.cx.setTransform(1, 0, 0, 1, 0, 0);
      v.cx.fillStyle = "#0e1628"; v.cx.fillRect(0, 0, v.dg.w, v.dg.h);
      v.dg.render(v.d, v.step, Math.min(v.t, 1));
      v.tex.needsUpdate = true;
    });

    const BOARD_TASKS = ["circuit", "expr", "table", "convert", "addshift", "pixels", "sound", "memory", "permissions", "defrag", "impact", "trace", "bugline", "searchstep", "sortstep"];
    // ---------------- boards (drag, paint and tap in VR) ----------------
    let vrBoard = null;
    function openBoard(board) {
      closeBoard();
      const tex = new T.CanvasTexture(board.canvas); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
      const w = 2.0, h = w * board.canvas.height / board.canvas.width;
      const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, depthTest: false, depthWrite: false }));
      mesh.renderOrder = 22; mesh.userData.board = true; root.add(mesh);
      atAnchor(mesh, 1.55, 10);                    // straight ahead, a little high
      vrBoard = { board, mesh, tex, last: 0, lastXY: null };
      return mesh;
    }
    function closeBoard() { if (!vrBoard) return; root.remove(vrBoard.mesh); vrBoard.tex.dispose(); vrBoard = null; }
    const boardXY = uv => [uv.x * vrBoard.board.canvas.width, (1 - uv.y) * vrBoard.board.canvas.height];

    /* ---------------- the Python workspace in the headset ----------------
     *
     * The same activity as the screen, not a reduced one. What a question IS -
     * its stage, its steps, its worked example, the one real run, the ladder of
     * hints, when the next one opens, every sentence said about it - comes from
     * js/pyactivity.js, which js/player.js reads as well. This file decides only
     * where each part hangs in the room.
     *
     * It is not the web page on a billboard. The screen puts everything to read
     * on the left and the program on the right because a monitor is wide; a room
     * is not, so the same material is placed where a pupil can turn to it:
     *
     *        up      what to do          the stage, the steps, the brief
     *      left      how it works        the worked example and its output
     *     ahead      your program        the editor, the required run, the output
     *     right      how it went         the marking, test by test
     *      down      the keys            and Run, Check, Hint, Help, the way on
     *
     * Everything is placed against one anchor taken when the question opens, so
     * the workspace stays put while the pupil looks around it. RECENTRE takes
     * the anchor again, for someone who has turned in their chair.
     */
    const ACT = window.R360PyAct;
    let vrCode = null;
    const kbPanel = new Panel(1.70, 1500);
    const taskPanel = new Panel(1.50, 1300);
    const sidePanel = new Panel(0.95, 900);       // the example, and how the marking went
    const padPanel = new Panel(1.25, 1100);       // the hint and the help, over the program
    panels.push(kbPanel, taskPanel, sidePanel, padPanel);
    /* Nothing in a workspace uses the depth buffer - panels are drawn over the
     * room on purpose - so where two of them cross, the order decides. The
     * program wins over the panel beside it, and the hint wins over everything,
     * because that is the thing being read at the time. */
    kbPanel.mesh.renderOrder = 20; taskPanel.mesh.renderOrder = 20;
    sidePanel.mesh.renderOrder = 20; padPanel.mesh.renderOrder = 24;

    /* Where each surface sits, as metres and degrees from the anchor. One place,
     * so the layout can be read and changed without hunting through the drawing
     * code, and so RECENTRE has one thing to re-apply.
     *
     * Everything is at the same yaw except the reference panel, which is a
     * small turn of the head to the right - the place the screen keeps the
     * worked example and the marking. Nothing is behind anything else. */
    const SEAT = {
      task: { dist: 1.95, pitch:  28, yaw:   0 },
      code: { dist: 1.75, pitch:  -3, yaw:   0 },
      side: { dist: 1.95, pitch:   0, yaw:  32 },
      keys: { dist: 1.55, pitch: -33, yaw:   0 },
      pad:  { dist: 1.40, pitch:   0, yaw:   0 }
    };
    const seat = (mesh, s) => atAnchor(mesh, s.dist, s.pitch, s.yaw);

    const KEYS = [
      "1234567890".split(""),
      "qwertyuiop".split(""),
      "asdfghjkl:".split(""),
      "zxcvbnm,.'".split(""),
      ["(", ")", "[", "]", "=", "+", "-", "*", "/", "_"],
      ["<", ">", "#", '"', "%", "!", "&", "|", "{", "}"]
    ];

    const CW = 1200, CH = 900;

    function openCodeVR(k, list, n, task) {
      closeCodeVR();
      if (!window.R360Py || !ACT) { toast("The Python editor is not available here."); return; }
      const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
      const cx = cv.getContext("2d");
      const tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
      const mesh = new T.Mesh(new T.PlaneGeometry(1.55, 1.55 * CH / CW),
        new T.MeshBasicMaterial({ map: tex, depthTest: false, depthWrite: false }));
      mesh.renderOrder = 22;    // the program is in front of the panels beside it
      setAnchor(true);
      scene.add(mesh);
      const sc = core.exp.scenes[core.cur], st = sc.stations[k];
      vrCode = { task, model: ACT.model(task), k, list, n, st,
                 cv, cx, tex, mesh, text: task.starter || "", caret: (task.starter || "").length,
                 shift: false, out: "", err: false, attempts: 0, best: 0, hintStep: 0,
                 tests: [], result: "", resultOk: false, tryLine: "", done: false,
                 busy: true, state: ACT.SAY.starting };
      vrCode.caret = vrCode.text.length;
      layout();
      startRuntime();
    }

    // Everything the workspace shows, placed and painted.
    function layout() {
      const v = vrCode; if (!v) return;
      seat(v.mesh, SEAT.code);
      showTask(); seat(taskPanel.mesh, SEAT.task);
      showSide(); if (sidePanel.open) seat(sidePanel.mesh, SEAT.side);
      showKeyboard(); seat(kbPanel.mesh, SEAT.keys);
      if (padPanel.open) seat(padPanel.mesh, SEAT.pad);
      paintCode();
    }
    /* For a pupil who has turned round, or who started the lesson lying back and
     * is now sitting up. The workspace is taken to wherever they are looking
     * now, with every character of their program still in it. */
    function recentre() {
      if (!vrCode) return;
      setAnchor(true);
      layout();
      toast("Workspace moved to where you are looking.");
    }

    // ---- what to do: the stage, the steps, the brief. Above.
    function showTask() {
      const v = vrCode; if (!v) return;
      const M = v.model, b = [];
      b.push({ p: `${M.stage}  ·  Activity ${v.n + 1} of ${v.list.length}`, size: 27, bold: true, color: STAGE_COL(M) });
      b.push({ p: M.says, size: 24, color: COL.soft });
      b.push({ gap: 10 });
      M.steps.forEach((s, i) => b.push({ rich: s, n: i + 1, size: 30 }));
      if (M.brief.length) {
        b.push({ gap: 8 });
        M.brief.forEach(x => b.push({ rich: x, bullet: true, size: 25, color: COL.soft, tight: true }));
      }
      taskPanel.set({ title: `${v.st.label === "?" ? "" : v.st.label + "  "}${v.st.name}`,
                      color: v.st.col || COL.ok, blocks: b });
    }
    /* The chips on the screen are coloured by stage - a Try it reads as an
     * invitation and a Challenge as the hard one - and the same colours are
     * used here so the two are recognisably the same question. */
    function STAGE_COL(M) {
      if (M.opt) return COL.ok;
      if (M.kind === "try" || M.kind === "predict") return COL.info;
      if (M.kind === "debug") return "#ffb36b";
      if (M.kind === "change" || M.kind === "complete") return "#cdb8ff";
      return COL.edge;
    }

    /* ---- the reference panel: a turn of the head to the right ----
     *
     * The screen keeps the worked example and the marking in the same column,
     * because they are the two things a pupil looks away from their program to
     * read. So they are one surface in here as well: the marking goes on top
     * when there is any, and the example is underneath it, still there.
     */
    function showSide() {
      const v = vrCode; if (!v) return;
      const M = v.model;
      const marked = v.tryLine || v.tests.length || v.result;
      if (!M.teach && !marked) { sidePanel.hide(); return; }
      const b = [];
      if (marked) {
        if (v.result) b.push({ p: v.result, size: 25, bold: true, color: v.resultOk ? COL.ok : COL.bad });
        if (v.tryLine) b.push({ p: v.tryLine, size: 22, color: COL.edge });
        // every test, pass or fail, the way the screen lists them
        v.tests.forEach(t => {
          b.push({ kv: [(t.given ? "Input " + t.given + " → " : "") + "expected " + t.want, "",
                        [t.ok ? "g" : "r", t.ok ? "✓" : "✗"]] });
          if (!t.ok && t.why) b.push({ p: t.why, size: 20, color: COL.soft, tight: true });
        });
        if (M.teach) b.push({ gap: 12 });
      }
      if (M.teach) {
        b.push({ p: "LEARN", size: 19, color: COL.info });
        b.push({ rich: M.teach.say, size: 24 });
        if (M.teach.code.length) b.push({ gap: 4 }, { code: M.teach.code.join("\n"), size: 22 });
        if (M.teach.out.length) b.push({ p: "shows", size: 19, color: COL.info },
                                       { p: M.teach.out.join("\n"), size: 22, mono: true, tight: true });
        M.teach.lines.forEach(l => b.push({ rich: "`" + l.code + "` — " + l.note, size: 20, color: COL.soft, tight: true }));
      }
      sidePanel.set({ title: marked ? (v.resultOk ? "Marked" : "How it went") : "Learn",
                      color: marked ? (v.resultOk ? COL.ok : COL.edge) : COL.info, blocks: b });
    }

    // ---- your program: the editor, the required run, the output. Ahead.
    function paintCode() {
      const v = vrCode; if (!v) return;
      const M = v.model, x = v.cx, W = CW, H = CH;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = COL.deep; x.fillRect(0, 0, W, H);
      rr(x, 2, 2, W - 4, H - 4, 20); x.lineWidth = 5; x.strokeStyle = COL.line; x.stroke();

      // the header, so a pupil can see which question they are in
      x.fillStyle = COL.bg; rr(x, 2, 2, W - 4, 58, 20); x.fill();
      x.fillStyle = COL.edge; x.font = `700 26px ${FONT}`; x.textAlign = "left"; x.textBaseline = "middle";
      x.fillText("YOUR PROGRAM", 26, 32);
      x.fillStyle = COL.soft; x.font = `22px ${FONT}`; x.textAlign = "right";
      x.fillText(`${M.stage} · ${v.n + 1} of ${v.list.length}`, W - 26, 32);

      // the program
      const SZ = 27, LH = 34, PADX = 78, TOP = 76, SHOWN = 11;
      const lines = v.text.split("\n");
      const before = v.text.slice(0, v.caret).split("\n");
      const cl = before.length - 1, cc = before[before.length - 1].length;
      x.font = SZ + "px Consolas, monospace";
      const chw = x.measureText("0").width;
      const first = Math.max(0, Math.min(cl - SHOWN + 3, lines.length - SHOWN));
      for (let i = first; i < Math.min(lines.length, first + SHOWN); i++) {
        const y = TOP + (i - first) * LH;
        x.font = (SZ - 5) + "px Consolas, monospace"; x.fillStyle = "#4a5a78";
        x.textAlign = "right"; x.textBaseline = "top"; x.fillText(String(i + 1), PADX - 20, y + 5);
        x.textAlign = "left";
        let px = PADX;
        for (const tok of R360Py.tokens(lines[i])) {
          x.font = SZ + "px Consolas, monospace"; x.fillStyle = tok.c;
          x.fillText(tok.t, px, y); px += x.measureText(tok.t).width;
        }
        if (i === cl) { x.fillStyle = COL.edge; x.fillRect(PADX + cc * chw, y - 2, 3, SZ + 8); }
      }
      if (lines.length > first + SHOWN)
        { x.fillStyle = COL.soft; x.font = `20px ${FONT}`; x.textAlign = "right";
          x.fillText(`${lines.length - first - SHOWN} more line(s) below`, W - 26, TOP + SHOWN * LH - 24); }

      /* What one run has to display, directly above what this run did display,
       * so the two can be compared without looking away. This is the panel that
       * stops a pupil guessing whether a value is typed in or written into the
       * program, and it was missing from the headset entirely. */
      let y = TOP + SHOWN * LH + 8;
      if (M.run) {
        const h = 36 + Math.max(M.run.given.length || 1, M.run.shows.length) * 26;
        rr(x, 22, y, W - 44, h, 12); x.fillStyle = COL.bg; x.fill();
        x.lineWidth = 2; x.strokeStyle = COL.line; x.stroke();
        x.fillStyle = COL.edge; x.font = `700 19px ${FONT}`; x.textAlign = "left"; x.textBaseline = "top";
        x.fillText("ONE RUN OF YOUR PROGRAM", 36, y + 10);
        x.font = `19px ${FONT}`; x.fillStyle = COL.soft;
        x.fillText("You type", 36, y + 36); x.fillText("It displays", 36, y + 62);
        x.font = "21px Consolas, monospace"; x.fillStyle = COL.fg;
        x.fillText(M.run.given.length ? M.run.given.join(", ") : "nothing", 180, y + 35);
        x.fillStyle = COL.ok;
        M.run.shows.forEach((s, i) => x.fillText(s, 180, y + 61 + i * 24));
        y += h + 10;
      }

      // the console
      x.fillStyle = COL.edge; x.font = `700 19px ${FONT}`; x.textAlign = "left"; x.textBaseline = "top";
      x.fillText("PROGRAM OUTPUT", 26, y); y += 26;
      const conH = H - y - 86;
      rr(x, 22, y, W - 44, conH, 12); x.fillStyle = "#0a1120"; x.fill();
      x.lineWidth = 2; x.strokeStyle = COL.line; x.stroke();
      /* The whole message, wrapped. Python's errors are said in three parts -
       * its own words, what they probably mean, and what to look at - and the
       * headset used to cut that to four lines of ninety characters, which threw
       * away the part that teaches. */
      x.font = "20px Consolas, monospace";
      const wrapped = [];
      (v.out || ACT.SAY.beforeRun).split("\n").forEach(l => {
        let cur = "";
        (l.split(" ")).forEach(w => {
          const t2 = cur ? cur + " " + w : w;
          if (x.measureText(t2).width > W - 92 && cur) { wrapped.push(cur); cur = w; } else cur = t2;
        });
        wrapped.push(cur);
      });
      const room = Math.floor((conH - 20) / 25);
      wrapped.slice(0, room).forEach((l, i) => {
        x.fillStyle = v.err ? "#ff9a9a" : (v.out ? COL.fg : "#4a5a78");
        x.fillText(l, 36, y + 12 + i * 25);
      });
      if (wrapped.length > room) {
        x.fillStyle = COL.soft; x.font = `18px ${FONT}`; x.textAlign = "right";
        x.fillText(`${wrapped.length - room} more line(s)`, W - 36, y + conH - 26);
      }

      // what the runtime is doing, said where it can be seen
      if (v.state) {
        x.textAlign = "left"; x.textBaseline = "middle";
        x.font = `700 23px ${FONT}`;
        x.fillStyle = v.runtimeBad ? COL.bad : COL.edge;
        x.fillText(v.state, 26, H - 44);
      }
      v.tex.needsUpdate = true;
    }

    // ---------------- the runtime, and what it is doing ----------------
    /* Python is about twelve megabytes and a headset is usually on the slowest
     * network in the building. The wait is said, with what it is doing and how
     * long it has been; a failure is said too, and offers a key to try again,
     * because what a pupil met before was "Starting Python..." for ever. */
    let offPyState = null;
    function startRuntime() {
      const v = vrCode; if (!v) return;
      v.busy = true; v.runtimeBad = false; v.state = ACT.SAY.starting;
      if (offPyState) { offPyState(); offPyState = null; }
      offPyState = R360Py.on((s, st) => {
        if (!vrCode) { if (offPyState) { offPyState(); offPyState = null; } return; }
        if (s === "loading") {
          vrCode.state = (st.note || ACT.SAY.starting) + (st.seconds > 5 ? ` (${st.seconds}s)` : "") + "…";
          vrCode.runtimeBad = false; paintCode();
        } else if (s === "error") runtimeDown(st.error);
      });
      showKeyboard(); paintCode();
      R360Py.ready().then(r => {
        if (!vrCode) return;
        if (r && r.ok === false) { runtimeDown(r.error); return; }
        vrCode.busy = false; vrCode.runtimeBad = false; vrCode.state = "";
        showKeyboard(); paintCode();
      });
    }
    function runtimeDown(msg) {
      const v = vrCode; if (!v) return;
      v.busy = true; v.runtimeBad = true;
      v.state = "Python did not start — press Try again";
      v.err = true;
      v.out = (msg || "") + "\n\n" + ACT.SAY.runtimeStillHelp;
      showKeyboard(); paintCode();
    }

    // ---------------- typing ----------------
    function typeKey(key) {
      const v = vrCode; if (!v || v.busy) return;
      const ins = (t) => { v.text = v.text.slice(0, v.caret) + t + v.text.slice(v.caret); v.caret += t.length; };
      if (key === "←") v.caret = Math.max(0, v.caret - 1);
      else if (key === "→") v.caret = Math.min(v.text.length, v.caret + 1);
      else if (key === "↑" || key === "↓") {
        // up and down a line, keeping the column, as any editor does
        const before = v.text.slice(0, v.caret).split("\n");
        const lines = v.text.split("\n");
        const li = before.length - 1, col = before[before.length - 1].length;
        const to = key === "↑" ? li - 1 : li + 1;
        if (to < 0 || to >= lines.length) return;
        let at = 0; for (let i = 0; i < to; i++) at += lines[i].length + 1;
        v.caret = at + Math.min(col, lines[to].length);
      }
      else if (key === "Back") { if (v.caret > 0) { v.text = v.text.slice(0, v.caret - 1) + v.text.slice(v.caret); v.caret--; } }
      else if (key === "Enter") {
        // keep this line's indentation, and add one after a colon, exactly as
        // the editor on the web does - indentation is most of Python
        const line = v.text.slice(v.text.lastIndexOf("\n", v.caret - 1) + 1, v.caret);
        const pad = (line.match(/^ */) || [""])[0] + (/:\s*$/.test(line) ? "    " : "");
        ins("\n" + pad);
      }
      else if (key === "Tab") ins("    ");
      else if (key === "Space") ins(" ");
      else if (key === "Shift") { v.shift = !v.shift; showKeyboard(); return; }
      else { ins(v.shift ? key.toUpperCase() : key); if (v.shift) { v.shift = false; showKeyboard(); } }
      paintCode();
    }

    /* A headset has no keyboard, and the system one is not offered while a page
     * is in immersive VR, so this is one. A physical keyboard paired with the
     * headset types into it as well: the characters arrive as ordinary key
     * events on the page, and there is no reason to make someone who has one
     * point at pictures of keys. */
    function showKeyboard() {
      const v = vrCode; if (!v) return;
      const M = v.model;
      const row = keys => ({ row: keys.map(ch => ({
        btn: ch === " " ? "Space" : (v.shift && /[a-z]/.test(ch) ? ch.toUpperCase() : ch),
        id: "key" + ch, center: true, size: 26, onClick: () => typeKey(ch) })) });
      const wait = v.busy && !v.runtimeBad;
      const act = [];
      act.push({ btn: wait ? "…" : "▶ Run", id: "crun", center: true, size: 26, disabled: v.busy, onClick: runCodeVR });
      // A Try it has nothing to mark: running it is the activity.
      if (!M.noCheck) act.push({ btn: wait ? "…" : "Check my answer", id: "ccheck", center: true, size: 26, disabled: v.busy, onClick: checkCodeVR });
      if (M.hasHint) act.push({ btn: "Hint", id: "chint", center: true, size: 26, onClick: showHint });
      // Asking is an ordinary thing to do, and it is on the screen, so it is here.
      act.push({ btn: "I need help", id: "chelp", center: true, size: 26, onClick: showHelp });
      if (v.runtimeBad) act.push({ btn: "Try again", id: "cretry", center: true, size: 26,
        onClick: () => { R360Py.reset(); startRuntime(); } });

      /* The way on, under the same rule as the screen: it appears when the
       * activity is finished, and short of that the pupil goes round again.
       * Before this there was no way on at all in the headset - Close was the
       * only button - so a station could not be worked through in here. */
      const nav = [];
      const last = v.n === v.list.length - 1;
      const may = !core.gated || !core.gated() || core.reviewMode || core.isComplete(v.k, v.list[v.n]);
      if (v.done || may) nav.push({ btn: last ? ACT.SAY.finish : ACT.SAY.next, id: "cnext", primary: true, center: true, size: 26,
        onClick: () => { const k = v.k, list = v.list, n = v.n; closeCodeVR(); last ? finish(k) : run(k, list, n + 1); } });
      /* Not finished yet, and they have tried: the way on stays in its place so
       * it can be seen not to be available, and says what to do instead. The
       * same rule and the same words as the screen - there is no skipping in
       * this course, in here either. */
      else if (v.attempts) nav.push({ btn: ACT.SAY.again, id: "cagain", center: true, size: 26, disabled: true });
      nav.push({ btn: "⌖ Recentre", id: "crecentre", center: true, size: 24, onClick: recentre });
      nav.push({ btn: "Close", id: "cclose", center: true, size: 26, onClick: closeCodeVR });

      /* Where everything is, said once and left there, rather than as a message
       * that appears over the program and then goes away. A pupil who puts the
       * headset down for a week comes back to the same sentence. */
      const whereLine = { p: "Look up for the task  ·  right for the example and your marks  ·  ⌖ Recentre moves it all to where you are looking",
                          size: 21, align: "center", color: COL.soft };
      kbPanel.set({ color: COL.line, scale: .8, blocks: [
        row(KEYS[0]), row(KEYS[1]), row(KEYS[2]), row(KEYS[3]), row(KEYS[4]), row(KEYS[5]),
        { row: [
          { btn: v.shift ? "SHIFT on" : "Shift", id: "kshift", center: true, size: 24, state: v.shift ? "on" : "", onClick: () => typeKey("Shift") },
          { btn: "Space", id: "kspace", center: true, size: 24, onClick: () => typeKey("Space") },
          { btn: "Tab", id: "ktab", center: true, size: 24, onClick: () => typeKey("Tab") },
          { btn: "←", id: "kleft", center: true, size: 24, onClick: () => typeKey("←") },
          { btn: "→", id: "kright", center: true, size: 24, onClick: () => typeKey("→") },
          { btn: "↑", id: "kup", center: true, size: 24, onClick: () => typeKey("↑") },
          { btn: "↓", id: "kdown", center: true, size: 24, onClick: () => typeKey("↓") },
          { btn: "Back", id: "kback", center: true, size: 24, onClick: () => typeKey("Back") },
          { btn: "Enter", id: "kenter", center: true, size: 24, onClick: () => typeKey("Enter") }
        ] },
        { row: act }, { row: nav }, whereLine] });
    }

    // ---------------- running and marking ----------------
    async function runCodeVR() {
      const v = vrCode; if (!v || v.busy) return;
      v.busy = true; v.state = ACT.SAY.running; showKeyboard(); paintCode();
      const M = v.model;
      const r = await R360Py.run(v.text, { stdin: M.runInput.stdin.slice(), files: M.runInput.files, echo: true, timeoutMs: 6000 });
      if (!vrCode) return;
      if (r.noRuntime) { runtimeDown(r.error); return; }
      v.err = !!r.error;
      v.out = (r.stdout || "") + (r.error ? (r.stdout ? "\n" : "") + r.error : "");
      if (!v.out.trim()) v.out = ACT.SAY.emptyOutput;
      // On a Try it the run is the activity, so a clean one finishes it.
      if (M.noCheck) {
        if (!r.error && !v.done) {
          v.best = core.marks(v.task);
          core.awardBest(v.k, v.list[v.n], v.best);
          v.done = true; v.resultOk = true; v.tryLine = "";
          v.result = ACT.SAY.doneHead + " " + ACT.SAY.doneTry(v.task);
        } else if (r.error) { v.tryLine = ACT.SAY.tryBroken; }
      }
      v.busy = false; v.state = "";
      showKeyboard(); showSide(); if (sidePanel.open) seat(sidePanel.mesh, SEAT.side);
      paintCode();
    }

    async function checkCodeVR() {
      const v = vrCode; if (!v || v.busy) return;
      const tests = v.model.tests; if (!tests.length) return;
      /* The same rule as on the screen, out of the same place, so a program
       * cannot be refused on one and accepted on the other. */
      const refused = ACT.rules(v.task, v.text);
      if (refused) {
        v.resultOk = false; v.result = refused.head + " " + refused.text; v.tests = [];
        showKeyboard(); showSide(); seat(sidePanel.mesh, SEAT.side); paintCode(); return;
      }
      v.busy = true; v.state = ACT.SAY.marking; showKeyboard(); paintCode();
      const rows = []; let passed = 0;
      for (const t of tests) {
        const r = await R360Py.run(v.text, { stdin: (t.in || []).slice(), files: t.files || {}, echo: false, timeoutMs: 6000 });
        if (!vrCode) return;
        if (r.noRuntime) { runtimeDown(r.error); return; }
        const want = (t.out || []).join("\n");
        const ok = !r.error && core.sameOutput(r.stdout, want);
        if (ok) passed++;
        rows.push({ ok, want, given: (t.in || []).join(", "),
          why: ok ? "" : (r.error ? r.error.split("\n")[0]
            : "your program printed " + ((r.stdout || "").trim() || "nothing")) + (t.why ? "  " + t.why : "") });
      }
      const g = ACT.grade(core.marks(v.task), passed, tests.length);
      // Same rule as on screen: keep trying, keep the best mark reached.
      v.attempts++;
      v.best = Math.max(v.best, g.got);
      core.awardBest(v.k, v.list[v.n], v.best);
      v.busy = false; v.state = ""; v.tests = rows;
      v.done = g.all; v.resultOk = g.all;
      v.tryLine = ACT.SAY.tryLine(v.attempts, g.all);
      v.result = g.all ? ACT.SAY.doneHead + " " + ACT.SAY.doneAll(v.task, tests.length)
                       : ACT.SAY.missHead(passed, tests.length, v.best, g.max) + "  " + ACT.SAY.missText(v.task);
      showKeyboard(); showSide(); seat(sidePanel.mesh, SEAT.side); paintCode();
      /* Three checks that have not worked is the moment to say, once, that
       * asking the teacher is an ordinary thing to do. The same rule, and the
       * same words, as the screen. */
      if (!g.all && v.attempts === 3) showHelp();
    }

    // ---------------- the ladder, and asking ----------------
    /* A hint is a ladder, not a door: one rung at a time, each asked for, and
     * the top of it is still only the technique on different data. The rungs
     * come from js/pyactivity.js, so they are the same rungs in the same order
     * as the screen, and the animated one opens the diagram the way any diagram
     * opens in here. The program stays where it is behind the panel. */
    function showHint() {
      const v = vrCode; if (!v) return;
      const rungs = ACT.hintLadder(v.task, d => !!(window.R360Diagrams && R360Diagrams.kinds.includes(d)));
      if (!rungs.length) return;
      v.hintStep = Math.min(Math.max(v.hintStep, 1), rungs.length);
      const shown = rungs.slice(0, v.hintStep);
      const b = [{ p: ACT.SAY.hintWhere(v.hintStep, rungs.length), size: 22, color: COL.soft }, { gap: 6 }];
      shown.forEach((r, i) => {
        b.push({ p: `Step ${i + 1} of ${rungs.length} — ${r.name}`, size: 24, bold: true, color: COL.edge });
        if (r.kind === "say") b.push({ rich: r.text, size: 27 });
        else if (r.kind === "code") b.push({ code: r.code.join("\n"), size: 24 });
        else if (r.kind === "steps") r.steps.forEach(s => b.push({ rich: s, bullet: true, size: 24, tight: true }));
        else if (r.kind === "diagram") b.push({ p: "Watch it work, then come back to your program.", size: 24, color: COL.soft });
        b.push({ gap: 6 });
      });
      const top = rungs[v.hintStep - 1];
      if (top && top.kind === "diagram") {
        openDiagramVR({ id: "hint:" + top.diagram, dg: { diagram: top.diagram, title: "Hint: how this technique works" } });
      }
      const nav = [];
      if (v.hintStep < rungs.length)
        nav.push({ btn: ACT.SAY.hintMore(rungs.length - v.hintStep), id: "hmore", primary: true, center: true, size: 25,
          onClick: () => { v.hintStep++; showHint(); } });
      nav.push({ btn: "Close hint", id: "hclose", center: true, size: 25, onClick: closePad });
      b.push({ p: ACT.SAY.hintKept, size: 21, color: COL.soft }, { row: nav });
      padPanel.set({ title: "Hint", color: COL.edge, onClose: closePad, blocks: b });
      seat(padPanel.mesh, SEAT.pad);
    }
    /* Asking for help says to ask, says the question still has to be finished,
     * and says nobody has been told - the same three paragraphs as the screen,
     * out of the same place, because a headset that quietly unlocked the next
     * question would be a way round the course rather than a way through it. */
    function showHelp() {
      const v = vrCode; if (!v) return;
      const H = ACT.SAY.help;
      const nav = [];
      if (v.model.hasHint) nav.push({ btn: H.buttons.hint, id: "hhint", center: true, size: 25, onClick: () => { closePad(); showHint(); } });
      nav.push({ btn: H.buttons.back, id: "hback", primary: true, center: true, size: 25, onClick: closePad });
      padPanel.set({ title: H.title, color: COL.info, onClose: closePad, blocks: [
        { p: H.lead, size: 22, color: COL.soft }, { gap: 6 },
        { p: H.body[0], size: 27 }, { gap: 4 },
        { p: H.body[1], size: 23, color: COL.soft },
        { p: H.body[2], size: 23, color: COL.soft }, { gap: 6 },
        { row: nav }] });
      seat(padPanel.mesh, SEAT.pad);
    }
    function closePad() { padPanel.hide(); closeDiagramVR(); }

    function closeCodeVR() {
      if (!vrCode) return;
      if (offPyState) { offPyState(); offPyState = null; }
      scene.remove(vrCode.mesh); vrCode.tex.dispose(); vrCode = null;
      kbPanel.hide(); taskPanel.hide(); sidePanel.hide(); padPanel.hide();
      closeDiagramVR(); clearAnchor();
      core.refreshSprites(); core.hud();
    }

    // ---------------- questions ----------------
    function openStation(k) {
      /* The same rule as on the screen: the Python course is worked in order, so
       * a station the pupil has not reached yet says so rather than opening. */
      const at = core.lockedStation ? core.lockedStation(k) : -1;
      if (at >= 0) {
        const name = core.exp.scenes[core.cur].stations[at].name;
        qPanel.set({ title: "Not yet", color: COL.edge, onClose: () => qPanel.hide(), blocks: [
          { p: "Finish the station you are on first.", size: 34, bold: true },
          { p: "This course is worked in order. You are up to " + name + ".", size: 26 },
          { p: "Stuck? Use the hint, or take the headset off and ask your teacher.", size: 24, color: COL.soft },
          { btn: "Return to your current question", id: "back", primary: true,
            onClick: () => openStation(at) }] });
        atAnchor(qPanel.mesh, 1.5, 0);
        return;
      }
      const list = core.taskList(k); if (!list) return;
      infoPanel.hide(); menuPanel.hide();
      setAnchor(true);                              // one pose for this whole station
      atAnchor(qPanel.mesh, 1.5, 0);
      run(k, list, 0);
    }
    function run(k, list, n) {
      const sc = core.exp.scenes[core.cur], st = sc.stations[k], i = list[n], task = st.tasks[i];
      const title = `${st.label === "?" ? "" : st.label + "  "}${st.name}`;
      const head = [];
      if (list.length > 1) head.push({ p: `Question ${n + 1} of ${list.length}`, size: 24, color: COL.soft });
      if (core.reviewMode) head.push({ p: "Review: this won't change your score, but shows whether you've fixed it.", size: 24, color: COL.edge });
      let img = null; if (task.img) { img = new Image(); img.src = core.asset ? core.asset(task.img) : "experiences/" + task.img; }
      // The question, with any data the author prescribed boxed and coloured as
      // the screen shows it rather than printed with the backticks still in.
      const top = () => [...head, img ? { img } : null, { rich: task.q, size: 34, bold: true }, { gap: 6 }];
      const close = () => { qPanel.hide(); closeBoard(); clearAnchor(); core.refreshSprites(); core.hud(); };
      /* The question panel is placed here as well as by openStation, because a
       * pupil reaching this question from the one before it - the way the
       * course is meant to be worked - never went through openStation. */
      atAnchor(qPanel.mesh, 1.5, 0);
      let fb = null, done = false;
      const fbBlocks = () => fb ? [{ gap: 4 }, { p: fb.head, size: 32, bold: true, color: fb.ok ? COL.ok : COL.bad }, { p: fb.text, size: 28 },
        /* The way on appears only when the activity is finished. Short of that
          * the pupil goes round again - see the same rule in js/player.js. */
          (!core.gated || !core.gated() || core.reviewMode || core.isComplete(k, i)
            ? { btn: n === list.length - 1 ? (ACT ? ACT.SAY.finish : "Finish") : (ACT ? ACT.SAY.next : "Next question"), id: "next", primary: true,
                onClick: () => n === list.length - 1 ? finish(k) : run(k, list, n + 1) }
            : { btn: ACT ? ACT.SAY.again : "Try this one again", id: "again", primary: true, onClick: () => run(k, list, n) })] : [];
      const setFb = (ok, partial, text) => { fb = { ok, head: ok ? "Correct!" : partial || "Not quite.", text }; };
      const show = body => qPanel.set({ title, color: st.col, onClose: close, blocks: [...top(), ...body(), ...fbBlocks()] });

      closeBoard();
      if (task.t === "defence") {
        const rec = core.prog.defence || { best: 0, attempts: 0 };
        let lastEnd = null;
        const board = R360Defence.Defence({ best: rec.best, isBest: () => lastEnd && lastEnd.score > rec.best,
          onEnd: r => { lastEnd = r; const d = core.prog.defence || (core.prog.defence = { best: 0, attempts: 0, history: [] });
            d.attempts++; d.lastScore = r.score; d.best = Math.max(d.best, r.score); d.history = [[r.score, r.rounds, r.correct, Date.now()]].concat(d.history || []).slice(0, 10);
            core.prog.scenes[core.exp.scenes[core.cur].id].done[k] = true; core.save(); core.refreshSprites(); core.hud(); } });
        window.__def = board;
        openBoard(board);
        qPanel.set({ title: st.name, color: st.col, onClose: () => { qPanel.hide(); closeBoard(); clearAnchor(); core.refreshSprites(); core.hud(); }, blocks: [
          { p: "Point at the board and pull the trigger to choose. Spend your budget, then face each threat.", size: 26 },
          { p: "Personal best: " + rec.best, size: 30, bold: true, color: COL.edge }] });
        atAnchor(qPanel.mesh, 1.55, -24);         // directly below the board
        return;
      }
      /* A Predict activity has no editor and nothing to type, so in here it is
       * the question panel with the program above the options - the same thing
       * the screen shows, built out of the panel blocks the headset already
       * has rather than the typing keyboard, which would be useless for it. */
      if (task.t === "code" && task.kind === "predict") {
        const opts = core.shuffle(task.a.slice()), right = task.a[0]; let chosen = null;
        /* The same stage label and the same sentence about it as the screen,
         * and the program in the editor's own colours rather than as grey text.
         * A Predict is the one code activity with nothing to type, so it is the
         * question panel rather than the workspace - but it is the same
         * question, said the same way. */
        const M = ACT ? ACT.model(task) : null;
        const prog = [
          ...(M ? [{ p: `${M.stage}  ·  ${M.says}`, size: 23, color: COL.info }, { gap: 4 }] : []),
          { p: "The program", size: 24, color: COL.edge },
          { code: task.code.join("\n"), size: 25 },
          ...((task.in || []).length ? [{ p: "You type: " + task.in.join(", "), size: 24, color: COL.edge }] : []),
          { p: "Choose what it displays", size: 24, color: COL.edge }];
        const body = () => [...prog, ...opts.map((o, x) => ({ btn: o, id: "p" + x, disabled: done,
          state: done ? (o === right ? "right" : x === chosen ? "wrong" : "") : "", onClick: () => {
            chosen = x; done = true; const ok = o === right; core.award(k, i, ok ? core.marks(task) : 0);
            setFb(ok, ok ? "That is what it displays." : "It displays this instead: " + right,
                  task.fb || ""); show(body); } }))];
        show(body);
        return;
      }
      if (task.t === "code") { closeAll(); openCodeVR(k, list, n, task); return; }
      if (task.t === "sprint" || task.t === "blitz" || task.t === "lawgame" || task.t === "arena") { sprintVR(k, st, task); return; }
      if (BOARD_TASKS.includes(task.t)) {
        const Lg = window.R360Logic;
        const board = task.t === "circuit" ? Lg.CircuitBoard({ inputs: task.inputs || Lg.vars(Lg.parse(task.expr)), hit: 34 })
          : task.t === "expr" ? Lg.ExprBoard({ expr: task.expr, out: task.out })
          : task.t === "table" ? Lg.TableBoard({ expr: task.expr, cols: task.cols, out: task.out, inputs: task.inputs, diagram: task.diagram })
          : R360Algo.TYPES.includes(task.t) ? R360Algo.make(task)
        : R360OS.TYPES.includes(task.t) ? R360OS.make(task)
          : R360Data.make(task);
        openBoard(board);
        atAnchor(qPanel.mesh, 1.55, -24);         // directly below the board
        let lastOk = true, shown = false;
        const tips = { circuit: "Point at a gate at the top of the board, hold the trigger and drag it down. To wire, hold the trigger on an output dot and release on an input.",
          expr: "Hold the trigger on a tile and drag it into the answer row, or just pull the trigger on a tile to add it to the end.", table: "Point at a ? and pull the trigger to change it to 0 or 1.",
          convert: "Point at a bit or a key and pull the trigger.", addshift: "Point at a bit and pull the trigger to change it between 0 and 1.",
          pixels: "Choose a colour, then hold the trigger and sweep across the pixels to paint them.", sound: "Pull the trigger on the level nearest the wave in each column.",
          memory: "Hold the trigger on a program and drag it into RAM, or onto the disk if RAM is full.", permissions: "Pull the trigger on a cell to change the access level.", impact: "Pull the trigger on a cell to change how that group is affected.",
          trace: "Pull the trigger on a cell, then on the keypad to type the value.",
          bugline: "Pull the trigger on the line with the error, then on the kind of error it is.",
          searchstep: "Pull the trigger on the item the algorithm checks next.",
          sortstep: "Pull the trigger on two items to swap them.",
          defrag: "Pull the trigger on a block, then on a free space to move it there. Or use the Defragment button." };
        const body = () => done ? [
            !lastOk && task.t === "circuit" && !shown ? { btn: "Show a correct circuit", id: "show", center: true, onClick: () => { board.showAnswer(task.expr); shown = true; show(body); } } : null]
          : [{ p: tips[task.t], size: 24, color: COL.soft },
             { row: [{ btn: "Clear", id: "clr", center: true, onClick: () => board.clear() },
                     { btn: "Check my answer", id: "check", primary: true, onClick: () => {
                        if (board.filled && !board.filled()) { toast(task.t === "sound" ? "Choose a level in every column first." : "Fill in your answer first."); return; }
                        const res = board.check(task.expr); if (res.incomplete) { toast(res.msg); return; }
                        done = true; lastOk = res.ok; core.award(k, i, res.got);
                        setFb(res.ok, res.max > 1 ? `You got ${res.got} out of ${res.max}.` : null, res.msg + " " + (task.fb || "")); show(body); } }] }];
        show(body);
        return;
      }
      if (task.t === "mcq") {
        const opts = core.shuffle(task.a), right = task.a[0]; let chosen = null;
        const body = () => opts.map((o, x) => ({ btn: o, id: "o" + x, disabled: done, state: done ? (o === right ? "right" : x === chosen ? "wrong" : "") : "", onClick: () => {
          chosen = x; done = true; const ok = o === right; core.award(k, i, ok ? 1 : 0);
          setFb(ok, null, (ok ? "" : "The correct answer is shown in green. ") + task.fb); show(body); } }));
        show(body);
      } else if (task.t === "multi") {
        const on = new Set();
        const body = () => [...task.opts.map((o, x) => ({ btn: o, id: "m" + x, disabled: done, state: done ? (task.correct.includes(o) ? "right" : on.has(o) ? "wrong" : "") : on.has(o) ? "on" : "",
          onClick: () => { on.has(o) ? on.delete(o) : on.add(o); show(body); } })),
          done ? null : { btn: "Check my answer", id: "check", primary: true, disabled: !on.size, onClick: () => {
            done = true; const ok = on.size === task.correct.length && [...on].every(x => task.correct.includes(x)); core.award(k, i, ok ? 1 : 0);
            setFb(ok, null, (ok ? "" : "The correct answers are shown in green. ") + task.fb); show(body); } }];
        show(body);
      } else if (task.t === "sort") {
        const items = core.shuffle(task.items), pick = {};
        const body = () => { const out = [];
          items.forEach((it, x) => {
            out.push({ p: it[0] + (done && pick[x] !== it[1] ? `   (answer: ${it[1]})` : ""), size: 28, color: done ? (pick[x] === it[1] ? COL.ok : COL.bad) : COL.fg });
            out.push({ row: task.cats.map(c => ({ btn: c, id: "s" + x + c, center: true, size: 26, disabled: done, state: pick[x] === c ? (done ? (c === it[1] ? "right" : "wrong") : "on") : "", onClick: () => { pick[x] = c; show(body); } })) });
          });
          if (!done) out.push({ btn: "Check my answers", id: "check", primary: true, disabled: Object.keys(pick).length < items.length, onClick: () => {
            done = true; let got = 0; items.forEach((it, x) => { if (pick[x] === it[1]) got++; }); core.award(k, i, got);
            setFb(got === items.length, `You got ${got} out of ${items.length}.`, (got === items.length ? "" : "Corrections are shown next to each statement. ") + task.fb); show(body); } });
          return out; };
        show(body);
      } else if (task.t === "match") {
        const rights = core.shuffle(task.pairs.map(p => p[1])), pairs = {}; let sel = 0;
        const body = () => { const out = [{ p: done ? "" : "Select an item, then select what it matches.", size: 24, color: COL.soft }];
          task.pairs.forEach((p, x) => {
            const ok = pairs[x] === p[1];
            out.push({ btn: p[0] + (pairs[x] ? "  →  " + pairs[x] : "") + (done && !ok ? `   (answer: ${p[1]})` : ""), id: "l" + x, size: 26, disabled: done,
              state: done ? (ok ? "right" : "wrong") : sel === x ? "on" : "", onClick: () => { sel = x; show(body); } });
          });
          if (!done) {
            out.push({ gap: 4 }, { p: "Matches:", size: 24, color: COL.soft });
            for (let x = 0; x < rights.length; x += 3) out.push({ row: rights.slice(x, x + 3).map(rt => ({ btn: rt, id: "r" + rt, center: true, size: 24, onClick: () => {
              if (sel === null) return; pairs[sel] = rt; const nxt = task.pairs.findIndex((_, y) => !pairs[y]); sel = nxt >= 0 ? nxt : null; show(body); } })) });
            out.push({ btn: "Check my answers", id: "check", primary: true, disabled: Object.keys(pairs).length < task.pairs.length, onClick: () => {
              done = true; let got = 0; task.pairs.forEach((p, x) => { if (pairs[x] === p[1]) got++; }); core.award(k, i, got);
              setFb(got === task.pairs.length, `You got ${got} out of ${task.pairs.length}.`, (got === task.pairs.length ? "" : "Corrections are shown in brackets. ") + task.fb); show(body); } });
          }
          return out; };
        show(body);
      } else if (task.t === "order") {
        const pool = core.shuffle(task.steps); let seq = [];
        const body = () => { const out = [];
          task.steps.forEach((_, x) => {
            const v = seq[x]; const ok = v === task.steps[x];
            out.push({ p: `${x + 1}.  ${v || "…"}` + (done && !ok ? `   (should be: ${task.steps[x]})` : ""), size: 27, color: done ? (ok ? COL.ok : COL.bad) : v ? COL.fg : COL.soft });
          });
          if (!done) {
            out.push({ gap: 6 }, { p: "Select the steps in order:", size: 24, color: COL.soft });
            pool.forEach((p, x) => { if (!seq.includes(p)) out.push({ btn: p, id: "p" + x, size: 26, onClick: () => { seq.push(p); show(body); } }); });
            out.push({ row: [{ btn: "Start again", id: "reset", center: true, disabled: !seq.length, onClick: () => { seq = []; show(body); } },
              { btn: "Check my order", id: "check", primary: true, disabled: seq.length < task.steps.length, onClick: () => {
                done = true; let got = 0; seq.forEach((v, x) => { if (v === task.steps[x]) got++; }); core.award(k, i, got);
                setFb(got === task.steps.length, `You got ${got} out of ${task.steps.length} in the right place.`, task.fb); show(body); } }] });
          }
          return out; };
        show(body);
      }
    }
    // ---------------- Logic sprint (VR) ----------------
    let sprintHook = null;
    function stopSprint() { if (sprintHook) { const i = core.frameHooks.indexOf(sprintHook); if (i >= 0) core.frameHooks.splice(i, 1); sprintHook = null; } }
    function sprintVR(k, st, task) {
      const Lg = window.R360Logic, rec = core.prog.sprint || { best: 0, attempts: 0 };
      stopSprint(); closeBoard();
      const closeAllSprint = () => { stopSprint(); closeBoard(); qPanel.hide(); clearAnchor(); core.refreshSprites(); core.hud(); };
      qPanel.set({ title: st.name, color: st.col, onClose: closeAllSprint, blocks: [
        { p: task.t === "blitz" ? "How fast are your conversions?" : "How fast is your logic?", size: 34, bold: true },
        { p: `You have ${task.duration || 120} seconds. ${task.t === "blitz" ? "Each question asks you to convert between denary, binary and hexadecimal." : "Each question asks you to build a circuit or write an expression."} Correct answers score 100 plus a speed bonus, and streaks multiply your points. A wrong answer resets your streak.`, size: 27 },
        { p: `Personal best: ${rec.best}. Beat it!`, size: 30, bold: true, color: COL.edge },
        { btn: "Start the sprint", id: "go", primary: true, onClick: play }] });
      function play() {
        const s = Lg.Sprint(task.duration || 120, task.t === "blitz" ? R360Data.blitz : task.t === "lawgame" ? R360OS.lawCase : task.t === "arena" ? R360Algo.arenaCase : null); let q = null, board = null, busy = false, fb = null, lastSec = -1;
        const hudText = () => `⏱ ${Math.ceil(s.timeLeft())}s    Score ${s.score}    Streak ${s.streak > 1 ? "×" + (1 + Math.min(s.streak - 1, 4) * .5) : "–"}    Best ${rec.best}`;
        const panel = () => qPanel.set({ title: st.name, color: st.col, onClose: closeAllSprint, blocks: [
          { p: hudText(), size: 30, bold: true, color: COL.edge }, { p: q.q, size: 32, bold: true },
          fb ? { p: fb.head, size: 30, bold: true, color: fb.ok ? COL.ok : COL.bad } : null, fb ? { p: fb.text, size: 26 } : null,
          busy ? null : { row: [{ btn: "Skip", id: "skip", center: true, onClick: () => { s.streak = 0; ask(); } }, { btn: "Clear", id: "clr", center: true, onClick: () => board.clear() },
            { btn: "Check", id: "check", primary: true, onClick: check }] }] });
        function ask() {
          if (s.timeLeft() <= 0) return end();
          q = s.next(); busy = false; fb = null;
          board = R360Algo.TYPES.includes(q.t) ? R360Algo.make(q) : q.t === "law" ? R360OS.make(q) : q.t === "convert" ? R360Data.make(q) : q.t === "circuit" ? Lg.CircuitBoard({ inputs: Lg.vars(Lg.parse(q.expr)), hit: 34 }) : Lg.ExprBoard({ expr: q.expr });
          window.__sprint = { s, board, q };
          openBoard(board); panel();
          atAnchor(qPanel.mesh, 1.55, -24);       // the anchor is already set, so this does not move
        }
        function check() {
          const res = board.check(q.expr); if (res.incomplete) { toast(res.msg); return; }
          busy = true; const r = s.mark(res.ok);
          fb = res.ok ? { ok: true, head: `+${r.pts} points`, text: r.mult > 1 ? `Speed bonus ${r.bonus}, streak ×${r.mult}.` : `Speed bonus ${r.bonus}.` }
                      : { ok: false, head: "Not quite.", text: q.t === "law" || q.t === "convert" || R360Algo.TYPES.includes(q.t) ? "The answer is " + q.answer + "." : "A correct answer is Q = " + q.expr + "." };
          if (!res.ok && q.t === "circuit") board.showAnswer(q.expr);
          panel(); setTimeout(ask, res.ok ? 800 : 2200);
        }
        function end() {
          stopSprint(); closeBoard();
          const isBest = Lg.recordSprint(core.prog, s); core.prog.scenes[core.exp.scenes[core.cur].id].done[k] = true; core.save(); core.refreshSprites(); core.hud();
          placeInFront(qPanel, 1.35, T.MathUtils.clamp(gazePitch(), -18, 12));
          qPanel.set({ title: st.name + ": finished!", color: COL.edge, onClose: closeAllSprint, blocks: [
            { big: String(s.score) }, { p: isBest ? "🏆 New personal best!" : "Personal best: " + core.prog.sprint.best, size: 32, bold: true, align: "center", color: COL.edge },
            { kv: ["Correct answers", `${s.correct} of ${s.answered}`] }, { kv: ["Best streak", String(s.bestStreak)] }, { kv: ["Attempts so far", String(core.prog.sprint.attempts)] }, { gap: 8 },
            { row: [{ btn: "Close", id: "cl", center: true, onClick: closeAllSprint }, { btn: "Play again", id: "again", primary: true, onClick: play }] }] });
        }
        sprintHook = () => { const sec = Math.ceil(s.timeLeft()); if (sec !== lastSec && q && qPanel.open) { lastSec = sec; if (!busy) panel(); } if (s.timeLeft() <= 0 && !busy) end(); };
        core.frameHooks.push(sprintHook);
        ask();
      }
    }

    function finish(k) {
      closeBoard();
      const res = core.completeStation(k);
      core.refreshSprites(); core.hud();
      if (res.review) { qPanel.hide(); toast(res.message); return; }
      if (!res.sceneDone) { qPanel.hide(); return; }
      const blocks = [{ p: "Your score", size: 30, align: "center", color: COL.soft }, { big: `${res.got} / ${res.tot}` },
        { p: core.publicDemo ? "Demo progress resets when you leave. Copy your score onto your worksheet when you take the headset off." : `Saved${core.CFG.backendUrl ? " for your teacher" : " on this device"}. Copy it onto your worksheet when you take the headset off.`, size: 26, align: "center" }, { gap: 8 }];
      res.rows.forEach(x => blocks.push({ kv: [x.name, `${x.got} / ${x.tot}`, [x.band, Store.BAND_LABEL[x.band]]] }));
      if (res.whole.complete && core.exp.scenes.length > 1) blocks.push({ gap: 6 }, { p: `Lesson complete: ${res.whole.score} / ${res.whole.total}`, size: 30, bold: true, align: "center" });
      const row = [];
      if (res.anyOpen) row.push({ btn: "Review my mistakes", id: "rv", center: true, onClick: () => { qPanel.hide(); core.setReview(true); } });
      if (res.nextIdx >= 0) row.push({ btn: "Go to " + core.exp.scenes[res.nextIdx].title, id: "go", primary: true, onClick: () => { qPanel.hide(); core.loadScene(res.nextIdx); } });
      else row.push({ btn: "Exit VR", id: "exit", primary: true, onClick: exitVR });
      blocks.push({ gap: 8 }, { row });
      qPanel.set({ title: res.sc.title + " complete", color: COL.edge, onClose: () => qPanel.hide(), blocks });
    }

    // ---------------- controllers and hands ----------------
    const raycaster = new T.Raycaster(); const tmp = new T.Matrix4();
    const lineGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -1)]);
    const ctrls = [0, 1].map(i => {
      const c = r.xr.getController(i); scene.add(c);
      const line = new T.Line(lineGeo, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, depthTest: false }));
      line.renderOrder = 40; line.scale.z = 3; c.add(line);
      const dot = new T.Mesh(new T.RingGeometry(.008, .014, 24), new T.MeshBasicMaterial({ color: 0xffd046, depthTest: false, side: T.DoubleSide }));
      dot.renderOrder = 41; dot.visible = false; scene.add(dot);
      c.userData = { line, dot, source: null, hover: null, turnReady: true };
      c.addEventListener("connected", e => { c.userData.source = e.data; line.visible = e.data.targetRayMode !== "gaze"; });
      c.addEventListener("disconnected", () => { c.userData.source = null; dot.visible = false; });
      c.addEventListener("select", () => select(c));
      c.addEventListener("selectstart", () => { const h = c.userData.hover; if (vrBoard && h && h.board) { const xy = boardXY(h.uv); vrBoard.board.down(...xy); c.userData.boardDrag = true; pulse(c, .4, 20); } });
      c.addEventListener("selectend", () => { if (vrBoard && c.userData.boardDrag) { const h = c.userData.hover; const xy = h && h.board ? boardXY(h.uv) : (vrBoard.lastXY || [0, 0]); vrBoard.board.up(...xy); } c.userData.boardDrag = false; });
      return c;
    });
    function targets() {
      /* The Python workspace is modal too: while it is open the only things to
       * point at are its own surfaces, so a stray trigger cannot open a station
       * behind the panels and throw a program away. The hint and the help sit in
       * front of the keys, and win, because they are over the top of them. */
      if (vrCode) return { panels: [padPanel, diagPanel, kbPanel, taskPanel, sidePanel]
        .filter(p => p.open).map(p => p.mesh).concat(menuBtn.open ? [menuBtn.mesh] : []), sprites: [], model: null };
      if (qPanel.open) return { panels: vrBoard ? [qPanel.mesh, vrBoard.mesh] : [qPanel.mesh], sprites: [], model: null };   // questions are modal, like on the web page
      return { panels: [menuPanel, infoPanel, modelPanel, diagPanel, kbPanel, menuBtn].filter(p => p.open).map(p => p.mesh), sprites: core.sprites, model: vrModel };
    }
    const vS = new T.Vector3(), vTo = new T.Vector3();
    function hitFor(c) {
      tmp.identity().extractRotation(c.matrixWorld);
      const ray = raycaster.ray; ray.origin.setFromMatrixPosition(c.matrixWorld); ray.direction.set(0, 0, -1).applyMatrix4(tmp);
      raycaster.far = 100;
      const tg = targets();
      // panels sit in front of the scene, so they win over badges behind them
      const ph = raycaster.intersectObjects(tg.panels, false);
      if (ph.length) return ph[0];
      if (tg.model) { const mhs = raycaster.intersectObjects(tg.model.holder.children, true).filter(x => x.object.userData.part !== undefined); const mh = mhs.find(x => !(x.object.material && x.object.material.transparent)) || mhs[0]; if (mh) return { object: mh.object, distance: mh.distance, point: mh.point, modelPart: mh.object.userData.part }; }
      // badges always face the viewer, so test them by angle rather than as flat sprites
      let best = null;
      tg.sprites.forEach(s => {
        s.getWorldPosition(vS); vTo.copy(vS).sub(ray.origin); const dist = vTo.length();
        const ang = vTo.normalize().angleTo(ray.direction), lim = Math.atan((s.scale.x * .45) / dist);
        if (ang < lim && (!best || s.renderOrder > best.object.renderOrder || (s.renderOrder === best.object.renderOrder && ang < best.ang)))
          best = { object: s, distance: dist, point: vS.clone(), ang };
      });
      return best;
    }
    function select(c) {
      const h = c.userData.hover; if (!h || h.board) return;
      if (h.modelPart !== undefined) { pulse(c, .5, 30); showModelPanel(h.modelPart); return; }
      if (h.panel) { const hit = h.panel.hitAt(h.uv); if (hit && hit.fn) { pulse(c, .5, 30); hit.fn(); } return; }
      const u = h.sprite.userData; pulse(c, .5, 30);
      if (u.type === "info") showInfo(u); else if (u.type === "model") openModelVR(u); else if (u.type === "diagram") openDiagramVR(u); else openStation(u.k);
    }
    function pulse(c, v, ms) { try { const g = c.userData.source && c.userData.source.gamepad; g && g.hapticActuators && g.hapticActuators[0] && g.hapticActuators[0].pulse(v, ms); } catch (e) {} }

    core.frameHooks.push(() => {
      if (!r.xr.isPresenting) return;
      if (!menuBtn.open) drawMenuBtn();
      placeMenuButton(false);
      const hovered = new Map();
      ctrls.forEach(c => {
        const ud = c.userData; if (!ud.source) { ud.dot.visible = false; return; }
        const h = hitFor(c);
        if (h) {
          ud.line.scale.z = h.distance; ud.dot.visible = true; ud.dot.position.copy(h.point); ud.dot.lookAt(raycaster.ray.origin);
          if (h.object.userData.board) { ud.hover = { board: true, uv: h.uv.clone() };
            const now = performance.now(), xy = boardXY(h.uv);
            if (vrBoard && (!vrBoard.lastXY || Math.hypot(xy[0] - vrBoard.lastXY[0], xy[1] - vrBoard.lastXY[1]) > 3) && now - vrBoard.last > 30) { vrBoard.board.move(...xy); vrBoard.lastXY = xy; vrBoard.last = now; }
          }
          else if (h.modelPart !== undefined) { ud.hover = { modelPart: h.modelPart }; }
          else if (h.object.userData.panel) {
            const p = h.object.userData.panel, hit = p.hitAt(h.uv);
            ud.hover = { panel: p, uv: h.uv.clone() }; if (hit) hovered.set(p, hit.id);
          } else ud.hover = { sprite: h.object };
        } else { ud.hover = null; ud.line.scale.z = 3; ud.dot.visible = false; }
        const prev = ud.lastId, now = ud.hover ? (ud.hover.board ? "board" : ud.hover.modelPart !== undefined ? "m" + ud.hover.modelPart : ud.hover.panel ? (ud.hover.panel.hitAt(ud.hover.uv) || {}).id : ud.hover.sprite.uuid) : null;
        if (now && now !== prev) pulse(c, .15, 12); ud.lastId = now;
        // snap turn with the thumbstick
        const gp = ud.source.gamepad;
        if (gp && gp.axes && gp.axes.length >= 4) {
          const x = gp.axes[2];
          if (vrModel) { if (Math.abs(x) > .2) vrModel.b.group.rotation.y += x * .05; }
          else if (Math.abs(x) > .7 && ud.turnReady) { ud.turnReady = false; grp.rotation.y -= Math.sign(x) * Math.PI / 6; }
          if (Math.abs(x) < .3) ud.turnReady = true;
        }
      });
      panels.forEach(p => p.open && p.setHover(hovered.get(p) || null));
      if (vrBoard && vrBoard.board.dirty) { vrBoard.tex.needsUpdate = true; vrBoard.board.dirty = false; }
    });
    core.sceneHooks.push(() => { if (core.inVR) { closeCodeVR(); closeAll(); closeModelVR(); } });
    window.__openVRCode = (k, i) => openCodeVR(k, [i], 0, core.exp.scenes[core.cur].stations[k].tasks[i]);
    // One activity of any kind, opened the way a station would open it.
    window.__openVRTask = (k, i) => run(k, [i], 0);
    window.NVRVR = { get vrBoard() { return vrBoard; }, modelPanel, get vrModel() { return vrModel; }, openModelVR: n => { const sp = core.sprites.filter(x => x.userData.type === "model")[n]; if (sp) openModelVR(sp.userData); }, openDiagramVR: n => { const sp = core.sprites.filter(x => x.userData.type === "diagram")[n]; if (sp) openDiagramVR(sp.userData); }, diagPanel, get vrDiag() { return vrDiag; }, kbPanel, taskPanel, sidePanel, padPanel, SEAT, recentre, showHint, showHelp, get vrCode() { return vrCode; }, typeKey, runCodeVR, checkCodeVR, openCodeVR, atAnchor, setAnchor, clearAnchor, get anchor() { return anchor; }, get COL() { return Object.assign({}, COL); }, qPanel, infoPanel, menuPanel, menuBtn, toastPanel, enter, exitVR, closeAll, closeCodeVR };  // for testing
  }
  if (window.NVRCore) start(window.NVRCore);
  else document.addEventListener("nvr-ready", () => start(window.NVRCore), { once: true });
})();
