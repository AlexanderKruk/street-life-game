const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
  const code = buildSync({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
  const module = { exports: {} }; new Function('require', 'module', 'exports', code)(require, module, module.exports); return module.exports;
}
require('./tests/helpers/travel-story.cjs')({ ...bundled('src/travelStory.ts'), ...bundled('src/storyAutoClose.ts'), ...bundled('src/story.ts'), ...bundled('src/loadGameSession.ts') });
const { initialState } = bundled('src/game.ts');
const { INITIAL_INVENTORY } = bundled('src/inventory.ts');
const { loadStory } = bundled('src/story.ts');
const temporary = mkdtempSync(join(tmpdir(), 'street-story-travel-'));
process.env.NODE_PATH = resolve('node_modules'); require('node:module').Module._initPaths();
try {
  const app = join(temporary, 'app.cjs'), classic = join(temporary, 'classic.cjs');
  for (const [outfile, legacyEventDialogs] of [[app, false], [classic, true]]) buildSync({ entryPoints: ['src/App.tsx'], outfile, legacyEventDialogs, bundle: true, platform: 'node', format: 'cjs', external: ['react', 'react-dom', 'react/jsx-runtime'] });
  process.env.STREET_REGRESSION_APP = app;
  const env = require('./tests/helpers/regression-env.cjs'), ClassicApp = require(classic).default;
  let reduced = true; window.matchMedia = () => ({ matches: reduced });
  const storyKey = 'street-life-story-v1', tripKey = 'street-life-trip-v1';
  let now = 0, timerId = 0; const timers = new Map();
  window.setTimeout = (fn, delay) => { timers.set(++timerId, { fn, at: now + delay }); return timerId; };
  window.clearTimeout = id => timers.delete(id);
  function timeout(duration) { const end = now + duration; while (true) { const next = [...timers].filter(([, t]) => t.at <= end).sort((a,b) => a[1].at-b[1].at)[0]; if (!next) break; now = next[1].at; timers.delete(next[0]); env.act(() => next[1].fn()); } now = end; }
  const save = () => { env.fireEvent(window, new window.Event('pagehide')); return env.read(storyKey); };
  const facts = () => { save(); return { game: env.read(env.stateKey), inventory: env.read(env.invKey), history: env.read('street-life-journal-history-v1') }; };
  const modal = () => document.querySelector('.story-event-overlay');
  const progress = () => document.querySelector('.story-travel-progress');
  const remount = (App = env.App) => { save(); env.cleanup(); env.render(env.React.createElement(env.React.StrictMode, null, env.React.createElement(App))); };
  function setup(mode = 'walk', remaining = 8, total = 8, inspection) {
    const game = { ...initialState, day: 2, minutes: 600, locationId: 'street', money: mode === 'transit' ? 95.6 : 100, health: 100, energy: 100, mood: 28 };
    const before = { game: { ...game, money: 100 }, inventory: { ...INITIAL_INVENTORY, water: 3, food: 2, medicines: 0, phoneBattery: 90, phoneCondition: 100, clothingCleanliness: 100, jacket: 100 }, effects: [] };
    env.setup(game, { 'street-life-screen': 'map', [env.invKey]: before.inventory, [tripKey]: { destinationId: 'station', mode, total, remaining, before, ...(inspection ? { inspection } : {}) } });
  }
  for (const mode of ['walk', 'transit', 'fare-dodge']) {
    setup(mode); remount(ClassicApp); env.advance(2000); const expected = facts(); env.ok();
    setup(mode); assert(modal() && progress()); assert(!document.querySelector('.travel-screen'));
    assert.equal(modal().querySelectorAll('.story-part-stamp').length, 1, 'route and arrival reserve a single shared stamp');
    assert.equal(modal().querySelector('.story-part-stamp').dataset.storyStamp, 'pending', 'the journey is not stamped as complete while travelling');
    const id = save().episodes[0].id; assert.equal(env.read(tripKey).storyEpisodeId, id);
    env.advance(249); assert.equal(document.querySelector('.story-head time').textContent, '10:00');
    for (let minute = 1; minute <= 4; minute++) {
      env.advance(minute === 1 ? 1 : 250);
      assert.equal(env.read(env.stateKey).minutes, 600 + minute);
      assert.equal(env.read(tripKey).remaining, 8 - minute);
      assert.equal(document.querySelector('.story-head time').textContent, `10:0${minute}`, 'each game minute is displayed every 250ms');
    }
    const during = facts(); remount(); assert.deepEqual(facts(), during); assert.equal(save().episodes.length, 1);
    assert.equal(env.read(tripKey).storyEpisodeId, id); env.advance(1000);
    assert.equal(env.read(tripKey), null); assert(modal()); assert(!progress());
    assert(modal().textContent.includes('Arrived at the station.'));
    assert.equal(modal().querySelectorAll('.story-part-stamp').length, 1, 'arrival does not introduce a separate timestamp block');
    assert(modal().querySelector('.story-part-stamp').textContent.startsWith('10:08'), 'the one journey stamp records actual completion');
    assert.equal(save().episodes[0].status, 'awaiting-ack'); assert.deepEqual(facts(), expected, `${mode} retains classic arrival costs, time and History`);
    const arrived = facts(), pendingArrival = save();
    assert.deepEqual(loadStory(pendingArrival), pendingArrival, 'actual arrival consequences retain valid finite values through persistence');
    remount(); assert.deepEqual(facts(), arrived, 'pending arrival does not run again');
    assert(modal(), `pending ${mode} arrival restores its modal: ${JSON.stringify({ screen: localStorage.getItem('street-life-screen'), story: save(), timers: [...timers.values()].map(timer => timer.at - now) })}`);
    timeout(999); assert(modal()); assert(document.querySelector('.map-surface'));
    timeout(1); assert(!modal()); assert(document.querySelector('.location-surface'));
    assert.equal(save().episodes[0].status, 'complete'); assert.equal(save().episodes.length, 1); assert.deepEqual(facts(), arrived);
    remount(); assert(!modal()); assert.deepEqual(facts(), arrived);
  }
  for (const mode of ['walk', 'transit', 'fare-dodge']) {
    setup(mode, 8, 20); env.advance(250); const before = facts();
    env.click('Cancel'); assert(!modal()); assert.equal(env.read(tripKey), null);
    assert.deepEqual(facts(), before, 'cancelling preserves the exact elapsed date, needs, money and inventory');
    const entry = save().episodes[0]; assert.equal(entry.status, 'complete'); assert.equal(entry.resultIdentity.actionId, 'journey-stopped');
    remount(); assert(!modal()); assert.equal(env.read(tripKey), null);
  }
  setup('fare-dodge', 9, 20, { at: 12, status: 'scheduled' }); env.advance(250);
  assert(document.querySelector('.dice-overlay')); assert(!progress());
  const inspectionTrip = env.read(tripKey); env.advance(5000); assert.deepEqual(env.read(tripKey), inspectionTrip);
  env.click('Try'); env.click('Continue'); assert(document.querySelector('.result-overlay')); env.ok();
  assert(progress(), 'the interrupted route resumes after the inspection result');
  const resumed = env.read(tripKey); assert.equal(resumed.remaining, inspectionTrip.remaining);
  env.advance(250); assert.equal(env.read(tripKey).remaining, resumed.remaining - 1);
  env.cleanup();
  reduced = false; let clock = 0, nextFrame = 0; const frames = new Map();
  window.requestAnimationFrame = fn => { frames.set(++nextFrame, fn); return nextFrame; };
  window.cancelAnimationFrame = id => frames.delete(id);
  const animate = duration => { const end = clock + duration; while (clock < end) { clock += 32; env.act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(clock)); }); } };
  setup('walk');
  env.advance(249); assert.equal(document.querySelector('.story-head time').textContent, '10:00');
  env.advance(1); assert.equal(document.querySelector('.story-head time').textContent, '10:01');
  env.advance(250); assert.equal(document.querySelector('.story-head time').textContent, '10:02', 'the 250ms clock updates even before any text animation frame');
  env.click('Cancel');
  setup('walk', 0); assert(modal()); assert(!document.querySelector('.story-event-action:not(:disabled)')); assert.equal(timers.size, 0);
  for (let i = 0; i < 200 && !document.querySelector('.story-text:not(.story-part-start) .story-reveal .story-letter'); i++) animate(64);
  const typingArrival = document.querySelector('.story-text:not(.story-part-start) .story-reveal');
  assert(typingArrival && typingArrival.textContent.length > 0 && typingArrival.textContent.length < 'Arrived at the station.'.length, 'arrival is revealed character by character');
  assert(!document.querySelector('.story-event-action:not(:disabled)')); assert.equal(timers.size, 0);
  const frozen = facts(); animate(30000); assert(document.querySelector('.story-event-action:not(:disabled)')); assert.deepEqual(facts(), frozen);
  timeout(1000); assert(modal().classList.contains('is-auto-closing')); timeout(200); assert(!modal());
  assert(document.querySelector('.location-surface')); assert.equal(timers.size, 0);
  env.finish();
  console.log('PASS: Story travel ×4, real phase copy, cancellation, arrival/reload parity, inspection pause/resume, typed completion and quick-result navigation.');
} finally { rmSync(temporary, { recursive: true, force: true }); }
