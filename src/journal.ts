import type { ResultSummary } from './results'

export type JournalEntry = {
  day: number
  minute: number
  title: string
  text: string
  actionTitle: string
  reflection: true
}

const titles: Record<string, string> = {
  'A familiar face': 'Met my neighbour',
  'An old friend': 'Saw my neighbour’s dog',
  'The door closes': 'Watched someone return home', 'Making a bed on a bench': 'Noticed someone settling in',
  'The last departures': 'Looked around the station', 'Someone needs the bench': 'Woken on a bench',
  'Drink water': 'Drank water', 'Eat food': 'Ate food', 'Refill water': 'Refilled water',
  'Walk with music': 'Walked with music', 'Walk through the city': 'Walked through the city',
  'Rest on the bench': 'Rested on a bench', 'Sit and recover': 'Rested at the station',
  'Sleep complete': 'Woke up', 'Shelter from the rain': 'Waited under cover',
  'Is there a bench nearby? My legs could use a break.': 'Looked for a bench',
  'Where can I get help in the morning?': 'Looked for morning help',
  'How can I get a shelter bed?': 'Looked into shelter registration',
  'What if the shelter has no places?': 'Looked for other options',
  'Where can I get food and water?': 'Looked for supplies',
  'Where can I charge my phone?': 'Remembered a charging point',
  'Watch videos': 'Watched videos', 'Charge phone': 'Charged the phone',
  'Use medicine': 'Took medicine', 'Use wet wipes': 'Cleaned up with wipes',
  'Smoke a cigarette': 'Smoked a cigarette', 'Ask for money': 'Asked for help',
  'Return bottles': 'Returned bottles', 'Return containers': 'Returned bottles & cans', 'Trash search results': 'Searched the bins',
  'Day work': 'Finished a shift', 'Take a shower': 'Took a shower',
  'Ask for a shower': 'Asked for a shower', 'Do laundry': 'Washed clothes',
  'Stay indoors': 'Spent time indoors', 'Settle into your place': 'Settled into Schronisko',
}

const memories: Record<string, string> = {
  'office-routine': 'For a moment, I was back at my old desk by the window. I miss having somewhere to be tomorrow.',
  'redundancy-savings': 'I thought I’d find another job before my savings ran out. Now I’m scared of what comes next.',
  'unanswered-applications': 'I keep checking my inbox. I’m afraid another day will pass without an answer.',
  'lost-home': 'I used to think about finding a home. Tonight I just want to feel safe until morning.',
}

