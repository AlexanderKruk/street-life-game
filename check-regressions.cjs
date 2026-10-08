const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});
global.IS_REACT_ACT_ENVIRONMENT=true;
let now=1800000000000, nextId=1;
Date.now=()=>now;
const callbacks=new Map();
window.setInterval=(fn,delay)=>{const id=nextId++;callbacks.set(id,{fn,delay});return id};
window.clearInterval=id=>callbacks.delete(id);
require('esbuild').buildSync({entryPoints:['src/App.tsx'],bundle:true,platform:'node',format:'cjs',outfile:'regression-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const React=require('react');
const {render,screen,fireEvent,within,act,cleanup,configure}=require('@testing-library/react');
configure({getElementError:message=>new Error(message)});
process.on('uncaughtException',error=>{console.error(error.message);cleanup();dom.window.close();process.exit(1)});
const assert=require('node:assert/strict');
const App=require('./regression-app.cjs').default;
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
}
function click(name){fireEvent.click(screen.getByRole('button',{name}));}
function beginSleep(name,hours=8){click(name);fireEvent.change(screen.getByLabelText('Sleep duration'),{target:{value:String(hours)}});click('Start sleeping');}
function ok(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'OK',exact:true}));}
function advance(ms){for(let t=0;t<ms;t+=1000){now+=1000;act(()=>{for(const{fn}of [...callbacks.values()])fn()})}}
function report(name,evidence){console.log(JSON.stringify({name,evidence}));}


// P1: referral opens map, including migration of a v53 save.
setup({locationId:'support'});click(/Housing/);ok();click(/Map$/);
assert(read(lifeKey).schroniskoReferral);assert(document.querySelector('.city-map').textContent.includes('Schronisko'));
setup({}, {[lifeKey]:{schroniskoReferral:true}});click(/Map$/);assert(document.querySelector('.city-map').textContent.includes('Schronisko'));

// Sleep and immediate work must apply disease/dehydration and age both food stores.
setup({hunger:0,thirst:0,health:90,energy:68},{'street-life-effects-v1':[{id:'cold',expiresAt:10000}], [invKey]:{food:2,foodFreshness:100}, 'street-life-storage-v1':{food:2,foodFreshness:100}});
beginSleep(/Sleep on the ground/);click('Wake up (debug)');
assert(Math.abs(read(stateKey).health - (90 - .147 * 480)) < 1e-8);
assert(Math.abs(read(invKey).foodFreshness - (100 - 100 / 2880 * 480)) < 1e-8);
assert(Math.abs(read('street-life-storage-v1').foodFreshness - read(invKey).foodFreshness) < 1e-8);
setup({locationId:'work',hunger:0,thirst:0,health:90,energy:75},{'street-life-effects-v1':[{id:'cold',expiresAt:10000}], [invKey]:{food:2,foodFreshness:100}});
click(/Take a short shift/);assert(Math.abs(read(stateKey).health - (90 - .147 * 180)) < 1e-8);assert(read(invKey).foodFreshness < 94);

// Cancelled routes must never count as a departure; actual walking does, once.
setup({locationId:'shelter',minutes:540},{[lifeKey]:{housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1,shelterStrikes:0}});
click(/Map$/);for(let i=0;i<3;i++){click(/^.*Station/);fireEvent.click(document.querySelector('.travel-sheet .sheet-close'));}
assert.equal(read(stateKey).locationId,'shelter');assert.equal(read(lifeKey).shelterStrikes,0);
click(/^.*Station/);click(/Walk/);assert.equal(read(lifeKey).shelterStrikes,1);


