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
const phoneSearchButton=require('./test-fixtures/phone-search.cjs')({screen,fireEvent});
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
function click(name){if(screen.queryByRole('dialog',{name:'Rain on the street'})&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name)))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));const dialog=screen.queryByRole('dialog');const searchLabel={'Where can I get help in the morning?':'Help & hygiene','How can I get a shelter bed?':'Shelter','Where can I get food and water?':'Food & water'}[name];const target=searchLabel ? phoneSearchButton(searchLabel) : dialog ? within(dialog).getByRole('button',{name}) : screen.getByRole('button',{name});const previousRandom=Math.random;if(target.dataset.choice?.startsWith('question-')||/Ask AI/.test(target.textContent))Math.random=()=>.34;fireEvent.click(target);Math.random=previousRandom;if(document.querySelector('.phone-activity')&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name))){for(let n=0;n<30&&read('street-life-phone-activity-v1');n++){if(screen.queryByRole('dialog',{name:'Rain on the street'}))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));advance(1000);}}}
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
const complete={seen:['borrow-phone','borrow-phone-slip','street-patrol-wake','station-patrol-wake','city-waking','night-rustle','cold-hands','station-cleaning','platform-question','phone-drop','rain-phone','found-coins','free-snack','ticket-check','station-food','useful-tip','rough-crowd','quiet-night','night-theft','spare-change','dropped-glove'],lastAt:null,pendingId:null};
// Spawn selection cannot depend on Math.random. Consequences still can.
const esbuild=require('esbuild');const eventCode=esbuild.buildSync({entryPoints:['src/events.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const eventModule={exports:{}};new Function('module','exports',eventCode)(eventModule,eventModule.exports);
const {nextStreetEvent,STREET_EVENTS}=eventModule.exports;
const context={locationId:'street',day:2,weather:'Clear',housing:'Street',documents:true,minutes:600,nearHome:true};
Math.random=()=>{throw new Error('Spawn must not roll')};
assert.equal(nextStreetEvent('travel',{...context,travelMode:'walk'}).id,'phone-drop');
assert.equal(nextStreetEvent('travel',{...context,travelMode:'walk',seenEventIds:['phone-drop']}).id,'found-coins');
assert.notEqual(nextStreetEvent('travel',{...context,travelMode:'walk',seenEventIds:['phone-drop','found-coins','free-snack']})?.id,'ticket-check');
assert(!nextStreetEvent('location',{...context,locationId:'station',minutes:600,seenEventIds:STREET_EVENTS.filter(e=>e.id!=='station-food').map(e=>e.id)}));
assert.equal(nextStreetEvent('location',{...context,locationId:'station',minutes:1200,seenEventIds:STREET_EVENTS.filter(e=>e.id!=='station-food').map(e=>e.id)}).id,'station-food');
// Every scene is reachable in a suitable context and exhausted queues return null.
for(const original of STREET_EVENTS){
 if(original.continuationOnly)continue;
 const first=original.id.startsWith('first-night-');
 const c={...context,locationId:['borrow-phone','dropped-glove','night-rustle','cold-hands','city-waking','street-patrol-wake'].includes(original.id)||first&&original.trigger!=='location'?'street':'station',minutes:original.id==='city-waking'?330:['night-rustle','borrow-phone'].includes(original.id)?1380:first?1350:1200,temperature:5,elapsedMinutes:30,observation:'idle',weather:'Rain',housing:original.id==='night-theft'?'Street':'Night shelter',firstNight:first,sleepKind:'bench',travelMode:original.id==='ticket-check'?'transit':'walk',seenEventIds:STREET_EVENTS.filter(e=>e.id!==original.id).map(e=>e.id)};
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
for(const day of [0,1,undefined])for(const minutes of [0,299,1320,1439])assert(!onlyScene('night-rustle',{day,minutes}),'rustle starts at displayed D1');
for(const day of [2,3,20])for(const minutes of [0,299,1320,1439])assert(onlyScene('night-rustle',{day,minutes,nearHome:false}),'rustle does not require the former home');
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
assert(!/car|bush/i.test(rustle.text),'opening does not locate the sound');
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
  setup({day:3,mood:30,minutes:id==='city-waking'?330:1380,locationId:id.startsWith('station')||id==='platform-question'?'station':'street'},
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
   const revealed=choice.label==='Call out and step closer';
   assert.equal(/\bcat\b/i.test(result),revealed);
   const journal=read('street-life-journal-history-v1').at(-1);
   assert.equal(/Just a cat/.test(journal.text),revealed);
   assert.equal(read(stateKey).mood,paused.mood+(choice.outcome.mood??0));
   if(revealed){
    const stat=screen.getByRole('dialog').querySelector('[data-stat="Mood"]');
    assert(stat,'cat reward uses the same animated stat card as neighbour results');
    assert(stat.textContent.includes('+2'));
    assert.equal(stat.querySelector('[role="meter"]').getAttribute('aria-valuenow'),String(paused.mood),'gain holds its starting value until the image loads');
   }
   if(choice.label==='Walk away'){
    assert.equal(read(stateKey).energy,paused.energy-1);
    const energy=screen.getByRole('dialog').querySelector('[data-stat="Energy"]');
    assert(energy?.textContent.includes('−1'),'authored detour loss remains visible despite the passive-drain filter');
    assert(journal.text.includes('longer way around'));
   }
  }
  const after=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),after);ok();
  assert(!screen.queryByRole('dialog'));assert.equal(read(encountersKey).pendingId,null);
 }
}
// Midnight unlocks the rustle away from home even if D0 home scenes were skipped.
setup({day:1,minutes:1425,mood:49},{
 [encountersKey]:{...complete,seen:complete.seen.filter(id=>id!=='night-rustle')},
 'street-life-first-night-events-v1':{seen:[],lastAt:null,pendingId:null},
 'street-life-left-home-v1':true,
});
advance(14000);assert(!screen.queryByRole('dialog'),'D0 does not admit the rustle');
advance(1000);assert.equal(read(stateKey).day,2);assert.equal(read(stateKey).minutes,0);
assert(screen.getByRole('dialog').textContent.includes(rustle.title));
const midnightState=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),midnightState);
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes(rustle.title),'pending rustle survives reload');
click('Call out and step closer');assert.equal(read(stateKey).mood,50,'cat gain respects the street Mood ceiling');
assert(screen.getByRole('dialog').querySelector('[data-stat="Mood"]').textContent.includes('+1'),'result displays actual capped gain');
ok();cleanup();render(React.createElement(App));advance(60000);assert(!screen.queryByRole('dialog'),'seen rustle never repeats after reload');

