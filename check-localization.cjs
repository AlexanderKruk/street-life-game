const assert = require('node:assert/strict');
const ts = require('typescript');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
  const input = typeof path === 'string' ? { entryPoints: [path] } : { stdin: { contents: path.source, resolveDir: process.cwd(), loader: 'tsx' } };
  const code = buildSync({ ...input, bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'react-dom', 'react/jsx-runtime'] }).outputFiles[0].text;
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

// Historical heading fixtures protect parity while current display copy is arbitrary.
const actionTitles = {"sleep-start": "Start sleeping", "sleep-complete": "Sleep complete", "shelter-checkout": "Shelter checkout", "shelter-registration": "Shelter registration", "shelter-extension": "Shelter extension", "music-walk": "Walk with music", "city-walk": "Walk through the city", "ask-money": "Ask for money", "find-bench": "Is there a bench nearby? My legs could use a break.", "bench-rest": "Rest on the bench", "medical-appointment": "Medical appointment", "emergency-care": "Emergency care", "trash-search": "Trash search results", "social-support": "Social support", "day-work": "Day work", "phone-collect": "Collect phone", "phone-charging": "Phone charging", "phone-charge": "Charge phone", "call-interrupted": "Call interrupted", "search-interrupted": "Search interrupted", "mobile-service": "Mobile service", "arrival": "Arrival", "journey-stopped": "Journey stopped", "rain-cover": "Shelter from the rain", "rain-passed": "The rain has passed", "rain-stopped": "The rain has stopped", "closing-time": "Closing time", "event-result": "Event result", "item-stolen": "Item stolen", "caught-stealing": "Caught stealing", "location:street-sleep": "Sleep on the ground", "location:station-rest": "Sit and recover", "location:station-charge": "Charge phone", "location:station-sleep": "Try to sleep", "location:shop-water": "Buy water", "location:shop-roll": "Buy bread and a roll", "location:shop-meal": "Buy a filling meal", "location:daycenter-stay": "Stay indoors", "location:daycenter-shower": "Take a shower", "location:daycenter-laundry": "Do laundry", "location:daycenter-charge": "Charge phone", "location:daycenter-doctor": "See a doctor", "location:shelter-social-worker": "Talk to shelter social worker", "location:support-worker": "Talk to a social worker", "location:residential-stay": "Settle into your place", "location:residential-sleep": "Sleep safely", "location:residential-refill-water": "Refill water", "location:shelter-refill-water": "Refill water", "location:shelter-shower": "Ask for a shower", "location:shelter-dinner": "Dinner", "location:shelter-breakfast": "Breakfast", "location:shelter-laundry-drop": "Leave clothes for laundry", "location:shelter-laundry-pickup": "Collect clean laundry", "location:shelter-rest": "Registration / reserved bed", "call:call-university": "No answer", "call:call-colleague": "A call to an old colleague", "call:call-friend": "Nowhere to put you", "question:morning": "Where can I get help in the morning?", "question:bed": "How can I get a shelter bed?", "question:no-place": "What if the shelter has no places?", "question:supplies": "Where can I get food and water?", "question:work": "Where can I find paid work?", "question:clinic": "Where can I get medical help?", "question:charging": "Where can I charge my phone?"};
const { actionHistoryReflection } = bundled('src/actionHistory.ts');
const actionSummaries = [{costs:[],changes:[]}, ...[['mood',1],['mood',-1],['health',-1],['money',1],['bottles',1]].map(([id,amount])=>({costs:[],changes:[{id,amount,label:'⟦stat⟧',value:'⟦delta⟧',kind:amount>0?'positive':'negative'}]}))];
for (const [id,title] of Object.entries(actionTitles)) for (const summary of actionSummaries) assert.deepEqual(actionHistoryReflection({id,title:'⟦translated heading⟧'},summary),oldReflection(title,'',summary),id);
function actionCase(id,facts,report,title=actionTitles[id],memoryId) {
  for (const summary of actionSummaries) assert.deepEqual(actionHistoryReflection({id,title:'⟦translated⟧',actionHistory:{kind:'action',...facts}},summary,memoryId),oldReflection(title,report,summary,memoryId),id+' '+JSON.stringify(facts));
}
for (const id of ['shelter-registration','find-bench','trash-search','ask-money','location:daycenter-stay','location:daycenter-shower','location:daycenter-laundry','location:daycenter-charge','location:daycenter-doctor']) actionCase(id,{failed:true},'The place is full right now.');
actionCase('question:morning',{noNewInformation:true},'','No new information');
actionCase('sleep-complete',{sleepIllness:true},'','Feeling unwell');
actionCase('arrival',{destinationName:'Station'},'You arrived at Station by walking.');
for(const [outcome,report] of [['needed','Take them with you.'],['restored','You replace your missing documents.'],['referral','You receive a referral to Schronisko.'],['transport','You receive free public transport.'],['benefits','You discuss benefits.'],['unchanged','You already have a referral.']]) actionCase('social-support',{supportOutcome:outcome},report);
for(const[id,memory]of [['city-walk','office-routine'],['bench-rest','redundancy-savings'],['location:station-rest','redundancy-savings'],['question:morning','unanswered-applications']])actionCase(id,{},'',undefined,memory);
actionCase('question:morning',{noNewInformation:true},'','No new information','unanswered-applications');
console.log('PASS: 64 action headings, explicit refusals/support/search/sleep/arrival facts and memory priority without report parsing.');

