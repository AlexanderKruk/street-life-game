const assert = require('node:assert/strict');
const ts = require('typescript');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
  const input = typeof path === 'string' ? { entryPoints: [path] } : { stdin: { contents: path.source, resolveDir: process.cwd(), loader: 'tsx' } };
  const overrides = typeof path === 'object' ? { ...(path.effects ? { effects: path.effects } : {}), ...path.catalogs } : {};
  const external = ['react', 'react-dom', 'react/jsx-runtime', ...Object.keys(overrides).map(name => `*/locales/en/${name}`)];
  const code = buildSync({ ...input, bundle: true, platform: 'node', format: 'cjs', write: false, external }).outputFiles[0].text;
  const module = { exports: {} };
  const load = name => {
    const catalog = Object.keys(overrides).find(id => name.endsWith(`/locales/en/${id}`));
    return catalog ? { [catalog]: overrides[catalog] } : require(name);
  };
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
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
const { EFFECT_CHIPS, impactChip, freshnessChip, foodEffectChips, foodFreshnessLabel } = bundled('src/effectChips.ts');
const { foodSlot } = bundled('src/foodInventory.ts');
const chipFixtures={ 'thirst-large':['Thirst+++','positive'], 'food-small':['Food+','positive'], 'food-medium':['Food++','positive'], 'food-large':['Food+++','positive'], 'mood-gain':['Mood+','positive'], 'mood-loss':['Mood−','negative'], 'energy-loss':['Energy−','negative'], 'energy-strong-loss':['Energy−−','negative'], 'health-loss':['Health−','negative'], 'hygiene-small':['Hygiene+','positive'], 'hygiene-large':['Hygiene+++','positive'], 'travel-large':['Travel+++','positive'], 'recovery-fast':['Recovery ×3','positive'], 'deposit-value':['0.50 zł','positive'] };
assert.deepEqual(Object.keys(EFFECT_CHIPS).sort(),Object.keys(chipFixtures).sort());
for(const[id,[label,kind]]of Object.entries(chipFixtures)){const chip=impactChip(id);assert.equal(chip.label,label);assert.equal(chip.kind,kind);}
for(const [freshness,label] of [[0,'Spoiled'],[20,'Spoiled'],[20.001,'Stale'],[50,'Stale'],[50.001,'Fresh'],[100,'Fresh']])assert.equal(foodFreshnessLabel(freshness),label);
let foodChipCases=0;
for(const kind of ['food','bread','readyMeal'])for(const portions of [[0],[20],[20.001],[50],[50.001],[100],[100,100,40,10],[10,20,30,100],[100,100,100,100,40,10,100]]){
 const stock={[kind]:portions.length,[kind+'Portions']:portions};const saved=JSON.stringify(stock);
 for(let index=0;index<Math.ceil(portions.length/4);index++){
  const slot=foodSlot(stock,kind,index),f=slot.freshness;
  const labels=[kind==='bread'?'Food+':kind==='readyMeal'&&f>50?'Food+++':f>20?'Food++':'Food+',...(kind==='food'&&f>50?['Mood+']:[]),...(slot.stale?[`Stale ×${slot.stale}`]:[]),...(slot.spoiled?[`Spoiled ×${slot.spoiled}`]:[])];
  const chips=foodEffectChips(kind,slot);assert.deepEqual(chips.map(c=>c.label),labels);assert.deepEqual(chips.map(c=>c.kind),labels.map(l=>l.startsWith('Spoiled')?'negative':l.startsWith('Stale')?'warning':'positive'));foodChipCases++;
 }
 assert.equal(JSON.stringify(stock),saved);
}
const { effects:effectCatalog }=bundled('src/locales/en/effects.ts');
const pseudoEffects=Object.fromEntries(Object.entries(effectCatalog).map(([key,value])=>[key,`⟦${key}⟧ ${(value.match(/\{\w+\}/g)||[]).join(' ')}`]));
pseudoEffects['effectChip.mood.gain']='Spoiled − ⟦positive⟧';pseudoEffects['effectChip.health.loss']='Fresh + ⟦negative⟧';pseudoEffects['freshness.stale.count']='⟦warning⟧ {count}';pseudoEffects['freshness.spoiled.count']='⟦bad⟧ {count}';
assert.deepEqual(validateCatalog(effectCatalog,pseudoEffects),[]);
console.log(`PASS: ${Object.keys(chipFixtures).length} impact definitions and ${foodChipCases} food-slot previews, boundaries/counts and unchanged input.`);
const { inventory:inventoryCatalog }=bundled('src/locales/en/inventory.ts');
function pseudoMessage(key,message){
 const variant=value=>`⟦${key} <b>copy</b>⟧ ${(value.match(/\{\w+\}/g)||[]).join(' ')}`;
 return typeof message==='string'?variant(message):Object.fromEntries(Object.entries(message).map(([k,v])=>[k,k==='plural'?v:variant(v)]));
}
const pseudoInventory=Object.fromEntries(Object.entries(inventoryCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
for(const key of ['shop.closed','shop.full','shop.unaffordable'])pseudoInventory[key]='';
assert.deepEqual(validateCatalog(inventoryCatalog,pseudoInventory),[]);
for(const [key,singular,plural] of [['item.caption.water','1 portion','2 portions'],['item.caption.bread','1 roll','2 rolls'],['item.caption.wipes','1 use','2 uses'],['item.caption.showerGel','1 shower','2 showers']]){
 assert.equal(t(key,{count:1}),singular);assert.equal(t(key,{count:2}),plural);
}
assert.equal(t('inventory.result.returned',{count:1}),'You return 1 deposit container and collect the money.');
assert.equal(t('inventory.result.returned',{count:2}),'You return 2 deposit containers and collect the money.');
const inventoryView=bundled({source:`export {default as InventoryScreen} from './src/InventoryScreen'; export {default as ShopCard} from './src/ShopCard'; export * from './src/inventory'; export * from './src/inventoryCommands'; export * from './src/journalIdentity'; export * from './src/itemPresentation';`,catalogs:{inventory:pseudoInventory}});
let translatedCommandCases=0;
function commandSignature(resolve,identity,context,command){
 let draws=0;const plan=resolve(context,command,()=>{draws++;return 0.99;});const result=identity(command),action={...plan.action};delete action.message;
 const info=plan.info?{...plan.info}:undefined;if(info)for(const key of ['title','text','label','illustrationAlt'])delete info[key];
 const history=plan.history?{...plan.history}:undefined;if(history)delete history.itemName;
 return {draws,inventory:plan.inventory?.(context.inventory),storage:plan.storage?.(context.storage),effects:plan.effects?.(context.effects),game:plan.game?.(context.game),action,info,history,id:result?.id,consumed:result?.consumedItems,always:result?.always};
}
function compareTranslatedCommand(command,patch={}){
 const context={...inventoryContext,...patch};const other=command.type==='buy'?{...command,item:inventoryView.SHOP_ITEMS.find(i=>i.id===command.item.id)}:command;
 assert.deepEqual(commandSignature(inventoryView.resolveInventoryCommand,inventoryView.inventoryCommandResult,context,other),commandSignature(resolveInventoryCommand,inventoryCommandResult,context,command));
 const a=inventoryCommandResult(command),b=inventoryView.inventoryCommandResult(other);
 if(a){
  const summary={costs:[],changes:[]};const presented=journalPresentation(a,summary),translated=inventoryView.journalPresentation(b,summary);
  assert.equal(translated.groupId,presented.groupId);
  assert.equal(inventoryView.journalDecisionKey([{day:2,minute:700,actionTitle:b.title,...translated}]),journalDecisionKey([{day:2,minute:700,actionTitle:a.title,...presented}]));
 }
 translatedCommandCases++;
}
for(const item of SHOP_ITEMS)for(const patch of [{},{open:false},{game:{...inventoryContext.game,money:0}},{inventory:{...INITIAL_INVENTORY,medicines:32}}])compareTranslatedCommand({type:'buy',item},patch);
for(const item of ['water','cannedFood','wipes'])compareTranslatedCommand({type:'use',item},{inventory:{...INITIAL_INVENTORY,[item]:2}});
for(const item of ['food','bread','readyMeal'])for(const freshness of [0,40,100])compareTranslatedCommand({type:'use',item},{inventory:withFoodPortions(INITIAL_INVENTORY,item,[freshness])});
compareTranslatedCommand({type:'medicine'});
for(const treated of [true,false])compareTranslatedCommand({type:'medicine'},{effects:[{id:'cold',expiresAt:2000,treated}]});
compareTranslatedCommand({type:'smoke'},{inventory:{...INITIAL_INVENTORY,cigarettes:1}});
for(const count of [1,2,8])compareTranslatedCommand({type:'return-bottles'},{inventory:{...INITIAL_INVENTORY,bottles:count}});
for(const type of ['store','take'])for(const item of ['documents','medicines','cigarettes'])for(const count of [1,2])compareTranslatedCommand({type,item},{locationId:'shelter',insideNightShelter:true,inventory:{...INITIAL_INVENTORY,[item]:item==='documents'?type==='store':count},storage:{...INITIAL_STORAGE,[item]:item==='documents'?type==='take':count}});
for(const type of ['store-food','take-food'])for(const count of [1,2])compareTranslatedCommand({type},{locationId:'residential-shelter',inventory:{...INITIAL_INVENTORY,food:count},storage:{...INITIAL_STORAGE,food:count}});
compareTranslatedCommand({type:'discard',id:'food',quantity:2,slotIndex:0,spoiledOnly:true},{inventory:withFoodPortions(INITIAL_INVENTORY,'food',[0,100])});
const { fitEventSupplies }=bundled('src/inventory.ts');
for(const inventory of [INITIAL_INVENTORY,{...INITIAL_INVENTORY,medicines:32}]){
 const outcome={message:'⟦report⟧',food:8,water:8};const before=fitEventSupplies(inventory,outcome),after=inventoryView.fitEventSupplies(inventory,outcome);
 assert.deepEqual(after.inventory,before.inventory);assert.equal(after.rejected.length,before.rejected.length);
}
console.log(`PASS: inventory captions/plurals and ${translatedCommandCases} pseudo-catalog commands preserve updates, RNG, guards, result IDs, History groups and seeds.`);
const statusModel=bundled('src/statusPresentation.ts');
const reasonIds=['Street','Night shelter','Schronisko','Hostel','Room','Apartment','Hunger','Thirst','Health','Tiredness','Hygiene','Cold','Dirty clothes'];
for(const id of reasonIds){assert.equal(statusModel.limitReasonLabel(id),id);assert.equal(statusModel.limitCauseLabel(id),({Street:'On the street',Room:'Rented room',Hygiene:'Poor hygiene'})[id]??id);}
for(const id of ['Street','Night shelter','Schronisko','Hostel','Room','Apartment'])assert.equal(statusModel.housingLabel(id),id);
for(const id of ['Unemployed','Day work'])assert.equal(statusModel.employmentLabel(id),id);for(const id of ['None','Irregular'])assert.equal(statusModel.incomeLabel(id),id);
assert.equal(statusModel.limitReasonsLabel(['Night shelter','Tiredness','Cold']),'Night shelter, Tiredness, Cold');
const {remainingEffect}=bundled('src/statusEffects.ts');
for(const [left,text] of [[-1,'0m'],[0,'0m'],[1,'1m'],[59,'59m'],[60,'1h'],[61,'2h'],[1439,'24h'],[1440,'1 day'],[1441,'2 days'],[2880,'2 days']])assert.equal(remainingEffect(600+left,{day:1,minutes:600}),text);
const {status:statusCatalog}=bundled('src/locales/en/status.ts');const {common:commonCatalog}=bundled('src/locales/en/common.ts');
const pseudoStatus=Object.fromEntries(Object.entries(statusCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
const pseudoCommon=Object.fromEntries(Object.entries(commonCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
pseudoStatus['status.housing.shelter']='';pseudoStatus['status.cause.tiredness']='';pseudoCommon['stat.health']='';
assert.deepEqual(validateCatalog(statusCatalog,pseudoStatus),[]);assert.deepEqual(validateCatalog(commonCatalog,pseudoCommon),[]);
const statusView=bundled({source:`export {default as App} from './src/App'; export {default as LifeSituation} from './src/LifeSituation'; export * from './src/statusPresentation'; export * from './src/limitingEffects'; export * from './src/game'; export * from './src/results';`,catalogs:{status:pseudoStatus,common:pseudoCommon,effects:pseudoEffects}});
const comfortableStatus={...initialState,day:2,minutes:720,hunger:100,thirst:100,health:100,hygiene:100,energy:100,mood:95};
const tied=statusView.limitingEffects({...comfortableStatus,energy:20},{housing:'Night shelter'},10);
assert.deepEqual(tied.map(e=>e.reason),['Night shelter','Tiredness','Dirty clothes']);assert.equal(tied[0].name,'');assert.equal(tied[1].name,'');
for(const housing of ['Street','Night shelter','Schronisko','Hostel','Room','Apartment'])assert.deepEqual(statusView.moodLimit(comfortableStatus,{housing}),bundled('src/game.ts').moodLimit(comfortableStatus,{housing}));
const capSnapshot={game:{...comfortableStatus,mood:49},housing:'Street',inventory:INITIAL_INVENTORY,effects:[]};
const capSummary=statusView.summarizeResult(capSnapshot,{...capSnapshot,game:{...capSnapshot.game,mood:50}});
const translatedMood=capSummary.changes.find(row=>row.id==='mood');assert.equal(translatedMood.amount,1);assert.equal(translatedMood.meter.cap,50);assert.equal(translatedMood.meter.capReason,statusView.limitReasonsLabel(['Street']));
console.log('PASS: all housing/cause/employment/income mappings, condition identities, tied empty-name limits and effect-time boundaries.');



// HUD/weather copy is presentation only, including deliberately misleading names.
const {hud:hudCatalog}=bundled('src/locales/en/hud.ts');
const pseudoHud=Object.fromEntries(Object.entries(hudCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
for(const key of Object.keys(pseudoHud))if(key.startsWith('weather.'))pseudoHud[key]='Clear';
for(const key of Object.keys(pseudoHud))if(key.startsWith('calendar.weekday.'))pseudoHud[key]='Th';
assert.deepEqual(validateCatalog(hudCatalog,pseudoHud),[]);
const hudSource=`export {default as GameHeader} from './src/GameHeader'; export {default as App} from './src/App'; export * from './src/hudPresentation'; export * from './src/game'; export * from './src/gameTime'; export * from './src/phonePower'; export * from './src/sleepIllness'; export * from './src/locationActionRules';`;
const hudBase=bundled({source:hudSource});
const hudView=bundled({source:hudSource,catalogs:{hud:pseudoHud}});
const weatherIds=['Cloudy','Rain','Clear','Windy','Showers','Rainy','Drizzle','Downpour'];
for(const id of weatherIds){
 assert.equal(hudBase.weatherLabel(id),id);assert.equal(hudView.weatherLabel(id),'Clear');
 for(const minutes of [0,359,360,1199,1200,1439])assert.equal(hudView.weatherIcon(id,minutes),id==='Clear'?(minutes>=360&&minutes<1200?'sun':'moon'):['Cloudy','Windy'].includes(id)?'cloud':'rain');
 for(const kind of ['ground','bench','shelter'])for(const exposure of ['outside','cover','indoors'])assert.equal(hudView.sleepIllnessHazard(kind,5,id,80,exposure),hudBase.sleepIllnessHazard(kind,5,id,80,exposure));
}
for(let day=1;day<=14;day++){
 assert.equal(hudBase.weekdayLabel(day),hudBase.weekday(day));assert.equal(hudView.weekdayLabel(day),'Th');
 assert.equal(hudView.rainDailyLimit(day),hudBase.rainDailyLimit(day));
 const game={...comfortableStatus,day,minutes:990,rainSystemStarted:true,nextRainAt:999999};
 const context={game,inventory:INITIAL_INVENTORY,life:{housing:'Night shelter'},current:{id:'shelter',open:1080},open:true,shelterBooked:true,shelterAdmitted:true};
 const worker=hudView.actions.find(a=>a.id==='shelter-social-worker');
 assert.equal(hudView.locationActionUnavailable(worker,context)===null,[2,5].includes((day-1)%7+1),'translated weekday cannot enable social worker on Thursday');
 const laundry=hudView.actions.find(a=>a.id==='shelter-laundry-drop');
 assert.equal(hudView.locationActionUnavailable(laundry,{...context,game:{...game,minutes:420}})===null,(day-1)%7===3,'translated weekday cannot change laundry day');
 for(const minutes of [359,1199,1439])for(const level of [undefined,'drizzle','rain','downpour']){
  const now=(day-1)*1440+minutes;
  const state={...game,minutes,...(level?{rain:{id:'fixture',level,start:now-1,end:now+3,choice:'continue',searchRemaining:0,protection:0.5,shelter:'canopy',exposure:0,energyLoss:0,moodLoss:0,waited:0,coldRoll:0.5}}:{})};
  assert.deepEqual(hudView.weatherAt(state),hudBase.weatherAt(state));
  assert.equal(Object.hasOwn(hudView.weatherAt(state),'label'),false);
  for(const usage of ['browsing','navigation'])assert.equal(hudView.phoneScreenDrain(state,72,usage,10),hudBase.phoneScreenDrain(state,72,usage,10));
  assert.deepEqual(hudView.advanceTime(state,10,{exposure:'outside'}),hudBase.advanceTime(state,10,{exposure:'outside'}));
 }
}
console.log('PASS: weather/weekday pseudo-copy preserves all 8 identities, dawn/dusk icons, service weekdays, rain, needs, phone drain and illness rules.');

// Names/descriptions no longer live in domain locations or control branches.
const locationFixtures=require('./test-fixtures/location-catalogue.cjs');
const {locations:locationCatalog}=bundled('src/locales/en/locations.ts');
const pseudoLocations=Object.fromEntries(Object.entries(locationCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
for(const key of Object.keys(pseudoLocations))if(key.startsWith('location.name.'))pseudoLocations[key]='';
assert.deepEqual(validateCatalog(locationCatalog,pseudoLocations),[]);
const locationsSource=`export {default as App} from './src/App'; export {default as CityMap} from './src/CityMap'; export {default as BottomNavigation} from './src/BottomNavigation'; export {default as ClosedContent} from './src/ClosedContent'; export {default as PhoneNotesScreen} from './src/PhoneNotesScreen'; export * from './src/LocationPresentation'; export * from './src/locationText'; export * from './src/resultPresentation'; export * from './src/game'; export * from './src/journalIdentity'; export * from './src/saveCompatibility'; export * from './src/loadGameSession'; export * from './src/eventController';`;
const locationsBase=bundled({source:locationsSource});
const locationsView=bundled({source:locationsSource,catalogs:{locations:pseudoLocations}});
for(const old of locationFixtures){
 const place=locationsView.locations.find(p=>p.id===old.id);const {name,description,...mechanics}=old;
 assert.deepEqual(place,mechanics);assert.equal(locationsBase.locationName(place.id),name);assert.equal(locationsBase.locationDescription(place.id),description);
 assert.equal(locationsView.locationName(place.id),'');
 for(const minutes of [0,419,420,479,480,899,900,959,960,1079,1080,1319,1320,1439])assert.equal(locationsView.isOpen(place,minutes),locationsBase.isOpen(old,minutes));
 for(const mode of ['walk','transit','fare-dodge'])assert.deepEqual(locationsView.destinationTravelTimeRange(place,mode),locationsBase.destinationTravelTimeRange(old,mode));
 const expected=old.open===0&&old.close===1440?'24 hours':`${locationsBase.formatTime(old.open)}–${locationsBase.formatTime(old.close)}`;
 assert.equal(locationsBase.locationHours(place),expected);
 const expectedMap=old.open===0&&old.close===1440?'24/7':`${String(old.open/60).padStart(2,'0')}-${String(old.close/60).padStart(2,'0')}`;
 assert.equal(locationsBase.locationHours(place,'map'),expectedMap);
 const discovery=locationsView.locationPresentation([old.id]).places;assert.equal(discovery.length,1);assert.equal(discovery[0].id,old.id);assert.equal(discovery[0].name,'');
 const arrival={id:'arrival',title:'Arrival',actionHistory:{kind:'action',destinationId:old.id,destinationName:name}};
 assert.equal(locationsView.journalPresentation({...arrival,actionHistory:{...arrival.actionHistory,destinationName:''}}).groupId,locationsBase.journalPresentation(arrival).groupId,'empty display names cannot drop arrival identity or change History grouping');
}
assert.equal(locationsBase.locationHours({open:420,close:1440},'map'),'07-24');
assert.equal(locationsBase.locationHours({open:425,close:1315},'map'),'07:05-21:55');
assert.deepEqual(locationsView.locationPresentation(['not-a-place']).places,[]);

for(const view of [locationsBase,locationsView]){
 let report='';let state={...comfortableStatus,mood:40};let inventory={...INITIAL_INVENTORY};let discovered=['support'];
 const setter=(get,set)=>value=>set(typeof value==='function'?value(get()):value);
 const session={activeEvent:{id:'fixture',title:'fixture',illustration:'fixture.webp'},firstNightEvents:{pendingId:null},ambientEventClock:{current:{}},setEncounters:()=>{},setFirstNightEvents:()=>{},setActiveEvent:()=>{},setDiceCheck:()=>{}};
 const controller=view.createEventController(session,{game:state,inventory,storage:INITIAL_STORAGE,life:{housing:'Street'},discoveredLocations:discovered,phoneUnavailable:null,shelterBooked:false,currentId:'street',open:true},{setGame:setter(()=>state,v=>state=v),setInventory:setter(()=>inventory,v=>inventory=v),setMessage:text=>report=text,setInfoModal:()=>{},setEventResultOpen:()=>{},setDiscoveredLocations:setter(()=>discovered,v=>discovered=v),setActiveGoal:()=>{},openPage:()=>{},resultSnapshot:()=>({game:state,inventory,effects:[]}),runWithResult:(_action,run)=>run(),applyAction:state=>state,startFareDodgeTrip:()=>{}});
 controller.applyEventOutcome({message:'fixture',knownLocations:['support','station','unknown']});
 assert(report.includes('You already know about:'),'known-place branch must survive an empty translated name');assert(!report.includes('not sure where to start'));assert.deepEqual(discovered,['support']);
}
console.log('PASS: all 11 location catalogues preserve English copy, numeric hours/travel and empty-name discovery/arrival identities.');

// Location actions keep catalogue copy separate from dispatch and refusal facts.
const oldActions=require('./test-fixtures/location-actions.cjs');
const oldRules=bundled('test-fixtures/location-action-rules.ts');
const {actions:actionsCatalog}=bundled('src/locales/en/actions.ts');
const pseudoActions=Object.fromEntries(Object.entries(actionsCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
for(const [key,message]of Object.entries(actionsCatalog))if(typeof message==='string'&&!message.includes('{')&&(key.startsWith('action.unavailable.')||key.startsWith('action.name.')||key.startsWith('action.description.')))pseudoActions[key]='';
assert.deepEqual(validateCatalog(actionsCatalog,pseudoActions),[]);
const actionsSource=`export {default as LocationScreen} from './src/LocationScreen'; export * from './src/actionText'; export * from './src/locationActionRules'; export * from './src/locationController'; export * from './src/game'; export * from './src/journalIdentity';`;
const actionsBase=bundled({source:actionsSource}),actionsView=bundled({source:actionsSource,catalogs:{actions:pseudoActions}});
for(const old of oldActions){
 const action=actionsBase.actions.find(a=>a.id===old.id);const {name,description,resolve,...mechanics}=old;const {resolve:newResolve,...actual}=action;
 assert.deepEqual(actual,mechanics);assert.equal(actionsBase.actionName(action.id),name);assert.equal(actionsBase.actionDescription(action.id),description);
 for(const state of [{...initialState,hunger:10,thirst:10,health:20},{...initialState,hunger:70,thirst:70,health:90}])assert.deepEqual(newResolve(state),resolve(state));
}
for(const gel of [false,true])for(const cap of [30,70,100]){
 const oldDescription=(gel?`3-in-1 gel: Hygiene gain ×1.5, max ${cap} · uses 1 automatically.`:`Water only: Hygiene max ${Math.min(70,cap)}. Bring 3-in-1 shower gel for better cleaning.`)+(cap<100?` Dirty clothes: Hygiene max ${cap}.`:'');
 assert.equal(actionsBase.showerDescription(gel,cap),oldDescription);
 const oldResult=(gel?'You wash with 3-in-1 shower gel and rinse it off. It helps you get cleaner.':'You rinse off with water only. Shower gel would help you get cleaner.')+(cap<100?` Dirty clothes limit Hygiene to ${cap}. Wash your clothes to raise the limit.`:'');
 assert.equal(actionsBase.showerResult(gel,cap),oldResult);
}
const blockedContexts=new Map();let ruleCases=0;
for(const action of actionsBase.actions)for(let day=1;day<=7;day++)for(const minutes of [0,359,389,390,419,420,479,480,959,960,1079,1080,1139,1140,1199,1200,1229,1230,1319,1320]){
 const current=actionsBase.locations.find(p=>p.id===action.locationId);const game={...comfortableStatus,day,minutes,intoxication:0};
 const context={game,inventory:INITIAL_INVENTORY,life:{housing:'Street'},current,open:actionsBase.isOpen(current,minutes),shelterBooked:true,shelterAdmitted:true};
 for(const patch of [{},{current:actionsBase.locations.find(p=>p.id!==action.locationId)},{shelterBooked:false},{shelterAdmitted:false},{life:{housing:'Street',shelterBlockedUntilDay:20}},{life:{housing:'Street',shelterRegistrationAttemptDay:day},shelterBooked:false},{game:{...game,intoxication:11,money:0}},{inventory:{...INITIAL_INVENTORY,water:4}},{inventory:{...INITIAL_INVENTORY,water:0,medicines:64}},{life:{housing:'Street',shelterDinnerDay:day,shelterBreakfastDay:day,shelterLaundryDropDay:day}}]){
  const ctx={...context,...patch};const old=oldRules.locationActionUnavailable(action,ctx);assert.equal(actionsBase.locationActionUnavailable(action,ctx),old);
  assert.equal(actionsView.locationActionUnavailable(action,ctx)===null,old===null,'translated refusal cannot change availability');
  const block=actionsView.locationActionBlock(action,ctx);if(block&&!blockedContexts.has(block.id))blockedContexts.set(block.id,{action,context:ctx});ruleCases++;
 }
}
assert.equal(blockedContexts.size,22,'all static and parameterised refusal reasons exercised');
function executeLocation(view,action,context,randomValue=0.1){
 let game=JSON.parse(JSON.stringify(context.game)),inventory={...context.inventory},life={...context.life},effects=[];const log=[];let draws=0;
 const setter=(get,set)=>value=>set(typeof value==='function'?value(get()):value);const random=Math.random;Math.random=()=>{draws++;return randomValue;};
 try{
  const controller=view.createLocationController({...context,game,inventory,life,activeEvent:false,shelterQueue:false,hygieneLimit:55},{
   setGame:setter(()=>game,v=>game=v),setInventory:setter(()=>inventory,v=>inventory=v),setLife:setter(()=>life,v=>life=v),setEffects:setter(()=>effects,v=>effects=v),setMessage:()=>{},laundryCleanAt:{current:0},
   runWithResult:(identity,run)=>{log.push(['result',identity.id,view.journalPresentation(identity).groupId]);run();},resultSnapshot:()=>({game,inventory,effects}),applyAction:(state,result)=>view.applyAction(state,result),moodContext:()=>({housing:'Street'}),
   beginShelterInterview:()=>log.push(['interview']),prepareShelterAction:id=>{log.push(['prepare',id]);return false;},requestSleep:kind=>log.push(['sleep',kind]),finishRestAction:(id,_name,result)=>{const {message,...numbers}=result;log.push(['rest',id,numbers]);return false;},finishLocationPhoneCharge:id=>log.push(['charge',id])
  },{observeFirstNight:()=>false,observeOrdinaryEvent:(_type,_game,_mode,facts)=>log.push(['observe',facts])});
  controller.act(action.id);return {game,inventory,life,effects,draws,log};
 }finally{Math.random=random;}
}
for(const {action,context}of blockedContexts.values()){
 const expected=executeLocation(actionsBase,action,context),actual=executeLocation(actionsView,action,context);
 assert.deepEqual(actual,expected);assert.equal(actual.draws,0);assert.deepEqual(actual.game,context.game);assert.deepEqual(actual.inventory,context.inventory);assert.equal(actual.log.length,1,'empty translated refusal stops before mechanics and RNG');
}
for(const action of actionsBase.actions)for(const gel of [0,1])for(const random of [0.1,0.99]){
 const current=actionsBase.locations.find(p=>p.id===action.locationId),game={...comfortableStatus,mood:40,minutes:1140};
 const context={game,inventory:{...INITIAL_INVENTORY,showerGel:gel},life:{housing:'Street'},current,open:true,shelterBooked:true,shelterAdmitted:true};
 assert.deepEqual(executeLocation(actionsView,action,context,random),executeLocation(actionsBase,action,context,random));
}
console.log(`PASS: ${oldActions.length} action definitions/outcomes, whole shower messages, ${ruleCases} legacy-rule cases and 22 empty-refusal controller guards preserve mechanics/RNG/History IDs.`);

// Whole controller messages preserve exact copy and all domain command ports.
const {controllerActions:controllerCatalog}=bundled('src/locales/en/controllerActions.ts');
const pseudoControllers=Object.fromEntries(Object.entries(controllerCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
for(const[key,message]of Object.entries(controllerCatalog))if(typeof message==='string'&&!message.includes('{'))pseudoControllers[key]='';
assert.deepEqual(validateCatalog(controllerCatalog,pseudoControllers),[]);
const controllerExports=`export * from './src/game'; export * from './src/inventory'; export * from './src/results'; export * from './src/journalIdentity';`;
const controllerSource=controllerExports+`export * from './src/streetController'; export * from './src/supportWorkController'; export * from './src/medicalController';`;
const controllerBase=bundled({source:controllerSource});
const controllerPseudo=bundled({source:controllerSource,catalogs:{controllerActions:pseudoControllers}});
const controllerLegacy=bundled({source:controllerExports+`export * from './test-fixtures/streetController-copy'; export * from './test-fixtures/supportWorkController-copy'; export * from './test-fixtures/medicalController-copy';`});
const copyCases=[];
for(const roll of [0,.349999,.35,.649999,.65,.849999,.85,.959999,.96,.999999])copyCases.push({domain:'street',method:'askForMoney',roll});
for(const patch of [{activeEvent:true},{game:{locationId:'station'}},{begging:{day:3,attempts:3}},{begging:{day:2,attempts:3}}])copyCases.push({domain:'street',method:'askForMoney',patch});
for(const withMusic of [false,true])for(const patch of [{},{activeEvent:true},{sleeping:true},{trip:true},{infoModal:true},{game:{locationId:'station'}},{musicWalkUsed:true},{mobileServiceActive:false},{inventory:{phoneCondition:0}},{inventory:{phoneBattery:1.99999}},{inventory:{phoneBattery:2}},{musicOn:true}])copyCases.push({domain:'street',method:'walkCity',args:[withMusic],patch});
for(const kind of ['find-bench','bench-rest','bench-sleep'])for(const roll of [.699999,.7])for(const patch of [{},{streetBenchFound:true},{activeEvent:true},{game:{locationId:'station'}}])copyCases.push({domain:'street',method:'streetAction',args:[kind],roll,patch});
for(const kind of ['housing','documents','transport','benefits'])for(const carried of [false,true])for(const stored of [false,true])for(const referral of [false,true])copyCases.push({domain:'support',method:'socialSupport',args:[kind],patch:{inventory:{documents:carried},storage:{documents:stored},life:{schroniskoReferral:referral}}});
for(const kind of ['housing','documents','transport','benefits'])for(const patch of [{open:false},{game:{locationId:'street'}}])copyCases.push({domain:'support',method:'socialSupport',args:[kind],patch});
for(const dayWorkEnergyRequired of [35,55])for(const energy of [34.999,35,54.999,55,100])for(const day of [2,3,4])copyCases.push({domain:'support',method:'takeDayWork',patch:{dayWorkEnergyRequired,game:{locationId:'work',day,energy,minutes:780}}});
for(const patch of [{open:false,game:{locationId:'work'}},{game:{locationId:'support'}}])copyCases.push({domain:'support',method:'takeDayWork',patch});
for(const patch of [{},{activeEvent:true},{open:false},{inventory:{documents:false}},{game:{locationId:'street'}},{game:{health:99}}])copyCases.push({domain:'medical',method:'hospitalVisit',patch});
for(const roll of [0,.199999,.2,.4,.6,.8,.999999])copyCases.push({domain:'medical',method:'callAmbulance',roll,patch:{game:{health:20}}});
for(const patch of [{activeEvent:true},{shelterPhoneCharging:true},{game:{health:21}},{inventory:{phoneBattery:0}},{inventory:{phoneCondition:0}},{inventory:{phoneBattery:.1,phoneCondition:1}}])copyCases.push({domain:'medical',method:'callAmbulance',patch:{...patch,game:{health:20,...patch.game}}});
function executeController(view,test,accepted=true){
 const patch=test.patch??{};
 const state={game:{...initialState,day:3,minutes:780,money:100,hunger:70,thirst:70,energy:70,health:90,mood:35,locationId:test.domain==='medical'?'hospital':test.domain==='support'?'support':'street',rainSystemStarted:true,rainScheduleDay:3,nextRainAt:999999,...patch.game},inventory:{...INITIAL_INVENTORY,phoneCondition:100,phoneBattery:80,...patch.inventory},storage:{...INITIAL_STORAGE,...patch.storage},life:{housing:'Street',employment:'Unemployed',income:'None',...patch.life},effects:[{id:'cold',expiresAt:10000}],discoveredLocations:[],begging:patch.begging??{day:3,attempts:0},musicWalkUsed:patch.musicWalkUsed??false,rainChoice:true,streetBenchFound:patch.streetBenchFound??false,screen:'phone',trip:{remaining:1},selectedDestination:'shop',message:'',infoModal:null,results:[],ports:[],draws:0};
 const setter=key=>value=>{state.ports.push([key]);state[key]=typeof value==='function'?value(state[key]):value;};
 const snapshot=()=>JSON.parse(JSON.stringify({game:state.game,inventory:state.inventory,effects:state.effects,housing:state.life.housing}));
 const host={setGame:(value,housing)=>{state.ports.push(['game',housing??null]);state.game=view.limitMood(typeof value==='function'?value(state.game):value,{housing:housing??state.life.housing,effects:state.effects});},setInventory:setter('inventory'),setEffects:setter('effects'),setLife:setter('life'),setDiscoveredLocations:setter('discoveredLocations'),setMessage:setter('message'),setScreen:setter('screen'),setTrip:setter('trip'),setSelectedDestination:setter('selectedDestination'),setBegging:setter('begging'),setMusicWalkUsed:setter('musicWalkUsed'),setRainChoice:setter('rainChoice'),setStreetBenchFound:setter('streetBenchFound'),setInfoModal:setter('infoModal'),requestSleep:kind=>state.ports.push(['sleep',kind]),resultSnapshot:snapshot,applyAction:(game,result)=>view.applyAction(game,result,{housing:state.life.housing,effects:state.effects}),moodContext:()=>({housing:state.life.housing,effects:state.effects}),runWithResult:(action,run)=>{state.ports.push(['result',action.id]);if(!accepted)return;const before=snapshot(),facts=run(),summary=view.summarizeResult(before,snapshot()),identity={...action,...(facts?{actionHistory:facts}:{})};const journal=view.journalPresentation(identity,summary);state.results.push({id:action.id,title:action.title,facts,summary,journal});}};
 const queue={observeFirstNight:()=>{state.ports.push(['firstNight']);return false;},observeOrdinaryEvent:(trigger,_state,mode,facts)=>state.ports.push(['encounter',trigger,mode??null,facts??null])};
 const context={...state,currentId:state.game.locationId,open:true,activeEvent:false,sleeping:false,trip:false,infoModal:false,mobileServiceActive:true,musicOn:false,shelterPhoneCharging:false,dayWorkEnergyRequired:55,...patch,game:state.game,inventory:state.inventory,storage:state.storage,life:state.life,begging:state.begging};
 const random=Math.random;Math.random=()=>{state.draws++;return test.roll??0.5;};
 try{const controller=test.domain==='medical'?view.createMedicalController(context,host):test.domain==='support'?view.createSupportWorkController(context,host):view.createStreetController(context,host,queue);controller[test.method](...(test.args??[]));return state;}finally{Math.random=random;}
}
function commandMechanics(state){
 const{message,infoModal,results,...mechanics}=state;
 return {...mechanics,infoModal:infoModal?{illustration:infoModal.illustration,batteryInSummary:infoModal.batteryInSummary}:null,results:results.map(({title,journal,...result})=>({...result,journal:{decisionId:journal.decisionId,groupId:journal.groupId}}))};
}
for(const test of copyCases){
 const legacy=executeController(controllerLegacy,test),actual=executeController(controllerBase,test),translated=executeController(controllerPseudo,test);
 assert.deepEqual(actual,legacy,`English controller parity: ${test.domain}/${test.method}`);
 assert.deepEqual(commandMechanics(translated),commandMechanics(actual),`pseudo controller mechanics: ${test.domain}/${test.method}`);
 const rejected=executeController(controllerPseudo,test,false);assert.equal(rejected.draws,0);assert.equal(rejected.results.length,0);assert(rejected.ports.every(port=>port[0]==='result'),'result guard rejects before controller updates');
}
assert.equal(t('controller.medical.emergency.treated',{hours:4}),'You call an ambulance. Emergency staff stabilise your condition without requiring documents. About 4 hours pass.');
console.log(`PASS: ${copyCases.length} frozen/pseudo street, support/work and medical scenarios preserve English reports, ordered ports, costs, RNG, effects, decisions/groups and result rejection.`);

// Shelter copy has no authority over bookings, queues, attendance or guards.
const {shelter:shelterCatalog}=bundled('src/locales/en/shelter.ts');
const pseudoShelter=Object.fromEntries(Object.entries(shelterCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
for(const[key,message]of Object.entries(shelterCatalog))if(typeof message==='string'&&!message.includes('{'))pseudoShelter[key]='';
assert.deepEqual(validateCatalog(shelterCatalog,pseudoShelter),[]);
const shelterShared=`export * from './src/game'; export * from './src/results'; export * from './src/journalIdentity';`;
const shelterSource=shelterShared+`export * from './src/shelterController'; export * from './src/shelterRules'; export {default as ShelterQueueDialog} from './src/ShelterQueueDialog'; export * from './src/ShelterCheckoutDialog'; export {default as App} from './src/App';`;
const shelterBase=bundled({source:shelterSource}),shelterView=bundled({source:shelterSource,catalogs:{shelter:pseudoShelter}});
const shelterLegacy=bundled({source:shelterShared+`export * from './test-fixtures/shelterController-copy'; export * from './test-fixtures/shelterRules-copy'; export {default as ShelterQueueDialog} from './test-fixtures/ShelterQueueDialog-copy'; export * from './test-fixtures/ShelterCheckoutDialog-copy';`});
let auditCases=0;
for(const day of [2,3,7,30,31,32,60,61])for(const misses of [0,1,2,3])for(const last of [day-2,day-1])for(const audited of [day-3,day-1]){
 const life={housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:70,shelterLastStayDay:last,shelterAuditDay:audited,shelterMisses:misses,shelterMissMonth:0};
 assert.deepEqual(shelterBase.shelterAttendance(life,day),shelterLegacy.shelterAttendance(life,day));
 const translated=shelterView.shelterAttendance(life,day),expected=shelterBase.shelterAttendance(life,day);assert.deepEqual(translated.life,expected.life);assert.equal(translated.message===undefined,expected.message===undefined);
 assert.deepEqual(shelterView.shelterAttendance(translated.life,day).life,translated.life,'replayed attendance is idempotent');auditCases++;
}
const shelterCases=[];
for(const day of [2,30,31,60])for(const minute of [480,481,1079,1080])for(const strikes of [0,1,2])shelterCases.push({method:'recordShelterDeparture',args:['street'],patch:{game:{day,minutes:minute},life:{shelterStrikes:strikes,shelterUntilDay:day}}});
shelterCases.push({method:'recordShelterDeparture',args:['shelter']});
for(const shelterCheckoutDue of [false,true])for(const departureBlocked of [false,true])shelterCases.push({method:'startShelterDeparture',patch:{shelterCheckoutDue,departureBlocked,game:{minutes:450}}});
for(const shelterPhoneCharging of [false,true])for(const shelterBooked of [false,true])shelterCases.push({method:'completeShelterDeparture',repeat:true,patch:{shelterPhoneCharging,shelterBooked,shelterDeparture:{day:2,startAbsolute:1890},game:{minutes:480}}});
shelterCases.push({method:'completeShelterDeparture'});
for(const vacancies of [0,1,2,3])for(const peopleAhead of [0,1,2,3])shelterCases.push({method:'completeShelterQueue',repeat:true,patch:{shelterQueue:{day:2,total:20,remaining:0,arrivalMinute:1020,joinedAt:1100,vacancies,peopleAhead}}});
shelterCases.push({method:'completeShelterQueue'});
for(const step of ['reason','action'])for(const value of ['work','documents','health','nothing'])shelterCases.push({method:'answerShelterInterview',args:[value],patch:{shelterInterview:{step}}});
for(const renewals of [0,1,2,4])for(const progress of ['none','work','referral','documents'])for(const value of ['jobcenter','daywork','documents','benefits','nothing','unknown'])shelterCases.push({method:'answerShelterInterview',args:[value],patch:{life:{shelterRenewals:renewals,...(progress==='work'?{employment:'Day work'}:progress==='referral'?{schroniskoReferral:true}:{})},shelterInterview:{step:'plan',action:progress==='documents'?'documents':'nothing'}}});
for(let day=1;day<=7;day++)for(const minute of [959,960,1199,1200])for(const booked of [false,true])shelterCases.push({method:'beginShelterInterview',patch:{game:{day,minutes:minute},life:{shelterUntilDay:booked?20:0}}});
for(const id of ['shelter-dinner','shelter-breakfast','shelter-laundry-drop','shelter-laundry-pickup','shelter-rest','unknown'])for(const day of [2,4,5])for(const minute of [389,390,419,420,479,480,1079,1080,1139,1140,1229,1230,1319,1320])for(const used of [false,true])shelterCases.push({method:'prepareShelterAction',args:[id],patch:{game:{day,minutes:minute},life:{shelterUntilDay:0,...(used?{shelterDinnerDay:day,shelterBreakfastDay:day,shelterLaundryDropDay:day,shelterRegistrationAttemptDay:day}:{})}}});
for(const cached of [false,true])for(const arrivalDay of [1,2])for(const minute of [1020,1080,1100,1120])for(const roll of [0,.5,.999999])shelterCases.push({method:'prepareShelterAction',args:['shelter-rest'],roll,patch:{game:{minutes:minute},life:{shelterUntilDay:0,...(cached?{shelterVacancyDay:2,shelterVacancies:2}:{})},shelterArrival:{day:arrivalDay,minute:1020}}});
shelterCases.push({method:'prepareShelterAction',args:['shelter-rest'],patch:{life:{shelterBlockedUntilDay:31}}});
for(const remaining of [0,1,20])for(const minutes of [0,1,25])shelterCases.push({method:'tickShelterQueue',args:[minutes],patch:{shelterQueue:{day:2,total:20,remaining,arrivalMinute:1020,joinedAt:1100,vacancies:2,peopleAhead:0}}});
function executeShelter(view,test,accepted=true){
 const patch=test.patch??{};const state={game:{...initialState,day:2,minutes:1100,money:100,mood:35,locationId:'shelter',rainSystemStarted:true,rainScheduleDay:2,nextRainAt:999999,...patch.game},life:{housing:'Night shelter',employment:'Unemployed',income:'None',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1,...patch.life},shelterQueue:patch.shelterQueue??null,shelterArrival:patch.shelterArrival??null,shelterDeparture:patch.shelterDeparture??null,shelterInterview:patch.shelterInterview??null,musicOn:true,phoneOpen:true,shelterPhoneCharging:patch.shelterPhoneCharging??false,selectedDestination:'shop',screen:'phone',activeGoal:{type:'night-shelter',day:2,minute:1080},message:'',ports:[],results:[],draws:0,returned:[]};
 const setter=key=>value=>{state.ports.push([key]);state[key]=typeof value==='function'?value(state[key]):value;};
 const snapshot=()=>JSON.parse(JSON.stringify({game:state.game,inventory:INITIAL_INVENTORY,effects:[],housing:state.life.housing}));
 const host={setGame:(value,housing)=>{state.ports.push(['game',housing??null]);state.game=view.limitMood(typeof value==='function'?value(state.game):value,{housing:housing??state.life.housing});},setLife:setter('life'),setMessage:setter('message'),setMusicOn:setter('musicOn'),setPhoneOpen:setter('phoneOpen'),setShelterPhoneCharging:setter('shelterPhoneCharging'),setSelectedDestination:setter('selectedDestination'),setScreen:setter('screen'),setActiveGoal:setter('activeGoal'),applyAction:(game,result)=>view.applyAction(game,result,{housing:state.life.housing}),moodContext:(_game,housing)=>({housing:housing??state.life.housing}),requestSleep:kind=>state.ports.push(['sleep',kind]),resultSnapshot:snapshot,runWithResult:(identity,run,before=snapshot(),...flags)=>{state.ports.push(['result',identity.id,flags]);if(!accepted)return;run();const summary=view.summarizeResult(before,snapshot());state.results.push({...identity,journal:view.journalPresentation(identity,summary),summary});}};
 const lastQueue={current:null},lastDeparture={current:null},vacancyRoll=new Map();
 const session={shelterQueue:state.shelterQueue,shelterArrival:state.shelterArrival,shelterDeparture:state.shelterDeparture,shelterInterview:state.shelterInterview,setShelterQueue:setter('shelterQueue'),setShelterArrival:setter('shelterArrival'),setShelterDeparture:setter('shelterDeparture'),setShelterInterview:setter('shelterInterview'),lastQueue,lastDeparture,rollVacancies:day=>{if(!vacancyRoll.has(day))vacancyRoll.set(day,Math.floor(Math.random()*4));return vacancyRoll.get(day);}};
 const context={game:state.game,life:state.life,current:{id:state.game.locationId},shelterCheckoutDue:true,departureBlocked:false,shelterPhoneCharging:state.shelterPhoneCharging,shelterBooked:true,...patch,game:state.game,life:state.life};
 const random=Math.random;Math.random=()=>{state.draws++;return test.roll??.5;};
 try{const controller=view.createShelterController(session,context,host);state.returned.push(controller[test.method](...(test.args??[])));if(test.repeat)state.returned.push(controller[test.method](...(test.args??[])));state.queueGuard=!!lastQueue.current;state.departureGuard=!!lastDeparture.current;return state;}finally{Math.random=random;}
}
function shelterMechanics(state){const{message,results,...mechanics}=state;return{...mechanics,results:results.map(({title,journal,...result})=>({...result,journal:{decisionId:journal.decisionId,groupId:journal.groupId}}))};}
for(const test of shelterCases){
 const old=executeShelter(shelterLegacy,test),actual=executeShelter(shelterBase,test),translated=executeShelter(shelterView,test);
 assert.deepEqual(actual,old,`shelter frozen parity: ${test.method}`);assert.deepEqual(shelterMechanics(translated),shelterMechanics(actual),`shelter pseudo mechanics: ${test.method}`);
 if(test.repeat)assert.equal(actual.results.length,1,'replayed completion applies only once');
 if(['completeShelterQueue','completeShelterDeparture','answerShelterInterview'].includes(test.method)){const rejected=executeShelter(shelterView,test,false);assert.equal(rejected.draws,0);assert.equal(rejected.results.length,0);assert(rejected.ports.every(port=>port[0]==='result'));}
}
console.log(`PASS: ${auditCases} attendance and ${shelterCases.length} frozen/pseudo shelter scenarios preserve bookings, eligibility, deadlines, RNG/priority, extensions, History and once-only queue/checkout.`);

const {sleep:sleepCatalog}=bundled('src/locales/en/sleep.ts');
const pseudoSleep=Object.fromEntries(Object.entries(sleepCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
for(const[key,message]of Object.entries(sleepCatalog))if(typeof message==='string'&&!message.includes('{'))pseudoSleep[key]='';
assert.deepEqual(validateCatalog(sleepCatalog,pseudoSleep),[]);
const sleepShared=`export {absoluteMinutes,formatTravelTime} from './src/gameTime'; export * from './src/game'; export * from './src/results'; export * from './src/journalIdentity';`;
const sleepSource=sleepShared+`export * from './src/sleepController'; export * from './src/sleepRules'; export * from './src/sleepText'; export {default as SleepPlanningDialog} from './src/SleepPlanningDialog'; export {default as SleepProgressDialog} from './src/SleepProgressDialog'; export {default as App} from './src/App';`;
const sleepBase=bundled({source:sleepSource}),sleepView=bundled({source:sleepSource,catalogs:{sleep:pseudoSleep}});
const sleepLegacy=bundled({source:sleepShared+`export * from './test-fixtures/sleepController-copy'; export * from './test-fixtures/sleepRules-copy'; export {default as SleepPlanningDialog} from './test-fixtures/SleepPlanningDialog-copy'; export {default as SleepProgressDialog} from './test-fixtures/SleepProgressDialog-copy';`});
for(const energy of [0,25,25.01,50,50.01,75,75.01,100])for(const hours of [1,2,4,6,8,10]){
 assert.equal(sleepBase.sleepUnavailableReason(hours,energy),sleepLegacy.sleepDurationUnavailable(hours,energy));
 assert.equal(sleepView.sleepUnavailableReason(hours,energy)===null,sleepBase.sleepDurationBlock(hours,energy)===null);
}
for(const total of [0,30,60,90,120,450,480])for(const wet of [false,true])for(const ill of [false,true]){
 const hours=total/60,duration=Number.isInteger(hours)?`${hours} hour${hours===1?'':'s'}`:sleepBase.formatTravelTime(total);
 assert.equal(sleepBase.sleepCompletionText(total,wet,ill),`You slept for ${duration}.${wet?' Wet clothes made it harder to rest.':''}${ill?' Your throat feels sore, your nose is blocked, and a chill runs through you as you sit up. You feel unwell — you have caught a cold.':''}`);
}
const sleepCases=[];
for(const kind of ['ground','bench','shelter','residential']){
 for(const energy of [0,25,50,75,76,100])for(const hours of [2,4,6,8])sleepCases.push({method:'sleep',args:[hours,kind],kind,patch:{game:{energy}}});
 for(const blocked of [false,true])for(const choice of [null,'ground'])sleepCases.push({method:'requestSleep',args:[kind],kind,patch:{blocked,sleepChoice:choice}});
 for(const total of [30,60,90,120,450,480])for(const cold of [false,true])for(const fed of [false,true])for(const roll of [0,.99])sleepCases.push({method:'finishSleep',kind,total,repeat:true,roll,patch:{game:{hunger:fed?80:0,thirst:fed?80:0},effects:cold?[{id:'cold',expiresAt:10000}]:[]}});
 sleepCases.push({method:'forceSleep',kind,repeat:true},{method:'tickSleep',kind});
}
for(const kind of ['ground','bench'])for(const roll of [0,.99])sleepCases.push({method:'finishSleep',kind,total:480,repeat:true,roll,patch:{game:{day:1,minutes:1320}}});
for(const kind of ['ground','bench','shelter','residential'])for(const method of ['requestSleep','sleep'])sleepCases.push({method,kind,args:method==='sleep'?[8,kind]:[kind],patch:{game:{locationId:'shop'},insideNightShelter:false,streetBenchFound:false}});
for(const locationId of ['shop','station','shelter','residential-shelter'])sleepCases.push({method:'forceSleep',kind:'ground',repeat:true,patch:{game:{locationId}}});
for(const id of ['street-sleep','shelter-rest','other'])for(const minutes of [60,480])sleepCases.push({method:'finishRestAction',args:[id,'Frozen action',{minutes},initialState],kind:'ground'});
for(const id of ['quiet-night','night-theft','first-night-bench-wake'])sleepCases.push({method:'presentWakeEvent',args:[STREET_EVENTS.find(event=>event.id===id),'Frozen wake','Frozen completion'],kind:'ground'});
function executeSleep(view,test,accepted=true){
 const now=Date.now;Date.now=()=>1800000000000;
 const patch=test.patch??{},total=test.total??120,kind=test.kind;
 const locationId=kind==='bench'?'station':kind==='shelter'?'shelter':kind==='residential'?'residential-shelter':'street';
 const state={game:{...initialState,day:2,minutes:420,energy:25,health:90,mood:25,locationId,rainSystemStarted:true,rainScheduleDay:2,nextRainAt:999999,sleepIllnessDose:1,sleepIllnessMinutes:total,...patch.game},life:{housing:'Street'},effects:patch.effects??[],sleeping:null,sleepChoice:patch.sleepChoice??null,sleepHours:8,infoModal:null,message:'',musicOn:true,trip:{id:'fixture'},selectedDestination:'shop',phoneOpen:true,screen:'phone',encounters:{seen:[],pendingId:null},activeEvent:null,ports:[],results:[],draws:0,returned:[]};
 const snapshot=()=>JSON.parse(JSON.stringify({game:state.game,inventory:INITIAL_INVENTORY,effects:state.effects,housing:state.life.housing}));
 const setter=key=>value=>{state.ports.push([key]);state[key]=typeof value==='function'?value(state[key]):value;};
 const sleeping={kind,total,remaining:0,startAbsolute:view.absoluteMinutes(state.game),realStartedAt:Date.now()-6000,realWakeAt:Date.now()+6000,before:snapshot()};
 if(['finishSleep','tickSleep'].includes(test.method))state.sleeping=sleeping;
 const session={sleeping:state.sleeping,sleepChoice:state.sleepChoice,setSleeping:setter('sleeping'),setSleepChoice:setter('sleepChoice'),setSleepHours:setter('sleepHours'),lastFinishedSleep:{current:null},groundSleepWindow:{current:null},forcedSleep:{current:null}};
 const events={firstNightEvents:{seen:[]},encounters:state.encounters,setEncounters:setter('encounters'),setActiveEvent:setter('activeEvent')};
 const queue={encounterDue:()=>true,rememberEncounter:(event,game)=>state.ports.push(['encounter',event.id,view.absoluteMinutes(game??state.game)]),rememberFirstNightEvent:(event,game)=>state.ports.push(['firstNight',event.id,view.absoluteMinutes(game)])};
 const context={game:state.game,inventory:INITIAL_INVENTORY,effects:state.effects,current:{id:state.game.locationId},weather:{id:'Cloudy'},underRainCover:false,insideNightShelter:kind==='shelter',streetBenchFound:true,blocked:false,...patch,game:state.game,effects:state.effects};
 const host={...Object.fromEntries(['game','life','effects','message','infoModal','musicOn','trip','selectedDestination','phoneOpen','screen'].map(key=>['set'+key[0].toUpperCase()+key.slice(1),setter(key)])),recordShelterDeparture:id=>state.ports.push(['departure',id]),moodContext:()=>({housing:state.life.housing,effects:state.effects}),applyAction:(game,result)=>view.applyAction(game,result,{housing:state.life.housing,effects:state.effects}),resultSnapshot:snapshot,runWithResult:(action,run,before=snapshot(),...flags)=>{state.ports.push(['result',action.id,flags]);if(!accepted)return;const facts=run(),summary=view.summarizeResult(before,snapshot()),identity={...action,...(facts?{actionHistory:facts}:{})};state.results.push({...action,facts,summary,journal:view.journalPresentation(identity,summary)});}};
 const random=Math.random;Math.random=()=>{state.draws++;return test.roll??.99;};
 try{
  const controller=view.createSleepController(session,events,queue,context,host),args=test.method==='finishSleep'?[sleeping]:test.args??[];
  state.returned.push(controller[test.method](...args));if(test.repeat)state.returned.push(controller[test.method](...args));
  for(const hours of [2,4,6,8]){const expected=sleepLegacy.createSleepController(session,events,queue,context,host).wakeLabel(hours,kind);if(controller.wakeTime){const wake=controller.wakeTime(hours,kind);if(view===sleepBase)assert.equal(view.sleepDateLabel(wake.day,wake.minutes),expected);}}
  state.guards={finished:!!session.lastFinishedSleep.current,forced:!!session.forcedSleep.current,window:session.groundSleepWindow.current};return state;
 }finally{Math.random=random;Date.now=now;}
}
function sleepMechanics(state){const{message,infoModal,results,...mechanics}=state;return{...mechanics,infoModal:infoModal?{illustration:infoModal.illustration}:null,results:results.map(({title,journal,...result})=>({...result,journal:{decisionId:journal.decisionId,groupId:journal.groupId}}))};}
for(const test of sleepCases){
 const old=executeSleep(sleepLegacy,test),actual=executeSleep(sleepBase,test),translated=executeSleep(sleepView,test);
 assert.deepEqual(actual,old,`sleep frozen parity: ${test.method}/${test.kind}/${test.total}`);assert.deepEqual(sleepMechanics(translated),sleepMechanics(actual),`sleep pseudo mechanics: ${test.method}`);
 if(test.method==='finishSleep'){assert.equal(actual.results.length,1);const rejected=executeSleep(sleepView,test,false);assert.equal(rejected.draws,0);assert.equal(rejected.results.length,0);}
}
console.log(`PASS: ${sleepCases.length} frozen/pseudo sleep commands preserve eligibility, fatigue, dates/cutoff, forced sleep, recovery/illness, RNG, wake scenes, History and once-only guards.`);

const {rain:rainCatalog}=bundled('src/locales/en/rain.ts');
const pseudoRain=Object.fromEntries(Object.keys(rainCatalog).map(key=>[key,'']));
assert.deepEqual(validateCatalog(rainCatalog,pseudoRain),[]);
const rainShared=`export * from './src/game'; export * from './src/inventory';`;
const rainSource=rainShared+`export * from './src/rain'; export * from './src/rainText'; export * from './src/useRainController'; export {default as RainEventDialog} from './src/RainEventDialog'; export {default as App} from './src/App';`;
const rainBase=bundled({source:rainSource}),rainView=bundled({source:rainSource,catalogs:{rain:pseudoRain}});
const rainLegacy=bundled({source:rainShared+`export * from './test-fixtures/rain-copy'; export * from './test-fixtures/useRainController-copy'; export {default as RainEventDialog} from './test-fixtures/RainEventDialog-copy';`});
function rainFixture(level='rain',patch={}){return{id:'rain:2040',level,start:2040,end:2100,choice:null,searchRemaining:0,protection:.5,shelter:level==='rain'?'tree':'canopy',exposure:40,energyLoss:4.44,moodLoss:2.55,waited:30,coldRoll:.99,...patch};}
let rainRuleCases=0;
for(const level of ['drizzle','rain','downpour']){
 const {title,text,...numbers}=rainLegacy.RAIN[level];assert.deepEqual(rainBase.RAIN[level],numbers);assert.deepEqual(rainView.RAIN[level],numbers);assert.deepEqual(rainBase.rainOpening(level),{title,text});
 for(const choice of [null,'nearby','proper','continue'])for(const searchRemaining of [0,1,5])for(const newlyCold of [false,true]){
  const rain=rainFixture(level,{choice,searchRemaining});assert.equal(rainBase.rainResultText(rain,newlyCold),rainLegacy.rainResultText(rain)+(newlyCold?' A chill lingers, and your throat feels sore. You have caught a cold.':''));
  const actionId=choice==='proper'&&searchRemaining>0?'rain-stopped':choice==='continue'?'rain-passed':'rain-cover';assert.equal(rainBase.rainResultActionId(rain),actionId);assert.equal(rainView.rainResultActionId(rain),actionId);assert.equal(rainView.rainResultText(rain,newlyCold),'');rainRuleCases++;
 }
 for(const exposure of [0,20,21,40,60,100])assert.equal(rainBase.rainRisk(rainFixture(level,{exposure})),rainLegacy.rainRisk(rainFixture(level,{exposure})));
}
for(const day of [1,2,5,6,7])for(const minutes of [0,600,1439])for(const limit of [0,1,Infinity])for(const roll of [0,.5,.99999]){
 const state={day,minutes,rainSystemStarted:true,nextRainAt:1440*day+10};
 for(const patch of [{},{rain:rainFixture('rain',{start:(day-1)*1440-5,end:(day-1)*1440+5})},{rainResults:[rainFixture('drizzle',{start:(day-1)*1440-5,end:(day-1)*1440+5})]}]){const input=Object.freeze({...state,...patch});assert.deepEqual(rainBase.planRainDay(input,limit,()=>roll),rainLegacy.planRainDay(input,limit,()=>roll));rainRuleCases++;}
 const created=rainBase.createRain((day-1)*1440+minutes,()=>roll);assert.deepEqual(created,rainLegacy.createRain((day-1)*1440+minutes,()=>roll));assert(rainBase.validRain(created));
 for(const choice of ['nearby','proper','continue'])assert.deepEqual(rainBase.chooseRain(created,choice,created.start,'street',()=>roll),rainLegacy.chooseRain(created,choice,created.start,'street',()=>roll));
}
console.log(`PASS: ${rainRuleCases} rain copy/result/schedule cases preserve numeric RAIN data, domain action IDs, whole Cold messages, carried episodes and RNG boundaries.`);

const travelSource=`export * from './src/travelPhases'; export * from './src/travelText'; export {default as TravelPlanningDialog} from './src/TravelPlanningDialog';`;
const travelBase=bundled({source:travelSource});
const travelOld=bundled({source:`export * from './test-fixtures/travelPhases-copy'; export {default as TravelPlanningDialog} from './test-fixtures/TravelPlanningDialog-copy';`});
const {travel:travelCatalog}=bundled('src/locales/en/travel.ts');
const pseudoTravel=Object.fromEntries(Object.entries(travelCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
assert.deepEqual(validateCatalog(travelCatalog,pseudoTravel),[]);
const travelView=bundled({source:travelSource,catalogs:{travel:pseudoTravel}});
let travelPhases=0;
for(const mode of ['walk','transit','fare-dodge'])for(let total=1;total<=180;total++)for(let remaining=0;remaining<=total;remaining++)for(const method of ['getTravelPhase','getTravelDisplayPhase']){
 const trip={mode,total,remaining},old=travelOld[method](trip),actual=travelBase[method](trip),translated=travelView[method](trip);
 assert.deepEqual({label:travelBase.travelPhaseLabel(actual.id),walking:actual.walking,exposure:actual.exposure},old);assert.deepEqual(translated,actual);travelPhases++;
}
console.log(`PASS: ${travelPhases} travel simulation/display phases preserve timing, walking/exposure and English labels under pseudo-copy.`);

const eventSource=`export * from './src/events'; export * from './src/game'; export * from './src/inventory'; export * from './src/eventController';`;
const eventBase=bundled({source:eventSource});const eventOld=bundled({source:`export * from './src/events'; export * from './src/game'; export * from './src/inventory'; export * from './test-fixtures/eventController-copy';`});
const {eventController:eventCatalog}=bundled('src/locales/en/eventController.ts');
const eventPseudo=Object.fromEntries(Object.entries(eventCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
const eventView=bundled({source:eventSource,catalogs:{eventController:eventPseudo}});
function executeEventCopy(view,outcome,condition=100,mutated=false){
 const state={game:{...initialState,day:2,minutes:600},inventory:{...INITIAL_INVENTORY,phoneCondition:condition},message:'',infoModal:null,encounters:{pendingId:'borrow-phone-slip'},firstNightEvents:{pendingId:'borrow-phone-slip'},discoveredLocations:['support'],activeGoal:null,eventResultOpen:false,ports:[]};
 const setter=key=>value=>{state[key]=typeof value==='function'?value(state[key]):value;};
 const session={activeEvent:{id:'borrow-phone-slip',title:'Frozen event',illustration:'/fixture.webp'},setActiveEvent:()=>{},diceCheck:null,setDiceCheck:()=>{},firstNightEvents:state.firstNightEvents,setFirstNightEvents:setter('firstNightEvents'),setEncounters:setter('encounters'),ambientEventClock:{current:{}},claimDice:()=>true};
 const host={...Object.fromEntries(['game','inventory','message','infoModal','discoveredLocations','activeGoal','eventResultOpen'].map(key=>['set'+key[0].toUpperCase()+key.slice(1),setter(key)])),openPage:id=>state.ports.push(id),resultSnapshot:()=>({game:state.game,inventory:state.inventory,effects:[]}),runWithResult:(action,run)=>{state.action=action;run();},applyAction:(game,action)=>view.applyAction(game,action),startFareDodgeTrip:()=>{}};
 const controller=view.createEventController(session,{game:state.game,inventory:state.inventory,storage:INITIAL_STORAGE,life:{housing:'Street'},discoveredLocations:state.discoveredLocations,phoneUnavailable:null,shelterBooked:false,currentId:'street',open:true},host);
 const random=Math.random;Math.random=()=>.5;try{controller.applyEventOutcome(mutated?{...outcome,message:'Arbitrary translated wording'}:outcome);return state;}finally{Math.random=random;}
}
const slip=eventBase.STREET_EVENTS.find(event=>event.id==='borrow-phone-slip').choices[0].check.failure;
for(const condition of [0,3,5,6,100]){
 const original=executeEventCopy(eventOld,slip,condition),actual=executeEventCopy(eventBase,slip,condition);assert.deepEqual(actual,original);
 const changed=executeEventCopy(eventBase,slip,condition,true);assert.equal(changed.message,condition<=5?slip.phoneBreakMessage:'Arbitrary translated wording');
 const pseudoSlip=eventView.STREET_EVENTS.find(event=>event.id==='borrow-phone-slip').choices[0].check.failure,translated=executeEventCopy(eventView,pseudoSlip,condition,true);
 assert.equal(translated.inventory.phoneCondition,actual.inventory.phoneCondition);assert.deepEqual(translated.action.eventHistory,actual.action.eventHistory);
}
for(const outcome of [{message:'fixture'},{message:'fixture',knownLocations:[]},{message:'fixture',knownLocations:['support','station','unknown']},{message:'fixture',discoverLocation:'shelter',minutes:30},{message:'fixture',moveToStreet:true}])assert.deepEqual(executeEventCopy(eventBase,outcome),executeEventCopy(eventOld,outcome));
console.log('PASS: event controller English parity, knowledge/discovery/movement and broken-phone boundary/translated-message metadata preserve state and History facts.');

const eventRulesSource=`export * from './src/eventChecks'; export * from './src/eventChoiceText'; export * from './src/eventController'; export {default as EventDialog} from './src/EventDialog';`;
const eventRules=bundled({source:eventRulesSource}),eventRulesOld=bundled('test-fixtures/eventChecks-copy.ts');
const {eventUi:eventUiCatalog}=bundled('src/locales/en/eventUi.ts');
const eventUiPseudo=Object.fromEntries(Object.entries(eventUiCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
const eventRulesView=bundled({source:eventRulesSource,catalogs:{eventUi:eventUiPseudo}});
let eventRuleCases=0;
for(const value of [0,19,20,39,40,59,60,79,80,100])for(const documents of [false,true])for(const phone of [null,'Phone unavailable']){
 const game={...initialState,money:value,health:value,energy:value},inventory={...INITIAL_INVENTORY,phoneBattery:value,documents};
 for(const choice of [{label:'choice'},{label:'choice',undiscoveredLocationRequired:'support'},{label:'choice',moneyRequired:20},{label:'choice',phoneBatteryRequired:40},{label:'choice',check:{stat:'reflex',dc:12,requirements:{minHealth:20,minEnergy:60}}}]){
  const args=[choice,game,inventory,['support'],phone];assert.equal(eventRules.eventChoiceUnavailable(...args),eventRulesOld.eventChoiceUnavailable(...args));assert.equal(eventRulesView.eventChoiceUnavailable(...args)===null,eventRules.eventChoiceBlock(...args)===null);eventRuleCases++;
 }
}
const phoneChoice={label:'Phone choice',phoneBatteryRequired:1,outcome:{message:'should not execute',money:10}};
assert.deepEqual(eventRules.eventChoiceBlock(phoneChoice,initialState,INITIAL_INVENTORY,[],''),{id:'phone',message:''});
let rejectedEventPorts=0;const emptyController=eventRulesView.createEventController({activeEvent:null,firstNightEvents:{},ambientEventClock:{current:{}},setActiveEvent:()=>rejectedEventPorts++,setDiceCheck:()=>rejectedEventPorts++},{game:initialState,inventory:INITIAL_INVENTORY,storage:INITIAL_STORAGE,life:{housing:'Street'},discoveredLocations:[],phoneUnavailable:'',shelterBooked:false,currentId:'street',open:true},{runWithResult:()=>rejectedEventPorts++});
emptyController.resolveStreetEvent(phoneChoice);assert.equal(rejectedEventPorts,0,'empty phone refusal blocks before result or commands');
console.log(`PASS: ${eventRuleCases} event eligibility boundaries preserve English reasons, order and null-only availability; empty phone refusal blocks commands.`);

const authoredSource=`export * from './src/events'; export {default as EventDialog} from './src/EventDialog';`;
const authoredBase=bundled({source:authoredSource}),authoredOld=bundled('test-fixtures/events-copy.ts');
const {events:authoredCatalog}=bundled('src/locales/en/events.ts');
const authoredPseudo=Object.fromEntries(Object.entries(authoredCatalog).map(([key,message])=>[key,message.includes('{')?pseudoMessage(key,message):'']));
assert.deepEqual(validateCatalog(authoredCatalog,authoredPseudo),[]);
const authoredView=bundled({source:authoredSource,catalogs:{events:authoredPseudo}});
const authoredData=events=>JSON.parse(JSON.stringify(events));
const authoredMechanics=events=>JSON.parse(JSON.stringify(events,(key,value)=>['title','text','label','message','phoneBreakMessage'].includes(key)?undefined:value));
assert.deepEqual(authoredData(authoredBase.STREET_EVENTS),authoredData(authoredOld.STREET_EVENTS),'all English scene/choice/outcome and metadata bytes preserved');
assert.deepEqual(authoredMechanics(authoredView.STREET_EVENTS),authoredMechanics(authoredBase.STREET_EVENTS));
let authoredEligibility=0;
for(let i=0;i<authoredBase.STREET_EVENTS.length;i++)for(const day of [1,2,3])for(const minutes of [0,239,240,479,480,599,600,1140,1320,1439])for(const locationId of ['street','station'])for(const observation of ['idle','action','arrival']){
 const context={day,minutes,locationId,observation,elapsedMinutes:30,weather:'Rain',housing:'Street',documents:true,firstNight:day===1,nearHome:true,sleepKind:'bench',travelMode:'walk'};
 const old=authoredOld.STREET_EVENTS[i],actual=authoredBase.STREET_EVENTS[i],translated=authoredView.STREET_EVENTS[i];
 assert.equal(actual.eligible?.(context),old.eligible?.(context));assert.equal(translated.eligible?.(context),actual.eligible?.(context));
 for(const trigger of ['location','travel','wake','walk','bench']){const scoped={...context,seenEventIds:authoredBase.STREET_EVENTS.filter(e=>e.id!==actual.id).map(e=>e.id)};assert.equal(authoredBase.nextStreetEvent(trigger,scoped)?.id,authoredOld.nextStreetEvent(trigger,scoped)?.id);assert.equal(authoredView.nextStreetEvent(trigger,scoped)?.id,authoredBase.nextStreetEvent(trigger,scoped)?.id);}authoredEligibility++;
}
for(const documents of [false,true])for(const stored of [false,true])for(const roll of [0,.09999,.1,.24999,.25,.99999,1])for(const outcome of [{message:'Frozen result',identityCheck:true,minutes:5},{message:'Frozen result',randomCoin:true},{message:'Frozen result',identityCheck:true,randomCoin:true}]){
 assert.deepEqual(authoredBase.resolveEventOutcome(outcome,()=>roll,documents,stored),authoredOld.resolveEventOutcome(outcome,()=>roll,documents,stored));
 const actual=authoredBase.resolveEventOutcome(outcome,()=>roll,documents,stored),translated=authoredView.resolveEventOutcome(outcome,()=>roll,documents,stored);assert.deepEqual({...translated,message:undefined},{...actual,message:undefined});
}
console.log(`PASS: 25 authored scenes preserve exact English data, ${authoredEligibility} eligibility/spawn contexts, empty-copy mechanics and document/coin outcomes.`);

const phoneContentSource=`export * from './src/openingCalls'; export * from './src/phoneQuestions'; export {default as PhoneSearchScreen} from './src/PhoneSearchScreen'; export {default as PhoneNotesScreen} from './src/PhoneNotesScreen';`;
const phoneContentBase=bundled({source:phoneContentSource});
const phoneContentOld=bundled({source:`export * from './test-fixtures/openingCalls-copy'; export * from './test-fixtures/phoneQuestions-copy'; export {default as PhoneSearchScreen} from './test-fixtures/PhoneSearchScreen-copy'; export {default as PhoneNotesScreen} from './test-fixtures/PhoneNotesScreen-copy';`});
const {phoneContent:phoneContentCatalog}=bundled('src/locales/en/phoneContent.ts');const emptyPhoneContent=Object.fromEntries(Object.keys(phoneContentCatalog).map(key=>[key,'']));assert.deepEqual(validateCatalog(phoneContentCatalog,emptyPhoneContent),[]);
const phoneContentView=bundled({source:phoneContentSource,catalogs:{phoneContent:emptyPhoneContent}});
assert.deepEqual(phoneContentBase.OPENING_CALLS,phoneContentOld.OPENING_CALLS);
assert.deepEqual(phoneContentBase.practicalQuestions.map(({hasDetails,...question})=>question),phoneContentOld.practicalQuestions);
const phoneContentNumbers=data=>JSON.parse(JSON.stringify(data,(key,value)=>['label','callingTitle','title','text','noteTitle'].includes(key)?undefined:value));assert.deepEqual(phoneContentNumbers(phoneContentView.OPENING_CALLS),phoneContentNumbers(phoneContentBase.OPENING_CALLS));assert.deepEqual(phoneContentNumbers(phoneContentView.practicalQuestions),phoneContentNumbers(phoneContentBase.practicalQuestions));
for(const raw of [null,'0','1','2','3','4','-1','null','{}','broken'])for(const existing of [false,true]){const storage={getItem:()=>raw};assert.equal(phoneContentView.loadOpeningCallIndex(storage,existing),phoneContentOld.loadOpeningCallIndex(storage,existing));}
console.log('PASS: three calls, seven questions, explicit Notes detail metadata and 20 old/corrupt call-progress cases preserve English and domain data under empty copy.');

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'Event']) global[key] = dom.window[key];
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {}; window.matchMedia = () => ({ matches: true });
const React = require('react');
const { render, cleanup, act } = require('@testing-library/react');
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
  for(const id of weatherIds)for(const minutes of [359,360,1199,1200]){
    const props={game:{...comfortableStatus,day:1,minutes,money:30.5},weatherId:id,temperature:-3,battery:29.5};
    cleanup();render(React.createElement(hudBase.GameHeader,props));
    const icon=document.querySelector('.weather svg').innerHTML;
    assert.equal(document.querySelector('h1').getAttribute('aria-label'),`Day 0 Mo ${hudBase.formatTime(minutes)}`);
    assert.equal(document.querySelector('.money').textContent,'30.5 zł');assert.equal(document.querySelector('.money').getAttribute('aria-label'),'Money: 30.50 zł');
    assert.equal(document.querySelector('.phone-charge strong').textContent,'30%');assert(document.querySelector('.phone-charge').classList.contains('low'));
    assert.equal(document.querySelector('.weather').getAttribute('aria-label'),`${id}, -3°C`);
    cleanup();render(React.createElement(hudView.GameHeader,props));
    assert.equal(document.querySelector('.weather svg').innerHTML,icon,'actual HUD icon follows ID, never the translated name Clear');
    assert.equal(document.querySelector('.weather').title,'Clear');
    assert(document.querySelector('h1').getAttribute('aria-label').startsWith('⟦hud.dateAccessible <b>copy</b>⟧'));
    assert(document.querySelector('.money').getAttribute('aria-label').startsWith('⟦hud.moneyAccessible <b>copy</b>⟧'));
    assert(document.querySelector('.phone-charge').getAttribute('aria-label').startsWith('⟦hud.batteryAccessible <b>copy</b>⟧'));
  }
  const hudTimers={set:window.setInterval,clear:window.clearInterval};window.setInterval=()=>1;window.clearInterval=()=>{};
  try{
    cleanup();localStorage.clear();
    localStorage.setItem('street-life-save-v3',JSON.stringify({...comfortableStatus,day:7,minutes:720,rainSystemStarted:true,rainScheduleDay:7,rainStartsToday:1,nextRainAt:9400}));
    localStorage.setItem('street-life-mobile-auto-renew','false');
    localStorage.setItem('street-life-inventory-v1',JSON.stringify(INITIAL_INVENTORY));
    render(React.createElement(hudView.App));
    assert.equal(document.querySelector('.weather').title,'Clear');assert.equal(document.querySelector('.weekday').textContent,'Th');
    const restored=JSON.parse(localStorage.getItem('street-life-save-v3'));
    assert.equal(restored.day,7);assert.equal(restored.minutes,720);assert.equal(restored.money,comfortableStatus.money);assert.equal(restored.nextRainAt,9400);
    assert.equal(hudView.weatherAt(restored).id,'Rainy');assert.equal(Object.hasOwn(restored,'weatherId'),false,'weather remains derived; no new save field');
  }finally{cleanup();window.setInterval=hudTimers.set;window.clearInterval=hudTimers.clear;}
  console.log('PASS: actual pseudo HUD/App preserves calendar, money, battery threshold, weather icons and restored rain schedule without new save fields.');
  const chipsView=bundled({source:`export {default as InventorySlot} from './src/InventorySlot'; export {default as ShopCard} from './src/ShopCard'; export {default as StatusScreen} from './src/StatusScreen'; export * from './src/effectChips'; export * from './src/inventory'; export * from './src/game';`,effects:pseudoEffects});
  const pseudoChips=[chipsView.impactChip('mood-gain'),chipsView.impactChip('health-loss'),chipsView.freshnessChip('stale',2),chipsView.freshnessChip('spoiled',1)];
  let used=0,discarded=0;
  cleanup();render(React.createElement(chipsView.InventorySlot,{art:'food',name:'⟦meal⟧',quantity:4,effects:pseudoChips,hint:'⟦hint⟧',onUse:()=>used++,onDiscard:()=>discarded++}));
  assert.deepEqual([...document.querySelectorAll('.inventory-effects em')].map(n=>n.className),['positive','negative','warning','negative']);
  assert.deepEqual([...document.querySelectorAll('.inventory-effects em')].map(n=>n.textContent),pseudoChips.map(c=>c.label));
  document.querySelector('.inventory-slot-use').click();document.querySelector('.inventory-discard').click();assert.equal(used,1);assert.equal(discarded,1);
  cleanup();render(React.createElement(chipsView.ShopCard,{item:chipsView.SHOP_ITEMS.find(i=>i.id==='cigarettes'),open:true,fits:true,affordable:true,onBuy:()=>{},onSteal:()=>{}}));
  assert.deepEqual([...document.querySelectorAll('.supply-effects em')].map(n=>[n.className,n.textContent]),pseudoChips.slice(0,2).map(c=>[c.kind,c.label]));
  const coldLimits=[{reason:'Cold',name:'⟦illness⟧',icon:'thermometer',limits:[{stat:'energy',cap:77},{stat:'mood',cap:60}]}];
  const otherLimits=[{reason:'Health',name:'⟦health⟧',icon:'heart',limits:[{stat:'mood',cap:40},{stat:'energy',cap:60}]}];
  const showStatus=statLimits=>{cleanup();render(React.createElement(chipsView.StatusScreen,{game:chipsView.initialState,statusEffects:[{id:'cold',expiresAt:3000,treated:true}],statLimits,separateLimits:otherLimits,statusNeeds:[],focusedNeed:null,situation:{housing:'Street',employment:'Unemployed',income:'None',documents:'carried'}}));};
  showStatus(coldLimits);
  const coldChips=[...document.querySelectorAll('.illness .effect-impact b')].map(n=>n.textContent);
  assert.equal(coldChips.filter(s=>s.includes('60')).length,1);assert(coldChips[1].includes('60'));assert(!coldChips[0].includes('60'));assert(!coldChips.join('').includes('77'));
  assert(document.querySelector('.effect.illness').classList.contains('negative'));assert.equal(document.querySelector('[data-mood-limit]').dataset.moodLimit,'Health');
  assert.deepEqual([...document.querySelectorAll('.limit-effect b')].map(n=>n.textContent),['⟦effect.statCap⟧ Mood 40','⟦effect.statCap⟧ Energy 60']);
  showStatus([]);assert(!document.querySelector('.illness .effect-impact').textContent.includes('60'));
  console.log('PASS: pseudo-effect labels preserve inventory/shop colours and handlers, treated Cold Mood cap and separate stat identities.');
  let bought=[],stolen=[];
  for(const item of inventoryView.SHOP_ITEMS)for(const [open,fits,affordable] of [[true,true,true],[false,true,true],[true,false,true],[true,true,false]]){
    cleanup();render(React.createElement(inventoryView.ShopCard,{item,open,fits,affordable,onBuy:id=>bought.push(id),onSteal:id=>stolen.push(id)}));
    const buy=document.querySelector('.shop-buy'),steal=document.querySelector('.supply-steal');
    assert.equal(buy.disabled,!open||!fits||!affordable,'an empty translated reason must not enable buying');assert.equal(steal.disabled,!open||!fits);
    assert.equal(document.querySelector('.supply-copy strong').textContent,item.name);assert.equal(document.querySelector('.supply-copy strong b'),null);
    buy.click();steal.click();
  }
  assert.deepEqual(bought,SHOP_ITEMS.map(i=>i.id));assert.deepEqual(stolen,SHOP_ITEMS.flatMap(i=>[i.id,i.id]));
  const actions=[],discards=[];const fullInventory={...INITIAL_INVENTORY,water:1,food:3,foodPortions:[100,40,0],bread:1,breadPortions:[40],readyMeal:1,readyMealPortions:[0],cannedFood:1,wipes:1,bottles:1,cigarettes:1,medicines:1,showerGel:1};
  cleanup();render(React.createElement(inventoryView.InventoryScreen,{inventory:fullInventory,hygiene:10,usedBackpackSlots:10,shelterPhoneCharging:true,onUseItem:id=>actions.push(id),onUseSupply:id=>actions.push(id),onSmoke:()=>actions.push('smoke'),onMedicine:()=>actions.push('medicine'),onRequestFood:(id,name,index)=>actions.push([id,name,index]),onDiscard:request=>discards.push(request)}));
  for(const button of document.querySelectorAll('.inventory-slot-use'))button.click();for(const button of document.querySelectorAll('.inventory-discard'))button.click();
  assert.deepEqual(actions,['water',['food',inventoryView.backpackItemName('food'),0],['bread',inventoryView.backpackItemName('bread'),0],'cannedFood',['readyMeal',inventoryView.backpackItemName('readyMeal'),0],'wipes','smoke','medicine']);
  assert.deepEqual(discards.map(r=>r.id),['water','food','bread','cannedFood','readyMeal','wipes','bottles','cigarettes','medicines','showerGel']);assert.equal(discards.find(r=>r.id==='food').spoiledQuantity,1);
  assert.equal(document.querySelector('.inventory-slot-copy strong b'),null);
  console.log('PASS: all nine pseudo-labelled shop items retain buy/steal eligibility with empty reasons; all ten backpack item controls dispatch by ID.');
  for(const minutes of [419,420,1319,1320])for(const reservedBed of [false,true]){
    const routed=[];cleanup();render(React.createElement(locationsView.CityMap,{places:locationsView.locations,currentId:'station',initialFocusId:'shelter',minutes,reservedBed,routeId:null,onRoute:id=>routed.push(id)}));
    const shop=document.querySelectorAll('.district-shortcut')[1];assert.equal(shop.disabled,minutes<420||minutes>=1320);
    assert.equal(document.querySelector('.district-place-copy h3').textContent,'');
    assert(document.querySelector('.district-place-copy small').textContent.startsWith(reservedBed?'⟦location.map.shelterReserved':'⟦location.map.shelterUnreserved'));
    const pins=[...document.querySelectorAll('.district-pin')];const ids=locationsView.locations.filter(p=>!['street','shop'].includes(p.id)).map(p=>p.id);
    for(let index=0;index<pins.length;index++){
      const id=ids[index];act(()=>pins[index].click());assert.equal(document.querySelector('.district-place-copy h3').textContent,'');
      assert.equal(pins[index].classList.contains('closed'),!locationsView.isOpen(locationsView.locations.find(p=>p.id===id),minutes));
      document.querySelector('.district-route-button').click();assert.equal(routed.at(-1),id,'map route callback uses ID when every display name is empty');
    }
    act(()=>document.querySelectorAll('.district-shortcut')[0].click());assert.equal(routed.at(-1),'street');
    if(!shop.disabled){act(()=>shop.click());assert.equal(routed.at(-1),'shop');}
  }
  cleanup();render(React.createElement(locationsView.PhoneNotesScreen,{mapPlaces:locationsView.locations,answeredQuestions:[]}));
  assert.equal(document.querySelectorAll('.phone-note').length,10,'empty names do not remove known Notes');assert.equal(document.querySelector('h3 b'),null);
  cleanup();render(React.createElement(locationsView.ClosedContent,{closed:true,opensAt:'07:00'},React.createElement('button',null,'fixture')));
  assert(document.querySelector('.closed-content-body').hasAttribute('inert'));assert(document.querySelector('.closed-content-notice h2').textContent.startsWith('⟦location.closed'));
  console.log('PASS: actual pseudo map keeps all route IDs, closed pins, 07:00/22:00 shop boundaries and reserved-bed hints; Notes/closed content retain identity and blocking.');
  const locationTimers={set:window.setInterval,clear:window.clearInterval};window.setInterval=()=>1;window.clearInterval=()=>{};
  try{
    for(const destinationId of ['station','shop','shelter'])for(const mode of ['walk','transit']){
      cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
      const game={...comfortableStatus,mood:40,rainSystemStarted:true,rainScheduleDay:2,nextRainAt:999999};
      localStorage.setItem('street-life-save-v3',JSON.stringify(game));localStorage.setItem('street-life-mobile-auto-renew','false');
      localStorage.setItem('street-life-inventory-v1',JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem('street-life-trip-v1',JSON.stringify({destinationId,mode,total:30,remaining:0,before:{game,inventory:INITIAL_INVENTORY,effects:[]}}));
      render(React.createElement(React.StrictMode,null,React.createElement(locationsView.App)));
      const read=key=>JSON.parse(localStorage.getItem(key));
      assert.equal(read('street-life-save-v3').locationId,destinationId);assert.equal(read('street-life-save-v3').money,game.money);assert.equal(read('street-life-trip-v1'),null);
      const history=read('street-life-journal-history-v1');assert.equal(history.length,1);assert.equal(history[0].actionId,'arrival');
      assert(history[0].groupId.includes(destinationId),'an empty translated arrival name retains destination grouping');
      cleanup();render(React.createElement(locationsView.App));assert.deepEqual(read('street-life-journal-history-v1'),history,'restored arrival does not replay or rewrite saved History');
    }
  }finally{cleanup();window.setInterval=locationTimers.set;window.clearInterval=locationTimers.clear;}
  console.log('PASS: empty-name App restores six completed trips under StrictMode without duplicate arrival/costs or rewritten saved History.');
  function locationState(id,patch={}){
    const current=actionsBase.locations.find(p=>p.id===id);return {current,open:true,firstNight:false,game:{...comfortableStatus,day:4,minutes:1140,mood:40},underRainCover:false,travelling:false,message:'',currentActions:actionsBase.actions.filter(a=>a.locationId===id),shelterInterview:null,choiceSeed:42,choiceDecisionKey:'fixture',usedBackpackSlots:4,inventory:{...INITIAL_INVENTORY,showerGel:1},life:{housing:'Street'},insideNightShelter:true,usedStorageSlots:0,storageCapacity:8,storage:INITIAL_STORAGE,shelterPhoneCharging:false,dayWorkEnergyRequired:35,streetChoiceGroups:[['phone-help'],['music-walk','bottles'],['station-route','street-sleep']],nextOpeningCall:undefined,phoneUnavailable:null,musicWalkUsed:false,canWalkWithMusic:true,walkMusicCost:3,shelterBooked:true,discoveredLocations:['street','station','shelter','support','work'],begging:{day:4,attempts:2},streetBenchFound:false,hygieneLimit:55,busy:false,...patch};
  }
  function locationControls(view,state){
    const calls=[];const handlers=new Proxy({actionUnavailableReason:action=>view.locationActionUnavailable(action,{game:state.game,inventory:state.inventory,life:state.life,current:state.current,open:state.open,shelterBooked:state.shelterBooked,shelterAdmitted:state.insideNightShelter})},{get:(target,name)=>name in target?target[name]:(...args)=>calls.push([name,...args.filter(value=>['string','number','boolean'].includes(typeof value))])});
    cleanup();render(React.createElement(view.LocationScreen,{state,handlers}));
    const controls=[...document.querySelectorAll('button')].map(button=>[button.dataset.orderId??button.dataset.choice??button.className,button.disabled]);
    for(const button of document.querySelectorAll('button'))button.click();
    assert.equal(document.querySelector('.action-unavailable-reason b'),null,'translated copy is never HTML');
    return {controls,calls};
  }
  let screenCases=0;
  for(const id of actionsBase.locations.map(p=>p.id))for(const patch of [{},{open:false},{inventory:{...INITIAL_INVENTORY,documents:false,showerGel:0,phoneBattery:100}}]){
    const state=locationState(id,patch);assert.deepEqual(locationControls(actionsView,state),locationControls(actionsBase,state));screenCases++;
  }
  for(const step of ['reason','action','plan']){const state=locationState('shelter',{shelterInterview:{step}});assert.deepEqual(locationControls(actionsView,state),locationControls(actionsBase,state));screenCases++;}
  assert.equal(actionsBase.actions.length,24);assert.equal(t('action.street.begRemaining',{count:1}),'1/3 attempt left today.');
  console.log(`PASS: ${screenCases} pseudo LocationScreen states preserve control order/disabled flags/command IDs, including all interview steps and missing documents/full phone.`);
  let shelterDialogCases=0;
  const shelterDialogs=[];
  for(const minute of [1079,1080,1099,1100])for(const peopleAhead of [0,1,3])for(const total of [undefined,20])shelterDialogs.push({component:'ShelterQueueDialog',props:{minute,shelterQueue:{day:2,total,remaining:5,arrivalMinute:total?1020:undefined,joinedAt:1060,peopleAhead,vacancies:3}}});
  for(const minute of [450,465,480,1439])for(const remaining of [0,15,30])for(const charging of [false,true])shelterDialogs.push({component:'ShelterDepartureDialog',props:{minute,shelterDeparture:{day:2,startAbsolute:1890},shelterDepartureRemaining:remaining,shelterPhoneCharging:charging}});
  for(const minute of [449,450,479,480,1439])shelterDialogs.push({component:'ShelterCheckoutWarning',props:{minute}});
  for(const test of shelterDialogs){
    const show=(view)=>{let started=0;cleanup();render(React.createElement(view[test.component],{...test.props,onStart:()=>started++}));const html=document.body.innerHTML;const progress=[...document.querySelectorAll('[role="progressbar"]')].map(n=>[n.getAttribute('aria-valuenow'),n.getAttribute('aria-valuemax'),n.querySelector('i').style.width]);if(test.component==='ShelterCheckoutWarning'){const button=document.querySelector('button');assert.equal(document.activeElement,button);const event=new window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});button.dispatchEvent(event);assert(event.defaultPrevented);assert.equal(document.activeElement,button);button.click();assert.equal(started,1);}assert.equal(document.querySelector('.modal-narrative b'),null);return {html,progress};};
    const old=show(shelterLegacy),actual=show(shelterBase),translated=show(shelterView);assert.equal(actual.html,old.html,'English shelter dialog DOM stays identical');assert.deepEqual(translated.progress,actual.progress);shelterDialogCases++;
  }
  const shelterTimers={set:window.setInterval,clear:window.clearInterval,random:Math.random};window.setInterval=()=>1;window.clearInterval=()=>{};Math.random=()=>.99;
  try{
    const restoreShelter=(view,gamePatch,life,extra)=>{
      cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
      const game={...comfortableStatus,mood:28,day:2,minutes:1120,locationId:'shelter',rainSystemStarted:true,rainScheduleDay:2,nextRainAt:999999,...gamePatch};
      localStorage.setItem('street-life-save-v3',JSON.stringify(game));localStorage.setItem('street-life-situation-v1',JSON.stringify(life));localStorage.setItem('street-life-inventory-v1',JSON.stringify(INITIAL_INVENTORY));localStorage.setItem('street-life-mobile-auto-renew','false');localStorage.setItem('street-life-effects-v1','[]');
      for(const[key,value]of Object.entries(extra)){const saved=['street-life-shelter-queue-v1','street-life-shelter-departure-v1'].includes(key)?{...value,before:{game,inventory:INITIAL_INVENTORY,effects:[],housing:life.housing}}:value;localStorage.setItem(key,JSON.stringify(saved));}render(React.createElement(React.StrictMode,null,React.createElement(view.App)));
      const read=key=>JSON.parse(localStorage.getItem(key));const snapshot=()=>({game:read('street-life-save-v3'),life:read('street-life-situation-v1'),inventory:read('street-life-inventory-v1'),effects:read('street-life-effects-v1'),queue:read('street-life-shelter-queue-v1'),departure:read('street-life-shelter-departure-v1'),charging:read('street-life-shelter-phone-charge-v1'),history:read('street-life-journal-history-v1')});
      const first=snapshot();cleanup();render(React.createElement(React.StrictMode,null,React.createElement(view.App)));const second=snapshot();assert.deepEqual(second,first,'restored shelter completion/audit cannot replay across remount');return first;
    };
    const savedShelterMechanics=state=>({...state,history:state.history?.map(({actionTitle,title,text,...entry})=>entry)});
    let restoredShelterCases=0;
    for(const [vacancies,peopleAhead]of [[0,0],[3,3],[3,0]]){
      const extra={'street-life-shelter-queue-v1':{day:2,total:20,remaining:0,arrivalMinute:1020,joinedAt:1100,vacancies,peopleAhead}};
      const actual=restoreShelter(shelterBase,{},{housing:'Street'},extra),translated=restoreShelter(shelterView,{},{housing:'Street'},extra);
      assert.deepEqual(savedShelterMechanics(translated),savedShelterMechanics(actual));assert.equal(translated.history.length,1);assert.equal(translated.queue,null);assert.equal(translated.game.mood,vacancies>peopleAhead?31:23);restoredShelterCases++;
    }
    for(const charging of [false,true])for(const booked of [false,true]){
      const life={housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:booked?7:1,shelterLastStayDay:1,shelterAuditDay:1};
      const extra={'street-life-shelter-departure-v1':{day:2,startAbsolute:1890},'street-life-shelter-phone-charge-v1':charging};
      const actual=restoreShelter(shelterBase,{minutes:480},life,extra),translated=restoreShelter(shelterView,{minutes:480},life,extra);
      assert.deepEqual(savedShelterMechanics(translated),savedShelterMechanics(actual));assert.equal(translated.history.length,1);assert.equal(translated.departure,null);assert.equal(translated.charging,null);assert.equal(translated.game.locationId,'street');assert.equal(translated.life.shelterCheckoutDay,2);restoredShelterCases++;
    }
    const missed={housing:'Night shelter',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1,shelterMisses:2,shelterMissMonth:0};
    const audited=restoreShelter(shelterView,{day:4,minutes:600,rainScheduleDay:4},missed,{}),expectedAudit=restoreShelter(shelterBase,{day:4,minutes:600,rainScheduleDay:4},missed,{});assert.deepEqual(savedShelterMechanics(audited),savedShelterMechanics(expectedAudit));assert.equal(audited.life.shelterBlockedUntilDay,31);assert.equal(audited.life.shelterMisses,3);restoredShelterCases++;
    console.log(`PASS: ${shelterDialogCases} shelter dialog DOM/focus/progress variants and ${restoredShelterCases} pseudo App/StrictMode restore/remount states preserve saved clocks, booking/phone and one-time History/rewards.`);
  }finally{cleanup();window.setInterval=shelterTimers.set;window.clearInterval=shelterTimers.clear;Math.random=shelterTimers.random;}
  let sleepDialogCases=0;
  for(const kind of ['ground','bench','shelter','residential'])for(const energy of [0,25,50,75,76])for(const wetnessEnabled of [false,true]){
    const day=kind==='ground'?1:2,minutes=kind==='shelter'?420:1320,selectedHours=sleepBase.availableSleepHours(energy).at(-1);
    const options=[2,4,6,8].map(hours=>{const total=kind==='shelter'?sleepBase.shelterSleepMinutes((day-1)*1440+minutes,hours*60):hours*60,wake=(day-1)*1440+minutes+total;return{hours,wake:{day:Math.floor(wake/1440)+1,minutes:wake%1440},unavailableReason:sleepBase.sleepUnavailableReason(hours,energy)};});
    const show=view=>{cleanup();const selected=[],calls=[];const props={kind,dateLabel:sleepBase.sleepDateLabel(day,minutes),energy,options:options.map(option=>view===sleepLegacy?{...option,wakeLabel:sleepBase.sleepDateLabel(option.wake.day,option.wake.minutes)}:{...option,unavailableReason:view.sleepUnavailableReason(option.hours,energy)}),selectedHours,durationLabel:sleepBase.formatSleepDuration(kind==='shelter'?30:selectedHours*60),wetClothesWarning:true,wetnessEnabled,onSelect:hours=>selected.push(hours),onCancel:()=>calls.push('cancel'),onConfirm:()=>calls.push('confirm')};render(React.createElement(view.SleepPlanningDialog,props));const html=document.body.innerHTML;assert.equal(document.querySelector('.sleep-choice-preview strong').textContent,sleepBase.formatTime(options.find(option=>option.hours===selectedHours).wake.minutes),'wake time does not parse translated separators');const buttons=[...document.querySelectorAll('.sleep-duration-option')],disabled=buttons.map(button=>button.disabled);assert.equal(document.activeElement,buttons[[2,4,6,8].indexOf(selectedHours)]);act(()=>{buttons.forEach(button=>button.click());document.querySelectorAll('.sleep-choice-buttons button').forEach(button=>button.click());});assert.deepEqual(selected,sleepBase.availableSleepHours(energy));assert.deepEqual(calls,['cancel','confirm']);assert.equal(document.querySelector('.sleep-choice-note b'),null);return{html,disabled};};
    const old=show(sleepLegacy),actual=show(sleepBase),translated=show(sleepView);assert.equal(actual.html,old.html,'English planning DOM preserves text, focus and controls');assert.deepEqual(translated.disabled,actual.disabled);sleepDialogCases++;
  }
  const sleepClock=Date.now;Date.now=()=>1800000000000;
  try{
    for(const kind of ['ground','bench','shelter','residential'])for(const total of [30,120,480])for(const elapsed of [0,total/2,total]){
      const sleeping={kind,total,remaining:total-elapsed,startAbsolute:1860,realStartedAt:Date.now()-elapsed*100,realWakeAt:Date.now()+(total-elapsed)*100};
      const show=view=>{cleanup();let wakes=0;render(React.createElement(view.SleepProgressDialog,{sleeping,minute:420+elapsed,onWake:()=>wakes++}));const html=document.body.innerHTML,bar=document.querySelector('[role="progressbar"]');const progress=[bar.getAttribute('aria-valuenow'),bar.getAttribute('aria-valuemax'),bar.querySelector('i').style.width];act(()=>document.querySelector('button').click());assert.equal(wakes,1);return{html,progress};};
      const old=show(sleepLegacy),actual=show(sleepBase),translated=show(sleepView);assert.equal(actual.html,old.html,'English progress DOM remains identical');assert.deepEqual(translated.progress,actual.progress);sleepDialogCases++;
    }
    const timer={set:window.setInterval,clear:window.clearInterval,random:Math.random};window.setInterval=()=>1;window.clearInterval=()=>{};
    try{
      const restoreSleep=(view,kind,forced,roll,ongoing=false)=>{
        cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);Math.random=()=>roll;
        const start=kind==='shelter'?420:600,total=kind==='shelter'?30:120,locationId=kind==='ground'?'street':kind==='bench'?'station':kind==='shelter'?'shelter':'residential-shelter';
        const game={...comfortableStatus,energy:25,mood:28,day:2,minutes:ongoing?start:start+total,locationId,rainSystemStarted:true,rainScheduleDay:2,nextRainAt:999999,sleepIllnessDose:1,sleepIllnessMinutes:total};
        const life={housing:kind==='shelter'?'Night shelter':kind==='residential'?'Schronisko':'Street',shelterRegisteredDay:1,shelterUntilDay:7,shelterLastStayDay:1,shelterAuditDay:1};
        const before={game:{...game,minutes:start,sleepIllnessDose:0,sleepIllnessMinutes:0},inventory:INITIAL_INVENTORY,effects:[],housing:life.housing};
        const sleep={kind,total,remaining:ongoing?total:0,startAbsolute:1440+start,realStartedAt:Date.now()-(ongoing?0:total*100),realWakeAt:Date.now()+(ongoing?total*100:0),before,forced};
        for(const[key,value]of Object.entries({'street-life-save-v3':game,'street-life-situation-v1':life,'street-life-inventory-v1':INITIAL_INVENTORY,'street-life-effects-v1':[],'street-life-sleep-v1':sleep}))localStorage.setItem(key,JSON.stringify(value));localStorage.setItem('street-life-mobile-auto-renew','false');
        render(React.createElement(React.StrictMode,null,React.createElement(view.App)));
        if(ongoing){assert(document.querySelector('.sleep-debug-wake'));assert.equal(JSON.parse(localStorage.getItem('street-life-save-v3')).minutes,start);act(()=>document.querySelector('.sleep-debug-wake').click());}
        const read=key=>JSON.parse(localStorage.getItem(key)),snapshot=()=>({game:read('street-life-save-v3'),life:read('street-life-situation-v1'),effects:read('street-life-effects-v1'),sleep:read('street-life-sleep-v1'),history:read('street-life-journal-history-v1'),inventory:read('street-life-inventory-v1')});
        const first=snapshot();assert.equal(first.sleep,null);assert.equal(first.history.length,1);assert.equal(first.game.minutes,start+total);cleanup();render(React.createElement(React.StrictMode,null,React.createElement(view.App)));assert.deepEqual(snapshot(),first,'sleep rewards and History cannot replay on remount');return first;
      };
      const mechanics=state=>({...state,history:state.history.map(({actionTitle,title,text,...entry})=>entry)});let restores=0;
      for(const kind of ['ground','bench','shelter','residential'])for(const forced of [false,true])for(const roll of [0,.99]){
        assert.deepEqual(mechanics(restoreSleep(sleepView,kind,forced,roll)),mechanics(restoreSleep(sleepBase,kind,forced,roll)));restores++;
      }
      for(const kind of ['ground','bench','shelter','residential']){assert.deepEqual(mechanics(restoreSleep(sleepView,kind,false,.99,true)),mechanics(restoreSleep(sleepBase,kind,false,.99,true)));restores++;}
      console.log(`PASS: ${sleepDialogCases} sleep dialog DOM/focus/progress variants and ${restores} pseudo App/StrictMode restore/remount/debug-finish states preserve dates, fatigue, cutoff, illness and single rewards/History.`);
    }finally{cleanup();window.setInterval=timer.set;window.clearInterval=timer.clear;Math.random=timer.random;}
  }finally{Date.now=sleepClock;}
  let rainDialogCases=0;
  for(const level of ['drizzle','rain','downpour'])for(const mode of ['opening','tree','canopy','search','passage'])for(const seed of [0,1,17,42]){
    const waiting=mode!=='opening',rain=rainFixture(level,{choice:mode==='opening'?null:mode==='search'||mode==='passage'?'proper':'nearby',shelter:mode==='tree'?'tree':'canopy',searchRemaining:mode==='search'?2:0});
    const show=view=>{cleanup();const calls=[];render(React.createElement(view.RainEventDialog,{rain,waiting,elapsed:65,orderSeed:seed,decisionKey:'rain-fixture',panelRef:{current:null},onChoose:choice=>calls.push(choice),onFindProperShelter:()=>calls.push('proper'),onContinue:()=>calls.push('continue')}));const mask=document.querySelector('mask');if(mask)assert.equal(document.querySelector('rect[mask]').getAttribute('mask'),`url(#${mask.id})`);const html=document.body.innerHTML.replace(/_r_\w+_/g,'_react_generated_mask_'),controls=[...document.querySelectorAll('button')].map(n=>[n.getAttribute('data-order-id'),n.disabled]);act(()=>document.querySelectorAll('button').forEach(button=>button.click()));assert.equal(document.querySelector('.modal-narrative b'),null);return{html,controls,calls};};
    const old=show(rainLegacy),actual=show(rainBase),translated=show(rainView);assert.equal(actual.html,old.html,'English rain dialog DOM is preserved');assert.deepEqual(translated.controls,actual.controls);assert.deepEqual(translated.calls,actual.calls);rainDialogCases++;
  }
  const rainReportCases=[];
  for(const level of ['drizzle','rain','downpour'])for(const choice of [null,'nearby','proper','continue'])for(const searchRemaining of [0,2])for(const cold of [false,true])for(const activeCold of [false,true])rainReportCases.push({rain:rainFixture(level,{choice,searchRemaining,cold}),activeCold});
  for(const coldGranted of [undefined,false,true])for(const reported of [false,true])rainReportCases.push({rain:rainFixture('downpour',{choice:'continue',cold:true,coldGranted,reported})});
  for(const blocked of [false,true])rainReportCases.push({rain:null,blocked},{rain:rainFixture('rain',{cold:true}),blocked});
  for(const loss of [.04,.05,.14,4.44])rainReportCases.push({rain:rainFixture('rain',{choice:'continue',energyLoss:loss,moodLoss:loss,waited:0})});
  function executeRainReport(view,test){
    cleanup();const saved={day:1,minute:1320,actionId:'bench-rest',actionTitle:'Saved title',title:'Saved heading',text:'',reflection:true};
    const state={game:{...comfortableStatus,day:2,minutes:660,energy:97,mood:49,rainResults:test.rain?[test.rain]:[],rainSystemStarted:true,rainScheduleDay:2,nextRainAt:999999},effects:test.activeCold?[{id:'cold',expiresAt:10000}]:[],infoModal:null,eventResultOpen:false,journalEntries:[saved],ports:[]};
    const setter=key=>value=>{state.ports.push([key]);state[key]=typeof value==='function'?value(state[key]):value;};
    const host={...Object.fromEntries(['game','effects','infoModal','eventResultOpen','journalEntries'].map(key=>['set'+key[0].toUpperCase()+key.slice(1),setter(key)])),resultSnapshot:()=>({game:state.game,inventory:INITIAL_INVENTORY,effects:state.effects,housing:'Street'})};
    function Harness(){view.useRainResults({game:state.game,effects:state.effects,blocked:test.blocked??false},host);return null;}
    const mount=()=>render(React.createElement(React.StrictMode,null,React.createElement(Harness)));
    mount();assert.deepEqual(state.journalEntries[0],saved,'previous History copy stays unchanged');
    const first=JSON.parse(JSON.stringify(state));cleanup();mount();assert.deepEqual(state.effects,first.effects,'reported rain cannot extend or duplicate Cold');assert.deepEqual(state.journalEntries,first.journalEntries,'reported rain cannot append History twice');cleanup();return first;
  }
  const rainMechanics=state=>({...state,infoModal:state.infoModal?(({title,text,label,illustrationAlt,...modal})=>modal)(state.infoModal):null,journalEntries:state.journalEntries.map(({title,text,actionTitle,...entry})=>entry)});
  for(const test of rainReportCases){const old=executeRainReport(rainLegacy,test),actual=executeRainReport(rainBase,test),translated=executeRainReport(rainView,test);assert.deepEqual(actual,old,'rain report frozen English/state/ordered-port parity');assert.deepEqual(rainMechanics(translated),rainMechanics(actual),'rain report IDs, losses, grouping, effects and replay guards ignore all-empty copy');}
  const rainTimers={set:window.setInterval,clear:window.clearInterval,random:Math.random};window.setInterval=()=>1;window.clearInterval=()=>{};Math.random=()=>.99;
  try{
    function restoreRain(view,rain,activeCold=false){
      cleanup();localStorage.clear();require('./test-fixtures/finished-encounters.cjs')(localStorage);
      const game={...comfortableStatus,day:2,minutes:660,energy:70,mood:40,locationId:'street',rain:undefined,rainResults:[rain],rainSystemStarted:true,rainScheduleDay:2,nextRainAt:999999};
      for(const[key,value]of Object.entries({'street-life-save-v3':game,'street-life-situation-v1':{housing:'Street'},'street-life-inventory-v1':INITIAL_INVENTORY,'street-life-effects-v1':activeCold?[{id:'cold',expiresAt:10000}]:[]}))localStorage.setItem(key,JSON.stringify(value));localStorage.setItem('street-life-mobile-auto-renew','false');
      const mount=()=>render(React.createElement(React.StrictMode,null,React.createElement(view.App))),read=key=>JSON.parse(localStorage.getItem(key)),snapshot=()=>({game:read('street-life-save-v3'),effects:read('street-life-effects-v1'),history:read('street-life-journal-history-v1'),inventory:read('street-life-inventory-v1')});
      mount();const first=snapshot();assert.equal(first.history.length,1);assert(document.querySelector('.result-modal'));cleanup();mount();assert.deepEqual(snapshot(),first,'pending rain result survives restore without replay');assert(document.querySelector('.result-modal'));act(()=>document.querySelector('.result-modal button').click());assert.deepEqual(snapshot().game.rainResults,[],'acknowledgement removes pending result by rain ID despite blank title');const acknowledged=snapshot();cleanup();mount();assert.deepEqual(snapshot(),acknowledged);assert.equal(document.querySelector('.result-modal'),null,'consumed rain result cannot return');cleanup();return acknowledged;
    }
    const mechanics=state=>({...state,history:state.history.map(({actionTitle,title,text,...entry})=>entry)});let rainRestores=0;
    for(const level of ['drizzle','rain','downpour'])for(const choice of ['nearby','proper','continue','stoppedSearch'])for(const cold of [false,true]){
      const rain=rainFixture(level,{choice:choice==='stoppedSearch'?'proper':choice,searchRemaining:choice==='stoppedSearch'?2:0,cold});
      assert.deepEqual(mechanics(restoreRain(rainView,rain)),mechanics(restoreRain(rainBase,rain)));rainRestores++;
    }
    const rain=rainFixture('downpour',{choice:'continue',cold:true});assert.deepEqual(mechanics(restoreRain(rainView,rain,true)),mechanics(restoreRain(rainBase,rain,true)));rainRestores++;
    console.log(`PASS: ${rainDialogCases} rain dialog DOM/order/handler variants, ${rainReportCases.length} frozen/pseudo StrictMode report/remount cases and ${rainRestores} App restore/acknowledgement states preserve losses, Cold, History and once-only consumption.`);
  }finally{cleanup();window.setInterval=rainTimers.set;window.clearInterval=rainTimers.clear;Math.random=rainTimers.random;}
  let travelDialogs=0;
  for(const destination of locationsView.locations)for(const freeTransitActive of [false,true])for(const money of [0,4.39,4.4,100]){
   const show=view=>{cleanup();const calls=[];render(React.createElement(view.TravelPlanningDialog,{destination,panelRef:null,choiceSeed:42,choiceDecisionKey:'travel-fixture',freeTransitActive,money,onClose:()=>calls.push('close'),onStart:mode=>calls.push(mode),onFareDodge:()=>calls.push('fare-dodge')}));const mask=document.querySelector('mask');if(mask)assert.equal(document.querySelector('rect[mask]').getAttribute('mask'),`url(#${mask.id})`);const html=document.body.innerHTML.replace(/_r_\w+_/g,'_react_generated_mask_');const controls=[...document.querySelectorAll('button')].map(n=>[n.getAttribute('data-order-id'),n.disabled]);act(()=>document.querySelectorAll('button').forEach(n=>n.click()));return{html,controls,calls};};
   const old=show(travelOld),actual=show(travelBase),translated=show(travelView);assert.equal(actual.html,old.html);assert.deepEqual(translated.controls,actual.controls);assert.deepEqual(translated.calls,actual.calls);travelDialogs++;
  }
  console.log(`PASS: ${travelDialogs} travel planner variants preserve English DOM, costs, eligibility, order and command IDs under pseudo-copy.`);
  const diceOld=bundled('test-fixtures/DiceDialog-copy.tsx').default;
  const diceBase=bundled('src/DiceDialog.tsx').default;
  const {dialogs:diceCatalog}=bundled('src/locales/en/dialogs.ts');
  const dicePseudo=Object.fromEntries(Object.entries(diceCatalog).map(([key,message])=>[key,pseudoMessage(key,message)]));
  const diceView=bundled({source:`export {default as DiceDialog} from './src/DiceDialog';`,catalogs:{dialogs:dicePseudo}}).DiceDialog;
  let diceCases=0;
  for(const stat of ['reflex','persuasion'])for(const modifier of [-2,0,2])for(const roll of [null,1,9,10,12,20])for(const kind of ['event','fare','water','medicines']){
    const choice={label:'Frozen authored choice',check:{stat,dc:12,success:{message:'success'},failure:{message:'failure'}}};
    const diceCheck={choice,modifier,roll,resolved:false,...(kind==='fare'?{fareDodgeDestinationId:'station'}:kind==='event'?{}:{stealItemId:kind})};
    const show=Component=>{cleanup();const calls=[];render(React.createElement(Component,{diceCheck,eventText:'Frozen authored description',onRoll:()=>calls.push('roll'),onAccept:()=>calls.push('accept'),onCancel:()=>calls.push('cancel')}));const html=document.body.innerHTML,shape=[...document.querySelectorAll('button')].map(n=>[n.className,n.disabled]);const face=document.querySelector('.d20').className;act(()=>document.querySelectorAll('button').forEach(n=>n.click()));assert.equal(document.querySelector('.dice-description b'),null);return{html,shape,face,calls};};
    const old=show(diceOld),actual=show(diceBase),translated=show(diceView);assert.equal(actual.html,old.html);assert.deepEqual({...translated,html:undefined},{...actual,html:undefined});diceCases++;
  }
  console.log(`PASS: ${diceCases} frozen/pseudo D20 variants preserve English DOM, critical/threshold states, modifiers, buttons and handlers.`);
  for(const illustration of [undefined,'/fixture.webp'])for(const reason of [null,'','Refused']){
   cleanup();let choices=0;const event={id:'fixture',title:'Fixture',text:'Fixture text',illustration,choices:[{id:'choice',label:'Choose',outcome:{message:'done'}}]};render(React.createElement(eventRulesView.EventDialog,{event,choices:event.choices,onChoose:()=>choices++,unavailableReason:()=>reason,orderSeed:42,decisionKey:'fixture',panelRef:null}));const button=document.querySelector('.choice-button');assert.equal(button.disabled,reason!==null);act(()=>button.click());assert.equal(choices,reason===null?1:0);
  }
  console.log('PASS: illustrated and compact events retain disabled commands for empty refusal labels.');
  for(let i=0;i<authoredBase.STREET_EVENTS.length;i++){
   const show=view=>{cleanup();const event=view.STREET_EVENTS[i],calls=[];render(React.createElement(view.EventDialog,{event,choices:event.choices,onChoose:choice=>calls.push(choice.id),unavailableReason:()=>null,orderSeed:42,decisionKey:'authored-fixture',panelRef:null}));const ids=[...document.querySelectorAll('.choice-button')].map(n=>n.getAttribute('data-order-id'));act(()=>document.querySelectorAll('.choice-button').forEach(n=>n.click()));assert.equal(document.querySelector('.modal-narrative b'),null);return{ids,calls};};assert.deepEqual(show(authoredView),show(authoredBase),'empty authored text preserves all scene choices/order/dispatch');
  }
  console.log('PASS: all 25 authored dialogs retain buttons, ordering and choice IDs under empty copy.');
  let phoneContentCases=0;
  for(const serviceActive of [false,true])for(const battery of [0,4,100])for(const answeredQuestions of [[],['bed','morning','work','clinic','supplies']]){
    const show=view=>{cleanup();const calls=[];render(React.createElement(view.PhoneSearchScreen,{serviceActive,battery,answeredQuestions,phoneSearchCost:5,onOpenNotes:()=>calls.push('notes'),onSearch:id=>calls.push(id)}));const html=document.body.innerHTML,controls=[...document.querySelectorAll('button')].map(n=>[n.getAttribute('data-choice'),n.disabled]);act(()=>document.querySelectorAll('button').forEach(n=>n.click()));return{html,controls,calls};};const old=show(phoneContentOld),actual=show(phoneContentBase),translated=show(phoneContentView);assert.equal(actual.html,old.html);assert.deepEqual(translated.controls,actual.controls);assert.deepEqual(translated.calls,actual.calls);phoneContentCases++;
  }
  for(const answeredQuestions of [[],['morning'],['bed','no-place','supplies','work','clinic','charging','morning']]){
    const show=view=>{cleanup();render(React.createElement(view.PhoneNotesScreen,{mapPlaces:locationsView.locations,answeredQuestions}));return{html:document.body.innerHTML,details:document.querySelectorAll('details').length,articles:document.querySelectorAll('article').length};};const old=show(phoneContentOld),actual=show(phoneContentBase),translated=show(phoneContentView);assert.equal(actual.html,old.html);assert.equal(translated.details,actual.details);assert.equal(translated.articles,actual.articles);phoneContentCases++;
  }
  console.log(`PASS: ${phoneContentCases} search/Notes variants preserve English DOM, eligibility, command IDs and saved detail visibility under empty content.`);
  const intervals={set:window.setInterval,clear:window.clearInterval};window.setInterval=()=>1;window.clearInterval=()=>{};
  try{
    for(const [housing,cap] of [['Street',50],['Night shelter',60],['Schronisko',70],['Hostel',80],['Room',90],['Apartment',100]]){
      cleanup();localStorage.clear();localStorage.setItem('street-life-screen','status');
      localStorage.setItem('street-life-save-v3',JSON.stringify(comfortableStatus));
      localStorage.setItem('street-life-situation-v1',JSON.stringify({housing,employment:'Day work',income:'Irregular'}));
      localStorage.setItem('street-life-inventory-v1',JSON.stringify({...INITIAL_INVENTORY,clothingCleanliness:100,documents:false}));
      localStorage.setItem('street-life-storage-v1',JSON.stringify({...INITIAL_STORAGE,documents:true}));
      render(React.createElement(statusView.App));
      const game=JSON.parse(localStorage.getItem('street-life-save-v3')),life=JSON.parse(localStorage.getItem('street-life-situation-v1'));
      assert.equal(game.mood,Math.min(95,cap));assert.equal(game.minutes,720);assert.equal(life.housing,housing);assert.equal(life.employment,'Day work');assert.equal(life.income,'Irregular');
      const mood=document.querySelector('[data-resource-id="mood"]');assert.equal(!!mood.querySelector('.bar-blocked'),cap<100);if(cap<100)assert.equal(mood.querySelector('.bar-cap-marker').style.left,cap+'%');
      assert(document.querySelector('.header-condition').classList.contains(statusView.conditionBand(game.mood).level));assert.equal(mood.querySelector('svg').innerHTML,document.querySelector('.header-condition svg').innerHTML);
      assert.deepEqual([...document.querySelectorAll('.life-card strong')].map(n=>n.textContent),[statusView.housingLabel(housing),statusView.employmentLabel('Day work'),statusView.incomeLabel('Irregular'),statusView.documentStateLabel('stored')]);
    }
  }finally{cleanup();window.setInterval=intervals.set;window.clearInterval=intervals.clear;}
  console.log('PASS: pseudo Status/App preserves all six housing caps, faces, timestamps, stored documents and persisted machine enum values.');






} finally { cleanup(); dom.window.close(); }
console.log('PASS: typed messages/parameters, locale plural categories, catalog completeness, unchanged time/money formats, stable result guards, legacy History and relabelled result mechanics.');
