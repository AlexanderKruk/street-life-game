import { clothingHygieneCap } from './hygieneRules'
import { energyCap, moodLimit, type GameState, type TimeContext } from './game'
import type { IconName } from './Icon'

const causes: Record<string, { icon: IconName; name: string }> = {
  Street: { icon: 'walk', name: 'On the street' },
  'Night shelter': { icon: 'bed', name: 'Night shelter' },
  Schronisko: { icon: 'house', name: 'Schronisko' },
  Hostel: { icon: 'bed', name: 'Hostel' },
  Room: { icon: 'house', name: 'Rented room' },
  Hunger: { icon: 'food', name: 'Hunger' },
  Thirst: { icon: 'water', name: 'Thirst' },
  Health: { icon: 'heart', name: 'Health' },
  Tiredness: { icon: 'energy', name: 'Tiredness' },
  Hygiene: { icon: 'shower', name: 'Poor hygiene' },
  Cold: { icon: 'thermometer', name: 'Cold' },
  'Dirty clothes': { icon: 'person', name: 'Dirty clothes' },
}
export type LimitingEffect = { reason: string; icon: IconName; name: string; limits: { stat: 'mood' | 'energy' | 'hygiene'; cap: number }[] }

// Presentation only: preserve every tied strongest cause per stat, then group
// different affected stats by cause. Nothing is persisted as a temporary effect.
export function limitingEffects(state: GameState, context: TimeContext, cleanliness: number): LimitingEffect[] {
  const groups: LimitingEffect[] = []
  function add(reason: string, stat: 'mood' | 'energy' | 'hygiene', cap: number) {
    if (cap >= 100) return
    let effect = groups.find(group => group.reason === reason)
    if (!effect) {
      effect = { reason, ...(causes[reason] ?? { icon: 'person' as const, name: reason }), limits: [] }
      groups.push(effect)
    }
    effect.limits.push({ stat, cap })
  }
  const mood = moodLimit(state, context)
  mood.reasons.forEach(reason => add(reason, 'mood', mood.cap))
  add('Health', 'energy', energyCap(state.health))
  add('Dirty clothes', 'hygiene', clothingHygieneCap(cleanliness))
  return groups
}