// A borrowed phone uses a single 50% slip decision followed by the shared D20.
for(const day of [2,3,20])for(const minutes of [0,179,1320,1439])assert(onlyScene('borrow-phone',{day,minutes,nearHome:false}));
for(const minutes of [180,720,1319])assert(!onlyScene('borrow-phone',{minutes}));
for(const changes of [{day:1},{day:undefined},{locationId:'station'}])assert(!onlyScene('borrow-phone',changes));
assert(!onlyScene('borrow-phone-slip'),'the catch stage never spawns on its own');
const borrow=STREET_EVENTS.find(event=>event.id==='borrow-phone');
const borrowSlip=STREET_EVENTS.find(event=>event.id==='borrow-phone-slip');
assert.equal(borrowSlip.choices[0].check.dc,STREET_EVENTS.find(event=>event.id==='phone-drop').choices[0].check.dc);
const borrowPending=(pendingId='borrow-phone',pendingRoll)=>({[encountersKey]:{...complete,pendingId,...(pendingRoll?{pendingRoll}:{})}});
const borrowedState={day:3,minutes:1380,mood:30,energy:68};
function checkBorrowResult(stem,before,battery,mood,damage=0){
 assertEventImage('.result-illustration',stem);
 assert.equal(read(stateKey).minutes,before.minutes+(battery?5:0));
 assert.equal(read(stateKey).mood,before.mood+mood);
 assert.equal(read(invKey).phoneBattery,62-battery);
 assert.equal(read(invKey).phoneCondition,72-damage);
 const dialog=screen.getByRole('dialog');
 if(battery)assert(dialog.textContent.includes(`−${battery}%`),'authored battery cost remains visible');
 if(damage){
  const meter=dialog.querySelector('[data-stat="Phone condition"]');
  assert(meter?.textContent.includes('−5'),'damage has the shared animated condition meter');
  assert.equal(meter.querySelector('[role="meter"]').getAttribute('aria-valuenow'),'72','loss holds its starting value before animation');
 }
 assert.equal(read(encountersKey).pendingId,null);
 assert.equal(read(encountersKey).pendingRoll,null);
 const after=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),after,'result pauses the clock');
 ok();cleanup();render(React.createElement(App));
 assert.equal(read(invKey).phoneBattery,62-battery,'reload does not charge twice');
 assert.equal(read(invKey).phoneCondition,72-damage,'reload does not damage twice');
 assert.equal(read(stateKey).mood,before.mood+mood,'reload does not reward twice');
}
for(const [index,stem,battery,mood] of [
 [0,'return',2,3],[1,'speaker',1,2],[2,'decline',0,0]
]){
 setup(borrowedState,borrowPending());
 assertEventImage('.event-illustration','event-borrow-phone');
 const before=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),before);
 Math.random=()=>.5;click(borrow.choices[index].label);
 checkBorrowResult(`event-borrow-phone-${stem}`,before,battery,mood);
}
// Boundary values cover ordinary success/failure, Energy modifiers and natural 1/20.
for(const [energy,roll,success] of [[68,9,false],[68,10,true],[10,1,false],[10,20,true],[85,9,true]]){
 setup({...borrowedState,energy},borrowPending());
 const before=read(stateKey);Math.random=()=>.499999;click('Hand him your phone');
 assertEventImage('.event-illustration','event-borrow-phone-slip');
 assert.equal(read(encountersKey).pendingId,'borrow-phone-slip');
 assert.equal(read(stateKey).minutes,before.minutes,'time and call effects settle once at the final result');
 assert.equal(read(invKey).phoneBattery,62);
 cleanup();render(React.createElement(App));
 assertEventImage('.event-illustration','event-borrow-phone-slip');
 advance(2000);assert.deepEqual(read(stateKey),before);
 click(borrowSlip.choices[0].label);
 assert(screen.getByText('REFLEX CHECK · DC 11'));
 assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
 Math.random=()=>(roll-.5)/20;click('Roll D20');
 assert.equal(read(encountersKey).pendingRoll,roll);
 cleanup();Math.random=()=>{throw new Error('Reload must not reroll the slip or D20')};render(React.createElement(App));
 assert.equal(document.querySelector('.d20').textContent,String(roll));
 assert(!screen.queryByRole('button',{name:'Roll D20'}),'the saved roll cannot be repeated');
 advance(2000);assert.deepEqual(read(stateKey),before);
 click('Continue');
 checkBorrowResult(`event-borrow-phone-${success?'caught':'dropped'}`,before,2,3,success?0:5);
}
// Like the existing opening calls, voice calls work without mobile internet.
// They still require a usable device and enough battery; refusal stays available.
for(const [inventory,service,allowed] of [
 [{phoneBattery:0},5000,[false,false]],
 [{phoneCondition:0},5000,[false,false]],
 [{phoneBattery:1},5000,[false,true]],
 [{},0,[true,true]],
]){
 setup(borrowedState,{...borrowPending(),[invKey]:inventory,'street-life-mobile-service-until':String(service)});
 for(const [index,label]of ['Hand him your phone','Offer to call on speaker'].entries())assert.equal(screen.getByRole('button',{name:label,exact:true}).disabled,!allowed[index]);
 assert(!screen.getByRole('button',{name:'Say no and move on',exact:true}).disabled);
}
setup(borrowedState,{...borrowPending('borrow-phone-slip'),[invKey]:{phoneCondition:3}});
click(borrowSlip.choices[0].label);Math.random=()=>0;click('Roll D20');click('Continue');
assert.equal(read(invKey).phoneCondition,0,'damage clamps at zero');
assert(screen.getByRole('dialog').textContent.includes('screen, but it stays black'));
assert(screen.getByRole('dialog').querySelector('[data-stat="Phone condition"]').textContent.includes('−3'),'the actual remaining condition loss remains visible');ok();
// A completed call respects the Mood ceiling and Midnight is the first unlocked night.
setup({...borrowedState,mood:49},borrowPending());Math.random=()=>.5;click('Hand him your phone');
assert.equal(read(stateKey).mood,50);assert(screen.getByRole('dialog').querySelector('[data-stat="Mood"]').textContent.includes('+1'));ok();
setup({day:1,minutes:1425,mood:30},{[encountersKey]:{...complete,seen:complete.seen.filter(id=>id!=='borrow-phone')},'street-life-left-home-v1':true});
advance(14000);assert(!screen.queryByRole('dialog'));advance(1000);
assertEventImage('.event-illustration','event-borrow-phone');
click('Say no and move on');ok();advance(60000);assert(!screen.queryByRole('dialog'),'borrowed-phone encounter is once per run');

