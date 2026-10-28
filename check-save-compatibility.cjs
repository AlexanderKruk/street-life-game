const assert = require('node:assert/strict');
const esbuild = require('./tests/helpers/build.cjs');
esbuild.buildSync({ entryPoints: ['src/saveCompatibility.ts'], bundle: true, platform: 'node', format: 'cjs', outfile: 'save-compatibility-app.cjs' });
const { readSavedGame, SAVE_KEY } = require('./save-compatibility-app.cjs');
const storageFor = entries => ({ getItem: key => entries[key] ?? null });
// Ten recent published builds share v3. Ancient keys are not loaded or deleted.
const obsolete = { day: 3, minutes: 800, money: 12.5, hunger: 42, energy: 61, hygiene: 55, locationId: 'station' };
const entries = { 'street-life-save-v1': JSON.stringify(obsolete), 'street-life-save-v2': JSON.stringify(obsolete) };
assert.equal(readSavedGame(storageFor(entries)), null);
for (const broken of ['{broken', 'null', '[]', '{}', JSON.stringify({ ...obsolete, day: '3' })]) {
  assert.equal(readSavedGame(storageFor({ ...entries, [SAVE_KEY]: broken })), null);
}
const zeroValues = { ...obsolete, money: 0, hunger: 0, thirst: 0, health: 0, mood: 0 };
for (const field of ['money', 'hunger', 'thirst', 'health', 'mood']) {
  assert.equal(readSavedGame(storageFor({ [SAVE_KEY]: JSON.stringify(zeroValues) }))[field], 0);
}
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.setInterval = () => 1; window.clearInterval = () => {};
Date.now = () => 1800000000000; Math.random = () => .99;
esbuild.buildSync({ entryPoints: ['src/App.tsx'], bundle: true, platform: 'node', format: 'cjs', outfile: 'save-upgrade-app.cjs', external: ['react', 'react-dom', 'react/jsx-runtime'] });
const React = require('react');
const { render, screen, fireEvent, cleanup } = require('@testing-library/react');
const App = require('./save-upgrade-app.cjs').default;
const fixtures = require('./test-fixtures/recent-saves.json');
assert.equal(fixtures.length, 10);
assert.equal(new Set(fixtures.map(fixture => fixture.build)).size, 10);
for (const fixture of fixtures) {
  cleanup(); localStorage.clear(); // Separate independent build fixtures only.
  for (const [key, value] of Object.entries(fixture.entries)) localStorage.setItem(key, value);
  for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  localStorage.setItem('unrelated-app', 'retain me');
  render(React.createElement(App));
  for (let reopen = 0; reopen < 3; reopen++) {
    // Compare all keys: game, inventory, journal, discoveries, goals and service.
    for (const [key, value] of Object.entries(fixture.entries)) {
      if (key === SAVE_KEY) {
        const upgraded = JSON.parse(localStorage.getItem(key));
        if (upgraded.nextRainAt !== undefined) assert(Number.isFinite(upgraded.nextRainAt), 'rain schedule is valid during migration');
        delete upgraded.rainSystemStarted; delete upgraded.nextRainAt; delete upgraded.rainUntil; delete upgraded.rainScheduleDay; delete upgraded.rainStartsToday;
        const original = JSON.parse(value); delete original.rainUntil;
        assert.deepEqual(upgraded, original, `v${fixture.build}, reopen ${reopen}: needs, clock, funds and location retained during weather migration`);
      } else if (key === 'street-life-inventory-v1') {
        assert.deepEqual(JSON.parse(localStorage.getItem(key)), { readyMeal: 0, readyMealFreshness: 100, ...JSON.parse(value) }, `v${fixture.build}, reopen ${reopen}: old inventory retained with empty ready-meal stock`);
      } else if (key === 'street-life-journal-goals-v1') {
        // These historical fixtures know no work and have no Cold/low battery.
        // Preserve the original fixtures and verify the intentional goal migration.
        assert.deepEqual(JSON.parse(localStorage.getItem(key)), {
          version: 2, shelter: JSON.parse(value).shelter, charge: false, work: false, cold: false,
          chargeKnown: false, workKnown: false, coldKnown: false,
          battery: JSON.parse(fixture.entries['street-life-inventory-v1']).phoneBattery,
          pendingCompletions: [], // Newly added acknowledgement queue defaults to empty for legacy saves.
        }, `v${fixture.build}, reopen ${reopen}: event-driven goals migrate without inventing completion`);
      } else if (key === 'street-life-screen' && value === 'journal') {
        assert.equal(localStorage.getItem(key), 'phone', 'old Journal selection migrates to Phone');
      } else {
        assert.equal(localStorage.getItem(key), value, `v${fixture.build}, reopen ${reopen}: ${key}`);
      }
    }
    assert.equal(localStorage.getItem('unrelated-app'), 'retain me');
    for (const [key, value] of Object.entries(entries)) assert.equal(localStorage.getItem(key), value, 'ancient entries stay untouched');
    cleanup(); render(React.createElement(App)); // No clear between reloads.
  }
  fireEvent.click(screen.getByRole('button', { name: 'Reset save' }));
  const reset = localStorage.getItem(SAVE_KEY);
  assert.equal(JSON.parse(reset).day, 1);
  cleanup(); render(React.createElement(App));
  assert.equal(localStorage.getItem(SAVE_KEY), reset, 'reset cannot resurrect an obsolete run');
}
cleanup(); dom.window.close();
console.log(`PASS: actual v${fixtures[0].build}–v${fixtures.at(-1).build} storage survives upgrade and repeated reload; obsolete v1/v2 readers removed.`);
