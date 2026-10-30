const assert = require('node:assert/strict');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
  const code = buildSync({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false, define: { 'import.meta.env': '{}' } }).outputFiles[0].text;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}
const { resolveInventoryCommand: resolve, inventoryCommandResult } = bundled('src/inventoryCommands.ts');
const { INITIAL_INVENTORY, INITIAL_STORAGE, SHOP_ITEMS } = bundled('src/inventory.ts');
const { createInitialState } = bundled('src/game.ts');
const { foodPortions } = bundled('src/foodInventory.ts');
const base = { game: { ...createInitialState(), day: 2, minutes: 600, money: 100 }, inventory: { ...INITIAL_INVENTORY, water: 0, food: 0, medicines: 0 }, storage: INITIAL_STORAGE, effects: [], locationId: 'shop', open: true, insideNightShelter: false };
const context = (patch = {}) => ({ ...base, ...patch, inventory: { ...base.inventory, ...patch.inventory }, storage: { ...base.storage, ...patch.storage }, game: { ...base.game, ...patch.game } });
function freeze(value) { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }
function run(state, command, random = () => { throw Error('Unexpected random draw'); }) {
  const saved = JSON.stringify(state);
  const changes = resolve(freeze(state), command, random);
  // React may replay update functions. They must not mutate a snapshot, reroll
  // food, spend costs themselves or produce a different answer on replay.
  const next = { ...state };
  for (const key of ['inventory', 'storage', 'effects', 'game']) if (changes[key]) {
    next[key] = changes[key](state[key]);
    assert.deepEqual(changes[key](state[key]), next[key], `replayable ${key} update`);
  }
  assert.equal(JSON.stringify(state), saved, 'resolver and updates leave inputs untouched');
  return { changes, next };
}
function noChange(state, command, expectedMessage) {
  const { changes, next } = run(state, command);
  assert.deepEqual(next, state);
  assert.equal(changes.action, undefined, 'rejection has no time or money cost');
  assert.equal(changes.message, expectedMessage);
}

for (const item of SHOP_ITEMS) {
  const command = { type: 'buy', item };
  const { changes, next } = run(context(), command);
  assert.equal(next.inventory[item.id], item.quantity);
  assert.deepEqual(changes.action, { minutes: 3, money: -item.price });
  assert.equal(inventoryCommandResult(command).title, `Buy ${item.name}`);
  noChange(context({ game: { money: item.price - .01 } }), command, `You need ${item.price.toFixed(2)} zł for that.`);
  noChange(context({ inventory: { medicines: 32 } }), command, 'Backpack full. Use or remove something first.');
  noChange(context({ open: false }), command);
  noChange(context({ locationId: 'street' }), command);
}
// Fill an existing stack in the last slot, but never overflow into a ninth.
const water = SHOP_ITEMS.find(item => item.id === 'water');
assert.equal(run(context({ inventory: { medicines: 28, water: 1 } }), { type: 'buy', item: water }).next.inventory.water, 4);
noChange(context({ inventory: { medicines: 28, water: 2 } }), { type: 'buy', item: water }, 'Backpack full. Use or remove something first.');
const oldFood = run(context({ inventory: { food: 2, foodPortions: [0, 45] } }), { type: 'buy', item: SHOP_ITEMS.find(item => item.id === 'food') });
assert.deepEqual(foodPortions(oldFood.next.inventory, 'food'), [0, 45, 100]);

let draws = 0;
const sick = run(context({ inventory: { food: 5, foodPortions: [100, 100, 100, 100, 0] } }), { type: 'use', item: 'food', slotIndex: 1, condition: 'spoiled' }, () => { draws++; return .99; });
assert.equal(draws, 2, 'one food outcome and one severity draw, outside update replay');
assert.equal(sick.changes.action.hunger, -10);
assert.equal(sick.changes.action.energy, -10);
assert.equal(sick.changes.info.title, 'You vomited');
assert.deepEqual(foodPortions(sick.next.inventory, 'food'), [100, 100, 100, 100]);
noChange(context({ inventory: { food: 1, foodPortions: [100] } }), { type: 'use', item: 'food', condition: 'spoiled' });
noChange(context({ inventory: { wipes: 1 }, game: { hygiene: 60 } }), { type: 'use', item: 'wipes' }, 'Wet wipes cannot improve Hygiene above 60. Find a shower.');
const wiped = run(context({ inventory: { wipes: 1 }, game: { hygiene: 59 } }), { type: 'use', item: 'wipes' });
assert.equal(wiped.next.game.hygiene, 60); assert.equal(wiped.next.inventory.wipes, 0);

