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
      grp.rotation.y = 0; root.visible = false; closeAll(); closeModelVR();
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
          const size = (b.size || 32) * scale, font = `${b.bold ? "700 " : ""}${size}px ${FONT}`;
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

    const qPanel = new Panel(1.1), infoPanel = new Panel(.8, 1000), menuPanel = new Panel(.8, 1000), toastPanel = new Panel(.7, 1000), menuBtn = new Panel(.2, 360);
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
      if (!lit) { R360Models.lights(scene); lit = true; }
      core.markInfo(u.id);
      const b = R360Models.build(u.md.model); const holder = new T.Group(); holder.add(b.group);
      const { pos, dir } = headPose(); const yaw = Math.atan2(dir.x, dir.z);
      holder.position.set(pos.x + Math.sin(yaw) * 1.1, pos.y - .15, pos.z + Math.cos(yaw) * 1.1);
      holder.scale.setScalar(.12 * b.scale / .7); b.group.rotation.x = .35; scene.add(holder);
      vrModel = { b, holder, sel: -1, u };
      showModelPanel(-1);
      modelPanel.mesh.position.set(pos.x + Math.sin(yaw - .62) * 1.15, pos.y - .05, pos.z + Math.cos(yaw - .62) * 1.15); modelPanel.mesh.lookAt(pos);
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
    function closeModelVR() { if (!vrModel) return; scene.remove(vrModel.holder); vrModel = null; modelPanel.hide(); core.refreshSprites(); }

    // ---------------- questions ----------------
    function openStation(k) {
      const list = core.taskList(k); if (!list) return;
      infoPanel.hide(); menuPanel.hide();
      placeInFront(qPanel, 1.35, T.MathUtils.clamp(gazePitch(), -18, 12));
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
      const close = () => { qPanel.hide(); core.refreshSprites(); core.hud(); };
      let fb = null, done = false;
      const fbBlocks = () => fb ? [{ gap: 4 }, { p: fb.head, size: 32, bold: true, color: fb.ok ? COL.ok : COL.bad }, { p: fb.text, size: 28 },
        { btn: n === list.length - 1 ? "Finish" : "Next question", id: "next", primary: true, onClick: () => n === list.length - 1 ? finish(k) : run(k, list, n + 1) }] : [];
      const setFb = (ok, partial, text) => { fb = { ok, head: ok ? "Correct!" : partial || "Not quite.", text }; };
      const show = body => qPanel.set({ title, color: st.col, onClose: close, blocks: [...top(), ...body(), ...fbBlocks()] });

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
    function finish(k) {
      const res = core.completeStation(k);
      core.refreshSprites(); core.hud();
      if (res.review) { qPanel.hide(); toast(res.message); return; }
      if (!res.sceneDone) { qPanel.hide(); return; }
      const blocks = [{ p: "Your score", size: 30, align: "center", color: COL.soft }, { big: `${res.got} / ${res.tot}` },
        { p: `Saved${core.CFG.backendUrl ? " for your teacher" : " on this device"}. Copy it onto your worksheet when you take the headset off.`, size: 26, align: "center" }, { gap: 8 }];
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
      return c;
    });
    function targets() {
      if (qPanel.open) return { panels: [qPanel.mesh], sprites: [], model: null };   // questions are modal, like on the web page
      return { panels: [menuPanel, infoPanel, modelPanel, menuBtn].filter(p => p.open).map(p => p.mesh), sprites: core.sprites, model: vrModel };
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
      const h = c.userData.hover; if (!h) return;
      if (h.modelPart !== undefined) { pulse(c, .5, 30); showModelPanel(h.modelPart); return; }
      if (h.panel) { const hit = h.panel.hitAt(h.uv); if (hit && hit.fn) { pulse(c, .5, 30); hit.fn(); } return; }
      const u = h.sprite.userData; pulse(c, .5, 30);
      if (u.type === "info") showInfo(u); else if (u.type === "model") openModelVR(u); else openStation(u.k);
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
          if (h.modelPart !== undefined) { ud.hover = { modelPart: h.modelPart }; }
          else if (h.object.userData.panel) {
            const p = h.object.userData.panel, hit = p.hitAt(h.uv);
            ud.hover = { panel: p, uv: h.uv.clone() }; if (hit) hovered.set(p, hit.id);
          } else ud.hover = { sprite: h.object };
        } else { ud.hover = null; ud.line.scale.z = 3; ud.dot.visible = false; }
        const prev = ud.lastId, now = ud.hover ? (ud.hover.modelPart !== undefined ? "m" + ud.hover.modelPart : ud.hover.panel ? (ud.hover.panel.hitAt(ud.hover.uv) || {}).id : ud.hover.sprite.uuid) : null;
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
    });
    core.sceneHooks.push(() => { if (core.inVR) { closeAll(); closeModelVR(); } });
    window.NVRVR = { modelPanel, get vrModel() { return vrModel; }, openModelVR: n => { const sp = core.sprites.filter(x => x.userData.type === "model")[n]; if (sp) openModelVR(sp.userData); }, qPanel, infoPanel, menuPanel, menuBtn, toastPanel, enter, exitVR };  // for testing
  }
  if (window.NVRCore) start(window.NVRCore);
  else document.addEventListener("nvr-ready", () => start(window.NVRCore), { once: true });
})();
