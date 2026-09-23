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
  const row = await env.DB.prepare("SELECT id, school_code, school FROM teachers WHERE token = ? AND active = 1").bind(key).first();
  return row ? { all: false, school: row.school_code, name: row.school } : null;
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
      env.DB.prepare("DELETE FROM students WHERE last_seen < ?").bind(cutoff)
    ]);
  }
};
