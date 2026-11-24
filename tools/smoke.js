#!/usr/bin/env node
/* Smoke tests for the four pages — run before every push.
 *
 *   node tools/smoke.js            standalone pages, Chromium
 *   node tools/smoke.js --ghl      the ghl/ paste blocks inside a simulated builder page
 *
 * Checks, per page, at desktop (1440), zoomed-out desktop (1920 @ 0.5 zoom-ish via 2880 wide), and phone (390):
 *   - no console errors and no failed asset requests
 *   - no horizontal overflow (document width == viewport width)
 *   - #app rendered with the build stamp, template expanded (no raw holes left on the page)
 *   - the lead-form iframe is present
 *   - interacting (before/after slider, pitch picker) does not change the page width
 *   - scroll scenes: the page scrolls to the footer and the sticky stages never leave the viewport while pinned
 *   - the JS scroll engine (forced) produces the same final state as native scroll-timelines
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const GHL = process.argv.includes('--ghl');
const PAGES = ['index', 'video-walls', 'av-integration', 'emergency-maintenance'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'zoomed-out', width: 2880, height: 1600 },
  { name: 'phone', width: 390, height: 844, mobile: true },
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let url = req.url.split('?')[0];
      if (GHL && url.startsWith('/ghl/')) {
        // simulated GoHighLevel page: centered column, extra old sections, our block in one section
        const name = url.slice(5).replace(/\.html$/, '');
        const block = fs.readFileSync(path.join(ROOT, 'ghl', name + '.ghl.html'), 'utf8')
          .split('https://cdn.jsdelivr.net/gh/WaveTechUSA/wavetech-website@main/assets/').join('/assets/');
        const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GHL sim</title><link rel="icon" href="/assets/wt-mark.png">
<style>body{margin:0;background:#fff}.c-section{width:100%}.c-row{max-width:1170px;margin:0 auto;overflow:hidden}.c-column{padding:10px}</style></head>
<body><div class="hl_page-creator--section c-section old-top"><div class="c-row"><div class="c-column"><h2>OLD SECTION (should be hidden)</h2></div></div></div>
<div class="hl_page-creator--section c-section"><div class="c-row"><div class="c-column">${block}</div></div></div>
<div class="hl_page-creator--section c-section old-bottom"><div class="c-row"><div class="c-column"><h2>OLD FOOTER (should be hidden)</h2></div></div></div>
</body></html>`;
        res.writeHead(200, { 'content-type': 'text/html' }); res.end(page); return;
      }
      if (url === '/') url = '/index.html';
      const file = path.join(ROOT, decodeURIComponent(url));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('nope'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, base: 'http://127.0.0.1:' + srv.address().port }));
  });
}

const failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); return ok; }

async function testPage(browser, base, name, vp, forceEngine) {
  const label = `${name} @ ${vp.name}${forceEngine ? ' (js engine)' : ''}`;
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: vp.mobile ? 3 : 1 });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('requestfailed', r => { if (!/msgsndr|snapwidget|googleapis|gstatic|leadconnector/.test(r.url())) failed.push(r.url()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) failed.push(r.status() + ' ' + r.url()); });
  if (forceEngine) await page.addInitScript(() => { window.__forceNoSDA = true; });
  // third-party embeds are not under test: stub them so the run is deterministic offline
  await page.route(/msgsndr|snapwidget|leadconnector|googleapis|gstatic/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));

  const url = base + (GHL ? '/ghl/' + name + '.html' : '/' + name + '.html');
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(400);

  const vw = () => page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, document.body.scrollWidth]);
  let [sw, iw] = await vw();
  check(sw <= iw, `${label}: horizontal overflow (${sw} > ${iw})`);

  const info = await page.evaluate(() => {
    const app = document.getElementById('app');
    const txt = app ? app.innerText : '';
    return {
      app: !!app, build: app && app.getAttribute('data-build'), children: app ? app.children.length : 0,
      rawHoles: /\{\{|\[\[/.test(txt),
      form: !!document.querySelector('iframe[src*="ir9Hi5bSDTWJiR6Zbaoo"]'),
      oldSections: Array.from(document.querySelectorAll('.old-top,.old-bottom')).filter(e => getComputedStyle(e).display !== 'none').length,
      icons: Array.from(document.querySelectorAll('link[rel~="icon"]')).map(l => l.getAttribute('href')),
      bg: getComputedStyle(document.body).backgroundColor,
    };
  });
  check(info.app && info.children > 0, `${label}: #app not rendered`);
  check(/^v\d{4}\.\d{2}\.\d{2}\.\d+$/.test(info.build || ''), `${label}: bad build stamp ${info.build}`);
  check(!info.rawHoles, `${label}: unexpanded template holes visible`);
  check(info.form, `${label}: lead form iframe missing`);
  check(info.icons.length > 0 && info.icons.every(h => /favicon-\d+\.png/.test(h)), `${label}: favicon links wrong: ${info.icons.join(', ')}`);
  if (GHL) {
    check(info.oldSections === 0, `${label}: old builder sections still visible`);
    check(info.bg === 'rgb(9, 9, 22)', `${label}: body background not navy (${info.bg})`);
  }

  // interactions must not change page width (regression: morph once replaced #app and the page shrank)
  const before = (await vw())[0];
  const range = await page.$('input[type="range"]');
  if (range) {
    await range.focus();
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const after = (await vw())[0];
    check(after === before, `${label}: page width changed after slider (${before} -> ${after})`);
    const appId = await page.evaluate(() => !!document.getElementById('app'));
    check(appId, `${label}: #app lost its id after interaction`);
  }
  const buttons = await page.$$('#app button');
  if (buttons.length) {
    await buttons[Math.min(2, buttons.length - 1)].click({ force: true }).catch(() => {});
    await page.waitForTimeout(150);
    const after = (await vw())[0];
    check(after === before, `${label}: page width changed after button click (${before} -> ${after})`);
  }

  // scroll the whole page; sticky stages must stay inside the viewport while their track is in view
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let stuckViolations = 0, stepsOut = 0;
  for (let y = 0; y < total; y += Math.round(vp.height * 0.6)) {
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(60);
    const r = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('[class*="track-"]').forEach(t => {
        const tr = t.getBoundingClientRect(); const st = t.querySelector('.stage'); if (!st) return;
        const sr = st.getBoundingClientRect();
        const pinned = tr.top <= 0 && tr.bottom >= window.innerHeight;
        if (pinned && (sr.top > 2 || sr.bottom < window.innerHeight - 2) && sr.height >= window.innerHeight - 2) out.push([t.className, Math.round(sr.top), Math.round(sr.bottom)]);
      });
      return out;
    });
    if (r.length) stuckViolations++;
    stepsOut++;
  }
  check(stuckViolations === 0, `${label}: sticky stage left the viewport while pinned (${stuckViolations}/${stepsOut} steps)`);
  [sw, iw] = await vw();
  check(sw <= iw, `${label}: horizontal overflow after scrolling (${sw} > ${iw})`);

  // final state snapshot (used to compare native vs js engine)
  const finalState = await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    return new Promise(res => setTimeout(() => {
      const pick = ['.lit', '.cap-a', '.cap-b', '.badge', '.ok', '.flag'];
      const o = {};
      // the js engine stops at 99.9% of each keyframe track, so round before comparing with native
      const r2 = v => String(v).replace(/-?\d+(\.\d+)?/g, m => (Math.round(parseFloat(m) * 2) / 2).toString());
      pick.forEach(s => { const n = document.querySelector(s); if (n) { const cs = getComputedStyle(n); o[s] = r2([cs.opacity, cs.clipPath].join('|')); } });
      res(o);
    }, 300));
  });

  check(errors.length === 0, `${label}: console errors: ${errors.slice(0, 3).join(' || ')}`);
  check(failed.length === 0, `${label}: failed requests: ${failed.slice(0, 3).join(', ')}`);
  await ctx.close();
  return finalState;
}

(async () => {
  const { srv, base } = await serve();
  const browser = await chromium.launch();
  for (const name of PAGES) {
    for (const vp of VIEWPORTS) {
      const native = await testPage(browser, base, name, vp, false);
      if (vp.name === 'desktop') {
        const engine = await testPage(browser, base, name, vp, true);
        for (const k of Object.keys(native)) check(native[k] === engine[k], `${name}: js engine end state differs from native for ${k} (${native[k]} vs ${engine[k]})`);
      }
      process.stdout.write('.');
    }
  }
  await browser.close(); srv.close();
  console.log('\n' + (GHL ? 'GHL blocks' : 'standalone pages') + ': ' + (failures.length ? failures.length + ' FAILURE(S)' : 'all checks passed'));
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
