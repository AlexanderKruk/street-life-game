const assert=require('node:assert/strict');
const originalRandom=Math.random;
require('./tests/helpers/build.cjs').buildSync({legacyEventDialogs:true,entryPoints:['src/foodConsumption.ts'],bundle:true,platform:'node',format:'cjs',outfile:'food-consumption-app.cjs'});
const {foodConsumption}=require('./food-consumption-app.cjs');
for(const [kind,name] of [['bread','bread roll'],['readyMeal','ready meal']]) {
 for(const [freshness,condition,rolls] of [[40,'stale',[0,.95,.99]],[0,'spoiled',[0,.5,.99]]]) {
  for(const roll of rolls) assert(foodConsumption(kind,freshness,()=>roll).message.startsWith(`You eat a ${condition} ${name}.`));
 }
}
for(const [kind,gains] of [['food',[28,20,10]],['bread',[12,8,4]],['readyMeal',[48,34,16]]]) {
 const fresh=foodConsumption(kind,51,()=>{throw Error('Fresh food must not roll')});assert.equal(fresh.hunger,gains[0]);assert.equal(fresh.mood,kind==='food'?2:0);
 for(const [freshness,gain,expected] of [[50,gains[1],[900,80,20]],[20,gains[2],[250,450,300]]]) {
  const counts=[0,0,0];
  for(let i=0;i<1000;i++) {
   let draws=0;const result=foodConsumption(kind,freshness,()=>draws++===0?(i+.5)/1000:0);
   if(result.hunger<0){counts[2]++;assert.deepEqual([result.hunger,result.thirst,result.energy,result.health],[-10,-20,-5,-5]);assert.equal(draws,2)}
   else {assert.equal(result.hunger,gain);assert.equal(result.health,undefined);assert.equal(result.energy,undefined);assert.equal(result.thirst,undefined);counts[result.mood===-3?1:0]++;assert.equal(draws,1)}
  }
  assert.deepEqual(counts,expected);
 }
 for(const [freshness,roll] of [[50,.9],[50,.98],[20,.25],[20,.7]]) {
  const result=foodConsumption(kind,freshness,()=>roll);assert.equal(result.hunger<0,roll===(freshness===50?.98:.7),'exact outcome boundaries');
 }
 for(let loss=5;loss<=10;loss++) {let n=0;assert.equal(foodConsumption(kind,0,()=>n++===0?.99:(loss-5+.5)/6).energy,-loss)}
}
console.log('PASS: exact freshness/outcome boundaries, all food nutrition, 90/8/2 and 25/45/30 odds, vomiting losses and safe fresh food.');
require('./tests/helpers/build.cjs').buildSync({legacyEventDialogs:true,entryPoints:['src/foodInventory.ts'],bundle:true,platform:'node',format:'cjs',outfile:'food-inventory-app.cjs'});
const {foodPortions,foodSlot,withFoodPortions,addFoodPortions,ageFood,consumeFood,discardFood}=require('./food-inventory-app.cjs');
for(const kind of ['food','bread','readyMeal']) {
 const legacy={[kind]:5,[`${kind}Freshness`]:15};assert.deepEqual(foodPortions(legacy,kind),[15,15,15,15,15]);
 const added=addFoodPortions(legacy,kind,[100]);assert.deepEqual(foodPortions(added,kind),[15,15,15,15,15,100]);assert.equal(foodSlot(added,kind,0).spoiled,4);assert.equal(foodSlot(added,kind,1).spoiled,1);
 const cleaned=discardFood(added,kind,1,true);assert.deepEqual(foodPortions(cleaned,kind),[15,15,15,15,100]);
 const repacked=discardFood(cleaned,kind,0,true);assert.deepEqual(foodPortions(repacked,kind),[100]);assert.equal(repacked[`${kind}Freshness`],100);
 const mixed=withFoodPortions(legacy,kind,[0,20,40,100,80,90]);assert.deepEqual(foodPortions(discardFood(mixed,kind,0,true),kind),[40,100,80,90]);assert.deepEqual(foodPortions(discardFood(mixed,kind,0,false),kind),[80,90]);
 assert.deepEqual(foodPortions(consumeFood(mixed,kind,0,'fresh'),kind),[0,20,40,80,90]);assert.strictEqual(consumeFood(mixed,kind,1,'spoiled'),mixed,'cannot consume from another slot');
 const aged=ageFood(mixed,60);const decay=kind==='bread'?100/24:100/48;assert.deepEqual(foodPortions(aged,kind),[0,20-decay,40-decay,100-decay,80-decay,90-decay]);
 assert.deepEqual(foodPortions(JSON.parse(JSON.stringify(aged)),kind),foodPortions(aged,kind));
 const empty=discardFood(withFoodPortions(legacy,kind,[0]),kind,0,false);assert.equal(empty[kind],0);assert.equal(empty[`${kind}Freshness`],100);
}
// Repeated compaction conserves all surviving ages, order and portion counts.
for(let count=1;count<=32;count++) {
 const portions=Array.from({length:count},(_,i)=>[0,20,21,50,51,100][i%6]);
 for(let slot=0;slot<Math.ceil(count/4);slot++) {
  const stock=withFoodPortions({food:0,foodFreshness:100},'food',portions);
  const next=discardFood(stock,'food',slot,true);const expected=portions.filter((v,i)=>i<slot*4||i>=(slot+1)*4||v>20);
  assert.deepEqual(foodPortions(next,'food'),expected);assert.equal(next.food,expected.length);
 }
}
console.log('PASS: per-slot groups, legacy migration, purchases, independent aging, selected-slot consumption, removal and age-preserving compaction.');

