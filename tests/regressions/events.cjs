const env = require('../helpers/regression-env.cjs');
const { React, render, screen, fireEvent, within, cleanup, assert, App, stateKey, invKey, read, setup, click, beginSleep, ok, advance, advanceTravelMinutes, assertResultLocked, setOpeningEvents } = env;
// First-night observations follow actions, survive reload and do not repeat.
setOpeningEvents(true);
const firstNightKey='street-life-first-night-events-v1';
// An obsolete at-home encounter cannot remain pending during an existing trip.
setup({minutes:1385},{'street-life-trip-v1':{destinationId:'station',mode:'transit',total:33,remaining:20},[firstNightKey]:{seen:['first-night-door'],lastAt:1385,pendingId:'first-night-door'}});
assert(!document.querySelector('.event-overlay'));
assert.equal(read(firstNightKey).pendingId,null);
advance(250);assert.equal(read('street-life-trip-v1').remaining,19);
setup({minutes:1320,energy:100});Math.random=()=>.4;
click(/Put on something familiar and walk for a while. Clear my head./);
assert(!document.querySelector('.event-overlay'),'read the action result before the observation');
assert.equal(read(firstNightKey).pendingId,'first-night-door');ok();
assert(screen.getByRole('dialog').textContent.includes('A familiar face'));
const observingState=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),observingState);
cleanup();render(React.createElement(App));assert(screen.getByRole('dialog').textContent.includes('A familiar face'));
click('Let me help with those bags.');assert.equal(read(firstNightKey).pendingId,null);ok();
Math.random=()=>.4;advance(30000);assert(!document.querySelector('.event-overlay'));
advance(15000);
assert(screen.getByRole('dialog').textContent.includes('An old friend'),'idle time after the cooldown can meet the dog');
click('Keep walking.');ok();assert(!document.querySelector('.event-overlay'));
assert.deepEqual(read(firstNightKey).seen,['first-night-door','first-night-dog']);
click('Reset save');assert.deepEqual(read(firstNightKey).seen,[]);assert.equal(read(firstNightKey).pendingId,null);

