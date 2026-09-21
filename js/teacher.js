(async function () {
  const CFG = window.APP_CONFIG, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const [topicsFile, fullReg] = await Promise.all([
    fetch("experiences/topics.json").then(r => r.json()).catch(() => ({ groups: [] })),
    fetch("experiences/registry.json").then(r => r.json())]);
  if (topicsFile.siteTitle) { $("#topic").textContent = topicsFile.siteTitle; document.title = "Teacher dashboard | " + topicsFile.siteTitle; }
  const topicList = topicsFile.groups.flatMap(g => g.topics).filter(t => fullReg.experiences.some(e => e.topic === t.id));
  fullReg.experiences.filter(e => !topicList.some(t => t.id === e.topic)).forEach(e => { if (!topicList.some(t => t.id === (e.topic || "other"))) topicList.push({ id: e.topic || "other", title: e.topic ? "Topic " + e.topic : "Other" }); });
  let topicSel = topicList[0]?.id;
  const reg = { experiences: [] };
  const setTopic = id => { topicSel = id; reg.experiences = fullReg.experiences.filter(e => (e.topic || "other") === id).sort((a, b) => (a.lesson || 0) - (b.lesson || 0)); if (!reg.experiences.some(e => e.id === expSel)) expSel = reg.experiences[0]?.id; };
  const exps = {};
  await Promise.all(fullReg.experiences.map(async e => { try { exps[e.id] = await (await fetch("experiences/" + e.id + ".json")).json(); } catch (x) {} }));
  const COL = { g: "#50dc96", a: "#ffd046", r: "#ff5f5f", n: "#51607a" };
  let rows = [], students = [], cls = "", expSel;
  setTopic(topicSel);

  function keyForm(msg) {
    $("#main").innerHTML = `<form class="card signin" id="f"><h2>Teacher sign-in</h2>
      <p class="muted">Enter the teacher key you set in the Google Apps Script (see README).</p>
      <div class="field"><label for="k">Teacher key</label><input id="k" type="password" autocomplete="current-password" required></div>
      <p class="err" role="alert">${esc(msg || "")}</p><div class="row end"><button class="btn">Open dashboard</button></div></form>`;
    $("#k").focus();
    $("#f").onsubmit = e => { e.preventDefault(); sessionStorage.setItem("nvr-tk", $("#k").value); load(); };
  }

  async function load() {
    const tk = sessionStorage.getItem("nvr-tk") || "";
    if (CFG.backendUrl && !tk) return keyForm();
    $("#main").innerHTML = '<p class="muted">Loading results…</p>';
    try { rows = await Store.teacherRows(tk); }
    catch (e) { sessionStorage.removeItem("nvr-tk"); return keyForm(e.message === "bad key" ? "That key wasn't recognised." : "Couldn't reach the results sheet: " + e.message); }
    const map = {};
    for (const r of rows) {
      const s = map[r.key] = map[r.key] || { key: r.key, name: r.name, cls: r.cls, exps: {}, updated: 0 };
      const exp = exps[r.expId]; if (!exp) continue;
      const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      s.exps[r.expId] = Store.summarise(exp, data); s.updated = Math.max(s.updated, data.updated || 0);
    }
    const withData = reg.experiences.find(e => Object.values(map).some(s => s.exps[e.id]?.done));
    if (withData && !Object.values(map).some(s => s.exps[expSel]?.done)) expSel = withData.id;
    students = Object.values(map).sort((a, b) => a.cls.localeCompare(b.cls) || a.name.localeCompare(b.name));
    render();
  }

  function cell(sum) {
    if (!sum || !sum.done) return '<span class="cell" style="background:#51607a;color:#f0f4fa">—</span>';
    const tot = sum.stations.filter(x => x.done).reduce((a, x) => a + x.tot, 0);
    const b = Store.band(sum.score, tot);
    return `<span class="cell" style="background:${COL[b]}" title="${sum.done} of ${sum.count} stations done">${Math.round(sum.score / tot * 100)}%</span><br><span class="muted" style="font-size:12px">${sum.done}/${sum.count} done</span>`;
  }

  function render() {
    const classes = [...new Set([...CFG.classes, ...students.map(s => s.cls)])];
    const list = students.filter(s => !cls || s.cls === cls);
    const active = list.filter(s => Date.now() - s.updated < 7 * 864e5).length;
    // class weak areas for the selected experience
    const exp = exps[expSel]; let weakHtml = "";
    if (exp) {
      const agg = {};
      list.forEach(s => (s.exps[expSel]?.stations || []).forEach(st => {
        const id = st.scene + ":" + st.k; const a = agg[id] = agg[id] || { name: st.name, scene: st.sceneTitle, got: 0, tot: 0, n: 0, fixed: 0 };
        if (st.done) { a.got += st.got; a.tot += st.tot; a.n++; a.fixed += st.fixed; }
      }));
      const arr = Object.values(agg).filter(a => a.n).sort((a, b) => a.got / a.tot - b.got / b.tot);
      weakHtml = arr.length ? arr.map(a => { const p = Math.round(a.got / a.tot * 100), b = Store.band(a.got, a.tot);
        return `<div class="hbar"><span>${exp.scenes.length > 1 ? `<span class="muted">${esc(a.scene)}:</span> ` : ""}${esc(a.name)}<br><span class="muted" style="font-size:12px">${a.n} student${a.n > 1 ? "s" : ""}${a.fixed ? ` · ${a.fixed} questions fixed in review` : ""}</span></span><div class="bar" style="height:14px"><i style="width:${p}%;background:${COL[b]}"></i></div><b>${p}%</b></div>`; }).join("")
        : '<p class="muted">No completed stations yet for this experience.</p>';
    }
    $("#main").innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div class="row"><label for="tf" class="muted">Topic</label><select id="tf" class="btn small ghost">${topicList.map(t => `<option value="${esc(t.id)}" ${t.id === topicSel ? "selected" : ""}>${esc(t.id)} ${esc(t.title)}</option>`).join("")}</select>
        <label for="cf" class="muted">Class</label><select id="cf" class="btn small ghost">${['<option value="">All classes</option>', ...classes.map(c => `<option ${c === cls ? "selected" : ""}>${esc(c)}</option>`)].join("")}</select></div>
        <div class="row"><button class="btn small ghost" id="rf">Refresh</button><button class="btn small" id="csv">Download CSV</button></div>
      </div>
      ${CFG.backendUrl ? "" : '<p class="review-note" style="margin-top:14px">Device-only mode: showing students who signed in on this browser. Add your Apps Script URL to js/config.js to collect results from every device.</p>'}
      <section><div class="stats"><div class="stat"><span class="muted">Students</span><b>${list.length}</b></div>
        <div class="stat"><span class="muted">Active in the last 7 days</span><b>${active}</b></div>
        ${reg.experiences.map(e => { const d = list.filter(s => s.exps[e.id]?.complete).length; return `<div class="stat"><span class="muted">L${esc(e.lesson)} complete</span><b>${d} / ${list.length}</b></div>`; }).join("")}</div></section>
      <section><h2>Progress by student</h2>${list.length ? `<div class="scroll"><table class="t"><thead><tr><th>Student</th><th>Class</th>${reg.experiences.map(e => `<th>L${esc(e.lesson)}: ${esc(e.title)}</th>`).join("")}<th>Last active</th></tr></thead><tbody>
        ${list.map((s, i) => `<tr><td><button class="link" data-i="${students.indexOf(s)}">${esc(s.name)}</button></td><td>${esc(s.cls)}</td>${reg.experiences.map(e => `<td>${cell(s.exps[e.id])}</td>`).join("")}<td class="muted">${s.updated ? new Date(s.updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td></tr>`).join("")}
        </tbody></table></div>` : '<p class="muted">No results yet.</p>'}</section>
      <section><div class="row" style="justify-content:space-between"><h2 style="margin:0">Class weak areas</h2>
        <select id="ef" class="btn small ghost" aria-label="Experience">${reg.experiences.map(e => `<option value="${esc(e.id)}" ${e.id === expSel ? "selected" : ""}>L${esc(e.lesson)}: ${esc(e.title)}</option>`).join("")}</select></div>
        <p class="muted">Average first-attempt score per station, weakest first.</p><div class="card">${weakHtml}</div></section>
      <section id="detail"></section>`;
    $("#cf").onchange = e => { cls = e.target.value; render(); };
    $("#tf").onchange = e => { setTopic(e.target.value); $("#detail") && ($("#detail").innerHTML = ""); render(); };
    $("#ef").onchange = e => { expSel = e.target.value; render(); };
    $("#rf").onclick = load;
    $("#csv").onclick = () => csv(list);
    document.querySelectorAll("[data-i]").forEach(b => b.onclick = () => detail(students[+b.dataset.i]));
  }

  function detail(s) {
    const html = reg.experiences.map(e => {
      const sum = s.exps[e.id]; if (!sum) return `<h3>L${esc(e.lesson)}: ${esc(e.title)}</h3><p class="muted">Not started.</p>`;
      return `<h3>L${esc(e.lesson)}: ${esc(e.title)} <span class="muted" style="font-weight:400">${sum.score}/${sum.total}${sum.infoTotal ? ` · ${sum.infoSeen}/${sum.infoTotal} facts found` : ""}</span></h3>
        <div class="scroll"><table class="t"><tbody>${sum.stations.map(st => `<tr><td>${exps[e.id].scenes.length > 1 ? `<span class="muted">${esc(st.sceneTitle)}:</span> ` : ""}${esc(st.name)}</td><td>${st.done ? `${st.got}/${st.tot}` : ""}</td><td><span class="rag ${st.band}">${st.done ? Store.BAND_LABEL[st.band] : "Not started"}</span></td><td class="muted">${st.wrongTasks ? `${st.fixed} of ${st.wrongTasks} mistake${st.wrongTasks > 1 ? "s" : ""} fixed in review` : ""}</td></tr>`).join("")}</tbody></table></div>`;
    }).join("");
    $("#detail").innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(s.name)} · ${esc(s.cls)}</h2><button class="btn small ghost" id="cl">Close</button></div>${html}</div>`;
    $("#cl").onclick = () => $("#detail").innerHTML = "";
    $("#detail").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function csv(list) {
    const out = [["Student", "Class", "Topic", "Lesson", "Experience", "Scene", "Station", "Marks", "Out of", "Band", "Mistakes", "Fixed in review"]];
    list.forEach(s => reg.experiences.forEach(e => (s.exps[e.id]?.stations || []).forEach(st => {
      if (st.done) out.push([s.name, s.cls, e.topic, e.lesson, e.title, st.sceneTitle, st.name, st.got, st.tot, Store.BAND_LABEL[st.band], st.wrongTasks, st.fixed]);
    })));
    const text = out.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + text], { type: "text/csv" }));
    a.download = "revise360-results-" + topicSel + ".csv"; document.body.appendChild(a); a.click(); a.remove();
  }
  load();
})();
