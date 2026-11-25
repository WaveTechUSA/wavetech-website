#!/usr/bin/env node
/* Builds the rebuilt WaveTech pages into dist/. `--preview` swaps third-party iframes for labelled placeholders
   (the preview host cannot embed other sites) and writes dist/artifact-index.html as a head-less fragment. */
'use strict';
const fs = require('fs'), path = require('path');
const HERE = __dirname, SRC = path.join(HERE, 'src'), PARTS = path.join(HERE, 'parts'), DIST = path.join(HERE, 'dist');
const REPO = process.env.WT_REPO || path.resolve(__dirname, '..');
const PREVIEW = process.argv.includes('--preview');
const CDN = 'https://cdn.jsdelivr.net/gh/WaveTechUSA/wavetech-website@main/assets/';
const ROUTES = { 'index.html': '/home', 'video-walls.html': '/video-walls', 'av-integration.html': '/av-integration', 'emergency-maintenance.html': '/emergency-maintenance' };
const BREAKOUT = `html,body{background:#090916!important}html{overflow-x:clip}
#site{width:100vw;margin-left:calc(50% - 50vw)}
.c-section:not(:has(#site)),.hl_page-creator--section:not(:has(#site)),body>section:not(:has(#site)){display:none!important}
.c-section,.c-row,.c-column,.c-wrapper,.hl_page-creator--section,.hl_page-creator--row,.hl_page-creator--col{overflow:visible!important;max-width:none!important;padding:0!important;margin:0!important}`;
const VERSION = PREVIEW ? 'rebuild preview 4' : 'v2026.11.24.3';
const read = f => fs.readFileSync(f, 'utf8');
const part = n => read(path.join(PARTS, n));

/* ---- scene css: the existing keyframes, minus page chrome and CSS scroll-timelines (GSAP scrubs them now) ---- */
function sceneCss() {
  let css = part('old.css');
  css = css.replace(/@media \(max-width:760px\)\{\n\.bleedph,[\s\S]*?\n\}\n/, '');
  css = css.replace(/@media \(max-width:760px\)\{\.bleedph\{[^}]*\}\}\n/, '');
  const drop = /^(body|a\{|input|\.glow|\.pill|\.cta|\.grad|\.lbl|\.rimg|\.gal|\.stage|\.track-|\.zoomin|\.rv|@keyframes rvUp|\.sgw|\.scr)/;
  css = css.split('\n').filter(l => !drop.test(l.trim())).join('\n');
  css = css.replace(/animation-timeline:[^;}]*;?/g, '').replace(/animation-range:[^;}]*;?/g, '');
  css = css.replace(/\.no-sda /g, '.sd ');
  return css;
}

const table = JSON.parse(part('table.json'));
table.items = table.items.filter(i => i.tl !== 'view()' && i.tl !== '--sg');
delete table.tracks['--sg'];

/* ---- shared pieces ---- */
const L = (...lines) => lines.map((t, i) => `<span class="w-line${lines.length > 1 && i === lines.length - 1 ? ' w-grad' : ''}"><span>${t}</span></span>`).join('');
const PAGES = { home: 'index.html', vw: 'video-walls.html', av: 'av-integration.html', svc: 'emergency-maintenance.html' };

const nav = cur => `
<header class="w-nav"><div class="w-wrap w-nav-in">
  <a class="w-logo" href="${PAGES.home}" aria-label="WaveTech Innovations home"><img src="assets/wavetech-innovations.png" alt="WaveTech Innovations" width="180" height="36"></a>
  <nav class="w-nav-links" aria-label="Services">
    <a href="${PAGES.vw}"${cur === 'vw' ? ' aria-current="page"' : ''}>Video walls</a>
    <a href="${PAGES.av}"${cur === 'av' ? ' aria-current="page"' : ''}>AV integration</a>
    <a href="${PAGES.svc}"${cur === 'svc' ? ' aria-current="page"' : ''}>Emergency and maintenance</a>
  </nav>
  <a class="w-btn w-btn--solid w-nav-cta" href="#contact">Get a site survey</a>
  <button class="w-burger" type="button" aria-label="Menu" aria-expanded="false"><b>Menu</b><span></span></button>
</div></header>
<div class="w-menu" aria-label="Menu">
  <a href="${PAGES.home}">Home</a><a href="${PAGES.vw}">Video walls</a><a href="${PAGES.av}">AV integration</a><a href="${PAGES.svc}">Emergency and maintenance</a>
  <a class="w-btn w-btn--solid" href="#contact">Get a site survey</a>
</div>`;

