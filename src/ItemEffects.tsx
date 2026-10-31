import type { EffectChip, ImpactId } from './effectChips'
import { Icon, type IconName } from './Icon'

const previews: Record<ImpactId, readonly [IconName, string]> = {
  'thirst-large': ['water', '+++'], 'food-small': ['food', '+'],
  'food-medium': ['food', '++'], 'food-large': ['food', '+++'],
  'mood-gain': ['face-ok', '+'], 'mood-loss': ['face-bad', '−'],
  'energy-loss': ['energy', '−'], 'energy-strong-loss': ['energy', '−−'],
  'health-loss': ['heart', '−'], 'hygiene-small': ['shower', '+'],
  'hygiene-large': ['shower', '+++'], 'travel-large': ['bus', '+++'],
  'recovery-fast': ['pill', '×3'], 'deposit-value': ['banknote', ''],
}

/** Product previews only; full translated descriptions remain accessible.
 * Freshness keeps its explicit wording and counts rather than an ambiguous icon. */
export default function ItemEffects({ effects, className, label }: { effects: readonly EffectChip[]; className: string; label?: string }) {
  return <div className={`${className} item-effects`} aria-label={label}>{effects.map(effect => {
    const preview = Object.hasOwn(previews, effect.id) ? previews[effect.id as ImpactId] : undefined
    return <em key={effect.id} className={effect.kind} data-effect-id={effect.id} role="img" aria-label={effect.label} title={effect.label}>
      {preview ? <><Icon name={preview[0]} /><span aria-hidden="true">{effect.id === 'deposit-value' ? effect.label : preview[1]}</span></> : effect.label}
    </em>
  })}</div>
}
