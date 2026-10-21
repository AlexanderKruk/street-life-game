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
const complete={seen:['street-patrol-wake','station-patrol-wake','city-waking','night-rustle','cold-hands','station-cleaning','platform-question','phone-drop','rain-phone','found-coins','free-snack','ticket-check','station-food','useful-tip','rough-crowd','quiet-night','night-theft','spare-change','dropped-glove'],lastAt:null,pendingId:null};
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
 const c={...context,locationId:['dropped-glove','night-rustle','cold-hands','city-waking','street-patrol-wake'].includes(original.id)||first&&original.trigger!=='location'?'street':'station',minutes:original.id==='city-waking'?330:original.id==='night-rustle'?1380:1200,temperature:5,elapsedMinutes:30,observation:'idle',weather:'Rain',housing:original.id==='night-theft'?'Street':'Night shelter',firstNight:first,sleepKind:'bench',travelMode:original.id==='ticket-check'?'transit':'walk',seenEventIds:STREET_EVENTS.filter(e=>e.id!==original.id).map(e=>e.id)};
 assert.equal(nextStreetEvent(original.trigger,c)?.id,original.id);
 assert.equal(nextStreetEvent(original.trigger,{...c,seenEventIds:STREET_EVENTS.map(e=>e.id)}),null);
}

// Ambient eligibility uses actual place, clock, temperature and observation.
function onlyScene(id,changes={}){
 const original=STREET_EVENTS.find(event=>event.id===id);
 return nextStreetEvent(original.trigger,{...context,minutes:1380,firstNight:false,temperature:5,elapsedMinutes:30,observation:'idle',...changes,seenEventIds:STREET_EVENTS.filter(event=>event.id!==id).map(event=>event.id)});
}
for(const minute of [1320,0,299])assert(onlyScene('night-rustle',{minutes:minute}));
for(const minute of [300,720,1319])assert(!onlyScene('night-rustle',{minutes:minute}));
assert(!onlyScene('night-rustle',{locationId:'station'}));
for(const minute of [300,419])assert(onlyScene('city-waking',{minutes:minute}));
for(const minute of [299,420,1380])assert(!onlyScene('city-waking',{minutes:minute}));
assert(!onlyScene('city-waking',{minutes:330,locationId:'station'}));
assert(onlyScene('cold-hands',{temperature:9,elapsedMinutes:15}));
for(const changes of [{temperature:10},{temperature:undefined},{elapsedMinutes:14},{observation:'arrival'},{locationId:'station'}])assert(!onlyScene('cold-hands',changes));
assert(onlyScene('station-cleaning',{locationId:'station',elapsedMinutes:15}));
for(const changes of [{locationId:'station',elapsedMinutes:14},{locationId:'station',observation:'arrival'},{locationId:'street'}])assert(!onlyScene('station-cleaning',changes));
assert(onlyScene('platform-question',{locationId:'station'}));assert(!onlyScene('platform-question'));
for(const id of ['spare-change','dropped-glove','useful-tip','free-snack']){
 for(const minute of [0,359,1320,1439])assert(!onlyScene(id,{minutes:minute,travelMode:'walk'}));
 for(const minute of [360,1319])assert(onlyScene(id,{minutes:minute,travelMode:'walk'}));
}
assert(onlyScene('spare-change',{locationId:'station',minutes:60}));
const rustle=STREET_EVENTS.find(event=>event.id==='night-rustle');
assert(!/\bcat\b/i.test(JSON.stringify({title:rustle.title,text:rustle.text,icon:rustle.icon,choices:rustle.choices.map(choice=>choice.label)})),'mystery opening must not reveal the cat');
assert(/\bcat\b/i.test(rustle.choices[0].outcome.message));
assert(rustle.choices.slice(1).every(choice=>!/\bcat\b/i.test(choice.outcome.message)));

// Exact scene/answer assets remain distinct and responsive, including saved encounters.
const newEventArt={
 'city-waking':['event-city-waking','event-city-plan','event-city-pause','event-city-move'],
 'night-rustle':['event-night-rustle','event-rustle-cat','event-rustle-wait','event-rustle-leave'],
 'cold-hands':['event-cold-hands','event-cold-rub','event-cold-walk','event-cold-endure'],
 'station-cleaning':['event-station-cleaning','event-cleaning-move','event-cleaning-stretch','event-cleaning-ask'],
 'platform-question':['event-platform-question','event-platform-board','event-platform-point','event-platform-unsure'],
 'street-patrol-wake':['event-street-patrol-wake','event-street-patrol-answer','event-street-patrol-help','event-street-patrol-move'],
 'station-patrol-wake':['event-station-patrol-wake','event-station-patrol-answer','event-station-patrol-wait','event-station-patrol-exit'],
};
assert.equal(new Set(Object.values(newEventArt).flat()).size,28);
const imageManifest=require('./src/imageManifest.json');
for(const stem of Object.values(newEventArt).flat()){
 assert(require('node:fs').existsSync(`public/assets/${stem}.webp`));
 assert.deepEqual(imageManifest[`${stem}.webp`].variants.map(image=>image.width),[480,768,1024]);
}
function assertEventImage(selector,stem){
 const image=screen.getByRole('dialog').querySelector(selector);
 assert(image,`${stem} is visible`);
 assert(image.src.endsWith(`/${stem}-480.webp`),image.src);
 for(const width of [480,768,1024])assert(image.srcset.includes(`${stem}-${width}.webp ${width}w`));
}

