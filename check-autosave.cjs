const assert = require('node:assert/strict');
require('./tests/helpers/build.cjs').buildSync({ entryPoints: ['src/autosave.ts'], bundle: true, platform: 'node', format: 'cjs', outfile: 'autosave-app.cjs' });
const { createAutosave } = require('./autosave-app.cjs');
let now = 0, writes = [], errors = false, results = [], encoded = [];
const data = new Map();
const storage = {
  getItem: key => data.get(key) ?? null,
  setItem(key, value) { if (errors) throw new Error('Quota'); data.set(key, value); writes.push(key); },
  removeItem(key) { data.delete(key); writes.push(key); },
};
const saver = createAutosave(storage, { now: () => now, onResult: success => results.push(success), encode: (key, value) => { encoded.push(key); return value === null ? null : JSON.stringify(value); } });
const history = [{ title: 'An action' }];
saver.stage({ game: { minute: 0 }, inventory: { cleanliness: 80 }, history }, true);
writes = []; encoded = [];
for (let minute = 1; minute <= 20; minute++) {
  now += 1000;
  saver.stage({ game: { minute }, inventory: { cleanliness: 80 - minute / 100 }, history });
  saver.checkpoint();
}
assert.equal(writes.length, 8, 'two frequently changed keys write four batches in twenty ticks, not forty writes');
assert(!encoded.includes('history'), 'unchanged journal is never serialized again');
assert.equal(JSON.parse(data.get('game')).minute, 20);
saver.stage({ game: { minute: 21 }, inventory: { cleanliness: 79 }, history });
assert.equal(JSON.parse(data.get('game')).minute, 20, 'ordinary updates stay pending');
saver.flush(); assert.equal(JSON.parse(data.get('game')).minute, 21, 'lifecycle flush writes latest values');
now += 1000;
saver.stage({ game: { minute: 22, money: 7 }, inventory: { cleanliness: 79, water: 1 }, history }, true);
assert.equal(JSON.parse(data.get('game')).money, 7, 'actions are immediate');
const before = writes.length;
saver.stage({ game: { minute: 22, money: 7 }, inventory: { cleanliness: 79, water: 1 }, history }, true);
assert.equal(writes.length, before, 'identical serialized data does not rewrite storage');
errors = true;
saver.stage({ game: { minute: 23 }, trip: { remaining: 12 } }, true);
assert.equal(results.at(-1), false);
errors = false; now += 5000; saver.checkpoint();
assert.equal(JSON.parse(data.get('game')).minute, 23); assert.equal(JSON.parse(data.get('trip')).remaining, 12);
assert.equal(results.at(-1), true, 'failed writes remain pending and retry');
saver.stage({ game: { minute: 99 } });
saver.clear(); data.clear(); now += 5000; saver.checkpoint();
assert.equal(data.size, 0, 'reset cancels old pending data');
saver.stage({ game: { minute: 0 }, trip: null }, true);
assert.equal(JSON.parse(data.get('game')).minute, 0); assert(!data.has('trip'));
console.log('PASS: 40 frequent writes reduced to 8, unchanged data skips encoding, immediate/lifecycle flush, error retry and reset cancellation.');
