const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for (const key of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent']) global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});
global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};
require('esbuild').buildSync({entryPoints:['src/App.tsx'],bundle:true,platform:'node',format:'cjs',outfile:'qa-app.cjs',external:['react','react-dom','react/jsx-runtime']});
const React=require('react');
const {render,screen,fireEvent,within,act,cleanup}=require('@testing-library/react');
const App=require('./qa-app.cjs').default;
const assert=require('node:assert/strict');
function setup(state={},effects=[]){
 localStorage.clear();
 localStorage.setItem('street-life-save-v3',JSON.stringify({day:1,minutes:1410,money:100,hunger:72,thirst:66,energy:65,health:82,hygiene:55,mood:58,intoxication:0,locationId:'street',...state}));
 localStorage.setItem('street-life-effects-v1',JSON.stringify(effects));
 localStorage.setItem('street-life-discovered-v1','["street","station","shop"]');
 localStorage.setItem('street-life-mobile-service-until','5000');
 localStorage.setItem('street-life-mobile-renewed-day',String(state.day??1));
 localStorage.setItem('street-life-mobile-auto-renew','false');
 Math.random=()=>0.99;
 render(React.createElement(App));
}
function button(name){const dialog=screen.queryByRole('dialog');const target=dialog ? within(dialog).getByRole('button',{name}) : screen.getByRole('button',{name});const previousRandom=Math.random;if(target.dataset.choice?.startsWith('question-')||/Ask AI/.test(target.textContent))Math.random=()=>.34;fireEvent.click(target);Math.random=previousRandom;}
function beginSleep(hours=2){button(/Lie down here\? I’m not sure… But I could try./);fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:new RegExp('^'+hours+' h')}));button('Start sleeping');}
function close(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Got it',exact:true}));}
function summary(){return screen.getByRole('dialog').textContent;}
function checkBattery(){const charge=Math.round(JSON.parse(localStorage.getItem('street-life-inventory-v1')).phoneBattery);assert(screen.getByLabelText(`Phone battery: ${charge}%`).textContent.includes(`${charge}%`));return charge;}
async function finishPhone(){for(let tick=0;tick<15;tick++)await act(()=>new Promise(r=>setTimeout(r,1020)));}
(async()=>{
 setup();const startingCharge=checkBattery();button('Where can I get help in the morning?');await finishPhone();assert(checkBattery()<startingCharge);close();button('How can I get a shelter bed?');await finishPhone();
 let text=summary();assert(text.includes('−3.6%'));assert(!text.includes('0 zł'));assert(text.includes('15 min'));
 const before=localStorage.getItem('street-life-save-v3');await act(()=>new Promise(r=>setTimeout(r,1100)));assert.equal(localStorage.getItem('street-life-save-v3'),before);
 close();button(/Map$/);checkBattery();assert(screen.getByText('Night Shelter',{exact:true}));assert(!document.querySelector('.street-art'));cleanup();setup();
 beginSleep();button('Wake up (debug)');
 text=summary();assert(text.includes('2 hours'));assert(text.includes('+13'));assert(!text.includes('Cold'));assert(!text.includes('Health'));assert(!text.includes('Battery'));
 close();button(/Inventory$/);button(/Water.*tap to drink/);text=summary();assert(text.includes('Water portions'));assert(text.includes('−1'));assert(!text.includes('Money'));assert(!text.includes('Time'));close();
 cleanup();const secondSleepState=JSON.parse(localStorage.getItem('street-life-save-v3'));localStorage.setItem('street-life-save-v3',JSON.stringify({...secondSleepState,day:1,minutes:1410}));render(React.createElement(App));fireEvent.click(document.querySelector('.nav-item.home'));Math.random=()=>0.4;beginSleep();button('Wake up (debug)');text=summary();assert(text.includes('Cold'));assert(text.includes('Started'));close();
 button(/Inventory$/);button(/Medicine.*treats Cold/);text=summary();assert(text.includes('Ended'));assert(text.includes('−1'));close();cleanup();
 setup();Math.random=()=>0;beginSleep();button('Wake up (debug)');
 assert(!document.querySelector('.event-overlay'));close();assert(document.querySelector('.event-overlay'));button('Get up');assert(summary().includes('A quiet night'));assert(summary().includes('+5'));close();cleanup();
 // Net effect at an upper bound: gain is capped at 100, not the nominal +52.
 setup({energy:98});beginSleep();button('Wake up (debug)');assert(summary().includes('+2'));cleanup();
 // Natural completion from a persisted sleep, including across midnight.
 localStorage.clear();localStorage.setItem('street-life-effects-v1','[]');localStorage.setItem('street-life-mobile-auto-renew','false');
 localStorage.setItem('street-life-save-v3',JSON.stringify({day:2,minutes:60,money:100,hunger:50,thirst:50,energy:50,health:82,hygiene:50,mood:58,intoxication:0,locationId:'street'}));
 localStorage.setItem('street-life-sleep-v1',JSON.stringify({kind:'ground',total:120,remaining:0,startAbsolute:1380,realStartedAt:Date.now()-20000,realWakeAt:Date.now()-1000}));
 render(React.createElement(App));assert(summary().includes('2 hours'));assert(!localStorage.getItem('street-life-sleep-v1'));cleanup();
 setup({minutes:600});localStorage.setItem('street-life-inventory-v1',JSON.stringify({...JSON.parse(localStorage.getItem('street-life-inventory-v1')),transitCard:false}));cleanup();render(React.createElement(App));button(/Map$/);button(/Station/);button(/Public transport/);
 for(let tick=0;tick<4;tick++) await act(()=>new Promise(r=>setTimeout(r,1050)));
 assert(summary().includes('Arrival'));assert(summary().includes('33 min'));assert(summary().includes('−4.4 zł'));cleanup();
 console.log('PASS: UI flows, zero hiding, timer pause, shelter discovery, actual/capped sleep gains, illness, medicine and automatic wake.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{cleanup();dom.window.close()});
