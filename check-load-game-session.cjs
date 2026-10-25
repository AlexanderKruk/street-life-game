const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const esbuild = require('./tests/helpers/build.cjs');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.setInterval = () => 1; window.clearInterval = () => {};
esbuild.buildSync({ entryPoints: ['src/loadGameSession.ts'], bundle: true, platform: 'node', format: 'cjs', outfile: 'restoration-app.cjs' });
const { loadGameSession } = require('./restoration-app.cjs');
const gameKey = 'street-life-save-v3';
const game = { day: 3, minutes: 600, money: 73.6, hunger: 75, thirst: 80, energy: 60, health: 82, hygiene: 80, mood: 25, intoxication: 0, locationId: 'street', rainSystemStarted: true, rainScheduleDay: 3, nextRainAt: 999999 };
const inventory = { water: 1, food: 2, foodFreshness: 45, foodPortions: [90, 0], phoneBattery: 48, phoneCondition: 72, documents: true, medicines: 1 };
const before = { game: { ...game, minutes: 595, money: 78 }, inventory: { ...inventory, phoneBattery: 51 }, effects: [] };
const base = { [gameKey]: JSON.stringify(game), 'street-life-choice-seed-v1': '123', 'street-life-inventory-v1': JSON.stringify(inventory) };
function restore(extra = {}) {
  const entries = { ...base, ...extra }, calls = new Map();
  const result = loadGameSession({ getItem(key) {
    calls.set(key, (calls.get(key) ?? 0) + 1);
    return entries[key] ?? null;
  } });
  assert([...calls.values()].every(count => count === 1), 'each key is read once per mount');
  assert.deepEqual(entries, { ...base, ...extra }, 'restoration does not mutate storage');
  return result;
}
const session = restore();
assert.equal(session.game.money, 73.6);
assert.equal(session.inventory.phoneBattery, 48);
assert.deepEqual(session.inventory.foodPortions, [90, 0]);
assert.deepEqual(restore(), session, 'repeated restoration is stable');
// Stored progress is resumed without charging fares, battery or rewards again.
const trip = { destinationId: 'station', mode: 'transit', total: 40, remaining: 24, before };
const inTransit = restore({ 'street-life-trip-v1': JSON.stringify(trip) });
assert.deepEqual(inTransit.trip, trip); assert.equal(inTransit.screen, 'travel');
assert.equal(inTransit.game.money, game.money);
const search = { questionId: 'morning', total: 20, remaining: 15, before, pausedMinutes: 0 };
const searching = restore({ 'street-life-phone-activity-v1': JSON.stringify(search), 'street-life-trip-v1': JSON.stringify(trip) });
assert.deepEqual(searching.phoneActivity, search); assert.equal(searching.screen, 'location');
assert.equal(searching.inventory.phoneBattery, inventory.phoneBattery);
assert.equal(restore({ 'street-life-phone-activity-v1': JSON.stringify({ ...search, total: undefined, remaining: 26 }) }).phoneActivity.remaining, 5, 'old fixed search retains the ten-minute migration');
const paused = restore({ 'street-life-phone-activity-v1': JSON.stringify({ ...search, remaining: 20, pausedMinutes: 3 }) });
assert.equal(paused.phoneActivity.remaining, 18, 'event pause does not count as search progress');
const call = { questionId: 'call-friend', total: 5, remaining: 0, before };
assert.deepEqual(restore({ 'street-life-phone-activity-v1': JSON.stringify(call) }).phoneActivity, call);
for (const roll of [1, 20]) {
  const encounter = { seen: [], lastAt: 3400, pendingId: 'park-company', pendingRoll: roll };
  const restored = restore({ 'street-life-encounters-v1': JSON.stringify(encounter) });
  assert.equal(restored.encounters.pendingRoll, roll); assert(restored.encounters.seen.includes('park-company'));
}
for (const roll of [0, 21, 4.5, '12']) assert.equal(restore({ 'street-life-encounters-v1': JSON.stringify({ pendingId: 'park-company', pendingRoll: roll }) }).encounters.pendingRoll, undefined);
// Old outdoor sleep migrates only its illness exposure, retaining paid progress.
const sleep = { kind: 'ground', total: 120, remaining: 115, startAbsolute: 3475, realStartedAt: 1800000000000, realWakeAt: 1800000012000, before };
const asleep = restore({ 'street-life-sleep-v1': JSON.stringify(sleep) });
assert.deepEqual(asleep.sleeping, sleep); assert.equal(asleep.game.money, game.money);
assert.equal(asleep.game.sleepIllnessMinutes, 5);
assert.equal(restore({ [gameKey]: JSON.stringify(asleep.game), 'street-life-sleep-v1': JSON.stringify(sleep) }).game.sleepIllnessDose, asleep.game.sleepIllnessDose, 'illness migration is idempotent');
const shelterGame = { ...game, locationId: 'shelter', minutes: 1090 };
const queue = { day: 3, total: 20, remaining: 10, joinedAt: 1080, vacancies: 2, peopleAhead: 1, before };
assert.deepEqual(restore({ [gameKey]: JSON.stringify(shelterGame), 'street-life-shelter-queue-v1': JSON.stringify(queue) }).shelterQueue, queue);
const departure = { day: 3, startAbsolute: 3475, before };
assert.deepEqual(restore({ [gameKey]: JSON.stringify({ ...game, locationId: 'shelter' }), 'street-life-shelter-departure-v1': JSON.stringify(departure) }).shelterDeparture, departure);
const shelterSleep = { ...sleep, kind: 'shelter', startAbsolute: 4350, total: 480, remaining: 480 };
const shortenedSleep = restore({ 'street-life-sleep-v1': JSON.stringify(shelterSleep) }).sleeping;
assert.equal(shortenedSleep.total, 420); assert.equal(shortenedSleep.remaining, 420);
const damaged = restore({
  'street-life-inventory-v1': JSON.stringify({ ...inventory, water: 'bad', phoneBattery: null }),
  'street-life-effects-v1': '[null,{}, {"id":"cold","expiresAt":99999}]',
  'street-life-sleep-v1': JSON.stringify({ ...sleep, remaining: -1 }),
});
assert.equal(damaged.inventory.water, 2); assert.equal(damaged.inventory.phoneBattery, 62);
assert.deepEqual(damaged.inventory.foodPortions, inventory.foodPortions);
assert.deepEqual(damaged.effects, [{ id: 'cold', expiresAt: 99999 }]); assert.equal(damaged.sleeping, null);
assert.equal(restore({ 'street-life-screen': 'journal' }).screen, 'phone');
assert.equal(restore({ 'street-life-mobile-service-until': 'NaN' }).mobileServiceUntil, 0);
assert.equal(restore({ 'street-life-mobile-renewed-day': '-1' }).mobileRenewedDay, 0);
assert.equal(restore({ 'street-life-situation-v1': '{"housing":"Apartment"}' }).life.housing, 'Apartment');
// Broken JSON and wrong top-level shapes must not leave a blocking activity or
// crash the first render. Valid neighbouring keys still retain their progress.
esbuild.buildSync({ entryPoints: ['src/App.tsx'], bundle: true, platform: 'node', format: 'cjs', outfile: 'restoration-ui-app.cjs', external: ['react', 'react-dom', 'react/jsx-runtime'] });
const React = require('react');
const { render, screen, cleanup, fireEvent } = require('@testing-library/react');
const App = require('./restoration-ui-app.cjs').default;
const corruptKeys = ['street-life-inventory-v1', 'street-life-storage-v1', 'street-life-situation-v1', 'street-life-effects-v1', 'street-life-sleep-v1', 'street-life-trip-v1', 'street-life-phone-activity-v1', 'street-life-journal-history-v1', 'street-life-journal-goals-v1', 'street-life-goal-v1', 'street-life-shelter-queue-v1', 'street-life-shelter-departure-v1'];
Math.random = () => .99;
for (const broken of ['{broken', 'null', '[]', '{}', 'true', '42', '"invalid"']) {
  cleanup(); localStorage.clear();
  for (const [key, value] of Object.entries(base)) localStorage.setItem(key, value);
  require('./test-fixtures/finished-encounters.cjs')(localStorage, true);
  localStorage.setItem('street-life-mobile-auto-renew', 'false');
  for (const key of corruptKeys) localStorage.setItem(key, broken);
  render(React.createElement(App));
  assert(screen.getByRole('button', { name: 'Reset save' }));
  assert.equal(JSON.parse(localStorage.getItem(gameKey)).money, game.money);
  cleanup(); render(React.createElement(App));
  fireEvent.click(screen.getByRole('button', { name: 'Reset save' }));
  cleanup(); render(React.createElement(App));
  assert.equal(JSON.parse(localStorage.getItem(gameKey)).day, 1, 'reset survives remount');
}
// Synthetic post-refactoring saves complement the historical v240–v249 fixtures.
const currentFixtures = require('./test-fixtures/v332-saves.json');
const currentFields = { trip: 'trip', search: 'phoneActivity', call: 'phoneActivity',
  sleep: 'sleeping', queue: 'shelterQueue', departure: 'shelterDeparture',
  event: 'firstNightEvents', d20: 'encounters' };
