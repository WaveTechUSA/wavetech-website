# WaveTech Innovations — website

The source of record for wavetech-usa.com. Edit here, test here, then paste into GoHighLevel.

```
index.html, video-walls.html, av-integration.html, emergency-maintenance.html
      The pages. Standalone: open directly or host anywhere as a static site. EDIT THESE.
site.js        Page runtime: expands each page's template (sc-for / sc-if / {{holes}}), handles the
               interactive pieces (pixel-pitch picker, before/after slider), drives the scroll scenes
               where the browser has no CSS scroll timelines, hides the builder's other sections.
assets/        All images + favicons, served to the live site through jsDelivr:
               https://cdn.jsdelivr.net/gh/WaveTechUSA/wavetech-website@main/assets/<file>
ghl/           GENERATED paste blocks for GoHighLevel — one Custom HTML/Javascript element per page.
               index -> /home, video-walls -> /video-walls, av-integration -> /av-integration,
               emergency-maintenance -> /emergency-maintenance.  Never hand-edit; run tools/make-ghl.js.
tools/         make-ghl.js (pages -> ghl blocks), smoke.js (browser tests), bump.js (new build stamp)
.github/       CI: every push runs the smoke tests and checks ghl/ is in sync with the pages.
```

## Workflow

1. Edit the page(s) and/or `site.js`.
2. `node tools/bump.js` — stamps a new build version (`v<date>.<n>`, shown in the footer and on `#app`) and regenerates `ghl/`.
3. `node tools/smoke.js && node tools/smoke.js --ghl` — must both say *all checks passed* (needs `npm i playwright && npx playwright install chromium` once).
4. Commit and push. CI repeats step 3.
5. In GoHighLevel, open each changed page → the Custom HTML/Javascript element → replace its contents with the matching `ghl/*.ghl.html` → Save → Publish. The live footer should show the new build stamp.

**Staging preview:** turn on GitHub Pages (repo Settings → Pages → Branch `main`, folder `/`) and the standalone pages are viewable at `https://wavetechusa.github.io/wavetech-website/` (`/video-walls.html`, etc.) — same code as the paste blocks, minus the builder.

jsDelivr caches `@main` for up to 12 hours; after changing an image either purge (https://www.jsdelivr.com/tools/purge) or wait.

## What the smoke tests check
Per page, at desktop / zoomed-out / phone widths, native scroll timelines and the JS engine: no console errors or failed assets, no horizontal overflow, template fully expanded, build stamp present, lead-form iframe present, page width unchanged after using the slider / picker, sticky scenes stay pinned while scrolling, favicon links correct. In `--ghl` mode the block is placed inside a simulated builder page with old sections above and below, which must end up hidden with the navy background on `body`.

## Live pieces (don't break)
- Lead form (all pages): GoHighLevel form `ir9Hi5bSDTWJiR6Zbaoo` ("Get In Touch").
- Instagram feed (Home): SnapWidget `1120103` (wavetech.inn).
- Social: instagram.com/wavetech.inn · linkedin.com/company/wavetech-innovations · facebook.com/WaveTechInnovations
- Contact: 201-912-2931 · 929-359-0219 · info@wavetech-usa.com · service area International.
- Copy never names third-party brands.

## SEO
Each page carries its own title, description, canonical (`https://wavetech-usa.com/<path>`), Open Graph tags and JSON-LD (Organization + Service). In GoHighLevel the `<title>`/description come from the page's SEO Meta Data settings — keep them matching the values in the page `<head>` here. The JSON-LD is inside the paste block, so it ships with it.

## Favicon
Square set in `assets/` (`favicon-32/64/512.png`, `apple-touch-icon.png`). The paste blocks link them absolutely and `site.js` removes any other icon the host page declared, so the builder's stretched logo no longer shows. Setting the Favicon URL in each page's SEO Meta Data to `https://cdn.jsdelivr.net/gh/WaveTechUSA/wavetech-website@main/assets/favicon-512.png` as well is belt-and-braces.

## Still placeholder
Profile stats in the Home Instagram mock (152 / 2,847 / 184).

## Notes
Scroll-driven scenes use CSS scroll timelines where the browser has them (Chrome, Edge, Safari 26+); everywhere else `site.js` drives the same keyframes from scroll position. On phones the two 3D scenes are replaced by pre-rendered frames (`assets/m-*.jpg`) that crossfade with scroll. The pages were originally generated from a Claude Design canvas; that exporter is retired (its last copy is in git history as `tools-build_site.py`) — the HTML here is the source now.
