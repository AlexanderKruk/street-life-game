import type { EventContext, EventOutcome, StreetEvent } from './events'

const asset = (name: string) => `/street-life-game/assets/${name}.webp`
type ChoiceArt = string | { success: string; failure: string }
type EventArt = { scene: string; choices: ChoiceArt[] }

// Presentation only: eligibility, weights, checks and resource changes stay in events.ts.
const art: Record<string, EventArt> = {
  'phone-drop': { scene: 'event-phone-drop', choices: [{ success: 'event-phone-caught', failure: 'event-phone-fallen' }, 'event-phone-fallen'] },
  'rain-phone': { scene: 'event-rain-phone', choices: ['event-rain-protect', 'event-rain-moving'] },
  'found-coins': { scene: 'event-found-coin', choices: ['event-coin-take', 'event-coin-leave'] },
  'free-snack': { scene: 'event-free-snack', choices: ['event-snack-accept', 'event-snack-decline'] },
  'ticket-check': { scene: 'event-ticket-check', choices: ['event-ticket-shown'] },
  'station-food': { scene: 'event-station-food', choices: ['event-station-accept', 'event-station-decline'] },
  'useful-tip': { scene: 'event-useful-tip', choices: [{ success: 'event-tip-conversation', failure: 'event-tip-ending' }, 'event-tip-conversation', 'event-tip-ending'] },
  'rough-crowd': { scene: 'event-rough-crowd', choices: ['event-crowd-away', 'event-crowd-stay'] },
  'quiet-night': { scene: 'event-quiet-ground', choices: [] },
  'night-theft': { scene: 'event-night-theft', choices: ['event-theft-check'] },
}

export function illustrateStreetEvent(event: StreetEvent, context: EventContext): StreetEvent {
  const images = art[event.id]
  if (!images) return event
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