// All new choices work after pending-scene reload, pause time, acknowledge
// even zero changes, and keep the mystery consistent in result and journal.
const ambientIds=['city-waking','night-rustle','cold-hands','station-cleaning','platform-question'];
for(const id of ambientIds){
 const event=STREET_EVENTS.find(event=>event.id===id);
 for(const choice of event.choices){
  setup({day:3,minutes:id==='city-waking'?330:1380,locationId:id.startsWith('station')||id==='platform-question'?'station':'street'},
   {[encountersKey]:{...complete,pendingId:id}});
  assert(screen.getByRole('dialog').textContent.includes(event.title));
  assertEventImage('.event-illustration',newEventArt[id][0]);
  if(id==='night-rustle')assert(!/\bcat\b/i.test(screen.getByRole('dialog').textContent));
  const paused=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),paused);
  click(choice.label);
  const result=screen.getByRole('dialog').textContent;assert(result.includes(choice.outcome.message));
  const answerArt=newEventArt[id][event.choices.indexOf(choice)+1];
  assertEventImage('.result-illustration',answerArt);
  assert.equal(read(stateKey).minutes,paused.minutes+(choice.outcome.minutes??0));
  if(id==='night-rustle'){
   const revealed=choice.label==='Look to see what it is';
   assert.equal(/\bcat\b/i.test(result),revealed);
   const journal=read('street-life-journal-history-v1').at(-1);
   assert.equal(/laugh at myself/.test(journal.text),revealed);
  }
  const after=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),after);ok();
  assert(!screen.queryByRole('dialog'));assert.equal(read(encountersKey).pendingId,null);
 }
}
// Real idle clocks supply temperature/duration; arrival alone cannot trigger cleaning.
const openingSeen=STREET_EVENTS.filter(event=>event.id.startsWith('first-night-')).map(event=>event.id);
for(const [id,state] of [
 ['night-rustle',{day:1,minutes:1380}],['city-waking',{day:2,minutes:300}],
 ['cold-hands',{day:2,minutes:60}],['station-cleaning',{day:2,minutes:60,locationId:'station'}]
]){
 setup(state,{[encountersKey]:{...complete,seen:complete.seen.filter(seen=>seen!==id)},
  'street-life-first-night-events-v1':{seen:openingSeen,lastAt:null,pendingId:null}});
 advance(14000);assert(!screen.queryByRole('dialog'));advance(1000);
 assert(screen.getByRole('dialog').textContent.includes(STREET_EVENTS.find(event=>event.id===id).title));
 click(STREET_EVENTS.find(event=>event.id===id).choices[0].label);ok();
 advance(30000);assert(!screen.queryByRole('dialog'),'new scenes obey the common cooldown');
}
setup({day:3,minutes:1200},{
 [encountersKey]:{...complete,seen:complete.seen.filter(id=>id!=='station-cleaning')},
 'street-life-trip-v1':{destinationId:'station',mode:'walk',total:20,remaining:1}
});advance(250);ok();assert(!screen.queryByRole('dialog'),'cleaner does not address someone who just arrived');
advance(30000);assert(screen.getByRole('dialog').textContent.includes('Cleaning the hall'));
click('Move to another bench');ok();