// Sitting awake does not make a stranger assume the hero has no home.
setup({minutes:1320,energy:100},{'street-life-left-home-v1':true,'street-life-answers-v1':['morning','bed'],'street-life-discovered-v1':['street','station','shop','support','daycenter','free-clinic'],'street-life-discovery-version':'2'});
Math.random=()=>.4;click(/Is there a bench nearby/);ok();Math.random=()=>.4;click(/I’ll sit for a bit/);ok();
assert(!screen.queryByRole('dialog'),'rest returns control before the observation');advance(15000);
assert(screen.getByRole('dialog').textContent.includes('Making a bed on a bench'));
assert(!read('street-life-discovered-v1').includes('shelter'));
click('Ask how they get through the night');
assert.equal(screen.getByRole('dialog').querySelector('.result-description').textContent,'Night Shelter offers a bed, meals and a shower. Try to arrive before 18:00, as places are limited.');
assert.equal(screen.getByRole('dialog').querySelectorAll('.result-description').length,1,'bench shelter discovery uses one shared service paragraph');
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
assert(screen.getByRole('dialog').textContent.includes('You look at the departure board'));
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
 setup({minutes:1385},{'street-life-discovered-v1':['street','station','shop'],[firstNightKey]:{seen:['first-night-bench'],lastAt:1385,pendingId:'first-night-bench'}});
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
 ['door',['neighbour-decline','neighbour-help','neighbour-supplies'],[0,5,5]],
 ['station',['station-seat','station-night','station-quiet'],[5,10,5]],
 ['bench-wake',['wake-sit','wake-move','wake-moment'],[5,10,5]],
]) for(let index=0;index<assets.length;index++) {
 setup({minutes:1385},{'street-life-discovered-v1':['street','station','shop'],[firstNightKey]:{seen:[`first-night-${id}`],lastAt:1385,pendingId:`first-night-${id}`}});
 assert(document.querySelector('.event-illustration').src.endsWith(id==='door'?'event-neighbour-meeting-480.webp':`event-first-night-${id}-480.webp`));
 const eventDefinition=require('../helpers/build.cjs').buildSync({entryPoints:['src/events.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false}).outputFiles[0].text;
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
assert(document.querySelector('.event-illustration').src.endsWith('event-neighbour-meeting-480.webp'));
click('Let me help with those bags.');
assert(document.querySelector('.result-overlay'));
assert(document.querySelector('.game-background[inert]'));
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
assert(screen.getByRole('dialog').contains(document.activeElement));
ok();assert(!document.querySelector('.game-background[inert]'));assert(!document.querySelector('.bottom-nav[inert]'));
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>!button.disabled));
click('Map');assert(document.querySelector('.map-surface'));
// Rain modal/background locking is checked for all intensity/choice pairs in check-rain.cjs.

// First-night boundaries and awake/bench-sleep eligibility are explicit.
setup({day:2,minutes:60},{'street-life-trip-v1':{destinationId:'station',mode:'walk',total:65,remaining:20}});Math.random=()=>.4;advanceTravelMinutes(20);ok();
assert(screen.getByRole('dialog').textContent.includes('The last departures'));
const eventModule={exports:{}};
new Function('module','exports',require('../helpers/build.cjs').buildSync({entryPoints:['src/events.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false}).outputFiles[0].text)(eventModule,eventModule.exports);
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
assert(!observationEvents.some(e=>e.id==='useful-tip'));
const benchWake=observationEvents.find(e=>e.id==='first-night-bench-wake');
assert(benchWake.eligible({...context,sleepKind:'bench'}));
assert(!benchWake.eligible({...context,sleepKind:'ground'}));
assert(!benchWake.eligible({...context,firstNight:false,sleepKind:'bench'}));
// Every eligible catalog event now resolves to a real, responsive scene and outcome.
const fs=require('node:fs');
const stripArt=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='illustration'?undefined:item));
for(const original of observationEvents) {
 if(original.continuationOnly)continue; // Branch-only artwork is exercised in check-events.cjs.
 const first=original.id.startsWith('first-night-');
 const artContext={day:2,locationId:['night-patrol','park-company','borrow-phone','dropped-glove','night-rustle','city-waking','street-patrol-wake'].includes(original.id)||first&&original.trigger!=='location'?'street':'station',minutes:original.id==='city-waking'?480:['night-patrol','park-company','borrow-phone'].includes(original.id)?60:original.id==='night-rustle'?1380:first?1350:1200,temperature:5,elapsedMinutes:30,observation:'idle',weather:'Rain',housing:'Street',documents:true,firstNight:first,nearHome:true,sleepKind:'bench',travelMode:original.id==='ticket-check'?'transit':'walk',seenEventIds:observationEvents.filter(e=>e.id!==original.id).map(e=>e.id)};
 Math.random=()=>0;
 const chosen=eventModule.exports.nextStreetEvent(original.trigger,artContext);
 assert.equal(chosen?.id,original.id);
 if (original.id==='dropped-glove') { assert(!chosen.illustration); continue }
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
 click('Try to catch it · Reflex DC 11');Math.random=()=>roll;fireEvent.click(document.querySelector('.dice-attempt'));click('Continue');
 assert(document.querySelector('.result-illustration').src.endsWith(`event-phone-${art}-480.webp`));
 assert.equal(read(invKey).phoneCondition,phoneBefore-damage);
 ok();
}

// Ordinary actions leave 5–15 real seconds of free control after the result.
const deferredKey='street-life-encounters-v1';
const finishedScenes=JSON.parse(require('../../test-fixtures/v332-saves.json').base[deferredKey]);
const cleaningOnly={...finishedScenes,lastAt:null,pendingId:null,seen:finishedScenes.seen.filter(id=>id!=='station-cleaning')};
for(const [draw,delay] of [[0,5000],[.999999,15000]]) {
 setup({day:3,minutes:600,locationId:'station'},{[deferredKey]:cleaningOnly});
 Math.random=()=>draw;click(/Sit and recover/);
 assert(!read(deferredKey).seen.includes('station-cleaning'));assert.equal(read(deferredKey).pendingId,null);
 assert(read(deferredKey).deferred.delayMs>=5000&&read(deferredKey).deferred.delayMs<=15000);
 const resultTime=read(stateKey);advance(30000);assert.deepEqual(read(stateKey),resultTime);
 assert.equal(read(deferredKey).deferred.remainingMs,read(deferredKey).deferred.delayMs,'reading the result does not consume the pause');
 ok();assert(!screen.queryByRole('dialog'));assert(!document.querySelector('.game-background[inert]'));
 advance(delay-1);assert(!screen.queryByRole('dialog'),'no scene before the free-control pause expires');
 advance(1);assert(screen.getByRole('dialog',{name:'Cleaning the hall'}));assert.equal(read(deferredKey).deferred,undefined);
}
// Starting another action resets the breathing space; only one observation is pending.
setup({day:3,minutes:600,locationId:'station'},{[deferredKey]:cleaningOnly});
Math.random=()=>0;click(/Sit and recover/);ok();advance(4000);click(/Sit and recover/);ok();
advance(4999);assert(!screen.queryByRole('dialog'));advance(1);assert(screen.getByRole('dialog',{name:'Cleaning the hall'}));
// Pauses survive StrictMode/reload without sampling again; leaving drops the old place's observation.
setup({day:3,minutes:600,locationId:'station'},{[deferredKey]:cleaningOnly});
Math.random=()=>0;click(/Sit and recover/);ok();advance(2000);
const pendingPause=read(deferredKey).deferred;
cleanup();Math.random=()=>{throw new Error('restoration must not resample a delay')};render(React.createElement(React.StrictMode,null,React.createElement(App)));
assert.deepEqual(read(deferredKey).deferred,pendingPause);advance(2000);assert(!screen.queryByRole('dialog'));advance(1000);assert(screen.getByRole('dialog',{name:'Cleaning the hall'}));
setup({day:3,minutes:600,locationId:'station'},{[deferredKey]:cleaningOnly});
Math.random=()=>0;click(/Sit and recover/);ok();advance(2000);
Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});fireEvent(document,new window.Event('visibilitychange'));advance(30000);
assert(!screen.queryByRole('dialog'));assert.equal(read(deferredKey).deferred.remainingMs,5000);
Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});fireEvent(document,new window.Event('visibilitychange'));
advance(4999);assert(!screen.queryByRole('dialog'));advance(1);assert(screen.getByRole('dialog',{name:'Cleaning the hall'}));
setup({day:3,minutes:600,locationId:'station'},{[deferredKey]:cleaningOnly});
Math.random=()=>0;click(/Sit and recover/);ok();click('Map');click('Street');click('Go to Street');
assert.equal(read(stateKey).locationId,'street');assert.equal(read(deferredKey).deferred,undefined);
advance(20000);assert(!screen.queryByRole('dialog'));assert(!read(deferredKey).seen.includes('station-cleaning'));
env.finish();