// D20 freezes time and prevents exhaustion, both before and after rolling.
setup({locationId:'shop',energy:.15});fireEvent.click(screen.getAllByRole('button',{name:'STEAL',exact:true})[0]);const frozen=read(stateKey);advance(3000);
assert.deepEqual(read(stateKey),frozen);assert(document.querySelector('.dice-overlay'));assert(!document.querySelector('.sleep-overlay'));
click('Roll D20');advance(3000);assert.deepEqual(read(stateKey),frozen);click('Continue');assert(read(stateKey).minutes > frozen.minutes);
setup({energy:.15});click(/Map$/);click(/^.*Station/);click(/Ride without/);const fareFrozen=read(stateKey);advance(3000);assert.deepEqual(read(stateKey),fareFrozen);assert(!document.querySelector('.sleep-overlay'));

// Auto renewal keeps prepaid time and money; expired service buys a full day.
setup({day:2},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'6000'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),6000);assert.equal(read(stateKey).money,100);
setup({day:2},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'1500'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),3360);assert.equal(read(stateKey).money,99);
setup({day:2,money:0},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'6000'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),6000);

// A paid trip resumes from remaining time with its original result snapshot.
setup();click(/Map$/);click(/^.*Station/);click(/Public transport/);advance(1000);const paid=read(stateKey).money,remaining=read('street-life-trip-v1').remaining;
cleanup();render(React.createElement(App));assert(document.querySelector('.travel-screen'));assert.equal(read(stateKey).money,paid);assert.equal(read('street-life-trip-v1').remaining,remaining);
advance(3000);assert.equal(read(stateKey).locationId,'station');assert(!localStorage.getItem('street-life-trip-v1'));assert(screen.getByRole('dialog').textContent.includes('−4.4 zł'));

// Fresh, stale and spoiled food have different effects; empty stacks reset freshness.
for(const [freshness,gain,damage,mood] of [[100,28,0,2],[40,20,0,0],[0,10,8,-4]]) {
  setup({hunger:20},{[invKey]:{food:1,foodFreshness:freshness}});click(/Inventory$/);click(/Food.*tap to eat/);
  assert.equal(read(stateKey).hunger,20+gain);assert.equal(read(stateKey).health,82-damage);assert.equal(read(stateKey).mood,58+mood);assert.equal(read(invKey).foodFreshness,100);
}


// Worker access follows appointment hours, not overnight accommodation hours.
const booking={housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterAuditDay:1,shelterLastStayDay:1};
setup({locationId:'shelter',minutes:1080},{[lifeKey]:booking});const worker=screen.getByRole('button',{name:/Talk to shelter social worker/});assert(worker.disabled);fireEvent.click(worker);assert.equal(read(stateKey).minutes,1080);
setup({day:2,locationId:'shelter',minutes:1020},{[lifeKey]:booking});assert(!screen.getByRole('button',{name:/Talk to shelter social worker/}).disabled);click(/Talk to shelter social worker/);assert.equal(read(stateKey).minutes,1020);advance(3000);assert.equal(read(stateKey).minutes,1020);
click(/I still cannot afford housing/);click(/I am looking for work/);click(/Go to the Job Centre/);assert.equal(read(stateKey).minutes,1050);assert.equal(read(lifeKey).shelterUntilDay,31);assert(screen.getByRole('dialog').textContent.includes('30 min'));

// Full backpack rejects new stacks; a partial stack still accepts food.
setup({locationId:'station'},{[invKey]:{food:4,water:4,medicines:24,cigarettes:0,bottles:0,foodFreshness:100}});Math.random=()=>.01;click(/Sit and recover/);ok();click('Accept');assert.equal(read(invKey).food,4);assert(screen.getByRole('dialog').textContent.includes('no backpack room'));
setup({locationId:'station'},{[invKey]:{food:3,water:4,medicines:24,cigarettes:0,bottles:0,foodFreshness:100}});Math.random=()=>.01;click(/Sit and recover/);ok();click('Accept');assert.equal(read(invKey).food,4);

