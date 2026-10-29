const assert = require('node:assert/strict');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path, exposeCatalogs=false) {
 const entry=exposeCatalogs?{stdin:{contents:`export * from './${path}'; export { ru } from './src/locales/ru'; export { pl } from './src/locales/pl';`,resolveDir:process.cwd(),sourcefile:'language-test.ts'}}:{entryPoints:[path]};
 const code=buildSync({...entry,bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 const module={exports:{}};new Function('require','module','exports',code)(require,module,module.exports);return module.exports;
}
const values=new Map();global.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
const preference=bundled('src/i18n/language.ts');
assert.equal(preference.loadLanguage(),'en');values.set(preference.LANGUAGE_KEY,'bad');assert.equal(preference.loadLanguage(),'en');
const translations={...bundled('src/locales/pl/index.ts'),...bundled('src/locales/ru/index.ts')};
const openingPackages={pl:bundled('src/locales/pl/opening.ts').opening,ru:bundled('src/locales/ru/opening.ts').opening};
assert.deepEqual(Object.keys(openingPackages.pl).sort(),Object.keys(openingPackages.ru).sort(),'the reference package covers the same messages in both languages');
const completedPackages={};
for(const id of ['pl','ru']) {
 const original=bundled('src/locales/interfaceTranslations.ts')[id];
 const packages=['interface','inventory','services','rest','phone','events','activities','history'].map(name=>bundled(`src/locales/${id}/${name}.ts`)[`${name}Messages`]);
 const keys=[...Object.keys(original),...Object.keys(openingPackages[id]),...packages.flatMap(Object.keys)];
 assert.equal(new Set(keys).size,keys.length,`${id}: packages must not silently override each other`);
 completedPackages[id]=Object.assign({},...packages);
 for(const name of ['common','hud','status','effects','dialogs','results','eventUi','app','inventory','locations','actions','controllerActions','sleep','shelter','phoneUi','phoneProcess','phoneContent','phoneAnswers','journalUi','events','eventController','rain','travel','trash','actionHistory','inventoryHistory','eventHistory']) {
  const english=Object.values(bundled(`src/locales/en/${name}.ts`))[0];
  for(const key of Object.keys(english))assert(Object.hasOwn(translations[id],key),`${id}: completed interface package is missing ${key}`);
 }
}
assert.deepEqual(Object.keys(completedPackages.pl).sort(),Object.keys(completedPackages.ru).sort(),'completed packages cover the same messages');
for(const [id,settings,plural] of [['en','Settings','21 active goals'],['pl','Ustawienia','21 aktywnych celów'],['ru','Настройки','21 активная цель']]) {
 values.set(preference.LANGUAGE_KEY,id);const actual=bundled('src/i18n/index.ts',true);
 assert.equal(actual.t('phone.ui.app.settings'),settings);
 assert.equal(actual.t('phone.ui.activeGoals',{count:21}),plural);
 if(id!=='en') {
  assert.deepEqual(Object.keys(translations[id]).sort(),Object.keys(actual.en).sort(),`${id}: every current English key has a translation`);
  for(const [key,message]of Object.entries(actual.en))if(typeof message==='string') {
   if(message==='')assert.equal(translations[id][key],'',`${id}: preserve intentional empty message ${key}`);
   else assert(translations[id][key].trim(),`${id}: nonempty source must not silently disappear: ${key}`);
  }
 }
 // Every real plural is now translated. Remove one only in this isolated test
 // instance to keep exercising production fallback with English plural rules.
 const override=id==='en'?null:actual[id],kept=override?.['trash.kept'];
 try {
  if(override)delete override['trash.kept'];
  assert.equal(actual.t('trash.kept',{found:21}),'21 containers kept','English fallback uses English plural rules');
 } finally {if(override)override['trash.kept']=kept;}
 for(const override of [translations.pl,translations.ru])assert.deepEqual(actual.validateCatalog(actual.en,{...actual.en,...override}),[]);
 if(id!=='en') {
  const plurals=new Intl.PluralRules(actual.locale);
  for(const [key,message] of Object.entries(completedPackages[id]))if(typeof message!=='string') {
   for(const count of [0,1,2,4,5,11,12,14,21,22,25,101,102,1.5]) {
    const category=plurals.select(count);
    assert(Object.hasOwn(message,category),`${id}: ${key} needs a ${category} form`);
    const params={};
    for(const match of message.other.matchAll(/\{(\w+)\}/g))params[match[1]]=7;
    params[message.plural]=count;
    const expected=message[category].replace(/\{(\w+)\}/g,(_,name)=>String(params[name]));
    assert.equal(actual.t(key,params),expected,`${id}: ${key}, ${count}`);
   }
  }
  assert.equal(actual.t('item.caption.water',{count:21}),id==='ru'?'21 порция':'21 porcji');
  assert.equal(actual.t('result.containers',{count:22}),id==='ru'?'+22 ёмкости':'+22 opakowania');
  assert.equal(actual.t('trash.kept',{found:21}),id==='ru'?'Собрана 21 ёмкость':'Zebrano 21 opakowań');
  const {inventoryHistoryReflection}=bundled('src/inventoryHistory.ts');
  const water=inventoryHistoryReflection('use:water',{status:'success'});
  assert.equal(water.title,id==='ru'?'Попил воды':'Napiłem się wody','new History headings use the protagonist’s voice');
  assert.equal(water.text,actual.t('history.inventory.drink'));
  const {actionHistoryReflection}=bundled('src/actionHistory.ts');
  assert.equal(actionHistoryReflection({id:'social-support',title:'OLD TITLE',actionHistory:{kind:'action',supportOutcome:'referral'}}).text,actual.t('history.action.support.referral'));
  const saved=[
   {day:3,minute:600,title:'Old saved heading',text:'My old English reflection.',actionTitle:'Drink water',actionId:'use:water',decisionId:'old-decision',groupId:'old-group',reflection:true},
   {day:3,minute:620,title:'Another saved heading',text:'',actionTitle:'Store belongings',actionId:'store-belongings',reflection:true},
  ];
  assert.deepEqual(bundled('src/journal.ts').loadJournalEntries(saved),saved,'switching language preserves stored prose, empty reflections, IDs and grouping');
  const events=bundled('src/events.ts'),spare=events.STREET_EVENTS.find(event=>event.id==='spare-change');
  for(const [locationId,cost]of [['station',1],['street',2]]) {
   const scene=events.prepareStreetEvent(spare,{locationId,housing:'Street'});
   const give=scene.choices.find(choice=>choice.id==='give');
   assert.equal(scene.id,'spare-change');assert.equal(give.moneyRequired,cost);assert.equal(give.outcome.money,-cost);
   assert.equal(scene.text,actual.t(locationId==='street'?'event.spare-change.street.text':'event.spare-change.text'));
   assert.equal(give.label,actual.t(locationId==='street'?'event.spare-change.street.choice.give':'event.spare-change.choice.give'));
  }
  const rain=bundled('src/rainText.ts');
  for(const level of ['drizzle','rain','downpour'])for(const choice of ['nearby','proper','continue','stoppedSearch'])for(const cold of [false,true]) {
   const episode={level,choice:choice==='stoppedSearch'?'proper':choice,searchRemaining:choice==='stoppedSearch'?1:0};
   assert.equal(rain.rainResultText(episode,cold),actual.t(`rain.result.${level}.${choice}${cold?'.cold':''}`));
   assert.equal(rain.rainHistoryText(episode,cold),actual.t(`rain.history.${choice}${cold?'.cold':''}`));
  }
  for(const [key,value]of [['en','English'],['pl','Polski'],['ru','Русский']])assert.equal(actual.t(`phone.ui.language.${key}`),value,'language options keep native names');
  assert.equal(actual.t('journal.ui.completedCount',{count:21}),id==='ru'?'21 выполненная цель':'21 wykonanych celów');
  const {practicalQuestions}=bundled('src/phoneQuestions.ts');
  for(const question of practicalQuestions)for(const field of ['title','noteTitle','text'])assert.equal(question[field],translations[id][`phone.question.${question.id}.${field}`],`${id}: practical question ${question.id} ${field}`);
  assert.equal(practicalQuestions.find(question=>question.id==='morning').text,'','the morning answer intentionally uses places rather than extra prose');
  assert.equal(actual.t('phone.process.rememberAnswer',{answer:'ANSWER'}),id==='ru'?'Ты вспоминаешь\n\nANSWER':'Przypominasz sobie\n\nANSWER','whole answer keeps its paragraph separator');
  const sleep=bundled('src/sleepText.ts');
  assert.equal(sleep.sleepCompletionText(60,false,false),id==='ru'?'Ты спал 1 час.':'Przespałeś 1 godzinę.','sleep duration fits the surrounding sentence');
  assert.equal(sleep.sleepCompletionText(240,false,false),id==='ru'?'Ты спал 4 часа.':'Przespałeś 4 godziny.');
  assert.equal(sleep.sleepCompletionText(330,false,false),id==='ru'?'Ты спал 5 ч 30 мин.':'Przespałeś 5 godz. 30 min.','shortened sleep keeps both duration parameters');
  const rest=bundled(`src/locales/${id}/rest.ts`).restMessages;
  const {shelterDepartureText}=bundled('src/shelterText.ts');
  for(const charging of [false,true])for(const booked of [false,true]) {
   const key=charging?booked?'shelter.departure.resultChargingBooked':'shelter.departure.resultCharging':booked?'shelter.departure.resultBooked':'shelter.departure.result';
   assert.equal(shelterDepartureText(charging,booked),rest[key],`${id}: departure retains the charging/booking alternative`);
  }
  const opening=openingPackages[id];
  // Module-level bindings must resolve the selected language after the existing reload.
  const {OPENING_CALLS}=bundled('src/openingCalls.ts');
  for(const call of OPENING_CALLS)for(const field of ['label','callingTitle','title','text']) {
   const key=`phone.call.${call.id}.${field}`;
   assert.equal(call[field],opening[key],`${id}: module-level call ${key}`);
  }
  const event=bundled('src/events.ts').STREET_EVENTS.find(event=>event.id==='first-night-door');
  assert.equal(event.text,opening['event.first-night-door.text']);
  for(const choice of event.choices) {
   assert.equal(choice.label,opening[`event.first-night-door.choice.${choice.id}`]);
   assert.equal(choice.outcome.message,opening[`event.outcome.first-night-door.${choice.id}.complete`]);
   const reflection=bundled('src/eventHistory.ts').eventHistoryReflection({outcomeId:choice.outcome.historyId,suppliesRejected:false,documents:'carried'});
   assert.equal(reflection.title,opening['history.event.first-night-door.title']);
   assert.equal(reflection.text,opening[`history.event.first-night-door.${choice.id}.complete`]);
  }
  const fullBackpack=bundled('src/eventHistory.ts').eventHistoryReflection({outcomeId:'first-night-door:explain:complete',suppliesRejected:true,documents:'carried'});
  assert.equal(fullBackpack.text,opening['history.event.special.supplies-full'],'the full-backpack alternative is translated too');
  assert.equal(actual.t('journal.ui.resultWithMemory',{result:'RESULT',memory:'MEMORY'}),'RESULT\n\nMEMORY','translated whole-message composition retains both parameters');
 }
}
let flushed=0,reloaded=0;global.Event=class Event{constructor(type){this.type=type}};
global.window={dispatchEvent:event=>{assert.equal(event.type,'pagehide');flushed++},location:{reload:()=>{reloaded++}}};
const hints=new Map();global.sessionStorage={getItem:k=>hints.get(k)??null,setItem:(k,v)=>hints.set(k,v),removeItem:k=>hints.delete(k)};
preference.changeLanguage('ru');assert.equal(flushed,1);assert.equal(reloaded,1);assert.equal(values.get(preference.LANGUAGE_KEY),'ru');
assert(preference.languageReturn());assert(preference.languageReturn(),'StrictMode reads do not consume the navigation hint');preference.clearLanguageReturn();assert(!preference.languageReturn());
localStorage.setItem=()=>{throw new Error('blocked')};assert.throws(()=>preference.changeLanguage('pl'),/blocked/);assert.equal(reloaded,1,'failed preference write does not reload');
delete global.localStorage;delete global.sessionStorage;delete global.window;
console.log('PASS: complete RU/PL coverage of all 27 catalogues, no duplicate keys or accidental empty messages, translated new History and untouched saved records, parameter/plural boundaries, isolated English fallback, event/rain/phone/sleep contexts and language preference lifecycle.');
