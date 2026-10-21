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
window.setInterval = (fn, delay) => { const id = nextId++; timers.set(id, { fn, delay, nextAt: now + delay }); return id; };
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
  render(React.createElement(App));
  if (screenName === 'journal') fireEvent.click(screen.getByRole('button', {name:'History', exact:true}));
  if (screenName === 'goals') { fireEvent.click(screen.getByRole('button', {name:'Phone',exact:true})); fireEvent.click(screen.getByRole('button', {name:'Goals',exact:true})); }
  clearCounts();
}
function advance(ticks, flush = true) {
  const end = now + ticks * 1000;
  while (true) {
    const due = Math.min(...[...timers.values()].map(timer => timer.nextAt));
    if (due > end) break;
    now = due;
    act(() => { for (const [id, timer] of [...timers]) if (timers.has(id) && timer.nextAt <= now) { timer.nextAt += timer.delay; timer.fn(); } });
  }
  now = end;
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
        source = source.replace('  return <main className=', '  globalThis.__auditSetters = { setActiveEvent, setShelterInterview, setGame, searchStreetBottles, setTrashGame };\n  return <main className=');
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
  setup(App, 'goals'); advance(10); output.goals = counts();
  setup(App, 'map'); advance(10); output.map = counts();
  setup(App, 'status'); advance(10); output.status = counts();
  setup(App, 'inventory', {}, { 'street-life-inventory-v1': { water: 2, food: 2 } }); advance(10); output.inventory = counts();
  setup(App, 'location'); advance(10); output.location = counts();
  setup(App, 'location', { locationId: 'shop' }); advance(10); output.shop = counts();
  setup(App, 'travel', {}, { 'street-life-trip-v1': { destinationId: 'shop', mode: 'walk', total: 240, remaining: 240 } });
  assert(screen.getByRole('dialog', { name: 'Time on the way' }).contains(document.querySelector('.travel-walker')));
  assert(document.querySelector('.map-surface[inert] .district-map'), 'walking keeps the map underneath');
  assert(!screen.queryByRole('region', { name: 'City map' }), 'background map is hidden from assistive technology');
  assert([...document.querySelectorAll('.bottom-nav button')].every(button => button.disabled));
  assert.equal(document.body.style.overflow, 'hidden');
  const initialElapsed = document.querySelector('.travel-elapsed').textContent;
  advance(12); output.travel = counts();
  assert.notEqual(document.querySelector('.travel-elapsed').textContent, initialElapsed);
  assert.equal(document.querySelector('.travel-elapsed').textContent, '48m');
  assert(!document.querySelector('.travel-progress'));
  for (const [elapsed, expected] of [[60, '1h 00m'], [61, '1h 01m'], [75, '1h 15m']]) {
    setup(App, 'travel', {}, { 'street-life-trip-v1': { destinationId: 'shop', mode: 'walk', total: 240, remaining: 240 - elapsed } });
    assert.equal(document.querySelector('.travel-elapsed').textContent, expected);
  }
  setup(App, 'location', { locationId: 'street', minutes: 1320 });
  fireEvent.click(screen.getByRole('button', { name: /Where can I get help in the morning/ }));
  clearCounts(); advance(3); output.phoneSearch = counts();
  assert.equal(document.querySelector('.phone-activity .travel-elapsed').textContent, '03m');
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
  for (const [section, name] of [['goals', 'JournalGoals'], ['journal', 'JournalTimeline'], ['map', 'DistrictScene'], ['status', 'LifeSituation'], ['inventory', 'ItemArt'], ['location', 'LocationSummary'], ['shop', 'ShopHero'], ['shop', 'ShopCard'], ['phoneSearch', 'StreetArt'], ['sleep', 'SleepHeading']]) {
    assert(before[section][name] > 0, `${name}: baseline must render during ticks`);
    assert.equal(after[section][name] ?? 0, 0, `${name}: unchanged data must skip rendering`);
  }
  assert(after.travel.TravelHeading > 0 && after.travel.TravelHeading < before.travel.TravelHeading, 'travel headings update for changing walking phases, skipping unchanged ticks');
  // Relevant changes must still render: opening hours, selected map pin, completed goal, journal day.
  setup(App, 'map', { minutes: 1319 }); advance(1);
  assert.equal(count('DistrictScene'), 1);
  assert(screen.getByRole('button', { name: 'Nearest shop' }));
  clearCounts(); fireEvent.click(screen.getByRole('button', { name: 'Nearest shop' }));
  assert.equal(count('DistrictScene'), 1);
  assert.equal(document.querySelector('.district-card h3').textContent, 'Cheap Shop');
  setup(App, 'goals', { day: 2, minutes: 719 }); advance(1);
  assert(count('JournalGoals') > 0);
  assert(document.querySelector('.completed-goals .goal strong').textContent.includes('morning'));
  setup(App, 'journal', { day: 2 }, { 'street-life-journal-history-v1': [
    { day: 1, minute: 500, title: 'First day', text: 'First thought', reflection: true }, { day: 2, minute: 480, title: 'Second day', text: 'Second thought', reflection: true },
  ] });
  fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  assert.equal(count('JournalTimeline'), 1); assert(screen.getByText('First thought')); assert(!screen.queryByText('Second thought'));
  // Large histories load in batches without changing saved records or day navigation.
  const history = [1, 2].flatMap(day => Array.from({ length: 250 }, (_, index) => ({
    day, minute: index, title: `History ${day}-${index}`, text: `Thought ${day}-${index}`, reflection: true,
  })));
  setup(App, 'journal', { day: 2 }, { 'street-life-journal-history-v1': history });
  const historyTitles = () => [...document.querySelectorAll('.timeline-entry strong')].map(node => node.textContent);
  assert.equal(historyTitles().length, 30);
  assert.equal(historyTitles()[0], 'History 2-249');
  assert.equal(historyTitles().at(-1), 'History 2-220');
  const savedHistory = localStorage.getItem('street-life-journal-history-v1');
  fireEvent.click(screen.getByRole('button', { name: 'Show older entries' }));
  assert.equal(historyTitles().length, 60);
  assert.equal(historyTitles().at(-1), 'History 2-190');
  advance(3);
  assert.equal(historyTitles().length, 60, 'clock ticks preserve expanded history');
  for (let i = 0; i < 7; i++) fireEvent.click(screen.getByRole('button', { name: 'Show older entries' }));
  assert.deepEqual(historyTitles(), Array.from({ length: 250 }, (_, i) => `History 2-${249 - i}`));
  assert(!screen.queryByRole('button', { name: 'Show older entries' }));
  assert(screen.getByText('Showing 250 of 250 entries'));
  assert.equal(localStorage.getItem('street-life-journal-history-v1'), savedHistory, 'reading does not modify saved history');
  fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  assert.equal(historyTitles().length, 30); assert.equal(historyTitles()[0], 'History 1-249');
  fireEvent.click(screen.getByRole('button', { name: 'Show older entries' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
  assert.equal(historyTitles().length, 30); assert.equal(historyTitles()[0], 'History 2-249');
  fireEvent.click(screen.getByRole('button', { name: 'Show older entries' }));
  fireEvent.click(screen.getByRole('button', { name: 'Inventory', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: /^Water ×/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
  fireEvent.click(screen.getByRole('button', { name: 'Phone', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'History', exact: true }));
  assert.equal(historyTitles().length, 30, 'reopening starts with recent entries');
  assert.equal(historyTitles()[0], 'Drank water', 'new action appears first');
  assert.equal(JSON.parse(localStorage.getItem('street-life-journal-history-v1')).length, 500);
  setup(App, 'journal', { day: 2, minutes: 1439 }, { 'street-life-journal-history-v1': history });
  fireEvent.click(screen.getByRole('button', { name: 'Show older entries' }));
  advance(1);
  assert.equal(historyTitles().length, 0);
  assert(screen.getByText('No recorded actions today yet.'));
  assert(!screen.queryByRole('button', { name: 'Show older entries' }));
  console.log('PASS: journal batches, complete order without duplicates, tick/day/reopen reset rules, new actions and unchanged 500-entry save.');
  // Only consecutive identical reflections group, retaining the first event time.
  const water = { day: 2, minute: 357, title: 'Drank water', text: 'I was thirsty.', actionTitle: 'Drink water', reflection: true };
  const repeatedHistory = [
    { ...water, day: 1, minute: 1439 },
    water, { ...water, minute: 359 }, { ...water, minute: 361 },
    { ...water, minute: 362, title: 'Rested', actionTitle: 'Rest', text: 'A break.' },
    { ...water, minute: 363 },
    { ...water, minute: 364, text: 'Still thirsty.' },
    { ...water, minute: 365, text: 'Still thirsty.', actionTitle: 'Other action' },
  ];
  setup(App, 'journal', { day: 2 }, { 'street-life-journal-history-v1': repeatedHistory });
  const untouchedHistory = localStorage.getItem('street-life-journal-history-v1');
  assert.deepEqual(historyTitles(), ['Drank water', 'Drank water', 'Drank water', 'Rested', 'Drank water ×3']);
  assert.equal(document.querySelectorAll('.timeline-entry time')[4].textContent, '05:57');
  assert.equal(document.querySelectorAll('.journal-thought').length, 5);
  advance(2);assert.equal(historyTitles().at(-1), 'Drank water ×3');
  assert.equal(localStorage.getItem('street-life-journal-history-v1'), untouchedHistory);
  cleanup();render(React.createElement(App));fireEvent.click(screen.getByRole('button',{name:'History',exact:true}));assert.equal(historyTitles().at(-1), 'Drank water ×3');
  fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));assert.deepEqual(historyTitles(), ['Drank water']);
  // Group before pagination, including runs larger than a history batch.
  setup(App, 'journal', { day: 2 }, { 'street-life-journal-history-v1': Array.from({length:70}, (_, i) => ({ ...water, minute:357+i })) });
  assert.deepEqual(historyTitles(), ['Drank water ×70']);
  assert.equal(document.querySelector('.timeline-entry time').textContent, '05:57');
  assert(!screen.queryByRole('button', { name: 'Show older entries' }));
  assert.equal(JSON.parse(localStorage.getItem('street-life-journal-history-v1')).length, 70);
  console.log('PASS: consecutive journal groups, first time, counts, differing outcomes/actions, day boundaries, reload and grouping before pagination.');
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
  assert(screen.getByRole('dialog', { name: 'Cheap Shop has closed' }));
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).locationId, 'street');
  assert.equal(count('ShopCard'), 9, 'all shop cards update when the shop closes');
  setup(App, 'location', { locationId: 'shop', money: 100 }, { 'street-life-mobile-auto-renew': false }); advance(1);
  act(() => global.__auditSetters.setGame(previous => ({ ...previous, money: 4 })));
  fireEvent.click(screen.getByRole('button', { name: /Buy Water for/ }));
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).money, 1);
  assert.equal(JSON.parse(localStorage.getItem('street-life-inventory-v1')).water, 5);
  assert(document.querySelector('.game-background[inert]'));
  assert(screen.getByRole('button', { name: /Buy Water for/, hidden: true }).disabled, 'affordability updates behind the result modal');
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
  fireEvent.click(screen.getByRole('button', { name: 'Nearest shop' }));
  assert(document.querySelector('.travel-sheet')); clearCounts(); advance(3);
  modalAudit.push({ name: 'travel choices (time continues)', renders: counts() });
  fireEvent.click(screen.getByRole('button', { name: /Ride without ticket/ })); pauseAudit('dice check', '.dice-overlay');
  setup(App, 'inventory'); fireEvent.click(screen.getByRole('button', { name: /PhoneBattery/ }));
  assert(document.querySelector('.phone-screen')); clearCounts(); advance(3);
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
  const trashTimerIds = [...timers.keys()];
  assert.equal(trashTimerIds.length, 3, 'only game clock, autosave and one trash deadline timer are active');
  // Moving rubbish is user-driven; the surrounding street image remains cached.
  const piece = document.querySelector('.trash-piece:last-child');
  const bounds = { left: 0, top: 0, width: 400, height: 400 };
  piece.parentElement.getBoundingClientRect = () => bounds;
  piece.setPointerCapture = () => {}; piece.hasPointerCapture = () => true; piece.releasePointerCapture = () => {};
  const pointer = (type, x, y) => { const event = new window.Event(type, { bubbles: true }); Object.assign(event, { clientX: x, clientY: y, pointerId: 1 }); fireEvent(piece, event); };
  clearCounts(); pointer('pointerdown', 120, 120); pointer('pointermove', 220, 220); pointer('pointerup', 220, 220);
  assert.equal(count('StreetArt'), 0);
  assert.deepEqual([...timers.keys()], trashTimerIds, 'dragging does not restart the trash deadline');
  modalAudit.push({ name: 'trash drag', renders: counts() });
  act(() => global.__auditSetters.setTrashGame(previous => ({ ...previous, found: 2 })));
  assert.deepEqual([...timers.keys()], trashTimerIds, 'new bottle count does not restart timers');
  advance(57);
  assert(!document.querySelector('.trash-overlay'));
  assert(document.querySelector('.result-modal').textContent.includes('2 returnable containers'), 'deadline uses the latest collected count');
  assert.equal(timers.size, 2, 'trash timer is cleaned up after completion');
  const timerAudit = [];
  setup(App, 'location');
  const clockIds = [...timers.keys()], clockCreations = nextId;
  assert.equal(clockIds.length, 2, 'one game clock and one independent autosave timer');
  advance(20); assert.deepEqual([...timers.keys()], clockIds);
  assert.equal(nextId, clockCreations, 'ticks never recreate intervals');
  fireEvent.click(screen.getByRole('button', { name: 'Inventory', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Phone', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'History', exact: true }));
  assert.deepEqual([...timers.keys()], clockIds, 'screen changes retain the clock');
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  const frozenMinute = JSON.parse(localStorage.getItem('street-life-save-v3')).minutes;
  advance(3); assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).minutes, frozenMinute);
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  advance(1); assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).minutes, frozenMinute + 1);
  assert.deepEqual([...timers.keys()], clockIds);
  timerAudit.push({ mode: 'ordinary ticks, tabs, background/foreground', intervalRestarts: nextId - clockCreations });
  setup(App, 'location', { locationId: 'street', minutes: 1320 });
  const phoneClockIds = [...timers.keys()];
  fireEvent.click(screen.getByRole('button', { name: /Where can I get help in the morning/ }));
  assert.deepEqual([...timers.keys()], phoneClockIds, 'phone searches use the existing clock');
  advance(3); assert.equal(document.querySelector('.phone-activity .travel-elapsed').textContent, '03m');
  assert.deepEqual([...timers.keys()], phoneClockIds);
  timerAudit.push({ mode: 'phone search', activeIntervals: timers.size });
  setup(App, 'location', { minutes: 1380, energy: 20 });
  const sleepClockIds = [...timers.keys()];
  fireEvent.click(screen.getByRole('button', { name: /Try to sleep/ })); advance(3);
  assert.deepEqual([...timers.keys()], sleepClockIds, 'planning pauses without restarting the clock');
  fireEvent.click(screen.getByRole('button', { name: /^2 h/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Start sleeping', exact: true }));
  const beforeSleepMinute = JSON.parse(localStorage.getItem('street-life-save-v3')).minutes;
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  advance(3); assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).minutes, beforeSleepMinute + 30, 'sleep keeps its wall-clock behavior while hidden');
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  assert.deepEqual([...timers.keys()], sleepClockIds);
  timerAudit.push({ mode: 'sleep planning and sleep', activeIntervals: timers.size });
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
  assert.equal(JSON.parse(localStorage.getItem('street-life-trip-v1')).remaining, 228);
  cleanup(); render(React.createElement(App));
  assert(document.querySelector('.travel-screen'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-trip-v1')).remaining, 228, 'travel resumes from lifecycle save');
  assert.equal(document.querySelector('.travel-elapsed').textContent, '12m', 'elapsed time survives reload');
  assert(document.querySelector('.map-surface[inert] .district-map'), 'reload restores the map behind the travel dialog');
  advance(1, false); fireEvent(window, new window.Event('beforeunload'));
  assert.equal(JSON.parse(localStorage.getItem('street-life-trip-v1')).remaining, 224);
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
  console.log(JSON.stringify({ timerAudit }));
})().catch(error => { console.error(error); cleanup(); dom.window.close(); process.exitCode = 1; });
