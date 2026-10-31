import { t } from './i18n'
import { formatMoney } from './i18n/formatters'
import { shopItemCaption } from './itemPresentation'
import { impactChip } from './effectChips'
import type { ShopItem } from './stateTypes'
import { Icon } from './Icon'
import ItemEffectIcons from './ItemEffectIcons'
import ItemArt, { type ItemArtId } from './ItemArt'
import { memo } from 'react'

type Props = {
  item: Pick<ShopItem, 'id' | 'name' | 'price' | 'description' | 'impacts' | 'quantity'>
  open: boolean
  fits: boolean
  affordable: boolean
  onBuy: (id: string) => void
  onSteal: (id: string) => void
}

export default memo(function ShopCard({ item, open, fits, affordable, onBuy, onSteal }: Props) {
  const reasonId = !open ? 'shop.closed' : !fits ? 'shop.full' : !affordable ? 'shop.unaffordable' : undefined
  const reason = reasonId ? t(reasonId) : ''
  return <article className="supply-card">
    <div className="supply-picture">
      <ItemArt id={item.id as ItemArtId} className="supply-art" />
    </div>
    <div className="supply-copy">
      <strong>{item.name}</strong><small title={item.description || undefined}>{shopItemCaption(item.id, item.quantity)}</small>
      <ItemEffectIcons className="shop-impact supply-effects" label={t('shop.effects')} effects={item.impacts.map(id => impactChip(id))} />
    </div>
    <div className="supply-actions">
      <button className="supply-steal" onClick={() => onSteal(item.id)} disabled={!open || !fits} aria-label={t('shop.stealAccessible')} title={t('shop.stealTitle', { name: item.name })}><Icon name="thief" /></button>
      <button className="shop-buy" onClick={() => onBuy(item.id)} disabled={reasonId !== undefined} aria-label={t('shop.buyAccessible', { name: item.name, price: formatMoney(item.price, true) })} title={reasonId ? reason : t('shop.buyTitle', { name: item.name })}>{formatMoney(item.price)}</button>
    </div>
    {open && reasonId && <small className="supply-unavailable">{reason}</small>}
  </article>
})
