// Exercise the deferred wetness feature explicitly; check-wetness-disabled.cjs covers release defaults.
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];
Object.defineProperty(global,'navigator',{value:dom.window.navigator});
global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{};
let now=1800000000000, nextId=1;
Date.now=()=>now;
const callbacks=new Map();
window.setInterval=(fn,delay)=>{const id=nextId++;callbacks.set(id,{fn,delay,nextAt:now+delay});return id};
window.clearInterval=id=>callbacks.delete(id);
const React=require('react');
const {render,screen,fireEvent,within,act,cleanup,configure}=require('@testing-library/react');
configure({getElementError:message=>new Error(message)});
const phoneSearchButton=require('../../test-fixtures/phone-search.cjs')({screen,fireEvent});
process.on('uncaughtException',error=>{console.error(error.message.split('Here are')[0]);console.error(error.stack);cleanup();dom.window.close();process.exit(1)});
const assert=require('node:assert/strict');
const App=require(process.env.STREET_REGRESSION_APP).default;
const stateKey='street-life-save-v3',invKey='street-life-inventory-v1',lifeKey='street-life-situation-v1';
const read=k=>JSON.parse(localStorage.getItem(k));
const ambientSceneIds=['night-patrol','park-company','borrow-phone','borrow-phone-slip','city-waking','night-rustle','station-cleaning','platform-question'];
let openingEvents = false;
function setup(s={},extra={}){
 phoneSearchButton.returnToLocation=false;
 cleanup();localStorage.clear();require('../../test-fixtures/finished-encounters.cjs')(localStorage,!openingEvents);
 localStorage.setItem(stateKey,JSON.stringify({day:1,minutes:480,money:100,hunger:72,thirst:66,energy:68,health:82,hygiene:55,mood:58,intoxication:0,locationId:'street',rainSystemStarted:true,nextRainAt:999999,...s}));
 localStorage.setItem('street-life-effects-v1','[]');
 localStorage.setItem('street-life-discovered-v1','["street","station","shop","support","shelter","work"]');
 localStorage.setItem('street-life-mobile-auto-renew','false');
 localStorage.setItem('street-life-mobile-renewed-day',String(s.day??1));
 localStorage.setItem('street-life-mobile-service-until',String(Math.max(5000, (s.day ?? 1) * 1440 + 1440)));
 for(const[k,v]of Object.entries(extra))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 Math.random=()=>.99;
 render(React.createElement(App));
 // Initial normalization may constrain a legacy Mood above its current ceiling.
 fireEvent(window,new window.Event('pagehide'));
}
function click(name){if(screen.queryByRole('dialog',{name:'Rain on the street'})&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name)))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));const dialog=screen.queryByRole('dialog');const searchLabel={'Where can I get help in the morning?':'Help & hygiene','How can I get a shelter bed?':'Shelter','Where can I get food and water?':'Food & water'}[name];const target=searchLabel ? phoneSearchButton(searchLabel) : dialog ? within(dialog).getByRole('button',{name}) : screen.getByRole('button',{name});const previousRandom=Math.random;if(target.dataset.choice?.startsWith('question-')||/Ask AI/.test(target.textContent))Math.random=()=>.34;fireEvent.click(target);Math.random=previousRandom;if(document.querySelector('.phone-activity')&&!/Find cover|Continue as I am|Stop what|Continue journey/.test(String(name))){for(let n=0;n<30&&read('street-life-phone-activity-v1');n++){if(screen.queryByRole('dialog',{name:'Rain on the street'}))fireEvent.click(screen.getByRole('button',{name:/^Continue as I am/}));advance(1000);}}}
function chooseHours(hours){fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:new RegExp('^'+hours+' h')}));}
function beginSleep(name,hours){click(name);if(hours!==undefined)chooseHours(hours);click('Start sleeping');}
function ok(){fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Got it',exact:true}));if(phoneSearchButton.returnToLocation&&!screen.queryByRole('dialog')&&document.querySelector('.phone-screen')){phoneSearchButton.returnToLocation=false;fireEvent.click(document.querySelector('.nav-item.home'));}}
function advance(ms){const end=now+ms;while(true){const due=Math.min(...[...callbacks.values()].map(timer=>timer.nextAt));if(due>end)break;now=due;act(()=>{for(const[id,timer]of [...callbacks])if(callbacks.has(id)&&timer.nextAt<=now){timer.nextAt+=timer.delay;timer.fn()}})}now=end;fireEvent(window,new window.Event('pagehide'))}
// Advance real timers to each next game minute, including slower pedestrian stages.
function advanceTravelMinutes(minutes) {
 for(let n=0;n<minutes;n++) {
  const before=read('street-life-trip-v1');assert(before,'trip is still active');
  for(let guard=0;guard<100;guard++) {
   const due=Math.min(...[...callbacks.values()].map(timer=>timer.nextAt));
   advance(due-now);
   const after=read('street-life-trip-v1');
   if(!after||after.remaining<before.remaining)break;
   assert(guard<99,'travel is not unexpectedly paused');
  }
 }
}
function report(name,evidence){console.log(JSON.stringify({name,evidence}));}
function assertResultLocked() {
 const dialog=screen.getByRole('dialog');
 assert.equal(dialog.getAttribute('aria-modal'),'true');
 assert(document.querySelector('.result-overlay')?.contains(dialog));
 assert(document.querySelector('.game-background[inert][aria-hidden="true"]'));
 assert(document.querySelector('.bottom-nav[inert][aria-hidden="true"]'));
 assert(document.querySelector('footer[inert] .reset').disabled);
 assert([...document.querySelectorAll('.bottom-nav button')].every(button=>button.disabled));
 assert(dialog.contains(document.activeElement));
 assert.equal(document.body.style.position,'fixed');
 const state=read(stateKey), inventory=read(invKey), content=dialog.textContent;
 for(const button of document.querySelectorAll('.bottom-nav button, footer .reset, .game-background button'))fireEvent.click(button);
 assert.equal(screen.getByRole('dialog').textContent,content);
 fireEvent.keyDown(document,{key:'Tab'});assert(dialog.contains(document.activeElement));
 fireEvent.keyDown(document,{key:'Tab',shiftKey:true});assert(dialog.contains(document.activeElement));
 advance(3000);assert.deepEqual(read(stateKey),state);assert.deepEqual(read(invKey),inventory);
}
function discoverHelp(){if(document.querySelector('.phone-screen'))click('Street');for(let n=0;n<3;n++){if(['support','daycenter','free-clinic'].every(id=>read('street-life-discovered-v1').includes(id)))return;click('Where can I get help in the morning?');ok();}}


const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const booking={housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterAuditDay:1,shelterLastStayDay:1};
const setOpeningEvents = value => { openingEvents = value; };
module.exports = { phoneSearchButton, React, render, screen, fireEvent, within, act, cleanup, assert, App, stateKey, invKey, lifeKey, read, ambientSceneIds, setup, click, chooseHours, beginSleep, ok, advance, advanceTravelMinutes, report, assertResultLocked, discoverHelp, callbacks, near, booking, setOpeningEvents, finish() { cleanup(); dom.window.close(); } };