const formEmbed = PREVIEW
  ? `<div class="w-embed-note"><b>Lead form</b><span>Your live "Get In Touch" form sits here on the real site. This preview host can't embed it.</span></div>`
  : `<iframe src="https://api.leadconnectorhq.com/widget/form/ir9Hi5bSDTWJiR6Zbaoo" id="inline-ir9Hi5bSDTWJiR6Zbaoo" data-layout='{"id":"INLINE"}' data-trigger-type="alwaysShow" data-activation-type="alwaysActivated" data-deactivation-type="neverDeactivate" data-form-name="Get In Touch" data-height="760" data-layout-iframe-id="inline-ir9Hi5bSDTWJiR6Zbaoo" data-form-id="ir9Hi5bSDTWJiR6Zbaoo" title="Get In Touch"></iframe>`;

const contact = () => `
<section class="w-sec" id="contact"><div class="w-wrap w-contact">
  <div class="w-stack" style="gap:28px">
    <p class="w-kicker">Start here</p>
    <h2 class="w-h2" data-rise>${L('Send us', 'the room')}</h2>
    <p class="w-lede">A rough size and a photo is enough to start. We'll come back with questions, then a site survey and a fixed scope before anything is ordered. Our teams are spread across the US, and we travel for the right project.</p>
    <dl class="w-contact-list">
      <div><dt>Phone</dt><dd><a href="tel:+12019122931">201-912-2931</a><a href="tel:+19293590219">929-359-0219</a></dd></div>
      <div><dt>Email</dt><dd><a href="mailto:support@wavetech-usa.com">support@wavetech-usa.com</a></dd></div>
      <div><dt>Area</dt><dd>United States</dd></div>
    </dl>
  </div>
  <div class="w-form">${formEmbed}</div>
</div></section>`;

const footer = () => `
<footer class="w-foot"><div class="w-wrap w-foot-row">
  <span class="w-foot-brand"><img src="assets/wt-mark.png" alt="WaveTech"><span>© 2026 WaveTech Innovations</span></span>
  <span class="w-foot-tag">“Beyond integration. Into innovation.”</span>
  <span class="w-foot-links"><span>Teams across the US. We travel.</span><span class="w-meta">${VERSION}</span></span>
</div></footer>`;

const slides = items => items.map(([src, alt, cap], i) => `<div class="w-slide${i === 0 ? ' on' : ''}" data-caption="${cap}"><img src="assets/${src}" alt="${alt}"${i ? ' loading="lazy"' : ''}></div>`).join('');

const gallery = (kicker, lines, body, items) => `
<section class="w-gal" data-xfade data-hold="5" aria-label="${kicker}">
  <div class="w-gal-media">${slides(items)}</div><div class="w-gal-shade"></div>
  <div class="w-wrap w-gal-text">
    <p class="w-kicker">${kicker}</p>
    <h2 class="w-h2" data-rise>${L(...lines)}</h2>
    <p class="w-body">${body}</p>
    <div class="w-gal-foot"><span class="w-gal-cap" data-cap></span><span class="w-gal-count"><span class="w-meta" data-count></span><span class="w-ticks"></span></span></div>
  </div>
</section>`;

const bleed = (kicker, lines, lede, wide, portrait, pos, mod = '') => `
<section class="w-bleed${mod}">
  <div class="w-bleed-ph" role="img" style="--ph:url(assets/${wide});--ph-m:url(assets/${portrait});--pos:${pos}"></div><div class="w-bleed-shade"></div>
  <div class="w-wrap w-bleed-text">
    <p class="w-kicker" data-load-fade>${kicker}</p>
    <h1 class="w-h1" data-load>${L(...lines)}</h1>
    <p class="w-lede" data-load-fade>${lede}</p>
    <div class="w-actions" data-load-fade><a class="w-btn w-btn--solid" href="#contact">Get a site survey</a><a class="w-btn w-btn--line" href="${PAGES.home}">All services</a></div>
  </div>
</section>`;

