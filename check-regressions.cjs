// Exercise the deferred wetness feature explicitly; check-wetness-disabled.cjs covers release defaults.
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});
global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};
let now=1800000000000, nextId=1;
Date.now=()=>now;
const callbacks=new Map();
window.setInterval=(fn,delay)=>{const id=nextId++;callbacks.set(id,{fn,delay,nextAt:now+delay});return id};
window.clearInterval=id=>callbacks.delete(id);
require('esbuild').buildSync({entryPoints:['src/App.tsx'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',outfile:'regression-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const React=require('react');
const {render,screen,fireEvent,within,act,cleanup,configure}=require('@testing-library/react');
configure({getElementError:message=>new Error(message)});
const phoneSearchButton=require('./test-fixtures/phone-search.cjs')({screen,fireEvent});
process.on('uncaughtException',error=>{console.error(error.message.split('Here are')[0]);console.error(error.stack.split('\n').filter(line=>line.includes('check-regressions')).join('\n'));cleanup();dom.window.close();process.exit(1)});
const assert=require('node:assert/strict');
const App=require('./regression-app.cjs').default;
const stateKey='street-life-save-v3',invKey='street-life-inventory-v1',lifeKey='street-life-situation-v1';
const read=k=>JSON.parse(localStorage.getItem(k));
const ambientSceneIds=['city-waking','night-rustle','cold-hands','station-cleaning','platform-question'];
let openingEvents = false;
function setup(s={},extra={}){
 phoneSearchButton.returnToLocation=false;
 cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage,!openingEvents);
 localStorage.setItem(stateKey,JSON.stringify({day:1,minutes:480,money:100,hunger:72,thirst:66,energy:68,health:82,hygiene:55,mood:58,intoxication:0,locationId:'street',...s}));
 localStorage.setItem('street-life-effects-v1','[]');
 localStorage.setItem('street-life-discovered-v1','["street","station","shop","support","shelter","work"]');
 localStorage.setItem('street-life-mobile-auto-renew','false');
 localStorage.setItem('street-life-mobile-renewed-day',String(s.day??1));
 localStorage.setItem('street-life-mobile-service-until','5000');
 for(const[k,v]of Object.entries(extra))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 Math.random=()=>.99;
 render(React.createElement(App));
 // Initial normalization may constrain a legacy Mood above its current ceiling.
 fireEvent(window,new window.Event('pagehide'));
}
function click(name){if(screen.queryByRole('dialog',{name:'Rain on the street'})&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name)))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));const dialog=screen.queryByRole('dialog');const searchLabel={'Where can I get help in the morning?':'Help & hygiene','How can I get a shelter bed?':'Shelter','Where can I get food and water?':'Food & water'}[name];const target=searchLabel ? phoneSearchButton(searchLabel) : dialog ? within(dialog).getByRole('button',{name}) : screen.getByRole('button',{name});const previousRandom=Math.random;if(target.dataset.choice?.startsWith('question-')||/Ask AI/.test(target.textContent))Math.random=()=>.34;fireEvent.click(target);Math.random=previousRandom;if(document.querySelector('.phone-activity')&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name))){for(let n=0;n<30&&read('street-life-phone-activity-v1');n++){if(screen.queryByRole('dialog',{name:'Rain on the street'}))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));advance(1000);}}}
function chooseHours(hours){fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:new RegExp('^'+hours+' h')}));}
function beginSleep(name,hours){click(name);if(hours!==undefined)chooseHours(hours);click('Start sleeping');}
function ok(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Got it',exact:true}));if(phoneSearchButton.returnToLocation&&!screen.queryByRole('dialog')&&document.querySelector('.phone-screen')){phoneSearchButton.returnToLocation=false;fireEvent.click(document.querySelector('.nav-item.home'));}}
function advance(ms){const end=now+ms;while(true){const due=Math.min(...[...callbacks.values()].map(timer=>timer.nextAt));if(due>end)break;now=due;act(()=>{for(const[id,timer]of [...callbacks])if(callbacks.has(id)&&timer.nextAt<=now){timer.nextAt+=timer.delay;timer.fn()}})}now=end;fireEvent(window,new window.Event('pagehide'))}
// Advance real timers to each next game minute, including slower pedestrian stages.
function advanceTravelMinutes(minutes) {
 for(let n=0;n<minutes;n++) {
  const before=read('street-life-trip-v1');assert(before,'trip is still active');
  for(let guard=0;guard<100;guard++) {
   const due=Math.min(...[...callbacks.values()].map(timer=>timer.nextAt));
   advance(due-now);
   const after=read('street-life-trip-v1');
   if(!after||after.remaining<before.remaining)break;
   assert(guard<99,'travel is not unexpectedly paused');
  }
 }
}
function report(name,evidence){console.log(JSON.stringify({name,evidence}));}
function assertResultLocked() {
 const dialog=screen.getByRole('dialog');
 assert.equal(dialog.getAttribute('aria-modal'),'true');
 assert(document.querySelector('.result-overlay')?.contains(dialog));
 assert(document.querySelector('.game-background[inert][aria-hidden="true"]'));
 assert(document.querySelector('.bottom-nav[inert][aria-hidden="true"]'));
 assert(document.querySelector('footer[inert] .reset').disabled);
 assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
 assert(dialog.contains(document.activeElement));
 assert.equal(document.body.style.position,'fixed');
 const state=read(stateKey), inventory=read(invKey), content=dialog.textContent;
 for(const button of document.querySelectorAll('.bottom-nav button, footer .reset, .game-background button'))fireEvent.click(button);
 assert.equal(screen.getByRole('dialog').textContent,content);
 fireEvent.keyDown(document,{key:'Tab'});assert(dialog.contains(document.activeElement));
 fireEvent.keyDown(document,{key:'Tab',shiftKey:true});assert(dialog.contains(document.activeElement));
 advance(3000);assert.deepEqual(read(stateKey),state);assert.deepEqual(read(invKey),inventory);
}
function discoverHelp(){if(document.querySelector('.phone-screen'))click('Street');for(let n=0;n<3;n++){if(['support','daycenter','free-clinic'].every(id=>read('street-life-discovered-v1').includes(id)))return;click('Where can I get help in the morning?');ok();}}

// Closing time moves guests outside once, pauses for acknowledgement, survives
// reload, and waits behind action results. Shelter and 24-hour stays are exempt.
const closingKey='street-life-closing-notice-v1';
for(const [id,close] of [['shop',1320],['support',960],['daycenter',960],['free-clinic',960],['hospital',1080],['jobcenter',900],['work',1080]]) {
 setup({locationId:id,minutes:close-1});advance(1000);
 assert.equal(read(stateKey).locationId,'street');assert.equal(read(closingKey),id);
 assert(screen.getByRole('dialog').textContent.includes('has closed'));
 assert(document.querySelector('.result-illustration').src.endsWith('event-closing-time-480.webp'));
 assert(document.querySelector('.result-illustration').srcset.includes('event-closing-time-1024.webp'));
 const stopped=read(stateKey);advance(3000);assert.deepEqual(read(stateKey),stopped);
 cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes('has closed'));
 ok();assert.equal(read(closingKey),null);advance(1000);assert.equal(read(stateKey).minutes,close+1);
 assert.equal(read('street-life-journal-history-v1').filter(entry=>entry.actionTitle==='Closing time').length,1);
}
setup({locationId:'shop',minutes:1319},{[invKey]:{water:0}});click('Buy Water for 3.00 zł');
assert.equal(read(stateKey).locationId,'street');assert.equal(read(invKey).water,3);assert.equal(read(stateKey).money,97);
assert(screen.getByRole('dialog').textContent.includes('Bought Water'));ok();assert(screen.getByRole('dialog').textContent.includes('has closed'));ok();
setup({locationId:'shop',minutes:1321});advance(1000);assert.equal(read(stateKey).locationId,'shop');assert.equal(read(closingKey),null,'arriving at a closed door is not a closing event');
setup({locationId:'shop',minutes:1319,energy:0.01});advance(1000);assert(screen.getByRole('dialog').textContent.includes('has closed'));assert(!document.querySelector('.sleep-overlay'));ok();assert(document.querySelector('.sleep-overlay'),'forced sleep starts outside after acknowledging closure');
setup({locationId:'shop',minutes:1319});click('Map');advance(1000);assert(screen.getByRole('dialog').textContent.includes('has closed'));assert.equal(read(stateKey).locationId,'street');
for(const id of ['station','residential-shelter']) {
 setup({locationId:id,minutes:1439},{[lifeKey]:{housing:'Schronisko'}});advance(1000);assert.equal(read(stateKey).locationId,id);assert.equal(read(closingKey),null);
}
setup({locationId:'shop',minutes:1319},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:65,remaining:20}});advance(1000);assert.equal(read(closingKey),null);assert(read('street-life-trip-v1'),'closing the origin never interrupts travel');
// Exhaustion uses an available bed. Other places require leaving first and
// sleeping on the street; the station bench is not a bed.
for(const id of ['street','station','shop','support','daycenter','free-clinic','hospital','jobcenter','work','shelter','residential-shelter']) {
 setup({locationId:id,minutes:1140,energy:0},{[lifeKey]:{housing:id==='residential-shelter'?'Schronisko':'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1}});
 const bed=id==='shelter'?'shelter':id==='residential-shelter'?'residential':null;
 assert.equal(read(stateKey).locationId,bed?id:'street');assert.equal(read('street-life-sleep-v1').kind,bed??'ground');assert.equal(read('street-life-sleep-v1').forced,true);assert.equal(read('street-life-sleep-v1').total,480);
}

// Street uses the ordinary one-minute-per-second clock, including after a
// completed information search, tab changes and reload. Only the result pauses.
for(const state of [{day:1,minutes:1320},{day:2,minutes:600}]) {
 setup(state);
 assert(!document.querySelector('.story-choices').textContent.includes('TIME PAUSED'));
 advance(999);assert.equal(read(stateKey).minutes,state.minutes);
 advance(1);assert.equal(read(stateKey).minutes,state.minutes+1);
 const idleHunger=read(stateKey).hunger;
 click('Where can I get help in the morning?');
 const searchResult=read(stateKey);assert.equal(searchResult.minutes,state.minutes+16);
 advance(3000);assert.deepEqual(read(stateKey),searchResult,'reading the search result pauses time');
 ok();advance(1000);assert.equal(read(stateKey).minutes,searchResult.minutes+1,'closing the result resumes Street time');
 for(const tab of ['Map','Inventory','Status','Phone']) {
  click(tab);const beforeTab=read(stateKey).minutes;advance(1000);
  assert.equal(read(stateKey).minutes,beforeTab+1,tab+' retains the Street clock');
  fireEvent.click(document.querySelector('.nav-item.home'));
  advance(1000);assert.equal(read(stateKey).minutes,beforeTab+2,'returning home keeps the clock running');
 }
 assert(read(stateKey).hunger<idleHunger,'ordinary needs keep changing on Street');
 const beforeHidden=read(stateKey).minutes;
 Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});
 advance(2000);assert.equal(read(stateKey).minutes,beforeHidden);
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 advance(1000);assert.equal(read(stateKey).minutes,beforeHidden+1);
 const beforeReload=read(stateKey).minutes;
 cleanup();render(React.createElement(App));advance(1000);
 assert.equal(read(stateKey).minutes,beforeReload+1,'reloading Street resumes the ordinary clock');
}

// Phone work consumes one game minute every 250 ms (×4), resumes, pauses in background,
// and only unlocks knowledge/rewards when the full search has finished.
setup({minutes:1436,mood:28},{'street-life-discovered-v1':['street','station','shop']});
const phoneBefore=read(stateKey), batteryBefore=read(invKey).phoneBattery;Math.random=()=>0;
fireEvent.click(phoneSearchButton('Help & hygiene'));
assert(document.querySelector('.phone-activity'));assert(screen.getByRole('dialog',{name:'Looking for information'}));assert(document.querySelector('.phone-screen[inert]'));assert.equal(document.body.style.overflow,'hidden');
assert(document.querySelector('.phone-screen, .street-art img'));
assert(document.querySelector('.phone-screen[inert]'));
assert.equal(read(stateKey).minutes,1436);assert.equal(read(invKey).phoneBattery,batteryBefore);
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
advance(1000);assert.equal(read(stateKey).day,2);assert.equal(read(stateKey).minutes,0);
assert(screen.getByRole('dialog',{name:'Rain on the street'}));fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));
assert(read(invKey).phoneBattery<batteryBefore);assert.equal(read(stateKey).mood,28,'unfinished searches do not passively raise Mood');
assert(!read('street-life-discovered-v1').includes('support'));assert(!read('street-life-answers-v1').includes('morning'));
const partialState=read(stateKey),partialInventory=read(invKey);
Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});advance(5000);
assert.deepEqual(read(stateKey),partialState);assert.deepEqual(read(invKey),partialInventory);
Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
// Emulate the old 30-minute save after four minutes of work.
const oldPhoneSession=read('street-life-phone-activity-v1');localStorage.setItem('street-life-phone-activity-v1',JSON.stringify({...oldPhoneSession,remaining:26,total:undefined}));
cleanup();render(React.createElement(App));assert(document.querySelector('.phone-activity'));assert.deepEqual(read(stateKey),partialState);assert.deepEqual(read(invKey),partialInventory);
assert.equal(read('street-life-phone-activity-v1').remaining,6);advance(1250);assert(screen.getByRole('dialog',{name:'Looking for information'}));assert.equal(document.querySelector('.phone-activity .activity-phase').textContent,'Saving addresses');
advance(250);assert.equal(read(stateKey).minutes,6);assert(Math.abs(read(stateKey).mood-31)<1e-8);
assert(!localStorage.getItem('street-life-phone-activity-v1'));
assert(read('street-life-discovered-v1').includes('support'));assert.equal(read('street-life-journal-history-v1').length,1);
assert(document.querySelector('.result-overlay'));assert(!document.querySelector('.result-inline'));
assert(document.querySelector('.game-background[inert]'));assertResultLocked();
assert(document.querySelector('.result-consequences').textContent.includes('Clothing wetness'));
assert.equal(document.querySelectorAll('.compact-info-heading').length,1);assert.equal(document.querySelectorAll('.result-place').length,0);assert(!read('street-life-discovered-v1').includes('free-clinic'));assert(!read('street-life-discovered-v1').includes('daycenter'));assert(!document.querySelector('.result-details'));
assert(document.querySelector('.phone-screen, .street-art img'));
assert(screen.getByRole('dialog').textContent.includes('10 min'));const completed=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),completed);
ok();assert(document.querySelector('.street-art img'));assert(!document.querySelector('.phone-activity-overlay'));assert.equal(document.body.style.overflow,'');
click(/Inventory$/);click('Phone');click('Find Help');click('Help & hygiene');assert(!document.querySelector('.phone-activity'));assert.equal(read(stateKey).minutes,completed.minutes+15);assert(read('street-life-discovered-v1').includes('daycenter'));
assert.equal(document.querySelectorAll('.result-cost-line').length,1);ok();discoverHelp();click('How can I get a shelter bed?');assert.equal(document.querySelectorAll('.compact-info-heading').length,1);assert(!document.querySelector('.result-place'));assert(!document.querySelector('.result-details'));ok();
// Each repeat finds exactly one new place, and reload cannot reveal the next one early.
setup({minutes:1320},{'street-life-discovered-v1':['street','station','shop']});
for(const [index,id] of ['support','daycenter','free-clinic'].entries()){
 click('Where can I get help in the morning?');
 assert.equal(document.querySelectorAll('.compact-info-heading').length,1);
 assert.equal(read('street-life-discovered-v1').length,4+index);
 assert(read('street-life-discovered-v1').includes(id));
 if(index<2)assert(!read('street-life-discovered-v1').includes('free-clinic'));
 assert(!screen.getByRole('dialog').textContent.includes('referral'));
 assertResultLocked();
 ok();assert(!document.querySelector('.bottom-nav[inert]'));cleanup();render(React.createElement(App));
 assert.equal(read('street-life-discovered-v1').length,4+index,'reload retains just the completed discoveries');
}
const noNewBefore=read(stateKey),noNewBattery=read(invKey).phoneBattery,noNewPlaces=read('street-life-discovered-v1');
click(/Inventory$/);click('Phone');click('Find Help');click('Help & hygiene');
assert(screen.getByRole('dialog').textContent.includes('No new information'));assertResultLocked();
assert.equal(document.querySelectorAll('.result-place').length,0);
assert.deepEqual(read('street-life-discovered-v1'),noNewPlaces);
assert.equal(read(stateKey).minutes,noNewBefore.minutes+15);
assert(read(invKey).phoneBattery<noNewBattery);
assert(read(stateKey).mood<noNewBefore.mood+1,'empty searches do not farm a mood reward');
assert(read('street-life-journal-history-v1').at(-1).text.includes('same places'));
ok();
// Existing fully discovered saves do not receive duplicate finds or a free search.
cleanup();render(React.createElement(App));assert.deepEqual(read('street-life-discovered-v1'),noNewPlaces);

// Estimates stay the same; durations vary within bounds and never reroll.
for(const [draw,duration] of [[0,10],[.999,25]]) {
 setup({minutes:1320,mood:28});Math.random=()=>draw;
 assert(phoneSearchButton('Help & hygiene').textContent.includes('≈15m'));
 fireEvent.click(phoneSearchButton('Help & hygiene'));
 assert.equal(read('street-life-phone-activity-v1').total,duration);
 assert(!document.querySelector('[role="progressbar"]'));assert.equal(document.querySelector('.phone-activity .travel-elapsed').textContent,'01m');
 assert(!document.querySelector('.phone-activity .activity-status').textContent.includes('min left'));
 const initialBattery=read(invKey).phoneBattery;advance(750);
 cleanup();Math.random=()=>.5;render(React.createElement(App));
 assert.equal(read('street-life-phone-activity-v1').total,duration);assert.equal(read('street-life-phone-activity-v1').remaining,duration-3);
 advance((duration-3)*250);assert.equal(read(stateKey).minutes,1320+duration);assert.equal(read(stateKey).mood,31,'search gain totals three points across short and long searches');
 assert(Math.abs(read(invKey).phoneBattery-(initialBattery-duration*.3*(1+(100-72)*.007)))<1e-8);
 assert(screen.getByRole('dialog').textContent.includes(duration+' min'));
}
// Screen brightness changes browsing drain by light level, including a
// single search crossing sunset. All use the same worn starting phone.
for(const [day,minutes,baseDrain] of [[1,600,6],[3,600,7.5],[3,1320,4.5],[1,1198,4.7]]) {
 setup({day,minutes,mood:28});const beforeCharge=read(invKey).phoneBattery;
 click('Where can I get help in the morning?');
 assert(Math.abs(read(invKey).phoneBattery-(beforeCharge-baseDrain*1.196))<1e-8,'browsing accounts for daylight each minute');
}
// Navigation follows elapsed game time, including arrival; sunlight and worn
// phones change its rate. Unpaid internet disables navigation drain.
for(const [day,minutes,condition,rate,enabled] of [[1,600,100,18,true],[1,600,72,18,true],[3,600,72,24,true],[3,1320,72,12,true],[1,600,72,18,false]]) {
 setup({day,minutes},{[invKey]:{phoneBattery:62,phoneCondition:condition},'street-life-trip-v1':{destinationId:'station',mode:'walk',total:5,remaining:5}});
 if(!enabled){cleanup();localStorage.setItem('street-life-mobile-service-until','0');render(React.createElement(App));}
 const beforeCharge=read(invKey).phoneBattery;
 const routeDuration=read('street-life-trip-v1').remaining;advanceTravelMinutes(routeDuration);
 assert.equal(read(stateKey).locationId,'station');
 const expected=beforeCharge-(enabled?routeDuration*rate/60*(1+(100-condition)*.007):0);
 assert(Math.abs(read(invKey).phoneBattery-expected)<1e-8,'navigation uses all five elapsed minutes');
}

