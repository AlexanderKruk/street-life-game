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
function click(name){const dialog=screen.queryByRole('dialog');fireEvent.click(dialog ? within(dialog).getByRole('button',{name}) : screen.getByRole('button',{name}));}
function chooseHours(hours){fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:new RegExp('^'+hours+' h')}));}
function beginSleep(name,hours){click(name);if(hours!==undefined)chooseHours(hours);click('Start sleeping');}
function ok(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'OK',exact:true}));}
function advance(ms){for(let t=0;t<ms;t+=1000){now+=1000;act(()=>{for(const{fn}of [...callbacks.values()])fn()})}}
function report(name,evidence){console.log(JSON.stringify({name,evidence}));}


// One-level choices react immediately, while reading and deciding remain paused.
setup({minutes:1320,mood:28},{'street-life-discovered-v1':['street','station','shop']});
const phoneThought=screen.getByRole('button',{name:'Where can I get help in the morning?',exact:true});
assert.equal(phoneThought.querySelector('.choice-emoji').textContent,'📱');assert.equal(phoneThought.querySelector('.choice-emoji').getAttribute('aria-hidden'),'true');
assert(!screen.queryByRole('button',{name:'Choose another approach',exact:true}));assert(!screen.queryByRole('button',{name:'Other actions',exact:true}));assert(!document.querySelector('.location-summary + .event'));
const storyState=read(stateKey),storyInventory=read(invKey);advance(10000);assert.deepEqual(read(stateKey),storyState);assert.deepEqual(read(invKey),storyInventory);
click('Where can I get help in the morning?');assert(screen.getByRole('dialog'));assert.equal(read(stateKey).minutes,1325);assert.equal(read(stateKey).mood,33);const answerState=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),answerState);ok();assert(screen.getByRole('button',{name:'How can I get a shelter bed?',exact:true}));assert(!screen.queryByRole('button',{name:'Choose another approach',exact:true}));
setup({minutes:1320});assert(screen.getByRole('button',{name:/What about Night Shelter\? Maybe there is a place./}).disabled);
setup({minutes:1320});click(/Maybe the station\? At least I could sit down./);assert(screen.getByRole('button',{name:/Public transport/}));assert.equal(read(stateKey).minutes,1320);
// First-night wandering uses real walking costs; rain choices pause and persist.
setup({minutes:1320},{'street-life-discovered-v1':['street','station','shop'],[invKey]:{clothingCleanliness:80}});assert(!screen.queryByRole('button',{name:'Earn something for food',exact:true}));assert(screen.getByRole('button',{name:'Maybe the station? At least I could sit down.',exact:true}));const dryEnergy=read(stateKey).energy;click('Just one more street. I’m not ready to lie down.');assert.equal(read(stateKey).minutes,1350);assert(read(stateKey).energy<dryEnergy);assert(!read(stateKey).rainUntil);assert(Math.abs(read(invKey).clothingCleanliness-(80-30*30/1440))<1e-8);ok();assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));
setup({minutes:1320},{[invKey]:{clothingCleanliness:80}});Math.random=()=>0;click('Just one more street. I’m not ready to lie down.');assert.equal(read(stateKey).minutes,1350);assert.equal(read(stateKey).rainUntil,1515);assert(read(invKey).clothingCleanliness<75);assert.equal(read('street-life-journal-history-v1').length,1);ok();assert(screen.getByRole('dialog',{name:'Rain on the street'}));const rainyState=read(stateKey),rainyInventory=read(invKey);advance(10000);assert.deepEqual(read(stateKey),rainyState);assert.deepEqual(read(invKey),rainyInventory);cleanup();render(React.createElement(App));assert(screen.getByRole('dialog',{name:'Rain on the street'}));click('At least it looks dry under that canopy.');assert.equal(read(stateKey).minutes,1350);click(/Just fifteen minutes/);assert.equal(read(stateKey).minutes,1365);assert.equal(localStorage.getItem('street-life-rain-choice-v1'),'false');assert.equal(read(stateKey).rainUntil,1515);ok();assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));
setup({minutes:1320,rainUntil:1500});click('Just one more street. I’m not ready to lie down.');ok();click('Maybe the station? At least I could sit down.');assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));assert.equal(read(stateKey).minutes,1350);assert(screen.getByRole('button',{name:/Public transport/}));
setup({day:2,minutes:400,rainUntil:1700});advance(1000);assert.equal(read(stateKey).minutes,400); // street decision remains paused after rain expires
setup({day:2,minutes:240,rainUntil:2000});click('Just one more street. I’m not ready to lie down.');ok();click('At least it looks dry under that canopy.');const waitingBefore=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),waitingBefore);click(/Maybe four hours/);assert.equal(read(stateKey).minutes,510);assert(read(stateKey).energy<waitingBefore.energy);assert(!localStorage.getItem('street-life-sleep-v1'));assert(screen.getByRole('dialog').textContent.includes('You do not sleep'));assert.equal(read('street-life-journal-history-v1').length,2);
// Music and concrete answers lift opening Mood, with real phone/time costs.
setup({day:2,minutes:240});assert(document.querySelector('.story-scene').textContent.includes('Delivery vans'));assert(!document.querySelector('.story-scene').textContent.includes('It is past ten'));assert(screen.getByRole('button',{name:'Maybe the station? At least I could sit down.',exact:true}));assert(screen.getByRole('button',{name:'Just one more street. I’m not ready to lie down.',exact:true}));
setup({minutes:1320,mood:28});const musicBattery=read(invKey).phoneBattery;click(/Something familiar to listen to… I don’t want this silence./);assert.equal(read(stateKey).minutes,1350);assert(read(stateKey).mood>30 && read(stateKey).mood<=60);assert(read(invKey).phoneBattery<musicBattery);assert(screen.getByRole('dialog').textContent.includes('familiar music'));ok();
setup({minutes:1320},{[invKey]:{phoneBattery:0}});assert(screen.getByRole('button',{name:/Something familiar to listen to… I don’t want this silence./}).disabled);
setup({minutes:1320,mood:28},{'street-life-discovered-v1':['street','station','shop']});const questionBattery=read(invKey).phoneBattery;click('Where can I get help in the morning?');assert.equal(read(stateKey).minutes,1325);assert.equal(read(stateKey).mood,33);assert.equal(read(invKey).phoneBattery,questionBattery-1);assert(read('street-life-discovered-v1').includes('daycenter'));assert(screen.getByRole('dialog').textContent.includes('08:00'));ok();const rereadState=read(stateKey),rereadInventory=read(invKey);click(/Where can I get help in the morning/);assert.deepEqual(read(stateKey),rereadState);assert.deepEqual(read(invKey),rereadInventory);ok();cleanup();render(React.createElement(App));assert(read('street-life-answers-v1').includes('morning'));click('How can I get a shelter bed?');assert(screen.getByRole('dialog').textContent.includes('0–3'));assert.equal(read('street-life-goal-v1').minute,1140);ok();click('Reset save');assert.deepEqual(read('street-life-answers-v1'),[]);
// P1: referral opens map, including migration of a v53 save.
// Questions emerge from needs; remembering a station outlet does not need a charged phone.
setup({minutes:1320,mood:28},{'street-life-discovered-v1':['street','station','shop']});assert(!screen.queryByRole('button',{name:'Where can I charge my phone?',exact:true}));assert(!screen.queryByRole('button',{name:'Where can I get food and water?',exact:true}));assert(!screen.queryByRole('button',{name:'How can I get a shelter bed?',exact:true}));assert(!screen.queryByRole('button',{name:'What if the shelter has no places?',exact:true}));click('Where can I get help in the morning?');ok();assert(screen.getByRole('button',{name:'How can I get a shelter bed?',exact:true}));
setup({minutes:1320,thirst:45},{[invKey]:{phoneBattery:31}});assert(screen.getByRole('button',{name:'Where can I get food and water?',exact:true}));assert(!screen.queryByRole('button',{name:'Where can I charge my phone?',exact:true}));
setup({minutes:1320,mood:28},{[invKey]:{phoneBattery:0},'street-life-mobile-service-until':'0'});const rememberedState=read(stateKey);click('Where can I charge my phone?');assert.equal(read(stateKey).minutes,rememberedState.minutes);assert.equal(read(invKey).phoneBattery,0);assert(screen.getByRole('dialog').textContent.includes('waiting room'));assert(screen.getByRole('dialog').textContent.includes('60%'));const rememberedAfter=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),rememberedAfter);ok();assert(screen.getByRole('button',{name:'Where can I get help in the morning?',exact:true}).disabled);click('Where can I charge my phone?');assert.deepEqual(read(stateKey),rememberedAfter);ok();
setup({minutes:1320},{[invKey]:{phoneBattery:30}});click(/Inventory$/);click(/PhoneBattery/);click(/Ask AI/);assert(screen.getByRole('dialog').textContent.includes('08:00'));assert.equal(read(stateKey).minutes,1325);ok();assert(screen.getByRole('button',{name:'Where can I charge my phone?',exact:true}));
setup({locationId:'support'});click(/Housing/);ok();click(/Map$/);
for (const name of ['Cheap Shop','Night Shelter','Help Center','Day Work']) assert([...document.querySelectorAll('.city-map strong')].some(node=>node.textContent===name));
assert(read(lifeKey).schroniskoReferral);assert(document.querySelector('.city-map').textContent.includes('Schronisko'));
setup({}, {[lifeKey]:{schroniskoReferral:true}});click(/Map$/);assert(document.querySelector('.city-map').textContent.includes('Schronisko'));

