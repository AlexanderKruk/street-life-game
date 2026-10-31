const env = require('../helpers/regression-env.cjs');
const { React, render, screen, within, cleanup, assert, App, stateKey, invKey, lifeKey, read, setup, click, ok, advance, near } = env;
// Unified time gives identical results for large blocks and minute ticks,
// including effect expiry, weather change and crossing midnight.
require('../helpers/build.cjs').buildSync({entryPoints:['src/game.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',outfile:process.env.STREET_REGRESSION_GAME});
const {advanceTime,initialState,createInitialState,overallCondition,conditionBand,moodLimit,limitMood,HOUSING_MOOD_CAP,locations,travelTimeRange,destinationTravelTimeRange,randomTravelMinutes}=require(process.env.STREET_REGRESSION_GAME);
for(const base of [1,33,40,45,65,...locations.flatMap(location=>[location.travelMinutes,Math.ceil(location.travelMinutes*.5)])]) {
 const {min,max}=travelTimeRange(base);assert.equal(min,Math.ceil(base*.95));assert.equal(max,Math.floor(base*1.2));
 assert.equal(randomTravelMinutes(base,()=>0),min);assert.equal(randomTravelMinutes(base,()=>.999999),max);
 for(let value=min;value<=max;value++)assert.equal(randomTravelMinutes(base,()=>(value-min+.5)/(max-min+1)),value);
 assert(min>=base*.95&&max<=base*1.2);
}
const nearbyShop=locations.find(place=>place.id==='shop');
for(const mode of ['walk','transit','fare-dodge']){const range=destinationTravelTimeRange(nearbyShop,mode);assert.deepEqual(range,{min:5,max:15});assert.equal(randomTravelMinutes(range,()=>0),5);assert.equal(randomTravelMinutes(range,()=>.999999),15);}
// One Mood and the same five faces in the header and Status.
assert.deepEqual([0,21,41,61,81].map(value=>conditionBand(value).level),['very-bad','bad','fair','ok','very-good']);
for(const [boundary,below,above] of [[20,'very-bad','bad'],[40,'bad','fair'],[60,'fair','ok'],[80,'ok','very-good']]) {
 assert.equal(conditionBand(boundary).level,below);assert.equal(conditionBand(boundary+.01).level,above);
}
const healthyBody={...initialState,hunger:80,thirst:80,energy:80,health:80,hygiene:80,mood:28};
for(const [value,label] of [[10,'VERY BAD'],[30,'BAD'],[50,'FAIR'],[70,'GOOD'],[90,'VERY GOOD']]) {
 setup({hunger:value,thirst:value,energy:value,health:value,hygiene:value,mood:value},{[lifeKey]:{housing:'Apartment'}});
 assert(screen.getByRole('img',{name:'Mood: '+label}));
 click(/^Status$/);
 assert.equal(document.querySelector('[data-stat="Mood"] svg').innerHTML,document.querySelector('.header-condition svg').innerHTML);
}
assert.equal(overallCondition(healthyBody).level,'bad');
assert.equal(overallCondition(limitMood({...healthyBody,mood:100,health:5},{housing:'Apartment'})).level,'bad');
assert.equal(overallCondition(limitMood({...healthyBody,mood:100,energy:10},{housing:'Apartment'})).level,'fair');
// Wet clothes persist and dry indoors without changing clothing cleanliness.
setup({day:2,minutes:600,locationId:'station',wetness:80},{[invKey]:{clothingCleanliness:80}});click(/^Status$/);
assert(document.querySelector('.effect.wet-clothes').textContent.includes('80%'));
const wetSave=read(stateKey);cleanup();render(React.createElement(App));
assert.equal(read(stateKey).wetness,wetSave.wetness);
advance(1000);assert(Math.abs(read(stateKey).wetness-79.4)<1e-8);
assert(within(document.querySelector('.wet-clothes .effect-impact')).getByRole('img',{name:'Energy−'}).querySelector('svg'));
setup({locationId:'station',wetness:0});click(/^Status$/);assert(!document.querySelector('.wet-clothes'));
// Status promotes one need only when attention is needed and keeps all six visible.
setup({hunger:72,thirst:66,energy:45,health:90,hygiene:75,mood:28});click(/^Status$/);
assert.equal(document.querySelector('.status-focus').dataset.stat,'Mood');
assert.equal(document.querySelectorAll('.status-needs .status-stat').length,5);
assert.equal(new Set([...document.querySelectorAll('.status-stat')].map(stat=>stat.dataset.stat)).size,6);
assert.equal(document.querySelector('.status-stat[data-stat="Mood"] .status-stat-value').textContent,'28%');
assert(document.querySelector('.status-stat[data-stat="Mood"] .bar i.critical'));
assert(document.querySelector('.status-stat[data-stat="Energy"] .bar i.warning'));
assert(document.querySelector('.status-stat[data-stat="Food"] .bar i.good'));
assert.equal(screen.getAllByRole('meter').length,6);
assert(screen.getByRole('heading',{name:'Condition',exact:true}));
assert(screen.getByRole('heading',{name:'Effects',exact:true}));
const streetMoodBadge=within(document.querySelector('[data-mood-limit="Street"]')).getByRole('img',{name:'Mood ≤ 50%'});
assert.equal(streetMoodBadge.textContent,'≤ 50%');
assert(streetMoodBadge.classList.contains('negative'));
assert.equal(streetMoodBadge.querySelector('svg').innerHTML,document.querySelector('[data-resource-id="mood"] svg').innerHTML);
assert(!document.querySelector('[data-stat="Hygiene"] .bar-blocked'));
setup({mood:28,hygiene:45},{[invKey]:{clothingCleanliness:10},'street-life-effects-v1':[{id:'cold',expiresAt:3000},{id:'well-fed',expiresAt:2000}]});click(/^Status$/);
assert(document.querySelector('.status-effects + .condition-heading'));
assert(!document.querySelector('.effect.illness .effect-time'));
assert(document.querySelector('.effect.positive .effect-time'));
assert.equal(document.querySelector('[data-stat="Hygiene"] .bar-blocked').style.left,'60%');
assert.equal(document.querySelector('[data-stat="Hygiene"] .bar-cap-marker').style.left,'60%');
assert(screen.getByRole('meter',{name:/Hygiene.*maximum 60% due to dirty clothes/}));
setup({mood:28,hygiene:45},{[invKey]:{clothingCleanliness:60}});click(/^Status$/);
assert.equal(document.querySelector('[data-stat="Hygiene"] .bar-blocked').style.left,'80%');
setup({mood:50,hygiene:10},{[invKey]:{clothingCleanliness:10}});click(/^Status$/);
assert.equal(document.querySelector('.status-focus').dataset.stat,'Hygiene');
assert(document.querySelector('.status-focus .bar-blocked'));
setup({hunger:80,thirst:80,energy:80,health:15,hygiene:80,mood:1});click(/^Status$/);
assert.equal(document.querySelector('.status-focus').dataset.stat,'Health');
assert(document.querySelector('.status-needs [data-stat="Mood"]'));
assert(document.querySelector('[data-stat="Energy"] small').textContent.startsWith('Max '));
for(const [value,color] of [[30,'critical'],[30.1,'warning'],[60,'warning'],[60.1,'good']]) {
 setup({hunger:80,thirst:80,energy:80,health:90,hygiene:80,mood:value},{[lifeKey]:{housing:'Apartment'}});click(/^Status$/);
 if(color==='good') {
  assert(!document.querySelector('.status-focus'));
  assert(!document.querySelector('.status-focus-label'));
  assert.equal(document.querySelectorAll('.status-needs .status-stat').length,6);
  assert(document.querySelector('[data-stat="Mood"] .bar i.good'));
 } else {
  assert(document.querySelector(`.status-focus .bar i.${color}`));
  assert.equal(document.querySelector('.status-focus .status-stat-label .status-focus-label').textContent,color==='critical'?'Needs attention':'Keep an eye on this');
 }
}
for(const need of ['hunger','thirst','energy','health','hygiene','mood']) {
 setup({hunger:80,thirst:80,energy:80,health:90,hygiene:80,mood:80,[need]:60.1},{[lifeKey]:{housing:'Apartment'}});click(/^Status$/);
 assert(!document.querySelector('.status-focus'),need+' above 60 does not need a warning');
 assert.equal(screen.getAllByRole('meter').length,6);
 assert.deepEqual([...document.querySelectorAll('.status-needs .status-stat')].map(stat=>stat.dataset.stat),['Food','Thirst','Energy','Health','Hygiene','Mood']);
}
const recoveredMood=advanceTime(healthyBody,60).mood;
assert.equal(recoveredMood,healthyBody.mood,'comfortable needs do not automatically refill Mood');
for(const need of ['hunger','thirst','energy','health','hygiene']) {
 const comfortable={...healthyBody,mood:100};
 const deprived={...comfortable,[need]:5};
 const lowMood=advanceTime(deprived,60,{housing:'Apartment'}).mood;
 assert(lowMood<advanceTime(comfortable,60,{housing:'Apartment'}).mood,need+' must restrict Mood');
}
const emotionalShock={...healthyBody,mood:10};
assert.equal(advanceTime(emotionalShock,0).mood,10);
assert(advanceTime(emotionalShock,60).mood<30); // Recovery is gradual, not a reset.
const baselineMood=advanceTime(healthyBody,60).mood;
assert(advanceTime(healthyBody,60,{music:true}).mood>baselineMood);
assert(advanceTime(healthyBody,60,{effects:[{id:'cold',expiresAt:99999}]}).mood<baselineMood);
const beforeMoneyRandom=Math.random;
for(let amount=25;amount<=50;amount++){Math.random=()=>(amount-25+.5)/26;assert.equal(createInitialState().money,amount);}
Math.random=()=>0;assert.equal(createInitialState().money,25);Math.random=()=>.999999;assert.equal(createInitialState().money,50);Math.random=beforeMoneyRandom;
cleanup();localStorage.clear();localStorage.setItem('street-life-mobile-auto-renew','false');Math.random=()=>0;render(React.createElement(App));assert.equal(read(stateKey).money,25);cleanup();Math.random=()=>.99;render(React.createElement(App));assert.equal(read(stateKey).money,25);click('Reset save');assert.equal(read(stateKey).money,49);assert.equal(read(stateKey).minutes,1320);cleanup();render(React.createElement(App));assert.equal(read(stateKey).money,49);setup({money:100});assert.equal(read(stateKey).money,100);
assert.equal(initialState.health,90);assert.equal(initialState.hygiene,75);assert.equal(initialState.mood,30);
const timedRain=advanceTime({...initialState,day:6,minutes:1320,rainUntil:8521,energy:100,health:100},2,{exposure:'indoors'});
assert(Math.abs(timedRain.energy-(100-2*100/2160-.025))<1e-8);
for(const context of [{},{sleeping:true},{walking:true,music:true}]) {
 const start={...initialState,minutes:1430,hunger:12,thirst:12,health:80};
 const options={...context,effects:[{id:'cold',expiresAt:1450},{id:'well-fed',expiresAt:1460}]};
 const block=advanceTime(start,100,options);let ticks=start;for(let i=0;i<100;i++)ticks=advanceTime(ticks,1,options);assert.deepEqual(block,ticks);assert.equal(block.day,2);assert.equal(block.minutes,90);
}
// Full Food lasts 48 hours and full Water 24 hours at baseline. Day 1/2
// weather adds no water surcharge, so the entire baseline food test is exact.
const full={...initialState, minutes:0, hunger:100, thirst:100, energy:100, health:100};
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

env.finish();