// Reflections describe the actual outcome, never copy the report or its numbers.
// The original action title is retained separately because Street uses it to
// choose the next actions; journal wording must not change that behavior.
export function journalReflection(actionTitle: string, outcome: string, summary?: ResultSummary, memoryId?: string) {
  const rows = [...(summary?.costs ?? []), ...(summary?.changes ?? [])]
  const changed = (label: string, kind: 'positive' | 'negative') => rows.some(row => row.label.includes(label) && row.kind === kind)
  const source = `${actionTitle} ${outcome}`.toLowerCase()
  const negative = changed('Mood', 'negative')
  const failed = /no free places|remaining places|full right now|no appointment|nothing useful|found nothing|not returnable|nobody gives|occupied or unusable|conversation ends|cuts the conversation|not enough|need .* for that|no backpack room|left it behind|backpack full/.test(source)
  let title = titles[actionTitle] ?? (actionTitle.startsWith('Buy ') ? `Bought ${actionTitle.slice(4)}` : actionTitle)
  let text = ''

  if (actionTitle === 'A familiar face') {
    text = failed ? 'I told her what happened. She offered food and water, but I had no room to carry everything.'
      : /need them more|shopping bag/.test(source)
      ? 'I told her what happened. She shared some groceries with me. I feel a little less alone.'
      : /carry her bags|having helped/.test(source)
        ? 'For a few minutes, I was just a neighbour helping with the shopping. It felt good to be useful.'
        : 'I let her go inside without explaining. I’m still out here.'
  } else if (actionTitle === 'An old friend') {
    text = /wet tongue|good scratch/.test(source)
      ? 'He was so happy to see me. For a few minutes, I could just enjoy being with him.'
      : /different path/.test(source)
        ? 'I turned away before they saw me. I wonder if I’ll ever see that dog again.'
        : 'He recognised me and wanted to say hello. I kept walking.'
  } else if (actionTitle === 'The door closes') {
    text = 'For everyone else, the evening still ends at a front door. I keep walking.'
  } else if (actionTitle === 'Making a bed on a bench') {
    text = 'I notice how carefully they keep their things close. I’m starting to understand why.'
  } else if (actionTitle === 'The last departures') {
    text = 'I used to look at the departures. Tonight I’m looking for somewhere to stay.'
  } else if (actionTitle === 'Someone needs the bench') {
    text = 'Waking up in front of a stranger makes me feel exposed. They only wanted a seat.'
  } else if (actionTitle === 'Something happened overnight') {
    title = 'Belongings stolen overnight'
    text = 'My stomach sank when I checked my bag. I don’t feel safe here anymore.'
  } else if (actionTitle === 'Search interrupted') {
    text = 'I was so close to finding an answer. I feel more cut off now.'
  } else if (actionTitle === 'The phone slips') {
    text = changed('Phone condition', 'negative') ? 'My heart sank. I can’t afford to lose my link to everything.' : 'My hands are still shaking. That was too close.'
  } else if (actionTitle === 'Shelter registration') {
    text = failed ? 'I’d let myself hope. Facing another night outside feels harder now.' : 'I can finally let my shoulders drop. Tonight feels less frightening.'
  } else if (actionTitle === 'Sleep complete' || /sleep/.test(actionTitle.toLowerCase())) {
    text = rows.some(row => row.label.includes('Cold') && row.value === 'Started')
      ? 'My throat feels rough and I’m shivering. Being ill out here scares me.'
      : negative ? 'Everything feels stiff. I’m relieved to be awake, but I still don’t feel rested.' : 'My head feels clearer. I’m relieved to have made it through the night.'
  } else if (memoryId && memories[memoryId]) {
    text = memories[memoryId]
  } else if (actionTitle === 'Drink water') {
    text = 'I didn’t realise how thirsty I was.'
  } else if (actionTitle === 'Eat food' || /meal|breakfast|dinner|bread and a roll/.test(actionTitle.toLowerCase())) {
    text = /spoiled/.test(source) ? 'My stomach feels wrong. I wish I’d had a better choice.' : 'I can think a little more clearly now. It’s a relief.'
  } else if (actionTitle === 'Walk with music') {
    text = /rain|wet/.test(outcome.toLowerCase()) ? 'The familiar songs help a little, but I’m anxious about getting soaked.' : 'For a moment, it felt like the walk home from work.'
  } else if (actionTitle === 'Walk through the city') {
    text = /rain|wet/.test(outcome.toLowerCase()) ? 'I feel cold and exposed. I want somewhere dry to stop.' : 'I keep looking at the lit windows. I miss having somewhere to return to.'
  } else if (/bench nearby/.test(actionTitle)) {
    text = failed ? 'My legs ache. Even finding somewhere to sit feels difficult.' : 'I’m relieved to have somewhere to get off my feet.'
  } else if (/rest|recover|indoors/.test(actionTitle.toLowerCase())) {
    text = failed ? 'I was hoping for a little relief. I’m not sure where to try next.' : 'My legs feel less heavy. It helps to stop for a while.'
  } else if (actionTitle === 'Shelter from the rain') {
    text = 'It feels better to be dry. I’m still uneasy about where I’ll spend the night.'
  } else if (actionTitle === 'Searched for more help' || actionTitle === 'No new information') {
    text = 'I keep seeing the same places. I need to decide what to do with what I already know.'
  } else if (/morning|help center found/.test(actionTitle.toLowerCase())) {
    text = 'I feel less lost with somewhere to turn. Waiting until morning still worries me.'
  } else if (/shelter bed|night shelter found/.test(actionTitle.toLowerCase())) {
    text = 'I’m glad to have a plan. I’m afraid to count on a bed before I have one.'
  } else if (/no places/.test(actionTitle.toLowerCase())) {
    text = 'I feel uneasy about relying on one place. I need another option in mind.'
  } else if (/food and water/.test(actionTitle.toLowerCase())) {
    text = 'I feel a little less helpless knowing where to look. I still have to get through tonight.'
  } else if (/charge my phone|charge phone/.test(actionTitle.toLowerCase())) {
    text = 'I feel less cut off. This phone is my link to people and places I need.'
  } else if (/shower|wipes|laundry/.test(actionTitle.toLowerCase())) {
    text = failed ? 'I was looking forward to feeling clean. It’s hard not to feel discouraged.' : 'I feel more like myself. I hadn’t realised how much I needed that.'
  } else if (/medicine|doctor|medical|emergency/.test(actionTitle.toLowerCase())) {
    text = failed ? 'I’m worried about feeling worse. I don’t want to face this alone.' : 'I feel less alone with this. I hope my body has a chance to recover.'
  } else if (/trash|bottles|containers|money/.test(actionTitle.toLowerCase())) {
    text = failed ? 'It’s hard not to feel discouraged. I was counting on a little breathing room.' : changed('Money', 'positive') || changed('Deposit containers', 'positive') || changed('Returnable bottles', 'positive') ? 'I feel a little less cornered. Even something small gives me room to think.' : 'I feel worn out. I’m not sure this is getting me anywhere.'
  } else if (actionTitle.startsWith('Buy ')) {
    text = failed ? 'I feel frustrated. I thought I could make this work.' : 'I feel a little more prepared. I’m still worried about making what I have last.'
  } else if (/support|social worker|job|work|shift|schronisko|shelter extension/.test(actionTitle.toLowerCase())) {
    text = failed || negative ? 'I feel discouraged, but I’m not ready to give up.' : 'I feel a little more hopeful. It helps to have a next step.'
  } else if (actionTitle === 'Arrival') {
    const place = outcome.match(/You arrived at (.+?) by /)?.[1]
    if (place) title = `Arrived at ${place}`
    text = 'I’m glad to have reached somewhere. I feel uncertain about what comes next.'
  } else if (actionTitle === 'Caught in the rain') {
    text = 'I feel cold and exposed. I’m worried about my phone.'
  } else if (actionTitle === 'Trouble nearby') {
    text = 'I still feel tense. I just want to be left in peace.'
  } else if (/offers food|food before closing/.test(actionTitle.toLowerCase())) {
    text = /decline|left it behind|no backpack room/.test(source) ? 'It was kind of them to ask. Being noticed still feels strange.' : 'I feel grateful. It means something that someone noticed me.'
  } else if (actionTitle === 'Coin on the pavement' || actionTitle === 'Coins on the pavement') {
    text = changed('Money', 'positive') ? 'I feel lucky for once. I needed a small break.' : 'I hope they help someone else. That thought feels good.'
  } else if (actionTitle === 'Woken by a patrol' || actionTitle === 'A patrol in the waiting hall') {
    text = /documents are stored at the shelter/.test(source) ? 'My papers are safe at the shelter. I wish I had them with me for that conversation.' : /documents are missing/.test(source) ? 'I felt exposed having to explain my missing documents. I need to get them sorted out.' : /step out into the street/.test(source) ? 'I am outside again. I need to work out where I can rest next.' : 'Being woken like that left me tense. I am glad the conversation is over.'
  } else if (actionTitle === 'A rustle behind you' || actionTitle === 'A rustle in the dark') {
    text = /a cat/.test(source) ? 'Just a cat. I feel relieved now that I know what made the noise.' : /longer route/.test(source) ? 'I took the longer way around. I would rather keep moving than find out what was there.' : 'I waited, but the sound did not return. I still do not know what made it.'
  } else if (actionTitle === 'Cold fingers') {
    text = /put up|curl your fingers/.test(source) ? 'I keep thinking about somewhere warm. My hands remind me how long I have been outside.' : 'I feel a little warmer. Even small comforts matter out here.'
  } else if (actionTitle === 'The city wakes up') {
    text = 'A new day is starting around me. I need to decide what to do with mine.'
  } else if (actionTitle === 'Cleaning the hall') {
    text = 'It was just someone doing their job. I was relieved that I did not have to explain myself.'
  } else if (actionTitle === 'Which platform?') {
    text = /not sure either/.test(source) ? 'They just saw another traveller. For a moment, I felt like one.' : 'Being able to help someone made me feel a little more like myself.'
  } else if (actionTitle === 'A useful tip') {
    text = failed || negative ? 'I feel awkward about how that went. Asking isn’t getting easier.' : /not to stop/.test(source) ? 'I wasn’t ready to speak. I wonder if I missed a chance.' : 'I feel less alone. Maybe there’s still a way forward.'
  } else if (actionTitle === 'Peaceful rest' || actionTitle === 'A quiet night') {
    text = 'I feel relieved. I hadn’t realised how tense I was before resting.'
  } else if (actionTitle === 'Ticket inspection') {
    text = 'I can breathe again. I don’t need another thing to worry about.'
  } else if (/store|collect/.test(actionTitle.toLowerCase())) {
    text = failed ? 'I feel frustrated by how little room I have.' : 'I feel a little more organised. Keeping track of my things matters now.'
  } else if (/videos|cigarette/.test(actionTitle.toLowerCase())) {
    text = 'I needed a moment away from my thoughts. They’re still there when I stop.'
  } else if (actionTitle === 'Shelter checkout') {
    text = 'I’m uneasy about being outside again. I need to work out where to go.'
  } else if (negative || failed || changed('Health', 'negative')) {
    text = 'I feel unsettled. I need a moment to work out what to do next.'
  } else if (changed('Mood', 'positive')) {
    text = 'I feel a little steadier. Right now, that matters.'
  }
  return { title, text }
}