// Service expiry interrupts without granting knowledge. Reset cancels active work.
setup({minutes:1320},{'street-life-mobile-service-until':'1322'});fireEvent.click(phoneSearchButton('Help & hygiene'));advance(2000);
assert(screen.getByRole('dialog').textContent.includes('Search interrupted'));assert(!read('street-life-answers-v1').includes('morning'));
setup({minutes:1320});fireEvent.click(phoneSearchButton('Help & hygiene'));advance(3000);fireEvent.click(screen.getByRole('button',{name:'Reset save'}));advance(3000);
assert(!document.querySelector('.phone-activity'));assert(!localStorage.getItem('street-life-phone-activity-v1'));assert.equal(read(stateKey).minutes,1323,'reset cancels the search and resumes the ordinary Street clock');

// Street has three contextual choices; the test shortcut is gone. Bottle search
// still opens through the ordinary action when normal priorities select it.
for(const [state,extra,hasBottles] of [
 [{minutes:1320},{},false],
 [{day:2,minutes:600},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}},false],
 [{day:2,minutes:600},{'street-life-discovered-v1':['street','station','shop']},false],
 [{day:2,minutes:600,money:0},{},false],
 [{day:2,minutes:600},{},true],
]) {
 setup(state,extra);
 const choices=[...document.querySelectorAll('.story-actions > button')];
 assert.equal(choices.length,3);assert(!document.querySelector('[data-temporary]'));
 assert.equal(choices.filter(button=>button.dataset.choice==='bottles').length,hasBottles?1:0);
 assert(!screen.queryByRole('button',{name:/Look for bottles \(test\)/}));
 if(hasBottles){
  let draw=0;Math.random=()=>++draw%10/10;click(/Maybe there are bottles I could return for a little money/);
  assert(document.querySelector('.trash-bin'));assert(screen.getByRole('button',{name:'Finish searching'}));
 }
}

// Deposit collection: intact PET and cans share the same carried stack; damaged
// containers never earn a deposit, and a full backpack cannot collect either.
const depositEmptyBag={water:0,food:0,medicines:0,bread:0,cannedFood:0,wipes:0,showerGel:0,cigarettes:0,bottles:0};
for(const [draw,art,kept] of [[0,'can',2],[.5,'plastic',4],[.99,'plastic-crushed',0]]) {
 setup({day:2,minutes:600},{[invKey]:depositEmptyBag});Math.random=()=>draw;
 click(/Maybe there are bottles I could return for a little money/);
 assert.equal(document.querySelectorAll('.trash-piece').length,18);
 const containers=[...document.querySelectorAll('.bottle-piece')];
 assert(containers.length>=2&&containers.length<=6);
 assert(containers.every(piece=>piece.dataset.art===art));
 assert([...document.querySelectorAll('.trash-piece:not(.bottle-piece)')].every(piece=>!piece.dataset.art.startsWith('can')),'ordinary clutter does not add extra damaged cans');
 assert([...document.querySelectorAll('.trash-piece img')].every(img=>img.src.endsWith('.webp')));
 for(const piece of containers)fireEvent.click(piece);
 if(!kept)assert(containers.every(piece=>piece.isConnected),'damaged containers ignore clicks');
 fireEvent(window,new window.Event('pagehide'));
 assert.equal(read(invKey).bottles,kept);
 click('Finish searching');
 assert(document.querySelector('.bottle-search-reward').textContent.includes(kept?`+${kept}`:'Nothing useful'));
 assert.equal(document.querySelectorAll('.result-change-list .positive').length,0,'no duplicate container gain');
}
// Cans use the more generous eligibility rate; a controlled pile can contain
// three sound cans and one damaged can without additional cans in the clutter.
setup({day:2,minutes:600},{[invKey]:depositEmptyBag});
const canDraws=[.5,...Array(17).fill(0),.1,.5,.5,.5,.5];
for(const eligibility of [.7,.7,.7,.9])canDraws.push(.1,eligibility,.5,.5,.5,.5);
let canDrawIndex=0;Math.random=()=>canDraws[canDrawIndex++]??.5;
click(/Maybe there are bottles I could return for a little money/);
assert.equal(document.querySelectorAll('[data-art="can"]').length,3);
assert.equal(document.querySelectorAll('[data-art="can-crushed"]').length,1);
// Tapping litter cannot clear the pile. Only dragging it out removes that item;
// accepted deposit containers remain available even when moved across an edge.
setup({day:2,minutes:600},{[invKey]:depositEmptyBag});Math.random=()=>.5;
click(/Maybe there are bottles I could return for a little money/);
const trashBounds={left:0,top:0,width:400,height:300};
document.querySelector('.trash-pile').getBoundingClientRect=()=>trashBounds;
function trashPointer(piece,type,x,y){
 piece.setPointerCapture=()=>{};piece.hasPointerCapture=()=>true;piece.releasePointerCapture=()=>{};
 const event=new window.Event(type,{bubbles:true});Object.assign(event,{clientX:x,clientY:y,pointerId:1});fireEvent(piece,event);
}
const litter=document.querySelector('.trash-piece:not(.bottle-piece)');
const center=piece=>[parseFloat(piece.style.left)*4,parseFloat(piece.style.top)*3];
let [lx,ly]=center(litter);const pileCount=document.querySelectorAll('.trash-piece').length;
fireEvent.click(litter);trashPointer(litter,'pointerdown',lx,ly);trashPointer(litter,'pointerup',lx,ly);
assert(litter.isConnected);assert.equal(document.querySelectorAll('.trash-piece').length,pileCount);
trashPointer(litter,'pointerdown',lx,ly);trashPointer(litter,'pointermove',200,150);trashPointer(litter,'pointerup',200,150);
assert(litter.isConnected,'moving litter inside keeps it');
trashPointer(litter,'pointerdown',200,150);trashPointer(litter,'pointermove',430,150);
assert(!litter.isConnected);assert.equal(document.querySelectorAll('.trash-piece').length,pileCount-1,'only dragged litter is discarded');
const keptContainer=document.querySelector('.bottle-piece');let [bx,by]=center(keptContainer);
trashPointer(keptContainer,'pointerdown',bx,by);trashPointer(keptContainer,'pointercancel',bx,by);trashPointer(keptContainer,'pointerup',bx,by);
assert(keptContainer.isConnected,'cancelled taps cannot collect a container');
trashPointer(keptContainer,'pointerdown',bx,by);trashPointer(keptContainer,'pointermove',430,150);trashPointer(keptContainer,'pointerup',430,150);
assert(keptContainer.isConnected);assert.equal(document.querySelector('.trash-search-row strong').textContent,'0','dragging never collects a container');
[bx,by]=center(keptContainer);trashPointer(keptContainer,'pointerdown',bx,by);trashPointer(keptContainer,'pointermove',bx+2,by+1);trashPointer(keptContainer,'pointerup',bx+2,by+1);
assert(!keptContainer.isConnected);assert.equal(document.querySelector('.trash-search-row strong').textContent,'1','tiny finger motion remains a tap');
const keyboardLitter=document.querySelector('.trash-piece:not(.bottle-piece)');
for(let i=0;i<30&&keyboardLitter.isConnected;i++)fireEvent.keyDown(keyboardLitter,{key:'ArrowRight'});
assert(!keyboardLitter.isConnected,'keyboard users can move litter out instead of clicking it away');
setup({day:2,minutes:600},{[invKey]:depositEmptyBag});Math.random=()=>.99;click(/Maybe there are bottles I could return for a little money/);
const damaged=document.querySelector('.bottle-piece');document.querySelector('.trash-pile').getBoundingClientRect=()=>trashBounds;
const [dx,dy]=center(damaged);trashPointer(damaged,'pointerdown',dx,dy);trashPointer(damaged,'pointerup',dx,dy);
assert(damaged.isConnected,'damaged bottles also ignore pointer taps');
trashPointer(damaged,'pointerdown',dx,dy);trashPointer(damaged,'pointermove',430,150);
assert(!damaged.isConnected,'damaged bottles can be dragged away like other rubbish');
setup({day:2,minutes:600},{[invKey]:{...depositEmptyBag,water:4,food:4,medicines:24}});Math.random=()=>0;
click(/Maybe there are bottles I could return for a little money/);fireEvent.click(document.querySelector('.bottle-piece'));
fireEvent(window,new window.Event('pagehide'));assert.equal(read(invKey).bottles,0);
assert.equal(document.querySelector('.trash-search-row strong').textContent,'0');
// Legacy bottle saves retain their value, including shared stack semantics.
setup({locationId:'shop',minutes:600},{[invKey]:{...depositEmptyBag,bottles:3}});
const depositMoney=read(stateKey).money;
click(/Return bottles & cans ×3/);advance(1250);
assert.equal(read(invKey).bottles,0);assert.equal(read(stateKey).money,depositMoney+1.5);

// Three normal directions.
function storyIds(){return [...document.querySelectorAll('.story-actions > button')].map(button=>button.dataset.choice);}
function assertStoryChoices(expected){assert.deepEqual([...storyIds()].sort(),[...expected].sort());}
const choiceCode=require('esbuild').buildSync({entryPoints:['src/streetChoiceOrder.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const choiceModule={exports:{}};new Function('module','exports',choiceCode)(choiceModule,choiceModule.exports);
const {shuffleChoiceOrder}=choiceModule.exports;
const choiceInput=['information','rest','practical'];
const gameplayRandom=Math.random;Math.random=()=>{throw Error('UI order must not consume a gameplay roll')};
const permutations=new Set();
for(let seed=0;seed<120;seed++){const order=shuffleChoiceOrder(choiceInput,seed,'decision');permutations.add(order.join('|'));assert.deepEqual([...order].sort(),[...choiceInput].sort());assert.deepEqual(order,shuffleChoiceOrder(choiceInput,seed,'decision'));}
assert.equal(permutations.size,6,'all six three-option orders are reachable');
assert.deepEqual(choiceInput,['information','rest','practical']);Math.random=gameplayRandom;
const optionCode=require('esbuild').buildSync({entryPoints:['src/ChoiceOptions.tsx'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false,external:['react','react/jsx-runtime']}).outputFiles[0].text;
const optionModule={exports:{}};new Function('require','module','exports',optionCode)(require,optionModule,optionModule.exports);
const {orderChoiceNodes}=optionModule.exports;
for(const labels of [['Yes','No'],['Accept','Decline'],['Pick it up','Leave it'],['Start','Cancel']])for(let seed=0;seed<20;seed++){
 const nodes=labels.map(label=>React.createElement('button',{'aria-label':label,key:label},label));
 assert.deepEqual(orderChoiceNodes(nodes,seed,'dialog').map(node=>node.props['aria-label']),labels,'conventional binary pairs stay in order');
}
const durations=['2 h','4 h','6 h','8 h'].map(label=>React.createElement('button',{key:label},label));
assert.deepEqual(orderChoiceNodes(durations,42,'sleep',true).map(node=>node.props.children),['2 h','4 h','6 h','8 h']);

setup({minutes:1320});assertStoryChoices(['phone-help','walk','station-route']);
const initialChoices=storyIds();const originalChoice=document.querySelector('.story-actions > button');originalChoice.focus();advance(10000);assert.equal(document.activeElement,originalChoice,'ticks preserve the focused choice');assert.deepEqual(storyIds(),initialChoices);cleanup();render(React.createElement(App));assert.deepEqual(storyIds(),initialChoices);
click('Where can I get help in the morning?');ok();assertStoryChoices(['phone-help','walk','station-route']);discoverHelp();assertStoryChoices(['phone-help','walk','station-route']);
click('How can I get a shelter bed?');ok();assertStoryChoices(['phone-help','find-bench','station-route']);
for(const [state,extra,expected] of [
 [{minutes:1320,mood:28},{},['phone-help','music-walk','station-route']],
 [{minutes:1320,energy:20},{},['phone-help','street-sleep','station-route']],
 [{minutes:1320,thirst:20},{[invKey]:{phoneBattery:30}},['phone-help','walk','station-route']],
 [{minutes:1320,thirst:20},{[invKey]:{phoneBattery:31}},['phone-help','walk','station-route']],
 [{minutes:600,money:0},{},['phone-help','walk','beg']],
]){setup(state,extra);assertStoryChoices(expected);assert.equal(storyIds().filter(id=>id==='phone-help').length,1);assert(!storyIds().some(id=>id.startsWith('question-')||id.endsWith('-search')));}

// One-level choices react immediately; result reading pauses the clock.
setup({minutes:1320});assert(document.querySelector('[data-choice="phone-help"]').textContent.includes('Look for help on my phone'));click('Where can I get help in the morning?');assert(screen.getByRole('dialog').textContent.includes('last job application'));ok();discoverHelp();assert(document.querySelector('[data-choice="phone-help"]'));
setup({minutes:1320});click('Just one more street. I’m not ready to lie down.');assert.equal(screen.getAllByRole('dialog').length,1);assert(screen.getByRole('dialog').textContent.includes('a steady office job'));assert(read('street-life-journal-history-v1')[0].text.includes('my old desk'));assert(!read('street-life-journal-history-v1')[0].text.includes('In your late thirties'));assert.equal(read('street-life-journal-history-v1')[0].summary,undefined);assert(read('street-life-memories-v1').includes('office-routine'));ok();cleanup();render(React.createElement(App));click('Just one more street. I’m not ready to lie down.');assert(!screen.getByRole('dialog').textContent.includes('a steady office job'));ok();click('Where can I get help in the morning?');assert(screen.getByRole('dialog').textContent.includes('redundancy email'));ok();discoverHelp();click('How can I get a shelter bed?');assert(screen.getByRole('dialog').textContent.includes('a place to live'));ok();Math.random=()=>0;click(/Is there a bench nearby\?/);ok();click(/I’ll sit for a bit/);assert(screen.getByRole('dialog').textContent.includes('ordinary expenses'));ok();if(document.querySelector('.event-overlay')){fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button')[0]);ok();}fireEvent.click(screen.getByRole('button',{name:'Reset save'}));assert.deepEqual(read('street-life-memories-v1'),[]);assert(!document.querySelector('.story-scene').textContent.includes('office'));
setup({minutes:1320,mood:28},{'street-life-discovered-v1':['street','station','shop']});
const openingText=document.querySelector('.story-scene div > p:last-child').textContent;assert.equal(openingText,'Behind the lit windows, people are getting ready for bed. You sit outside with your backpack. You have nowhere to go, and no one is expecting you tonight.');
const phoneThought=document.querySelector('[data-choice="phone-help"]');
assert.equal(document.querySelectorAll('.story-actions .choice-duration').length,2);assert.equal(phoneThought.querySelector('.choice-estimate'),null);
assert.equal(document.querySelector('[data-choice="music-walk"] .choice-duration').textContent,'≈30m');
assert.equal(document.querySelector('[data-choice="station-route"] .choice-duration').textContent,'≈30m+');
assert(!phoneThought.querySelector('.choice-emoji'));assert.equal(phoneThought.querySelector('.story-action-icon').getAttribute('aria-hidden'),'true');
assert(!screen.queryByRole('button',{name:'Choose another approach',exact:true}));assert(!screen.queryByRole('button',{name:'Other actions',exact:true}));assert(!document.querySelector('.location-summary + .event'));
assert(!document.querySelector('.story-choices').textContent.includes('TIME PAUSED'));
click('Where can I get help in the morning?');assert(screen.getByRole('dialog'));assert.equal(read(stateKey).minutes,1335);assert(Math.abs(read(stateKey).mood-31)<1e-8);const answerState=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),answerState);ok();discoverHelp();assert(document.querySelector('[data-choice="phone-help"]'));assert(!screen.queryByRole('button',{name:'Choose another approach',exact:true}));
setup({minutes:1320});assert(!screen.queryByRole('button',{name:/What about Night Shelter\? Maybe there is a place./}));
setup({minutes:1320});click(/Try the station. At least I’d be out of the cold./);assert(document.querySelector('.district-pin.selected').textContent.includes('Station'));assert(!document.querySelector('.travel-sheet'));click('Go →');assert(screen.getByRole('button',{name:/Public transport/}));assert.equal(read(stateKey).minutes,1320);
// First-night wandering uses real walking costs; rain choices pause and persist.
setup({minutes:1320},{'street-life-discovered-v1':['street','station','shop'],[invKey]:{clothingCleanliness:80}});assert(!screen.queryByRole('button',{name:'Earn something for food',exact:true}));assert(screen.getByRole('button',{name:'Try the station. At least I’d be out of the cold.',exact:true}));const dryEnergy=read(stateKey).energy;click('Just one more street. I’m not ready to lie down.');assert.equal(read(stateKey).minutes,1350);assert(read(stateKey).energy<dryEnergy);assert(!read(stateKey).rainUntil);assert(Math.abs(read(invKey).clothingCleanliness-(80-30*30/1440))<1e-8);ok();assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));
setup({minutes:1320},{[invKey]:{clothingCleanliness:80}});Math.random=()=>0;click('Just one more street. I’m not ready to lie down.');assert.equal(read(stateKey).minutes,1350);assert.equal(read(stateKey).rainUntil,1515);assert.equal(read(stateKey).wetness,15);ok();
assert(screen.getByRole('dialog',{name:'Rain on the street'}));assert.equal(within(screen.getByRole('dialog')).getAllByRole('button').length,3);
const rainyState=read(stateKey),rainyInventory=read(invKey);advance(10000);assert.deepEqual(read(stateKey),rainyState);assert.deepEqual(read(invKey),rainyInventory);
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog',{name:'Rain on the street'}));click(/^Find cover and continue/);assert.equal(read(stateKey).minutes,1355);assert.equal(localStorage.getItem('street-life-rain-choice-v1'),'false');assert(read('street-life-rain-response-v1').sheltered);
const coverWetness=read(stateKey).wetness;advance(1000);assert(read(stateKey).wetness<coverWetness);assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));
// A rain interruption preserves partial browsing across reload. Searching for
// cover spends five minutes without progressing the search or using the phone.
setup({minutes:1438,mood:28},{'street-life-discovered-v1':['street','station','shop']});Math.random=()=>.34;fireEvent.click(phoneSearchButton('Help & hygiene'));advance(2000);
assert(screen.getByRole('dialog',{name:'Rain on the street'}));const pausedSearch=read('street-life-phone-activity-v1'),pausedCharge=read(invKey).phoneBattery,pausedWet=read(stateKey).wetness??0;advance(5000);assert.deepEqual(read('street-life-phone-activity-v1'),pausedSearch);assert.equal(read(invKey).phoneBattery,pausedCharge);
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog',{name:'Rain on the street'}));click(/^Find cover and continue/);assert.equal(read('street-life-phone-activity-v1').remaining,pausedSearch.remaining);assert.equal(read(invKey).phoneBattery,pausedCharge);assert.equal(read(stateKey).minutes,5);assert(read(stateKey).wetness>=pausedWet);
const shelteredWet=read(stateKey).wetness;cleanup();render(React.createElement(App));assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));advance(pausedSearch.remaining*250);assert(read(stateKey).wetness<shelteredWet);assert(read('street-life-discovered-v1').includes('support'));assert(!localStorage.getItem('street-life-phone-activity-v1'));ok();
// Stop keeps paid time and battery, cancels progress and grants no discoveries.
setup({day:2,minutes:600,mood:28},{'street-life-discovered-v1':['street','station','shop'],'street-life-rain-response-v1':{episode:'weather:2',locationId:'street',sheltered:false}});Math.random=()=>.34;fireEvent.click(phoneSearchButton('Help & hygiene'));advance(3000);
cleanup();localStorage.removeItem('street-life-rain-response-v1');render(React.createElement(App));assert(screen.getByRole('dialog',{name:'Rain on the street'}));const stoppedCharge=read(invKey).phoneBattery,stoppedTime=read(stateKey).minutes;click(/^Stop what I’m doing/);assert(!localStorage.getItem('street-life-phone-activity-v1'));assert.equal(read(invKey).phoneBattery,stoppedCharge);assert.equal(read(stateKey).minutes,stoppedTime);assert(!read('street-life-discovered-v1').includes('support'));assert(!read('street-life-answers-v1').includes('morning'));assert(screen.getByRole('dialog').textContent.includes('Search stopped'));advance(5000);assert.equal(read(invKey).phoneBattery,stoppedCharge);ok();
// A walking trip shelters without advancing the route, resumes automatically
// when rain ends, or can be continued manually without losing route progress.
setup({day:3,minutes:600,rainUntil:3488},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:9,remaining:9},'street-life-rain-choice-v1':'true'});click(/^Find cover, then continue/);assert.equal(read('street-life-trip-v1').remaining,9);const routeCharge=read(invKey).phoneBattery;advance(500);assert.equal(read('street-life-trip-v1').remaining,9);assert.equal(read(invKey).phoneBattery,routeCharge);assert(screen.getByRole('heading',{name:'Under cover'}));advance(500);advanceTravelMinutes(1);assert(read('street-life-trip-v1').remaining<9);
setup({day:3,minutes:600,rainUntil:3500},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:9,remaining:9},'street-life-rain-choice-v1':'true'});click(/^Find cover, then continue/);click('Continue journey in the rain');advanceTravelMinutes(1);assert.equal(read('street-life-trip-v1').remaining,8);
setup({day:3,minutes:600,rainUntil:3500},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:9,remaining:7},'street-life-rain-choice-v1':'true'});click(/^Stop what I’m doing/);assert(!localStorage.getItem('street-life-trip-v1'));assert.equal(read(stateKey).locationId,'street');assert(screen.getByRole('dialog').textContent.includes('Journey stopped'));ok();
setup({minutes:1320,mood:28});const musicBattery=read(invKey).phoneBattery;click(/Put on something familiar and walk for a while. Clear my head./);assert.equal(read(stateKey).minutes,1350);assert.equal(read(stateKey).mood,31);assert(read(invKey).phoneBattery<musicBattery);
const musicResult=screen.getByRole('dialog',{name:'Walk with music'});
assert(musicResult.querySelector('.result-illustration').src.includes('event-music-walk'));
assert.equal(musicResult.querySelector('[data-stat="Mood"] .result-stat-delta').textContent,'+3');
assert(musicResult.querySelector('.result-cost-line').textContent.includes('30 min'));
assert(musicResult.querySelector('.result-cost-line .battery-icon'));
assert(musicResult.textContent.includes('familiar music'));
assert(!musicResult.textContent.includes('redundancy notice'));
assert(musicResult.querySelector('.result-description').textContent.length<110,'music result remains brief');
assert(document.querySelector('.bottom-nav[inert]'));ok();
setup({minutes:1320,mood:49},{'street-life-opening-calls-v1':0});click(/Put on something familiar and walk for a while. Clear my head./);assert.equal(read(stateKey).mood,50);assert.equal(screen.getByRole('dialog').querySelector('[data-stat="Mood"] .result-stat-delta').textContent,'+1');ok();
setup({minutes:1320},{[invKey]:{phoneBattery:0}});assert(!screen.queryByRole('button',{name:/Put on something familiar and walk for a while. Clear my head./}));assert(screen.getByRole('button',{name:'Just one more street. I’m not ready to lie down.'}));
setup({minutes:1320,mood:28},{'street-life-discovered-v1':['street','station','shop']});const questionBattery=read(invKey).phoneBattery;click('Where can I get help in the morning?');assert.equal(read(stateKey).minutes,1335);assert(Math.abs(read(stateKey).mood-31)<1e-8);assert(Math.abs(read(invKey).phoneBattery-(questionBattery-4.5*(1+(100-72)*.007)))<1e-8);assert(read('street-life-discovered-v1').includes('support'));assert(!read('street-life-discovered-v1').includes('daycenter'));assert(screen.getByRole('dialog').textContent.includes('08:00'));ok();const rereadState=read(stateKey),rereadInventory=read(invKey);click(/Inventory$/);click('Phone');click('Find Help');click('Help & hygiene');assert.equal(read(stateKey).minutes,rereadState.minutes+15);assert(read(invKey).phoneBattery<rereadInventory.phoneBattery);ok();click('Street');discoverHelp();cleanup();render(React.createElement(App));assert(read('street-life-answers-v1').includes('morning'));click('How can I get a shelter bed?');assert(screen.getByRole('dialog').textContent.includes('0–3'));assert.equal(read('street-life-goal-v1').minute,1080);ok();click('Reset save');assert.deepEqual(read('street-life-answers-v1'),[]);
// P1: referral opens map, including migration of a v53 save.
// Questions emerge from needs; remembering a station outlet does not need a charged phone.
// Phone stays a single Street choice regardless of urgency or discovered answers.
for(const extra of [{}, {[invKey]:{phoneBattery:0}}, {'street-life-mobile-service-until':'0'}]){
 setup({minutes:1320,thirst:20},extra);assert(document.querySelector('[data-choice="phone-help"]'));
 assert(!document.querySelector('.story-actions [data-choice^="question-"]'));
}
setup({locationId:'support'});click(/Housing/);ok();click(/Map$/);
for (const name of ['Night Shelter','Help Center','Day Work']) assert([...document.querySelectorAll('.district-scene strong')].some(node=>node.textContent===name));
assert(![...document.querySelectorAll('.district-pin')].some(pin=>/Cheap Shop|Street/.test(pin.textContent)));
assert(read(lifeKey).schroniskoReferral);assert(document.querySelector('.district-scene').textContent.includes('Schronisko'));
setup({}, {[lifeKey]:{schroniskoReferral:true}});click(/Map$/);assert(document.querySelector('.district-scene').textContent.includes('Schronisko'));

