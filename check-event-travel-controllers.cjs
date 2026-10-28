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
// Fines retain their nominal amount, but the actual deduction is limited to cash.
const {applyAction}=bundle('src/game.ts');
for(const [roll,fine] of [[10,20],[1,35]])for(const money of [0,3.5,20,35,100]) {
 const before={...game,money},check={label:'fare',check:{stat:'reflex',dc:12,success:{message:'success'},failure:{money:-20,mood:-8,message:'Fine 20'},criticalFailure:{money:-35,mood:-12,message:'Fine 35'}}};
 const diceState={choice:check,roll,modifier:0,resolved:false,fareDodgeDestinationId:'station'};
 const session={activeEvent:null,diceCheck:diceState,firstNightEvents:{pendingId:null},ambientEventClock:{current:{}},claimDice:()=>true,setEncounters:()=>{},setFirstNightEvents:()=>{},setActiveEvent:()=>{},setDiceCheck:()=>{}};
 let actual=before,message='',startedOutcome;
 const update=value=>{actual=typeof value==='function'?value(actual):value};
 const host={setGame:update,setInventory:()=>{},setMessage:value=>{message=value},setInfoModal:()=>{},setEventResultOpen:()=>{},setDiscoveredLocations:()=>{},setActiveGoal:()=>{},openPage:()=>{},resultSnapshot:()=>({game:before,inventory:INITIAL_INVENTORY,effects:[]}),applyAction,runWithResult:(_identity,run)=>run(),startFareDodgeTrip:(_id,outcome)=>{startedOutcome=outcome}};
 createEventController(session,{game:before,inventory:INITIAL_INVENTORY,storage:INITIAL_STORAGE,life:{housing:'Street'},discoveredLocations:[],phoneUnavailable:null,shelterBooked:false,currentId:'street',open:true},host).acceptDiceResult();
 assert.equal(actual.money,Math.max(0,money-fine));assert.equal(startedOutcome.money,-fine);
 if(money<fine)assert.equal(message,`An inspector catches you. The fine is ${fine} zł; you pay ${money.toFixed(2)} zł.`);
 else assert.equal(message,`Fine ${fine}`);
}
assert.equal(eventCheckModifier({...game,energy:80},choice),2);assert.equal(eventCheckModifier({...game,energy:19},choice),-2);

// Every sampled inspection falls strictly within the shared on-board phase.
const {scheduleTripInspection,loadTripInspection}=bundle('src/travelInspection.ts');
const {getTravelPhase}=bundle('src/travelPhases.ts');
for(const mode of ['transit','fare-dodge'])for(let total=5;total<=180;total++)for(const draw of [0,.25,.5,.999999]) {
 const inspection=scheduleTripInspection(total,mode,()=>draw);
 assert(inspection.at>0&&inspection.at<total);assert.equal(getTravelPhase({mode,total,remaining:total-inspection.at}).id,'riding');
 assert.deepEqual(loadTripInspection(inspection,{mode,total}),inspection);
}
assert.equal(scheduleTripInspection(20,'walk',()=>{throw new Error('walking must not draw')}),undefined);
assert.equal(loadTripInspection({at:0,status:'scheduled'},{mode:'transit',total:20}),undefined);
assert.equal(loadTripInspection({at:12,status:'rolling',roll:99,modifier:0},{mode:'fare-dodge',total:20}),undefined);
assert.equal(loadTripInspection(undefined,{mode:'fare-dodge',total:20}),undefined,'legacy trips do not repeat their departure check');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};window.setInterval=()=>1;window.clearInterval=()=>{};Math.random=()=>.99;
const React=require('react');const {render,screen,fireEvent,cleanup}=require('@testing-library/react');const App=bundle('src/App.tsx').default;
const read=k=>JSON.parse(localStorage.getItem(k));
function setup(state={},extra={}){cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);localStorage.setItem('street-life-save-v3',JSON.stringify({...game,...state}));localStorage.setItem('street-life-effects-v1','[]');localStorage.setItem('street-life-mobile-auto-renew','false');localStorage.setItem('street-life-inventory-v1',JSON.stringify(INITIAL_INVENTORY));for(const[k,v]of Object.entries(extra))localStorage.setItem(k,JSON.stringify(v));render(React.createElement(React.StrictMode,null,React.createElement(App)));fireEvent(window,new window.Event('pagehide'))}
try{
 setup({}, {'street-life-trip-v1':{...trip,remaining:0}});
 assert.equal(read('street-life-save-v3').locationId,'station');assert.equal(read('street-life-save-v3').money,100);assert.equal(read('street-life-trip-v1'),null);assert.equal(read('street-life-journal-history-v1').length,1,'one restored arrival under StrictMode');
 for(const mode of ['walk','transit','fare-dodge'])for(const locationId of ['street','shop']) {
   const current={...game,day:3,minutes:2,locationId,money:73.6,energy:51};
   setup(current,{'street-life-trip-v1':{...trip,mode,remaining:20,total:40,before:{...trip.before,game:{...game,day:2,minutes:1422,money:100,energy:70}}}});
   const before=read('street-life-save-v3'),inventory=read('street-life-inventory-v1');
   fireEvent.click(screen.getByRole('button',{name:'Cancel'}));fireEvent(window,new window.Event('pagehide'));
   assert.deepEqual(read('street-life-save-v3'),{...before,locationId:'street'},'cancel retains elapsed time/date and current needs/money');
   assert.deepEqual(read('street-life-inventory-v1'),inventory,'no fare/battery refund');
   assert.equal(read('street-life-trip-v1'),null);assert.equal((read('street-life-journal-history-v1')??[]).length,0,'no arrival result');
   cleanup();render(React.createElement(React.StrictMode,null,React.createElement(App)));
   assert.equal(read('street-life-trip-v1'),null,'cancelled trip cannot return after reload');
   assert.equal(read('street-life-save-v3').locationId,'street');
 }
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
