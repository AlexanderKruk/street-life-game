const assert = require('node:assert/strict');
const esbuild = require('esbuild');
esbuild.buildSync({ entryPoints: ['src/saveCompatibility.ts'], bundle: true, platform: 'node', format: 'cjs', outfile: 'save-compatibility-app.cjs' });
const { readSavedGame, loadDiscoveredLocations, SAVE_KEY } = require('./save-compatibility-app.cjs');
// v1 and v2 used this seven-field schema (from the original scaffold/action commits).
const earlySave = { day: 3, minutes: 800, money: 12.5, hunger: 42, energy: 61, hygiene: 55, locationId: 'station' };
const storageFor = entries => ({ getItem: key => entries[key] ?? null });
for (const key of ['street-life-save-v1', 'street-life-save-v2', SAVE_KEY]) {
  const saved = readSavedGame(storageFor({ [key]: JSON.stringify(earlySave) }));
  for (const [field, value] of Object.entries(earlySave)) assert.equal(saved[field], value, `${key} retains ${field}`);
  assert.equal(saved.thirst, 66); assert.equal(saved.health, 90); assert.equal(saved.mood, 28); assert.equal(saved.intoxication, 0);
}
const modern = { ...earlySave, day: 7, money: 0, hunger: 0, thirst: 0, health: 0, mood: 0, rainUntil: 12000 };
const entries = { 'street-life-save-v1': JSON.stringify(earlySave), 'street-life-save-v2': JSON.stringify({ ...earlySave, day: 4 }), [SAVE_KEY]: JSON.stringify(modern) };
assert.equal(readSavedGame(storageFor(entries)).day, 7, 'v3 wins over obsolete keys');
for (const field of ['money', 'hunger', 'thirst', 'health', 'mood']) assert.equal(readSavedGame(storageFor(entries))[field], 0, `zero ${field} is retained`);
assert.equal(readSavedGame(storageFor(entries)).rainUntil, 12000);
delete entries[SAVE_KEY]; assert.equal(readSavedGame(storageFor(entries)).day, 4, 'v2 wins over v1');
for (const broken of ['{broken', 'null', '[]', '{}', JSON.stringify({ ...earlySave, day: '3' })]) {
  assert.equal(readSavedGame(storageFor({ ...entries, [SAVE_KEY]: broken })).day, 4, 'invalid newer entries do not mask a valid old save');
}
assert.equal(readSavedGame(storageFor({ [SAVE_KEY]: JSON.stringify({ ...earlySave, locationId: 'night-shelter' }) })).locationId, 'shelter');
assert.equal(readSavedGame(storageFor({})), null);
assert.deepEqual(loadDiscoveredLocations(storageFor({})), ['street', 'station', 'shop']);
assert(loadDiscoveredLocations(storageFor({ 'street-life-save-v1': JSON.stringify(earlySave) })).includes('jobcenter'));
const discoveries = { 'street-life-discovered-v1': JSON.stringify(['street', 'night-shelter', 'daycenter', 'daycenter', null, {}, 'removed-address']) };
assert.deepEqual(loadDiscoveredLocations(storageFor(discoveries)), ['street', 'shelter', 'daycenter', 'free-clinic']);
assert.deepEqual(loadDiscoveredLocations(storageFor({ ...discoveries, 'street-life-discovery-version': '2' })), ['street', 'shelter', 'daycenter']);

// Use the real App and autosave to check the upgrade/reopen path, with existing
// localStorage entries. Reopening deliberately does not call localStorage.clear().
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.setInterval = () => 1; window.clearInterval = () => {};
esbuild.buildSync({ entryPoints: ['src/App.tsx'], bundle: true, platform: 'node', format: 'cjs', outfile: 'save-upgrade-app.cjs', external: ['react', 'react-dom', 'react/jsx-runtime'] });
const React = require('react');
const { render, screen, fireEvent, cleanup } = require('@testing-library/react');
const App = require('./save-upgrade-app.cjs').default;
const read = key => JSON.parse(localStorage.getItem(key));
for (const key of ['street-life-save-v1', 'street-life-save-v2', SAVE_KEY]) {
  cleanup(); localStorage.clear(); // Only separate independent fixtures.
  const original = JSON.stringify(earlySave);
  localStorage.setItem(key, original);
  localStorage.setItem('unrelated-app', 'retain me');
  localStorage.setItem('street-life-inventory-v1', JSON.stringify({ water: 9, food: 0, jacket: 42, phoneBattery: 37, documents: false }));
  localStorage.setItem('street-life-discovered-v1', JSON.stringify(['street', 'night-shelter', 'daycenter']));
  localStorage.setItem('street-life-mobile-auto-renew', 'false');
  render(React.createElement(App));
  const upgraded = read(SAVE_KEY), inventory = read('street-life-inventory-v1');
  for (const [field, value] of Object.entries(earlySave)) assert.equal(upgraded[field], value);
  assert.equal(inventory.water, 9, 'over-capacity old stacks are not discarded');
  assert.equal(inventory.food, 0); assert.equal(inventory.jacket, 42); assert.equal(inventory.phoneBattery, 37); assert.equal(inventory.documents, false);
  assert.equal(inventory.clothingCleanliness, 80);
  for (const field of ['bread', 'cannedFood', 'wipes', 'showerGel']) assert.equal(inventory[field], 0, 'missing new supplies add no free items');
  assert.deepEqual(read('street-life-discovered-v1'), ['street', 'shelter', 'daycenter', 'free-clinic']);
  assert.equal(localStorage.getItem('street-life-discovery-version'), '2');
  if (key !== SAVE_KEY) assert.equal(localStorage.getItem(key), original, 'migration retains the original older record');
  for (let reopen = 0; reopen < 2; reopen++) {
    cleanup(); render(React.createElement(App));
    assert.deepEqual(read(SAVE_KEY), upgraded, 'reopening does not reroll money or advance time');
    assert.deepEqual(read('street-life-inventory-v1'), inventory, 'reopening does not repeat inventory rewards');
    assert.deepEqual(read('street-life-discovered-v1'), ['street', 'shelter', 'daycenter', 'free-clinic']);
    assert.equal(localStorage.getItem('unrelated-app'), 'retain me');
  }
  fireEvent.click(screen.getByRole('button', { name: 'Reset save' }));
  assert.equal(localStorage.getItem('street-life-save-v1'), null);
  assert.equal(localStorage.getItem('street-life-save-v2'), null);
  assert.equal(read(SAVE_KEY).day, 1);
  assert.equal(localStorage.getItem('unrelated-app'), 'retain me');
  const resetSave = read(SAVE_KEY);
  cleanup(); render(React.createElement(App));
  assert.deepEqual(read(SAVE_KEY), resetSave, 'explicit reset cannot resurrect an older run');
}
cleanup(); dom.window.close();
console.log('PASS: v1/v2/v3 saves upgrade without clearing storage; schema defaults, precedence, discoveries, inventory, repeated reload and explicit reset preserve the correct run.');