const steps = (kicker, lines, list) => `
<section class="w-sec"><div class="w-wrap">
  <div class="w-sec-head"><div class="w-stack"><p class="w-kicker">${kicker}</p><h2 class="w-h2" data-rise>${L(...lines)}</h2></div></div>
  <ol class="w-steps" data-stagger>${list.map(([t, b], i) => `<li class="w-step"><span class="w-meta">0${i + 1}</span><h3 class="w-h3">${t}</h3><p>${b}</p></li>`).join('')}</ol>
</div></section>`;

/* ---- pages ---- */
const home = () => `
<section class="w-hero"><div class="w-wrap">
  <h1 class="w-h1" data-load>${L('Video walls and AV,', 'engineered end to end')}</h1>
  <div class="w-hero-row">
    <p class="w-lede" data-load-fade>One team designs it, hangs it, programs it and keeps it running. Pick the service you came for.</p>
    <div class="w-actions" data-load-fade><a class="w-btn w-btn--solid" href="#contact">Get a site survey</a><a class="w-btn w-btn--line" href="${PAGES.svc}">Something's down</a></div>
  </div>
  <div class="w-hero-media" data-load-fade><div class="w-frame w-hero-frame" data-xfade data-hold="5">
    ${slides([
      ['vw-install-3.jpg', 'A floor-to-ceiling LED wall in an office lobby', 'Lobby LED wall'],
      ['svc-field-5.jpg', 'A WaveTech technician lifting an LED module into an outdoor wall', 'Module swap on site'],
      ['vw-install-1.jpg', 'An LED video wall at the head of a boardroom table', 'Boardroom LED wall'],
      ['av-above-ceiling.jpg', 'A technician on a ladder working above the ceiling grid', 'Above the ceiling'],
      ['vw-install-5.jpg', 'An LED wall at a music festival entrance', 'Venue wall, full brightness'],
    ])}
    <div class="w-chip"><i></i><span data-cap></span></div><div class="w-ticks"></div>
  </div></div>
</div></section>

<section class="w-sec"><div class="w-wrap">
  <div class="w-sec-head"><div class="w-stack"><p class="w-kicker">What we do</p><h2 class="w-h2" data-rise>${L('Three services,', 'one crew')}</h2></div></div>
  <div class="w-panels">
    <a class="w-panel is-open" href="${PAGES.vw}"><img src="assets/vw-install-3.jpg" alt="A floor-to-ceiling LED wall in an office lobby"><div class="w-panel-txt"><h3 class="w-h3">Video wall installation</h3><p><span>Designed, hung flat and seamless, calibrated and handed over lit.</span></p><span class="w-panel-go">See the work</span></div></a>
    <a class="w-panel" href="${PAGES.av}"><img src="assets/av-ceiling-panel.jpg" alt="A technician fitting a ceiling panel overhead"><div class="w-panel-txt"><h3 class="w-h3">AV integration</h3><p><span>The whole room on one touch panel: displays, cameras, mics and conferencing.</span></p><span class="w-panel-go">See the work</span></div></a>
    <a class="w-panel" href="${PAGES.svc}"><img src="assets/svc-field-4.jpg" alt="A technician tilting an LED module out of a wall"><div class="w-panel-txt"><h3 class="w-h3">Emergency and maintenance</h3><p><span>Walls and rooms kept running, including the ones we didn't install.</span></p><span class="w-panel-go">See the work</span></div></a>
  </div>
</div></section>

<section class="w-sec"><div class="w-wrap">
  <p class="w-kicker" style="margin-bottom:28px">Built for real-world environments</p>
  <p class="w-statement">Every deployment is backed by field teams, proactive maintenance and a commitment to performance that goes beyond installation day.</p>
  <ul class="w-facts" data-stagger>
    <li class="w-fact"><b>Nationwide coverage</b><span>Field teams across the continental US</span></li>
    <li class="w-fact"><b>WaveTech Assist™ programs</b><span>Managed AV services, post-install</span></li>
    <li class="w-fact"><b>Certified technicians</b><span>Factory-trained on leading platforms</span></li>
  </ul>
</div></section>

<section class="w-sec"><div class="w-wrap w-social">
  <div class="w-stack" style="gap:28px">
    <p class="w-kicker">Follow us</p>
    <h2 class="w-h2" data-rise>${L('Stay connected', 'across platforms')}</h2>
    <p class="w-lede">Real installs. Real results. Follow our latest projects, team deployments, and behind-the-scenes from jobsites nationwide.</p>
    <div class="w-socials"><a href="https://www.instagram.com/wavetech.inn" target="_blank" rel="noopener">Instagram</a><a href="https://www.linkedin.com/company/wavetech-innovations/" target="_blank" rel="noopener">LinkedIn</a><a href="https://www.facebook.com/WaveTechInnovations" target="_blank" rel="noopener">Facebook</a></div>
  </div>
  <div class="w-social-mock">${socialMock()}</div>
</div></section>
${contact()}`;

