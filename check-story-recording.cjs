const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { buildSync } = require('./tests/helpers/build.cjs');
const temporary = mkdtempSync(join(tmpdir(), 'street-story-record-'));
process.env.NODE_PATH = resolve('node_modules'); require('node:module').Module._initPaths();
try {
  const app = join(temporary, 'app.cjs'), model = join(temporary, 'story.cjs'), events = join(temporary, 'events.cjs');
  for (const [entry, outfile] of [['src/App.tsx', app], ['src/story.ts', model], ['src/events.ts', events]]) buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile, external: ['react', 'react-dom', 'react/jsx-runtime'] });
  process.env.STREET_REGRESSION_APP = app;
  const env = require('./tests/helpers/regression-env.cjs');
  const { STREET_EVENTS } = require(events), { loadStory } = require(model);
  const key = 'street-life-story-v1', encounterKey = 'street-life-encounters-v1', firstKey = 'street-life-first-night-events-v1';
  const save = () => { env.fireEvent(window, new window.Event('pagehide')); return env.read(key); };
  const seen = STREET_EVENTS.map(event => event.id);
  function setup(eventId, locationId = 'street', extra = {}) {
    const first = eventId.startsWith('first-night-');
    env.setup({ day: first ? 1 : 2, minutes: first ? 1350 : eventId === 'city-waking' ? 480 : 720, locationId, energy: 100, health: 100 }, {
      [firstKey]: { seen: seen.filter(id => id.startsWith('first-night-')), lastAt: null, pendingId: first ? eventId : null },
      [encounterKey]: { seen, lastAt: null, pendingId: first ? null : eventId },
      'street-life-left-home-v1': !first,
      'street-life-discovered-v1': ['street', 'station'], ...extra,
    });
  }
  function choose(eventId, choiceId) {
    const button = document.querySelector(`[data-order-id="event:${eventId}:${choiceId}"]`);
    assert(button, `${eventId}:${choiceId} is visible in its classic dialog`);
    assert(!button.disabled, `${eventId}:${choiceId} is available`);
    env.fireEvent.click(button);
    if (document.querySelector('.dice-card')) { env.click('Try'); env.click('Continue'); }
  }
  let cases = 0;
  for (const event of STREET_EVENTS) for (const choice of event.choices) {
    setup(event.id);
    const opening = document.querySelector('.modal-narrative').textContent;
    choose(event.id, choice.id);
    const store = save(), episode = store.episodes[0];
    assert.equal(store.episodes.length, 1, event.id);
    assert.equal(episode.status, 'awaiting-ack', event.id);
    assert.equal(episode.scenes[0].text, opening);
    assert.equal(episode.scenes[0].choice.id, choice.id);
    assert.equal(episode.resultIdentity.actionId, `event:${event.id}`);
    assert(document.querySelector('.result-modal'), 'classic result remains');
    assert(episode.result.text.length > 0);
    assert.equal(episode.endedAt.minute, env.read(env.stateKey).minutes);
    assert.deepEqual(loadStory(store), store, 'current archive round trips');
    if (event.id === 'first-night-dog') {
      assert.equal(episode.result.closingText, choice.outcome.closingText, 'the authored ending is saved independently of the image moment');
      assert.deepEqual([...document.querySelectorAll('.result-card-content .result-narrative')].map(node => node.textContent), [episode.result.text, episode.result.closingText], 'classic result keeps both paragraphs below its top image');
      const beforeReload = env.read(env.stateKey);
      env.cleanup(); env.render(env.React.createElement(env.React.StrictMode, null, env.React.createElement(env.App)));
      assert.deepEqual(save(), store, 'the split result survives reload without rewriting its saved language');
      assert(document.querySelector('.result-modal').textContent.includes(episode.result.closingText));
      assert.deepEqual(env.read(env.stateKey), beforeReload, 'restoring the ending cannot apply the reward again');
    }
    if (choice.check) assert.equal(episode.scenes[0].roll.value, 20);
    env.ok();
    assert.equal(save().episodes[0].status, 'complete');
    cases++;
  }
  // Location variants are facts, with exactly the real amount charged once.
  for (const [place, amount] of [['street', 2], ['station', 1]]) {
    setup('spare-change', place);
    const before = env.read(env.stateKey).money;
    choose('spare-change', 'give');
    const store = save(), game = env.read(env.stateKey), inventory = env.read(env.invKey);
    assert.equal(game.money, before - amount);
    assert.equal(store.episodes[0].result.costs.find(row => row.id === 'money').amount, -amount);
    assert(store.episodes[0].scenes[0].illustration.includes(place));
    env.cleanup(); env.render(env.React.createElement(env.React.StrictMode, null, env.React.createElement(env.App)));
    assert(document.querySelector('.result-modal'), 'unacknowledged result restores without a command');
    assert.deepEqual(env.read(env.stateKey), game);
    assert.deepEqual(env.read(env.invKey), inventory);
    assert.deepEqual(save(), store);
    env.ok(); env.click('Story');
    const episode = document.querySelector('.story-episode');
    assert(episode.textContent.includes(store.episodes[0].scenes[0].choice.label));
    const archived = save(), gameBeforeReplay = env.read(env.stateKey);
    Math.random = () => { throw Error('Reading/replay must never roll'); };
    const oldRAF = window.requestAnimationFrame, oldCancel = window.cancelAnimationFrame;
    const frames = new Map(); let frameId = 0, clock = 0;
    window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
    window.cancelAnimationFrame = id => frames.delete(id);
    const animate = ms => { const end = clock + ms; while (clock < end) { clock += 32; const pending = [...frames.values()]; frames.clear(); env.act(() => pending.forEach(callback => callback(clock))); } };
    env.fireEvent.click(env.within(episode).getByRole('button', { name: 'Replay' }));
    animate(500);
    assert(episode.querySelector('.story-text button').textContent.length < archived.episodes[0].scenes[0].text.length, 'native replay types gradually');
    const openingStamp = episode.querySelector('.story-part-stamp');
    assert.equal(openingStamp.dataset.storyStamp, 'pending', 'metadata is not stamped during typing');
    assert.equal(openingStamp.getAttribute('aria-hidden'), 'true');
    assert(episode.querySelector('.story-part-imprint').hidden, 'the filled point is not left before the part finishes');
    assert.match(episode.querySelector('.story-head time').textContent, /^\d{2}:\d{2}$/, 'blinking cursor omits place and day');
    assert.equal(episode.querySelector('.story-text').firstElementChild.className, 'story-part-imprint', 'stamp and imprint precede the narrative in its own part');
    env.fireEvent.click(episode.querySelector('.story-text button'));
    animate(500);
    assert.match(episode.querySelector('.story-media img').style.filter, /brightness\(0\./, 'image begins in darkness');
    assert.equal(openingStamp.dataset.storyStamp, 'pending', 'part metadata waits until the image is fully shown');
    animate(1400);
    assert.equal(episode.querySelector('.story-media').style.gridTemplateRows, '1fr', 'image is complete before the following mini-block');
    assert(episode.querySelector('.story-choice').hidden, 'the shared image reading pause still holds back the choice');
    animate(500);
    assert.equal(openingStamp.dataset.storyStamp, 'sealed');
    assert.equal(openingStamp.getAttribute('aria-hidden'), 'false');
    assert(openingStamp.textContent.includes(archived.episodes[0].scenes[0].at.locationName));
    env.advance(5000);
    assert.deepEqual(env.read(env.stateKey), gameBeforeReplay, 'replay does not apply time/costs');
    animate(60000);
    assert(!episode.querySelector('.is-replaying'), 'native replay finishes');
    assert.equal(episode.querySelectorAll('[data-story-stamp="pending"]').length, 0, 'completed parts retain their full immutable stamps');
    window.requestAnimationFrame = oldRAF; window.cancelAnimationFrame = oldCancel;
    env.advance(5000);
    assert.deepEqual(save(), archived, 'replay does not modify archive');
    assert(env.read(env.stateKey).minutes > gameBeforeReplay.minutes, 'the live Story tab resumes ordinary world time after replay');
  }
  // A follow-up and restored authored D20 stay inside the original block.
  setup('borrow-phone');
  Math.random = () => 0;
  env.fireEvent.click(document.querySelector('[data-order-id="event:borrow-phone:lend"]'));
  let store = save();
  assert.equal(store.episodes.length, 1);
  assert.deepEqual(store.episodes[0].scenes.map(scene => scene.eventId), ['borrow-phone', 'borrow-phone-slip']);
  env.fireEvent.click(document.querySelector('[data-order-id="event:borrow-phone-slip:catch"]'));
  Math.random = () => .2; env.click('Try');
  const rolled = save(), gameBefore = env.read(env.stateKey);
  assert.equal(rolled.episodes[0].scenes[1].roll.value, 5);
  env.cleanup(); env.render(env.React.createElement(env.React.StrictMode, null, env.React.createElement(env.App)));
  assert.deepEqual(save(), rolled);
  assert.deepEqual(env.read(env.stateKey), gameBefore);
  env.click('Continue');
  assert.equal(save().episodes.length, 1);
  assert.equal(save().episodes[0].status, 'awaiting-ack');
  env.ok();
  env.setup({ day: 2, minutes: 720 }, { 'street-life-trip-v1': { destinationId: 'station', mode: 'fare-dodge', total: 20, remaining: 8, inspection: { at: 12, status: 'rolling', roll: 5, modifier: 0 } } });
  const tripBefore = env.read('street-life-trip-v1'), moneyBefore = env.read(env.stateKey).money;
  env.click('Continue');
  assert.equal(save().episodes[0].source, 'check');
  assert.equal(save().episodes[0].scenes[0].roll.value, 5);
  assert.equal(env.read(env.stateKey).money, moneyBefore - 20);
  env.cleanup(); env.render(env.React.createElement(env.React.StrictMode, null, env.React.createElement(env.App)));
  env.ok(); env.advance(1000);
  assert(env.read('street-life-trip-v1').remaining < tripBefore.remaining, 'original trip resumes');
  assert.equal(env.read(env.stateKey).money, moneyBefore - 20, 'fine is not repeated');
  // Invalid optional archive never prevents loading a classic save.
  assert.deepEqual(loadStory({ version: 99, episodes: store.episodes }), { version: 1, nextId: 1, episodes: [] });
  const broken = structuredClone(save()); broken.episodes[0].scenes[0].at.minute = -1;
  assert.equal(loadStory(broken).episodes.length, 0);
  env.setup({}, { [key]: '{bad JSON' });
  assert.equal(save().episodes.length, 0);
  // Rain has its own owner: opening, search -> cancellation and real result.
  const rain = { id: 'rain:3660', level: 'rain', start: 3660, end: 3675, choice: null, searchRemaining: 0, protection: .5, shelter: 'tree', exposure: 0, energyLoss: 0, moodLoss: 0, waited: 0, coldRoll: .99 };
  env.setup({ day: 3, minutes: 780, rain, rainSystemStarted: true, rainScheduleDay: 3 });
  env.fireEvent.click(env.screen.getByRole('button', { name: 'Find proper shelter' }));
  assert.equal(save().episodes[0].scenes[0].choice.id, 'proper');
  env.fireEvent.click(env.screen.getByRole('button', { name: 'Cancel' }));
  assert.equal(save().episodes[0].scenes[0].earlierChoices[0].id, 'proper');
  env.advance(20000);
  const rainStore = save();
  assert.equal(rainStore.episodes.length, 1);
  assert.equal(rainStore.episodes[0].status, 'awaiting-ack');
  assert.equal(rainStore.episodes[0].source, 'rain');
  env.ok();
  assert.equal(save().episodes[0].status, 'complete');
  env.click('Reset save');
  assert.equal(save().episodes.length, 0, 'new run clears only its archive');
  env.finish();
  console.log(`PASS: ${cases} catalogue choices automatically recorded; classic dialogs/results, actual variants/costs, StrictMode/reload/ack, chain/D20, rain cancellation/result, replay isolation and corrupt archives.`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
