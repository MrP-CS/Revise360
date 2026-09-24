// Class logins: a teacher pastes a list of usernames, the server generates PINs,
// and this prints login cards. Added to the teacher dashboard.
(function () {
  const CFG = window.APP_CONFIG;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tk = () => sessionStorage.getItem("nvr-tk") || "";
  let lastCreated = null;   // cards to offer after the list reloads
  let csv = null;           // { rows: [[..]], header: bool }

  // Small CSV reader: handles quoted fields, commas inside quotes, and CRLF
  function parseCsv(text) {
    const rows = []; let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') q = false;
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.map(r => r.map(x => x.trim())).filter(r => r.some(x => x));
  }
  const looksLikeHeader = r => r.some(c => /^(user ?name|username|login|user|upn|email|class|group|form|reg|year|name)$/i.test(c));
  const guessCol = (header, words) => header.findIndex(h => words.some(w => h.toLowerCase().includes(w)));

  async function api(body) {
    const r = await fetch(CFG.backendUrl, { method: "POST", body: JSON.stringify(Object.assign({ teacherKey: tk() }, body)) });
    if (r.status === 403) throw new Error("bad key");
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "server error");
    return j;
  }

  function cardsHtml(students, schoolCode) {
    const link = location.origin + location.pathname.replace(/teacher\.html$/, "") + "?school=" + schoolCode;
    return `<div class="cards-print">${students.map(s => `
      <div class="lcard">
        <div class="lc-top"><b>Revise 360</b><span>${esc(s.cls || "")}</span></div>
        <div class="lc-name">${esc(s.name)}</div>
        <table class="lc-t">
          <tr><td>Username</td><th>${esc(s.name)}</th></tr>
          <tr><td>Class</td><th>${esc(s.cls || "— leave blank —")}</th></tr>
          <tr><td>PIN</td><th class="pin">${esc(s.pin)}</th></tr>
          <tr><td>School code</td><th>${esc(schoolCode)}</th></tr>
        </table>
        <div class="lc-foot">${esc(link)}<br>Keep this card. Your PIN can't be looked up.</div>
      </div>`).join("")}</div>`;
  }

  const cardPage = (students, schoolCode) => `<!doctype html><html><head><meta charset="utf-8"><title>Revise 360 login cards</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;margin:12mm;color:#111}
        h1{font-size:16pt;margin:0 0 2mm}
        p.note{font-size:9pt;color:#555;margin:0 0 6mm}
        .cards-print{display:grid;grid-template-columns:repeat(2,1fr);gap:6mm}
        .lcard{border:1.5pt dashed #888;border-radius:3mm;padding:5mm;break-inside:avoid}
        .lc-top{display:flex;justify-content:space-between;font-size:9pt;color:#555;margin-bottom:2mm}
        .lc-name{font-size:13pt;font-weight:bold;margin-bottom:2mm}
        .lc-t{width:100%;border-collapse:collapse;font-size:10.5pt}
        .lc-t td{color:#555;padding:1mm 0;width:32%}
        .lc-t th{text-align:left;padding:1mm 0}
        .lc-t th.pin{font-size:15pt;letter-spacing:2pt}
        .lc-foot{margin-top:3mm;font-size:8pt;color:#666}
        @media print{@page{margin:10mm}}
      </style></head><body>
      <h1>Revise 360 login cards${students[0] && students[0].cls ? " — " + students[0].cls : ""}</h1>
      <p class="note">Cut along the dashed lines and hand one to each student, or share this file on Teams or Google Classroom. PINs can't be looked up by students: if a card is lost, the teacher reprints it or resets the PIN.</p>
      ${cardsHtml(students, schoolCode)}
      </body></html>`;

  // Save the cards as a file a teacher can post on Teams, Google Classroom or a shared drive
  function saveCards(students, schoolCode) {
    const blob = new Blob([cardPage(students, schoolCode)], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Revise360-logins" + (students[0] && students[0].cls ? "-" + students[0].cls.replace(/\s+/g, "") : "") + ".html";
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Plain text for pasting into a Teams post or an email
  function copyList(students, schoolCode, btn) {
    const link = location.origin + location.pathname.replace(/teacher\.html$/, "") + "?school=" + schoolCode;
    const text = `Revise 360 logins${students[0] && students[0].cls ? " — " + students[0].cls : ""}\nSign in at ${link}\nSchool code: ${schoolCode}\n\n`
      + students.map(s => `${s.name}   PIN ${s.pin}${s.cls ? "   class " + s.cls : ""}`).join("\n")
      + "\n\nKeep your PIN safe. If you lose it, ask your teacher for a new card.";
    navigator.clipboard.writeText(text).then(() => { if (btn) { const t = btn.textContent; btn.textContent = "Copied"; setTimeout(() => btn.textContent = t, 1500); } },
      () => alert(text));
  }

  function printCards(students, schoolCode) {
    const w = window.open("", "_blank");
    if (!w) return alert("Your browser blocked the print window. Allow pop-ups for this site and try again.");
    w.document.write(cardPage(students, schoolCode));
    w.document.close();
    setTimeout(() => w.print(), 300);
  }

  function render(host, data) {
    const byClass = {};
    (data.students || []).forEach(s => { (byClass[s.cls || "No class"] = byClass[s.cls || "No class"] || []).push(s); });
    host.innerHTML = `
      <div class="row" style="justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px">
        <div><h2 style="margin:0">Class logins</h2>
          <p class="muted" style="margin:4px 0">Your school code is <code>${esc(data.schoolCode || "")}</code>. Students need it once, or use the link on their card.</p></div>
        <label class="row" style="gap:8px;align-items:center;font-size:14px">
          <input type="checkbox" id="enforce" ${data.enforce ? "checked" : ""}>
          Only students on this list may sign in
        </label>
      </div>

      <form class="card" id="addf" style="margin:12px 0">
        <div class="row" style="gap:12px;flex-wrap:wrap">
          <div class="field" style="flex:1;min-width:200px"><label for="ncls">Class or group</label><input id="ncls" maxlength="40" placeholder="11A" autocapitalize="characters"></div>
        </div>
        <div class="field"><label for="names">Usernames, one per line</label>
          <textarea id="names" rows="6" placeholder="24smithj&#10;24jonesa&#10;24patelr"></textarea></div>
        <div class="field">
          <label for="csvfile">…or import a CSV exported from your MIS</label>
          <input type="file" id="csvfile" accept=".csv,text/csv">
          <p class="muted" style="font-size:13px;margin:6px 0 0">Nothing is uploaded: the file is read in your browser, and only the usernames you confirm are sent.</p>
        </div>
        <div id="csvpick"></div>
        <p class="muted" style="font-size:13px">PINs are generated for you. Students can't change them; you can reset one at any time.</p>
        <p class="err" id="aerr" role="alert"></p>
        <div class="row end"><button class="btn" type="submit" id="addgo">Create logins</button></div>
      </form>

      <div id="newcards">${lastCreated ? `<div class="callout"><p><b>${lastCreated.students.length} login${lastCreated.students.length === 1 ? "" : "s"} ready.</b> Print the cards, or save them to share on Teams or Google Classroom. You can do either again later from the class list.</p>
        <p><button class="btn" id="pnow">🖨 Print cards</button> <button class="btn ghost" id="snow">💾 Save as a file</button> <button class="btn ghost" id="cnow">📋 Copy as a list</button> <button class="btn ghost" id="pdone">Done</button></p></div>` : ""}</div>

      ${Object.keys(byClass).sort().map(cls => `
        <h3 style="margin:18px 0 6px">${esc(cls)} <span class="muted" style="font-weight:400">· ${byClass[cls].length} student${byClass[cls].length === 1 ? "" : "s"}</span>
          <button class="btn small ghost" data-print="${esc(cls)}">🖨 Print cards</button>
          <button class="btn small ghost" data-save="${esc(cls)}">💾 Save</button>
          <button class="btn small ghost" data-copy="${esc(cls)}">📋 Copy</button></h3>
        <table class="roster"><tr><th>Username</th><th>PIN</th><th>Started</th><th>Last seen</th><th></th></tr>
          ${byClass[cls].map(s => `<tr>
            <td>${esc(s.name)}</td>
            <td>${s.pin ? `<code>${esc(s.pin)}</code>` : '<span class="muted">chosen by student</span>'}</td>
            <td>${s.started ? s.started + " experience" + (s.started === 1 ? "" : "s") : '<span class="muted">not yet</span>'}</td>
            <td>${s.last_seen ? new Date(Number(s.last_seen)).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</td>
            <td><button class="btn small ghost" data-reset="${esc(s.key)}">Reset PIN</button>
                <button class="btn small ghost" data-del="${esc(s.key)}" title="Delete this student and their progress">Remove</button></td>
          </tr>`).join("")}
        </table>`).join("") || '<p class="muted">No logins yet. Paste your class list above to create them.</p>'}`;

    $("#csvfile").onchange = async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const rows = parseCsv(await file.text());
      if (!rows.length) { $("#csvpick").innerHTML = '<p class="err">That file looked empty.</p>'; return; }
      csv = { rows, header: looksLikeHeader(rows[0]) };
      const head = csv.header ? csv.rows[0] : csv.rows[0].map((_, i) => "Column " + (i + 1));
      const uGuess = Math.max(0, guessCol(head, ["user", "login", "upn", "email"]));
      const cGuess = guessCol(head, ["class", "group", "form", "reg", "set"]);
      $("#csvpick").innerHTML = `<div class="callout" style="margin:10px 0">
        <p><b>${file.name}</b> · ${csv.rows.length - (csv.header ? 1 : 0)} rows</p>
        <div class="row" style="gap:12px;flex-wrap:wrap">
          <div class="field" style="flex:1;min-width:180px"><label for="ucol">Username column</label>
            <select id="ucol">${head.map((h, i) => `<option value="${i}" ${i === uGuess ? "selected" : ""}>${esc(h)}</option>`).join("")}</select></div>
          <div class="field" style="flex:1;min-width:180px"><label for="ccol">Class column <span class="muted">(optional)</span></label>
            <select id="ccol"><option value="-1">Use the class box above</option>${head.map((h, i) => `<option value="${i}" ${i === cGuess ? "selected" : ""}>${esc(h)}</option>`).join("")}</select></div>
        </div>
        <label class="row" style="gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="hdr" ${csv.header ? "checked" : ""}> First row is a header</label>
        <p class="muted" style="font-size:13px" id="csvprev"></p>
        <div class="row end"><button class="btn" id="csvuse" type="button">Use these usernames</button></div></div>`;
      const preview = () => {
        const u = +$("#ucol").value, c = +$("#ccol").value, skip = $("#hdr").checked ? 1 : 0;
        const sample = csv.rows.slice(skip, skip + 3).map(r => r[u] + (c >= 0 && r[c] ? " · " + r[c] : "")).join(", ");
        $("#csvprev").textContent = "First few: " + sample;
      };
      $("#ucol").onchange = $("#ccol").onchange = $("#hdr").onchange = preview; preview();
      $("#csvuse").onclick = () => {
        const u = +$("#ucol").value, c = +$("#ccol").value, skip = $("#hdr").checked ? 1 : 0;
        const picked = csv.rows.slice(skip).map(r => ({ name: (r[u] || "").split("@")[0].trim(), cls: c >= 0 ? (r[c] || "").trim() : "" }))
          .filter(x => /^[A-Za-z0-9._-]{2,40}$/.test(x.name));
        if (!picked.length) return $("#csvprev").textContent = "No usable usernames in that column.";
        const classes = [...new Set(picked.map(x => x.cls).filter(Boolean))];
        if (c >= 0 && classes.length > 1) {
          $("#names").value = ""; $("#csvpick").innerHTML = `<p class="muted">Creating logins for ${picked.length} students across ${classes.length} classes…</p>`;
          return createMany(picked, classes);
        }
        $("#names").value = picked.map(x => x.name).join("\n");
        if (c >= 0 && classes.length === 1 && !$("#ncls").value.trim()) $("#ncls").value = classes[0];
        $("#csvpick").innerHTML = `<p class="muted">${picked.length} usernames ready. Check the class name, then press Create logins.</p>`;
        $("#addgo").scrollIntoView({ behavior: "smooth", block: "center" });
      };
    };

    // A CSV covering several classes: create each class in turn
    async function createMany(picked, classes) {
      const made = [];
      try {
        for (const cls of classes) {
          const names = picked.filter(x => x.cls === cls).map(x => x.name);
          const j = await api({ action: "roster_add", cls, names });
          made.push(...j.students); lastCreated = { students: made, schoolCode: j.schoolCode };
        }
        const noClass = picked.filter(x => !x.cls).map(x => x.name);
        if (noClass.length) {
          const j = await api({ action: "roster_add", cls: $("#ncls").value.trim(), names: noClass });
          made.push(...j.students); lastCreated = { students: made, schoolCode: j.schoolCode };
        }
        await load(host);
      } catch (err) { alert("Couldn't create those logins: " + err.message); }
    }

    $("#addf").onsubmit = async e => {
      e.preventDefault();
      const names = $("#names").value.split(/[\n,]/).map(x => x.trim()).filter(Boolean);
      if (!names.length) return $("#aerr").textContent = "Paste at least one username.";
      $("#addgo").disabled = true; $("#aerr").textContent = "";
      try {
        const j = await api({ action: "roster_add", cls: $("#ncls").value.trim(), names });
        lastCreated = { students: j.students, schoolCode: j.schoolCode };
        await load(host);
        const n = document.querySelector("#newcards");
        if (n) n.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        const box = document.querySelector("#aerr"); if (box) box.textContent = "Couldn't create those logins: " + err.message;
        const btn = document.querySelector("#addgo"); if (btn) btn.disabled = false;
      }
    };

    if (lastCreated) {
      $("#pnow").onclick = () => printCards(lastCreated.students, lastCreated.schoolCode);
      $("#snow").onclick = () => saveCards(lastCreated.students, lastCreated.schoolCode);
      $("#cnow").onclick = () => copyList(lastCreated.students, lastCreated.schoolCode, $("#cnow"));
      $("#pdone").onclick = () => { lastCreated = null; load(host); };
    }

    $("#enforce").onchange = async e => {
      try { await api({ action: "roster_enforce", on: e.target.checked }); }
      catch (err) { e.target.checked = !e.target.checked; alert("Couldn't change that: " + err.message); }
    };

    host.querySelectorAll("[data-print]").forEach(b => b.onclick = () => printCards(byClass[b.dataset.print], data.schoolCode));
    host.querySelectorAll("[data-save]").forEach(b => b.onclick = () => saveCards(byClass[b.dataset.save], data.schoolCode));
    host.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => copyList(byClass[b.dataset.copy], data.schoolCode, b));
    host.querySelectorAll("[data-reset]").forEach(b => b.onclick = async () => {
      if (!confirm("Give this student a new PIN? Their progress is kept, but their old card stops working.")) return;
      try {
        const j = await api({ action: "roster_reset", key: b.dataset.reset });
        alert(`New PIN for ${j.name}: ${j.pin}\n\nPrint a fresh card, or write it down now.`);
        load(host);
      } catch (err) { alert("Couldn't reset that PIN: " + err.message); }
    });
    host.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (!confirm("Remove this student and delete their progress? This can't be undone.")) return;
      try { await api({ action: "roster_remove", key: b.dataset.del }); load(host); }
      catch (err) { alert("Couldn't remove that student: " + err.message); }
    });
  }

  async function load(host) {
    host.innerHTML = '<p class="muted">Loading class logins…</p>';
    try { render(host, await api({ action: "roster_list" })); }
    catch (e) { host.innerHTML = `<p class="muted">Class logins need a school teacher key${e.message === "bad key" ? "" : ": " + esc(e.message)}.</p>`; }
  }

  window.R360Roster = { load, printCards };
})();
