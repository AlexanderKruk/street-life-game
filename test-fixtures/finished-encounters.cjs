// Baseline worlds for unrelated mechanic checks. Fresh queues are exercised in check-events.cjs.
const ordinary = ['night-patrol','park-company','borrow-phone','borrow-phone-slip','street-patrol-wake','station-patrol-wake','city-waking','night-rustle','cold-hands','station-cleaning','platform-question','phone-drop','rain-phone','found-coins','free-snack','ticket-check','station-food','useful-tip','rough-crowd','quiet-night','night-theft','spare-change','dropped-glove'];
const opening = ['first-night-door','first-night-dog','first-night-bench','first-night-station','first-night-bench-wake'];
module.exports = function finishEncounters(storage, includeOpening = true) {
 storage.setItem('street-life-encounters-v1', JSON.stringify({seen:ordinary,lastAt:null,pendingId:null}));
 if(includeOpening) storage.setItem('street-life-first-night-events-v1',JSON.stringify({seen:opening,lastAt:null,pendingId:null}));
};
