export type EventTrigger = 'travel' | 'location' | 'wake'

export type EventContext = {
  locationId: string
  travelMode?: 'walk' | 'transit'
  weather: string
  housing: 'Street' | 'Night shelter' | 'Schronisko'
  documents: boolean
}

export type EventOutcome = {
  message: string
  minutes?: number
  money?: number
  mood?: number
  energy?: number
  health?: number
  hygiene?: number
  food?: number
  water?: number
  phoneCondition?: number
  jacketCondition?: number
  loseDocuments?: boolean
}

export type DiceCheck = {
  stat: 'reflex'
  dc: number
  success: EventOutcome
  failure: EventOutcome
  criticalSuccess?: EventOutcome
  criticalFailure?: EventOutcome
}

export type StreetEventChoice = {
  label: string
  outcome?: EventOutcome
  check?: DiceCheck
}

export type StreetEvent = {
  id: string
  trigger: EventTrigger
  icon: string
  title: string
  text: string
  weight: number
  eligible?: (context: EventContext) => boolean
  choices: StreetEventChoice[]
}

export const STREET_EVENTS: StreetEvent[] = [
  { id:'phone-drop', trigger:'travel', icon:'📱', title:'The phone slips', text:'Your old phone slips from your hand while you are walking. You have a split second to react.', weight:3, eligible:c=>c.travelMode==='walk', choices:[
    { label:'Try to catch it · Reflex DC 11', check:{ stat:'reflex', dc:11,
      success:{ mood:2, message:'You catch the phone just before it hits the pavement.' },
      failure:{ phoneCondition:-8, mood:-3, message:'Too slow. The phone hits the pavement and takes damage.' },
      criticalSuccess:{ mood:4, message:'Perfect catch. Somehow you snatch it out of the air without breaking stride.' },
      criticalFailure:{ phoneCondition:-15, mood:-6, message:'It slips through your fingers twice and hits the pavement hard.' }
    }},
    { label:'Let it fall', outcome:{ phoneCondition:-8, mood:-3, message:'You do not risk the grab. The phone hits the pavement and takes damage.' } }
  ]},
  { id:'rain-phone', trigger:'travel', icon:'🌧️', title:'Caught in the rain', text:'Rain gets through your clothes and your phone gets damp.', weight:4, eligible:c=>c.travelMode==='walk' && (c.weather==='Rain' || c.weather==='Showers'), choices:[
    { label:'Hide it under the jacket', outcome:{ jacketCondition:-2, phoneCondition:-3, mood:-2, message:'You protected it as best you could, but some moisture got inside.' } },
    { label:'Keep moving', outcome:{ phoneCondition:-10, mood:-1, message:'You save time, but the wet phone starts behaving strangely.' } }
  ]},
  { id:'found-coins', trigger:'travel', icon:'🪙', title:'Coins on the pavement', text:'Something glints beside the curb.', weight:4, choices:[
    { label:'Pick them up', outcome:{ money:6, message:'A few coins. +6 zł.' } },
    { label:'Leave them', outcome:{ mood:1, message:'You leave them for someone who may need them more.' } }
  ]},
  { id:'free-snack', trigger:'travel', icon:'🥪', title:'Someone offers food', text:'A passer-by offers you a packaged sandwich.', weight:3, choices:[
    { label:'Take it', outcome:{ food:1, mood:2, message:'You put the sandwich in your backpack.' } },
    { label:'No thanks', outcome:{ message:'You politely decline and keep going.' } }
  ]},
  { id:'ticket-check', trigger:'travel', icon:'🎫', title:'Ticket inspection', text:'Inspectors enter the vehicle and start checking tickets.', weight:3, eligible:c=>c.travelMode==='transit', choices:[
    { label:'Show your ticket', outcome:{ message:'Everything is in order. You continue the trip.' } }
  ]},
  { id:'station-food', trigger:'location', icon:'🥐', title:'Food before closing', text:'A worker has a small bag of unsold food and asks if you want it.', weight:3, eligible:c=>c.locationId==='station', choices:[
    { label:'Accept', outcome:{ food:1, mood:3, message:'You received some food for later.' } },
    { label:'Decline', outcome:{ message:'You thank them and decline.' } }
  ]},
  { id:'useful-tip', trigger:'location', icon:'💬', title:'A useful tip', text:'Someone nearby tells you about places where people can get help.', weight:4, choices:[
    { label:'Listen', outcome:{ minutes:10, mood:3, message:'The conversation costs a little time, but gives you some hope.' } },
    { label:'Keep going', outcome:{ message:'You decide not to stop.' } }
  ]},
  { id:'rough-crowd', trigger:'location', icon:'⚠️', title:'Trouble nearby', text:'An argument nearby is getting louder. Staying around feels risky.', weight:2, eligible:c=>c.locationId==='station', choices:[
    { label:'Move away', outcome:{ minutes:10, energy:-2, message:'You move to another part of the station and avoid trouble.' } },
    { label:'Stay where you are', outcome:{ mood:-5, message:'Nothing happens to you, but the situation leaves you tense.' } }
  ]},
  { id:'quiet-night', trigger:'wake', icon:'🌙', title:'A quiet night', text:'For once, the night passes without trouble.', weight:5, choices:[
    { label:'Get up', outcome:{ mood:5, energy:5, message:'A quiet night gave you a little extra strength.' } }
  ]},
  { id:'night-theft', trigger:'wake', icon:'🎒', title:'Something happened overnight', text:'You wake up and notice that someone went through your things.', weight:2, eligible:c=>c.housing==='Street', choices:[
    { label:'Check your things', outcome:{ money:-5, mood:-7, loseDocuments:true, message:'Some cash is gone, and your documents are missing.' } }
  ]},
]

export function pickStreetEvent(trigger: EventTrigger, context: EventContext, chance: number) {
  if (Math.random() >= chance) return null
  const pool = STREET_EVENTS.filter(event => event.trigger === trigger && (!event.eligible || event.eligible(context)))
  if (!pool.length) return null
  const total = pool.reduce((sum, event) => sum + event.weight, 0)
  let roll = Math.random() * total
  for (const event of pool) {
    roll -= event.weight
    if (roll <= 0) return event
  }
  return pool[pool.length - 1]
}
