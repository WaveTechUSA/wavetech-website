import re, json
P = '/tmp/claude-0/-home-claude/d57ad978-401d-51c4-96a8-bc2e0daa1cd8/scratchpad/wt-landing/project/'
s = open(P + 'Scroll.dc.html').read()

LOBBY = '/_blob/4eccf98e0f355d69b28d36ab5a5ee598'
WAY = '/_blob/be7afad34dee4242796ba6d6dbe9b75a'
INST = '/_blob/315e1606f5d70ecab1e3838e0928be35'
WALL = '/_blob/f2cfef98fd3cdbfac692ab6dbe0a85b0'
LOGO = '/_blob/6488fd50268db0a23935891413e352d9'
MARK = '/_blob/79f0d8cd9080c703d0b71e0e47852d50'
P_MIC = '/_blob/c8a0d0102dc10d7ad1da00d67e6ebd2e'
P_CAM = '/_blob/24f9ff47373cad3683f64627d30677b3'
P_GEAR = '/_blob/83ffcd6da042656d5ecd5b7b2b3afc6d'
P_LADDER = '/_blob/d539883aab8bd08a8480fe52c54f908f'
P_DRAW = '/_blob/74f48780f10ff5537c83fdb62d3ef5da'
P_RACK = '/_blob/fc9f8bc9e0cd7200913fa406a6dfadae'
P_TERM = '/_blob/a1640059efc7a8354ed0a21107204c10'
P_LADDERS = '/_blob/1edc422704929000abb61659c9fb5de6'
P_HERO = '/_blob/8d649d015fcfec75dead0a85d264d1f7'
P_SCREEN = '/_blob/7c7d2aaf2dbdb6f3546d5abfe093dd0f'
P_MOUNT = '/_blob/b02f875ea5e2e3a57dbb7de3b28d1d6f'
P_CEIL = '/_blob/7b6c8fd239dd7415eedb7142ba670243'
S_PULL = '/_blob/46bd13c0c98edc3794f41a5e7db287e0'
S_CAB = '/_blob/731b261f4739941d4e3fd903311a3554'
S_SEAT = '/_blob/905bcac05d7ece06a8876718662e62dc'
S_LAPTOP = '/_blob/51c99d5306c95a77d511938e35960b56'
S_WALL = '/_blob/478dece7e79c4e786f3579ba7c07d9f3'
S_FIXED = '/_blob/d20909038de71463c45834178548aa34'
S_DAMAGED = '/_blob/b4b34e50eb9387511eb3df6ecb3bb02a'
V_LOBBY = '/_blob/7acc330634b87e457cfc36c7ec6ca626'
V_BOARD = '/_blob/95f9d152281ba48ff24b858c2bb8a7fd'
V_FEST = '/_blob/cc8c5b9f0b4e2c3fca2ac7b3942e07f7'

# ---- slice the existing page ----
wrap_i = s.index('<div style="background: #090916; color: #EEEEF8;')
head = s[:wrap_i]
nav_i = s.index('  <!-- NAV -->')
wrap_open = s[wrap_i:nav_i]
m = {k: s.index(v) for k, v in {
    'hero': '  <!-- 1 · HERO', 'cab': '  <!-- 2 · EXPLODED', 'room': '  <!-- 3 · THE ROOM', 'pitch': '  <!-- 4 · PIXEL PITCH',
    'svc': '  <!-- 5 · SERVICE', 'scope': '  <!-- 6 · SCOPE', 'contact': '  <!-- 7 · CONTACT', 'footer': '  <footer'}.items()}
tail_i = s.index('</div>\n</x-dc>')
sec = lambda a, b: s[m[a]:m[b]]
hero, cab, room, pitch, svc = sec('hero', 'cab'), sec('cab', 'room'), sec('room', 'pitch'), sec('pitch', 'svc'), sec('svc', 'scope')
contact, footer = sec('contact', 'footer'), s[m['footer']:tail_i]
tail = s[tail_i:]

PH_CSS = r"""
.rimg{border-radius:22px;overflow:hidden;border:1px solid #211D3A;background:#0E0C1E}
.rimg img{width:100%;height:100%;object-fit:cover;display:block}
.gal{position:relative;overflow:hidden;background:#090916}
.gal .sl{position:absolute;top:0;right:0;bottom:0;width:72%;opacity:0;will-change:opacity;-webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.55) 30%,#000 55%);mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.55) 30%,#000 55%)}
.gal .sl img{width:100%;height:100%;object-fit:cover;display:block}
.gal .ovl{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#090916 0%,rgba(9,9,22,.9) 28%,rgba(9,9,22,.35) 50%,rgba(9,9,22,0) 70%),linear-gradient(180deg,rgba(9,9,22,.5),transparent 25%,transparent 75%,#090916)}
.gal .cap{position:absolute;right:32px;bottom:28px;padding:6px 12px;border-radius:999px;background:rgba(9,9,22,.72);font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;color:#B9B9CC;opacity:0}
.gal .sl,.gal .cap{animation:xf var(--T) linear infinite;animation-delay:var(--d)}
@media (prefers-reduced-motion: reduce){.gal .sl,.gal .cap{animation:none}.gal .sl:first-of-type,.gal .cap:first-of-type{opacity:1}}
@keyframes rvUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: no-preference){
@supports (animation-timeline: view()){
.rv{animation:rvUp ease-out both;animation-timeline:view();animation-range:entry 0% entry 45%}
}}
"""

