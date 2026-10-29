const assert = require('node:assert/strict');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
 const code=buildSync({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 const module={exports:{}};new Function('require','module','exports',code)(require,module,module.exports);return module.exports;
}
const values=new Map();global.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
const preference=bundled('src/i18n/language.ts');
assert.equal(preference.loadLanguage(),'en');values.set(preference.LANGUAGE_KEY,'bad');assert.equal(preference.loadLanguage(),'en');
const translations={...bundled('src/locales/pl/index.ts'),...bundled('src/locales/ru/index.ts')};
const openingPackages={pl:bundled('src/locales/pl/opening.ts').opening,ru:bundled('src/locales/ru/opening.ts').opening};
assert.deepEqual(Object.keys(openingPackages.pl).sort(),Object.keys(openingPackages.ru).sort(),'the reference package covers the same messages in both languages');
for(const [id,settings,plural] of [['en','Settings','21 active goals'],['pl','Ustawienia','21 aktywnych celów'],['ru','Настройки','21 активная цель']]) {
 values.set(preference.LANGUAGE_KEY,id);const actual=bundled('src/i18n/index.ts');
 assert.equal(actual.t('phone.ui.app.settings'),settings);
 assert.equal(actual.t('phone.ui.activeGoals',{count:21}),plural);
 assert.equal(actual.t('result.containers',{count:21}),'+21 containers','English fallback uses English plural rules');
 for(const override of [translations.pl,translations.ru])assert.deepEqual(actual.validateCatalog(actual.en,{...actual.en,...override}),[]);
 if(id!=='en') {
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
console.log('PASS: languages, parameter validation, English fallback plurals, complete opening calls/event/History in RU/PL including full backpack, preference validation, flush-before-reload, StrictMode-safe return and blocked storage.');
