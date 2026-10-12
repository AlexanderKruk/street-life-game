const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { build } = require('esbuild');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[name] = dom.window[name];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
global.__uiRenders = {};
window.scrollTo = () => {};
let now = 1800000000000, nextId = 1;
Date.now = () => now;
const timers = new Map();
window.setInterval = (fn) => { const id = nextId++; timers.set(id, fn); return id; };
window.clearInterval = id => timers.delete(id);
const React = require('react');
const { render, screen, fireEvent, act, cleanup, configure } = require('@testing-library/react');
configure({ getElementError: message => new Error(message) });
const counts = () => ({ ...global.__uiRenders });
const clearCounts = () => { global.__uiRenders = {}; };
const count = name => global.__uiRenders[name] ?? 0;
function setup(App, screenName, state = {}, extras = {}) {
  cleanup(); localStorage.clear();
  localStorage.setItem('street-life-save-v3', JSON.stringify({ day: 1, minutes: 500, money: 100, hunger: 72, thirst: 66, energy: 68, health: 82, hygiene: 55, mood: 58, intoxication: 0, locationId: 'station', ...state }));
  localStorage.setItem('street-life-screen', screenName);
  localStorage.setItem('street-life-effects-v1', '[]');
  localStorage.setItem('street-life-discovered-v1', '["street","station","shop"]');
  for (const [key, value] of Object.entries(extras)) localStorage.setItem(key, JSON.stringify(value));
  render(React.createElement(App)); clearCounts();
}
function advance(ticks, flush = true) {
  for (let i = 0; i < ticks; i++) { now += 1000; act(() => { for (const fn of [...timers.values()]) fn(); }); }
  if (flush) fireEvent(window, new window.Event('pagehide'));
}
async function loadApp(disableMemo) {
  const result = await build({
    entryPoints: ['src/App.tsx'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react', 'react-dom', 'react/jsx-runtime'],
    plugins: [{ name: 'count-render-invocations', setup(builder) {
      builder.onLoad({ filter: /(?:App|JournalSections|LifeSituation|CityMap|ItemArt|LocationPresentation|ShopCard|ResultCard|Icon)\.tsx$/ }, async ({ path }) => {
        let source = fs.readFileSync(path, 'utf8').replace(/memo\(function (\w+)\(([\s\S]*?)\) \{/g,
          (match, name) => `${match} globalThis.__uiRenders['${name}'] = (globalThis.__uiRenders['${name}'] ?? 0) + 1;`);
        source = source.replace('export default function App() {', "export default function App() { globalThis.__uiRenders.App = (globalThis.__uiRenders.App ?? 0) + 1;");
        source = source.replace('  return <main className=', '  globalThis.__auditSetters = { setActiveEvent, setShelterInterview, setGame, searchStreetBottles };\n  return <main className=');
        if (disableMemo) source = source.replace(/memo\(function /g, '((component) => component)(function ');
        return { contents: source, loader: 'tsx' };
      });
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports.default;
}
function measure(App) {
  const output = {};
  setup(App, 'journal'); advance(10);
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).minutes, 510);
  output.journal = counts();
  setup(App, 'map'); advance(10); output.map = counts();
  setup(App, 'status'); advance(10); output.status = counts();
  setup(App, 'inventory', {}, { 'street-life-inventory-v1': { water: 2, food: 2 } }); advance(10); output.inventory = counts();
  setup(App, 'location'); advance(10); output.location = counts();
  setup(App, 'location', { locationId: 'shop' }); advance(10); output.shop = counts();
  setup(App, 'travel', {}, { 'street-life-trip-v1': { destinationId: 'shop', mode: 'walk', total: 240, remaining: 240 } });
  const initialProgress = document.querySelector('.travel-progress i').style.width;
  advance(10); output.travel = counts();
  assert.notEqual(document.querySelector('.travel-progress i').style.width, initialProgress);
  setup(App, 'location', { locationId: 'street', minutes: 1320 });
  fireEvent.click(screen.getByRole('button', { name: /Where can I get help in the morning/ }));
  clearCounts(); advance(3); output.phoneSearch = counts();
  assert(document.querySelector('.phone-activity-meta').textContent.includes('3 min spent'));
  setup(App, 'location', { locationId: 'station', minutes: 1380, energy: 20 });
  fireEvent.click(screen.getByRole('button', { name: /Try to sleep/ }));
  fireEvent.click(screen.getByRole('button', { name: /^2 h/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Start sleeping', exact: true }));
  clearCounts(); const initialSleep = document.querySelector('.sleep-progress i').style.width;
  advance(3); output.sleep = counts();
  assert.notEqual(document.querySelector('.sleep-progress i').style.width, initialSleep);
  return output;
}
(async () => {
  const Baseline = await loadApp(true), App = await loadApp(false);
  const before = measure(Baseline), after = measure(App);
  for (const [section, name] of [['journal', 'JournalGoals'], ['journal', 'JournalTimeline'], ['map', 'DistrictScene'], ['status', 'LifeSituation'], ['inventory', 'ItemArt'], ['location', 'LocationSummary'], ['shop', 'ShopHero'], ['shop', 'ShopCard'], ['travel', 'TravelHeading'], ['phoneSearch', 'StreetArt'], ['sleep', 'SleepHeading']]) {
    assert(before[section][name] > 0, `${name}: baseline must render during ticks`);
    assert.equal(after[section][name] ?? 0, 0, `${name}: unchanged data must skip rendering`);
  }
  // Relevant changes must still render: opening hours, selected map pin, completed goal, journal day.
  setup(App, 'map', { minutes: 1319 }); advance(1);
  assert.equal(count('DistrictScene'), 1);
  assert(screen.getByRole('button', { name: /Cheap Shop Closed/ }));
  clearCounts(); fireEvent.click(screen.getByRole('button', { name: /Cheap Shop Closed/ }));
  assert.equal(count('DistrictScene'), 1);
  assert.equal(document.querySelector('.district-card h3').textContent, 'Cheap Shop');
  setup(App, 'journal', { day: 2, minutes: 719 }); advance(1);
  assert(count('JournalGoals') > 0);
  assert(document.querySelector('.completed-goals .goal strong').textContent.includes('morning'));
  setup(App, 'journal', { day: 2 }, { 'street-life-journal-history-v1': [
    { day: 1, minute: 500, title: 'First day', text: 'First thought', reflection: true }, { day: 2, minute: 480, title: 'Second day', text: 'Second thought', reflection: true },
  ] });
  fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  assert.equal(count('JournalTimeline'), 1); assert(screen.getByText('First thought')); assert(!screen.queryByText('Second thought'));
  // All locations, including closed locations, preserve live action availability.
  const locationAudit = [];
  for (const id of ['street', 'station', 'shop', 'shelter', 'support', 'daycenter', 'free-clinic', 'hospital', 'jobcenter', 'work', 'residential-shelter']) {
    setup(App, 'location', { locationId: id }); advance(3);
    assert(document.querySelector('.location-summary, .shop-hero'));
    locationAudit.push({ id, renders: counts() });
  }
  setup(App, 'location', { locationId: 'work', energy: 55.01 });
  assert(!screen.getByRole('button', { name: /Take a short shift/ }).disabled);
  advance(1); assert(screen.getByRole('button', { name: /Take a short shift/ }).disabled, 'action requirements stay live');
  setup(App, 'status'); const oldFace = document.querySelector('.header-condition svg').innerHTML;
  act(() => global.__auditSetters.setGame(previous => ({ ...previous, health: 10, energy: 10, mood: 0 })));
  assert.notEqual(document.querySelector('.header-condition svg').innerHTML, oldFace, 'memoized icons update when condition changes');
  setup(App, 'location', { locationId: 'shop', minutes: 1319 }); advance(1);
  assert(screen.getByRole('button', { name: /Buy Water for/, hidden: true }).disabled);
  assert.equal(count('ShopCard'), 8, 'all shop cards update when the shop closes');
  setup(App, 'location', { locationId: 'shop', money: 100 }, { 'street-life-mobile-auto-renew': false }); advance(1);
  act(() => global.__auditSetters.setGame(previous => ({ ...previous, money: 4 })));
  fireEvent.click(screen.getByRole('button', { name: /Buy Water for/ }));
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).money, 1);
  assert.equal(JSON.parse(localStorage.getItem('street-life-inventory-v1')).water, 5);
  assert(screen.getByRole('button', { name: /Buy Water for/ }).disabled, 'affordability updates after purchase');
  const modalAudit = [];
  const pauseAudit = (name, selector) => {
    assert(document.querySelector(selector), name);
    const saved = localStorage.getItem('street-life-save-v3'); clearCounts(); advance(3);
    assert.equal(localStorage.getItem('street-life-save-v3'), saved, `${name} pauses time`);
    assert.equal(count('App'), 0, `${name} has no periodic background renders`);
    modalAudit.push({ name, periodicRenders: count('App') });
  };
  pauseAudit('action result', '.result-modal');
  clearCounts(); act(() => global.__auditSetters.setGame(previous => ({ ...previous, money: previous.money + 1 })));
  assert.equal(count('ResultCard'), 0, 'unchanged result ignores unrelated parent changes');
  fireEvent.click(screen.getByRole('button', { name: 'Got it', exact: true })); assert(!document.querySelector('.result-modal'));
  setup(App, 'location', { minutes: 1380, energy: 20 });
  fireEvent.click(screen.getByRole('button', { name: /Try to sleep/ })); pauseAudit('sleep planning', '.sleep-choice-modal');
  setup(App, 'location', { locationId: 'street' }, { 'street-life-rain-choice-v1': true }); pauseAudit('rain choice', '.event-overlay');
  setup(App, 'status', { health: 0 }); pauseAudit('game over', '.game-over-overlay');
  setup(App, 'map', {}, { 'street-life-inventory-v1': { transitCard: false } });
  fireEvent.click(screen.getByRole('button', { name: /Cheap Shop Open/ })); fireEvent.click(screen.getByRole('button', { name: 'Go →' }));
  assert(document.querySelector('.travel-sheet')); clearCounts(); advance(3);
  modalAudit.push({ name: 'travel choices (time continues)', renders: counts() });
  fireEvent.click(screen.getByRole('button', { name: /Ride without ticket/ })); pauseAudit('dice check', '.dice-overlay');
  setup(App, 'inventory'); fireEvent.click(screen.getByRole('button', { name: /PhoneBattery/ }));
  assert(document.querySelector('.phone-panel')); clearCounts(); advance(3);
  assert(count('App') > 0, 'phone panel intentionally keeps time running');
  modalAudit.push({ name: 'phone panel (time continues)', renders: counts() });
  setup(App, 'location');
  act(() => global.__auditSetters.setActiveEvent({ id: 'audit', title: 'Audit event', icon: '!', text: 'A paused event.', choices: [{ label: 'Continue', outcome: { message: 'Done' } }] }));
  pauseAudit('street event', '.event-card');
  setup(App, 'location', { locationId: 'shelter', minutes: 1140 });
  act(() => global.__auditSetters.setShelterInterview({ step: 'reason' }));
  pauseAudit('shelter interview', '.shop');
  setup(App, 'location', { locationId: 'shelter', minutes: 1140 }, { 'street-life-situation-v1': { shelterVacancyDay: 1, shelterVacancies: 2 } });
  fireEvent.click(screen.getByRole('button', { name: /Join registration queue/ }));
  assert(document.querySelector('.queue-overlay')); const queueProgress = document.querySelector('.queue-overlay .sleep-progress i').style.width;
  clearCounts(); advance(3); assert.notEqual(document.querySelector('.queue-overlay .sleep-progress i').style.width, queueProgress);
  modalAudit.push({ name: 'registration queue (progress updates)', renders: counts() });
  setup(App, 'location', { locationId: 'shelter', day: 2, minutes: 450 }, { 'street-life-situation-v1': { housing: 'Night shelter', shelterUntilDay: 7, shelterLastStayDay: 1 } });
  pauseAudit('morning checkout', '.checkout-overlay');
  fireEvent.click(screen.getByRole('button', { name: /Leave the night shelter · 30 min/ }));
  const checkoutProgress = document.querySelector('.checkout-overlay .sleep-progress i').style.width;
  clearCounts(); advance(3); assert.notEqual(document.querySelector('.checkout-overlay .sleep-progress i').style.width, checkoutProgress);
  modalAudit.push({ name: 'shelter departure (progress updates)', renders: counts() });
  setup(App, 'location', { locationId: 'street', day: 2, minutes: 1000 }, { 'street-life-answers-v1': ['morning', 'bed'] });
  act(() => global.__auditSetters.searchStreetBottles()); pauseAudit('trash search', '.trash-overlay');
  // Moving rubbish is user-driven; the surrounding street image remains cached.
  const piece = document.querySelector('.trash-piece:last-child');
  const bounds = { left: 0, top: 0, width: 400, height: 400 };
  piece.parentElement.getBoundingClientRect = () => bounds;
  piece.setPointerCapture = () => {}; piece.hasPointerCapture = () => true; piece.releasePointerCapture = () => {};
  const pointer = (type, x, y) => { const event = new window.Event(type, { bubbles: true }); Object.assign(event, { clientX: x, clientY: y, pointerId: 1 }); fireEvent(piece, event); };
  clearCounts(); pointer('pointerdown', 120, 120); pointer('pointermove', 220, 220); pointer('pointerup', 220, 220);
  assert.equal(count('StreetArt'), 0);
  modalAudit.push({ name: 'trash drag', renders: counts() });
  // Measure actual App storage writes without forcing a checkpoint after every tick.
  setup(App, 'inventory', {}, { 'street-life-mobile-auto-renew': false });
  const nativeSet = window.Storage.prototype.setItem;
  const storageWrites = [];
  window.Storage.prototype.setItem = function (key, value) { storageWrites.push(key); return nativeSet.call(this, key, value); };
  advance(20, false);
  const periodicWrites = storageWrites.length;
  assert(periodicWrites <= 10, 'actual game ticks batch frequent writes');
  assert(!storageWrites.includes('street-life-journal-history-v1'), 'unchanged history is not rewritten');
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  fireEvent(document, new window.Event('visibilitychange'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).minutes, 520, 'backgrounding flushes the latest game state');
  assert(JSON.parse(localStorage.getItem('street-life-inventory-v1')).clothingCleanliness < 80, 'inventory aging is saved with the game');
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  fireEvent(document, new window.Event('visibilitychange'));
  window.Storage.prototype.setItem = nativeSet;
  setup(App, 'travel', {}, { 'street-life-trip-v1': { destinationId: 'shop', mode: 'walk', total: 240, remaining: 240 } });
  advance(3, false); fireEvent(window, new window.Event('pagehide'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-trip-v1')).remaining, 210);
  cleanup(); render(React.createElement(App));
  assert(document.querySelector('.travel-screen'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-trip-v1')).remaining, 210, 'travel resumes from lifecycle save');
  advance(1, false); fireEvent(window, new window.Event('beforeunload'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-trip-v1')).remaining, 200);
  fireEvent.click(screen.getByRole('button', { name: 'Reset save' }));
  advance(10, false); fireEvent(window, new window.Event('pagehide'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).locationId, 'street');
  assert(!localStorage.getItem('street-life-trip-v1'), 'pending old travel never returns after reset');
  setup(App, 'inventory');
  act(() => global.__auditSetters.setGame(previous => ({ ...previous, money: 71 })));
  window.Storage.prototype.setItem = function () { throw new Error('Quota'); };
  fireEvent(window, new window.Event('pagehide'));
  assert(document.querySelector('.save-warning'), 'storage failure is visible');
  window.Storage.prototype.setItem = nativeSet;
  advance(5, false); fireEvent(window, new window.Event('pagehide'));
  assert(!document.querySelector('.save-warning'), 'successful retry clears the warning');
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).money, 71);
  cleanup(); dom.window.close();
  console.log(JSON.stringify({ renderComparison: { ticks: { mainScreens: 10, phoneSearch: 3, sleep: 3 }, withoutMemo: before, withMemo: after } }));
  console.log('PASS: static blocks skip tick renders; clock, map closing/selection, goal completion and journal day changes remain live.');
  console.log(JSON.stringify({ locationAudit, modalAudit }));
  console.log(`PASS: actual App used ${periodicWrites} writes in twenty idle ticks; hidden/pagehide/beforeunload flush, travel reload, reset and storage-error retry.`);
})().catch(error => { console.error(error); cleanup(); dom.window.close(); process.exitCode = 1; });
