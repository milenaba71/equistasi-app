import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const P='/tmp/claude-0/-home-user/f26f0fbb-fba4-5b9c-96cb-cc4e61105cf1/scratchpad/promo';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+P+'/cam.y4m']});
const RIPPLE=`addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.tapfx{position:fixed;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(250,220,0,.95);pointer-events:none;z-index:2147483647;animation:tapfx .6s ease-out forwards}@keyframes tapfx{0%{transform:scale(.3);opacity:1}100%{transform:scale(1.6);opacity:0}}';document.documentElement.appendChild(s);addEventListener('pointerdown',e=>{const d=document.createElement('div');d.className='tapfx';d.style.left=e.clientX+'px';d.style.top=e.clientY+'px';document.documentElement.appendChild(d);setTimeout(()=>d.remove(),700)},true)})`;
async function clip(name, state, fn){
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:false,locale:'it-IT',permissions:['camera']});
  await ctx.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('http://localhost')) return r.continue(); if(u.includes('34myr3')) return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"valid":true}'}); return r.abort();});
  if(state) await ctx.addInitScript(()=>{localStorage.setItem('tp-serial','EQ2410078797');localStorage.setItem('tp-profile',JSON.stringify({type:'dolore',patologia:null,eta:'',consent:false,version:'2026-10',ts:'2026-10-18T10:00:00Z'}));localStorage.setItem('tp-name','Marco');localStorage.setItem('tp-disclaimer','1');});
  await ctx.addInitScript(RIPPLE);
  const p=await ctx.newPage(); p.on('pageerror',e=>console.log(name,'ERR',e.message));
  const dir=P+'/rec/'+name; fs.rmSync(dir,{recursive:true,force:true}); fs.mkdirSync(dir,{recursive:true});
  const cdp=await ctx.newCDPSession(p); const frames=[]; let n=0;
  cdp.on('Page.screencastFrame',async f=>{const fn=String(n++).padStart(5,'0')+'.jpg'; fs.writeFileSync(dir+'/'+fn,Buffer.from(f.data,'base64')); frames.push([fn,f.metadata.timestamp]); try{await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId});}catch(e){}});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:780,maxHeight:1688,everyNthFrame:1});
  await fn(p);
  await p.waitForTimeout(300); await cdp.send('Page.stopScreencast');
  const end=Date.now()/1000; let L='';
  frames.forEach(([fn,t],i)=>{const nx=i+1<frames.length?frames[i+1][1]:end; L+="file '"+fn+"'\nduration "+Math.max(0.001,nx-t).toFixed(4)+"\n";});
  L+="file '"+frames[frames.length-1][0]+"'\n"; fs.writeFileSync(dir+'/list.txt',L);
  await ctx.close(); console.log('rec',name,frames.length);
}
const tapEl=async(p,sel)=>{const bb=await p.locator(sel).first().boundingBox(); await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2); await p.mouse.down(); await p.waitForTimeout(90); await p.mouse.up();};
const smooth=async(p,y,ms=1200)=>{await p.evaluate(([y,ms])=>{const s=scrollY,t0=performance.now();return new Promise(r=>{const f=t=>{const k=Math.min(1,(t-t0)/ms),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;scrollTo(0,s+(y-s)*e);k<1?requestAnimationFrame(f):r()};requestAnimationFrame(f)})},[y,ms]); await p.waitForTimeout(200);};
// A: attivazione
await clip('A-attivazione', false, async p=>{
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(2500);
  await tapEl(p,'#gate-scan'); await p.waitForTimeout(12500);
});
// B: mappa -> zona -> muscolo
await clip('B-mappa', true, async p=>{
  await p.goto('http://localhost:8765/#/'); await p.waitForTimeout(1500);
  const y=await p.evaluate(()=>{const e=document.querySelector('[data-area=collo]');return e.getBoundingClientRect().top+scrollY-330;});
  await smooth(p,y,1800); await p.waitForTimeout(900);
  await tapEl(p,'path[data-area=collo]'); await p.waitForTimeout(2200);
  await smooth(p,250,900); await p.waitForTimeout(600);
  await tapEl(p,'a[href="#/m/trapezio"], a.m-item'); await p.waitForTimeout(2500);
  await smooth(p,180,900); await p.waitForTimeout(2200);
});
// C: promemoria
await clip('C-promemoria', true, async p=>{
  await p.goto('http://localhost:8765/#/promemoria'); await p.waitForTimeout(1800);
  await tapEl(p,'button:has-text("Ho applicato il dispositivo")'); await p.waitForTimeout(3500);
});
await b.close();
