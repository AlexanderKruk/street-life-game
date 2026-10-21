// Exercise the deferred wetness feature explicitly; check-wetness-disabled.cjs covers release defaults.
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
function bundled(path) {
  const code = buildSync({entryPoints:[path],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false,external:['react','react-dom','react/jsx-runtime']}).outputFiles[0].text;
  const module={exports:{}};new Function('require','module','exports',code)(require,module,module.exports);return module.exports;
}
const {initialState,advanceTime,applySleepTime,weatherExposure}=bundled('src/game.ts');
const base={...initialState,day:2,minutes:600,energy:100,mood:45,hunger:100,thirst:100,health:100,hygiene:90};
const rain=advanceTime(base,60);
assert.equal(rain.wetness,60);
assert.equal(advanceTime(base,200).wetness,100);
assert(Math.abs(advanceTime({...base,day:5},60).wetness-36)<1e-8);
const dryCovered=advanceTime(base,60,{exposure:'cover'});
assert.equal(dryCovered.wetness,undefined);
assert(rain.energy<dryCovered.energy&&rain.mood<dryCovered.mood);
assert.equal(rain.hygiene,dryCovered.hygiene,'wetness itself does not change cleanliness or hygiene');
const soaked={...base,wetness:100};
const cover=advanceTime(soaked,60,{exposure:'cover'});
const station=advanceTime({...soaked,locationId:'station'},60);
const warm=advanceTime({...soaked,locationId:'support'},60);
const transit=advanceTime(soaked,60,{exposure:'transit'});
assert(Math.abs(cover.wetness-91)<1e-8);
assert(Math.abs(station.wetness-64)<1e-8);
assert(Math.abs(warm.wetness-28)<1e-8);
assert(warm.wetness<station.wetness&&station.wetness<transit.wetness&&transit.wetness<cover.wetness);
assert.equal(advanceTime({...soaked,locationId:'support'},200).wetness,0);
assert.equal(weatherExposure({...base,locationId:'support',minutes:1000}),'outside');
assert.equal(weatherExposure({...base,locationId:'shelter',minutes:1380}),'indoors');
assert.equal(weatherExposure({...base,locationId:'shelter',minutes:600}),'outside');
assert.equal(weatherExposure({...base,locationId:'station'},{walking:true}),'outside');
assert.equal(weatherExposure(base,{exposure:'transit'}),'transit');
const drying=advanceTime({...soaked,day:3},60);
const windy=advanceTime({...soaked,day:4},60);
assert(windy.wetness<drying.wetness);
const overnight={...soaked,day:3,minutes:1430,rainUntil:3*1440+20};
assert.deepEqual(advanceTime(overnight,70),advanceTime(advanceTime(overnight,25),45),'midnight, rain expiry and wetness use identical minute steps');
let ticks=soaked;for(let i=0;i<60;i++)ticks=advanceTime(ticks,1);
assert.deepEqual(ticks,advanceTime(soaked,60));
const outsideSleep=applySleepTime({...soaked,energy:0},120,{exposure:'outside'});
const insideSleep=applySleepTime({...soaked,energy:0,locationId:'shelter'},120,{exposure:'indoors'});
assert(outsideSleep.wetSleepLoss>0,'wet sleep loss accumulates even at zero starting Energy');
assert.equal(insideSleep.wetSleepLoss,undefined);
assert.deepEqual(applySleepTime(applySleepTime(soaked,60,{exposure:'outside'}),60,{exposure:'outside'}),applySleepTime(soaked,120,{exposure:'outside'}));
const {readSavedGame,SAVE_KEY}=bundled('src/saveCompatibility.ts');
function reload(state){return readSavedGame({getItem:key=>key===SAVE_KEY?JSON.stringify(state):null})}
assert.equal(reload(base).wetness,undefined,'old saves remain dry without changing their shape');
assert.equal(reload(outsideSleep).wetSleepLoss,outsideSleep.wetSleepLoss);
assert.equal(reload(soaked).wetness,100);
for(const [value,expected]of [[-4,0],[150,100],['wet',0],[null,0]])assert.equal(reload({...base,wetness:value}).wetness,expected);
console.log('PASS: gradual wetting, cover, indoor/transit drying, bounds, opening hours, wind, sleep at zero Energy, tick equivalence and wet-save validation.');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};window.setInterval=()=>1;window.clearInterval=()=>{};
Date.now=()=>1800000000000;Math.random=()=>.99;
const React=require('react');const {render,screen,fireEvent,within,cleanup}=require('@testing-library/react');
const App=bundled('src/App.tsx').default;
function sleepRun(wetness,resume=false){
 cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
 localStorage.setItem(SAVE_KEY,JSON.stringify({...base,day:3,minutes:1380,energy:55,wetness}));
 localStorage.setItem('street-life-effects-v1','[]');localStorage.setItem('street-life-mobile-service-until','10000');
 localStorage.setItem('street-life-mobile-auto-renew','false');
 render(React.createElement(App));
 fireEvent.click(screen.getByRole('button',{name:/Lie down here/}));
 fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:/^2 h/}));
 fireEvent.click(screen.getByRole('button',{name:'Start sleeping',exact:true}));
 if(resume){cleanup();render(React.createElement(App));}
 fireEvent.click(screen.getByRole('button',{name:'Wake up (debug)',exact:true}));
 fireEvent(window,new window.Event('pagehide'));
 return JSON.parse(localStorage.getItem(SAVE_KEY));
}
try {
 const dryRest=sleepRun(0),wetRest=sleepRun(100),resumedRest=sleepRun(100,true);
 assert(wetRest.energy<dryRest.energy,'actual outdoor sleep gains are reduced by wet clothes');
 assert.equal(wetRest.wetSleepLoss,undefined,'completed sleep clears its temporary loss accumulator');
 assert.deepEqual(resumedRest,wetRest,'reload during wet sleep retains the same recovery');
 const {summarizeResult}=bundled('src/results.ts');
 const snapshot={game:base,inventory:{water:0,food:0,bottles:0,phoneBattery:50,phoneCondition:100,jacket:80,documents:true,cigarettes:0,medicines:0,transitCard:false},effects:[]};
 const wetRow=summarizeResult(snapshot,{...snapshot,game:{...base,wetness:30}}).changes.find(row=>row.label.includes('Clothing wetness'));
 assert.equal(wetRow.kind,'negative');assert.equal(wetRow.value,'+30%');
 const dryRow=summarizeResult({...snapshot,game:{...base,wetness:30}},snapshot).changes.find(row=>row.label.includes('Clothing wetness'));
 assert.equal(dryRow.kind,'positive');assert.equal(dryRow.value,'−30%');
 console.log('PASS: wet outdoor sleep recovery, in-progress reload and wetting/drying result signs.');
} finally {cleanup();dom.window.close();}