# signage CSS
SG_CSS = '''
.sgw{position:relative;border:1px solid #211D3A;background:radial-gradient(70% 60% at 50% 30%,#2A1C38,#120C1C 70%);box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden}
.scr{position:relative;background:#000;border:6px solid #0C0C14;border-radius:4px;box-shadow:0 20px 50px rgba(0,0,0,.6),0 0 0 1px #211D3A;overflow:hidden}
.dp{position:absolute;inset:0;opacity:0}
.dp1{opacity:1}
.ovl,.dim{position:absolute;inset:0;opacity:0}
.ck{position:absolute;left:0;top:0;opacity:0}.ck1{opacity:1}
.sg{flex:1;padding:8px 10px;border-radius:4px;background:#161027;color:#B9B9CC;display:flex;flex-direction:column;gap:2px}
.mon{position:absolute;opacity:0}.mon1{opacity:1}
@keyframes w1{0%,20%{opacity:1}24%,100%{opacity:0}}
@keyframes w2{0%,20%{opacity:0}24%,60%{opacity:1}64%,100%{opacity:0}}
@keyframes w3{0%,48%{opacity:0}51%,60%{opacity:1}63%,100%{opacity:0}}
@keyframes w4{0%,62%{opacity:0}66%,84%{opacity:1}88%,100%{opacity:0}}
@keyframes w5{0%,84%{opacity:0}88%,100%{opacity:1}}
@keyframes wdim{0%,84%{opacity:0}88%,100%{opacity:.6}}
@keyframes sgon1{0%,20%{background:#0DB5EC;color:#090916}24%,100%{background:#161027;color:#B9B9CC}}
@keyframes sgon2{0%,20%{background:#161027;color:#B9B9CC}24%,46%{background:#0DB5EC;color:#090916}50%,100%{background:#161027;color:#B9B9CC}}
@keyframes sgon3{0%,48%{background:#161027;color:#B9B9CC}51%,60%{background:#E2A33A;color:#090916}63%,100%{background:#161027;color:#B9B9CC}}
@keyframes sgon4{0%,62%{background:#161027;color:#B9B9CC}66%,84%{background:#0DB5EC;color:#090916}88%,100%{background:#161027;color:#B9B9CC}}
@keyframes sgon5{0%,84%{background:#161027;color:#B9B9CC}88%,100%{background:#543BB9;color:#FFFFFF}}
@media (prefers-reduced-motion: no-preference){
@supports (animation-timeline: view()){
.track-sg{height:3000px;view-timeline-name:--sg}
.dp1,.dp2,.dp4,.dp5,.ovl,.dim,.ck1,.ck2,.ck3,.ck4,.ck5,.sg1,.sg2,.sg3,.sg4,.sg5,.mon1,.mon3{animation-timing-function:linear;animation-fill-mode:both;animation-timeline:--sg;animation-range:contain 0% contain 100%}
.dp1,.ck1,.mon1{animation-name:w1}.dp2,.ck2{animation-name:w2}.ovl,.ck3,.mon3{animation-name:w3}.dp4,.ck4{animation-name:w4}.dp5,.ck5{animation-name:w5}.dim{animation-name:wdim}
.mon1{animation-name:none;opacity:1}
.sg1{animation-name:sgon1}.sg2{animation-name:sgon2}.sg3{animation-name:sgon3}.sg4{animation-name:sgon4}.sg5{animation-name:sgon5}
.sl1{animation:stepOn linear both;animation-timeline:--sg;animation-range:contain 2% contain 18%}
.sl2{animation:stepOn linear both;animation-timeline:--sg;animation-range:contain 24% contain 40%}
.sl3{animation:stepOn linear both;animation-timeline:--sg;animation-range:contain 42% contain 50%}
.sl4{animation:stepOn linear both;animation-timeline:--sg;animation-range:contain 52% contain 62%}
.sl5{animation:stepOn linear both;animation-timeline:--sg;animation-range:contain 66% contain 84%}
}}
'''
head = head.replace('</style>', SG_CSS + PH_CSS + '</style>')

def nav(current):
    def a(href, label):
        col = '#EEEEF8' if href == current else '#B9B9CC'
        return '<a href="%s" style="color: %s; text-decoration: none">%s</a>' % (href, col, label)
    return '''  <!-- NAV -->
  <header style="background: rgba(9,9,22,.94); border-bottom: 1px solid #1A1733; position: relative; z-index: 5">
    <nav aria-label="Main" style="max-width: 1280px; margin: 0 auto; padding: 18px 32px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px">
      <a href="Home.dc.html" aria-label="WaveTech Innovations home" style="display: flex; align-items: center"><img src="%s" alt="WaveTech Innovations" style="height: 40px; width: auto; display: block"></a>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 26px; font-size: 15px; font-weight: 500">
        %s %s %s
        <a href="#contact" class="cta">Get a site survey</a>
      </div>
    </nav>
  </header>

''' % (LOGO, a('VideoWalls.dc.html', 'Video Walls'), a('AVIntegration.dc.html', 'AV Integration'), a('Service.dc.html', 'Emergency &amp; Maintenance'))

def steps(label, h2a, h2b, items):
    lis = ''.join('''
        <li style="background: #12102A; border: 1px solid #211D3A; padding: 24px 24px 26px; display: flex; flex-direction: column; gap: 8px">
          <span style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8C7BE0">0%d</span>
          <span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 20px">%s</span>
          <span style="font-size: 15px; color: #B9B9CC; line-height: 1.5">%s</span>
        </li>''' % (i + 1, t, b) for i, (t, b) in enumerate(items))
    return '''  <!-- STEPS -->
  <section class="glow" aria-label="What happens next" style="border-top: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 32px">
      <div class="lbl">%s</div>
      <h2 style="margin: 12px 0 32px; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.02; letter-spacing: -0.01em">%s <span class="grad">%s</span></h2>
      <ol style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px">%s
      </ol>
    </div>
  </section>

''' % (label, h2a, h2b, lis)

def strip(label, items):
    figs = ''.join('<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px"><img src="%s" alt="%s" style="width: 100%%; aspect-ratio: 4 / 3; object-fit: cover; object-position: %s; display: block; border: 1px solid #211D3A"><figcaption style="font-family: \'IBM Plex Mono\', monospace; font-size: 11px; color: #7A7A90">%s</figcaption></figure>' % (img, alt, pos, cap) for img, alt, pos, cap in items)
    return '''  <!-- PHOTOS -->
  <section class="glow" aria-label="%s" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 80px 32px">
      <div class="lbl" style="margin-bottom: 24px">%s</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px">%s</div>
    </div>
  </section>

''' % (label, label, figs)

def drawings(img, alt):
    return """  <!-- DRAWINGS -->
  <section class="glow-r" aria-label="Start with drawings" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 32px; display: flex; flex-wrap: wrap; gap: 40px 64px; align-items: center">
      <div style="flex: 1 1 380px; min-width: 0; display: flex; flex-direction: column; gap: 16px">
        <div class="lbl">START WITH DRAWINGS</div>
        <h2 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(34px, 4vw, 52px); line-height: 1.02; letter-spacing: -0.01em">Every room starts <span class="grad">on paper.</span></h2>
        <p style="margin: 0; color: #B9B9CC; font-size: 17px; line-height: 1.55; max-width: 32em">Before a single cable is pulled you get a drawing set: where every display, camera, microphone and panel goes, how it all connects, and a fixed price to build it. Our technicians install from those same pages, so the room you approved is the room you get.</p>
      </div>
      <figure class="rimg rv" style="flex: 1 1 560px; min-width: 0; margin: 0; aspect-ratio: 3 / 2; box-shadow: 0 30px 80px rgba(0,0,0,.6)"><img src="%s" alt="%s"></figure>
    </div>
  </section>

""" % (img, alt)

