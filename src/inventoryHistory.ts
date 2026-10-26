import { t } from './i18n'
import type { ResultActionId } from './resultActions'
import type { ResultSummary } from './results'
import { resultChangeId } from './legacyResultCompatibility'
export type InventoryHistoryFacts = {
  status: 'success' | 'purchase-blocked' | 'storage-blocked' | 'food-fine' | 'food-nausea' | 'food-vomiting' | 'medicine-none' | 'medicine-treated' | 'medicine-taken'
  itemName?: string
}
export function inventoryHistoryReflection(id: ResultActionId, facts: InventoryHistoryFacts, summary?: ResultSummary, translate: typeof t = t) {
  const { status } = facts
  if (id.startsWith('buy:')) return { title: translate('history.inventory.buy', { item: facts.itemName ?? '' }), text: status === 'purchase-blocked' ? translate('history.inventory.purchaseBlocked') : '' }
  if (status === 'food-fine' || status === 'food-nausea' || status === 'food-vomiting') {
    const rows = [...(summary?.costs ?? []), ...(summary?.changes ?? [])]
    const changed = (id: string, kind: string) => rows.some(row => resultChangeId(row) === id && row.kind === kind)
    const text = changed('mood', 'negative') || changed('health', 'negative') ? translate('history.inventory.unsettled') : changed('mood', 'positive') ? translate('history.inventory.steadier') : ''
    return { title: translate(`history.inventory.${status}`), text }
  }
  if (id === 'use-medicine') {
    const title = status === 'medicine-none' || status === 'medicine-treated' || status === 'medicine-taken' ? translate(`history.inventory.${status}`) : translate('history.inventory.medicineTitle')
    return { title, text: status === 'medicine-none' || status === 'medicine-treated' ? '' : translate('history.inventory.medicine') }
  }
  if (id === 'use:water') return { title: translate('history.inventory.drinkTitle'), text: translate('history.inventory.drink') }
  if (id === 'use:wipes') return { title: translate('history.inventory.wipesTitle'), text: translate('history.inventory.wipes') }
  if (id.startsWith('use:')) return { title: translate('history.inventory.foodTitle'), text: translate('history.inventory.food') }
  if (id === 'smoke') return { title: translate('history.inventory.smokeTitle'), text: translate('history.inventory.smoke') }
  if (id === 'return-containers') return { title: translate('history.inventory.containersTitle'), text: translate('history.inventory.money') }
  const key = id === 'store-belongings' ? 'store' : id === 'collect-belongings' ? 'collect' : id === 'store-food' ? 'store-food' : 'collect-food'
  return { title: translate(`history.inventory.${key}`), text: status === 'storage-blocked' ? translate('history.inventory.storageBlocked') : '' }
}