// Sleep and immediate work must apply disease/dehydration and age both food stores.
setup({hunger:0,thirst:0,health:90,energy:20},{'street-life-effects-v1':[{id:'cold',expiresAt:10000}], [invKey]:{food:2,foodFreshness:100}, 'street-life-storage-v1':{food:2,foodFreshness:100}});
beginSleep(/Lie down here\? I’m not sure… But I could try./);click('Wake up (debug)');
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
setup({energy:.15},{[invKey]:{transitCard:false}});click(/Map$/);click(/^.*Station/);click(/Ride without/);const fareFrozen=read(stateKey);advance(3000);assert.deepEqual(read(stateKey),fareFrozen);assert(!document.querySelector('.sleep-overlay'));

// Auto renewal keeps prepaid time and money; expired service buys a full day.
setup({day:2},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'6000'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),6000);assert.equal(read(stateKey).money,100);
setup({day:2},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'1500'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),3360);assert.equal(read(stateKey).money,99);
setup({day:2,money:0},{'street-life-mobile-auto-renew':'true','street-life-mobile-renewed-day':'1','street-life-mobile-service-until':'6000'});
assert.equal(Number(localStorage.getItem('street-life-mobile-service-until')),6000);

// A paid trip resumes from remaining time with its original result snapshot.
setup({}, {[invKey]:{transitCard:false}});click(/Map$/);click(/^.*Station/);click(/Public transport/);advance(1000);const paid=read(stateKey).money,remaining=read('street-life-trip-v1').remaining;
cleanup();render(React.createElement(App));assert(document.querySelector('.travel-screen'));assert.equal(read(stateKey).money,paid);assert.equal(read('street-life-trip-v1').remaining,remaining);
advance(3000);assert.equal(read(stateKey).locationId,'station');assert(!localStorage.getItem('street-life-trip-v1'));assert(screen.getByRole('dialog').textContent.includes('−4.4 zł'));

