import { illustrateStreetEvent } from './eventArtwork'

export type EventTrigger = 'travel' | 'location' | 'wake' | 'walk' | 'bench'

export function firstNightTime(state: { day: number; minutes: number }) {
  const minute = (state.day - 1) * 1440 + state.minutes
  return minute >= 1320 && minute < 1800
}

export type EventContext = {
  locationId: string
  travelMode?: 'walk' | 'transit' | 'fare-dodge'
  weather: string
  housing: 'Street' | 'Night shelter' | 'Schronisko'
  documents: boolean
  firstNight?: boolean
  sleepKind?: 'ground' | 'bench' | 'shelter' | 'residential'
  seenEventIds?: string[]
}

export type EventOutcome = {
  message: string
  randomCoin?: boolean
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
  illustration?: string
  discoverLocation?: string
}

export const FOUND_COIN_DENOMINATIONS = [
  { grosz: 1, weight: 10 }, { grosz: 2, weight: 15 }, { grosz: 5, weight: 20 },
  { grosz: 10, weight: 20 }, { grosz: 20, weight: 15 }, { grosz: 50, weight: 12 },
  { grosz: 100, weight: 5 }, { grosz: 200, weight: 2 }, { grosz: 500, weight: 1 },
] as const

export function resolveEventOutcome(outcome: EventOutcome, random = Math.random): EventOutcome {
  if (!outcome.randomCoin) return outcome
  let roll = random() * 100
  for (const coin of FOUND_COIN_DENOMINATIONS) {
    if (roll < coin.weight) {
      const denomination = coin.grosz < 100 ? `${coin.grosz} gr` : `${coin.grosz / 100} zł`
      return { ...outcome, randomCoin: false, money: coin.grosz / 100, message: `You pick up a ${denomination} coin.` }
    }
    roll -= coin.weight
  }
  return { ...outcome, randomCoin: false, money: 5, message: 'You pick up a 5 zł coin.' }
}

export type DiceCheck = {
  stat: 'reflex' | 'persuasion'
  dc: number
  requirements?: { minEnergy?: number; minHealth?: number }
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
  illustration?: string
  icon: string
  title: string
  text: string
  weight: number
  eligible?: (context: EventContext) => boolean
  choices: StreetEventChoice[]
}