// Patrol waking checks carried ID, and only Station asks for a train ticket.
for(const locationId of ['street','station'])for(const [documents,storedDocuments] of [[true,false],[false,false],[false,true]]){
 const id=locationId==='street'?'street-patrol-wake':'station-patrol-wake';
 const event=STREET_EVENTS.find(event=>event.id===id);
 assert.equal(/ticket/i.test(event.text),locationId==='station');
 for(const choice of event.choices){
  setup({day:3,minutes:600,locationId},{[invKey]:{documents,transitCard:true},
   'street-life-storage-v1':{documents:storedDocuments},[encountersKey]:{...complete,pendingId:id}});
  const before=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),before);
  cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes(event.title));
  assertEventImage('.event-illustration',newEventArt[id][0]);
  click(choice.label);
  assertEventImage('.result-illustration',newEventArt[id][event.choices.indexOf(choice)+1]);
  const result=screen.getByRole('dialog').textContent;
  assert(result.includes(documents?'You show your documents.':storedDocuments?'your documents are stored at the shelter':'your documents are missing.'));
  assert.equal(/train ticket/i.test(result),locationId==='station');
  assert.equal(read(stateKey).minutes,before.minutes+choice.outcome.minutes+(documents?0:10));
  assert.equal(read(invKey).documents,documents,'identity check neither loses nor restores ID');
  assert.equal(read('street-life-storage-v1').documents,storedDocuments,'stored ID is not silently fetched');
  assert.equal(read(stateKey).locationId,choice.outcome.moveToStreet?'street':locationId);
  if(choice.outcome.discoverLocation)assert(read('street-life-discovered-v1').includes('shelter'));
  const after=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),after);ok();
  cleanup();render(React.createElement(App));assert.deepEqual(read(stateKey),after,'result and exit survive reload');
 }
}
const patrolSeen=STREET_EVENTS.filter(event=>!['station-patrol-wake','first-night-bench-wake'].includes(event.id)).map(event=>event.id);
assert.equal(nextStreetEvent('wake',{...context,locationId:'station',sleepKind:'bench',firstNight:true,seenEventIds:patrolSeen}).id,'first-night-bench-wake');
for(const id of ['street-patrol-wake','station-patrol-wake']){
 const event=STREET_EVENTS.find(event=>event.id===id);
 assert(!event.eligible({...context,locationId:'shelter',sleepKind:'shelter'}));
 assert(!event.eligible({...context,locationId:id==='street-patrol-wake'?'street':'station',sleepKind:'residential'}));
}
// A real completed sleep first shows its ordinary result, then the patrol.
for(const locationId of ['street','station']){
 const id=locationId==='street'?'street-patrol-wake':'station-patrol-wake';
 setup({day:3,minutes:600,locationId},{
  [encountersKey]:{...complete,seen:complete.seen.filter(seen=>seen!==id)},
  'street-life-sleep-v1':{kind:locationId==='street'?'ground':'bench',total:120,remaining:0,startAbsolute:3360,realStartedAt:Date.now()-12001,realWakeAt:Date.now()-1}
 });
 assert(screen.getByRole('dialog').textContent.includes('Sleep complete'));ok();
 assert(screen.getByRole('dialog').textContent.includes(STREET_EVENTS.find(event=>event.id===id).title));
 assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
 click(locationId==='station'?'Gather my things and step outside':'Answer the officer');ok();
 assert.equal(read(stateKey).locationId,'street');
 assert(read(encountersKey).seen.includes(id));assert.equal(read(encountersKey).pendingId,null);
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
setup({day:3,minutes:1200},{[encountersKey]:{seen:['city-waking','night-rustle','cold-hands','station-cleaning','platform-question'],lastAt:null,pendingId:null},'street-life-trip-v1':{destinationId:'station',mode:'walk',total:20,remaining:1}});
advance(250);assert(screen.getByRole('dialog').textContent.includes('Arrival'));ok();
assert(screen.getByRole('dialog').textContent.includes('Food before closing'));click('Decline');ok();

// Useful directions discover Night Shelter only when heard, without duplicate
// addresses, and show the evening registration reminder.
for(const known of [false,true])for(const variant of ['listen','success','critical-success','failure','critical-failure','leave']){
 const places=['street','station','shop',...(known?['shelter']:[])];
 setup({day:3,minutes:600,locationId:'station'},{
  'street-life-trip-v1':{destinationId:'street',mode:'walk',total:20,remaining:1},
  'street-life-discovered-v1':places,
  [encountersKey]:{...complete,seen:complete.seen.filter(id=>id!=='useful-tip')}
 });
 advance(250);assert(screen.getByRole('dialog').textContent.includes('Arrival'));ok();
 assert(screen.getByRole('dialog').textContent.includes('A useful tip'));
 const learns=['listen','success','critical-success'].includes(variant);
 if(variant==='listen')click('Just listen');
 else if(variant==='leave')click('Keep going');
 else{
  click('Ask for details · Persuasion DC 12');
  Math.random=()=>({'success':.7,'critical-success':.99,'failure':.1,'critical-failure':0})[variant];
  click('Roll D20');click('Continue');
 }
 const discovered=read('street-life-discovered-v1');
 assert.equal(discovered.filter(id=>id==='shelter').length,known||learns?1:0);
 const result=screen.getByRole('dialog').textContent;
 if(learns){
  assert(result.includes(known?'You have heard of this Night Shelter before. You make a mental note to go and see what it’s like.':'You save its address on your map.'));
  assert(result.includes('registration starts at 18:20'));assert(result.includes('Arrive before 18:00'));
 }
 ok();cleanup();render(React.createElement(App));
 assert.deepEqual(read('street-life-discovered-v1'),discovered,'directions survive reload');
 click('Map');assert.equal(!!screen.queryByRole('button',{name:/Night Shelter/}),known||learns);
}

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
cleanup();dom.window.close();console.log('PASS: contextual catalog, ambient choices and mystery, night/dawn/cold boundaries, idle/arrival gating, 45-minute spacing, pause, reload, discovery and reset.');
