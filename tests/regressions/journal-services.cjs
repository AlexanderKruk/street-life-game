const env = require('../helpers/regression-env.cjs');
const { React, render, screen, within, cleanup, assert, App, stateKey, invKey, lifeKey, read, setup, click, beginSleep, ok, near } = env;
// Journal stores reflections once, preserves completion timestamps and browses days.
const historyKey='street-life-journal-history-v1';
setup({locationId:'shop',minutes:600},{[invKey]:{water:0}});
assert.deepEqual(read(historyKey),[]);click('Buy Water for 3.00 zł');
assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].minute,603);assert.equal(read(historyKey)[0].day,1);
assert.equal(read(historyKey)[0].title,'Bought Water');assert.equal(read(historyKey)[0].actionTitle,'Buy Water');
assert.equal(read(historyKey)[0].summary,undefined);assert(!read(historyKey)[0].text.includes('3 zł'));
assert(screen.getByRole('dialog').textContent.includes('−3 zł'));
ok();click(/Inventory$/);click(/Water.*tap to drink/);assert.equal(read(historyKey).length,2);ok();click('Phone');click('History');
assert.deepEqual([...document.querySelectorAll('.timeline-entry strong')].map(node=>node.textContent),['Drank water','Bought Water']);
assert(document.querySelector('.timeline').textContent.includes('I didn’t realise how thirsty I was.'));
const purchaseEntry=[...document.querySelectorAll('.timeline-entry')].find(entry=>entry.querySelector('strong').textContent==='Bought Water');
assert(!purchaseEntry.querySelector('.journal-thought'),'routine purchase keeps its heading without a filler reflection');
assert(!document.querySelector('.timeline').textContent.includes('You drank water'));
assert(!document.querySelector('.timeline').textContent.includes('Current situation'));
assert(!document.querySelector('.journal-result-changes'));assert(!document.querySelector('.journal-heading > span'));
assert(screen.getByRole('button',{name:'Previous day'}).disabled);assert(screen.getByRole('button',{name:'Next day'}).disabled);
cleanup();render(React.createElement(App));assert.equal(read(historyKey).length,2);
const yesterday=read(historyKey);
setup({day:3},{[historyKey]:yesterday});click('Phone');click('History');
assert(screen.getByRole('heading',{name:'Day 2 · We'}));assert(screen.getByText('No recorded actions today yet.'));
assert(screen.getByRole('button',{name:'Next day'}).disabled);
click('Previous day');assert(screen.getByRole('heading',{name:'Day 1 · Tu'}));assert(screen.getByText('No recorded actions on this day.'));
click('Previous day');assert(screen.getByRole('heading',{name:'Day 0 · Mo'}));assert(document.querySelector('.timeline').textContent.includes('Bought Water'));
assert(screen.getByRole('button',{name:'Previous day'}).disabled);assert(!screen.getByRole('button',{name:'Next day'}).disabled);
click('Next day');assert(screen.getByRole('heading',{name:'Day 1 · Tu'}));click('Next day');assert(screen.getByRole('heading',{name:'Day 2 · We'}));
click('Previous day');click(/Inventory$/);click('Phone');click('History');assert(screen.getByRole('heading',{name:'Day 2 · We'}));
assert.equal(read(historyKey).length,2);click('Reset save');assert.deepEqual(read(historyKey),[]);
setup({minutes:1380,energy:90});beginSleep(/Lie down here\? I’m not sure… But I could try./,2);assert.deepEqual(read(historyKey),[]);
click('Wake up (debug)');assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].day,2);assert.equal(read(historyKey)[0].minute,60);assert.equal(read(historyKey)[0].title,'Woke up');
// Existing reports migrate in place; malformed rows cannot erase valid history.
const oldReport={day:1,minute:600,title:'Drink water',text:'You drank water.',summary:{costs:[],changes:[{label:'💧 Water',value:'+34',kind:'positive'},null]}};
setup({day:2},{[historyKey]:[oldReport,{day:0,minute:20,title:'Bad',text:'Bad'}]});click('Phone');click('History');click('Previous day');
assert.equal(read(historyKey).length,1);assert.equal(read(historyKey)[0].minute,600);assert.equal(read(historyKey)[0].summary,undefined);
assert.equal(read(historyKey)[0].actionTitle,'Drink water');assert(document.querySelector('.journal-thought').textContent.startsWith('I'));
cleanup();render(React.createElement(App));click('History');assert(screen.getByRole('heading',{name:'Day 1 · Tu'}));assert.equal(read(historyKey).length,1);
require('../helpers/build.cjs').buildSync({entryPoints:['src/journal.ts'],bundle:true,define:{'import.meta.env':'{"VITE_CLOTHING_WETNESS_ENABLED":"true"}'},platform:'node',format:'cjs',outfile:process.env.STREET_REGRESSION_JOURNAL});
const {journalReflection}=require(process.env.STREET_REGRESSION_JOURNAL);
// Laundry drop-off must not claim clothes are already clean, and unavailable
// care/support must not imply treatment or a successful application.
const laundryDrop=journalReflection('Leave clothes for laundry','You leave your clothes for the Thursday laundry.');
const laundryDone=journalReflection('Collect clean laundry','You collect your clean clothes.');
const laundryFull=journalReflection('Do laundry','Day Center is full right now. You wait for a while, but no place opens up.');
assert(!/clean clothes/.test(laundryDrop.text));assert(laundryDrop.text.includes('come back'));
assert(laundryDone.text.includes('clean clothes'));assert(!/clean clothes again/.test(laundryFull.text));
const treated=journalReflection('Recovery accelerated','You take one tablet. Recovery from this cold is three times faster, but the symptoms will take time to pass. One dose is enough.');
assert(treated.text.includes('medicine'));assert(!/cured|recovered|no longer ill/.test(treated.text));
const supportBlocked=journalReflection('Social support','Your documents are stored at the shelter. Take them with you for this application.');
const supportReferral=journalReflection('Social support','The social worker gives you a referral to Schronisko. The address is saved on your map.');
assert(supportBlocked.text.includes('papers'));assert(!supportBlocked.text.includes('referral'));
assert(supportReferral.text.includes('still need to go there'),'a referral does not imply admission');
const refused=journalReflection('Shelter registration','No free places today.',{costs:[],changes:[{label:'🙂 Mood',value:'−5',kind:'negative'}]});
const admittedReflection=journalReflection('Shelter registration','A place is available.',{costs:[],changes:[{label:'🙂 Mood',value:'+3',kind:'positive'}]});
assert.notEqual(refused.text,admittedReflection.text);assert(!refused.text.includes('let my shoulders drop'));
assert(!/\d|[+−]/.test(refused.text+admittedReflection.text));
// Reusable discoveries and rain History do not invent a wait until morning
// or an unbooked night; these same actions can finish during the day.
for(const actionTitle of ['Where can I get help in the morning?','Help Center found','Where can I get food and water?','Shelter from the rain']) {
 const reflection=journalReflection(actionTitle,'You find useful help.');
 assert(reflection.text.length>0);
 assert(!/tonight|until morning|spend the night/i.test(reflection.text),actionTitle+' stays valid by day and with a reserved bed');
}
// A daytime sleep must not invent a night outside; saved reflections stay intact.
setup({locationId:'residential-shelter',minutes:600,energy:90},{[historyKey]:yesterday});
beginSleep(/Sleep safely/,2);click('Wake up (debug)');
const rested=read(historyKey).at(-1);
assert.equal(rested.actionTitle,'Sleep complete');assert.equal(rested.minute,720);
assert(rested.text.startsWith('My head feels clearer.'));
assert(!/night|morning/i.test(rested.text),'sleep reflection works at any time of day');
assert.deepEqual(read(historyKey).slice(0,yesterday.length),yesterday,'copy changes do not rewrite saved reflections');
const stolen=journalReflection('While you were asleep','Some cash is gone, and your documents are missing.');
assert.equal(stolen.title,'Belongings stolen');assert(!/overnight/i.test(stolen.title));
assert.deepEqual(journalReflection('Something happened overnight','Some cash is gone, and your documents are missing.'),stolen,'legacy event titles retain their reflection');
// Journal goals follow real progress, stay completed, and reminders expire sensibly.
const journalKey='street-life-journal-goals-v1',reminderKey='street-life-goal-v1';
setup({minutes:600});click('Phone');click('Goals');assert.equal(document.querySelector('.phone-goals-count').textContent,'4');assert(!document.querySelector('.completed-goals'));assert.equal(document.querySelector('.main-goal strong').textContent,'Get through the morning');assert(!document.querySelector('.next-event'));
setup({day:1,minutes:1320});assert(!read(journalKey).morning);
setup({day:2,minutes:719});assert(!read(journalKey).morning);
setup({day:2,minutes:720});assert(read(journalKey).morning);
setup({locationId:'shelter',minutes:1140},{[lifeKey]:{housing:'Street',shelterRegistrationAttemptDay:1,shelterVacancies:0}});assert(!read(journalKey).shelter);
setup({locationId:'street'},{[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}});assert(read(journalKey).shelter);
setup({locationId:'support',minutes:1000});assert(!read(journalKey).support);
setup({locationId:'support',minutes:600});assert(read(journalKey).support);click('Phone');click('Goals');assert.equal(document.querySelector('.phone-goals-count').textContent,'3');assert.equal(document.querySelector('.completed-goals summary > span').textContent,'1');assert(!document.querySelector('.completed-goals').open);assert(!within(document.querySelector('.journal-goals > .goal-list')).queryByText('Visit social support'));assert(within(document.querySelector('.completed-goals')).getByText('Visit social support').closest('.goal').classList.contains('done'));cleanup();render(React.createElement(App));assert(read(journalKey).support);
setup({locationId:'work',minutes:1200});assert(!read(journalKey).work);
setup({locationId:'street',minutes:600},{'street-life-discovered-v1':['street','station','shop']});const directSearchBattery=read(invKey).phoneBattery;click('Phone');click('Find Help');click('Work');assert(read(journalKey).work);assert(Math.abs(read(invKey).phoneBattery-(directSearchBattery-15*.4*1.196))<1e-8);ok();
setup({locationId:'street',day:2,minutes:1000},{[journalKey]:{morning:true,shelter:true,support:true,work:true}});click('Phone');click('Goals');assert.equal(document.querySelector('.phone-goals-count').textContent,'0');assert.equal(document.querySelector('.completed-goals summary > span').textContent,'4');assert(!document.querySelector('.main-goal'));assert(screen.getByText('All starting goals completed.'));
click('Reset save');assert.deepEqual(read(journalKey),{morning:false,shelter:false,support:false,work:false});
assert.equal(read(stateKey).minutes,1320);assert.equal(read(stateKey).day,1);assert.equal(read(stateKey).locationId,'street');assert(document.querySelector('.story-scene').textContent.includes('Behind the lit windows, people are getting ready for bed.'));cleanup();localStorage.clear();render(React.createElement(App));assert.equal(read(stateKey).minutes,1320);assert.equal(read(stateKey).day,1);assert(!read(journalKey).morning);
setup({day:2,minutes:600},{[reminderKey]:{type:'night-shelter',day:1,minute:1140}});assert.equal(read(reminderKey).day,2);click('Phone');click('Goals');assert.equal(document.querySelector('.main-goal strong').textContent,'Find a safe place to sleep');assert(document.querySelector('.main-goal small').textContent.includes('Day 1 at 18:00'));assert.equal(screen.getAllByText('Find a safe place to sleep').length,1);
setup({locationId:'shelter',day:2,minutes:1140},{[reminderKey]:{type:'night-shelter',day:2,minute:1080}});assert(!localStorage.getItem(reminderKey));assert(!read(journalKey).shelter);
// Clothing caps every gain, migrates wear, and laundry cleans without repairing it.
setup({hygiene:90},{[invKey]:{jacket:42}});assert.equal(read(invKey).jacket,42);assert.equal(read(invKey).clothingCleanliness,90);assert.equal(read(stateKey).hygiene,90);
for(const [cleanliness,cap] of [[80,100],[60,80],[20,60]]) {
 setup({locationId:'daycenter',hygiene:55},{[invKey]:{clothingCleanliness:cleanliness,showerGel:2}});Math.random=()=>.85;click(/Take a shower/);assert.equal(read(stateKey).hygiene,cap);assert.equal(read(invKey).showerGel,1);ok();cleanup();render(React.createElement(App));assert.equal(read(stateKey).hygiene,cap);
}
setup({hygiene:95},{[invKey]:{clothingCleanliness:39,wipes:1}});assert.equal(read(stateKey).hygiene,60);click(/Inventory$/);assert(screen.getByText('Clothing'));assert(screen.getByRole('button',{name:/^Wet wipes/}).disabled);
setup({locationId:'daycenter',hygiene:50},{[invKey]:{clothingCleanliness:10,jacket:42}});Math.random=()=>.85;click(/Do laundry/);assert.equal(read(invKey).clothingCleanliness,100);assert.equal(read(invKey).jacket,42);assert(read(stateKey).hygiene<100);assert(screen.getByRole('dialog').textContent.includes('Clothing cleanliness'));ok();
setup({locationId:'daycenter'},{[invKey]:{clothingCleanliness:10}});Math.random=()=>.99;click(/Do laundry/);assert(read(invKey).clothingCleanliness<10);
setup({locationId:'shelter',day:4,minutes:1080},{[invKey]:{clothingCleanliness:10,jacket:42},[lifeKey]:{housing:'Night shelter',shelterUntilDay:7,shelterLaundryDropDay:4}});click(/Collect clean laundry/);assert.equal(read(invKey).clothingCleanliness,100);assert.equal(read(invKey).jacket,42);ok();assert(screen.getByRole('button',{name:/Collect clean laundry/}).disabled);
setup({locationId:'shelter',day:4,minutes:390},{[invKey]:{clothingCleanliness:10},[lifeKey]:{housing:'Night shelter',shelterUntilDay:7}});click(/Leave clothes for laundry/);assert(read(invKey).clothingCleanliness<10);
setup({energy:68,minutes:1380},{[invKey]:{clothingCleanliness:100}});beginSleep(/Lie down here\? I’m not sure… But I could try./,4);click('Wake up (debug)');near(read(invKey).clothingCleanliness,90);
// Inventory slots reflect actual stack occupancy, including passive supplies.
const emptyBag={water:0,food:0,medicines:0,bread:0,cannedFood:0,wipes:0,showerGel:0,cigarettes:0,bottles:0};
setup({}, {[invKey]:emptyBag});click(/^Inventory$/);
assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,0);
assert(screen.getByText('Your backpack is empty.'));
assert(!document.querySelector('.backpack-capacity'));
setup({}, {[invKey]:{...emptyBag,water:5,showerGel:21,bottles:9}});click(/^Inventory$/);
assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,6);
assert.equal(document.querySelectorAll('.empty-slot').length,0);
assert.equal(screen.getAllByRole('button',{name:/Water.*tap to drink/}).length,2);
assert(screen.getByRole('group',{name:/3-in-1 shower gel ×20/}));
assert(screen.getByRole('group',{name:/3-in-1 shower gel ×1 ·/}));
assert(screen.getByRole('group',{name:/Bottles & cans ×8/}));
assert(screen.getByRole('group',{name:/Bottles & cans ×1 ·/}));
click(/Water ×1 · tap to drink/);ok();
assert.equal(read(invKey).water,4);assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,5);
setup({}, {[invKey]:{water:4,food:4,medicines:4,bread:4,cannedFood:4,wipes:5,showerGel:20,cigarettes:20,bottles:0}});click(/^Inventory$/);
assert.equal(document.querySelectorAll('.backpack-grid > .inventory-slot').length,8);
assert.equal(document.querySelectorAll('.empty-slot').length,0);
assert.equal(document.querySelectorAll('.essentials-grid > .inventory-item').length,4);
// Splitting the combined center preserves known addresses and moves medical care.
setup({locationId:'daycenter'},{'street-life-discovered-v1':['street','daycenter']});
assert(read('street-life-discovered-v1').includes('free-clinic'));
assert(!screen.queryByRole('button',{name:/See a doctor/}));
assert(screen.getByRole('button',{name:/Take a shower/}));
click(/^Map$/);
assert(screen.getByRole('button',{name:/^Free Clinic /}));
assert(!document.querySelector('.district-label').textContent.includes('You are here'));
setup({locationId:'free-clinic',health:40},{[invKey]:{documents:false},'street-life-effects-v1':[{id:'cold',remaining:240}]});
const clinicMoney=read(stateKey).money;Math.random=()=>.85;
click(/See a doctor/);
assert.equal(read(stateKey).money,clinicMoney);
assert(read(stateKey).health>40);
assert(!read('street-life-effects-v1').some(effect=>effect.id==='cold'));
ok();assert(!screen.queryByRole('button',{name:/Take a shower/}));
setup({locationId:'free-clinic',minutes:1020});
assert(document.querySelector('.closed-content-notice'));
assert([...document.querySelectorAll('.closed-content-body button')].find(button=>button.textContent.includes('See a doctor')).disabled);
console.log('PASS: shelter, sleep, journal and needs scenarios.');

env.finish();
