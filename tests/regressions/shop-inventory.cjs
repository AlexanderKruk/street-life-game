const env = require('../helpers/regression-env.cjs');
const { React, render, screen, fireEvent, cleanup, assert, App, stateKey, invKey, lifeKey, read, setup, click, beginSleep, ok, advance, report, booking } = env;
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
assert.equal(read(stateKey).money,97);assert.equal(read(invKey).water,3);assert(document.querySelector('[data-resource-id="water"]').getAttribute('aria-label') === 'Water portions +3');assert(screen.getByRole('dialog').textContent.includes('+3'));ok();click(/Inventory$/);
assert(screen.getByRole('button',{name:/Water ×3.*tap to drink/}));assert(!document.querySelector('.water-portions'));
for(const [remaining,thirst] of [[2,38],[1,76],[0,100]]) {
 click(/Water.*tap to drink/);assert.equal(read(invKey).water,remaining);assert.equal(read(stateKey).thirst,thirst);assert(screen.getByRole('dialog').textContent.includes('You drink some water'));ok();
 if(remaining>0){assert(screen.getByRole('button',{name:new RegExp(`Water ×${remaining}.*tap to drink`)}));cleanup();render(React.createElement(App));assert.equal(read(invKey).water,remaining);}
}
assert(!screen.queryByRole('button',{name:/Water.*tap to drink/}));
// A purchase fits only if all three portions fit in the backpack.
setup({locationId:'shop'},{[invKey]:{water:1,food:4,medicines:24}});assert(!screen.getByRole('button',{name:'Buy Water for 3.00 zł'}).disabled);click('Buy Water for 3.00 zł');assert.equal(read(invKey).water,4);assert.equal(read(stateKey).money,97);
setup({locationId:'shop'},{[invKey]:{water:2,food:4,medicines:24}});const fullPurchase=screen.getByRole('button',{name:'Buy Water for 3.00 zł'});assert(fullPurchase.disabled);fireEvent.click(fullPurchase);assert.equal(read(invKey).water,2);assert.equal(read(stateKey).money,100);
// Stealing the same 1.5 L item also adds all three servings.
setup({locationId:'shop'},{[invKey]:{water:0}});fireEvent.click(screen.getAllByRole('button',{name:'STEAL',exact:true})[0]);fireEvent.click(document.querySelector('.dice-attempt'));click('Continue');assert.equal(read(invKey).water,3);assert.equal(read(stateKey).money,100);

// Cancelling a theft has no cost; failed attempts leave the shop without goods.
setup({locationId:'shop',minutes:600},{[invKey]:{water:0}});
const cancelledTheftState=read(stateKey),cancelledTheftInventory=read(invKey);
fireEvent.click(screen.getByTitle('Steal Water'));
assert(document.querySelector('.dice-card svg'));
assert(screen.getByRole('button',{name:'Try'}));
advance(3000);click('Cancel');
assert(!document.querySelector('.dice-overlay'));
assert.deepEqual(read(stateKey),cancelledTheftState);assert.deepEqual(read(invKey),cancelledTheftInventory);
for(const draw of [0,.15]) {
 setup({locationId:'shop',minutes:600},{[invKey]:{water:0}});
 fireEvent.click(screen.getByTitle('Steal Water'));Math.random=()=>draw;click('Try');
 assert(!screen.queryByRole('button',{name:'Cancel',exact:true}));
 click('Continue');
 assert.equal(read(stateKey).locationId,'street');assert.equal(read(invKey).water,0);
 assert(screen.getByRole('dialog').textContent.includes('empty-handed'));
 ok();assert(document.querySelector('.street-screen'));
}
Math.random=()=>.99;

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
 setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:20}});assert(!screen.getByRole('button',{name:`Buy ${name} for ${price} zł`}).disabled);fireEvent.click(screen.getByTitle(`Steal ${name}`));fireEvent.click(document.querySelector('.dice-attempt'));click('Continue');assert.equal(read(invKey)[key],quantity);assert.equal(read(stateKey).money,100);assert(screen.getByRole('dialog').textContent.includes(`+${quantity}`));
}
// Gel is twenty shower uses per bottle; older inventories acquire no free gel.
setup({locationId:'shop'},{[invKey]:{water:2}});assert.equal(read(invKey).showerGel,0);click('Buy 3-in-1 shower gel for 10.00 zł');assert.equal(read(stateKey).money,90);assert.equal(read(invKey).showerGel,20);assert(screen.getByRole('dialog').textContent.includes('+20'));ok();click(/Inventory$/);assert(screen.getByText('3-in-1 shower gel').closest('.backpack-grid'));assert(!document.querySelector('.essentials-grid').textContent.includes('3-in-1 shower gel'));assert(!screen.queryByRole('button',{name:/^3-in-1 shower gel/}));cleanup();render(React.createElement(App));assert.equal(read(invKey).showerGel,20);
setup({locationId:'shop'},{[invKey]:{water:4,food:4,medicines:24}});assert(screen.getByRole('button',{name:'Buy 3-in-1 shower gel for 10.00 zł'}).disabled);assert(screen.getByTitle('Steal 3-in-1 shower gel').disabled);
setup({locationId:'shop'},{[invKey]:{showerGel:0}});fireEvent.click(screen.getByTitle('Steal 3-in-1 shower gel'));fireEvent.click(document.querySelector('.dice-attempt'));click('Continue');assert.equal(read(invKey).showerGel,20);assert.equal(read(stateKey).money,100);
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
setup({locationId:'shelter',minutes:1080},{[lifeKey]:booking});const worker=screen.getByRole('button',{name:/Talk to shelter social worker/});assert(worker.disabled);fireEvent.click(worker);assert.equal(read(stateKey).minutes,1080);
setup({day:2,locationId:'shelter',minutes:1020},{[lifeKey]:booking});assert(!screen.getByRole('button',{name:/Talk to shelter social worker/}).disabled);click(/Talk to shelter social worker/);assert.equal(read(stateKey).minutes,1020);advance(3000);assert.equal(read(stateKey).minutes,1020);
click(/I still can’t afford a place to live/);click(/I’m looking for work/);click(/I’ll go to the Job Centre/);assert.equal(read(stateKey).minutes,1050);assert.equal(read(lifeKey).shelterUntilDay,31);assert(!screen.getByRole('dialog').querySelector('[data-resource-id="time"]'),'the 30-minute action keeps its real cost without a duration badge');

console.log('PASS: location, travel, coins, food and inventory scenarios.');

env.finish();