function socialMock() {
  let m = part('mock.html').replace('flex: 0 1 500px; min-width: 300px;', 'width: 100%; max-width: 520px; margin-left: auto;');
  if (PREVIEW) m = m.replace(/<iframe[^>]*snapwidget[^>]*><\/iframe>/, `<div class="w-embed-note" style="aspect-ratio:3/2;min-height:0;justify-content:center;align-items:center;text-align:center"><b>Live Instagram feed</b><span>Your latest posts load here on the real site.</span></div>`);
  return m;
}

const PITCHES = [
  { label: '0.95', mm: 0.95, wall: '3840 × 2160', wallNote: '4K', ft: '~10 ft' }, { label: '1.27', mm: 1.266, wall: '2880 × 1620', wallNote: 'beyond Full HD', ft: '~13 ft' },
  { label: '1.58', mm: 1.583, wall: '2304 × 1296', wallNote: 'beyond Full HD', ft: '~16 ft' }, { label: '1.90', mm: 1.90, wall: '1920 × 1080', wallNote: 'Full HD', ft: '~19 ft' },
  { label: '2.53', mm: 2.533, wall: '1440 × 810', wallNote: 'below Full HD', ft: '~25 ft' }, { label: '3.17', mm: 3.167, wall: '1152 × 648', wallNote: 'below Full HD', ft: '~32 ft' },
  { label: '3.80', mm: 3.80, wall: '960 × 540', wallNote: 'quarter HD', ft: '~38 ft' }];
const LAYERS = [['1', '#543BB9', 'Pixel cards', 'The LEDs themselves. Eight per cabinet, and each one lifts off the front without a cable.'], ['2', '#2DAA5E', 'Hub board', 'Feeds data and power to every pixel card.'], ['3', '#0DB5EC', 'Receiving cards', 'Two per cabinet. One runs the picture, the other stands by in case it fails.'], ['4', '#8D96A3', 'Power supplies', 'Two in parallel. If one fails, the other carries the cabinet.'], ['5', '#4A5365', 'Cabinet', 'A fan-free housing that doubles as the heat sink, with status lights on the back.']];

