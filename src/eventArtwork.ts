import type { EventContext, EventOutcome, StreetEvent } from './events'

const asset = (name: string) => `/street-life-game/assets/${name}.webp`
type ChoiceArt = string | { success: string; failure: string }
type EventArt = { scene: string; choices: ChoiceArt[]; locations?: Record<string, EventArt> }

// Presentation only: eligibility, weights, checks and resource changes stay in events.ts.
const art: Record<string, EventArt> = {
  'first-night-bench-wake': {
    scene: 'event-first-night-bench-wake', choices: ['event-wake-sit', 'event-wake-move', 'event-wake-moment'],
    locations: {
      station: { scene: 'event-first-night-station-bench-wake', choices: ['event-station-wake-sit', 'event-station-wake-move', 'event-station-wake-moment'] },
    },
  },
  'city-waking': { scene: 'event-first-morning', choices: ['event-morning-independent', 'event-morning-help', 'event-morning-pause'] },
  'night-rustle': { scene: 'event-night-rustle', choices: ['event-rustle-cat', 'event-rustle-wait', 'event-rustle-leave'] },
  'borrow-phone': { scene: 'event-borrow-phone', choices: ['event-borrow-phone-return', 'event-borrow-phone-speaker', 'event-borrow-phone-decline'] },
  'park-company': { scene: 'event-park-company', choices: [{ success: 'event-park-company-talk', failure: 'event-park-company-argument' }, 'event-park-company-decline', 'event-park-company-detour'] },
  'night-patrol': { scene: 'event-night-patrol', choices: ['event-night-patrol-reassured', 'event-night-patrol-directions', 'event-night-patrol-declined'] },
  'borrow-phone-slip': { scene: 'event-borrow-phone-slip', choices: [{ success: 'event-borrow-phone-caught', failure: 'event-borrow-phone-dropped' }] },
  'station-cleaning': { scene: 'event-station-cleaning', choices: ['event-cleaning-move', 'event-cleaning-stretch', 'event-cleaning-ask'] },
  'spare-change': { scene: 'event-spare-change-station', choices: ['event-spare-change-give', 'event-spare-change-decline', 'event-spare-change-avoid'], locations: { street: { scene: 'event-spare-change-street', choices: ['event-spare-change-street-give', 'event-spare-change-street-decline', 'event-spare-change-street-avoid'] } } },
  'platform-question': { scene: 'event-platform-question', choices: ['event-platform-board', 'event-platform-point', 'event-platform-unsure'] },
  'street-patrol-wake': { scene: 'event-street-patrol-wake', choices: ['event-street-patrol-answer', 'event-street-patrol-help', 'event-street-patrol-move'] },
  'station-patrol-wake': { scene: 'event-station-patrol-wake', choices: ['event-station-patrol-answer', 'event-station-patrol-wait', 'event-station-patrol-exit'] },
  'phone-drop': { scene: 'event-phone-drop', choices: [{ success: 'event-phone-caught', failure: 'event-phone-fallen' }, 'event-phone-fallen'] },
  'rain-phone': { scene: 'event-rain-phone', choices: ['event-rain-protect', 'event-rain-moving'] },
  'found-coins': { scene: 'event-found-coin', choices: ['event-coin-take', 'event-coin-leave'] },
  'free-snack': { scene: 'event-free-snack', choices: ['event-snack-accept', 'event-snack-decline'] },
  'ticket-check': { scene: 'event-ticket-check', choices: ['event-ticket-shown'] },
  'station-food': { scene: 'event-station-food', choices: ['event-station-accept', 'event-station-decline'] },
  'rough-crowd': { scene: 'event-rough-crowd', choices: ['event-crowd-away', 'event-crowd-stay'] },
  'quiet-night': { scene: 'event-quiet-ground', choices: [] },
  'night-theft': { scene: 'event-night-theft', choices: ['event-theft-check'] },
}

export function illustrateStreetEvent(event: StreetEvent, context: Pick<EventContext, 'locationId' | 'housing' | 'sleepKind'>): StreetEvent {
  const defaults = art[event.id]
  if (!defaults) return event
  const images = defaults.locations?.[context.locationId] ?? defaults
  const scene = event.id === 'quiet-night'
    ? context.housing === 'Night shelter' ? 'event-quiet-shelter'
      : context.sleepKind === 'bench' ? 'event-quiet-bench' : 'event-quiet-ground'
    : images.scene
  const illustrated = (outcome: EventOutcome, name: string): EventOutcome => ({ ...outcome, illustration: asset(name) })
  return { ...event, illustration: asset(scene), choices: event.choices.map((choice, index) => {
    const image = images.choices[index] ?? scene
    if (choice.check && typeof image !== 'string') {
      const check = choice.check
      return { ...choice, check: { ...check,
        success: illustrated(check.success, image.success), failure: illustrated(check.failure, image.failure),
        ...(check.criticalSuccess ? { criticalSuccess: illustrated(check.criticalSuccess, image.success) } : {}),
        ...(check.criticalFailure ? { criticalFailure: illustrated(check.criticalFailure, image.failure) } : {}),
      } }
    }
    return choice.outcome && typeof image === 'string' ? { ...choice, outcome: illustrated(choice.outcome, image) } : choice
  }) }
}