export const STREET_EVENTS: StreetEvent[] = [
  { id:'phone-drop', trigger:'travel', icon:'📱', title:'The phone slips', text:'Your old phone slips from your hand while you are walking. You have a split second to react.', weight:3, eligible:c=>c.travelMode==='walk', choices:[
    { label:'Try to catch it · Reflex DC 11', check:{ stat:'reflex', dc:11, requirements:{ minEnergy:20, minHealth:20 },
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
  { id:'found-coins', trigger:'travel', icon:'🪙', title:'Coin on the pavement', text:'Something glints beside the curb.', weight:4, choices:[
    { label:'Pick it up', outcome:{ randomCoin:true, message:'You pick up the coin.' } },
    { label:'Leave it', outcome:{ mood:1, message:'You leave it for someone who may need it more.' } }
  ]},
  { id:'free-snack', trigger:'travel', icon:'🥪', title:'Someone offers food', text:'A passer-by offers you a packaged sandwich.', weight:3, eligible:c=>!c.firstNight, choices:[
    { label:'Take it', outcome:{ food:1, mood:2, message:'You put the sandwich in your backpack.' } },
    { label:'No thanks', outcome:{ message:'You politely decline and keep going.' } }
  ]},
  { id:'ticket-check', trigger:'travel', icon:'🎫', title:'Ticket inspection', text:'Inspectors enter the vehicle and start checking tickets.', weight:3, eligible:c=>c.travelMode==='transit', choices:[
    { label:'Show your ticket', outcome:{ message:'Everything is in order. You continue the trip.' } }
  ]},
  { id:'station-food', trigger:'location', icon:'🥐', title:'Food before closing', text:'A worker has a small bag of unsold food and asks if you want it.', weight:3, eligible:c=>c.locationId==='station' && !c.firstNight, choices:[
    { label:'Accept', outcome:{ food:1, mood:3, message:'You received some food for later.' } },
    { label:'Decline', outcome:{ message:'You thank them and decline.' } }
  ]},
  { id:'useful-tip', trigger:'location', icon:'💬', title:'A useful tip', text:'Someone nearby mentions a place where people can get help, but seems ready to leave.', weight:4, eligible:c=>!c.firstNight, choices:[
    { label:'Ask for details · Persuasion DC 12', check:{ stat:'persuasion', dc:12,
      success:{ minutes:10, mood:5, message:'You keep the conversation going and get several useful details about where to find help.' },
      failure:{ minutes:5, mood:-1, message:'You try to get more information, but the conversation ends quickly.' },
      criticalSuccess:{ minutes:10, mood:7, message:'The conversation goes extremely well. You get clear directions and a genuinely useful tip.' },
      criticalFailure:{ minutes:5, mood:-3, message:'You come across badly and the person cuts the conversation short.' }
    }},
    { label:'Just listen', outcome:{ minutes:10, mood:3, message:'You listen without pushing for more details. The conversation gives you some hope.' } },
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
  { id:'first-night-door', illustration:'/street-life-game/assets/event-first-night-door.webp', trigger:'walk', icon:'🏠', title:'The door closes', text:'Someone ahead of you slows down, takes out a key and slips into a lit entrance. The door clicks shut. You keep standing on the pavement. Nobody has noticed anything unusual about you.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='street', choices:[
    { label:'Keep walking', outcome:{ illustration:'/street-life-game/assets/event-door-walk.webp', message:'You turn towards the next crossing. Until recently, coming home still felt like an ordinary thing.' } },
    { label:'Stay here for a moment', outcome:{ illustration:'/street-life-game/assets/event-door-stay.webp', minutes:5, mood:-1, message:'You watch the entrance until the light goes out. Then you move away. You do not want to spend the night watching other people come home.' } },
    { label:'Think of someone I could call', outcome:{ illustration:'/street-life-game/assets/event-door-think-call.webp', minutes:5, mood:1, message:'You go through a few names in your head. You have not called anyone yet, but being alone feels a little less final.' } },
  ]},
  { id:'first-night-bench', illustration:'/street-life-game/assets/event-first-night-bench.webp', trigger:'bench', icon:'🪑', title:'Making a bed on a bench', text:'While you sit, someone on a nearby bench folds a jacket under their head and pulls a bag close. You had barely noticed them before. Now you recognise what they are preparing for. They have not approached you.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='street', choices:[
    { label:'Ask how they get through the night', outcome:{ illustration:'/street-life-game/assets/event-bench-conversation.webp', minutes:10, mood:1, discoverLocation:'shelter', message:'You tell them you have nowhere to stay tonight. Only then do they mention Night Shelter: registration is 19:00–22:00, so tonight is too late. They describe where it is. You save the place on your map for the next registration evening.' } },
    { label:'Watch quietly', outcome:{ illustration:'/street-life-game/assets/event-bench-watch.webp', minutes:5, message:'They arrange their belongings without looking around. You wonder how many times you have walked past this same scene without really seeing it.' } },
    { label:'Give them some space', outcome:{ illustration:'/street-life-game/assets/event-bench-space.webp', minutes:5, message:'You keep your distance. You are not ready to talk about your own night, and they have not asked.' } },
  ]},
  { id:'first-night-station', illustration:'/street-life-game/assets/event-first-night-station.webp', trigger:'location', icon:'🚉', title:'The last departures', text:'A few passengers leave through the doors, checking their phones as they go. Further along the benches, someone has tucked their feet under a coat. You look at the departure board, then at the people who do not seem to be waiting for a train. To everyone else, you are another traveller with a bag.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='station', choices:[
    { label:'Ask if the seat next to them is free', outcome:{ illustration:'/street-life-game/assets/event-station-seat.webp', minutes:5, mood:1, message:'They move their bag and say yes. You thank them and sit for a moment. Neither of you asks why the other is here.' } },
    { label:'Ask where I could spend the night', outcome:{ illustration:'/street-life-game/assets/event-station-night.webp', minutes:10, mood:1, discoverLocation:'shelter', message:'You explain that you cannot go home tonight. They tell you where Night Shelter is and that registration runs 19:00–22:00. Tonight is too late, but you save the address for the next registration evening.' } },
    { label:'Find a quiet seat on my own', outcome:{ illustration:'/street-life-game/assets/event-station-quiet.webp', minutes:5, message:'You choose a seat away from the doors. For now, you can just sit here without explaining anything.' } },
  ]},
  { id:'first-night-bench-wake', illustration:'/street-life-game/assets/event-first-night-bench-wake.webp', trigger:'wake', icon:'🪑', title:'Someone needs the bench', text:'A voice wakes you: “Could you sit up? I need a seat.” You are lying across the bench with your bag beside you. It is what you are doing that has drawn attention; nobody has asked where you live.', weight:3, eligible:c=>!!c.firstNight && c.sleepKind==='bench', choices:[
    { label:'Sit up and gather my things', outcome:{ illustration:'/street-life-game/assets/event-wake-sit.webp', minutes:5, message:'You sit up and pull your bag onto your lap. The person takes the other end of the bench. The conversation goes no further.' } },
    { label:'Move somewhere else', outcome:{ illustration:'/street-life-game/assets/event-wake-move.webp', minutes:10, energy:-1, message:'You pick up your things and move away from the bench. You feel exposed after waking up in front of someone.' } },
    { label:'Ask for a moment to wake up', outcome:{ illustration:'/street-life-game/assets/event-wake-moment.webp', minutes:5, message:'“Just a moment,” you say. They wait while you put your things together. You make room for them.' } },
  ]},
]

export function pickStreetEvent(trigger: EventTrigger, context: EventContext, chance: number) {
  if (Math.random() >= chance) return null
  const pool = STREET_EVENTS.filter(event => event.trigger === trigger && !context.seenEventIds?.includes(event.id) && (!event.eligible || event.eligible(context)))
  if (!pool.length) return null
  const total = pool.reduce((sum, event) => sum + event.weight, 0)
  let roll = Math.random() * total
  for (const event of pool) {
    roll -= event.weight
    if (roll <= 0) return illustrateStreetEvent(event, context)
  }
  return illustrateStreetEvent(pool[pool.length - 1], context)
}