const vw = () => `
<section class="track-hero vw-hero" id="top" aria-label="A video wall, cabinet by cabinet, then lit"><div class="w-stage"><div class="w-wrap">
  <div class="w-scene-head">
    <h1 class="w-h1" data-load>${L('Video walls and AV,', 'engineered end to end')}</h1>
    <div class="w-caps" data-load-fade>
      <p class="cap-a"><b>01 Installed</b>Thirty-six cabinets, hung flat and seamless, cabled and powered.</p>
      <p class="cap-b"><b>02 Lit</b>Mapped, calibrated and handed over with the content running.</p>
    </div>
  </div>
  <figure class="w-wallfig" aria-label="A 6 by 6 LED video wall that lights up row by row" data-load-fade>${part('wall.html')}
    <figcaption class="w-meta w-wallfig-cap"><span>165″ wall, 6 × 6 cabinets, fine pitch</span><span class="w-hide-m">Designed, installed, commissioned, serviced</span></figcaption>
  </figure>
</div></div></section>

<section class="track-x" id="anatomy" aria-label="Inside a cabinet"><div class="w-stage"><div class="w-wrap w-two">
  <div class="w-stack">
    <p class="w-kicker">Inside a cabinet</p>
    <h2 class="w-h2">Five layers. <span class="w-gradtxt">We know every one</span></h2>
    <p class="w-body w-hide-m">When a wall misbehaves, the fix lives in one of these parts. Knowing which is most of troubleshooting, and why our service calls end quickly.</p>
    <ol class="w-list w-x-list">${LAYERS.map(([n, c, t, b]) => `<li class="lab"><span class="n" style="background:${c}">${n}</span><span><b>${t}</b><span class="t">${b}</span></span></li>`).join('')}</ol>
  </div>
  <figure class="w-scene-fig" aria-label="Exploded view of one LED cabinet: pixel cards, hub board, receiving cards, power supplies and the cabinet housing">
    ${part('xwrap.html')}
    <figcaption class="w-meta"><span>Exploded view, one LED cabinet, front service</span><span class="w-hide-m">One card shown lifted</span></figcaption>
  </figure>
</div></div></section>

<section class="w-sec" id="pitch"><div class="w-wrap w-pitch" data-pitch='${JSON.stringify(PITCHES)}'>
  <div class="w-stack" style="gap:26px">
    <p class="w-kicker">Pixel pitch</p>
    <h2 class="w-h2" data-rise>${L('Same wall,', 'seven pitches')}</h2>
    <p class="w-body">Pitch is the gap between pixels. It decides how sharp the wall looks and how close people can stand. Pick one and see the difference.</p>
    <fieldset style="border:0;margin:0;padding:0"><legend class="w-meta" style="padding:0;margin-bottom:12px">Pitch in mm</legend>
      <div class="w-seg">${PITCHES.map((p, i) => `<button type="button" aria-pressed="${i === 3}">${p.label}</button>`).join('')}</div></fieldset>
    <div class="w-stats">
      <div class="w-stat"><small>Resolution on a 165″ wall</small><b data-res>1920 × 1080</b><span data-note>Full HD</span></div>
      <div class="w-stat"><small>Closest comfortable view</small><b data-ft>~19 ft</b><span>Rule of thumb</span></div>
    </div>
    <p class="w-meta">We confirm the right pitch for your space on the site survey.</p>
  </div>
  <figure class="w-stack" style="gap:12px" aria-label="Magnified patch of an LED surface at the selected pixel pitch">
    <div class="w-patch" data-clip><div class="px" style="background-size:3.958% 7.037%;background-position:0 0"></div><span class="w-patch-tag">1.90 mm</span></div>
    <figcaption class="w-meta">A 48 × 27 mm patch of the wall, magnified</figcaption>
  </figure>
</div></section>

${gallery('Installed', ['Hung flat, matched,', 'handed over lit'], 'Lobbies, boardrooms and venues. Every wall is mapped, seam-matched and colour-calibrated before anyone sees it.', [
  ['vw-install-1.jpg', 'An LED video wall at the head of a boardroom table', 'Boardroom LED wall'], ['vw-install-3.jpg', 'A floor-to-ceiling LED wall in an office lobby', 'Lobby LED wall'],
  ['vw-install-2.jpg', 'An LED scoreboard and video board in a gymnasium', 'Gym scoreboard and video board'], ['vw-install-5.jpg', 'An LED wall at a music festival entrance', 'Venue wall, full brightness'],
  ['vw-install-4.jpg', 'A display above a stairwell in an office lobby', 'Stairwell display'], ['vw-install-7.jpg', 'Two displays side by side in a meeting room', 'Dual-display meeting room'],
  ['vw-install-6.jpg', 'A display on floor stands in a hotel room', 'Hospitality display']])}
${steps('What happens next', ['From the first visit', 'to a lit wall'], [
  ['Survey', 'We measure the wall, check structure, power and data, and agree the size and pitch for your space.'],
  ['Design and build', 'Drawings and a fixed price first. Then mounting bars, cabinets, cabling and processing, coordinated with your contractor.'],
  ['Calibrate and hand over', 'Mapped, seam-matched and colour-calibrated, with your content running and your team trained.']])}
${contact()}`;

