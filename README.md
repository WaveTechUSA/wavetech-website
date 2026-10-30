# WaveTech Innovations — website

The source of record for wavetech-usa.com.

```
index.html, video-walls.html, av-integration.html, emergency-maintenance.html
      Standalone pages — open directly or host anywhere as a static site.
site.js        Page runtime: expands each page's template (sc-for / sc-if / holes) and handles
               the interactive pieces (pixel-pitch picker, before/after slider).
assets/        All images, served to the live site through jsDelivr:
               https://cdn.jsdelivr.net/gh/WaveTechUSA/wavetech-website@main/assets/<file>
ghl/           Paste blocks for GoHighLevel — one Custom HTML/Javascript element per page.
               index -> /home, video-walls -> /video-walls, av-integration -> /av-integration,
               emergency-maintenance -> /emergency-maintenance
```

## Live pieces
- Instagram feed (Home): SnapWidget `1120103` (wavetech.inn).
- Lead form (all pages): GoHighLevel form `ir9Hi5bSDTWJiR6Zbaoo` ("Get In Touch").
- Social: instagram.com/wavetech.inn · linkedin.com/company/wavetech-innovations · facebook.com/WaveTechInnovations

## Placeholders still to fill
`[PHONE]`, `[EMAIL]`, `[SERVICE AREA]` (contact block + footer, every page) and the profile stats in the Home Instagram mock.

## Updating
Edit the design, re-export, commit. jsDelivr caches `@main` for up to 12 hours; to force a refresh after
changing an image, reference a commit or tag instead of `@main`, or purge via https://www.jsdelivr.com/tools/purge.

Scroll-driven scenes use CSS scroll timelines: full motion in Chrome/Edge; Safari/Firefox show each scene's finished state.