def gallery(label, h2a, h2b, body, items, hold=5.0, fade=1.4):
    # full-bleed, page-wide panel: photos cover the right side and fade out to the left, text sits on the left;
    # all photos cross-fade on their own. keyframe percentages depend on the count, so emit them here.
    n = len(items); T = n * hold
    pa, pb, pc = fade / T * 100, hold / T * 100, (hold + fade) / T * 100
    kf = '@keyframes xf{0%%{opacity:0}%.2f%%{opacity:1}%.2f%%{opacity:1}%.2f%%{opacity:0}100%%{opacity:0}}' % (pa, pb, pc)
    sls = ''.join('<div class="sl" style="--d: %.1fs"><img src="%s" alt="%s" loading="eager" style="object-position: %s"></div>' % (i * hold - fade, img, alt, pos) for i, (img, alt, cap, pos) in enumerate(items))
    caps = ''.join('<div class="cap" style="--d: %.1fs">%s</div>' % (i * hold - fade, cap) for i, (img, alt, cap, pos) in enumerate(items))
    return """  <!-- GALLERY -->
  <style>%s</style>
  <section class="gal" aria-label="%s" style="border-top: 1px solid #1A1733; border-bottom: 1px solid #1A1733; --T: %.1fs">
    %s
    <div class="ovl" aria-hidden="true"></div>
    <div style="position: relative; max-width: 1280px; margin: 0 auto; padding: 120px 32px 128px; min-height: 720px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 18px">
      <div class="lbl">%s</div>
      <h2 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(40px, 4.8vw, 64px); line-height: 1.0; letter-spacing: -0.02em; max-width: 9.5em">%s<br><span class="grad">%s</span></h2>
      <p style="margin: 0; color: #B9B9CC; font-size: 18px; max-width: 28em">%s</p>
    </div>
    %s
  </section>

""" % (kf, label, T, sls, label, h2a, h2b, body, caps)

def compare(before, after):
    return """  <!-- BEFORE / AFTER -->
  <section class="glow-c" aria-label="Dead pixels, before and after" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 32px; display: flex; flex-wrap: wrap; gap: 40px 64px; align-items: center">
      <div style="flex: 1 1 380px; min-width: 0; display: flex; flex-direction: column; gap: 16px">
        <div class="lbl">DEAD PIXELS, FIXED</div>
        <h2 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(34px, 4vw, 52px); line-height: 1.02; letter-spacing: -0.01em">Drag to see <span class="grad">the difference.</span></h2>
        <p style="margin: 0; color: #B9B9CC; font-size: 17px; line-height: 1.55; max-width: 30em">This is how we found the panel: dead pixels scattered across the face. Drag the handle across and watch them go. A module swap and recalibration, on the same visit.</p>
        <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .14em; color: #7A7A90; margin-top: 6px">DRAG THE HANDLE &rarr;</div>
      </div>
      <div style="flex: 1 1 460px; min-width: 0; max-width: 580px; position: relative; aspect-ratio: 3 / 4; overflow: hidden; border: 1px solid #211D3A; box-shadow: 0 40px 100px rgba(0,0,0,.65); background: #000; user-select: none">
        <img src="%s" alt="The LED panel before repair, with dead pixels" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover; display: block">
        <img src="%s" alt="The same LED panel after repair, with no dead pixels" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover; display: block; clip-path: {{cmpClip}}">
        <div aria-hidden="true" style="position: absolute; top: 0; bottom: 0; left: {{cmpLeft}}; width: 3px; margin-left: -1px; background: #161027; box-shadow: 0 0 0 1px rgba(255,255,255,.18); pointer-events: none">
          <span style="position: absolute; top: 18px; right: 16px; padding: 6px 10px; background: rgba(22,16,39,.88); border: 1px solid #2E2850; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .14em; color: #EEEEF8; white-space: nowrap; opacity: {{cmpAfterOp}}">AFTER</span>
          <span style="position: absolute; top: 18px; left: 16px; padding: 6px 10px; background: rgba(22,16,39,.88); border: 1px solid #2E2850; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .14em; color: #EEEEF8; white-space: nowrap; opacity: {{cmpBeforeOp}}">BEFORE</span>
          <span style="position: absolute; top: 50%%; left: 50%%; transform: translate(-50%%, -50%%); width: 48px; height: 48px; border-radius: 6px; background: #161027; border: 1px solid #3A3360; box-shadow: 0 10px 30px rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EEEEF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 3 12 9 18"></polyline><polyline points="15 6 21 12 15 18"></polyline></svg></span>
        </div>
        <input type="range" min="0" max="100" step="1" value="{{cmp}}" onChange="{{setCmp}}" aria-label="Drag right to reveal the repaired panel" style="position: absolute; inset: 0; width: 100%%; height: 100%%; margin: 0; opacity: 0; cursor: ew-resize">
      </div>
    </div>
  </section>

""" % (before, after)

IG = 'https://www.instagram.com/wavetech.inn'
LI = 'https://www.linkedin.com/company/wavetech-innovations/'
FB = 'https://www.facebook.com/WaveTechInnovations'
ICON_CAM = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7l1.5-3h5L16 7"></path><circle cx="12" cy="13.5" r="3.5"></circle></svg>'
ICON_CASE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M3 12h18"></path></svg>'
ICON_THUMB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z"></path><path d="M7 11l4-7a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"></path></svg>'

