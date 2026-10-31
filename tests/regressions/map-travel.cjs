const env = require('../helpers/regression-env.cjs');
const { React, render, screen, fireEvent, within, cleanup, assert, App, stateKey, invKey, lifeKey, read, setup, click, ok, advance, advanceTravelMinutes } = env;
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

// Nearby shortcuts open the current location directly, or route to another place.
const streetShortcut=within(document.querySelector('.district-shortcuts')).getByRole('button',{name:'Street',exact:true});
assert(!streetShortcut.disabled);
fireEvent.click(streetShortcut);assert.deepEqual(read(stateKey),mapBefore);
assert(!document.querySelector('.district-map'));assert(!document.querySelector('.travel-sheet'));
click(/Map$/);
click('Shop');assert(document.querySelector('.travel-sheet'));
assert(!document.querySelector('.district-card'));
assert(document.querySelector('.travel-sheet').textContent.includes('Shop'));
assert.equal(read(stateKey).locationId,'street');
fireEvent.click(document.querySelector('.sheet-close'));
setup({locationId:'shop',minutes:600});click(/Map$/);
assert(!within(document.querySelector('.district-shortcuts')).getByRole('button',{name:'Shop',exact:true}).disabled);
const beforeExit=read(stateKey);
fireEvent.click(within(document.querySelector('.district-shortcuts')).getByRole('button',{name:'Shop',exact:true}));
assert(!document.querySelector('.travel-sheet'));assert.deepEqual(read(stateKey),beforeExit);
assert(!document.querySelector('.district-map'));assert(document.querySelector('.shop-hero'));
click(/Map$/);
click('Street');assert(!document.querySelector('.travel-sheet'));
assert(screen.getByRole('dialog',{name:'Leave Shop?'}));
assert(screen.getByText('TIME PAUSED'));assert(!screen.queryByText('You’ll step outside onto the street.'));
advance(3000);assert.deepEqual(read(stateKey),beforeExit);
click('Cancel');assert.deepEqual(read(stateKey),beforeExit);assert(!screen.queryByRole('dialog'));
click('Street');fireEvent.keyDown(document,{key:'Escape'});assert(!screen.queryByRole('dialog'));assert.deepEqual(read(stateKey),beforeExit);
click('Street');fireEvent.click(document.querySelector('.phone-overlay'));assert(!screen.queryByRole('dialog'));assert.deepEqual(read(stateKey),beforeExit);
click('Street');click('Go to Street');
assert(!document.querySelector('.district-card'));assert(!read('street-life-trip-v1'));
assert.deepEqual(read(stateKey),{...beforeExit,locationId:'street'});
assert(document.querySelector('.street-screen'));
for(const origin of ['station','hospital','free-clinic','daycenter','support','jobcenter','work','residential-shelter']) {
 setup({locationId:origin,minutes:600});click(/Map$/);
 const beforeStreet=read(stateKey);click('Street');assert.equal(read(stateKey).locationId,origin);click('Go to Street');
 assert.deepEqual(read(stateKey),{...beforeStreet,locationId:'street'});
 assert(!document.querySelector('.travel-sheet'));assert(!read('street-life-trip-v1'));
 assert(document.querySelector('.street-screen'));
}
setup({locationId:'station',minutes:600});click(/Map$/);
assert(!screen.getByRole('button',{name:'Street',exact:true}).disabled);
assert(!within(document.querySelector('.district-shortcuts')).getByRole('button',{name:'Shop',exact:true}).disabled);

// Cancelled routes must never count as a departure; actual walking does, once.
setup({locationId:'shelter',minutes:540},{[lifeKey]:{housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1,shelterStrikes:0}});
click(/Map$/);for(let i=0;i<3;i++){click(/^.*Station/);click("Go →");fireEvent.click(document.querySelector('.travel-sheet .sheet-close'));}
assert.equal(read(stateKey).locationId,'shelter');assert.equal(read(lifeKey).shelterStrikes,0);
click(/^.*Station/);click("Go →");click(/Walk/);assert.equal(read(lifeKey).shelterStrikes,1);


