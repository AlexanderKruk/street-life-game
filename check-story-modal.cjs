const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { buildSync } = require('./tests/helpers/build.cjs');
const temporary = mkdtempSync(join(tmpdir(), 'street-story-modal-'));
process.env.NODE_PATH = resolve('node_modules'); require('node:module').Module._initPaths();
try {
  const app = join(temporary, 'app.cjs'), classic = join(temporary, 'classic.cjs'), events = join(temporary, 'events.cjs'), inventoryModule = join(temporary, 'inventory.cjs');
  for (const [entry, outfile, legacyEventDialogs] of [['src/App.tsx', app, false], ['src/App.tsx', classic, true], ['src/events.ts', events, false], ['src/inventory.ts', inventoryModule, false]])
    buildSync({ entryPoints: [entry], outfile, legacyEventDialogs, bundle: true, platform: 'node', format: 'cjs', external: ['react', 'react-dom', 'react/jsx-runtime'] });
  process.env.STREET_REGRESSION_APP = app;
  const env = require('./tests/helpers/regression-env.cjs');
  const ClassicApp = require(classic).default, { STREET_EVENTS } = require(events);
  const { SHOP_ITEMS } = require(inventoryModule);
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
    assert(document.querySelector('.story-event-action:not(:disabled)'), 'Actions becomes available only after full presentation');
    assert.equal(document.querySelector('.story-event-action').textContent, 'Actions');
    assert(!document.querySelector('.story-event-close'), 'the cross is removed');
    assert(document.querySelector('.bottom-nav[inert]'), 'navigation stays locked until the modal closes');
    assert.equal(modal().getAttribute('aria-modal'), 'true');
    env.fireEvent.keyDown(document, { key: 'Tab' }); assert(modal().contains(document.activeElement));
    env.fireEvent.click(document.querySelector('.story-event-action'));
    assert(!modal(), 'Actions closes the completed event');
    assert(!document.querySelector('.bottom-nav[inert]'), 'closing releases navigation');
  };
  const finishCheck = () => { if (env.screen.queryByRole('button', { name: 'Try', exact: true })) { env.click('Try'); env.click('Continue'); } };
  // All three opening contacts use the shared Story owner and real call clock.
  for (const [index, id, minutes, loss, art] of [
    [0, 'call-university', 2, 2, 'event-call-no-answer'],
    [1, 'call-colleague', 5, 5, 'event-call-family'],
    [2, 'call-friend', 5, 5, 'event-call-small-room'],
  ]) {
    env.setup({ day: 1, minutes: 1320, locationId: 'street', mood: 30, health: 100, energy: 100 }, {
      [firstKey]: { seen, lastAt: null, pendingId: null }, [encounterKey]: { seen, lastAt: null, pendingId: null },
      'street-life-left-home-v1': false, 'street-life-opening-calls-v1': index,
      'street-life-music-walk-used-v1': true,
    });
    env.fireEvent.click(document.querySelector('[data-choice="phone-call"]'));
    assert(modal(), `${id} opens the shared Story modal`); noClassic();
    assert(document.querySelector('.story-choice').textContent, 'selected thought is preserved');
    assert(document.querySelector('.story-travel-progress [role="status"]'), 'ringing appears after the intro');
    const start = env.read(env.stateKey).minutes;
    env.advance(999); assert.equal(env.read(env.stateKey).minutes, start, 'call retains its one-second minute');
    env.advance(1);
    assert.equal(env.read('street-life-phone-activity-v1').remaining, minutes - 1);
    remount(); noClassic(); assert(modal());
    assert.equal(save().episodes.filter(entry => entry.source === 'phone').length, 1, 'reload does not duplicate the call');
    env.advance((minutes - 1) * 1000);
    const episode = save().episodes.find(entry => entry.source === 'phone');
    assert.equal(episode.sourceId, id); assert.equal(episode.status, 'awaiting-ack');
    assert.equal(env.read(env.stateKey).mood, 30 - loss, 'actual contact-specific mood loss is unchanged');
    assert.equal(env.read('street-life-opening-calls-v1'), index + 1, 'progression advances exactly once');
    assert(episode.result.illustration.includes(art));
    assert(modal().querySelector(`.story-media img[src*="${art}"]`), 'actual result artwork is shown');
    assert(modal().querySelector('.story-result-effects'), 'actual consequences follow artwork');
    const callFinished = facts(); env.advance(1000);
    assert.equal(env.read(env.stateKey).minutes, callFinished.game.minutes + 1, 'completed calls resume ordinary time while their result stays open');
    assert.deepEqual(save(), callFinished.story);
    assert.deepEqual(facts().history, callFinished.history);
    const settled = facts(); remount(); assert.deepEqual(facts(), settled, 'pending result reload does not repeat consequences');
    dismiss(); assert.equal(save().episodes.find(entry => entry.source === 'phone').status, 'complete');
  }
  // Music is an immediate thirty-minute command with one final-time result.
  env.setup({ day: 1, minutes: 1320, locationId: 'street', mood: 30, health: 100, energy: 100 }, {
    [firstKey]: { seen, lastAt: null, pendingId: null }, [encounterKey]: { seen, lastAt: null, pendingId: null },
    'street-life-left-home-v1': false, 'street-life-opening-calls-v1': 0,
    'street-life-music-walk-used-v1': false,
  });
  env.fireEvent.click(document.querySelector('[data-choice="music-walk"]'));
  assert(modal()); noClassic();
  assert.equal(env.read(env.stateKey).minutes, 1350, 'music spends thirty minutes immediately');
  assert.equal(env.read(env.stateKey).mood, 33, 'the existing single +3 reward is retained');
  const music = save().episodes.find(entry => entry.source === 'action');
  assert.equal(music.scenes[0].at.minute, 1320); assert.equal(music.endedAt.minute, 1350);
  assert.equal(modal().querySelectorAll('.story-part-stamp').length, 1, 'thought and result share one stamp');
  assert(modal().querySelector('.story-part-stamp').textContent.startsWith('22:30'));
  assert(modal().querySelector('.story-media img').src.includes('event-music-walk'));
  assert(!modal().querySelector('.story-live-controls'), 'music has no waiting phase');
  const musicFacts = facts(); env.advance(5000);
  const musicReading = facts();
  assert.equal(musicReading.game.minutes, 1355, 'the thirty-minute jump is followed by ordinary real minutes while reading');
  assert.equal(modal().querySelector('.story-head time').textContent, '22:35', 'lower clock equals actual saved time');
  assert(modal().querySelector('.story-part-stamp').textContent.startsWith('22:30'), 'completion stamp stays fixed');
  assert(musicReading.game.hunger < musicFacts.game.hunger && musicReading.game.energy < musicFacts.game.energy, 'ordinary needs follow the same clock');
  assert.equal(musicReading.game.mood, musicFacts.game.mood, 'reading never repeats the music reward');
  assert.deepEqual(musicReading.history, musicFacts.history); assert.deepEqual(musicReading.story, musicFacts.story);
  remount(); assert.deepEqual(facts(), musicReading, 'restoring music preserves elapsed time without repeating the command');
  env.advance(1000); assert.equal(env.read(env.stateKey).minutes, 1356);
  assert.equal(modal().querySelector('.story-head time').textContent, '22:36', 'restored result still reads the real clock');
  dismiss(); assert.equal(save().episodes.find(entry => entry.source === 'action').status, 'complete');
  env.setup({ ...musicReading.game, day: 1, minutes: 1439 }, { [key]: musicReading.story, [env.invKey]: musicReading.inventory, 'street-life-screen': 'location' });
  const beforeMidnight = facts(); env.advance(2000);
  assert.equal(env.read(env.stateKey).day, 2); assert.equal(env.read(env.stateKey).minutes, 1);
  assert.equal(modal().querySelector('.story-head time').textContent, '00:01');
  assert.deepEqual(save(), beforeMidnight.story, 'crossing midnight never rewrites the action stamp');
  dismiss();
  env.setup({ day: 2, minutes: 1316, locationId: 'shop', money: 100 }, { 'street-life-screen': 'location', [env.invKey]: { water: 0 } });
  env.fireEvent.click(document.querySelector('.shop-buy'));
  const beforeClosing = facts(); assert.equal(beforeClosing.game.minutes, 1319);
  env.advance(1000); assert.equal(env.read(env.stateKey).minutes, 1320);
  assert.equal(env.read(env.stateKey).locationId, 'street', 'shop opening hours use the same running result clock');
  assert.equal(env.read(env.stateKey).money, beforeClosing.game.money);
  assert.equal(env.read(env.invKey).water, beforeClosing.inventory.water);
  let cases = 0;
  for (const event of STREET_EVENTS) for (const choice of event.choices) {
    setup(event.id); remount(ClassicApp);
    clickId(`event:${event.id}:${choice.id}`); finishCheck();
    const expected = facts(); expected.story.episodes[0].status = 'complete';
    setup(event.id);
    assert(modal(), `${event.id} opens Story over the current screen`); noClassic(); assert(!document.querySelector('.story-event-action:not(:disabled)'));
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
  env.fireEvent.click(document.querySelector('.bottom-nav button')); assert(modal(), 'blocked navigation cannot dismiss the result');
  env.fireEvent.keyDown(document, { key: 'Escape' }); assert(!modal()); assert.equal(save().episodes[0].status, 'complete');
  env.click('Map'); save(); assert.equal(localStorage.getItem('street-life-screen'), 'map');
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
  for (const item of SHOP_ITEMS) {
    const startShop = () => env.setup({ day: 2, minutes: 720, locationId: 'shop', money: 100 }, {
      'street-life-screen': 'location', [env.invKey]: { water: 0, food: 0, bread: 0, cannedFood: 0, readyMeal: 0, wipes: 0, showerGel: 0, cigarettes: 0, medicines: 0 },
    });
    startShop(); remount(ClassicApp);
    env.fireEvent.click(document.querySelectorAll('.shop-buy')[SHOP_ITEMS.indexOf(item)]);
    const expected = facts(); expected.story.episodes[0].status = 'complete';
    startShop(); env.fireEvent.click(document.querySelectorAll('.shop-buy')[SHOP_ITEMS.indexOf(item)]);
    assert(modal(), `${item.id} uses the shared Story modal`); noClassic();
    assert(!modal().textContent.includes('put them in your backpack'));
    assert(modal().querySelector(`[data-resource-id="${item.id}"]`), 'received stock uses its own resource identity');
    assert(modal().querySelector('[data-resource-id="money"]'));
    const purchased = facts(); remount(); assert.deepEqual(facts(), purchased, 'a pending purchase reloads without a second charge');
    dismiss(); assert.deepEqual(facts(), expected, `${item.id} preserves exact price, stock, time, History and Story facts`);
  }
  // Consuming an item commits once and waits for manual acknowledgement.
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
  env.setup({ day: 2, minutes: 720, locationId: 'shop', money: 100 }, { 'street-life-screen': 'location', [env.invKey]: { water: 0 } });
  env.fireEvent.click(document.querySelector('.shop-buy'));
  const manualPurchase = facts();
  assert.equal(timeouts.size, 0, 'shop purchases never schedule automatic dismissal');
  advanceTimeouts(30000); env.advance(30000);
  assert(modal(), 'purchase stays open until Actions is clicked');
  const readPurchase = facts();
  assert.equal(readPurchase.game.minutes, manualPurchase.game.minutes + 30);
  assert.equal(readPurchase.game.money, manualPurchase.game.money);
  assert.equal(readPurchase.inventory.water, manualPurchase.inventory.water);
  assert.deepEqual(readPurchase.story, manualPurchase.story); assert.deepEqual(readPurchase.history, manualPurchase.history);
  remount(); advanceTimeouts(30000); assert(modal(), 'restored purchases also stay open');
  assert.equal(timeouts.size, 0); dismiss();
  assert.equal(localStorage.getItem('street-life-screen'), 'location', 'Actions only closes and preserves the underlying screen');
  env.setup({ day: 2, minutes: 720, thirst: 20 }, { 'street-life-screen': 'inventory', [env.invKey]: { water: 3 } });
  env.click(/Water.*tap to drink/);
  assert(modal()); noClassic();
  assert(modal().textContent.includes('You drink some water.'));
  assert(!modal().querySelector('.story-live-controls'), 'an already-used item has no repeated decision');
  assert(document.querySelector('.story-event-action:not(:disabled)'), 'reduced-motion result finishes immediately');
  const consumed = facts();
  assert.equal(consumed.inventory.water, 2); assert.equal(consumed.story.episodes.length, 1);
  assert.equal(consumed.story.episodes[0].source, 'inventory'); assert.equal(consumed.story.episodes[0].status, 'awaiting-ack');
  remount(); assert(modal()); assert.deepEqual(facts(), consumed, 'StrictMode/reload restores the result without consuming again');
  assert.equal(timeouts.size, 0, 'consumption never starts a dismissal timer, including after reload');
  advanceTimeouts(999); env.advance(1000); assert(modal(), 'the complete result remains visible for its reading pause');
  const readConsumption = facts();
  assert.deepEqual(readConsumption, consumed, 'zero-duration consumption retains its existing pause');
  assert.equal(readConsumption.inventory.water, consumed.inventory.water);
  assert.deepEqual(readConsumption.story, consumed.story); assert.deepEqual(readConsumption.history, consumed.history);
  assert(document.querySelector('.bottom-nav[inert]')); assert.equal(modal().getAttribute('aria-modal'), 'true');
  advanceTimeouts(30000); assert(modal(), 'consumption remains open until Actions is clicked');
  env.fireEvent.click(document.querySelector('.story-event-action')); assert(!modal());
  assert.equal(localStorage.getItem('street-life-screen'), 'inventory');
  assert(!document.querySelector('.game-background[inert]')); assert.equal(document.body.style.position, '');
  const completedConsumption = facts();
  assert.equal(completedConsumption.story.episodes[0].status, 'complete');
  assert.deepEqual(completedConsumption.inventory, readConsumption.inventory); assert.deepEqual(completedConsumption.game, readConsumption.game);
  assert.deepEqual(completedConsumption.history, consumed.history, 'closing only acknowledges, without new History or rewards');
  env.click(/Water.*tap to drink/); assert(modal());
  env.fireEvent.click(document.querySelector('.story-event-action:not(:disabled)'));
  assert.equal(timeouts.size, 0, 'manual dismissal leaves no timer');
  advanceTimeouts(5000); assert(!modal());
  assert.equal(save().episodes.length, 2, 'a second drink is a separate record');
  assert.equal(env.read(env.invKey).water, 1);
  setup('spare-change'); clickId('event:spare-change:give'); advanceTimeouts(5000);
  assert(modal(), 'authored events still require acknowledgement'); dismiss();
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
  assert(bottomButton().disabled, 'the fixed jump button is disabled at the live end or without overflow');
  assert.equal(document.querySelector('.story-event-action').textContent, 'Event…');
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
  assert.equal(scroller.scrollTop, 700, 'new content does not jump the scroller during resize');
  animate(32);
  assert(scroller.scrollTop > 700 && scroller.scrollTop < 800, 'the first frame moves only partway towards the new end');
  animate(1500);
  assert.equal(scroller.scrollTop, 800, 'smooth following settles at the actual scroll limit');
  scroller.scrollTop = 100; env.fireEvent.scroll(scroller);
  assert(!bottomButton().disabled, 'jump button becomes active while reading earlier content');
  assert(document.querySelector('.bottom-nav[inert]') && !document.querySelector('.story-event-action:not(:disabled)'), 'jumping does not unlock an unfinished event');
  const beforeJump = facts();
  env.fireEvent.click(bottomButton());
  assert.deepEqual(scrollRequest, { top: 1300, behavior: 'smooth' }, 'jump requests smooth scrolling to the current end');
  assert(bottomButton(), 'button stays until the smooth scroll arrives');
  assert.deepEqual(facts(), beforeJump, 'jumping changes no saved/gameplay facts');
  env.act(() => bottomButton().focus());
  reduced = true; env.fireEvent.click(bottomButton()); reduced = false;
  assert.deepEqual(scrollRequest, { top: 1300, behavior: 'instant' }, 'reduced motion jumps immediately');
  assert(bottomButton().disabled); assert.equal(document.activeElement, modal().querySelector('.story-event-panel'), 'focus stays in the modal after the jump button becomes disabled');
  scroller.scrollTop = 100; env.fireEvent.scroll(scroller);
  height = 1400; resize();
  assert.equal(scroller.scrollTop, 100, 'reading previous events is not interrupted by the reveal');
  assert(!bottomButton().disabled, 'new content leaves the jump available while reading history');
  scroller.scrollTop = 835; env.fireEvent.scroll(scroller); assert(!bottomButton().disabled, '65px from the bottom still offers the jump');
  scroller.scrollTop = 836; env.fireEvent.scroll(scroller); assert(bottomButton().disabled, 'button becomes disabled within 64px of the end');
  scroller.scrollTop = 900; env.fireEvent.scroll(scroller);
  height = 1500; resize();
  animate(1500);
  assert.equal(scroller.scrollTop, 1000, 'returning to the bottom resumes smooth following');
  env.fireEvent.click(document.querySelector('.story-reveal')); animate(6000);
  assert.equal(document.querySelector('.story-event-action').textContent, 'Choose an answer');
  assert(document.querySelector('.story-event-action').disabled); clickId('event:spare-change:give');
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
  assert(modal()); assert(!document.querySelector('.story-event-action:not(:disabled)'));
  assert.equal(timeouts.size, 0, 'the quick-result timer waits for the entire presentation');
  advanceTimeouts(5000); assert(modal());
  animate(30000); assert(document.querySelector('.story-event-action:not(:disabled)'));
  const animatedConsumption = facts();
  advanceTimeouts(999); env.advance(1000); assert(modal());
  const readingAnimatedConsumption = facts();
  assert.equal(readingAnimatedConsumption.game.minutes, animatedConsumption.game.minutes, 'zero-duration consumption does not invent elapsed time');
  assert(document.querySelector('.bottom-nav[inert]')); assert.equal(timeouts.size, 0);
  assert.equal(save().episodes[0].status, 'awaiting-ack');
  advanceTimeouts(30000); assert(modal());
  assert(!modal().classList.contains('is-auto-closing'), 'animated consumption never fades out automatically');
  env.fireEvent.click(document.querySelector('.story-event-action'));
  assert(!modal()); assert.equal(save().episodes[0].status, 'complete');
  assert.deepEqual(facts().inventory, readingAnimatedConsumption.inventory);
  assert.deepEqual(facts().game, readingAnimatedConsumption.game);
  assert.equal(timeouts.size, 0, 'closing leaves no dismissal timer');
  window.setTimeout = realTimeout; window.clearTimeout = realClearTimeout;
  env.setup({ day: 1, minutes: 1320, health: 100 }, { 'street-life-screen': 'location', 'street-life-left-home-v1': false, 'street-life-opening-calls-v1': 0, [firstKey]: { seen, lastAt: null, pendingId: null }, [encounterKey]: { seen, lastAt: null, pendingId: null } });
  env.fireEvent.click(document.querySelector('[data-choice="phone-call"]'));
  assert(modal().querySelector('.story-reveal'));
  env.advance(1000); assert.equal(env.read('street-life-phone-activity-v1').remaining, 1, 'call time runs even while the introduction is animating');
  assert.equal(modal().querySelector('.story-head time').textContent, '22:01');
  env.advance(1000); animate(30000);
  assert.equal(save().episodes.filter(entry => entry.source === 'phone').length, 1);
  dismiss();
  env.finish();
  console.log(`PASS: ${cases} default Story modal routes match classic mechanics; tab preservation, inline exception, focus/scroll lock, chains, reload/StrictMode, D20, rain, standalone transport and manual inventory dismissal.`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