def social(posts):
    def hl(icon, label):
        return '<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 10px; color: #B9B9CC"><span style="width: 52px; height: 52px; border-radius: 999px; border: 1px solid #2E2850; background: #12102A; display: flex; align-items: center; justify-content: center; color: #EEEEF8">%s</span>%s</div>' % (icon, label)
    I = lambda d: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % d
    hls = hl(I('<path d="M14.7 6.3a4 4 0 0 0 5 5L13 18a2.5 2.5 0 0 1-3.5 0L4 12.5a2.5 2.5 0 0 1 0-3.5l6.3-6.3a4 4 0 0 0 4.4 3.6z"></path>'), 'Installs') \
        + hl(I('<path d="M3 11v2l11 4V7L3 11z"></path><path d="M14 9a3 3 0 0 1 0 6"></path><path d="M18 7a7 7 0 0 1 0 10"></path>'), 'DOOH') \
        + hl(I('<circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2.5"></circle><path d="M3 19a6 6 0 0 1 12 0"></path><path d="M15 19a4.5 4.5 0 0 1 6-4"></path>'), 'Team') \
        + hl(I('<circle cx="12" cy="9" r="5"></circle><path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5"></path>'), 'Awards') \
        + hl(I('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"></path><circle cx="12" cy="10" r="2"></circle>'), 'Jobsites')
    grid = ''.join('<img src="%s" alt="%s" style="width: 100%%; aspect-ratio: 1 / 1; object-fit: cover; display: block; background: #000">' % (img, alt) for img, alt in posts)
    return """  <!-- SOCIAL -->
  <section class="glow-c" aria-label="Follow WaveTech on social media" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 32px; display: flex; flex-wrap: wrap; gap: 48px 72px; align-items: center">
      <div style="flex: 1 1 380px; min-width: 0; display: flex; flex-direction: column; gap: 22px">
        <img src="%s" alt="" aria-hidden="true" style="height: 36px; width: auto; align-self: flex-start">
        <div class="lbl">FOLLOW US</div>
        <h2 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(44px, 5.4vw, 72px); line-height: 0.98; letter-spacing: -0.02em; max-width: 5.2em">Stay Connected <span class="grad">Across Platforms</span></h2>
        <p style="margin: 0; color: #B9B9CC; font-size: 17px; line-height: 1.6; max-width: 28em">Real installs. Real results. Follow our latest projects, team deployments, and behind-the-scenes from jobsites nationwide.</p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; max-width: 420px">
          <a href="%s" class="pill" target="_blank" rel="noopener">%s Instagram</a>
          <a href="%s" class="pill" target="_blank" rel="noopener">%s LinkedIn</a>
          <a href="%s" class="pill" target="_blank" rel="noopener">%s Facebook</a>
        </div>
      </div>
      <div aria-hidden="true" style="flex: 0 1 500px; min-width: 300px; box-sizing: border-box; padding: 16px; border-radius: 40px; border: 2px solid #1E2A4A; background: #0B0E1C; box-shadow: 0 40px 100px rgba(0,0,0,.7), inset 0 0 0 1px #141A33">
        <div style="border-radius: 26px; overflow: hidden; background: #000; color: #EEEEF8; font-family: 'IBM Plex Sans', sans-serif; display: flex; flex-direction: column">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 18px 14px; border-bottom: 1px solid #1A1733">
            <span style="display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 15px"><span style="color: #B9B9CC">&#8249;</span>wavetech.inn</span>
            <span style="display: flex; gap: 16px; color: #B9B9CC; font-size: 16px"><span>&#9711;</span><span>&#8942;</span></span>
          </div>
          <div style="padding: 16px 18px 0; display: flex; align-items: center; gap: 18px">
            <span style="width: 78px; height: 78px; border-radius: 999px; padding: 3px; background: linear-gradient(135deg, #0DB5EC, #543BB9, #E2A33A); display: flex; flex: none"><span style="width: 100%%; height: 100%%; border-radius: 999px; background: #090916; display: flex; align-items: center; justify-content: center"><img src="%s" alt="" style="height: 26px; width: auto"></span></span>
            <div style="flex: 1; display: flex; justify-content: space-around; text-align: center">
              <span style="display: flex; flex-direction: column"><b style="font-size: 17px">152</b><span style="font-size: 12px; color: #B9B9CC">posts</span></span>
              <span style="display: flex; flex-direction: column"><b style="font-size: 17px">2,847</b><span style="font-size: 12px; color: #B9B9CC">followers</span></span>
              <span style="display: flex; flex-direction: column"><b style="font-size: 17px">184</b><span style="font-size: 12px; color: #B9B9CC">following</span></span>
            </div>
          </div>
          <div style="padding: 12px 18px 0; display: flex; flex-direction: column; gap: 3px; font-size: 13px; line-height: 1.4">
            <b style="font-size: 14px">WaveTech Innovations</b>
            <span>Pro AV &amp; Digital Signage</span>
            <span>Commercial Audio Visual Installs</span>
            <span>Nationwide Deployments</span>
            <span style="color: #00C4EC">wavetech-usa.com</span>
          </div>
          <div style="padding: 14px 18px 0; display: flex; gap: 8px">
            <span style="flex: 1; min-height: 34px; border-radius: 8px; background: linear-gradient(90deg, #0DB5EC, #543BB9); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px">Follow</span>
            <span style="flex: 1; min-height: 34px; border-radius: 8px; background: #161027; border: 1px solid #211D3A; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px">Message</span>
            <span style="width: 36px; min-height: 34px; border-radius: 8px; background: #161027; border: 1px solid #211D3A; display: flex; align-items: center; justify-content: center; color: #B9B9CC">&#8964;</span>
          </div>
          <div style="padding: 16px 18px 14px; display: flex; justify-content: space-between; gap: 6px">%s</div>
          <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid #1A1733; color: #B9B9CC">
            <span style="padding: 10px 0; text-align: center; border-bottom: 2px solid #EEEEF8; color: #EEEEF8">&#9638;</span><span style="padding: 10px 0; text-align: center">&#9655;</span><span style="padding: 10px 0; text-align: center">&#9633;</span>
          </div>
          <div style="position: relative">
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; background: #000">%s</div>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(9,9,22,.45); pointer-events: none">
              <span style="padding: 8px 14px; border: 1px dashed rgba(0,196,236,.7); background: rgba(9,9,22,.85); font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .16em; color: #00C4EC; text-align: center; line-height: 1.6">LIVE INSTAGRAM FEED<br><span style="color: #7A7A90; letter-spacing: .1em">SNAPWIDGET EMBED 1120103</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

""" % (MARK, IG, ICON_CAM, LI, ICON_CASE, FB, ICON_THUMB, MARK, hls, grid)

def bleed_hero(label, h1a, h1b, body, img, alt, pos='50% 40%'):
    return '''  <!-- PAGE HERO -->
  <section aria-label="Introduction" style="position: relative; overflow: hidden; background: #090916; border-bottom: 1px solid #1A1733">
    <div aria-hidden="true" style="position: absolute; top: 0; right: 0; bottom: 0; width: 72%%; background: url(%s) %s / cover no-repeat; -webkit-mask-image: linear-gradient(90deg, transparent 0%%, rgba(0,0,0,.55) 30%%, #000 55%%); mask-image: linear-gradient(90deg, transparent 0%%, rgba(0,0,0,.55) 30%%, #000 55%%)"></div>
    <div aria-hidden="true" style="position: absolute; inset: 0; background: linear-gradient(90deg, #090916 0%%, rgba(9,9,22,.9) 28%%, rgba(9,9,22,.35) 50%%, rgba(9,9,22,0) 70%%), linear-gradient(180deg, rgba(9,9,22,.5), transparent 25%%, transparent 75%%, #090916)"></div>
    <img src="%s" alt="%s" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none">
    <div style="position: relative; max-width: 1280px; margin: 0 auto; padding: 120px 32px 128px; min-height: 620px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 18px">
      <div class="lbl">%s</div>
      <h1 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(44px, 5.6vw, 76px); line-height: 0.98; letter-spacing: -0.02em; max-width: 9.5em">%s<br><span class="grad">%s</span></h1>
      <p style="margin: 0; color: #B9B9CC; font-size: 18px; max-width: 30em">%s</p>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px"><a href="#contact" class="cta">Get a site survey</a><a href="Home.dc.html" class="pill">All services</a></div>
    </div>
  </section>

''' % (img, pos, img, alt, label, h1a, h1b, body)

def text_hero(label, h1a, h1b, body):
    return '''  <!-- PAGE HERO -->
  <section class="glow" aria-label="Introduction" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 32px 80px; display: flex; flex-direction: column; gap: 18px">
      <div class="lbl">%s</div>
      <h1 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(44px, 5.6vw, 76px); line-height: 0.98; letter-spacing: -0.02em; max-width: 11em">%s<br><span class="grad">%s</span></h1>
      <p style="margin: 0; color: #B9B9CC; font-size: 18px; max-width: 34em">%s</p>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px"><a href="#contact" class="cta">Get a site survey</a><a href="Home.dc.html" class="pill">All services</a></div>
    </div>
  </section>

''' % (label, h1a, h1b, body)

