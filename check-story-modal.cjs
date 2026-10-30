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
    assert(!modal().querySelector('.story-toolbar'), 'modal omits archive toolbar');
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
  const priorStory = save();
  setup('city-waking', 'map', { [key]: priorStory });
  const ids = () => [...modal().querySelectorAll('.story-episode')].map(node => Number(node.dataset.storyId));
  assert.deepEqual(ids(), [priorStory.episodes[0].id, priorStory.nextId], 'next event appends below the existing timeline');
  assert(!modal().querySelector('.story-episode-heading'), 'old episodes do not add replay controls between events');
  assert.equal(modal().querySelectorAll('.story-head').length, 1, 'one live cursor continues the chronology');
  assert.deepEqual(save().episodes[0], priorStory.episodes[0], 'previous saved facts remain immutable');
  remount(); assert.equal(ids().length, 2, 'reload and StrictMode retain both events without duplication');
  clickId(`event:city-waking:${STREET_EVENTS.find(event => event.id === 'city-waking').choices[0].id}`); finishCheck(); dismiss();
  assert.equal(save().episodes.length, 2); assert(save().episodes.every(episode => episode.status === 'complete'));
  assert.deepEqual(save().episodes[0], priorStory.episodes[0]);
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
  // Consuming an item commits once, presents the real result, then returns to
  // the same backpack. The reading pause starts only after presentation.
  const realTimeout = window.setTimeout, realClearTimeout = window.clearTimeout;
  const timeouts = new Map(); let timeoutId = 0, timeoutNow = 0;
  window.setTimeout = (callback, delay) => { const id = ++timeoutId; timeouts.set(id, { callback, at: timeoutNow + delay }); return id; };
  window.clearTimeout = id => timeouts.delete(id);
  const advanceTimeouts = duration => {
    const end = timeoutNow + duration;
    while (true) {
      const due = [...timeouts].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timeoutNow = due[1].at; timeouts.delete(due[0]); env.act(() => due[1].callback());
    }
    timeoutNow = end;
  };
  let visibility = 'visible';
  const visibilityDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  const setVisibility = value => { visibility = value; env.fireEvent(document, new window.Event('visibilitychange')); };
  env.setup({ day: 2, minutes: 720, thirst: 20 }, { 'street-life-screen': 'inventory', [env.invKey]: { water: 3 } });
  env.click(/Water.*tap to drink/);
  assert(modal()); noClassic();
  assert(modal().textContent.includes('You drink some water.'));
  assert(!modal().querySelector('.story-live-controls'), 'an already-used item has no repeated decision');
  assert(document.querySelector('.story-event-close'), 'reduced-motion result finishes immediately');
  const consumed = facts();
  assert.equal(consumed.inventory.water, 2); assert.equal(consumed.story.episodes.length, 1);
  assert.equal(consumed.story.episodes[0].source, 'inventory'); assert.equal(consumed.story.episodes[0].status, 'awaiting-ack');
  remount(); assert(modal()); assert.deepEqual(facts(), consumed, 'StrictMode/reload restores the result without consuming again');
  assert.equal(timeouts.size, 1, 'StrictMode cleans up the first reading timer');
  advanceTimeouts(1799); assert(modal(), 'the complete result remains readable for 1.8 seconds');
  setVisibility('hidden'); advanceTimeouts(5000); assert(modal(), 'a hidden tab cannot auto-dismiss an unread result');
  setVisibility('visible');
  const inventoryScroller = modal().querySelector('.story-event-content');
  Object.defineProperties(inventoryScroller, { scrollHeight: { value: 1200 }, clientHeight: { value: 500 } });
  inventoryScroller.scrollTop = 0; env.fireEvent.scroll(inventoryScroller);
  advanceTimeouts(5000); assert(modal(), 'reading older chronology suspends auto-close');
  inventoryScroller.scrollTop = 700; env.fireEvent.scroll(inventoryScroller);
  advanceTimeouts(1800); assert(!modal());
  assert.equal(localStorage.getItem('street-life-screen'), 'inventory');
  assert(!document.querySelector('.game-background[inert]')); assert.equal(document.body.style.position, '');
  const completedConsumption = facts();
  assert.equal(completedConsumption.story.episodes[0].status, 'complete');
  assert.deepEqual(completedConsumption.inventory, consumed.inventory); assert.deepEqual(completedConsumption.game, consumed.game);
  assert.deepEqual(completedConsumption.history, consumed.history, 'closing only acknowledges, without new History or rewards');
  env.click(/Water.*tap to drink/); assert(modal());
  env.fireEvent.click(document.querySelector('.story-event-close'));
  assert.equal(timeouts.size, 0, 'manual dismissal cancels the auto-close timer');
  advanceTimeouts(5000); assert(!modal());
  assert.equal(save().episodes.length, 2, 'a second drink is a separate record');
  assert.equal(env.read(env.invKey).water, 1);
  setup('spare-change'); clickId('event:spare-change:give'); advanceTimeouts(5000);
  assert(modal(), 'authored events still require acknowledgement'); dismiss();
  if (visibilityDescriptor) Object.defineProperty(document, 'visibilityState', visibilityDescriptor);
  else delete document.visibilityState;
  window.setTimeout = realTimeout; window.clearTimeout = realClearTimeout;
  // An unfinished animated result restores, then acknowledges exactly once.
  reduced = false;
  const frames = new Map(); let frameId = 0, clock = 0;
  window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = id => frames.delete(id);
  const animate = duration => { const end = clock + duration; while (clock < end) { clock += 32; env.act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(clock)); }); } };
  const resizeObservers = new Set();
  global.ResizeObserver = class {
    constructor(callback) { this.callback = callback; resizeObservers.add(this); }
    observe() {}
    disconnect() { resizeObservers.delete(this); }
  };
  setup('spare-change', 'inventory', { [key]: priorStory }); assert(!document.querySelector('.story-live-controls'));
  const archived = modal().querySelector('.story-episode');
  assert(!archived.querySelector('.story-letter, .is-replaying, [data-story-stamp="pending"]'), 'old event opens settled while the new one animates');
  const scroller = modal().querySelector('.story-event-content');
  const bottomButton = () => modal()?.querySelector('.story-event-bottom');
  assert(!bottomButton(), 'no jump button at the live end or without overflow');
  let height = 1200;
  let scrollRequest;
  scroller.scrollTo = options => {
    scrollRequest = options;
    if (options.behavior === 'instant') scroller.scrollTop = height - 500;
  };
  const resize = () => env.act(() => resizeObservers.forEach(observer => observer.callback()));
  Object.defineProperties(scroller, { scrollHeight: { get: () => height }, clientHeight: { value: 500 } });
  scroller.scrollTop = 700; env.fireEvent.scroll(scroller);
  height = 1300; resize();
  assert.equal(scroller.scrollTop, 1300, 'timeline follows newly revealed content at the bottom');
  scroller.scrollTop = 100; env.fireEvent.scroll(scroller);
  assert(bottomButton(), 'jump button appears while reading earlier content');
  assert(document.querySelector('.bottom-nav[inert]') && !document.querySelector('.story-event-close'), 'jumping does not unlock an unfinished event');
  const beforeJump = facts();
  env.fireEvent.click(bottomButton());
  assert.deepEqual(scrollRequest, { top: 1300, behavior: 'smooth' }, 'jump requests smooth scrolling to the current end');
  assert(bottomButton(), 'button stays until the smooth scroll arrives');
  assert.deepEqual(facts(), beforeJump, 'jumping changes no saved/gameplay facts');
  env.act(() => bottomButton().focus());
  reduced = true; env.fireEvent.click(bottomButton()); reduced = false;
  assert.deepEqual(scrollRequest, { top: 1300, behavior: 'instant' }, 'reduced motion jumps immediately');
  assert(!bottomButton()); assert.equal(document.activeElement, modal().querySelector('.story-event-panel'), 'focus stays in the modal after the jump button disappears');
  scroller.scrollTop = 100; env.fireEvent.scroll(scroller);
  height = 1400; resize();
  assert.equal(scroller.scrollTop, 100, 'reading previous events is not interrupted by the reveal');
  assert(bottomButton(), 'new content leaves the jump available while reading history');
  scroller.scrollTop = 835; env.fireEvent.scroll(scroller); assert(bottomButton(), '65px from the bottom still offers the jump');
  scroller.scrollTop = 836; env.fireEvent.scroll(scroller); assert(!bottomButton(), 'button disappears within 64px of the end');
  scroller.scrollTop = 900; env.fireEvent.scroll(scroller);
  height = 1500; resize();
  assert.equal(scroller.scrollTop, 1500, 'returning to the bottom resumes following');
  env.fireEvent.click(document.querySelector('.story-reveal')); animate(6000); clickId('event:spare-change:give');
  assert.equal(modal().querySelector('.story-episode'), archived, 'appending the result keeps the previous DOM intact');
  assert(modal()); assert.equal(save().episodes.at(-1).status, 'awaiting-ack'); const result = facts();
  remount(); assert.deepEqual(facts(), result); assert(modal()); animate(40000); assert(modal()); dismiss();
  assert.equal(save().episodes.at(-1).status, 'complete'); assert.deepEqual(facts().game, result.game);
  assert.deepEqual(save().episodes[0], priorStory.episodes[0]);
  const completed = facts(); remount(); assert(!modal()); assert.deepEqual(facts(), completed);
  assert.equal(resizeObservers.size, 0, 'timeline observers are removed on close/unmount');
  delete global.ResizeObserver;
  window.setTimeout = (callback, delay) => { const id = ++timeoutId; timeouts.set(id, { callback, at: timeoutNow + delay }); return id; };
  window.clearTimeout = id => timeouts.delete(id);
  env.setup({ day: 2, minutes: 720, thirst: 20 }, { 'street-life-screen': 'inventory', [env.invKey]: { water: 2 } });
  env.click(/Water.*tap to drink/);
  assert(modal()); assert(!document.querySelector('.story-event-close'));
  assert.equal(timeouts.size, 0, 'auto-close cannot start while the text or consequences are still appearing');
  advanceTimeouts(5000); assert(modal());
  animate(30000); assert(document.querySelector('.story-event-close'));
  const animatedConsumption = facts();
  advanceTimeouts(1799); assert(!modal().classList.contains('is-auto-closing'));
  advanceTimeouts(1); assert(modal().classList.contains('is-auto-closing'), 'the complete result fades after its reading pause');
  advanceTimeouts(319); assert(modal(), 'the fade finishes before acknowledgement');
  advanceTimeouts(1); assert(!modal()); assert.equal(save().episodes[0].status, 'complete');
  assert.deepEqual(facts().inventory, animatedConsumption.inventory);
  assert.deepEqual(facts().game, animatedConsumption.game);
  assert.equal(timeouts.size, 0, 'completed auto-close leaves no dismissal timer');
  window.setTimeout = realTimeout; window.clearTimeout = realClearTimeout;
  env.finish();
  console.log(`PASS: ${cases} default Story modal routes match classic mechanics; tab preservation, inline exception, focus/scroll lock, chains, reload/StrictMode, D20, rain, standalone transport and consumption auto-close.`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