// Sleep and immediate work must apply disease/dehydration and age both food stores.
setup({hunger:0,thirst:0,health:90,energy:20},{'street-life-effects-v1':[{id:'cold',expiresAt:10000}], [invKey]:{food:2,foodFreshness:100}, 'street-life-storage-v1':{food:2,foodFreshness:100}});
beginSleep(/Lie down here\? I’m not sure… But I could try./);click('Wake up (debug)');
assert(Math.abs(read(stateKey).health - (90 - .147 * 480)) < 1e-8);
assert(Math.abs(read(invKey).foodFreshness - (100 - 100 / 2880 * 480)) < 1e-8);
assert(Math.abs(read('street-life-storage-v1').foodFreshness - read(invKey).foodFreshness) < 1e-8);
setup({locationId:'work',hunger:0,thirst:0,health:90,energy:75},{'street-life-effects-v1':[{id:'cold',expiresAt:10000}], [invKey]:{food:2,foodFreshness:100}});
click(/Take a short shift/);assert(Math.abs(read(stateKey).health - (90 - .147 * 180)) < 1e-8);assert(read(invKey).foodFreshness < 94);

// Illustrated map only shows discovered places; selection is read-only until routing.
setup({minutes:600}, {'street-life-discovered-v1':['street','station','shop']});click(/Map$/);
const mapBefore=read(stateKey);
assert(document.querySelector('.district-backdrop img').getAttribute('src').endsWith('/city-map-dark-480.webp'));
assert(document.querySelector('.district-backdrop img').srcset.includes('city-map-dark-1024.webp 1024w'));
assert(!document.querySelector('.district-pin').textContent.includes('Night Shelter'));
assert(![...document.querySelectorAll('.district-pin')].some(pin=>pin.textContent.includes('Night Shelter')));
click(/^.*Station/);assert.deepEqual(read(stateKey),mapBefore);assert(!document.querySelector('.travel-sheet'));
assert(document.querySelector('.district-card').textContent.includes('Station'));
assert(!document.querySelector('.district-route path'), 'being outside has no fixed map anchor');
click('Go →');assert(document.querySelector('.travel-sheet'));fireEvent.click(document.querySelector('.sheet-close'));
assert.deepEqual(read(stateKey),mapBefore);

// Both shortcuts open routing directly, without a Go card; current-place shortcuts are disabled.
const streetShortcut=within(document.querySelector('.district-shortcuts')).getByRole('button',{name:'Street',exact:true});
assert(streetShortcut.disabled);
fireEvent.click(streetShortcut);assert.deepEqual(read(stateKey),mapBefore);
click('Small Shop');assert(document.querySelector('.travel-sheet'));
assert(!document.querySelector('.district-card'));
assert(document.querySelector('.travel-sheet').textContent.includes('Cheap Shop'));
assert.equal(read(stateKey).locationId,'street');
fireEvent.click(document.querySelector('.sheet-close'));
setup({locationId:'shop',minutes:600});click(/Map$/);
assert(screen.getByRole('button',{name:'Small Shop',exact:true}).disabled);
const beforeExit=read(stateKey);
fireEvent.click(screen.getByRole('button',{name:'Small Shop',exact:true}));
assert(!document.querySelector('.travel-sheet'));assert.deepEqual(read(stateKey),beforeExit);
click('Street');assert(document.querySelector('.travel-sheet'));
assert(!document.querySelector('.district-card'));assert.deepEqual(read(stateKey),beforeExit);
fireEvent.click(document.querySelector('.sheet-close'));assert.deepEqual(read(stateKey),beforeExit);
click('Street');click(/^Walk/);assert.equal(read('street-life-trip-v1').destinationId,'street');
assert.equal(read(stateKey).locationId,'shop');
setup({locationId:'station',minutes:600});click(/Map$/);
assert(!screen.getByRole('button',{name:'Street',exact:true}).disabled);
assert(!screen.getByRole('button',{name:'Small Shop',exact:true}).disabled);

// Cancelled routes must never count as a departure; actual walking does, once.
setup({locationId:'shelter',minutes:540},{[lifeKey]:{housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1,shelterStrikes:0}});
click(/Map$/);for(let i=0;i<3;i++){click(/^.*Station/);click("Go →");fireEvent.click(document.querySelector('.travel-sheet .sheet-close'));}
assert.equal(read(stateKey).locationId,'shelter');assert.equal(read(lifeKey).shelterStrikes,0);
click(/^.*Station/);click("Go →");click(/Walk/);assert.equal(read(lifeKey).shelterStrikes,1);


// D20 freezes time and prevents exhaustion, both before and after rolling.
setup({locationId:'shop',energy:.15});fireEvent.click(screen.getAllByRole('button',{name:'STEAL',exact:true})[0]);const frozen=read(stateKey);advance(3000);
assert.deepEqual(read(stateKey),frozen);assert(document.querySelector('.dice-overlay'));assert(!document.querySelector('.sleep-overlay'));
click('Roll D20');advance(3000);assert.deepEqual(read(stateKey),frozen);click('Continue');assert(read(stateKey).minutes > frozen.minutes);
setup({energy:.15},{[invKey]:{transitCard:false}});click(/Map$/);click(/^.*Station/);click("Go →");click(/Ride without/);const fareFrozen=read(stateKey);advance(3000);assert.deepEqual(read(stateKey),fareFrozen);assert(!document.querySelector('.sleep-overlay'));

// Auto renewal keeps prepaid time and money; expired service buys a full day.
setup({day:2},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'6000'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),6000);assert.equal(read(stateKey).money,100);
setup({day:2},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'1500'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),3360);assert.equal(read(stateKey).money,99);
setup({day:2,money:0},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'6000'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),6000);

// Phone launches from inventory; its compact header opens the mobile plan sheet.
setup({locationId:'shop',minutes:600},{[invKey]:{phoneBattery:43,phoneCondition:72},'street-life-mobile-service-until':'5000'});
click('Inventory');click('Phone');
assert(screen.getByRole('region',{name:'Phone'}));assert(!screen.queryByRole('dialog'));
assert.equal(document.querySelectorAll('.phone-app-grid button').length,4);
assert(!screen.queryByRole('switch',{name:'Music'}));assert(!screen.queryByRole('switch',{name:'Navigation'}));
click('Mobile plan');assert(screen.getByRole('dialog',{name:'Mobile plan'}));
assert(document.activeElement===screen.getByRole('button',{name:'Close mobile plan'}));assert.equal(document.body.style.position,'fixed');
const phoneMinute=read(stateKey).minutes;advance(1000);assert.equal(read(stateKey).minutes,phoneMinute+1);
fireEvent.click(screen.getByRole('switch',{name:'Auto-renew'}));fireEvent(window,new window.Event('pagehide'));assert.equal(localStorage.getItem('street-life-mobile-auto-renew'),'true');
fireEvent(document,new window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true}));assert(document.activeElement===screen.getByRole('switch',{name:'Auto-renew'}),'backward Tab wraps within the plan');
fireEvent(document,new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(!screen.queryByRole('dialog'));assert(document.activeElement===screen.getByRole('button',{name:'Mobile plan'}),'closing the plan restores its trigger focus');assert.equal(document.body.style.position,'');
click('Mobile plan');const beforeTopup=read(stateKey);click('Add 24 hours of mobile service for 1 zł');assert(!document.querySelector('.phone-list-modal'));assert.equal(screen.getAllByRole('dialog').length,1);
assert.equal(read(stateKey).money,beforeTopup.money-1);assert.equal(read(stateKey).minutes,beforeTopup.minutes);assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),6440);
assert(screen.getByRole('dialog').textContent.includes('−1 zł'));ok();assert.equal(document.body.style.position,'');
click('Mobile plan');fireEvent.click(document.querySelector('.phone-list-overlay'));assert(!screen.queryByRole('dialog'));assert.equal(document.body.style.position,'');
setup({locationId:'shop',money:0},{[invKey]:{phoneBattery:0,phoneCondition:0},'street-life-mobile-service-until':'0'});click('Phone');
assert(screen.getByText('Phone unavailable'));assert(!screen.queryByRole('button',{name:'Find Help',exact:true}));assert(screen.getByRole('button',{name:'Mobile plan'}).disabled);
click('Map');assert(document.querySelector('.map-surface'));
setup({locationId:'shop',health:20},{[invKey]:{phoneBattery:43,phoneCondition:72}});click('Inventory');click('Phone');assert(!screen.getByRole('button',{name:'Call ambulance'}).disabled);click('Call ambulance');assert.equal(screen.getAllByRole('dialog').length,1);assert.equal(read(stateKey).locationId,'hospital');ok();assert.equal(document.body.style.position,'');

// New trips sample -5% / +20% once; previews stay approximate and reloading
// preserves the chosen duration and fare for walking, paid/free transit and fare-dodging.
for(const mode of ['walk','transit','free','fare-dodge'])for(const draw of [0,.999999]) {
 setup({}, {[invKey]:{transitCard:false},...(mode==='free'?{'street-life-effects-v1':[{id:'free-transit',expiresAt:5000}]}:{})});
 click('Map');click(/^.*Station/);click('Go →');
 assert(screen.getByRole('button',{name:/Public transport/}).textContent.includes('≈35m'));
 assert(screen.getByRole('button',{name:/Walk/}).textContent.includes('≈1h 5m'));
 if(mode==='fare-dodge') {
  click(/Ride without/);Math.random=()=>.99;click('Roll D20');Math.random=()=>draw;click('Continue');
  if(screen.queryByRole('button',{name:'Got it',exact:true}))ok();
 } else {
  let draws=0;Math.random=()=>draws++===0?draw:.99;click(mode==='walk'?/Walk/:/Public transport/);
 }
 const chosenTrip=read('street-life-trip-v1'),expected=mode==='walk'?(draw===0?62:78):(draw===0?32:39);
 assert.equal(chosenTrip.total,expected);assert.equal(chosenTrip.remaining,expected);
 assert.equal(read(stateKey).money,mode==='transit'?95.6:100);
 advanceTravelMinutes(1);const partialTrip=read('street-life-trip-v1');let reloadDraws=0;Math.random=()=>{reloadDraws++;return .5};
 cleanup();render(React.createElement(App));assert.equal(reloadDraws,0,'loading a trip never samples again');assert.deepEqual(read('street-life-trip-v1'),partialTrip);
 advanceTravelMinutes(1);assert.equal(read('street-life-trip-v1').remaining,expected-2);
 Math.random=()=>.99;advanceTravelMinutes(expected-2);assert.equal(read(stateKey).locationId,'station');assert.equal(read(stateKey).minutes,480+expected);assert(!localStorage.getItem('street-life-trip-v1'));ok();
}

// Found money uses one Polish coin, awards the actual grosz amount once,
// and retains it through result reading and reload without another draw.
for(const [draw,grosz] of [[.05,1],[.15,2],[.3,5],[.5,10],[.7,20],[.85,50],[.94,100],[.975,200],[.995,500]]) {
 setup({}, {'street-life-encounters-v1':{seen:['phone-drop'],lastAt:null,pendingId:null}});click('Map');click(/^.*Station/);click('Go →');const eventDraws=[.2,0,0];Math.random=()=>eventDraws.shift()??.99;click(/Walk/);
 assert(screen.getByRole('dialog').textContent.includes('Coin on the pavement'));
 assert(document.querySelector('.event-card.illustrated-event .event-illustration').src.includes('event-found-coin'));
 assert(!document.querySelector('.coin-emblem'));
 const beforeCoin=read(stateKey),beforeCoinTrip=read('street-life-trip-v1');advance(2000);assert.deepEqual(read(stateKey),beforeCoin);
 let awardDraws=0;Math.random=()=>{awardDraws++;return draw};click('Pick it up');assert.equal(awardDraws,1);
 const awarded=read(stateKey);assert.equal(awarded.money,beforeCoin.money+grosz/100);assert.equal(awarded.minutes,beforeCoin.minutes);assert.deepEqual(read('street-life-trip-v1'),beforeCoinTrip);
 const denomination=grosz<100?`${grosz} gr`:`${grosz/100} zł`;assert(screen.getByRole('dialog').textContent.includes(`${denomination} coin`));
 assert(document.querySelector('.result-modal.illustrated-result .result-illustration').src.includes('event-coin-take'));
 assert(!document.querySelector('.coin-emblem'));
 assert.equal(document.querySelector('.result-gains').textContent,`Money+${grosz/100} zł`);
 assert.equal(document.querySelectorAll('.result-gains .result-change').length,1,'money is shown once in the shared gains list');
 assert(!document.querySelector('.result-details'),'the short result has no duplicate description');
 advance(1000);assert.equal(awardDraws,1);assert.deepEqual(read(stateKey),awarded);
 ok();cleanup();render(React.createElement(App));assert.equal(awardDraws,1);assert.equal(read(stateKey).money,awarded.money);assert(!document.querySelector('.event-overlay'));
}
setup({mood:28}, {'street-life-encounters-v1':{seen:['phone-drop'],lastAt:null,pendingId:null}});click('Map');click(/^.*Station/);click('Go →');const leaveCoinDraws=[.2,0,0];Math.random=()=>leaveCoinDraws.shift()??.99;click(/Walk/);
const leaveCoinBefore=read(stateKey);Math.random=()=>{throw new Error('Leaving a coin must not roll a reward')};click('Leave it');assert.equal(read(stateKey).money,leaveCoinBefore.money);assert.equal(read(stateKey).mood,leaveCoinBefore.mood+1);
assert(screen.getByRole('dialog').textContent.includes('You leave it for someone'));
assert(!document.querySelector('.result-gains'));assert(document.querySelector('.result-modal .result-stat-panel').textContent.includes('Mood'));
assert(document.querySelector('.result-illustration').src.includes('event-coin-leave'));ok();

