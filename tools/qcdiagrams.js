/* QC for the 2D diagrams.
 *
 * A diagram is drawn to a canvas, so nothing throws when a label runs off the
 * edge or two captions land on top of each other - the only way to find out is
 * to look, and there are around thirty diagrams of six steps each. This wraps
 * the drawing helper, records the bounding box of everything drawn, and reports
 * the three faults that looking would catch:
 *
 *   outside    something drawn beyond the edge of the diagram
 *   overlap    two pieces of text on top of one another
 *   overflow   text wider than the box it was put in
 *
 * It cannot tell you a diagram is confusing. It can tell you nobody needs to
 * squint at 180 images to find the broken ones.
 *
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/qcdiagrams.js
 *   ... node tools/qcdiagrams.js --only tcpip,packets
 */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.QC_PORT || 8153);
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1].split(",") : null;
})();

const frags = fs.readdirSync(path.join(ROOT, "js"))
  .filter(f => /^diag-.*\.js$/.test(f)).sort();
const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<script src="/js/diagrams.js"></script>
${frags.map(f => `<script src="/js/${f}"></script>`).join("\n")}`;

const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  if (u === "/qc.html") { r.writeHead(200, { "Content-Type": "text/html" }); return r.end(PAGE); }
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": f.endsWith(".js") ? "text/javascript" : "text/html" });
  r.end(fs.readFileSync(f));
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--no-sandbox"] });
  const pg = await b.newPage({ viewport: { width: 1040, height: 640 } });
  const pageErrs = [];
  pg.on("pageerror", e => pageErrs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/qc.html`);
  await pg.waitForTimeout(300);

  const res = await pg.evaluate((only) => {
    const out = [];
    const cv = document.createElement("canvas"); cv.width = 980; cv.height = 580;
    const x = cv.getContext("2d");

    const kinds = R360Diagrams.kinds.filter(k => !only || only.indexOf(k) >= 0);
    for (const k of kinds) {
      const dg = R360Diagrams.build(k);
      const W = dg.w, H = dg.h;
      for (let s = 0; s < dg.steps.length; s++) {
        // t = 1 is the resting state a paused step is read at, and t = .4 is
        // roughly mid-animation; a label can be clear in one and not the other.
        for (const t of [0.4, 1]) {
          const d = R360Diagrams.Draw(x, W, H);
          const texts = [], inside = [], all = [];
          /* d.box and d.chip draw their own labels through d.text. A chip flying
           * over a cell is the animation working, so label-against-label is not
           * compared - but a chip or box landing on a free-standing caption is a
           * real fault, and suppressing those wholesale hid a chip sitting on top
           * of a subtitle. So: free text against free text, and anything drawn
           * inside a shape against free text, but never shape against shape. */
          let nested = 0;
          const note = (r, kind, what) => {
            all.push(r);
            if (kind !== "text") return;
            (nested ? inside : texts).push(Object.assign({ what }, r));
          };
          // --- wrap the helper, keeping return values intact
          const oDot = d.dot.bind(d);
          d.dot = (cx, cy, r, o) => { nested++; oDot(cx, cy, r, o); nested--; };
          const oText = d.text.bind(d);
          d.text = (tx, ty, str, o) => {
            o = o || {};
            const size = oText(tx, ty, str, o);
            if (str === undefined || str === null || String(str) === "") return size;
            d.font(size, o.weight);
            const w = x.measureText(String(str)).width;
            const al = o.align || "left";
            const x0 = al === "center" ? tx - w / 2 : al === "right" ? tx - w : tx;
            const bl = o.baseline || "alphabetic";
            const y0 = bl === "middle" ? ty - size * .55 : bl === "top" ? ty : ty - size * .8;
            note({ x: x0, y: y0, w, h: size * 1.1, text: String(str), size }, "text", "text");
            /* Every label goes through here, including the ones d.box and d.chip
             * draw, and d.box shrinks a label to fit its width. So the size that
             * actually came out is the thing to judge - modelling d.box's own
             * padding here just gave the checker its own sums to get wrong.
             * What matters is text SHRUNK below what was asked for: 10px chosen
             * deliberately for fine print is fine, 10px because the box was too
             * narrow is a label nobody can read. */
            const want = o.size || 16;
            if (t === 1 && size < want - 1.5 && size < 12 && String(str).trim().length > 1)
              out.push([k, s, t, "tiny",
                `"${String(str).slice(0, 34)}" asked for ${want}px, squeezed to ${size}px`]);
            return size;
          };
          const oWrap = d.wrap.bind(d);
          d.wrap = (tx, ty, str, maxW, o) => {
            const h = oWrap(tx, ty, str, maxW, o);
            note({ x: tx, y: ty, w: maxW, h, text: String(str).slice(0, 40) }, "text", "wrap");
            return h;
          };
          const oBox = d.box.bind(d);
          d.box = (bx, by, bw, bh, o) => {
            nested++; oBox(bx, by, bw, bh, o); nested--;
            note({ x: bx, y: by, w: bw, h: bh, text: (o && o.label) || "" }, "box", "box");
          };
          const oChip = d.chip.bind(d);
          d.chip = (cx, cy, label, o) => {
            nested++; const r = oChip(cx, cy, label, o); nested--;
            note({ x: cx - r.w / 2, y: cy - r.h / 2, w: r.w, h: r.h, text: String(label) }, "other", "chip");
            return r;
          };

          try { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); dg.render(d, s, t); }
          catch (e) { out.push([k, s, t, "error", e.message]); continue; }

          // --- 1. anything off the edge
          for (const r of all) {
            const over = Math.max(0 - r.x, 0 - r.y, (r.x + r.w) - W, (r.y + r.h) - H);
            if (over > 2) out.push([k, s, t, "outside",
              `"${(r.text || "").slice(0, 30)}" by ${Math.round(over)}px`]);
          }
          // --- 2. text on top of text
          const pairs = [];
          for (let i = 0; i < texts.length; i++) {
            for (let j = i + 1; j < texts.length; j++) pairs.push([texts[i], texts[j]]);
            for (let j = 0; j < inside.length; j++) pairs.push([texts[i], inside[j]]);
          }
          for (const pr of pairs) {
            const A = pr[0], B = pr[1];
            const ow = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
            const oh = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
            if (ow <= 1 || oh <= 1) continue;
            /* A value in flight over the place it is going shows the same text
             * twice, and text being typed shows a prefix of itself. Neither is
             * two captions colliding. Unrelated text still is - which is how the
             * chip sitting on top of the interpreter's subtitle was found. */
            const ta = String(A.text || ""), tb = String(B.text || "");
            if (ta && tb && (ta.indexOf(tb) >= 0 || tb.indexOf(ta) >= 0)) continue;
            const frac = (ow * oh) / Math.max(1, Math.min(A.w * A.h, B.w * B.h));
            if (frac > .34) out.push([k, s, t, "overlap",
              `"${(A.text || "").slice(0, 24)}" and "${(B.text || "").slice(0, 24)}" ${Math.round(frac * 100)}%`]);
          }
        }
      }
    }
    return out;
  }, only);

  // one line per distinct fault, not one per t
  const seen = new Map();
  for (const [k, s, t, kind, msg] of res) {
    const key = [k, s, kind, msg].join("|");
    if (!seen.has(key)) seen.set(key, { k, s, kind, msg });
  }
  const rows = [...seen.values()];
  const by = {};
  rows.forEach(r => { (by[r.kind] = by[r.kind] || []).push(r); });
  for (const kind of ["error", "outside", "tiny", "overlap"]) {
    if (!by[kind]) continue;
    console.log(`\n${kind}:`);
    by[kind].sort((a, b) => a.k.localeCompare(b.k) || a.s - b.s)
      .forEach(r => console.log(`  ${r.k.padEnd(15)} step ${r.s + 1}  ${r.msg}`));
  }
  /* Every diagram named in an experience must exist. R360Diagrams.build falls
   * back to the first registered diagram for an unknown name, so a typo in a
   * placement opens the wrong diagram with no error anywhere. */
  const registered = await pg.evaluate(() => R360Diagrams.kinds);
  const expDir = path.join(ROOT, "experiences");
  const placed = new Map();
  for (const f of fs.readdirSync(expDir).filter(f => f.endsWith(".json") && f !== "registry.json")) {
    let d; try { d = JSON.parse(fs.readFileSync(path.join(expDir, f), "utf8")); } catch (e) { continue; }
    for (const sc of d.scenes || [])
      for (const g of sc.diagrams || [])
        placed.set(g.diagram, (placed.get(g.diagram) || 0) + 1);
  }
  const missing = [...placed.keys()].filter(k => registered.indexOf(k) < 0);
  const unplaced = registered.filter(k => !placed.has(k));
  if (missing.length) console.log("\nnamed in an experience but not registered:", missing.join(", "));
  if (unplaced.length) console.log("\nregistered but on no station yet:", unplaced.join(", "));
  console.log(`\n${registered.length} diagrams checked, ${placed.size} of them placed; ` +
              `${rows.length} layout problem(s)`);
  rows.push(...missing.map(m => ({ k: m, s: 0, kind: "missing", msg: "not registered" })));
  if (pageErrs.length) console.log("page errors:", pageErrs.slice(0, 5));
  await b.close(); srv.close();
  process.exit(rows.length || pageErrs.length ? 1 : 0);
})();