const now = (base.game.day - 1) * 1440 + base.game.minutes;
const cold = { id: 'cold', expiresAt: now + 90 };
const treated = run(context({ inventory: { medicines: 2 }, effects: [cold] }), { type: 'medicine' });
assert.equal(treated.next.inventory.medicines, 1);
assert.equal(treated.next.effects[0].expiresAt, now + 30);
assert.equal(treated.changes.info.title, 'Recovery accelerated');
for (const effects of [[], [{ id: 'cold', expiresAt: now }], treated.next.effects]) {
  const { next, changes } = run(context({ inventory: { medicines: 2 }, effects }), { type: 'medicine' });
  assert.equal(next.inventory.medicines, 2); assert.deepEqual(next.effects, effects);
  assert.equal(changes.info.title, effects[0]?.treated ? 'One dose is enough' : 'No cold');
}

for (const locationId of ['shelter', 'residential-shelter']) {
  const shelter = context({ locationId, insideNightShelter: true, inventory: { medicines: 5, cigarettes: 21 } });
  for (const [item, amount] of [['medicines', 4], ['cigarettes', 20], ['documents', true]]) {
    const { next } = run(shelter, { type: 'store', item });
    assert.equal(next.storage[item], amount);
    const collected = run({ ...next, inventory: { ...next.inventory, [item]: item === 'documents' ? false : 0 } }, { type: 'take', item }).next;
    assert.equal(collected.inventory[item], amount);
    assert.equal(collected.storage[item], item === 'documents' ? false : 0);
  }
  noChange({ ...shelter, open: false }, { type: 'store', item: 'medicines' });
  noChange({ ...shelter, storage: { ...shelter.storage, medicines: locationId === 'shelter' ? 24 : 64 } }, { type: 'store', item: 'medicines' }, 'Storage is full.');
  noChange(context({ locationId, insideNightShelter: true, inventory: { medicines: 32 }, storage: { cigarettes: 1 } }), { type: 'take', item: 'cigarettes' }, 'Backpack full.');
}
noChange(context({ locationId: 'shelter', inventory: { medicines: 1 } }), { type: 'store', item: 'medicines' });
noChange(context({ locationId: 'street', inventory: { medicines: 1 } }), { type: 'store', item: 'medicines' });
const shelf = context({ locationId: 'residential-shelter', inventory: { food: 5, foodPortions: [0, 25, 60, 80, 100] }, storage: { food: 1, foodPortions: [40] } });
const stored = run(shelf, { type: 'store-food' }).next;
assert.deepEqual(foodPortions(stored.storage, 'food'), [40, 0, 25, 60]);
assert.deepEqual(foodPortions(stored.inventory, 'food'), [80, 100]);
const collected = run(stored, { type: 'take-food' }).next;
assert.deepEqual(foodPortions(collected.inventory, 'food'), [80, 100, 40, 0, 25, 60]);
assert.equal(collected.storage.food, 0);
noChange({ ...shelf, locationId: 'shelter' }, { type: 'store-food' });
noChange(context({ locationId: 'residential-shelter', inventory: { medicines: 32 }, storage: { food: 1 } }), { type: 'take-food' }, 'Backpack full.');
// The shelf accepts the backpack's Food category, not the other food types.
const otherFood = context({ locationId: 'residential-shelter', inventory: { food: 0, bread: 1, cannedFood: 1, readyMeal: 1 } });
noChange(otherFood, { type: 'store-food' });
const mixedFood = context({ locationId: 'residential-shelter', inventory: { food: 1, bread: 1, cannedFood: 1, readyMeal: 1 } });
const storedMixed = run(mixedFood, { type: 'store-food' }).next;
assert.equal(storedMixed.storage.food, 1);
for (const id of ['bread', 'cannedFood', 'readyMeal']) assert.equal(storedMixed.inventory[id], 1);

const bottles = run(context({ inventory: { bottles: 3 } }), { type: 'return-bottles' });
assert.deepEqual(bottles.changes.action, { minutes: 5, money: 1.5 });
assert.equal(bottles.next.inventory.bottles, 0);
noChange(bottles.next, { type: 'return-bottles' });
noChange(context({ open: false, inventory: { bottles: 3 } }), { type: 'return-bottles' });
const discard = { type: 'discard', id: 'food', quantity: 4, slotIndex: 0, spoiledOnly: true };
assert.equal(inventoryCommandResult(discard), null, 'discard confirmation has no second result');
assert.deepEqual(foodPortions(run(shelf, discard).next.inventory, 'food'), [25, 60, 80, 100]);
assert.deepEqual(foodPortions(run(shelf, { ...discard, spoiledOnly: false }).next.inventory, 'food'), [100]);
require('./tests/helpers/inventory-story.cjs')({ ...bundled('src/inventoryStory.ts'), ...bundled('src/story.ts') });
console.log('PASS: inventory command boundaries, capacity, costs, storage conservation, immutable/replayable updates, one-time unsafe-food resolution and consumption Story persistence.');
