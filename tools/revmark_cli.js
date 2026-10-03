/* Mark a batch of answers with the site's own marker, for the Python tools.
 *
 * Reads { jobs: [ { question, answer, claimed? } ] } on stdin and writes
 * { results: [ ... ] } on stdout. The point is that tools/revwritten.py and
 * tools/revqa.py mark with js/revmark.js itself rather than with a second
 * implementation in Python: a checker that marks its own way can agree with
 * itself while the site disagrees with both.
 */
const path = require("path");
const M = require(path.join(__dirname, "..", "js", "revmark.js"));

let raw = "";
process.stdin.on("data", d => { raw += d; });
process.stdin.on("end", () => {
  const job = JSON.parse(raw);
  const results = job.jobs.map(j => {
    try {
      const r = M.mark(j.question, j.claimed !== undefined ? j.claimed : j.answer);
      return { got: r.got, max: r.max, earned: r.earned, missed: r.missed,
               dump: !!r.dump, capped: r.capped || null, source: r.source,
               detail: r.detail || null, canImprove: !!r.canImprove };
    } catch (e) {
      return { error: String(e && e.message || e) };
    }
  });
  process.stdout.write(JSON.stringify({ results }));
});