// Real idle clocks supply temperature/duration; arrival alone cannot trigger cleaning.
const openingSeen=STREET_EVENTS.filter(event=>event.id.startsWith('first-night-')).map(event=>event.id);
for(const [id,state] of [
 ['night-rustle',{day:2,minutes:0}],['city-waking',{day:2,minutes:300}],
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

// A bench wake uses the actual place for the scene and every reply, also after reload.
const benchWake=STREET_EVENTS.find(event=>event.id==='first-night-bench-wake');
const stripArtwork=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='illustration'?undefined:item));
for(const locationId of ['street','station']){
 const scene=locationId==='station'?'event-first-night-station-bench-wake':'event-first-night-bench-wake';
 const prefix=locationId==='station'?'event-station-wake':'event-wake';
 const selected=onlyScene(benchWake.id,{locationId,firstNight:true,sleepKind:'bench'});
 assert.equal(selected.illustration,`/street-life-game/assets/${scene}.webp`);
 assert.deepEqual(stripArtwork(selected),stripArtwork(benchWake),'location art preserves all gameplay');
 for(const [index,suffix] of ['sit','move','moment'].entries()){
  const choice=benchWake.choices[index];
  setup({day:2,minutes:60,locationId},{[encountersKey]:complete,
   'street-life-first-night-events-v1':{seen:openingSeen,lastAt:1500,pendingId:benchWake.id}});
  assertEventImage('.event-illustration',scene);
  cleanup();render(React.createElement(App));assertEventImage('.event-illustration',scene);
  const before=read(stateKey);advance(2000);assert.deepEqual(read(stateKey),before);
  click(choice.label);assertEventImage('.result-illustration',`${prefix}-${suffix}`);
  assert(screen.getByRole('dialog').textContent.includes(choice.outcome.message));
  assert.equal(read(stateKey).minutes,before.minutes+choice.outcome.minutes);
  assert.equal(read(stateKey).locationId,locationId,'moving to another seat stays at the same place');
  ok();assert.equal(read('street-life-first-night-events-v1').pendingId,null);
 }
 // Completed sleep follows the same contextual route before any reload occurs.
 setup({day:2,minutes:60,locationId},{[encountersKey]:complete,
  'street-life-first-night-events-v1':{seen:openingSeen.filter(id=>id!==benchWake.id),lastAt:null,pendingId:null},
  'street-life-sleep-v1':{kind:'bench',total:120,remaining:0,startAbsolute:1380,realStartedAt:Date.now()-12001,realWakeAt:Date.now()-1}});
 assert(screen.getByRole('dialog').textContent.includes('Sleep complete'));ok();
 assertEventImage('.event-illustration',scene);
 click('Sit up and gather my things');assertEventImage('.result-illustration',`${prefix}-sit`);ok();
}

