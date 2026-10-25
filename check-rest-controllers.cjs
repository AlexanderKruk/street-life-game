const assert=require('node:assert/strict');const {buildSync}=require('esbuild');
function bundle(path){const code=buildSync({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env':'{}'},external:['react','react-dom','react/jsx-runtime']}).outputFiles[0].text;const m={exports:{}};new Function('require','module','exports',code)(require,m,m.exports);return m.exports}
const {shelterAccess,shelterAttendance}=bundle('src/shelterRules.ts');
const {sleepElapsed,clearSleepIllness,shelterSleepMinutes}=bundle('src/sleepRules.ts');
const {INITIAL_INVENTORY}=bundle('src/inventory.ts');const {initialState}=bundle('src/game.ts');
const game={...initialState,day:2,minutes:1120,money:100,mood:28,energy:40,health:82,hygiene:55,locationId:'shelter',rainSystemStarted:true,rainScheduleDay:2,rainStartsToday:0,nextRainAt:10000};
const booking={housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1};
for(const [minute,checkout]of [[449,false],[450,true],[479,true],[480,true],[720,false]])assert.equal(shelterAccess({...game,minutes:minute},booking,'shelter',false,minute<480,false).shelterCheckoutDue,checkout);
assert.equal(shelterAccess({...game,minutes:450},booking,'shelter',true,true,false).shelterCheckoutDue,false);
assert.equal(shelterAccess({...game,minutes:450},booking,'shelter',false,true,true).shelterCheckoutDue,false);
const original=Object.freeze({...booking,shelterMisses:1,shelterMissMonth:0});const audited=shelterAttendance(original,3).life;
assert.equal(audited.shelterMisses,2);assert.strictEqual(shelterAttendance(audited,3).life,audited,'one audit for the same night');assert.equal(original.shelterMisses,1);
const eviction=shelterAttendance({...audited,shelterAuditDay:2},4);assert.equal(eviction.life.shelterUntilDay,undefined);assert.equal(eviction.life.shelterBlockedUntilDay,31);assert(eviction.message.includes('Day 30'));
assert.equal(shelterAttendance({...booking,shelterRegisteredDay:30,shelterUntilDay:50,shelterAuditDay:30,shelterLastStayDay:29,shelterMissMonth:0,shelterMisses:2},32).life.shelterMisses,1,'month reset');
assert.equal(shelterSleepMinutes(1440+420,480),30);
const sleep={kind:'bench',total:120,remaining:0,startAbsolute:1440+600,realStartedAt:1000,realWakeAt:13000};
assert.equal(sleepElapsed(sleep,0),0);assert.equal(sleepElapsed(sleep,7000),60);assert.equal(sleepElapsed(sleep,999999),120);
const illness=Object.freeze({...game,sleepIllnessDose:1,sleepIllnessMinutes:100});const cleared=clearSleepIllness(illness);assert.equal(cleared.sleepIllnessDose,undefined);assert.equal(illness.sleepIllnessDose,1);assert.strictEqual(clearSleepIllness(game),game);

const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};window.setInterval=()=>1;window.clearInterval=()=>{};Date.now=()=>1800000000000;Math.random=()=>.99;
const React=require('react');const {render,screen,fireEvent,cleanup}=require('@testing-library/react');const App=bundle('src/App.tsx').default;
const read=k=>JSON.parse(localStorage.getItem(k));const gameKey='street-life-save-v3',lifeKey='street-life-situation-v1';
const snapshot={game,inventory:INITIAL_INVENTORY,effects:[]};
function setup(state={},extra={},onMount=()=>{}){
 cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);localStorage.setItem(gameKey,JSON.stringify({...game,...state}));localStorage.setItem('street-life-inventory-v1',JSON.stringify(INITIAL_INVENTORY));localStorage.setItem('street-life-effects-v1','[]');localStorage.setItem('street-life-choice-seed-v1','1234');localStorage.setItem('street-life-mobile-auto-renew','false');for(const[k,v]of Object.entries(extra))localStorage.setItem(k,JSON.stringify(v));onMount();render(React.createElement(React.StrictMode,null,React.createElement(App)));fireEvent(window,new window.Event('pagehide'));
}
try{
 const queue={day:2,total:20,remaining:0,arrivalMinute:1020,joinedAt:1100,vacancies:3,peopleAhead:0,before:snapshot};
 setup({}, {'street-life-shelter-queue-v1':queue});assert.equal(read(gameKey).mood,31,'one registration reward');assert.equal(read(lifeKey).shelterUntilDay,8);assert.equal(read('street-life-journal-history-v1').length,1);assert.equal(read('street-life-shelter-queue-v1'),null);
 setup({}, {'street-life-shelter-queue-v1':{...queue,vacancies:0}});assert.equal(read(gameKey).mood,23,'one refusal penalty');assert.equal(read('street-life-journal-history-v1').length,1);
 setup({day:3,minutes:600,rainScheduleDay:3},{[lifeKey]:{...booking,shelterAuditDay:1,shelterMisses:1,shelterMissMonth:0}});assert.equal(read(lifeKey).shelterMisses,2,'StrictMode audit cannot count a night twice');
 let draws=0;setup({}, {},()=>{Math.random=()=>{draws++;return .75}});assert.equal(draws,1,'vacancies roll outside replayed state updaters');assert.equal(read(lifeKey).shelterVacancies,3);Math.random=()=>.99;
 const sleeping={...sleep,startAbsolute:2040,realStartedAt:Date.now()-12000,realWakeAt:Date.now(),before:snapshot};
 setup({locationId:'station',minutes:720,sleepIllnessDose:0,sleepIllnessMinutes:120},{'street-life-sleep-v1':sleeping,'street-life-effects-v1':[{id:'cold',expiresAt:10000}]});
 assert.equal(read(gameKey).energy,56.5,'one two-hour bench recovery');assert.equal(read('street-life-sleep-v1'),null);assert.equal(read('street-life-journal-history-v1').length,1);assert(screen.getByRole('dialog').textContent.includes('2 hours'));
 cleanup();render(React.createElement(React.StrictMode,null,React.createElement(App)));fireEvent(window,new window.Event('pagehide'));assert.equal(read(gameKey).energy,56.5,'completed sleep does not pay again');
 setup({minutes:480},{[lifeKey]:booking,'street-life-shelter-departure-v1':{day:2,startAbsolute:1440+450,before:snapshot},'street-life-shelter-phone-charge-v1':true});assert.equal(read(gameKey).locationId,'street');assert.equal(read(lifeKey).shelterCheckoutDay,2);assert.equal(read('street-life-shelter-departure-v1'),null);assert.equal(read('street-life-shelter-phone-charge-v1'),null);assert.equal(read('street-life-journal-history-v1').length,1);
 console.log('PASS: sleep time/caps and immutable illness reset, shelter access/attendance, single StrictMode queue reward/refusal/vacancy/audit, restored sleep and checkout.');
}finally{cleanup();dom.window.close()}