// A valid transit card or an unexpired free-transit grant removes fare
// dodging and allows normal public transport without spending money.
for(const extra of [{[invKey]:{transitCard:true}}, {[invKey]:{transitCard:false},'street-life-effects-v1':[{id:'free-transit',expiresAt:500}]}]) {
 setup({money:0},extra);click(/Map$/);click(/^.*Station/);
 assert(!screen.queryByRole('button',{name:/Ride without/}));const transport=screen.getByRole('button',{name:/Public transport/});assert(!transport.disabled);assert(transport.textContent.includes('FREE'));
 click(/Public transport/);assert.equal(read(stateKey).money,0);assert.equal(read('street-life-trip-v1').mode,'transit');assert(!document.querySelector('.dice-overlay'));
}
setup({locationId:'shop'}, {[invKey]:{transitCard:false},'street-life-effects-v1':[{id:'free-transit',expiresAt:481}]});click(/Map$/);click(/^.*Station/);
assert(!screen.queryByRole('button',{name:/Ride without/}));advance(1000);assert(screen.getByRole('button',{name:/Ride without/}));assert(screen.getByRole('button',{name:/Public transport/}).textContent.includes('4.40 zł'));
click(/Public transport/);assert.equal(read(stateKey).money,95.6);
setup({money:0},{[invKey]:{transitCard:false},'street-life-effects-v1':[{id:'free-transit',expiresAt:479}]});click(/Map$/);click(/^.*Station/);
assert(screen.getByRole('button',{name:/Public transport/}).disabled);assert(screen.getByRole('button',{name:/Ride without/}));

// Three zloty buys 1.5 L of water: exactly three drinks of 0.5 L.
setup({locationId:'shop',thirst:0},{[invKey]:{water:0}});
assert(!screen.queryByText(/1.5 L|0.5 L/));assert(screen.getByText('Water ×3'));assert(!screen.queryByText('💧💧💧'));click('Buy Water for 3.00 zł');
assert.equal(read(stateKey).money,97);assert.equal(read(invKey).water,3);assert(screen.getByRole('dialog').textContent.includes('Water ×3'));assert(screen.getByRole('dialog').textContent.includes('+3'));ok();click(/Inventory$/);
assert(screen.getByText('Water ×3'));assert(!document.querySelector('.water-portions'));
for(const [remaining,thirst] of [[2,38],[1,76],[0,100]]) {
 click(/Water.*tap to drink/);assert.equal(read(invKey).water,remaining);assert.equal(read(stateKey).thirst,thirst);assert(screen.getByRole('dialog').textContent.includes('You drank water'));ok();
 if(remaining>0){assert(screen.getByText(`Water ×${remaining}`));cleanup();render(React.createElement(App));assert.equal(read(invKey).water,remaining);}
}
assert(!screen.queryByRole('button',{name:/Water.*tap to drink/}));
// A purchase fits only if all three portions fit in the backpack.
setup({locationId:'shop'},{[invKey]:{water:1,food:4,medicines:24}});assert(!screen.getByRole('button',{name:'Buy Water for 3.00 zł'}).disabled);click('Buy Water for 3.00 zł');assert.equal(read(invKey).water,4);assert.equal(read(stateKey).money,97);
setup({locationId:'shop'},{[invKey]:{water:2,food:4,medicines:24}});const fullPurchase=screen.getByRole('button',{name:'Buy Water for 3.00 zł'});assert(fullPurchase.disabled);fireEvent.click(fullPurchase);assert.equal(read(invKey).water,2);assert.equal(read(stateKey).money,100);
// Stealing the same 1.5 L item also adds all three servings.
setup({locationId:'shop'},{[invKey]:{water:0}});fireEvent.click(screen.getAllByRole('button',{name:'STEAL',exact:true})[0]);click('Roll D20');click('Continue');assert.equal(read(invKey).water,3);assert.equal(read(stateKey).money,100);

