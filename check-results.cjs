const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { buildSync } = require('esbuild');
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
const { default: ResultCard, isMajorChange } = bundled('src/ResultCard.tsx');
const { summarizeResult } = bundled('src/results.ts');
const { questionPresentation } = bundled('src/resultPresentation.ts');
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
  for (const label of ['Food', 'Water', 'Energy', 'Health', 'Hygiene', 'Mood', 'Battery', 'Phone condition', 'Clothing cleanliness', 'Clothing condition']) {
    assert(!isMajorChange({ label, value: '−4.9', kind: 'negative' }));
    assert(isMajorChange({ label, value: '−5', kind: 'negative' }));
    assert(isMajorChange({ label, value: '+0.1', kind: 'positive' }));
  }
  assert(isMajorChange({ label: 'Money', value: '−0.2 zł', kind: 'negative' }));
  for (const [key,label] of [['water','Water portions'],['food','Food portions'],['bread','Bread rolls'],['cannedFood','Canned food'],['wipes','Wet wipes'],['showerGel','3-in-1 gel uses'],['cigarettes','Cigarettes'],['medicines','Medicine']]) {
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
  assert.deepEqual([...document.querySelectorAll('[data-stat]')].map(node => node.dataset.stat), ['Energy', 'Hygiene', 'Mood', 'Health']);
  assert.equal(row('Energy').querySelector('.bar i').style.width, '34%');
  assert.equal(row('Energy').querySelector('.result-stat-delta').textContent, '+13');
  assert(!row('Health').querySelector('.result-stat-delta'), 'losses do not have a separate minus label');
  assert.equal(row('Health').querySelector('.bar-loss-trail').style.left, '84%');
  assert.equal(row('Health').querySelector('.bar-loss-trail').style.width, '6%');
  assert(row('Hygiene').querySelector('.bar-blocked'));
  assert.equal(row('Hygiene').querySelector('.bar-cap-marker').style.left, '80%');
  assert(!row('Hygiene').textContent.includes('Max'));
  assert(screen.getByRole('dialog').textContent.includes('Medicine'));
  assert(screen.getByRole('dialog').textContent.includes('Cold'));
  assert(screen.getByRole('dialog').textContent.includes('−4.4 zł'));
  fireEvent.click(screen.getByText('Full answer & details'));
  for (const hidden of ['−0.2', '−0.1', '−3%', 'Food', 'Battery']) assert(!screen.getByRole('dialog').textContent.includes(hidden));
  frame(0); frame(600);
  const midpoint = parseFloat(row('Energy').querySelector('.bar i').style.width);
  assert(midpoint > 34 && midpoint < 47);
  frame(1200);
  assert.equal(row('Energy').querySelector('.bar i').style.width, '47%');
  assert.equal(row('Energy').querySelector('.status-stat-value > span').textContent, '47%');
  assert(row('Energy').querySelector('.bar i.warning'));
  assert(row('Hygiene').querySelector('.bar i.good'));
  frame(1900);
  assert.equal(row('Health').querySelector('.bar i').style.width, '84%');
  assert.equal(row('Health').querySelector('.status-stat-value > span').textContent, '84%');
  assert(row('Health').querySelector('.bar-loss-trail'), 'loss trace remains after the animation');
  assert.equal(frames.size, 0);
  fireEvent.click(screen.getByRole('button', { name: 'Got it' })); assert.equal(closed, 1);
  cleanup();
  reduced = true;
  render(React.createElement(ResultCard, { result, onClose: () => {} }));
  assert.equal(row('Energy').querySelector('.bar i').style.width, '47%'); assert.equal(frames.size, 0);
  assert.equal(row('Health').querySelector('.status-stat-value > span').textContent, '84%');
  assert(row('Health').querySelector('.bar-loss-trail'), 'reduced motion retains the static loss trace');
  cleanup(); reduced = false;
  const batteryLoss = summarizeResult(before, { ...before, inventory: { ...before.inventory, phoneBattery: 37 } });
  render(React.createElement(ResultCard, { result: { title: 'Phone use', text: 'Phone use.', ...batteryLoss }, onClose: () => {} }));
  assert(!row('Battery').querySelector('.result-stat-delta'));
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
  const searchAfter = { ...before, game: { ...before.game, minutes: 619, mood: 63.2 } };
  const searchSummary = summarizeResult(before, searchAfter);
  for (const [id, name] of [['support', 'Help Center'], ['daycenter', 'Day Center'], ['free-clinic', 'Free Clinic']]) {
    const presentation = questionPresentation('morning', [id]);
    assert(!presentation.illustration, 'search does not show an arrival image');
    render(React.createElement(ResultCard, { result: { title: 'Search', text: 'Full search answer.', presentation, ...searchSummary }, onClose: () => {} }));
    const dialog = screen.getByRole('dialog', { name });
    assert.equal(dialog.querySelectorAll('h2').length, 1);
    assert(!dialog.querySelector('.result-place'), 'location is not repeated');
    assert(!row('Mood'), 'search gain uses compact text instead of a stat bar');
    assert(!dialog.querySelector('.result-card-label'));
    assert(dialog.querySelector('.compact-info-heading svg'), 'title has an information icon');
    assert(dialog.querySelector('.compact-info-hours').textContent);
    assert.equal(dialog.querySelector('.compact-info-saved').textContent, 'Added to map');
    const line = dialog.querySelector('.compact-info-summary').textContent;
    assert(line.includes('19 min') && line.includes('Mood +3'));
    assert(!dialog.querySelector('details'), 'compact discoveries do not repeat the same information in a disclosure');
    cleanup();
  }
  render(React.createElement(ResultCard, { result: { title: 'Saved', text: 'Saved answer.', presentation: questionPresentation('morning', ['support'], true), costs: [], changes: [] }, onClose: () => {} }));
  assert.equal(document.querySelector('.compact-info-saved').textContent, 'Saved on map');
  assert(!document.querySelector('.compact-info-summary'), 'no costs or gains are invented for a saved answer');cleanup();
  render(React.createElement(ResultCard, { result: { title: 'Nothing new', text: 'No new places.', presentation: questionPresentation('morning', []), costs: [], changes: [] }, onClose: () => {} }));
  assert(screen.getByRole('dialog', { name: 'No new information' }));
  assert(!document.querySelector('.compact-info-saved'));cleanup();
  console.log('PASS: shared Status result bars, actual capped values, gain/loss animation, hidden passive drain, retained expenses/consequences, reduced motion and cleanup.');
  console.log('PASS: compact discoveries preserve hours, services, map status, costs and Mood gain without duplicate details, names, bars or arrival imagery; other full answers, saved answers and no-new-information still work.');
} finally { cleanup(); dom.window.close(); }
