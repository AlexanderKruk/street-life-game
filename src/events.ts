import { illustrateStreetEvent } from './eventArtwork'
import type { Housing } from './game'

export type EventTrigger = 'travel' | 'location' | 'wake' | 'walk' | 'bench'

export function firstNightTime(state: { day: number; minutes: number }) {
  const minute = (state.day - 1) * 1440 + state.minutes
  return minute >= 1320 && minute < 1800
}

export type EventContext = {
  locationId: string
  minutes?: number
  temperature?: number
  observation?: 'idle' | 'action' | 'arrival'
  elapsedMinutes?: number
  travelMode?: 'walk' | 'transit' | 'fare-dodge'
  weather: string
  housing: Housing
  documents: boolean
  firstNight?: boolean
  sleepKind?: 'ground' | 'bench' | 'shelter' | 'residential'
  seenEventIds?: string[]
}

export type EventOutcome = {
  message: string
  identityCheck?: boolean
  moveToStreet?: boolean
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

export function resolveEventOutcome(outcome: EventOutcome, random = Math.random, documents = true, storedDocuments = false): EventOutcome {
  if (outcome.identityCheck) {
    const check = documents
      ? 'You show your documents. The officer looks them over and hands them back.'
      : storedDocuments
        ? 'You explain that your documents are stored at the shelter and you do not have them with you. The officer asks for your name and details; the conversation takes longer.'
        : 'You explain that your documents are missing. The officer asks for your name and details; the conversation takes longer.'
    outcome = { ...outcome, identityCheck: false, minutes: (outcome.minutes ?? 0) + (documents ? 0 : 10), message: `${check} ${outcome.message}` }
  }
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
  moneyRequired?: number
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

// The opening bench wake keeps priority over subsequent patrol encounters.
const openingBenchWakeDue = (context: EventContext) => context.firstNight && context.sleepKind === 'bench' && !context.seenEventIds?.includes('first-night-bench-wake')

// Outside the station, ordinary passer-by encounters belong to waking hours.
const streetHasPassersBy = (context: EventContext) => {
  const minutes = context.minutes ?? 1200
  return minutes >= 360 && minutes < 1320
}

export const STREET_EVENTS: StreetEvent[] = [
  { id:'city-waking', trigger:'location', icon:'🌅', title:'The city wakes up', text:'The first buses pass. Lights come on behind windows, and a shop shutter rattles somewhere down the street. The city is starting its day. You are still outside, with your backpack beside you.', weight:1, eligible:c=>c.locationId==='street' && c.minutes!==undefined && c.minutes>=300 && c.minutes<420, choices:[
    { label:'Think about my next step', outcome:{ minutes:5, mood:2, message:'You put the next few hours in order in your head. You cannot solve everything at once, but you can decide what to try first.' } },
    { label:'Take a moment', outcome:{ minutes:5, message:'You watch the windows light up. For everyone inside, this may be an ordinary morning. You take a breath before joining it.' } },
    { label:'Keep moving', outcome:{ minutes:5, energy:-1, mood:1, message:'You adjust your backpack and walk towards the waking streets. The night is over. You still need a plan for the day.' } },
  ]},
  { id:'night-rustle', trigger:'location', icon:'❔', title:'A rustle behind you', text:'Something scrapes behind a parked car. Then a short rustle, close to the pavement. You turn your head, but the gap between the cars is dark. The street is otherwise silent.', weight:1, eligible:c=>c.locationId==='street' && c.minutes!==undefined && (c.minutes>=1320 || c.minutes<300), choices:[
    { label:'Look to see what it is', outcome:{ minutes:2, mood:2, message:'You lean far enough to see beneath the car. A cat squeezes out, pauses to look at you, then slips past with its tail up. You let out a breath. For a moment, you almost laugh at yourself.' } },
    { label:'Wait and listen', outcome:{ minutes:3, message:'You stay still. Something brushes the underside of the car, then everything goes quiet. Nothing comes into view. After a while, you move on without finding out what it was.' } },
    { label:'Leave it alone and move on', outcome:{ minutes:1, message:'You put some distance between yourself and the parked cars. The sound does not follow you. Whatever it was remains in the dark.' } },
  ]},
  { id:'cold-hands', trigger:'location', icon:'🌡️', title:'Cold fingers', text:'You have been outside for a while. Your fingers have grown stiff, and you keep curling them into your palms. The cold feels harder to ignore now that there is no warm room waiting for you.', weight:1, eligible:c=>c.locationId==='street' && c.temperature!==undefined && c.temperature<10 && (c.elapsedMinutes??0)>=15 && c.observation!=='arrival', choices:[
    { label:'Rub my hands together', outcome:{ minutes:2, mood:1, message:'You rub your palms and breathe into your cupped hands. A little warmth returns. It is only temporary, but it helps.' } },
    { label:'Walk a little to warm up', outcome:{ minutes:5, energy:-1, mood:1, message:'You tuck your hands into your pockets and walk around the block. Moving warms you a little, although your legs would rather rest.' } },
    { label:'Put up with it for now', outcome:{ mood:-1, message:'You curl your fingers into your sleeves. You can manage for now, but you keep thinking about somewhere warm.' } },
  ]},
  { id:'station-cleaning', trigger:'location', icon:'🧹', title:'Cleaning the hall', text:'A cleaner approaches with a floor-cleaning machine and gestures towards the area where you are resting. “Could you move over for a few minutes? I need to clean here.”', weight:1, eligible:c=>c.locationId==='station' && (c.observation==='idle' || c.observation==='action') && (c.elapsedMinutes??0)>=15, choices:[
    { label:'Move to another bench', outcome:{ minutes:3, message:'You lift your backpack and find a seat a little further along. The cleaner nods and gets on with the floor. Nobody asks why you are here.' } },
    { label:'Stand up and stretch', outcome:{ minutes:5, energy:1, message:'You shoulder your backpack and stretch your stiff legs while the machine passes. When the cleaner moves on, you can sit again.' } },
    { label:'Ask where I can sit for now', outcome:{ minutes:3, mood:1, message:'“Over there is fine,” the cleaner says, pointing to the next row of benches. It is a simple answer to a simple question. You thank them and move.' } },
  ]},
  { id:'platform-question', trigger:'location', icon:'🚉', title:'Which platform?', text:'A traveller stops beside you, glances from a ticket to the departure board and asks, “Sorry, do you know which platform this train leaves from?” They hold up the train number.', weight:1, eligible:c=>c.locationId==='station', choices:[
    { label:'Look at the board together', outcome:{ minutes:3, mood:2, message:'You find the train number together and match it to a platform. They thank you and hurry away. For a moment, you were simply someone who could help.' } },
    { label:'Suggest checking the departure board', outcome:{ minutes:1, mood:1, message:'You point out where the train numbers and platforms are listed. They look up, spot the right row and thank you.' } },
    { label:'Say I’m not sure either', outcome:{ message:'“Sorry, I’m not sure either.” They nod and turn back to the board. You return to your own thoughts.' } },
  ]},
  { id:'street-patrol-wake', trigger:'wake', icon:'🪪', title:'Woken by a patrol', text:'A voice brings you out of sleep. Two police officers are standing a little way from your things. “Are you alright? Could you sit up and show us your documents?” You reach for your backpack, still trying to wake properly.', weight:1, eligible:c=>c.locationId==='street' && (c.sleepKind==='ground' || c.sleepKind==='bench') && !openingBenchWakeDue(c), choices:[
    { label:'Answer the officer', outcome:{ identityCheck:true, minutes:5, mood:-1, message:'You say you are awake and feeling alright. After a few more words, the patrol moves on. You sit with your backpack close, waiting for your heartbeat to settle.' } },
    { label:'Ask where I could spend the night', outcome:{ identityCheck:true, minutes:10, mood:1, discoverLocation:'shelter', message:'You explain that you have nowhere to stay tonight. Only then does the officer describe Night Shelter and its evening registration. You keep the directions in mind.' } },
    { label:'Gather my things and move along', outcome:{ identityCheck:true, minutes:5, energy:-1, message:'When the conversation ends, you shoulder your backpack and move a little further along the street. You are awake now, although you would rather still be resting.' } },
  ]},
  { id:'station-patrol-wake', trigger:'wake', icon:'🎫', title:'A patrol in the waiting hall', text:'Someone calls to you until you wake. A police patrol is beside the bench. “Please sit up. Your documents, please. Are you waiting for a train — do you have a train ticket?” You pull your backpack closer and try to collect your thoughts.', weight:1, eligible:c=>c.locationId==='station' && c.sleepKind==='bench' && !openingBenchWakeDue(c), choices:[
    { label:'Answer the officer', outcome:{ identityCheck:true, minutes:5, mood:-1, message:'You explain that you do not have a train ticket and needed somewhere to rest. The officer asks you to sit upright and leave space on the bench. The patrol continues through the hall.' } },
    { label:'Ask where I can wait', outcome:{ identityCheck:true, minutes:10, message:'You say you have no train ticket and ask where you can wait. The officer points to another part of the waiting hall and asks you to sit rather than lie across the seats. You move there with your backpack.' } },
    { label:'Gather my things and step outside', outcome:{ identityCheck:true, minutes:5, energy:-1, moveToStreet:true, message:'You say you have no train ticket, collect your backpack and step out into the street. The check is over, but your rest is over too.' } },
  ]},
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
  { id:'found-coins', trigger:'travel', icon:'🪙', title:'Coin on the pavement', text:'Something glints beside the curb.', weight:4, eligible:c=>c.travelMode==='walk', choices:[
    { label:'Pick it up', outcome:{ randomCoin:true, message:'You pick up the coin.' } },
    { label:'Leave it', outcome:{ mood:1, message:'You leave it for someone who may need it more.' } }
  ]},
  { id:'free-snack', trigger:'travel', icon:'🥪', title:'Someone offers food', text:'A passer-by offers you a packaged sandwich.', weight:3, eligible:c=>!c.firstNight && c.travelMode==='walk' && streetHasPassersBy(c), choices:[
    { label:'Take it', outcome:{ food:1, mood:2, message:'You put the sandwich in your backpack.' } },
    { label:'No thanks', outcome:{ message:'You politely decline and keep going.' } }
  ]},
  { id:'ticket-check', trigger:'travel', icon:'🎫', title:'Ticket inspection', text:'Inspectors enter the vehicle and start checking tickets.', weight:3, eligible:c=>c.travelMode==='transit', choices:[
    { label:'Show your ticket', outcome:{ message:'Everything is in order. You continue the trip.' } }
  ]},
  { id:'station-food', trigger:'location', icon:'🥐', title:'Food before closing', text:'A worker has a small bag of unsold food and asks if you want it.', weight:3, eligible:c=>c.locationId==='station' && !c.firstNight && (c.minutes ?? 1200)>=1140, choices:[
    { label:'Accept', outcome:{ food:1, mood:3, message:'You received some food for later.' } },
    { label:'Decline', outcome:{ message:'You thank them and decline.' } }
  ]},
  { id:'useful-tip', trigger:'location', icon:'💬', title:'A useful tip', text:'Someone nearby mentions a place where people can get help, but seems ready to leave.', weight:4, eligible:c=>!c.firstNight && (c.locationId!=='street' || streetHasPassersBy(c)), choices:[
    { label:'Ask for details · Persuasion DC 12', check:{ stat:'persuasion', dc:12,
      success:{ minutes:10, mood:5, discoverLocation:'shelter', message:'You keep the conversation going. They explain where Night Shelter is and how evening registration works.' },
      failure:{ minutes:5, mood:-1, message:'You try to get more information, but the conversation ends quickly.' },
      criticalSuccess:{ minutes:10, mood:7, discoverLocation:'shelter', message:'The conversation goes extremely well. You get clear directions to Night Shelter and learn why arriving early for evening registration improves your chances of a bed.' },
      criticalFailure:{ minutes:5, mood:-3, message:'You come across badly and the person cuts the conversation short.' }
    }},
    { label:'Just listen', outcome:{ minutes:10, mood:3, discoverLocation:'shelter', message:'You listen without pushing for more details. They describe where Night Shelter is and mention evening registration. Knowing where you could try for a bed gives you some hope.' } },
    { label:'Keep going', outcome:{ message:'You decide not to stop.' } }
  ]},
  { id:'rough-crowd', trigger:'location', icon:'⚠️', title:'Trouble nearby', text:'An argument nearby is getting louder. Staying around feels risky.', weight:2, eligible:c=>c.locationId==='station', choices:[
    { label:'Move away', outcome:{ minutes:10, energy:-2, message:'You move to another part of the station and avoid trouble.' } },
    { label:'Stay where you are', outcome:{ mood:-5, message:'Nothing happens to you, but the situation leaves you tense.' } }
  ]},
  { id:'quiet-night', trigger:'wake', icon:'🌙', title:'Peaceful rest', text:'For once, you get some rest without trouble.', weight:5, choices:[
    { label:'Get up', outcome:{ mood:5, energy:5, message:'A peaceful rest gave you a little extra strength.' } }
  ]},
  { id:'night-theft', trigger:'wake', icon:'🎒', title:'Something happened overnight', text:'You wake up and notice that someone went through your things.', weight:2, eligible:c=>c.housing==='Street', choices:[
    { label:'Check your things', outcome:{ money:-5, mood:-7, loseDocuments:true, message:'Some cash is gone, and your documents are missing.' } }
  ]},
  { id:'spare-change', trigger:'location', icon:'🪙', title:'Have you got any change?', text:'A passer-by stops a few steps away. “Excuse me, could you spare a złoty?” They wait for your answer.', weight:2, eligible:c=>c.locationId==='station' || (c.locationId==='street' && streetHasPassersBy(c)), choices:[
    { label:'Give 1 zł', moneyRequired:1, outcome:{ money:-1, mood:1, message:'You give them a złoty. They thank you and move on. You check what you have left.' } },
    { label:'Sorry, I can’t', outcome:{ message:'You say you cannot help. They nod and ask someone further down the pavement.' } },
    { label:'Keep my distance', outcome:{ message:'You keep your distance and carry on. They do not follow you.' } },
  ]},
  { id:'dropped-glove', trigger:'location', icon:'👤', title:'Someone dropped a glove', text:'A glove slips from a passer-by’s pocket. They keep walking, unaware. You are close enough to call out.', weight:2, eligible:c=>c.locationId==='street' && streetHasPassersBy(c), choices:[
    { label:'Call after them', outcome:{ minutes:2, mood:2, message:'They turn around, pick up the glove and raise a hand in thanks. For a moment, it feels like an ordinary day.' } },
    { label:'Keep going', outcome:{ message:'You keep going. Someone else may notice it.' } },
  ]},
  { id:'first-night-door', illustration:'/street-life-game/assets/event-first-night-door.webp', trigger:'walk', icon:'🏠', title:'The door closes', text:'Someone ahead of you slows down, takes out a key and slips into a lit entrance. The door clicks shut. You keep standing on the pavement. Nobody has noticed anything unusual about you.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='street', choices:[
    { label:'Keep walking', outcome:{ illustration:'/street-life-game/assets/event-door-walk.webp', message:'You turn towards the next crossing. Until recently, coming home still felt like an ordinary thing.' } },
    { label:'Stay here for a moment', outcome:{ illustration:'/street-life-game/assets/event-door-stay.webp', minutes:5, mood:-1, message:'You watch the entrance until the light goes out. Then you move away. You do not want to spend the night watching other people come home.' } },
    { label:'Think of someone I could call', outcome:{ illustration:'/street-life-game/assets/event-door-think-call.webp', minutes:5, mood:1, message:'You go through a few names in your head. You have not called anyone yet, but being alone feels a little less final.' } },
  ]},
  { id:'first-night-bench', illustration:'/street-life-game/assets/event-first-night-bench.webp', trigger:'bench', icon:'🪑', title:'Making a bed on a bench', text:'While you sit, someone on a nearby bench folds a jacket under their head and pulls a bag close. You had barely noticed them before. Now you recognise what they are preparing for. They have not approached you.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='street', choices:[
    { label:'Ask how they get through the night', outcome:{ illustration:'/street-life-game/assets/event-bench-conversation.webp', minutes:10, mood:1, discoverLocation:'shelter', message:'You tell them you have nowhere to stay tonight. Only then do they mention Night Shelter: doors open at 18:00 and registration is 18:20–22:00; arriving early improves your queue position, so tonight is too late. They describe where it is. You save the place on your map for the next registration evening.' } },
    { label:'Watch quietly', outcome:{ illustration:'/street-life-game/assets/event-bench-watch.webp', minutes:5, message:'They arrange their belongings without looking around. You wonder how many times you have walked past this same scene without really seeing it.' } },
    { label:'Give them some space', outcome:{ illustration:'/street-life-game/assets/event-bench-space.webp', minutes:5, message:'You keep your distance. You are not ready to talk about your own night, and they have not asked.' } },
  ]},
  { id:'first-night-station', illustration:'/street-life-game/assets/event-first-night-station.webp', trigger:'location', icon:'🚉', title:'The last departures', text:'A few passengers leave through the doors, checking their phones as they go. Further along the benches, someone has tucked their feet under a coat. You look at the departure board, then at the people who do not seem to be waiting for a train. To everyone else, you are another traveller with a bag.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='station', choices:[
    { label:'Ask if the seat next to them is free', outcome:{ illustration:'/street-life-game/assets/event-station-seat.webp', minutes:5, mood:1, message:'They move their bag and say yes. You thank them and sit for a moment. Neither of you asks why the other is here.' } },
    { label:'Ask where I could spend the night', outcome:{ illustration:'/street-life-game/assets/event-station-night.webp', minutes:10, mood:1, discoverLocation:'shelter', message:'You explain that you cannot go home tonight. They tell you where Night Shelter is and that doors open at 18:00 and registration runs 18:20–22:00; arriving early improves your queue position. Tonight is too late, but you save the address for the next registration evening.' } },
    { label:'Find a quiet seat on my own', outcome:{ illustration:'/street-life-game/assets/event-station-quiet.webp', minutes:5, message:'You choose a seat away from the doors. For now, you can just sit here without explaining anything.' } },
  ]},
  { id:'first-night-bench-wake', illustration:'/street-life-game/assets/event-first-night-bench-wake.webp', trigger:'wake', icon:'🪑', title:'Someone needs the bench', text:'A voice wakes you: “Could you sit up? I need a seat.” You are lying across the bench with your bag beside you. It is what you are doing that has drawn attention; nobody has asked where you live.', weight:3, eligible:c=>!!c.firstNight && c.sleepKind==='bench', choices:[
    { label:'Sit up and gather my things', outcome:{ illustration:'/street-life-game/assets/event-wake-sit.webp', minutes:5, message:'You sit up and pull your bag onto your lap. The person takes the other end of the bench. The conversation goes no further.' } },
    { label:'Move somewhere else', outcome:{ illustration:'/street-life-game/assets/event-wake-move.webp', minutes:10, energy:-1, message:'You pick up your things and move away from the bench. You feel exposed after waking up in front of someone.' } },
    { label:'Ask for a moment to wake up', outcome:{ illustration:'/street-life-game/assets/event-wake-moment.webp', minutes:5, message:'“Just a moment,” you say. They wait while you put your things together. You make room for them.' } },
  ]},
]

// The prototype presents each eligible scene once, in catalog order. Spawn
// selection consumes no randomness; D20 and consequence rolls remain separate.
export function nextStreetEvent(trigger: EventTrigger, context: EventContext): StreetEvent | null {
  const event = STREET_EVENTS.find(event => event.trigger === trigger && !context.seenEventIds?.includes(event.id) && (!event.eligible || event.eligible(context)))
  return event ? illustrateStreetEvent(event, context) : null
}
