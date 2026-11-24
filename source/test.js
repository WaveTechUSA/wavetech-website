const { chromium } = require('playwright');const {wire,srv}=require('./shots.js');
const fails=[];const ck=(ok,m)=>{if(!ok)fails.push(m)};
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+srv.address().port;const b=await chromium.launch();
for(const vp of [{n:'desktop',w:1440,h:900},{n:'short-laptop',w:1280,h:680},{n:'zoomed-out',w:2880,h:1600},{n:'tablet',w:820,h:1180,m:1},{n:'phone',w:390,h:844,m:1},{n:'small-phone',w:360,h:640,m:1}])
for(const p of (process.env.PAGES||'index,video-walls,av-integration,emergency-maintenance').split(',')){const L=p+'@'+vp.n;
 const c=await b.newContext({viewport:{width:vp.w,height:vp.h},isMobile:!!vp.m,hasTouch:!!vp.m});const pg=await c.newPage();await wire(pg);
 const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errs.push(r.status()+' '+r.url())});
 await pg.goto(base+'/'+p+'.html',{waitUntil:'load'});await pg.waitForTimeout(1500);
 const w=()=>pg.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);let [sw,iw]=await w();ck(sw<=iw,L+' overflow '+sw+'>'+iw);
 const total=await pg.evaluate(()=>document.documentElement.scrollHeight);let clipped=[];
 for(let y=0;y<total;y+=Math.round(vp.h*0.5)){await pg.evaluate(yy=>scrollTo(0,yy),y);await pg.waitForTimeout(120);
  const r=await pg.evaluate(()=>{const out=[];document.querySelectorAll('[class*="track-"]').forEach(t=>{const tr=t.getBoundingClientRect(),st=t.querySelector('.w-stage');const sr=st.getBoundingClientRect();if(tr.top<=0&&tr.bottom>=innerHeight){if(Math.abs(sr.top)>2)out.push('unpinned '+t.className);const inner=st.firstElementChild;const ir=inner.getBoundingClientRect();let maxB=0;inner.querySelectorAll('li,figure,h2,h1,.w-fstatus').forEach(e=>{const cs=getComputedStyle(e);if(cs.display==='none')return;const b=e.getBoundingClientRect();if(b.height&&b.bottom>maxB)maxB=b.bottom});if(maxB>innerHeight+2)out.push(t.className.split(' ')[0]+' content below fold by '+Math.round(maxB-innerHeight))}});return out});
  r.forEach(x=>{if(!clipped.includes(x))clipped.push(x)})}
 ck(!clipped.length,L+' '+clipped.join('; '));
 [sw,iw]=await w();ck(sw<=iw,L+' overflow after scroll');
 if(p==='emergency-maintenance'){const c0=await pg.evaluate(()=>{const c=document.querySelector('.w-cmp');c.scrollIntoView({block:'center'});return getComputedStyle(c).getPropertyValue('--pos')});await pg.waitForTimeout(300);const bx=await pg.locator('.w-cmp').boundingBox();await pg.mouse.move(bx.x+10,bx.y+bx.height/2);await pg.mouse.down();await pg.mouse.move(bx.x+bx.width*0.7,bx.y+bx.height/2,{steps:6});await pg.mouse.up();const c1=await pg.evaluate(()=>document.querySelector('.w-cmp').style.getPropertyValue('--pos'));ck(c0.trim()==='3%'&&parseFloat(c1)>60,L+' slider '+c0+'->'+c1);[sw,iw]=await w();ck(sw<=iw,L+' overflow after slider')}
 if(p==='video-walls'){await pg.evaluate(()=>document.querySelector('.w-seg').scrollIntoView({block:'center'}));await pg.waitForTimeout(300);await pg.locator('.w-seg button').nth(0).click();const t=await pg.evaluate(()=>[document.querySelector('[data-res]').textContent,document.querySelector('.w-patch-tag').textContent]);ck(t[0]==='3840 × 2160'&&t[1]==='0.95 mm',L+' pitch '+t)}
 if(vp.m){await pg.evaluate(()=>scrollTo(0,0));await pg.waitForTimeout(400);await pg.locator('.w-burger').click();await pg.waitForTimeout(450);const v=await pg.evaluate(()=>getComputedStyle(document.querySelector('.w-menu')).visibility);ck(v==='visible',L+' menu '+v)}
 if(p.startsWith('sim-')){const o=await pg.evaluate(()=>[Array.from(document.querySelectorAll('.old-top,.old-bottom')).filter(e=>getComputedStyle(e).display!=='none').length,getComputedStyle(document.body).backgroundColor,document.querySelector('#site').getBoundingClientRect().width,innerWidth]);ck(o[0]===0&&o[1]==='rgb(9, 9, 22)'&&Math.abs(o[2]-o[3])<2,L+' ghl sim '+o)}
 ck(!errs.length,L+' errors: '+errs.slice(0,3).join(' | '));await c.close();process.stdout.write('.')}
await b.close();srv.close();console.log('\n'+(fails.length?fails.length+' FAIL':'ALL PASS'));fails.forEach(f=>console.log(' x '+f))})();
