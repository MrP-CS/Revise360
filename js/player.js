// Generic 360 experience player. Everything it shows comes from
// experiences/<id>.json, so new lessons need no code changes.
(async function () {
  // Experiences are for signed-in students. No navigation chrome in here: the ⌂ Home
  // button in the toolbar is the way out.
  const R360PlayerGate = (() => {
    const who = window.Store && Store.student && Store.student();
    if (!who) {
      const back = encodeURIComponent(location.pathname.split("/").pop() + location.search);
      location.replace("topics.html?next=" + back + "#signin");
      return false;
    }
    return true;
  })();
  if (!R360PlayerGate) return;
  const CFG = window.APP_CONFIG;
  const params = new URLSearchParams(location.search);
  let expId = params.get("id");
  const student = Store.student();
  if (!student) { location.href = "index.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search); return; }
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const asset = p => /^(data:|blob:|https?:)/.test(p) ? p : "experiences/" + p;
  const marks = t => (t.t === "mcq" || t.t === "multi" || t.t === "circuit" || t.t === "expr" || t.t === "convert" || t.t === "addshift" || t.t === "pixels" || t.t === "sound" || t.t === "memory" || t.t === "permissions" || t.t === "defrag") ? 1 : t.t === "table" ? (1 << (t.inputs ? t.inputs.length : new Set((t.expr || "").replace(/AND|OR|NOT/g, "").match(/[A-Z]/g) || []).size)) : (t.t === "sprint" || t.t === "defence" || t.t === "blitz") ? 0 : t.t === "order" ? t.steps.length : t.t === "sort" ? t.items.length : t.pairs.length;

  let exp;
  try { exp = await (await fetch("experiences/" + encodeURIComponent(expId) + ".json", { cache: "no-cache" })).json(); }
  catch (e) { document.body.innerHTML = '<div class="page"><div class="card"><h1>Experience not found</h1><p><a href="index.html">Back to home</a></p></div></div>'; return; }
  document.title = exp.title + " | " + CFG.siteTitle;

  // ---------- progress ----------
  const prog = Store.get(expId) || { v: 1, scenes: {}, review: {}, info: [] };
  prog.review = prog.review || {}; prog.info = prog.info || [];
  exp.scenes.forEach(sc => { prog.scenes[sc.id] = prog.scenes[sc.id] || { ans: {}, done: {} }; });
  function save() {
    const s = Store.summarise(exp, prog);
    prog.summary = { score: s.score, total: s.total, done: s.done, count: s.count, info: s.infoSeen, infoTotal: s.infoTotal };
    Store.put(expId, prog);
  }
  const statusText = { local: "Saved on this device", idle: "Saved", saved: "Saved ✓", pending: "Saving…", syncing: "Saving…", offline: "Offline: saved on this device, will sync later" };
  let syncState = "local";
  Store.onStatus(s => { syncState = s; const el = $("#sync"); if (el) el.textContent = statusText[s] || ""; });
  Store.flushQueue();
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && CFG.backendUrl) Store.push(expId, true); });

  // ---------- three.js scene ----------
  const el = $("#v");
  const r = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(r.domElement);
  r.xr.enabled = true; r.xr.setReferenceSpaceType("local");
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(85, 1, .1, 100);
  // Everything in the 360 world lives in one group, so VR can rotate it (snap turn, starting direction)
  const grp = new THREE.Group(); scene.add(grp);
  const geo = new THREE.SphereGeometry(50, 96, 64); geo.scale(-1, 1, 1);
  const mat = new THREE.MeshBasicMaterial(); grp.add(new THREE.Mesh(geo, mat));
  const loader = new THREE.TextureLoader(); const texs = {};
  // Headsets get the high-resolution image (if the experience has one) for sharper text
  function texFor(i) {
    const sc = exp.scenes[i], hi = core.inVR && sc.imgHi, key = i + (hi ? "hi" : "");
    if (!texs[key]) {
      texs[key] = loader.load(asset(hi ? sc.imgHi : sc.img), () => { if (cur === i) { mat.map = texs[key]; mat.needsUpdate = true; } });
      texs[key].minFilter = THREE.LinearFilter; texs[key].generateMipmaps = false;
      if (hi && texs[i]) return texs[i];  // show the normal image until the sharp one arrives
    }
    return texs[key];
  }
  const core = { inVR: false, frameHooks: [], toastHook: null };
  let cur = 0, lon = 0, lat = 0, pd = 0, t = 0, reviewMode = params.get("review") === "1";
  let sprites = [];

  // Positions: either pos [right, up, front] on a unit cube, or {face, x, y}
  // in pixels on that wall's 2048×2048 artwork (easier for authoring).
  function cubeFrom(o) {
    if (Array.isArray(o.pos)) return o.pos;
    const u = o.x / 2048, v = o.y / 2048;
    switch (o.face) {
      case "front": return [2 * u - 1, 1 - 2 * v, 1];
      case "right": return [1, 1 - 2 * v, 1 - 2 * u];
      case "back": return [1 - 2 * u, 1 - 2 * v, -1];
      case "left": return [-1, 1 - 2 * v, 2 * u - 1];
      case "up": return [2 * u - 1, 1, 2 * v - 1];
      default: return [2 * u - 1, -1, 1 - 2 * v];
    }
  }
  const world = p => new THREE.Vector3(-p[2], p[1], -p[0]).normalize().multiplyScalar(38);
  function lookAtVec(v) { const n = v.clone().normalize(); lat = THREE.MathUtils.radToDeg(Math.asin(n.y)); lon = THREE.MathUtils.radToDeg(Math.atan2(-n.z, -n.x)); }

  function stationState(sc, k) {
    const st = sc.stations[k], sp = prog.scenes[sc.id];
    let got = 0, tot = 0, open = 0;
    st.tasks.forEach((tk, i) => { const m = marks(tk); tot += m; const a = (sp.ans || {})[k + "-" + i]; if (a !== undefined) { got += a; if (a < m && !prog.review[sc.id + ":" + k + "-" + i]) open++; } });
    return { done: !!sp.done[k], got, tot, band: Store.band(got, tot), open };
  }
  function badgeTex(label, col, mode) {
    const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
    const colours = { g: "#50dc96", a: "#ffd046", r: "#ff5f5f" };
    const f = mode.band ? colours[mode.band] : col;
    x.globalAlpha = mode.dim ? .35 : 1;
    x.beginPath(); x.arc(256, 256, 220, 0, Math.PI * 2); x.fillStyle = "rgba(10,16,30,.9)"; x.fill();
    x.lineWidth = 26; x.strokeStyle = f; x.stroke(); x.fillStyle = f; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = "bold 170px Segoe UI, sans-serif"; x.fillText(mode.band === "g" ? "✓" : mode.band ? "!" : label, 256, 225);
    x.font = "bold 58px Segoe UI, sans-serif"; x.fillStyle = "#f0f4fa";
    x.fillText(mode.caption, 256, 370);
    return new THREE.CanvasTexture(c);
  }
  function infoTex(seen) {
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.fillStyle = seen ? "rgba(40,50,70,.92)" : "rgba(20,60,110,.95)"; x.fill();
    x.lineWidth = 14; x.strokeStyle = seen ? "#8a98b0" : "#5ab4ff"; x.stroke();
    x.fillStyle = seen ? "#b4c4dc" : "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "italic bold 150px Georgia, serif"; x.fillText("i", 128, 136);
    return new THREE.CanvasTexture(c);
  }
  function modelTex(seen) {
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.fillStyle = seen ? "rgba(40,50,70,.92)" : "rgba(90,50,10,.95)"; x.fill();
    x.lineWidth = 14; x.strokeStyle = seen ? "#8a98b0" : "#ffa028"; x.stroke();
    x.fillStyle = seen ? "#b4c4dc" : "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "bold 92px Segoe UI, sans-serif"; x.fillText("3D", 128, 134);
    return new THREE.CanvasTexture(c);
  }
  function refreshSprites() {
    const sc = exp.scenes[cur];
    sprites.forEach(s => {
      const u = s.userData;
      if (u.type === "info") { s.material.map = infoTex(prog.info.includes(u.id)); }
      else if (u.type === "model") { s.material.map = modelTex(prog.info.includes(u.id)); }
      else {
        const st = stationState(sc, u.k), def = sc.stations[u.k];
        let mode;
        if (!st.done) mode = { caption: "Answer" };
        else mode = { band: st.band, caption: st.band === "g" ? "Secure" : st.band === "a" ? "Revise" : "Focus" };
        if (reviewMode) { if (!st.done) mode.dim = true; else if (st.open === 0) mode = { band: "g", caption: st.band === "g" ? "Secure" : "Reviewed", dim: true }; else mode.caption = "Review"; }
        s.material.map = badgeTex(def.label, def.col, mode);
      }
      s.material.needsUpdate = true;
    });
  }
  function loadScene(i) {
    cur = i; const sc = exp.scenes[i];
    sprites.forEach(s => grp.remove(s)); sprites = [];
    mat.map = texFor(i); mat.needsUpdate = true; lon = 0; lat = 0; cam.fov = 85; cam.updateProjectionMatrix();
    sc.stations.forEach((st, k) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
      s.position.copy(world(cubeFrom(st))); s.scale.set(5.2, 5.2, 1); s.userData = { type: "st", k }; s.renderOrder = 2; grp.add(s); sprites.push(s);
    });
    (sc.info || []).forEach(inf => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
      s.position.copy(world(cubeFrom(inf))); s.scale.set(2.6, 2.6, 1); s.userData = { type: "info", id: sc.id + ":" + inf.id, inf }; s.renderOrder = 1; grp.add(s); sprites.push(s);
    });
    (sc.models || []).forEach(md => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
      s.position.copy(world(cubeFrom(md))); s.scale.set(3.4, 3.4, 1); s.userData = { type: "model", id: sc.id + ":3d:" + md.id, md }; s.renderOrder = 1; grp.add(s); sprites.push(s);
    });
    closeDrawer(); refreshSprites(); drawNav(); hud();
    (core.sceneHooks || []).forEach(f => f(i));
  }
  function drawNav() {
    const n = $("#nav"); n.innerHTML = "";
    if (exp.scenes.length < 2) { n.parentElement.style.display = "none"; return; }
    exp.scenes.forEach((sc, i) => {
      const b = document.createElement("button"); const fin = sc.stations.every((_, k) => prog.scenes[sc.id].done[k]);
      b.innerHTML = (fin ? '<span class="tick">✓</span> ' : "") + esc(sc.title); b.setAttribute("aria-pressed", i === cur); b.onclick = () => loadScene(i); n.appendChild(b);
    });
  }
  function hud() {
    const sc = exp.scenes[cur], s = Store.summarise(exp, prog);
    let got = 0, tot = 0, d = 0; sc.stations.forEach((_, k) => { const st = stationState(sc, k); got += st.got; tot += st.tot; if (st.done) d++; });
    const infoN = (sc.info || []).length, infoSeen = (sc.info || []).filter(f => prog.info.includes(sc.id + ":" + f.id)).length;
    $("#hud").innerHTML = `${esc(student.name)} · ${esc(student.cls)}<br>${esc(sc.title)}: <b>${got}</b> / ${tot}<br>${d} of ${sc.stations.length} stations${infoN ? ` · ${infoSeen}/${infoN} facts found` : ""}` +
      (exp.scenes.length > 1 ? `<br>Lesson total ${s.score} / ${s.total}` : "") + `<br><span id="sync" class="sync"></span>`;
    $("#sync").textContent = statusText[syncState] || "";
  }

  function size() { r.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  addEventListener("resize", size); size();
  const pts = new Map(); let downAt = null; const ray = new THREE.Raycaster();
  const ndc = e => new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  el.addEventListener("pointerdown", e => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); downAt = [e.clientX, e.clientY]; });
  el.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) { ray.setFromCamera(ndc(e), cam); el.style.cursor = ray.intersectObjects(sprites).length ? "pointer" : "grab"; return; }
    const [ox, oy] = pts.get(e.pointerId);
    if (pts.size === 1) { lon -= (e.clientX - ox) * .15 * cam.fov / 85; lat += (e.clientY - oy) * .15 * cam.fov / 85; }
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const a = [...pts.values()]; const d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (pd) zoom((pd - d) * .1); pd = d; }
  });
  el.addEventListener("pointerup", e => { pts.delete(e.pointerId); pd = 0; if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 8) pick(e); downAt = null; });
  el.addEventListener("pointercancel", e => { pts.delete(e.pointerId); pd = 0; downAt = null; });
  function zoom(d) { cam.fov = Math.min(100, Math.max(35, cam.fov + d)); cam.updateProjectionMatrix(); }
  el.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY * .03); }, { passive: false });
  addEventListener("keydown", e => {
    if ($("#modal").classList.contains("open")) { if (e.key === "Escape") closeModal(); return; }
    if (e.key === "Escape") closeDrawer();
    const step = 8; if (e.target !== document.body) return;
    if (e.key === "ArrowLeft") lon -= step; if (e.key === "ArrowRight") lon += step; if (e.key === "ArrowUp") lat += step; if (e.key === "ArrowDown") lat -= step;
  });
  function pick(e) {
    ray.setFromCamera(ndc(e), cam); const h = ray.intersectObjects(sprites).sort((a, b) => b.object.renderOrder - a.object.renderOrder)[0]; if (!h) return;
    const u = h.object.userData; if (u.type === "info") showInfo(u); else if (u.type === "model") openModel(u); else openStation(u.k);
  }
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let lastT = performance.now();
  r.setAnimationLoop((now, frame) => {
    const dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    t += .03; lat = Math.max(-89, Math.min(89, lat));
    if (!r.xr.isPresenting) {
      const a = THREE.MathUtils.degToRad(lon), b = THREE.MathUtils.degToRad(lat);
      cam.lookAt(-Math.cos(a) * Math.cos(b), Math.sin(b), -Math.sin(a) * Math.cos(b));
    }
    const k = still.matches ? 0 : .35 * Math.sin(t); const sc = exp.scenes[cur];
    sprites.forEach(s => { if (s.userData.type === "st") { const st = stationState(sc, s.userData.k); s.scale.setScalar(st.done && !(reviewMode && st.open) ? 4.6 : 5.2 + k); } });
    core.frameHooks.forEach(f => f(dt, frame));
    r.render(scene, cam);
  });

  // ---------- drawers (non-modal: the scene keeps working behind them) ----------
  const drawer = $("#drawer");
  function openDrawer(html, cls) { drawer.className = "drawer open " + (cls || ""); drawer.innerHTML = '<button class="x" aria-label="Close panel">×</button>' + html; drawer.querySelector(".x").onclick = closeDrawer; }
  function closeDrawer() { drawer.className = "drawer"; drawer.innerHTML = ""; }
  function markInfo(id) { if (!prog.info.includes(id)) { prog.info.push(id); save(); refreshSprites(); hud(); } }
  function showInfo(u) {
    markInfo(u.id);
    const sc = exp.scenes[cur], n = (sc.info || []).length, seen = (sc.info || []).filter(f => prog.info.includes(sc.id + ":" + f.id)).length;
    openDrawer(`<h2>${esc(u.inf.title)}</h2><p>${esc(u.inf.text)}</p><p class="count">Fact ${seen} of ${n} found in this scene. Keep looking for blue <b>i</b> markers.</p>`);
  }
  function showProgress() {
    const s = Store.summarise(exp, prog);
    const rows = s.stations.map(st => {
      const open = st.wrongTasks - st.fixed;
      const lab = st.done ? Store.BAND_LABEL[st.band] : "Not started";
      const act = st.done && open > 0 ? `<button class="btn small" data-go="${esc(st.scene)}:${st.k}">Review</button>` : !st.done ? `<button class="btn small ghost" data-go="${esc(st.scene)}:${st.k}">Go</button>` : "";
      return `<tr><td>${exp.scenes.length > 1 ? `<span class="muted">${esc(st.sceneTitle)}</span><br>` : ""}${esc(st.name)}</td><td>${st.done ? `${st.got}/${st.tot} ` : ""}<span class="rag ${st.band}">${lab}</span>${st.fixed ? `<br><span class="muted">${st.fixed} reviewed</span>` : ""}</td><td>${act}</td></tr>`;
    }).join("");
    openDrawer(`<h2>My progress</h2><p><b>${s.score} / ${s.total}</b> · ${s.done} of ${s.count} stations done${s.infoTotal ? ` · ${s.infoSeen}/${s.infoTotal} facts found` : ""}</p>
      <table class="bd">${rows}</table><p class="count">Your first answer is your score. Review mode lets you retry the questions you got wrong, so you can check you've fixed them.</p>`, "progress");
    drawer.querySelectorAll("[data-go]").forEach(b => b.onclick = () => goTo(b.dataset.go, b.textContent === "Review"));
  }
  function goTo(ref, review) {
    const [sid, k] = ref.split(":"); const i = exp.scenes.findIndex(s => s.id === sid); if (i < 0) return;
    if (review && !reviewMode) setReview(true);
    if (i !== cur) loadScene(i);
    const sc = exp.scenes[i]; lookAtVec(world(cubeFrom(sc.stations[+k])));
    closeDrawer(); if (review) openStation(+k);
  }
  function setReview(on) {
    reviewMode = on; $("#reviewBtn").setAttribute("aria-pressed", on);
    toast(on ? "Review mode: stations marked Review or Focus let you retry the questions you got wrong." : "Review mode off.");
    refreshSprites();
  }
  let toastT; function toast(msg) { if (core.inVR && core.toastHook) return core.toastHook(msg); const tEl = $("#toast"); tEl.textContent = msg; tEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => tEl.hidden = true, 5000); }

  // ---------- question modal ----------
  const modal = $("#modal"), box = $("#box"); let lastFocus = null;
  const BOARD_TASKS = ["circuit", "expr", "table", "convert", "addshift", "pixels", "sound", "memory", "permissions", "defrag"];
  // Boards draw to a canvas; map mouse and touch events onto it
  function mountBoard(host, board) {
    const cv = board.canvas; cv.style.cssText = "width:100%;display:block;border-radius:12px;touch-action:none;cursor:pointer"; host.appendChild(cv);
    const xy = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); board.down(...xy(e)); e.preventDefault(); });
    cv.addEventListener("pointermove", e => board.move(...xy(e)));
    cv.addEventListener("pointerup", e => board.up(...xy(e)));
    cv.addEventListener("pointerleave", () => board.leave && board.leave());
  }
  function shell(title, col, inner) {
    box.style.setProperty("--c", col);
    if (!/class="lboard"/.test(inner)) box.classList.remove("wide");
    box.innerHTML = `<div class="head"><span id="mt">${esc(title)}</span><button aria-label="Close" id="x">×</button></div><div class="mbody">${inner}</div>`;
    $("#x").onclick = closeModal; box.scrollTop = 0;
  }
  // ---------------- Logic sprint (laptop) ----------------
  let sprintTimer = null;
  function runSprint(k, st, task) {
    const Lg = window.R360Logic, rec = prog.sprint || { best: 0, attempts: 0 };
    box.classList.add("wide");
    shell(st.name, st.col, `<p class="q">${task.t === "blitz" ? "How fast are your conversions?" : "How fast is your logic?"}</p>
      <p>You have <b>${task.duration || 120} seconds</b>. ${task.t === "blitz" ? "Each question asks you to convert a number between denary, binary and hexadecimal." : "Each question asks you to either build a circuit or write the expression for a diagram."} Questions get harder as you go.</p>
      <p>Each correct answer scores 100 points, plus a speed bonus of up to 60. Get several right in a row for a streak multiplier of up to ×3. A wrong answer resets your streak. Skip a question if you're stuck.</p>
      <p>Your personal best: <b style="color:var(--edge)">${rec.best}</b>${rec.attempts ? ` from ${rec.attempts} ${rec.attempts === 1 ? "try" : "tries"}` : ""}. Beat it!</p>
      <div class="mrow" id="mrow"><button class="btn" id="go">Start the sprint</button></div>`);
    $("#go").onclick = () => play();
    function play() {
      const s = Lg.Sprint(task.duration || 120, task.t === "blitz" ? R360Data.blitz : null); let board = null, busy = false;
      const hud = () => { const t = $("#spT"); if (!t) return; t.textContent = Math.ceil(s.timeLeft()) + "s"; $("#spS").textContent = s.score; $("#spK").textContent = s.streak > 1 ? "×" + (1 + Math.min(s.streak - 1, 4) * .5) : "–"; };
      clearInterval(sprintTimer); sprintTimer = setInterval(() => { hud(); if (s.timeLeft() <= 0 && !busy) end(); }, 250);
      function ask() {
        if (s.timeLeft() <= 0) return end();
        const q = s.next(); busy = false;
        shell(st.name, st.col, `<div class="sprinthud"><span>⏱ <b id="spT"></b></span><span>Score <b id="spS"></b></span><span>Streak <b id="spK"></b></span><span>Best <b>${rec.best}</b></span></div>
          <p class="q">${esc(q.q)}</p><div class="lboard" id="lb"></div><div class="fb" id="fb" role="status"></div><div class="mrow" id="mrow"></div>`);
        hud();
        board = q.t === "convert" ? R360Data.make(q) : q.t === "circuit" ? Lg.CircuitBoard({ inputs: Lg.vars(Lg.parse(q.expr)) }) : Lg.ExprBoard({ expr: q.expr });
        mountBoard($("#lb"), board); window.__sprint = { s, board, q };
        const row = $("#mrow");
        const skip = document.createElement("button"); skip.className = "btn ghost"; skip.textContent = "Skip"; skip.onclick = () => { s.streak = 0; ask(); }; row.appendChild(skip);
        const clr = document.createElement("button"); clr.className = "btn ghost"; clr.textContent = "Clear"; clr.onclick = () => board.clear(); row.appendChild(clr);
        const ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check"; row.appendChild(ck);
        ck.onclick = () => {
          const res = board.check(q.expr);
          if (res.incomplete) { feedback(false, "Not finished yet.", res.msg); return; }
          busy = true; const r = s.mark(res.ok); row.innerHTML = ""; hud();
          if (res.ok) feedback(true, null, `+${r.pts} points. Speed bonus ${r.bonus}${r.mult > 1 ? `, streak ×${r.mult}` : ""}.`);
          else { feedback(false, "Not quite.", q.t === "convert" ? "The answer is " + q.answer + "." : "A correct answer is Q = " + q.expr + "."); if (q.t === "circuit") board.showAnswer(q.expr); }
          setTimeout(() => { busy = false; ask(); }, res.ok ? 800 : 2200);
        };
      }
      function end() {
        clearInterval(sprintTimer); sprintTimer = null;
        const isBest = Lg.recordSprint(prog, s); prog.scenes[exp.scenes[cur].id].done[k] = true; save(); refreshSprites(); hud(); drawNav();
        const r = prog.sprint;
        shell(st.name, st.col, `<div class="score">${s.score}</div><p style="text-align:center;margin:0">${isBest ? "🏆 <b>New personal best!</b>" : `Personal best: <b>${r.best}</b>`}</p>
          <table class="bd"><tr><td>Correct answers</td><td>${s.correct} of ${s.answered}</td></tr><tr><td>Best streak</td><td>${s.bestStreak}</td></tr><tr><td>Attempts so far</td><td>${r.attempts}</td></tr></table>
          <div class="mrow" id="mrow"><button class="btn ghost" id="cl">Close</button><button class="btn" id="again">Play again</button></div>`);
        $("#again").onclick = () => play(); $("#cl").onclick = () => closeModal();
      }
      ask();
    }
  }
  let modelView = null;
  function openModel(u) {
    if (!window.R360Models) return;
    if (!prog.info.includes(u.id)) { prog.info.push(u.id); save(); refreshSprites(); }
    lastFocus = document.activeElement; modal.classList.add("open"); closeDrawer();
    shell(u.md.title, "#ffa028", `<p class="qn">Drag to turn the model. Click a part, or a button below, to find out what it does.</p>
      <div id="m3d" style="height:min(46vh,380px);background:radial-gradient(circle,#243656,#0e1628);border-radius:12px;border:1px solid var(--line)"></div>
      <div class="fb show ok" id="mpart" style="margin-top:12px"><strong>${esc(u.md.title)}</strong>${esc(u.md.text || "Select a part to learn about it.")}</div>
      <div class="chips" id="mchips" style="margin-top:12px"></div>`);
    const chips = $("#mchips");
    modelView = R360Models.viewer($("#m3d"), u.md.model, (i, p) => {
      $("#mpart").innerHTML = `<strong>${esc(p.name)}</strong>${esc(p.text)}`;
      chips.querySelectorAll(".chip").forEach((c, j) => c.setAttribute("aria-pressed", j === i));
    });
    modelView.parts.forEach((p, i) => { const b = document.createElement("button"); b.className = "chip"; b.setAttribute("aria-pressed", "false"); b.textContent = p.name; b.onclick = () => modelView.select(i); chips.appendChild(b); });
  }
  function closeModal() {
    if (sprintTimer) { clearInterval(sprintTimer); sprintTimer = null; }
    if (modelView) { modelView.dispose(); modelView = null; } modal.classList.remove("open"); refreshSprites(); hud(); drawNav(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  function openStation(k) {
    const sc = exp.scenes[cur], st = sc.stations[k]; if (!st) return;
    const list = taskList(k); if (!list) return;
    lastFocus = document.activeElement; modal.classList.add("open"); closeDrawer(); run(k, list, 0);
  }
  // Which questions to ask at a station (null = nothing to ask, with a message shown)
  function taskList(k) {
    const sc = exp.scenes[cur], st = sc.stations[k]; if (!st) return null;
    if (st.tasks[0] && (st.tasks[0].t === "sprint" || st.tasks[0].t === "defence")) return [0];
    const sp = prog.scenes[sc.id], state = stationState(sc, k);
    let list;
    if (reviewMode) {
      if (!state.done) { toast("Answer this station normally first. Turn review mode off to start it."); return null; }
      list = st.tasks.map((_, i) => i).filter(i => ((sp.ans || {})[k + "-" + i] ?? 0) < marks(st.tasks[i]) && !prog.review[sc.id + ":" + k + "-" + i]);
      if (!list.length) { toast("Nothing left to review here. Well done!"); return null; }
    } else {
      if (state.done) { toast(`You scored ${state.got}/${state.tot} here. Use review mode to retry anything you got wrong.`); return null; }
      list = st.tasks.map((_, i) => i).filter(i => (sp.ans || {})[k + "-" + i] === undefined);
      if (!list.length) { sp.done[k] = true; save(); refreshSprites(); return null; }
    }
    return list;
  }
  // Records a finished station; returns what to show next
  function completeStation(k) {
    const sc = exp.scenes[cur];
    if (reviewMode) { const st = stationState(sc, k); return { review: true, message: st.open ? "Keep going: some questions still need reviewing." : "Reviewed. Nice work." }; }
    prog.scenes[sc.id].done[k] = true; save(); refreshSprites(); hud(); drawNav();
    if (!sc.stations.every((_, x) => prog.scenes[sc.id].done[x])) return { sceneDone: false };
    const rows = sc.stations.map((st, x) => ({ name: st.name, ...stationState(sc, x) }));
    const got = rows.reduce((a, x) => a + x.got, 0), tot = rows.reduce((a, x) => a + x.tot, 0);
    const nextIdx = exp.scenes.findIndex((s, x) => x !== cur && !s.stations.every((_, y) => prog.scenes[s.id].done[y]));
    return { sceneDone: true, sc, rows, got, tot, nextIdx, whole: Store.summarise(exp, prog), anyOpen: rows.some(x => x.open) };
  }
  function award(k, i, got) {
    const sc = exp.scenes[cur], key = k + "-" + i, m = marks(sc.stations[k].tasks[i]);
    if (reviewMode) { if (got === m) prog.review[sc.id + ":" + key] = true; }
    else if (prog.scenes[sc.id].ans[key] === undefined) prog.scenes[sc.id].ans[key] = got;
    save(); hud();
  }
  function feedback(ok, partial, text) { const fb = $("#fb"); fb.className = "fb show " + (ok ? "ok" : "no"); fb.innerHTML = `<strong>${ok ? "Correct!" : partial || "Not quite."}</strong>${esc(text)}`; }
  function nextBtn(k, list, n) {
    const last = n === list.length - 1; const b = document.createElement("button"); b.className = "btn"; b.textContent = last ? "Finish" : "Next question";
    b.onclick = () => last ? finish(k) : run(k, list, n + 1); $("#mrow").appendChild(b); b.focus();
  }
  const ALT = "Diagram for this question";
  function run(k, list, n) {
    const i = list[n], sc = exp.scenes[cur], st = sc.stations[k], task = st.tasks[i];
    const head = `${st.label === "?" ? "" : st.label + "  "}${st.name}`;
    const qn = (list.length > 1 ? `<p class="qn">Question ${n + 1} of ${list.length}</p>` : "") + (reviewMode ? '<div class="review-note">Review: this won\'t change your score, but it shows whether you\'ve fixed it.</div>' : "");
    const img = task.img ? `<img class="diag" src="${esc(asset(task.img))}" alt="${esc(task.alt || ALT)}">` : "";
    const tail = '<div class="fb" id="fb" aria-live="polite"></div><div class="mrow" id="mrow"></div>';
    if (task.t === "mcq") {
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p><div class="opts">${shuffle(task.a).map(a => `<button class="opt">${esc(a)}</button>`).join("")}</div>${tail}`);
      const opts = [...box.querySelectorAll(".opt")]; opts[0].focus(); const right = task.a[0];
      opts.forEach(b => b.onclick = () => {
        const ok = b.textContent === right; opts.forEach(o => { o.disabled = true; if (o.textContent === right) o.classList.add("right"); });
        if (!ok) b.classList.add("wrong"); award(k, i, ok ? 1 : 0);
        feedback(ok, null, (ok ? "" : "The correct answer is highlighted in green. ") + task.fb); nextBtn(k, list, n);
      });
    } else if (task.t === "multi") {
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p><div class="chips">${task.opts.map(o => `<button class="chip" aria-pressed="false">${esc(o)}</button>`).join("")}</div>${tail}`);
      const chips = [...box.querySelectorAll(".chip")], row = $("#mrow"); chips[0].focus();
      const ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check my answer"; ck.disabled = true; row.appendChild(ck);
      chips.forEach(c => c.onclick = () => { c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true"); ck.disabled = !chips.some(x => x.getAttribute("aria-pressed") === "true"); });
      ck.onclick = () => {
        const sel = chips.filter(c => c.getAttribute("aria-pressed") === "true").map(c => c.textContent);
        const ok = sel.length === task.correct.length && sel.every(x => task.correct.includes(x));
        chips.forEach(c => { c.disabled = true; const want = task.correct.includes(c.textContent), got = c.getAttribute("aria-pressed") === "true"; if (want) c.classList.add("right"); else if (got) c.classList.add("wrong"); });
        award(k, i, ok ? 1 : 0); ck.remove(); feedback(ok, null, (ok ? "" : "The correct answers are shown in green. ") + task.fb); nextBtn(k, list, n);
      };
    } else if (task.t === "sort") {
      const items = shuffle(task.items), pickd = {};
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p>${items.map((it, x) => `<div class="item${task.cats.length > 3 ? " stack" : ""}" data-n="${x}"><span>${esc(it[0])}</span><div class="seg">${task.cats.map(c => `<button aria-pressed="false" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`).join("")}${tail}`);
      const row = $("#mrow"), ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check my answers"; ck.disabled = true; row.appendChild(ck);
      box.querySelectorAll(".item").forEach(it => { const x = it.dataset.n; it.querySelectorAll(".seg button").forEach(b => b.onclick = () => { pickd[x] = b.dataset.c; it.querySelectorAll(".seg button").forEach(y => y.setAttribute("aria-pressed", y === b)); ck.disabled = Object.keys(pickd).length < items.length; }); });
      box.querySelector(".seg button").focus();
      ck.onclick = () => {
        let got = 0; box.querySelectorAll(".item").forEach(it => { const x = it.dataset.n, ok = pickd[x] === items[x][1]; if (ok) got++; it.classList.add(ok ? "right" : "wrong"); it.querySelectorAll("button").forEach(b => b.disabled = true); if (!ok) { const f = document.createElement("div"); f.className = "fix"; f.textContent = "Answer: " + items[x][1]; it.firstElementChild.appendChild(f); } });
        award(k, i, got); ck.remove(); const all = got === items.length; feedback(all, `You got ${got} out of ${items.length}.`, (all ? "" : "Corrections are shown in green. ") + task.fb); nextBtn(k, list, n);
      };
    } else if (task.t === "match") {
      const rights = shuffle(task.pairs.map(p => p[1]));
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p>${task.pairs.map((p, x) => `<div class="item stack"><strong>${esc(p[0])}</strong><select aria-label="${esc(p[0])}"><option value="">Choose…</option>${rights.map(y => `<option>${esc(y)}</option>`).join("")}</select></div>`).join("")}${tail}`);
      const sels = [...box.querySelectorAll("select")], row = $("#mrow"), ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check my answers"; ck.disabled = true; row.appendChild(ck); sels[0].focus();
      sels.forEach(s => s.onchange = () => ck.disabled = sels.some(x => !x.value));
      ck.onclick = () => {
        let got = 0; sels.forEach((s, x) => { const ok = s.value === task.pairs[x][1]; if (ok) got++; s.disabled = true; const it = s.parentElement; it.classList.add(ok ? "right" : "wrong"); if (!ok) { const f = document.createElement("div"); f.className = "fix"; f.textContent = "Answer: " + task.pairs[x][1]; it.appendChild(f); } });
        award(k, i, got); ck.remove(); const all = got === task.pairs.length; feedback(all, `You got ${got} out of ${task.pairs.length}.`, (all ? "" : "Corrections are shown in green. ") + task.fb); nextBtn(k, list, n);
      };
    } else if (task.t === "defence") {
      const rec = prog.defence || { best: 0, attempts: 0 };
      box.classList.add("wide");
      shell(st.name, st.col, `<div class="lboard" id="lb"></div>`);
      const board = R360Defence.Defence({ best: rec.best, isBest: () => lastEnd && lastEnd.score > rec.best,
        onEnd: r => { lastEnd = r; const d = prog.defence || (prog.defence = { best: 0, attempts: 0, history: [] });
          d.attempts++; d.lastScore = r.score; d.best = Math.max(d.best, r.score); d.history = [[r.score, r.rounds, r.correct, Date.now()]].concat(d.history || []).slice(0, 10);
          prog.scenes[exp.scenes[cur].id].done[k] = true; save(); refreshSprites(); hud(); drawNav(); } });
      let lastEnd = null;
      mountBoard($("#lb"), board); window.__def = board;
    } else if (task.t === "sprint" || task.t === "blitz") {
      runSprint(k, st, task);
    } else if (BOARD_TASKS.includes(task.t)) {
      const Lg = window.R360Logic;
      box.classList.add("wide");
      shell(head, st.col, `${qn}<p class="q">${esc(task.q)}</p><div class="lboard" id="lb"></div>${tail}`);
      const board = task.t === "circuit" ? Lg.CircuitBoard({ inputs: task.inputs || Lg.vars(Lg.parse(task.expr)) })
        : task.t === "expr" ? Lg.ExprBoard({ expr: task.expr, out: task.out })
        : task.t === "table" ? Lg.TableBoard({ expr: task.expr, cols: task.cols, out: task.out, inputs: task.inputs, diagram: task.diagram })
        : R360OS.TYPES.includes(task.t) ? R360OS.make(task)
        : R360Data.make(task);
      mountBoard($("#lb"), board); window.__board = { board, task };
      const row = $("#mrow"), clr = document.createElement("button"); clr.className = "btn ghost"; clr.textContent = "Clear"; clr.onclick = () => board.clear(); row.appendChild(clr);
      const ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check my answer"; row.appendChild(ck);
      ck.onclick = () => {
        if (board.filled && !board.filled()) { feedback(false, "Not finished yet.", task.t === "sound" ? "Choose a level in every column first." : "Fill in your answer first."); return; }
        const res = board.check(task.expr);
        if (res.incomplete) { feedback(false, "Not finished yet.", res.msg); return; }
        award(k, i, res.got); clr.remove(); ck.remove();
        feedback(res.ok, res.max > 1 ? `You got ${res.got} out of ${res.max}.` : null, res.msg + " " + (task.fb || ""));
        if (!res.ok && task.t === "circuit") { const sa = document.createElement("button"); sa.className = "btn ghost"; sa.textContent = "Show a correct circuit"; sa.onclick = () => { board.showAnswer(task.expr); sa.remove(); }; row.appendChild(sa); }
        nextBtn(k, list, n);
      };
    } else if (task.t === "order") {
      const pool = shuffle(task.steps); let seq = [];
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p><ol class="olist" id="ol"></ol><p class="qn" id="tapl">Tap the steps in order:</p><div class="pool" id="pool">${pool.map(p => `<button class="opt">${esc(p)}</button>`).join("")}</div>${tail}`);
      const ol = $("#ol"), btns = [...box.querySelectorAll("#pool .opt")], row = $("#mrow");
      const rs = document.createElement("button"); rs.className = "btn ghost"; rs.textContent = "Start again"; row.appendChild(rs);
      const ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check my order"; row.appendChild(ck);
      const draw = () => { ol.innerHTML = task.steps.map((_, x) => seq[x] ? `<li>${esc(seq[x])}</li>` : '<li class="empty">…</li>').join(""); ck.disabled = seq.length < task.steps.length; };
      draw(); btns[0].focus();
      btns.forEach(b => b.onclick = () => { seq.push(b.textContent); b.disabled = true; draw(); });
      rs.onclick = () => { seq = []; btns.forEach(b => b.disabled = false); draw(); };
      ck.onclick = () => {
        let got = 0; const lis = [...ol.children];
        seq.forEach((x, y) => { const ok = x === task.steps[y]; if (ok) got++; lis[y].classList.add(ok ? "right" : "wrong"); if (!ok) { const f = document.createElement("div"); f.className = "fix"; f.textContent = "Should be: " + task.steps[y]; lis[y].appendChild(f); } });
        award(k, i, got); $("#pool").remove(); $("#tapl").remove(); rs.remove(); ck.remove();
        const all = got === task.steps.length; feedback(all, `You got ${got} out of ${task.steps.length} in the right place.`, (all ? "" : "The correct step is shown under each one you got wrong. ") + task.fb); nextBtn(k, list, n);
      };
    }
  }
  function finish(k) {
    const res = completeStation(k);
    if (res.review) { closeModal(); toast(res.message); return; }
    if (!res.sceneDone) { closeModal(); return; }
    const { sc, got, tot, nextIdx, whole } = res;
    const rows = res.rows.map(s => `<tr><td>${esc(s.name)}</td><td>${s.got} / ${s.tot} <span class="rag ${s.band}">${Store.BAND_LABEL[s.band]}</span></td></tr>`).join("");
    shell(sc.title + " complete", "#ffd046", `<p class="center q">Your score</p><div class="big">${got} / ${tot}</div>
      <p class="center">Your score has been saved${CFG.backendUrl ? " for your teacher" : " on this device"}. Copy it onto your worksheet too.</p>
      <table class="bd">${rows}</table>
      ${whole.complete && exp.scenes.length > 1 ? `<p class="center"><b>Lesson complete: ${whole.score} / ${whole.total}</b></p>` : ""}
      <p class="qn">Secure = full marks. Revise = mostly right. Focus here = revise this first. Turn on review mode to retry anything you got wrong.</p>
      <div class="mrow" id="mrow">${res.anyOpen ? '<button class="btn ghost" id="rv">Review my mistakes</button>' : ""}${nextIdx >= 0 ? `<button class="btn" id="go">Go to ${esc(exp.scenes[nextIdx].title)}</button>` : `<a class="btn" href="${esc(home)}">Back to topic</a>`}</div>`);
    const go = $("#go"); if (go) { go.focus(); go.onclick = () => { closeModal(); loadScene(nextIdx); }; }
    const rv = $("#rv"); if (rv) rv.onclick = () => { closeModal(); setReview(true); };
  }

  // ---------- toolbar ----------
  let home = "index.html";
  $("#homeBtn").onclick = () => location.href = home;
  fetch("experiences/topics.json", { cache: "no-cache" }).then(r => r.json()).then(t => { if (t.siteTitle) document.title = exp.title + " | " + t.siteTitle; }).catch(() => {});
  fetch("experiences/registry.json", { cache: "no-cache" }).then(r => r.json()).then(reg => {
    const e = (reg.experiences || []).find(x => x.id === expId);
    if (e && e.topic) home = "topics.html?topic=" + encodeURIComponent(e.topic);
    if (e && e.worksheet) { const a = $("#wsBtn"); a.href = e.worksheet; a.hidden = false; a.setAttribute("aria-label", "Download the worksheet for this lesson (Word document)"); }
  }).catch(() => {});
  $("#progBtn").onclick = () => drawer.classList.contains("progress") ? closeDrawer() : showProgress();
  $("#reviewBtn").onclick = () => setReview(!reviewMode);
  $("#reviewBtn").setAttribute("aria-pressed", reviewMode);
  $("#helpBtn").onclick = () => openDrawer(`<h2>How to use</h2><p>Drag (or use the arrow keys) to look around. Pinch or scroll to zoom.</p><p style="margin-top:8px">Tap a numbered badge to answer that station's questions. Tap a blue <b>i</b> to find out more; the panel stays open while you keep exploring.</p><p style="margin-top:8px">Your progress saves automatically after every answer, so you can leave and come back later.</p>`);

  Object.assign(core, {
    exp, prog, student, CFG, scene, cam, renderer: r, grp, mat, marks, shuffle, esc, save, hud, drawNav, refreshSprites,
    stationState, taskList, award, asset, completeStation, markInfo, setReview, loadScene, cubeFrom, world, texFor,
    sceneHooks: [], closeUI() { closeDrawer(); if (modal.classList.contains("open")) closeModal(); }
  });
  // Live values (getters, so VR always sees the current scene and mode)
  Object.defineProperties(core, {
    cur: { get: () => cur }, sprites: { get: () => sprites }, reviewMode: { get: () => reviewMode }, home: { get: () => home } });
  window.NVRCore = core;
  document.dispatchEvent(new Event("nvr-ready"));
  // Hooks for keyboard/switch access and automated testing
  window.NVR = { openStation, goTo, openModel: n => { const sp = sprites.filter(x => x.userData.type === "model")[n]; if (sp) openModel(sp.userData); }, showInfo: n => { const sp = sprites.filter(x => x.userData.type === "info")[n]; if (sp) showInfo(sp.userData); }, setReview, loadScene };
  const go = params.get("go");
  const startScene = go ? Math.max(0, exp.scenes.findIndex(s => s.id === go.split(":")[0])) : 0;
  loadScene(startScene);
  if (go) setTimeout(() => goTo(go, reviewMode), 300);
  else if (reviewMode) toast("Review mode: stations marked Review or Focus let you retry the questions you got wrong.");
})();
