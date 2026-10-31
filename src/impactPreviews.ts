import type { ImpactId } from './effectChips'
import type { IconName } from './Icon'

export const impactPreviews: Record<ImpactId, readonly [IconName, string]> = {
  'thirst-large': ['water', '+++'], 'food-small': ['food', '+'],
  'food-medium': ['food', '++'], 'food-large': ['food', '+++'],
  'mood-gain': ['face-ok', '+'], 'mood-loss': ['face-bad', '−'],
  'energy-loss': ['energy', '−'], 'energy-strong-loss': ['energy', '−−'],
  'health-loss': ['heart', '−'], 'hygiene-small': ['shower', '+'],
  'hygiene-large': ['shower', '+++'], 'travel-large': ['bus', '+++'],
  'recovery-fast': ['heart', '×3'], 'deposit-value': ['banknote', ''],
}
