// Headless frame renderer.  node tools/render.js <outdir> [fromFrame] [toFrame] [step] [workers] [--times t1,t2,...]
// Serves the project over a local http server and draws each frame in Chromium canvas, writing PNGs.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), out = args[0] || 'output/frames';
const ti = args.indexOf('--times'); const TIMES = ti >= 0 ? args[ti + 1].split(',').map(Number) : null;
const FPS = 24, from = +(args[1] || 0), to = +(args[2] || 839), step = +(args[3] || 1), NW = +(args[4] || 4);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--disable-web-security'] });
  const jobs = TIMES ? TIMES.map(t => ({ t, name: `t${t.toFixed(2)}` })) : [];
  if (!TIMES) for (let f = from; f <= to; f += step) jobs.push({ t: f / FPS, name: String(f).padStart(4, '0') });
  let next = 0, done = 0, info = null; const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.min(NW, jobs.length) }, async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('console', m => { if (m.type() === 'error') console.error('PAGE', m.text()); }); page.on('pageerror', e => console.error('PAGEERR', e.message));
    await page.goto(`http://127.0.0.1:${port}/scenes/episode.html`); info = await page.evaluate(() => window.READY);
    while (next < jobs.length) { const j = jobs[next++]; const d = await page.evaluate((t) => window.frameData(t), j.t);
      fs.writeFileSync(path.join(out, j.name + '.png'), Buffer.from(d.split(',')[1], 'base64')); done++;
      if (done % 48 === 0) console.log(`${done}/${jobs.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
    await page.close(); }));
  fs.writeFileSync(path.join(out, '_info.json'), JSON.stringify(info, null, 1));
  await browser.close(); srv.close(); console.log('rendered', done, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
})().catch(e => { console.error(e); process.exit(1); });
