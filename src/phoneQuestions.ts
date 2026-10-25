export const PHONE_SEARCH_ESTIMATE = 15

export const practicalQuestions = [
    { id: 'morning', icon: '💬', title: 'Where can I get help in the morning?', noteTitle: 'Daytime help', text: '', locations: ['support', 'daycenter', 'free-clinic'] },
    { id: 'bed', icon: '🛏️', title: 'How can I get a shelter bed?', noteTitle: 'Registration', text: 'Arrive before 18:00. Doors open at 18:00; registration runs 18:20–22:00. Wait at least 20 minutes and until registration opens.\n\nArrival sets your queue priority; leaving loses it. Only 0–3 beds are free each day, so arriving early does not guarantee a place. Successful registration reserves seven nights.', locations: ['shelter'] },
    { id: 'no-place', icon: '🤔', title: 'What if the shelter has no places?', noteTitle: 'If there is no shelter bed', text: 'Try registration earlier the next evening. During the day, ask Help Center about accommodation and a Schronisko referral.\n\nStation benches and outdoor cover are temporary options. Neither guarantees safe sleep.', locations: [] },
    { id: 'supplies', icon: '🥪', title: 'Where can I get food and water?', noteTitle: 'Food and meals', text: 'Buy supplies at Small Shop or use food and water in your backpack.\n\nRegistered Night Shelter guests get dinner 19:00–20:30 and breakfast 06:30–07:00. You need a reserved bed and access to the shelter; knowing the address is not enough.', locations: ['shop'] },
    { id: 'work', icon: '💼', title: 'Where can I find paid work?', noteTitle: 'Taking a shift', text: 'Arrive during opening hours with enough Energy for three hours of physical work. You collect your pay when the shift ends.', locations: ['work'] },
    { id: 'clinic', icon: '🩺', title: 'Where can I get medical help?', noteTitle: 'Getting care', text: 'No insurance or documents needed. Come early: the clinic may be full later in the day.', locations: ['free-clinic'] },
    { id: 'charging', icon: '🔋', title: 'Where can I charge my phone?', noteTitle: 'Phone charging', text: 'Use the outlet in the station waiting room. One hour adds up to 60% battery. No internet needed.', locations: ['station'] },
  ]
