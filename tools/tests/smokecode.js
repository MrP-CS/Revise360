/* Does a code question actually work, and does it mark honestly?
 *
 * Opens each code question in a real browser, types a correct solution and a
 * wrong one, and checks the marking agrees. The runtime is real CPython in a
 * worker, so this exercises the whole thing: editor, worker, test cases, marks.
 *
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/tests/smokecode.js
 */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const PORT = Number(process.env.CODE_PORT || 8191);
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".wasm": "application/wasm", ".zip": "application/zip",
  ".jpg": "image/jpeg", ".png": "image/png", ".html": "text/html" };

const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  r.end(fs.readFileSync(f));
});

/* Right answers come from answers/codebank/, which git ignores because this
 * repository is public and a model solution is answer-sheet material. They
 * never reach a browser in normal use either - they exist so a question can be
 * proved answerable. The wrong answer is generated: a program that just prints
 * the first test's expected output. verifycode.py already proves that fails at
 * least one test on every question, so if the browser marks it full marks, the
 * pipeline is broken.
 *
 * verifycode.py checks all 144 under CPython in seconds. This is the slow
 * end-to-end check - editor, worker, test cases, marking - so it samples.
 * CODE_SAMPLE sets how many per lesson, CODE_ONLY limits it to one.
 */
const SAMPLE = Number(process.env.CODE_SAMPLE || 2);

function bank() {
  const dir = path.join(ROOT, "tools", "codebank");
  const sdir = path.join(ROOT, "answers", "codebank");
  const out = new Map();
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".json"))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const sf = path.join(sdir, f);
    if (!fs.existsSync(sf)) continue;        // no solutions here, nothing to type
    const sols = JSON.parse(fs.readFileSync(sf, "utf8")).solutions || {};
    for (const q of d.questions)
      if (sols[q.id]) out.set(q.q, { lesson: d.lesson, solution: sols[q.id], fixed: !!q.fixed });
  }
  if (!out.size) console.log("No model solutions found in answers/codebank/ - this check needs them.");
  return out;
}

function findQuestions() {
  const dir = path.join(ROOT, "experiences");
  const out = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".json") && x !== "registry.json")) {
    let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { continue; }
    for (const sc of d.scenes || []) {
      const core = (sc.stations || []).filter(s => s.label !== "\u2605");
      core.forEach((st, k) => (st.tasks || []).forEach((t, ti) => {
        if (t.t === "code") out.push({ id: f.replace(".json", ""), station: k, index: ti, q: t.q,
          marks: t.marks, tests: (t.tests || []).length, firstOut: ((t.tests || [])[0] || {}).out || [] });
      }));
    }
  }
  return out;
}

(async () => {
  const BANK = bank();
  const only = process.env.CODE_ONLY;
  const all = findQuestions();
  const seen = {};
  const qs = all.filter(q => {
    const e = BANK.get(q.q);
    if (!e) return false;                       // the six older ones, not in the bank
    if (only && e.lesson !== only) return false;
    seen[e.lesson] = (seen[e.lesson] || 0) + 1;
    return seen[e.lesson] <= SAMPLE;
  });
  console.log(`${all.length} code questions placed, ${BANK.size} in the bank, testing ${qs.length}\n`);
  if (!qs.length) { console.log("nothing to test"); process.exit(1); }

  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  let bad = 0;

  for (const q of qs) {
    const pg = await b.newPage({ viewport: { width: 1680, height: 1000 } });
    const errs = [];
    pg.on("pageerror", e => errs.push(e.message));
    await pg.addInitScript(() => localStorage.setItem("nvr:v1:student",
      JSON.stringify({ key: "codetest", name: "Code tester", cls: "11A", school: "MCS" })));
    await pg.route("**/cdnjs.cloudflare.com/**", r =>
      r.fulfill({ contentType: "text/javascript", body: fs.readFileSync("/home/claude/node_modules/three/build/three.min.js") }));
    await pg.goto(`http://localhost:${PORT}/experience.html?id=${q.id}`);
    await pg.waitForTimeout(2200);

    // open the station straight at the code task
    await pg.evaluate(([k, i]) => window.NVR.openStationTask(k, i), [q.station, q.index]);
    await pg.waitForTimeout(1200);

    const there = await pg.$("#pyed .pysrc");
    if (!there) { console.log(`${q.id}: the editor did not appear`); bad++; await pg.close(); continue; }
    await pg.waitForFunction(() => !document.querySelector("#pycheck").disabled, null, { timeout: 90000 });

    const entry = BANK.get(q.q);

    /* The usual wrong answer prints the first test's expected output. On a

     * question marked "fixed" - the first task of the course, where printing

     * one line IS the answer - that program is correct, so an empty one is

     * used instead. verifycode proves an empty program fails every question. */

    const wrong = entry.fixed ? "pass" : "print('''" + (q.firstOut || []).join("\n") + "''')";

    const type = async (code) => pg.evaluate(c => {
      const ta = document.querySelector("#pyed .pysrc");
      ta.value = c; ta.dispatchEvent(new Event("input", { bubbles: true }));
    }, code);
    const check = async () => {
      await pg.click("#pycheck");
      await pg.waitForFunction(() => document.querySelector("#pystate").textContent === "", null, { timeout: 90000 });
      await pg.waitForTimeout(300);
      return pg.evaluate(() => ({
        pass: document.querySelectorAll(".pytest.pass").length,
        fail: document.querySelectorAll(".pytest.fail").length,
        fb: (document.querySelector("#fb") || {}).textContent || "",
        ok: !!document.querySelector("#fb.ok")
      }));
    };

    await type(entry.solution);
    const good = await check();
    console.log(`${q.id.padEnd(8)} ${q.q.slice(0, 44).padEnd(46)} right: ${good.pass}/${good.pass + good.fail} pass`);
    if (good.fail > 0 || !good.ok) { console.log(`   a correct solution did not pass: ${good.fb.slice(0, 110)}`); bad++; }

    // and the same question again, answered wrongly
    await pg.evaluate(([k, i]) => window.NVR.openStationTask(k, i), [q.station, q.index]);
    await pg.waitForTimeout(900);
    await pg.waitForFunction(() => !document.querySelector("#pycheck").disabled, null, { timeout: 90000 });
    await type(wrong);
    const poor = await check();
    /* Nothing ran at all means the program was turned away before marking - a
     * question that forbids a shortcut or requires a technique checks that
     * first, and the constant-printing program has neither. That is a refusal,
     * and a stricter one than failing a test. */
    const stopped = poor.pass === 0 && poor.fail === 0;
    console.log(`${"".padEnd(8)} ${"".padEnd(46)} wrong: ` +
      (stopped ? "stopped before marking" : `${poor.pass}/${poor.pass + poor.fail} pass`));
    if (!stopped && poor.fail === 0) { console.log("   a wrong solution was marked correct"); bad++; }
    if (poor.ok) { console.log("   a wrong solution was reported as correct"); bad++; }

    const real = errs.filter(e => !/WebGL|deprecat/i.test(e));
    if (real.length) { console.log("   page errors:", real.slice(0, 3)); bad += real.length; }
    await pg.close();
  }

  await b.close(); srv.close();
  console.log("\n" + (bad ? `${bad} problem(s)` : "every code question marks a right answer right and a wrong answer wrong"));
  process.exit(bad ? 1 : 0);
})();
