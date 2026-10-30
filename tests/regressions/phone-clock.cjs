const env = require('../helpers/regression-env.cjs');
const { phoneSearchButton, React, render, screen, fireEvent, within, cleanup, assert, App, stateKey, invKey, lifeKey, read, setup, click, ok, advance, advanceTravelMinutes, assertResultLocked, discoverHelp } = env;
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
 const closingEntry=read('street-life-journal-history-v1').find(entry=>entry.actionTitle==='Closing time');
 assert(/\bI\b/.test(closingEntry.text));assert(!/\bYou\b/.test(closingEntry.text),'History keeps the hero’s first-person voice');
}
setup({locationId:'shop',minutes:1319},{[invKey]:{water:0}});click('Buy Water for 3.00 zł');
assert.equal(read(stateKey).locationId,'street');assert.equal(read(invKey).water,3);assert.equal(read(stateKey).money,97);
assert(screen.getByRole('dialog').textContent.includes('You pay for your supplies'));ok();assert(screen.getByRole('dialog').textContent.includes('has closed'));ok();
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
setup({day:6,minutes:1436,mood:28},{'street-life-discovered-v1':['street','station','shop']});
const phoneBefore=read(stateKey), batteryBefore=read(invKey).phoneBattery;Math.random=()=>0;
fireEvent.click(phoneSearchButton('Help & hygiene'));
assert(document.querySelector('.phone-activity'));assert(screen.getByRole('dialog',{name:'Looking for information'}));assert(document.querySelector('.phone-screen[inert]'));assert.equal(document.body.style.overflow,'hidden');
assert(document.querySelector('.phone-screen, .street-art img'));
assert(document.querySelector('.phone-screen[inert]'));
assert.equal(read(stateKey).minutes,1436);assert.equal(read(invKey).phoneBattery,batteryBefore);
assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
advance(1000);assert.equal(read(stateKey).day,7);assert.equal(read(stateKey).minutes,0);
assert(!screen.queryByRole('dialog',{name:'Rain on the street'}), 'calendar midnight alone does not create a rain event');
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
assert(document.querySelector('[data-resource-id="wetness"]').getAttribute('aria-label').includes('Clothing wetness'));
assert.equal(document.querySelectorAll('.compact-info-heading').length,1);assert.equal(document.querySelectorAll('.result-place').length,0);assert(!read('street-life-discovered-v1').includes('free-clinic'));assert(!read('street-life-discovered-v1').includes('daycenter'));assert(!document.querySelector('.result-details'));
assert(document.querySelector('.phone-screen, .street-art img'));
assert(!screen.getByRole('dialog').querySelector('[data-resource-id="time"]'));const completed=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),completed);
ok();assert(document.querySelector('.street-art img'));assert(!document.querySelector('.phone-activity-overlay'));assert.equal(document.body.style.overflow,'');
click(/Inventory$/);click('Phone');click('Find Help');click('Help & hygiene');assert(!document.querySelector('.phone-activity'));assert.equal(read(stateKey).minutes,completed.minutes+15);assert(read('street-life-discovered-v1').includes('daycenter'));
assert.equal(document.querySelectorAll('.result-indicators').length,1);ok();discoverHelp();click('How can I get a shelter bed?');assert.equal(document.querySelectorAll('.compact-info-heading').length,1);assert(!document.querySelector('.result-place'));assert(!document.querySelector('.result-details'));ok();
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
 assert(!screen.getByRole('dialog').querySelector('[data-resource-id="time"]'),'search duration remains a real cost without a badge');
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
assert(!document.querySelector('.phone-activity'));assert(!localStorage.getItem('street-life-phone-activity-v1'));
assert.equal(read(stateKey).minutes,1323,'reset cancels the search and resumes the ordinary Street clock');


env.finish();
