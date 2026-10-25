const env = require('../helpers/regression-env.cjs');
const { React, render, screen, fireEvent, within, cleanup, assert, App, stateKey, invKey, lifeKey, read, setup, click, beginSleep, ok, advance, discoverHelp } = env;
// Street has three contextual choices; the test shortcut is gone. Bottle search
// still opens through the ordinary action when normal priorities select it.
for(const [state,extra,hasBottles] of [
 [{minutes:1320},{},false],
 [{day:2,minutes:600},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}},false],
 [{day:2,minutes:600},{'street-life-discovered-v1':['street','station','shop']},false],
 [{day:2,minutes:600,money:0},{},false],
 [{day:2,minutes:600},{},true],
]) {
 setup(state,extra);
 const choices=[...document.querySelectorAll('.story-actions > button')];
 assert.equal(choices.length,3);assert(!document.querySelector('[data-temporary]'));
 assert.equal(choices.filter(button=>button.dataset.choice==='bottles').length,hasBottles?1:0);
 assert(!screen.queryByRole('button',{name:/Look for bottles \(test\)/}));
 if(hasBottles){
  let draw=0;Math.random=()=>++draw%10/10;click(/Maybe there are bottles I could return for a little money/);
  assert(document.querySelector('.trash-bin'));assert(screen.getByRole('button',{name:'Finish searching'}));
 }
}

