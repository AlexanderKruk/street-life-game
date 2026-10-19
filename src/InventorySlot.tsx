import ItemArt, { type ItemArtId } from './ItemArt'
import { Icon } from './Icon'

type Props = { art: ItemArtId; name: string; quantity: number; effects: string[]; hint: string; onUse?: () => void; onDiscard?: () => void; disabled?: boolean }

export default function InventorySlot({ art, name, quantity, effects, hint, onUse, onDiscard, disabled }: Props) {
  const content = <><div className="inventory-slot-picture"><ItemArt id={art} /></div>
    <div className="inventory-slot-copy"><strong>{name} <span className="inventory-quantity">×{quantity}</span></strong><div className="inventory-effects">{effects.map(effect => <em className={effect.includes('−') || effect === 'Spoiled' ? 'negative' : effect === 'Stale' ? 'warning' : 'positive'} key={effect}>{effect}</em>)}</div></div></>
  return <div className="inventory-slot" role={!onUse ? 'group' : undefined} aria-label={!onUse ? `${name} ×${quantity} · ${hint}` : undefined}>
    {onUse ? <button type="button" className="inventory-slot-use" onClick={onUse} disabled={disabled} aria-label={`${name} ×${quantity} · ${hint}`} title={hint}>{content}</button> : content}
    {onDiscard && <button type="button" className="inventory-discard" onClick={onDiscard} aria-label={`Discard ${name} ×${quantity}`} title={`Discard ${name}`}><Icon name="trash" /></button>}
  </div>
}
