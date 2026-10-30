const assert = require('node:assert/strict');

module.exports = function checkInventoryStory({ appendInventoryStory: append, emptyStory, loadStory }) {
  const at = { day: 2, minute: 54, locationId: 'street', locationName: 'Улица' };
  const end = { ...at, minute: 55 };
  const result = { title: 'Использовать предмет', text: 'Ты съедаешь бутерброд.', costs: [], changes: [{ id: 'hunger', label: 'Сытость', value: '+28', amount: 28, kind: 'positive' }] };
  const pairs = [['use:water', 'water'], ['use:food', 'food'], ['use:bread', 'bread'], ['use:cannedFood', 'cannedFood'], ['use:readyMeal', 'readyMeal'], ['use:wipes', 'wipes'], ['use-medicine', 'medicines'], ['smoke', 'cigarettes']];
  for (const [id, item] of pairs) {
    const before = { [item]: 2 }, after = { [item]: 1 }, store = emptyStory();
    const saved = JSON.stringify({ store, before, after, result });
    const identity = { id, title: 'Use' };
    const next = append(store, identity, result, before, after, at, end);
    assert.equal(JSON.stringify({ store, before, after, result }), saved, `${id} never changes game facts or reruns the command`);
    assert.equal(next.episodes.length, 1); assert.equal(next.nextId, 2);
    const entry = next.episodes[0];
    assert.equal(entry.source, 'inventory'); assert.equal(entry.sourceId, id);
    assert.equal(entry.status, 'awaiting-ack'); assert.equal(entry.result, result);
    assert.equal(entry.scenes[0].text, '', 'the result is the only narrative block');
    assert.deepEqual(entry.scenes[0].at, at); assert.deepEqual(entry.endedAt, end);
    assert.deepEqual(entry.resultIdentity, { actionId: id });
    assert.deepEqual(loadStory(JSON.parse(JSON.stringify(next))), next, 'reload retains the pending result without invoking consumption');
    assert.equal(append(store, identity, result, before, before, at, end), store, 'an unused dose or refused wipe is not recorded as consumed');
    assert.equal(append(store, identity, result, after, before, at, end), store, 'gaining stock is not consumption');
    const again = append(next, identity, result, after, { [item]: 0 }, end, end);
    assert.deepEqual(again.episodes.map(entry => entry.id), [1, 2], 'successive uses of the same item remain separate');
    assert.equal(again.episodes[0], entry, 'later uses preserve the old snapshot');
  }
  for (const id of ['buy:water', 'store-food', 'collect-food', 'event:food', 'location:shower', 'use:unknown']) {
    const store = emptyStory();
    assert.equal(append(store, { id, title: 'Unrelated' }, result, { water: 2, food: 2 }, { water: 1, food: 1 }, at, end), store);
  }
  const purchases = [['water', 3, 'Bought water.'], ['food', 1, 'Bought a sandwich.'], ['bread', 1, 'Bought a bread roll.'],
    ['cannedFood', 1, 'Bought canned food.'], ['readyMeal', 1, 'Bought a ready meal.'], ['wipes', 5, 'Bought wet wipes.'],
    ['showerGel', 20, 'Bought shower gel.'], ['cigarettes', 5, 'Bought cigarettes.'], ['medicines', 1, 'Bought medicine.']];
  for (const [item, quantity, text] of purchases) {
    const store = emptyStory(), before = { [item]: 2 }, after = { [item]: 2 + quantity };
    const purchase = { ...result, costs: [{ id: 'money', label: 'Money', value: '−3 zł', amount: -3, kind: 'negative' }],
      changes: [{ id: item, label: item, value: `+${quantity}`, amount: quantity, kind: 'positive' }] };
    const identity = { id: `buy:${item}`, title: `Buy ${item}` };
    const original = JSON.stringify({ store, before, after, purchase });
    const next = append(store, identity, purchase, before, after, at, end);
    assert.equal(JSON.stringify({ store, before, after, purchase }), original, 'recording a purchase cannot change stock or charge again');
    assert.equal(next.episodes[0].result.text, text);
    assert.deepEqual(next.episodes[0].result.costs, purchase.costs); assert.deepEqual(next.episodes[0].result.changes, purchase.changes);
    assert.deepEqual(loadStory(JSON.parse(JSON.stringify(next))), next, 'a pending purchase restores without rebuying');
    assert.equal(append(store, identity, purchase, before, before, at, end), store, 'money/capacity refusals never claim a successful purchase');
    const repeated = append(next, identity, purchase, after, { [item]: 2 + quantity * 2 }, end, end);
    assert.deepEqual(repeated.episodes.map(entry => entry.id), [1, 2]);
    assert.equal(repeated.episodes[0], next.episodes[0]);
  }
  for (const text of ['You drink some water.', 'Ты пьёшь воду.', 'Pijesz wodę.']) {
    const copy = { ...result, text };
    const next = append(emptyStory(), { id: 'use:water', title: text }, copy, { water: 1 }, { water: 0 }, at, end);
    assert.equal(loadStory(JSON.parse(JSON.stringify(next))).episodes[0].result.text, text, 'saved language is never rewritten');
  }
  const unsafe = { ...result, text: 'You vomit.', illustration: '/street-life-game/assets/event-food-vomiting.webp', changes: [{ id: 'health', label: 'Health', value: '−5', amount: -5, kind: 'negative' }] };
  const sick = append(emptyStory(), { id: 'use:food', title: 'Eat' }, unsafe, { food: 1 }, { food: 0 }, at, end);
  assert.deepEqual(loadStory(sick).episodes[0].result, unsafe, 'actual unsafe-food consequences and artwork survive');
  let bounded = emptyStory();
  for (let i = 0; i < 501; i++) bounded = append(bounded, { id: 'use:water', title: 'Drink' }, result, { water: 1 }, { water: 0 }, at, end);
  assert.equal(bounded.episodes.length, 500); assert.equal(bounded.episodes[0].id, 2); assert.equal(bounded.nextId, 502);
};
