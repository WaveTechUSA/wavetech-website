// usage: node shots.js <outdir> <width> <height> [pages] [stepFrac] ; serves dist/, maps CDN libs + fonts to local copies
const { chromium } = require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'dist'),NM=path.join(__dirname,'node_modules');
const OUT=process.argv[2],W=+process.argv[3],H=+process.argv[4],pages=(process.argv[5]||'index,video-walls,av-integration,emergency-maintenance').split(','),STEP=+(process.argv[6]||0.9);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'};
const srv=http.createServer((q,s)=>{let u=q.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(ROOT,decodeURIComponent(u));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s)});
const FONTCSS=`@font-face{font-family:'Archivo';font-style:normal;font-weight:100 900;font-stretch:62% 125%;src:url(https://fonts.gstatic.com/local/archivo.woff2) format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-weight:400;src:url(https://fonts.gstatic.com/local/plex400.woff2) format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-weight:500;src:url(https://fonts.gstatic.com/local/plex500.woff2) format('woff2')}`;
const LOCAL={'archivo.woff2':NM+'/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2','plex400.woff2':NM+'/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2','plex500.woff2':NM+'/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'};
async function wire(pg){
 await pg.route(/cdnjs\.cloudflare\.com.*gsap\.min\.js/,r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(NM+'/gsap/dist/gsap.min.js')}));
 await pg.route(/cdnjs\.cloudflare\.com.*ScrollTrigger\.min\.js/,r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(NM+'/gsap/dist/ScrollTrigger.min.js')}));
 await pg.route(/cdn\.jsdelivr\.net.*lenis/,r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(NM+'/lenis/dist/lenis.min.js')}));
 await pg.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)$/,r=>{const m=r.request().url().match(/three@[^/]+\/(.*)$/);r.fulfill({contentType:'text/javascript',body:fs.readFileSync(NM+'/three/'+m[1])})});
 await pg.route(/fonts\.googleapis\.com/,r=>r.fulfill({contentType:'text/css',body:FONTCSS}));
 await pg.route(/fonts\.gstatic\.com\/local\//,r=>{const n=r.request().url().split('/').pop();r.fulfill({contentType:'font/woff2',body:fs.readFileSync(LOCAL[n]),headers:{'access-control-allow-origin':'*'}})});
 await pg.route(/msgsndr|snapwidget|leadconnector/,r=>r.fulfill({status:200,contentType:'text/html',body:''}));
}
module.exports={wire,srv};
if(require.main===module)(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+srv.address().port;const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});fs.mkdirSync(OUT,{recursive:true});
for(const p of pages){const c=await b.newContext({viewport:{width:W,height:H},isMobile:W<600,hasTouch:W<600,deviceScaleFactor:1});const pg=await c.newPage();await wire(pg);
const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto(base+'/'+p+'.html',{waitUntil:'load'});await pg.waitForTimeout(2200);
const total=await pg.evaluate(()=>document.documentElement.scrollHeight);const sw=await pg.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);let i=0;
for(let y=0;y<total-H*0.3;y+=Math.round(H*STEP)){await pg.evaluate(yy=>window.scrollTo(0,yy),y);await pg.waitForTimeout(1300);await pg.screenshot({path:`${OUT}/${p}-${String(i).padStart(2,'0')}.png`});i++;if(i>44)break}
console.log(p,'h',total,'shots',i,'sw/iw',sw.join('/'),errs.slice(0,4).join(' | '));await c.close()}
await b.close();srv.close()})();