// Daily begging allowance survives reload and resets only on the next game day.
setup();for(let i=0;i<3;i++){click(/Ask passers-by for money/);ok();}assert(screen.getByRole('button',{name:/Ask passers-by for money/}).disabled);
cleanup();render(React.createElement(App));assert(screen.getByRole('button',{name:/Ask passers-by for money/}).disabled);
setup({day:2},{'street-life-begging-v1':{day:1,attempts:3}});assert(!screen.getByRole('button',{name:/Ask passers-by for money/}).disabled);click(/Ask passers-by for money/);assert.deepEqual(read('street-life-begging-v1'),{day:2,attempts:1});

// Unregistered visitors only have registration, and must finish the full queue.
const vacancyKey=(slots)=>({shelterVacancyDay:1,shelterVacancies:slots});
setup({locationId:'shelter',minutes:1140},{[lifeKey]:vacancyKey(1)});
assert.equal(document.querySelectorAll('.actions .action').length,1);assert(!screen.queryByRole('button',{name:/shower/i}));assert(!document.querySelector('.storage-panel'));assert(!screen.queryByLabelText('Sleep duration'));
click(/Join registration queue/);assert(screen.getByRole('dialog',{name:'Shelter registration queue'}));assert(!read(lifeKey).shelterUntilDay);
advance(19000);assert.equal(read(stateKey).minutes,1159);assert(!read(lifeKey).shelterUntilDay);assert.equal(read('street-life-shelter-queue-v1').remaining,1);
advance(1000);assert.equal(read(stateKey).minutes,1160);assert.equal(read(lifeKey).shelterUntilDay,7);assert.equal(read(lifeKey).shelterLastStayDay,1);assert(!localStorage.getItem('street-life-shelter-queue-v1'));assert(screen.getByRole('dialog').textContent.includes('20 min'));ok();assert(screen.getByRole('button',{name:/Ask for a shower/}));assert(document.querySelector('.storage-panel'));assert(screen.getByRole('button',{name:/Use your reserved bed/}));

// No vacancies still costs twenty minutes; failed attempts cannot reroll today.
setup({locationId:'shelter',minutes:1140},{[lifeKey]:vacancyKey(0)});click(/Join registration queue/);advance(20000);
assert(!read(lifeKey).shelterUntilDay);assert(screen.getByRole('dialog').textContent.includes('no free places'));assert.equal(read(stateKey).minutes,1160);ok();assert(screen.getByRole('button',{name:/Join registration queue/}).disabled);
cleanup();render(React.createElement(App));assert.equal(read(lifeKey).shelterVacancies,0);assert(screen.getByRole('button',{name:/Join registration queue/}).disabled);

// Queue order reduces available places at later arrival times.
for(const [slots,minute,accepted] of [[1,1140,true],[1,1170,false],[2,1170,true],[2,1200,false],[3,1200,true],[3,1230,false]]) {
 setup({locationId:'shelter',minutes:minute},{[lifeKey]:vacancyKey(slots)});click(/Join registration queue/);advance(20000);assert.equal(!!read(lifeKey).shelterUntilDay,accepted);
}

// A reload keeps queue position, today's vacancies and remaining wait.
setup({locationId:'shelter',minutes:1140},{[lifeKey]:vacancyKey(2)});click(/Join registration queue/);advance(7000);const queued=read('street-life-shelter-queue-v1');
cleanup();Math.random=()=>0;render(React.createElement(App));assert.deepEqual(read('street-life-shelter-queue-v1'),queued);assert.equal(read(lifeKey).shelterVacancies,2);advance(12000);assert(!read(lifeKey).shelterUntilDay);advance(1000);assert.equal(read(lifeKey).shelterUntilDay,7);