// New supplies migrate old saves, persist, and report actual gains/uses.
setup({locationId:'shop',hunger:20},{[invKey]:{water:2,food:0}});
assert.equal(read(invKey).water,2);for(const key of ['bread','cannedFood','wipes'])assert.equal(read(invKey)[key],0);
click('Buy Bread roll for 1.00 zł');assert.equal(read(stateKey).money,99);assert.equal(read(invKey).bread,1);assert(screen.getByRole('dialog').textContent.includes('Bread rolls'));ok();click(/Inventory$/);
click(/Bread roll.*tap to eat/);assert.equal(read(invKey).bread,0);assert.equal(read(invKey).breadFreshness,100);assert(screen.getByRole('dialog').textContent.includes('+12'));ok();
setup({locationId:'shop',hunger:20},{[invKey]:{cannedFood:0}});click('Buy Canned food for 6.00 zł');assert.equal(read(stateKey).money,94);assert.equal(read(invKey).cannedFood,1);ok();cleanup();render(React.createElement(App));assert.equal(read(invKey).cannedFood,1);click(/Inventory$/);click(/Canned food.*tap to eat/);assert.equal(read(invKey).cannedFood,0);assert(screen.getByRole('dialog').textContent.includes('+32'));ok();
setup({locationId:'shop',hygiene:55},{[invKey]:{wipes:0}});click('Buy Wet wipes for 5.00 zł');assert.equal(read(stateKey).money,95);assert.equal(read(invKey).wipes,5);assert(screen.getByRole('dialog').textContent.includes('+5'));ok();click(/Inventory$/);const hygieneBefore=read(stateKey).hygiene;click(/Wet wipes.*tap to clean/);assert.equal(read(invKey).wipes,4);assert.equal(read(stateKey).hygiene,60);assert(60-hygieneBefore<10);ok();const cappedWipes=screen.getByRole('button',{name:/Wet wipes.*find a shower/});assert(cappedWipes.disabled);fireEvent.click(cappedWipes);assert.equal(read(invKey).wipes,4);cleanup();render(React.createElement(App));assert.equal(read(invKey).wipes,4);
setup({hygiene:20},{[invKey]:{wipes:1}});click(/Inventory$/);click(/Wet wipes.*tap to clean/);assert.equal(read(stateKey).hygiene,30);assert.equal(read(invKey).wipes,0);ok();assert(!screen.queryByRole('button',{name:/Wet wipes/}));
// Bread ages separately; sealed canned food survives the same time advance.
setup({hunger:20,energy:20},{[invKey]:{bread:2,breadFreshness:100,cannedFood:1}});beginSleep(/Lie down here\? I’m not sure… But I could try./,8);advance(48000);ok();assert(Math.abs(read(invKey).breadFreshness-(100-100/1440*480))<1e-8);assert.equal(read(invKey).cannedFood,1);
for(const [freshness,gain,damage,mood] of [[100,12,0,0],[40,8,0,0],[0,4,3,-2]]) {
 setup({hunger:20},{[invKey]:{bread:1,breadFreshness:freshness}});click(/Inventory$/);click(/Bread roll.*tap to eat/);assert.equal(read(stateKey).hunger,20+gain);assert.equal(read(stateKey).health,82-damage);assert.equal(read(stateKey).mood,58+mood);assert.equal(read(invKey).breadFreshness,100);
}
// New items occupy backpack slots, for both purchase and theft.
for(const [name,price,key,quantity] of [['Bread roll','1.00','bread',1],['Canned food','6.00','cannedFood',1],['Wet wipes','5.00','wipes',5]]) {
 setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:24}});const full=screen.getByRole('button',{name:`Buy ${name} for ${price} zł`});assert(full.disabled);assert(screen.getByTitle(`Steal ${name}`).disabled);fireEvent.click(full);assert.equal(read(invKey)[key],0);assert.equal(read(stateKey).money,100);
 setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:20}});assert(!screen.getByRole('button',{name:`Buy ${name} for ${price} zł`}).disabled);fireEvent.click(screen.getByTitle(`Steal ${name}`));click('Roll D20');click('Continue');assert.equal(read(invKey)[key],quantity);assert.equal(read(stateKey).money,100);assert(screen.getByRole('dialog').textContent.includes(`+${quantity}`));
}
// Gel is twenty shower uses per bottle; older inventories acquire no free gel.
setup({locationId:'shop'},{[invKey]:{water:2}});assert.equal(read(invKey).showerGel,0);click('Buy 3-in-1 shower gel for 10.00 zł');assert.equal(read(stateKey).money,90);assert.equal(read(invKey).showerGel,20);assert(screen.getByRole('dialog').textContent.includes('+20'));ok();click(/Inventory$/);assert(screen.getByText('3-in-1 shower gel ×20').closest('.essentials-grid'));assert(!document.querySelector('.backpack-grid').textContent.includes('3-in-1 shower gel'));assert(!screen.queryByRole('button',{name:/3-in-1 shower gel/}));cleanup();render(React.createElement(App));assert.equal(read(invKey).showerGel,20);
setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:24}});assert(screen.getByRole('button',{name:'Buy 3-in-1 shower gel for 10.00 zł'}).disabled);assert(screen.getByTitle('Steal 3-in-1 shower gel').disabled);
setup({locationId:'shop'},{[invKey]:{showerGel:0}});fireEvent.click(screen.getByTitle('Steal 3-in-1 shower gel'));click('Roll D20');click('Continue');assert.equal(read(invKey).showerGel,20);assert.equal(read(stateKey).money,100);
setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:20,showerGel:0}});click('Buy 3-in-1 shower gel for 10.00 zł');assert.equal(read(invKey).showerGel,20);ok();assert(screen.getByRole('button',{name:'Buy 3-in-1 shower gel for 10.00 zł'}).disabled);assert.equal(read(stateKey).money,90);
// Both real showers use one gel only on success. Water-only repeats cannot exceed 70.
for(const [locationId,minutes,buttonName,duration] of [['daycenter',480,/Take a shower/,40],['shelter',1140,/Ask for a shower/,35]]) {
 const extra={[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}};
 setup({locationId,minutes,hygiene:55},{...extra,[invKey]:{showerGel:0}});Math.random=()=>.85;click(buttonName);assert.equal(read(stateKey).hygiene,70);assert.equal(read(invKey).showerGel,0);assert.equal(read(stateKey).minutes,minutes+duration);assert(screen.getByRole('dialog').textContent.includes('water only'));ok();click(buttonName);assert.equal(read(stateKey).hygiene,70);
 setup({locationId,minutes,hygiene:55},{...extra,[invKey]:{showerGel:2}});Math.random=()=>.85;assert(screen.getByRole('button',{name:buttonName}).textContent.includes('max 100'));click(buttonName);assert.equal(read(stateKey).hygiene,100);assert.equal(read(invKey).showerGel,1);assert.equal(read(stateKey).minutes,minutes+duration);assert(screen.getByRole('dialog').textContent.includes('gel uses'));assert(screen.getByRole('dialog').textContent.includes('−1'));ok();cleanup();render(React.createElement(App));assert.equal(read(invKey).showerGel,1);
 setup({locationId,minutes,hygiene:90},{...extra,[invKey]:{showerGel:0}});Math.random=()=>.85;click(buttonName);assert(read(stateKey).hygiene>89);assert(read(stateKey).hygiene<=90);
}
// From a dirty baseline, gel gives a larger gain, rather than changing only the cap.
setup({locationId:'daycenter',hygiene:10},{[invKey]:{showerGel:1}});Math.random=()=>.85;click(/Take a shower/);assert(read(stateKey).hygiene>84 && read(stateKey).hygiene<85);assert.equal(read(invKey).showerGel,0);
setup({locationId:'daycenter',hygiene:55},{[invKey]:{showerGel:2}});Math.random=()=>.99;click(/Take a shower/);assert.equal(read(invKey).showerGel,2);assert.equal(read(stateKey).minutes,495);assert(read(stateKey).hygiene<55);assert(screen.getByRole('dialog').textContent.includes('full right now'));
setup({locationId:'shelter',minutes:1320},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7},[invKey]:{showerGel:2}});const closedShower=screen.getByRole('button',{name:/Ask for a shower/});assert(closedShower.disabled);fireEvent.click(closedShower);assert.equal(read(invKey).showerGel,2);

