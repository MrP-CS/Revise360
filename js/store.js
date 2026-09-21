// Progress storage: always saved on this device, and synced to the
// teacher's Google Sheet when APP_CONFIG.backendUrl is set.
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
    if (!CFG.backendUrl) throw new Error("no backend");
    // text/plain avoids a CORS preflight, which Apps Script can't answer
    const r = await fetch(CFG.backendUrl, { method: "POST", body: JSON.stringify(body), keepalive: !!opts.keepalive });
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

    async signIn(name, cls, pin) {
      name = name.trim().replace(/\s+/g, " ");
      const key = await sha256(cls + "|" + name.toLowerCase() + "|" + pin);
      const s = { key, name, cls };
      write("student", s);
      const roster = read("roster", {}); roster[key] = { name, cls }; write("roster", roster);
      await Store.pull();
      return s;
    },
    signOut() { try { localStorage.removeItem(NS + "student"); } catch (e) {} },

    all() { const s = Store.student(); return s ? read("p:" + s.key, {}) : {}; },
    get(expId) { return Store.all()[expId] || null; },

    // Merge the server copy with this device's copy (newest wins per experience)
    async pull() {
      const s = Store.student(); if (!s || !CFG.backendUrl) return;
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
      const s = Store.student(); if (!s || !CFG.backendUrl) return;
      const data = Store.get(expId); if (!data) return;
      setStatus("syncing");
      try { await api({ action: "save", key: s.key, name: s.name, cls: s.cls, expId, data }, { keepalive }); setStatus("saved"); }
      catch (e) { setStatus("offline"); const q = read("queue", []); if (!q.includes(expId)) q.push(expId); write("queue", q); }
    },

    async flushQueue() {
      const q = read("queue", []); write("queue", []);
      for (const id of q) await Store.push(id);
    },

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

  // Summarise an experience's progress for hub cards and the teacher view
  Store.summarise = function (exp, prog) {
    const out = { score: 0, total: 0, done: 0, count: 0, stations: [], infoSeen: (prog && prog.info || []).length, infoTotal: 0 };
    const marks = t => (t.t === "mcq" || t.t === "multi") ? 1 : t.t === "order" ? t.steps.length : t.t === "sort" ? t.items.length : t.pairs.length;
    exp.scenes.forEach(sc => {
      out.infoTotal += (sc.info || []).length;
      const sp = prog && prog.scenes && prog.scenes[sc.id] || { ans: {}, done: {} };
      sc.stations.forEach((st, k) => {
        let got = 0, tot = 0, answered = 0, fixed = 0, wrongTasks = 0;
        st.tasks.forEach((t, i) => {
          const m = marks(t); tot += m;
          const a = sp.ans[k + "-" + i];
          if (a !== undefined) { got += a; answered++; if (a < m) { wrongTasks++; if (prog.review && prog.review[sc.id + ":" + k + "-" + i]) fixed++; } }
        });
        const done = !!sp.done[k];
        out.total += tot; out.score += got; out.count++; if (done) out.done++;
        out.stations.push({ scene: sc.id, sceneTitle: sc.title, k, name: st.name, got, tot, done, band: done ? band(got, tot) : "n", wrongTasks, fixed });
      });
    });
    out.complete = out.count > 0 && out.done === out.count;
    return out;
  };

  window.addEventListener("online", () => Store.flushQueue());
  window.Store = Store;
})();
