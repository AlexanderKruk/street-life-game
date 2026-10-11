import ItemArt, { type ItemArtId } from './ItemArt'

type Props = { art: ItemArtId; name: string; quantity: number; effects: string[]; hint: string; onUse?: () => void; disabled?: boolean }

export default function InventorySlot({ art, name, quantity, effects, hint, onUse, disabled }: Props) {
  const content = <><div className="inventory-slot-picture"><ItemArt id={art} /></div>
    <div className="inventory-slot-copy"><strong>{name} <span className="inventory-quantity">×{quantity}</span></strong><div className="inventory-effects">{effects.map(effect => <em className={effect.includes('−') || effect === 'Spoiled' ? 'negative' : effect === 'Stale' ? 'warning' : 'positive'} key={effect}>{effect}</em>)}</div></div></>
  return onUse ? <button className="inventory-slot usable" onClick={onUse} disabled={disabled} aria-label={`${name} ×${quantity} · ${hint}`} title={hint}>{content}</button>
    : <div className="inventory-slot" role="group" aria-label={`${name} ×${quantity} · ${hint}`} title={hint}>{content}</div>
}
