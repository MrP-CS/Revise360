// Local mode: with no backend URL set, the whole platform runs in the browser using
// localStorage, so the site can be demonstrated end to end. It answers exactly the same
// actions the Cloudflare Worker does, so setting APP_CONFIG.backendUrl later switches
// everything to the real backend with no other change.
(function () {
  const NS = "r360local:";
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(NS + k)) ?? d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} };
  const now = () => Date.now();
  const DEMO_KEY = "demo";              // what a teacher types on the dashboard in local mode
  const SCHOOL = "DEMO";                // the one school that exists in local mode

  async function sha256(text) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  }
  const weak = p => /^(\d)\1{5}$/.test(p) || "0123456789".includes(p) || ["123456", "654321", "121212", "112233"].includes(p);
  function makePin(taken) {
    for (;;) {
      const p = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
      if (!weak(p) && !taken.has(p)) return p;
    }
  }
  const students = () => read("students", {});       // key -> { name, cls, pin, school, progress, last }
  const saveStudents = s => write("students", s);

  const ok = obj => Object.assign({ ok: true }, obj || {});
  const no = error => ({ ok: false, error });

  async function handle(body) {
    const S = students();
    switch (body.action) {
      case "login": {
        const name = String(body.name || "").trim().toLowerCase(), pin = String(body.pin || "").trim();
        const hit = Object.entries(S).find(([, v]) => v.name === name && v.pin === pin);
        if (!hit) return no("no match");
        hit[1].last = now(); saveStudents(S);
        return ok({ student: { key: hit[0], name: hit[1].name, cls: hit[1].cls || "", school: SCHOOL } });
      }
      case "check": return ok({ known: !!S[body.key] });
      case "save": {
        const s = S[body.key] || (S[body.key] = { name: body.name, cls: body.cls || "", pin: "", school: SCHOOL, progress: {} });
        s.progress = s.progress || {}; s.progress[body.expId] = body.data; s.last = now();
        saveStudents(S); return ok();
      }
      case "load": return ok({ progress: (S[body.key] || {}).progress || {} });

      case "all": {
        const rows = [];
        Object.entries(S).forEach(([key, v]) =>
          Object.entries(v.progress || {}).forEach(([expId, data]) =>
            rows.push({ key, name: v.name, cls: v.cls || "", school: SCHOOL, expId, data: JSON.stringify(data) })));
        return ok({ rows, school: SCHOOL });
      }
      case "csv": {
        const lines = ["Class,Username,Experience,Progress"];
        Object.values(S).forEach(v => Object.entries(v.progress || {}).forEach(([e, d]) =>
          lines.push([v.cls || "", v.name, e, JSON.stringify(d)].map(x => `"${String(x).replace(/"/g, '""')}"`).join(","))));
        return ok({ csv: lines.join("\n") });
      }
      case "forget": { delete S[body.key]; saveStudents(S); return ok(); }

      case "roster_add": {
        const cls = String(body.cls || "").trim();
        const taken = new Set(Object.values(S).map(v => v.pin));
        const made = [];
        for (const raw of body.names || []) {
          const name = String(raw).trim().toLowerCase().replace(/\s+/g, "");
          if (!name) continue;
          const existing = Object.entries(S).find(([, v]) => v.name === name && (v.cls || "") === cls);
          const pin = existing ? existing[1].pin : makePin(taken);
          taken.add(pin);
          const key = existing ? existing[0] : await sha256(cls + "|" + name + "|" + pin);
          S[key] = Object.assign({ progress: {} }, S[key], { name, cls, pin, school: SCHOOL });
          made.push({ key, name, cls, pin });
        }
        saveStudents(S);
        return ok({ students: made, schoolCode: SCHOOL });
      }
      case "roster_list":
        return ok({ schoolCode: SCHOOL, enforce: !!read("enforce", false),
          students: Object.entries(S).map(([key, v]) => ({ key, name: v.name, cls: v.cls || "", pin: v.pin,
            roster: v.pin ? 1 : 0, last_seen: v.last || null, started: Object.keys(v.progress || {}).length })) });
      case "roster_reset": {
        const s = S[body.key]; if (!s) return no("not found");
        const pin = makePin(new Set(Object.values(S).map(v => v.pin)));
        const key = await sha256((s.cls || "") + "|" + s.name + "|" + pin);
        delete S[body.key]; S[key] = Object.assign({}, s, { pin });
        saveStudents(S); return ok({ key, pin, name: s.name, cls: s.cls });
      }
      case "roster_remove": { delete S[body.key]; saveStudents(S); return ok(); }
      case "roster_enforce": { write("enforce", !!body.on); return ok({ enforce: !!body.on }); }

      case "team_list":
        return ok({ team: [{ id: "local", person: "You (demo mode)", email: "", role: "admin", active: 1, created: read("since", now()) }],
                    invites: [], you: "local", admin: true, school: "Demo school (this device)", schoolCode: SCHOOL, local: true });
      case "invite_create": return no("Inviting colleagues needs the online backend. In demo mode everything stays on this device.");
      case "team_set": case "invite_cancel": return no("Not available in demo mode.");
      case "signup": { const q = read("requests", []); q.push(Object.assign({ created: now(), status: "new" }, body)); write("requests", q); return ok(); }
      case "requests": return ok({ requests: read("requests", []) });
      case "teachers": return ok({ teachers: [] });
      case "issue": return no("Issuing keys needs the online backend.");
      default: return no("unknown action");
    }
  }

  window.R360Local = {
    active: () => !(window.APP_CONFIG && window.APP_CONFIG.backendUrl),
    key: DEMO_KEY,
    school: SCHOOL,
    handle,
    // Everything this device has stored, so a demo can be reset in one click
    reset() { Object.keys(localStorage).filter(k => k.startsWith(NS) || k.startsWith("nvr:")).forEach(k => localStorage.removeItem(k)); }
  };
})();