// Hot meals cost exactly 8 zł and keep the original 15-minute/Well-fed effects.
setup({locationId:'shop',money:8,hunger:20});assert(!screen.getByRole('button',{name:/Hot meal.*8.00 zł/}).disabled);click(/Hot meal.*8.00 zł/);assert.equal(read(stateKey).money,0);assert.equal(read(stateKey).minutes,495);assert(read('street-life-effects-v1').some(e=>e.id==='well-fed'));assert(screen.getByRole('dialog').textContent.includes('−8 zł'));
setup({locationId:'shop',money:7.99});assert(screen.getByRole('button',{name:/Hot meal.*8.00 zł/}).disabled);

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
setup();for(let i=0;i<3;i++){click(/Ask someone for change\? It’s hard, but I could try./);ok();}assert(screen.getByRole('button',{name:/Ask someone for change\? It’s hard, but I could try./}).disabled);
cleanup();render(React.createElement(App));assert(screen.getByRole('button',{name:/Ask someone for change\? It’s hard, but I could try./}).disabled);
setup({day:2},{'street-life-begging-v1':{day:1,attempts:3}});assert(!screen.getByRole('button',{name:/Ask someone for change\? It’s hard, but I could try./}).disabled);click(/Ask someone for change\? It’s hard, but I could try./);assert.deepEqual(read('street-life-begging-v1'),{day:2,attempts:1});

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
setup({}, {'street-life-mobile-service-until':'0','street-life-discovered-v1':['street','station','shop']});availableFirst();assert(screen.getByRole('button',{name:/There must be somewhere to sleep… Let me look./}).disabled);
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
click('Cancel');assert(!screen.queryByRole('dialog'));assert.deepEqual(read(stateKey),planState);advance(1000);assert.equal(read(stateKey).minutes,1410);
setup({minutes:1410});click(/Lie down here\? I’m not sure… But I could try./);chooseHours(2);click('Start sleeping');
assert.equal(read('street-life-sleep-v1').total,120);assert.equal(read('street-life-sleep-v1').startAbsolute,1410);assert(!document.querySelector('.sleep-choice-modal'));
advance(1000);assert.equal(read(stateKey).minutes,1420);

