const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { buildSync } = require('./tests/helpers/build.cjs');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'KeyboardEvent']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
let reduced = false, nextId = 1;
window.matchMedia = () => ({ matches: reduced });
const frames = new Map();
window.requestAnimationFrame = fn => { const id = nextId++; frames.set(id, fn); return id; };
window.cancelAnimationFrame = id => frames.delete(id);
function bundled(path) {
  const code = buildSync({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'react-dom', 'react/jsx-runtime'] }).outputFiles[0].text;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}
const React = require('react');
const { render, screen, fireEvent, act, cleanup } = require('@testing-library/react');
const { default: ResultCard, isMajorChange, ResultStat } = bundled('src/ResultCard.tsx');
const { summarizeResult } = bundled('src/results.ts');
const { questionPresentation, locationPresentation } = bundled('src/resultPresentation.ts');
const { Icon } = bundled('src/Icon.tsx');
const { default: ResultIndicators } = bundled('src/ResultIndicators.tsx');
const before = {
  game: { day: 2, minutes: 600, locationId: 'shelter', money: 57, hunger: 73, thirst: 50, energy: 34, health: 90, hygiene: 50, mood: 60.2, intoxication: 0 },
  inventory: { clothingCleanliness: 50, phoneBattery: 43, phoneCondition: 72, jacket: 78, water: 2, food: 2, medicines: 2, documents: true, cigarettes: 0, bottles: 0, transitCard: false },
  effects: [],
};
const after = { game: { ...before.game, minutes: 620, money: 52.6, hunger: 72.8, thirst: 49.9, energy: 47, health: 84, hygiene: 69, mood: 60.7 }, inventory: { ...before.inventory, phoneBattery: 40, medicines: 1 }, effects: [{ id: 'cold', expiresAt: 10000 }] };
function frame(now) { act(() => { const callbacks = [...frames]; frames.clear(); callbacks.forEach(([, fn]) => fn(now)); }); }
function row(label) { return document.querySelector(`[data-stat="${label}"]`); }
try {
  for (const [id, icon] of [['money', 'banknote'], ['water', 'water'], ['thirst', 'water'], ['food', 'food'], ['medicines', 'pill']]) {
    render(React.createElement(Icon, { name: icon }));
    const expected = document.querySelector('svg').innerHTML; cleanup();
    render(React.createElement(ResultIndicators, { changes: [{ id, label: id, value: '+1', amount: 1, kind: 'positive' }] }));
    assert.equal(document.querySelector(`[data-resource-id="${id}"] svg`).innerHTML, expected, `${id} reuses the existing project icon`);
    cleanup();
  }
  const summary = summarizeResult(before, after);
  assert.equal(summary.changes.find(change => change.label.includes('Energy')).meter.before, 34);
  assert.equal(summary.changes.find(change => change.label.includes('Hygiene')).meter.cap, 80);
  assert(!summary.changes.some(change => change.value === '+0' || change.value === '−0'));
  for (const label of ['Food', 'Water', 'Energy', 'Health', 'Hygiene', 'Battery', 'Phone condition', 'Clothing cleanliness', 'Clothing condition']) {
    assert(!isMajorChange({ label, value: '−4.9', kind: 'negative' }));
    assert(isMajorChange({ label, value: '−5', kind: 'negative' }));
    assert(isMajorChange({ label, value: '+0.1', kind: 'positive' }));
  }
  for (const label of ['Mood', '🙂 Mood']) {
    for (const value of ['−0.1', '−1', '−2', '−4.9', '−5']) assert(isMajorChange({ label, value, kind: 'negative' }), 'Mood has no passive-loss threshold');
  }
  const smallMoodLoss = summarizeResult(before, { ...before, game: { ...before.game, mood: before.game.mood - 1 } });
  render(React.createElement(ResultCard, { result: { title: 'Mood loss', text: 'A difficult moment.', ...smallMoodLoss }, onClose: () => {} }));
  assert(row('Mood'), 'ordinary results retain even a one-point Mood loss');
  cleanup();
  for (const [loss, display] of [[0.2, 1], [0.6, 1], [1.2, 1], [1.6, 2]]) {
    const expense = summarizeResult(before, { ...before, game: { ...before.game, mood: before.game.mood - loss, money: before.game.money - 0.5 }, inventory: { ...before.inventory, phoneBattery: before.inventory.phoneBattery - loss } });
    const batteryValue = expense.costs.find(cost => cost.label.includes('Battery')).value;
    render(React.createElement(ResultCard, { result: { title: 'Call', text: 'Call ended.', batteryInSummary: true, ...expense }, onClose: () => {} }));
    assert.equal(document.querySelector('[title="Battery"]').textContent, `Battery −${display}%`);
    assert(row('Mood')?.querySelector('svg'), 'call Mood keeps its icon and even small losses');
    assert(!document.querySelector('.compact-info-mood'), 'call Mood is not repeated in the cost summary');
    assert.equal(document.querySelector('[title="Money"]').textContent, 'Money −0.5 zł', 'money keeps its currency precision');
    assert.equal(expense.costs.find(cost => cost.label.includes('Battery')).value, batteryValue, 'rendering does not round the underlying expense');
    cleanup();
  }
  assert(isMajorChange({ label: 'Money', value: '−0.2 zł', kind: 'negative' }));
  for (const [key,label] of [['water','Water portions'],['food','Food portions'],['bread','Bread rolls'],['cannedFood','Canned food'],['readyMeal','Ready meals'],['wipes','Wet wipes'],['showerGel','3-in-1 gel uses'],['cigarettes','Cigarettes'],['medicines','Medicine']]) {
    const starting = { ...before, inventory: { ...before.inventory, [key]: 2 } };
    const consumed = { ...starting, inventory: { ...starting.inventory, [key]: 1 } };
   const usedRow = summarizeResult(starting, consumed, true, [key]).changes.find(change => change.label.includes(label));
    assert(usedRow.consumed); assert(!isMajorChange(usedRow));
    assert(isMajorChange(summarizeResult(starting, consumed).changes.find(change => change.label.includes(label))), 'other item losses remain visible');
    const received = { ...starting, inventory: { ...starting.inventory, [key]: 3 } };
    assert(isMajorChange(summarizeResult(starting, received, true, [key]).changes.find(change => change.label.includes(label))), 'received items remain visible');
  }
  let closed = 0;
  const result = { title: 'Result', text: 'You rested.', ...summary, presentation: { heading: 'You rested', label: 'REST', lead: 'A short break.', places: [] } };
  render(React.createElement(ResultCard, { result, onClose: () => { closed++; } }));
  assert.equal(row('Energy').querySelector('strong').textContent, '+13');
  assert.equal(row('Health').querySelector('strong').textContent, '−6');
  assert.equal(document.querySelectorAll('[data-resource-id="time"]').length, 0, 'elapsed time stays in the chronology, not the consequence row');
  assert(!document.querySelector('[role="meter"]'), 'results show deltas without current percentages or bars');
  assert(!document.querySelector('.result-modal .result-indicators.is-animated'), 'classic dialogs show all consequence groups immediately');
  assert(screen.getByRole('dialog').textContent.includes('Medicine'));
  assert(screen.getByRole('dialog').textContent.includes('Cold'));
  assert(screen.getByRole('dialog').textContent.includes('−4.4 zł'));
  fireEvent.click(row('Energy'));
  assert.equal(screen.getByRole('tooltip').textContent, 'Energy', 'an unfamiliar icon can be identified by tapping');
  fireEvent.blur(row('Energy'));
  assert(!screen.queryByRole('tooltip'));
  fireEvent.click(screen.getByRole('button', { name: 'Got it' })); assert.equal(closed, 1);
  cleanup();
  // Keep the shared Stat gain/loss/cap contract covered independently of result presentation.
  render(React.createElement(React.Fragment, null, ...summary.changes.filter(change => change.meter && isMajorChange(change)).sort((a,b) => (a.kind === 'positive' ? 0 : 1) - (b.kind === 'positive' ? 0 : 1)).map(change => React.createElement(ResultStat, {key: change.label, change, animationReady: true}))));
  assert.deepEqual([...document.querySelectorAll('[data-stat]')].map(node => node.dataset.stat), ['Energy', 'Hygiene', 'Mood', 'Health']);
  assert.equal(row('Energy').querySelector('.bar i').style.width, '34%');
  assert.equal(row('Energy').querySelector('.result-stat-delta').textContent, '+13');
  assert.equal(row('Health').querySelector('.result-stat-delta.negative').textContent, '−6', 'losses show their signed amount below the percentage');
  assert.equal(row('Health').querySelector('.bar-loss-trail').style.left, '84%');
  assert.equal(row('Health').querySelector('.bar-loss-trail').style.width, '6%');
  assert(row('Hygiene').querySelector('.bar-blocked'));
  assert.equal(row('Hygiene').querySelector('.bar-cap-marker').style.left, '80%');
  assert(!row('Hygiene').textContent.includes('Max'));
  frame(0); frame(600);
  const midpoint = parseFloat(row('Energy').querySelector('.bar i').style.width);
  assert(midpoint > 34 && midpoint < 47);
  frame(1500);
  assert.equal(row('Energy').querySelector('.bar i').style.width, '47%');
  assert.equal(row('Energy').querySelector('.status-stat-value > span').textContent, '47%');
  assert(row('Energy').querySelector('.bar i.warning'));
  assert(row('Hygiene').querySelector('.bar i.good'));
  frame(1900);
  assert.equal(row('Health').querySelector('.bar i').style.width, '84%');
  assert.equal(row('Health').querySelector('.status-stat-value > span').textContent, '84%');
  assert(row('Health').querySelector('.bar-loss-trail'), 'loss trace remains after the animation');
  assert.equal(frames.size, 0);
  cleanup();
  reduced = true;
  render(React.createElement(React.Fragment, null, ...summary.changes.filter(change => change.meter && isMajorChange(change)).map(change => React.createElement(ResultStat, {key: change.label, change, animationReady: true}))));
  assert.equal(row('Energy').querySelector('.bar i').style.width, '47%'); assert.equal(frames.size, 0);
  assert.equal(row('Health').querySelector('.status-stat-value > span').textContent, '84%');
  assert(row('Health').querySelector('.bar-loss-trail'), 'reduced motion retains the static loss trace');
  cleanup(); reduced = false;
  const batteryLoss = summarizeResult(before, { ...before, inventory: { ...before.inventory, phoneBattery: 37 } });
  render(React.createElement(ResultStat, {change: batteryLoss.costs.find(change => change.id === 'phoneBattery'), animationReady: true}));
  assert.equal(row('Battery').querySelector('.result-stat-delta.negative').textContent, '−6%');
  assert.equal(row('Battery').querySelector('.status-stat-value > span').textContent, '43%');
  frame(0);frame(300);
  assert.equal(row('Battery').querySelector('.bar i').style.width, '43%', 'briefly holds the original value');
  frame(1100);
  const batteryMidpoint = parseFloat(row('Battery').querySelector('.bar i').style.width);
  assert(batteryMidpoint < 43 && batteryMidpoint > 37);
  assert.equal(row('Battery').querySelector('.status-stat-value > span').textContent, `${Math.round(batteryMidpoint)}%`, 'percentage follows the animated fill');
  assert.equal(Number(row('Battery').querySelector('[role="meter"]').getAttribute('aria-valuenow')), batteryMidpoint, 'accessible value follows the fill too');
  assert.equal(row('Battery').querySelector('.bar-loss-trail').style.left, '37%');
  assert.equal(row('Battery').querySelector('.bar-loss-trail').style.width, '6%');
  assert(frames.size > 0); cleanup(); assert.equal(frames.size, 0, 'unmount cancels every animation frame');
  const musicBefore = { ...before, game: { ...before.game, mood: 28 } };
  const musicAfter = { ...musicBefore, game: { ...musicBefore.game, mood: 31, minutes: musicBefore.game.minutes + 30 } };
  const illustratedMusic = { title: 'Walk with music', text: 'You feel a little better.', illustration: '/street-life-game/assets/event-music-walk.webp', ...summarizeResult(musicBefore, musicAfter) };
  render(React.createElement(ResultCard, { result: illustratedMusic, onClose: () => {} }));
  assert.equal(row('Mood').querySelector('strong').textContent, '+3');
  assert(!document.querySelector('.result-indicators.is-animated'), 'classic result indicators are static even before the image loads');
  assert.equal(frames.size, 0, 'the consequence row has no independent gameplay or frame clock');
  fireEvent.load(document.querySelector('.result-illustration'));
  assert(!document.querySelector('.result-indicators.is-animated'), 'loading an image cannot start a classic result animation');
  cleanup();
  render(React.createElement(ResultCard, { result: illustratedMusic, onClose: () => {} }));
  fireEvent.error(document.querySelector('.result-illustration'));
  assert(!document.querySelector('.result-indicators.is-animated'), 'a failed image cannot start a classic result animation');
  cleanup();
  reduced=true;
  render(React.createElement(ResultCard, { result: illustratedMusic, onClose: () => {} }));
  assert.equal(row('Mood').querySelector('strong').textContent,'+3');
  assert.equal(frames.size,0,'reduced motion needs no animation frames');
  cleanup();reduced=false;
  const searchAfter = { ...before, inventory: { ...before.inventory, phoneBattery: 38.9 }, game: { ...before.game, minutes: 619, mood: 63.2 } };
  const searchSummary = summarizeResult(before, searchAfter);
  for (const [id, name] of [['support', 'Help Center'], ['daycenter', 'Day Center'], ['free-clinic', 'Free Clinic']]) {
    const presentation = questionPresentation('morning', [id]);
    assert(!presentation.illustration, 'search does not show an arrival image');
    render(React.createElement(ResultCard, { result: { title: 'Search', text: 'Full search answer.', presentation, ...searchSummary }, onClose: () => {} }));
    const dialog = screen.getByRole('dialog', { name });
    assert.equal(dialog.querySelectorAll('h2').length, 1);
    assert(!dialog.querySelector('.result-place'), 'location is not repeated');
    assert.equal(row('Mood').querySelector('strong').textContent, '+3');
    assert(row('Battery').querySelector('svg'), 'search costs below 5% keep their battery icon');
    assert.equal(row('Battery').querySelector('strong').textContent, '−4.1%');
    assert(!dialog.querySelector('.result-card-label'));
    assert(dialog.querySelector('.compact-info-heading svg'), 'title has an information icon');
    assert(dialog.querySelector('.compact-info-hours').textContent);
    assert(dialog.querySelector('.compact-info-heading .compact-info-saved'), 'map status shares the name and hours heading');
    assert(!dialog.querySelector('.result-card-content .compact-info-saved'), 'single-place result does not repeat map status below');
    assert.equal(dialog.querySelector('.compact-info-saved').textContent, 'On map');
    assert(!dialog.querySelector('[data-resource-id="time"]'));
    assert(!dialog.querySelector('details'), 'compact discoveries do not repeat the same information in a disclosure');
    cleanup();
  }
  render(React.createElement(ResultCard, { result: { title: 'Saved', text: 'Saved answer.', presentation: questionPresentation('morning', ['support'], true), costs: [], changes: [] }, onClose: () => {} }));
  assert.equal(document.querySelector('.compact-info-saved').textContent, 'On map');
  assert(!document.querySelector('.result-indicators'), 'no costs or gains are invented for a saved answer');cleanup();
  render(React.createElement(ResultCard, { result: { title: 'Nothing new', text: 'No new places.', presentation: questionPresentation('morning', []), costs: [], changes: [] }, onClose: () => {} }));
  assert(screen.getByRole('dialog', { name: 'No new information' }));
  assert(!document.querySelector('.compact-info-saved'));cleanup();
  for (const [id, places, heading, important] of [
    ['bed', ['shelter'], 'Night Shelter', ['18:00–08:00', 'Night Shelter offers a bed, meals and a shower.', 'Try to arrive before 18:00', 'places are limited']],
    ['supplies', ['shop'], 'Small Shop', ['07:00–22:00', 'A small shop selling affordable food and water.', 'Registered Night Shelter guests can get free meals at the shelter.']],
    ['charging', ['station'], 'Station', ['24 hours', '+60%', 'one hour', 'No internet needed']],
    ['no-place', [], 'If there is no bed', ['Schronisko', 'Day Center', 'safe sleep']],
  ]) for (const saved of [false, true]) {
    render(React.createElement(ResultCard, { result: { title: 'Search', text: 'Long original answer.', presentation: questionPresentation(id, places, saved, true), ...(saved ? {costs:[],changes:[]} : searchSummary) }, onClose: () => {} }));
    const dialog = screen.getByRole('dialog', { name: heading });
    assert(dialog.classList.contains('compact-info-result'));
    assert(!dialog.querySelector('.result-card-label'));
    assert(!dialog.querySelector('details'));
    assert.equal(!!row('Mood'), !saved);
    for (const text of important) assert(dialog.textContent.includes(text), `${id} keeps ${text}`);
    if (id === 'bed') {
      assert.equal(dialog.querySelectorAll('.result-description').length, 1, 'shelter discovery keeps one short practical paragraph');
      assert(!dialog.querySelector('.result-notice'), 'shelter discovery omits the extra registration notice');
      assert(!dialog.textContent.includes('18:20'), 'shelter discovery omits the registration timetable');
    }
    if (id === 'supplies') {
      assert.equal(dialog.querySelectorAll('.result-description').length, 1, 'food discovery uses a single description with consistent typography');
      assert(!dialog.querySelector('.result-narrative,.result-notice'), 'food discovery omits differently styled backpack hints and meal schedules');
    }
    assert.equal(!!dialog.querySelector('.compact-info-saved'), places.length > 0);
    if (saved) assert(!dialog.querySelector('.result-indicators'));
    cleanup();
  }
  for (const places of [['work'], ['support'], ['shelter'], ['support', 'daycenter']]) {
    render(React.createElement(ResultCard, { result: { title: 'Search', text: 'Search result.', presentation: locationPresentation(places), ...searchSummary }, onClose: () => {} }));
    assert(document.querySelector('.compact-info-result'));
    assert(!document.querySelector('details'));
    assert(row('Mood'));
    assert.equal(document.querySelectorAll('.result-place').length, places.length === 1 ? 0 : places.length);
    cleanup();
  }
  // Both surfaces share exact deltas; old records stay settled and replay is presentation-only.
  const StoryScreen = bundled('src/StoryScreen.tsx').default;
  const at = { day: 2, minute: 600, locationId: 'station', locationName: 'Station' };
  const fixtures = [
    { title: 'Action', text: 'You finish the action.', ...summary },
    { title: 'Call', text: 'The call ends.', batteryInSummary: true, ...summary },
    { title: 'Discovery', text: 'You find an address.', presentation: questionPresentation('morning', ['support']), ...searchSummary },
    { title: 'Small effort', text: 'You take a detour.', illustration: 'outcome.webp', visibleStats: ['energy'], ...summarizeResult(before, { ...before, game: { ...before.game, energy: before.game.energy - 1, thirst: before.game.thirst - .2 } }) },
  ];
  for (const [index, result] of fixtures.entries()) {
    render(React.createElement(ResultCard, { result, onClose: () => {} }));
    const classic = [...document.querySelectorAll('.result-indicator')].map(node => [node.dataset.resourceId, node.getAttribute('aria-label')]);
    cleanup();
    const episode = { id: 1, source: 'encounter', sourceId: 'fixture', status: 'complete', scenes: [{ eventId: 'fixture', title: 'Scene', text: 'You stop here.', at, ...((index === 0 || index === 3) ? { choice: { id: 'wait', label: 'Wait here', at: { ...at, minute: 601 } } } : {}) }], result, endedAt: { ...at, minute: 620 } };
    const saved = JSON.stringify(episode);
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    assert.deepEqual([...document.querySelectorAll('.story-result-effects .result-indicator')].map(node => [node.dataset.resourceId, node.getAttribute('aria-label')]), classic, 'Story and modal show the same filtered changes and currency precision');
    assert(!document.querySelector('.story-result-effects [data-resource-id="time"]'));
    assert(!document.querySelector('.story-result-effects [data-resource-id="hunger"]'), 'minor passive food drain remains hidden');
    assert(!document.querySelector('.story-result-effects [data-resource-id="thirst"]'), 'minor passive water drain remains hidden');
    assert(!document.querySelector('.story-result-effects .status-needs, .story-result-effects [role="meter"]'), 'Story omits the framed status panel');
    assert(document.querySelector('.story-result-start .story-result-imprint'), 'result has its own timeline point');
    assert.equal(document.querySelector('.story-result-start time').textContent, '10:20 · Station · Day 1');
    if (index === 0 || index === 3) {
      const choice = document.querySelector('.story-choice.story-result-start');
      assert(choice, 'answer starts the joint result part');
      assert(choice.querySelector('.story-result-stamp'), 'one result stamp is above the selected answer');
      assert(!document.querySelector('.story-part-body .story-part-stamp'), 'there is no second stamp between answer and outcome');
      assert.equal(document.querySelectorAll('.story-result-stamp').length, 1);
    }
    assert.equal(document.querySelector('.story-part-stamp').textContent, '10:00 · Station · Day 1', 'opening stamp keeps the saved event-start time');
    if (index === 0 || index === 3) {
      const energy = () => document.querySelector('.story-result-effects [data-resource-id="energy"]');
      const delta = energy().querySelector('strong').textContent;
      if (index === 0) assert.equal(delta, '+13');
      else assert.equal(document.querySelectorAll('.story-result-effects .result-indicator').length, 1, 'single-indicator replay is covered too');
      assert(!document.querySelector('.story-result-effects .is-animated'), 'old records open fully revealed');
      assert.equal(frames.size, 0, 'reading old records does not schedule animation');
      fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
      let clock = 0;
      while (!energy() && clock < 40000) { clock += 32; frame(clock); }
      assert(energy(), 'replay reaches the effects after narrative text');
      assert(document.querySelector('.story-result-effects .is-animated.is-ready'), 'replay starts sequential appearance only at the effects step');
      assert.equal(document.querySelector('.story-result-start time').dataset.storyStamp, 'pending', 'a result stamp waits for the consequences to finish');
      assert(document.querySelector('.story-track.is-running'), 'clock and breathing continue while consequences appear');
      assert.equal(energy().style.getPropertyValue('--result-indicator-delay'), '0ms', 'the shared preceding piece pause replaces the indicator-only delay');
      assert.equal(document.querySelector('.story-result-effects .result-indicators').style.getPropertyValue('--result-indicator-duration'), '260ms');
      const entered = clock;
      const count = document.querySelectorAll('.story-result-effects .result-indicator').length;
      const fullyVisibleAt = (count - 1) * 260 + 260;
      while (clock - entered < fullyVisibleAt - 64) { clock += 32; frame(clock); }
      assert.equal(document.querySelector('.story-result-start time').dataset.storyStamp, 'pending', 'stamp cannot precede the last group becoming fully visible');
      while (clock - entered < fullyVisibleAt + 128) { clock += 32; frame(clock); }
      assert.equal(energy().querySelector('strong').textContent, delta, 'replay retains the actual delta');
      assert.equal(document.querySelector('.story-result-start time').dataset.storyStamp, 'sealed', 'the result becomes a fixed stamp only when fully revealed');
      assert(document.querySelector('.story-track.is-settling'), 'the stamp starts printing as the cursor departs');
      assert(document.querySelector('.story-result-start time').textContent.startsWith('10:20'), 'the fixed saved time is present from the start of departure');
      for (const end = clock + 1000; clock < end;) { clock += 32; frame(clock); }
      assert(!document.querySelector('.story-track.is-running'), 'clock stops only when the whole result block has finished');
      assert.equal(document.querySelector('.story-part-stamp').textContent, '10:00 · Station · Day 1', 'replay duration cannot change the event-start timestamp');
    }
    assert.equal(JSON.stringify(episode), saved, 'presentation never mutates archived facts');
    cleanup();
  }
  {
    const episode = { id: 97, source: 'encounter', sourceId: 'chain', status: 'complete', scenes: [
      { eventId: 'start', title: 'Opening', text: 'You wait.', at,
        earlierChoices: [{ id: 'ask', label: 'Ask', at }], choice: { id: 'try', label: 'Try again', at } },
      { eventId: 'follow-up', title: 'Continuation', text: 'The neighbour stops.', at: { ...at, minute: 605 },
        choice: { id: 'accept', label: 'Accept', at: { ...at, minute: 606 } } }
    ], result: fixtures[0], endedAt: { ...at, minute: 620 } };
    const saved = JSON.stringify(episode);
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    const parts = [...document.querySelectorAll('.story-part-start')];
    assert.equal(parts.length, 3, 'opening, continuation and final result each have one stamp');
    assert(parts[1].classList.contains('story-choice'), 'continuation stamp belongs above the choices that produced it');
    assert.equal(parts[1].querySelector('p').textContent, 'Ask');
    assert.equal(parts[1].querySelector('time').textContent, '10:05 · Station · Day 1');
    assert(parts[2].classList.contains('story-choice'), 'final result stamp is above its selected answer');
    assert.equal(parts[2].querySelector('time').textContent, '10:20 · Station · Day 1');
    assert.equal(document.querySelectorAll('.story-part-body .story-part-stamp').length, 0);
    assert.equal(JSON.stringify(episode), saved, 'grouping never rewrites choice or scene timestamps');
    cleanup();
  }
  // Check the visible reading rhythm, including punctuation pauses and click-to-reveal.
  {
    const episode = { id: 98, source: 'encounter', sourceId: 'typing', status: 'complete', scenes: [{ eventId: 'typing', title: 'Scene', text: 'А, Б. В', at }] };
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    assert(!document.querySelector('.story-letter'), 'historic text opens fully visible');
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    let now = 0; frame(0);
    const to = target => { while (now < target) { now = Math.min(target, now + 10); frame(now); } };
    const text = () => document.querySelector('.story-text button').textContent;
    to(49); assert.equal(text(), '', 'first character waits 50ms');
    to(50); assert.equal(text(), 'А');
    const firstLetter = document.querySelector('.story-letter');
    assert(firstLetter, 'new characters receive the approved soft reveal');
    to(100); assert.equal(text(), 'А,');
    assert.equal(document.querySelector('.story-letter'), firstLetter, 'adding a character preserves earlier DOM nodes and their running fade');
    assert.equal(document.querySelectorAll('.story-letter').length, 2);
    to(269); assert.equal(text(), 'А,', 'comma holds another 120ms before the next character interval');
    assert.equal(document.querySelector('.story-letter'), firstLetter, 'punctuation pause does not restart the fade');
    to(270); assert.equal(text(), 'А, ');
    to(370); assert.equal(text(), 'А, Б.');
    to(719); assert.equal(text(), 'А, Б.', 'sentence ending adds a 300ms reading pause');
    to(720); assert.equal(text(), 'А, Б. ');
    fireEvent.click(document.querySelector('.story-text button'));
    to(730); assert.equal(text(), 'А, Б. В', 'tap bypasses the remaining typing schedule');
    assert(!document.querySelector('.story-letter'), 'tap removes pending opacity effects so every letter is immediately visible');
    cleanup();
    const { createStoryTyping, storyCharactersShown } = bundled('src/storyTyping.ts');
    const emoji = createStoryTyping('🙂А');
    assert.equal(storyCharactersShown(emoji, 50), 1, 'Unicode character is never split into surrogate halves');
    assert.equal(storyCharactersShown(emoji, 100), 2);
    assert.equal(createStoryTyping('35,6').duration, 200, 'decimal comma adds no prose pause');
    assert.equal(createStoryTyping('3.14').duration, 200, 'decimal point adds no prose pause');
    const quoted = createStoryTyping('«Да…»');
    assert.equal(storyCharactersShown(quoted, 250), 5, 'closing quote appears before the sentence pause');
    assert.equal(quoted.duration, 550, 'final sentence pause is retained before the following media step');
    assert.equal(createStoryTyping('Да...').duration, 550, 'ellipsis adds one sentence pause');
    assert.equal(createStoryTyping('А: Б').duration, 380, 'colon adds a 180ms pause');
    assert.equal(createStoryTyping('А; Б').duration, 380, 'semicolon adds a 180ms pause');
    assert.equal(createStoryTyping('1;2').duration, 330, 'semicolon between list numbers still pauses');
    for (const dash of ['—', '–', '-']) assert.equal(createStoryTyping(`А ${dash} Б`).duration, 450, 'standalone dash adds 200ms');
    assert.equal(createStoryTyping('23:12').duration, 250, 'clock colon does not pause');
    assert.equal(createStoryTyping('2–4').duration, 150, 'numeric range does not pause');
    assert.equal(createStoryTyping('из-за').duration, 250, 'hyphen inside a word does not pause');
    assertequal(createStoryTyping('A').settledAt, 150, 'the shared block pause starts after the last 100ms letter fade');
    assert.equal(createStoryTyping('A.').settledAt, createStoryTyping('A.').duration, 'final punctuation already covers the letter fade without another delay');
  }
  // Every mini-block owns one reading pause, including before the effects.
  {
    const episode = { id: 96, source: 'encounter', sourceId: 'rhythm', status: 'complete', scenes: [{ eventId: 'rhythm', title: 'Scene', text: 'A\n\nB', illustration: 'scene.webp', at,
      choice: { id: 'choose', label: 'Choose', at } }], result: { ...fixtures[3], title: 'Result', text: 'C\r\n \r\nD', illustration: 'result.webp', closingText: 'E\n\n\nF' }, endedAt: at };
    const saved = JSON.stringify(episode);
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    assert.deepEqual([...document.querySelectorAll('.story-text p')].map(node => node.textContent), ['A', 'B', 'C', 'D', 'E', 'F'], 'each authored paragraph is one mini-block in the opening, outcome and ending');
    assert.equal(document.querySelectorAll('.story-part-stamp').length, 2, 'extra paragraphs keep the original opening/result stamps');
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    let clock = 0;
    const step = () => { clock += 16; frame(clock); };
    const pieces = [...document.querySelectorAll('.story-piece')];
    const waitFor = predicate => { const deadline = clock + 5000; while (!predicate() && clock < deadline) step(); assert(predicate(), 'replay advances to the next mini-block'); };
    const pauseTo = (piece, label, letterFade = 0, duration = 500) => {
      const completed = clock;
      while (clock - completed < letterFade + duration - 20) { step(); assert(piece.hidden, `${label} waits after the preceding mini-block`); }
      waitFor(() => !piece.hidden);
      assert(clock - completed >= letterFade + duration && clock - completed <= letterFade + duration + 32, `${label} follows its reading/part transition after full visibility (within frame rounding)`);
    };
    waitFor(() => pieces[0].querySelector('button')?.textContent === 'A');
    pauseTo(pieces[1], 'second opening paragraph', 100);
    waitFor(() => pieces[1].querySelector('button')?.textContent === 'B');
    pauseTo(pieces[2], 'opening image', 100);
    waitFor(() => pieces[2].querySelector('.story-media').style.gridTemplateRows === '1fr');
    pauseTo(pieces[3], 'selected answer', 0, 1000);
    const selectedAt = clock;
    while (clock - selectedAt < 1120) { step(); assert(pieces[4].hidden, 'selected answer finishes its 650ms entrance and shared pause before outcome text'); }
    waitFor(() => !pieces[4].hidden);
    assert(clock - selectedAt >= 1150 && clock - selectedAt <= 1184);
    waitFor(() => pieces[4].querySelector('button')?.textContent === 'C');
    pauseTo(pieces[5], 'second result paragraph', 100);
    waitFor(() => pieces[5].querySelector('button')?.textContent === 'D');
    pauseTo(pieces[6], 'result image', 100);
    waitFor(() => pieces[6].querySelector('.story-media').style.gridTemplateRows === '1fr');
    pauseTo(pieces[7], 'closing text');
    waitFor(() => pieces[7].querySelector('button')?.textContent === 'E');
    pauseTo(pieces[8], 'second closing paragraph', 100);
    waitFor(() => pieces[8].querySelector('button')?.textContent === 'F');
    pauseTo(pieces[9], 'consequences', 100);
    assert.equal(pieces[9].querySelector('.result-indicator').style.getPropertyValue('--result-indicator-delay'), '0ms', 'no second 500ms delay is added to effects');
    assert.equal(document.querySelector('.story-result-stamp').dataset.storyStamp, 'pending');
    const effectsAt = clock;
    while (clock - effectsAt < 240) step();
    assert.equal(document.querySelector('.story-result-stamp').dataset.storyStamp, 'pending', 'stamp waits for the full 260ms appearance');
    waitFor(() => document.querySelector('.story-result-stamp').dataset.storyStamp === 'sealed');
    assert(clock - effectsAt < 340, 'a terminal effects block adds no unnecessary trailing reading pause');
    assert.equal(JSON.stringify(episode), saved, 'paragraph rendering preserves archived text and stamps');
    cleanup();
  }
  // A split scene finishes after its image, closing paragraph and final consequence.
  {
    const dog = bundled('src/events.ts').STREET_EVENTS.find(event => event.id === 'first-night-dog');
    const greet = dog.choices.find(choice => choice.id === 'greet');
    const result = { title: dog.title, text: greet.outcome.message, closingText: greet.outcome.closingText, illustration: greet.outcome.illustration,
      ...summarizeResult(before, { ...before, game: { ...before.game, mood: before.game.mood + 3 } }) };
    const episode = { id: 98, source: 'encounter', sourceId: dog.id, status: 'complete', scenes: [{ eventId: dog.id, title: dog.title, text: 'You see a familiar dog.', at,
      choice: { id: greet.id, label: greet.label, at } }], result, endedAt: { ...at, minute: 605 } };
    const saved = JSON.stringify(episode);
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    const pieces = [...document.querySelectorAll('.story-piece')];
    assert.deepEqual(pieces.map(node => node.classList.contains('story-image') ? 'image' : node.classList.contains('story-stats') ? 'stats' : node.querySelector('p').textContent), ['You see a familiar dog.', greet.label, result.text, 'image', result.closingText, 'stats']);
    assert.equal(document.querySelectorAll('.story-result-stamp').length, 1, 'the closing paragraph does not create a new stamped block');
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    let clock = 0;
    const step = () => { clock += 32; frame(clock); };
    const closing = () => document.querySelectorAll('.story-text')[2];
    while ((!closing() || closing().hidden) && clock < 30000) step();
    assert(closing() && !closing().hidden, 'replay reaches the closing paragraph after revealing the image');
    assert.equal(document.querySelector('.story-media').style.gridTemplateRows, '1fr');
    step();
    assert(closing().textContent.length < result.closingText.length, 'the ending uses the normal progressive text reveal');
    assert(!document.querySelector('.story-result-effects'), 'Mood waits for the ending');
    assert.equal(document.querySelector('.story-result-stamp').dataset.storyStamp, 'pending');
    while (!document.querySelector('.story-result-effects') && clock < 40000) step();
    assert(document.querySelector('.story-result-effects'), 'consequences follow the fully shown ending');
    assert.equal(closing().textContent, result.closingText);
    assert.equal(document.querySelector('.story-result-stamp').dataset.storyStamp, 'pending', 'stamp still waits for the consequence animation');
    for (let end = clock + 1400; clock < end;) step();
    assert.equal(document.querySelector('.story-result-stamp').dataset.storyStamp, 'sealed');
    assert.equal(JSON.stringify(episode), saved, 'replaying split prose preserves old archive facts');
    cleanup();
  }
  // A deterministic layout catches cursor jumps and clock resets, beyond settled DOM checks.
  const geometry = Object.getOwnPropertyDescriptors(window.HTMLElement.prototype);
  Object.defineProperty(window.HTMLElement.prototype, 'offsetTop', { configurable: true, get() {
    if (this.classList.contains('story-choice')) return 380;
    if (this.classList.contains('story-result-start') || this.classList.contains('story-part-body')) return 500;
    if (this.classList.contains('story-stats')) return 680;
    if (this.classList.contains('story-image')) return 140;
    return 0;
  } });
  Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { configurable: true, get() {
    if (this.classList.contains('story-image')) return 200 * parseFloat(this.querySelector('.story-media').style.gridTemplateRows || 0);
    return this.classList.contains('story-choice') ? 60 : 140;
  } });
  try {
    const episode = { id: 99, source: 'encounter', sourceId: 'motion', status: 'complete', scenes: [{ eventId: 'motion', title: 'Scene', text: 'You listen to the city. '.repeat(10), illustration: 'street.webp', at,
      choice: { id: 'wait', label: 'Wait here', at: { ...at, minute: 601 } } }], result: fixtures[0], endedAt: { ...at, minute: 620 } };
    const saved = JSON.stringify(episode);
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    const track = document.querySelector('.story-track'), live = () => document.querySelector('.story-head time').textContent;
    const y = () => parseFloat(track.style.getPropertyValue('--story-y'));
    let clock = 0;
    const step = () => { clock += 16; frame(clock); };
    while (clock < 1200) step();
    assert.equal(live(), '10:01', 'replay clock ticks during text instead of jumping between archived stamps');
    assert.equal(y(), 0, 'the cursor holds above typed text');
    fireEvent.click(document.querySelector('.story-text button'));
    while (document.querySelector('.story-image').hidden && clock < 3000) step();
    const imageAt = clock;
    while (clock - imageAt < 575) step();
    const fraction = parseFloat(document.querySelector('.story-media').style.gridTemplateRows);
    assert(fraction > .8 && fraction < 1, 'picture geometry uses the reference cubic reveal, not a linear half-height');
    assert.equal(y(), 0, 'the cursor waits above the entire opening until its picture is fully shown');
    while (document.querySelector('.story-choice').hidden && clock < 5000) step();
    assert(track.classList.contains('is-running'), 'selected answer and outcome remain one running stage');
    const choiceClock = live();
    const resultStamp = document.querySelector('.story-choice .story-result-stamp');
    assert(resultStamp, 'the joint block stamp is above the choice');
    assert.equal(resultStamp.dataset.storyStamp, 'pending');
    assert.equal(document.querySelector('.story-choice .story-reveal').textContent, 'Wait here', 'selected narrative enters whole');
    assert(document.querySelector('.story-choice-enter'));
    for (let i = 0; i < 65; i++) step();
    assert.notEqual(live(), choiceClock, 'clock continues ticking during selected-answer appearance and its reading pause');
    assert.equal(resultStamp.dataset.storyStamp, 'pending', 'answer alone cannot seal the result');
    while (document.querySelector('.story-part-body').hidden && clock < 6000) step();
    const textY = y(); step();
    assert.equal(y(), textY, 'starting the next paragraph does not snap the clock to its offset');
    assert(track.classList.contains('is-running'), 'clock/breathing continue through the result');
    while (track.classList.contains('is-replaying') && clock < 20000) step();
    assert(!track.classList.contains('is-replaying'));
    const stoppedY = y(), stoppedClock = live();
    step(); step();
    assert.equal(y(), stoppedY, 'finishing keeps the cursor at the end of its path');
    assert.equal(live(), stoppedClock, 'finishing never resets the cosmetic clock to a different archived time');
    assert(!track.classList.contains('is-running'));
    assert.equal(frames.size, 0, 'completed replay has no perpetual animation loop');
    assert.equal(document.querySelector('.story-part-stamp').textContent, '10:00 · Station · Day 1');
    assert.equal(document.querySelector('.story-result-stamp').textContent, '10:20 · Station · Day 1');
    assert.equal(JSON.stringify(episode), saved);
    cleanup();
    reduced = true;
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    assert(!document.querySelector('.has-replay'), 'reduced motion remains a settled archive with factual time');
    assert.equal(live(), '10:20');
    assert(!document.querySelector('.story-letter'), 'reduced motion does not create per-character opacity effects');
    assert.equal(frames.size, 0);
    cleanup(); reduced = false;
  } finally {
    for (const key of ['offsetTop', 'offsetHeight']) {
      if (geometry[key]) Object.defineProperty(window.HTMLElement.prototype, key, geometry[key]);
      else delete window.HTMLElement.prototype[key];
    }
  }
  console.log('PASS: Story matches classic visible icon deltas/costs/consequences, hides passive drain, adds an unframed result point, settles old records and replays icon groups without archive mutation.');
  console.log('PASS: shared Status bars and compact result deltas, actual capped values, gain/loss animation, hidden passive drain, retained expenses/consequences, reduced motion and cleanup.');
  console.log('PASS: compact discoveries preserve hours, services, map status, costs and Mood gain without duplicate details, names, bars or arrival imagery; other full answers, saved answers and no-new-information still work.');
} finally { cleanup(); dom.window.close(); }
