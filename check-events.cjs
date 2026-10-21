// Real user event routes with release-default wetness disabled.
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
require('esbuild').buildSync({entryPoints:['src/App.tsx'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"false"}'},platform:'node',format:'cjs',outfile:'events-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const React=require('react');
const {render,screen,fireEvent,within,act,cleanup,configure}=require('@testing-library/react');
configure({getElementError:message=>new Error(message)});
process.on('uncaughtException',error=>{console.error(error.message.split('Here are')[0]);console.error(error.stack.split('\n').filter(line=>line.includes('check-regressions')).join('\n'));cleanup();dom.window.close();process.exit(1)});
const assert=require('node:assert/strict');
const App=require('./events-app.cjs').default;
const stateKey='street-life-save-v3',invKey='street-life-inventory-v1',lifeKey='street-life-situation-v1';
const read=k=>JSON.parse(localStorage.getItem(k));
function setup(s={},extra={}){
 cleanup();localStorage.clear();
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
function click(name){if(screen.queryByRole('dialog',{name:'Rain on the street'})&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name)))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));const dialog=screen.queryByRole('dialog');const target=dialog ? within(dialog).getByRole('button',{name}) : screen.getByRole('button',{name});const previousRandom=Math.random;if(target.dataset.choice?.startsWith('question-')||/Ask AI/.test(target.textContent))Math.random=()=>.34;fireEvent.click(target);Math.random=previousRandom;if(document.querySelector('.phone-activity')&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name))){for(let n=0;n<30&&read('street-life-phone-activity-v1');n++){if(screen.queryByRole('dialog',{name:'Rain on the street'}))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));advance(1000);}}}
function chooseHours(hours){fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:new RegExp('^'+hours+' h')}));}
function beginSleep(name,hours){click(name);if(hours!==undefined)chooseHours(hours);click('Start sleeping');}
function ok(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Got it',exact:true}));}
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

const encountersKey='street-life-encounters-v1';
const complete={seen:['phone-drop','rain-phone','found-coins','free-snack','ticket-check','station-food','useful-tip','rough-crowd','quiet-night','night-theft','spare-change','dropped-glove'],lastAt:null,pendingId:null};
// Spawn selection cannot depend on Math.random. Consequences still can.
const esbuild=require('esbuild');const eventCode=esbuild.buildSync({entryPoints:['src/events.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const eventModule={exports:{}};new Function('module','exports',eventCode)(eventModule,eventModule.exports);
const {nextStreetEvent,STREET_EVENTS}=eventModule.exports;
const context={locationId:'street',weather:'Clear',housing:'Street',documents:true,minutes:600};
Math.random=()=>{throw new Error('Spawn must not roll')};
assert.equal(nextStreetEvent('travel',{...context,travelMode:'walk'}).id,'phone-drop');
assert.equal(nextStreetEvent('travel',{...context,travelMode:'walk',seenEventIds:['phone-drop']}).id,'found-coins');
assert.notEqual(nextStreetEvent('travel',{...context,travelMode:'walk',seenEventIds:['phone-drop','found-coins','free-snack']})?.id,'ticket-check');
assert(!nextStreetEvent('location',{...context,locationId:'station',minutes:600,seenEventIds:STREET_EVENTS.filter(e=>e.id!=='station-food').map(e=>e.id)}));
assert.equal(nextStreetEvent('location',{...context,locationId:'station',minutes:1200,seenEventIds:STREET_EVENTS.filter(e=>e.id!=='station-food').map(e=>e.id)}).id,'station-food');
// Every scene is reachable in a suitable context and exhausted queues return null.
for(const original of STREET_EVENTS){
 const first=original.id.startsWith('first-night-');
 const c={...context,locationId:original.id==='dropped-glove'||first&&original.trigger!=='location'?'street':'station',minutes:1200,weather:'Rain',housing:original.id==='night-theft'?'Street':'Night shelter',firstNight:first,sleepKind:'bench',travelMode:original.id==='ticket-check'?'transit':'walk',seenEventIds:STREET_EVENTS.filter(e=>e.id!==original.id).map(e=>e.id)};
 assert.equal(nextStreetEvent(original.trigger,c)?.id,original.id);
 assert.equal(nextStreetEvent(original.trigger,{...c,seenEventIds:STREET_EVENTS.map(e=>e.id)}),null);
}

// Opening scene appears on a new run without pressing an action, even on high RNG.
setup({minutes:1320});Math.random=()=>.99;advance(14000);assert(!screen.queryByRole('dialog'));
advance(1000);assert(screen.getByRole('dialog').textContent.includes('The door closes'));
const stopped=read(stateKey);advance(5000);assert.deepEqual(read(stateKey),stopped);
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes('The door closes'));
click('Keep walking');ok();assert.equal(read(encountersKey).pendingId,null);

// A phone search cannot skip the due opening scene; its result stays first.
setup({minutes:1320});click('Where can I get help in the morning?');
assert(!document.querySelector('.event-overlay'));assert(screen.getByRole('dialog').textContent.includes('08:00'));ok();
assert(screen.getByRole('dialog').textContent.includes('The door closes'));click('Keep walking');ok();

// Real wandering routes an unseen walking encounter after the action result.
setup({day:3,minutes:600},{[encountersKey]:{seen:['phone-drop'],lastAt:null,pendingId:null}});
Math.random=()=>.99;click('Just one more street. I’m not ready to lie down.');
assert(!document.querySelector('.event-overlay'));ok();
assert(screen.getByRole('dialog').textContent.includes('Coin on the pavement'));
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes('Coin on the pavement'));
click('Pick it up');ok();assert(read(encountersKey).seen.includes('found-coins'));
// Acknowledgement cannot immediately produce another event.
advance(30000);assert(!screen.queryByRole('dialog'),'shared 45-minute cooldown');

// Daytime bench rest and arrival use the deterministic location queue.
setup({day:3,minutes:600,energy:70},{'street-life-answers-v1':['morning','bed']});Math.random=()=>.4;
click(/Is there a bench nearby/);ok();click(/I’ll sit for a bit/);ok();
assert(screen.getByRole('dialog').textContent.includes('A useful tip'));click('Keep going');ok();
setup({day:3,minutes:1200},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:20,remaining:1}});
advance(250);assert(screen.getByRole('dialog').textContent.includes('Arrival'));ok();
assert(screen.getByRole('dialog').textContent.includes('Food before closing'));click('Decline');ok();

