// Exercise the deferred wetness feature explicitly; check-wetness-disabled.cjs covers release defaults.
const assert=require('node:assert/strict');
const {buildSync}=require('esbuild');
function bundle(path){const code=buildSync({entryPoints:[path],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false,external:['react','react-dom','react/jsx-runtime']}).outputFiles[0].text;const mod={exports:{}};new Function('require','module','exports',code)(require,mod,mod.exports);return mod.exports;}
const {sleepIllnessHazard:hazard,sleepIllnessChance:chance}=bundle('src/sleepIllness.ts');
const {initialState,applySleepTime,temperatureAt,WEATHER}=bundle('src/game.ts');
const {readSavedGame,SAVE_KEY}=bundle('src/saveCompatibility.ts');
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
near(chance(hazard('ground',20,'Clear',0,'outside')*480),.16);
near(chance(hazard('bench',20,'Clear',0,'outside')*480),.08);
near(chance(hazard('ground',4,'Cloudy',0,'outside')*480),.44);
assert(hazard('ground',4,'Cloudy',100,'outside')>hazard('ground',4,'Cloudy',0,'outside'));
assert(hazard('bench',4,'Rain',0,'outside')>hazard('bench',4,'Rain',0,'indoors'));
near(hazard('bench',4,'Rain',0,'indoors'),hazard('bench',4,'Clear',0,'indoors'));
assert.equal(hazard('shelter',0,'Rain',100,'outside'),0);assert.equal(hazard('residential',0,'Rain',100,'outside'),0);
assert.equal(chance(0),0);assert.equal(chance(100),.65);
assert(chance(hazard('ground',5,'Cloudy',0,'outside')*120)<chance(hazard('ground',5,'Cloudy',0,'outside')*480));
const base={...initialState,day:3,minutes:300,hunger:100,thirst:100,energy:20,health:100,mood:45,hygiene:80,wetness:0};
const context={sleepKind:'ground',exposure:'outside'};
const night=applySleepTime(base,480,context);
assert.equal(night.sleepIllnessMinutes,480);
assert(chance(night.sleepIllnessDose)>chance(hazard('ground',temperatureAt(WEATHER[2].temp,night.minutes),'Clear',0,'outside')*480),'a warm awakening cannot erase earlier cold exposure');
assert.deepEqual(applySleepTime(applySleepTime(base,173,context),307,context),night);
const midnight={...base,day:2,minutes:1380,rainUntil:2*1440+40,wetness:80};
assert.deepEqual(applySleepTime(applySleepTime(midnight,90,context),150,context),applySleepTime(midnight,240,context),'weather changes, wetness, rain expiry and midnight are integrated identically');
assert.equal(applySleepTime(base,60,{sleepKind:'shelter',exposure:'indoors'}).sleepIllnessDose,undefined);
const reload=s=>readSavedGame({getItem:key=>key===SAVE_KEY?JSON.stringify(s):null});
assert.equal(reload(base).sleepIllnessDose,undefined);near(reload(night).sleepIllnessDose,night.sleepIllnessDose);
for(const bad of [null,'bad',-5])assert.equal(reload({...base,sleepIllnessDose:bad}).sleepIllnessDose,0);
console.log('PASS: cumulative sleep illness, temperature, duration, moisture, roof protection, beds, caps, midnight and tick/jump equivalence.');