// Cancelling a reserved bed never marks attendance. The shortened shelter
// duration shown in the chooser is exactly the duration that starts.
const notAdmitted={...booking,housing:'Street',shelterLastStayDay:0};
setup({day:2,locationId:'shelter',minutes:30,energy:20},{[lifeKey]:admitted});click(/Use your reserved bed/);
chooseHours(6);assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 06:30'));
chooseHours(8);
assert(document.querySelector('.sleep-choice-preview').textContent.includes('Day 2 Tu · 07:30'));assert(document.querySelector('.sleep-choice-modal').textContent.includes('Sleep time: 7h'));
click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,420);
setup({locationId:'shelter',minutes:1140},{[lifeKey]:notAdmitted});click(/Use your reserved bed/);advance(10000);click('Cancel');assert.equal(read(lifeKey).shelterLastStayDay,0);assert.equal(read(lifeKey).housing,'Street');assert.equal(read(stateKey).minutes,1140);
click(/Use your reserved bed/);fireEvent.keyDown(window,{key:'Escape'});assert(!screen.queryByRole('dialog'));assert.equal(read(lifeKey).shelterLastStayDay,0);
click(/Use your reserved bed/);click('Start sleeping');assert.equal(read(lifeKey).shelterLastStayDay,1);assert.equal(read(lifeKey).housing,'Night shelter');

// Station, street bench and Schronisko all use the same paused chooser.
setup({locationId:'station',minutes:1380});beginSleep(/Try to sleep/,2);assert.equal(read('street-life-sleep-v1').kind,'bench');assert.equal(read('street-life-sleep-v1').total,120);
setup();Math.random=()=>0;click(/Is there a bench nearby\? My legs could use a break./);ok();Math.random=()=>.99;click(/Could I sleep here\? What about my backpack…/);assert(screen.getByLabelText('Sleep duration'));click('Start sleeping');assert.equal(read('street-life-sleep-v1').kind,'bench');
setup({locationId:'residential-shelter',minutes:449});click(/Sleep safely/);chooseHours(2);assert(document.querySelector('.sleep-choice-preview').textContent.includes('09:29'));click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,120);

