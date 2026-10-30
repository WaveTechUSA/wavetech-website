/* WaveTech site runtime — expands the page template (sc-for / sc-if / {{holes}} / on* handlers)
   from the page's Component class, and re-renders with a DOM morph when state changes. */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function literal(p) {
    if (p === 'true') return true;
    if (p === 'false') return false;
    if (p === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(p)) return Number(p);
    return undefined;
  }
  function lookup(path, scopes, vals) {
    var lit = literal(path);
    if (lit !== undefined) return lit;
    var parts = path.split('.');
    var head = parts[0], base;
    for (var i = scopes.length - 1; i >= 0; i--) {
      if (Object.prototype.hasOwnProperty.call(scopes[i], head)) { base = scopes[i][head]; break; }
    }
    if (i < 0) base = vals[head];
    for (var k = 1; k < parts.length; k++) {
      if (base == null) return undefined;
      base = base[parts[k]];
    }
    return base;
  }
  function interp(str, scopes, vals) {
    return str.replace(HOLE, function (_, p) {
      var v = lookup(p, scopes, vals);
      return v == null ? '' : String(v);
    });
  }
  function eventName(attr) {
    var n = attr.slice(2).toLowerCase();
    return n === 'change' ? ['input', 'change'] : [n];
  }

  function render(tpl, scopes, vals, ns, out) {
    for (var c = tpl.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) {
        var t = c.data;
        out.appendChild(document.createTextNode(t.indexOf('{{') >= 0 ? interp(t, scopes, vals) : t));
      } else if (c.nodeType === 1) {
        var tag = c.nodeName.toLowerCase();
        if (tag === 'sc-for') {
          var m = WHOLE.exec(c.getAttribute('list') || '');
          var list = m ? lookup(m[1], scopes, vals) : [];
          var as = c.getAttribute('as') || 'item';
          if (Array.isArray(list)) list.forEach(function (item, i) {
            var s = {}; s[as] = item; s.$index = i;
            render(c, scopes.concat([s]), vals, ns, out);
          });
        } else if (tag === 'sc-if') {
          var mi = WHOLE.exec(c.getAttribute('value') || '');
          if (mi ? lookup(mi[1], scopes, vals) : false) render(c, scopes, vals, ns, out);
        } else {
          var childNs = (tag === 'svg' || ns) ? SVG_NS : null;
          var el = childNs ? document.createElementNS(SVG_NS, c.nodeName) : document.createElement(tag);
          var attrs = c.attributes;
          for (var a = 0; a < attrs.length; a++) {
            var name = attrs[a].name, value = attrs[a].value, w = WHOLE.exec(value);
            if (w) {
              var raw = lookup(w[1], scopes, vals);
              if (/^on/i.test(name)) {
                if (typeof raw === 'function') {
                  el.__ev = el.__ev || [];
                  eventName(name).forEach(function (ev) { el.__ev.push([ev, raw]); el.addEventListener(ev, raw); });
                }
                continue;
              }
              if (raw == null || raw === false) continue;
              if (name === 'value') { el.__value = String(raw); el.value = String(raw); }
              el.setAttribute(name, raw === true ? '' : String(raw));
            } else {
              if (/^on/i.test(name)) continue;
              var sv = value.indexOf('{{') >= 0 ? interp(value, scopes, vals) : value;
              if (name === 'value') { el.__value = sv; el.value = sv; }
              el.setAttribute(name, sv);
            }
          }
          if (tag === 'foreignobject') childNs = null;
          render(c, scopes, vals, childNs, el);
          out.appendChild(el);
        }
      }
    }
  }

  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
    if (a.nodeType === 3) { if (a.data !== b.data) a.data = b.data; return; }
    var i, ba = b.attributes, aa = a.attributes, names = [];
    for (i = 0; i < ba.length; i++) if (a.getAttribute(ba[i].name) !== ba[i].value) a.setAttribute(ba[i].name, ba[i].value);
    for (i = 0; i < aa.length; i++) names.push(aa[i].name);
    names.forEach(function (n) { if (!b.hasAttribute(n)) a.removeAttribute(n); });
    if (b.__value !== undefined && a !== document.activeElement && a.value !== b.__value) a.value = b.__value;
    if (b.__ev || a.__ev) {
      (a.__ev || []).forEach(function (p) { a.removeEventListener(p[0], p[1]); });
      (b.__ev || []).forEach(function (p) { a.addEventListener(p[0], p[1]); });
      a.__ev = b.__ev;
    }
    if (a.nodeName === 'IFRAME' || a.hasAttribute('data-static')) return; // never touch embeds
    var ac = Array.prototype.slice.call(a.childNodes), bc = Array.prototype.slice.call(b.childNodes);
    for (i = 0; i < bc.length; i++) { if (i < ac.length) morph(ac[i], bc[i]); else a.appendChild(bc[i]); }
    for (i = bc.length; i < ac.length; i++) ac[i].remove();
  }

  var app = null, tpl = null, inst = null, pending = false;
  function draw() {
    pending = false;
    var vals = inst.renderVals() || {};
    var frag = document.createDocumentFragment();
    render(tpl, [], vals, null, frag);
    if (!app.firstChild) { app.appendChild(frag); if (inst.componentDidMount) inst.componentDidMount(); return; }
    var fresh = document.createElement('div');
    fresh.appendChild(frag);
    // morph children only: the #app root keeps its id, attributes and styles untouched
    var i, ac = Array.prototype.slice.call(app.childNodes), bc = Array.prototype.slice.call(fresh.childNodes);
    for (i = 0; i < bc.length; i++) { if (i < ac.length) morph(ac[i], bc[i]); else app.appendChild(bc[i]); }
    for (i = bc.length; i < ac.length; i++) ac[i].remove();
    if (scrollEngine.schedule) scrollEngine.schedule();
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(draw); } }

  window.DCLogic = function (props) { this.props = props || {}; this.state = {}; };
  DCLogic.prototype.setState = function (patch) { for (var k in patch) this.state[k] = patch[k]; schedule(); };
  DCLogic.prototype.forceUpdate = schedule;

  /* Scroll engine for browsers without CSS scroll-driven animations (Safari < 26, Firefox):
     every scroll-driven keyframe animation is paused at 1s duration and its negative
     animation-delay is set from scroll position, so the exact same keyframes run anywhere. */
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function scrollEngine(table) {
    var native = !window.__forceNoSDA && window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    if (native) return;
    document.documentElement.classList.add('no-sda');
    var tracks = {}, k;
    for (k in table.tracks) tracks[k] = table.tracks[k];
    var ticking = false;
    function pos(kind, pct, r, vh) { // position of a range edge in "cover" coordinates (0 = top enters bottom, 1 = bottom leaves top)
      var total = vh + r.height;
      if (kind === 'cover') return pct;
      if (kind === 'entry') return pct * r.height / total;
      if (kind === 'exit') return (vh + pct * r.height) / total;
      if (kind === 'contain') { var c0 = Math.min(r.height, vh) / total, c1 = Math.max(r.height, vh) / total; return c0 + pct * (c1 - c0); }
      return pct;
    }
    function update() {
      ticking = false;
      var vh = window.innerHeight, tp = {}, t, r, i, j, it, nodes, p, n;
      for (k in tracks) {
        t = document.querySelector(tracks[k]); if (!t) continue;
        r = t.getBoundingClientRect();
        tp[k] = { r: r };
      }
      for (i = 0; i < table.items.length; i++) {
        it = table.items[i];
        nodes = document.querySelectorAll(it.sel);
        for (j = 0; j < nodes.length; j++) {
          n = nodes[j];
          if (it.tl === 'view()') r = n.getBoundingClientRect(); else { if (!tp[it.tl]) continue; r = tp[it.tl].r; }
          var cover = clamp((vh - r.top) / (vh + r.height));
          var a = pos(it.k0, it.a, r, vh), b = pos(it.k1, it.b, r, vh);
          p = b > a ? clamp((cover - a) / (b - a)) : (cover >= a ? 1 : 0);
          var d = (-p * 0.999).toFixed(4) + 's';
          if (n.__d !== d) { n.__d = d; n.style.animationDelay = d; }
        }
      }
    }
    function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    update();
    scrollEngine.schedule = schedule;
  }

  window.DC = {
    mount: function (Component, props) {
      tpl = document.getElementById('dc-tpl').content;
      app = document.getElementById('app');
      inst = new Component(props || {});
      draw();
    },
    scroll: scrollEngine
  };
})();