export function loadJournalEntries(saved: unknown): JournalEntry[] {
  if (!Array.isArray(saved)) return []
  return saved.filter(entry => entry && Number.isInteger(entry.day) && entry.day > 0
    && Number.isFinite(entry.minute) && entry.minute >= 0 && entry.minute < 1440
    && typeof entry.title === 'string' && typeof entry.text === 'string' && entry.title !== 'Current situation')
    .slice(-500).map(entry => {
      const actionTitle = typeof entry.actionTitle === 'string' ? entry.actionTitle : entry.title
      const legacySummary = Array.isArray(entry.summary?.costs) && Array.isArray(entry.summary?.changes)
        ? { costs: entry.summary.costs.filter(validChange), changes: entry.summary.changes.filter(validChange) } : undefined
      const memoryId = /a steady office job/.test(entry.text) ? 'office-routine'
        : /ordinary expenses/.test(entry.text) ? 'redundancy-savings'
        : /redundancy email/.test(entry.text) ? 'unanswered-applications'
        : /looking for a place to live/.test(entry.text) ? 'lost-home' : undefined
      const reflection = entry.reflection === true ? { title: entry.title, text: entry.text }
        : journalReflection(actionTitle, entry.text, legacySummary, memoryId)
      return { day: entry.day, minute: entry.minute, actionTitle, reflection: true, ...reflection }
    })
}

function validChange(row: unknown): row is ResultSummary['changes'][number] {
  if (!row || typeof row !== 'object') return false
  const change = row as Record<string, unknown>
  return typeof change.label === 'string' && typeof change.value === 'string'
    && ['positive', 'negative', 'neutral'].includes(String(change.kind))
}