def page_hero(label, h1a, h1b, body, img, alt):
    return '''  <!-- PAGE HERO -->
  <section class="glow" aria-label="Introduction" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 72px 32px 64px; display: flex; flex-wrap: wrap; gap: 40px 56px; align-items: center">
      <div style="flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 18px">
        <div class="lbl">%s</div>
        <h1 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(40px, 5vw, 66px); line-height: 0.98; letter-spacing: -0.02em">%s<br><span class="grad">%s</span></h1>
        <p style="margin: 0; color: #B9B9CC; font-size: 18px; max-width: 32em">%s</p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px"><a href="#contact" class="cta">Get a site survey</a><a href="Home.dc.html" class="pill">All services</a></div>
      </div>
      <figure style="flex: 1 1 460px; min-width: 0; margin: 0; aspect-ratio: 4 / 3; overflow: hidden; border: 1px solid #211D3A; box-shadow: 0 30px 80px rgba(0,0,0,.6)"><img src="%s" alt="%s" style="width: 100%%; height: 100%%; object-fit: cover; display: block"></figure>
    </div>
  </section>

''' % (label, h1a, h1b, body, img, alt)

def build(name, body_html, height, state_extra='', vals_extra=''):
    t = tail.replace(re.search(r'"\$preview":\{"width":1440,"height":\d+\}', tail).group(0), '"$preview":{"width":1440,"height":%d}' % height)
    if state_extra:
        assert 'this.state = { sent: false, pi: 3 };' in t
        t = t.replace('this.state = { sent: false, pi: 3 };', 'this.state = { sent: false, pi: 3, %s };' % state_extra)
    if vals_extra:
        assert '      submitLabel:' in t
        t = t.replace('      submitLabel:', '      %s\n      submitLabel:' % vals_extra)
    out = head + wrap_open + nav(name) + body_html + contact + footer + t
    open(P + name, 'w').write(out)
    return len(out)

# ---------------- HOME ----------------
def card(href, img, alt, title, blurb):
    return '''
        <a href="%s" style="display: flex; flex-direction: column; text-decoration: none; color: #EEEEF8; background: #12102A; border: 1px solid #211D3A; overflow: hidden">
          <span style="display: block; aspect-ratio: 16 / 10; overflow: hidden; background: #000">%s</span>
          <span style="display: flex; flex-direction: column; gap: 8px; padding: 22px 24px 26px">
            <span style="font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 24px; line-height: 1.05">%s</span>
            <span style="font-size: 15px; color: #B9B9CC; line-height: 1.5">%s</span>
            <span style="margin-top: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .1em; color: #00C4EC">SEE THE WORK &rarr;</span>
          </span>
        </a>''' % (href, ('<img src="%s" alt="%s" style="width: 100%%; height: 100%%; object-fit: cover; display: block">' % (img, alt)) if img else '<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: radial-gradient(60% 80% at 50% 50%, #1E1A38, #0B0B16); font-family: \'IBM Plex Mono\', monospace; font-size: 12px; letter-spacing: .18em; color: #00C4EC">PHOTO TO COME</span>', title, blurb)

home = '''  <!-- HOME HERO -->
  <section class="glow" aria-label="Introduction" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 88px 32px 72px; display: flex; flex-direction: column; gap: 22px">
      <div class="lbl">WAVETECH INNOVATIONS</div>
      <h1 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(44px, 6vw, 84px); line-height: 0.96; letter-spacing: -0.02em; max-width: 12em">Video walls and AV,<br><span class="grad">engineered end to end.</span></h1>
      <p style="margin: 0; color: #B9B9CC; font-size: 19px; max-width: 34em">One team designs it, hangs it, programs it and keeps it running. Pick the service you came for.</p>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px"><a href="#contact" class="cta">Get a site survey</a><a href="Service.dc.html" class="pill">Something's down</a></div>
    </div>
  </section>

  <!-- SERVICES -->
  <section class="glow-r" aria-label="Services" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 72px 32px 96px">
      <div class="lbl" style="margin-bottom: 28px">WHAT WE DO</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 16px">%s%s%s
      </div>
    </div>
  </section>

  <!-- WHY -->
  <section class="glow" aria-label="Why WaveTech" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 32px; display: flex; flex-wrap: wrap; gap: 40px 64px; align-items: center">
      <div style="flex: 1 1 400px; min-width: 0; max-width: 760px; display: flex; flex-direction: column; gap: 16px">
        <div class="lbl">WHY WAVETECH</div>
        <h2 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(34px, 4vw, 52px); line-height: 1.02; letter-spacing: -0.01em">Built for <span class="grad">real-world</span> environments</h2>
        <p style="margin: 0; color: #B9B9CC">Every deployment is backed by field teams, proactive maintenance and a commitment to performance that goes beyond installation day.</p>
        <ul style="list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px">
          <li style="background: #12102A; border: 1px solid #211D3A; padding: 14px 18px; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 600">Nationwide coverage</span><span style="font-size: 14px; color: #B9B9CC">Field teams across the continental US</span></li>
          <li style="background: #12102A; border: 1px solid #211D3A; padding: 14px 18px; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 600">WaveTech Assist&trade; programs</span><span style="font-size: 14px; color: #B9B9CC">Managed AV services, post-install</span></li>
          <li style="background: #12102A; border: 1px solid #211D3A; padding: 14px 18px; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 600">Certified technicians</span><span style="font-size: 14px; color: #B9B9CC">Factory-trained on leading platforms</span></li>
        </ul>
      </div>
    </div>
  </section>

''' % (
    card('VideoWalls.dc.html', V_BOARD, 'A seamless LED video wall in a boardroom', 'Video Wall Installation', 'Designed, hung flat and seamless, calibrated and handed over lit.'),
    card('AVIntegration.dc.html', P_MIC, 'A technician fitting a ceiling panel overhead', 'AV Integration', 'The whole room on one touch panel: displays, cameras, mics and conferencing.'),
    card('Service.dc.html', S_SEAT, 'Hands seating a new LED module', 'Emergency &amp; Maintenance', 'Walls and rooms kept running, including the ones we didn’t install.'),
    )
home += social([
    (V_BOARD, 'A boardroom LED wall with cameras either side'),
    (P_LADDER, 'A technician on a ladder running cable at a display'),
    (S_WALL, 'A video wall showing its mapping test pattern'),
    (V_LOBBY, 'A lobby LED wall'),
    (P_CEIL, 'A technician working above the ceiling grid'),
    (V_FEST, 'A venue LED wall showing a festival poster')])
build('Home.dc.html', home, 4800)