assert.equal(currentFixtures.build, 332);
assert.deepEqual(currentFixtures.cases.map(item => item.id).sort(), Object.keys(currentFields).sort());
for (const fixture of currentFixtures.cases) {
  const stored = { ...currentFixtures.base, ...fixture.entries };
  const frozen = JSON.stringify(stored);
  const restored = loadGameSession(storageForCurrent(stored));
  assert.deepEqual(restored[currentFields[fixture.id]], JSON.parse(stored[fixture.processKey]), `${fixture.id}: retain pending state including original snapshot/roll`);
  const original = JSON.parse(stored[gameKey]);
  assert.equal(restored.game.money, original.money, `${fixture.id}: restoration never charges or rewards`);
  assert.equal(restored.game.minutes, original.minutes, `${fixture.id}: restoration never advances time`);
  assert.equal(restored.inventory.phoneBattery, JSON.parse(stored['street-life-inventory-v1']).phoneBattery);
  assert.deepEqual(loadGameSession(storageForCurrent(stored)), restored, `${fixture.id}: repeated restoration is stable`);
  assert.equal(JSON.stringify(stored), frozen, `${fixture.id}: source entries remain unchanged`);
}
function storageForCurrent(entries) { return { getItem: key => entries[key] ?? null }; }
const denied = loadGameSession({ getItem() { throw new Error('storage unavailable'); } });
assert.equal(denied.game.day, 1); assert.equal(denied.phoneActivity, null);
cleanup(); dom.window.close();
console.log('PASS: read-only session restore, partial/corrupt data, one-read keys, trip/search/call/sleep, fixed-search and illness migration, D20, repeated mount and reset.');