// Fatigue gates both short and long choices, including exact thresholds.
for(const [energy,allowed] of [[100,[2]],[75.01,[2]],[75,[2,4]],[50.01,[2,4]],[50,[4,6]],[25.01,[4,6]],[25,[6,8]],[1,[6,8]]]) {
 setup({energy,minutes:1200});click(/Lie down here\? I’m not sure… But I could try./);
 const group=screen.getByRole('group',{name:'Sleep duration'});const options=within(group).getAllByRole('button');assert.equal(options.length,4);
 const enabled=options.filter(button=>!button.disabled).map(button=>Number(button.querySelector('strong').textContent.split(' ')[0]));assert.deepEqual(enabled,allowed);
 const selected=options.find(button=>button.getAttribute('aria-pressed')==='true');assert(allowed.includes(Number(selected.querySelector('strong').textContent.split(' ')[0])));
 const disabled=options.find(button=>button.disabled);assert(disabled.querySelector('em').textContent.includes(energy>50?'Not tired enough':'Too tired'));
 fireEvent.click(disabled);assert.equal(group.querySelector('[aria-pressed="true"]'),selected);assert(!localStorage.getItem('street-life-sleep-v1'));
 chooseHours(allowed[0]);advance(3000);assert.equal(read(stateKey).minutes,1200);click('Start sleeping');assert.equal(read('street-life-sleep-v1').total,allowed[0]*60);
}
setup({energy:0});assert.equal(read('street-life-sleep-v1').total,480);assert(!document.querySelector('.sleep-choice-modal'));

