#!/usr/bin/env node
/* Stamps a new build version on every page (footer stamp + #app data-build) and regenerates the GHL blocks.
 *   node tools/bump.js            -> v<today>.1, or .n+1 if today already has a build
 *   node tools/bump.js v2026.12.01.3
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', 'video-walls.html', 'av-integration.html', 'emergency-maintenance.html'];

const cur = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/data-build="(v[\d.]+)"/)[1];
let next = process.argv[2];
if (!next) {
  const d = new Date(), today = `v${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  next = cur.startsWith(today) ? today + '.' + (parseInt(cur.split('.')[3], 10) + 1) : today + '.1';
}
for (const f of PAGES) {
  const p = path.join(ROOT, f), s = fs.readFileSync(p, 'utf8');
  const n = s.split(cur).length - 1;
  if (n !== 2) throw new Error(`${f}: expected 2 occurrences of ${cur}, found ${n}`);
  fs.writeFileSync(p, s.split(cur).join(next));
}
execFileSync(process.execPath, [path.join(__dirname, 'make-ghl.js')], { stdio: 'inherit' });
console.log(`${cur} -> ${next}`);
