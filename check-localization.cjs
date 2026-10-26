const assert = require('node:assert/strict');
const ts = require('typescript');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
  const code = buildSync({ entryPoints: [path], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'react-dom', 'react/jsx-runtime'] }).outputFiles[0].text;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}
const { en, t, validateCatalog, createTranslator } = bundled('src/i18n/index.ts');
assert.deepEqual(validateCatalog(en, en), []);
assert.equal(t('discard.title', { name: 'Bread', quantity: 4 }), 'Discard Bread ×4?');
assert.equal(t('result.containers', { count: 1 }), '+1 container');
assert.equal(t('result.containers', { count: 2 }), '+2 containers');
assert.equal(t('result.containers', { count: 0 }), '+0 containers');
const plural = createTranslator('pl', { items: { plural: 'count', one: 'one:{count}', few: 'few:{count}', many: 'many:{count}', other: 'other:{count}' } });
for (const [count, category] of [[1, 'one'], [2, 'few'], [5, 'many'], [22, 'few'], [1.5, 'other']]) assert.equal(plural('items', { count }), `${category}:${count}`);
assert.throws(() => t('discard.title', { name: 'Bread' }), /Missing parameter/);
assert.throws(() => t('result.containers', { count: '2' }), /Invalid plural count/);
assert.throws(() => t('unknown.key'), /Unknown message/);
assert(validateCatalog(en, { ...en, 'discard.title': '{wrong}' }).some(error => error.includes('inconsistent parameters')));
assert(validateCatalog(en, { ...en, 'nav.map': '{bad-name}' }).some(error => error.includes('malformed placeholder')));
const missing = { ...en }; delete missing['nav.map'];
assert(validateCatalog(en, missing).some(error => error.includes('missing message')));
assert(validateCatalog(en, { ...en, 'result.containers': { plural: 'count', one: '{wrong}', other: '{count}' } }).some(error => error.includes('inconsistent parameters')));
const { formatActivityElapsed, formatResultDuration, formatMoney } = bundled('src/i18n/formatters.ts');
for (const [elapsed, expected] of [[0, '01m'], [1, '01m'], [59, '59m'], [60, '1h 00m'], [75, '1h 15m']]) assert.equal(formatActivityElapsed(elapsed), expected);
assert.equal(formatResultDuration(60), '1 h'); assert.equal(formatResultDuration(75), '1 h 15 min');
assert.equal(formatMoney(4.4, true), '4.40 zł'); assert.equal(formatMoney(4.4), '4.4 zł');

// The test-only program also verifies rejected keys/parameters. This file is
// outside src, so intentional failures cannot run or ship in the application.
const parsed = ts.parseJsonConfigFileContent(JSON.parse(require('node:fs').readFileSync('tsconfig.json', 'utf8')), ts.sys, process.cwd());
const program = ts.createProgram(['tests/i18n-types.ts'], parsed.options);
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: p => p, getCurrentDirectory: ts.sys.getCurrentDirectory, getNewLine: () => '\n' }));

