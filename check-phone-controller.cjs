const assert = require('node:assert/strict');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundle(path) {
  const code = buildSync({legacyEventDialogs:true, entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env':'{}'},external:['react','react-dom','react/jsx-runtime'] }).outputFiles[0].text;
  const m={exports:{}};new Function('require','module','exports',code)(require,m,m.exports);return m.exports;
}
const { phoneActivityEnd,phoneActivityTick,pausePhoneActivity,elapsedPhoneBattery,phoneUnavailableReason }=bundle('src/phoneActivity.ts');
const { INITIAL_INVENTORY }=bundle('src/inventory.ts');
const { createInitialState }=bundle('src/game.ts');
const game={...createInitialState(),day:1,minutes:1320,mood:30,locationId:'street'};
const inventory={...INITIAL_INVENTORY,phoneBattery:20,phoneCondition:100};
const before={game,inventory,effects:[]};
const call={questionId:'call-university',total:2,remaining:1,before};
const search={questionId:'bed',total:10,remaining:1,before};
assert.equal(phoneActivityTick(call,game,100).batteryCost,.2);
assert(Math.abs(phoneActivityTick(call,game,0).batteryCost-.34)<1e-12);
const tick=phoneActivityTick(call,game,100);
assert.deepEqual(tick.advance(call),{...call,remaining:0});assert.equal(tick.advance(null),null);
assert.equal(pausePhoneActivity(search).remaining,1);assert.equal(pausePhoneActivity(search).pausedMinutes,1);
assert.equal(pausePhoneActivity(null),null);
assert.equal(phoneActivityEnd(call,inventory,false,false,false),null,'calls need no data plan');
assert.equal(phoneActivityEnd(search,inventory,false,false,false),'interrupted');
assert.equal(phoneActivityEnd({...call,remaining:0},{...inventory,phoneBattery:0},false,true,true),'complete','completed call wins over interruptions');
assert.equal(phoneActivityEnd({...search,remaining:0},inventory,true,false,true),'checkout','checkout wins over completed search');
assert.equal(phoneActivityEnd({...search,remaining:0},{...inventory,phoneBattery:0},false,true,false),'complete','last search minute wins over empty battery/expired plan');
assert.equal(phoneActivityEnd(call,{...inventory,phoneCondition:0},true,false,false),'interrupted');
assert(phoneUnavailableReason(inventory,true).includes('Collect'));assert.equal(phoneUnavailableReason(inventory,false),null);
const charging={from:1320,now:1340,movingMinutes:20,travelling:false,navigationOn:false,musicOn:false,charging:true};
assert.equal(elapsedPhoneBattery(inventory,{...game,locationId:'shelter'},charging),40);
assert.equal(elapsedPhoneBattery(inventory,{...game,locationId:'shelter'},{...charging,travelling:true}),20);
assert.equal(elapsedPhoneBattery({...inventory,phoneBattery:99},{...game,locationId:'shelter'},charging),100);
assert.equal(elapsedPhoneBattery(inventory,{...game,locationId:'shelter',minutes:480},{...charging,from:479,now:600}),21,'charging stops at closure');

// Restoring an already-finished activity in StrictMode must not pay out twice.
const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};window.setInterval=()=>1;window.clearInterval=()=>{};Math.random=()=>.99;
const React=require('react');const {render,fireEvent,cleanup}=require('@testing-library/react');const App=bundle('src/App.tsx').default;
function setup(activity,index,extra={}){
 cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
 localStorage.setItem('street-life-save-v3',JSON.stringify(game));localStorage.setItem('street-life-inventory-v1',JSON.stringify(inventory));
 localStorage.setItem('street-life-phone-activity-v1',JSON.stringify(activity));localStorage.setItem('street-life-opening-calls-v1',JSON.stringify(index));
 localStorage.setItem('street-life-mobile-auto-renew','false');localStorage.setItem('street-life-mobile-service-until','5000');
 for(const [key,value] of Object.entries(extra))localStorage.setItem(key,JSON.stringify(value));
 render(React.createElement(React.StrictMode,null,React.createElement(App)));fireEvent(window,new window.Event('pagehide'));
}
const read=k=>JSON.parse(localStorage.getItem(k));
try {
 setup({...call,remaining:0},0);
 assert.equal(read('street-life-opening-calls-v1'),1,'one restored call completion');
 assert.equal(read('street-life-save-v3').mood,28,'one mood consequence');
 assert.equal(read('street-life-inventory-v1').phoneBattery,20,'restore spends no second battery charge');
 assert.equal(read('street-life-phone-activity-v1'),null);
 assert.equal(read('street-life-journal-history-v1').length,1,'one result/journal entry');
 cleanup();render(React.createElement(App));fireEvent(window,new window.Event('pagehide'));
 assert.equal(read('street-life-opening-calls-v1'),1);assert.equal(read('street-life-save-v3').mood,28);
 setup({...search,remaining:0},3);
 assert.equal(read('street-life-save-v3').mood,33,'one search reward');
 assert.deepEqual(read('street-life-answers-v1'),['bed']);assert.equal(read('street-life-phone-activity-v1'),null);
 assert.equal(read('street-life-journal-history-v1').length,1);
 setup(null,3,{'street-life-mobile-auto-renew':true,'street-life-mobile-service-until':0,'street-life-mobile-renewed-day':0});
 assert.equal(read('street-life-save-v3').money,game.money-1,'one automatic plan payment under StrictMode');
 assert.equal(read('street-life-mobile-service-until'),2760,'one day of service');
 const newRun=createInitialState();
 fireEvent.click([...document.querySelectorAll('button')].find(button=>button.textContent==='Reset save'));fireEvent(window,new window.Event('pagehide'));
 assert.equal(read('street-life-save-v3').money,newRun.money-1,'reset clears the transition guard and renews the new run');
 assert.equal(read('street-life-mobile-renewed-day'),1);
 console.log('PASS: phone tick/closure priorities, charging bounds, preserved costs and once-only restored completion under StrictMode.');
} finally { cleanup();dom.window.close(); }