// Deposit collection: intact PET and cans share the same carried stack; damaged
// containers never earn a deposit, and a full backpack cannot collect either.
const depositEmptyBag={water:0,food:0,medicines:0,bread:0,cannedFood:0,wipes:0,showerGel:0,cigarettes:0,bottles:0};
for(const [draw,art,kept] of [[0,'can',2],[.5,'plastic',4],[.99,'plastic-crushed',0]]) {
 setup({day:2,minutes:600},{[invKey]:depositEmptyBag});Math.random=()=>draw;
 click(/Maybe there are bottles I could return for a little money/);
 assert.equal(document.querySelectorAll('.trash-piece').length,18);
 const containers=[...document.querySelectorAll('.bottle-piece')];
 assert(containers.length>=2&&containers.length<=6);
 assert(containers.every(piece=>piece.dataset.art===art));
 assert([...document.querySelectorAll('.trash-piece:not(.bottle-piece)')].every(piece=>!piece.dataset.art.startsWith('can')),'ordinary clutter does not add extra damaged cans');
 assert([...document.querySelectorAll('.trash-piece img')].every(img=>img.src.endsWith('.webp')));
 for(const piece of containers)fireEvent.click(piece);
 if(!kept)assert(containers.every(piece=>piece.isConnected),'damaged containers ignore clicks');
 fireEvent(window,new window.Event('pagehide'));
 assert.equal(read(invKey).bottles,kept);
 click('Finish searching');
 assert(document.querySelector('.bottle-search-reward').textContent.includes(kept?`+${kept}`:'Nothing useful'));
 assert.equal(document.querySelectorAll('.result-change-list .positive').length,0,'no duplicate container gain');
}
// Cans use the more generous eligibility rate; a controlled pile can contain
// three sound cans and one damaged can without additional cans in the clutter.
setup({day:2,minutes:600},{[invKey]:depositEmptyBag});
const canDraws=[.5,...Array(17).fill(0),.1,.5,.5,.5,.5];
for(const eligibility of [.7,.7,.7,.9])canDraws.push(.1,eligibility,.5,.5,.5,.5);
let canDrawIndex=0;Math.random=()=>canDraws[canDrawIndex++]??.5;
click(/Maybe there are bottles I could return for a little money/);
assert.equal(document.querySelectorAll('[data-art="can"]').length,3);
assert.equal(document.querySelectorAll('[data-art="can-crushed"]').length,1);
// Tapping litter cannot clear the pile. Only dragging it out removes that item;
// accepted deposit containers remain available even when moved across an edge.
setup({day:2,minutes:600},{[invKey]:depositEmptyBag});Math.random=()=>.5;
click(/Maybe there are bottles I could return for a little money/);
const trashBounds={left:0,top:0,width:400,height:300};
document.querySelector('.trash-pile').getBoundingClientRect=()=>trashBounds;
function trashPointer(piece,type,x,y){
 piece.setPointerCapture=()=>{};piece.hasPointerCapture=()=>true;piece.releasePointerCapture=()=>{};
 const event=new window.Event(type,{bubbles:true});Object.assign(event,{clientX:x,clientY:y,pointerId:1});fireEvent(piece,event);
}
const litter=document.querySelector('.trash-piece:not(.bottle-piece)');
const center=piece=>[parseFloat(piece.style.left)*4,parseFloat(piece.style.top)*3];
let [lx,ly]=center(litter);const pileCount=document.querySelectorAll('.trash-piece').length;
fireEvent.click(litter);trashPointer(litter,'pointerdown',lx,ly);trashPointer(litter,'pointerup',lx,ly);
assert(litter.isConnected);assert.equal(document.querySelectorAll('.trash-piece').length,pileCount);
trashPointer(litter,'pointerdown',lx,ly);trashPointer(litter,'pointermove',200,150);trashPointer(litter,'pointerup',200,150);
assert(litter.isConnected,'moving litter inside keeps it');
trashPointer(litter,'pointerdown',200,150);trashPointer(litter,'pointermove',430,150);
assert(!litter.isConnected);assert.equal(document.querySelectorAll('.trash-piece').length,pileCount-1,'only dragged litter is discarded');
const keptContainer=document.querySelector('.bottle-piece');let [bx,by]=center(keptContainer);
trashPointer(keptContainer,'pointerdown',bx,by);trashPointer(keptContainer,'pointercancel',bx,by);trashPointer(keptContainer,'pointerup',bx,by);
assert(keptContainer.isConnected,'cancelled taps cannot collect a container');
trashPointer(keptContainer,'pointerdown',bx,by);trashPointer(keptContainer,'pointermove',430,150);trashPointer(keptContainer,'pointerup',430,150);
assert(keptContainer.isConnected);assert.equal(document.querySelector('.trash-search-row strong').textContent,'0','dragging never collects a container');
[bx,by]=center(keptContainer);trashPointer(keptContainer,'pointerdown',bx,by);trashPointer(keptContainer,'pointermove',bx+2,by+1);trashPointer(keptContainer,'pointerup',bx+2,by+1);
assert(!keptContainer.isConnected);assert.equal(document.querySelector('.trash-search-row strong').textContent,'1','tiny finger motion remains a tap');
const keyboardLitter=document.querySelector('.trash-piece:not(.bottle-piece)');
for(let i=0;i<30&&keyboardLitter.isConnected;i++)fireEvent.keyDown(keyboardLitter,{key:'ArrowRight'});
assert(!keyboardLitter.isConnected,'keyboard users can move litter out instead of clicking it away');
setup({day:2,minutes:600},{[invKey]:depositEmptyBag});Math.random=()=>.99;click(/Maybe there are bottles I could return for a little money/);
const damaged=document.querySelector('.bottle-piece');document.querySelector('.trash-pile').getBoundingClientRect=()=>trashBounds;
const [dx,dy]=center(damaged);trashPointer(damaged,'pointerdown',dx,dy);trashPointer(damaged,'pointerup',dx,dy);
assert(damaged.isConnected,'damaged bottles also ignore pointer taps');
trashPointer(damaged,'pointerdown',dx,dy);trashPointer(damaged,'pointermove',430,150);
assert(!damaged.isConnected,'damaged bottles can be dragged away like other rubbish');
setup({day:2,minutes:600},{[invKey]:{...depositEmptyBag,water:4,food:4,medicines:24}});Math.random=()=>0;
click(/Maybe there are bottles I could return for a little money/);fireEvent.click(document.querySelector('.bottle-piece'));
fireEvent(window,new window.Event('pagehide'));assert.equal(read(invKey).bottles,0);
assert.equal(document.querySelector('.trash-search-row strong').textContent,'0');
// Legacy bottle saves retain their value, including shared stack semantics.
setup({locationId:'shop',minutes:600},{[invKey]:{...depositEmptyBag,bottles:3}});
const depositMoney=read(stateKey).money;
click(/Return bottles & cans ×3/);advance(1250);
assert.equal(read(invKey).bottles,0);assert.equal(read(stateKey).money,depositMoney+1.5);

