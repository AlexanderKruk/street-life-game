// Refresh the ten-build compatibility window from actual historical Apps.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const revisions = execFileSync('git', ['log', '--format=%H %s'], { cwd: root, encoding: 'utf8' })
  .split('\n').filter(line => /\(v\d+\)$/.test(line)).slice(0, 10)
  .map(line => ({ commit: line.split(' ')[0], build: Number(line.match(/\(v(\d+)\)$/)[1]) })).reverse();
assert.equal(revisions.length, 10);
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/street-life-game/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.setInterval = () => 1; window.clearInterval = () => {};
Date.now = () => 1800000000000; Math.random = () => .99;
const React = require('react');
const { render, cleanup } = require('@testing-library/react');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'recent-save-capture-'));
const fixtures = [];
try {
  for (const [index, revision] of revisions.entries()) {
    cleanup(); localStorage.clear();
    const directory = path.join(temp, String(revision.build)); fs.mkdirSync(directory);
    const archive = execFileSync('git', ['archive', revision.commit, 'src'], { cwd: root });
    execFileSync('tar', ['-xf', '-', '-C', directory], { input: archive });
    const bundle = path.join(root, `capture-v${revision.build}-app.cjs`);
    esbuild.buildSync({ entryPoints: [path.join(directory, 'src/App.tsx')], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: bundle, external: ['react', 'react-dom', 'react/jsx-runtime'] });
    const game = { day: index + 3, minutes: 800 + index, money: index === 0 ? 0 : 12.5 + index, hunger: 42, thirst: 53, energy: 61, health: 82, hygiene: 55, mood: 47, intoxication: 0, locationId: 'station' };
    const seed = {
      'street-life-save-v3': JSON.stringify(game),
      'street-life-inventory-v1': JSON.stringify({ water: 9, food: 0, jacket: 42, phoneBattery: 37, documents: false, clothingCleanliness: 85 }),
      'street-life-discovered-v1': JSON.stringify(['street', 'station', 'shop', 'daycenter']),
      'street-life-discovery-version': '2',
      'street-life-screen': ['location', 'inventory', 'map', 'status', 'journal'][index % 5],
      'street-life-mobile-auto-renew': 'false',
      'street-life-mobile-service-until': '999999',
      'street-life-mobile-renewed-day': String(game.day),
      'street-life-journal-history-v1': JSON.stringify([{ day: 2, minute: 700, title: 'A moment of rest', actionTitle: 'Rest', text: 'I feel a little steadier.', reflection: true }]),
    };
    for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
    render(React.createElement(require(bundle).default));
    cleanup(); // Flush the historical build's actual autosave.
    const entries = Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]));
    assert.equal(JSON.parse(entries['street-life-save-v3']).day, game.day);
    fixtures.push({ ...revision, entries });
    fs.unlinkSync(bundle);
  }
  fs.mkdirSync(path.join(root, 'test-fixtures'), { recursive: true });
  fs.writeFileSync(path.join(root, 'test-fixtures/recent-saves.json'), JSON.stringify(fixtures, null, 2) + '\n');
  console.log(`Captured actual localStorage from v${revisions[0].build}–v${revisions.at(-1).build}.`);
} finally {
  cleanup(); dom.window.close(); fs.rmSync(temp, { recursive: true, force: true });
}