const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
let now=1800000000000,id=0;Date.now=()=>now;const timers=new Map();window.setInterval=(fn,delay)=>{const key=++id;timers.set(key,{fn,delay,next:now+delay});return key};window.clearInterval=key=>timers.delete(key);
require('./tests/helpers/build.cjs').buildSync({legacyEventDialogs:true,entryPoints:['src/App.tsx'],bundle:true,platform:'node',format:'cjs',outfile:'food-ui-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const React=require('react');const {render,screen,within,fireEvent,act,cleanup,configure}=require('@testing-library/react');configure({getElementError:message=>new Error(message)});const App=require('./food-ui-app.cjs').default;
const invKey='street-life-inventory-v1',gameKey='street-life-save-v3',read=k=>JSON.parse(localStorage.getItem(k));
function setup(stock={},state={},extra={},strict=false){cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);localStorage.setItem(gameKey,JSON.stringify({day:2,minutes:600,money:100,hunger:20,thirst:66,energy:68,health:82,hygiene:55,mood:28,intoxication:0,locationId:'station',...state}));localStorage.setItem('street-life-effects-v1','[]');localStorage.setItem('street-life-mobile-auto-renew','false');localStorage.setItem('street-life-screen','inventory');localStorage.setItem(invKey,JSON.stringify({water:0,food:0,medicines:0,...stock}));for(const[k,v]of Object.entries(extra))localStorage.setItem(k,JSON.stringify(v));render(strict?React.createElement(React.StrictMode,null,React.createElement(App)):React.createElement(App));fireEvent(window,new window.Event('pagehide'))}
function click(name){fireEvent.click((screen.queryByRole('dialog')?within(screen.getByRole('dialog')):screen).getByRole('button',{name}))}
function ok(){click('Got it')}
function advance(ms){const end=now+ms;while(true){const due=Math.min(...[...timers.values()].map(t=>t.next));if(due>end)break;now=due;act(()=>{for(const[k,t]of [...timers])if(timers.has(k)&&t.next<=now){t.next+=t.delay;t.fn()}})}now=end;fireEvent(window,new window.Event('pagehide'))}
try {
 Math.random=()=>0;
 setup({food:6,foodFreshness:50,foodPortions:[0,10,100,40,80,90]});assert.equal(document.querySelectorAll('.inventory-slot').length,2);assert(document.querySelector('.inventory-slot [title="Spoiled ×2"]'),'spoiled food is still explicitly identified');click('Discard Food ×4');const before=read(gameKey);advance(5000);assert.deepEqual(read(gameKey),before);click('Discard spoiled ×2');assert.deepEqual(read(invKey).foodPortions,[100,40,80,90]);assert.equal(document.querySelectorAll('.inventory-slot').length,1);assert(!document.querySelector('.inventory-slot').textContent.includes('Fresh'), 'fresh portions use the default untagged state');assert(document.querySelector('.inventory-slot [title="Stale ×1"]'),'stale food remains identifiable');cleanup();render(React.createElement(App));assert.deepEqual(read(invKey).foodPortions,[100,40,80,90]);click('Discard Food ×4');assert(screen.getByRole('button',{name:'Discard spoiled ×0'}).disabled);click('Discard all');assert.equal(read(invKey).food,0);assert(screen.getByText('Your backpack is empty.'));
 setup({food:6,foodPortions:[50,50,50,50,0,100]});click('Discard Food ×2');click('Discard spoiled ×1');assert.deepEqual(read(invKey).foodPortions,[50,50,50,50,100]);click('Discard Food ×4');click('Discard all');assert.deepEqual(read(invKey).foodPortions,[100]);
 setup({food:6,foodPortions:[0,0,0,0,100,100]});click(/Food ×2.*tap to eat/);assert(screen.getByRole('dialog').textContent.includes('+28'));assert(!screen.queryByRole('dialog',{name:'Eat Food?'}));ok();assert.equal(read(invKey).food,5);click(/Food ×4.*tap to eat/);assert(screen.getByRole('dialog',{name:'Eat Food?'}));assert(!screen.queryByRole('button',{name:/^Fresh ×/}));assert(screen.getByRole('button',{name:'Spoiled ×4'}));click('Cancel');assert.equal(read(invKey).food,5);
 setup({food:3,foodPortions:[0,40,100]});click(/Food ×3.*tap to eat/);assert(screen.getByRole('button',{name:'Fresh ×1'}));assert(screen.getByRole('button',{name:'Stale ×1'}));assert(screen.getByRole('button',{name:'Spoiled ×1'}));const paused=read(gameKey);advance(5000);assert.deepEqual(read(gameKey),paused);click('Fresh ×1');assert.equal(read(gameKey).hunger,48);assert.equal(read(gameKey).health,82);assert.deepEqual(read(invKey).foodPortions,[0,40]);ok();click(/Food ×2.*tap to eat/);assert(!screen.queryByRole('button',{name:/^Fresh ×/}));click('Stale ×1');assert.equal(read(gameKey).hunger,68);assert.equal(read(gameKey).health,82);ok();click(/Food ×1.*tap to eat/);click('Spoiled ×1');assert.equal(read(gameKey).hunger,78);assert.equal(read(gameKey).health,82);ok();assert.equal(read(invKey).food,0);
 for(const [kind,name,gain]of [['bread','Bread roll',4],['readyMeal','Ready meal',16]]){setup({[kind]:1,[`${kind}Portions`]:[0]});click(new RegExp(name+'.*tap to eat'));assert(screen.getByRole('dialog',{name:'Eat '+name+'?'}));click('Spoiled ×1');assert.equal(read(gameKey).hunger,20+gain);assert.equal(read(gameKey).health,82);ok()}
 // Every perishable type uses its selected portion, with each outcome checked
 // through the real UI, result summary and save. StrictMode must not re-roll.
 for(const [kind,name,staleGain,spoiledGain] of [['food','Food',20,10],['bread','Bread roll',8,4],['readyMeal','Ready meal',34,16]]) {
  for(const [freshness,label,gain,rolls] of [[40,'Stale',staleGain,[0,.95,.99]],[0,'Spoiled',spoiledGain,[0,.5,.99]]]) {
   for(const [outcome,roll] of rolls.entries()) {
    setup({[kind]:2,[`${kind}Portions`]:[freshness,100]},{},{},true);const before=read(gameKey);let draws=0;Math.random=()=>{draws++;return roll};
    assert(!document.querySelector('.inventory-slot').textContent.includes('Health−'));click(new RegExp(name+'.*tap to eat'));click('Cancel');assert.equal(draws,0,'opening/cancelling never rolls');assert.deepEqual(read(gameKey),before);assert.equal(read(invKey)[kind],2);click(new RegExp(name+'.*tap to eat'));
    const option=screen.getByRole('button',{name:label+' ×1'});assert(/poisoning risk/i.test(option.textContent));assert(option.getAttribute('aria-describedby').includes('food-risk-effects'));
    assert(screen.getByRole('dialog').textContent.includes('Energy −5–10'));click(label+' ×1');const after=read(gameKey);
    assert.equal(draws,outcome===2?2:1,'one outcome roll, even under StrictMode');assert.equal(after.minutes,before.minutes);
    assert.equal(after.hunger,outcome===2?10:20+gain);assert.equal(after.thirst,outcome===2?46:66);assert.equal(after.energy,outcome===2?58:68);assert.equal(after.health,outcome===2?77:82);assert.equal(after.mood,outcome===1?25:28);
    assert.deepEqual(read(invKey)[`${kind}Portions`],[100]);assert(screen.getByRole('dialog').textContent.includes(outcome===2?'You vomited':outcome===1?'nauseous, but the food stays down':'feel fine'));
    const resultDialog=screen.getByRole('dialog',{name:['You feel fine','Nausea','You vomited'][outcome]});assert(resultDialog.classList.contains('illustrated-result'));assert.equal(screen.getAllByRole('dialog').length,1);
    const art=within(resultDialog).getByRole('img');assert(art.getAttribute('src').endsWith(`event-food-${['fine','nausea','vomiting'][outcome]}-480.webp`));assert(/480w.*768w.*1024w/.test(art.getAttribute('srcset')));assert(art.alt.length>20);
    const completed=read(gameKey);advance(5000);assert.deepEqual(read(gameKey),completed,'result pauses');cleanup();render(React.createElement(App));assert.deepEqual(read(gameKey),completed,'completed outcome survives reload');assert.deepEqual(read(invKey)[`${kind}Portions`],[100]);
   }
  }
 }
 Math.random=()=>0;
 setup({food:3,foodFreshness:0},{locationId:'shop'});click('Small Shop');click('Buy Cheap food for 5.00 zł');ok();click(/^Inventory$/);const bought=read(invKey).foodPortions;assert.deepEqual(bought.slice(0,3),[0,0,0]);assert(bought[3]>99&&bought[3]<=100);assert(document.querySelector('.inventory-slot [title="Spoiled ×3"]'),'older food remains identifiable after purchase');
 setup({food:6,foodPortions:[0,5,40,80,90,100]},{locationId:'residential-shelter'},{'street-life-situation-v1':{housing:'Schronisko',schroniskoReferral:true}});click('Schronisko');fireEvent.click(within(screen.getByText(/^Food ×\d+\/4$/).closest('div')).getByRole('button',{name:'Store'}));ok();assert.deepEqual(read(invKey).foodPortions,[90,100]);assert.deepEqual(read('street-life-storage-v1').foodPortions,[0,5,40,80]);fireEvent.click(within(screen.getByText(/^Food ×\d+\/4$/).closest('div')).getByRole('button',{name:'Take'}));ok();assert.deepEqual(read(invKey).foodPortions,[90,100,0,5,40,80]);assert.equal(read('street-life-storage-v1').food,0);
 console.log('PASS: UI slot labels, spoiled/all removal, compaction, pause/reload, freshness choices, fresh-only bypass, actual gains and storage transfers.');
} finally {Math.random=originalRandom;cleanup();dom.window.close()}