const EVENTS = [['Walk in', 'Both walls show the meeting home screen, mics live, cameras on their home shots.'], ['Pick your sources', 'One tap puts the call on the left wall and the laptop on the right.'], ['Frame the room', 'Tap a camera preset and both ceiling cameras move to their saved shots.'], ['Mute the room', 'The ceiling mics go red and the far end sees it.'], ['Carry on', 'Unmute, finish the meeting, tap Shutdown. The room resets itself.']];

const av = () => `
${bleed('AV integration', ['The whole room,', 'one touch panel'], 'Displays, cameras, microphones and conferencing designed as one system, programmed by the same team that installs it.', 'av-install-hero.jpg', 'av-install-hero.jpg', '50% 30%', ' w-bleed--full')}

<section class="track-av" id="integration" aria-label="A room system at work"><div class="w-stage"><div class="w-wrap w-room-grid">
  <div class="w-stack">
    <p class="w-kicker">The room</p>
    <h2 class="w-h2" style="font-size:clamp(28px, 3.1vw, 48px)">The wall is one output. <span class="w-gradtxt">We build the whole room</span></h2>
    <ol class="w-list">${EVENTS.map(([t, b], i) => `<li class="ev${i + 1}"><span class="num">0${i + 1}</span><span><b>${t}</b><span class="t">${b}</span></span></li>`).join('')}</ol>
  </div>
  <figure class="w-scene-fig" aria-label="A conference room: two video walls, two ceiling cameras, ceiling speakers and microphone arrays, a table with a touch panel and a laptop. As the page scrolls, the walls change source, the cameras move and the microphones mute and unmute.">
    ${part('room.html')}
    <figcaption class="w-meta"><span>Two video walls, two ceiling cameras, ceiling mics and speakers, one touch panel</span><span class="w-hide-m">Every tap changes the room</span></figcaption>
  </figure>
</div></div></section>


<section class="w-sec w-quote"><div class="w-wrap">
  <blockquote class="w-quote-txt" data-rise>${L('“Beyond integration.', 'Into innovation.”')}</blockquote>
  <p class="w-quote-by">WaveTech Innovations</p>
</div></section>
${gallery('On site', ['The same crew,', 'start to finish'], 'No subcontracted install. The people who drew the room are the ones on the ladder, in the rack and behind the camera presets.', [
  ['av-ptz-closeup.jpg', 'A ceiling-mounted PTZ camera, installed and aimed', 'Ceiling PTZ, commissioned'], ['av-bench-test.jpg', 'Cameras and processing laid out for bench testing', 'Bench test before install'],
  ['av-camera-mount.jpg', 'A camera mount being fixed to the wall', 'Mounting on backing'], ['av-terminating.jpg', 'A technician terminating a cable', 'Terminated by hand'],
  ['av-rack-build.jpg', 'Cabling being dressed inside the rack', 'Rack build'], ['av-ceiling-panel.jpg', 'A technician fitting a ceiling panel overhead', 'Ceiling work'],
  ['av-above-ceiling.jpg', 'A technician on a ladder working above the ceiling grid', 'Above the ceiling'], ['av-cable-behind-display.jpg', 'A hand guiding a cable behind a display', 'Cables hidden'],
  ['av-ladders.jpg', 'Ladders set up in the room', 'Our own crew on site']])}
${steps('What happens next', ['From a walkthrough', 'to a working room'], [
  ['Walkthrough', 'We look at how the room is used, sightlines for cameras, mic coverage and where control needs to live.'],
  ['Design and install', 'Drawings, a fixed price, then the rack, displays, cameras, mics and panels, coordinated with your contractor.'],
  ['Program and train', 'DSP tuning, camera presets and the touch-panel interface, then a hand-off session with your team.']])}
${contact()}`;

const RESCUE = [['Flag', 'The wall tells us which cabinets are unhappy before anyone in the room notices.'], ['Diagnose', 'Each fault is traced to its cause before a part is replaced.'], ['Replace', 'Matched spares from your kit, fitted from the front of the wall.'], ['Recalibrate', 'New parts are matched to their neighbours until the wall is seamless again.'], ['Log', 'Every swap is recorded and the spares kit is refilled for next time.']];