// All travel modes display every minute at their cadence, preserve partial progress,
// pause while hidden, cross midnight and restore the x1 clock after arrival.
for(const mode of ['walk','transit','fare-dodge']) {
 setup({day:2,minutes:1438},{'street-life-trip-v1':{destinationId:'station',mode,total:9,remaining:9}});
 assert.equal(document.querySelector('.travel-elapsed').textContent,'01m', 'counter starts at 01 before the first tick');
 const firstTick=250;
 advance(firstTick-1);assert.equal(read('street-life-trip-v1').remaining,9);assert.equal(read(stateKey).minutes,1438);
 advance(1);assert.equal(read('street-life-trip-v1').remaining,8);assert.equal(document.querySelector('.travel-elapsed').textContent,'01m');
 for(let elapsed=2;elapsed<=4;elapsed++){advanceTravelMinutes(1);if(screen.queryByRole('dialog',{name:'Rain on the street'}))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));assert.equal(document.querySelector('.travel-elapsed').textContent,`${String(elapsed).padStart(2,'0')}m`)}
 assert.equal(read(stateKey).day,3);assert.equal(read(stateKey).minutes,2);
 const pausedTrip=read('street-life-trip-v1'),pausedGame=read(stateKey);
 Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});advance(1000);
 assert.deepEqual(read('street-life-trip-v1'),pausedTrip);assert.deepEqual(read(stateKey),pausedGame);
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 cleanup();render(React.createElement(App));assert.equal(document.querySelector('.travel-elapsed').textContent,'04m');
 advanceTravelMinutes(1);assert.equal(document.querySelector('.travel-elapsed').textContent,'05m');
 advanceTravelMinutes(3);advance(249);assert.equal(read('street-life-trip-v1').remaining,1);assert.equal(read(stateKey).locationId,'street');
 advance(1);assert.equal(read(stateKey).locationId,'station');assert(!localStorage.getItem('street-life-trip-v1'));
 const arrived=read(stateKey);advance(1000);assert.deepEqual(read(stateKey),arrived);ok();
 advance(999);assert.deepEqual(read(stateKey),arrived);advance(1);assert.equal(read(stateKey).minutes,arrived.minutes+1);
}

// The nearby shop takes the same 5–15 minutes in each mode, including bus waits.
for(const mode of ['walk','transit','fare-dodge']) {
 setup({minutes:600},{[invKey]:{transitCard:false}});click('Map');click('Small Shop');
 const options=document.querySelectorAll('.travel-option');assert.equal(options.length,3);for(const option of options)assert(option.textContent.includes('≈5–15m'));
 if(mode==='fare-dodge'){click(/Ride without ticket/);click('Roll D20');click('Continue');ok();}else click(mode==='walk'?/^Walk/:/Public transport/);
 assert.equal(read('street-life-trip-v1').total,15);const original=read('street-life-trip-v1');cleanup();render(React.createElement(App));assert.deepEqual(read('street-life-trip-v1'),original);
 advanceTravelMinutes(15);assert.equal(read(stateKey).locationId,'shop');assert.equal(read(stateKey).minutes,615);ok();
}
// Short walks retain ×4 travel and outdoor rain costs. No label sequence can
// delay arrival; reloading restores the text from saved progress.
setup({day:2,minutes:600,wetness:20},{'street-life-trip-v1':{destinationId:'shop',mode:'walk',total:5,remaining:5},'street-life-rain-response-v1':{episode:'weather:2',locationId:'street',sheltered:false}});
for(let minute=0;minute<5;minute++) {
 assert.equal(document.querySelector('.travel-action-label').textContent,'Walking');
 cleanup();render(React.createElement(App));advance(250);assert.equal(read(stateKey).wetness,21+minute);
}
assert.equal(read(stateKey).locationId,'shop');assert.equal(read(stateKey).minutes,605);ok();
// Display text stays for at least two real seconds independently of the minute clock.
// Every minute still advances at ×4, pauses/reloads retain the displayed stage,
// and an incomplete final label never extends the route.
for(const total of [30,60,91,120]) {
 setup({minutes:600},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total,remaining:total}});
 let previous='',started=now;const journeyStarted=now,durations=[];
 for(let minute=0;minute<total;minute++) {
  const label=document.querySelector('.travel-action-label').textContent;
  if(label!==previous){if(previous){durations.push(now-started);assert(now-started>=2000);}started=now;previous=label;}
  assert.equal(!!document.querySelector('.travel-visual.walking.waiting'),label==='Red light');
  if(minute===42){cleanup();render(React.createElement(App));assert.equal(document.querySelector('.travel-action-label').textContent,label);}
  advance(249);assert.equal(read('street-life-trip-v1').remaining,total-minute);
  assert.equal(document.querySelector('.travel-action-label').textContent,label);
  advance(1);assert.equal(read(stateKey).minutes,601+minute);
 }
 assert(durations.some(ms=>ms>2000),'two seconds is a minimum, not a uniform label timer');assert.equal(now-journeyStarted,total*250);assert.equal(read(stateKey).locationId,'station');ok();
}
// Bus phase text follows elapsed time and resumes at the same stage after reload.
for(const mode of ['transit','fare-dodge']) {
 setup({minutes:600},{'street-life-trip-v1':{destinationId:'shop',mode,total:10,remaining:10}});
 assert.equal(document.querySelector('.travel-action-label').textContent,'To the stop');advance(2*250);
 assert.equal(document.querySelector('.travel-action-label').textContent,'Waiting');cleanup();render(React.createElement(App));assert.equal(document.querySelector('.travel-action-label').textContent,'Waiting');advance(5*250);
 assert.equal(document.querySelector('.travel-action-label').textContent,'On the bus');cleanup();render(React.createElement(App));assert.equal(document.querySelector('.travel-action-label').textContent,'On the bus');advance(2*250);assert.equal(document.querySelector('.travel-action-label').textContent,'Final walk');cleanup();render(React.createElement(App));assert.equal(document.querySelector('.travel-action-label').textContent,'Final walk');advance(250);assert.equal(read(stateKey).locationId,'shop');assert.equal(read(stateKey).minutes,610);ok();
}
// Bus stops are covered and the bus is dry: only the two walking legs wet
// clothes. Reloads preserve both phase and accumulated wetness in either mode.
for(const mode of ['transit','fare-dodge']) {
 setup({day:2,minutes:600,wetness:20},{'street-life-trip-v1':{destinationId:'shop',mode,total:10,remaining:10},'street-life-rain-response-v1':{episode:'weather:2',locationId:'street',sheltered:false}});
 advance(2*250);assert(Math.abs(read(stateKey).wetness-22)<1e-8);cleanup();render(React.createElement(App));
 advance(4*250);assert(Math.abs(read(stateKey).wetness-21.4)<1e-8);cleanup();render(React.createElement(App));
 advance(3*250);assert(Math.abs(read(stateKey).wetness-20.5)<1e-8);assert.equal(document.querySelector('.travel-action-label').textContent,'Final walk');
 advance(250);assert.equal(read(stateKey).locationId,'shop');assert(Math.abs(read(stateKey).wetness-21.5)<1e-8);ok();
}
// Rain starting at a covered stop does not interrupt waiting/riding, but the
// choice appears before stepping out into the rain for the final walking leg.
setup({day:1,minutes:1439,wetness:20},{'street-life-trip-v1':{destinationId:'shop',mode:'transit',total:10,remaining:8}});advance(250);assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));advance(6*250);assert(screen.getByRole('dialog',{name:'Rain on the street'}));const waitingRain=read(stateKey);advance(1000);assert.deepEqual(read(stateKey),waitingRain);click(/^Continue as I am/);advance(250);assert.equal(read(stateKey).locationId,'shop');ok();
// A paid trip resumes from remaining time with its original result snapshot.
setup({}, {[invKey]:{transitCard:false}});click(/Map$/);click(/^.*Station/);click("Go →");click(/Public transport/);advance(1000);const paid=read(stateKey).money,remaining=read('street-life-trip-v1').remaining;
cleanup();render(React.createElement(App));assert(document.querySelector('.travel-screen'));assert.equal(read(stateKey).money,paid);assert.equal(read('street-life-trip-v1').remaining,remaining);
assert(screen.getByRole('dialog',{name:'Time on the way'}).contains(document.querySelector('.travel-bus')));assert(document.querySelector('.map-surface[inert] .district-map'));
advance(remaining*250);assert.equal(read(stateKey).locationId,'station');assert(!localStorage.getItem('street-life-trip-v1'));assert(screen.getByRole('dialog').textContent.includes('−4.4 zł'));
assert(!document.querySelector('.travel-overlay'));assert(!document.querySelector('.map-surface'));assert.equal(localStorage.getItem('street-life-screen'),'location');ok();assert.equal(document.body.style.overflow,'');

// A valid transit card or an unexpired free-transit grant removes fare
// dodging and allows normal public transport without spending money.
for(const extra of [{[invKey]:{transitCard:true}}, {[invKey]:{transitCard:false},'street-life-effects-v1':[{id:'free-transit',expiresAt:500}]}]) {
 setup({money:0},extra);click(/Map$/);click(/^.*Station/);click("Go →");
 assert(!screen.queryByRole('button',{name:/Ride without/}));const transport=screen.getByRole('button',{name:/Public transport/});assert(!transport.disabled);assert(transport.textContent.includes('FREE'));
 click(/Public transport/);assert.equal(read(stateKey).money,0);assert.equal(read('street-life-trip-v1').mode,'transit');assert(!document.querySelector('.dice-overlay'));
}
setup({locationId:'shop'}, {[invKey]:{transitCard:false},'street-life-effects-v1':[{id:'free-transit',expiresAt:481}]});click(/Map$/);click(/^.*Station/);click("Go →");
assert(!screen.queryByRole('button',{name:/Ride without/}));advance(1000);assert(screen.getByRole('button',{name:/Ride without/}));assert(screen.getByRole('button',{name:/Public transport/}).textContent.includes('4.40 zł'));
click(/Public transport/);assert.equal(read(stateKey).money,95.6);
setup({money:0},{[invKey]:{transitCard:false},'street-life-effects-v1':[{id:'free-transit',expiresAt:479}]});click(/Map$/);click(/^.*Station/);click("Go →");
assert(screen.getByRole('button',{name:/Public transport/}).disabled);assert(screen.getByRole('button',{name:/Ride without/}));

// Closed shops retain the catalogue, block transactions, and unlock at opening.
setup({locationId:'shop',minutes:419},{[invKey]:{water:0,bottles:2}});
assert(screen.getByRole('status').textContent.includes('Closed'));
assert(screen.getByRole('status').textContent.includes('Opens at 07:00'));
assert.equal(document.querySelectorAll('.supply-card').length,9);
assert(document.querySelector('.closed-content-body').hasAttribute('inert'));
const closedMoney=read(stateKey).money, closedWater=read(invKey).water;
for(const control of document.querySelectorAll('.shop button')) { assert(control.disabled); fireEvent.click(control); }
assert.equal(read(stateKey).money,closedMoney); assert.equal(read(invKey).water,closedWater); assert.equal(read(invKey).bottles,2);
advance(1000); assert(!document.querySelector('.closed-content-notice'));
assert(!screen.getByRole('button',{name:'Buy Water for 3.00 zł'}).disabled);
setup({locationId:'support',minutes:420});assert(screen.getByRole('status').textContent.includes('Opens at 08:00'));

// Three zloty buys 1.5 L of water: exactly three drinks of 0.5 L.
setup({locationId:'shop',thirst:0},{[invKey]:{water:0}});
assert(!screen.queryByText(/1.5 L|0.5 L/));assert(screen.getByText('Water'));assert(screen.getByText('3 portions'));assert(!screen.queryByText('💧💧💧'));click('Buy Water for 3.00 zł');
assert.equal(read(stateKey).money,97);assert.equal(read(invKey).water,3);assert(screen.getByRole('dialog').textContent.includes('Water ×3'));assert(screen.getByRole('dialog').textContent.includes('+3'));ok();click(/Inventory$/);
assert(screen.getByRole('button',{name:/Water ×3.*tap to drink/}));assert(!document.querySelector('.water-portions'));
for(const [remaining,thirst] of [[2,38],[1,76],[0,100]]) {
 click(/Water.*tap to drink/);assert.equal(read(invKey).water,remaining);assert.equal(read(stateKey).thirst,thirst);assert(screen.getByRole('dialog').textContent.includes('You drank water'));ok();
 if(remaining>0){assert(screen.getByRole('button',{name:new RegExp(`Water ×${remaining}.*tap to drink`)}));cleanup();render(React.createElement(App));assert.equal(read(invKey).water,remaining);}
}
assert(!screen.queryByRole('button',{name:/Water.*tap to drink/}));
// A purchase fits only if all three portions fit in the backpack.
setup({locationId:'shop'},{[invKey]:{water:1,food:4,medicines:24}});assert(!screen.getByRole('button',{name:'Buy Water for 3.00 zł'}).disabled);click('Buy Water for 3.00 zł');assert.equal(read(invKey).water,4);assert.equal(read(stateKey).money,97);
setup({locationId:'shop'},{[invKey]:{water:2,food:4,medicines:24}});const fullPurchase=screen.getByRole('button',{name:'Buy Water for 3.00 zł'});assert(fullPurchase.disabled);fireEvent.click(fullPurchase);assert.equal(read(invKey).water,2);assert.equal(read(stateKey).money,100);
// Stealing the same 1.5 L item also adds all three servings.
setup({locationId:'shop'},{[invKey]:{water:0}});fireEvent.click(screen.getAllByRole('button',{name:'STEAL',exact:true})[0]);click('Roll D20');click('Continue');assert.equal(read(invKey).water,3);assert.equal(read(stateKey).money,100);

// New supplies migrate old saves, persist, and report actual gains/uses.
// Discard is separate from use, pauses time, and removes only the selected slot.
setup({thirst:20},{[invKey]:{water:9,food:0,medicines:0}});click(/Inventory$/);
assert.equal(document.querySelectorAll('.backpack-grid .inventory-discard').length,3);assert(!document.querySelector('.essentials-grid .inventory-discard'));assert(!document.querySelector('.inventory-slot button button'));
const discardGame=read(stateKey),discardInventory=read(invKey);screen.getByRole('button',{name:'Discard Water ×1'}).focus();click('Discard Water ×1');
assert(screen.getByRole('dialog',{name:'Discard Water ×1?'}));assert.equal(document.activeElement.textContent,'Cancel');fireEvent.keyDown(document,{key:'Tab'});assert.equal(document.activeElement.textContent,'Discard all');fireEvent.keyDown(document,{key:'Tab'});assert.equal(document.activeElement.textContent,'Cancel');assert(document.querySelector('.game-background').hasAttribute('inert'));assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
advance(5000);assert.deepEqual(read(stateKey),discardGame);assert.deepEqual(read(invKey),discardInventory);assert.equal(document.body.style.overflow,'hidden');click('Cancel');assert.equal(read(invKey).water,9);assert.equal(document.body.style.overflow,'');assert.equal(document.activeElement.getAttribute('aria-label'),'Discard Water ×1');
click('Discard Water ×1');fireEvent.keyDown(document,{key:'Escape'});assert(!screen.queryByRole('dialog'));assert.equal(read(invKey).water,9);
click('Discard Water ×1');fireEvent.click(document.querySelector('.phone-overlay.result-overlay'));assert(!screen.queryByRole('dialog'));assert.equal(read(invKey).water,9);
click('Discard Water ×1');click('Discard all');assert.equal(read(invKey).water,8);assert.deepEqual(read(stateKey),discardGame);assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,2);assert(!screen.queryByRole('dialog'));
cleanup();render(React.createElement(App));assert.equal(read(invKey).water,8);fireEvent.click(screen.getAllByRole('button',{name:'Discard Water ×4'})[0]);click('Discard all');assert.equal(read(invKey).water,4);assert.deepEqual(read(stateKey),discardGame);
// Every slot type can be removed, including non-usable gel and capped wipes.
for(const [id,name,quantity,freshness] of [['water','Water',4],['food','Food',4,'foodFreshness'],['bread','Bread roll',4,'breadFreshness'],['cannedFood','Canned food',4],['readyMeal','Ready meal',4,'readyMealFreshness'],['wipes','Wet wipes',5],['bottles','Bottles & cans',8],['cigarettes','Cigarettes',20],['medicines','Medicine',4],['showerGel','3-in-1 shower gel',20]]) {
 setup({hygiene:60},{[invKey]:{water:0,food:0,medicines:0,[id]:quantity,...(freshness?{[freshness]:20}:{})}});click(/Inventory$/);const beforeDiscard=read(stateKey);click(`Discard ${name} ×${quantity}`);click('Discard all');assert.equal(read(invKey)[id],0);if(freshness)assert.equal(read(invKey)[freshness],100);assert.deepEqual(read(stateKey),beforeDiscard);assert(screen.getByText('Your backpack is empty.'));assert(!document.querySelector('.inventory-discard'));cleanup();render(React.createElement(App));assert.equal(read(invKey)[id],0);
}
// Reloading an unconfirmed dialog keeps the item; confirmation opens no second modal.
setup({}, {[invKey]:{water:1}});click(/Inventory$/);click('Discard Water ×1');cleanup();render(React.createElement(App));assert.equal(read(invKey).water,1);assert(!screen.queryByRole('dialog'));
setup({}, {[invKey]:{food:5,foodFreshness:37}});click(/Inventory$/);click('Discard Food ×1');click('Discard all');assert.equal(read(invKey).food,4);assert.equal(read(invKey).foodFreshness,37);