# ---------------- VIDEO WALLS ----------------
vw = hero + cab + pitch + gallery('INSTALLED', 'Hung flat, matched,', 'handed over lit.', 'Lobbies, boardrooms and venues. Every wall is mapped, seam-matched and colour-calibrated before anyone sees it.', [
        (V_BOARD, 'A seamless LED video wall in a boardroom with PTZ cameras either side', 'BOARDROOM WALL, CAMERAS AND SOUNDBARS EITHER SIDE', '50% 45%'),
        (V_LOBBY, 'A large LED video wall in a lobby', 'LOBBY WALL, WALL-TO-WALL', '50% 45%'),
        (V_FEST, 'An outdoor-facing LED wall showing a festival poster', 'VENUE WALL, FULL BRIGHTNESS', '50% 40%')]) \
     + steps('WHAT HAPPENS NEXT', 'From the first visit', 'to a lit wall.', [
    ('Survey', 'We measure the wall, check structure, power and data, and agree the size and pitch for your space.'),
    ('Design and build', 'Drawings and a fixed price first. Then mounting bars, cabinets, cabling and processing, coordinated with your contractor.'),
    ('Calibrate and hand over', 'Mapped, seam-matched and colour-calibrated, with your content running and your team trained.')])
build('VideoWalls.dc.html', vw, 7900)

# ---------------- AV INTEGRATION ----------------
av = bleed_hero('AV INTEGRATION', 'The whole room,', 'one touch panel.', 'Displays, cameras, microphones and conferencing designed as one system, programmed by the same team that installs it.', P_LADDER, 'A technician running cable at a display from a ladder', '55% 30%') \
     + room \
     + gallery('ON SITE', 'The same crew,', 'start to finish.', 'No subcontracted install. The people who drew the room are the ones on the ladder, in the rack and behind the camera presets.', [
        (P_HERO, 'A ceiling-mounted PTZ camera, installed and aimed', 'CEILING PTZ, COMMISSIONED', '50% 40%'),
        (P_GEAR, 'Cameras and processing laid out for bench testing', 'BENCH TEST BEFORE INSTALL', '50% 50%'),
        (P_MOUNT, 'A camera mount being fixed to the wall', 'MOUNTING ON BACKING', '55% 50%'),
        (P_TERM, 'A technician terminating a cable', 'TERMINATED BY HAND', '50% 50%'),
        (P_RACK, 'Cabling being dressed inside the rack', 'RACK BUILD', '50% 45%'),
        (P_MIC, 'A technician fitting a ceiling panel overhead', 'CEILING WORK', '50% 35%'),
        (P_CEIL, 'A technician on a ladder working above the ceiling grid', 'ABOVE THE CEILING', '45% 40%'),
        (P_SCREEN, 'A hand guiding a cable behind a display', 'CABLES HIDDEN', '50% 50%'),
        (P_LADDERS, 'Ladders set up in the room', 'OUR OWN CREW ON SITE', '50% 55%')]) \
     + steps('WHAT HAPPENS NEXT', 'From a walkthrough', 'to a working room.', [
    ('Walkthrough', 'We look at how the room is used, sightlines for cameras, mic coverage and where control needs to live.'),
    ('Design and install', 'Drawings, a fixed price, then the rack, displays, cameras, mics and panels, coordinated with your contractor.'),
    ('Program and train', 'DSP tuning, camera presets and the touch-panel interface, then a hand-off session with your team.')])
build('AVIntegration.dc.html', av, 5800)

# ---------------- EMERGENCY & MAINTENANCE ----------------
svc2 = bleed_hero('EMERGENCY &amp; MAINTENANCE', 'Something’s dark.', 'We’ll have it back.', 'Video walls and rooms kept running, including systems we didn’t install. Scheduled maintenance, spares on hand, remote diagnostics and on-site response.', S_CAB, 'A WaveTech technician working inside an open LED cabinet', '50% 38%') \
     + svc + compare(S_DAMAGED, S_FIXED) \
     + gallery('ON A SERVICE CALL', 'Found it, fixed it,', 'proved it.', 'Remote diagnostics first, a truck when it needs one, and a test pattern on the wall before we leave.', [
        (S_PULL, 'A technician pulling an LED module from the wall', 'MODULE PULLED FOR A SWAP', '50% 50%'),
        (S_SEAT, 'Hands seating a new LED module with a red test pattern', 'NEW MODULE SEATED AND TESTED', '50% 50%'),
        (S_WALL, 'A video wall showing its mapping test pattern', 'MAPPING CHECK AFTER A REPAIR', '50% 40%'),
        (S_LAPTOP, 'A technician at a laptop running diagnostics in a dark room', 'REMOTE DIAGNOSTICS, BEFORE A TRUCK ROLL', '60% 50%')]) \
     + '''  <!-- COVERED -->
  <section class="glow-r" aria-label="What a service agreement covers" style="border-top: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 32px">
      <div class="lbl">WHAT’S COVERED</div>
      <h2 style="margin: 12px 0 32px; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.02; letter-spacing: -0.01em">One agreement, <span class="grad">no surprises.</span></h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px">
        <div style="background: #12102A; border: 1px solid #211D3A; padding: 24px; display: flex; flex-direction: column; gap: 8px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 20px">Emergency response</span><span style="font-size: 15px; color: #B9B9CC; line-height: 1.5">A wall goes dark before an event. We diagnose remotely first and roll a truck when it needs one.</span></div>
        <div style="background: #12102A; border: 1px solid #211D3A; padding: 24px; display: flex; flex-direction: column; gap: 8px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 20px">Scheduled maintenance</span><span style="font-size: 15px; color: #B9B9CC; line-height: 1.5">Inspections, firmware, calibration checks and cleaning on a calendar, with a written report each visit.</span></div>
        <div style="background: #12102A; border: 1px solid #211D3A; padding: 24px; display: flex; flex-direction: column; gap: 8px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 20px">Spares on hand</span><span style="font-size: 15px; color: #B9B9CC; line-height: 1.5">Matched modules and cards kept for your wall, so a swap is a visit, not a lead time.</span></div>
        <div style="background: #12102A; border: 1px solid #211D3A; padding: 24px; display: flex; flex-direction: column; gap: 8px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 20px">Remote monitoring</span><span style="font-size: 15px; color: #B9B9CC; line-height: 1.5">We see a module fail over or a screen drop off before anyone in the room notices.</span></div>
      </div>
    </div>
  </section>

'''
build('Service.dc.html', svc2, 6400, state_extra='cmp: 3', vals_extra="cmp: this.state.cmp, cmpLeft: this.state.cmp + '%', cmpClip: 'inset(0 ' + (100 - this.state.cmp) + '% 0 0)', cmpAfterOp: this.state.cmp > 14 ? 1 : 0, cmpBeforeOp: this.state.cmp < 86 ? 1 : 0, setCmp: (e) => this.setState({ cmp: +e.target.value }),")

