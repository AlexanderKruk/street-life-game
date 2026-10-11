const captions: Record<string, string> = {
  water: '3 portions', food: 'Sandwich', bread: '1 roll', cannedFood: 'Keeps well',
  wipes: '5 uses', showerGel: '20 showers', cigarettes: 'Pack of 5', medicines: 'Basic medicine',
}
const artPositions: Record<string, string> = {
  water: '0% 0%', food: '100% 0%', bread: '0% 33.333333%', cannedFood: '100% 33.333333%',
  wipes: '0% 66.666667%', showerGel: '100% 66.666667%', cigarettes: '0% 100%', medicines: '100% 100%',
}

type Props = {
  item: { id: string; name: string; price: number; description: string; impacts: string[] }
  open: boolean
  fits: boolean
  affordable: boolean
  onBuy: () => void
  onSteal: () => void
}

export default function ShopCard({ item, open, fits, affordable, onBuy, onSteal }: Props) {
  const reason = !open ? 'Shop closed' : !fits ? 'Backpack full' : !affordable ? 'Not enough money' : ''
  return <article className="supply-card">
    <div className="supply-picture">
      <span className="supply-art" style={{ backgroundPosition: artPositions[item.id] }} aria-hidden="true" />
    </div>
    <div className="supply-copy">
      <strong>{item.name}</strong><small title={item.description || undefined}>{captions[item.id]}</small>
      <div className="shop-impact supply-effects" aria-label="Effects">{item.impacts.map(impact => <em className={impact.includes('−') ? 'negative' : 'positive'} key={impact}>{impact}</em>)}</div>
    </div>
    <div className="supply-actions">
      <button className="supply-steal" onClick={onSteal} disabled={!open || !fits} aria-label="STEAL" title={`Steal ${item.name}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21v-8l5-5a2 2 0 0 1 3 3l-2 2h7a2 2 0 0 1 2 2l-1 4a3 3 0 0 1-3 2H3Z"/><path d="m12 7 2-3 3 2 1 3-3 2M19 3l2 2m-2 6h3M13 2V1"/></svg></button>
      <button className="shop-buy" onClick={onBuy} disabled={!!reason} aria-label={`Buy ${item.name} for ${item.price.toFixed(2)} zł`} title={reason || `Buy ${item.name}`}>{item.price} zł</button>
    </div>
    {open && reason && <small className="supply-unavailable">{reason}</small>}
  </article>
}
