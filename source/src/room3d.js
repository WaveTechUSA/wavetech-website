/* The conference room, rendered with three.js. window.WT_ROOM.set(p) drives it from scroll progress 0..1:
   walls change source, the ceiling cameras move to presets, the mics mute and unmute, the touch panel follows. */
(function () {
  'use strict';
  var host = document.querySelector('.w-room3d');
  if (!host || !window.THREE) return;
  var T = window.THREE, canvas = host.querySelector('canvas'), badge = host.querySelector('.w-room-badge');
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return; }                     // no WebGL: the still image underneath stays
  host.classList.add('is-live');
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(30, 1.5, 0.1, 100);
  if (T.RoomEnvironment) { var pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; }

  /* ---------- helpers ---------- */
  var RB = T.RoundedBoxGeometry;
  function box(w, h, d, r, mat) { var g = RB ? new RB(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)) : new T.BoxGeometry(w, h, d); var m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; }
  function cyl(rt, rb, h, mat, seg) { var m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 40), mat); m.castShadow = true; m.receiveShadow = true; return m; }
  function std(color, rough, metal, extra) { var o = { color: color, roughness: rough, metalness: metal || 0, envMapIntensity: 0.32 }; if (extra) for (var k in extra) o[k] = extra[k]; return new T.MeshStandardMaterial(o); }
  function add(obj, x, y, z, parent) { obj.position.set(x, y, z); (parent || scene).add(obj); return obj; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function keyed(stops, p) { // stops: [[p, v], ...] with smooth ease between
    if (p <= stops[0][0]) return stops[0][1];
    for (var i = 1; i < stops.length; i++) if (p <= stops[i][0]) { var a = stops[i - 1], b = stops[i]; return lerp(a[1], b[1], sm(a[0], b[0], p)); }
    return stops[stops.length - 1][1];
  }

  /* ---------- materials ---------- */
  var mFloor = std(0x0d0d1c, 0.95), mWall = std(0x0c0c1a, 0.95), mWood = std(0x5a3d2b, 0.5, 0.0), mWoodDark = std(0x30221a, 0.6);
  var mFabric = std(0x2c2f3c, 0.85), mMetal = std(0x23252d, 0.4, 0.6), mBlack = std(0x09090d, 0.35, 0.3), mWhite = std(0xb9b9c8, 0.6), mBezel = std(0x060609, 0.3, 0.4);

  /* ---------- room shell ---------- */
  scene.fog = new T.Fog(0x0b0b1a, 11, 19);
  var floor = new T.Mesh(new T.CircleGeometry(30, 64), mFloor); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  var back = box(8.4, 3.2, 0.2, 0.02, mWall); add(back, 0, 1.6, -3.1); back.castShadow = false;
  var rug = new T.Mesh(new T.PlaneGeometry(6.2, 3.6), std(0x111126, 1)); rug.rotation.x = -Math.PI / 2; rug.receiveShadow = true; add(rug, 0, 0.004, 0.25);

  /* ---------- display content (drawn on canvases, no outside images) ---------- */
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var F = "600 {s}px Archivo, 'Helvetica Neue', Arial, sans-serif";
  function font(ctx, s, w) { ctx.font = (w || 600) + ' ' + s + 'px Archivo, "Helvetica Neue", Arial, sans-serif'; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function wallpaper(ctx, W, H) {
    var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a1f55'); g.addColorStop(0.55, '#3a2a78'); g.addColorStop(1, '#141a44'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var r = ctx.createRadialGradient(W * 0.3, H * 0.95, 10, W * 0.3, H * 0.95, W * 0.6); r.addColorStop(0, 'rgba(226,120,70,.75)'); r.addColorStop(1, 'rgba(226,120,70,0)'); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }
  function drawHome(ctx, W, H) {
    wallpaper(ctx, W, H);
    ctx.fillStyle = 'rgba(8,8,20,.72)'; rr(ctx, 60, 60, 520, 250, 22); ctx.fill();
    ctx.fillStyle = '#b9b9cc'; font(ctx, 22, 500); ctx.fillText('Monday, June 12', 96, 112);
    ctx.fillStyle = '#fff'; font(ctx, 78, 700); ctx.fillText('8:41 AM', 94, 196);
    font(ctx, 26, 600); ctx.fillText('Conference Room A', 96, 244);
    ctx.fillStyle = '#b9b9cc'; font(ctx, 20, 400); ctx.fillText('Join your meeting with this room', 96, 280);
    ctx.fillStyle = '#fff'; font(ctx, 22, 500); ctx.beginPath(); ctx.arc(84, H - 70, 12, 0, 7); ctx.fill(); ctx.fillText('Add this room to a meeting from your device', 112, H - 62);
  }
  function drawSchedule(ctx, W, H) {
    wallpaper(ctx, W, H);
    var x = W - 470, y = 70;
    ctx.fillStyle = 'rgba(8,8,20,.78)'; rr(ctx, x, y, 400, 120, 18); ctx.fill(); ctx.fillStyle = '#22d36b'; rr(ctx, x, y, 10, 120, 5); ctx.fill();
    ctx.fillStyle = '#fff'; font(ctx, 40, 700); ctx.fillText('Available', x + 34, y + 58); ctx.fillStyle = '#b9b9cc'; font(ctx, 20, 400); ctx.fillText('9:00 AM – 10:00 AM', x + 34, y + 94);
    [['Daily standup', '10:00 AM – 10:30 AM'], ['Design review', '11:00 AM – 12:00 PM'], ['Client call', '2:00 PM – 3:00 PM']].forEach(function (m, i) {
      var yy = y + 144 + i * 104; ctx.fillStyle = 'rgba(8,8,20,.6)'; rr(ctx, x, yy, 400, 88, 16); ctx.fill();
      ctx.fillStyle = '#fff'; font(ctx, 26, 600); ctx.fillText(m[0], x + 26, yy + 38); ctx.fillStyle = '#b9b9cc'; font(ctx, 19, 400); ctx.fillText(m[1], x + 26, yy + 68);
    });
  }
  function drawCall(ctx, W, H) {
    ctx.fillStyle = '#0b0b14'; ctx.fillRect(0, 0, W, H);
    var cols = ['#27406e', '#5a3a7a', '#2f5d57', '#6a4a35'], names = ['Maya', 'Jordan', 'Priya', 'Sam'], gw = (W - 60) / 2, gh = (H - 110) / 2;
    for (var i = 0; i < 4; i++) {
      var x = 20 + (i % 2) * (gw + 20), y = 20 + Math.floor(i / 2) * (gh + 20);
      var g = ctx.createLinearGradient(x, y, x, y + gh); g.addColorStop(0, cols[i]); g.addColorStop(1, '#14141f'); ctx.fillStyle = g; rr(ctx, x, y, gw, gh, 18); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.beginPath(); ctx.arc(x + gw / 2, y + gh * 0.42, gh * 0.17, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + gw / 2, y + gh * 0.98, gh * 0.34, gh * 0.34, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(8,8,20,.7)'; rr(ctx, x + 14, y + gh - 46, 120, 32, 8); ctx.fill(); ctx.fillStyle = '#fff'; font(ctx, 20, 600); ctx.fillText(names[i], x + 26, y + gh - 24);
    }
    ctx.fillStyle = '#16162a'; ctx.fillRect(0, H - 60, W, 60);
    ['#2e2e48', '#2e2e48', '#ff3b3b', '#2e2e48'].forEach(function (c, i) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(W / 2 - 90 + i * 60, H - 30, 18, 0, 7); ctx.fill(); });
  }
  function drawDeck(ctx, W, H) {
    ctx.fillStyle = '#0d1022'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; font(ctx, 56, 700); ctx.fillText('Quarterly review', 70, 120);
    ctx.fillStyle = '#8c8ca6'; font(ctx, 24, 400); ctx.fillText('Revenue by region', 72, 162);
    var bars = [0.34, 0.5, 0.42, 0.68, 0.6, 0.86, 1], bw = (W - 200) / bars.length, base = H - 80, maxH = H - 280;
    bars.forEach(function (b, i) { var g = ctx.createLinearGradient(0, base - maxH, 0, base); g.addColorStop(0, i > 4 ? '#0db5ec' : '#543bb9'); g.addColorStop(1, i > 4 ? '#0a7fb0' : '#3a2a8a'); ctx.fillStyle = g; rr(ctx, 80 + i * bw, base - maxH * b, bw - 26, maxH * b, 10); ctx.fill(); });
    ctx.fillStyle = '#2a2d4a'; ctx.fillRect(70, base + 8, W - 140, 3);
  }
  function Screen(a, b) {
    this.c = mkCanvas(1024, 576); this.ctx = this.c.getContext('2d');
    this.a = mkCanvas(1024, 576); a(this.a.getContext('2d'), 1024, 576);
    this.b = mkCanvas(1024, 576); b(this.b.getContext('2d'), 1024, 576);
    this.tex = new T.CanvasTexture(this.c); this.tex.encoding = T.sRGBEncoding; this.tex.anisotropy = 8; this.mix = -1;
  }
  Screen.prototype.set = function (m) { m = Math.round(m * 40) / 40; if (m === this.mix) return false; this.mix = m; var x = this.ctx; x.globalAlpha = 1; x.drawImage(this.a, 0, 0); if (m > 0) { x.globalAlpha = m; x.drawImage(this.b, 0, 0); } this.tex.needsUpdate = true; return true; };

  /* ---------- displays ---------- */
  var DW = 3.0, DH = DW * 9 / 16;
  function display(x, scr) {
    var g = new T.Group();
    g.add(box(DW + 0.08, DH + 0.08, 0.09, 0.02, mBezel));
    var face = new T.Mesh(new T.PlaneGeometry(DW, DH), new T.MeshBasicMaterial({ map: scr.tex, toneMapped: false })); face.position.z = 0.047; g.add(face);
    add(g, x, 1.78, -2.94); return g;
  }
  var sL = new Screen(drawHome, drawCall), sR = new Screen(drawSchedule, drawDeck);
  display(-1.56, sL); display(1.56, sR);
  var glowL = new T.PointLight(0x7a66ff, 1.0, 8, 2); add(glowL, -1.5, 1.7, -1.6);
  var glowR = new T.PointLight(0x7a66ff, 1.0, 8, 2); add(glowR, 1.5, 1.7, -1.6);

  /* ---------- credenza with a rack bay ---------- */
  add(box(5.4, 0.62, 0.52, 0.03, mWood), 0, 0.41, -2.62);
  add(box(1.5, 0.46, 0.02, 0.01, mWoodDark), -1.75, 0.41, -2.355); add(box(1.5, 0.46, 0.02, 0.01, mWoodDark), 1.75, 0.41, -2.355);
  add(box(1.2, 0.46, 0.02, 0.01, std(0x05060c, 0.2, 0.2)), 0, 0.41, -2.355);
  for (var ri = 0; ri < 4; ri++) { add(box(1.05, 0.06, 0.012, 0.004, std(0x1a1d2c, 0.4, 0.5)), 0, 0.57 - ri * 0.1, -2.34); var led = new T.Mesh(new T.CircleGeometry(0.012, 12), new T.MeshBasicMaterial({ color: ri === 1 ? 0x0db5ec : 0x22d36b })); add(led, -0.44, 0.57 - ri * 0.1, -2.332); }

  /* ---------- table and chairs ---------- */
  var top = box(3.9, 0.07, 1.55, 0.035, mWood); add(top, 0, 0.75, 0.25);
  add(box(1.5, 0.66, 0.5, 0.03, mMetal), 0, 0.38, 0.25);
  function chair(x, z, rot) {
    var g = new T.Group();
    add(box(0.5, 0.09, 0.5, 0.04, mFabric), 0, 0.47, 0, g);
    var b = box(0.5, 0.52, 0.08, 0.04, mFabric); b.rotation.x = -0.12; add(b, 0, 0.78, -0.25, g);
    add(cyl(0.03, 0.03, 0.4, mMetal, 16), 0, 0.24, 0, g);
    add(cyl(0.26, 0.28, 0.03, mMetal, 32), 0, 0.03, 0, g);
    g.rotation.y = rot; add(g, x, 0, z); return g;
  }
  [-1.2, 0, 1.2].forEach(function (x) { chair(x, -0.92, 0); chair(x, 1.42, Math.PI); });
  chair(-2.5, 0.25, Math.PI / 2); chair(2.5, 0.25, -Math.PI / 2);

  /* ---------- touch panel and laptop on the table ---------- */
  var pc = mkCanvas(640, 400), pctx = pc.getContext('2d'), ptex = new T.CanvasTexture(pc); ptex.encoding = T.sRGBEncoding; ptex.anisotropy = 8;
  var panel = new T.Group(); panel.add(box(0.5, 0.33, 0.03, 0.012, mBezel));
  var pf = new T.Mesh(new T.PlaneGeometry(0.46, 0.29), new T.MeshBasicMaterial({ map: ptex, toneMapped: false })); pf.position.z = 0.016; panel.add(pf);
  panel.rotation.set(-1.02, -0.35, 0); panel.rotation.order = 'YXZ'; add(panel, 1.05, 0.9, 0.62);
  add(box(0.14, 0.02, 0.1, 0.008, mBezel), 1.05, 0.79, 0.57);
  var pState = '';
  function btn(x, y, w, h, label, on, color) { pctx.fillStyle = on ? (color || '#0db5ec') : '#1e1a38'; rr(pctx, x, y, w, h, 10); pctx.fill(); pctx.fillStyle = on ? (color ? '#fff' : '#090916') : '#c9c9db'; pctx.font = '600 20px Archivo, Arial, sans-serif'; pctx.textAlign = 'center'; pctx.fillText(label, x + w / 2, y + h / 2 + 7); pctx.textAlign = 'left'; }
  function drawPanel(p) {
    var l = p < 0.32 ? 0 : 1, r = p < 0.44 ? 0 : 2, cam = p >= 0.58 ? (p >= 0.84 ? 3 : 2) : (p >= 0.26 ? 1 : 0), mute = p >= 0.7 && p < 0.86;
    var key = [l, r, cam, mute].join(); if (key === pState) return false; pState = key;
    pctx.fillStyle = '#0c0c1c'; pctx.fillRect(0, 0, 640, 400);
    pctx.fillStyle = '#00c4ec'; pctx.font = '600 17px Archivo, Arial, sans-serif'; pctx.fillText('ROUTING', 24, 36); pctx.fillText('CAMERAS', 24, 222); pctx.fillStyle = '#8c8ca6'; pctx.fillText('WAVETECH', 524, 36);
    ['L WALL', 'R WALL'].forEach(function (n, i) { var y = 54 + i * 70; pctx.fillStyle = '#b9b9cc'; pctx.font = '500 17px Archivo, Arial, sans-serif'; pctx.fillText(n, 24, y + 36); var sel = i === 0 ? l : r; ['MEET', 'CALL', 'LAPTOP'].forEach(function (b, k) { btn(120 + k * 124, y, 112, 56, b, sel === k); }); });
    btn(500, 54, 116, 126, 'SHUTDOWN', false);
    ['P1', 'P2', 'P3', 'P4'].forEach(function (b, k) { btn(24 + k * 94, 240, 82, 56, b, cam === k + 1 || (cam === 0 && k === 0)); });
    btn(420, 240, 196, 56, mute ? 'ROOM MUTED' : 'MUTE ROOM', mute, '#ff3b3b');
    pctx.fillStyle = '#8c8ca6'; pctx.font = '400 16px Archivo, Arial, sans-serif'; pctx.fillText('Hold to save a preset', 24, 336);
    ptex.needsUpdate = true; return true;
  }
  var lap = new T.Group(); lap.add(add(box(0.42, 0.018, 0.29, 0.008, std(0x6d7380, 0.4, 0.7)), 0, 0, 0, lap));
  var lid = new T.Group(); var lidM = box(0.42, 0.28, 0.012, 0.006, std(0x8d93a0, 0.4, 0.7)); lidM.position.y = 0.14; lid.add(lidM);
  var lc = mkCanvas(512, 320); drawDeck(lc.getContext('2d'), 512, 320); var ltex = new T.CanvasTexture(lc); ltex.encoding = T.sRGBEncoding;
  var lf = new T.Mesh(new T.PlaneGeometry(0.39, 0.25), new T.MeshBasicMaterial({ map: ltex, toneMapped: false })); lf.position.set(0, 0.14, 0.007); lid.add(lf);
  lid.position.set(0, 0.009, -0.145); lid.rotation.x = -0.28; lap.add(lid); lap.rotation.y = 0.35; add(lap, -1.2, 0.795, 0.55);

  /* ---------- ceiling: speakers, mic arrays, PTZ cameras (the ceiling itself is left open) ---------- */
  var CY = 2.86;
  [[-2.5, -0.9], [2.5, -0.9], [-2.5, 1.3], [2.5, 1.3]].forEach(function (s) { var d = cyl(0.19, 0.19, 0.03, mWhite, 48); d.castShadow = false; add(d, s[0], CY, s[1]); add(cyl(0.14, 0.14, 0.032, std(0xc8c8d6, 0.9), 48), s[0], CY - 0.002, s[1]).castShadow = false; });
  var ringMat = new T.MeshBasicMaterial({ color: 0x22d36b });
  [-1.05, 1.05].forEach(function (x) { var m = box(0.6, 0.04, 0.6, 0.02, mWhite); m.castShadow = false; add(m, x, CY, 0.3); var ring = new T.Mesh(new T.TorusGeometry(0.2, 0.014, 12, 64), ringMat); ring.rotation.x = Math.PI / 2; add(ring, x, CY - 0.024, 0.3); });
  var micGlow = new T.PointLight(0x22d36b, 0.35, 3.5, 2); add(micGlow, 0, 2.5, 0.3);
  function ptz(x) {
    var g = new T.Group(); g.add(add(cyl(0.15, 0.15, 0.07, mMetal), 0, 0, 0, g));
    var pan = new T.Group(); add(pan, 0, -0.06, 0, g);
    add(cyl(0.12, 0.13, 0.06, mBlack), 0, 0, 0, pan);
    add(box(0.035, 0.22, 0.12, 0.012, mMetal), -0.15, -0.13, 0, pan); add(box(0.035, 0.22, 0.12, 0.012, mMetal), 0.15, -0.13, 0, pan);
    var tilt = new T.Group(); add(tilt, 0, -0.17, 0, pan);
    var head = new T.Mesh(new T.SphereGeometry(0.125, 40, 28), mMetal); head.castShadow = true; tilt.add(head);
    var barrel = cyl(0.075, 0.085, 0.1, mBlack); barrel.rotation.x = Math.PI / 2; add(barrel, 0, 0, 0.11, tilt);
    var lens = new T.Mesh(new T.CircleGeometry(0.06, 40), new T.MeshPhysicalMaterial({ color: 0x0a1630, roughness: 0.05, metalness: 0.9, clearcoat: 1 })); add(lens, 0, 0, 0.161, tilt);
    var tally = new T.Mesh(new T.CircleGeometry(0.012, 12), new T.MeshBasicMaterial({ color: 0x22d36b })); add(tally, 0.06, 0.07, 0.1, tilt);
    add(g, x, CY - 0.02, -2.2); return { pan: pan, tilt: tilt };
  }
  var c1 = ptz(-2.95), c2 = ptz(2.95);
  var D = Math.PI / 180;
  var PAN1 = [[0, 14], [0.16, 14], [0.26, 44], [0.48, 44], [0.58, -8], [0.74, -8], [0.84, 26], [1, 26]], TILT1 = [[0, 24], [0.16, 24], [0.26, 14], [0.48, 14], [0.58, 40], [0.74, 40], [0.84, 28], [1, 28]];
  var PAN2 = [[0, -14], [0.16, -14], [0.26, -46], [0.48, -46], [0.58, 6], [0.74, 6], [0.84, -24], [1, -24]], TILT2 = [[0, 24], [0.16, 24], [0.26, 16], [0.48, 16], [0.58, 42], [0.74, 42], [0.84, 30], [1, 30]];

  /* ---------- light ---------- */
  scene.add(new T.HemisphereLight(0x7078d8, 0x06060e, 0.22));
  var sun = new T.DirectionalLight(0xdfe4ff, 0.75); sun.position.set(2.5, 7, 4.5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6; sun.shadow.camera.far = 20; sun.shadow.bias = -0.0005; sun.shadow.radius = 5; scene.add(sun);

  /* ---------- frame ---------- */
  var P = 0, dirty = true, raf = 0, colA = new T.Color(0x7a66ff), colCall = new T.Color(0x4a5fb0), colDeck = new T.Color(0x2a55c0), cg = new T.Color(0x22d36b), cr = new T.Color(0xff3b3b);
  function size() {
    var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = cam.aspect < 1.25 ? 40 : 30; cam.updateProjectionMatrix(); dirty = true; kick();
  }
  function frame() {
    raf = 0; if (!dirty) return; dirty = false;
    var p = P, ang = lerp(0.62, 0.44, sm(0, 1, p)), dist = cam.aspect < 1.25 ? 12.0 : 9.7;
    cam.position.set(Math.sin(ang) * dist, 2.75, Math.cos(ang) * dist); cam.lookAt(0, 1.18, -0.9);
    var ml = sm(0.3, 0.4, p), mr = sm(0.42, 0.52, p);
    sL.set(ml); sR.set(mr); glowL.color.copy(colA).lerp(colCall, ml); glowR.color.copy(colA).lerp(colDeck, mr);
    c1.pan.rotation.y = keyed(PAN1, p) * D; c1.tilt.rotation.x = keyed(TILT1, p) * D; c2.pan.rotation.y = keyed(PAN2, p) * D; c2.tilt.rotation.x = keyed(TILT2, p) * D;
    var mute = sm(0.68, 0.71, p) * (1 - sm(0.85, 0.88, p)); ringMat.color.copy(cg).lerp(cr, mute); micGlow.color.copy(ringMat.color);
    if (badge) badge.style.opacity = String(mute);
    drawPanel(p);
    renderer.render(scene, cam);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  window.WT_ROOM = { set: function (p) { if (p !== P) { P = p; dirty = true; kick(); } }, render: function () { dirty = true; frame(); } };
  size(); window.addEventListener('resize', size);
  if (window.ResizeObserver) new ResizeObserver(size).observe(host);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sL = sL; sL.a.getContext('2d') && drawHome(sL.a.getContext('2d'), 1024, 576); drawCall(sL.b.getContext('2d'), 1024, 576); drawSchedule(sR.a.getContext('2d'), 1024, 576); drawDeck(sR.b.getContext('2d'), 1024, 576); sL.mix = -1; sR.mix = -1; pState = ''; dirty = true; kick(); });
})();
