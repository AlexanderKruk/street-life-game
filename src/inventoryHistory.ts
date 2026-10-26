import { t } from './i18n'
import type { ResultActionId } from './resultActions'
import type { ResultSummary } from './results'
import { resultChangeId } from './legacyResultCompatibility'
export type InventoryHistoryFacts = {
  status: 'success' | 'purchase-blocked' | 'storage-blocked' | 'food-fine' | 'food-nausea' | 'food-vomiting' | 'medicine-none' | 'medicine-treated' | 'medicine-taken'
  itemName?: string
}
export function inventoryHistoryReflection(id: ResultActionId, facts: InventoryHistoryFacts, summary?: ResultSummary) {
  const { status } = facts
  if (id.startsWith('buy:')) return { title: t('history.inventory.buy', { item: facts.itemName ?? '' }), text: status === 'purchase-blocked' ? t('history.inventory.purchaseBlocked') : '' }
  if (status === 'food-fine' || status === 'food-nausea' || status === 'food-vomiting') {
    const rows = [...(summary?.costs ?? []), ...(summary?.changes ?? [])]
    const changed = (id: string, kind: string) => rows.some(row => resultChangeId(row) === id && row.kind === kind)
    const text = changed('mood', 'negative') || changed('health', 'negative') ? t('history.inventory.unsettled') : changed('mood', 'positive') ? t('history.inventory.steadier') : ''
    return { title: t(`history.inventory.${status}`), text }
  }
  if (id === 'use-medicine') {
    const title = status === 'medicine-none' || status === 'medicine-treated' || status === 'medicine-taken' ? t(`history.inventory.${status}`) : t('history.inventory.medicineTitle')
    return { title, text: status === 'medicine-none' || status === 'medicine-treated' ? '' : t('history.inventory.medicine') }
  }
  if (id === 'use:water') return { title: t('history.inventory.drinkTitle'), text: t('history.inventory.drink') }
  if (id === 'use:wipes') return { title: t('history.inventory.wipesTitle'), text: t('history.inventory.wipes') }
  if (id.startsWith('use:')) return { title: t('history.inventory.foodTitle'), text: t('history.inventory.food') }
  if (id === 'smoke') return { title: t('history.inventory.smokeTitle'), text: t('history.inventory.smoke') }
  if (id === 'return-containers') return { title: t('history.inventory.containersTitle'), text: t('history.inventory.money') }
  const key = id === 'store-belongings' ? 'store' : id === 'collect-belongings' ? 'collect' : id === 'store-food' ? 'store-food' : 'collect-food'
  return { title: t(`history.inventory.${key}`), text: status === 'storage-blocked' ? t('history.inventory.storageBlocked') : '' }
}
