// Revise 360 backend: a Cloudflare Worker with a D1 database.
// Replaces the Google Sheet. Same request shape the site already uses, so js/store.js
// only needs its backendUrl pointing here.
//
//   POST { action: "load",  key }                          -> { ok, progress }
//   POST { action: "save",  key, name, cls, expId, data }   -> { ok }
//   POST { action: "all",   teacherKey }                    -> { ok, rows }
//   POST { action: "csv",   teacherKey }                    -> { ok, csv }
//   POST { action: "forget", teacherKey, key }              -> { ok }
//   GET  /health                                            -> { ok, students, rows }
//
// The site never sends anything but a hashed key, a username, a class label and quiz
// progress. It never sends a password, an email address or a real name.

const MAX_BODY = 64 * 1024;       // a single experience's progress is a few kB
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400"
};
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", ...CORS } });
const fail = (msg, status = 400) => json({ ok: false, error: msg }, status);
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, "").slice(0, max);
const isKey = k => typeof k === "string" && /^[a-f0-9]{16,64}$/.test(k);

// Constant-time-ish comparison so a wrong teacher key can't be guessed by timing
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns { all: true } for the owner key, or the teacher's row, or null
async function teacherOk(env, key) {
  if (env.TEACHER_KEY && sameSecret(key || "", env.TEACHER_KEY)) return { all: true, school: null };
  if (!key || key.length < 8) return null;
  const row = await env.DB.prepare("SELECT id, school_code, school, role FROM teachers WHERE token = ? AND active = 1").bind(key).first();
  return row ? { all: false, id: row.id, school: row.school_code, name: row.school, role: row.role || "admin", admin: (row.role || "admin") === "admin" } : null;
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const studentKey = (cls, name, pin) => sha256Hex(cls + "|" + String(name).toLowerCase() + "|" + pin);
function makePin() {
  const bad = new Set(["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321", "1122", "2580"]);
  for (;;) {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
    const p = String(n).padStart(4, "0");
    if (!bad.has(p)) return p;
  }
}
const code6 = () => {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";  // no look-alikes
  return [...crypto.getRandomValues(new Uint8Array(6))].map(b => a[b % a.length]).join("");
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      const s = await env.DB.prepare("SELECT COUNT(*) AS n FROM students").first();
      const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM progress").first();
      return json({ ok: true, students: s.n, rows: r.n });
    }
    if (request.method !== "POST") return fail("POST only", 405);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return fail("too large", 413);
    let body;
    try { body = JSON.parse(raw); } catch (e) { return fail("bad JSON"); }
    const now = Date.now();

    try {
      switch (body.action) {
        case "save": {
          if (!isKey(body.key)) return fail("bad key");
          const expId = clean(body.expId, 64);
          if (!expId) return fail("no experience");
          const data = JSON.stringify(body.data || {});
          if (data.length > MAX_BODY) return fail("too large", 413);
          const name = clean(body.name, 40), cls = clean(body.cls, 40), school = clean(body.school, 12).toUpperCase();
          await env.DB.batch([
            env.DB.prepare(`INSERT INTO students (key, name, cls, school_code, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?)
                            ON CONFLICT(key) DO UPDATE SET name = excluded.name, cls = excluded.cls,
                              school_code = COALESCE(NULLIF(excluded.school_code, ''), students.school_code), last_seen = excluded.last_seen`)
              .bind(body.key, name, cls, school, now, now),
            env.DB.prepare(`INSERT INTO progress (key, exp_id, data, updated) VALUES (?, ?, ?, ?)
                            ON CONFLICT(key, exp_id) DO UPDATE SET data = excluded.data, updated = excluded.updated
                            WHERE excluded.updated >= progress.updated`)
              .bind(body.key, expId, data, Number(body.data && body.data.updated) || now)
          ]);
          return json({ ok: true });
        }

        case "load": {
          if (!isKey(body.key)) return fail("bad key");
          const { results } = await env.DB.prepare("SELECT exp_id, data FROM progress WHERE key = ?").bind(body.key).all();
          const progress = {};
          for (const r of results) { try { progress[r.exp_id] = JSON.parse(r.data); } catch (e) {} }
          return json({ ok: true, progress });
        }

        case "all": {
          const who = await teacherOk(env, body.teacherKey);
          if (!who) return fail("bad key", 403);
          const q = who.all
            ? env.DB.prepare(`SELECT p.key, s.name, s.cls, s.school_code, p.exp_id AS expId, p.data, p.updated
                              FROM progress p JOIN students s ON s.key = p.key ORDER BY s.cls, s.name LIMIT 20000`)
            : env.DB.prepare(`SELECT p.key, s.name, s.cls, s.school_code, p.exp_id AS expId, p.data, p.updated
                              FROM progress p JOIN students s ON s.key = p.key WHERE s.school_code = ? ORDER BY s.cls, s.name LIMIT 20000`).bind(who.school);
          const { results } = await q.all();
          return json({ ok: true, school: who.school, rows: results.map(r => ({ key: r.key, name: r.name, cls: r.cls, school: r.school_code, expId: r.expId, data: r.data })) });
        }

        case "signup": {          // a teacher asks for a key; reviewed before one is issued
          const email = clean(body.email, 120).toLowerCase(), school = clean(body.school, 120), person = clean(body.name, 80);
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return fail("bad email");
          if (!school || !person) return fail("missing details");
          await env.DB.prepare(`INSERT INTO requests (email, school, name, role, note, created, status)
                                VALUES (?, ?, ?, ?, ?, ?, 'new')`)
            .bind(email, school, person, clean(body.role, 60), clean(body.note, 500), now).run();
          return json({ ok: true });
        }

        case "requests": {        // owner only: see who has asked
          const who = await teacherOk(env, body.teacherKey);
          if (!who || !who.all) return fail("bad key", 403);
          const { results } = await env.DB.prepare("SELECT id, email, school, name, role, note, created, status FROM requests ORDER BY created DESC LIMIT 500").all();
          return json({ ok: true, requests: results });
        }

        case "invite_create": {   // a school admin invites a colleague
          const whoI = await teacherOk(env, body.teacherKey);
          if (!whoI || whoI.all) return fail("bad key", 403);
          if (!whoI.admin) return fail("only the school's lead teacher can invite colleagues", 403);
          const code = code6() + code6();
          await env.DB.prepare(`INSERT INTO invites (code, school_code, created_by, email, created, expires)
                                VALUES (?, ?, ?, ?, ?, ?)`)
            .bind(code, whoI.school, whoI.id, clean(body.email, 120).toLowerCase(), now, now + 30 * 24 * 60 * 60 * 1000).run();
          return json({ ok: true, code, school: whoI.name, expires: now + 30 * 24 * 60 * 60 * 1000 });
        }

        case "invite_info": {     // the join page asks what this link is for
          const inv = await env.DB.prepare(
            `SELECT i.code, i.expires, i.used, t.school FROM invites i
             LEFT JOIN teachers t ON t.id = i.created_by WHERE i.code = ?`).bind(clean(body.code, 24)).first();
          if (!inv) return json({ ok: false, error: "unknown invite" });
          if (inv.used) return json({ ok: false, error: "invite already used" });
          if (inv.expires && inv.expires < now) return json({ ok: false, error: "invite expired" });
          return json({ ok: true, school: inv.school });
        }

        case "invite_accept": {   // colleague joins and gets their own key on the same school code
          const code = clean(body.code, 24);
          const inv = await env.DB.prepare("SELECT * FROM invites WHERE code = ?").bind(code).first();
          if (!inv) return fail("unknown invite");
          if (inv.used) return fail("invite already used");
          if (inv.expires && inv.expires < now) return fail("invite expired");
          const email = clean(body.email, 120).toLowerCase(), person = clean(body.name, 80);
          if (!person || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return fail("missing details");
          const school = await env.DB.prepare("SELECT school, licence, seats FROM teachers WHERE id = ?").bind(inv.created_by).first();
          const token = crypto.randomUUID().replace(/-/g, ""), id = crypto.randomUUID();
          await env.DB.batch([
            env.DB.prepare(`INSERT INTO teachers (id, email, token, school, school_code, seats, licence, active, created, role, invited_by, person)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'member', ?, ?)`)
              .bind(id, email, token, school ? school.school : "", inv.school_code, school ? school.seats : 0, school ? school.licence : "trial", now, inv.created_by, person),
            env.DB.prepare("UPDATE invites SET used = ?, used_by = ? WHERE code = ?").bind(now, id, code)
          ]);
          return json({ ok: true, teacherKey: token, school: school ? school.school : "", schoolCode: inv.school_code });
        }

        case "team_list": {       // who can see this school's dashboard
          const whoT2 = await teacherOk(env, body.teacherKey);
          if (!whoT2 || whoT2.all) return fail("bad key", 403);
          const { results } = await env.DB.prepare(
            `SELECT id, person, email, role, active, created FROM teachers WHERE school_code = ? ORDER BY created`).bind(whoT2.school).all();
          const { results: pending } = await env.DB.prepare(
            `SELECT code, email, created, expires FROM invites WHERE school_code = ? AND used IS NULL ORDER BY created DESC LIMIT 50`).bind(whoT2.school).all();
          return json({ ok: true, team: results, invites: pending, you: whoT2.id, admin: whoT2.admin, school: whoT2.name, schoolCode: whoT2.school });
        }

        case "team_set": {        // admin switches a colleague's access on or off
          const whoS = await teacherOk(env, body.teacherKey);
          if (!whoS || whoS.all) return fail("bad key", 403);
          if (!whoS.admin) return fail("only the school's lead teacher can change access", 403);
          const id = clean(body.id, 64);
          if (id === whoS.id) return fail("you can't remove your own access");
          const t = await env.DB.prepare("SELECT school_code FROM teachers WHERE id = ?").bind(id).first();
          if (!t || t.school_code !== whoS.school) return fail("not your colleague", 403);
          await env.DB.prepare("UPDATE teachers SET active = ? WHERE id = ?").bind(body.active ? 1 : 0, id).run();
          return json({ ok: true });
        }

        case "invite_cancel": {
          const whoC2 = await teacherOk(env, body.teacherKey);
          if (!whoC2 || whoC2.all || !whoC2.admin) return fail("bad key", 403);
          await env.DB.prepare("DELETE FROM invites WHERE code = ? AND school_code = ?").bind(clean(body.code, 24), whoC2.school).run();
          return json({ ok: true });
        }

        case "roster_add": {      // teacher creates logins for a class
          const whoA = await teacherOk(env, body.teacherKey);
          if (!whoA || whoA.all === undefined) return fail("bad key", 403);
          if (whoA.all) return fail("use a school key, not the owner key");
          const cls = clean(body.cls, 40);
          const names = (Array.isArray(body.names) ? body.names : [])
            .map(n => clean(n, 40).toLowerCase().replace(/\s+/g, "")).filter(Boolean).slice(0, 400);
          if (!names.length) return fail("no usernames");
          const made = [];
          for (const name of names) {
            const existing = await env.DB.prepare("SELECT pin FROM students WHERE name = ? AND cls = ? AND school_code = ?")
              .bind(name, cls, whoA.school).first();
            const pin = existing ? existing.pin : makePin();
            const key = await studentKey(cls, name, pin);
            await env.DB.prepare(`INSERT INTO students (key, name, cls, school_code, pin, roster, first_seen, last_seen)
                                  VALUES (?, ?, ?, ?, ?, 1, ?, ?)
                                  ON CONFLICT(key) DO UPDATE SET roster = 1, pin = excluded.pin, school_code = excluded.school_code`)
              .bind(key, name, cls, whoA.school, pin, now, now).run();
            made.push({ key, name, cls, pin });
          }
          return json({ ok: true, students: made, schoolCode: whoA.school });
        }

        case "roster_list": {
          const whoL = await teacherOk(env, body.teacherKey);
          if (!whoL || whoL.all) return fail("bad key", 403);
          const { results } = await env.DB.prepare(
            `SELECT key, name, cls, pin, roster, last_seen,
                    (SELECT COUNT(*) FROM progress p WHERE p.key = students.key) AS started
             FROM students WHERE school_code = ? ORDER BY cls, name LIMIT 2000`).bind(whoL.school).all();
          const t = await env.DB.prepare("SELECT enforce_roster FROM teachers WHERE school_code = ? LIMIT 1").bind(whoL.school).first();
          return json({ ok: true, students: results, enforce: !!(t && t.enforce_roster), schoolCode: whoL.school });
        }

        case "roster_reset": {    // new PIN for one student, keeping their progress
          const whoR2 = await teacherOk(env, body.teacherKey);
          if (!whoR2 || whoR2.all) return fail("bad key", 403);
          const old = await env.DB.prepare("SELECT key, name, cls FROM students WHERE key = ? AND school_code = ?")
            .bind(clean(body.key, 64), whoR2.school).first();
          if (!old) return fail("not found", 404);
          const pin = makePin(), key = await studentKey(old.cls, old.name, pin);
          await env.DB.batch([
            env.DB.prepare("UPDATE students SET key = ?, pin = ? WHERE key = ?").bind(key, pin, old.key),
            env.DB.prepare("UPDATE progress SET key = ? WHERE key = ?").bind(key, old.key)
          ]);
          return json({ ok: true, key, pin, name: old.name, cls: old.cls });
        }

        case "roster_remove": {
          const whoRm = await teacherOk(env, body.teacherKey);
          if (!whoRm || whoRm.all) return fail("bad key", 403);
          const k = clean(body.key, 64);
          const owns = await env.DB.prepare("SELECT 1 AS ok FROM students WHERE key = ? AND school_code = ?").bind(k, whoRm.school).first();
          if (!owns) return fail("not your student", 403);
          await env.DB.batch([
            env.DB.prepare("DELETE FROM progress WHERE key = ?").bind(k),
            env.DB.prepare("DELETE FROM students WHERE key = ?").bind(k)
          ]);
          return json({ ok: true });
        }

        case "roster_enforce": {  // only listed students may sign in at this school
          const whoE = await teacherOk(env, body.teacherKey);
          if (!whoE || whoE.all) return fail("bad key", 403);
          await env.DB.prepare("UPDATE teachers SET enforce_roster = ? WHERE school_code = ?")
            .bind(body.on ? 1 : 0, whoE.school).run();
          return json({ ok: true, enforce: !!body.on });
        }

        case "login": {           // username + PIN only: the class and school come from the record
          const name = clean(body.name, 40).toLowerCase().replace(/\s+/g, "");
          const pin = clean(body.pin, 8);
          if (!name || !/^\d{4,8}$/.test(pin)) return fail("bad login");

          // Simple throttle: 10 wrong tries for a username in 15 minutes and it pauses
          const since = now - 15 * 60 * 1000;
          const tries = await env.DB.prepare("SELECT COUNT(*) AS n FROM attempts WHERE name = ? AND at > ?").bind(name, since).first();
          if (tries && tries.n >= 10) return json({ ok: false, error: "locked" });

          const school = clean(body.school, 12).toUpperCase();
          const rows = school
            ? (await env.DB.prepare("SELECT key, name, cls, school_code FROM students WHERE name = ? AND pin = ? AND school_code = ? LIMIT 5").bind(name, pin, school).all()).results
            : (await env.DB.prepare("SELECT key, name, cls, school_code FROM students WHERE name = ? AND pin = ? LIMIT 5").bind(name, pin).all()).results;

          if (!rows.length) {
            await env.DB.prepare("INSERT INTO attempts (name, at) VALUES (?, ?)").bind(name, now).run();
            return json({ ok: false, error: "no match" });
          }
          if (rows.length > 1) return json({ ok: false, error: "needs school" });   // same login at two schools

          await env.DB.batch([
            env.DB.prepare("DELETE FROM attempts WHERE name = ?").bind(name),
            env.DB.prepare("UPDATE students SET last_seen = ? WHERE key = ?").bind(now, rows[0].key)
          ]);
          return json({ ok: true, student: { key: rows[0].key, name: rows[0].name, cls: rows[0].cls || "", school: rows[0].school_code || "" } });
        }

        case "check": {           // called at sign-in: is this login allowed?
          if (!isKey(body.key)) return fail("bad key");
          const school = clean(body.school, 12).toUpperCase();
          const known = await env.DB.prepare("SELECT name, cls, roster FROM students WHERE key = ?").bind(body.key).first();
          if (known) return json({ ok: true, known: true });
          if (!school) return json({ ok: true, known: false });
          const t = await env.DB.prepare("SELECT enforce_roster FROM teachers WHERE school_code = ? AND active = 1").bind(school).first();
          if (t && t.enforce_roster) return json({ ok: false, error: "not on roster" });
          // username already claimed at this school with a different PIN?
          const name = clean(body.name, 40).toLowerCase();
          const taken = await env.DB.prepare("SELECT 1 AS ok FROM students WHERE name = ? AND school_code = ?").bind(name, school).first();
          if (taken) return json({ ok: false, error: "wrong pin" });
          return json({ ok: true, known: false });
        }

        case "teachers": {        // owner only: list issued keys
          const whoT = await teacherOk(env, body.teacherKey);
          if (!whoT || !whoT.all) return fail("bad key", 403);
          const { results } = await env.DB.prepare(
            `SELECT t.id, t.email, t.school, t.school_code, t.licence, t.seats, t.active, t.created,
                    (SELECT COUNT(*) FROM students s WHERE s.school_code = t.school_code) AS students
             FROM teachers t ORDER BY t.created DESC LIMIT 500`).all();
          return json({ ok: true, teachers: results });
        }

        case "revoke": {          // owner only: switch a key off
          const whoR = await teacherOk(env, body.teacherKey);
          if (!whoR || !whoR.all) return fail("bad key", 403);
          await env.DB.prepare("UPDATE teachers SET active = ? WHERE id = ?").bind(body.active ? 1 : 0, clean(body.id, 64)).run();
          return json({ ok: true });
        }

        case "issue": {           // owner only: create a teacher key and school code
          const who = await teacherOk(env, body.teacherKey);
          if (!who || !who.all) return fail("bad key", 403);
          const school = clean(body.school, 120), email = clean(body.email, 120).toLowerCase();
          if (!school) return fail("no school");
          const token = crypto.randomUUID().replace(/-/g, ""), schoolCode = clean(body.schoolCode, 12).toUpperCase() || code6();
          await env.DB.prepare(`INSERT INTO teachers (id, email, token, school, school_code, seats, licence, active, created)
                                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`)
            .bind(crypto.randomUUID(), email, token, school, schoolCode, Number(body.seats) || 0, clean(body.licence, 20) || "trial", now).run();
          if (body.requestId) await env.DB.prepare("UPDATE requests SET status = 'issued' WHERE id = ?").bind(body.requestId).run();
          return json({ ok: true, teacherKey: token, schoolCode });
        }

        case "csv": {
          const whoC = await teacherOk(env, body.teacherKey);
          if (!whoC) return fail("bad key", 403);
          const { results } = await (whoC.all
            ? env.DB.prepare(`SELECT s.cls, s.name, p.exp_id, p.updated, p.data FROM progress p JOIN students s ON s.key = p.key ORDER BY s.cls, s.name LIMIT 20000`)
            : env.DB.prepare(`SELECT s.cls, s.name, p.exp_id, p.updated, p.data FROM progress p JOIN students s ON s.key = p.key WHERE s.school_code = ? ORDER BY s.cls, s.name LIMIT 20000`).bind(whoC.school)).all();
          const esc = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
          const lines = ["Class,Username,Experience,Last updated,Progress"];
          for (const r of results) lines.push([r.cls, r.name, r.exp_id, new Date(r.updated).toISOString(), r.data].map(esc).join(","));
          return json({ ok: true, csv: lines.join("\n") });
        }

        case "forget": {   // remove one student's data entirely, on request
          const whoF = await teacherOk(env, body.teacherKey);
          if (!whoF) return fail("bad key", 403);
          if (!whoF.all) {
            const owns = await env.DB.prepare("SELECT 1 AS ok FROM students WHERE key = ? AND school_code = ?").bind(body.key, whoF.school).first();
            if (!owns) return fail("not your student", 403);
          }
          if (!isKey(body.key)) return fail("bad key");
          await env.DB.batch([
            env.DB.prepare("DELETE FROM progress WHERE key = ?").bind(body.key),
            env.DB.prepare("DELETE FROM students WHERE key = ?").bind(body.key)
          ]);
          return json({ ok: true });
        }

        default:
          return fail("unknown action");
      }
    } catch (e) {
      return fail("server error: " + (e && e.message ? e.message : "unknown"), 500);
    }
  },

  // Housekeeping: drop anything untouched for a year, so old cohorts don't linger
  async scheduled(event, env) {
    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM progress WHERE updated < ?").bind(cutoff),
      env.DB.prepare("DELETE FROM students WHERE last_seen < ?").bind(cutoff),
      env.DB.prepare("DELETE FROM attempts WHERE at < ?").bind(Date.now() - 24 * 60 * 60 * 1000)
    ]);
  }
};