// D20 freezes time and prevents exhaustion, both before and after rolling.
setup({locationId:'shop',energy:.15});fireEvent.click(screen.getAllByRole('button',{name:'STEAL',exact:true})[0]);const frozen=read(stateKey);advance(3000);
assert.deepEqual(read(stateKey),frozen);assert(document.querySelector('.dice-overlay'));assert(!document.querySelector('.sleep-overlay'));
fireEvent.click(document.querySelector('.dice-attempt'));advance(3000);assert.deepEqual(read(stateKey),frozen);click('Continue');assert(read(stateKey).minutes > frozen.minutes);
setup({energy:.15},{[invKey]:{transitCard:false}});click(/Map$/);click(/^.*Station/);click("Go →");click(/Ride without/);assert(!document.querySelector('.dice-overlay'));const scheduledFare=read('street-life-trip-v1');advanceTravelMinutes(scheduledFare.inspection.at);assert(document.querySelector('.dice-overlay'));const fareFrozen=read(stateKey);advance(3000);assert.deepEqual(read(stateKey),fareFrozen);assert(!document.querySelector('.sleep-overlay'));

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
assert.deepEqual([...document.querySelectorAll('.phone-app-grid button')].map(button=>button.getAttribute('aria-label')),['Find Help','Goals','Notes','History','Settings']);
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
 let draws=0;Math.random=()=>draws++===0?draw:.99;click(mode==='fare-dodge'?/Ride without/:mode==='walk'?/Walk/:/Public transport/);
 const chosenTrip=read('street-life-trip-v1'),expected=mode==='walk'?(draw===0?62:78):(draw===0?32:39);
 assert.equal(chosenTrip.total,expected);assert.equal(chosenTrip.remaining,expected);
 assert.equal(read(stateKey).money,mode==='transit'?95.6:100);
 advanceTravelMinutes(1);const partialTrip=read('street-life-trip-v1');let reloadDraws=0;Math.random=()=>{reloadDraws++;return .5};
 cleanup();render(React.createElement(App));assert.equal(reloadDraws,0,'loading a trip never samples again');assert.deepEqual(read('street-life-trip-v1'),partialTrip);
 advanceTravelMinutes(1);assert.equal(read('street-life-trip-v1').remaining,expected-2);
 Math.random=()=>.99;if(mode==='fare-dodge'){advanceTravelMinutes(chosenTrip.inspection.at-2);fireEvent.click(document.querySelector('.dice-attempt'));click('Continue');ok();advanceTravelMinutes(expected-chosenTrip.inspection.at);}else advanceTravelMinutes(expected-2);assert.equal(read(stateKey).locationId,'station');assert.equal(read(stateKey).minutes,480+expected);assert(!localStorage.getItem('street-life-trip-v1'));ok();
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
 const awarded=read(stateKey);assert.equal(awarded.money,beforeCoin.money+grosz/100);assert(awarded.minutes>=beforeCoin.minutes+1&&awarded.minutes<=beforeCoin.minutes+3,'coin encounter charges its bounded duration exactly once');assert.deepEqual(read('street-life-trip-v1'),beforeCoinTrip);
 const denomination=grosz<100?`${grosz} gr`:`${grosz/100} zł`;assert(screen.getByRole('dialog').textContent.includes(`${denomination} coin`));
 assert(document.querySelector('.result-modal.illustrated-result .result-illustration').src.includes('event-coin-take'));
 assert(!document.querySelector('.coin-emblem'));
 assert.equal(document.querySelector('[data-resource-id="money"]').getAttribute('aria-label'),`Money +${grosz/100} zł`);
 assert.equal(document.querySelectorAll('.result-indicators [data-resource-id="money"]').length,1,'money is shown once in the shared gains list');
 assert(!document.querySelector('.result-details'),'the short result has no duplicate description');
 advance(1000);assert.equal(awardDraws,1);assert.deepEqual(read(stateKey),awarded);
 ok();cleanup();render(React.createElement(App));assert.equal(awardDraws,1);assert.equal(read(stateKey).money,awarded.money);assert(!document.querySelector('.event-overlay'));
}
setup({mood:28}, {'street-life-encounters-v1':{seen:['phone-drop'],lastAt:null,pendingId:null}});click('Map');click(/^.*Station/);click('Go →');const leaveCoinDraws=[.2,0,0];Math.random=()=>leaveCoinDraws.shift()??.99;click(/Walk/);
const leaveCoinBefore=read(stateKey);Math.random=()=>{throw new Error('Leaving a coin must not roll a reward')};click('Leave it');assert.equal(read(stateKey).money,leaveCoinBefore.money);assert.equal(read(stateKey).mood,leaveCoinBefore.mood+1);
assert(screen.getByRole('dialog').textContent.includes('You leave it for someone'));
assert(!document.querySelector('[data-resource-id="money"]'));assert(document.querySelector('.result-modal [data-resource-id="mood"]'));
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
 setup({minutes:600},{[invKey]:{transitCard:false}});click('Map');click('Shop');
 const options=document.querySelectorAll('.travel-option');assert.equal(options.length,3);for(const option of options)assert(option.textContent.includes('≈5–15m'));
 click(mode==='fare-dodge'?/Ride without ticket/:mode==='walk'?/^Walk/:/Public transport/);
 assert.equal(read('street-life-trip-v1').total,15);const original=read('street-life-trip-v1');cleanup();render(React.createElement(App));assert.deepEqual(read('street-life-trip-v1'),original);
 if(mode==='fare-dodge'){advanceTravelMinutes(original.inspection.at);fireEvent.click(document.querySelector('.dice-attempt'));click('Continue');ok();advanceTravelMinutes(15-original.inspection.at);}else advanceTravelMinutes(15);assert.equal(read(stateKey).locationId,'shop');assert.equal(read(stateKey).minutes,615);ok();
}
// Short walks retain ×4 travel and outdoor rain costs. No label sequence can
// delay arrival; reloading restores the text from saved progress.
setup({day:7,minutes:600,wetness:20},{'street-life-trip-v1':{destinationId:'shop',mode:'walk',total:5,remaining:5},'street-life-rain-response-v1':{episode:'weather:7',locationId:'street',sheltered:false}});
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
 let previous='',started=Date.now();const journeyStarted=Date.now(),durations=[];
 for(let minute=0;minute<total;minute++) {
  const label=document.querySelector('.travel-action-label').textContent;
  if(label!==previous){if(previous){durations.push(Date.now()-started);assert(Date.now()-started>=2000);}started=Date.now();previous=label;}
  assert.equal(!!document.querySelector('.travel-visual.walking.waiting'),label==='Red light');
  if(minute===42){cleanup();render(React.createElement(App));assert.equal(document.querySelector('.travel-action-label').textContent,label);}
  advance(249);assert.equal(read('street-life-trip-v1').remaining,total-minute);
  assert.equal(document.querySelector('.travel-action-label').textContent,label);
  advance(1);assert.equal(read(stateKey).minutes,601+minute);
 }
 assert(durations.some(ms=>ms>2000),'two seconds is a minimum, not a uniform label timer');assert.equal(Date.now()-journeyStarted,total*250);assert.equal(read(stateKey).locationId,'station');ok();
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
 setup({day:7,minutes:600,wetness:20},{'street-life-trip-v1':{destinationId:'shop',mode,total:10,remaining:10},'street-life-rain-response-v1':{episode:'weather:7',locationId:'street',sheltered:false}});
 advance(2*250);assert(Math.abs(read(stateKey).wetness-22)<1e-8);cleanup();render(React.createElement(App));
 advance(4*250);assert(Math.abs(read(stateKey).wetness-21.4)<1e-8);cleanup();render(React.createElement(App));
 advance(3*250);assert(Math.abs(read(stateKey).wetness-20.5)<1e-8);assert.equal(document.querySelector('.travel-action-label').textContent,'Final walk');
 advance(250);assert.equal(read(stateKey).locationId,'shop');assert(Math.abs(read(stateKey).wetness-21.5)<1e-8);ok();
}
// Rain starting at a covered stop does not interrupt waiting/riding, but the
// choice appears before stepping out into the rain for the final walking leg.
setup({day:6,minutes:1439,wetness:20},{'street-life-trip-v1':{destinationId:'shop',mode:'transit',total:10,remaining:8}});advance(250);assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));advance(7*250);assert.equal(read(stateKey).locationId,'shop');ok();
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




