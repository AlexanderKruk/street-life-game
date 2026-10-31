import { t } from './i18n'
import type { EffectChip } from './effectChips'
import ItemArt, { type ItemArtId } from './ItemArt'
import { Icon } from './Icon'
import ItemEffects from './ItemEffects'

type Props = { art: ItemArtId; name: string; quantity: number; effects: EffectChip[]; hint: string; onUse?: () => void; onDiscard?: () => void; disabled?: boolean }

export default function InventorySlot({ art, name, quantity, effects, hint, onUse, onDiscard, disabled }: Props) {
  const content = <><div className="inventory-slot-picture"><ItemArt id={art} /></div>
    <div className="inventory-slot-copy"><strong>{name} <span className="inventory-quantity">{t('inventory.quantity', { quantity })}</span></strong><ItemEffects className="inventory-effects" effects={effects} /></div></>
  return <div className="inventory-slot" role={!onUse ? 'group' : undefined} aria-label={!onUse ? t('inventory.slotAccessible', { name, quantity, hint }) : undefined}>
    {onUse ? <button type="button" className="inventory-slot-use" onClick={onUse} disabled={disabled} aria-label={t('inventory.slotAccessible', { name, quantity, hint })} title={hint}>{content}</button> : content}
    {onDiscard && <button type="button" className="inventory-discard" onClick={onDiscard} aria-label={t('inventory.discardAccessible', { name, quantity })} title={t('inventory.discardTitle', { name })}><Icon name="trash" /></button>}
  </div>
}
