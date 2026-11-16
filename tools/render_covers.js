// Render Instagram covers (Reel 1080x1920, Feed 1080x1350): final, text-free, and individual layers.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'covers');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
const ALL = ['01_background', '02_accents', '03_character', '04_text'];
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/covers/cover.html`); await p.evaluate(() => window.READY);
  const save = async (fmt, layers, file) => { const d = await p.evaluate(([f, l]) => window.renderCover(f, l), [fmt, layers]); fs.writeFileSync(path.join(OUT, file), Buffer.from(d.split(',')[1], 'base64')); console.log(file); };
  for (const [fmt, tag] of [['reel', 'A_Reel_1080x1920'], ['feed', 'B_Feed_1080x1350']]) {
    await save(fmt, ALL, `MOONBOY_EP01_Cover_${tag}.png`);
    await save(fmt, ALL.slice(0, 3), `MOONBOY_EP01_Cover_${tag}_textfree.png`);
    fs.mkdirSync(path.join(OUT, 'layers', tag), { recursive: true });
    for (const l of ALL) await save(fmt, [l], `layers/${tag}/${l}.png`);
  }
  await b.close(); srv.close();
})();
