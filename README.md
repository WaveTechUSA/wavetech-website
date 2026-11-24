# WaveTech Innovations — website

The source of record for wavetech-usa.com. Current build: **v2026.11.24.2** (the rebuild).

```
index.html, video-walls.html, av-integration.html, emergency-maintenance.html
      The four pages, standalone: open directly or host anywhere as a static site.
      Each page carries its own CSS and JavaScript; the only outside files are the photos in assets/.
assets/        All images, served to the live site through jsDelivr:
               https://cdn.jsdelivr.net/gh/WaveTechUSA/wavetech-website@main/assets/<file>
ghl/           Paste blocks for GoHighLevel, one Custom HTML/Javascript element per page.
               index -> /home, video-walls -> /video-walls, av-integration -> /av-integration,
               emergency-maintenance -> /emergency-maintenance
source/        What the pages and paste blocks are generated from (see "Changing the site").
OLD-SITE-ARCHIVE/
               v2026.11.02.4/  the previous site and its paste blocks, kept for a quick roll-back
               OLD-home-page-DO-NOT-USE.html  the original GoHighLevel page
```

## Putting it live
In GoHighLevel, open each page, select its Custom HTML/Javascript element, replace the contents with the
matching file in `ghl/`, Save, Publish. The footer of the live page shows the build number.
To roll back, paste the matching file from `OLD-SITE-ARCHIVE/v2026.11.02.4/ghl/` instead.

jsDelivr caches `@main` for up to 12 hours. After changing a photo, purge it at
https://www.jsdelivr.com/tools/purge or wait.

## Live pieces (don't break)
- Lead form (all pages): GoHighLevel form `ir9Hi5bSDTWJiR6Zbaoo` ("Get In Touch").
- Instagram feed (Home): SnapWidget `1120103` (wavetech.inn).
- Social: instagram.com/wavetech.inn, linkedin.com/company/wavetech-innovations, facebook.com/WaveTechInnovations
- Contact: 201-912-2931, 929-359-0219, support@wavetech-usa.com, area United States.
- Slogan: "Beyond integration. Into innovation." (AV Integration page and every footer).
- Copy never names third-party brands.

## Changing the site
Edit in `source/`, never the generated pages:

```
source/build.js        page content and structure (all copy lives here)
source/src/site.css    layout, type, colours
source/src/app.js      menu, galleries, pitch picker, before/after slider, scroll scenes
source/parts/          the drawn scenes (LED wall, exploded cabinet, room, fault wall, social mock) and their keyframes
```

```
cd source
npm install                      # once: gsap, fonts for the tests
node build.js                    # writes dist/*.html and dist/ghl/*.ghl.html (bump VERSION in build.js first)
node test.js                     # six screen sizes: overflow, pinned scenes fit, slider, pitch picker, menu
PAGES=sim-index,sim-video-walls,sim-av-integration,sim-emergency-maintenance node test.js   # same, inside a simulated builder page
cp dist/*.html ..  &&  cp dist/ghl/*.html ../ghl/      # then commit
```
`node build.js --preview` builds a version with the lead form and Instagram feed replaced by placeholders, for hosts that cannot embed other sites.

## How it works
- Scroll scenes (wall lighting up, exploded cabinet, room, five faults) are CSS keyframes held paused and
  scrubbed by GSAP ScrollTrigger (loaded from cdnjs). Scrolling itself is the browser's own; there is no smooth-scroll library.
- On phones the two 3D scenes are replaced by pre-rendered frames (`assets/m-*.jpg`).
- The paste blocks add a few rules that break out of the builder's centred column and hide any other section on the page.

## Still placeholder
Profile stats in the Home Instagram mock (152 / 2,847 / 184).
