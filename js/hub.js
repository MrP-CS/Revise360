(async function () {
  const CFG = window.APP_CONFIG, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  $("#siteTitle").textContent = CFG.siteTitle;
  const reg = await (await fetch("experiences/registry.json")).json();
  $("#topic").textContent = reg.topic || "";
  const next = new URLSearchParams(location.search).get("next");

  function signIn() {
    $("#who").innerHTML = "";
    $("#main").innerHTML = `<form class="card signin" id="f" novalidate>
      <h2>Sign in</h2><p class="muted">Use the same name, class and PIN every time so your progress follows you to any device.</p>
      <div class="field"><label for="n">First name and surname</label><input id="n" autocomplete="name" required maxlength="60"></div>
      <div class="field"><label for="c">Class</label><select id="c" required><option value="">Choose your class…</option>${CFG.classes.map(c => `<option>${esc(c)}</option>`).join("")}</select></div>
      <div class="field"><label for="p">4-digit PIN (make one up and remember it)</label><input id="p" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></div>
      <p class="err" id="err" role="alert"></p>
      <div class="row end"><button class="btn" type="submit">Start</button></div>
      ${CFG.backendUrl ? "" : '<p class="muted" style="font-size:13px">This site is in device-only mode: progress is saved in this browser only.</p>'}
    </form>`;
    $("#n").focus();
    $("#f").onsubmit = async e => {
      e.preventDefault();
      const n = $("#n").value.trim(), c = $("#c").value, p = $("#p").value.trim();
      if (n.split(/\s+/).length < 2) return $("#err").textContent = "Please enter your first name and surname.";
      if (!c) return $("#err").textContent = "Please choose your class.";
      if (!/^\d{4}$/.test(p)) return $("#err").textContent = "Your PIN must be 4 digits.";
      $("#err").textContent = ""; e.submitter && (e.submitter.disabled = true);
      await Store.signIn(n, c, p);
      if (next && /^experience\.html\?/.test(next)) location.href = next; else home();
    };
  }

  const exps = {};
  async function loadExp(id) { if (!exps[id]) { try { exps[id] = await (await fetch("experiences/" + id + ".json")).json(); } catch (e) { exps[id] = null; } } return exps[id]; }

  async function home() {
    const s = Store.student();
    $("#who").innerHTML = `<span class="sync" id="sync"></span><span>${esc(s.name)} · ${esc(s.cls)}</span><button class="btn small ghost" id="out">Sign out</button>`;
    $("#out").onclick = () => { Store.signOut(); signIn(); };
    const labels = { local: "Saved on this device", saved: "Progress synced ✓", syncing: "Syncing…", pending: "Syncing…", offline: "Offline: progress saved on this device", idle: "" };
    Store.onStatus(st => { const el = $("#sync"); if (el) el.textContent = labels[st] || ""; });
    $("#main").innerHTML = '<p class="muted">Loading…</p>';
    await Store.pull(); await Store.flushQueue();
    const cards = [], weak = []; let totS = 0, totT = 0, doneE = 0;
    for (const e of reg.experiences) {
      const exp = await loadExp(e.id); const prog = Store.get(e.id);
      const sum = exp ? Store.summarise(exp, prog) : null;
      if (sum) { totS += sum.score; totT += sum.total; if (sum.complete) doneE++;
        sum.stations.filter(st => st.done && (st.band !== "g") && st.wrongTasks > st.fixed).forEach(st => weak.push({ e, st })); }
      const pct = sum && sum.count ? Math.round(sum.done / sum.count * 100) : 0;
      const band = sum && sum.done ? Store.band(sum.score, sum.stations.filter(x => x.done).reduce((a, x) => a + x.tot, 0)) : "n";
      const started = sum && (sum.done > 0 || Object.values(prog?.scenes || {}).some(sc => Object.keys(sc.ans || {}).length));
      const hasWeak = sum && sum.stations.some(st => st.done && st.wrongTasks > st.fixed);
      cards.push(`<article class="exp"><div class="thumb" style="background-image:url('experiences/${esc(e.thumb)}')"><span>Lesson ${esc(e.lesson)}</span></div>
        <div class="body"><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
        ${sum ? `<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:13px">${sum.done}/${sum.count} stations · ${sum.score}/${sum.total} marks${sum.infoTotal ? ` · ${sum.infoSeen}/${sum.infoTotal} facts` : ""}</span><span class="rag ${band}">${sum.done ? Store.BAND_LABEL[band] : "Not started"}</span></div>
        <div class="bar" role="progressbar" aria-label="Stations complete" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>` : '<p class="err">Could not load this experience.</p>'}
        <div class="row"><a class="btn small" href="experience.html?id=${encodeURIComponent(e.id)}">${sum && sum.complete ? "Open" : started ? "Continue" : "Start"}</a>
        ${hasWeak ? `<a class="btn small ghost" href="experience.html?id=${encodeURIComponent(e.id)}&review=1">Review mistakes</a>` : ""}
        ${e.worksheet ? `<a class="btn small ghost" href="${esc(e.worksheet)}" download aria-label="Download the Lesson ${esc(e.lesson)} worksheet (Word document)">⬇ Worksheet</a>` : ""}</div></div></article>`);
    }
    weak.sort((a, b) => (a.st.got / a.st.tot) - (b.st.got / b.st.tot));
    $("#main").innerHTML = `<section style="margin-top:0"><div class="stats">
        <div class="stat"><span class="muted">Experiences complete</span><b>${doneE} / ${reg.experiences.length}</b></div>
        <div class="stat"><span class="muted">Total marks</span><b>${totS} / ${totT}</b></div>
        <div class="stat"><span class="muted">Areas to review</span><b>${weak.length}</b></div></div></section>
      <section><h2>Experiences</h2><div class="grid">${cards.join("")}</div></section>
      <section><h2>My areas to work on</h2>${weak.length ? `<div class="weak">${weak.map(w => `<a href="experience.html?id=${encodeURIComponent(w.e.id)}&review=1&go=${encodeURIComponent(w.st.scene + ":" + w.st.k)}"><span><span class="muted">Lesson ${esc(w.e.lesson)} · ${esc(w.st.sceneTitle)}</span><br>${esc(w.st.name)}</span><span>${w.st.got}/${w.st.tot} <span class="rag ${w.st.band}">${Store.BAND_LABEL[w.st.band]}</span></span></a>`).join("")}</div>`
        : '<p class="muted">Nothing to review yet. Stations where you drop marks will appear here, with a link straight to the questions to retry.</p>'}</section>`;
  }
  Store.student() ? home() : signIn();
})();
