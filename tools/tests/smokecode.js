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

/* A right answer and a wrong one for each question, keyed by the start of the
 * prompt. The wrong one is a mistake a pupil really makes, not nonsense: it has
 * to be caught by a test rather than by failing to run. */
const ANSWERS = {
  "Write a program that adds up": {
    right: "n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n",
    wrong: "n = int(input())\ntotal = 0\nfor i in range(1, n):\n    total += i\nprint(total)\n"
  },
  "Write a linear search": {
    right: "names = ['Ava', 'Ben', 'Chi', 'Dev', 'Eve']\nw = input()\nf = -1\nfor i in range(len(names)):\n    if names[i] == w:\n        f = i\nprint('not found' if f == -1 else f)\n",
    wrong: "names = ['Ava', 'Ben', 'Chi', 'Dev', 'Eve']\nw = input()\nf = -1\nfor i in range(len(names)):\n    if names[i] == w:\n        f = i + 1\nprint('not found' if f == -1 else f)\n"
  },
  "Write a bubble sort": {
    right: "nums = []\nfor i in range(5):\n    nums.append(int(input()))\nfor a in range(4):\n    for b in range(4 - a):\n        if nums[b] > nums[b + 1]:\n            nums[b], nums[b + 1] = nums[b + 1], nums[b]\nprint(' '.join(str(v) for v in nums))\n",
    wrong: "nums = []\nfor i in range(5):\n    nums.append(int(input()))\nprint(' '.join(str(v) for v in nums))\n"
  },
  "Write a program that checks a password": {
    right: "pw = input()\nwhile len(pw) < 8:\n    print('too short')\n    pw = input()\nprint('accepted')\n",
    wrong: "pw = input()\nif len(pw) < 8:\n    print('too short')\nelse:\n    print('accepted')\n"
  },
  "Write a program that accepts a mark": {
    right: "m = int(input())\nprint('valid' if m >= 0 and m <= 50 else 'invalid')\n",
    wrong: "m = int(input())\nprint('valid' if m >= 0 and m < 50 else 'invalid')\n"
  },
  "Write a program that prints the character code": {
    right: "w = input()\nfor c in w:\n    print(c, ord(c))\n",
    wrong: "w = input()\nfor c in w:\n    print(ord(c))\n"
  }
};

function findQuestions() {
  const dir = path.join(ROOT, "experiences");
  const out = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".json") && x !== "registry.json")) {
    let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { continue; }
    for (const sc of d.scenes || []) {
      const core = (sc.stations || []).filter(s => s.label !== "\u2605");
      core.forEach((st, k) => (st.tasks || []).forEach((t, ti) => {
        if (t.t === "code") out.push({ id: f.replace(".json", ""), station: k, index: ti, q: t.q, marks: t.marks, tests: (t.tests || []).length });
      }));
    }
  }
  return out;
}

(async () => {
  const qs = findQuestions();
  console.log(`${qs.length} code question(s) in the experiences\n`);
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

    const key = Object.keys(ANSWERS).find(k => q.q.startsWith(k));
    if (!key) { console.log(`${q.id}: no answer written for "${q.q.slice(0, 40)}"`); bad++; await pg.close(); continue; }

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

    await type(ANSWERS[key].right);
    const good = await check();
    console.log(`${q.id.padEnd(8)} ${q.q.slice(0, 44).padEnd(46)} right: ${good.pass}/${good.pass + good.fail} pass`);
    if (good.fail > 0 || !good.ok) { console.log(`   a correct solution did not pass: ${good.fb.slice(0, 110)}`); bad++; }

    // and the same question again, answered wrongly
    await pg.evaluate(([k, i]) => window.NVR.openStationTask(k, i), [q.station, q.index]);
    await pg.waitForTimeout(900);
    await pg.waitForFunction(() => !document.querySelector("#pycheck").disabled, null, { timeout: 90000 });
    await type(ANSWERS[key].wrong);
    const poor = await check();
    console.log(`${"".padEnd(8)} ${"".padEnd(46)} wrong: ${poor.pass}/${poor.pass + poor.fail} pass`);
    if (poor.fail === 0) { console.log("   a wrong solution was marked correct"); bad++; }
    if (poor.ok) { console.log("   a wrong solution was reported as correct"); bad++; }

    const real = errs.filter(e => !/WebGL|deprecat/i.test(e));
    if (real.length) { console.log("   page errors:", real.slice(0, 3)); bad += real.length; }
    await pg.close();
  }

  await b.close(); srv.close();
  console.log("\n" + (bad ? `${bad} problem(s)` : "every code question marks a right answer right and a wrong answer wrong"));
  process.exit(bad ? 1 : 0);
})();
