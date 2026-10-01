const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const S = process.env.DIAG_OUT || require('os').tmpdir() + '/r360diag';
fs.mkdirSync(S, { recursive: true });
const srv = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  const f = p === '/shoot.html' ? path.join(ROOT, 'tools/diagrams/shoot.html') : path.join(ROOT, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(fs.readFileSync(f));
});
(async () => {
  await new Promise(r => srv.listen(8141, r));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox'] });
  for (const k of process.argv.slice(2)) {
    const pg = await b.newPage({ viewport: { width: 1040, height: 620 } });
    pg.on('pageerror', e => console.error('ERR', k, e.message));
    pg.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', k, m.text()); });
    await pg.goto(`http://localhost:8141/shoot.html?k=${k}`);
    await pg.waitForTimeout(300); await pg.evaluate(() => window.start());
    await pg.waitForTimeout(300);
    const n = await pg.evaluate(() => window.V.steps.length);
    for (let i = 0; i < n; i++) {
      await pg.evaluate(i => window.V.select(i), i);
      await pg.waitForTimeout(1400);          // let the within-step animation settle
      await pg.locator('#c').screenshot({ path: `${S}/d_${k}_${i}.png` });
    }
    console.log(k, n, 'steps ->', S);
    await pg.close();
  }
  await b.close(); srv.close();
})();