const svc = () => `
${bleed('Emergency and maintenance', ['Something’s dark.', 'We’ll have it back'], 'Video walls and rooms kept running, including systems we didn’t install. Scheduled maintenance, spares on hand, remote diagnostics and on-site response.', 'svc-field-5.jpg', 'svc-field-5.jpg', '55% 45%')}

<section class="track-s" id="support" aria-label="How a service call runs"><div class="w-stage"><div class="w-wrap">
  <div class="w-stack" style="gap:14px;margin-bottom:clamp(18px, 3vh, 40px)">
    <p class="w-kicker">Service and support</p>
    <h2 class="w-h2">Five faults, <span class="w-gradtxt">one visit</span></h2>
    <p class="w-body w-hide-m">A dark module, a line of coloured pixels, a whole cabinet out. Each one is traced to its cause before a part is replaced.</p>
  </div>
  <div class="w-two w-two--wall">
    <div class="w-stack" style="gap:12px">
      <div class="w-fwall">${part('faults.html')}</div>
      <div class="w-fstatus"><span class="flag" style="color:var(--warn)">5 faults flagged, ticket open</span><span class="ok" style="color:var(--ok)">All restored, wall matched</span></div>
    </div>
    <div class="w-stack">
      <ol class="w-list">${RESCUE.map(([t, b], i) => `<li class="st${i + 1}"><span class="num">0${i + 1}</span><span><b>${t}</b><span class="t">${b}</span></span></li>`).join('')}</ol>
      <a class="w-link w-hide-m" href="#contact" style="align-self:flex-start">Ask about a service plan</a>
    </div>
  </div>
</div></div></section>

<section class="w-sec"><div class="w-wrap w-cmp-grid">
  <div class="w-stack" style="gap:26px">
    <p class="w-kicker">Dead pixels, fixed</p>
    <h2 class="w-h2" data-rise>${L('Drag to see', 'the difference')}</h2>
    <p class="w-lede">This is how we found the panel: dead pixels scattered across the face. Drag the handle across and watch them go. A module swap and recalibration, on the same visit.</p>
  </div>
  <div class="w-cmp">
    <img src="assets/svc-pixels-before.jpg" alt="The LED panel before repair, with dead pixels">
    <img class="after" src="assets/svc-pixels-after.jpg" alt="The same LED panel after repair, with no dead pixels">
    <span class="w-cmp-tag b">Before</span><span class="w-cmp-tag a" style="opacity:0">After</span>
    <div class="w-cmp-bar" aria-hidden="true"><span class="w-cmp-knob"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EEEEF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 3 12 9 18"></polyline><polyline points="15 6 21 12 15 18"></polyline></svg></span></div>
    <input type="range" id="cmp-range" min="0" max="100" step="1" value="3" aria-label="Drag right to reveal the repaired panel">
  </div>
</div></section>

${gallery('On a service call', ['Found it, fixed it,', 'proved it'], 'Remote diagnostics first, a truck when it needs one, and a test pattern on the wall before we leave.', [
  ['svc-field-3.jpg', 'A gloved hand checking an outdoor LED wall', 'Field check, module by module'], ['svc-field-4.jpg', 'A technician tilting an LED module out of an outdoor wall', 'Module out for a swap'],
  ['svc-field-1.jpg', 'A technician reconnecting the cables on an LED module', 'Reconnected and reseated'], ['svc-module-seated.jpg', 'Hands seating a new LED module with a red test pattern', 'New module seated and tested'],
  ['svc-field-2.jpg', 'A technician pressing a module flush into an outdoor wall', 'Flush with its neighbours'], ['svc-cabinet-work.jpg', 'A WaveTech technician working inside an open LED cabinet', 'Inside the cabinet'],
  ['svc-mapping-test.jpg', 'A video wall showing its mapping test pattern', 'Mapping check after a repair'], ['svc-remote-diagnostics.jpg', 'A technician at a laptop running diagnostics in a dark room', 'Remote diagnostics, before a truck roll']])}

<section class="w-sec"><div class="w-wrap">
  <div class="w-sec-head"><div class="w-stack"><p class="w-kicker">What’s covered</p><h2 class="w-h2" data-rise>${L('One agreement,', 'no surprises')}</h2></div></div>
  <ul class="w-cover" data-stagger>
    <li><h3 class="w-h3">Emergency response</h3><p>A wall goes dark before an event. We diagnose remotely first and roll a truck when it needs one.</p></li>
    <li><h3 class="w-h3">Scheduled maintenance</h3><p>Inspections, firmware, calibration checks and cleaning on a calendar, with a written report each visit.</p></li>
    <li><h3 class="w-h3">Spares on hand</h3><p>Matched modules and cards kept for your wall, so a swap is a visit, not a lead time.</p></li>
    <li><h3 class="w-h3">Remote monitoring</h3><p>We see a module fail over or a screen drop off before anyone in the room notices.</p></li>
  </ul>
</div></section>
${contact()}`;

