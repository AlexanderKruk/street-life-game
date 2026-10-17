const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
function bundled(path) {
  const code = buildSync({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'react-dom', 'react/jsx-runtime'] }).outputFiles[0].text;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}
const { initialState, HOUSING_MOOD_CAP, moodLimit, limitMood, applyAction, advanceTime, overallCondition, conditionBand } = bundled('src/game.ts');
const comfortable = { ...initialState, day: 2, minutes: 600, hunger: 100, thirst: 100, health: 100, hygiene: 100, energy: 100, mood: 20 };
assert.deepEqual(Object.values(HOUSING_MOOD_CAP), [50, 60, 70, 80, 90, 100]);
for (const [housing, cap] of Object.entries(HOUSING_MOOD_CAP)) {
  const context = { housing };
  assert.equal(moodLimit(comfortable, context).cap, cap);
  assert.equal(limitMood(comfortable, context).mood, 20, 'better housing never fills Mood');
  assert.equal(applyAction({ ...comfortable, mood: cap - 2 }, { minutes: 0, mood: 5 }, context).mood, cap);
  assert.equal(applyAction({ ...comfortable, mood: cap }, { minutes: 0, mood: 5 }, context).mood, cap);
  assert.equal(applyAction({ ...comfortable, mood: cap }, { minutes: 0, mood: -5 }, context).mood, cap - 5);
  assert.equal(overallCondition({ ...comfortable, mood: cap }).level, conditionBand(cap).level);
}
for (const [need, value, expected] of [['hunger', 10, 40], ['thirst', 10, 40], ['health', 10, 40], ['energy', 20, 60], ['hygiene', 0, 80]]) {
  const state = { ...comfortable, [need]: value };
  assert.equal(moodLimit(state, { housing: 'Apartment' }).cap, expected);
  const left = moodLimit({ ...state, [need]: value + .01 }, { housing: 'Apartment' }).cap;
  assert(Math.abs(left - expected) < .03, 'physical limits change continuously');
  assert.equal(applyAction(state, { minutes: 0, mood: 100 }, { housing: 'Apartment' }).mood, expected);
}
assert.equal(moodLimit({ ...comfortable, thirst: 10 }, { housing: 'Night shelter' }).cap, 40, 'the lowest restriction wins');
assert.equal(advanceTime(comfortable, 60, { housing: 'Apartment' }).mood, 20, 'comfortable needs do not refill Mood');
const cold = { housing: 'Apartment', effects: [{ id: 'cold', expiresAt: 2045 }] };
assert.equal(moodLimit(comfortable, cold).cap, 60);
assert.equal(moodLimit({ ...comfortable, minutes: 606 }, cold).cap, 100, 'expired effects stop limiting Mood');
const timed = { ...comfortable, mood: 95 };
let stepped = timed;
for (let i = 0; i < 30; i++) stepped = advanceTime(stepped, 1, cold);
assert.deepEqual(advanceTime(timed, 30, cold), stepped, 'instant actions and ticking share the same limits');

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.setInterval = () => 1;
window.clearInterval = () => {};
window.matchMedia = () => ({ matches: true });
const React = require('react');
const { render, screen, fireEvent, cleanup } = require('@testing-library/react');
const App = bundled('src/App.tsx').default;
function setup(housing, mood, extra = {}, lifeExtra = {}) {
  cleanup(); localStorage.clear();
  localStorage.setItem('street-life-save-v3', JSON.stringify({ ...comfortable, mood, ...extra }));
  localStorage.setItem('street-life-situation-v1', JSON.stringify({ housing, employment: 'Unemployed', income: 'None', ...lifeExtra }));
  localStorage.setItem('street-life-inventory-v1', JSON.stringify({ cigarettes: 2, clothingCleanliness: 100 }));
  localStorage.setItem('street-life-mobile-auto-renew', 'false');
  localStorage.setItem('street-life-screen', 'status');
  Math.random = () => .99;
  render(React.createElement(App));
}
function saved() { fireEvent(window, new window.Event('pagehide')); return JSON.parse(localStorage.getItem('street-life-save-v3')); }
try {
  for (const [housing, cap] of Object.entries(HOUSING_MOOD_CAP)) {
    setup(housing, 100);
    assert.equal(saved().mood, cap, 'old saves are constrained without clearing the run');
    assert.equal(saved().money, comfortable.money);
    const mood = document.querySelector('[data-stat="Mood"]');
    assert.equal(mood.querySelector('.status-stat-value > span').textContent, cap + '%');
    assert.equal(mood.querySelector('svg').innerHTML, document.querySelector('.header-condition svg').innerHTML);
    assert.equal(!!mood.querySelector('.bar-blocked'), cap < 100);
    if (cap < 100) assert.equal(mood.querySelector('.bar-cap-marker').style.left, cap + '%');
    setup(housing, cap - 2);
    fireEvent.click(screen.getByRole('button', { name: 'Inventory', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: /Cigarettes.*tap to smoke/ }));
    assert.equal(saved().mood, cap, 'direct item handlers cannot bypass the ceiling');
    const resultMood = document.querySelector('.result-stat-panel [data-stat="Mood"]');
    assert.equal(resultMood.querySelector('.result-stat-delta').textContent, '+2', 'show the actual gain rather than the nominal +5');
    assert.equal(resultMood.querySelector('svg').innerHTML, document.querySelector('.header-condition svg').innerHTML);
    assert.equal(!!resultMood.querySelector('.bar-blocked'), cap < 100);
    fireEvent.click(screen.getByRole('button', { name: 'Got it', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: /Cigarettes.*tap to smoke/ }));
    assert.equal(saved().mood, cap);
    assert(!document.querySelector('.result-stat-panel [data-stat="Mood"]'), 'zero Mood gain remains hidden');
    cleanup(); render(React.createElement(App)); assert.equal(saved().mood, cap, 'reload preserves the capped value');
  }
  setup('Street', 55, {}, { shelterUntilDay: 7 });
  assert.equal(saved().mood, 55, 'a reserved shelter bed retains its ceiling during daytime outings');
  assert.equal(document.querySelector('[data-stat="Mood"] .bar-cap-marker').style.left, '60%');
  setup('Street', 55, {}, { shelterUntilDay: 1 });
  assert.equal(saved().mood, 50, 'an expired reservation no longer raises the ceiling');
  setup('Street', 49, { locationId: 'residential-shelter' }, { schroniskoReferral: true });
  fireEvent.click(document.querySelector('.nav-item.home'));
  fireEvent.click(screen.getByRole('button', { name: /^Settle into your place/ }));
  assert.equal(saved().mood, 57, 'moving into Schronisko applies its reward under the new ceiling');
  assert.equal(document.querySelector('.result-stat-panel [data-stat="Mood"] .bar-cap-marker').style.left, '70%');
  setup('Apartment', 90, { thirst: 10 });
  assert.equal(saved().mood, 40);
  assert(document.querySelector('[data-stat="Mood"] .bar').getAttribute('aria-label').includes('Thirst'));
  cleanup(); localStorage.setItem('street-life-situation-v1', JSON.stringify({ housing: 'Room' }));
  render(React.createElement(App)); assert.equal(saved().mood, 40, 'a raised ceiling does not grant free Mood');
  console.log('PASS: all six housing ceilings, continuous physical limits, illness expiry, tick/action equivalence, old saves, direct rewards, zero gains, shared faces and capped result bars.');
} finally { cleanup(); dom.window.close(); }
