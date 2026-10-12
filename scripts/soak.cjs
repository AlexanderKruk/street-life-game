// Optional browser QA: Playwright + compatible Chromium; isolated test save only.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const url='https://alexanderkruk.github.io/street-life-game/';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
const round=n=>Math.round(n*10)/10;
let browser;
const report={date:new Date().toISOString(),url,method:'Live Chromium, mobile viewport 390x844 DPR2, CPU4x. Seeded valid maximum journal (500 current-day records) and 8 occupied backpack slots. Ten real minutes, normal game clock, repeated five-screen navigation. Comparable heap/DOM samples on Station after explicit garbage collection. Not physical iPhone, battery test, or proof against all leaks.',samples:[],errors:[],checks:[]};
function proxy(){const s=process.env.HTTPS_PROXY||process.env.https_proxy; if(!s)return;const u=new URL(s);return {server:u.origin,...(u.username?{username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}:{})};}
function instrument(){
 window.__stress={nav:[],tasks:[],writes:0};
 const original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(...args){window.__stress.writes++; return original.apply(this,args);};
 new PerformanceObserver(list=>window.__stress.tasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
 document.addEventListener('click',e=>{const b=e.target.closest?.('.bottom-nav button');if(!b)return;const t=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>window.__stress.nav.push({label:b.textContent.trim(),ms:performance.now()-t})));},true);
}
async function nav(page,label){await (label==='Station'?page.locator('.nav-item.home'):page.getByRole('button',{name:label,exact:true})).click();await wait(120);}
async function sample(page,cdp,elapsed){
 await nav(page,'Station');await wait(250);await cdp.send('HeapProfiler.collectGarbage');
 const [heap,dom,state]=await Promise.all([cdp.send('Runtime.getHeapUsage'),cdp.send('Memory.getDOMCounters'),page.evaluate(()=>({time:document.querySelector('header time').textContent,nav:window.__stress.nav.splice(0),tasks:window.__stress.tasks.splice(0),writes:window.__stress.writes,history:JSON.parse(localStorage.getItem('street-life-journal-history-v1')).length,scrollLocked:document.body.style.position==='fixed'}))]);
 const row={elapsedSeconds:round(elapsed),heapUsedMiB:round(heap.usedSize/1048576),dom,...state,nav: {count:state.nav.length,medianMs:round(median(state.nav.map(x=>x.ms))),p95Ms:round([...state.nav.map(x=>x.ms)].sort((a,b)=>a-b)[Math.floor(state.nav.length*.95)]),maxMs:round(Math.max(...state.nav.map(x=>x.ms)))}};
 report.samples.push(row);console.log(JSON.stringify({progress:row}));
}
(async()=>{
 const exe=process.env.STREET_BENCH_BROWSER, dir=exe?path.dirname(exe):'';
 browser=await chromium.launch({headless:true,executablePath:exe,proxy:proxy(),env:{...process.env,...(dir?{LD_LIBRARY_PATH:`${dir}:${dir}/al2023`,FONTCONFIG_PATH:dir}:{})},args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
 report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,ignoreHTTPSErrors:true});
 let page=await context.newPage();
 const setup=async p=>{p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(instrument);};
 await setup(page);await page.goto(url,{waitUntil:'load',timeout:60000});await page.locator('.bottom-nav').waitFor();
 await page.evaluate(()=>{
  const g=JSON.parse(localStorage.getItem('street-life-save-v3'));localStorage.setItem('street-life-save-v3',JSON.stringify({...g,day:1,minutes:480,locationId:'station',money:100,health:100,hunger:100,thirst:100,energy:100,hygiene:80,mood:100,rainUntil:0}));
  const inv=JSON.parse(localStorage.getItem('street-life-inventory-v1'));localStorage.setItem('street-life-inventory-v1',JSON.stringify({...inv,water:4,food:4,bread:4,cannedFood:4,wipes:5,bottles:8,cigarettes:20,medicines:4,showerGel:0,clothingCleanliness:80,foodFreshness:100,breadFreshness:100}));
  localStorage.setItem('street-life-screen','location');localStorage.setItem('street-life-mobile-auto-renew','false');
  localStorage.setItem('street-life-journal-history-v1',JSON.stringify(Array.from({length:500},(_,i)=>({day:1,minute:i,title:`Walked through the city ${i}`,actionTitle:'Walk through the city',text:'I keep looking at the lit windows. I miss having somewhere to return to.',reflection:true}))));
 });
 await page.reload({waitUntil:'load'});await page.locator('.bottom-nav').waitFor();
 await page.waitForFunction(async()=>navigator.serviceWorker.controller&&(await caches.keys()).some(x=>x.startsWith('street-life-images-v1-')),null,{timeout:60000});await wait(1500);
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await nav(page,'Inventory');assert.match(await page.locator('.inventory-section-heading').first().innerText(),/8 \/ 8/);
 await nav(page,'Journal');assert.equal(await page.locator('.timeline-entry').count(),30);assert.equal(await page.locator('.journal-load-more [role=status]').innerText(),'Showing 30 of 500 entries');
 report.checks.push('500 saved history records, 30 initially displayed, and 8/8 occupied backpack slots confirmed');
 await sample(page,cdp,0);const start=Date.now();let next=60000;
 const duration=Number(process.env.STREET_SOAK_SECONDS||600)*1000;
 while(Date.now()-start<duration){
  const cycle=Date.now();for(const label of ['Map','Inventory','Status','Journal','Station'])await nav(page,label);
  if(Date.now()-start>=next){await sample(page,cdp,(Date.now()-start)/1000);next+=60000;}
  await wait(Math.max(0,10000-(Date.now()-cycle)));
 }
 await sample(page,cdp,(Date.now()-start)/1000);
 // Actual offline context: application already open, cached navigation and action.
 await context.setOffline(true);await nav(page,'Inventory');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-inventory-v1')).water);
 await page.getByRole('button',{name:/^Water ×/}).click();
 await page.locator('.result-modal').waitFor();await page.keyboard.press('Escape');await page.locator('.result-modal').waitFor({state:'hidden'});
 const after=await page.evaluate(()=>({inventory:JSON.parse(localStorage.getItem('street-life-inventory-v1')),history:JSON.parse(localStorage.getItem('street-life-journal-history-v1'))}));
 assert.equal(after.inventory.water,before-1);assert.equal(after.history.length,500);assert.equal(after.history.at(-1).actionTitle,'Drink water');
 for(const label of ['Map','Status','Journal','Station'])await nav(page,label);
 report.checks.push('Offline open-app navigation and water action succeeded; action saved immediately; history retained 500 newest entries');
 await context.setOffline(false);await page.reload({waitUntil:'load'});await page.locator('.bottom-nav').waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-inventory-v1')).water),before-1);
 report.checks.push('Offline action restored after reconnect and reload');
 // Dispatching lifecycle signals is explicitly a handler test, not OS force-kill emulation.
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-save-v3')));
 await page.close({runBeforeUnload:true});page=await context.newPage();await setup(page);await page.goto(url,{waitUntil:'load'});await page.locator('.bottom-nav').waitFor();
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-save-v3')));
 assert.equal(restored.day,saved.day);assert.ok(restored.minutes>=saved.minutes&&restored.minutes<=saved.minutes+2);assert.equal(restored.locationId,saved.locationId);
 report.checks.push('pagehide handler plus tab close/reopen restored game day/time/location');
 report.durationSeconds=round((Date.now()-start)/1000);report.status='passed';
 console.log(JSON.stringify({complete:report.checks,errors:report.errors}));
})().catch(e=>{report.status='failed';report.failure=e.message;console.error(e.stack);process.exitCode=1;}).finally(async()=>{fs.writeFileSync('soak-report.json',JSON.stringify(report,null,2)+'\n');if(browser)await browser.close();});
