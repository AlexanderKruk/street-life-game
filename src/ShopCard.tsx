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
  fits: boolean
  affordable: boolean
  onBuy: () => void
  onSteal: () => void
}

export default function ShopCard({ item, fits, affordable, onBuy, onSteal }: Props) {
  const reason = !fits ? 'Backpack full' : !affordable ? 'Not enough money' : ''
  return <article className="supply-card">
    <div className="supply-picture">
      <span className="supply-art" style={{ backgroundPosition: artPositions[item.id] }} aria-hidden="true" />
      <button className="supply-steal" onClick={onSteal} disabled={!fits} aria-label="STEAL" title={`Steal ${item.name}`}>Steal</button>
    </div>
    <div className="supply-copy">
      <strong>{item.name}</strong><small>{captions[item.id]}</small>
      <div className="supply-purchase"><b>{item.price} zł</b><button className="shop-buy" onClick={onBuy} disabled={!!reason} aria-label={`Buy ${item.name} for ${item.price.toFixed(2)} zł`} title={reason || `Buy ${item.name}`}>Buy</button></div>
      {reason && <small className="supply-unavailable">{reason}</small>}
    </div>
    <details className="supply-details"><summary>Effects</summary><p>{item.description}</p><div className="shop-impact">{item.impacts.map(impact => <em className={impact.includes('−') ? 'negative' : 'positive'} key={impact}>{impact}</em>)}</div></details>
  </article>
}