// Opening scene appears on a new run without pressing an action, even on high RNG.
setup({minutes:1320});Math.random=()=>.99;advance(14000);assert(!screen.queryByRole('dialog'));
advance(1000);assert(screen.getByRole('dialog').textContent.includes('A familiar face'));
const stopped=read(stateKey);advance(5000);assert.deepEqual(read(stateKey),stopped);
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes('A familiar face'));
click('No, thanks. Just going for a walk.');ok();assert.equal(read(encountersKey).pendingId,null);

// A phone search cannot skip the due opening scene; its result stays first.
setup({minutes:1320});click('Where can I get help in the morning?');
assert(!document.querySelector('.event-overlay'));assert(screen.getByRole('dialog').textContent.includes('08:00'));ok();
assert(screen.getByRole('dialog').textContent.includes('A familiar face'));click('No, thanks. Just going for a walk.');ok();

// At-home choices preserve actual time, Mood, inventory and the selected art.
const neighbour=STREET_EVENTS.find(event=>event.id==='first-night-door');
for(const [id,end] of [['first-night-door',1380],['first-night-dog',1440]]) {
 for(const minutes of [1320,end-1])assert(onlyScene(id,{firstNight:true,minutes}));
 for(const minutes of [1319,end%1440,0,360,undefined])assert(!onlyScene(id,{firstNight:true,minutes}));
}
// Runtime idle observations use the actual clock, including the midnight wrap.
for(const [day,start,title,display] of [[1,1364,'A familiar face','D0 Mo'],[1,1365,'An old friend','D0 Mo'],[1,1424,'An old friend','D0 Mo'],[1,1425,null,'D1 Tu'],[2,0,null,'D1 Tu'],[2,1320,null,'D1 Tu']]) {
 setup({day,minutes:start,mood:30},{[encountersKey]:complete});advance(15000);
 assert.equal(document.querySelector('.game-day').textContent,display);
 assert.equal(read(stateKey).day,display.startsWith('D0')?1:2,'display conversion does not change stored days');
 if(title)assert(screen.getByRole('dialog').textContent.includes(title),`Day ${day}, start ${start}: expected ${title}, got ${screen.getByRole('dialog').textContent}`);
 else assert(!document.querySelector('.event-overlay'),'neither home meeting first appears at midnight or on Day 2');
}
// The opening interval crosses the displayed day boundary; station/bench scenes
// still belong to the first night after midnight, while home scenes do not.
const {firstNightTime}=eventModule.exports;
for(const state of [{day:1,minutes:1320},{day:2,minutes:0},{day:2,minutes:359}])assert(firstNightTime(state));
for(const state of [{day:1,minutes:1319},{day:2,minutes:360},{day:2,minutes:1320}])assert(!firstNightTime(state));
assert(onlyScene('first-night-station',{firstNight:true,locationId:'station',minutes:30}));
assert(onlyScene('first-night-bench',{firstNight:true,minutes:30}));
assert(!onlyScene(neighbour.id,{firstNight:true,nearHome:false}));
assert(!onlyScene(neighbour.id,{firstNight:true,locationId:'station'}));
for(const [index,asset] of ['decline','help','supplies'].entries()) {
 setup({minutes:1320,mood:30},{[invKey]:{food:0,water:0}});advance(15000);
 const before=read(stateKey),supplies=read(invKey);
 click(neighbour.choices[index].label);
 assert.equal(read(stateKey).mood,30+[-2,2,3][index]);
 assert.equal(read(stateKey).minutes,before.minutes+[0,5,5][index]);
 assertEventImage('.result-illustration',`event-neighbour-${asset}`);
 assert.equal(read(invKey).food,supplies.food+(index===2?1:0));
 assert.equal(read(invKey).water,supplies.water+(index===2?1:0));
 if(index===2)assert(screen.getByRole('dialog').textContent.includes('You need them more than I do.'));
 ok();cleanup();render(React.createElement(App));advance(1000);
 assert(!screen.queryByRole('dialog'),'completed neighbour does not replay');
}
// A short call does not force an encounter; the normal idle interval still applies.
setup({minutes:1320,mood:30},{'street-life-opening-calls-v1':0});
fireEvent.click(document.querySelector('[data-choice="phone-call"]'));
advance(500);assert(screen.getByRole('dialog').textContent.includes('No answer'));ok();
advance(14000);assert(!screen.queryByRole('dialog'),'no forced meeting after the short call');
advance(1000);assert(screen.getByRole('dialog').textContent.includes('A familiar face'));
click(neighbour.choices[0].label);ok();
// Starting either real route leaves home immediately, even while game.locationId
// still says Street; stopping/reloading/returning cannot re-enable the meeting.
for(const mode of ['Walk','Public transport']) {
 setup({minutes:1320});click('Map');click(/Station/);click('Go →');
 advance(1000);assert(document.querySelector('.travel-sheet'));assert(!document.querySelector('.event-overlay'),'route selection is not interrupted');
 assert.equal(read('street-life-left-home-v1'),false,'selecting a route alone does not leave home');
 click(new RegExp('^'+mode));
 assert.equal(read('street-life-left-home-v1'),true);
 advance(1000);assert(!document.querySelector('.event-overlay'));
 cleanup();render(React.createElement(App));assert(!document.querySelector('.event-overlay'));
}
for(const homeEventId of ['first-night-door','first-night-dog'])for(const extra of [
 {'street-life-left-home-v1':true},
 {'street-life-trip-v1':{destinationId:'station',mode:'walk',total:20,remaining:10}},
 {'street-life-journal-history-v1':[{day:1,minute:1320,title:'Arrived',text:'Arrived at Station.',actionTitle:'Arrival',reflection:true}]},
]) {
 setup({minutes:1320},{...extra,'street-life-first-night-events-v1':{seen:[homeEventId],lastAt:1320,pendingId:homeEventId}});
 assert(!document.querySelector('.event-overlay'),'stale at-home pending scene is discarded away from home');
 assert.equal(read('street-life-first-night-events-v1').pendingId,null);
}
setup({minutes:1320},{'street-life-left-home-v1':true});advance(15000);
assert(!screen.queryByRole('dialog'),'returning to Street does not restore the home meeting');

