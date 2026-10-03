// Progress storage: always saved on this device, and synced to the Revise 360
// backend when APP_CONFIG.backendUrl is set, so progress follows a student
// between devices. Works offline: anything unsent is queued and retried.
(function () {
  const CFG = window.APP_CONFIG;
  const NS = "nvr:v1:";
  const listeners = new Set();
  let status = CFG.backendUrl ? "idle" : "local";
  const timers = {};

  function read(k, d) { try { const v = localStorage.getItem(NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }
  function setStatus(s) { status = s; listeners.forEach(f => f(s)); }

  async function sha256(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0; return "x" + (h >>> 0).toString(16);
  }

  async function api(body, opts = {}) {
    if (window.R360Local && R360Local.active()) {          // demo mode: answer in the browser
      const j = await R360Local.handle(body);
      if (!j.ok) { const e = new Error(j.error || "error"); e.code = j.error; throw e; }
      return j;
    }
    if (!CFG.backendUrl) throw new Error("no backend");
    // A plain body avoids a CORS preflight on every save
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), opts.timeout || 8000) : null;
    let r;
    try { r = await fetch(CFG.backendUrl, { method: "POST", body: JSON.stringify(body), keepalive: !!opts.keepalive, signal: ctl ? ctl.signal : undefined }); }
    finally { if (timer) clearTimeout(timer); }
    if (r.status === 403) throw new Error("bad key");
    if (!r.ok) throw new Error("server error " + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "server error");
    return j;
  }

  function band(got, tot) {
    if (!tot) return "n";
    const p = got / tot;
    return p >= CFG.secure ? "g" : p >= CFG.revise ? "a" : "r";
  }
  const BAND_LABEL = { g: "Secure", a: "Revise", r: "Focus here", n: "Not started" };

  const Store = {
    band, BAND_LABEL,
    onStatus(f) { listeners.add(f); f(status); return () => listeners.delete(f); },
    student() { return read("student", null); },

    // Students sign in with the username and PIN on their login card. The class and
    // school are already attached to the record their teacher created.
    async signIn(name, pin, school) {
      name = String(name).trim().replace(/\s+/g, "").toLowerCase();
      pin = String(pin).trim();
      let j;
      try { j = await api({ action: "login", name, pin, school: school || "" }); }
      catch (e) {
        if (!e.code) { const off = new Error("Can't reach Revise 360 right now. Check the connection and try again."); off.code = "offline"; throw off; }
        j = { ok: false, error: e.code };
      }
      if (!j.ok) {
        const msg = { "no match": "That username and PIN don't match. Check your login card, or ask your teacher for a new one.",
                      "needs school": "That username and PIN are in use at more than one school. Ask your teacher for a new login card.",
                      "locked": "Too many tries. Wait a few minutes, then try again with your login card.",
                      "bad login": "Enter your username and the PIN from your login card." }[j.error] || "Couldn't sign you in.";
        const e = new Error(msg); e.code = j.error; throw e;
      }
      const s = { key: j.student.key, name: j.student.name, cls: j.student.cls, school: j.student.school };
      write("student", s);
      const roster = read("roster", {}); roster[s.key] = { name: s.name, cls: s.cls, school: s.school }; write("roster", roster);
      await Store.pull();
      return s;
    },

    all() { const s = Store.student(); return s ? read("p:" + s.key, {}) : {}; },

    get(expId) { return Store.all()[expId] || null; },

    signOut() { try { localStorage.removeItem(NS + "student"); } catch (e) {} },

    // Move progress saved under an old experience id onto the new one
    rename(oldId, newId) {
      const s = Store.student(); if (!s) return;
      const all = read("p:" + s.key, {});
      if (all[oldId] && !all[newId]) { all[newId] = all[oldId]; delete all[oldId]; write("p:" + s.key, all); Store.push(newId); }
    },

    async pull() {
      const s = Store.student(); if (!s || (!CFG.backendUrl && !(window.R360Local && R360Local.active()))) return;
      setStatus("syncing");
      try {
        const j = await api({ action: "load", key: s.key });
        const local = read("p:" + s.key, {});
        for (const [exp, data] of Object.entries(j.progress || {})) {
          if (!local[exp] || (data.updated || 0) > (local[exp].updated || 0)) local[exp] = data;
        }
        write("p:" + s.key, local);
        setStatus("saved");
      } catch (e) { setStatus("offline"); }
    },

    put(expId, data) {
      const s = Store.student(); if (!s) return;
      data.updated = Date.now();
      const all = read("p:" + s.key, {}); all[expId] = data; write("p:" + s.key, all);
      if (!CFG.backendUrl) return;
      setStatus("pending");
      clearTimeout(timers[expId]);
      timers[expId] = setTimeout(() => Store.push(expId), 1200);
    },

    async push(expId, keepalive) {
      const s = Store.student(); if (!s || (!CFG.backendUrl && !(window.R360Local && R360Local.active()))) return;
      const data = Store.get(expId); if (!data) return;
      setStatus("syncing");
      try { await api({ action: "save", key: s.key, name: s.name, cls: s.cls, school: s.school || "", expId, data }, { keepalive }); setStatus("saved"); }
      catch (e) { setStatus("offline"); const q = read("queue", []); if (!q.includes(expId)) q.push(expId); write("queue", q); }
    },

    async flushQueue() {
      const q = read("queue", []); write("queue", []);
      for (const id of q) await Store.push(id);
    },

    // Teacher tools that need the backend
    async teacherCsv(teacherKey) { return (await api({ action: "csv", teacherKey })).csv; },
    async forget(teacherKey, key) { return api({ action: "forget", teacherKey, key }); },

    // ----- teacher -----
    async teacherRows(teacherKey) {
      if (CFG.backendUrl) return (await api({ action: "all", teacherKey })).rows;
      // Device-only mode: show every student who has signed in on this browser
      const roster = read("roster", {}), rows = [];
      for (const [key, who] of Object.entries(roster)) {
        for (const [expId, data] of Object.entries(read("p:" + key, {}))) rows.push({ key, name: who.name, cls: who.cls, expId, data });
      }
      return rows;
    }
  };

  /* How many marks a task is worth. This lives here, once, because it used to
   * exist twice - an identical copy in player.js - and adding a task type to
   * one and not the other meant an undefined read the moment a pupil opened the
   * station. Everything that needs it reads Store.marks. */
  Store.marks = function (t) {
    if (t.t === "code") return t.marks || 3;
    if (["mcq", "multi", "circuit", "expr", "convert", "addshift", "pixels", "sound",
         "memory", "permissions", "defrag", "impact", "searchstep", "sortstep"].indexOf(t.t) >= 0) return 1;
    if (t.t === "trace") return t.answer.reduce((n, r, i) => n + r.filter((v, c) => t.rows[i][c] === "").length, 0);
    if (t.t === "bugline") return 2;
    if (t.t === "table") return 1 << (t.inputs ? t.inputs.length
      : new Set((t.expr || "").replace(/AND|OR|NOT/g, "").match(/[A-Z]/g) || []).size);
    if (["sprint", "defence", "blitz", "lawgame", "arena"].indexOf(t.t) >= 0) return 0;
    if (t.t === "order") return t.steps.length;
    if (t.t === "sort") return t.items.length;
    return (t.pairs || []).length;
  };

  /* An experience's own definition, fetched once and kept.
   *
   * The Python course is worked in order, so both the topic page and the player
   * have to know whether an earlier lesson is finished. That is worked out from
   * the answers actually stored for it, not from a flag that says so: a flag is
   * a claim a browser makes about itself, and this is the only check there is
   * until the backend enforces prerequisites as well. */
  const expCache = {};
  Store.experience = async function (expId) {
    if (expId in expCache) return expCache[expId];
    try {
      const r = await fetch("experiences/" + encodeURIComponent(expId) + ".json", { cache: "no-cache" });
      expCache[expId] = r.ok ? await r.json() : null;
    } catch (e) { expCache[expId] = null; }
    return expCache[expId];
  };
  /* Is every station of every scene of this experience finished? */
  Store.isComplete = async function (expId) {
    const prog = Store.get(expId); if (!prog) return false;
    const exp = await Store.experience(expId); if (!exp) return false;
    return !!Store.summarise(exp, prog).complete;
  };

  // Summarise an experience's progress for hub cards and the teacher view
  Store.summarise = function (exp, prog) {
    const out = { score: 0, total: 0, done: 0, count: 0, stations: [], infoSeen: (prog && prog.info || []).length, infoTotal: 0 };
    const marks = Store.marks;
    exp.scenes.forEach(sc => {
      out.infoTotal += (sc.info || []).length;
      const sp = prog && prog.scenes && prog.scenes[sc.id] || { ans: {}, done: {} };
      sc.stations.forEach((st, k) => {
        let got = 0, tot = 0, answered = 0, fixed = 0, wrongTasks = 0;
        st.tasks.forEach((t, i) => {
          const m = marks(t);
          const a = (sp.ans || {})[k + "-" + i];
          /* A challenge and the two warm-up kinds count only once attempted -
           * the same rule as SKIPPABLE in js/player.js, which explains why. */
          if ((t.opt || t.kind === "try" || t.kind === "predict") && a === undefined) return;
          tot += m;
          if (a !== undefined) { got += a; answered++; if (a < m) { wrongTasks++; if (prog.review && prog.review[sc.id + ":" + k + "-" + i]) fixed++; } }
        });
        const done = !!sp.done[k];
        out.total += tot; out.score += got; out.count++; if (done) out.done++;
        out.stations.push({ scene: sc.id, sceneTitle: sc.title, k, name: st.name, got, tot, done, band: done ? band(got, tot) : "n", wrongTasks, fixed });
      });
    });
    out.complete = out.count > 0 && out.done === out.count;
    if (prog && (prog.sprint || prog.defence)) out.sprint = prog.sprint || prog.defence;
    return out;
  };

  window.addEventListener("online", () => Store.flushQueue());
  window.Store = Store;
})();
