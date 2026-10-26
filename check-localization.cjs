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
