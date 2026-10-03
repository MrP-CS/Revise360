// Generic 360 experience player. Everything it shows comes from
// experiences/<id>.json, so new lessons need no code changes.
(async function () {
  const params = new URLSearchParams(location.search);
  // The homepage may show this one lesson without a login. Its progress stays in memory.
  const publicDemo = params.get("demo") === "1" && params.get("id") === "ms-l01";
  let demoProgress = null;
  const Store = publicDemo ? {
    ...window.Store,
    student: () => ({ name: "Visitor", cls: "Public demo" }),
    get: () => demoProgress,
    put: (_id, data) => { demoProgress = data; },
    onStatus: callback => { callback("demo"); return () => {}; },
    flushQueue: async () => {},
    push: async () => {}
  } : window.Store;
  // Other experiences still require a student login.
  const R360PlayerGate = (() => {
    const who = Store && Store.student && Store.student();
    if (!who) {
      const back = encodeURIComponent(location.pathname.split("/").pop() + location.search);
      location.replace("topics.html?next=" + back + "#signin");
      return false;
    }
    return true;
  })();
  if (!R360PlayerGate) return;
  const CFG = window.APP_CONFIG;
  let expId = params.get("id");
  const student = Store.student();
  if (!student) { location.href = "index.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search); return; }
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const asset = p => /^(data:|blob:|https?:)/.test(p) ? p : "experiences/" + p;
  // One definition, in store.js, so a new task type cannot be added to one
  // copy of this table and not the other.
  const marks = t => Store.marks(t);

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
  const statusText = { demo: "Demo progress resets when you leave", local: "Saved on this device", idle: "Saved", saved: "Saved ✓", pending: "Saving…", syncing: "Saving…", offline: "Offline: saved on this device, will sync later" };
  let syncState = publicDemo ? "demo" : "local";
  Store.onStatus(s => { syncState = s; const el = $("#sync"); if (el) el.textContent = statusText[s] || ""; });
  Store.flushQueue();
  addEventListener("visibilitychange", () => { if (!publicDemo && document.visibilityState === "hidden" && CFG.backendUrl) Store.push(expId, true); });

  // ---------- three.js scene ----------
  const el = $("#v");
  let r;
  try { r = new THREE.WebGLRenderer({ antialias: true }); }
  catch (err) {
    // A blocked 3D library or unavailable WebGL context should not leave an empty frame.
    const image = exp.scenes[0]?.img;
    if (image) el.style.backgroundImage = `linear-gradient(rgba(10,16,30,.35),rgba(10,16,30,.7)),url("${asset(image)}")`;
    el.style.backgroundPosition = "center";
    el.style.backgroundSize = "cover";
    el.style.cursor = "default";
    const message = document.createElement("div");
    message.className = "webgl-fallback";
    message.setAttribute("role", "status");
    const title = document.createElement("h1"); title.textContent = "360° viewer unavailable";
    const detail = document.createElement("p"); detail.textContent = "This browser cannot start the interactive 3D view. Try a device or browser with WebGL enabled.";
    const link = document.createElement("a"); link.className = "btn";
    link.href = publicDemo ? "index.html" : "topics.html";
    if (publicDemo) link.target = "_top";
    link.textContent = publicDemo ? "Back to home" : "Back to topics";
    message.append(title, detail, link);
    el.appendChild(message);
    $(".hudbar").style.display = "none";
    $(".tools").style.display = "none";
    return;
  }
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(r.domElement);
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

  /* The Python course is worked in order, and every activity in it counts.
   *
   * There is no skipping and no optional question: a pupil who is stuck is given
   * more help and told to ask their teacher, not a way round. A "Challenge" is
   * the hardest activity on a station, not one that can be left out, and the
   * warm-ups are where the technique is taught, so missing them is missing the
   * teaching. Nothing here decides what a pupil may skip; it decides what the
   * course calls finished.
   *
   * An activity is finished when it is answered to full marks - every test
   * passing on a program, the right option on a Predict, a clean run on a Try
   * it. Short of that it stays open and the pupil keeps working at it. Opening a
   * hint, reading the example, asking for help, running out of attempts or
   * reporting a fault never finish anything. */
  const GATED = t => String(t).startsWith("pr-");
  const gated = () => GATED(expId);
  function stationState(sc, k) {
    const st = sc.stations[k], sp = prog.scenes[sc.id];
    let got = 0, tot = 0, open = 0;
    /* An optional challenge counts only once it has been attempted. A pupil who
     * finished the core of a station and left the stretch task alone has not got
     * something wrong, and their mark should not say they have. */
    st.tasks.forEach((tk, i) => {
      const m = marks(tk), a = (sp.ans || {})[k + "-" + i];
      tot += m;
      if (a !== undefined) { got += a; if (a < m && !prog.review[sc.id + ":" + k + "-" + i]) open++; }
    });
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
  function diagTex(seen) {
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.fillStyle = seen ? "rgba(40,50,70,.92)" : "rgba(14,60,70,.95)"; x.fill();
    x.lineWidth = 14; x.strokeStyle = seen ? "#8a98b0" : "#40c4ff"; x.stroke();
    x.fillStyle = seen ? "#b4c4dc" : "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "bold 92px Segoe UI, sans-serif"; x.fillText("2D", 128, 134);
    return new THREE.CanvasTexture(c);
  }
  function refreshSprites() {
    const sc = exp.scenes[cur];
    sprites.forEach(s => {
      const u = s.userData;
      if (u.type === "info") { s.material.map = infoTex(prog.info.includes(u.id)); }
      else if (u.type === "model") { s.material.map = modelTex(prog.info.includes(u.id)); }
      else if (u.type === "diagram") { s.material.map = diagTex(prog.info.includes(u.id)); }
      else {
        const st = stationState(sc, u.k), def = sc.stations[u.k];
        let mode;
        // In the Python course a station that is not open yet says so, dimmed,
        // rather than inviting a pupil to tap it and be turned away.
        if (!st.done && lockedStation(u.k) >= 0) mode = { caption: "Later", dim: true };
        else if (!st.done) mode = { caption: "Answer" };
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
    (sc.diagrams || []).forEach(dg => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
      s.position.copy(world(cubeFrom(dg))); s.scale.set(3.4, 3.4, 1); s.userData = { type: "diagram", id: sc.id + ":2d:" + dg.id, dg }; s.renderOrder = 1; grp.add(s); sprites.push(s);
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
    // Escape closes the hint first, so a pupil who opened it does not lose the
    // code they have written by pressing Escape once too often.
    if ($("#modal").classList.contains("open")) { if (e.key === "Escape") { if (hintOpen()) closeHint(); else closeModal(); } return; }
    if (e.key === "Escape") closeDrawer();
    const step = 8; if (e.target !== document.body) return;
    if (e.key === "ArrowLeft") lon -= step; if (e.key === "ArrowRight") lon += step; if (e.key === "ArrowUp") lat += step; if (e.key === "ArrowDown") lat -= step;
  });
  function pick(e) {
    ray.setFromCamera(ndc(e), cam); const h = ray.intersectObjects(sprites).sort((a, b) => b.object.renderOrder - a.object.renderOrder)[0]; if (!h) return;
    const u = h.object.userData; if (u.type === "info") showInfo(u); else if (u.type === "model") openModel(u); else if (u.type === "diagram") openDiagram(u); else openStation(u.k);
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
  const BOARD_TASKS = ["circuit", "expr", "table", "convert", "addshift", "pixels", "sound", "memory", "permissions", "defrag", "impact", "trace", "bugline", "searchstep", "sortstep"];
  // Boards draw to a canvas; map mouse and touch events onto it
  function mountBoard(host, board) {
    const cv = board.canvas;
    // Cap the width so the board cannot grow taller than the window. xy() below
    // divides by the rendered rect, so scaling it in CSS keeps the pointer true.
    const ar = cv.width / Math.max(cv.height, 1);
    cv.style.cssText = "width:100%;max-width:min(100%," + (ar * 62).toFixed(2) + "vh);display:block;margin:0 auto;"
      + "border-radius:12px;touch-action:none;cursor:pointer";
    host.appendChild(cv);
    const xy = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); board.down(...xy(e)); e.preventDefault(); });
    cv.addEventListener("pointermove", e => board.move(...xy(e)));
    cv.addEventListener("pointerup", e => board.up(...xy(e)));
    cv.addEventListener("pointerleave", () => board.leave && board.leave());
  }
  /* Every window - a question, a 3D model, a 2D diagram - opens in the same
   * frame, at the same size. The model and diagram windows lay their own insides
   * out in two columns; everything else gets a readable centred column, wider
   * when there is an interactive board to fit in it. */
  function shell(title, col, inner) {
    box.style.setProperty("--c", col);
    // Matches the class anywhere in the attribute: the code window carries
    // "vwrap pywrap", and an exact-string test silently wrapped it in an
    // extra layout box that broke every height inside it.
    const ownLayout = /class="[^"]*\bvwrap\b/.test(inner);
    const board = /class="lboard"/.test(inner);
    box.classList.remove("wide");
    box.classList.add("huge");
    // A four-option question in a 1680px frame is mostly empty margin, so a
    // window with nothing wide in it is sized to the column it holds.
    box.classList.toggle("plain", !ownLayout && !board);
    box.classList.toggle("hasboard", board);
    const body = ownLayout ? inner : `<div class="taskwrap${board ? " board" : ""}">${inner}</div>`;
    box.innerHTML = `<div class="head"><span id="mt">${esc(title)}</span><button aria-label="Close" id="x">×</button></div><div class="mbody">${body}</div>`;
    $("#x").onclick = closeModal; box.scrollTop = 0;
    // A locked lesson has nowhere to be dismissed to, so it has no close cross.
    if (modal.dataset.locked) $("#x").remove();
  }
  // ---------------- Logic sprint (laptop) ----------------
  let sprintTimer = null;
  function runSprint(k, st, task) {
    const Lg = window.R360Logic, rec = prog.sprint || { best: 0, attempts: 0 };
    shell(st.name, st.col, `<p class="q">${task.t === "blitz" ? "How fast are your conversions?" : "How fast is your logic?"}</p>
      <p>You have <b>${task.duration || 120} seconds</b>. ${task.t === "blitz" ? "Each question asks you to convert a number between denary, binary and hexadecimal." : "Each question asks you to either build a circuit or write the expression for a diagram."} Questions get harder as you go.</p>
      <p>Each correct answer scores 100 points, plus a speed bonus of up to 60. Get several right in a row for a streak multiplier of up to ×3. A wrong answer resets your streak. Skip a question if you're stuck.</p>
      <p>Your personal best: <b style="color:var(--edge)">${rec.best}</b>${rec.attempts ? ` from ${rec.attempts} ${rec.attempts === 1 ? "try" : "tries"}` : ""}. Beat it!</p>
      <div class="mrow" id="mrow"><button class="btn" id="go">Start the sprint</button></div>`);
    $("#go").onclick = () => play();
    function play() {
      const s = Lg.Sprint(task.duration || 120, task.t === "blitz" ? R360Data.blitz : task.t === "lawgame" ? R360OS.lawCase : task.t === "arena" ? R360Algo.arenaCase : null); let board = null, busy = false;
      const hud = () => { const t = $("#spT"); if (!t) return; t.textContent = Math.ceil(s.timeLeft()) + "s"; $("#spS").textContent = s.score; $("#spK").textContent = s.streak > 1 ? "×" + (1 + Math.min(s.streak - 1, 4) * .5) : "–"; };
      clearInterval(sprintTimer); sprintTimer = setInterval(() => { hud(); if (s.timeLeft() <= 0 && !busy) end(); }, 250);
      function ask() {
        if (s.timeLeft() <= 0) return end();
        const q = s.next(); busy = false;
        shell(st.name, st.col, `<div class="sprinthud"><span>⏱ <b id="spT"></b></span><span>Score <b id="spS"></b></span><span>Streak <b id="spK"></b></span><span>Best <b>${rec.best}</b></span></div>
          <p class="q">${esc(q.q)}</p><div class="lboard" id="lb"></div><div class="fb" id="fb" role="status"></div><div class="mrow" id="mrow"></div>`);
        hud();
        board = R360Algo.TYPES.includes(q.t) ? R360Algo.make(q) : q.t === "law" ? R360OS.make(q) : q.t === "convert" ? R360Data.make(q) : q.t === "circuit" ? Lg.CircuitBoard({ inputs: Lg.vars(Lg.parse(q.expr)) }) : Lg.ExprBoard({ expr: q.expr });
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
          else { feedback(false, "Not quite.", q.t === "law" || q.t === "convert" || R360Algo.TYPES.includes(q.t) ? "The answer is " + q.answer + "." : "A correct answer is Q = " + q.expr + "."); if (q.t === "circuit") board.showAnswer(q.expr); }
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
  /* ---------------- writing code (Paper 2 Section B) ----------------
   * The pupil writes Python, runs it as often as they like, then has it marked
   * by running it against test cases. Marking by running it is the only honest
   * way: comparing an answer against one model solution would fail every pupil
   * who solved it a different way, which is most of them.
   */
  /* Is this what the question asked for? Leading and trailing space, repeated
   * spaces and capitals are ignored; nothing else is, so a brief has to say
   * exactly what to print. Shared with the headset through core, so the same
   * program cannot be marked right on one and wrong on the other. */
  function norm(s) {
    return String(s).replace(/\r/g, "").split("\n").map(l => l.trim().replace(/\s+/g, " "))
      .filter((l, i, a) => l !== "" || i < a.length - 1).join("\n").replace(/\n+$/, "").toLowerCase();
  }
  const sameOutput = (got, want) => norm(got) === norm(want);
  // Has this question been answered already? Used for the progress bubbles.
  function isDone(k, i) {
    const sc = exp.scenes[cur];
    return (prog.scenes[sc.id].ans || {})[k + "-" + i] !== undefined;
  }
  /* What kind of activity this is, and what the pupil is told it is.
   *
   * The course releases a technique in stages - watch it work, say what it will
   * print, change one thing, fill a gap, fix a broken one, write it - and the
   * pupil is shown which stage they are on, because a task that says "Try it"
   * is read differently from one that says "Build it". The labels are
   * deliberately about the action, never about how able the pupil is: there is
   * no easy, medium or hard anywhere in this course. */
  const KINDS = {
    try:      { label: "Try it",      says: "Run this program and watch what it does. Nothing is marked." },
    predict:  { label: "Predict",     says: "Read the program and say what it will display. Then you will see." },
    change:   { label: "Change it",   says: "The program already works. Change the one thing asked for." },
    complete: { label: "Complete it", says: "Part of the program is missing. Fill in the gap." },
    debug:    { label: "Fix it",      says: "This program is broken. Find the mistake and put it right." },
    build:    { label: "Build it",    says: "Write the program yourself." }
  };
  const kindOf = t => KINDS[t.kind] ? t.kind : "build";
  const stageOf = t => t.opt ? "Challenge" : KINDS[kindOf(t)].label;
  // Things to stop when the code window closes - speech, so far.
  const onCloseCode = [];
  function runCode(k, list, n, task, head, qn) {
    if (kindOf(task) === "predict") return runPredict(k, list, n, task, head);
    while (onCloseCode.length) { try { onCloseCode.pop()(); } catch (e) { /* already gone */ } }
    const brief = (task.brief || []).map(b => `<li>${esc(b)}</li>`).join("");
    /* A worked example of the technique, with different data from the task, so
     * a pupil meeting it for the first time has something to copy the shape of.
     * The early lessons carry one on every question and later ones carry none:
     * a beginner needs the example, and someone on lesson 11 needs the thinking
     * more than they need another worked case. */
    const t = task.teach;
    const kind = kindOf(task);
    /* Line by line, for anyone who needs it. A beginner reading a three-line
     * example often cannot say which line does which job, and a paragraph about
     * it beside every program would bury the program. So it is folded away:
     * shut by default, one press to open, and the lines are numbered to match
     * the example above it. */
    const lines = !t || !t.code || !task.lines ? "" : `<details class="pylines">
        <summary>What each line does</summary>
        <ol>${t.code.map((c, i) => task.lines[i]
          ? `<li value="${i + 1}"><code>${esc(c.trim())}</code><span>${esc(task.lines[i])}</span></li>` : "").join("")}</ol>
      </details>`;
    /* On a Try it the worked example and the program in the editor are the same
     * thing, so printing it again on the left is the same lines twice and the
     * length of the longest of them is why that column had to be scrolled. The
     * sentence and the line-by-line notes stay; the code itself is on the right,
     * where it can be run. */
    const sameAsEditor = kind === "try";
    const teach = !t ? "" : `<div class="pyteach"><h4>Learn</h4><p>${esc(t.say)}</p>` +
      (t.code && !sameAsEditor ? `<pre class="pyeg">${t.code.map(esc).join("\n")}</pre>` : "") +
      (t.out && !sameAsEditor ? `<p class="pyegout"><span>shows</span>${t.out.map(esc).join("<br>")}</p>` : "") +
      lines + "</div>";

    /* What the program is given and what it must print, shown as one real run.
     * It is built from the first test rather than written by hand, so it is on
     * every question, in the same place, and can never disagree with marking.
     * This is what stops a pupil guessing whether a value is typed in or just
     * written into the program - the commonest way a correct-looking answer
     * fails. It shows the required OUTPUT, not the program that makes it. */
    const t0 = (task.tests || [])[0] || {};
    const given = (t0.in || []), shows = (t0.out || []);
    const files = Object.keys(t0.files || {});
    const runEg = !shows.length ? "" : `<div class="pyrun">
      <p class="pyrunh">One run of your program</p>
      ${files.length ? `<div class="pyrunrow"><span>file</span><code>${files.map(esc).join(", ")}</code></div>` : ""}
      <div class="pyrunrow in"><span>You type</span><code>${given.length ? given.map(esc).join("\n") : "nothing"}</code></div>
      <div class="pyrunrow out"><span>It displays</span><code>${shows.map(esc).join("\n")}</code></div>
    </div>`;
    /* The task as steps rather than a paragraph. The house wording is already
     * one sentence per step - ask, work out, display - so the sentences are the
     * steps, and splitting them here means all 238 questions get it without
     * anybody rewriting them into bullets by hand. */
    const steps = String(task.q).split(/(?<=[.?!])\s+(?=[A-Z])/).map(x => x.trim()).filter(Boolean);
    const stepList = steps.map((s, i) =>
      `<li><span class="stepn" aria-hidden="true">${i + 1}</span><span>${esc(s)}</span></li>`).join("");

    /* Where the pupil is in this station, the way a lesson site shows it: one
     * bubble per question, the one they are on filled in. */
    const dots = list.length < 2 ? "" : `<ol class="pydots" aria-label="Activity ${n + 1} of ${list.length}">` +
      list.map((qi, j) => {
        const done = isDone(k, qi);
        return `<li class="${j === n ? "now" : ""}${done ? " done" : ""}" aria-current="${j === n ? "step" : "false"}">` +
               `<span>${j + 1}</span></li>`;
      }).join("") + "</ol>";

    /* Which stage of the release this is, and where the pupil is up to. Said in
     * words as well as in bubbles, because a row of circles does not tell a
     * pupil that this one is only to be run and nothing is being judged. */
    const stage = `<div class="pystage-head">
        <span class="pychip ${task.opt ? "opt" : kind}">${esc(stageOf(task))}</span>
        <span class="pywhere">Activity ${n + 1} of ${list.length}</span>
        <span class="pysays">${esc(task.opt ? "The hardest one on this station. Take your time over it." : KINDS[kind].says)}</span>
      </div>`;
    /* A "Try it" activity has nothing to mark: the point of it is to run a
     * working program and watch what happens, which is the opposite of being
     * judged. So there is no Check button on it at all, and pressing Run is
     * what completes it. */
    const noCheck = kind === "try";
    /* Left half: everything to read, in one box each, with the marking below it
     * where there is room for it. Right half: the editor, its own Run bar, the
     * output, and the two buttons that end the attempt. Half and half, so a
     * long task never squeezes the program and a long program never hides the
     * task. */
    shell(head, "#50dc96", `<div class="vwrap codewrap">
        <div class="pyside">
         <div class="pyscroll">
          ${stage}
          ${dots}
          <section class="pytask" aria-labelledby="pytaskh">
            <div class="pytaskhead">
              <h3 id="pytaskh">Your task</h3>
              <button class="btn ghost small" id="pysay" aria-label="Read the task aloud">🔊 Read aloud</button>
            </div>
            <ol class="pysteps">${stepList}</ol>
            ${brief ? `<ul class="pybrief">${brief}</ul>` : ""}
          </section>
          ${teach}
         </div>
         <div class="pyresult">
          <p class="pytry" id="pytry"></p>
          <div class="pytests" id="pytests" role="group" aria-label="How each test went"></div>
          <div class="fb" id="fb" aria-live="polite"></div>
         </div>
        </div>
        <div class="vstage pystage">
          <div id="pyed"></div>
          <!-- The bar an editor has: Run sits between the program and the output
               it produces, which is where every editor puts it. -->
          <div class="pyidebar">
            <button class="btn" id="pyrun" aria-keyshortcuts="Control+Enter">▶ Run</button>
            ${window.R360Ref ? '<button class="btn ghost small" id="pyref">Syntax reminder</button>' : ""}
            <span class="pystate" id="pystate" aria-live="polite"></span>
            <span class="pykeys">Tab indents · Esc leaves the editor · Ctrl+Enter runs</span>
          </div>
          <!-- What one run has to display sits directly above what this run did
               display, so the two can be compared without looking away. -->
          ${runEg}
          <h4 class="pyouth" id="pyouth">Program output</h4>
          <pre class="pyout" id="pyout" aria-labelledby="pyouth"><span class="muted">Press Run and anything your program displays appears here.</span></pre>
          <div class="pyact">
            ${task.hint ? '<button class="btn ghost" id="pyhint">Hint</button>' : ""}
            ${noCheck ? "" : '<button class="btn" id="pycheck" aria-keyshortcuts="Control+Shift+Enter">Check my answer</button>'}
            <button class="btn ghost" id="pyhelp">I need help</button>
            <span class="mrow" id="mrow"></span>
          </div>
        </div>
      </div>`);

    /* Reading the task aloud. Some pupils read code far more easily than they
     * read English about code, and a task read out while they look at the
     * editor is worth more than the same words sat still on the left. */
    const sayBtn = $("#pysay");
    if (sayBtn) {
      const speech = window.speechSynthesis;
      if (!speech) sayBtn.remove();
      else {
        const words = steps.join(" ") + " " + (task.brief || []).join(" ");
        const stop = () => { speech.cancel(); sayBtn.textContent = "🔊 Read aloud"; sayBtn.setAttribute("aria-pressed", "false"); };
        sayBtn.setAttribute("aria-pressed", "false");
        sayBtn.onclick = () => {
          if (speech.speaking) return stop();
          const u = new SpeechSynthesisUtterance(words);
          u.rate = 0.95; u.lang = "en-GB";
          u.onend = stop; u.onerror = stop;
          speech.cancel(); speech.speak(u);
          sayBtn.textContent = "■ Stop reading"; sayBtn.setAttribute("aria-pressed", "true");
        };
        onCloseCode.push(stop);
      }
    }

    box.classList.add("codewin");
    onCloseCode.push(() => box.classList.remove("codewin"));

    const ed = R360Py.editor($("#pyed"), task.starter || "");
    const out = $("#pyout"), state = $("#pystate");
    const tests = task.tests || [];
    /* Programming is trial and error, so a code question is never locked after
     * one check the way a multiple-choice question is: the pupil keeps the best
     * mark they reach, and the help gets more specific the more they try. */
    let attempts = 0, best = 0;

    const say = (html, bad) => { out.innerHTML = bad ? `<span class="err">${html}</span>` : html; };
    /* The runtime takes seconds to arrive, and a pupil can close the window or
     * move to the next activity inside that time - at which point these buttons
     * no longer exist. Every one is checked, because an exception thrown from
     * the ready() callback stops whatever was meant to run after it. */
    const busy = (on, msg) => {
      ["#pyrun", "#pycheck", "#pyhint", "#pyhelp"].forEach(s => { const el = $(s); if (el) el.disabled = on; });
      if (state && state.isConnected) state.textContent = msg || "";
    };
    // The runtime is a few megabytes, so it is fetched when a code question is
    // opened rather than on every page, and the wait is said out loud.
    busy(true, "Starting Python\u2026");
    R360Py.ready().then(() => { if (out.isConnected) busy(false, ""); });

    if ($("#pyhint")) $("#pyhint").onclick = () => openHint(task);
    if ($("#pyref")) $("#pyref").onclick = () => openRef();

    /* Running and checking from the keyboard, so a pupil who is typing never
     * has to go and find the mouse, and anyone who cannot use one still can. */
    ed.el.addEventListener("keydown", e => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "Enter") return;
      e.preventDefault();
      const b = e.shiftKey ? $("#pycheck") : $("#pyrun");
      if (b && !b.disabled) b.click();
    });

    $("#pyrun").onclick = async () => {
      busy(true, "Running\u2026"); say('<span class="muted">Running\u2026</span>');
      const first = tests[0] || { in: task.in || [] };
      const r = await R360Py.run(ed.get(), { stdin: (first.in || []).slice(), files: first.files || {}, echo: true, timeoutMs: 6000 });
      busy(false, "");
      if (r.error) say(esc(r.stdout) + (r.stdout ? "\n" : "") + esc(r.error), true);
      else say(r.stdout ? esc(r.stdout) : '<span class="muted">Your program ran but displayed nothing.</span>');
      /* On a "Try it" the run is the activity. It counts the moment the program
       * runs without an error, and it is said in words rather than scored, so a
       * pupil pressing Run out of curiosity is never told they were wrong. */
      if (noCheck && !r.error && !$("#mrow").children.length) {
        awardBest(k, i2(k, list, n), marks(task));
        succeed(task.fb || "You ran a Python program and saw what it displayed.");
        nextBtn(k, list, n, true);
      } else if (noCheck && r.error) {
        $("#pytry").textContent = "That program should run as it is. Put back anything you have "
          + "changed, then press Run again.";
      }
    };
    if ($("#pyhelp")) $("#pyhelp").onclick = () => askTeacher(task, true);
    /* What a finished activity looks like: a plain tick, one sentence naming the
     * technique they just used, and the way on. No noise, no confetti - the
     * pupils reading this include Year 11. */
    function succeed(text) {
      const fb = $("#fb");
      fb.className = "fb show ok done";
      fb.innerHTML = `<strong>\u2713 Nice work.</strong>${esc(text)}`;
      $("#pytry").textContent = "";
    }

    if ($("#pycheck")) $("#pycheck").onclick = async () => {
      if (!tests.length) return;
      /* Running the code cannot see "write the sort yourself" - sorted() looks
       * the same from the outside - so that one kind of rule is checked here. */
      const broke = (task.forbid || []).find(f => ed.get().indexOf(f[0]) >= 0);
      if (broke) {
        feedback(false, "Not allowed here.", broke[1]);
        return;
      }
      /* The other half of that rule. Some activities cannot be judged by their
       * output at all - a program told to pick a random number between 4 and 4
       * looks exactly like one that prints 4 - so the technique itself has to be
       * required. Used only where running the code genuinely cannot tell, never
       * for style. */
      const absent = (task.require || []).find(f => ed.get().indexOf(f[0]) < 0);
      if (absent) {
        feedback(false, "Not quite.", absent[1]);
        return;
      }
      busy(true, "Marking\u2026");
      const list2 = $("#pytests"); list2.innerHTML = "";
      let passed = 0;
      for (const t of tests) {
        const r = await R360Py.run(ed.get(), { stdin: (t.in || []).slice(), files: t.files || {}, echo: false, timeoutMs: 6000 });
        const want = (t.out || []).join("\n");
        const ok = !r.error && sameOutput(r.stdout, want);
        if (ok) passed++;
        const row = document.createElement("div");
        row.className = "pytest " + (ok ? "pass" : "fail");
        const given = (t.in || []).join(", ");
        row.innerHTML = `<b>${ok ? "\u2713" : "\u2717"}</b><div>` +
          `<div>${given ? `Input <b>${esc(given)}</b> \u2192 ` : ""}expected <b>${esc(want)}</b></div>` +
          (ok ? "" : `<div class="why">${r.error ? esc(r.error.split("\n")[0])
                      : "your program printed " + (r.stdout.trim() ? "<b>" + esc(r.stdout.trim()) + "</b>" : "nothing")}</div>`) +
          (t.why && !ok ? `<div class="why">${esc(t.why)}</div>` : "") + "</div>";
        list2.appendChild(row);
      }
      busy(false, "");
      attempts++;
      const max = marks(task), got = Math.round(max * passed / tests.length);
      best = Math.max(best, got);
      awardBest(k, i2(k, list, n), best);
      const all = passed === tests.length;

      /* The help gets more specific the more times they have checked: the first
       * failure is theirs to read, the second points at the hint, and by the
       * third the hint is one button press away in the feedback itself. */
      const tryLine = $("#pytry");
      if (all) tryLine.textContent = "";
      else if (attempts === 1) tryLine.textContent = "Change one thing and check again. Keeping your best mark.";
      else if (attempts === 2) tryLine.textContent = "Still not there. The Hint button explains the technique this question needs.";
      else tryLine.textContent = `Attempt ${attempts}. Open the hint, then come back and change one thing at a time.`;
      if (!all && attempts >= 2 && $("#pyhint")) $("#pyhint").classList.add("nudge");

      const row = $("#mrow"); row.innerHTML = "";
      if (all) succeed(`${task.fb || ""} All ${tests.length} tests passed.`);
      else feedback(false, `${passed} of ${tests.length} tests passed - best so far ${best} of ${max} marks.`,
        task.fb || "Look at the first test that failed and work out what your program displayed instead.");
      if (!all && attempts >= 3 && task.hint) {
        const h = document.createElement("button");
        h.className = "btn ghost"; h.textContent = "Show me the hint";
        h.onclick = () => openHint(task); row.appendChild(h);
      }
      /* Three checks that have not worked is the moment to say, once, that
       * asking the teacher is an ordinary thing to do - not after ten, and not
       * again every time after that. */
      if (!all && attempts === 3) askTeacher(task, false);
      nextBtn(k, list, n, all);
    };
  }
  // the index of the task being run, which award() needs
  function i2(k, list, n) { return list[n]; }

  let modelView = null;
  function openModel(u) {
    if (!window.R360Models) return;
    if (!prog.info.includes(u.id)) { prog.info.push(u.id); save(); refreshSprites(); }
    lastFocus = document.activeElement; modal.classList.add("open"); closeDrawer();
    box.classList.add("huge");
    shell(u.md.title, "#ffa028", `<div class="vwrap">
        <div class="vstage model" id="m3d"></div>
        <div class="vside">
          <div class="vnow"><b id="mname">${esc(u.md.title)}</b><span id="mpart">${esc(u.md.text || "Choose a part to find out what it does.")}</span></div>
          <p class="vhint">Drag the model to turn it, or scroll to zoom. Select any part to read about it.</p>
          <h3>Parts</h3>
          <div class="vlist" id="mchips"></div>
        </div>
      </div>`);
    const chips = $("#mchips");
    modelView = R360Models.viewer($("#m3d"), u.md.model, (i, p) => {
      $("#mname").textContent = p.name;
      $("#mpart").textContent = p.text;
      chips.querySelectorAll("button").forEach((c, j) => c.setAttribute("aria-pressed", j === i));
    });
    modelView.parts.forEach((p, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-pressed", "false"); b.textContent = p.name;
      b.onclick = () => modelView.select(i); chips.appendChild(b);
    });
  }
  let diagView = null;
  function openDiagram(u) {
    if (!window.R360Diagrams) return;
    if (!prog.info.includes(u.id)) { prog.info.push(u.id); save(); refreshSprites(); }
    lastFocus = document.activeElement; modal.classList.add("open"); closeDrawer();
    box.classList.add("huge");
    shell(u.dg.title, "#40c4ff", `<div class="vwrap">
        <div class="vstage" id="d2d"></div>
        <div class="vside">
          <div class="vnow"><b id="dstep"></b><span id="dcap"></span></div>
          <div class="vrow">
            <button class="btn ghost" id="dprev">‹ Back</button>
            <button class="btn" id="dplay">Replay</button>
            <button class="btn ghost" id="dnext">Next ›</button>
          </div>
          <h3>Steps</h3>
          <div class="vlist" id="dchips"></div>
        </div>
      </div>`);
    const chips = $("#dchips");
    let nSteps = 0;
    diagView = R360Diagrams.viewer($("#d2d"), u.dg.diagram, (i, st, playing) => {
      $("#dstep").textContent = st.name;
      $("#dcap").textContent = st.caption;
      $("#dplay").textContent = playing ? "Pause" : "Replay";
      chips.querySelectorAll("button").forEach((c, j) => c.setAttribute("aria-pressed", j === i));
      $("#dprev").disabled = i === 0;
      $("#dnext").disabled = i === nSteps - 1;
    }, { hideCaption: true });
    nSteps = diagView.steps.length;
    diagView.steps.forEach((st, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-pressed", "false"); b.textContent = st.name;
      b.onclick = () => diagView.select(i); chips.appendChild(b);
    });
    $("#dplay").onclick = () => diagView.toggle();
    $("#dprev").onclick = () => diagView.prev();
    $("#dnext").onclick = () => diagView.next();
    diagView.announce();
  }
  /* The hint for a code question: the diagram that teaches the technique the
   * question needs, over the editor rather than instead of it. It is a panel
   * inside the same window, so the pupil's program is still there, untouched,
   * when they close it - losing their code to look something up would be a
   * reason never to look anything up. */
  let hintView = null;
  const hintOpen = () => !!document.getElementById("pyhintpane");
  function closeHint() {
    if (hintView) { hintView.dispose(); hintView = null; }
    const p = document.getElementById("pyhintpane"); if (p) p.remove();
    const b = $("#pyhint"); if (b) { b.classList.remove("nudge"); b.focus(); }
  }

  /* The syntax reference: every command the course has taught up to this lesson,
   * each with what it does and a one-line example. It is a thing to look up, not
   * a hint - it never mentions the question, and no entry is a solution to one.
   * It opens over the editor like the hint, so the program is kept. */
  function openRef() {
    if (!window.R360Ref || hintOpen()) return;
    const upto = Number(String(exp.id).match(/-l0*(\d+)/) ? String(exp.id).match(/-l0*(\d+)/)[1] : 99);
    const groups = R360Ref.upTo(upto);
    if (!groups.length) return;
    const pane = document.createElement("div");
    pane.id = "pyhintpane"; pane.className = "hintpane refpane";
    pane.innerHTML = `<div class="hinthead"><b>Python syntax</b><span>Everything the course has used so far. Look things up here as often as you like.</span>
        <button class="btn ghost" id="hintclose">Close</button></div>
      <div class="reflist">${groups.map(g => `<section><h3>${esc(g.name)}</h3>${g.items.map(it => `
        <div class="refit"><code>${esc(it.syntax)}</code><p>${esc(it.what)}</p>` +
        (it.eg ? `<pre class="pyeg">${(Array.isArray(it.eg) ? it.eg : [it.eg]).map(esc).join("\n")}</pre>` : "") +
        (it.egOut ? `<p class="pyegout"><span>shows</span>${(Array.isArray(it.egOut) ? it.egOut : [it.egOut]).map(esc).join("<br>")}</p>` : "") +
        `</div>`).join("")}</section>`).join("")}</div>`;
    box.appendChild(pane);
    $("#hintclose").onclick = closeHint;
    $("#hintclose").focus();
  }
  /* A hint is a ladder, not a door. The first rung names the idea, the second
   * shows the shape of the Python, the third shows how it starts, and the last
   * one animates the technique. Each rung is asked for, so a pupil who only
   * needed reminding which word it was never sees the rest - and nobody is
   * handed the finished program, because the top of the ladder is still only
   * the technique on different data. */
  function openHint(task) {
    if (!task.hint || hintOpen()) return;
    const h = typeof task.hint === "string" ? { diagram: task.hint } : task.hint;
    const code = v => `<pre class="pyeg">${(Array.isArray(v) ? v : [v]).map(esc).join("\n")}</pre>`;
    const dia = h.diagram && window.R360Diagrams && R360Diagrams.kinds.includes(h.diagram) ? h.diagram : null;
    const rungs = [];
    if (h.think) rungs.push({ name: "Think", body: `<p class="hsay">${esc(h.think)}</p>` });
    if (h.syntax) rungs.push({ name: "The Python you need", body: code(h.syntax) });
    if (h.start) rungs.push({ name: "How it starts", body: code(h.start) });
    if (h.walk) rungs.push({ name: "Work it through", body: `<ol class="hwalk">${(Array.isArray(h.walk) ? h.walk : [h.walk]).map(s => `<li>${esc(s)}</li>`).join("")}</ol>` });
    if (dia) rungs.push({ name: "Watch the technique", diagram: dia, body: `<div class="hintdiag vwrap">
        <div class="vstage" id="hint2d"></div>
        <div class="vside">
          <div class="vnow"><b id="hstep"></b><span id="hcap"></span></div>
          <div class="vrow"><button class="btn ghost" id="hprev">‹ Back</button><button class="btn" id="hplay">Pause</button><button class="btn ghost" id="hnext">Next ›</button></div>
        </div>
      </div>` });
    if (!rungs.length) return;
    const pane = document.createElement("div");
    pane.id = "pyhintpane"; pane.className = "hintpane";
    pane.innerHTML = `<div class="hinthead"><b>Hint</b><span id="hwhere"></span>
        <button class="btn ghost" id="hintclose">Close hint</button></div>
      <div class="hintladder" id="hladder"></div>
      <div class="hintfoot"><button class="btn" id="hmore">Show me more</button>
        <span class="pysays">Your program is still behind this panel, exactly as you left it.</span></div>`;
    box.appendChild(pane);
    const ladder = $("#hladder"), more = $("#hmore"), where = $("#hwhere");
    let shown = 0;
    const reveal = () => {
      const r = rungs[shown];
      const sec = document.createElement("section");
      sec.className = "hrung";
      sec.innerHTML = `<h4>Step ${shown + 1} of ${rungs.length} — ${esc(r.name)}</h4>${r.body}`;
      ladder.appendChild(sec);
      shown++;
      where.textContent = rungs.length > 1
        ? `Step ${shown} of ${rungs.length}. Each step tells you a little more. None of them is the answer.`
        : "How this technique works — not the answer to this question.";
      if (r.diagram) mountHintDiagram(r.diagram);
      if (shown >= rungs.length) more.remove();
      else more.textContent = `Show me more (${rungs.length - shown} left)`;
      sec.scrollIntoView({ block: "nearest" });
    };
    more.onclick = reveal;
    reveal();
    $("#hintclose").onclick = closeHint;
    $("#hintclose").focus();
  }
  function mountHintDiagram(kind) {
    let nSteps = 0;
    hintView = R360Diagrams.viewer($("#hint2d"), kind, (i, st, playing) => {
      $("#hstep").textContent = st.name;
      $("#hcap").textContent = st.caption;
      $("#hplay").textContent = playing ? "Pause" : "Replay";
      $("#hprev").disabled = i === 0;
      $("#hnext").disabled = i === nSteps - 1;
    }, { hideCaption: true });
    nSteps = hintView.steps.length;
    $("#hplay").onclick = () => hintView.toggle();
    $("#hprev").onclick = () => hintView.prev();
    $("#hnext").onclick = () => hintView.next();
    hintView.announce();
  }
  /* "What will this program display?" A pupil who can read a program can write
   * one, and the reverse is not true, so the course asks them to read before it
   * asks them to write. There is no editor on this one: the program is fixed,
   * the answer is chosen, and the moment it is answered the pupil is shown what
   * Python really did with it. */
  function runPredict(k, list, n, task, head) {
    while (onCloseCode.length) { try { onCloseCode.pop()(); } catch (e) { /* already gone */ } }
    const right = task.a[0];
    const where = `<div class="pystage-head"><span class="pychip predict">Predict</span>
        <span class="pywhere">Activity ${n + 1} of ${list.length}</span>
        <span class="pysays">${esc(KINDS.predict.says)}</span></div>`;
    const typed = (task.in || []).length
      ? `<div class="pyrunrow in"><span>You type</span><code>${task.in.map(esc).join("\n")}</code></div>` : "";
    const t = task.teach;
    const learn = !t ? "" : `<div class="pyteach"><h4>Learn</h4><p>${esc(t.say)}</p></div>`;
    /* Program on the left, answers on the right. Stacked, a program of eight
     * lines above three answers that are each several lines long does not fit
     * any school screen, and a pupil comparing an answer with the code would be
     * scrolling between the two things they have to hold side by side. */
    shell(head, "#50dc96", `<div class="vwrap predwrap">
        <div class="predside">
          ${where}
          ${learn}
          <p class="pyrunh">The program</p>
          <pre class="pyeg big${task.code.length > 20 ? " tiny" : task.code.length > 13 ? " long" : ""}">${task.code.map(esc).join("\n")}</pre>
          ${typed ? `<div class="pyrun">${typed}</div>` : ""}
        </div>
        <div class="predask">
          <p class="q">${esc(task.q)}</p>
          <p class="pyrunh">Choose what it displays</p>
          <div class="opts">${shuffle(task.a.slice()).map(a => `<button class="opt mono">${esc(a)}</button>`).join("")}</div>
          <div class="fb" id="fb" aria-live="polite"></div>
          <div class="mrow" id="mrow"></div>
        </div>
      </div>`);
    box.classList.add("predwin");
    onCloseCode.push(() => box.classList.remove("predwin"));
    const opts = [...box.querySelectorAll(".opt")];
    opts[0].focus();
    opts.forEach(b => b.onclick = () => {
      const ok = b.textContent === right;
      opts.forEach(o => { o.disabled = true; if (o.textContent === right) o.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      award(k, i2(k, list, n), ok ? marks(task) : 0);
      const fb = $("#fb");
      fb.className = "fb show " + (ok ? "ok done" : "no");
      fb.innerHTML = `<strong>${ok ? "✓ That is what it displays." : "It displays this instead:"}</strong>` +
        (ok ? "" : `<span class="predans">${esc(right)}</span>`) + esc(task.fb || "");
      if (ok) nextBtn(k, list, n, true);
      else tryAgain(k, list, n, "Read the program again with that answer in mind, then choose.");
    });
  }
  function closeModal() {
    // A locked lesson is not a window to dismiss: there is nothing behind it
    // that this pupil is meant to be working on yet.
    if (modal.dataset.locked) return;
    while (onCloseCode.length) { try { onCloseCode.pop()(); } catch (e) { /* already gone */ } }
    if (hintOpen()) closeHint();
    if (sprintTimer) { clearInterval(sprintTimer); sprintTimer = null; }
    if (modelView) { modelView.dispose(); modelView = null; }
    if (diagView) { diagView.dispose(); diagView = null; }
    box.classList.remove("huge", "plain", "hasboard");
    modal.classList.remove("open"); refreshSprites(); hud(); drawNav(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  modal.addEventListener("click", e => { if (e.target === modal && !modal.dataset.locked) closeModal(); });
  /* Which station a pupil in the Python course is up to. Stations are worked in
   * order, so the one after the earliest unfinished one is not open yet. */
  function lockedStation(k) {
    if (!gated() || reviewMode) return -1;
    const open = firstOpenStation();
    return open >= 0 && k > open ? open : -1;
  }
  /* What a pupil sees when they reach for something that is not open yet. It
   * says plainly why, and the only button on it goes to the work they are
   * actually up to - never past it. */
  function lockedWindow(name, k) {
    lastFocus = document.activeElement; modal.classList.add("open"); closeDrawer();
    shell("Not yet", "#ffd046", `<p class="q">Finish the station you are on first.</p>
      <p>This course is worked in order, so each station opens once the one before it is
      finished. You are up to <b>${esc(name)}</b>.</p>
      <p class="qn">Stuck on a question? Use the hint, or ask your teacher and show them the
      question and your code. Complete it before moving on.</p>
      <div class="mrow" id="mrow"><button class="btn" id="goback">Return to your current question</button></div>`);
    $("#goback").onclick = () => { closeModal(); openStation(k); };
    $("#goback").focus();
  }
  function openStation(k) {
    const sc = exp.scenes[cur], st = sc.stations[k]; if (!st) return;
    const at = lockedStation(k);
    if (at >= 0) { lockedWindow(sc.stations[at].name, at); return; }
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
    } else if (gated()) {
      /* Everything on this station, in the order it was written, starting at the
       * first one that is not finished. An activity that was answered but not
       * got right is still waiting, so it is still in the list. */
      if (state.done) { toast(`You scored ${state.got}/${state.tot} here. Use review mode to look back over it.`); return null; }
      const from = firstOpen(k);
      if (from < 0) { sp.done[k] = true; save(); refreshSprites(); return null; }
      list = st.tasks.map((_, i) => i).filter(i => i >= from);
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
    // In the Python course a station is finished only when every activity on it
    // is. Reaching the end of the list is not the same thing.
    if (gated() && firstOpen(k) >= 0) return { stillOpen: true, at: firstOpen(k) };
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
  /* A knowledge question keeps the first answer, which is the point of it. A
   * code question keeps the best, because getting it working on the third try
   * is what programming is, and a pupil who improves their program should see
   * the mark improve with it. */
  function awardBest(k, i, got) {
    const sc = exp.scenes[cur], key = k + "-" + i, m = marks(sc.stations[k].tasks[i]);
    if (reviewMode) { if (got === m) prog.review[sc.id + ":" + key] = true; }
    else {
      const had = prog.scenes[sc.id].ans[key];
      if (had === undefined || got > had) prog.scenes[sc.id].ans[key] = got;
    }
    save(); hud();
  }
  function feedback(ok, partial, text) { const fb = $("#fb"); fb.className = "fb show " + (ok ? "ok" : "no"); fb.innerHTML = `<strong>${ok ? "Correct!" : partial || "Not quite."}</strong>${esc(text)}`; }
  /* Has this activity been finished to the standard the course asks for?
   *
   * Full marks, and nothing else: every test passing on a program, the right
   * option on a Predict, a clean run on a Try it. Partial credit is recorded and
   * shown, because it is honest about where a pupil got to, but it does not
   * finish the activity. */
  function isComplete(k, i) {
    const sc = exp.scenes[cur], task = sc.stations[k].tasks[i];
    const a = (prog.scenes[sc.id].ans || {})[k + "-" + i];
    return a !== undefined && a >= marks(task);
  }
  // The first activity on this station that is not finished, or -1 if all are.
  function firstOpen(k) {
    const st = exp.scenes[cur].stations[k];
    for (let i = 0; i < st.tasks.length; i++) if (!isComplete(k, i)) return i;
    return -1;
  }
  // The first station with unfinished work on it, or -1.
  function firstOpenStation() {
    const sc = exp.scenes[cur];
    for (let k = 0; k < sc.stations.length; k++) if (firstOpen(k) >= 0) return k;
    return -1;
  }

  /* What to offer when an activity has been answered.
   *
   * In the Python course the way on appears only once the activity is finished.
   * Until then the pupil stays here, with the help they need - which is the
   * whole of the rule: a question is not got past, it is got right. Everywhere
   * else the course works as it always has. */
  function nextBtn(k, list, n, done) {
    const row = $("#mrow"); if (!row) return;
    if (gated() && !reviewMode && done === false) return;
    const last = n === list.length - 1;
    const b = document.createElement("button"); b.className = "btn";
    b.textContent = last ? "Finish" : "Next question";
    b.onclick = () => last ? finish(k) : run(k, list, n + 1);
    row.appendChild(b); b.focus();
  }

  /* Answered, but not right. In the Python course that means going round again
   * rather than moving on, so the question is re-offered with the first answer
   * already recorded - the mark a teacher sees is still the honest one. */
  function tryAgain(k, list, n, why) {
    if (!gated() || reviewMode) return nextBtn(k, list, n, true);
    const row = $("#mrow"); if (!row) return;
    const b = document.createElement("button"); b.className = "btn"; b.textContent = "Try this one again";
    b.onclick = () => run(k, list, n);
    row.appendChild(b);
    const h = document.createElement("button"); h.className = "btn ghost"; h.textContent = "I need help";
    h.onclick = () => askTeacher(exp.scenes[cur].stations[k].tasks[list[n]], true);
    row.appendChild(h);
    if (why) { const p = document.createElement("p"); p.className = "qn"; p.textContent = why; row.parentNode.insertBefore(p, row); }
    b.focus();
  }

  /* The help a stuck pupil is offered, from the first attempt and without any
   * cost. It is not a way past the question and it does not claim to have told
   * anybody anything: there is no teacher messaging in this product, so it says
   * to ask the teacher in the room. */
  function askTeacher(task, asked) {
    const pane = document.createElement("div");
    pane.id = "pyhintpane"; pane.className = "hintpane helppane";
    pane.innerHTML = `<div class="hinthead"><b>Asking for help</b>
        <span>Nothing here is marked, and asking costs you nothing.</span>
        <button class="btn ghost" id="hintclose">Close</button></div>
      <div class="helpbody">
        <p class="helpsay">Not sure what to do next? That is OK. You can use a hint or ask your
          teacher for help. Show them this question and your code. Complete this question before
          moving on.</p>
        <div class="vrow">
          ${task && task.hint ? '<button class="btn" id="helphint">Show a hint</button>' : ""}
          ${task && task.teach ? '<button class="btn ghost" id="helpeg">Review the example</button>' : ""}
          <button class="btn ghost" id="helpback">Keep trying</button>
        </div>
        <p class="qn">Your teacher cannot see this screen. Put your hand up, or send them a
          message the way your school normally does, and show them this question.</p>
        <p class="qn">Something wrong with the question itself? Tell your teacher so it can be
          looked at. Reporting a fault does not finish the question.</p>
      </div>`;
    box.appendChild(pane);
    const shut = () => { const p2 = document.getElementById("pyhintpane"); if (p2) p2.remove(); };
    $("#hintclose").onclick = shut;
    if ($("#helpback")) $("#helpback").onclick = shut;
    if ($("#helphint")) $("#helphint").onclick = () => { shut(); openHint(task); };
    if ($("#helpeg")) $("#helpeg").onclick = () => { shut(); const t = $(".pyteach"); if (t) t.scrollIntoView({ block: "center" }); };
    $("#hintclose").focus();
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
        feedback(ok, null, (ok ? "" : "The correct answer is highlighted in green. ") + task.fb);
        if (ok) nextBtn(k, list, n, true); else tryAgain(k, list, n, "Read the right answer above, then answer it again.");
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
        award(k, i, ok ? 1 : 0); ck.remove(); feedback(ok, null, (ok ? "" : "The correct answers are shown in green. ") + task.fb);
        if (ok) nextBtn(k, list, n, true); else tryAgain(k, list, n, "Look at the ones in green, then choose again.");
      };
    } else if (task.t === "code") {
      runCode(k, list, n, task, head, qn);
    } else if (task.t === "sort") {
      const items = shuffle(task.items), pickd = {};
      /* Eight things to sort, each with four buttons under it, is taller than a
       * laptop screen in one column. Past five they go two abreast where there
       * is width for it, which is what stops this window being scrolled. */
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p>` +
        `<div class="items${items.length > 5 ? " many" : ""}">${items.map((it, x) => `<div class="item${task.cats.length > 3 ? " stack" : ""}" data-n="${x}"><span>${esc(it[0])}</span><div class="seg">${task.cats.map(c => `<button aria-pressed="false" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`).join("")}</div>${tail}`);
      const row = $("#mrow"), ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check my answers"; ck.disabled = true; row.appendChild(ck);
      box.querySelectorAll(".item").forEach(it => { const x = it.dataset.n; it.querySelectorAll(".seg button").forEach(b => b.onclick = () => { pickd[x] = b.dataset.c; it.querySelectorAll(".seg button").forEach(y => y.setAttribute("aria-pressed", y === b)); ck.disabled = Object.keys(pickd).length < items.length; }); });
      box.querySelector(".seg button").focus();
      ck.onclick = () => {
        let got = 0; box.querySelectorAll(".item").forEach(it => { const x = it.dataset.n, ok = pickd[x] === items[x][1]; if (ok) got++; it.classList.add(ok ? "right" : "wrong"); it.querySelectorAll("button").forEach(b => b.disabled = true); if (!ok) { const f = document.createElement("div"); f.className = "fix"; f.textContent = "Answer: " + items[x][1]; it.firstElementChild.appendChild(f); } });
        award(k, i, got); ck.remove(); const all = got === items.length; feedback(all, `You got ${got} out of ${items.length}.`, (all ? "" : "Corrections are shown in green. ") + task.fb);
        if (all) nextBtn(k, list, n, true); else tryAgain(k, list, n, "Read the corrections, then sort them again.");
      };
    } else if (task.t === "match") {
      const rights = shuffle(task.pairs.map(p => p[1]));
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p>` +
        `<div class="items${task.pairs.length > 5 ? " many" : ""}">${task.pairs.map((p, x) => `<div class="item stack"><strong>${esc(p[0])}</strong><select aria-label="${esc(p[0])}"><option value="">Choose…</option>${rights.map(y => `<option>${esc(y)}</option>`).join("")}</select></div>`).join("")}</div>${tail}`);
      const sels = [...box.querySelectorAll("select")], row = $("#mrow"), ck = document.createElement("button"); ck.className = "btn"; ck.textContent = "Check my answers"; ck.disabled = true; row.appendChild(ck); sels[0].focus();
      sels.forEach(s => s.onchange = () => ck.disabled = sels.some(x => !x.value));
      ck.onclick = () => {
        let got = 0; sels.forEach((s, x) => { const ok = s.value === task.pairs[x][1]; if (ok) got++; s.disabled = true; const it = s.parentElement; it.classList.add(ok ? "right" : "wrong"); if (!ok) { const f = document.createElement("div"); f.className = "fix"; f.textContent = "Answer: " + task.pairs[x][1]; it.appendChild(f); } });
        award(k, i, got); ck.remove(); const all = got === task.pairs.length; feedback(all, `You got ${got} out of ${task.pairs.length}.`, (all ? "" : "Corrections are shown in green. ") + task.fb);
        if (all) nextBtn(k, list, n, true); else tryAgain(k, list, n, "Read the corrections, then match them again.");
      };
    } else if (task.t === "defence") {
      const rec = prog.defence || { best: 0, attempts: 0 };
      shell(st.name, st.col, `<div class="lboard" id="lb"></div>`);
      const board = R360Defence.Defence({ best: rec.best, isBest: () => lastEnd && lastEnd.score > rec.best,
        onEnd: r => { lastEnd = r; const d = prog.defence || (prog.defence = { best: 0, attempts: 0, history: [] });
          d.attempts++; d.lastScore = r.score; d.best = Math.max(d.best, r.score); d.history = [[r.score, r.rounds, r.correct, Date.now()]].concat(d.history || []).slice(0, 10);
          prog.scenes[exp.scenes[cur].id].done[k] = true; save(); refreshSprites(); hud(); drawNav(); } });
      let lastEnd = null;
      mountBoard($("#lb"), board); window.__def = board;
    } else if (task.t === "sprint" || task.t === "blitz" || task.t === "lawgame" || task.t === "arena") {
      runSprint(k, st, task);
    } else if (BOARD_TASKS.includes(task.t)) {
      const Lg = window.R360Logic;
      shell(head, st.col, `${qn}<p class="q">${esc(task.q)}</p><div class="lboard" id="lb"></div>${tail}`);
      const board = task.t === "circuit" ? Lg.CircuitBoard({ inputs: task.inputs || Lg.vars(Lg.parse(task.expr)) })
        : task.t === "expr" ? Lg.ExprBoard({ expr: task.expr, out: task.out })
        : task.t === "table" ? Lg.TableBoard({ expr: task.expr, cols: task.cols, out: task.out, inputs: task.inputs, diagram: task.diagram })
        : R360Algo.TYPES.includes(task.t) ? R360Algo.make(task)
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
        if (res.ok) nextBtn(k, list, n, true); else tryAgain(k, list, n, "Look at what was marked, then try it again.");
      };
    } else if (task.t === "order") {
      const pool = shuffle(task.steps); let seq = [];
      /* The slots and the steps to drop into them sit side by side where there
       * is room: stacked, a pupil choosing the next step cannot see the order
       * they are building it into. */
      shell(head, st.col, `${qn}${img}<p class="q">${esc(task.q)}</p>` +
        `<div class="orderwrap"><ol class="olist" id="ol"></ol>` +
        `<div><p class="qn" id="tapl">Tap the steps in order:</p>` +
        `<div class="pool" id="pool">${pool.map(p => `<button class="opt">${esc(p)}</button>`).join("")}</div></div></div>${tail}`);
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
        const all = got === task.steps.length; feedback(all, `You got ${got} out of ${task.steps.length} in the right place.`, (all ? "" : "The correct step is shown under each one you got wrong. ") + task.fb);
        if (all) nextBtn(k, list, n, true); else tryAgain(k, list, n, "Read the corrections, then put them in order again.");
      };
    }
  }
  function finish(k) {
    const res = completeStation(k);
    if (res.review) { closeModal(); toast(res.message); return; }
    // Something on this station is still unfinished, so this is where they go.
    if (res.stillOpen) { closeModal(); openStation(k); return; }
    if (!res.sceneDone) { closeModal(); return; }
    const { sc, got, tot, nextIdx, whole } = res;
    const rows = res.rows.map(s => `<tr><td>${esc(s.name)}</td><td>${s.got} / ${s.tot} <span class="rag ${s.band}">${Store.BAND_LABEL[s.band]}</span></td></tr>`).join("");
    shell(sc.title + " complete", "#ffd046", `<p class="center q">Your score</p><div class="big">${got} / ${tot}</div>
      <p class="center">${publicDemo ? "This demo score resets when you leave. Copy it onto your worksheet if you want to keep it." : `Your score has been saved${CFG.backendUrl ? " for your teacher" : " on this device"}. Copy it onto your worksheet too.`}</p>
      <table class="bd">${rows}</table>
      ${whole.complete && exp.scenes.length > 1 ? `<p class="center"><b>Lesson complete: ${whole.score} / ${whole.total}</b></p>` : ""}
      <p class="qn">Secure = full marks. Revise = mostly right. Focus here = revise this first. Turn on review mode to retry anything you got wrong.</p>
      <div class="mrow" id="mrow">${res.anyOpen ? '<button class="btn ghost" id="rv">Review my mistakes</button>' : ""}${nextIdx >= 0 ? `<button class="btn" id="go">Go to ${esc(exp.scenes[nextIdx].title)}</button>` : `<a class="btn" href="${esc(home)}"${publicDemo ? ' target="_top"' : ''}>${publicDemo ? 'Back to home' : 'Back to topic'}</a>`}</div>`);
    const go = $("#go"); if (go) { go.focus(); go.onclick = () => { closeModal(); loadScene(nextIdx); }; }
    const rv = $("#rv"); if (rv) rv.onclick = () => { closeModal(); setReview(true); };
  }

  // ---------- toolbar ----------
  let home = "index.html";
  $("#homeBtn").onclick = () => { if (publicDemo && window.top !== window) window.top.location.href = home; else location.href = home; };
  fetch("experiences/topics.json", { cache: "no-cache" }).then(r => r.json()).then(t => { if (t.siteTitle) document.title = exp.title + " | " + t.siteTitle; }).catch(() => {});
  fetch("experiences/registry.json", { cache: "no-cache" }).then(r => r.json()).then(reg => {
    const e = (reg.experiences || []).find(x => x.id === expId);
    if (!publicDemo && e && e.topic) home = "index.html?topic=" + encodeURIComponent(e.topic);
    if (e && e.worksheet) { const a = $("#wsBtn"); a.href = e.worksheet; a.hidden = false; a.setAttribute("aria-label", "Download the worksheet for this lesson (Word document)"); }
    if (gated() && !publicDemo) guardLesson(reg, e);
  }).catch(() => {});

  /* The lesson a pupil has typed, or bookmarked, or been sent a link to.
   *
   * The Python course is worked in order, so lesson five is not open until
   * lesson four is finished. This is worked out from the answers stored for the
   * earlier lessons rather than from any claim that they are done - which is
   * also the honest limit of it: everything here runs in the pupil's own
   * browser, so it stops a pupil wandering ahead, not one determined to edit
   * their own storage. See docs/EXPERIENCE-PROTECTION.md. */
  async function guardLesson(reg, me) {
    if (!me || !me.lesson) return;
    const before = (reg.experiences || [])
      .filter(x => x.topic === me.topic && x.lesson && x.lesson < me.lesson && x.type !== "worksheet")
      .sort((a2, b2) => a2.lesson - b2.lesson);
    for (const e of before) {
      if (await Store.isComplete(e.id)) continue;
      lockedLesson(e);
      return;
    }
  }
  function lockedLesson(e) {
    closeUIAll();
    lastFocus = document.activeElement; modal.classList.add("open");
    // Set before the window is built: shell() reads this to leave out the close
    // cross, and there is nowhere for this one to be dismissed to.
    modal.dataset.locked = "1";
    shell("Not yet", "#ffd046", `<p class="q">Finish lesson ${esc(e.lesson)} first.</p>
      <p>The Python course is worked in order: each lesson opens once the one before it is
      finished. You still have work to do in <b>${esc(e.title)}</b>.</p>
      <p class="qn">Stuck on a question? Use the hint, or ask your teacher and show them the
      question and your code. Complete it before moving on.</p>
      <div class="mrow" id="mrow">
        <a class="btn" href="experience.html?id=${encodeURIComponent(e.id)}">Return to your current question</a>
        <a class="btn ghost" href="${esc(home)}">Back to the course</a></div>`);
    const go = box.querySelector(".mrow .btn"); if (go) go.focus();
  }
  function closeUIAll() { closeDrawer(); if (modal.classList.contains("open")) closeModal(); }
  $("#progBtn").onclick = () => drawer.classList.contains("progress") ? closeDrawer() : showProgress();
  $("#reviewBtn").onclick = () => setReview(!reviewMode);
  $("#reviewBtn").setAttribute("aria-pressed", reviewMode);
  const fullBtn = $("#fullBtn");
  const parentFullscreen = () => {
    try { return window.parent !== window && window.parent.document.fullscreenElement === window.frameElement; }
    catch (err) { return false; }
  };
  if (!document.documentElement.requestFullscreen && !parentFullscreen()) fullBtn.hidden = true;
  else {
    fullBtn.onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (parentFullscreen()) await window.parent.document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch (err) { /* The browser may disallow full screen in this context. */ }
    };
    const updateFullscreen = () => {
      const active = !!document.fullscreenElement || parentFullscreen();
      fullBtn.textContent = active ? "⛶ Exit full screen" : "⛶ Full screen";
      fullBtn.setAttribute("aria-pressed", String(active));
    };
    document.addEventListener("fullscreenchange", updateFullscreen);
    try { if (window.parent !== window) window.parent.document.addEventListener("fullscreenchange", updateFullscreen); }
    catch (err) { /* An external embed cannot read its parent document. */ }
  }
  /* The guides are linked from here as well as from the topic page, because the
   * moment a pupil wants them is the moment they are stuck inside a lesson, not
   * the moment they were choosing one. */
  const GUIDES = [["guides/Revise360_Python_Course_Guide.pdf", "How the Python course works"],
                  ["guides/Revise360_Python_Syntax_Guide.pdf", "Python syntax guide"]];
  $("#helpBtn").onclick = () => openDrawer(`<h2>How to use</h2><p>Drag (or use the arrow keys) to look around. Pinch or scroll to zoom.</p><p style="margin-top:8px">Tap a numbered badge to answer that station's questions. Tap a blue <b>i</b> to find out more; the panel stays open while you keep exploring.</p><p style="margin-top:8px">${publicDemo ? "Your demo progress lasts until you leave this page." : "Your progress saves automatically after every answer, so you can leave and come back later."}</p>` +
    (String(expId).startsWith("pr-") ? `<h2 style="margin-top:14px">Guides to print</h2>` +
      GUIDES.map(([f, t2]) => `<p style="margin-top:6px"><a href="${f}" download>${t2}</a> (PDF)</p>`).join("") : ""));

  Object.assign(core, {
    exp, prog, student, CFG, publicDemo, scene, cam, renderer: r, grp, mat, marks, shuffle, esc, save, hud, drawNav, refreshSprites,
    stationState, taskList, award, awardBest, asset, completeStation, markInfo, setReview, loadScene, cubeFrom, world, texFor, sameOutput,
    // The progression rule, shared so the headset uses the same one as the screen
    gated, isComplete, firstOpen, lockedStation,
    sceneHooks: [], closeUI() { closeDrawer(); if (modal.classList.contains("open")) closeModal(); }
  });
  // Live values (getters, so VR always sees the current scene and mode)
  Object.defineProperties(core, {
    cur: { get: () => cur }, sprites: { get: () => sprites }, reviewMode: { get: () => reviewMode }, home: { get: () => home } });
  window.NVRCore = core;
  document.dispatchEvent(new Event("nvr-ready"));
  // Hooks for keyboard/switch access and automated testing
  window.NVR = { openStation, goTo,
    openStationTask: (k, i) => { lastFocus = document.activeElement; modal.classList.add("open"); closeDrawer(); run(k, [i], 0); }, openModel: n => { const sp = sprites.filter(x => x.userData.type === "model")[n]; if (sp) openModel(sp.userData); }, openDiagram: n => { const sp = sprites.filter(x => x.userData.type === "diagram")[n]; if (sp) openDiagram(sp.userData); }, showInfo: n => { const sp = sprites.filter(x => x.userData.type === "info")[n]; if (sp) showInfo(sp.userData); }, setReview, loadScene };
  const go = params.get("go");
  const startScene = go ? Math.max(0, exp.scenes.findIndex(s => s.id === go.split(":")[0])) : 0;
  loadScene(startScene);
  if (go) setTimeout(() => goTo(go, reviewMode), 300);
  else if (reviewMode) toast("Review mode: stations marked Review or Focus let you retry the questions you got wrong.");
})();
