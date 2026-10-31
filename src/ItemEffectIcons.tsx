import type { EffectChip, ImpactId } from './effectChips'
import { Icon, type IconName } from './Icon'

// Item previews only. Keep the full localized copy in the accessible name
// while showing the compact, language-independent stat icon and strength.
const impacts: Record<ImpactId, { icon: IconName; strength: string }> = {
  'thirst-large': { icon: 'water', strength: '+++' },
  'food-small': { icon: 'food', strength: '+' },
  'food-medium': { icon: 'food', strength: '++' },
  'food-large': { icon: 'food', strength: '+++' },
  'mood-gain': { icon: 'face-ok', strength: '+' },
  'mood-loss': { icon: 'face-bad', strength: '−' },
  'energy-loss': { icon: 'energy', strength: '−' },
  'energy-strong-loss': { icon: 'energy', strength: '−−' },
  'health-loss': { icon: 'heart', strength: '−' },
  'hygiene-small': { icon: 'shower', strength: '+' },
  'hygiene-large': { icon: 'shower', strength: '+++' },
  'travel-large': { icon: 'bus', strength: '+++' },
  'recovery-fast': { icon: 'heart', strength: '×3' },
  // The actual refundable value matters more than a generic plus.
  'deposit-value': { icon: 'banknote', strength: '' },
}

export default function ItemEffectIcons({ effects, className, label }: { effects: readonly EffectChip[]; className: string; label?: string }) {
  return <div className={`${className} item-effect-chips`} aria-label={label}>
    {effects.map(chip => {
      const freshness = chip.id.startsWith('freshness:')
      const icon = freshness ? chip.id === 'freshness:spoiled' ? 'face-bad' : 'clock' : impacts[chip.id as ImpactId].icon
      const value = freshness ? (chip.count === undefined ? '!' : `×${chip.count}`)
        : chip.id === 'deposit-value' ? chip.label : impacts[chip.id as ImpactId].strength
      return <em key={chip.id} className={chip.kind} data-effect-id={chip.id} role="img" aria-label={chip.label} title={chip.label}>
        <Icon name={icon} /><span aria-hidden="true">{value}</span>
      </em>
    })}
  </div>
}