const { resultActionAllowed } = bundled('src/resultActions.ts');
const unblocked = { sleepChoice: false, shelterQueue: false, shelterDeparture: false, shelterCheckoutDue: false, activeEvent: false, diceCheck: false, shelterInterview: false };
for (const [flag, allowed] of [['sleepChoice', 'sleep-start'], ['shelterQueue', 'shelter-registration'], ['shelterDeparture', 'shelter-checkout']]) {
  assert(resultActionAllowed(allowed, { ...unblocked, [flag]: true }));
  assert(!resultActionAllowed('buy:water', { ...unblocked, [flag]: true }));
}
assert(resultActionAllowed('search-interrupted', { ...unblocked, shelterCheckoutDue: true }));
assert(resultActionAllowed('sleep-complete', { ...unblocked, shelterCheckoutDue: true }));
assert(!resultActionAllowed('buy:water', { ...unblocked, shelterCheckoutDue: true }));
assert(resultActionAllowed('event:night-patrol', { ...unblocked, shelterCheckoutDue: true, activeEvent: true }));
const { loadJournalEntries } = bundled('src/journal.ts');
const entry = { day: 2, minute: 700, actionId: 'music-walk', actionTitle: '⟦New arbitrary wording⟧', title: 'Saved heading', text: '', reflection: true };
assert.deepEqual(loadJournalEntries([entry]), [entry], 'saved empty reflections and explicit identity survive loading');
const legacy = { ...entry, actionTitle: 'Walk with music' }; delete legacy.actionId;
assert.equal(loadJournalEntries([legacy])[0].actionId, 'music-walk', 'old once-per-run identity is mapped without rewriting saved copy');
const { loadGameSession, loadLeftHome } = bundled('src/loadGameSession.ts');
const seed = {
  'street-life-save-v3': JSON.stringify({ day: 1, minutes: 1320, money: 30, hunger: 70, thirst: 70, energy: 70, health: 90, hygiene: 80, mood: 50, intoxication: 0, locationId: 'street' }),
  'street-life-choice-seed-v1': '1',
  'street-life-journal-history-v1': JSON.stringify([entry]),
};
const reader = { getItem: key => seed[key] ?? null };
assert(loadGameSession(reader).musicWalkUsed, 'translated actionTitle cannot re-enable the once-per-run music reward');
seed['street-life-journal-history-v1'] = JSON.stringify([{ ...entry, actionId: 'arrival' }]);
assert(loadLeftHome(reader), 'translated arrival title still prevents opening-neighbourhood encounters');

// Restored authored-event History uses domain facts, independently of copy.
const { STREET_EVENTS, resolveEventOutcome } = bundled('src/events.ts');
const { eventHistoryReflection } = bundled('src/eventHistory.ts');
const { eventHistoryDefinitions } = bundled('src/eventHistoryDefinitions.ts');
const { journalReflection: oldReflection } = bundled('src/journal.ts');
const ids = new Set();
for (const event of STREET_EVENTS) for (const choice of event.choices) {
  assert(choice.id, 'authored choices have stable IDs');
  const outcomes = choice.check ? ['success','failure','criticalSuccess','criticalFailure'].map(key => choice.check[key]).filter(Boolean) : [choice.outcome].filter(Boolean);
  for (const authored of outcomes) {
    assert(authored.historyId && !ids.has(authored.historyId)); ids.add(authored.historyId);
    for (const documents of ['carried','stored','missing']) for (const capped of [false,true]) {
      const outcome = resolveEventOutcome(authored, () => 0.5, documents === 'carried', documents === 'stored');
      const summary = { costs: [], changes: capped ? [] : ['money','mood','health','phoneCondition'].filter(id => outcome[id]).map(id => ({ id, label: '⟦resource⟧', value: '⟦value⟧', amount: outcome[id], kind: outcome[id] > 0 ? 'positive' : 'negative' })) };
      const facts = { outcomeId: authored.historyId, documents, suppliesRejected: false };
      if (!(authored.randomCoin && capped)) assert.deepEqual(eventHistoryReflection(facts, summary), oldReflection(event.title, outcome.message, summary), authored.historyId);
    }
  }
}
assert.equal(ids.size, Object.keys(eventHistoryDefinitions).length);
for (const eventId of ['first-night-door','free-snack','station-food']) {
  const event = STREET_EVENTS.find(event => event.id === eventId);
  const outcome = event.choices.find(choice => choice.outcome?.food)?.outcome;
  assert.deepEqual(eventHistoryReflection({ outcomeId: outcome.historyId, documents: 'carried', suppliesRejected: true }, { costs: [], changes: [] }), oldReflection(event.title, 'There was no backpack room; you left it behind.', { costs: [], changes: [] }));
}
const savedOutcome = { ...entry, outcomeId: 'first-night-door:decline:complete' };
assert.deepEqual(loadJournalEntries([savedOutcome]), [savedOutcome]);
console.log(`PASS: ${ids.size} authored History outcomes, document/cap/refusal variants and saved outcome identity.`);