# ---------------- DIGITAL SIGNAGE ----------------
def screen(w, h, inner, extra=''):
    return '<div class="scr" style="width: %spx; height: %spx; %s">%s<div class="ovl" style="background: #E2A33A; color: #090916; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; padding: 10px; box-sizing: border-box"><span style="font-family: \'IBM Plex Mono\', monospace; font-size: 9px; letter-spacing: .1em">PUSHED TO ALL SCREENS</span><span style="font-family: \'Archivo\', sans-serif; font-weight: 800; font-size: 20px; line-height: 1">FLASH SALE</span><span style="font-family: \'Archivo\', sans-serif; font-weight: 700; font-size: 13px">20%% off until 5 PM</span></div><div class="dim" style="background: #000"></div></div>' % (w, h, extra, inner)

def layer(cls, bg, body):
    return '<div class="dp %s" style="background: %s; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; color: #FFFFFF">%s</div>' % (cls, bg, body)

T = lambda size, txt, extra='': '<span style="font-family: \'Archivo\', sans-serif; font-weight: 800; font-size: %spx; line-height: 1.05; %s">%s</span>' % (size, extra, txt)
S = lambda txt, extra='': '<span style="font-size: 10px; opacity: .85; %s">%s</span>' % (extra, txt)
MENU = lambda rows: '<div style="display: flex; flex-direction: column; gap: 5px; margin-top: 4px">' + ''.join('<div style="display: flex; justify-content: space-between; font-size: 11px; border-bottom: 1px solid rgba(255,255,255,.15); padding-bottom: 3px"><span>%s</span><span style="font-family: \'IBM Plex Mono\', monospace">%s</span></div>' % r for r in rows) + '</div>'

portrait = screen(170, 300,
    layer('dp1', 'linear-gradient(180deg, #0DB5EC, #543BB9)', T(26, 'Good<br>morning.') + S('Clear · 62°F') + S('Doors open 7 AM', 'margin-top: auto')) +
    layer('dp2', 'linear-gradient(180deg, #543BB9, #1A0F2E)', T(13, 'LUNCH SPECIAL') + T(30, 'Two for<br>$14') + S('11 AM – 2 PM', 'margin-top: auto')) +
    layer('dp4', 'linear-gradient(180deg, #1A0F2E, #B0522B)', T(13, 'TONIGHT') + T(28, 'Live set<br>7 PM') + S('Happy hour until 7', 'margin-top: auto')) +
    layer('dp5', '#0B0B14', T(16, 'See you<br>tomorrow.') + S('Open 7 AM', 'margin-top: auto')))
menu = screen(420, 236,
    layer('dp1', '#14121F', T(14, 'BREAKFAST', 'color: #00C4EC') + MENU([('Egg sandwich', '6.50'), ('Oatmeal bowl', '5.00'), ('Cold brew', '4.25'), ('Fruit cup', '3.75')])) +
    layer('dp2', '#14121F', T(14, 'LUNCH', 'color: #00C4EC') + MENU([('Turkey club', '11.00'), ('Grain bowl', '12.50'), ('Tomato soup', '6.00'), ('Lemonade', '3.50')])) +
    layer('dp4', '#14121F', T(14, 'HAPPY HOUR · 4–7', 'color: #E2A33A') + MENU([('Draft pints', '5.00'), ('House wine', '7.00'), ('Wings', '9.00'), ('Fries', '4.00')])) +
    layer('dp5', '#0B0B14', T(14, 'CLOSED', 'color: #7A7A90') + S('Kitchen opens 7 AM')))
lobby = screen(300, 170,
    layer('dp1', '#121A2E', T(12, 'TODAY', 'color: #00C4EC') + MENU([('Team standup · Rm 2', '9:00'), ('Client visit · Lobby', '10:30'), ('Lunch & learn · Café', '12:00')])) +
    layer('dp2', '#121A2E', T(12, 'FIND YOUR WAY', 'color: #00C4EC') + '<div style="flex: 1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; margin-top: 4px"><span style="grid-column: span 2; background: #0DB5EC; opacity: .7"></span><span style="grid-column: span 3; background: #543BB9; opacity: .7"></span><span style="background: #22D36B; opacity: .8"></span><span style="grid-column: span 3; background: #1E1A38"></span><span style="grid-column: span 3; background: #543BB9; opacity: .5"></span></div>') +
    layer('dp4', '#121A2E', T(12, 'THIS EVENING', 'color: #E2A33A') + T(20, 'Live music, main floor') + S('Doors 6:30')) +
    layer('dp5', '#0B0B14', T(12, 'GOOD NIGHT', 'color: #7A7A90') + S('Building closes 10 PM')))

clock = ''.join('<span class="ck ck%d" style="font-family: \'Archivo\', sans-serif; font-weight: 800; font-size: 28px; color: #EEEEF8">%s</span>' % (i + 1, t) for i, t in enumerate(['7:00 AM', '12:00 PM', '3:30 PM', '6:00 PM', '10:00 PM']))
sched = ''.join('<div class="sg sg%d"><span style="font-family: \'IBM Plex Mono\', monospace; font-size: 10px; letter-spacing: .08em">%s</span><span style="font-size: 12px; font-weight: 600">%s</span></div>' % (i + 1, a, b) for i, (a, b) in enumerate([('7:00', 'Morning'), ('11:00', 'Lunch'), ('3:30', 'Override'), ('4:00', 'Evening'), ('10:00', 'Closed')]))

