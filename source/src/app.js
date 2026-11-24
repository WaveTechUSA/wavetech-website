/* WaveTech site behaviour. Libraries: GSAP + ScrollTrigger (scrubbed scenes, reveals), Lenis (smooth wheel scroll). */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };

  /* ---------- menu ---------- */
  var burger = $('.w-burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = root.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    $$('.w-menu a').forEach(function (a) { a.addEventListener('click', function () { root.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); if (lenis) lenis.start(); }); });
  }

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (false) { // smooth-scroll library removed: it ties scrolling to the page's frame rate and can stall it; native scrolling only
    try {
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
      if (hasGsap) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    } catch (e) { lenis = null; }
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.getElementById(id.slice(1)); if (!t) return;
      ev.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -40, duration: 1.2 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- nav: solid after the first screen, hides on the way down ---------- */
  var nav = $('.w-nav'), lastY = 0;
  function onScrollNav() {
    var y = window.pageYOffset;
    if (!nav) return;
    nav.classList.toggle('is-solid', y > 40);
    if (!root.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav();

  /* ---------- cross-fade galleries ---------- */
  $$('[data-xfade]').forEach(function (box) {
    var slides = $$('.w-slide', box); if (slides.length < 2) { if (slides[0]) slides[0].classList.add('on'); return; }
    var hold = parseFloat(box.getAttribute('data-hold') || '5') * 1000;
    var cap = $('[data-cap]', box), count = $('[data-count]', box), ticksBox = $('.w-ticks', box);
    var ticks = [];
    if (ticksBox) { slides.forEach(function () { var b = document.createElement('b'); ticksBox.appendChild(b); ticks.push(b); }); ticksBox.style.setProperty('--hold', (hold / 1000) + 's'); }
    var i = -1, timer = null, visible = false;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      ticks.forEach(function (t, k) { t.classList.toggle('done', k < i); t.classList.remove('on'); if (k === i) { void t.offsetWidth; t.classList.add('on'); } });
      if (cap) cap.textContent = slides[i].getAttribute('data-caption') || '';
      if (count) count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    }
    function start() { if (timer || reduce) return; timer = setInterval(function () { show(i + 1); }, hold); }
    function stop() { clearInterval(timer); timer = null; }
    show(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.15 }).observe(box);
    } else start();
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (visible && start()); });
  });

  /* ---------- service panels: the one you point at opens ---------- */
  var panels = $$('.w-panel');
  panels.forEach(function (p) {
    function open() { panels.forEach(function (q) { q.classList.toggle('is-open', q === p); }); }
    p.addEventListener('mouseenter', open); p.addEventListener('focus', open);
  });

  /* ---------- pixel pitch picker ---------- */
  var pitch = $('[data-pitch]');
  if (pitch) {
    var data = JSON.parse(pitch.getAttribute('data-pitch'));
    var px = $('.px', pitch), tag = $('.w-patch-tag', pitch), res = $('[data-res]', pitch), note = $('[data-note]', pitch), ft = $('[data-ft]', pitch);
    var btns = $$('.w-seg button', pitch);
    var pick = function (n) {
      var d = data[n];
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === n ? 'true' : 'false'); });
      px.style.backgroundSize = (d.mm / 48 * 100).toFixed(3) + '% ' + (d.mm / 27 * 100).toFixed(3) + '%';
      tag.textContent = d.label + ' mm'; res.textContent = d.wall; note.textContent = d.wallNote; ft.textContent = d.ft;
    };
    btns.forEach(function (b, k) { b.addEventListener('click', function () { pick(k); }); });
    pick(3);
  }

  /* ---------- before / after ---------- */
  $$('.w-cmp').forEach(function (c) {
    var input = $('input', c), ta = $('.w-cmp-tag.a', c), tb = $('.w-cmp-tag.b', c);
    function set(v) {
      v = Math.max(0, Math.min(100, v));
      c.style.setProperty('--pos', v + '%');
      if (input) input.value = String(Math.round(v));
      if (ta) ta.style.opacity = v > 22 ? '1' : '0';
      if (tb) tb.style.opacity = v < 78 ? '1' : '0';
    }
    function fromEvent(e) { var r = c.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    var dragging = false;
    c.addEventListener('pointerdown', function (e) { dragging = true; try { c.setPointerCapture(e.pointerId); } catch (x) {} fromEvent(e); });
    c.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { c.addEventListener(n, function () { dragging = false; }); });
    if (input) input.addEventListener('input', function () { set(parseFloat(input.value)); });
    set(3);
  });

  /* ---------- room scene scales to the space it has ---------- */
  function fitRoom() {
    $$('.roomwrap').forEach(function (r) {
      if (window.innerWidth <= 760) { r.style.zoom = ''; return; }
      var col = r.parentElement.getBoundingClientRect().width || 900;
      var byH = (window.innerHeight - 170) / 820, byW = col / 1000;
      r.style.zoom = String(Math.max(0.42, Math.min(1, byH, byW)).toFixed(3));
    });
  }
  /* exploded cabinet scales to its column so nothing is cut off */
  function fitCab() {
    $$('.xwrap').forEach(function (x) {
      if (window.innerWidth <= 760) { x.style.zoom = ''; return; }
      var col = x.parentElement.getBoundingClientRect().width || 700;
      x.style.zoom = String(Math.max(0.4, Math.min(1, col / 720, (window.innerHeight - (window.innerWidth <= 1000 ? 640 : 190)) / 690)).toFixed(3));
    });
  }
  function fitAll() { fitRoom(); fitCab(); }
  fitAll(); window.addEventListener('resize', fitAll);

  /* ---------- scroll-driven scenes: the page's keyframes, scrubbed by ScrollTrigger ---------- */
  if (!hasGsap) root.classList.remove('sd'); // no scrubber: let every scene show its finished state
  var table = window.WT_SCROLL;
  if (table && hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('sd');
    Object.keys(table.tracks).forEach(function (key) {
      var track = $(table.tracks[key]); if (!track) return;
      var items = table.items.filter(function (it) { return it.tl === key; }).map(function (it) { return { a: it.a, b: it.b, nodes: $$(it.sel, track) }; }).filter(function (it) { return it.nodes.length; });
      var state = { p: 0 };
      function apply() {
        for (var i = 0; i < items.length; i++) {
          var it = items[i], local = it.b > it.a ? clamp((state.p - it.a) / (it.b - it.a)) : (state.p >= it.a ? 1 : 0);
          var d = (-local * 0.999).toFixed(4) + 's';
          for (var j = 0; j < it.nodes.length; j++) { var n = it.nodes[j]; if (n.__d !== d) { n.__d = d; n.style.animationDelay = d; } }
        }
      }
      apply();
      gsap.to(state, { p: 1, ease: 'none', onUpdate: apply, scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: reduce ? true : 0.5 } });
    });
  }

  /* ---------- reveals ---------- */
  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    // page-load: the first heading rises line by line
    var first = $('[data-load]');
    if (first) {
      gsap.from($$('.w-line > span', first), { yPercent: 108, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.1 });
      gsap.from($$('[data-load-fade]'), { opacity: 0, y: 16, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.45 });
    }
    // section headings rise once as they enter
    $$('[data-rise]').forEach(function (h) {
      gsap.from($$('.w-line > span', h), { yPercent: 108, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    // hero photo grows into the page
    var hf = $('.w-hero-frame');
    if (hf) gsap.fromTo(hf, { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: hf, start: 'top 95%', end: 'top 12%', scrub: 0.4 } });
    // page-hero photo drifts
    $$('.w-bleed').forEach(function (b) {
      var ph = $('.w-bleed-ph', b);
      if (ph && window.innerWidth > 760) gsap.fromTo(ph, { scale: 1.08, yPercent: 0 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: b, start: 'top top', end: 'bottom top', scrub: true } });
    });
    // statement lights up word by word
    $$('.w-statement').forEach(function (s) {
      var words = s.textContent.trim().split(/\s+/);
      s.setAttribute('aria-label', s.textContent.trim());
      s.innerHTML = words.map(function (w) { return '<span class="w-word" aria-hidden="true">' + w + '</span>'; }).join(' ');
      gsap.to($$('.w-word', s), { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: s, start: 'top 82%', end: 'bottom 45%', scrub: 0.4 } });
    });
    // rows of facts / steps arrive together
    $$('[data-stagger]').forEach(function (g) {
      gsap.from(g.children, { opacity: 0, y: 28, duration: 0.9, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: g, start: 'top 86%', once: true } });
    });
    $$('[data-clip]').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(8% 6% 8% 6% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 40%', scrub: 0.4 } });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else {
    $$('.w-statement .w-word').forEach(function (w) { w.style.opacity = 1; });
  }
})();
