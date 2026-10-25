const assert=require('node:assert/strict');const {buildSync}=require('./tests/helpers/build.cjs');
function bundle(path){const code=buildSync({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env':'{}'},external:['react','react-dom','react/jsx-runtime']}).outputFiles[0].text;const m={exports:{}};new Function('require','module','exports',code)(require,m,m.exports);return m.exports}
const {diceOutcome,eventCheckModifier}=bundle('src/eventChecks.ts');
const {advanceTrip}=bundle('src/useTravelController.ts');
const {createEventController}=bundle('src/eventController.ts');
const {createInitialState}=bundle('src/game.ts');
const {INITIAL_INVENTORY,INITIAL_STORAGE}=bundle('src/inventory.ts');
const game={...createInitialState(),day:2,minutes:600,money:100,mood:28,health:82,energy:70,hygiene:55,locationId:'street'};
const choice={label:'test',check:{stat:'reflex',dc:12,success:{message:'success'},failure:{message:'failure'},criticalSuccess:{message:'critical success'},criticalFailure:{message:'critical failure'}}};
for(const [roll,modifier,success,message]of [[1,100,false,'critical failure'],[20,-100,true,'critical success'],[10,2,true,'success'],[10,1,false,'failure']])assert.deepEqual(diceOutcome({choice,roll,modifier,resolved:false}),{success,outcome:{message}});
assert.equal(diceOutcome({choice,roll:null,modifier:0,resolved:false}),null);
const trip={destinationId:'station',mode:'transit',total:30,remaining:1,before:{game,inventory:INITIAL_INVENTORY,effects:[]}};
const advanced=advanceTrip(Object.freeze(trip),5);assert.equal(advanced.remaining,0);assert.strictEqual(advanced.before,trip.before);assert.equal(trip.remaining,1);assert.equal(advanceTrip(null,1),null);
// Reusing an accepted command must not pay the fine/reward or start the trip twice.
let accepted=null,applied=0,started=0;const dice={choice,roll:20,modifier:0,resolved:false,fareDodgeDestinationId:'station'};
const session={activeEvent:null,diceCheck:dice,firstNightEvents:{pendingId:null},ambientEventClock:{current:{locationId:'street',minutes:0}},claimDice:value=>accepted===value?false:(accepted=value,true),setEncounters:()=>{},setFirstNightEvents:()=>{},setActiveEvent:()=>{},setDiceCheck:()=>{}};
const command=createEventController(session,{game,inventory:INITIAL_INVENTORY,storage:INITIAL_STORAGE,life:{housing:'Street'},discoveredLocations:[],phoneUnavailable:null,shelterBooked:false,currentId:'street',open:true},{setGame:()=>{},setInventory:()=>{},setMessage:()=>{},setInfoModal:()=>{},setEventResultOpen:()=>{},setDiscoveredLocations:()=>{},setActiveGoal:()=>{},openPage:()=>{},resultSnapshot:()=>trip.before,applyAction:state=>state,runWithResult:(_title,action)=>{applied++;action()},startFareDodgeTrip:()=>started++});
command.acceptDiceResult();command.acceptDiceResult();assert.equal(applied,1);assert.equal(started,1);
assert.equal(eventCheckModifier({...game,energy:80},choice),2);assert.equal(eventCheckModifier({...game,energy:19},choice),-2);

const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};window.setInterval=()=>1;window.clearInterval=()=>{};Math.random=()=>.99;
const React=require('react');const {render,screen,fireEvent,cleanup}=require('@testing-library/react');const App=bundle('src/App.tsx').default;
const read=k=>JSON.parse(localStorage.getItem(k));
function setup(state={},extra={}){cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);localStorage.setItem('street-life-save-v3',JSON.stringify({...game,...state}));localStorage.setItem('street-life-effects-v1','[]');localStorage.setItem('street-life-mobile-auto-renew','false');localStorage.setItem('street-life-inventory-v1',JSON.stringify(INITIAL_INVENTORY));for(const[k,v]of Object.entries(extra))localStorage.setItem(k,JSON.stringify(v));render(React.createElement(React.StrictMode,null,React.createElement(App)));fireEvent(window,new window.Event('pagehide'))}
try{
 setup({}, {'street-life-trip-v1':{...trip,remaining:0}});
 assert.equal(read('street-life-save-v3').locationId,'station');assert.equal(read('street-life-save-v3').money,100);assert.equal(read('street-life-trip-v1'),null);assert.equal(read('street-life-journal-history-v1').length,1,'one restored arrival under StrictMode');
 setup({day:2,minutes:60},{'street-life-encounters-v1':{seen:['borrow-phone','borrow-phone-slip'],lastAt:1500,pendingId:'borrow-phone-slip',pendingRoll:17}});
 assert(screen.getByLabelText('Rolled 17'));let draws=0;Math.random=()=>{draws++;return 0};cleanup();render(React.createElement(React.StrictMode,null,React.createElement(App)));
 assert(screen.getByLabelText('Rolled 17'));assert.equal(draws,0,'saved D20 restored without reroll');fireEvent.click(screen.getByRole('button',{name:'Continue'}));fireEvent(window,new window.Event('pagehide'));assert.equal(read('street-life-encounters-v1').pendingRoll,null);assert.equal(read('street-life-journal-history-v1').length,1);
 Math.random=()=>.99;
 const rain={id:'rain:2000',level:'downpour',start:2000,end:2040,choice:'continue',choiceAt:2000,searchRemaining:0,protection:.5,shelter:'canopy',exposure:40,energyLoss:4,moodLoss:2,waited:0,coldRoll:0,cold:true};
 setup({rainResults:[rain],rainSystemStarted:true,rainScheduleDay:2,rainStartsToday:1,nextRainAt:10000});
 assert.equal(read('street-life-journal-history-v1').length,1,'one restored rain report under StrictMode');assert.equal(read('street-life-effects-v1').filter(e=>e.id==='cold').length,1);assert(read('street-life-save-v3').rainResults[0].reported);
 fireEvent.click(screen.getByRole('button',{name:'Got it'}));fireEvent(window,new window.Event('pagehide'));assert.deepEqual(read('street-life-save-v3').rainResults,[]);
 console.log('PASS: D20 critical/threshold outcomes and once-only acceptance, immutable trip progress, restored arrival/roll/rain results under StrictMode.');
}finally{cleanup();dom.window.close()}
