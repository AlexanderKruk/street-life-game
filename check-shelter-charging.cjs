const assert=require('node:assert/strict');
const {buildSync}=require('esbuild');
function bundle(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,external:['react','react-dom','react/jsx-runtime']}).outputFiles[0].text;const m={exports:{}};new Function('require','module','exports',code)(require,m,m.exports);return m.exports}
const {shelterChargingMinutes,SHELTER_PHONE_CHARGE_KEY:chargeKey}=bundle('src/shelterCharging.ts');
for(const [from,to,minutes] of [[1079,1100,0],[1080,1140,60],[1430,1450,20],[1440,1500,60],[479,480,1],[479,600,1],[480,1080,0],[1140,4000,780],[1140,1130,0]])assert.equal(shelterChargingMinutes(from,to),minutes);
for(let start=1080;start<1920;start+=17){const end=Math.min(start+83,1920);let ticks=0;for(let n=start;n<end;n++)ticks+=shelterChargingMinutes(n,n+1);assert.equal(shelterChargingMinutes(start,end),ticks,'action jumps and minute ticks agree')}

const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for(const k of ['window','document','localStorage','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];Object.defineProperty(global,'navigator',{value:dom.window.navigator});global.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};
let now=1800000000000,id=0;Date.now=()=>now;Math.random=()=>.99;
const timers=new Map();window.setInterval=(fn,delay)=>{const key=++id;timers.set(key,{fn,delay,next:now+delay});return key};window.clearInterval=key=>timers.delete(key);
const React=require('react');const {render,screen,within,fireEvent,act,cleanup,configure}=require('@testing-library/react');configure({getElementError:message=>new Error(message)});const App=bundle('src/App.tsx').default;
const gameKey='street-life-save-v3',invKey='street-life-inventory-v1',lifeKey='street-life-situation-v1',read=k=>JSON.parse(localStorage.getItem(k));
function flush(){fireEvent(window,new window.Event('pagehide'))}
function setup({battery=10,charging=false,state={},life={},extra={},strict=false}={}){
 cleanup();localStorage.clear();Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 localStorage.setItem(gameKey,JSON.stringify({day:2,minutes:1140,money:100,hunger:20,thirst:60,energy:60,health:100,hygiene:55,mood:28,intoxication:0,locationId:'shelter',...state}));
 localStorage.setItem(invKey,JSON.stringify({phoneBattery:battery,phoneCondition:100,water:0,food:0}));localStorage.setItem(lifeKey,JSON.stringify({housing:'Night shelter',shelterUntilDay:7,shelterRegisteredDay:1,shelterLastStayDay:2,shelterAuditDay:1,...life}));
 localStorage.setItem('street-life-mobile-auto-renew','false');localStorage.setItem('street-life-mobile-service-until','20000');localStorage.setItem('street-life-effects-v1','[]');
 if(charging)localStorage.setItem(chargeKey,'true');for(const [k,v]of Object.entries(extra))localStorage.setItem(k,JSON.stringify(v));
 render(strict?React.createElement(React.StrictMode,null,React.createElement(App)):React.createElement(App));flush();
}
function click(name){const dialog=screen.queryByRole('dialog');fireEvent.click((dialog?within(dialog):screen).getByRole('button',{name}))}
function ok(){click('Got it')}
function advance(ms){const end=now+ms;while(true){const due=Math.min(...[...timers.values()].map(t=>t.next));if(due>end)break;now=due;act(()=>{for(const[k,t]of [...timers])if(timers.has(k)&&t.next<=now){t.next+=t.delay;t.fn()}})}now=end;flush()}
function reload(){cleanup();render(React.createElement(App));flush()}
try {
 setup({strict:true});const before=read(gameKey);click(/Leave phone charging/);assert(screen.getByRole('dialog',{name:'Phone charging'}));assert.equal(localStorage.getItem(chargeKey),'true');assert.equal(read(invKey).phoneBattery,10);assert.deepEqual(read(gameKey),before);
 advance(5000);assert.equal(read(invKey).phoneBattery,10,'reading the result does not charge');ok();advance(5000);assert.equal(read(invKey).phoneBattery,15);
 click(/^Dinner/);assert.equal(read(gameKey).minutes,1165);assert.equal(read(invKey).phoneBattery,35,'dinner charges in parallel');ok();
 click(/^Refill water/);assert.equal(read(invKey).phoneBattery,40);ok();
 click('Inventory');const essentials=document.querySelector('.essentials-grid');assert(essentials.textContent.includes('Battery 40% · Charging'));assert(essentials.textContent.includes('Condition 100%'));assert(!essentials.querySelector('button'));assert(!/tap/i.test(essentials.textContent));fireEvent.click(within(essentials).getByText('Phone'));fireEvent.click(within(essentials).getByText('Clothing'));assert(!screen.queryByRole('dialog'));assert(screen.getByRole('region',{name:'Inventory'}));
 click('Night Shelter');click(/Collect phone/);assert(screen.getByRole('dialog',{name:'Collect phone'}));assert.equal(localStorage.getItem(chargeKey),null);assert.equal(read(invKey).phoneBattery,40);ok();
 click('Phone');assert(screen.getByRole('region',{name:'Phone'}));click('Inventory');advance(3000);assert.equal(read(invKey).phoneBattery,40,'collection stops charging');

 setup({battery:98,charging:true});advance(5000);assert.equal(read(invKey).phoneBattery,100);assert.equal(localStorage.getItem(chargeKey),'true');assert(!screen.getByRole('button',{name:/Collect phone/}).disabled);click(/Collect phone/);ok();assert(screen.getByRole('button',{name:/Leave phone charging/}).disabled);
 setup({battery:20,state:{minutes:1380}});assert(!screen.getByRole('button',{name:/Leave phone charging/}).disabled);click(/Leave phone charging/);ok();advance(10000);assert.equal(read(invKey).phoneBattery,30,'quiet hours allow charging');const saved=read(invKey).phoneBattery;now+=3600000;reload();assert.equal(read(invKey).phoneBattery,saved,'no wall-time gain without game-time progress');advance(2000);assert.equal(read(invKey).phoneBattery,32);assert.equal(localStorage.getItem(chargeKey),'true');click(/Collect phone/);assert.equal(read(invKey).phoneBattery,32);ok();

 setup({battery:5,charging:true,state:{minutes:1320,energy:20}});click(/Use your reserved bed/);fireEvent.click(within(screen.getByRole('group',{name:'Sleep duration'})).getByRole('button',{name:/^8 h/}));click('Start sleeping');advance(2000);assert.equal(read(invKey).phoneBattery,25,'sleep charges alongside recovery');reload();Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});now+=60000;act(()=>{for(const t of [...timers.values()]){t.next=now+t.delay;t.fn()}});flush();assert.equal(read(invKey).phoneBattery,100,'sleep catch-up charges while hidden');assert.equal(localStorage.getItem(chargeKey),'true');assert.equal(read(gameKey).minutes,360);assert(!read('street-life-sleep-v1'));

 setup({battery:10,charging:true,state:{day:3,minutes:449},life:{shelterLastStayDay:2}});advance(1000);assert.equal(read(invKey).phoneBattery,11);assert(screen.getByRole('dialog',{name:'Leave the night shelter'}));advance(3000);assert.equal(read(invKey).phoneBattery,11);click('Leave the night shelter · 30 min');advance(7500);assert.equal(read(gameKey).locationId,'street');assert.equal(read(gameKey).minutes,480);assert.equal(read(invKey).phoneBattery,41,'charging stops at 08:00');assert.equal(localStorage.getItem(chargeKey),null);assert(screen.getByRole('dialog',{name:'Shelter checkout'}).textContent.includes('collected your phone'));ok();advance(3000);assert.equal(read(invKey).phoneBattery,41);

 setup({battery:20,charging:true});advance(3000);click('Map');click('Street');assert.equal(read(gameKey).locationId,'street');assert.equal(localStorage.getItem(chargeKey),null);advance(5000);assert.equal(read(invKey).phoneBattery,23,'no charging after stepping outside');
 setup({battery:20,charging:true});click('Map');click('Nearest shop');click(/^Walk/);assert.equal(localStorage.getItem(chargeKey),null);advance(1000);assert(read(invKey).phoneBattery<=20,'travel never gains charge');

 for(const options of [{state:{minutes:1079}},{life:{shelterUntilDay:1,shelterLastStayDay:1}},{state:{intoxication:15}}]){setup(options);assert(document.querySelector('.charging-station button').disabled,'cannot plug in from outside or without admission')}
 for(const value of ['false','"true"','{}']){setup({extra:{[chargeKey]:JSON.parse(value)}});advance(1000);assert.equal(read(invKey).phoneBattery,10);assert.equal(localStorage.getItem(chargeKey),null)}
 setup({charging:true,state:{locationId:'station'}});advance(1000);assert.equal(read(invKey).phoneBattery,10);assert.equal(localStorage.getItem(chargeKey),null,'stale charging save normalizes outside the shelter');
 setup({battery:10,charging:true,state:{day:8,minutes:390},life:{shelterUntilDay:7,shelterLastStayDay:7,shelterAuditDay:7}});advance(1000);assert.equal(read(invKey).phoneBattery,11,'the last booked night includes the following morning');
 setup({battery:10});advance(1000);assert.equal(read(invKey).phoneBattery,10,'legacy saves do not start charging');click(/Leave phone charging/);ok();click('Reset save');assert.equal(localStorage.getItem(chargeKey),null);reload();assert.equal(read(gameKey).locationId,'street');assert.equal(localStorage.getItem(chargeKey),null);
 console.log('PASS: shelter background charging, quiet hours, parallel actions/sleep, pause, caps, pickup/phone access, reload/hidden catch-up, checkout, travel/departure, access guards and legacy/reset saves.');
}finally{cleanup();dom.window.close()}
