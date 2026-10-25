const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {buildSync}=require('./tests/helpers/build.cjs');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};let now=1800000000000,nextId=0;
Date.now=()=>now;Math.random=()=>.99;
const timers=new Map();window.setInterval=(fn,delay)=>{const id=++nextId;timers.set(id,{fn,delay});return id};window.clearInterval=id=>timers.delete(id);
const React=require('react');const {render,screen,fireEvent,act,cleanup}=require('@testing-library/react');
const code=buildSync({entryPoints:['src/App.tsx'],bundle:true,platform:'node',format:'cjs',write:false,external:['react','react-dom','react/jsx-runtime']}).outputFiles[0].text;
const appModule={exports:{}};new Function('require','module','exports',code)(require,appModule,appModule.exports);const App=appModule.exports.default;
const key='street-life-save-v3',effectsKey='street-life-effects-v1',inventoryKey='street-life-inventory-v1';
const read=k=>JSON.parse(localStorage.getItem(k));
const start=2*1440+600;
function setup(coldMinutes){
 cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
 localStorage.setItem(key,JSON.stringify({day:3,minutes:600,money:100,hunger:100,thirst:100,energy:100,health:100,hygiene:80,mood:45,intoxication:0,locationId:'station'}));
 localStorage.setItem(effectsKey,JSON.stringify(coldMinutes>0?[{id:'cold',expiresAt:start+coldMinutes}]:[]));
 localStorage.setItem('street-life-screen','inventory');localStorage.setItem('street-life-mobile-auto-renew','false');
 render(React.createElement(App));
}
function take(){fireEvent.click(screen.getByRole('button',{name:/Medicine.*treats Cold/}));fireEvent(window,new window.Event('pagehide'));}
function close(){fireEvent.click(screen.getByRole('button',{name:'Got it',exact:true}));}
function advance(minutes){for(let i=0;i<minutes;i++){now+=1000;act(()=>{for(const timer of [...timers.values()])if(timer.delay===1000)timer.fn()})}fireEvent(window,new window.Event('pagehide'));}
try {
 setup(90);const doses=read(inventoryKey).medicines;take();
 const treated=read(effectsKey).find(e=>e.id==='cold');
 assert(treated?.treated);assert.equal(treated.expiresAt,start+30);
 assert.equal(read(inventoryKey).medicines,doses-1);
 assert(!screen.getByRole('dialog').textContent.includes('Ended'));
 assert(screen.getByRole('dialog').textContent.includes('Cold recovery'));
 assert(screen.getByRole('dialog',{name:'Recovery accelerated'}).textContent.includes('does not cure it immediately'));
 assert(document.querySelector('.result-consequences').textContent.includes('Medicine−1'));
 close();cleanup();render(React.createElement(App));
 assert.deepEqual(read(effectsKey).find(e=>e.id==='cold'),treated,'treatment survives reload');
 take();assert.equal(read(inventoryKey).medicines,doses-1);assert.deepEqual(read(effectsKey).find(e=>e.id==='cold'),treated,'repeat doses do not stack or extend illness');
 assert(screen.getByRole('dialog',{name:'One dose is enough'}).textContent.includes('A second tablet will not speed things up'));
 assert.equal(document.querySelector('.result-card-label').textContent,'MEDICINE');
 assert(!screen.getByRole('dialog').textContent.includes('Cold recovery'),'repeat attempt does not claim another boost');
 const paused=read(key).minutes;advance(2);assert.equal(read(key).minutes,paused,'explanation pauses game time');close();
 fireEvent.click(screen.getByRole('button',{name:'Status',exact:true}));assert(document.querySelector('.effect.illness').textContent.includes('treated'));
 advance(29);assert(read(effectsKey).some(e=>e.id==='cold'));
 advance(1);assert(!read(effectsKey).some(e=>e.id==='cold'));
 assert(Math.abs(read(key).health-99.64)<1e-8,'Cold damage continues during treatment');
 const health=read(key).health;advance(2);assert.equal(read(key).health,health,'damage stops at the accelerated expiry');
 setup(.5);take();assert(read(effectsKey).find(e=>e.id==='cold').expiresAt>start,'even a nearly recovered Cold is not removed immediately');close();advance(1);assert(!read(effectsKey).some(e=>e.id==='cold'));
 setup(0);const healthyDoses=read(inventoryKey).medicines;take();assert.equal(read(inventoryKey).medicines,healthyDoses,'healthy players do not waste medicine');
 assert(screen.getByRole('dialog',{name:'No fever'}).textContent.includes('There is no need to take a tablet now'));
 assert(!screen.getByRole('dialog').textContent.includes('Cold recovery'),'healthy explanation does not promise a boost');
 console.log('PASS: medicine accelerates remaining recovery, preserves Cold penalties, survives reload, blocks repeat dosing, expires correctly and avoids healthy consumption.');
} finally {cleanup();dom.window.close();}
