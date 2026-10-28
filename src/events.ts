import { t } from './i18n'
import type { WeatherId } from './weather'
import type { EventHistoryOutcomeId } from './eventHistoryDefinitions'
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
  weather: WeatherId
  housing: Housing
  documents: boolean
  firstNight?: boolean
  nearHome?: boolean
  sleepKind?: 'ground' | 'bench' | 'shelter' | 'residential'
  seenEventIds?: string[]
}

export type EventOutcome = {
  historyId?: EventHistoryOutcomeId
  message: string
  /** Complete alternate copy when this outcome reduces the phone to zero. */
  phoneBreakMessage?: string
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
    outcome = { ...outcome, identityCheck: false, minutes: (outcome.minutes ?? 0) + (documents ? 0 : 10), message: t(documents ? 'event.identity.carried' : storedDocuments ? 'event.identity.stored' : 'event.identity.missing', { outcome: outcome.message }) }
  }
  if (!outcome.randomCoin) return outcome
  let roll = random() * 100
  for (const coin of FOUND_COIN_DENOMINATIONS) {
    if (roll < coin.weight) {
      return { ...outcome, randomCoin: false, money: coin.grosz / 100, message: t(coin.grosz < 100 ? 'event.coin.grosz' : 'event.coin.zloty', { amount: coin.grosz < 100 ? coin.grosz : coin.grosz / 100 }) }
    }
    roll -= coin.weight
  }
  return { ...outcome, randomCoin: false, money: 5, message: t('event.coin.zloty', { amount: 5 }) }
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
  id?: string
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
  choiceOrder?: 'fixed'
  continuationOnly?: boolean
  eligible?: (context: EventContext) => boolean
  choices: (StreetEventChoice & { id: string })[]
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
  { id:'city-waking', trigger:'location', icon:'🌅', title:t('event.city-waking.title'), text:t('event.city-waking.text'), weight:1, eligible:c=>c.locationId==='street' && firstMorningTime(c), choices:[
    { id:'work', label:t('event.city-waking.choice.work'), icon:'work', outcome:{ historyId:'city-waking:work:complete', knownLocations:['work','jobcenter'], message:t('event.outcome.city-waking.work.complete') } },
    { id:'help', label:t('event.city-waking.choice.help'), icon:'help', outcome:{ historyId:'city-waking:help:complete', knownLocations:['shelter','support','daycenter'], message:t('event.outcome.city-waking.help.complete') } },
    { id:'wait', label:t('event.city-waking.choice.wait'), icon:'pause', outcome:{ historyId:'city-waking:wait:complete', message:t('event.outcome.city-waking.wait.complete') } },
  ]},
  { id:'night-rustle', trigger:'location', icon:'❔', title:t('event.night-rustle.title'), text:t('event.night-rustle.text'), weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && (c.minutes>=1320 || c.minutes<300), choices:[
    { id:'investigate', label:t('event.night-rustle.choice.investigate'), icon:'search', outcome:{ historyId:'night-rustle:investigate:complete', minutes:5, mood:2, message:t('event.outcome.night-rustle.investigate.complete') } },
    { id:'listen', label:t('event.night-rustle.choice.listen'), icon:'pause', outcome:{ historyId:'night-rustle:listen:complete', minutes:5, message:t('event.outcome.night-rustle.listen.complete') } },
    { id:'leave', label:t('event.night-rustle.choice.leave'), icon:'walk', outcome:{ historyId:'night-rustle:leave:complete', energy:-1, message:t('event.outcome.night-rustle.leave.complete') } },
  ]},
  { id:'borrow-phone', trigger:'location', icon:'📱', title:t('event.borrow-phone.title'), text:t('event.borrow-phone.text'), weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && c.minutes>=0 && c.minutes<240, choices:[
    { id:'lend', label:t('event.borrow-phone.choice.lend'), icon:'hand', phoneBatteryRequired:2, followUp:{ chance:0.5, eventId:'borrow-phone-slip' }, outcome:{ historyId:'borrow-phone:lend:complete', minutes:5, mood:3, phoneBattery:-2, message:t('event.outcome.borrow-phone.lend.complete') } },
    { id:'speaker', label:t('event.borrow-phone.choice.speaker'), icon:'phone', phoneBatteryRequired:1, outcome:{ historyId:'borrow-phone:speaker:complete', minutes:5, mood:2, phoneBattery:-1, message:t('event.outcome.borrow-phone.speaker.complete') } },
    { id:'decline', label:t('event.borrow-phone.choice.decline'), icon:'walk', outcome:{ historyId:'borrow-phone:decline:complete', message:t('event.outcome.borrow-phone.decline.complete') } },
  ]},
  { id:'park-company', trigger:'location', icon:'💬', title:t('event.park-company.title'), text:t('event.park-company.text'), weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && c.minutes>=0 && c.minutes<240, choices:[
    { id:'chat', label:t('event.park-company.choice.chat'), icon:'chat', durationMinutes:10, check:{ stat:'persuasion', dc:10,
      success:{ historyId:'park-company:chat:success', minutes:10, mood:3, message:t('event.outcome.park-company.chat.success') },
      failure:{ historyId:'park-company:chat:failure', minutes:10, mood:-2, message:t('event.outcome.park-company.chat.failure') },
    } },
    { id:'decline', label:t('event.park-company.choice.decline'), icon:'walk', outcome:{ historyId:'park-company:decline:complete', message:t('event.outcome.park-company.decline.complete') } },
    { id:'avoid', label:t('event.park-company.choice.avoid'), icon:'navigation', outcome:{ historyId:'park-company:avoid:complete', minutes:5, energy:-1, message:t('event.outcome.park-company.avoid.complete') } },
  ]},
  { id:'night-patrol', trigger:'location', icon:'💬', title:t('event.night-patrol.title'), text:t('event.night-patrol.text'), weight:1, eligible:c=>c.locationId==='street' && c.day!==undefined && c.day>=2 && c.minutes!==undefined && c.minutes>=0 && c.minutes<240, choices:[
    { id:'talk', label:t('event.night-patrol.choice.talk'), icon:'chat', outcome:{ historyId:'night-patrol:talk:complete', minutes:5, mood:1, message:t('event.outcome.night-patrol.talk.complete') } },
    { id:'ask-shelter', label:t('event.night-patrol.choice.ask-shelter'), icon:'help', undiscoveredLocationRequired:'shelter', outcome:{ historyId:'night-patrol:ask-shelter:complete', minutes:10, mood:3, discoverLocation:'shelter', message:t('event.outcome.night-patrol.ask-shelter.complete') } },
    { id:'decline', label:t('event.night-patrol.choice.decline'), icon:'walk', outcome:{ historyId:'night-patrol:decline:complete', message:t('event.outcome.night-patrol.decline.complete') } },
  ]},
  // This stage is reached only by handing over the phone; it never spawns alone.
  { id:'borrow-phone-slip', trigger:'location', continuationOnly:true, icon:'📱', title:t('event.borrow-phone-slip.title'), text:t('event.borrow-phone-slip.text'), weight:1, choices:[
    { id:'catch', label:t('event.borrow-phone-slip.choice.catch'), icon:'hand', check:{ stat:'reflex', dc:11,
      success:{ historyId:'borrow-phone-slip:catch:success', minutes:5, mood:3, phoneBattery:-2, message:t('event.outcome.borrow-phone-slip.catch.success') },
      failure:{ phoneBreakMessage:t('event.phoneSlip.broken'), historyId:'borrow-phone-slip:catch:failure', minutes:5, mood:3, phoneBattery:-2, phoneCondition:-5, message:t('event.outcome.borrow-phone-slip.catch.failure') },
    } },
  ]},
  { id:'station-cleaning', trigger:'location', icon:'🧹', title:t('event.station-cleaning.title'), text:t('event.station-cleaning.text'), weight:1, eligible:c=>c.locationId==='station' && (c.observation==='idle' || c.observation==='action') && (c.elapsedMinutes??0)>=15, choices:[
    { id:'move', icon:'bench', label:t('event.station-cleaning.choice.move'), outcome:{ historyId:'station-cleaning:move:complete', minutes:3, message:t('event.outcome.station-cleaning.move.complete') } },
    { id:'stretch', icon:'person', label:t('event.station-cleaning.choice.stretch'), outcome:{ historyId:'station-cleaning:stretch:complete', minutes:5, energy:1, message:t('event.outcome.station-cleaning.stretch.complete') } },
    { id:'ask-seat', icon:'bench', label:t('event.station-cleaning.choice.ask-seat'), outcome:{ historyId:'station-cleaning:ask-seat:complete', minutes:3, mood:1, message:t('event.outcome.station-cleaning.ask-seat.complete') } },
  ]},
  { id:'platform-question', trigger:'location', icon:'🚉', title:t('event.platform-question.title'), text:t('event.platform-question.text'), weight:1, eligible:c=>c.locationId==='station', choices:[
    { id:'help', icon:'search', label:t('event.platform-question.choice.help'), outcome:{ historyId:'platform-question:help:complete', minutes:3, mood:2, message:t('event.outcome.platform-question.help.complete') } },
    { id:'suggest-board', icon:'station', label:t('event.platform-question.choice.suggest-board'), outcome:{ historyId:'platform-question:suggest-board:complete', minutes:1, mood:1, message:t('event.outcome.platform-question.suggest-board.complete') } },
    { id:'unsure', icon:'chat', label:t('event.platform-question.choice.unsure'), outcome:{ historyId:'platform-question:unsure:complete', message:t('event.outcome.platform-question.unsure.complete') } },
  ]},
  { id:'street-patrol-wake', trigger:'wake', icon:'🪪', title:t('event.street-patrol-wake.title'), text:t('event.street-patrol-wake.text'), weight:1, eligible:c=>c.locationId==='street' && (c.sleepKind==='ground' || c.sleepKind==='bench') && !openingBenchWakeDue(c), choices:[
    { id:'answer', icon:'documents', label:t('event.street-patrol-wake.choice.answer'), outcome:{ historyId:'street-patrol-wake:answer:complete', identityCheck:true, minutes:5, mood:-1, message:t('event.outcome.street-patrol-wake.answer.complete') } },
    { id:'ask-shelter', icon:'bed', label:t('event.street-patrol-wake.choice.ask-shelter'), undiscoveredLocationRequired:'shelter', outcome:{ historyId:'street-patrol-wake:ask-shelter:complete', identityCheck:true, minutes:10, mood:1, discoverLocation:'shelter', message:t('event.outcome.street-patrol-wake.ask-shelter.complete') } },
    { id:'leave', icon:'walk', label:t('event.street-patrol-wake.choice.leave'), outcome:{ historyId:'street-patrol-wake:leave:complete', identityCheck:true, minutes:5, energy:-1, message:t('event.outcome.street-patrol-wake.leave.complete') } },
  ]},
  { id:'station-patrol-wake', trigger:'wake', icon:'🎫', title:t('event.station-patrol-wake.title'), text:t('event.station-patrol-wake.text'), weight:1, eligible:c=>c.locationId==='station' && c.sleepKind==='bench' && !openingBenchWakeDue(c), choices:[
    { id:'answer', icon:'documents', label:t('event.station-patrol-wake.choice.answer'), outcome:{ historyId:'station-patrol-wake:answer:complete', identityCheck:true, minutes:5, mood:-1, message:t('event.outcome.station-patrol-wake.answer.complete') } },
    { id:'ask-seat', icon:'chat', label:t('event.station-patrol-wake.choice.ask-seat'), outcome:{ historyId:'station-patrol-wake:ask-seat:complete', identityCheck:true, minutes:10, message:t('event.outcome.station-patrol-wake.ask-seat.complete') } },
    { id:'leave', icon:'walk', label:t('event.station-patrol-wake.choice.leave'), outcome:{ historyId:'station-patrol-wake:leave:complete', identityCheck:true, minutes:5, energy:-1, moveToStreet:true, message:t('event.outcome.station-patrol-wake.leave.complete') } },
  ]},
  { id:'phone-drop', choiceOrder:'fixed', trigger:'travel', icon:'📱', title:t('event.phone-drop.title'), text:t('event.phone-drop.text'), weight:3, eligible:c=>c.travelMode==='walk', choices:[
    { id:'catch', icon:'hand', label:t('event.phone-drop.choice.catch'), check:{ stat:'reflex', dc:11, requirements:{ minEnergy:20, minHealth:20 },
      success:{ historyId:'phone-drop:catch:success', mood:2, message:t('event.outcome.phone-drop.catch.success') },
      failure:{ historyId:'phone-drop:catch:failure', phoneCondition:-8, mood:-3, message:t('event.outcome.phone-drop.catch.failure') },
      criticalSuccess:{ historyId:'phone-drop:catch:criticalSuccess', mood:4, message:t('event.outcome.phone-drop.catch.criticalSuccess') },
      criticalFailure:{ historyId:'phone-drop:catch:criticalFailure', phoneCondition:-15, mood:-6, message:t('event.outcome.phone-drop.catch.criticalFailure') }
    }},
    { id:'let-fall', icon:'person', label:t('event.phone-drop.choice.let-fall'), outcome:{ historyId:'phone-drop:let-fall:complete', phoneCondition:-8, mood:-3, message:t('event.outcome.phone-drop.let-fall.complete') } }
  ]},
  { id:'found-coins', choiceOrder:'fixed', trigger:'travel', icon:'🪙', title:t('event.found-coins.title'), text:t('event.found-coins.text'), weight:4, eligible:c=>c.travelMode==='walk', choices:[
    { id:'take', icon:'person', label:t('event.found-coins.choice.take'), outcome:{ historyId:'found-coins:take:complete', randomCoin:true, message:t('event.outcome.found-coins.take.complete') } },
    { id:'leave', icon:'walk', label:t('event.found-coins.choice.leave'), outcome:{ historyId:'found-coins:leave:complete', mood:1, message:t('event.outcome.found-coins.leave.complete') } }
  ]},
  { id:'free-snack', choiceOrder:'fixed', trigger:'travel', icon:'🥪', title:t('event.free-snack.title'), text:t('event.free-snack.text'), weight:3, eligible:c=>!c.firstNight && c.travelMode==='walk' && streetHasPassersBy(c), choices:[
    { id:'accept', icon:'food', label:t('event.free-snack.choice.accept'), outcome:{ historyId:'free-snack:accept:complete', food:1, mood:2, message:t('event.outcome.free-snack.accept.complete') } },
    { id:'decline', icon:'walk', label:t('event.free-snack.choice.decline'), outcome:{ historyId:'free-snack:decline:complete', message:t('event.outcome.free-snack.decline.complete') } }
  ]},
  { id:'ticket-check', trigger:'travel', icon:'🎫', title:t('event.ticket-check.title'), text:t('event.ticket-check.text'), weight:3, eligible:c=>c.travelMode==='transit', choices:[
    { id:'show-ticket', icon:'ticket', label:t('event.ticket-check.choice.show-ticket'), outcome:{ historyId:'ticket-check:show-ticket:complete', message:t('event.outcome.ticket-check.show-ticket.complete') } }
  ]},
  { id:'station-food', choiceOrder:'fixed', trigger:'location', icon:'🥐', title:t('event.station-food.title'), text:t('event.station-food.text'), weight:3, eligible:c=>c.locationId==='station' && !c.firstNight && (c.minutes ?? 1200)>=1140, choices:[
    { id:'accept', icon:'food', label:t('event.station-food.choice.accept'), outcome:{ historyId:'station-food:accept:complete', food:1, mood:3, message:t('event.outcome.station-food.accept.complete') } },
    { id:'decline', icon:'walk', label:t('event.station-food.choice.decline'), outcome:{ historyId:'station-food:decline:complete', message:t('event.outcome.station-food.decline.complete') } }
  ]},
  { id:'rough-crowd', trigger:'location', icon:'⚠️', title:t('event.rough-crowd.title'), text:t('event.rough-crowd.text'), weight:2, eligible:c=>c.locationId==='station', choices:[
    { id:'leave', icon:'walk', label:t('event.rough-crowd.choice.leave'), outcome:{ historyId:'rough-crowd:leave:complete', minutes:10, energy:-2, message:t('event.outcome.rough-crowd.leave.complete') } },
    { id:'stay', icon:'clock', label:t('event.rough-crowd.choice.stay'), outcome:{ historyId:'rough-crowd:stay:complete', mood:-5, message:t('event.outcome.rough-crowd.stay.complete') } }
  ]},
  { id:'quiet-night', trigger:'wake', icon:'🌙', title:t('event.quiet-night.title'), text:t('event.quiet-night.text'), weight:5, choices:[
    { id:'get-up', icon:'person', label:t('event.quiet-night.choice.get-up'), outcome:{ historyId:'quiet-night:get-up:complete', mood:5, energy:5, message:t('event.outcome.quiet-night.get-up.complete') } }
  ]},
  { id:'night-theft', trigger:'wake', icon:'🎒', title:t('event.night-theft.title'), text:t('event.night-theft.text'), weight:2, eligible:c=>c.housing==='Street', choices:[
    { id:'check-bag', icon:'search', label:t('event.night-theft.choice.check-bag'), outcome:{ historyId:'night-theft:check-bag:complete', money:-5, mood:-7, loseDocuments:true, message:t('event.outcome.night-theft.check-bag.complete') } }
  ]},
  { id:'spare-change', trigger:'location', icon:'🪙', title:t('event.spare-change.title'), text:t('event.spare-change.text'), weight:2, eligible:c=>c.locationId==='station' || (c.locationId==='street' && c.minutes!==undefined && c.minutes>=480 && c.minutes<1080), choices:[
    { id:'give', icon:'coins', label:t('event.spare-change.choice.give'), moneyRequired:1, outcome:{ historyId:'spare-change:give:complete', money:-1, mood:1, message:t('event.outcome.spare-change.give.complete') } },
    { id:'decline', icon:'chat', label:t('event.spare-change.choice.decline'), outcome:{ historyId:'spare-change:decline:complete', message:t('event.outcome.spare-change.decline.complete') } },
    { id:'avoid', icon:'walk', label:t('event.spare-change.choice.avoid'), outcome:{ historyId:'spare-change:avoid:complete', message:t('event.outcome.spare-change.avoid.complete') } },
  ]},
  { id:'dropped-glove', trigger:'location', icon:'👤', title:t('event.dropped-glove.title'), text:t('event.dropped-glove.text'), weight:2, eligible:c=>c.locationId==='street' && streetHasPassersBy(c), choices:[
    { id:'call-out', icon:'chat', label:t('event.dropped-glove.choice.call-out'), outcome:{ historyId:'dropped-glove:call-out:complete', minutes:2, mood:2, message:t('event.outcome.dropped-glove.call-out.complete') } },
    { id:'leave', icon:'walk', label:t('event.dropped-glove.choice.leave'), outcome:{ historyId:'dropped-glove:leave:complete', message:t('event.outcome.dropped-glove.leave.complete') } },
  ]},
  // Keep the ID so an already-seen opening does not replay after an update.
  { id:'first-night-door', illustration:'/street-life-game/assets/event-neighbour-meeting.webp', trigger:'walk', icon:'🏠', title:t('event.first-night-door.title'), text:t('event.first-night-door.text'), weight:1, eligible:c=>!!c.firstNight && !!c.nearHome && c.locationId==='street' && c.minutes!==undefined && c.minutes>=1320 && c.minutes<1380, choices:[
    { id:'decline', icon:'walk', label:t('event.first-night-door.choice.decline'), outcome:{ historyId:'first-night-door:decline:complete', illustration:'/street-life-game/assets/event-neighbour-decline.webp', mood:-2, message:t('event.outcome.first-night-door.decline.complete') } },
    { id:'help', icon:'help', label:t('event.first-night-door.choice.help'), outcome:{ historyId:'first-night-door:help:complete', illustration:'/street-life-game/assets/event-neighbour-help.webp', minutes:5, mood:2, message:t('event.outcome.first-night-door.help.complete') } },
    { id:'explain', icon:'chat', label:t('event.first-night-door.choice.explain'), outcome:{ historyId:'first-night-door:explain:complete', illustration:'/street-life-game/assets/event-neighbour-supplies.webp', minutes:5, mood:3, food:1, water:1, message:t('event.outcome.first-night-door.explain.complete') } },
  ]},
  { id:'first-night-dog', illustration:'/street-life-game/assets/event-neighbour-dog-meeting.webp', trigger:'walk', icon:'🐕', title:t('event.first-night-dog.title'), text:t('event.first-night-dog.text'), weight:1, eligible:c=>!!c.firstNight && !!c.nearHome && c.locationId==='street' && c.minutes!==undefined && c.minutes>=1320 && c.minutes<1440, choices:[
    { id:'avoid', icon:'walk', label:t('event.first-night-dog.choice.avoid'), outcome:{ historyId:'first-night-dog:avoid:complete', illustration:'/street-life-game/assets/event-neighbour-dog-avoid.webp', mood:-2, message:t('event.outcome.first-night-dog.avoid.complete') } },
    { id:'pass', icon:'walk', label:t('event.first-night-dog.choice.pass'), outcome:{ historyId:'first-night-dog:pass:complete', illustration:'/street-life-game/assets/event-neighbour-dog-pass.webp', mood:-1, message:t('event.outcome.first-night-dog.pass.complete') } },
    { id:'greet', icon:'chat', label:t('event.first-night-dog.choice.greet'), outcome:{ historyId:'first-night-dog:greet:complete', illustration:'/street-life-game/assets/event-neighbour-dog-greet.webp', minutes:5, mood:3, message:t('event.outcome.first-night-dog.greet.complete') } },
  ]},
  { id:'first-night-bench', illustration:'/street-life-game/assets/event-first-night-bench.webp', trigger:'bench', icon:'🪑', title:t('event.first-night-bench.title'), text:t('event.first-night-bench.text'), weight:1, eligible:c=>!!c.firstNight && c.locationId==='street', choices:[
    { id:'ask', icon:'chat', label:t('event.first-night-bench.choice.ask'), undiscoveredLocationRequired:'shelter', outcome:{ historyId:'first-night-bench:ask:complete', illustration:'/street-life-game/assets/event-bench-conversation.webp', minutes:10, mood:1, discoverLocation:'shelter', message:t('event.outcome.first-night-bench.ask.complete') } },
    { id:'watch', icon:'clock', label:t('event.first-night-bench.choice.watch'), outcome:{ historyId:'first-night-bench:watch:complete', illustration:'/street-life-game/assets/event-bench-watch.webp', minutes:5, message:t('event.outcome.first-night-bench.watch.complete') } },
    { id:'leave', icon:'person', label:t('event.first-night-bench.choice.leave'), outcome:{ historyId:'first-night-bench:leave:complete', illustration:'/street-life-game/assets/event-bench-space.webp', minutes:5, message:t('event.outcome.first-night-bench.leave.complete') } },
  ]},
  { id:'first-night-station', illustration:'/street-life-game/assets/event-first-night-station.webp', trigger:'location', icon:'🚉', title:t('event.first-night-station.title'), text:t('event.first-night-station.text'), weight:1, eligible:c=>!!c.firstNight && c.locationId==='station', choices:[
    { id:'ask-seat', icon:'bench', label:t('event.first-night-station.choice.ask-seat'), outcome:{ historyId:'first-night-station:ask-seat:complete', illustration:'/street-life-game/assets/event-station-seat.webp', minutes:5, mood:1, message:t('event.outcome.first-night-station.ask-seat.complete') } },
    { id:'ask-shelter', icon:'bed', label:t('event.first-night-station.choice.ask-shelter'), undiscoveredLocationRequired:'shelter', outcome:{ historyId:'first-night-station:ask-shelter:complete', illustration:'/street-life-game/assets/event-station-night.webp', minutes:10, mood:1, discoverLocation:'shelter', message:t('event.outcome.first-night-station.ask-shelter.complete') } },
    { id:'sit-alone', icon:'bench', label:t('event.first-night-station.choice.sit-alone'), outcome:{ historyId:'first-night-station:sit-alone:complete', illustration:'/street-life-game/assets/event-station-quiet.webp', minutes:5, message:t('event.outcome.first-night-station.sit-alone.complete') } },
  ]},
  { id:'first-night-bench-wake', illustration:'/street-life-game/assets/event-first-night-bench-wake.webp', trigger:'wake', icon:'🪑', title:t('event.first-night-bench-wake.title'), text:t('event.first-night-bench-wake.text'), weight:3, eligible:c=>!!c.firstNight && c.sleepKind==='bench', choices:[
    { id:'sit-up', icon:'bench', label:t('event.first-night-bench-wake.choice.sit-up'), outcome:{ historyId:'first-night-bench-wake:sit-up:complete', illustration:'/street-life-game/assets/event-wake-sit.webp', minutes:5, message:t('event.outcome.first-night-bench-wake.sit-up.complete') } },
    { id:'leave', icon:'walk', label:t('event.first-night-bench-wake.choice.leave'), outcome:{ historyId:'first-night-bench-wake:leave:complete', illustration:'/street-life-game/assets/event-wake-move.webp', minutes:10, energy:-1, message:t('event.outcome.first-night-bench-wake.leave.complete') } },
    { id:'wait', icon:'chat', label:t('event.first-night-bench-wake.choice.wait'), outcome:{ historyId:'first-night-bench-wake:wait:complete', illustration:'/street-life-game/assets/event-wake-moment.webp', minutes:5, message:t('event.outcome.first-night-bench-wake.wait.complete') } },
  ]},
]