// Three normal directions.
function storyIds(){return [...document.querySelectorAll('.story-actions > button')].map(button=>button.dataset.choice);}
function assertStoryChoices(expected){assert.deepEqual([...storyIds()].sort(),[...expected].sort());}
const choiceCode=require('../helpers/build.cjs').buildSync({entryPoints:['src/streetChoiceOrder.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const choiceModule={exports:{}};new Function('module','exports',choiceCode)(choiceModule,choiceModule.exports);
const {shuffleChoiceOrder}=choiceModule.exports;
const choiceInput=['information','rest','practical'];
const gameplayRandom=Math.random;Math.random=()=>{throw Error('UI order must not consume a gameplay roll')};
const permutations=new Set();
for(let seed=0;seed<120;seed++){const order=shuffleChoiceOrder(choiceInput,seed,'decision');permutations.add(order.join('|'));assert.deepEqual([...order].sort(),[...choiceInput].sort());assert.deepEqual(order,shuffleChoiceOrder(choiceInput,seed,'decision'));}
assert.equal(permutations.size,6,'all six three-option orders are reachable');
assert.deepEqual(choiceInput,['information','rest','practical']);Math.random=gameplayRandom;
const optionCode=require('../helpers/build.cjs').buildSync({entryPoints:['src/ChoiceOptions.tsx'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',write:false,external:['react','react/jsx-runtime']}).outputFiles[0].text;
const optionModule={exports:{}};new Function('require','module','exports',optionCode)(require,optionModule,optionModule.exports);
const {orderChoiceNodes}=optionModule.exports;
for(const labels of [['Yes','No'],['Accept','Decline'],['Pick it up','Leave it'],['Start','Cancel']])for(let seed=0;seed<20;seed++){
 const nodes=labels.map(label=>React.createElement('button',{'aria-label':label,key:label},label));
 assert.deepEqual(orderChoiceNodes(nodes,seed,'dialog').map(node=>node.props['aria-label']),labels,'conventional binary pairs stay in order');
}
const durations=['2 h','4 h','6 h','8 h'].map(label=>React.createElement('button',{key:label},label));
assert.deepEqual(orderChoiceNodes(durations,42,'sleep',true).map(node=>node.props.children),['2 h','4 h','6 h','8 h']);

setup({minutes:1320});assertStoryChoices(['phone-help','music-walk','station-route']);
const initialChoices=storyIds();const originalChoice=document.querySelector('.story-actions > button');originalChoice.focus();advance(10000);assert.equal(document.activeElement,originalChoice,'ticks preserve the focused choice');assert.deepEqual(storyIds(),initialChoices);cleanup();render(React.createElement(App));assert.deepEqual(storyIds(),initialChoices);
click('Where can I get help in the morning?');ok();assertStoryChoices(['phone-help','music-walk','station-route']);discoverHelp();assertStoryChoices(['phone-help','music-walk','station-route']);
click('How can I get a shelter bed?');ok();assertStoryChoices(['phone-help','find-bench','station-route']);
for(const [state,extra,expected] of [
 [{minutes:1320,mood:28},{},['phone-help','music-walk','station-route']],
 [{minutes:1320,energy:20},{},['phone-help','street-sleep','station-route']],
 [{minutes:1320,thirst:20},{[invKey]:{phoneBattery:30}},['phone-help','music-walk','station-route']],
 [{minutes:1320,thirst:20},{[invKey]:{phoneBattery:31}},['phone-help','music-walk','station-route']],
 [{minutes:600,money:0},{},['phone-help','music-walk','beg']],
]){setup(state,extra);assertStoryChoices(expected);assert.equal(storyIds().filter(id=>id==='phone-help').length,1);assert(!storyIds().some(id=>id.startsWith('question-')||id.endsWith('-search')));}

// One-level choices react immediately; result reading pauses the clock.
setup({minutes:1320});assert(document.querySelector('[data-choice="phone-help"]').textContent.includes('Look for help on my phone'));click('Where can I get help in the morning?');assert(screen.getByRole('dialog').textContent.includes('last job application'));ok();discoverHelp();assert(document.querySelector('[data-choice="phone-help"]'));
setup({minutes:1320});assert(!document.querySelector('[data-choice="walk"]'));click('Where can I get help in the morning?');assert(screen.getByRole('dialog').textContent.includes('redundancy email'));ok();discoverHelp();click('How can I get a shelter bed?');assert(screen.getByRole('dialog').textContent.includes('A bed for the night, meals and a shower.'));assert(screen.getByRole('dialog').textContent.includes('Try to arrive before 18:00'));assert(!screen.getByRole('dialog').textContent.includes('a place to live'),'shelter discovery no longer appends biography');assert(!read('street-life-memories-v1').includes('lost-home'),'removed shelter memory is not recorded');ok();Math.random=()=>0;click(/Is there a bench nearby\?/);ok();click(/I’ll sit for a bit/);assert(screen.getByRole('dialog').textContent.includes('ordinary expenses'));ok();if(document.querySelector('.event-overlay')){fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button')[0]);ok();}fireEvent.click(screen.getByRole('button',{name:'Reset save'}));assert.deepEqual(read('street-life-memories-v1'),[]);assert(!document.querySelector('.story-scene').textContent.includes('office'));
setup({minutes:1320,mood:28},{'street-life-discovered-v1':['street','station','shop']});
const openingText=document.querySelector('.story-scene div > p:last-child').textContent;assert.equal(openingText,'Behind the lit windows, people are getting ready for bed. You sit outside with your backpack. You have nowhere to go, and no one is expecting you tonight.');
const phoneThought=document.querySelector('[data-choice="phone-help"]');
assert.equal(document.querySelectorAll('.story-actions .choice-duration').length,2);assert.equal(phoneThought.querySelector('.choice-estimate'),null);
assert.equal(document.querySelector('[data-choice="music-walk"] .choice-duration').textContent,'≈30m');
assert.equal(document.querySelector('[data-choice="station-route"] .choice-duration').textContent,'≈30m+');
assert(!phoneThought.querySelector('.choice-emoji'));assert.equal(phoneThought.querySelector('.story-action-icon').getAttribute('aria-hidden'),'true');
assert(!screen.queryByRole('button',{name:'Choose another approach',exact:true}));assert(!screen.queryByRole('button',{name:'Other actions',exact:true}));assert(!document.querySelector('.location-summary + .event'));
assert(!document.querySelector('.story-choices').textContent.includes('TIME PAUSED'));
click('Where can I get help in the morning?');assert(screen.getByRole('dialog'));assert.equal(read(stateKey).minutes,1335);assert(Math.abs(read(stateKey).mood-31)<1e-8);const answerState=read(stateKey);advance(10000);assert.deepEqual(read(stateKey),answerState);ok();discoverHelp();assert(document.querySelector('[data-choice="phone-help"]'));assert(!screen.queryByRole('button',{name:'Choose another approach',exact:true}));
setup({minutes:1320});assert(!screen.queryByRole('button',{name:/What about Night Shelter\? Maybe there is a place./}));
setup({minutes:1320});click(/Try the station. At least I’d be out of the cold./);assert(document.querySelector('.district-pin.selected').textContent.includes('Station'));assert(!document.querySelector('.travel-sheet'));click('Go →');assert(screen.getByRole('button',{name:/Public transport/}));assert.equal(read(stateKey).minutes,1320);
// Music walking retains its time/need costs; ordinary wandering is no longer offered.
setup({minutes:1320},{'street-life-discovered-v1':['street','station','shop'],[invKey]:{clothingCleanliness:80}});assert(!screen.queryByRole('button',{name:'Earn something for food',exact:true}));assert(screen.getByRole('button',{name:'Try the station. At least I’d be out of the cold.',exact:true}));const dryEnergy=read(stateKey).energy;click(/Put on something familiar and walk for a while. Clear my head./);assert.equal(read(stateKey).minutes,1350);assert(read(stateKey).energy<dryEnergy);assert(!read(stateKey).rainUntil);assert(Math.abs(read(invKey).clothingCleanliness-(80-30*30/1440))<1e-8);ok();assert(!screen.queryByRole('dialog',{name:'Rain on the street'}));
// Episodic rain, short shelter searches and interrupted phone/trip progress
// are covered by check-rain.cjs; the removed wetness decision flow is inactive.
setup({minutes:1320,mood:28});const musicBattery=read(invKey).phoneBattery;click(/Put on something familiar and walk for a while. Clear my head./);assert.equal(read(stateKey).minutes,1350);assert.equal(read(stateKey).mood,31);assert(read(invKey).phoneBattery<musicBattery);
const musicResult=screen.getByRole('dialog',{name:'Walk with music'});
assert(musicResult.querySelector('.result-illustration').src.includes('event-music-walk'));
assert.equal(musicResult.querySelector('[data-stat="Mood"] .result-stat-delta').textContent,'+3');
assert(musicResult.querySelector('.result-cost-line').textContent.includes('30 min'));
assert(musicResult.querySelector('.result-cost-line .battery-icon'));
assert(musicResult.textContent.includes('favorite songs'));
assert(!musicResult.textContent.includes('redundancy notice'));
assert(musicResult.querySelector('.result-description').textContent.length<110,'music result remains brief');
assert(document.querySelector('.bottom-nav[inert]'));ok();
assert.equal(read('street-life-music-walk-used-v1'),true);
assert(!document.querySelector('[data-choice="music-walk"]'),'music walk can only be used once per run');
cleanup();render(React.createElement(App));
assert(!document.querySelector('[data-choice="music-walk"]'),'music walk stays used after reload');assert(!document.querySelector('[data-choice="walk"]'),'ordinary walking never replaces the used music walk');
setup({minutes:1320,mood:28},{'street-life-journal-history-v1':[{day:1,minute:1300,actionTitle:'Walk with music',title:'Walked with music',text:'The music helped.',reflection:true}]});
assert.equal(read('street-life-music-walk-used-v1'),true,'older completed music walks migrate from history');
assert(!document.querySelector('[data-choice="music-walk"]'));
click('Reset save');assert.equal(read('street-life-music-walk-used-v1'),false);assert(document.querySelector('[data-choice="music-walk"]'),'new runs restore the one-time choice');
setup({minutes:1320,mood:49},{'street-life-opening-calls-v1':0});click(/Put on something familiar and walk for a while. Clear my head./);assert.equal(read(stateKey).mood,50);assert.equal(screen.getByRole('dialog').querySelector('[data-stat="Mood"] .result-stat-delta').textContent,'+1');ok();
setup({minutes:1320},{[invKey]:{phoneBattery:0}});assert(screen.getByRole('button',{name:/Put on something familiar and walk for a while. Clear my head./}).disabled);assert(!document.querySelector('[data-choice="walk"]'));assertStoryChoices(['phone-help','music-walk','station-route']);
setup({minutes:1320,mood:28},{'street-life-discovered-v1':['street','station','shop']});const questionBattery=read(invKey).phoneBattery;click('Where can I get help in the morning?');assert.equal(read(stateKey).minutes,1335);assert(Math.abs(read(stateKey).mood-31)<1e-8);assert(Math.abs(read(invKey).phoneBattery-(questionBattery-4.5*(1+(100-72)*.007)))<1e-8);assert(read('street-life-discovered-v1').includes('support'));assert(!read('street-life-discovered-v1').includes('daycenter'));assert(screen.getByRole('dialog').textContent.includes('08:00'));ok();const rereadState=read(stateKey),rereadInventory=read(invKey);click(/Inventory$/);click('Phone');click('Find Help');click('Help & hygiene');assert.equal(read(stateKey).minutes,rereadState.minutes+15);assert(read(invKey).phoneBattery<rereadInventory.phoneBattery);ok();click('Street');discoverHelp();cleanup();render(React.createElement(App));assert(read('street-life-answers-v1').includes('morning'));click('How can I get a shelter bed?');assert(screen.getByRole('dialog').textContent.includes('Try to arrive before 18:00'));assert(!screen.getByRole('dialog').textContent.includes('0–3'),'shelter discovery omits vacancy details');assert.equal(read('street-life-goal-v1').minute,1080);ok();click('Reset save');assert.deepEqual(read('street-life-answers-v1'),[]);
// P1: referral opens map, including migration of a v53 save.
// Questions emerge from needs; remembering a station outlet does not need a charged phone.
// Phone stays a single Street choice regardless of urgency or discovered answers.
for(const extra of [{}, {[invKey]:{phoneBattery:0}}, {'street-life-mobile-service-until':'0'}]){
 setup({minutes:1320,thirst:20},extra);assert(document.querySelector('[data-choice="phone-help"]'));
 assert(!document.querySelector('.story-actions [data-choice^="question-"]'));
}
setup({locationId:'support'});click(/Housing/);ok();click(/Map$/);
for (const name of ['Night Shelter','Help Center','Day Work']) assert([...document.querySelectorAll('.district-scene strong')].some(node=>node.textContent===name));
assert(![...document.querySelectorAll('.district-pin')].some(pin=>/Cheap Shop|Street/.test(pin.textContent)));
assert(read(lifeKey).schroniskoReferral);assert(document.querySelector('.district-scene').textContent.includes('Schronisko'));
setup({}, {[lifeKey]:{schroniskoReferral:true}});click(/Map$/);assert(document.querySelector('.district-scene').textContent.includes('Schronisko'));

// Sleep and immediate work must apply disease/dehydration and age both food stores.
setup({hunger:0,thirst:0,health:90,energy:20},{'street-life-effects-v1':[{id:'cold',expiresAt:10000}], [invKey]:{food:2,foodFreshness:100}, 'street-life-storage-v1':{food:2,foodFreshness:100}});
beginSleep(/Lie down here\? I’m not sure… But I could try./);click('Wake up (debug)');
assert(Math.abs(read(stateKey).health - (90 - .147 * 480)) < 1e-8);
assert(Math.abs(read(invKey).foodFreshness - (100 - 100 / 2880 * 480)) < 1e-8);
assert(Math.abs(read('street-life-storage-v1').foodFreshness - read(invKey).foodFreshness) < 1e-8);
setup({locationId:'work',hunger:0,thirst:0,health:90,energy:75},{'street-life-effects-v1':[{id:'cold',expiresAt:10000}], [invKey]:{food:2,foodFreshness:100}});
click(/Take a short shift/);assert(Math.abs(read(stateKey).health - (90 - .147 * 180)) < 1e-8);assert(read(invKey).foodFreshness < 94);


env.finish();
