const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { build } = require('esbuild');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[name] = dom.window[name];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
global.__uiRenders = {};
window.scrollTo = () => {};
let now = 1800000000000, nextId = 1;
Date.now = () => now;
const timers = new Map();
window.setInterval = (fn) => { const id = nextId++; timers.set(id, fn); return id; };
window.clearInterval = id => timers.delete(id);
const React = require('react');
const { render, screen, fireEvent, act, cleanup, configure } = require('@testing-library/react');
configure({ getElementError: message => new Error(message) });
const counts = () => ({ ...global.__uiRenders });
const clearCounts = () => { global.__uiRenders = {}; };
const count = name => global.__uiRenders[name] ?? 0;
function setup(App, screenName, state = {}, extras = {}) {
  cleanup(); localStorage.clear();
  localStorage.setItem('street-life-save-v3', JSON.stringify({ day: 1, minutes: 500, money: 100, hunger: 72, thirst: 66, energy: 68, health: 82, hygiene: 55, mood: 58, intoxication: 0, locationId: 'station', ...state }));
  localStorage.setItem('street-life-screen', screenName);
  localStorage.setItem('street-life-effects-v1', '[]');
  localStorage.setItem('street-life-discovered-v1', '["street","station","shop"]');
  for (const [key, value] of Object.entries(extras)) localStorage.setItem(key, JSON.stringify(value));
  render(React.createElement(App)); clearCounts();
}
function advance(ticks) {
  for (let i = 0; i < ticks; i++) { now += 1000; act(() => { for (const fn of [...timers.values()]) fn(); }); }
}
async function loadApp(disableMemo) {
  const result = await build({
    entryPoints: ['src/App.tsx'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react', 'react-dom', 'react/jsx-runtime'],
    plugins: [{ name: 'count-render-invocations', setup(builder) {
      builder.onLoad({ filter: /(?:JournalSections|LifeSituation|CityMap|ItemArt)\.tsx$/ }, async ({ path }) => {
        let source = fs.readFileSync(path, 'utf8').replace(/memo\(function (JournalGoals|JournalTimeline|LifeSituation|DistrictScene|ItemArt)\(([\s\S]*?)\) \{/g,
          (match, name) => `${match} globalThis.__uiRenders['${name}'] = (globalThis.__uiRenders['${name}'] ?? 0) + 1;`);
        if (disableMemo) source = source.replace(/memo\(function /g, '((component) => component)(function ');
        return { contents: source, loader: 'tsx' };
      });
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports.default;
}
function measure(App) {
  const output = {};
  setup(App, 'journal'); advance(10);
  assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).minutes, 510);
  output.journal = counts();
  setup(App, 'map'); advance(10); output.map = counts();
  setup(App, 'status'); advance(10); output.status = counts();
  setup(App, 'inventory', {}, { 'street-life-inventory-v1': { water: 2, food: 2 } }); advance(10); output.inventory = counts();
  return output;
}
(async () => {
  const Baseline = await loadApp(true), App = await loadApp(false);
  const before = measure(Baseline), after = measure(App);
  for (const [section, name] of [['journal', 'JournalGoals'], ['journal', 'JournalTimeline'], ['map', 'DistrictScene'], ['status', 'LifeSituation'], ['inventory', 'ItemArt']]) {
    assert(before[section][name] > 0, `${name}: baseline must render during ticks`);
    assert.equal(after[section][name] ?? 0, 0, `${name}: unchanged data must skip rendering`);
  }
  // Relevant changes must still render: opening hours, selected map pin, completed goal, journal day.
  setup(App, 'map', { minutes: 1319 }); advance(1);
  assert.equal(count('DistrictScene'), 1);
  assert(screen.getByRole('button', { name: /Cheap Shop Closed/ }));
  clearCounts(); fireEvent.click(screen.getByRole('button', { name: /Cheap Shop Closed/ }));
  assert.equal(count('DistrictScene'), 1);
  assert.equal(document.querySelector('.district-card h3').textContent, 'Cheap Shop');
  setup(App, 'journal', { day: 2, minutes: 719 }); advance(1);
  assert(count('JournalGoals') > 0);
  assert(document.querySelector('.completed-goals .goal strong').textContent.includes('morning'));
  setup(App, 'journal', { day: 2 }, { 'street-life-journal-history-v1': [
    { day: 1, minute: 500, title: 'First day', text: 'First thought', reflection: true }, { day: 2, minute: 480, title: 'Second day', text: 'Second thought', reflection: true },
  ] });
  fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  assert.equal(count('JournalTimeline'), 1); assert(screen.getByText('First thought')); assert(!screen.queryByText('Second thought'));
  cleanup(); dom.window.close();
  console.log(JSON.stringify({ tenGameTicks: { withoutMemo: before, withMemo: after } }));
  console.log('PASS: static blocks skip tick renders; clock, map closing/selection, goal completion and journal day changes remain live.');
})().catch(error => { console.error(error); cleanup(); dom.window.close(); process.exitCode = 1; });
