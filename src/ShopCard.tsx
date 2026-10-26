import { impactChip } from './effectChips'
import type { ShopItem } from './stateTypes'
import { Icon } from './Icon'
import ItemArt, { type ItemArtId } from './ItemArt'
import { memo } from 'react'

const captions: Record<string, string> = {
  water: '3 portions', food: 'Sandwich', bread: '1 roll', cannedFood: 'Keeps well', readyMeal: 'Pasta with meat & herbs',
  wipes: '5 uses', showerGel: '20 showers', cigarettes: 'Pack of 5', medicines: 'Basic medicine',
}

type Props = {
  item: Pick<ShopItem, 'id' | 'name' | 'price' | 'description' | 'impacts'>
  open: boolean
  fits: boolean
  affordable: boolean
  onBuy: (id: string) => void
  onSteal: (id: string) => void
}

export default memo(function ShopCard({ item, open, fits, affordable, onBuy, onSteal }: Props) {
  const reason = !open ? 'Shop closed' : !fits ? 'Backpack full' : !affordable ? 'Not enough money' : ''
  return <article className="supply-card">
    <div className="supply-picture">
      <ItemArt id={item.id as ItemArtId} className="supply-art" />
    </div>
    <div className="supply-copy">
      <strong>{item.name}</strong><small title={item.description || undefined}>{captions[item.id]}</small>
      <div className="shop-impact supply-effects" aria-label="Effects">{item.impacts.map(id => impactChip(id)).map(chip => <em className={chip.kind} key={chip.id}>{chip.label}</em>)}</div>
    </div>
    <div className="supply-actions">
      <button className="supply-steal" onClick={() => onSteal(item.id)} disabled={!open || !fits} aria-label="STEAL" title={`Steal ${item.name}`}><Icon name="thief" /></button>
      <button className="shop-buy" onClick={() => onBuy(item.id)} disabled={!!reason} aria-label={`Buy ${item.name} for ${item.price.toFixed(2)} zł`} title={reason || `Buy ${item.name}`}>{item.price} zł</button>
    </div>
    {open && reason && <small className="supply-unavailable">{reason}</small>}
  </article>
})
