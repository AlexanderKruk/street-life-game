import type { EffectId } from './stateTypes'
import type { IconName } from './Icon'
import type { GameState } from './game'
import { absoluteMinutes } from './gameTime'

export const EFFECTS: Record<EffectId, { icon: IconName; name: string; kind: 'positive' | 'negative'; impacts: string[] }> = {
  cold: { icon: 'thermometer', name: 'Cold', kind: 'negative', impacts: ['Energy−−', 'Mood−'] },
  'free-transit': { icon: 'ticket', name: 'Free transport', kind: 'positive', impacts: ['Travel+++'] },
  'well-fed': { icon: 'food', name: 'Well fed', kind: 'positive', impacts: ['Food+++', 'Mood+'] },
}


export function remainingEffect(expiresAt: number, game: GameState) {
  const left = Math.max(0, expiresAt - absoluteMinutes(game))
  if (left >= 1440) return `${Math.ceil(left / 1440)} days`
  if (left >= 60) return `${Math.ceil(left / 60)}h`
  return `${left}m`
}