setup({locationId:'shop',hunger:20},{[invKey]:{water:2,food:0}});
assert.equal(read(invKey).water,2);for(const key of ['bread','cannedFood','readyMeal','wipes'])assert.equal(read(invKey)[key],0);
click('Buy Bread roll for 1.00 zł');assert.equal(read(stateKey).money,99);assert.equal(read(invKey).bread,1);assert(screen.getByRole('dialog').textContent.includes('Bread rolls'));ok();click(/Inventory$/);
click(/Bread roll.*tap to eat/);assert.equal(read(invKey).bread,0);assert.equal(read(invKey).breadFreshness,100);assert(screen.getByRole('dialog').textContent.includes('+12'));ok();
setup({locationId:'shop',hunger:20},{[invKey]:{cannedFood:0}});click('Buy Canned food for 10.00 zł');assert.equal(read(stateKey).money,90);assert.equal(read(invKey).cannedFood,1);ok();cleanup();render(React.createElement(App));assert.equal(read(invKey).cannedFood,1);click(/Inventory$/);click(/Canned food.*tap to eat/);assert.equal(read(invKey).cannedFood,0);assert(screen.getByRole('dialog').textContent.includes('+32'));ok();
setup({locationId:'shop',hygiene:55},{[invKey]:{wipes:0}});click('Buy Wet wipes for 5.00 zł');assert.equal(read(stateKey).money,95);assert.equal(read(invKey).wipes,5);assert(screen.getByRole('dialog').textContent.includes('+5'));ok();click(/Inventory$/);const hygieneBefore=read(stateKey).hygiene;click(/Wet wipes.*tap to clean/);assert.equal(read(invKey).wipes,4);assert.equal(read(stateKey).hygiene,60);assert(60-hygieneBefore<10);ok();const cappedWipes=screen.getByRole('button',{name:/Wet wipes.*find a shower/});assert(cappedWipes.disabled);fireEvent.click(cappedWipes);assert.equal(read(invKey).wipes,4);cleanup();render(React.createElement(App));assert.equal(read(invKey).wipes,4);
setup({hygiene:20},{[invKey]:{wipes:1}});click(/Inventory$/);click(/Wet wipes.*tap to clean/);assert.equal(read(stateKey).hygiene,30);assert.equal(read(invKey).wipes,0);ok();assert(!screen.queryByRole('button',{name:/^Wet wipes/}));
// Ready meals persist, consume one container, age separately, and respect the Food cap.
setup({locationId:'shop',hunger:20},{[invKey]:{food:0}});click('Buy Ready meal for 12.00 zł');assert.equal(read(stateKey).money,88);assert.equal(read(invKey).readyMeal,1);assert(screen.getByRole('dialog').textContent.includes('Ready meals'));ok();cleanup();render(React.createElement(App));assert.equal(read(invKey).readyMeal,1);click(/Inventory$/);assert(screen.getByRole('button',{name:/Ready meal.*tap to eat/}).textContent.includes('Food+++'));click(/Ready meal.*tap to eat/);assert.equal(read(invKey).readyMeal,0);assert.equal(read(invKey).readyMealFreshness,100);assert(screen.getByRole('dialog').textContent.includes('+48'));ok();
for(const [freshness,hunger,gain] of [[100,20,48],[40,20,34],[0,20,16],[100,90,10]]) {
 setup({hunger},{[invKey]:{readyMeal:1,readyMealFreshness:freshness}});Math.random=()=>0;click(/Inventory$/);click(/Ready meal.*tap to eat/);if(freshness<=50)click(freshness>20?'Stale ×1':'Spoiled ×1');assert.equal(read(stateKey).hunger,hunger+gain);assert.equal(read(stateKey).health,82);assert.equal(read(invKey).readyMeal,0);
}
setup({hunger:20,energy:20},{[invKey]:{readyMeal:1,readyMealFreshness:100}});beginSleep(/Lie down here\? I’m not sure… But I could try./,8);advance(48000);ok();assert(Math.abs(read(invKey).readyMealFreshness-(100-100/2880*480))<1e-8);
// Bread ages separately; sealed canned food survives the same time advance.
setup({hunger:20,energy:20},{[invKey]:{bread:2,breadFreshness:100,cannedFood:1}});beginSleep(/Lie down here\? I’m not sure… But I could try./,8);advance(48000);ok();assert(Math.abs(read(invKey).breadFreshness-(100-100/1440*480))<1e-8);assert.equal(read(invKey).cannedFood,1);
for(const [freshness,gain] of [[100,12],[40,8],[0,4]]) {
 setup({hunger:20,mood:28},{[invKey]:{bread:1,breadFreshness:freshness}});Math.random=()=>0;click(/Inventory$/);click(/Bread roll.*tap to eat/);if(freshness<=50)click(freshness>20?'Stale ×1':'Spoiled ×1');assert.equal(read(stateKey).hunger,20+gain);assert.equal(read(stateKey).health,82);assert.equal(read(stateKey).mood,28);assert.equal(read(invKey).breadFreshness,100);
}
// New items occupy backpack slots, for both purchase and theft.
for(const [name,price,key,quantity] of [['Bread roll','1.00','bread',1],['Canned food','10.00','cannedFood',1],['Ready meal','12.00','readyMeal',1],['Wet wipes','5.00','wipes',5]]) {
 setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:24}});const full=screen.getByRole('button',{name:`Buy ${name} for ${price} zł`});assert(full.disabled);assert(screen.getByTitle(`Steal ${name}`).disabled);fireEvent.click(full);assert.equal(read(invKey)[key],0);assert.equal(read(stateKey).money,100);
 setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:20}});assert(!screen.getByRole('button',{name:`Buy ${name} for ${price} zł`}).disabled);fireEvent.click(screen.getByTitle(`Steal ${name}`));click('Roll D20');click('Continue');assert.equal(read(invKey)[key],quantity);assert.equal(read(stateKey).money,100);assert(screen.getByRole('dialog').textContent.includes(`+${quantity}`));
}
// Gel is twenty shower uses per bottle; older inventories acquire no free gel.
setup({locationId:'shop'},{[invKey]:{water:2}});assert.equal(read(invKey).showerGel,0);click('Buy 3-in-1 shower gel for 10.00 zł');assert.equal(read(stateKey).money,90);assert.equal(read(invKey).showerGel,20);assert(screen.getByRole('dialog').textContent.includes('+20'));ok();click(/Inventory$/);assert(screen.getByText('3-in-1 shower gel').closest('.backpack-grid'));assert(!document.querySelector('.essentials-grid').textContent.includes('3-in-1 shower gel'));assert(!screen.queryByRole('button',{name:/^3-in-1 shower gel/}));cleanup();render(React.createElement(App));assert.equal(read(invKey).showerGel,20);
setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:24}});assert(screen.getByRole('button',{name:'Buy 3-in-1 shower gel for 10.00 zł'}).disabled);assert(screen.getByTitle('Steal 3-in-1 shower gel').disabled);
setup({locationId:'shop'},{[invKey]:{showerGel:0}});fireEvent.click(screen.getByTitle('Steal 3-in-1 shower gel'));click('Roll D20');click('Continue');assert.equal(read(invKey).showerGel,20);assert.equal(read(stateKey).money,100);
setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:20,showerGel:0}});click('Buy 3-in-1 shower gel for 10.00 zł');assert.equal(read(invKey).showerGel,20);ok();assert(screen.getByRole('button',{name:'Buy 3-in-1 shower gel for 10.00 zł'}).disabled);assert.equal(read(stateKey).money,90);
// Both real showers use one gel only on success. Water-only repeats cannot exceed 70.
for(const [locationId,minutes,buttonName,duration] of [['daycenter',480,/Take a shower/,40],['shelter',1140,/Ask for a shower/,35]]) {
 const extra={[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}};
 setup({locationId,minutes,hygiene:55},{...extra,[invKey]:{showerGel:0}});Math.random=()=>.85;click(buttonName);assert.equal(read(stateKey).hygiene,70);assert.equal(read(invKey).showerGel,0);assert.equal(read(stateKey).minutes,minutes+duration);assert(screen.getByRole('dialog').textContent.includes('water only'));ok();click(buttonName);assert.equal(read(stateKey).hygiene,70);
 setup({locationId,minutes,hygiene:55},{...extra,[invKey]:{showerGel:2}});Math.random=()=>.85;assert(screen.getByRole('button',{name:buttonName}).textContent.includes('max 100'));click(buttonName);assert.equal(read(stateKey).hygiene,100);assert.equal(read(invKey).showerGel,1);assert.equal(read(stateKey).minutes,minutes+duration);assert(!screen.getByRole('dialog').textContent.includes('gel uses'));assert(!screen.getByRole('dialog').textContent.includes('−1'));assert(screen.getByRole('dialog').textContent.includes('Hygiene'));ok();cleanup();render(React.createElement(App));assert.equal(read(invKey).showerGel,1);
 setup({locationId,minutes,hygiene:90},{...extra,[invKey]:{showerGel:0}});Math.random=()=>.85;click(buttonName);assert(read(stateKey).hygiene>89);assert(read(stateKey).hygiene<=90);
}
// From a dirty baseline, gel gives a larger gain, rather than changing only the cap.
setup({locationId:'daycenter',hygiene:10},{[invKey]:{showerGel:1}});Math.random=()=>.85;click(/Take a shower/);assert(read(stateKey).hygiene>84 && read(stateKey).hygiene<85);assert.equal(read(invKey).showerGel,0);
setup({locationId:'daycenter',hygiene:55},{[invKey]:{showerGel:2}});Math.random=()=>.99;click(/Take a shower/);assert.equal(read(invKey).showerGel,2);assert.equal(read(stateKey).minutes,495);assert(read(stateKey).hygiene<55);assert(screen.getByRole('dialog').textContent.includes('full right now'));
setup({locationId:'shelter',minutes:1320},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7},[invKey]:{showerGel:2}});const closedShower=screen.getByRole('button',{name:/Ask for a shower/});assert(closedShower.disabled);fireEvent.click(closedShower);assert.equal(read(invKey).showerGel,2);

// Hot meal is temporarily hidden from the shop catalogue.
setup({locationId:'shop',money:8,hunger:20});assert.equal(screen.queryByRole('button',{name:/Hot meal/}),null);

// Successful risky meals preserve nutrition without guaranteed health damage.
// The food suite checks every poisoning outcome and its probabilities.
for(const [freshness,gain,damage,mood] of [[100,28,0,2],[40,20,0,0],[0,10,0,0]]) {
  setup({hunger:20,mood:28},{[invKey]:{food:1,foodFreshness:freshness}});Math.random=()=>0;click(/Inventory$/);click(/Food.*tap to eat/);if(freshness<=50)click(freshness>20?'Stale ×1':'Spoiled ×1');
  assert.equal(read(stateKey).hunger,20+gain);assert.equal(read(stateKey).health,82-damage);assert.equal(read(stateKey).mood,28+mood);assert.equal(read(invKey).foodFreshness,100);
}


// Free shelter water tops up the backpack to four portions, respecting access
// and slots. Existing stock above four is preserved without spending time.
for(const locationId of ['shelter','residential-shelter']) {
 for(const water of [0,1,3,4,7]) {
  setup({day:2,locationId,minutes:420},{[invKey]:{water},[lifeKey]:{housing:locationId==='shelter'?'Night shelter':'Schronisko',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1}});
  const before=read(stateKey),button=screen.getByRole('button',{name:/Refill water/});
  assert.equal(button.disabled,water>=4);fireEvent.click(button);
  assert.equal(read(invKey).water,Math.max(4,water));assert.equal(read(stateKey).money,before.money);
  if(water<4){assert.equal(read(stateKey).minutes,425);assert(read(stateKey).thirst<=before.thirst);assert(screen.getByRole('dialog').textContent.includes(`+${4-water}`));ok();assert(screen.getByRole('button',{name:/Refill water/}).disabled);cleanup();render(React.createElement(App));assert.equal(read(invKey).water,4);}
  else {assert.deepEqual(read(stateKey),before);assert(!screen.queryByRole('dialog'));}
 }
 // Seven medicine slots and one food slot leave no room for a new water stack.
 setup({day:2,locationId,minutes:420},{[invKey]:{water:0,food:4,medicines:28},[lifeKey]:{shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1}});
 const full=screen.getByRole('button',{name:/Refill water/});assert(full.disabled);const before=read(stateKey);fireEvent.click(full);assert.equal(read(invKey).water,0);assert.deepEqual(read(stateKey),before);
 // Topping up a partially filled water stack needs no extra slot.
 setup({day:2,locationId,minutes:420},{[invKey]:{water:1,food:4,medicines:24},[lifeKey]:{shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1}});
 assert(!screen.getByRole('button',{name:/Refill water/}).disabled);click(/Refill water/);assert.equal(read(invKey).water,4);ok();
}
for(const [minutes,reserved] of [[420,false],[900,true],[1380,true]]) {
 setup({day:2,locationId:'shelter',minutes},{[invKey]:{water:1},[lifeKey]:reserved?{shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1}:{} });
 const refill=document.querySelector('[data-choice="shelter-refill-water"]');const before=read(stateKey);if(reserved){assert(refill.disabled);fireEvent.click(refill);}else assert.equal(refill,null);assert.deepEqual(read(stateKey),before);assert.equal(read(invKey).water,1);
}

// Worker access follows appointment hours, not overnight accommodation hours.
const booking={housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterAuditDay:1,shelterLastStayDay:1};
setup({locationId:'shelter',minutes:1080},{[lifeKey]:booking});const worker=screen.getByRole('button',{name:/Talk to shelter social worker/});assert(worker.disabled);fireEvent.click(worker);assert.equal(read(stateKey).minutes,1080);
setup({day:2,locationId:'shelter',minutes:1020},{[lifeKey]:booking});assert(!screen.getByRole('button',{name:/Talk to shelter social worker/}).disabled);click(/Talk to shelter social worker/);assert.equal(read(stateKey).minutes,1020);advance(3000);assert.equal(read(stateKey).minutes,1020);
click(/I still cannot afford housing/);click(/I am looking for work/);click(/Go to the Job Centre/);assert.equal(read(stateKey).minutes,1050);assert.equal(read(lifeKey).shelterUntilDay,31);assert(screen.getByRole('dialog').textContent.includes('30 min'));

console.log('PASS: location, travel, coins, food and inventory scenarios.');
// Full backpack rejects new stacks; a partial stack still accepts food.
setup({locationId:'station',minutes:1140},{'street-life-encounters-v1':{seen:ambientSceneIds,lastAt:null,pendingId:null},[invKey]:{food:4,water:4,medicines:24,cigarettes:0,bottles:0,foodFreshness:100}});Math.random=()=>.01;click(/Sit and recover/);ok();click('Accept');assert.equal(read(invKey).food,4);assert(screen.getByRole('dialog').textContent.includes('no backpack room'));
setup({locationId:'station',minutes:1140},{'street-life-encounters-v1':{seen:ambientSceneIds,lastAt:null,pendingId:null},[invKey]:{food:3,water:4,medicines:24,cigarettes:0,bottles:0,foodFreshness:100}});Math.random=()=>.01;click(/Sit and recover/);ok();click('Accept');assert.equal(read(invKey).food,4);

// Daily begging allowance survives reload and resets only on the next game day.
setup({money:0});for(let i=0;i<3;i++){click(/Ask someone for change\? It’s hard, but I could try./);ok();}assert(!screen.queryByRole('button',{name:/Ask someone for change\? It’s hard, but I could try./}));
cleanup();render(React.createElement(App));assert(!screen.queryByRole('button',{name:/Ask someone for change\? It’s hard, but I could try./}));
setup({day:2,money:0},{'street-life-begging-v1':{day:1,attempts:3}});assert(!screen.getByRole('button',{name:/Ask someone for change\? It’s hard, but I could try./}).disabled);click(/Ask someone for change\? It’s hard, but I could try./);assert.deepEqual(read('street-life-begging-v1'),{day:2,attempts:1});

// Unregistered visitors only have registration, and must finish the full queue.
const vacancyKey=(slots)=>({shelterVacancyDay:1,shelterVacancies:slots});
setup({locationId:'shelter',minutes:1080},{[lifeKey]:vacancyKey(2)});
assert.equal(document.querySelectorAll('.actions .action').length,1);assert(!screen.queryByRole('button',{name:/shower/i}));assert(!document.querySelector('.storage-panel'));assert(!screen.queryByLabelText('Sleep duration'));
click(/Join registration queue/);assert(screen.getByRole('dialog',{name:'Shelter registration queue'}));assert(!read(lifeKey).shelterUntilDay);
advance(19000);assert.equal(read(stateKey).minutes,1099);assert(!read(lifeKey).shelterUntilDay);assert.equal(read('street-life-shelter-queue-v1').remaining,1);
advance(1000);assert.equal(read(stateKey).minutes,1100);assert.equal(read(lifeKey).shelterUntilDay,7);assert.equal(read(lifeKey).shelterLastStayDay,1);assert(!localStorage.getItem('street-life-shelter-queue-v1'));assert(screen.getByRole('dialog').textContent.includes('20 min'));ok();assert(screen.getByRole('button',{name:/Ask for a shower/}));assert(document.querySelector('.storage-panel'));assert(screen.getByRole('button',{name:/Use your reserved bed/}));

assert.equal(read(stateKey).mood,53,'registration applies its +3 under the new housing ceiling');
click(/^Status$/);assert.equal(document.querySelector('[data-stat="Mood"] .bar-cap-marker').style.left,'60%');

// No vacancies still costs twenty minutes; failed attempts cannot reroll today.
setup({locationId:'shelter',minutes:1140},{[lifeKey]:vacancyKey(0)});click(/Join registration queue/);advance(20000);
assert(!read(lifeKey).shelterUntilDay);assert(screen.getByRole('dialog').textContent.includes('no free places'));assert.equal(read(stateKey).minutes,1160);ok();assert(screen.getByRole('button',{name:/Join registration queue/}).disabled);
cleanup();render(React.createElement(App));assert.equal(read(lifeKey).shelterVacancies,0);assert(screen.getByRole('button',{name:/Join registration queue/}).disabled);

// Queue order reduces available places at later arrival times.
for(const [slots,minute,accepted] of [[1,1020,true],[1,1080,false],[2,1080,true],[2,1110,false],[3,1110,true],[3,1155,false]]) {
 setup({locationId:'shelter',minutes:minute},{[lifeKey]:vacancyKey(slots)});click(/Join registration queue/);advance(Math.max(20,1100-minute)*1000);assert.equal(!!read(lifeKey).shelterUntilDay,accepted);
}

// A reload keeps queue position, today's vacancies and remaining wait.
setup({locationId:'shelter',minutes:1080},{[lifeKey]:vacancyKey(2)});click(/Join registration queue/);advance(7000);const queued=read('street-life-shelter-queue-v1');
cleanup();Math.random=()=>0;render(React.createElement(App));assert.deepEqual(read('street-life-shelter-queue-v1'),queued);assert.equal(read(lifeKey).shelterVacancies,2);advance(12000);assert(!read(lifeKey).shelterUntilDay);advance(1000);assert.equal(read(lifeKey).shelterUntilDay,7);

// Tomorrow permits a new attempt; before registration hours the queue is closed.
setup({day:2,locationId:'shelter',minutes:1140},{[lifeKey]:{shelterRegistrationAttemptDay:1,shelterVacancyDay:2,shelterVacancies:1}});assert(!screen.getByRole('button',{name:/Join registration queue/}).disabled);
setup({locationId:'shelter',minutes:479});assert(screen.getByRole('button',{name:/Join registration queue/,hidden:true}).disabled);
setup({locationId:'shelter',minutes:1320});assert(screen.getByRole('button',{name:/Join registration queue/}).disabled);

// Arrival is remembered before opening, including idle time and reloads.
const arrivalKey='street-life-shelter-arrival-v1';
setup({locationId:'shelter',minutes:1020},{[lifeKey]:vacancyKey(1)});
assert.equal(read(arrivalKey).minute,1020);assert(!screen.getByRole('button',{name:/Join registration queue/}).disabled);
advance(90000);assert.equal(read(stateKey).minutes,1110);assert.equal(read(arrivalKey).minute,1020);
cleanup();render(React.createElement(App));click(/Join registration queue/);assert.equal(read('street-life-shelter-queue-v1').peopleAhead,0);assert.equal(read('street-life-shelter-queue-v1').arrivalMinute,1020);advance(20000);assert.equal(read(lifeKey).shelterUntilDay,7);ok();

// An early queue cannot register before 18:20; long waits resume after reload.
setup({locationId:'shelter',minutes:1020,wetness:30},{[lifeKey]:vacancyKey(1)});click(/Join registration queue/);
assert.equal(read('street-life-shelter-queue-v1').total,80);assert(screen.getByRole('dialog').textContent.includes('Waiting outside'));
advance(59000);assert.equal(read(stateKey).minutes,1079);assert(!read(lifeKey).shelterUntilDay);
cleanup();render(React.createElement(App));assert.equal(read('street-life-shelter-queue-v1').remaining,21);
advance(1000);assert(screen.getByRole('dialog').textContent.includes('Waiting inside'));const indoorWetness=read(stateKey).wetness;
advance(19000);assert.equal(read(stateKey).minutes,1099);assert(!read(lifeKey).shelterUntilDay);assert(read(stateKey).wetness<indoorWetness);
advance(1000);assert.equal(read(lifeKey).shelterUntilDay,7);ok();

// Leaving loses arrival priority, while vacancies remain fixed for the day.
setup({locationId:'shelter',minutes:1020},{[lifeKey]:vacancyKey(1)});click(/Map$/);click('Street');click(/^Walk/);advance(20000);
assert.equal(read(stateKey).locationId,'street');assert(!read(arrivalKey));assert.equal(read(lifeKey).shelterVacancies,1);
setup({locationId:'shelter',minutes:1110},{[lifeKey]:vacancyKey(1),[arrivalKey]:{day:0,minute:1020}});assert.equal(read(arrivalKey).minute,1110);click(/Join registration queue/);assert.equal(read('street-life-shelter-queue-v1').peopleAhead,2);advance(20000);assert(!read(lifeKey).shelterUntilDay);ok();

// Actual travel records completion time; stale priority cannot survive a trip.
setup({day:2,locationId:'street',minutes:1109},{[lifeKey]:{shelterVacancyDay:2,shelterVacancies:3},[arrivalKey]:{day:2,minute:1020},'street-life-trip-v1':{destinationId:'shelter',mode:'walk',total:1,remaining:1}});
assert(!read(arrivalKey));advance(250);assert.equal(read(stateKey).locationId,'shelter');assert.equal(read(arrivalKey).minute,1110);ok();click(/Join registration queue/);assert.equal(read('street-life-shelter-queue-v1').peopleAhead,2);advance(20000);assert.equal(read(lifeKey).shelterUntilDay,8);ok();

// Queues saved by old builds keep their fixed position and remaining time.
const legacyQueue={...queued,joinedAt:1140,before:{...queued.before,game:{...queued.before.game,minutes:1140}}};delete legacyQueue.total;delete legacyQueue.arrivalMinute;
setup({locationId:'shelter',minutes:1147},{[lifeKey]:{...vacancyKey(2),shelterRegistrationAttemptDay:1},'street-life-shelter-queue-v1':legacyQueue});assert.equal(read('street-life-shelter-queue-v1').remaining,13);advance(13000);assert.equal(read(lifeKey).shelterUntilDay,7);ok();

