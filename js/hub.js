(async function () {
  const CFG = window.APP_CONFIG, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const [topicsFile, reg] = await Promise.all([
    fetch("experiences/topics.json", { cache: "no-cache" }).then(r => r.json()).catch(() => ({ groups: [] })),
    fetch("experiences/registry.json", { cache: "no-cache" }).then(r => r.json())
  ]);
  const title = topicsFile.siteTitle || CFG.siteTitle;
  $("#siteTitle").textContent = title; document.title = title;
  // Experiences whose topic isn't listed in topics.json still appear, under "Other"
  const listed = topicsFile.groups.flatMap(g => g.topics);
  const orphanIds = [...new Set(reg.experiences.filter(e => !listed.some(t => t.id === e.topic)).map(e => e.topic || "other"))];
  if (orphanIds.length) topicsFile.groups.push({ name: "Other", topics: orphanIds.map(id => ({ id, title: id === "other" ? "Other experiences" : "Topic " + id, description: "" })) });
  const allTopics = topicsFile.groups.flatMap(g => g.topics);
  const isWS = e => e.type === "worksheet";
  const expsFor = id => reg.experiences.filter(e => (e.topic || "other") === id && !isWS(e))
  const allFor = id => reg.experiences.filter(e => (e.topic || "other") === id).sort((a, b) => (a.lesson || 0) - (b.lesson || 0)).sort((a, b) => (a.lesson || 0) - (b.lesson || 0));
  const next = new URLSearchParams(location.search).get("next");

  const loaded = {};
  async function loadExp(id) { if (!(id in loaded)) { try { loaded[id] = await (await fetch("experiences/" + id + ".json", { cache: "no-cache" })).json(); } catch (e) { loaded[id] = null; } } return loaded[id]; }
  async function summaries(list) {
    const out = {};
    await Promise.all(list.map(async e => { const exp = await loadExp(e.id); out[e.id] = exp ? Store.summarise(exp, Store.get(e.id)) : null; }));
    return out;
  }
  const bandOf = sum => sum && sum.done ? Store.band(sum.score, sum.stations.filter(x => x.done).reduce((a, x) => a + x.tot, 0)) : "n";

  // A teacher can share a link like index.html?school=K7M3QP so students don't have to type it
  function prefillSchool() {
    const q = new URLSearchParams(location.search).get("school");
    if (q) { try { localStorage.setItem("nvr:v1:school", JSON.stringify(q.toUpperCase())); } catch (e) {} return q.toUpperCase(); }
    try { return JSON.parse(localStorage.getItem("nvr:v1:school") || '""'); } catch (e) { return ""; }
  }

  function signIn() {
    $("#who").innerHTML = ""; $("#topic").textContent = topicsFile.tagline || "";
    $("#main").innerHTML = `<form class="card signin" id="f" novalidate>
      <h2>Sign in</h2><p class="muted">Use the same username, class and PIN every time so your progress follows you to any device.</p>
      <div class="field"><label for="n">School username</label><input id="n" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required maxlength="60"></div>
      <div class="field"><label for="c">Class or group <span class="muted">(optional)</span></label><select id="c"><option value="">Not set</option>${CFG.classes.map(c => `<option>${esc(c)}</option>`).join("")}<option value="__other">Other…</option></select></div>
      <div class="field" id="cwrap" hidden><label for="c2">Type your class or group</label><input id="c2" maxlength="24" autocapitalize="characters"></div>
      <div class="field"><label for="p">4-digit PIN (make one up and remember it)</label><input id="p" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></div>
      <div class="field"><label for="sc">School code <span class="muted">(from your teacher)</span></label><input id="sc" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="e.g. K7M3QP" value="${esc(prefillSchool())}"></div>
      <p class="err" id="err" role="alert"></p>
      <div class="row end"><button class="btn" type="submit">Start</button></div>
      ${CFG.backendUrl ? "" : '<p class="muted" style="font-size:13px">This site is in device-only mode: progress is saved in this browser only.</p>'}
    </form>`;
    $("#n").focus();
    $("#c").onchange = () => { const w = $("#cwrap"); w.hidden = $("#c").value !== "__other"; if (!w.hidden) $("#c2").focus(); };
    $("#f").onsubmit = async e => {
      e.preventDefault();
      const n = $("#n").value.trim(), c = $("#c").value, p = $("#p").value.trim(), sc = $("#sc").value.trim().toUpperCase();
      if (!/^[A-Za-z0-9._@-]{2,60}$/.test(n)) return $("#err").textContent = "Please enter your school username, with no spaces.";
      const cls = c === "__other" ? ($("#c2").value.trim() || "") : c;
      if (!/^\d{4}$/.test(p)) return $("#err").textContent = "Your PIN must be 4 digits.";
      $("#err").textContent = ""; e.submitter && (e.submitter.disabled = true);
      await Store.signIn(n, cls, p, sc);
      if (next && /^experience\.html\?/.test(next)) location.href = next; else route();
    };
  }

  let synced = false, statusHooked = false;
  async function header() {
    const s = Store.student();
    $("#who").innerHTML = `<span class="sync" id="sync"></span><span>${esc(s.name)}${s.cls ? " · " + esc(s.cls) : ""}</span><button class="btn small ghost" id="out">Sign out</button>`;
    if (window.R360Nav) R360Nav.refresh();
    $("#out").onclick = () => { Store.signOut(); synced = false; history.replaceState(null, "", location.pathname); signIn(); if (window.R360Nav) R360Nav.refresh(); };
    const labels = { local: "Saved on this device", saved: "Progress synced ✓", syncing: "Syncing…", pending: "Syncing…", offline: "Offline: progress saved on this device", idle: "" };
    if (!statusHooked) { statusHooked = true; Store.onStatus(st => { const el = $("#sync"); if (el) el.textContent = labels[st] || ""; }); }
    if (!synced) { synced = true; $("#main").innerHTML = '<p class="muted">Loading…</p>'; await Store.pull(); await Store.flushQueue(); }
  }

  // ---------- stage 1: choose a topic ----------
  async function topicsPage() {
    await header();
    $("#topic").textContent = topicsFile.tagline || "";
    const sums = await summaries(reg.experiences.filter(e => !isWS(e)));
    const groups = topicsFile.groups.map(g => {
      const cards = g.topics.map(t => {
        const list = expsFor(t.id);
        if (!list.length) return `<div class="topic soon" aria-disabled="true"><span class="code">${esc(t.id)}</span><h3>${esc(t.title)}</h3><p>${esc(t.description || "")}</p><div class="meta"><span>Coming soon</span></div></div>`;
        let score = 0, total = 0, complete = 0, weak = 0;
        list.forEach(e => { const s = sums[e.id]; if (!s) return; score += s.score; total += s.total; if (s.complete) complete++; weak += s.stations.filter(x => x.done && x.wrongTasks > x.fixed).length; });
        const started = list.some(e => sums[e.id] && sums[e.id].done);
        const pct = Math.round(complete / list.length * 100);
        return `<a class="topic" href="?topic=${encodeURIComponent(t.id)}"><span class="code">${esc(t.id)}</span><h3>${esc(t.title)}</h3><p>${esc(t.description || "")}</p>
          <div class="meta"><span>${list.length} experience${list.length > 1 ? "s" : ""} · ${complete} complete${started ? ` · ${score}/${total} marks` : ""}</span>${weak ? `<span class="rag a">${weak} to review</span>` : ""}</div>
          <div class="bar" role="progressbar" aria-label="Experiences complete" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></a>`;
      }).join("");
      return `<h2 class="group">${esc(g.name)}</h2><div class="topics">${cards}</div>`;
    }).join("");
    setTimeout(vrNote, 0);
    $("#main").innerHTML = `<div class="vrnote" id="vrnote" hidden>🥽 <span>This headset supports VR. Open any experience and press <b>Enter VR</b>.</span></div><h2 style="margin:0 0 4px">Choose a topic</h2><p class="muted" style="margin:0">Pick a topic to see its 360° experiences.</p>${groups}`;
  }

  // ---------- stage 2: experiences in a topic ----------
  async function topicPage(id) {
    await header();
    const t = allTopics.find(x => x.id === id) || { id, title: "Topic " + id };
    $("#topic").textContent = `${t.id} ${t.title}`;
    const list = expsFor(id), sums = await summaries(list);
    const cards = [], weak = []; let totS = 0, totT = 0, doneE = 0;
    for (const e of allFor(id)) {
      if (isWS(e)) {
        cards.push(`<article class="exp"><div class="thumb ws"><span>Lesson ${esc(e.lesson)}</span><b>📝</b></div><div class="body"><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
          <div class="row"><a class="btn small" href="${esc(e.worksheet)}" download aria-label="Download the ${esc(e.title)} worksheet (Word document)">⬇ Worksheet</a></div></div></article>`);
        continue;
      }
      const sum = sums[e.id], prog = Store.get(e.id);
      if (sum) { totS += sum.score; totT += sum.total; if (sum.complete) doneE++;
        sum.stations.filter(st => st.done && st.band !== "g" && st.wrongTasks > st.fixed).forEach(st => weak.push({ e, st })); }
      const pct = sum && sum.count ? Math.round(sum.done / sum.count * 100) : 0, band = bandOf(sum);
      const started = sum && (sum.done > 0 || Object.values(prog?.scenes || {}).some(sc => Object.keys(sc.ans || {}).length));
      const hasWeak = sum && sum.stations.some(st => st.done && st.wrongTasks > st.fixed);
      cards.push(`<article class="exp"><div class="thumb" style="background-image:url('experiences/${esc(e.thumb)}')">${e.badge ? `<span>${esc(e.badge)}</span>` : e.lesson ? `<span>Lesson ${esc(e.lesson)}</span>` : ""}</div>
        <div class="body"><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
        ${sum && e.sprint ? `<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:13px">${sum.sprint ? `Personal best <b style="color:var(--edge)">${sum.sprint.best}</b> · ${sum.sprint.attempts} ${sum.sprint.attempts === 1 ? "try" : "tries"}` : "Set your first score"}</span><span class="rag ${sum.sprint ? "g" : "n"}">${sum.sprint ? "🏁 Played" : "Not started"}</span></div>` :
        sum ? `<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:13px">${sum.done}/${sum.count} stations · ${sum.score}/${sum.total} marks${sum.infoTotal ? ` · ${sum.infoSeen}/${sum.infoTotal} facts` : ""}</span><span class="rag ${band}">${sum.done ? Store.BAND_LABEL[band] : "Not started"}</span></div>
        <div class="bar" role="progressbar" aria-label="Stations complete" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>` : '<p class="err">Could not load this experience.</p>'}
        <div class="row"><a class="btn small" href="experience.html?id=${encodeURIComponent(e.id)}">${sum && sum.complete ? "Open" : started ? "Continue" : "Start"}</a>
        ${hasWeak ? `<a class="btn small ghost" href="experience.html?id=${encodeURIComponent(e.id)}&review=1">Review mistakes</a>` : ""}
        ${e.worksheet ? `<a class="btn small ghost" href="${esc(e.worksheet)}" download aria-label="Download the ${esc(e.title)} worksheet (Word document)">⬇ Worksheet</a>` : ""}</div></div></article>`);
    }
    weak.sort((a, b) => (a.st.got / a.st.tot) - (b.st.got / b.st.tot));
    $("#main").innerHTML = `<a class="crumb" href="?">← All topics</a>
      <h2 style="margin:0 0 16px">${esc(t.id)} ${esc(t.title)}</h2>
      ${list.length ? `<div class="stats">
        <div class="stat"><span class="muted">Experiences complete</span><b>${doneE} / ${list.length}</b></div>
        <div class="stat"><span class="muted">Total marks</span><b>${totS} / ${totT}</b></div>
        <div class="stat"><span class="muted">Areas to review</span><b>${weak.length}</b></div></div>
      <section><h2>Experiences</h2><div class="grid">${cards.join("")}</div></section>
      <section><h2>My areas to work on</h2>${weak.length ? `<div class="weak">${weak.map(w => `<a href="experience.html?id=${encodeURIComponent(w.e.id)}&review=1&go=${encodeURIComponent(w.st.scene + ":" + w.st.k)}"><span><span class="muted">${w.e.lesson ? `Lesson ${esc(w.e.lesson)} · ` : ""}${esc(w.st.sceneTitle)}</span><br>${esc(w.st.name)}</span><span>${w.st.got}/${w.st.tot} <span class="rag ${w.st.band}">${Store.BAND_LABEL[w.st.band]}</span></span></a>`).join("")}</div>`
        : '<p class="muted">Nothing to review yet. Stations where you drop marks will appear here, with a link straight to the questions to retry.</p>'}</section>`
      : '<p class="muted">There are no experiences for this topic yet. Check back soon.</p>'}`;
  }

  function vrNote() {
    const n = $("#vrnote"); if (!n || !navigator.xr) return;
    navigator.xr.isSessionSupported("immersive-vr").then(ok => { if (ok) n.hidden = false; }).catch(() => {});
  }
  function route() {
    if (!Store.student()) return signIn();
    const t = new URLSearchParams(location.search).get("topic");
    t ? topicPage(t) : topicsPage();
  }
  // Topic links update the address without reloading, so the browser Back button still works
  document.addEventListener("click", e => {
    const a = e.target.closest("a"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute("download")) return;
    const u = new URL(a.getAttribute("href"), location.href);
    if (u.origin === location.origin && u.pathname === location.pathname) { e.preventDefault(); history.pushState(null, "", u.search || location.pathname); route(); scrollTo(0, 0); }
  });
  addEventListener("popstate", route);
  route();
})();