const { journalPresentation, journalDecisionKey, groupJournalEntries } = bundled('src/journalIdentity.ts');
const samples=[];
function presentationCase(action,summary={costs:[],changes:[]},memory) {
  const rendered=journalPresentation(action,summary,memory);
  const pseudo=journalPresentation({...action,title:'⟦heading⟧'},summary,memory,(key)=>`⟦${key}⟧`);
  assert.equal(rendered.groupId,pseudo.groupId);
  const entry={day:2,minute:700,actionId:action.id,actionTitle:action.title,reflection:true,...rendered};
  assert.deepEqual(loadJournalEntries([entry]),[entry]);
  assert.equal(journalDecisionKey([entry]),JSON.stringify([1,2,700,action.title]));
  assert.equal(journalDecisionKey([{...entry,actionTitle:'⟦new⟧'}]),journalDecisionKey([entry]));
  samples.push(entry); return entry;
}
for(const[id,title]of Object.entries(actionTitles))for(const summary of actionSummaries)presentationCase({id,title},summary);
for(const event of STREET_EVENTS)for(const choice of event.choices){
 const outcomes=choice.check?['success','failure','criticalSuccess','criticalFailure'].map(k=>choice.check[k]).filter(Boolean):[choice.outcome].filter(Boolean);
 for(const o of outcomes)presentationCase({id:`event:${event.id}`,title:event.title,eventHistory:{outcomeId:o.historyId,documents:'carried',suppliesRejected:false}});
}
for(const item of ['food','bread','cannedFood','readyMeal','water','wipes'])for(const summary of actionSummaries)presentationCase(inventoryCommandResult({type:'use',item}),summary);
for(const item of SHOP_ITEMS)presentationCase(inventoryCommandResult({type:'buy',item}));
for(let i=0;i<samples.length;i++)for(let j=i;j<samples.length;j++){
 const a=samples[i],b=samples[j];assert.equal(a.groupId===b.groupId,a.actionTitle===b.actionTitle&&a.title===b.title&&a.text===b.text,`${a.actionId} / ${b.actionId}`);
}
presentationCase({id:'question:morning',title:'Searched for more help',actionHistory:{kind:'action',noNewInformation:true}});
const arrival={id:'arrival',title:'Arrival',actionHistory:{kind:'action',destinationId:'station',destinationName:'Station'}};
assert.equal(journalPresentation(arrival).groupId,journalPresentation({...arrival,actionHistory:{...arrival.actionHistory,destinationName:'⟦station⟧'}}).groupId);
const water=samples.find(e=>e.actionId==='use:water');const old={...water};delete old.groupId;delete old.decisionId;
const mixed=[old,{...water,minute:701},{...water,minute:702,title:'⟦heading⟧',text:'⟦thought⟧'}];const original=JSON.stringify(mixed);
assert.equal(groupJournalEntries(mixed,2)[0].count,3);assert.equal(groupJournalEntries(mixed,2)[0].minute,700);assert.equal(JSON.stringify(mixed),original);
console.log(`PASS: ${samples.length} History presentations, grouping parity, metadata reload, translated names and mixed records.`);

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
const { orderChoiceNodes } = bundled('src/ChoiceOptions.tsx');
const { shuffleChoiceOrder } = bundled('src/streetChoiceOrder.ts');
const { choiceOrderToken } = bundled('src/legacyChoiceOrderCompatibility.ts');
function verifyChoiceOrder(ids,labels,fixed,decision) {
 for(const seed of [0,1,17,42,0xffffffff]){
  const nodes=ids.map((id,i)=>React.createElement('button',{'data-order-id':id,'aria-label':labels[i],key:id},labels[i]));
  const oldFixed=nodes.length===2&&labels.some(label=>/^(yes\b|no\b|accept\b|decline\b|confirm\b|cancel\b|leave it\b|let it fall\b)/i.test(label.trim()));
  const expected=oldFixed?nodes:shuffleChoiceOrder(nodes,seed,`${decision}|${labels.join('|')}`);
  const getIds=nodes=>nodes.map(n=>n.props['data-order-id']);
  assert.deepEqual(getIds(orderChoiceNodes(nodes,seed,decision,fixed)),getIds(expected));
  assert.deepEqual(getIds(orderChoiceNodes(nodes.map(n=>React.cloneElement(n,{'aria-label':'⟦new⟧'},'⟦copy⟧')),seed,decision,fixed)),getIds(expected));
 }
}
for(const e of STREET_EVENTS)for(const choices of [e.choices,e.choices.filter(c=>!c.undiscoveredLocationRequired)])verifyChoiceOrder(choices.map(c=>`event:${e.id}:${c.id}`),choices.map(c=>choiceOrderToken(`event:${e.id}:${c.id}`)),e.choiceOrder==='fixed',`fixture|event:${e.id}`);
for(const ids of [['travel:walk','travel:transit','travel:fare-dodge'],['travel:walk','travel:transit'],['rain:nearby','rain:proper','rain:continue'],['support:housing','support:documents','support:transport','support:benefits'],['interview:reason:work','interview:reason:documents','interview:reason:health'],['interview:action:job','interview:action:documents','interview:action:nothing'],['interview:plan:jobcenter','interview:plan:daywork','interview:plan:documents','interview:plan:nothing'],['hospital:appointment','location:empty']])verifyChoiceOrder(ids,ids.map(choiceOrderToken),false,'fixture');
console.log('PASS: stable ordering matches historical seeds for events, hidden answers, services and travel under pseudo-copy.');
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
  const { default: ChoiceButton, approximateDuration, formatChoiceEstimate } = bundled('src/ChoiceButton.tsx');
  const explicit = label => React.createElement(ChoiceButton, { icon: 'hand', label });
  render(explicit('Catch it')); const handIcon = document.querySelector('.choice-icon').innerHTML;
  cleanup(); render(explicit('⟦water phone doctor sleep⟧'));
  assert.equal(document.querySelector('.choice-icon').innerHTML, handIcon, 'explicit metadata keeps its icon when all label words change');
  for(const [minutes,label] of [[0,'≈0m'],[1,'≈5m'],[7,'≈5m'],[8,'≈10m'],[59,'≈1h'],[62,'≈1h'],[63,'≈1h 5m'],[90,'≈1h 30m'],[180,'≈3h']])assert.equal(approximateDuration(minutes),label);
  assert.equal(formatChoiceEstimate({minutes:7,maxMinutes:62}),'≈5–60m');
  assert.equal(formatChoiceEstimate({minutes:120,atLeast:true}),'≈2h+');
  const view=bundled({source:`export {default as ChoiceButton} from './src/ChoiceButton'; export {default as AvailableFirst} from './src/AvailableFirst'; export {default as EventDialog} from './src/EventDialog'; export {default as DiceDialog} from './src/DiceDialog'; export * from './src/choiceCheckPresentation';`});
  const choice=(label,detail,estimate,thoughtEstimate)=>React.createElement(view.ChoiceButton,{icon:'hand',label,detail:React.createElement('small',null,detail),estimate,thoughtEstimate,'data-choice':'fixture'});
  const showThought=child=>{cleanup();render(React.createElement(view.AvailableFirst,{className:'fixture',thoughtsOnly:true,choiceGroups:[['fixture']]},child));};
  for(const label of ['Original','⟦Sleep · Unknown DC 99⟧']){
    showThought(choice(label,'~999 min · Choose duration',{minutes:31}));
    assert.equal(document.querySelector('.choice-duration').textContent,'≈30m');
    assert.equal(document.querySelector('.choice-copy').textContent,label);
  }
  showThought(choice('Choose duration','~999 min'));
  assert.equal(document.querySelector('.choice-duration'),null,'copy alone cannot create a duration');
  showThought(choice('⟦route⟧','ignored',{minutes:80},{minutes:30,atLeast:true}));
  assert.equal(document.querySelector('.choice-duration').textContent,'≈30m+');
  cleanup();render(choice('⟦service⟧','~999 min · intact detail',{minutes:47}));
  assert.equal(document.querySelector('.choice-duration').textContent,'≈45m');
  assert.equal(document.querySelector('.choice-copy small').textContent,'~999 min · intact detail');
  for(const event of STREET_EVENTS)for(const c of event.choices)if(c.check){
    assert.equal(view.choiceAccessibleLabel(c),choiceOrderToken(`event:${event.id}:${c.id}`),'historical accessible check label stays the same');
    const changed={...c,label:'⟦label · Something DC 99⟧'};
    for(const illustrated of [false,true]){
      cleanup();render(React.createElement(view.EventDialog,{event:{...event,illustration:illustrated?'fixture.webp':undefined},choices:[changed],onChoose:()=>{},unavailableReason:()=>null,orderSeed:1,decisionKey:'fixture',panelRef:null}));
      assert.equal(document.querySelector('.choice-copy strong').textContent,changed.label);
      assert.equal(document.querySelector('.choice-copy small').textContent,view.choiceCheckDetail(c.check));
      assert.equal(document.querySelector('button.choice-button').getAttribute('aria-label'),view.choiceAccessibleLabel(changed));
    }
    cleanup();render(React.createElement(view.DiceDialog,{diceCheck:{choice:changed,roll:null,modifier:0,resolved:false},onRoll:()=>{},onAccept:()=>{},onCancel:()=>{}}));
    assert.equal(document.querySelector('#dice-action-title').textContent,changed.label);
    assert.equal(document.querySelector('.dice-attempt').textContent,changed.label);
  }
  const anyCheck=STREET_EVENTS.flatMap(e=>e.choices).find(c=>c.check);
  for(const item of SHOP_ITEMS){
    cleanup();render(React.createElement(view.DiceDialog,{diceCheck:{choice:anyCheck,roll:null,modifier:0,resolved:false,stealItemId:item.id},onRoll:()=>{},onAccept:()=>{},onCancel:()=>{}}));
    assert.equal(document.querySelector('#dice-action-title').textContent,`Steal ${item.name.toLowerCase()}?`);
  }
  console.log('PASS: numeric duration/range/route metadata, intact pseudo-copy, explicit check labels and all theft headings.');



} finally { cleanup(); dom.window.close(); }
console.log('PASS: typed messages/parameters, locale plural categories, catalog completeness, unchanged time/money formats, stable result guards, legacy History and relabelled result mechanics.');