// Ticket checks happen inside the riding phase, pause progress, and retain the route.
for(const mode of ['transit','fare-dodge'])for(const rollDraw of [0,.99]) {
 const onlyTicket={seen:require('../../test-fixtures/v332-saves.json').base['street-life-encounters-v1']};
 const encounters=JSON.parse(onlyTicket.seen);encounters.seen=encounters.seen.filter(id=>id!=='ticket-check');
 setup({day:3,minutes:600},{[invKey]:{transitCard:false},'street-life-encounters-v1':encounters});
 click('Map');click(/^.*Station/);click('Go →');Math.random=()=>.5;
 click(mode==='transit'?/Public transport/:/Ride without ticket/);
 const started=read('street-life-trip-v1');assert(started.inspection);assert(!document.querySelector('.event-card'));assert(!document.querySelector('.dice-overlay'));
 const paidMoney=read(stateKey).money;
 advanceTravelMinutes(started.inspection.at-1);assert(!document.querySelector('.dice-overlay'));assert(!document.querySelector('.event-card'));
 advanceTravelMinutes(1);
 const during=read('street-life-trip-v1');assert(during.remaining>0&&during.remaining<during.total);
 const now=read(stateKey);advance(2500);assert.deepEqual(read(stateKey),now);assert.equal(read('street-life-trip-v1').remaining,during.remaining);
 cleanup();render(React.createElement(React.StrictMode,null,React.createElement(App)));
 assert.equal(read('street-life-trip-v1').remaining,during.remaining);
 if(mode==='transit') {
   assert(screen.getByRole('dialog',{name:'Ticket inspection'}));click(/Show.*ticket/);
 } else {
   assert(screen.getByRole('dialog',{name:'Avoid inspection'}));assert(!screen.queryByRole('button',{name:'Cancel',exact:true}));
   Math.random=()=>rollDraw;fireEvent.click(document.querySelector('.dice-attempt'));
   const savedRoll=read('street-life-trip-v1').inspection.roll;assert.equal(savedRoll,rollDraw===0?1:20);
   cleanup();let restoreDraws=0;Math.random=()=>{restoreDraws++;return .5};render(React.createElement(React.StrictMode,null,React.createElement(App)));
   assert.equal(restoreDraws,0);assert(screen.getByLabelText('Rolled '+savedRoll));click('Continue');
 }
 assert.equal(read('street-life-trip-v1').remaining,during.remaining);
 assert.deepEqual(read('street-life-trip-v1').before,started.before,'inspection does not replace the departure snapshot');
 const chargedMoney=read(stateKey).money;assert.equal(chargedMoney,mode==='fare-dodge'&&rollDraw===0?Math.max(0,paidMoney-35):paidMoney);
 ok();advanceTravelMinutes(during.remaining);assert.equal(read(stateKey).locationId,'station');
 assert.equal(read(stateKey).money,chargedMoney);assert.equal(read('street-life-trip-v1'),null);ok();
 cleanup();render(React.createElement(App));assert.equal(read(stateKey).money,chargedMoney);assert(!screen.queryByRole('dialog'));
}

env.finish();
