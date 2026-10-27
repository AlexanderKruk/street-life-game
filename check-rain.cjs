const assert = require('node:assert/strict');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
  const code = buildSync({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false,
    define: { 'import.meta.env': '{}' }, external: ['react', 'react-dom', 'react/jsx-runtime'] }).outputFiles[0].text;
  const module = { exports: {} }; new Function('require','module','exports',code)(require,module,module.exports); return module.exports;
}
const { initialState, advanceTime, weatherAt, rainDailyLimit } = bundled('src/game.ts');
const { createRain, chooseRain, rainRisk, rainArt, planRainDay } = bundled('src/rain.ts');
const { rainResultText } = bundled('src/rainText.ts');
const { readSavedGame, SAVE_KEY } = bundled('src/saveCompatibility.ts');
const base = { ...initialState, day: 7, minutes: 600, hunger: 100, thirst: 100, energy: 90, health: 100, hygiene: 90, mood: 45, rainSystemStarted: true, nextRainAt: 99999 };
const now = (base.day - 1) * 1440 + base.minutes;
function episode(level, length = 60) { return { ...createRain(now, () => .5), level, shelter: level === 'rain' ? 'tree' : 'canopy', end: now + length, coldRoll: .99 }; }
function near(a,b) { assert(Math.abs(a-b) < 1e-7, `${a} != ${b}`); }
for (const [level,energy,mood] of [['drizzle',2,1],['rain',6,4],['downpour',12,8]]) {
  for (const choice of ['nearby','proper','continue']) {
    const rain = { ...chooseRain(episode(level), choice, now, 'street', () => .99), protection: .3 };
    const end = advanceTime({ ...base, rain }, 60, { exposure: 'outside' });
    const result = end.rainResults[0];
    const fraction = choice === 'nearby' ? .7 : choice === 'proper' ? 5/60 : 1;
    near(result.energyLoss, energy*fraction); near(result.moodLoss,mood*fraction);
    assert.equal(end.rain, undefined); assert.equal(result.choice, choice);
    assert.equal(result.cold, false);
    assert(rainArt(result,choice).includes(`${level}-${choice}`)); assert(rainResultText(result).length > 50);
    const indoor = advanceTime({ ...base, rain }, 60, { exposure: 'indoors' });
    near(indoor.rainResults[0].energyLoss, 0); near(indoor.rainResults[0].exposure,0);
    const stepped = Array.from({length:60}).reduce(state => advanceTime(state,1,{exposure:'outside'}),{...base,rain});
    assert.deepEqual(stepped,end,'a long action and minute ticks have identical rain accounting');
  }
}
for (const roll of [0,.999]) {
  const rain = chooseRain(episode('downpour'), 'proper', now, 'street', () => roll);
  assert.equal(rain.searchRemaining, roll === 0 ? 1 : 5);
  const result=advanceTime({...base,rain},60,{exposure:'outside'}).rainResults[0];
  assert.equal(rainRisk(result),0,'short shelter search cannot cause a cold');
}
const short = chooseRain(episode('downpour',5),'continue',now,'street');
near(advanceTime({...base,rain:short},5,{exposure:'outside'}).rainResults[0].energyLoss,1);
const cold = { ...chooseRain(episode('downpour'),'continue',now,'street'), coldRoll:0 };
const caught = advanceTime({...base,rain:cold},60,{exposure:'outside'}).rainResults[0];
near(rainRisk(caught),.25); assert(caught.cold);
assert.equal(weatherAt({...base,day:1,rain:cold}).id,'Cloudy');
assert.equal(weatherAt({...base,day:2,rain:undefined}).id,'Rainy');
for(const [day,limit] of [[1,0],[2,Infinity],[3,0],[4,0],[5,Infinity],[6,1],[7,Infinity]]) assert.equal(rainDailyLimit(day),limit);
const cloudyDay={day:6,minutes:600,rainSystemStarted:true};
for(const roll of [0,.999]) {const plan=planRainDay(cloudyDay,1,()=>roll);assert(plan.nextRainAt>5*1440+600 && plan.nextRainAt<6*1440);}
const carried=planRainDay({...cloudyDay,rain:{...cold,start:5*1440-5,end:5*1440+5}},1);
assert.equal(carried.rainStartsToday,1);assert.equal(carried.nextRainAt,undefined,'overnight rain uses the cloudy day allowance');
for (let i=0;i<100;i++) { const rain=createRain(now); assert(rain.end-now>=5 && rain.end-now<=60 && (rain.end-now)%5===0); }
assert.equal(readSavedGame({getItem:key=>key===SAVE_KEY?JSON.stringify({...base,rain:{level:'bad'},rainResults:[null,caught]}):null}).rain,undefined);

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/street-life-game/',pretendToBeVisual:true});
for (const key of ['window','document','localStorage','HTMLElement','Node','Event','KeyboardEvent']) global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator}); global.IS_REACT_ACT_ENVIRONMENT=true;
window.scrollTo=()=>{}; window.matchMedia=()=>({matches:true});
const timers=new Map(); let id=1;
window.setInterval=(fn,delay)=>{const n=id++;timers.set(n,{fn,delay});return n;}; window.clearInterval=n=>timers.delete(n);
const React=require('react'); const {render,screen,fireEvent,act,cleanup}=require('@testing-library/react');
const App=bundled('src/App.tsx').default;
Math.random=()=>.99;
function setup(level,extra={},storage={}) {
  cleanup();localStorage.clear();
  localStorage.setItem(SAVE_KEY,JSON.stringify({...base,rain:episode(level,5),...extra}));
  localStorage.setItem('street-life-mobile-auto-renew','false');
  localStorage.setItem('street-life-mobile-service-until','99999');
  localStorage.setItem('street-life-effects-v1','[]');
  for(const [key,value] of Object.entries(storage)) localStorage.setItem(key,JSON.stringify(value));
  render(React.createElement(App));
}
function tick(delay) { act(()=>{for(const timer of [...timers.values()]) if(timer.delay===delay)timer.fn();}); }
function save() { fireEvent(window,new window.Event('pagehide'));return JSON.parse(localStorage.getItem(SAVE_KEY)); }
try {
  for (const level of ['drizzle','rain','downpour']) for (const [choice,label] of [['nearby','Take cover nearby'],['proper','Find proper shelter'],['continue','Carry on']]) {
    setup(level);
    const start=save(); tick(1000); assert.equal(save().minutes,start.minutes,'decision pauses time');
    fireEvent.click(screen.getByRole('button',{name:label}));
    if(choice==='continue') assert(!screen.queryByRole('dialog'),'continuing has no immediate result or blocking event');
    for(let i=0;i<4;i++) {tick(choice==='continue'?1000:250); if(choice==='continue') assert(!screen.queryByRole('dialog'));}
    tick(choice==='continue'?1000:250);
    assert(document.querySelector('.result-modal'),'rain end opens the shared event result');
    assert(document.querySelector('.result-modal img').getAttribute('src').includes(`${level}-${choice}`),'result illustration matches choice and intensity');
    if(choice==='nearby') assert(screen.getByRole('dialog').textContent.includes(level==='rain'?'street tree':'awning'));
    if(choice==='proper') assert(screen.getByRole('dialog').textContent.includes('passage'));
    const minutes=save().minutes; tick(1000);tick(250);assert.equal(save().minutes,minutes,'result pauses time');
    fireEvent.click(screen.getByRole('button',{name:'Got it'}));
    assert.equal(save().rainResults.length,0,'acknowledgement consumes result once');
    tick(1000); assert(!screen.queryByRole('dialog'),'result is not repeated');
  }
  setup('rain');fireEvent.click(screen.getByRole('button',{name:'Carry on'}));tick(1000);tick(1000);
  const saved=save();cleanup();render(React.createElement(App));
  assert.equal(save().rain.end,saved.rain.end,'reload preserves duration');
  assert.equal(save().rain.choice,'continue');
  for(let i=0;i<3;i++)tick(1000);
  assert(document.querySelector('.result-modal'));
  cleanup();render(React.createElement(App));
  assert(document.querySelector('.result-modal'),'unacknowledged result survives reload');
  setup('rain',{locationId:'station'});assert(!screen.queryByRole('dialog'),'no rain decision indoors');
  setup('downpour');
  fireEvent.click(screen.getByRole('button',{name:'Find proper shelter'}));
  tick(250);const waiting=save();cleanup();render(React.createElement(App));
  assert.equal(save().rain.searchRemaining,waiting.rain.searchRemaining,'search progress survives reload');
  assert(screen.getByRole('dialog').textContent.includes('Looking for shelter'));
  for(const activity of ['phone','trip']) {
    const key=activity==='phone'?'street-life-phone-activity-v1':'street-life-trip-v1';
    const value=activity==='phone'?{questionId:'morning',total:20,remaining:20,before:{game:base,inventory:{water:2,food:2,phoneBattery:62,phoneCondition:100},effects:[]}}:{destinationId:'station',mode:'walk',total:30,remaining:30};
    setup('downpour',{}, {[key]:value});
    fireEvent.click(screen.getByRole('button',{name:'Find proper shelter'}));
    save();const battery=JSON.parse(localStorage.getItem('street-life-inventory-v1')).phoneBattery;
    tick(250);tick(250);save();
    const paused=JSON.parse(localStorage.getItem(key));
    cleanup();render(React.createElement(App));
    save();assert.equal(JSON.parse(localStorage.getItem(key)).remaining,paused.remaining,'reload does not count shelter waiting as activity progress');
    for(let n=0;n<3;n++)tick(250);
    assert(document.querySelector('.result-modal'));
    save();assert.equal(JSON.parse(localStorage.getItem(key)).remaining,value.remaining,'sheltering pauses the interrupted activity');
    assert.equal(JSON.parse(localStorage.getItem('street-life-inventory-v1')).phoneBattery,battery,'sheltering does not spend browsing/navigation battery');
    fireEvent.click(screen.getByRole('button',{name:'Got it'}));tick(250);save();
    assert.equal(JSON.parse(localStorage.getItem(key)).remaining,value.remaining-1,'interrupted activity resumes after acknowledgement');
  }
  setup('rain',{rain:undefined,nextRainAt:now+1});tick(1000);
  assert(screen.getByRole('button',{name:'Take cover nearby'}),'the global clock starts rain without walking or using the phone');
  setup('rain',{day:1,rain:undefined,nextRainAt:0});tick(1000);
  assert(!screen.queryByRole('dialog'),'the opening D0 evening remains dry');
  setup('rain',{day:2,rain:undefined,nextRainAt:0,rainScheduleDay:2,rainStartsToday:0});
  assert(screen.getByRole('button',{name:'Take cover nearby'}),'D1 now allows rain');
  setup('rain',{day:6,rain:undefined,nextRainAt:0,rainScheduleDay:6,rainStartsToday:0});
  // setup fixes random to .99, so this episode has the maximum 60-minute duration.
  assert.equal(save().rainStartsToday,1,'cloudy day records its single rain at onset');
  fireEvent.click(screen.getByRole('button',{name:'Find proper shelter'}));
  for(let n=0;n<60;n++)tick(250);
  fireEvent.click(screen.getByRole('button',{name:'Got it'}));tick(1000);
  assert(!save().rain && save().rainStartsToday===1,'cloudy day starts no second rain');
  cleanup();render(React.createElement(App));tick(1000);
  assert.equal(save().rainStartsToday,1);assert(!screen.queryByRole('dialog'),'reload does not reset the cloudy allowance');
  setup('rain',{day:6,minutes:1439,rain:undefined,nextRainAt:0,rainScheduleDay:6,rainStartsToday:1});tick(1000);
  assert.equal(save().day,7);assert.equal(save().rainScheduleDay,7);assert.equal(save().rainStartsToday,0,'daily allowance resets at midnight');
  for(const day of [3,4]) {setup('rain',{day,rain:undefined,nextRainAt:0,rainScheduleDay:day,rainStartsToday:0});tick(1000);assert(!screen.queryByRole('dialog'),'clear/windy days start no rain');}

  for(const level of ['drizzle','rain','downpour']) {
    const finishing={...episode(level,5),start:now-3,end:now+2};
    setup(level,{rain:finishing});fireEvent.click(screen.getByRole('button',{name:'Find proper shelter'}));tick(250);tick(250);
    assert(document.querySelector('.result-modal img').getAttribute('src').includes('event-rain-stopped-search'),'all unfinished searches use the shared stopped-rain illustration');
    assert(screen.getByRole('dialog',{name:'The rain has stopped'}).textContent.includes('There’s no need to keep searching.'));
  }
  for (const label of ['Take cover nearby','Find proper shelter']) {
    setup('downpour',{rain:episode('downpour',20)});
    fireEvent.click(screen.getByRole('button',{name:label}));tick(250);
    const covered=save();
    assert(document.querySelector('.travel-screen'),'shelter search and waiting use the activity template');
    assert(!document.querySelector('.event-illustration'),'no illustration until the result');
    assert.equal(screen.getAllByRole('button',{name:'Cancel'}).length,1);
    assert(!screen.queryByRole('button',{name:'Find proper shelter'}),'choose cover only once');
    fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
    const continued=save();
    assert.equal(continued.minutes,covered.minutes,'cancel never rewinds time');
    for(const key of ['id','end','coldRoll','energyLoss','moodLoss']) assert.equal(continued.rain[key],covered.rain[key],key);
    assert.equal(continued.rain.choice,'continue');assert(!screen.queryByRole('dialog'));
    cleanup();render(React.createElement(App));assert.equal(save().rain.choice,'continue');
    for(let n=0;n<19;n++)tick(1000);
    assert(document.querySelector('.result-modal img'),'background rain ends with an illustrated result');
  }
  setup('rain',{rain:undefined,rainResults:[{...caught,start:now-60,end:now,reported:false}]});
  assert(screen.getByRole('dialog').textContent.includes('caught a cold'));
  const coldExpiry=JSON.parse(localStorage.getItem('street-life-effects-v1')).find(effect=>effect.id==='cold').expiresAt;
  save();cleanup();render(React.createElement(App));save();
  assert.equal(JSON.parse(localStorage.getItem('street-life-effects-v1')).filter(effect=>effect.id==='cold').length,1);
  assert.equal(JSON.parse(localStorage.getItem('street-life-effects-v1')).find(effect=>effect.id==='cold').expiresAt,coldExpiry,'reload neither renews nor duplicates Cold');
  console.log('PASS: nine rain outcomes, minute accounting, shelter search, cold risk, indoor protection, background results, pause/resume and reload.');
} finally {cleanup();dom.window.close();}
