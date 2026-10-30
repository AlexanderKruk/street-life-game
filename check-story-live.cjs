const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { buildSync } = require('./tests/helpers/build.cjs');
const temporary = mkdtempSync(join(tmpdir(), 'street-story-live-'));
process.env.NODE_PATH = resolve('node_modules'); require('node:module').Module._initPaths();
try {
  const app = join(temporary, 'app.cjs'), events = join(temporary, 'events.cjs');
  for (const [entry, outfile] of [['src/App.tsx', app], ['src/events.ts', events]]) buildSync({legacyEventDialogs:true, entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile, external: ['react', 'react-dom', 'react/jsx-runtime'] });
  process.env.STREET_REGRESSION_APP = app;
  const env = require('./tests/helpers/regression-env.cjs');
  const { STREET_EVENTS } = require(events);
  let reduced = true;
  window.matchMedia = () => ({ matches: reduced });
  const key = 'street-life-story-v1', encounterKey = 'street-life-encounters-v1', firstKey = 'street-life-first-night-events-v1';
  const seen = STREET_EVENTS.map(event => event.id);
  const save = () => { env.fireEvent(window, new window.Event('pagehide')); return env.read(key); };
  const facts = () => ({ game: env.read(env.stateKey), inventory: env.read(env.invKey), history: env.read('street-life-journal-history-v1'), story: save() });
  function setup(eventId, screen = 'story', extra = {}) {
    const first = eventId.startsWith('first-night-');
    env.setup({ day: first ? 1 : 2, minutes: first ? 1350 : eventId === 'city-waking' ? 480 : 720, energy: 100, health: 100 }, {
      [firstKey]: { seen: seen.filter(id => id.startsWith('first-night-')), lastAt: null, pendingId: first ? eventId : null },
      [encounterKey]: { seen, lastAt: null, pendingId: first ? null : eventId },
      'street-life-left-home-v1': !first, 'street-life-discovered-v1': ['street', 'station'], 'street-life-screen': screen, ...extra,
    });
  }
  const remount = () => { save(); env.cleanup(); env.render(env.React.createElement(env.React.StrictMode, null, env.React.createElement(env.App))); };
  const clickId = id => { const button = document.querySelector(`[data-order-id="${id}"]`); assert(button && !button.disabled, `${id} is available`); env.fireEvent.click(button); };
  const noModal = () => assert(!document.querySelector('.event-overlay, .dice-overlay, .result-overlay, .activity-overlay'), 'event, check, process and result stay inline');
  const finishCheck = () => { if (env.screen.queryByRole('button', { name: 'Try', exact: true })) { env.click('Try'); env.click('Continue'); } };
  let cases = 0;
  for (const event of STREET_EVENTS) for (const choice of event.choices) {
    setup(event.id, 'location');
    clickId(`event:${event.id}:${choice.id}`); finishCheck();
    const classic = facts();
    classic.story.episodes[0].status = 'complete'; // Story acknowledges presentation automatically.
    const classicIndicators = [...document.querySelectorAll('.result-indicator')].map(node => [node.dataset.resourceId, node.getAttribute('aria-label')]);
    setup(event.id);
    noModal();
    assert(document.querySelector('.game-background:not([inert])'), 'inline Story stays interactive');
    assert(document.querySelector('.bottom-nav[inert]'), 'the active event blocks navigation');
    clickId(`event:${event.id}:${choice.id}`); finishCheck();
    noModal();
    assert.deepEqual(facts(), classic, `${event.id}:${choice.id} has exactly the classic costs, outcomes, History and archive`);
    assert.deepEqual([...document.querySelectorAll('.story-result-effects .result-indicator')].map(node => [node.dataset.resourceId, node.getAttribute('aria-label')]), classicIndicators, 'inline result retains the same filtered consequences');
    assert(!document.querySelector('[data-order-id="story:acknowledge"]'));
    assert.equal(save().episodes[0].status, 'complete');
    assert(!document.querySelector('.bottom-nav[inert]'), 'acknowledgement releases navigation');
    cases++;
  }
  setup('spare-change');
  const opening = facts(), order = [...document.querySelectorAll('.story-live-choice')].map(button => button.dataset.orderId);
  remount(); noModal(); assert.deepEqual(facts(), opening);
  assert.deepEqual([...document.querySelectorAll('.story-live-choice')].map(button => button.dataset.orderId), order, 'reload preserves choice order');
  clickId('event:spare-change:give');
  const result = facts(); remount(); noModal(); assert.deepEqual(facts(), result, 'automatically completed inline result restores without paying twice');
  assert(!document.querySelector('[data-order-id="story:acknowledge"]'));
  const complete = facts(); remount(); assert.deepEqual(facts(), complete); assert(!document.querySelector('[data-order-id="story:acknowledge"]'));
  // Checks outside the old two special scenes also restore before and after a roll.
  const checked = STREET_EVENTS.find(event => !['borrow-phone-slip', 'park-company'].includes(event.id) && event.choices.some(choice => choice.check));
  const checkedChoice = checked.choices.find(choice => choice.check);
  setup(checked.id); clickId(`event:${checked.id}:${checkedChoice.id}`);
  remount(); noModal(); assert(env.screen.getByRole('button', { name: 'Try', exact: true }));
  const beforeRoll = facts(); Math.random = () => .2; env.click('Try');
  const rolled = facts(); assert.equal(rolled.story.episodes[0].scenes[0].roll.value, 5);
  remount(); noModal(); assert.deepEqual(facts(), rolled); assert(!env.screen.queryByRole('button', { name: 'Try', exact: true }));
  env.click('Continue'); assert.equal(save().episodes[0].status, 'complete');
  assert.notDeepEqual(facts().game, beforeRoll.game);
  setup(checked.id); clickId(`event:${checked.id}:${checkedChoice.id}`); env.click('Cancel'); remount();
  assert(!document.querySelector('.story-live-check')); assert(document.querySelector(`[data-order-id="event:${checked.id}:${checkedChoice.id}"]`));
  setup('borrow-phone'); Math.random = () => 0; clickId('event:borrow-phone:lend');
  assert.deepEqual(save().episodes[0].scenes.map(scene => scene.eventId), ['borrow-phone', 'borrow-phone-slip']);
  clickId('event:borrow-phone-slip:catch'); finishCheck(); noModal(); assert.equal(save().episodes.length, 1);
  // Idle Story is a game screen, while decisions and explicit archive replay pause.
  env.setup({ day: 2, minutes: 720 }, { 'street-life-screen': 'story' });
  const idle = env.read(env.stateKey).minutes; env.advance(2000); assert.equal(env.read(env.stateKey).minutes, idle + 2);
  env.setup({ day: 1, minutes: 1320 }, { 'street-life-screen': 'story', [firstKey]: { seen: [], lastAt: null, pendingId: null }, [encounterKey]: { seen: [], lastAt: null, pendingId: null }, 'street-life-left-home-v1': false });
  env.advance(15000); noModal();
  assert(document.querySelector('[data-order-id^="event:first-night-door:"]'), 'an event actually starts while the player remains on Story');
  const newlyStarted = facts(); env.advance(2000); assert.deepEqual(facts(), newlyStarted, 'the new inline decision pauses the shared world clock');
  setup('spare-change'); const pending = facts(); env.advance(2000); assert.deepEqual(facts(), pending, 'real clocks pause while choosing');
  setup('spare-change', 'story', { [env.stateKey]: { ...pending.game, money: 0 } });
  const unavailable = document.querySelector('[data-order-id="event:spare-change:give"]');
  assert(unavailable.disabled && unavailable.querySelector('small'), 'unavailable answers retain their disabled state and explanation');
  const refused = facts(); env.fireEvent.click(unavailable); assert.deepEqual(facts(), refused);
  // Rain's running search, cancellation and completion keep the existing owner.
  const rain = { id: 'rain:3660', level: 'rain', start: 3660, end: 3675, choice: null, searchRemaining: 0, protection: .5, shelter: 'tree', exposure: 0, energyLoss: 0, moodLoss: 0, waited: 0, coldRoll: .99 };
  env.setup({ day: 3, minutes: 780, rain, rainSystemStarted: true, rainScheduleDay: 3 }, { 'street-life-screen': 'story' });
  clickId('rain:proper'); noModal(); const started = env.read(env.stateKey).minutes; env.advance(1000);
  assert(env.read(env.stateKey).minutes > started, 'rain process advances the shared clock');
  clickId('rain:cancel'); env.advance(20000); noModal();
  assert.equal(save().episodes[0].status, 'complete');
  // Non-reduced presentation appends the outcome without retyping the opening.
  reduced = false;
  const frames = new Map(); let frameId = 0, clock = 0;
  window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = id => frames.delete(id);
  const animate = duration => { const end = clock + duration; while (clock < end) { clock += 32; env.act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(clock)); }); } };
  setup('spare-change');
  assert(!document.querySelector('.story-live-controls'), 'choices wait for the opening animation');
  env.fireEvent.click(document.querySelector('.story-reveal')); animate(6000);
  const firstText = document.querySelector('.story-text p'); assert(firstText);
  const choiceClock = document.querySelector('.story-head time').textContent;
  animate(1500); assert.equal(document.querySelector('.story-head time').textContent, choiceClock, 'the clock pauses for a decision');
  clickId('event:spare-change:give');
  assert.equal(document.querySelector('.story-text p'), firstText, 'the already-read opening keeps its DOM and does not replay');
  assert(!document.querySelector('[data-order-id="story:acknowledge"]'), 'result acknowledgement waits for its own presentation');
  const movingClock = document.querySelector('.story-head time').textContent;
  animate(1500); assert.notEqual(document.querySelector('.story-head time').textContent, movingClock, 'clock resumes during the result');
  animate(30000); noModal(); assert(!document.querySelector('[data-order-id="story:acknowledge"]'));
  assert.equal(save().episodes[0].status, 'complete');
  assert(document.querySelector('.story-idle.is-running'), 'the cursor keeps breathing between events');
  const idleClock = document.querySelector('.story-idle time').textContent;
  animate(1500); assert.notEqual(document.querySelector('.story-idle time').textContent, idleClock, 'presentation clock keeps ticking without an acknowledgement');
  assert.equal(document.querySelector('.story-result-stamp').dataset.storyStamp, 'sealed');
  env.finish();
  console.log(`PASS: ${cases} live Story choices match classic mechanics; inline checks/results, stable order, StrictMode/reload/ack, chains, rain, idle/pending clocks and incremental presentation.`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