const {JSDOM}=require('jsdom');const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
let now=1800000000000,id=0;Date.now=()=>now;const timers=new Map();window.setInterval=fn=>{timers.set(++id,fn);return id};window.clearInterval=id=>timers.delete(id);
const React=require('react');const {render,screen,fireEvent,act,cleanup}=require('@testing-library/react');const App=bundle('src/App.tsx').default;
const effectsKey='street-life-effects-v1',sleepKey='street-life-sleep-v1';const read=k=>JSON.parse(localStorage.getItem(k));
const flush=()=>fireEvent(window,new window.Event('pagehide'));
function setup(state={},effects=[]){cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);Math.random=()=>.99;Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});localStorage.setItem(SAVE_KEY,JSON.stringify({...base,minutes:600,...state}));localStorage.setItem(effectsKey,JSON.stringify(effects));localStorage.setItem('street-life-mobile-auto-renew','false');localStorage.setItem('street-life-mobile-service-until','10000');render(React.createElement(App));flush();}
function sleep(){fireEvent.click(screen.getByRole('button',{name:/Lie down here/}));fireEvent.click(screen.getByRole('button',{name:'Start sleeping',exact:true}));flush();}
function step(ms){now+=ms;act(()=>{for(const fn of [...timers.values()])fn()});flush();}
function reloadApp(){cleanup();render(React.createElement(App));flush();}
function wake(){Math.random=()=>0;fireEvent.click(screen.getByRole('button',{name:'Wake up (debug)',exact:true}));flush();}
try{
 setup();sleep();wake();assert(screen.getByRole('dialog',{name:'Feeling unwell'}).textContent.includes('Your throat feels sore'));
 assert(document.querySelector('.result-illustration').src.endsWith('event-sleep-cold-ground-480.webp'));
 assert(document.querySelector('.result-illustration').srcset.includes('event-sleep-cold-ground-1024.webp'));
 assert.equal(document.querySelector('.result-card-label').textContent,'WAKE-UP EVENT');assert.equal(read(effectsKey).filter(e=>e.id==='cold').length,1);
 assert(document.querySelector('.result-consequences').textContent.includes('Cold'));
 assert.equal(read(SAVE_KEY).sleepIllnessDose,undefined);assert.equal(read(SAVE_KEY).sleepIllnessMinutes,undefined);assert.equal(read(sleepKey),null);
 const stopped=read(SAVE_KEY);step(5000);assert.deepEqual(read(SAVE_KEY),stopped,'wake illness event pauses time');
 fireEvent.click(screen.getByRole('button',{name:'Got it',exact:true}));assert(!screen.queryByRole('dialog'),'illness replaces competing wake events');
 const expiry=read(effectsKey).find(e=>e.id==='cold').expiresAt;reloadApp();assert(!screen.queryByRole('dialog',{name:'Feeling unwell'}));assert.equal(read(effectsKey).find(e=>e.id==='cold').expiresAt,expiry,'reload neither rerolls illness nor duplicates the event');
 setup({locationId:'station'});fireEvent.click(screen.getByRole('button',{name:/Try to sleep/}));fireEvent.click(screen.getByRole('button',{name:'Start sleeping',exact:true}));wake();assert(screen.getByRole('dialog',{name:'Feeling unwell'}));assert(document.querySelector('.result-illustration').src.endsWith('event-sleep-cold-bench-480.webp'));assert(document.querySelector('.result-illustration').srcset.includes('event-sleep-cold-bench-1024.webp'));
 setup();sleep();Math.random=()=>0;step(24000);const halfway=read(SAVE_KEY);assert.equal(halfway.sleepIllnessMinutes,240);assert(halfway.sleepIllnessDose>0);
 reloadApp();near(read(SAVE_KEY).sleepIllnessDose,halfway.sleepIllnessDose);Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});step(24000);
 assert(screen.getByRole('dialog',{name:'Feeling unwell'}));assert.equal(read(SAVE_KEY).sleepIllnessDose,undefined);const resumed=read(SAVE_KEY);
 setup();sleep();Math.random=()=>0;step(48000);assert.deepEqual(read(SAVE_KEY),resumed,'reload and hidden catch-up give the same result as uninterrupted sleep');
 const existingExpiry=2*1440+600+2000;setup({},[{id:'cold',expiresAt:existingExpiry,treated:true}]);sleep();wake();assert(!screen.queryByRole('dialog',{name:'Feeling unwell'}));assert.equal(read(effectsKey).find(e=>e.id==='cold').expiresAt,existingExpiry);assert(read(effectsKey).find(e=>e.id==='cold').treated,'existing illness is not replaced or extended');
 // Old in-progress outdoor sleeps recover their already elapsed exposure once.
 setup();sleep();step(12000);const savedGame=read(SAVE_KEY),expected=savedGame.sleepIllnessDose;delete savedGame.sleepIllnessDose;delete savedGame.sleepIllnessMinutes;cleanup();localStorage.setItem(SAVE_KEY,JSON.stringify(savedGame));reloadApp();near(read(SAVE_KEY).sleepIllnessDose,expected);reloadApp();near(read(SAVE_KEY).sleepIllnessDose,expected);
 console.log('PASS: wake illness event, real Cold consequences, pause, no duplicates, counter cleanup, existing illness, old-sleep migration, reload and hidden catch-up.');
}finally{cleanup();dom.window.close();}
