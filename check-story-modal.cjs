const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { buildSync } = require('./tests/helpers/build.cjs');
const temporary = mkdtempSync(join(tmpdir(), 'street-story-modal-'));
process.env.NODE_PATH = resolve('node_modules'); require('node:module').Module._initPaths();
try {
  const app = join(temporary, 'app.cjs'), classic = join(temporary, 'classic.cjs'), events = join(temporary, 'events.cjs');
  for (const [entry, outfile, legacyEventDialogs] of [['src/App.tsx', app, false], ['src/App.tsx', classic, true], ['src/events.ts', events, false]])
    buildSync({ entryPoints: [entry], outfile, legacyEventDialogs, bundle: true, platform: 'node', format: 'cjs', external: ['react', 'react-dom', 'react/jsx-runtime'] });
  process.env.STREET_REGRESSION_APP = app;
  const env = require('./tests/helpers/regression-env.cjs');
  const ClassicApp = require(classic).default, { STREET_EVENTS } = require(events);
  let reduced = true;
  window.matchMedia = () => ({ matches: reduced });
  const key = 'street-life-story-v1', encounterKey = 'street-life-encounters-v1', firstKey = 'street-life-first-night-events-v1';
  const seen = STREET_EVENTS.map(event => event.id);
  const save = () => { env.fireEvent(window, new window.Event('pagehide')); return env.read(key); };
  const facts = () => ({ game: env.read(env.stateKey), inventory: env.read(env.invKey), history: env.read('street-life-journal-history-v1'), story: save() });
  function setup(eventId, screen = 'location', extra = {}) {
    const first = eventId.startsWith('first-night-');
    env.setup({ day: first ? 1 : 2, minutes: first ? 1350 : eventId === 'city-waking' ? 480 : 720, energy: 100, health: 100 }, {
      [firstKey]: { seen: seen.filter(id => id.startsWith('first-night-')), lastAt: null, pendingId: first ? eventId : null },
      [encounterKey]: { seen, lastAt: null, pendingId: first ? null : eventId },
      'street-life-left-home-v1': !first, 'street-life-discovered-v1': ['street', 'station'], 'street-life-screen': screen, ...extra,
    });
  }
  const remount = (App = env.App) => { save(); env.cleanup(); env.render(env.React.createElement(env.React.StrictMode, null, env.React.createElement(App))); };
  const clickId = id => { const button = document.querySelector(`[data-order-id="${id}"]`); assert(button && !button.disabled, `${id} is available`); env.fireEvent.click(button); };
  const modal = () => document.querySelector('.story-event-overlay');
  const noClassic = () => assert(!document.querySelector('.event-overlay, .dice-overlay, .result-overlay, .activity-overlay'), 'event presentation has no classic overlay');
  const dismiss = () => {
    assert(document.querySelector('.story-event-close'), 'close appears only after full presentation');
    assert(!document.querySelector('.bottom-nav[inert]'), 'navigation unlocks when presentation finishes');
    env.fireEvent.click(modal());
    assert(!modal(), 'completed event closes on the backdrop');
  };
  const finishCheck = () => { if (env.screen.queryByRole('button', { name: 'Try', exact: true })) { env.click('Try'); env.click('Continue'); } };
  let cases = 0;
  for (const event of STREET_EVENTS) for (const choice of event.choices) {
    setup(event.id); remount(ClassicApp);
    clickId(`event:${event.id}:${choice.id}`); finishCheck();
    const expected = facts(); expected.story.episodes[0].status = 'complete';
    setup(event.id);
    assert(modal(), `${event.id} opens Story over the current screen`); noClassic(); assert(!document.querySelector('.story-event-close'));
    assert(!modal().querySelector('.story-toolbar'), 'modal has only the current episode');
    assert(document.querySelector('.game-background[inert]') && document.querySelector('.bottom-nav[inert]'));
    assert.equal(document.body.style.position, 'fixed');
    const before = facts();
    env.fireEvent.keyDown(document, { key: 'Escape' }); env.fireEvent.click(modal());
    assert(modal(), 'Escape and backdrop cannot drop a decision'); assert.deepEqual(facts(), before);
    env.fireEvent.keyDown(document, { key: 'Tab' }); assert(modal().contains(document.activeElement));
    env.fireEvent.keyDown(document, { key: 'Tab', shiftKey: true }); assert(modal().contains(document.activeElement));
    clickId(`event:${event.id}:${choice.id}`); finishCheck();
    noClassic(); dismiss();
    assert.deepEqual(facts(), expected, `${event.id}:${choice.id} preserves costs, RNG, History and archive`);
    assert.equal(document.body.style.position, ''); assert(!document.querySelector('.bottom-nav[inert]'));
    cases++;
  }
  for (const screen of ['map', 'inventory', 'status', 'phone']) {
    setup('spare-change', screen); clickId('event:spare-change:give'); dismiss();
    assert.equal(localStorage.getItem('street-life-screen'), screen, `${screen} stays selected`);
    assert(!modal());
  }
  setup('spare-change'); clickId('event:spare-change:give');
  env.fireEvent.click(env.screen.getByRole('button', { name: 'Map', exact: true })); assert(!modal()); assert.equal(save().episodes[0].status, 'complete');
  setup('spare-change', 'story'); assert(!modal()); clickId('event:spare-change:give'); assert.equal(save().episodes[0].status, 'complete');
  setup('spare-change'); const opening = facts(); remount(); assert.deepEqual(facts(), opening); assert(modal());
  const checked = STREET_EVENTS.find(event => !['borrow-phone-slip', 'park-company'].includes(event.id) && event.choices.some(choice => choice.check));
  const choice = checked.choices.find(choice => choice.check);
  setup(checked.id); clickId(`event:${checked.id}:${choice.id}`); remount(); assert(modal()); noClassic();
  Math.random = () => .2; env.click('Try'); const rolled = facts(); remount(); assert.deepEqual(facts(), rolled);
  assert(!env.screen.queryByRole('button', { name: 'Try', exact: true })); env.click('Continue'); dismiss();
  setup(checked.id); clickId(`event:${checked.id}:${choice.id}`); env.click('Cancel'); remount();
  assert(document.querySelector(`[data-order-id="event:${checked.id}:${choice.id}"]`));
  setup('borrow-phone'); Math.random = () => 0; clickId('event:borrow-phone:lend');
  assert.deepEqual(save().episodes[0].scenes.map(scene => scene.eventId), ['borrow-phone', 'borrow-phone-slip']);
  clickId('event:borrow-phone-slip:catch'); finishCheck(); dismiss(); assert.equal(save().episodes.length, 1);
  const rain = { id: 'rain:3660', level: 'rain', start: 3660, end: 3675, choice: null, searchRemaining: 0, protection: .5, shelter: 'tree', exposure: 0, energyLoss: 0, moodLoss: 0, waited: 0, coldRoll: .99 };
  env.setup({ day: 3, minutes: 780, rain, rainSystemStarted: true, rainScheduleDay: 3 }, { 'street-life-screen': 'map' });
  assert(modal()); clickId('rain:proper'); assert(modal()); noClassic();
  const started = env.read(env.stateKey).minutes; env.advance(1000); assert(env.read(env.stateKey).minutes > started);
  clickId('rain:cancel'); assert(!modal(), 'background rain does not hold the modal'); env.advance(20000);
  dismiss(); assert.equal(save().episodes[0].status, 'complete'); assert(!modal());
  env.setup({ day: 3, minutes: 780, rain: { ...rain, choice: 'proper', searchRemaining: 3 }, rainSystemStarted: true, rainScheduleDay: 3 });
  assert(modal()); assert(document.querySelector('[data-order-id="rain:cancel"]'), 'legacy rain process without archive restores controls');
  clickId('rain:cancel'); assert(!modal());
  // Standalone transport inspections retain the classic check and result.
  env.setup({ day: 2, minutes: 720 }, { 'street-life-trip-v1': { destinationId: 'station', mode: 'fare-dodge', total: 20, remaining: 8, inspection: { at: 12, status: 'rolling', roll: 5, modifier: 0 } } });
  assert(!modal()); assert(document.querySelector('.dice-overlay')); env.click('Continue'); assert(document.querySelector('.result-overlay')); assert(!modal()); env.ok();
  // An unfinished animated result restores, then acknowledges exactly once.
  reduced = false;
  const frames = new Map(); let frameId = 0, clock = 0;
  window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = id => frames.delete(id);
  const animate = duration => { const end = clock + duration; while (clock < end) { clock += 32; env.act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(clock)); }); } };
  setup('spare-change', 'inventory'); assert(!document.querySelector('.story-live-controls'));
  env.fireEvent.click(document.querySelector('.story-reveal')); animate(6000); clickId('event:spare-change:give');
  assert(modal()); assert.equal(save().episodes[0].status, 'awaiting-ack'); const result = facts();
  remount(); assert.deepEqual(facts(), result); assert(modal()); animate(40000); assert(modal()); dismiss();
  assert.equal(save().episodes[0].status, 'complete'); assert.deepEqual(facts().game, result.game);
  const completed = facts(); remount(); assert(!modal()); assert.deepEqual(facts(), completed);
  env.finish();
  console.log(`PASS: ${cases} default Story modal routes match classic mechanics; tab preservation, inline exception, focus/scroll lock, chains, reload/StrictMode, D20, rain and standalone transport.`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
