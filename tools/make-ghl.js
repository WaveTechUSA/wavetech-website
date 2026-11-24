#!/usr/bin/env node
/* Builds the GoHighLevel paste blocks (ghl/*.ghl.html) from the standalone pages.
 *
 *   node tools/make-ghl.js           rewrite ghl/*.ghl.html
 *   node tools/make-ghl.js --check   exit 1 if ghl/ is out of date (used by CI)
 *
 * The standalone pages (index.html, video-walls.html, ...) are the source of truth.
 * Each block is one Custom HTML/Javascript element: fonts, page CSS, builder break-out CSS,
 * the page template, the runtime and the page logic. Differences from the standalone page:
 *   - {{holes}} become [[holes]]  (GHL treats {{ }} as merge fields and strips them)
 *   - assets/… become the jsDelivr CDN URL for this repo
 *   - page links become the GHL paths (/home, /video-walls, …)
 *   - favicon links become absolute (the block has no <head>; GHL serves the page, not this repo)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CDN = 'https://cdn.jsdelivr.net/gh/WaveTechUSA/wavetech-website@main/assets/';
const PAGES = {
  'index.html': '/home',
  'video-walls.html': '/video-walls',
  'av-integration.html': '/av-integration',
  'emergency-maintenance.html': '/emergency-maintenance',
};
const BREAKOUT = `<style>
/* break out of the builder's centered column: full-bleed, own background */
html,body{background:#090916!important}
html{overflow-x:clip}
#app{position:relative;width:100vw;margin-left:calc(50% - 50vw);box-sizing:border-box;overflow-x:clip}
/* the new site is the only content on the page: hide every other builder section, at every width */
.c-section:not(:has(#app)),.hl_page-creator--section:not(:has(#app)),body>section:not(:has(#app)){display:none!important}
/* the scroll scenes pin with position:sticky; no ancestor may clip or scroll */
#app *{overflow-anchor:auto}
.c-section,.c-row,.c-column,.c-wrapper,.hl_page-creator--section,.hl_page-creator--row,.hl_page-creator--col{overflow:visible!important}
</style>`;

function between(src, startRe, endRe, label) {
  const s = src.search(startRe);
  if (s < 0) throw new Error('missing ' + label + ' start');
  const e = src.slice(s).search(endRe);
  if (e < 0) throw new Error('missing ' + label + ' end');
  const endLen = src.slice(s + e).match(endRe)[0].length;
  return src.slice(s, s + e + endLen);
}

function holes(s) { return s.replace(/\{\{/g, '[[').replace(/\}\}/g, ']]'); }
function links(s) {
  for (const [file, route] of Object.entries(PAGES)) {
    s = s.split('href="' + file + '"').join('href="' + route + '"');
  }
  return s;
}
function assets(s) { return s.replace(/(["'(])assets\//g, '$1' + CDN); }

function runtimeForGhl(js) {
  return js
    .replace('{{holes}}', '[[holes]]')
    .split("indexOf('{{')").join("indexOf('[[')")
    .replace("var HOLE = /\\{\\{\\s*([^}]+?)\\s*\\}\\}/g;", "var HOLE = /\\[\\[\\s*([^\\]]+?)\\s*\\]\\]/g;")
    .replace("var WHOLE = /^\\{\\{\\s*([^}]+?)\\s*\\}\\}$/;", "var WHOLE = /^\\[\\[\\s*([^\\]]+?)\\s*\\]\\]$/;");
}

function build(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const runtime = fs.readFileSync(path.join(ROOT, 'site.js'), 'utf8');
  const route = PAGES[file];

  const version = (html.match(/data-build="([^"]+)"/) || [])[1];
  if (!version) throw new Error(file + ': no data-build on #app');

  const headLinks = html.match(/<link rel="icon"[^\n]*\n(?:<link[^\n]*\n)*/);
  if (!headLinks) throw new Error(file + ': icon/font links not found');
  const icons = headLinks[0].split('\n').filter(l => /rel="(icon|apple-touch-icon)"/.test(l))
    .map(l => l.replace(/href="assets\//, 'href="' + CDN)).join('\n');
  const fonts = headLinks[0].split('\n').filter(l => l && !/rel="(icon|apple-touch-icon)"/.test(l)).join('\n');

  const css = between(html, /<style>/, /<\/style>/, 'page css');
  const tpl = assets(links(holes(between(html, /<template id="dc-tpl">/, /<\/template>/, 'template'))));
  const schema = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/);
  const app = `<div id="app" data-build="${version}"></div>`;
  const logicStart = html.indexOf('<script>', html.indexOf('<div id="app"'));
  const logicEnd = html.indexOf('</script>', logicStart);
  const logic = assets(html.slice(logicStart + '<script>'.length, logicEnd).replace(/^\n/, '').replace(/\n$/, ''));
  const tail = (html.match(/<script src="https:[^\n]*>\s*<\/script>/g) || []).join('\n');

  return [
    `<!-- WaveTech Innovations — ${route} — build ${version} — paste into one Custom HTML/Javascript element -->`,
    icons,
    fonts,
    css,
    BREAKOUT,
    tpl,
    ...(schema ? [schema[0]] : []),
    app,
    '<script>',
    runtimeForGhl(runtime).replace(/\n$/, ''),
    '</script>',
    '<script>',
    logic,
    '',
    '</script>',
    tail,
    '',
  ].join('\n');
}

const check = process.argv.includes('--check');
let stale = 0;
for (const file of Object.keys(PAGES)) {
  const out = path.join(ROOT, 'ghl', file.replace(/\.html$/, '.ghl.html'));
  const next = build(file);
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur === next) { console.log('up to date  ' + path.relative(ROOT, out)); continue; }
  if (check) { console.log('OUT OF DATE ' + path.relative(ROOT, out)); stale++; continue; }
  fs.writeFileSync(out, next);
  console.log('wrote       ' + path.relative(ROOT, out));
}
if (stale) { console.error('\nRun: node tools/make-ghl.js'); process.exit(1); }