// Time/weekday/daily limits disable services before a click and put them last.
function availableFirst(selector='.actions') {
 const buttons=[...document.querySelector(selector).querySelectorAll(':scope > button')];
 const firstDisabled=buttons.findIndex(button=>button.disabled);
 if(firstDisabled>=0)assert(buttons.slice(firstDisabled).every(button=>button.disabled));
}
const admitted={...booking,shelterLastStayDay:1};
setup({locationId:'shelter',minutes:1320},{[lifeKey]:admitted});
assert(screen.getByRole('button',{name:/Dinner/}).disabled);assert(screen.getByRole('button',{name:/Breakfast/}).disabled);assert(screen.getByRole('button',{name:/Ask for a shower/}).disabled);assert(!screen.getByRole('button',{name:/Use your reserved bed/}).disabled);availableFirst();
const at22=read(stateKey);fireEvent.click(screen.getByRole('button',{name:/Dinner/}));assert.deepEqual(read(stateKey),at22);
setup({locationId:'shelter',minutes:1229},{[lifeKey]:admitted});assert(!screen.getByRole('button',{name:/Dinner/}).disabled);advance(1000);assert(screen.getByRole('button',{name:/Dinner/}).disabled);availableFirst();
setup({locationId:'shelter',minutes:1150},{[lifeKey]:admitted});click(/Dinner/);ok();assert(screen.getByRole('button',{name:/Dinner/}).disabled);assert(screen.getByRole('button',{name:/Dinner/}).textContent.includes('already had dinner'));availableFirst();
setup({day:2,locationId:'shelter',minutes:390},{[lifeKey]:admitted});assert(!screen.getByRole('button',{name:/Breakfast/}).disabled);availableFirst();
setup({day:2,locationId:'shelter',minutes:420},{[lifeKey]:admitted});assert(screen.getByRole('button',{name:/Breakfast/}).disabled);availableFirst();
setup({day:4,locationId:'shelter',minutes:405},{[lifeKey]:{...booking,shelterLastStayDay:3}});assert(!screen.getByRole('button',{name:/Leave clothes for laundry/}).disabled);assert(screen.getByRole('button',{name:/Collect clean laundry/}).disabled);click(/Leave clothes for laundry/);ok();assert(screen.getByRole('button',{name:/Leave clothes for laundry/}).disabled);availableFirst();
setup({day:4,locationId:'shelter',minutes:1100},{[lifeKey]:{...booking,shelterLastStayDay:3,shelterLaundryDropDay:4}});assert(!screen.getByRole('button',{name:/Collect clean laundry/}).disabled);availableFirst();
setup({day:2,locationId:'shelter',minutes:990},{[lifeKey]:admitted});assert(!screen.getByRole('button',{name:/Talk to shelter social worker/}).disabled);availableFirst();
// Already-admitted players can sleep after quiet hours begin, including after midnight.
setup({locationId:'shelter',minutes:1380},{[lifeKey]:admitted});beginSleep(/Use your reserved bed/);assert(document.querySelector('.sleep-overlay'));
setup({day:2,locationId:'shelter',minutes:30},{[lifeKey]:admitted});assert(!screen.getByRole('button',{name:/Use your reserved bed/}).disabled);beginSleep(/Use your reserved bed/);click('Wake up (debug)');assert.equal(read(lifeKey).shelterLastStayDay,1);
// Old saves already inside are repaired even if no sleep was started that night.
for (const [minute,admission] of [[1319,true],[1321,false]]) {
 setup({locationId:'street',minutes:minute},{[lifeKey]:{...booking,shelterLastStayDay:0},'street-life-trip-v1':{destinationId:'shelter',mode:'walk',total:1,remaining:0}});
 assert.deepEqual(read(lifeKey).shelterEntry,{night:1,admitted:admission});ok();
 assert.equal(screen.getByRole('button',{name:/Use your reserved bed/}).disabled,!admission);
}
setup({day:2,locationId:'shelter',minutes:5},{[lifeKey]:{...booking,shelterLastStayDay:0}});assert(!screen.getByRole('button',{name:/Use your reserved bed/}).disabled);assert.equal(read(lifeKey).shelterLastStayDay,1);assert.equal(read(lifeKey).shelterMisses,0);
// Entering before 22:00 records attendance immediately; staying awake until
// midnight, switching screens and reloading never relocks the reserved bed.
setup({locationId:'shelter',minutes:1319},{[lifeKey]:{...booking,shelterLastStayDay:0}});
assert.deepEqual(read(lifeKey).shelterEntry,{night:1,admitted:true});advance(122000);
assert.equal(read(stateKey).day,2);assert.equal(read(stateKey).minutes,1);assert(!screen.getByRole('button',{name:/Use your reserved bed/}).disabled);assert.equal(read(lifeKey).shelterMisses,0);
cleanup();render(React.createElement(App));assert(!screen.getByRole('button',{name:/Use your reserved bed/}).disabled);beginSleep(/Use your reserved bed/);assert(document.querySelector('.sleep-overlay'));
// A refused late arrival remains outside across midnight and reload and counts
// as a missed night, even if yesterday's booking is still valid.
setup({day:2,locationId:'shelter',minutes:1439},{[lifeKey]:{...booking,shelterLastStayDay:1,shelterEntry:{night:2,admitted:false}}});
assert(screen.getByRole('button',{name:/Use your reserved bed/}).disabled);advance(1000);assert.equal(read(lifeKey).shelterMisses,1);assert(screen.getByRole('button',{name:/Use your reserved bed/}).disabled);
cleanup();render(React.createElement(App));assert(screen.getByRole('button',{name:/Use your reserved bed/}).disabled);
// The final booked night lasts until morning, rather than expiring at midnight.
setup({day:8,locationId:'shelter',minutes:5},{[lifeKey]:{...booking,shelterLastStayDay:7,shelterAuditDay:7,shelterEntry:{night:7,admitted:true}}});assert(!screen.getByRole('button',{name:/Use your reserved bed/}).disabled);
// Sorting also spans Street fragments and configured actions, plus support choices.
setup({}, {'street-life-mobile-service-until':'0','street-life-discovered-v1':['street','station','shop']});availableFirst();assert(!document.querySelector('[data-choice="phone-help"]').disabled);click('Phone');assert(screen.getByRole('button',{name:'Find Help',exact:true}).disabled);
setup({locationId:'support'},{[invKey]:{documents:false}});availableFirst('.support-grid');

// Morning reminder appears at 07:30, freezes the clock, and takes a full
// visible 30-minute checkout at x4; reload keeps progress and the booking survives.
const departureKey='street-life-shelter-departure-v1';
const checkoutBooking={...booking,shelterLastStayDay:1,shelterStrikes:0};
setup({day:2,locationId:'shelter',minutes:449},{[lifeKey]:checkoutBooking,'street-life-storage-v1':{documents:true,medicines:2}});
assert(!screen.queryByRole('dialog',{name:'Leave the night shelter'}));advance(1000);
assert.equal(read(stateKey).minutes,450);assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));
const reminderState=read(stateKey);advance(5000);assert.deepEqual(read(stateKey),reminderState);
click(/Leave the night shelter · 30 min/);assert(screen.getByRole('dialog',{name:'Leaving the night shelter'}));
advance(249);assert.equal(read(stateKey).minutes,450);
advance(1);assert.equal(read(stateKey).minutes,451);assert(screen.getByRole('dialog',{name:'Leaving the night shelter'}).textContent.includes('29 min remaining'));
advance(2500);assert.equal(read(stateKey).minutes,461);assert.equal(read(stateKey).locationId,'shelter');
const departureSaved=read(departureKey);cleanup();render(React.createElement(App));assert.deepEqual(read(departureKey),departureSaved);
Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});advance(4000);assert.equal(read(stateKey).minutes,461);
Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});advance(4500);assert.equal(read(stateKey).minutes,479);assert.equal(read(stateKey).locationId,'shelter');
advance(250);assert.equal(read(stateKey).minutes,480);assert.equal(read(stateKey).locationId,'street');
assert.equal(read(lifeKey).housing,'Street');assert.equal(read(lifeKey).shelterUntilDay,7);assert.equal(read(lifeKey).shelterStrikes,0);assert.equal(read(lifeKey).shelterCheckoutDay,2);
assert.equal(read('street-life-storage-v1').medicines,2);assert(!localStorage.getItem(departureKey));assert(screen.getByRole('dialog').textContent.includes('30 min'));assert(read(stateKey).thirst<reminderState.thirst);ok();
assert(!screen.queryByRole('dialog',{name:'Leave the night shelter'}));
assert(![...callbacks.values()].some(timer=>timer.delay===250),'the x4 clock stops after checkout');
assert([...callbacks.values()].some(timer=>timer.delay===1000),'the ordinary x1 clock is restored');
setup({day:2,locationId:'shelter',minutes:451},{[lifeKey]:{...checkoutBooking,shelterCheckoutDay:2}});assert(!screen.queryByRole('dialog',{name:'Leave the night shelter'}));
setup({day:3,locationId:'shelter',minutes:450},{[lifeKey]:{...checkoutBooking,shelterLastStayDay:2,shelterCheckoutDay:2}});assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));

// Exhaustion cannot interrupt checkout; once outside, its result comes first.
setup({day:2,locationId:'shelter',minutes:450,energy:.01},{[lifeKey]:checkoutBooking});click(/Leave the night shelter · 30 min/);advance(7250);
assert.equal(read(stateKey).energy,0);assert(!localStorage.getItem('street-life-sleep-v1'));assert.equal(read(stateKey).locationId,'shelter');advance(250);assert.equal(read(stateKey).locationId,'street');assert(screen.getByRole('dialog').textContent.includes('Shelter checkout'));

// Natural sleep, exhaustion, and a saved long sleep all wake by 07:30.
setup({day:2,locationId:'shelter',minutes:30,energy:20},{[lifeKey]:checkoutBooking});beginSleep(/Use your reserved bed/);
assert.equal(read('street-life-sleep-v1').total,420);advance(41000);assert.equal(read(stateKey).minutes,440);advance(1000);
assert.equal(read(stateKey).minutes,450);assert(!localStorage.getItem('street-life-sleep-v1'));assert(screen.getByRole('dialog').textContent.includes('You slept for 7 hours'));ok();assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));
setup({day:2,locationId:'shelter',minutes:449,energy:0},{[lifeKey]:checkoutBooking});assert.equal(read('street-life-sleep-v1').total,1);advance(1000);assert.equal(read(stateKey).minutes,450);ok();assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));
setup({day:2,locationId:'shelter',minutes:30},{[lifeKey]:checkoutBooking,'street-life-sleep-v1':{kind:'shelter',startAbsolute:1470,total:480,remaining:480,realStartedAt:now-60000,realWakeAt:now+60000}});
advance(1000);assert.equal(read(stateKey).minutes,450);ok();assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));
// Late saved guests are prompted, while other accommodations are unaffected.
setup({day:2,locationId:'shelter',minutes:490},{[lifeKey]:checkoutBooking});assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));
setup({day:2,locationId:'street',minutes:450});assert(!document.querySelector('.checkout-overlay'));
setup({day:2,locationId:'residential-shelter',minutes:450},{[lifeKey]:{housing:'Schronisko'}});assert(!document.querySelector('.checkout-overlay'));

// Sleep planning pauses the complete game state, shows next-day wake times,
// and does not consume time or start sleep until explicitly confirmed.
setup({minutes:1410,energy:.01});assert(!screen.queryByLabelText('Sleep duration'));click(/Lie down here\? I’m not sure… But I could try./);
assert(screen.getByRole('dialog',{name:'How long do you want to sleep?'}));assert.equal(document.querySelectorAll('.actions select').length,0);
const planState=read(stateKey),planInventory=read(invKey);advance(12000);
assert.deepEqual(read(stateKey),planState);assert.deepEqual(read(invKey),planInventory);assert(!localStorage.getItem('street-life-sleep-v1'));
chooseHours(6);
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 05:30'));
assert(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:/^8 h.*07:30/}));advance(3000);assert.deepEqual(read(stateKey),planState);
click('Cancel');assert(!screen.queryByRole('dialog'));assert.deepEqual(read(stateKey),planState);advance(1000);assert.equal(read(stateKey).minutes,1411,'cancelling sleep planning resumes the ordinary clock');
setup({minutes:1410});click(/Lie down here\? I’m not sure… But I could try./);chooseHours(2);click('Start sleeping');
assert.equal(read('street-life-sleep-v1').total,120);assert.equal(read('street-life-sleep-v1').startAbsolute,1410);assert(!document.querySelector('.sleep-choice-modal'));
advance(1000);assert.equal(read(stateKey).minutes,1420);

// Cancelling sleep preserves attendance already recorded at entrance. The shortened shelter
// duration shown in the chooser is exactly the duration that starts.
const notAdmitted={...booking,housing:'Street',shelterLastStayDay:0};
setup({day:2,locationId:'shelter',minutes:30,energy:20},{[lifeKey]:admitted});click(/Use your reserved bed/);
chooseHours(6);assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 06:30'));
chooseHours(8);
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 07:30'));assert(document.querySelector('.sleep-choice-modal').textContent.includes('Sleep time: 7h'));
click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,420);
setup({locationId:'shelter',minutes:1140},{[lifeKey]:notAdmitted});click(/Use your reserved bed/);advance(10000);click('Cancel');assert.equal(read(lifeKey).shelterLastStayDay,1);assert.equal(read(lifeKey).housing,'Street');assert.equal(read(stateKey).minutes,1140);
click(/Use your reserved bed/);fireEvent.keyDown(window,{key:'Escape'});assert(!screen.queryByRole('dialog'));assert.equal(read(lifeKey).shelterLastStayDay,1);
click(/Use your reserved bed/);click('Start sleeping');assert.equal(read(lifeKey).shelterLastStayDay,1);assert.equal(read(lifeKey).housing,'Night shelter');

// A quiet shelter night is one illustrated sleep result, not another event and
// result after it. Natural wake and debug wake grant the bonus exactly once.
for(const debug of [false,true]) {
 let ordinary;
 for(const quiet of [false,true]) {
  setup({day:2,locationId:'shelter',minutes:359,energy:30,mood:30},{
   'street-life-encounters-v1':{seen:quiet?[]:['quiet-night'],lastAt:null,pendingId:null},
   [lifeKey]:{housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1},
   'street-life-sleep-v1':{kind:'shelter',total:120,remaining:1,startAbsolute:1680,realStartedAt:Date.now()-11900}
  });
  Math.random=()=>quiet?0:.99;
  if(debug)click('Wake up (debug)');else advance(1000);
  assert.equal(screen.getAllByRole('dialog').length,1);assert(screen.getByRole('dialog',{name:'Sleep complete'}));
  assert(!document.querySelector('.event-overlay'));assert(!localStorage.getItem('street-life-sleep-v1'));
  const woke=read(stateKey);
  if(!quiet)ordinary=woke;
  else {
   assert(document.querySelector('.result-illustration').src.includes('event-quiet-shelter'));
   assert(screen.getByRole('dialog').textContent.includes('peaceful rest'));
   assert(Math.abs(woke.energy-ordinary.energy-5)<1e-8);assert(Math.abs(woke.mood-ordinary.mood-5)<1e-8);
   assert.equal(read('street-life-journal-history-v1').filter(entry=>entry.actionTitle==='Sleep complete').length,1);
  }
  advance(3000);assert.deepEqual(read(stateKey),woke,'reading the merged result pauses time and bonuses');
  ok();assert(!screen.queryByRole('dialog'));assert(!document.querySelector('.event-overlay'));Math.random=()=>.99;
  advance(1000);assert.equal(read(stateKey).minutes,361,'one confirmation resumes the game');
  const after=read(stateKey);cleanup();render(React.createElement(App));assert.deepEqual(read(stateKey),after);assert(!document.querySelector('.event-overlay'));
 }
}

// Station, street bench and Schronisko all use the same paused chooser.
setup({locationId:'station',minutes:1380});beginSleep(/Try to sleep/,2);assert.equal(read('street-life-sleep-v1').kind,'bench');assert.equal(read('street-life-sleep-v1').total,120);
setup({day:3,minutes:1380}, {'street-life-answers-v1':['morning','bed']});Math.random=()=>0;click(/Is there a bench nearby\? My legs could use a break./);ok();Math.random=()=>.99;click(/Could I sleep here\? What about my backpack…/);assert(screen.getByLabelText('Sleep duration'));click('Start sleeping');assert.equal(read('street-life-sleep-v1').kind,'bench');
setup({locationId:'residential-shelter',minutes:449});click(/Sleep safely/);chooseHours(2);assert(document.querySelector('.sleep-choice-preview').textContent.includes('09:29'));click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,120);

// Fatigue gates both short and long choices, including exact thresholds.
for(const [energy,allowed] of [[100,[2]],[75.01,[2]],[75,[2,4]],[50.01,[2,4]],[50,[4,6]],[25.01,[4,6]],[25,[6,8]],[1,[6,8]]]) {
 setup({energy,minutes:1380});click(/Lie down here\? I’m not sure… But I could try./);
 const group=screen.getByRole('group',{name:'Sleep duration'});const options=within(group).getAllByRole('button');assert.equal(options.length,4);
 const enabled=options.filter(button=>!button.disabled).map(button=>Number(button.getAttribute('aria-label').split(' ')[0]));assert.deepEqual(enabled,allowed);
 const selected=options.find(button=>button.getAttribute('aria-pressed')==='true');assert(allowed.includes(Number(selected.getAttribute('aria-label').split(' ')[0])));
 const disabled=options.find(button=>button.disabled);assert(disabled.title.includes(energy>50?'Not tired enough':'Too tired'));assert(disabled.querySelector('.sr-only').textContent.includes(disabled.title));
 fireEvent.click(disabled);assert.equal(group.querySelector('[aria-pressed="true"]'),selected);assert(!localStorage.getItem('street-life-sleep-v1'));
 chooseHours(allowed[0]);advance(3000);assert.equal(read(stateKey).minutes,1380);click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,allowed[0]*60);
}
setup({energy:0});assert.equal(read('street-life-sleep-v1').total,480);assert(!document.querySelector('.sleep-choice-modal'));