// Money request is unconditional when due; unaffordable payment is disabled.
for(const money of [0,2]){
 setup({day:3,minutes:600,money},{[encountersKey]:{...complete,seen:complete.seen.filter(id=>id==='spare-change'?false:true)}});
 Math.random=()=>.99;advance(30000);
 assert(screen.getByRole('dialog').textContent.includes('Have you got any change?'));
 assert.equal(screen.getByRole('button',{name:/Give 1 zł/}).disabled,money===0);
 if(money){click(/Give 1 zł/);assert.equal(read(stateKey).money,1);ok();}
 else{click('Sorry, I can’t');assert.equal(read(stateKey).money,0);ok();}
 advance(60000);assert(!screen.queryByRole('dialog'),'encounter never repeats');
 cleanup();render(React.createElement(App));advance(60000);assert(!screen.queryByRole('dialog'),'seen state survives reload');
}
setup({day:3,minutes:600},{[encountersKey]:{...complete,seen:complete.seen.filter(id=>id!=='dropped-glove')}});advance(30000);
assert(screen.getByRole('dialog').textContent.includes('Someone dropped a glove'));const t=read(stateKey).minutes;
click(/Call after them/);assert.equal(read(stateKey).minutes,t+2);ok();
// Reset permits a new run's opening; it also removes the ordinary seen queue.
click('Reset save');assert.deepEqual(read(encountersKey).seen,[]);
advance(15000);assert(screen.getByRole('dialog').textContent.includes('The door closes'));
cleanup();dom.window.close();console.log('PASS: deterministic contextual catalog, idle/active routes, 45-minute spacing, no repeats, pause, reload, spending and reset.');
