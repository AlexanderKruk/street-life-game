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
const before = {
  game: { day: 2, minutes: 600, locationId: 'shelter', money: 57, hunger: 73, thirst: 50, energy: 34, health: 90, hygiene: 50, mood: 60.2, intoxication: 0 },
  inventory: { clothingCleanliness: 50, phoneBattery: 43, phoneCondition: 72, jacket: 78, water: 2, food: 2, medicines: 2, documents: true, cigarettes: 0, bottles: 0, transitCard: false },
  effects: [],
};
const after = { game: { ...before.game, minutes: 620, money: 52.6, hunger: 72.8, thirst: 49.9, energy: 47, health: 84, hygiene: 69, mood: 60.7 }, inventory: { ...before.inventory, phoneBattery: 40, medicines: 1 }, effects: [{ id: 'cold', expiresAt: 10000 }] };
function frame(now) { act(() => { const callbacks = [...frames]; frames.clear(); callbacks.forEach(([, fn]) => fn(now)); }); }
function row(label) { return document.querySelector(`[data-stat="${label}"]`); }
try {
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
    { title: 'Small effort', text: 'You take a detour.', visibleStats: ['energy'], ...summarizeResult(before, { ...before, game: { ...before.game, energy: before.game.energy - 1, thirst: before.game.thirst - .2 } }) },
  ];
  for (const [index, result] of fixtures.entries()) {
    render(React.createElement(ResultCard, { result, onClose: () => {} }));
    const classic = [...document.querySelectorAll('.result-indicator')].map(node => [node.dataset.resourceId, node.getAttribute('aria-label')]);
    cleanup();
    const episode = { id: 1, source: 'encounter', sourceId: 'fixture', status: 'complete', scenes: [{ eventId: 'fixture', title: 'Scene', text: 'You stop here.', at }], result, endedAt: { ...at, minute: 620 } };
    const saved = JSON.stringify(episode);
    render(React.createElement(StoryScreen, { episodes: [episode] }));
    assert.deepEqual([...document.querySelectorAll('.story-result-effects .result-indicator')].map(node => [node.dataset.resourceId, node.getAttribute('aria-label')]), classic, 'Story and modal show the same filtered changes and currency precision');
    assert(!document.querySelector('.story-result-effects [data-resource-id="time"]'));
    assert(!document.querySelector('.story-result-effects [data-resource-id="hunger"]'), 'minor passive food drain remains hidden');
    assert(!document.querySelector('.story-result-effects [data-resource-id="thirst"]'), 'minor passive water drain remains hidden');
    assert(!document.querySelector('.story-result-effects .status-needs, .story-result-effects [role="meter"]'), 'Story omits the framed status panel');
    assert(document.querySelector('.story-result-start .story-result-imprint'), 'result has its own timeline point');
    assert.equal(document.querySelector('.story-result-start time').textContent, '10:20 · D1');
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
      assert.equal(energy().style.getPropertyValue('--result-indicator-delay'), '250ms', 'even one group has a reading pause after the image/narrative');
      assert.equal(document.querySelector('.story-result-effects .result-indicators').style.getPropertyValue('--result-indicator-duration'), '260ms');
      for (let n = 0; n < 80; n++) { clock += 32; frame(clock); }
      assert.equal(energy().querySelector('strong').textContent, delta, 'replay retains the actual delta');
    }
    assert.equal(JSON.stringify(episode), saved, 'presentation never mutates archived facts');
    cleanup();
  }
  console.log('PASS: Story matches classic visible icon deltas/costs/consequences, hides passive drain, adds an unframed result point, settles old records and replays icon groups without archive mutation.');
  console.log('PASS: shared Status bars and compact result deltas, actual capped values, gain/loss animation, hidden passive drain, retained expenses/consequences, reduced motion and cleanup.');
  console.log('PASS: compact discoveries preserve hours, services, map status, costs and Mood gain without duplicate details, names, bars or arrival imagery; other full answers, saved answers and no-new-information still work.');
} finally { cleanup(); dom.window.close(); }