// Unified time gives identical results for large blocks and minute ticks,
// including effect expiry, weather change and crossing midnight.
require('esbuild').buildSync({entryPoints:['src/game.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',outfile:'regression-game.cjs'});
const {advanceTime,initialState,createInitialState,overallCondition,conditionBand,moodLimit,limitMood,HOUSING_MOOD_CAP,locations,travelTimeRange,destinationTravelTimeRange,randomTravelMinutes}=require('./regression-game.cjs');
for(const base of [1,33,40,45,65,...locations.flatMap(location=>[location.travelMinutes,Math.ceil(location.travelMinutes*.5)])]) {
 const {min,max}=travelTimeRange(base);assert.equal(min,Math.ceil(base*.95));assert.equal(max,Math.floor(base*1.2));
 assert.equal(randomTravelMinutes(base,()=>0),min);assert.equal(randomTravelMinutes(base,()=>.999999),max);
 for(let value=min;value<=max;value++)assert.equal(randomTravelMinutes(base,()=>(value-min+.5)/(max-min+1)),value);
 assert(min>=base*.95&&max<=base*1.2);
}
const nearbyShop=locations.find(place=>place.id==='shop');
for(const mode of ['walk','transit','fare-dodge']){const range=destinationTravelTimeRange(nearbyShop,mode);assert.deepEqual(range,{min:5,max:15});assert.equal(randomTravelMinutes(range,()=>0),5);assert.equal(randomTravelMinutes(range,()=>.999999),15);}
// One Mood and the same five faces in the header and Status.
assert.deepEqual([0,21,41,61,81].map(value=>conditionBand(value).level),['very-bad','bad','fair','ok','very-good']);
for(const [boundary,below,above] of [[20,'very-bad','bad'],[40,'bad','fair'],[60,'fair','ok'],[80,'ok','very-good']]) {
 assert.equal(conditionBand(boundary).level,below);assert.equal(conditionBand(boundary+.01).level,above);
}
const healthyBody={...initialState,hunger:80,thirst:80,energy:80,health:80,hygiene:80,mood:28};
for(const [value,label] of [[10,'VERY BAD'],[30,'BAD'],[50,'FAIR'],[70,'GOOD'],[90,'VERY GOOD']]) {
 setup({hunger:value,thirst:value,energy:value,health:value,hygiene:value,mood:value},{[lifeKey]:{housing:'Apartment'}});
 assert(screen.getByRole('img',{name:'Mood: '+label}));
 click(/^Status$/);
 assert.equal(document.querySelector('[data-stat="Mood"] svg').innerHTML,document.querySelector('.header-condition svg').innerHTML);
}
assert.equal(overallCondition(healthyBody).level,'bad');
assert.equal(overallCondition(limitMood({...healthyBody,mood:100,health:5},{housing:'Apartment'})).level,'bad');
assert.equal(overallCondition(limitMood({...healthyBody,mood:100,energy:10},{housing:'Apartment'})).level,'fair');
// Wet clothes persist and dry indoors without changing clothing cleanliness.
setup({day:2,minutes:600,locationId:'station',wetness:80},{[invKey]:{clothingCleanliness:80}});click(/^Status$/);
assert(document.querySelector('.effect.wet-clothes').textContent.includes('80%'));
const wetSave=read(stateKey);cleanup();render(React.createElement(App));
assert.equal(read(stateKey).wetness,wetSave.wetness);
advance(1000);assert(Math.abs(read(stateKey).wetness-79.4)<1e-8);
assert(document.querySelector('.wet-clothes .effect-impact').textContent.includes('Energy−'));
setup({locationId:'station',wetness:0});click(/^Status$/);assert(!document.querySelector('.wet-clothes'));
// Status promotes one need only when attention is needed and keeps all six visible.
setup({hunger:72,thirst:66,energy:45,health:90,hygiene:75,mood:28});click(/^Status$/);
assert.equal(document.querySelector('.status-focus').dataset.stat,'Mood');
assert.equal(document.querySelectorAll('.status-needs .status-stat').length,5);
assert.equal(new Set([...document.querySelectorAll('.status-stat')].map(stat=>stat.dataset.stat)).size,6);
assert.equal(document.querySelector('.status-stat[data-stat="Mood"] .status-stat-value').textContent,'28%');
assert(document.querySelector('.status-stat[data-stat="Mood"] .bar i.critical'));
assert(document.querySelector('.status-stat[data-stat="Energy"] .bar i.warning'));
assert(document.querySelector('.status-stat[data-stat="Food"] .bar i.good'));
assert.equal(screen.getAllByRole('meter').length,6);
assert(screen.getByRole('heading',{name:'Condition',exact:true}));
assert(screen.getByRole('heading',{name:'Effects',exact:true}));
assert(document.querySelector('[data-mood-limit="Street"]').textContent.includes('Mood ≤ 50%'));
assert(!document.querySelector('[data-stat="Hygiene"] .bar-blocked'));
setup({mood:28,hygiene:45},{[invKey]:{clothingCleanliness:10},'street-life-effects-v1':[{id:'cold',expiresAt:3000},{id:'well-fed',expiresAt:2000}]});click(/^Status$/);
assert(document.querySelector('.status-effects + .condition-heading'));
assert(!document.querySelector('.effect.illness .effect-time'));
assert(document.querySelector('.effect.positive .effect-time'));
assert.equal(document.querySelector('[data-stat="Hygiene"] .bar-blocked').style.left,'60%');
assert.equal(document.querySelector('[data-stat="Hygiene"] .bar-cap-marker').style.left,'60%');
assert(screen.getByRole('meter',{name:/Hygiene.*maximum 60% due to dirty clothes/}));
setup({mood:28,hygiene:45},{[invKey]:{clothingCleanliness:60}});click(/^Status$/);
assert.equal(document.querySelector('[data-stat="Hygiene"] .bar-blocked').style.left,'80%');
setup({mood:50,hygiene:10},{[invKey]:{clothingCleanliness:10}});click(/^Status$/);
assert.equal(document.querySelector('.status-focus').dataset.stat,'Hygiene');
assert(document.querySelector('.status-focus .bar-blocked'));
setup({hunger:80,thirst:80,energy:80,health:15,hygiene:80,mood:1});click(/^Status$/);
assert.equal(document.querySelector('.status-focus').dataset.stat,'Health');
assert(document.querySelector('.status-needs [data-stat="Mood"]'));
assert(document.querySelector('[data-stat="Energy"] small').textContent.startsWith('Max '));
for(const [value,color] of [[30,'critical'],[30.1,'warning'],[60,'warning'],[60.1,'good']]) {
 setup({hunger:80,thirst:80,energy:80,health:90,hygiene:80,mood:value},{[lifeKey]:{housing:'Apartment'}});click(/^Status$/);
 if(color==='good') {
  assert(!document.querySelector('.status-focus'));
  assert(!document.querySelector('.status-focus-label'));
  assert.equal(document.querySelectorAll('.status-needs .status-stat').length,6);
  assert(document.querySelector('[data-stat="Mood"] .bar i.good'));
 } else {
  assert(document.querySelector(`.status-focus .bar i.${color}`));
  assert.equal(document.querySelector('.status-focus .status-stat-label .status-focus-label').textContent,color==='critical'?'Needs attention':'Keep an eye on this');
 }
}
for(const need of ['hunger','thirst','energy','health','hygiene','mood']) {
 setup({hunger:80,thirst:80,energy:80,health:90,hygiene:80,mood:80,[need]:60.1},{[lifeKey]:{housing:'Apartment'}});click(/^Status$/);
 assert(!document.querySelector('.status-focus'),need+' above 60 does not need a warning');
 assert.equal(screen.getAllByRole('meter').length,6);
 assert.deepEqual([...document.querySelectorAll('.status-needs .status-stat')].map(stat=>stat.dataset.stat),['Food','Thirst','Energy','Health','Hygiene','Mood']);
}
const recoveredMood=advanceTime(healthyBody,60).mood;
assert.equal(recoveredMood,healthyBody.mood,'comfortable needs do not automatically refill Mood');
for(const need of ['hunger','thirst','energy','health','hygiene']) {
 const comfortable={...healthyBody,mood:100};
 const deprived={...comfortable,[need]:5};
 const lowMood=advanceTime(deprived,60,{housing:'Apartment'}).mood;
 assert(lowMood<advanceTime(comfortable,60,{housing:'Apartment'}).mood,need+' must restrict Mood');
}
const emotionalShock={...healthyBody,mood:10};
assert.equal(advanceTime(emotionalShock,0).mood,10);
assert(advanceTime(emotionalShock,60).mood<30); // Recovery is gradual, not a reset.
const baselineMood=advanceTime(healthyBody,60).mood;
assert(advanceTime(healthyBody,60,{music:true}).mood>baselineMood);
assert(advanceTime(healthyBody,60,{effects:[{id:'cold',expiresAt:99999}]}).mood<baselineMood);
const beforeMoneyRandom=Math.random;
for(let amount=25;amount<=50;amount++){Math.random=()=>(amount-25+.5)/26;assert.equal(createInitialState().money,amount);}
Math.random=()=>0;assert.equal(createInitialState().money,25);Math.random=()=>.999999;assert.equal(createInitialState().money,50);Math.random=beforeMoneyRandom;
cleanup();localStorage.clear();localStorage.setItem('street-life-mobile-auto-renew','false');Math.random=()=>0;render(React.createElement(App));assert.equal(read(stateKey).money,25);cleanup();Math.random=()=>.99;render(React.createElement(App));assert.equal(read(stateKey).money,25);click('Reset save');assert.equal(read(stateKey).money,49);assert.equal(read(stateKey).minutes,1320);cleanup();render(React.createElement(App));assert.equal(read(stateKey).money,49);setup({money:100});assert.equal(read(stateKey).money,100);
assert.equal(initialState.health,90);assert.equal(initialState.hygiene,75);assert.equal(initialState.mood,30);
const timedRain=advanceTime({...initialState,minutes:1320,rainUntil:1321,energy:100,health:100},2,{exposure:'indoors'});
assert(Math.abs(timedRain.energy-(100-2*100/2160-.025))<1e-8);
for(const context of [{},{sleeping:true},{walking:true,music:true}]) {
 const start={...initialState,minutes:1430,hunger:12,thirst:12,health:80};
 const options={...context,effects:[{id:'cold',expiresAt:1450},{id:'well-fed',expiresAt:1460}]};
 const block=advanceTime(start,100,options);let ticks=start;for(let i=0;i<100;i++)ticks=advanceTime(ticks,1,options);assert.deepEqual(block,ticks);assert.equal(block.day,2);assert.equal(block.minutes,90);
}
// Full Food lasts 48 hours and full Water 24 hours at baseline. Day 1/2
// weather adds no water surcharge, so the entire baseline food test is exact.
const full={...initialState, minutes:0, hunger:100, thirst:100, energy:100, health:100};
const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const day=advanceTime(full,1440);near(day.hunger,50);near(day.thirst,0);
const twoDays=advanceTime(full,2880);near(twoDays.hunger,0);
const sleep=advanceTime(full,480,{sleeping:true});near(sleep.hunger,100-100/6);near(sleep.thirst,100-100/3);
const walk=advanceTime(full,60,{walking:true});near(walk.hunger,100-100/48*1.25);near(walk.thirst,100-100/24*1.25);
const sunny=advanceTime({...full,day:3},60);near(sunny.thirst,100-100/24*1.15);
const fed=advanceTime({...full,hunger:50},240,{effects:[{id:'well-fed',expiresAt:240}]});near(fed.hunger,50-100/48*4*.5);assert(fed.hunger < 50);
// Hold weather, health and sustenance at baseline across three 12h blocks
// to measure awake Energy independently of dehydration and next-day rain.
let baselineEnergy=100;
for(let block=1;block<=3;block++) {
 baselineEnergy=advanceTime({...full,energy:baselineEnergy},720).energy;
 near(baselineEnergy,Math.max(0,100-block*100/3));
}
near(advanceTime(full,480,{sleeping:true}).energy,100);
near(advanceTime(full,60,{walking:true}).energy,100-100/36-.6);
assert(advanceTime(full,60,{effects:[{id:'cold',expiresAt:1000}]}).energy < advanceTime(full,60).energy);
// Journal stores reflections once, preserves completion timestamps and browses days.
const historyKey='street-life-journal-history-v1';
setup({locationId:'shop',minutes:600},{[invKey]:{water:0}});
assert.deepEqual(read(historyKey),[]);click('Buy Water for 3.00 zł');
assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].minute,603);assert.equal(read(historyKey)[0].day,1);
assert.equal(read(historyKey)[0].title,'Bought Water');assert.equal(read(historyKey)[0].actionTitle,'Buy Water');
assert.equal(read(historyKey)[0].summary,undefined);assert(!read(historyKey)[0].text.includes('3 zł'));
assert(screen.getByRole('dialog').textContent.includes('−3 zł'));
ok();click(/Inventory$/);click(/Water.*tap to drink/);assert.equal(read(historyKey).length,2);ok();click('Phone');click('History');
assert.deepEqual([...document.querySelectorAll('.timeline-entry strong')].map(node=>node.textContent),['Drank water','Bought Water']);
assert(document.querySelector('.timeline').textContent.includes('I didn’t realise how thirsty I was.'));
assert(!document.querySelector('.timeline').textContent.includes('You drank water'));
assert(!document.querySelector('.timeline').textContent.includes('Current situation'));
assert(!document.querySelector('.journal-result-changes'));assert(!document.querySelector('.journal-heading > span'));
assert(screen.getByRole('button',{name:'Previous day'}).disabled);assert(screen.getByRole('button',{name:'Next day'}).disabled);
cleanup();render(React.createElement(App));assert.equal(read(historyKey).length,2);
const yesterday=read(historyKey);
setup({day:3},{[historyKey]:yesterday});click('Phone');click('History');
assert(screen.getByRole('heading',{name:'Day 3 · We'}));assert(screen.getByText('No recorded actions today yet.'));
assert(screen.getByRole('button',{name:'Next day'}).disabled);
click('Previous day');assert(screen.getByRole('heading',{name:'Day 2 · Tu'}));assert(screen.getByText('No recorded actions on this day.'));
click('Previous day');assert(screen.getByRole('heading',{name:'Day 1 · Mo'}));assert(document.querySelector('.timeline').textContent.includes('Bought Water'));
assert(screen.getByRole('button',{name:'Previous day'}).disabled);assert(!screen.getByRole('button',{name:'Next day'}).disabled);
click('Next day');assert(screen.getByRole('heading',{name:'Day 2 · Tu'}));click('Next day');assert(screen.getByRole('heading',{name:'Day 3 · We'}));
click('Previous day');click(/Inventory$/);click('Phone');click('History');assert(screen.getByRole('heading',{name:'Day 3 · We'}));
assert.equal(read(historyKey).length,2);click('Reset save');assert.deepEqual(read(historyKey),[]);
setup({minutes:1380,energy:90});beginSleep(/Lie down here\? I’m not sure… But I could try./,2);assert.deepEqual(read(historyKey),[]);
click('Wake up (debug)');assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].day,2);assert.equal(read(historyKey)[0].minute,60);assert.equal(read(historyKey)[0].title,'Woke up');
// Existing reports migrate in place; malformed rows cannot erase valid history.
const oldReport={day:1,minute:600,title:'Drink water',text:'You drank water.',summary:{costs:[],changes:[{label:'💧 Water',value:'+34',kind:'positive'},null]}};
setup({day:2},{[historyKey]:[oldReport,{day:0,minute:20,title:'Bad',text:'Bad'}]});click('Phone');click('History');click('Previous day');
assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].minute,600);assert.equal(read(historyKey)[0].summary,undefined);
assert.equal(read(historyKey)[0].actionTitle,'Drink water');assert(document.querySelector('.journal-thought').textContent.startsWith('I'));
cleanup();render(React.createElement(App));click('History');assert(screen.getByRole('heading',{name:'Day 2 · Tu'}));assert.equal(read(historyKey).length,1);
require('esbuild').buildSync({entryPoints:['src/journal.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',outfile:'journal-app.cjs'});
const {journalReflection}=require('./journal-app.cjs');
const refused=journalReflection('Shelter registration','No free places today.',{costs:[],changes:[{label:'🙂 Mood',value:'−5',kind:'negative'}]});
const admittedReflection=journalReflection('Shelter registration','A place is available.',{costs:[],changes:[{label:'🙂 Mood',value:'+3',kind:'positive'}]});
assert.notEqual(refused.text,admittedReflection.text);assert(!refused.text.includes('let my shoulders drop'));
assert(!/\d|[+−]/.test(refused.text+admittedReflection.text));
// Journal goals follow real progress, stay completed, and reminders expire sensibly.
const journalKey='street-life-journal-goals-v1',reminderKey='street-life-goal-v1';
setup({minutes:600});click('Phone');click('Goals');assert.equal(document.querySelector('.journal-section-title > span').textContent,'4');assert(!document.querySelector('.completed-goals'));assert.equal(document.querySelector('.main-goal strong').textContent,'Get through the morning');assert(!document.querySelector('.next-event'));
setup({day:1,minutes:1320});assert(!read(journalKey).morning);
setup({day:2,minutes:719});assert(!read(journalKey).morning);
setup({day:2,minutes:720});assert(read(journalKey).morning);
setup({locationId:'shelter',minutes:1140},{[lifeKey]:{housing:'Street',shelterRegistrationAttemptDay:1,shelterVacancies:0}});assert(!read(journalKey).shelter);
setup({locationId:'street'},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}});assert(read(journalKey).shelter);
setup({locationId:'support',minutes:1000});assert(!read(journalKey).support);
setup({locationId:'support',minutes:600});assert(read(journalKey).support);click('Phone');click('Goals');assert.equal(document.querySelector('.journal-section-title > span').textContent,'3');assert.equal(document.querySelector('.completed-goals summary > span').textContent,'1');assert(!document.querySelector('.completed-goals').open);assert(!within(document.querySelector('.journal-goals > .goal-list')).queryByText('Visit social support'));assert(within(document.querySelector('.completed-goals')).getByText('Visit social support').closest('.goal').classList.contains('done'));cleanup();render(React.createElement(App));assert(read(journalKey).support);
setup({locationId:'work',minutes:1200});assert(!read(journalKey).work);
setup({locationId:'street',minutes:600},{'street-life-discovered-v1':['street','station','shop']});const directSearchBattery=read(invKey).phoneBattery;click('Phone');click('Find Help');click('Work');assert(read(journalKey).work);assert(Math.abs(read(invKey).phoneBattery-(directSearchBattery-15*.4*1.196))<1e-8);ok();
setup({locationId:'street',day:2,minutes:1000},{[journalKey]:{morning:true,shelter:true,support:true,work:true}});click('Phone');click('Goals');assert.equal(document.querySelector('.journal-section-title > span').textContent,'0');assert.equal(document.querySelector('.completed-goals summary > span').textContent,'4');assert(!document.querySelector('.main-goal'));assert(screen.getByText('All starting goals completed.'));
click('Reset save');assert.deepEqual(read(journalKey),{morning:false,shelter:false,support:false,work:false});
assert.equal(read(stateKey).minutes,1320);assert.equal(read(stateKey).day,1);assert.equal(read(stateKey).locationId,'street');assert(document.querySelector('.story-scene').textContent.includes('Behind the lit windows, people are getting ready for bed.'));cleanup();localStorage.clear();render(React.createElement(App));assert.equal(read(stateKey).minutes,1320);assert.equal(read(stateKey).day,1);assert(!read(journalKey).morning);
setup({day:2,minutes:600},{[reminderKey]:{type:'night-shelter',day:1,minute:1140}});assert.equal(read(reminderKey).day,2);click('Phone');click('Goals');assert.equal(document.querySelector('.main-goal strong').textContent,'Find a safe place to sleep');assert(document.querySelector('.main-goal small').textContent.includes('Day 2 at 18:00'));assert.equal(screen.getAllByText('Find a safe place to sleep').length,1);
setup({locationId:'shelter',day:2,minutes:1140},{[reminderKey]:{type:'night-shelter',day:2,minute:1080}});assert(!localStorage.getItem(reminderKey));assert(!read(journalKey).shelter);
// Clothing caps every gain, migrates wear, and laundry cleans without repairing it.
setup({hygiene:90},{[invKey]:{jacket:42}});assert.equal(read(invKey).jacket,42);assert.equal(read(invKey).clothingCleanliness,90);assert.equal(read(stateKey).hygiene,90);
for(const [cleanliness,cap] of [[80,100],[60,80],[20,60]]) {
 setup({locationId:'daycenter',hygiene:55},{[invKey]:{clothingCleanliness:cleanliness,showerGel:2}});Math.random=()=>.85;click(/Take a shower/);assert.equal(read(stateKey).hygiene,cap);assert.equal(read(invKey).showerGel,1);ok();cleanup();render(React.createElement(App));assert.equal(read(stateKey).hygiene,cap);
}
setup({hygiene:95},{[invKey]:{clothingCleanliness:39,wipes:1}});assert.equal(read(stateKey).hygiene,60);click(/Inventory$/);assert(screen.getByText('Clothing'));assert(screen.getByRole('button',{name:/^Wet wipes/}).disabled);
setup({locationId:'daycenter',hygiene:50},{[invKey]:{clothingCleanliness:10,jacket:42}});Math.random=()=>.85;click(/Do laundry/);assert.equal(read(invKey).clothingCleanliness,100);assert.equal(read(invKey).jacket,42);assert(read(stateKey).hygiene<100);assert(screen.getByRole('dialog').textContent.includes('Clothing cleanliness'));ok();
setup({locationId:'daycenter'},{[invKey]:{clothingCleanliness:10}});Math.random=()=>.99;click(/Do laundry/);assert(read(invKey).clothingCleanliness<10);
setup({locationId:'shelter',day:4,minutes:1080},{[invKey]:{clothingCleanliness:10,jacket:42},[lifeKey]:{housing:'Night shelter',shelterUntilDay:7,shelterLaundryDropDay:4}});click(/Collect clean laundry/);assert.equal(read(invKey).clothingCleanliness,100);assert.equal(read(invKey).jacket,42);ok();assert(screen.getByRole('button',{name:/Collect clean laundry/}).disabled);
setup({locationId:'shelter',day:4,minutes:390},{[invKey]:{clothingCleanliness:10},[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}});click(/Leave clothes for laundry/);assert(read(invKey).clothingCleanliness<10);
setup({energy:68,minutes:1380},{[invKey]:{clothingCleanliness:100}});beginSleep(/Lie down here\? I’m not sure… But I could try./,4);click('Wake up (debug)');near(read(invKey).clothingCleanliness,90);
// Inventory slots reflect actual stack occupancy, including passive supplies.
const emptyBag={water:0,food:0,medicines:0,bread:0,cannedFood:0,wipes:0,showerGel:0,cigarettes:0,bottles:0};
setup({}, {[invKey]:emptyBag});click(/^Inventory$/);
assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,0);
assert(screen.getByText('Your backpack is empty.'));
assert(!document.querySelector('.backpack-capacity'));
setup({}, {[invKey]:{...emptyBag,water:5,showerGel:21,bottles:9}});click(/^Inventory$/);
assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,6);
assert.equal(document.querySelectorAll('.empty-slot').length,0);
assert.equal(screen.getAllByRole('button',{name:/Water.*tap to drink/}).length,2);
assert(screen.getByRole('group',{name:/3-in-1 shower gel ×20/}));
assert(screen.getByRole('group',{name:/3-in-1 shower gel ×1 ·/}));
assert(screen.getByRole('group',{name:/Bottles & cans ×8/}));
assert(screen.getByRole('group',{name:/Bottles & cans ×1 ·/}));
click(/Water ×1 · tap to drink/);ok();
assert.equal(read(invKey).water,4);assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,5);
setup({}, {[invKey]:{water:4,food:4,medicines:4,bread:4,cannedFood:4,wipes:5,showerGel:20,cigarettes:20,bottles:0}});click(/^Inventory$/);
assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,8);
assert.equal(document.querySelectorAll('.empty-slot').length,0);
assert.equal(document.querySelectorAll('.essentials-grid > .inventory-item').length,4);
// Splitting the combined center preserves known addresses and moves medical care.
setup({locationId:'daycenter'},{'street-life-discovered-v1':['street','daycenter']});
assert(read('street-life-discovered-v1').includes('free-clinic'));
assert(!screen.queryByRole('button',{name:/See a doctor/}));
assert(screen.getByRole('button',{name:/Take a shower/}));
click(/^Map$/);
assert(screen.getByRole('button',{name:/^Free Clinic /}));
assert(!document.querySelector('.district-label').textContent.includes('You are here'));
setup({locationId:'free-clinic',health:40},{[invKey]:{documents:false},'street-life-effects-v1':[{id:'cold',remaining:240}]});
const clinicMoney=read(stateKey).money;Math.random=()=>.85;
click(/See a doctor/);
assert.equal(read(stateKey).money,clinicMoney);
assert(read(stateKey).health>40);
assert(!read('street-life-effects-v1').some(effect=>effect.id==='cold'));
ok();assert(!screen.queryByRole('button',{name:/Take a shower/}));
setup({locationId:'free-clinic',minutes:1020});
assert(document.querySelector('.closed-content-notice'));
assert([...document.querySelectorAll('.closed-content-body button')].find(button=>button.textContent.includes('See a doctor')).disabled);
console.log('PASS: shelter, sleep, journal and needs scenarios.');
// First-night observations follow actions, survive reload and do not repeat.
openingEvents=true;
const firstNightKey='street-life-first-night-events-v1';
setup({minutes:1385},{'street-life-trip-v1':{destinationId:'station',mode:'transit',total:33,remaining:20},[firstNightKey]:{seen:['first-night-door'],lastAt:1385,pendingId:'first-night-door'}});
const eventPausedTrip=read('street-life-trip-v1'),eventPausedGame=read(stateKey);
advance(2000);assert.deepEqual(read('street-life-trip-v1'),eventPausedTrip);assert.deepEqual(read(stateKey),eventPausedGame);
click('Think of someone I could call');const resultPausedGame=read(stateKey);advance(2000);
assert.deepEqual(read('street-life-trip-v1'),eventPausedTrip);assert.deepEqual(read(stateKey),resultPausedGame);
ok();advance(250);assert.equal(read('street-life-trip-v1').remaining,19);
setup({minutes:1320,energy:100});Math.random=()=>.4;
click('Just one more street. I’m not ready to lie down.');
assert(!document.querySelector('.event-overlay'),'read the action result before the observation');
assert.equal(read(firstNightKey).pendingId,'first-night-door');ok();
assert(screen.getByRole('dialog').textContent.includes('The door closes'));
const observingState=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),observingState);
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes('The door closes'));
click('Think of someone I could call');assert.equal(read(firstNightKey).pendingId,null);ok();
Math.random=()=>.4;click('Just one more street. I’m not ready to lie down.');ok();assert(!document.querySelector('.event-overlay'));
Math.random=()=>.4;click('Just one more street. I’m not ready to lie down.');ok();assert(!document.querySelector('.event-overlay'));
assert.deepEqual(read(firstNightKey).seen,['first-night-door']);
click('Reset save');assert.deepEqual(read(firstNightKey).seen,[]);assert.equal(read(firstNightKey).pendingId,null);

