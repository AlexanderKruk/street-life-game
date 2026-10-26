import { limitCauseLabel, type LimitReason } from './statusPresentation'
import { clothingHygieneCap } from './hygieneRules'
import { energyCap, moodLimit, type GameState, type TimeContext } from './game'
import type { IconName } from './Icon'

const causeIcons: Record<LimitReason, IconName> = {
  Street: 'walk', 'Night shelter': 'bed', Schronisko: 'house', Hostel: 'bed', Room: 'house', Apartment: 'person',
  Hunger: 'food', Thirst: 'water', Health: 'heart', Tiredness: 'energy', Hygiene: 'shower', Cold: 'thermometer', 'Dirty clothes': 'person',
}
export type LimitingEffect = { reason: LimitReason; icon: IconName; name: string; limits: { stat: 'mood' | 'energy' | 'hygiene'; cap: number }[] }

// Presentation only: preserve every tied strongest cause per stat, then group
// different affected stats by cause. Nothing is persisted as a temporary effect.
export function limitingEffects(state: GameState, context: TimeContext, cleanliness: number): LimitingEffect[] {
  const groups: LimitingEffect[] = []
  function add(reason: LimitReason, stat: 'mood' | 'energy' | 'hygiene', cap: number) {
    if (cap >= 100) return
    let effect = groups.find(group => group.reason === reason)
    if (!effect) {
      effect = { reason, icon: causeIcons[reason], name: limitCauseLabel(reason), limits: [] }
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