// Inventory reactions depend on resolved facts, not result headings/reports.
const { inventoryCommandResult, resolveInventoryCommand } = bundled('src/inventoryCommands.ts');
const { inventoryHistoryReflection } = bundled('src/inventoryHistory.ts');
const { INITIAL_INVENTORY, INITIAL_STORAGE, SHOP_ITEMS } = bundled('src/inventory.ts');
const { withFoodPortions } = bundled('src/foodInventory.ts');
const { initialState } = bundled('src/game.ts');
const inventoryContext = { game: { ...initialState, day: 1, minutes: 600, money: 100, hygiene: 30 }, inventory: { ...INITIAL_INVENTORY }, storage: { ...INITIAL_STORAGE }, effects: [], locationId: 'shop', open: true, insideNightShelter: false };
let inventoryCases = 0;
function verifyInventory(command, patch = {}, random = () => 0.5) {
  const context = { ...inventoryContext, ...patch };
  const identity = inventoryCommandResult(command);
  const resolved = resolveInventoryCommand(context, command, random);
  const facts = resolved.history ?? identity.inventoryHistory;
  const changes = Object.entries(resolved.action ?? {}).filter(([id, amount]) => ['money','mood','health'].includes(id) && amount).map(([id, amount]) => ({ id, amount, label: '⟦resource⟧', value: '⟦delta⟧', kind: amount > 0 ? 'positive' : 'negative' }));
  for (const summary of command.type === 'return-bottles' ? [{costs:[],changes}] : [{costs:[], changes}, {costs:[], changes:[]}]) {
    if (command.type === 'buy') {
      assert.deepEqual(inventoryHistoryReflection(identity.id, facts, summary), { title: `Bought ${command.item.name}`, text: facts.status === 'purchase-blocked' ? 'I’ll have to rethink what I can buy and carry.' : '' }, 'purchases must not imply eating, washing or taking medicine');
    } else assert.deepEqual(inventoryHistoryReflection(identity.id, facts, summary), oldReflection(resolved.info?.title ?? identity.title, resolved.message ?? '', summary), `${command.type} / ${facts.status}`);
  }
  inventoryCases++;
  return resolved;
}
for (const item of SHOP_ITEMS) {
  verifyInventory({type:'buy',item});
  verifyInventory({type:'buy',item},{game:{...inventoryContext.game,money:0}});
  verifyInventory({type:'buy',item},{inventory:{...INITIAL_INVENTORY,medicines:32}});
}
for (const item of ['water','wipes','cannedFood']) verifyInventory({type:'use',item},{inventory:{...INITIAL_INVENTORY,[item]:1}});
for (const item of ['food','bread','readyMeal']) for (const freshness of [100,40,0]) for (const draw of [0,0.95,0.99]) {
  verifyInventory({type:'use',item},{inventory:withFoodPortions(INITIAL_INVENTORY,item,[freshness])},()=>draw);
}
verifyInventory({type:'medicine'});
for (const treated of [false,true]) verifyInventory({type:'medicine'},{effects:[{id:'cold',expiresAt:2000,treated}]});
verifyInventory({type:'smoke'},{inventory:{...INITIAL_INVENTORY,cigarettes:1}});
verifyInventory({type:'return-bottles'},{inventory:{...INITIAL_INVENTORY,bottles:3}});
for (const type of ['store','take']) verifyInventory({type,item:'documents'},{locationId:'shelter',insideNightShelter:true,inventory:{...INITIAL_INVENTORY,documents:type==='store'},storage:{...INITIAL_STORAGE,documents:type==='take'}});
for (const type of ['store-food','take-food']) verifyInventory({type},{locationId:'residential-shelter',storage:{...INITIAL_STORAGE,food:2}});
const { createInventoryController } = bundled('src/inventoryController.ts');
let randomDraws = 0; const savedRandom = Math.random;
Math.random = () => { randomDraws++; return 0.99; };
try {
  const context = {...inventoryContext,inventory:withFoodPortions(INITIAL_INVENTORY,'food',[0])};
  const host = { runWithResult: () => {}, resultSnapshot: () => ({}) };
  createInventoryController(context,host).useItem('food');
  assert.equal(randomDraws,0,'a rejected action never resolves food randomness');
  let recorded;
  const accepted = {...host,runWithResult:(identity,action)=>{recorded=action()??identity.inventoryHistory},setInventory:()=>{},setGame:()=>{},setEffects:()=>{},setStorage:()=>{},setMessage:()=>{},setInfoModal:()=>{}};
  createInventoryController(context,accepted).useItem('food');
  assert.equal(randomDraws,2,'accepted vomiting resolves one outcome and one severity roll');
  assert.equal(recorded.status,'food-vomiting','the accepted callback supplies the resolved History facts');
} finally { Math.random = savedRandom; }
console.log(`PASS: ${inventoryCases} inventory scenarios, capped summaries, legacy-copy equivalence and accepted-action randomness.`);