// Sitting awake does not make a stranger assume the hero has no home.
setup({minutes:1320,energy:100},{'street-life-answers-v1':['morning','bed'],'street-life-discovered-v1':['street','station','shop','support','daycenter','free-clinic'],'street-life-discovery-version':'2'});
Math.random=()=>.4;click(/Is there a bench nearby/);ok();Math.random=()=>.4;click(/I’ll sit for a bit/);ok();
assert(screen.getByRole('dialog').textContent.includes('Making a bed on a bench'));
assert(!read('street-life-discovered-v1').includes('shelter'));
click('Ask how they get through the night');
assert(screen.getByRole('dialog').textContent.includes('You tell them you have nowhere'));
assert(read('street-life-discovered-v1').includes('shelter'));
assert.deepEqual(read('street-life-goal-v1'),{type:'night-shelter',day:2,minute:1080});ok();

// A shorter interval suppresses a different observation, including after reload.
setup({minutes:1320},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:65,remaining:20},[firstNightKey]:{seen:['first-night-door'],lastAt:1320,pendingId:null}});
cleanup();render(React.createElement(App));Math.random=()=>.4;advanceTravelMinutes(20);ok();
assert(!document.querySelector('.event-overlay'));
assert.deepEqual(read(firstNightKey).seen,['first-night-door']);

// Arrival provides a neutral station observation; declining conversation discovers nothing.
setup({minutes:1330},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:65,remaining:20},'street-life-discovered-v1':['street','station','shop']});
Math.random=()=>.4;advanceTravelMinutes(20);assert.equal(read(stateKey).locationId,'station');ok();
assert(screen.getByRole('dialog').textContent.includes('The last departures'));
assert(screen.getByRole('dialog').textContent.includes('another traveller with a bag'));
click('Find a quiet seat on my own');assert(!read('street-life-discovered-v1').includes('shelter'));ok();

// A real bench sleep can draw the new wake scene, even after midnight.
setup({locationId:'station',minutes:1380});beginSleep(/Try to sleep/,2);assert.equal(read('street-life-sleep-v1').total,120);
advance(11000);const wakeRolls=[.99,0,.9];Math.random=()=>wakeRolls.shift()??.99;advance(1000);
assert.equal(read(firstNightKey).pendingId,'first-night-bench-wake');ok();
assert(screen.getByRole('dialog').textContent.includes('Someone needs the bench'));
assert(document.querySelector('.event-illustration').src.endsWith('event-first-night-station-bench-wake-480.webp'));
click('Sit up and gather my things');
assert(document.querySelector('.result-illustration').src.endsWith('event-station-wake-sit-480.webp'));assert.equal(read(firstNightKey).pendingId,null);ok();

// Scene art survives restoration and each bench answer has its own result art.
for(const [label,asset] of [['Ask how they get through the night','conversation'],['Watch quietly','watch'],['Give them some space','space']]) {
 setup({minutes:1385},{[firstNightKey]:{seen:['first-night-bench'],lastAt:1385,pendingId:'first-night-bench'}});
 const scene=document.querySelector('.event-illustration');assert(scene.src.endsWith('event-first-night-bench-480.webp'));assert.match(scene.srcset,/480w.*768w.*1024w/);
 assert(document.querySelector('.illustrated-event'));assert.equal(document.body.style.overflow,'hidden');
 const eventOrder=within(screen.getByRole('dialog')).getAllByRole('button').map(button=>button.getAttribute('aria-label'));
 advance(10000);assert.deepEqual(within(screen.getByRole('dialog')).getAllByRole('button').map(button=>button.getAttribute('aria-label')),eventOrder);
 cleanup();render(React.createElement(App));assert.deepEqual(within(screen.getByRole('dialog')).getAllByRole('button').map(button=>button.getAttribute('aria-label')),eventOrder,'event order survives reload');
 const displayedReplies=within(screen.getByRole('dialog')).getAllByRole('button');
 assert.equal(document.activeElement,displayedReplies[0]);
 fireEvent.keyDown(document,{key:'Tab'});assert.equal(document.activeElement,displayedReplies[1]);
 click(label);
 assert(document.querySelector('.result-illustration').src.endsWith(`event-bench-${asset}-480.webp`));
 assert(document.querySelector('.result-overlay .illustrated-result'));assert(!document.querySelector('.result-inline'));
 assert(screen.getByRole('dialog').contains(document.activeElement),'result retains keyboard focus');
 if(asset==='conversation') assert(document.querySelector('.compact-info-hours').textContent.includes('18:00–08:00'));
 assert(read(firstNightKey).pendingId===null);ok();assert(!document.querySelector('.result-illustration'));assert(!screen.queryByRole('dialog'));
}
for(const [id,assets,durations] of [
 ['door',['door-walk','door-stay','door-think-call'],[0,5,5]],
 ['station',['station-seat','station-night','station-quiet'],[5,10,5]],
 ['bench-wake',['wake-sit','wake-move','wake-moment'],[5,10,5]],
]) for(let index=0;index<assets.length;index++) {
 setup({minutes:1385},{[firstNightKey]:{seen:[`first-night-${id}`],lastAt:1385,pendingId:`first-night-${id}`}});
 assert(document.querySelector('.event-illustration').src.endsWith(`event-first-night-${id}-480.webp`));
 const eventDefinition=require('esbuild').buildSync({entryPoints:['src/events.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 const eventModule={exports:{}};new Function('module','exports',eventDefinition)(eventModule,eventModule.exports);
 const reply=eventModule.exports.STREET_EVENTS.find(event=>event.id===`first-night-${id}`).choices[index].label;
 click(reply);
 assert(document.querySelector('.result-illustration').src.endsWith(`event-${assets[index]}-480.webp`));
 assert.match(document.querySelector('.result-illustration').srcset,/480w.*768w.*1024w/);
 assert.equal(read(stateKey).minutes,1385+durations[index]);assert.equal(read(firstNightKey).pendingId,null);
 ok();assert(!document.querySelector('.result-illustration'));assert(!screen.queryByRole('dialog'));
}

// Ordinary results on location and inventory screens share the same lock.
setup({locationId:'shop',minutes:600},{[invKey]:{water:0}});click('Buy Water for 3.00 zł');assertResultLocked();ok();
assert(!document.querySelector('.game-background[inert]'));assert.equal(document.body.style.position,'');
click('Inventory');click(/Water.*tap to drink/);assertResultLocked();ok();
assert(!document.querySelector('.bottom-nav[inert]'));click('Map');assert(document.querySelector('.map-surface'));
// Search results require acknowledgement and restore navigation.
setup({day:3,minutes:600},{[invKey]:{phoneBattery:20}});click('Where can I get help in the morning?');assertResultLocked();ok();
assert(!document.querySelector('.bottom-nav[inert]'));advance(1000);

// Every event and its result block all background interaction, not just the clock.
setup({minutes:1385},{[firstNightKey]:{seen:['first-night-door'],lastAt:1385,pendingId:'first-night-door'}});
const lockedGame=read(stateKey), lockedInventory=read(invKey);
assert(document.querySelector('.game-background[inert][aria-hidden="true"]'));
assert(document.querySelector('.bottom-nav[inert][aria-hidden="true"].event-background-blocked'));
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
assert(document.querySelector('footer[inert] .reset').disabled);
for(const button of document.querySelectorAll('.bottom-nav button, footer .reset'))fireEvent.click(button);
const backgroundAction=document.querySelector('.game-background .story-actions button:not(:disabled)');
assert(backgroundAction,'there must be a background action to test');fireEvent.click(backgroundAction);
assert(!document.querySelector('.phone-activity'));
advance(3000);assert.deepEqual(read(stateKey),lockedGame);assert.deepEqual(read(invKey),lockedInventory);
assert(document.querySelector('.event-illustration').src.endsWith('event-first-night-door-480.webp'));
click('Think of someone I could call');
assert(document.querySelector('.result-overlay'));
assert(document.querySelector('.game-background[inert]'));
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
assert(screen.getByRole('dialog').contains(document.activeElement));
ok();assert(!document.querySelector('.game-background[inert]'));assert(!document.querySelector('.bottom-nav[inert]'));
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>!button.disabled));
click('Map');assert(document.querySelector('.map-surface'));
setup({minutes:1320});Math.random=()=>0;click('Just one more street. I’m not ready to lie down.');ok();
assert(screen.getByRole('dialog',{name:'Rain on the street'}));assert(document.querySelector('.bottom-nav[inert]'));
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));

// First-night boundaries and awake/bench-sleep eligibility are explicit.
setup({day:2,minutes:60},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:65,remaining:20}});Math.random=()=>.4;advanceTravelMinutes(20);ok();
assert(screen.getByRole('dialog').textContent.includes('The last departures'));
const eventModule={exports:{}};
new Function('module','exports',require('esbuild').buildSync({entryPoints:['src/events.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false}).outputFiles[0].text)(eventModule,eventModule.exports);
const observationEvents=eventModule.exports.STREET_EVENTS;
const foundCoinOutcome=observationEvents.find(event=>event.id==='found-coins').choices[0].outcome;
const coinFrequencies=new Map();
for(let draw=0;draw<10000;draw++) {
 const resolved=eventModule.exports.resolveEventOutcome(foundCoinOutcome,()=>(draw+.5)/10000);
 const grosz=Math.round(resolved.money*100);coinFrequencies.set(grosz,(coinFrequencies.get(grosz)??0)+1);
 assert(resolved.money>0&&resolved.money<=5);assert.equal(eventModule.exports.resolveEventOutcome(resolved,()=>{throw new Error('Resolved reward cannot reroll')}),resolved);
}
assert.deepEqual([...coinFrequencies.keys()],[1,2,5,10,20,50,100,200,500]);
for(const coin of eventModule.exports.FOUND_COIN_DENOMINATIONS)assert.equal(coinFrequencies.get(coin.grosz),coin.weight*100);
assert.equal(coinFrequencies.get(500),100);assert.equal([...coinFrequencies].filter(([grosz])=>grosz<=50).reduce((sum,[,count])=>sum+count,0),9200);
for(const state of [{day:1,minutes:1250},{day:2,minutes:360},{day:3,minutes:1320}])assert(!eventModule.exports.firstNightTime(state));
assert(eventModule.exports.firstNightTime({day:1,minutes:1320}));assert(eventModule.exports.firstNightTime({day:2,minutes:359}));
const context={locationId:'station',weather:'Clouds',housing:'Street',documents:true,firstNight:true};
assert(!observationEvents.find(e=>e.id==='free-snack').eligible(context));
assert(!observationEvents.find(e=>e.id==='station-food').eligible(context));
assert(!observationEvents.find(e=>e.id==='useful-tip').eligible(context));
const benchWake=observationEvents.find(e=>e.id==='first-night-bench-wake');
assert(benchWake.eligible({...context,sleepKind:'bench'}));
assert(!benchWake.eligible({...context,sleepKind:'ground'}));
assert(!benchWake.eligible({...context,firstNight:false,sleepKind:'bench'}));
// Every eligible catalog event now resolves to a real, responsive scene and outcome.
const fs=require('node:fs');
const stripArt=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='illustration'?undefined:item));
for(const original of observationEvents) {
 const first=original.id.startsWith('first-night-');
 const artContext={locationId:['dropped-glove','night-rustle','cold-hands','city-waking','street-patrol-wake'].includes(original.id)||first&&original.trigger!=='location'?'street':'station',minutes:original.id==='city-waking'?330:original.id==='night-rustle'?1380:1200,temperature:5,elapsedMinutes:30,observation:'idle',weather:'Rain',housing:'Street',documents:true,firstNight:first,sleepKind:'bench',travelMode:original.id==='ticket-check'?'transit':'walk',seenEventIds:observationEvents.filter(e=>e.id!==original.id).map(e=>e.id)};
 Math.random=()=>0;
 const chosen=eventModule.exports.nextStreetEvent(original.trigger,artContext);
 assert.equal(chosen?.id,original.id);
 if (['spare-change','dropped-glove'].includes(original.id)) { assert(!chosen.illustration); continue }
 assert.deepEqual(stripArt(chosen),stripArt(original),'illustration must not change gameplay');
 const images=[chosen.illustration,...chosen.choices.flatMap(choice=>choice.check?[choice.check.success.illustration,choice.check.failure.illustration,choice.check.criticalSuccess?.illustration,choice.check.criticalFailure?.illustration]:[choice.outcome?.illustration])].filter(Boolean);
 for(const image of images) {
  const file=image.split('/').pop();assert(fs.existsSync('public/assets/'+file),file);
  for(const width of [480,768,1024])assert(fs.existsSync('public/assets/'+file.replace('.webp',`-${width}.webp`)),file+' responsive '+width);
 }
}
for(const [kind,housing,file] of [['ground','Street','ground'],['bench','Street','bench'],['shelter','Night shelter','shelter']]) {
 Math.random=()=>0;
 const quiet=eventModule.exports.nextStreetEvent('wake',{locationId:'station',weather:'Cloudy',documents:true,housing,sleepKind:kind,seenEventIds:observationEvents.filter(e=>e.id!=='quiet-night').map(e=>e.id)});
 assert(quiet.illustration.endsWith(`event-quiet-${file}.webp`));assert.equal(quiet.choices[0].outcome.illustration,quiet.illustration);
}
// A real travel D20 retains its resource consequence and displays the matching result.
for(const [roll,art,damage] of [[.99,'caught',0],[0,'fallen',15]]) {
 setup({}, {'street-life-encounters-v1':{seen:[],lastAt:null,pendingId:null}});click('Map');click(/^.*Station/);click('Go →');
 const draws=[.2,0,0];Math.random=()=>draws.shift()??.99;click(/Walk/);
 assert(document.querySelector('.event-illustration').src.endsWith('event-phone-drop-480.webp'));
 const phoneBefore=read(invKey).phoneCondition;
 click('Try to catch it · Reflex DC 11');Math.random=()=>roll;click('Roll D20');click('Continue');
 assert(document.querySelector('.result-illustration').src.endsWith(`event-phone-${art}-480.webp`));
 assert.equal(read(invKey).phoneCondition,phoneBefore-damage);
 ok();
}
cleanup();dom.window.close();console.log('PASS: review regressions, first-night observations, pause/reload, cooldown, neutral contacts, responsive event art, contextual waking and D20 outcome images.');
