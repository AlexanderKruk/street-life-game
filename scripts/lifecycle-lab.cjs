// Additional isolated browser QA; synthetic visibility is a handler test only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const cycles=Number(process.env.STREET_MODAL_CYCLES??10);
const report={date:new Date().toISOString(),errors:[],checks:[],memory:[]};let browser;
(async()=>{
 const exe=process.env.STREET_BENCH_BROWSER,dir=exe?path.dirname(exe):'';const proxySource=process.env.HTTPS_PROXY||process.env.https_proxy;const u=proxySource?new URL(proxySource):null;
 browser=await chromium.launch({headless:true,executablePath:exe,proxy:u?{server:u.origin,...(u.username?{username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}:{})}:undefined,env:{...process.env,...(dir?{LD_LIBRARY_PATH:`${dir}:${dir}/al2023`,FONTCONFIG_PATH:dir}:{})},args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,ignoreHTTPSErrors:true});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('https://alexanderkruk.github.io/street-life-game/',{waitUntil:'load',timeout:60000});await page.locator('.bottom-nav').waitFor();
 await page.evaluate(()=>{
  const g=JSON.parse(localStorage.getItem('street-life-save-v3'));localStorage.setItem('street-life-save-v3',JSON.stringify({...g,day:20,minutes:480,locationId:'station',hunger:100,thirst:100,health:100,energy:100}));
  const inv=JSON.parse(localStorage.getItem('street-life-inventory-v1'));localStorage.setItem('street-life-inventory-v1',JSON.stringify({...inv,water:4,food:4,bread:4,cannedFood:4,wipes:5,bottles:8,cigarettes:12,medicines:4,showerGel:0,foodFreshness:100,breadFreshness:100}));localStorage.setItem('street-life-screen','location');localStorage.setItem('street-life-mobile-auto-renew','false');
  localStorage.setItem('street-life-journal-history-v1',JSON.stringify(Array.from({length:500},(_,i)=>({day:Math.floor(i/25)+1,minute:i%25,title:'Walked through the city',actionTitle:'Walk through the city',text:'I feel a little steadier.',reflection:true}))));
 });
 await page.reload({waitUntil:'load'});const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addScriptTag({content:`window.__nav=[];document.addEventListener('click',e=>{if(!e.target.closest('.bottom-nav button'))return;const t=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>window.__nav.push(performance.now()-t)));},true);`});
 const nav=async name=>{await(name==='Station'?page.locator('.nav-item.home'):page.getByRole('button',{name,exact:true})).click();await wait(100);};
 const sample=async round=>{await nav('Station');await wait(100);await cdp.send('HeapProfiler.collectGarbage');report.memory.push({round,heapUsedMiB:(await cdp.send('Runtime.getHeapUsage')).usedSize/1048576,dom:await cdp.send('Memory.getDOMCounters')});};
 await sample(0);
 for(let round=1;round<=3;round++){
  for(let i=0;i<cycles;i++){
   for(const label of ['Map','Status','Journal','Inventory'])await nav(label);
   assert.equal(await page.locator('.timeline-entry').count(),0);
   await page.getByRole('button',{name:/Clothing Clean/}).click();await page.locator('.result-modal').waitFor();await page.keyboard.press('Escape');await page.locator('.result-modal').waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>document.body.style.position),'');
   await page.getByRole('button',{name:/Phone Battery/}).click();await page.locator('.phone-list-modal').waitFor();await page.locator('.phone-modal .sheet-close').click();await nav('Station');
  }
  await sample(round);
 }
 await nav('Journal');assert.equal(await page.locator('.timeline-entry').count(),25);
 report.checks.push(`${cycles*3} cycles of navigation, Clothing result and Phone sheet: body scroll restored; current day shows 25 of 500 records distributed over 20 days`);
 report.navigationMs=await page.evaluate(()=>window.__nav);
 await nav('Inventory');
 for(const [item,count] of [['Water',3],['Food',4],['Bread roll',4],['Canned food',4],['Cigarettes',12]]){
  for(let i=0;i<count;i++){
   await page.getByRole('button',{name:new RegExp('^'+item+' ×')}).click();
   await page.locator('.result-modal').waitFor();await page.keyboard.press('Escape');await page.locator('.result-modal').waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>document.body.style.position),'');
  }
 }
 const actionHistory=await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-journal-history-v1')));
 assert.equal(actionHistory.length,500);assert.equal(actionHistory.filter(x=>x.day===20).length,52);
 report.checks.push('27 real supply actions completed and saved; history stayed capped at 500 records and retained all new actions; result scroll locks cleaned up');
 await nav('Station');
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
 const frozen=await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-save-v3')).minutes);await wait(3200);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-save-v3')).minutes),frozen);
 await page.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});await wait(1300);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
 assert.ok(await page.evaluate(m=>JSON.parse(localStorage.getItem('street-life-save-v3')).minutes>m,frozen));
 report.checks.push('Synthetic hidden/visible signals: latest state flushed, ordinary clock paused while hidden and resumed when visible');
 // Test recoverable storage failure without touching a real profile.
 await nav('Inventory');const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-inventory-v1')).water);
 await page.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('street-life-'))throw new DOMException('Lab quota failure','QuotaExceededError');return window.__originalSetItem.call(this,k,v);};});
 await page.getByRole('button',{name:/^Water ×/}).click();await page.locator('.result-modal').waitFor();await page.keyboard.press('Escape');await page.locator('.save-warning').waitFor();
 await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;delete window.__originalSetItem;});await page.locator('.save-warning').waitFor({state:'hidden',timeout:10000});
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('street-life-inventory-v1')).water),before-1);
 report.checks.push('Simulated quota error displayed save warning; restoring storage allowed retry to save the action and clear the warning');
 report.status='passed';console.log(JSON.stringify(report));
})().catch(e=>{report.status='failed';report.failure=e.message;console.error(e.stack);process.exitCode=1;}).finally(async()=>{fs.writeFileSync('lifecycle-report.json',JSON.stringify(report,null,2)+'\n');if(browser)await browser.close();});