// The prototype presents each eligible scene once, in catalog order. Spawn
// selection consumes no randomness; D20 and consequence rolls remain separate.
export function nextStreetEvent(trigger: EventTrigger, context: EventContext): StreetEvent | null {
  const event = STREET_EVENTS.find(event => !event.continuationOnly && event.trigger === trigger && !context.seenEventIds?.includes(event.id) && (!event.eligible || event.eligible(context)))
  return event ? prepareStreetEvent(event, context) : null
}

// Both locations share the saved spare-change ID: one encounter per run.
// Resolve costs/copy here so fresh selection and pending-save restoration agree.
export function prepareStreetEvent(event: StreetEvent, context: Pick<EventContext, 'locationId' | 'housing' | 'sleepKind'>): StreetEvent {
  if (event.id === 'spare-change' && context.locationId === 'street') {
    event = { ...event, text: t('event.spare-change.street.text'), choices: event.choices.map(choice => {
      if (choice.id === 'give') return { ...choice, label: t('event.spare-change.street.choice.give'), moneyRequired: 2,
        outcome: { ...choice.outcome!, money: -2, message: t('event.spare-change.street.outcome.give') } }
      return { ...choice, outcome: { ...choice.outcome!, message: t(choice.id === 'decline'
        ? 'event.spare-change.street.outcome.decline' : 'event.spare-change.street.outcome.avoid') } }
    }) }
  }
  return illustrateStreetEvent(event, context)
}