/* ---- assemble ---- */
const CSS = read(path.join(SRC, 'site.css')) + '\n/* scenes */\n' + sceneCss();
const JS = read(path.join(SRC, 'app.js'));
const LIBS = `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600;700&display=swap">`;

const DEFS = [
  ['index.html', 'home', 'WaveTech Website Rebuild', home],
  ['video-walls.html', 'vw', 'WaveTech Video Walls', vw],
  ['av-integration.html', 'av', 'WaveTech AV Integration', av],
  ['emergency-maintenance.html', 'svc', 'WaveTech Emergency and Maintenance', svc],
];
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
for (const f of fs.readdirSync(path.join(REPO, 'assets'))) fs.copyFileSync(path.join(REPO, 'assets', f), path.join(DIST, 'assets', f));

for (const [file, key, title, body] of DEFS) {
  const head = `<meta name="claude:viewport-fit-sides" content="cover">
<title>${title}</title>
<link rel="icon" type="image/png" href="assets/favicon-64.png">
${FONTS}
<style>
${CSS}
</style>`;
  const main = `<script>document.documentElement.classList.add('sd');</script>
<div id="site" data-page="${key}">${nav(key)}<main>${body()}</main>${footer()}</div>
${LIBS}
<script>window.WT_SCROLL=${JSON.stringify(table)};</script>
<script>
${JS}
</script>`;
  fs.writeFileSync(path.join(DIST, file), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${main}\n</body>\n</html>\n`);
  if (file === 'index.html') fs.writeFileSync(path.join(DIST, 'artifact-index.html'), head + '\n' + main + '\n');
  if (!PREVIEW) {
    // GoHighLevel paste block: no <html>/<head>, CDN assets, site routes, builder break-out, embed loaders
    let block = `<!-- WaveTech Innovations — ${ROUTES[file]} — build ${VERSION} — paste into one Custom HTML/Javascript element -->\n` + head.replace(/<meta name="claude[^>]*>\n/, '').replace(/<title>.*<\/title>\n/, '').replace('</style>', BREAKOUT + '\n</style>') + '\n' + main +
      '\n<script src="https://link.msgsndr.com/js/form_embed.js" defer></script>\n<script src="https://snapwidget.com/js/snapwidget.js" defer></script>\n';
    for (const [f, r] of Object.entries(ROUTES)) block = block.split('href="' + f + '"').join('href="' + r + '"');
    block = block.replace(/(["'(])assets\//g, '$1' + CDN);
    fs.mkdirSync(path.join(DIST, 'ghl'), { recursive: true });
    fs.writeFileSync(path.join(DIST, 'ghl', file.replace('.html', '.ghl.html')), block);
    // local simulation of the builder page, for tests
    const sim = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;background:#fff}.c-row{max-width:1170px;margin:0 auto;overflow:hidden}.c-column{padding:10px}</style></head><body><div class="hl_page-creator--section c-section old-top"><div class="c-row"><div class="c-column"><h2>OLD SECTION</h2></div></div></div><div class="hl_page-creator--section c-section"><div class="c-row"><div class="c-column">${block.split(CDN).join('assets/')}</div></div></div><div class="hl_page-creator--section c-section old-bottom"><div class="c-row"><div class="c-column"><h2>OLD FOOTER</h2></div></div></div></body></html>`;
    fs.writeFileSync(path.join(DIST, 'sim-' + file), sim);
  }
  console.log('built', file, Math.round((head.length + main.length) / 1024) + 'KB');
}