// Render relabelled resources: filtering, cap hatching, icons, costs and the
// compact Mood/battery split must use IDs even when labels cannot be parsed.
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'Node', 'Event']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {}; window.matchMedia = () => ({ matches: true });
const React = require('react');
const { render, cleanup } = require('@testing-library/react');
const { default: ResultCard, isMajorChange } = bundled('src/ResultCard.tsx');
const row = (id, amount, meter) => ({ id, label: `⟦${id} translated⟧`, amount, value: '⟦display value⟧', kind: amount > 0 ? 'positive' : 'negative', ...(meter ? { meter } : {}) });
try {
  assert(!isMajorChange(row('energy', -4.9))); assert(isMajorChange(row('energy', -5)));
  assert(isMajorChange(row('mood', -0.1)));
  const result = { title: '⟦Result⟧', text: '⟦Text⟧', presentation: { compact: true, heading: '⟦Place⟧', label: '', lead: '' }, costs: [row('phoneBattery', -0.2, { before: 50, after: 49.8 })], changes: [row('mood', 1, { before: 20, after: 21 })] };
  render(React.createElement(ResultCard, { result, onClose: () => {} }));
  assert(document.querySelector('.compact-info-mood'), 'compact summary recognises relabelled Mood');
  assert(document.querySelector('.result-stat'), 'compact result retains its relabelled battery meter');
  cleanup();
  render(React.createElement(ResultCard, { result: { ...result, presentation: undefined, costs: [], changes: [row('hygiene', 6, { before: 40, after: 46, cap: 60 })] }, onClose: () => {} }));
  assert(document.querySelector('.bar-blocked'), 'translated Hygiene retains its cap hatching');
  assert(document.querySelector('[role="meter"]').getAttribute('aria-label').includes('maximum 60%'));
  cleanup();
  const { standardizeChoiceButton } = bundled('src/ChoiceButton.tsx');
  const explicit = label => standardizeChoiceButton(React.createElement('button', { 'data-icon': 'hand' }, React.createElement('div', null, React.createElement('strong', null, label))));
  render(explicit('Catch it')); const handIcon = document.querySelector('.choice-icon').innerHTML;
  cleanup(); render(explicit('⟦water phone doctor sleep⟧'));
  assert.equal(document.querySelector('.choice-icon').innerHTML, handIcon, 'explicit metadata keeps its icon when all label words change');

} finally { cleanup(); dom.window.close(); }
console.log('PASS: typed messages/parameters, locale plural categories, catalog completeness, unchanged time/money formats, stable result guards, legacy History and relabelled result mechanics.');
