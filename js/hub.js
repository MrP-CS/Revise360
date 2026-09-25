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

  let synced = false, statusHooked = false;

  function signIn(msg) {
    $("#who").innerHTML = ""; $("#topic").textContent = topicsFile.tagline || "";
    $("#main").innerHTML = `<form class="card signin" id="f" novalidate>
      <h2>Sign in</h2><p class="muted">Use the username and PIN on your login card. Your class is already set up for you.</p>
      <div class="field"><label for="n">Username</label><input id="n" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required maxlength="40" inputmode="text"></div>
      <div class="field"><label for="p">PIN</label><input id="p" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required autocomplete="off"></div>
      <p class="err" id="err" role="alert">${esc(msg || "")}</p>
      <div class="row end"><button class="btn" type="submit">Start</button></div>
      <p class="muted" style="font-size:13px">No card yet? Your teacher creates them. Lost yours, or forgotten the PIN? Ask your teacher for a new card: your progress stays with you.</p>
    </form>`;
    $("#n").focus();
    $("#f").onsubmit = async e => {
      e.preventDefault();
      const n = $("#n").value.trim(), p = $("#p").value.trim();
      if (!n) return $("#err").textContent = "Enter the username from your login card.";
      if (!/^\d{4,8}$/.test(p)) return $("#err").textContent = "Your PIN is the number on your login card.";
      $("#err").textContent = ""; e.submitter && (e.submitter.disabled = true);
      try { await Store.signIn(n, p); }
      catch (err) {
        e.submitter && (e.submitter.disabled = false);
        return $("#err").textContent = err && err.message ? err.message : "Couldn't sign you in. Please try again.";
      }
      if (window.R360Nav) R360Nav.refresh();
      const next = new URLSearchParams(location.search).get("next");
      if (next && /^[\w.-]+\.html/.test(next)) return location.replace(next);
      route();
    };
  }

  async function topicsPage() {
    await header();
    $("#topic").textContent = "OCR J277 · GCSE Computer Science";
    const sums = await summaries(reg.experiences.filter(e => !isWS(e)));
    const groups = topicsFile.groups.map((g, gi) => {
      const rows = g.topics.map(t => {
        const list = expsFor(t.id);
        if (!list.length) return `<div class="topic soon"><span class="code">${esc(t.id)}</span><div class="topic-copy"><h3>${esc(t.title)}</h3><p>${esc(t.description || "")}</p></div><span class="topic-state">Coming soon</span></div>`;
        let score = 0, total = 0, complete = 0, weak = 0;
        list.forEach(e => { const s = sums[e.id]; if (!s) return; score += s.score; total += s.total; if (s.complete) complete++; weak += s.stations.filter(x => x.done && x.wrongTasks > x.fixed).length; });
        const started = list.some(e => sums[e.id] && sums[e.id].done);
        const pct = Math.round(complete / list.length * 100);
        return `<a class="topic" href="?topic=${encodeURIComponent(t.id)}"><span class="code">${esc(t.id)}</span><div class="topic-copy"><h3>${esc(t.title)}</h3><p>${esc(t.description || "")}</p><div class="topic-progress"><div class="bar" role="progressbar" aria-label="${esc(t.title)} experiences complete" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><span>${complete} / ${list.length} complete${started ? ` · ${score}/${total} marks` : ""}</span>${weak ? `<span class="rag a">${weak} to review</span>` : ""}</div></div><span class="topic-action" aria-hidden="true">${started ? "Continue" : "Explore"} <span>↗</span></span></a>`;
      }).join("");
      const name = g.name.replace(/^Paper [12]:\s*/, "");
      return `<section class="paper-section"><div class="paper-heading"><span class="paper-kicker">PAPER 0${gi + 1}</span><div><h2>${esc(name)}</h2><p>${gi === 0 ? "Hardware, data, networks and security" : "Algorithms, programming and logic"}</p></div></div><div class="course-list">${rows}</div></section>`;
    }).join("");
    $("#main").innerHTML = `<div class="vrnote" id="vrnote" hidden><span>VR READY</span> This headset supports VR. Open an experience and select Enter VR.</div><div class="dashboard-intro"><p class="eyebrow">YOUR COURSE / OCR J277</p><h1>What are you revising today?</h1><p>Open an experience on a PC or tablet, or step inside with a VR headset. Choose a topic to begin.</p></div>${groups}`;
    vrNote();
  }

  // ---------- stage 2: experiences in a topic ----------
  async function topicPage(id) {
    await header();
    const t = allTopics.find(x => x.id === id) || { id, title: "Topic " + id };
    $("#topic").textContent = `${t.id} ${t.title}`;
    const list = expsFor(id), sums = await summaries(list);
    const rows = [], weak = []; let totS = 0, totT = 0, doneE = 0;
    for (const e of allFor(id)) {
      const number = e.lesson ? String(e.lesson).padStart(2, "0") : "★";
      if (isWS(e)) {
        rows.push(`<article class="exp worksheet-row"><span class="lesson-number">${number}</span><div class="body"><span class="lesson-type">Paper assessment</span><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p></div><div class="lesson-actions"><a class="btn small ghost" href="${esc(e.worksheet)}" download aria-label="Download the ${esc(e.title)} worksheet (Word document)">Download worksheet ↓</a></div></article>`);
        continue;
      }
      const sum = sums[e.id], prog = Store.get(e.id);
      if (sum) { totS += sum.score; totT += sum.total; if (sum.complete) doneE++;
        sum.stations.filter(st => st.done && st.band !== "g" && st.wrongTasks > st.fixed).forEach(st => weak.push({ e, st })); }
      const pct = sum && sum.count ? Math.round(sum.done / sum.count * 100) : 0, band = bandOf(sum);
      const started = sum && (sum.done > 0 || Object.values(prog?.scenes || {}).some(sc => Object.keys(sc.ans || {}).length));
      const hasWeak = sum && sum.stations.some(st => st.done && st.wrongTasks > st.fixed);
      const kind = e.sprint || e.badge ? "Challenge" : "360° experience";
      rows.push(`<article class="exp"><span class="lesson-number">${number}</span><button class="thumb" type="button" data-description="${esc(e.id)}" aria-label="Enlarge the description of ${esc(e.title)}"><span class="thumb-copy">${esc(e.description || "")}</span></button><div class="body"><span class="lesson-type">${kind}</span><h3>${esc(e.title)}</h3>
        ${sum && e.sprint ? `<div class="lesson-meta">${sum.sprint ? `Personal best ${sum.sprint.best} · ${sum.sprint.attempts} ${sum.sprint.attempts === 1 ? "try" : "tries"}` : "Set your first score"}</div>` :
        sum ? `<div class="lesson-meta"><span>${sum.done}/${sum.count} stations · ${sum.score}/${sum.total} marks${sum.infoTotal ? ` · ${sum.infoSeen}/${sum.infoTotal} facts` : ""}</span><span class="rag ${band}">${sum.done ? Store.BAND_LABEL[band] : "Not started"}</span><div class="bar" role="progressbar" aria-label="${esc(e.title)} stations complete" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>` : '<span class="err">Could not load this experience.</span>'}</div>
        <div class="lesson-actions"><a class="btn small" href="experience.html?id=${encodeURIComponent(e.id)}">${sum && sum.complete ? "Open" : started ? "Continue" : "Start"} <span aria-hidden="true">↗</span></a>
        ${hasWeak ? `<a class="quiet-link" href="experience.html?id=${encodeURIComponent(e.id)}&review=1">Review mistakes</a>` : ""}
        ${e.worksheet ? `<a class="quiet-link" href="${esc(e.worksheet)}" download aria-label="Download the ${esc(e.title)} worksheet (Word document)">Worksheet ↓</a>` : ""}
        ${e.powerpoint ? `<a class="quiet-link" href="${esc(e.powerpoint)}" download aria-label="Download the ${esc(e.title)} lesson PowerPoint (PPTX)">Lesson PowerPoint ↓</a>` : ""}</div></article>`);
    }
    weak.sort((a, b) => (a.st.got / a.st.tot) - (b.st.got / b.st.tot));
    $("#main").innerHTML = `<a class="crumb" href="?">← All topics</a>
      <div class="topic-intro"><div><p class="eyebrow">TOPIC ${esc(t.id)} / OCR J277</p><h1>${esc(t.title)}</h1><p>${esc(t.description || "")}</p></div><span class="topic-count">${list.length} experiences</span></div>
      ${list.length ? `<div class="topic-summary"><div><span>Experiences complete</span><strong>${doneE} / ${list.length}</strong></div><div><span>Marks so far</span><strong>${totS} / ${totT}</strong></div><div><span>Areas to review</span><strong>${weak.length}</strong></div></div>
      <section class="learning-section"><div class="section-title"><span>YOUR LEARNING PATH</span><h2>Experiences and assessments</h2></div><div class="learning-list">${rows.join("")}</div></section>
      <section class="review-section"><div class="section-title"><span>NEXT STEPS</span><h2>My areas to work on</h2></div>${weak.length ? `<div class="weak">${weak.map(w => `<a href="experience.html?id=${encodeURIComponent(w.e.id)}&review=1&go=${encodeURIComponent(w.st.scene + ":" + w.st.k)}"><span><span class="muted">${w.e.lesson ? `Lesson ${esc(w.e.lesson)} · ` : ""}${esc(w.st.sceneTitle)}</span><br>${esc(w.st.name)}</span><span>${w.st.got}/${w.st.tot} <span class="rag ${w.st.band}">${Store.BAND_LABEL[w.st.band]}</span></span></a>`).join("")}</div>`
        : '<p class="muted">Nothing to review yet. Stations where you drop marks will appear here, with a link straight to the questions to retry.</p>'}</section>`
      : '<p class="muted">There are no experiences for this topic yet. Check back soon.</p>'}`;
  }

  function vrNote() {
    const n = $("#vrnote"); if (!n || !navigator.xr) return;
    navigator.xr.isSessionSupported("immersive-vr").then(ok => { if (ok) n.hidden = false; }).catch(() => {});
  }
  async function header() {
    const s = Store.student();
    $("#who").innerHTML = `<span class="sync" id="sync"></span><span class="student-name">${esc(s.name)}${s.cls ? ` · ${esc(s.cls)}` : ""}</span><button class="quiet-link signout" id="out">Sign out</button>`;
    $("#out").onclick = () => { Store.signOut(); synced = false; history.replaceState(null, "", location.pathname); signIn(); if (window.R360Nav) R360Nav.refresh(); };
    const labels = { local: "Saved on this device", saved: "Progress synced ✓", syncing: "Syncing…", pending: "Syncing…", offline: "Offline: progress saved on this device", idle: "" };
    if (!statusHooked) { statusHooked = true; Store.onStatus(st => { const el = $("#sync"); if (el) el.textContent = labels[st] || ""; }); }
    if (!synced) { synced = true; $("#main").innerHTML = '<p class="muted">Loading…</p>'; await Store.pull(); await Store.flushQueue(); }
  }

  function route() {
    if (!Store.student()) return signIn();
    const t = new URLSearchParams(location.search).get("topic");
    t ? topicPage(t) : topicsPage();
  }
  // Topic links update the address without reloading, so the browser Back button still works
  document.addEventListener("click", e => {
    const thumb = e.target.closest("button[data-description]");
    if (thumb) {
      const experience = reg.experiences.find(x => x.id === thumb.dataset.description);
      const dialog = $("#descriptionDialog");
      if (experience && dialog) {
        $("#descriptionTitle").textContent = experience.title;
        $("#descriptionText").textContent = experience.description || "";
        dialog.showModal();
        $("#descriptionClose").focus();
      }
      return;
    }
    const a = e.target.closest("a"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute("download")) return;
    const u = new URL(a.getAttribute("href"), location.href);
    if (u.origin === location.origin && u.pathname === location.pathname) { e.preventDefault(); history.pushState(null, "", u.search || location.pathname); route(); scrollTo(0, 0); }
  });
  addEventListener("popstate", route);
  $("#descriptionClose").addEventListener("click", () => $("#descriptionDialog").close());
  $("#descriptionDialog").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  route();
})();
