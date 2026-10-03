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
      grp.rotation.y = 0; root.visible = false; stopSprint(); closeAll(); closeModelVR(); closeBoard();
      core.mat.map = core.texFor(core.cur); core.mat.needsUpdate = true;
      core.refreshSprites(); core.hud(); core.drawNav();
    }
    const exitVR = () => { if (session) session.end(); };

    // ---------------- canvas panels ----------------
    const COL = { bg: "#1c2c4a", line: "#3c5a87", fg: "#f0f4fa", soft: "#b4c4dc", edge: "#ffd046", ok: "#50dc96", bad: "#ff5f5f", info: "#5ab4ff", btn: "#0e1628" };
    const BAND = { g: COL.ok, a: COL.edge, r: COL.bad, n: "#51607a" };
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
        (s.blocks || []).forEach(b => {
          if (!b) return;
          if (b.p !== undefined) addText(b);
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
    function atAnchor(mesh, dist, pitchOffDeg) {
      const a = setAnchor();
      const pitch = a.pitch + T.MathUtils.degToRad(pitchOffDeg || 0);
      mesh.position.set(a.pos.x + Math.sin(a.yaw) * Math.cos(pitch) * dist,
                        a.pos.y + Math.sin(pitch) * dist,
                        a.pos.z + Math.cos(a.yaw) * Math.cos(pitch) * dist);
      mesh.lookAt(a.pos);
    }
    let menuYaw = null;
    function placeMenuButton(force) {
      const { pos, dir } = headPose(); const yaw = Math.atan2(dir.x, dir.z);
      if (menuYaw === null || force) menuYaw = yaw;
      let d = yaw - menuYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) > .5) menuYaw += d * .08;   // lazily follow the user's gaze
      const pitch = T.MathUtils.degToRad(-42), dist = .75;
      menuBtn.mesh.position.set(pos.x + Math.sin(menuYaw) * Math.cos(pitch) * dist, pos.y + Math.sin(pitch) * dist, pos.z + Math.cos(menuYaw) * Math.cos(pitch) * dist);
      menuBtn.mesh.lookAt(pos);
    }
    function closeAll() { panels.forEach(p => p !== menuBtn && p.hide()); }

    // ---------------- toasts, info, menu ----------------
    let toastT;
    function toast(msg) {
      toastPanel.set({ blocks: [{ p: msg, size: 30, align: "center" }], color: COL.line });
      placeInFront(toastPanel, 1.2, Math.max(-20, Math.min(20, gazePitch())) + 14);
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

    /* ---------------- writing code in the headset ----------------
     * A headset has no keyboard, and the system one is not offered while a page
     * is in immersive VR, so this is one: the program on a panel in front of
     * you, keys underneath, and the trigger to press them. Everything is
     * stacked at the same yaw, like the boards.
     */
    let vrCode = null;
    const kbPanel = new Panel(1.9, 1500);
    panels.push(kbPanel);

    const KEYS = [
      "1234567890".split(""),
      "qwertyuiop".split(""),
      "asdfghjkl:".split(""),
      "zxcvbnm,.'".split(""),
      ["(", ")", "[", "]", "=", "+", "-", "*", "/", "_"],
      ["<", ">", "#", '"', "%", "!", "&", "|", "{", "}"]
    ];

    function openCodeVR(k, list, n, task) {
      closeCodeVR();
      if (!window.R360Py) { toast("The Python editor is not available here."); return; }
      const cv = document.createElement("canvas"); cv.width = 1100; cv.height = 860;
      const cx = cv.getContext("2d");
      const tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
      const mesh = new T.Mesh(new T.PlaneGeometry(1.9, 1.9 * 860 / 1100),
        new T.MeshBasicMaterial({ map: tex, depthTest: false, depthWrite: false }));
      mesh.renderOrder = 19;
      setAnchor(true);
      atAnchor(mesh, 1.85, 12);
      scene.add(mesh);
      vrCode = { task, k, list, n, cv, cx, tex, mesh, text: task.starter || "", caret: (task.starter || "").length,
                 shift: false, out: "", marked: false, busy: true, state: "Starting Python\u2026" };
      vrCode.caret = vrCode.text.length;
      paintCode();
      showKeyboard();
      atAnchor(kbPanel.mesh, 1.55, -27);
      R360Py.ready().then(() => { if (vrCode) { vrCode.busy = false; vrCode.state = ""; showKeyboard(); paintCode(); } });
      toast("Point at a key and pull the trigger to type. Run tries your program; Check marks it.");
    }

    function paintCode() {
      const v = vrCode; if (!v) return;
      const x = v.cx, W = v.cv.width, H = v.cv.height;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = "#0b1322"; x.fillRect(0, 0, W, H);

      // ---- the brief, along the top
      const BRIEF = 240;
      x.fillStyle = "#15223b"; x.fillRect(0, 0, W, BRIEF);
      x.fillStyle = COL.ok; x.fillRect(0, BRIEF - 3, W, 3);
      x.textAlign = "left"; x.textBaseline = "top";
      const wrap = (text, font, max) => {
        x.font = font; const out = []; let line = "";
        String(text).split(" ").forEach(w => {
          const t2 = line ? line + " " + w : w;
          if (x.measureText(t2).width > max && line) { out.push(line); line = w; } else line = t2;
        });
        if (line) out.push(line); return out;
      };
      let by = 18;
      wrap(v.task.q, "700 27px " + FONT, W - 48).forEach(l => { x.fillStyle = COL.fg; x.fillText(l, 24, by); by += 33; });
      by += 4;
      (v.task.brief || []).forEach(b => wrap("\u2022 " + b, "23px " + FONT, W - 56).forEach(l => {
        if (by > BRIEF - 26) return;
        x.fillStyle = COL.soft; x.fillText(l, 28, by); by += 27;
      }));
      /* The worked example, where the question carries one. It is the same help
       * the screen gives, and a pupil in a headset cannot go and look it up. */
      if (v.task.teach && by < BRIEF - 30) {
        const eg = (v.task.teach.code || []).join("    ");
        if (eg) {
          x.fillStyle = COL.info || "#7fb2ff";
          x.font = "22px Consolas, monospace";
          x.fillText("e.g.  " + eg.slice(0, 74), 28, by);
        }
      }

      // ---- the program
      const lines = v.text.split("\n");
      const before = v.text.slice(0, v.caret).split("\n");
      const cl = before.length - 1, cc = before[before.length - 1].length;
      const SZ = 26, LH = 33, PADX = 74, TOP = BRIEF + 16, SHOWN = 11;
      x.font = SZ + "px Consolas, monospace";
      const chw = x.measureText("0").width;
      const first = Math.max(0, Math.min(cl - SHOWN + 3, lines.length - SHOWN));
      for (let i = Math.max(0, first); i < Math.min(lines.length, Math.max(0, first) + SHOWN); i++) {
        const y = TOP + (i - Math.max(0, first)) * LH;
        x.font = (SZ - 5) + "px Consolas, monospace"; x.fillStyle = "#4a5a78";
        x.textAlign = "right"; x.textBaseline = "top"; x.fillText(String(i + 1), PADX - 18, y + 5);
        x.textAlign = "left";
        let px = PADX;
        for (const tok of R360Py.tokens(lines[i])) {
          x.font = SZ + "px Consolas, monospace"; x.fillStyle = tok.c;
          x.fillText(tok.t, px, y); px += x.measureText(tok.t).width;
        }
        if (i === cl) { x.fillStyle = COL.edge; x.fillRect(PADX + cc * chw, y - 2, 3, SZ + 8); }
      }

      // ---- the console and the marking line
      const CON = H - 210;
      x.fillStyle = "#0a1120"; x.fillRect(0, CON, W, H - CON);
      x.fillStyle = "#24364f"; x.fillRect(0, CON, W, 2);
      x.font = "21px Consolas, monospace"; x.textAlign = "left"; x.textBaseline = "top";
      (v.out || "Press Run to try your program.").split("\n").slice(-4).forEach((l, i) => {
        x.fillStyle = v.err ? "#ff9a9a" : "#b4c4dc";
        x.fillText(l.slice(0, 92), 24, CON + 16 + i * 26);
      });
      if (v.state) { x.font = "700 24px " + FONT; x.fillStyle = COL.edge; x.fillText(v.state, 24, H - 92); }
      if (v.result) {
        x.fillStyle = v.resultOk ? COL.ok : COL.bad;
        wrap(v.result, "700 23px " + FONT, W - 48).slice(0, 3).forEach((l, i) => x.fillText(l, 24, H - 92 + i * 27));
      }
      v.tex.needsUpdate = true;
    }

    function typeKey(key) {
      const v = vrCode; if (!v || v.busy) return;
      const ins = (t) => { v.text = v.text.slice(0, v.caret) + t + v.text.slice(v.caret); v.caret += t.length; };
      if (key === "\u2190") v.caret = Math.max(0, v.caret - 1);
      else if (key === "\u2192") v.caret = Math.min(v.text.length, v.caret + 1);
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

    function showKeyboard() {
      const v = vrCode; if (!v) return;
      const row = keys => ({ row: keys.map(ch => ({
        btn: ch === " " ? "Space" : (v.shift && /[a-z]/.test(ch) ? ch.toUpperCase() : ch),
        id: "key" + ch, center: true, size: 26, onClick: () => typeKey(ch) })) });
      kbPanel.set({ color: COL.line, scale: .8, blocks: [
        row(KEYS[0]), row(KEYS[1]), row(KEYS[2]), row(KEYS[3]), row(KEYS[4]), row(KEYS[5]),
        { row: [
          { btn: v.shift ? "SHIFT on" : "Shift", id: "kshift", center: true, size: 24, state: v.shift ? "on" : "", onClick: () => typeKey("Shift") },
          { btn: "Space", id: "kspace", center: true, size: 24, onClick: () => typeKey("Space") },
          { btn: "Tab", id: "ktab", center: true, size: 24, onClick: () => typeKey("Tab") },
          { btn: "\u2190", id: "kleft", center: true, size: 24, onClick: () => typeKey("\u2190") },
          { btn: "\u2192", id: "kright", center: true, size: 24, onClick: () => typeKey("\u2192") },
          { btn: "Back", id: "kback", center: true, size: 24, onClick: () => typeKey("Back") },
          { btn: "Enter", id: "kenter", center: true, size: 24, onClick: () => typeKey("Enter") }
        ] },
        { row: [
          { btn: v.busy ? "\u2026" : "\u25b6 Run", id: "crun", center: true, size: 26, onClick: runCodeVR },
          // A Try it has nothing to mark: running it is the activity.
          ...(v.task.kind === "try" ? [] :
            [{ btn: v.busy ? "\u2026" : "Check my answer", id: "ccheck", center: true, size: 26, onClick: checkCodeVR }]),
          ...(v.task.hint ? [{ btn: "Hint", id: "chint", center: true, size: 26, onClick: hintCodeVR }] : []),
          { btn: "Close", id: "cclose", center: true, size: 26, onClick: closeCodeVR }
        ] }] });
    }

    async function runCodeVR() {
      const v = vrCode; if (!v || v.busy) return;
      v.busy = true; v.state = "Running\u2026"; showKeyboard(); paintCode();
      const first = (v.task.tests || [])[0] || { in: v.task.in || [] };
      const r = await R360Py.run(v.text, { stdin: (first.in || []).slice(), files: first.files || {}, echo: true, timeoutMs: 6000 });
      if (!vrCode) return;
      v.err = !!r.error;
      v.out = (r.stdout || "") + (r.error ? "\n" + r.error : "");
      if (!v.out.trim()) v.out = "Your program ran but displayed nothing.";
      // On a Try it the run is the activity, so a clean one finishes it.
      if (v.task.kind === "try" && !r.error && !v.best) {
        v.best = core.marks(v.task);
        core.awardBest(v.k, v.list[v.n], v.best);
        v.resultOk = true;
        v.result = "✓ Nice work. " + (v.task.fb || "");
      }
      v.busy = false; v.state = ""; showKeyboard(); paintCode(); paintCode();
    }

    /* The hint in the headset is the same diagram the screen shows, opened the
     * way any diagram opens in here. The code panel stays where it is behind
     * it, so closing the diagram puts the pupil back in front of their
     * program with every character still there. */
    /* The hint is a ladder on screen, and it is one in here too: each press of
     * the Hint key gives the next rung, said in the console line where there is
     * room to read it, and the animated diagram - where the question has one -
     * is the last rung, opened the way any diagram opens in here. The code panel
     * stays behind it, so closing the diagram puts the pupil back in front of
     * their program with every character still there. */
    function hintCodeVR() {
      const v = vrCode; if (!v || !v.task.hint) return;
      const h = typeof v.task.hint === "string" ? { diagram: v.task.hint } : v.task.hint;
      const flat = x => (Array.isArray(x) ? x.join("  ") : x);
      const rungs = [];
      if (h.think) rungs.push("Think: " + h.think);
      if (h.syntax) rungs.push("The Python you need: " + flat(h.syntax));
      if (h.start) rungs.push("How it starts: " + flat(h.start));
      if (h.walk) rungs.push("Work it through: " + flat(h.walk));
      const dia = h.diagram && window.R360Diagrams && R360Diagrams.kinds.includes(h.diagram) ? h.diagram : null;
      v.hintStep = v.hintStep || 0;
      if (v.hintStep < rungs.length) {
        v.resultOk = false;
        v.result = "Hint " + (v.hintStep + 1) + " of " + (rungs.length + (dia ? 1 : 0)) + ".  " + rungs[v.hintStep];
        v.hintStep++;
        showKeyboard(); paintCode();
        return;
      }
      if (!dia) return;
      openDiagramVR({ id: "hint:" + dia, dg: { diagram: dia, title: "Hint: how this technique works" } });
    }

    async function checkCodeVR() {
      const v = vrCode; if (!v || v.busy) return;
      const tests = v.task.tests || []; if (!tests.length) return;
      const broke = (v.task.forbid || []).find(f => v.text.indexOf(f[0]) >= 0);
      if (broke) { v.result = broke[1]; v.resultOk = false; showKeyboard(); paintCode(); return; }
      // The other half of that rule - see the same check in js/player.js.
      const absent = (v.task.require || []).find(f => v.text.indexOf(f[0]) < 0);
      if (absent) { v.result = absent[1]; v.resultOk = false; showKeyboard(); paintCode(); return; }
      v.busy = true; v.state = "Marking\u2026"; showKeyboard(); paintCode();
      let passed = 0, firstFail = null;
      for (const t of tests) {
        const r = await R360Py.run(v.text, { stdin: (t.in || []).slice(), files: t.files || {}, echo: false, timeoutMs: 6000 });
        if (!vrCode) return;
        const want = (t.out || []).join("\n");
        const ok = !r.error && core.sameOutput(r.stdout, want);
        if (ok) passed++;
        else if (!firstFail) firstFail = (t.in && t.in.length ? "With " + t.in.join(", ") + " it should print " + want + ". " : "It should print " + want + ". ")
          + (r.error ? r.error.split("\n")[0] : "Yours printed " + (r.stdout.trim() || "nothing") + ".");
      }
      const max = core.marks(v.task), got = Math.round(max * passed / tests.length);
      // Same rule as on screen: keep trying, keep the best mark reached.
      v.attempts = (v.attempts || 0) + 1;
      v.best = Math.max(v.best || 0, got);
      core.awardBest(v.k, v.list[v.n], v.best);
      v.busy = false; v.state = "";
      v.resultOk = passed === tests.length;
      v.result = passed + " of " + tests.length + " tests passed - best so far " + v.best + " of " + max + " marks."
        + (firstFail ? "  " + firstFail : "")
        + (!v.resultOk && v.attempts >= 2 && v.task.hint ? "  Press Hint: it gives you one step at a time." : "");
      showKeyboard(); paintCode();
    }

    function closeCodeVR() {
      if (!vrCode) return;
      scene.remove(vrCode.mesh); vrCode.tex.dispose(); vrCode = null;
      kbPanel.hide(); clearAnchor();
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
      const top = () => [...head, img ? { img } : null, { p: task.q, size: 34, bold: true }, { gap: 6 }];
      const close = () => { qPanel.hide(); closeBoard(); clearAnchor(); core.refreshSprites(); core.hud(); };
      let fb = null, done = false;
      const fbBlocks = () => fb ? [{ gap: 4 }, { p: fb.head, size: 32, bold: true, color: fb.ok ? COL.ok : COL.bad }, { p: fb.text, size: 28 },
        /* The way on appears only when the activity is finished. Short of that
          * the pupil goes round again - see the same rule in js/player.js. */
          (!core.gated || !core.gated() || core.reviewMode || core.isComplete(k, i)
            ? { btn: n === list.length - 1 ? "Finish" : "Next question", id: "next", primary: true,
                onClick: () => n === list.length - 1 ? finish(k) : run(k, list, n + 1) }
            : { btn: "Try this one again", id: "again", primary: true, onClick: () => run(k, list, n) })] : [];
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
        const prog = [{ p: "The program", size: 24, color: COL.edge },
                      { p: task.code.join("\n"), size: 26, mono: true },
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
    core.sceneHooks.push(() => { if (core.inVR) { closeAll(); closeModelVR(); } });
    window.__openVRCode = (k, i) => openCodeVR(k, [i], 0, core.exp.scenes[core.cur].stations[k].tasks[i]);
    // One activity of any kind, opened the way a station would open it.
    window.__openVRTask = (k, i) => run(k, [i], 0);
    window.NVRVR = { get vrBoard() { return vrBoard; }, modelPanel, get vrModel() { return vrModel; }, openModelVR: n => { const sp = core.sprites.filter(x => x.userData.type === "model")[n]; if (sp) openModelVR(sp.userData); }, openDiagramVR: n => { const sp = core.sprites.filter(x => x.userData.type === "diagram")[n]; if (sp) openDiagramVR(sp.userData); }, diagPanel, get vrDiag() { return vrDiag; }, kbPanel, get vrCode() { return vrCode; }, typeKey, runCodeVR, checkCodeVR, openCodeVR, atAnchor, setAnchor, clearAnchor, get anchor() { return anchor; }, qPanel, infoPanel, menuPanel, menuBtn, toastPanel, enter, exitVR, closeAll, closeCodeVR };  // for testing
  }
  if (window.NVRCore) start(window.NVRCore);
  else document.addEventListener("nvr-ready", () => start(window.NVRCore), { once: true });
})();
