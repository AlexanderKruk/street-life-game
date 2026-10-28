const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});
global.IS_REACT_ACT_ENVIRONMENT=true;
const scrollCalls=[];
window.scrollTo=(...args)=>scrollCalls.push(args);
window.HTMLElement.prototype.scrollTo=(...args)=>scrollCalls.push(args);
let now=1800000000000, nextId=1;
Date.now=()=>now;
const callbacks=new Map();
window.setInterval=(fn,delay)=>{const id=nextId++;callbacks.set(id,{fn,delay,nextAt:now+delay});return id};
window.clearInterval=id=>callbacks.delete(id);
require('./tests/helpers/build.cjs').buildSync({entryPoints:['src/App.tsx'],bundle:true,platform:'node',format:'cjs',outfile:'phone-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const React=require('react');
const {render,screen,fireEvent,within,act,cleanup,configure}=require('@testing-library/react');
configure({getElementError:message=>new Error(message)});
process.on('uncaughtException',error=>{console.error(error.message.split('Here are')[0]);console.error(error.stack.split('\n').filter(line=>line.includes('check-phone')).join('\n'));cleanup();dom.window.close();process.exit(1)});
const assert=require('node:assert/strict');
const App=require('./phone-app.cjs').default;
const stateKey='street-life-save-v3',invKey='street-life-inventory-v1',lifeKey='street-life-situation-v1';
const read=k=>JSON.parse(localStorage.getItem(k));
function setup(s={},extra={}){
 cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
 localStorage.setItem(stateKey,JSON.stringify({day:1,minutes:480,money:100,hunger:72,thirst:66,energy:68,health:82,hygiene:55,mood:58,intoxication:0,locationId:'street',...s}));
 localStorage.setItem('street-life-effects-v1','[]');
 localStorage.setItem('street-life-discovered-v1','["street","station","shop","support","shelter","work"]');
 localStorage.setItem('street-life-mobile-auto-renew','false');
 localStorage.setItem('street-life-mobile-renewed-day',String(s.day??1));
 localStorage.setItem('street-life-mobile-service-until','5000');
 for(const[k,v]of Object.entries(extra))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 Math.random=()=>.99;
 render(React.createElement(App));
 // Initial normalization may constrain a legacy Mood above its current ceiling.
 fireEvent(window,new window.Event('pagehide'));
}
function click(name){if(screen.queryByRole('dialog',{name:'Rain on the street'})&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name)))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));const dialog=screen.queryByRole('dialog');const target=dialog ? within(dialog).getByRole('button',{name}) : screen.getByRole('button',{name});const previousRandom=Math.random;if(target.dataset.choice?.startsWith('question-')||/Ask AI/.test(target.textContent))Math.random=()=>.34;fireEvent.click(target);Math.random=previousRandom;if(document.querySelector('.phone-activity')&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name))){for(let n=0;n<30&&read('street-life-phone-activity-v1');n++){if(screen.queryByRole('dialog',{name:'Rain on the street'}))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));advance(1000);}}}
function chooseHours(hours){fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:new RegExp('^'+hours+' h')}));}
function beginSleep(name,hours){click(name);if(hours!==undefined)chooseHours(hours);click('Sleep');}
function ok(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Got it',exact:true}));}
function advance(ms){const end=now+ms;while(true){const due=Math.min(...[...callbacks.values()].map(timer=>timer.nextAt));if(due>end)break;now=due;act(()=>{for(const[id,timer]of [...callbacks])if(callbacks.has(id)&&timer.nextAt<=now){timer.nextAt+=timer.delay;timer.fn()}})}now=end;fireEvent(window,new window.Event('pagehide'))}

try {
 // Internal app links reset once; ordinary clock ticks and bottom navigation do not.
 setup({minutes:1320,mood:28});click('Phone');scrollCalls.length=0;
 click('Find Help');assert.deepEqual(scrollCalls.at(-1),[{top:0,left:0,behavior:'instant'}]);
 scrollCalls.length=0;advance(1000);assert.equal(scrollCalls.length,0,'clock ticks preserve the reading position');
 click('Back to phone');assert.deepEqual(scrollCalls.at(-1),[{top:0,left:0,behavior:'instant'}]);
 scrollCalls.length=0;click('Map');assert.equal(scrollCalls.length,0,'lower-menu Map does not force a reset');
 // Street has one phone entry, with no search cost or advance on opening.
 const phoneLabel='Look for more help on my phone.';
 for(const extra of [{}, {'street-life-mobile-service-until':'0'}, {[invKey]:{phoneBattery:0}}, {[invKey]:{phoneBattery:60,phoneCondition:0}}]){
  setup({minutes:1320,mood:28},extra);
  const actions=document.querySelector('.story-actions');
  assert.equal(actions.querySelectorAll('[data-choice="phone-help"]').length,1);
  assert.equal(actions.querySelectorAll('[data-choice^="question-"],[data-choice$="-search"]').length,0);
  const entry=within(actions).getByRole('button',{name:phoneLabel});
  assert(!entry.querySelector('.choice-duration'),'opening the launcher has no duration');
  const before=read(stateKey),battery=read(invKey).phoneBattery,answers=read('street-life-answers-v1'),places=read('street-life-discovered-v1');
  scrollCalls.length=0;fireEvent.click(entry);
  assert.deepEqual(scrollCalls.at(-1),[{top:0,left:0,behavior:'instant'}],'Street phone link opens at the top');
  assert(screen.getByRole('button',{name:'Phone',exact:true}).getAttribute('aria-current')==='page');
  assert.equal(read(stateKey).minutes,before.minutes);assert.equal(read(stateKey).money,before.money);
  assert.equal(read(invKey).phoneBattery,battery);assert.deepEqual(read('street-life-answers-v1'),answers);assert.deepEqual(read('street-life-discovered-v1'),places);
  assert(!read('street-life-phone-activity-v1'));assert(!screen.queryByRole('dialog'));
  if(extra[invKey])assert(screen.getByText('Phone unavailable'));
  else {
   assert.equal(document.querySelectorAll('.phone-app-grid button').length,5);
   assert.equal(screen.getByRole('button',{name:'Find Help',exact:true}).disabled,!!extra['street-life-mobile-service-until']);
   click('Notes');click('Street');click(phoneLabel);
   assert(document.querySelector('.phone-app-grid'),'Street always opens the phone home, not the previously viewed app');
  }
 }
 // The Station suggestion teaches Map before opening the travel choices.
 setup({minutes:1320,mood:28});
 const beforeMap=read(stateKey),beforeMapBattery=read(invKey).phoneBattery;
 scrollCalls.length=0;click('Try the station. At least I’d be out of the cold.');
 assert.deepEqual(scrollCalls.at(-1),[{top:0,left:0,behavior:'instant'}],'Station link opens Map at the top');
 assert.equal(screen.getByRole('button',{name:'Map',exact:true}).getAttribute('aria-current'),'page');
 assert(document.querySelector('.district-pin.selected').textContent.includes('Station'));
 assert(document.querySelector('.district-card').textContent.includes('Station'));
 assert(!document.querySelector('.travel-sheet'));assert(!read('street-life-trip-v1'));
 assert.equal(read(stateKey).minutes,beforeMap.minutes);assert.equal(read(invKey).phoneBattery,beforeMapBattery);
 click(/^Night Shelter Open/);
 assert(document.querySelector('.district-pin.selected').textContent.includes('Night Shelter'),'other places remain selectable');
 click(/^Station Open/);click('Go →');
 assert(document.querySelector('.travel-sheet'));assert(screen.getByRole('button',{name:/Public transport/}));
 assert.equal(read(stateKey).minutes,beforeMap.minutes);assert(!read('street-life-trip-v1'));
 // Leaving the map clears the one-time suggested focus.
 click('Close travel options');fireEvent.click(document.querySelector('.nav-item.home'));click('Map');assert(!document.querySelector('.district-pin.selected'));
 fireEvent.click(document.querySelector('.nav-item.home'));click('Try the station. At least I’d be out of the cold.');
 assert(!document.querySelector('.travel-sheet'));assert(document.querySelector('.district-pin.selected').textContent.includes('Station'));
 // Launcher: exactly four apps; internal screens have separate content.
 setup({locationId:'station',minutes:600});
 scrollCalls.length=0;click('Phone');
 assert.equal(scrollCalls.length,0,'bottom navigation retains existing scroll behavior');
 assert.equal(document.querySelectorAll('.phone-app-grid button').length,5);
 assert.deepEqual([...document.querySelectorAll('.phone-app-grid button')].map(node=>node.getAttribute('aria-label')),['Find Help','Goals','Notes','History','Settings']);
 assert(!screen.queryByRole('button',{name:'Journal',exact:true}));
 assert(!screen.queryByRole('button',{name:'Music',exact:true}));
 assert(!screen.queryByRole('button',{name:'Video',exact:true}));
 assert(!screen.queryByRole('button',{name:'Navigation',exact:true}));
 click('Goals');assert(document.querySelector('.journal-goals'));assert(!document.querySelector('.journal-history'));
 click('Back to phone');click('Notes');assert(document.querySelector('.phone-notes-list'));assert(screen.getByText('Saved information'));
 assert(!document.querySelector('.journal-goals'));assert(!document.querySelector('.journal-history'));
 assert(!document.querySelector('.phone-notes-list').textContent.includes('Free Clinic'));
 click('Back to phone');click('History');assert(document.querySelector('.journal-history'));assert(!document.querySelector('.journal-goals'));
 click('Back to phone');assert(screen.getByRole('button',{name:'Find Help',exact:true}));
 // Legacy Journal selection opens the phone without rewriting goals/history.
 const entry={day:1,minute:500,title:'A saved thought',text:'I remember this.',reflection:true};
 setup({locationId:'station',minutes:600},{'street-life-screen':'journal','street-life-journal-history-v1':[entry],'street-life-journal-goals-v1':{morning:true,shelter:false,support:false,work:false}});
 assert.equal(localStorage.getItem('street-life-screen'),'phone');click('History');assert(screen.getByText('I remember this.'));
 assert.equal(read('street-life-journal-history-v1').length,1);
 click('Back to phone');click('Goals');assert(!document.querySelector('.completed-goals'),'retired morning goal does not migrate as a completed current goal');assert(document.querySelector('.main-goal').textContent.includes('Find a safe place to sleep'));assert(!read('street-life-journal-goals-v1').work);
 // No internet locks only Search; stored notes, goals, history stay accessible.
 setup({locationId:'station',money:0},{'street-life-mobile-service-until':'0'});
 click('Phone');assert(screen.getByRole('button',{name:'Find Help',exact:true}).disabled);
 click('Notes');assert(screen.getByText('Saved information'));click('Back to phone');click('Goals');assert(document.querySelector('.journal-goals'));
 // Buying a day from the header activates Search and preserves the clock.
 setup({locationId:'station',minutes:600},{'street-life-mobile-service-until':'0'});
 click('Phone');const unpaidBefore=read(stateKey);click('Mobile plan');click('Add 24 hours of mobile service for 1 zł');ok();
 assert.equal(read(stateKey).money,unpaidBefore.money-1);assert.equal(read(stateKey).minutes,unpaidBefore.minutes);
 assert(!screen.getByRole('button',{name:'Find Help',exact:true}).disabled);
 // Searches use the existing timed flow indoors, save real results, and survive reload.
 setup({locationId:'station',minutes:600},{'street-life-discovered-v1':['street','station','shop']});
 click('Phone');click('Find Help');const beforeSearch=read(stateKey),beforeBattery=read(invKey).phoneBattery;
 Math.random=()=>.34;fireEvent.click(screen.getByRole('button',{name:'Work',exact:true}));
 assert(screen.getByRole('dialog',{name:'Looking for information'}));
 advance(249);assert.equal(read(stateKey).minutes,beforeSearch.minutes);assert.equal(read('street-life-phone-activity-v1').remaining,15);
 advance(1);assert.equal(read(stateKey).minutes,beforeSearch.minutes+1);assert.equal(read('street-life-phone-activity-v1').remaining,14);
 advance(249);assert.equal(read(stateKey).minutes,beforeSearch.minutes+1);
 advance(1);assert.equal(read(stateKey).minutes,beforeSearch.minutes+2);assert.equal(document.querySelector('.phone-activity .travel-elapsed').textContent,'02m');
 advance(2500);assert.equal(read(stateKey).minutes,beforeSearch.minutes+12);assert.equal(document.querySelector('.phone-activity .travel-elapsed').textContent,'12m');
 assert.equal(read('street-life-phone-activity-v1').remaining,3);assert(document.querySelector('.phone-screen[inert]'));
 cleanup();render(React.createElement(App));assert.equal(read('street-life-phone-activity-v1').remaining,3);
 assert(screen.getByRole('dialog',{name:'Looking for information'}));
 advance(749);assert.equal(read('street-life-phone-activity-v1').remaining,1);advance(1);assert.equal(read('street-life-phone-activity-v1'),null);
 assert.equal(read(stateKey).minutes,beforeSearch.minutes+15);
 assert(read(invKey).phoneBattery<beforeBattery);assert(read('street-life-discovered-v1').includes('work'));
 assert.equal(read('street-life-journal-goals-v1').workKnown,true);assert.equal(read('street-life-journal-goals-v1').work,false,'finding Day Work is not earned pay');assert(screen.getByRole('dialog').textContent.includes('Day Work'));
 advance(1000);assert.equal(read(stateKey).minutes,beforeSearch.minutes+15);ok();
 advance(999);assert.equal(read(stateKey).minutes,beforeSearch.minutes+15);advance(1);assert.equal(read(stateKey).minutes,beforeSearch.minutes+16);
 click('Phone');click('Notes');assert(screen.getByRole('heading',{name:/Day Work/}));
 // New clinic search uses the same timing and saves an actual clinic note.
 setup({locationId:'station',minutes:600},{'street-life-discovered-v1':['street','station','shop']});
 click('Phone');click('Find Help');click('Medical help');assert(read('street-life-discovered-v1').includes('free-clinic'));ok();
 click('Back to phone');click('Notes');assert(screen.getByRole('heading',{name:/Free Clinic/}));
 // No battery or a broken device hides every app but leaves travel available.
 for(const phone of [{phoneBattery:0,phoneCondition:72},{phoneBattery:60,phoneCondition:0}]) {
  setup({locationId:'street',minutes:600},{[invKey]:phone});
  click('Phone');assert(screen.getByText('Phone unavailable'));assert(!document.querySelector('.phone-app-grid'));
  assert(!document.querySelector('.phone-app-content'));click('Map');assert(screen.getByRole('button',{name:'Small Shop'}));
  click('Small Shop');click(/Walk/);assert(read('street-life-trip-v1'));
 }
 // Expiring service while Search is open disables its actions without hiding history.
 setup({locationId:'station',minutes:600},{'street-life-mobile-service-until':'602'});
 click('Phone');click('Find Help');advance(3000);
 assert([...document.querySelectorAll('.phone-search-row')].every(button=>button.disabled));
 assert(screen.getByText(/Mobile internet is unpaid/));click('Back to phone');click('History');assert(document.querySelector('.journal-history'));
 // Morning checkout interrupts a search before the departure dialog opens.
 setup({locationId:'shelter',day:2,minutes:449},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7,shelterLastStayDay:1},'street-life-mobile-service-until':'5000'});
 click('Phone');click('Find Help');Math.random=()=>.34;fireEvent.click(screen.getByRole('button',{name:'Work',exact:true}));advance(1000);
 assert(!read('street-life-phone-activity-v1'));assert.equal(screen.getAllByRole('dialog').length,1);
 assert(screen.getByRole('dialog').textContent.includes('Search interrupted'));
 const interruption=read('street-life-journal-history-v1').find(entry=>entry.actionId==='search-interrupted');
 assert.equal(interruption.text,'I didn’t find the answer I was looking for. I still need to find out.');ok();
 assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));
 console.log('PASS: Phone apps, migration, offline notes, plan payment, indoor timed search/reload, work/clinic discovery, dead-phone travel, service expiry.');
} finally { cleanup();dom.window.close(); }