// Tomorrow permits a new attempt; before registration hours the queue is closed.
setup({day:2,locationId:'shelter',minutes:1140},{[lifeKey]:{shelterRegistrationAttemptDay:1,shelterVacancyDay:2,shelterVacancies:1}});assert(!screen.getByRole('button',{name:/Join registration queue/}).disabled);
setup({locationId:'shelter',minutes:1139});assert(screen.getByRole('button',{name:/Join registration queue/}).disabled);
setup({locationId:'shelter',minutes:1320});assert(screen.getByRole('button',{name:/Join registration queue/}).disabled);

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
setup({day:2,locationId:'shelter',minutes:30},{[lifeKey]:{...booking,shelterLastStayDay:0}});assert(screen.getByRole('button',{name:/Use your reserved bed/}).disabled);
// Sorting also spans Street fragments and configured actions, plus support choices.
setup({}, {'street-life-mobile-service-until':'0','street-life-discovered-v1':['street','station','shop']});availableFirst();assert(screen.getByRole('button',{name:/Search online for a place to sleep/}).disabled);
setup({locationId:'support'},{[invKey]:{documents:false}});availableFirst('.support-grid');

// Morning reminder appears at 07:30, freezes the clock, and takes a full
// visible 30-minute checkout; reload keeps progress and the booking survives.
const departureKey='street-life-shelter-departure-v1';
const checkoutBooking={...booking,shelterLastStayDay:1,shelterStrikes:0};
setup({day:2,locationId:'shelter',minutes:449},{[lifeKey]:checkoutBooking,'street-life-storage-v1':{documents:true,medicines:2}});
assert(!screen.queryByRole('dialog',{name:'Leave the night shelter'}));advance(1000);
assert.equal(read(stateKey).minutes,450);assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));
const reminderState=read(stateKey);advance(5000);assert.deepEqual(read(stateKey),reminderState);
click(/Leave the night shelter · 30 min/);assert(screen.getByRole('dialog',{name:'Leaving the night shelter'}));
advance(11000);assert.equal(read(stateKey).minutes,461);assert.equal(read(stateKey).locationId,'shelter');
const departureSaved=read(departureKey);cleanup();render(React.createElement(App));assert.deepEqual(read(departureKey),departureSaved);
Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});advance(4000);assert.equal(read(stateKey).minutes,461);
Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});advance(18000);assert.equal(read(stateKey).minutes,479);assert.equal(read(stateKey).locationId,'shelter');
advance(1000);assert.equal(read(stateKey).minutes,480);assert.equal(read(stateKey).locationId,'street');
assert.equal(read(lifeKey).housing,'Street');assert.equal(read(lifeKey).shelterUntilDay,7);assert.equal(read(lifeKey).shelterStrikes,0);assert.equal(read(lifeKey).shelterCheckoutDay,2);
assert.equal(read('street-life-storage-v1').medicines,2);assert(!localStorage.getItem(departureKey));assert(screen.getByRole('dialog').textContent.includes('30 min'));assert(read(stateKey).thirst<reminderState.thirst);ok();
assert(!screen.queryByRole('dialog',{name:'Leave the night shelter'}));
setup({day:2,locationId:'shelter',minutes:451},{[lifeKey]:{...checkoutBooking,shelterCheckoutDay:2}});assert(!screen.queryByRole('dialog',{name:'Leave the night shelter'}));
setup({day:3,locationId:'shelter',minutes:450},{[lifeKey]:{...checkoutBooking,shelterLastStayDay:2,shelterCheckoutDay:2}});assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));

// Exhaustion cannot interrupt checkout; once outside, its result comes first.
setup({day:2,locationId:'shelter',minutes:450,energy:.01},{[lifeKey]:checkoutBooking});click(/Leave the night shelter · 30 min/);advance(29000);
assert.equal(read(stateKey).energy,0);assert(!localStorage.getItem('street-life-sleep-v1'));assert.equal(read(stateKey).locationId,'shelter');advance(1000);assert.equal(read(stateKey).locationId,'street');assert(screen.getByRole('dialog').textContent.includes('Shelter checkout'));

