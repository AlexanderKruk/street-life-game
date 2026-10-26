import { impactChip, type ImpactId } from './effectChips'
import { t } from './i18n'
import type { EffectId } from './stateTypes'
import type { IconName } from './Icon'
import type { GameState } from './game'
import { absoluteMinutes } from './gameTime'

export const EFFECTS: Record<EffectId, { icon: IconName; name: string; kind: 'positive' | 'negative'; impacts: ImpactId[] }> = {
  cold: { icon: 'thermometer', name: t('effect.cold.name'), kind: 'negative', impacts: ['energy-strong-loss', 'mood-loss'] },
  'free-transit': { icon: 'ticket', name: t('effect.freeTransit.name'), kind: 'positive', impacts: ['travel-large'] },
  'well-fed': { icon: 'food', name: t('effect.wellFed.name'), kind: 'positive', impacts: ['food-large', 'mood-gain'] },
}


export function statusImpactChips(id: EffectId, moodCap?: number, translate: typeof t = t) {
  return EFFECTS[id].impacts.map(impact => {
    const chip = impactChip(impact, translate)
    return id === 'cold' && chip.resourceId === 'mood' && moodCap !== undefined
      ? { ...chip, label: translate('effect.cappedImpact', { impact: chip.label, cap: Math.round(moodCap) }) } : chip
  })
}


export function remainingEffect(expiresAt: number, game: GameState) {
  const left = Math.max(0, expiresAt - absoluteMinutes(game))
  if (left >= 1440) return `${Math.ceil(left / 1440)} days`
  if (left >= 60) return `${Math.ceil(left / 60)}h`
  return `${left}m`
}

