const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for (const key of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent']) global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});
global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};
window.matchMedia=()=>({matches:true});
let now=1800000000000,nextId=1;
Date.now=()=>now;
const timers=new Map();
window.setInterval=(fn,delay)=>{const id=nextId++;timers.set(id,{fn,delay,nextAt:now+delay});return id};
window.clearInterval=id=>timers.delete(id);
require('esbuild').buildSync({entryPoints:['src/App.tsx'],bundle:true,define:{'import.meta.env':'{}'},platform:'node',format:'cjs',outfile:'opening-calls-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const React=require('react');
const {render,screen,fireEvent,within,act,cleanup,configure}=require('@testing-library/react');
configure({getElementError:message=>new Error(message)});
const App=require('./opening-calls-app.cjs').default;
const gameKey='street-life-save-v3',invKey='street-life-inventory-v1',callKey='street-life-opening-calls-v1',activityKey='street-life-phone-activity-v1';
const read=key=>JSON.parse(localStorage.getItem(key));
function setup(extra={}){
  cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
  localStorage.setItem('street-life-mobile-auto-renew','false');
  localStorage.setItem('street-life-mobile-service-until','0');
  for(const [key,value] of Object.entries(extra))localStorage.setItem(key,JSON.stringify(value));
  Math.random=()=>.99;render(React.createElement(App));
}
function reload(){fireEvent(window,new window.Event('pagehide'));cleanup();render(React.createElement(App));}
function advance(ms){
  const end=now+ms;
  while(true){
    const due=Math.min(...[...timers.values()].map(timer=>timer.nextAt));if(due>end)break;now=due;
    act(()=>{for(const [id,timer] of [...timers])if(timers.has(id)&&timer.nextAt<=now){timer.nextAt+=timer.delay;timer.fn()}});
  }
  now=end;fireEvent(window,new window.Event('pagehide'));
}
function callButton(){return document.querySelector('[data-choice="phone-call"]');}
function closeResult(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Got it',exact:true}));}
function assertResult(mood,index,asset){
  assert.equal(read(gameKey).mood,mood);assert.equal(read(callKey),index);
  assert(!read(activityKey));assert(screen.getByRole('dialog').textContent.includes(index===1?'No answer':index===2?'my wife':'single room'));
  assert(document.querySelector('.result-illustration').src.includes(asset));
  const summary = screen.getByRole('dialog').querySelector('.result-cost-line');
  assert(summary?.textContent.includes(`${index === 1 ? 2 : 5} min`));
  assert(!summary?.querySelector('.compact-info-mood'), 'call Mood uses the shared event stat card');
  const moodPanel = screen.getByRole('dialog').querySelector('[data-stat="Mood"]');
  assert(moodPanel?.querySelector('[role="meter"]'), 'call Mood has the same meter as event results');
  assert.equal(moodPanel?.querySelector('.status-stat-value > span')?.textContent, `${mood}%`);
  assert.equal(moodPanel?.querySelector('.result-stat-delta.negative')?.textContent, `−${index === 1 ? 2 : 5}`);
  assert.equal(moodPanel?.querySelector('.bar-loss-trail')?.style.width, `${index === 1 ? 2 : 5}%`);
  assert.equal(moodPanel?.querySelector('.bar-loss-trail')?.style.left, `${mood}%`);
  const batteryCost = summary?.querySelector('[title="Battery"]');
  assert.equal(batteryCost?.textContent, 'Battery −1%');
  assert(batteryCost?.querySelector('.battery-icon'), 'battery expense uses the existing battery icon');
  assert(!screen.getByRole('dialog').querySelector('[data-stat="Battery"]'), 'call battery expense shares the summary without a duplicate bar');
  assert(document.querySelector('.bottom-nav[inert]'));
  const game=read(gameKey),inventory=read(invKey);advance(5000);
  assert.deepEqual(read(gameKey),game);assert.deepEqual(read(invKey),inventory);
}
try {
  setup();
  assert.equal(read(gameKey).mood,30);assert.equal(read(callKey),0);
  assert.equal(document.querySelectorAll('.story-actions > button').length,2);
  assert(callButton().textContent.includes('university'));
  assert(document.querySelector('[data-choice="music-walk"],[data-choice="walk"]'));
  assert(!document.querySelector('[data-choice="station-route"],[data-choice="phone-help"]'));
  const initial=read(gameKey),battery=read(invKey).phoneBattery;
  fireEvent.click(callButton());assert(screen.getByRole('dialog',{name:'Calling a university friend'}));
  assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
  advance(249);assert.equal(read(gameKey).minutes,initial.minutes);assert.equal(read(invKey).phoneBattery,battery);
  advance(1);assert.equal(read(gameKey).minutes,initial.minutes+1);assert.equal(read(gameKey).mood,30);
  assert(read(invKey).phoneBattery<battery);assert.equal(read(callKey),0);
  assert.equal(read(activityKey).remaining,1);
  reload();assert(screen.getByRole('dialog',{name:'Calling a university friend'}));assert.equal(read(activityKey).total,2);
  advance(250);assertResult(28,1,'event-call-no-answer');closeResult();
  reload();assert.equal(read(gameKey).mood,28);assert.equal(read(callKey),1);assert(callButton().textContent.includes('old colleague'));
  fireEvent.click(callButton());advance(1000);assert.equal(read(callKey),1);assert.equal(read(gameKey).mood,28);
  advance(250);assertResult(23,2,'event-call-family');closeResult();
  assert(callButton().textContent.includes('helped him move'));
  fireEvent.click(callButton());advance(1250);assertResult(18,3,'event-call-small-room');closeResult();
  assert(!callButton());assert(document.querySelector('[data-choice="station-route"]'));assert(document.querySelector('[data-choice="phone-help"]'));
  assert.equal(read(gameKey).minutes,initial.minutes+12);
  assert(Math.abs(read(invKey).phoneBattery-(battery-12*.2*1.196))<1e-8,'voice battery uses 0.2% per elapsed minute and phone wear');
  reload();assert.equal(read(gameKey).mood,18);assert.equal(read(callKey),3);assert(!callButton());

  // A battery interruption preserves progression and does not apply the refusal twice.
  setup();fireEvent.click(callButton());advance(250);
  const partial=read(activityKey),partialGame=read(gameKey);
  cleanup();localStorage.setItem(invKey,JSON.stringify({...read(invKey),phoneBattery:0}));render(React.createElement(App));
  assert(screen.getByRole('dialog',{name:'Call interrupted'}));assert.equal(read(callKey),0);assert.equal(read(gameKey).mood,partialGame.mood);
  assert(!read(activityKey));closeResult();assert(callButton().disabled);
  cleanup();localStorage.setItem(invKey,JSON.stringify({...read(invKey),phoneBattery:62}));render(React.createElement(App));
  fireEvent.click(callButton());advance(500);assertResult(28,1,'event-call-no-answer');closeResult();
  assert.equal(partial.remaining,1);

  // Existing saves retain their Mood and do not acquire a forced new prologue.
  setup({[gameKey]:{day:2,minutes:600,money:30,hunger:70,thirst:70,energy:70,health:90,hygiene:70,mood:33,intoxication:0,locationId:'street'}});
  assert.equal(read(gameKey).mood,33);assert.equal(read(callKey),3);assert(!callButton());
  fireEvent.click(screen.getByRole('button',{name:'Reset save',exact:true}));
  assert.equal(read(gameKey).mood,30);assert.equal(read(callKey),0);assert(callButton().textContent.includes('university'));
  console.log('PASS: opening calls, 30→28→23→18 Mood, timed/worn-phone battery, no-internet calls, illustrations, results pause, reload without replay, interruption, migration and reset.');
} finally {cleanup();dom.window.close();}
