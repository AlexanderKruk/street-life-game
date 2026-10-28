const assert = require('node:assert/strict');
const { buildSync } = require('./tests/helpers/build.cjs');
function bundled(path) {
 const code=buildSync({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 const module={exports:{}};new Function('require','module','exports',code)(require,module,module.exports);return module.exports;
}
const values=new Map();global.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
const preference=bundled('src/i18n/language.ts');
assert.equal(preference.loadLanguage(),'en');values.set(preference.LANGUAGE_KEY,'bad');assert.equal(preference.loadLanguage(),'en');
const translations=bundled('src/locales/interfaceTranslations.ts');
for(const [id,settings,plural] of [['en','Settings','21 active goals'],['pl','Ustawienia','21 aktywnych celów'],['ru','Настройки','21 активная цель']]) {
 values.set(preference.LANGUAGE_KEY,id);const actual=bundled('src/i18n/index.ts');
 assert.equal(actual.t('phone.ui.app.settings'),settings);
 assert.equal(actual.t('phone.ui.activeGoals',{count:21}),plural);
 assert.equal(actual.t('result.containers',{count:21}),'+21 containers','English fallback uses English plural rules');
 for(const override of [translations.pl,translations.ru])assert.deepEqual(actual.validateCatalog(actual.en,{...actual.en,...override}),[]);
}
let flushed=0,reloaded=0;global.Event=class Event{constructor(type){this.type=type}};
global.window={dispatchEvent:event=>{assert.equal(event.type,'pagehide');flushed++},location:{reload:()=>{reloaded++}}};
const hints=new Map();global.sessionStorage={getItem:k=>hints.get(k)??null,setItem:(k,v)=>hints.set(k,v),removeItem:k=>hints.delete(k)};
preference.changeLanguage('ru');assert.equal(flushed,1);assert.equal(reloaded,1);assert.equal(values.get(preference.LANGUAGE_KEY),'ru');
assert(preference.languageReturn());assert(preference.languageReturn(),'StrictMode reads do not consume the navigation hint');preference.clearLanguageReturn();assert(!preference.languageReturn());
localStorage.setItem=()=>{throw new Error('blocked')};assert.throws(()=>preference.changeLanguage('pl'),/blocked/);assert.equal(reloaded,1,'failed preference write does not reload');
delete global.localStorage;delete global.sessionStorage;delete global.window;
console.log('PASS: languages, whole-message parameter validation, English fallback plurals, preference validation, flush-before-reload, StrictMode-safe return and blocked storage.');
