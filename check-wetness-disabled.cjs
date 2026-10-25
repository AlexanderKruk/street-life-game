const assert = require('node:assert/strict');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
  const code = buildSync({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false,
    define: { 'import.meta.env': '{}' }, external: ['react', 'react-dom', 'react/jsx-runtime'] }).outputFiles[0].text;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}
const { initialState, advanceTime, applySleepTime, weatherAt } = bundled('src/game.ts');
const { readSavedGame, SAVE_KEY } = bundled('src/saveCompatibility.ts');
const { sleepIllnessHazard } = bundled('src/sleepIllness.ts');
const { summarizeResult } = bundled('src/results.ts');
const base = { ...initialState, day: 7, minutes: 600, energy: 80, mood: 45, hunger: 100, thirst: 100, health: 100 };
for (const day of [1, 2]) for (const minutes of [0, 359, 600, 1200, 1439]) {
  const opening = { ...base, day, minutes, rainUntil: 10000 };
  assert.equal(weatherAt(opening).label, 'Cloudy', 'D0/D1 ignore legacy rain overrides');
  assert.equal(weatherAt({ ...opening, rainUntil: undefined }).label, 'Cloudy');
  assert.equal(advanceTime(opening, 1).energy, advanceTime({ ...opening, rainUntil: undefined }, 1).energy);
}
assert.equal(weatherAt({ ...base, day: 3 }).label, 'Clear', 'D2 keeps its original calendar weather');
assert.equal(weatherAt({ ...base, day: 3, rainUntil: 10000 }).label, 'Rain', 'later rain overrides remain');
const old = { ...base, wetness: 100, wetSleepLoss: 12 };
const loaded = readSavedGame({ getItem: key => key === SAVE_KEY ? JSON.stringify(old) : null });
assert.equal(loaded.wetness, undefined);
assert.equal(loaded.wetSleepLoss, undefined);
assert.equal(loaded.day, base.day);
assert.equal(loaded.energy, base.energy);
assert.deepEqual(advanceTime(old, 60), advanceTime(base, 60), 'legacy moisture has no effects');
assert.deepEqual(applySleepTime(old, 120, { sleepKind: 'ground' }), applySleepTime(base, 120, { sleepKind: 'ground' }));
assert.equal(advanceTime(base, 60).wetness, undefined, 'rain never accumulates moisture');
assert(advanceTime(base, 60).energy < advanceTime({ ...base, day: 1 }, 60).energy, 'ordinary weather effects remain');
assert.equal(sleepIllnessHazard('ground', 4, 'Rain', 100, 'outside'), sleepIllnessHazard('ground', 4, 'Rain', 0, 'outside'));
const inventory = { water: 0, food: 0, bottles: 0, phoneBattery: 50, phoneCondition: 100, jacket: 80, documents: true, cigarettes: 0, medicines: 0, transitCard: false };
const snapshot = { game: base, inventory, effects: [] };
assert(!summarizeResult({ ...snapshot, game: old }, snapshot).changes.some(row => /wetness/.test(row.label)));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
const timers = new Map(); let nextId = 1;
window.setInterval = (fn, delay) => { const id = nextId++; timers.set(id, { fn, delay }); return id; };
window.clearInterval = id => timers.delete(id);
Math.random = () => .99;
const React = require('react');
const { render, screen, fireEvent, act, cleanup } = require('@testing-library/react');
const App = bundled('src/App.tsx').default;
function setup(extras = {}) {
  cleanup(); localStorage.clear();
  localStorage.setItem(SAVE_KEY, JSON.stringify(old));
  localStorage.setItem('street-life-effects-v1', '[]');
  localStorage.setItem('street-life-rain-choice-v1', 'true');
  localStorage.setItem('street-life-rain-response-v1', JSON.stringify({ episode: 'weather:2', locationId: 'street', sheltered: true }));
  localStorage.setItem('street-life-mobile-auto-renew', 'false');
  for (const [key, value] of Object.entries(extras)) localStorage.setItem(key, JSON.stringify(value));
  render(React.createElement(App));
}
try {
  for (const day of [1, 2]) {
    setup({ [SAVE_KEY]: { ...base, day, minutes: 1320 } });
    Math.random = () => 0;
    fireEvent.click(screen.getByRole('button', { name: /Put on something familiar and walk for a while. Clear my head./ }));
    fireEvent(window, new window.Event('pagehide'));
    assert.equal(JSON.parse(localStorage.getItem(SAVE_KEY)).rainUntil, undefined, 'night walks cannot start rain on D0/D1');
    assert(!screen.queryByRole('dialog', { name: 'Rain on the street' }));
  }
  Math.random = () => .99;
  setup();
  assert(!screen.queryByRole('dialog', { name: 'Rain on the street' }));
  assert(!document.querySelector('.rain-cover-status'));
  fireEvent.click(screen.getByRole('button', { name: /^Status$/ }));
  assert(!document.querySelector('.wet-clothes'));
  fireEvent.click(screen.getByRole('button', { name: /^Inventory$/ }));
  const clothing = screen.getByText('Clothing').closest('.inventory-item');
  fireEvent.click(clothing);
  assert(!screen.queryByRole('dialog'));
  assert(!/Wetness|Wet clothes|Dry indoors/.test(clothing.textContent));
  setup({ 'street-life-trip-v1': { destinationId: 'shop', mode: 'walk', total: 5, remaining: 5 } });
  assert(!screen.queryByRole('dialog', { name: 'Rain on the street' }));
  act(() => { for (const timer of [...timers.values()]) if (timer.delay === 250) timer.fn(); });
  fireEvent(window, new window.Event('pagehide'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-trip-v1')).remaining, 4, 'stale rain choice and cover do not freeze travel');
  assert.equal(JSON.parse(localStorage.getItem(SAVE_KEY)).wetness, undefined);
  assert.equal(localStorage.getItem('street-life-rain-choice-v1'), 'false');
  console.log('PASS: release wetness disabled, legacy saves, sleep, weather, result rows, clothing UI and uninterrupted rainy travel.');
} finally { cleanup(); dom.window.close(); }