signage_scene = '''  <!-- SIGNAGE: a day on the screens -->
  <section id="day" class="track-sg glow-c" aria-label="A day on the screens" style="border-bottom: 1px solid #1A1733">
    <div class="stage" style="max-width: 1280px; margin: 0 auto; padding: 32px 32px 40px; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 24px 44px; align-items: flex-start">
      <figure aria-label="Three signage screens in a venue, changing content through the day: a window display, a menu board and a lobby screen. A clock advances as the page scrolls." style="flex: 1 1 100%%; min-width: 0; margin: 0; display: flex; flex-direction: column; gap: 12px">
        <div class="sgw" style="height: 640px">
          <div style="position: absolute; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px"><span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: .1em; color: #00C4EC">VENUE · 3 SCREENS</span><span style="position: relative; display: block; height: 34px; width: 140px">%s</span></div>
          <div style="position: absolute; right: 24px; top: 20px; width: 220px; background: rgba(9,9,22,.85); border: 1px solid #211D3A; padding: 12px 14px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #B9B9CC; display: flex; flex-direction: column; gap: 6px">
            <span style="color: #00C4EC; letter-spacing: .08em">MONITORING</span>
            <span style="display: flex; justify-content: space-between"><span>Window</span><span style="color: #22D36B">ONLINE</span></span>
            <span style="display: flex; justify-content: space-between"><span>Menu board</span><span style="color: #22D36B">ONLINE</span></span>
            <span style="display: flex; justify-content: space-between"><span>Lobby</span><span style="color: #22D36B">ONLINE</span></span>
            <span style="position: relative; height: 14px"><span class="mon mon1" style="left: 0; top: 0; color: #7A7A90">Schedule running</span><span class="mon mon3" style="left: 0; top: 0; color: #E2A33A">Push sent · 3 of 3 screens</span></span>
          </div>
          <div style="position: absolute; left: 0; right: 0; bottom: 90px; display: flex; justify-content: center; align-items: flex-end; gap: 36px; padding: 0 32px">
            %s
            %s
            %s
          </div>
          <div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 70px; height: 1px; background: #211D3A"></div>
          <div style="position: absolute; left: 24px; right: 24px; bottom: 16px; display: flex; gap: 8px">%s</div>
        </div>
        <figcaption style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #7A7A90"><span>THE SCHEDULE RUNS ITSELF · ONE PUSH REACHES EVERY SCREEN</span><span>SCROLL TO RUN THE DAY</span></figcaption>
      </figure>
      <div style="flex: 1 1 100%%; min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px 40px; align-items: start">
        <div style="display: flex; flex-direction: column; gap: 12px">
          <div class="lbl">DIGITAL SIGNAGE</div>
          <h2 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.02; letter-spacing: -0.01em">Set it once. <span class="grad">Every screen keeps up.</span></h2>
          <p style="margin: 0; color: #B9B9CC; font-size: 16px">Screens, players, software and monitoring from one company, and people who will run the content for you if you'd rather not.</p>
        </div>
        <ol style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border-top: 1px solid #1A1733">
          <li class="sl1" style="padding: 13px 0; border-bottom: 1px solid #1A1733; display: flex; gap: 14px"><span style="flex: none; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8C7BE0; padding-top: 4px">01</span><span style="display: flex; flex-direction: column; gap: 3px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 18px">Displays and players, installed</span><span style="font-size: 14px; color: #B9B9CC">The right screen for each spot: window, counter, lobby, corridor.</span></span></li>
          <li class="sl2" style="padding: 13px 0; border-bottom: 1px solid #1A1733; display: flex; gap: 14px"><span style="flex: none; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8C7BE0; padding-top: 4px">02</span><span style="display: flex; flex-direction: column; gap: 3px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 18px">Software that runs the schedule</span><span style="font-size: 14px; color: #B9B9CC">Breakfast, lunch, evening, closed. Set the dayparts once.</span></span></li>
          <li class="sl3" style="padding: 13px 0; border-bottom: 1px solid #1A1733; display: flex; gap: 14px"><span style="flex: none; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8C7BE0; padding-top: 4px">03</span><span style="display: flex; flex-direction: column; gap: 3px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 18px">Monitoring on every screen</span><span style="font-size: 14px; color: #B9B9CC">We see a screen go dark before your customers do.</span></span></li>
          <li class="sl4" style="padding: 13px 0; border-bottom: 1px solid #1A1733; display: flex; gap: 14px"><span style="flex: none; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8C7BE0; padding-top: 4px">04</span><span style="display: flex; flex-direction: column; gap: 3px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 18px">Push a change in seconds</span><span style="font-size: 14px; color: #B9B9CC">A flash sale, a closure notice, a welcome for a visitor, on every screen at once.</span></span></li>
          <li class="sl5" style="padding: 13px 0; border-bottom: 1px solid #1A1733; display: flex; gap: 14px"><span style="flex: none; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8C7BE0; padding-top: 4px">05</span><span style="display: flex; flex-direction: column; gap: 3px"><span style="font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 18px">Managed day to day</span><span style="font-size: 14px; color: #B9B9CC">We can load the content, keep it fresh and handle the screens for you.</span></span></li>
        </ol>
      </div>
    </div>
  </section>

''' % (clock, portrait, menu, lobby, sched)

photos = '''  <!-- PHOTOS -->
  <section class="glow" aria-label="Signage in the field" style="border-bottom: 1px solid #1A1733">
    <div style="max-width: 1280px; margin: 0 auto; padding: 80px 32px">
      <div class="lbl" style="margin-bottom: 24px">IN THE FIELD</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px">
        <figure style="margin: 0; display: flex; flex-direction: column; gap: 8px"><img src="%s" alt="Portrait display in a hotel lobby" style="width: 100%%; aspect-ratio: 4 / 3; object-fit: cover; display: block; border: 1px solid #211D3A"><figcaption style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #7A7A90">LOBBY · PORTRAIT DISPLAY</figcaption></figure>
        <figure style="margin: 0; display: flex; flex-direction: column; gap: 8px"><img src="%s" alt="Wayfinding display in a campus corridor" style="width: 100%%; aspect-ratio: 4 / 3; object-fit: cover; display: block; border: 1px solid #211D3A"><figcaption style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #7A7A90">CAMPUS · WAYFINDING</figcaption></figure>
      </div>
    </div>
  </section>

''' % (LOBBY, WAY)

sg = page_hero('DIGITAL SIGNAGE', 'Every screen,', 'on message.', 'Displays and players, the software that schedules them, monitoring that watches them, and a team that can run the content for you.', LOBBY, 'Portrait display in a hotel lobby') \
     + signage_scene + photos + steps('WHAT HAPPENS NEXT', 'From a site visit', 'to screens on schedule.', [
    ('Site visit', 'We walk the locations, pick screen positions and sizes, and check power, mounting and network at each one.'),
    ('Install and connect', 'Screens, players and mounts installed, every unit online and reporting to monitoring.'),
    ('Schedule and hand over', 'Dayparts set, your first content loaded, your team shown how to push a change, or we keep running it for you.')])
# build('Signage.dc.html', sg, 6200)  # parked until 19 Nov 2026

# ---------------- canvas index ----------------
c = json.load(open(P + 'canvas.json'))
X0 = 4100
for i, (f, h, t) in enumerate([('Home.dc.html', 4800, 'Home'), ('VideoWalls.dc.html', 7900, 'Video Wall Installation'), ('AVIntegration.dc.html', 5800, 'AV Integration'), ('Service.dc.html', 6400, 'Emergency & Maintenance')]):
    c['boards'][f] = {'x': X0 + i * 1520, 'y': 0, 'w': 1440, 'h': h, 'title': t, 'expand': 'fill', 'is_interactive': True}
    if f not in c['order']: c['order'].append(f)
c['boards'].pop('Signage.dc.html', None)
if 'Signage.dc.html' in c['order']: c['order'].remove('Signage.dc.html')
c['notes']['site'] = {'x': X0, 'y': -300, 'text': 'WaveTech site — Home + three service pages', 'kind': 'title1', 'maxW': 7500}
c['launch'] = {'view': 'focused', 'file': 'Home.dc.html'}
json.dump(c, open(P + 'canvas.json', 'w'), indent=2)
print('built')