// Unified time gives identical results for large blocks and minute ticks,
// including effect expiry, weather change and crossing midnight.
require('esbuild').buildSync({entryPoints:['src/game.ts'],bundle:true,platform:'node',format:'cjs',outfile:'regression-game.cjs'});
const {advanceTime,initialState,createInitialState}=require('./regression-game.cjs');
const beforeMoneyRandom=Math.random;
for(let amount=25;amount<=50;amount++){Math.random=()=>(amount-25+.5)/26;assert.equal(createInitialState().money,amount);}
Math.random=()=>0;assert.equal(createInitialState().money,25);Math.random=()=>.999999;assert.equal(createInitialState().money,50);Math.random=beforeMoneyRandom;
cleanup();localStorage.clear();localStorage.setItem('street-life-mobile-auto-renew','false');Math.random=()=>0;render(React.createElement(App));assert.equal(read(stateKey).money,25);cleanup();Math.random=()=>.99;render(React.createElement(App));assert.equal(read(stateKey).money,25);click('Reset save');assert.equal(read(stateKey).money,49);assert.equal(read(stateKey).minutes,1320);cleanup();render(React.createElement(App));assert.equal(read(stateKey).money,49);setup({money:100});assert.equal(read(stateKey).money,100);
assert.equal(initialState.health,90);assert.equal(initialState.hygiene,75);assert.equal(initialState.mood,28);
const timedRain=advanceTime({...initialState,minutes:1320,rainUntil:1321,energy:100,health:100},2);
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
// Today records completed actions exactly once, preserves reloads and separates days.
const historyKey='street-life-journal-history-v1';
setup({locationId:'shop',minutes:600},{[invKey]:{water:0}});assert.deepEqual(read(historyKey),[]);click('Buy Water for 3.00 zł');assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].minute,603);assert.equal(read(historyKey)[0].day,1);assert.equal(read(historyKey)[0].title,'Buy Water');assert(read(historyKey)[0].summary.costs.some(change=>change.label.includes('Money') && change.value==='−3 zł'));ok();click(/Inventory$/);click(/Water.*tap to drink/);assert.equal(read(historyKey).length,2);ok();click(/Journal$/);assert(document.querySelector('.timeline').textContent.includes('Buy Water'));assert(document.querySelector('.timeline').textContent.includes('Drink water'));assert(!document.querySelector('.timeline').textContent.includes('Woke up at the station'));cleanup();render(React.createElement(App));assert.equal(read(historyKey).length,2);
const yesterday=read(historyKey);setup({day:2},{[historyKey]:yesterday});click(/Journal$/);assert(!document.querySelector('.timeline').textContent.includes('Buy Water'));assert(screen.getByText('No recorded actions today yet.'));assert.equal(read(historyKey).length,2);click('Reset save');assert.deepEqual(read(historyKey),[]);
setup({minutes:1380,energy:90});beginSleep(/Lie down here\? I’m not sure… But I could try./,2);assert.deepEqual(read(historyKey),[]);click('Wake up (debug)');assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].day,2);assert.equal(read(historyKey)[0].minute,60);assert.equal(read(historyKey)[0].title,'Sleep complete');
// Journal goals follow real progress, stay completed, and reminders expire sensibly.
const journalKey='street-life-journal-goals-v1',reminderKey='street-life-goal-v1';
setup({minutes:600});click(/Journal$/);assert(document.querySelector('.journal-section-title').textContent.includes('0 / 4'));assert(!within(document.querySelector('.goal-list')).getByText('Get through the morning').closest('.goal').classList.contains('done'));
setup({day:1,minutes:1320});assert(!read(journalKey).morning);
setup({day:2,minutes:719});assert(!read(journalKey).morning);
setup({day:2,minutes:720});assert(read(journalKey).morning);
setup({locationId:'shelter',minutes:1140},{[lifeKey]:{housing:'Street',shelterRegistrationAttemptDay:1,shelterVacancies:0}});assert(!read(journalKey).shelter);
setup({locationId:'street'},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}});assert(read(journalKey).shelter);
setup({locationId:'support',minutes:1000});assert(!read(journalKey).support);
setup({locationId:'support',minutes:600});assert(read(journalKey).support);click(/Journal$/);assert(within(document.querySelector('.goal-list')).getByText('Visit social support').closest('.goal').classList.contains('done'));cleanup();render(React.createElement(App));assert(read(journalKey).support);
setup({locationId:'work',minutes:1200});assert(!read(journalKey).work);
setup({locationId:'street',minutes:600},{'street-life-discovered-v1':['street','station','shop']});click(/Could I find a little work\? I need to keep some money./);assert(read(journalKey).work);ok();
setup({locationId:'street',day:2,minutes:1000},{[journalKey]:{morning:true,shelter:true,support:true,work:true}});click(/Journal$/);assert(document.querySelector('.journal-section-title').textContent.includes('4 / 4'));assert(screen.getByText('All starting goals completed'));
click('Reset save');assert.deepEqual(read(journalKey),{morning:false,shelter:false,support:false,work:false});
assert.equal(read(stateKey).minutes,1320);assert.equal(read(stateKey).day,1);assert.equal(read(stateKey).locationId,'street');assert(document.querySelector('.story-scene').textContent.includes('There is nowhere to go back to'));cleanup();localStorage.clear();render(React.createElement(App));assert.equal(read(stateKey).minutes,1320);assert.equal(read(stateKey).day,1);assert(!read(journalKey).morning);
setup({day:2,minutes:600},{[reminderKey]:{type:'night-shelter',day:1,minute:1140}});assert.equal(read(reminderKey).day,2);
setup({locationId:'shelter',day:2,minutes:1140},{[reminderKey]:{type:'night-shelter',day:2,minute:1140}});assert(!localStorage.getItem(reminderKey));assert(!read(journalKey).shelter);
// Clothing caps every gain, migrates wear, and laundry cleans without repairing it.
setup({hygiene:90},{[invKey]:{jacket:42}});assert.equal(read(invKey).jacket,42);assert.equal(read(invKey).clothingCleanliness,90);assert.equal(read(stateKey).hygiene,90);
for(const [cleanliness,cap] of [[80,100],[60,80],[20,60]]) {
 setup({locationId:'daycenter',hygiene:55},{[invKey]:{clothingCleanliness:cleanliness,showerGel:2}});Math.random=()=>.85;click(/Take a shower/);assert.equal(read(stateKey).hygiene,cap);assert.equal(read(invKey).showerGel,1);ok();cleanup();render(React.createElement(App));assert.equal(read(stateKey).hygiene,cap);
}
setup({hygiene:95},{[invKey]:{clothingCleanliness:39,wipes:1}});assert.equal(read(stateKey).hygiene,60);click(/Inventory$/);assert(screen.getByText('Clothing'));assert(screen.getByRole('button',{name:/Wet wipes/}).disabled);
setup({locationId:'daycenter',hygiene:50},{[invKey]:{clothingCleanliness:10,jacket:42}});Math.random=()=>.85;click(/Do laundry/);assert.equal(read(invKey).clothingCleanliness,100);assert.equal(read(invKey).jacket,42);assert(read(stateKey).hygiene<100);assert(screen.getByRole('dialog').textContent.includes('Clothing cleanliness'));ok();
setup({locationId:'daycenter'},{[invKey]:{clothingCleanliness:10}});Math.random=()=>.99;click(/Do laundry/);assert(read(invKey).clothingCleanliness<10);
setup({locationId:'shelter',day:4,minutes:1080},{[invKey]:{clothingCleanliness:10,jacket:42},[lifeKey]:{housing:'Night shelter',shelterUntilDay:7,shelterLaundryDropDay:4}});click(/Collect clean laundry/);assert.equal(read(invKey).clothingCleanliness,100);assert.equal(read(invKey).jacket,42);ok();assert(screen.getByRole('button',{name:/Collect clean laundry/}).disabled);
setup({locationId:'shelter',day:4,minutes:390},{[invKey]:{clothingCleanliness:10},[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}});click(/Leave clothes for laundry/);assert(read(invKey).clothingCleanliness<10);
setup({energy:68},{[invKey]:{clothingCleanliness:100}});beginSleep(/Lie down here\? I’m not sure… But I could try./,4);click('Wake up (debug)');near(read(invKey).clothingCleanliness,90);
cleanup();dom.window.close();console.log('PASS: review regressions and clothing cleanliness, hygiene caps, laundry, migration and outdoor sleep.');
