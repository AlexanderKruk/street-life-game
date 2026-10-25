const env = require('../helpers/regression-env.cjs');
const { React, render, screen, fireEvent, within, cleanup, assert, App, stateKey, invKey, lifeKey, read, ambientSceneIds, setup, click, chooseHours, beginSleep, ok, advance, callbacks, booking } = env;
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
setup({locationId:'shelter',minutes:1020},{[lifeKey]:vacancyKey(1)});click(/Map$/);click('Street');assert(read(arrivalKey));click('Go to Street');
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
setup({day:2,locationId:'shelter',minutes:30},{[lifeKey]:checkoutBooking,'street-life-sleep-v1':{kind:'shelter',startAbsolute:1470,total:480,remaining:480,realStartedAt:Date.now()-60000,realWakeAt:Date.now()+60000}});
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
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 1 Tu · 05:30'));
assert(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:/^8 h.*07:30/}));advance(3000);assert.deepEqual(read(stateKey),planState);
click('Cancel');assert(!screen.queryByRole('dialog'));assert.deepEqual(read(stateKey),planState);advance(1000);assert.equal(read(stateKey).minutes,1411,'cancelling sleep planning resumes the ordinary clock');
setup({minutes:1410});click(/Lie down here\? I’m not sure… But I could try./);chooseHours(2);click('Start sleeping');
assert.equal(read('street-life-sleep-v1').total,120);assert.equal(read('street-life-sleep-v1').startAbsolute,1410);assert(!document.querySelector('.sleep-choice-modal'));
advance(1000);assert.equal(read(stateKey).minutes,1420);

// Cancelling sleep preserves attendance already recorded at entrance. The shortened shelter
// duration shown in the chooser is exactly the duration that starts.
const notAdmitted={...booking,housing:'Street',shelterLastStayDay:0};
setup({day:2,locationId:'shelter',minutes:30,energy:20},{[lifeKey]:admitted});click(/Use your reserved bed/);
chooseHours(6);assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 1 Tu · 06:30'));
chooseHours(8);
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 1 Tu · 07:30'));assert(document.querySelector('.sleep-choice-modal').textContent.includes('Sleep time: 7h'));
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


env.finish();