// The familiar dog shares normal timing, home eligibility and the illustrated
// result flow. Each real choice changes Mood once and survives pending reloads.
const dog=STREET_EVENTS.find(event=>event.id==='first-night-dog');
for(const changes of [{firstNight:false},{firstNight:true,nearHome:false},{firstNight:true,nearHome:undefined},{firstNight:true,locationId:'station'}]) {
 assert(!onlyScene(dog.id,changes));
}
for(const [index,asset] of ['avoid','pass','greet'].entries()) {
 setup({minutes:1320,mood:30},{'street-life-first-night-events-v1':{seen:['first-night-door'],lastAt:null,pendingId:null}});
 advance(14000);assert(!screen.queryByRole('dialog'),'dog has no dedicated early timer');
 advance(1000);assert(screen.getByRole('dialog').textContent.includes('An old friend'));
 assertEventImage('.event-illustration','event-neighbour-dog-meeting');
 const paused=read(stateKey).minutes;
 advance(2000);assert.equal(read(stateKey).minutes,paused,'dog choice pauses global time');
 cleanup();render(React.createElement(App));
 assertEventImage('.event-illustration','event-neighbour-dog-meeting');
 const before=read(stateKey),supplies=read(invKey);
 click(dog.choices[index].label);
 assert.equal(read(stateKey).mood,before.mood+[-2,-1,3][index]);
 assert.equal(read(stateKey).minutes,before.minutes+[0,0,5][index]);
 assertEventImage('.result-illustration',`event-neighbour-dog-${asset}`);
 assert.equal(read(invKey).food,supplies.food);assert.equal(read(invKey).water,supplies.water);
 const journal=read('street-life-journal-history-v1').find(entry=>entry.actionTitle===dog.title);
 assert(journal?.text.includes(['ever see that dog again','kept walking','happy to see me'][index]),'history follows the selected response');
 ok();cleanup();render(React.createElement(App));advance(1000);
 assert(!screen.queryByRole('dialog'),'completed dog encounter does not replay');
}
// Both home scenes can occur in one run, with the shared 45-minute cooldown.
setup({minutes:1320,mood:30});advance(15000);
click(neighbour.choices[0].label);ok();
advance(44000);assert(!screen.queryByRole('dialog'),'home scenes respect the shared cooldown');
advance(1000);assert(screen.getByRole('dialog').textContent.includes('An old friend'));
click(dog.choices[2].label);ok();
assert(read('street-life-first-night-events-v1').seen.includes(dog.id));

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
advance(15000);assert(screen.getByRole('dialog').textContent.includes('A familiar face'));
cleanup();dom.window.close();console.log('PASS: contextual catalog, ambient choices and mystery, night/dawn/cold boundaries, idle/arrival gating, 45-minute spacing, pause, reload, discovery and reset.');
