import { illustrateStreetEvent } from './eventArtwork'
import type { Housing } from './game'
import type { IconName } from './Icon'

export type EventTrigger = 'travel' | 'location' | 'wake' | 'walk' | 'bench'

export function firstNightTime(state: { day: number; minutes: number }) {
  const minute = (state.day - 1) * 1440 + state.minutes
  return minute >= 1320 && minute < 1800
}

export function firstMorningTime(state: { day?: number; minutes?: number }) {
  return state.day === 2 && state.minutes !== undefined && state.minutes >= 480 && state.minutes < 600
}

export type EventContext = {
  locationId: string
  /** Stored one-based calendar day: displayed D1 is day 2. */
  day?: number
  minutes?: number
  temperature?: number
  observation?: 'idle' | 'action' | 'arrival'
  elapsedMinutes?: number
  travelMode?: 'walk' | 'transit' | 'fare-dodge'
  weather: string
  housing: Housing
  documents: boolean
  firstNight?: boolean
  nearHome?: boolean
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
  phoneBattery?: number
  jacketCondition?: number
  loseDocuments?: boolean
  illustration?: string
  discoverLocation?: string
  /** List already-known places in this order; never discovers or visits them. */
  knownLocations?: string[]
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
  icon?: IconName
  moneyRequired?: number
  phoneBatteryRequired?: number
  undiscoveredLocationRequired?: string
  durationMinutes?: number
  followUp?: { chance: number; eventId: string }
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
  continuationOnly?: boolean
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
  // Replaces the old dawn reflection, retaining its once-per-run save history.
  { id:'city-waking', trigger:'location', icon:'🌅', title:'The city wakes up', text:'The streets are filling with people on their way to work. You’ve made it through the night. Now there’s a whole day ahead of you.', weight:1, eligible:c=>c.locationId==='street' && firstMorningTime(c), choices:[
    { label:'I’ll try to manage on my own.', icon:'work', outcome:{ knownLocations:['work','jobcenter'], message:'First, you need some money coming in. Finding work seems like a place to start.' } },
    { label:'I need some help.', icon:'help', outcome:{ knownLocations:['shelter','support','daycenter'], message:'Food, a shower, somewhere to rest. You decide to find out what support you can get.' } },
    { label:'I need a little more time.', icon:'pause', outcome:{ message:'You watch people hurry past. Everyone seems to know where they’re going. You’re not ready to decide what comes next. For now, you stay where you are.' } },
  ]},
  { id:'night-rustle', trigger:'location', icon:'❔', title:'A rustle in the dark', text:'The streetlights barely reach this stretch of path. A rustle breaks the silence. A few seconds later, you hear it again.', weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && (c.minutes>=1320 || c.minutes<300), choices:[
    { label:'Call out and step closer', icon:'search', outcome:{ minutes:5, mood:2, message:'“Hello? Anyone there?” You take a few careful steps towards the sound. A cat emerges from the bushes and stops to look at you. You let out a breath. “Just you, then.”' } },
    { label:'Stay still and listen', icon:'pause', outcome:{ minutes:5, message:'You stop and wait, listening for another sound. Nothing. After a few minutes, you move on, still unsure what you heard.' } },
    { label:'Walk away', icon:'walk', outcome:{ energy:-1, message:'You quicken your pace and take a longer route around the dark stretch.' } },
  ]},
  { id:'borrow-phone', trigger:'location', icon:'📱', title:'One quick call', text:'A man stands under a streetlight, looking down at his phone. As you approach, he looks up. “Sorry, my battery’s dead. Could I use yours? I just need to tell someone where to pick me up.”', weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && c.minutes>=0 && c.minutes<240, choices:[
    { label:'Hand him my phone', icon:'hand', phoneBatteryRequired:2, followUp:{ chance:0.5, eventId:'borrow-phone-slip' }, outcome:{ minutes:5, mood:3, phoneBattery:-2, message:'He makes a quick call and tells someone where he’s waiting. “They’re on their way. Thanks, you saved me a long walk.” He hands your phone back. It feels good to have helped.' } },
    { label:'Offer to call on speaker', icon:'phone', phoneBatteryRequired:1, outcome:{ minutes:5, mood:2, phoneBattery:-1, message:'“I’ll hold it. What’s the number?” He reads it out, then leans closer to speak. The call is brief. “They’ll be here soon. Thanks for that.” You pocket your phone and carry on.' } },
    { label:'Say no and move on', icon:'walk', outcome:{ message:'“Sorry, I can’t.” He nods. “All right.” As you walk away, he looks down the street for someone else to ask.' } },
  ]},
  { id:'park-company', trigger:'location', icon:'💬', title:'Room for one more', text:'A few people are gathered around a park bench, drinking beer and talking over each other. A bag of bottles sits at their feet. One of them spots you and shuffles along the bench. “Hey, mate! Come sit with us!”', weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && c.minutes>=0 && c.minutes<240, choices:[
    { label:'Join them for a chat · Persuasion DC 10', icon:'chat', durationMinutes:10, check:{ stat:'persuasion', dc:10,
      success:{ minutes:10, mood:3, message:'You sit down and join the conversation. Their stories get more ridiculous with each telling, and soon you’re laughing along. When you get up to leave, they wish you a good night. You feel a little less alone.' },
      failure:{ minutes:10, mood:-2, message:'Something you say rubs one of them the wrong way. You try to explain, but he keeps talking over you, louder each time. You get up and leave with his last remark still ringing in your ears.' },
    } },
    { label:'Say “No thanks” and keep walking', icon:'walk', outcome:{ message:'“Thanks, but I’m heading on.” He gives a loose wave. “Suit yourself!” Before you’ve gone much further, they’re already laughing about something else.' } },
    { label:'Take another path', icon:'navigation', outcome:{ minutes:5, energy:-1, message:'You turn onto a different path and take the long way round. Their voices fade behind the trees as you pick up your pace.' } },
  ]},
  { id:'night-patrol', trigger:'location', icon:'💬', title:'A quiet check-in', text:'Two police officers approach along the pavement. One slows as he reaches you. “Hello. Everything all right?”', weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && c.minutes>=0 && c.minutes<240, choices:[
    { label:'I’m fine. Just getting some air.', icon:'chat', outcome:{ minutes:5, mood:1, message:'You exchange a few words. There’s no urgency in his voice, and you find yourself relaxing a little. “All right. Take care of yourself.” They continue down the street.' } },
    { label:'Is there somewhere I could stay tonight?', icon:'help', undiscoveredLocationRequired:'shelter', outcome:{ minutes:10, mood:3, discoverLocation:'shelter', message:'The officer gives you directions to a night shelter. They register new arrivals in the evening. “Get there before six. Places can go quickly.” You save the address. You still have tonight to get through, but now you know where to try.' } },
    { label:'Thanks, but I don’t need any help.', icon:'walk', outcome:{ message:'“Fair enough. Have a good night.” They walk on, and you continue on your way.' } },
  ]},
  // This stage is reached only by handing over the phone; it never spawns alone.
  { id:'borrow-phone-slip', trigger:'location', continuationOnly:true, icon:'📱', title:'One quick call', text:'He finishes the call and holds your phone out. “Thanks, I really—” It slips from his fingers before you can take it. You reach for it.', weight:1, choices:[
    { label:'Try to catch it · Reflex DC 11', icon:'hand', check:{ stat:'reflex', dc:11,
      success:{ minutes:5, mood:3, phoneBattery:-2, message:'You catch it just above the pavement. For a second, neither of you speaks. “God, sorry,” he says. You check the screen before putting it safely away.' },
      failure:{ minutes:5, mood:3, phoneBattery:-2, phoneCondition:-5, message:'Your fingers brush the edge, but the phone hits the pavement. He picks it up, apologising. The screen still works. There’s a fresh dent in the corner. “I’m really sorry.” You take it back.' },
    } },
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
    { label:'Ask where I could spend the night', undiscoveredLocationRequired:'shelter', outcome:{ identityCheck:true, minutes:10, mood:1, discoverLocation:'shelter', message:'You explain that you have nowhere to stay tonight. Only then does the officer describe Night Shelter and its evening registration. You keep the directions in mind.' } },
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
  { id:'found-coins', trigger:'travel', icon:'🪙', title:'Coin on the pavement', text:'Something glints beside the kerb.', weight:4, eligible:c=>c.travelMode==='walk', choices:[
    { label:'Pick it up', outcome:{ randomCoin:true, message:'You pick up the coin.' } },
    { label:'Leave it', outcome:{ mood:1, message:'You leave it for someone who may need it more.' } }
  ]},
  { id:'free-snack', trigger:'travel', icon:'🥪', title:'Someone offers food', text:'A passer-by offers you a packaged sandwich.', weight:3, eligible:c=>!c.firstNight && c.travelMode==='walk' && streetHasPassersBy(c), choices:[
    { label:'Take it', outcome:{ food:1, mood:2, message:'You put the sandwich in your backpack.' } },
    { label:'No thanks', outcome:{ message:'You politely decline and keep going.' } }
  ]},
  { id:'ticket-check', trigger:'travel', icon:'🎫', title:'Ticket inspection', text:'Inspectors enter the vehicle and start checking tickets.', weight:3, eligible:c=>c.travelMode==='transit', choices:[
    { label:'Show my ticket', outcome:{ message:'Everything is in order. You continue the trip.' } }
  ]},
  { id:'station-food', trigger:'location', icon:'🥐', title:'Food before closing', text:'A worker has a small bag of unsold food and asks if you want it.', weight:3, eligible:c=>c.locationId==='station' && !c.firstNight && (c.minutes ?? 1200)>=1140, choices:[
    { label:'Accept', outcome:{ food:1, mood:3, message:'You put the food in your backpack for later.' } },
    { label:'Decline', outcome:{ message:'You thank them and decline.' } }
  ]},
  { id:'rough-crowd', trigger:'location', icon:'⚠️', title:'Trouble nearby', text:'An argument nearby is getting louder. Staying around feels risky.', weight:2, eligible:c=>c.locationId==='station', choices:[
    { label:'Move away', outcome:{ minutes:10, energy:-2, message:'You move to another part of the station and avoid trouble.' } },
    { label:'Stay here', outcome:{ mood:-5, message:'Nothing happens to you, but the situation leaves you tense.' } }
  ]},
  { id:'quiet-night', trigger:'wake', icon:'🌙', title:'Peaceful rest', text:'For once, you get some rest without trouble.', weight:5, choices:[
    { label:'Get up', outcome:{ mood:5, energy:5, message:'You get up with a little more strength after a peaceful rest.' } }
  ]},
  { id:'night-theft', trigger:'wake', icon:'🎒', title:'While you were asleep', text:'You wake up and notice that someone went through your things.', weight:2, eligible:c=>c.housing==='Street', choices:[
    { label:'Check my things', outcome:{ money:-5, mood:-7, loseDocuments:true, message:'Some cash is gone, and your documents are missing.' } }
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
  // Keep the ID so an already-seen opening does not replay after an update.
  { id:'first-night-door', illustration:'/street-life-game/assets/event-neighbour-meeting.webp', trigger:'walk', icon:'🏠', title:'A familiar face', text:'Your neighbour returns from the shop carrying grocery bags. She spots you, smiles and holds the entrance door open. “Hi! Coming in?”', weight:1, eligible:c=>!!c.firstNight && !!c.nearHome && c.locationId==='street' && c.minutes!==undefined && c.minutes>=1320 && c.minutes<1380, choices:[
    { label:'No, thanks. Just going for a walk.', outcome:{ illustration:'/street-life-game/assets/event-neighbour-decline.webp', mood:-2, message:'She wishes you a good evening and heads inside. The door clicks shut. You stand there a moment before walking on.' } },
    { label:'Let me help with those bags.', outcome:{ illustration:'/street-life-game/assets/event-neighbour-help.webp', minutes:5, mood:2, message:'You carry her bags up the familiar stairs. She thanks you at her door. As you head back outside, you feel a little better for having helped.' } },
    { label:'I’ve been evicted. I have nowhere to stay.', outcome:{ illustration:'/street-life-game/assets/event-neighbour-supplies.webp', minutes:5, mood:3, food:1, water:1, message:'She pauses, then reaches into her shopping bag. “Here, take these. You need them more than I do.” She hands you some food and a bottle of water. You still have nowhere to sleep, but you feel a little less alone.' } },
  ]},
  { id:'first-night-dog', illustration:'/street-life-game/assets/event-neighbour-dog-meeting.webp', trigger:'walk', icon:'🐕', title:'An old friend', text:'You spot your neighbour out walking his dog. You know that dog well. Usually, he won’t let you past without a fuss. Neither of them has seen you yet.', weight:1, eligible:c=>!!c.firstNight && !!c.nearHome && c.locationId==='street' && c.minutes!==undefined && c.minutes>=1320 && c.minutes<1440, choices:[
    { label:'Head the other way.', outcome:{ illustration:'/street-life-game/assets/event-neighbour-dog-avoid.webp', mood:-2, message:'You take a different path. You don’t feel up to small talk tonight, especially if he asks how you’re doing. You glance back at the dog, wondering if you’ll ever see him again.' } },
    { label:'Keep walking.', outcome:{ illustration:'/street-life-game/assets/event-neighbour-dog-pass.webp', mood:-1, message:'You give your neighbour a quick nod. The dog spots you and starts wagging, tugging at the lead to reach you. You carry on before he gets close.' } },
    { label:'Stop and say hello.', outcome:{ illustration:'/street-life-game/assets/event-neighbour-dog-greet.webp', minutes:5, mood:3, message:'You crouch down, and the dog comes straight over. A quick sniff, then a wet tongue across your cheek. You laugh and give his ears a good scratch. “He’s missed you,” your neighbour says. You stay for a few minutes. When you get up to leave, you feel a little lighter.' } },
  ]},
  { id:'first-night-bench', illustration:'/street-life-game/assets/event-first-night-bench.webp', trigger:'bench', icon:'🪑', title:'Making a bed on a bench', text:'While you sit, someone on a nearby bench folds a jacket under their head and pulls a bag close. You had barely noticed them before. Now you recognise what they are preparing for.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='street', choices:[
    { label:'Ask how they get through the night', undiscoveredLocationRequired:'shelter', outcome:{ illustration:'/street-life-game/assets/event-bench-conversation.webp', minutes:10, mood:1, discoverLocation:'shelter', message:'You explain that you have nowhere to stay. They tell you about Night Shelter. “Try to get there before six in the evening. Places go quickly.” You save the address on your map.' } },
    { label:'Watch quietly', outcome:{ illustration:'/street-life-game/assets/event-bench-watch.webp', minutes:5, message:'They arrange their belongings without looking around. You wonder how many times you have walked past this same scene without really seeing it.' } },
    { label:'Give them some space', outcome:{ illustration:'/street-life-game/assets/event-bench-space.webp', minutes:5, message:'You keep your distance. You are not ready to talk about your own night, and they have not asked.' } },
  ]},
  { id:'first-night-station', illustration:'/street-life-game/assets/event-first-night-station.webp', trigger:'location', icon:'🚉', title:'The last departures', text:'A few passengers leave through the doors, checking their phones as they go. Further along the benches, someone has tucked their feet under a coat. You look at the departure board, then at the people who do not seem to be waiting for a train.', weight:1, eligible:c=>!!c.firstNight && c.locationId==='station', choices:[
    { label:'Ask if the seat next to them is free', outcome:{ illustration:'/street-life-game/assets/event-station-seat.webp', minutes:5, mood:1, message:'They move their bag and say yes. You thank them and sit for a moment. Neither of you asks why the other is here.' } },
    { label:'Ask where I could spend the night', undiscoveredLocationRequired:'shelter', outcome:{ illustration:'/street-life-game/assets/event-station-night.webp', minutes:10, mood:1, discoverLocation:'shelter', message:'You explain that you cannot go home. They give you directions to Night Shelter and suggest arriving before six in the evening. You save the address on your map.' } },
    { label:'Find a quiet seat on my own', outcome:{ illustration:'/street-life-game/assets/event-station-quiet.webp', minutes:5, message:'You choose a seat away from the doors. For now, you can just sit here without explaining anything.' } },
  ]},
  { id:'first-night-bench-wake', illustration:'/street-life-game/assets/event-first-night-bench-wake.webp', trigger:'wake', icon:'🪑', title:'Someone needs the bench', text:'A voice wakes you: “Could you sit up? I need a seat.” You are lying across the bench with your bag beside you.', weight:3, eligible:c=>!!c.firstNight && c.sleepKind==='bench', choices:[
    { label:'Sit up and gather my things', outcome:{ illustration:'/street-life-game/assets/event-wake-sit.webp', minutes:5, message:'You sit up and pull your bag onto your lap. The person takes the other end of the bench. The conversation goes no further.' } },
    { label:'Move somewhere else', outcome:{ illustration:'/street-life-game/assets/event-wake-move.webp', minutes:10, energy:-1, message:'You pick up your things and move away from the bench. You feel exposed after waking up in front of someone.' } },
    { label:'Ask for a moment to wake up', outcome:{ illustration:'/street-life-game/assets/event-wake-moment.webp', minutes:5, message:'“Just a moment,” you say. They wait while you put your things together. You make room for them.' } },
  ]},
]

// The prototype presents each eligible scene once, in catalog order. Spawn
// selection consumes no randomness; D20 and consequence rolls remain separate.
export function nextStreetEvent(trigger: EventTrigger, context: EventContext): StreetEvent | null {
  const event = STREET_EVENTS.find(event => !event.continuationOnly && event.trigger === trigger && !context.seenEventIds?.includes(event.id) && (!event.eligible || event.eligible(context)))
  return event ? illustrateStreetEvent(event, context) : null
}
