import { t } from './i18n'
import type { BackpackItemId, ShopItem } from './stateTypes'

export type ItemNameId = BackpackItemId | 'phone' | 'clothing' | 'documents' | 'transitCard'
export function itemName(id: ItemNameId) { return t(`item.name.${id}`) }
// Food is a generic carried item; the shop sells the specific Cheap food option.
export function backpackItemName(id: BackpackItemId) { return id === 'food' ? t('item.backpack.food') : itemName(id) }
export function shopItemDescription(id: ShopItem['id']) { return t(`item.description.${id}`) }
export function shopItemCaption(id: ShopItem['id'], quantity: number) { return t(`item.caption.${id}`, { count: quantity }) }

export function rejectedSupplyLabel(id: 'food' | 'water', count: number) { return t(`inventory.rejected.${id}`, { count }) }