// Natural sleep, exhaustion, and a saved long sleep all wake by 07:30.
setup({day:2,locationId:'shelter',minutes:30},{[lifeKey]:checkoutBooking});beginSleep(/Use your reserved bed/);
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
setup({minutes:1410,energy:.01});assert(!screen.queryByLabelText('Sleep duration'));click(/Sleep on the ground/);
assert(screen.getByRole('dialog',{name:'How long do you want to sleep?'}));assert.equal(document.querySelectorAll('.actions select').length,0);
const planState=read(stateKey),planInventory=read(invKey);advance(12000);
assert.deepEqual(read(stateKey),planState);assert.deepEqual(read(invKey),planInventory);assert(!localStorage.getItem('street-life-sleep-v1'));
fireEvent.change(screen.getByLabelText('Sleep duration'),{target:{value:'2'}});
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 01:30'));
assert(screen.getByRole('option',{name:'10 h · wake Day 2 Tu · 09:30'}));advance(3000);assert.deepEqual(read(stateKey),planState);
click('Cancel');assert(!screen.queryByRole('dialog'));assert.deepEqual(read(stateKey),planState);advance(1000);assert.equal(read(stateKey).minutes,1411);
setup({minutes:1410});click(/Sleep on the ground/);fireEvent.change(screen.getByLabelText('Sleep duration'),{target:{value:'2'}});click('Start sleeping');
assert.equal(read('street-life-sleep-v1').total,120);assert.equal(read('street-life-sleep-v1').startAbsolute,1410);assert(!document.querySelector('.sleep-choice-modal'));
advance(1000);assert.equal(read(stateKey).minutes,1420);

// Cancelling a reserved bed never marks attendance. The shortened shelter
// duration shown in the chooser is exactly the duration that starts.
const notAdmitted={...booking,housing:'Street',shelterLastStayDay:0};
setup({locationId:'shelter',minutes:1380},{[lifeKey]:admitted});click(/Use your reserved bed/);
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 07:00'));
fireEvent.change(screen.getByLabelText('Sleep duration'),{target:{value:'10'}});
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 07:30'));assert(document.querySelector('.sleep-choice-modal').textContent.includes('Sleep time: 8h 30m'));
click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,510);
setup({locationId:'shelter',minutes:1140},{[lifeKey]:notAdmitted});click(/Use your reserved bed/);advance(10000);click('Cancel');assert.equal(read(lifeKey).shelterLastStayDay,0);assert.equal(read(lifeKey).housing,'Street');assert.equal(read(stateKey).minutes,1140);
click(/Use your reserved bed/);fireEvent.keyDown(window,{key:'Escape'});assert(!screen.queryByRole('dialog'));assert.equal(read(lifeKey).shelterLastStayDay,0);
click(/Use your reserved bed/);click('Start sleeping');assert.equal(read(lifeKey).shelterLastStayDay,1);assert.equal(read(lifeKey).housing,'Night shelter');

// Station, street bench and Schronisko all use the same paused chooser.
setup({locationId:'station',minutes:1380});beginSleep(/Try to sleep/,2);assert.equal(read('street-life-sleep-v1').kind,'bench');assert.equal(read('street-life-sleep-v1').total,120);
setup();Math.random=()=>0;click(/Look for a bench/);ok();Math.random=()=>.99;click(/Sleep on the bench/);assert(screen.getByLabelText('Sleep duration'));click('Start sleeping');assert.equal(read('street-life-sleep-v1').kind,'bench');
setup({locationId:'residential-shelter',minutes:449});click(/Sleep safely/);fireEvent.change(screen.getByLabelText('Sleep duration'),{target:{value:'2'}});assert(document.querySelector('.sleep-choice-preview').textContent.includes('09:29'));click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,120);

// Unified time gives identical results for large blocks and minute ticks,
// including effect expiry, weather change and crossing midnight.
require('esbuild').buildSync({entryPoints:['src/game.ts'],bundle:true,platform:'node',format:'cjs',outfile:'regression-game.cjs'});
const {advanceTime,initialState}=require('./regression-game.cjs');
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
cleanup();dom.window.close();console.log('PASS: review regressions, 24h Water / 48h Food / 36h Energy, shelter queues and morning checkout, paused sleep planning, schedule/daily limits, available-first lists, sleep and exertion.');
