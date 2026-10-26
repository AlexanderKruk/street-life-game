import { t } from './i18n'
import { formatNumber } from './i18n/formatters'
import { itemName, backpackItemName } from './itemPresentation'
import { impactChip, foodEffectChips, type EffectChip } from './effectChips'
import InventorySlot from './InventorySlot'
import ItemArt from './ItemArt'
import type { BackpackItemId, Inventory } from './stateTypes'
import { foodSlot, isPerishableFood, type FoodKind } from './foodInventory'
import { BACKPACK_CAPACITY, BOTTLE_DEPOSIT, STACK_SIZE, WIPES_STACK_SIZE, CIGARETTE_STACK_SIZE, BOTTLE_STACK_SIZE, SHOWER_GEL_USES_PER_SLOT, foodFreshnessLabel } from './inventory'

type DiscardRequest = { id: BackpackItemId; name: string; quantity: number; slotIndex: number; spoiledQuantity?: number }
type Props = {
  inventory: Inventory; hygiene: number; usedBackpackSlots: number; shelterPhoneCharging: boolean
  onUseItem: (item: 'water' | 'food') => void
  onUseSupply: (item: 'bread' | 'cannedFood' | 'readyMeal' | 'wipes') => void
  onSmoke: () => void; onMedicine: () => void
  onRequestFood: (kind: FoodKind, name: string, index: number) => void
  onDiscard: (request: DiscardRequest) => void
}

export default function InventoryScreen({ inventory, hygiene, usedBackpackSlots, shelterPhoneCharging, onUseItem, onUseSupply, onSmoke, onMedicine, onRequestFood, onDiscard }: Props) {
  const backpackItems: { art: BackpackItemId; name: string; count: number; stackSize: number; effects: EffectChip[]; hint: string; onUse?: () => void; disabled?: boolean }[] = [
    { art: 'water', name: backpackItemName('water'), count: inventory.water, stackSize: STACK_SIZE, effects: [impactChip('thirst-large')], hint: t('inventory.hint.water'), onUse: () => onUseItem('water') },
    { art: 'food', name: backpackItemName('food'), count: inventory.food, stackSize: STACK_SIZE, effects: [], hint: '', onUse: () => onUseItem('food') },
    { art: 'bread', name: backpackItemName('bread'), count: inventory.bread, stackSize: STACK_SIZE, effects: [], hint: '', onUse: () => onUseSupply('bread') },
    { art: 'cannedFood', name: backpackItemName('cannedFood'), count: inventory.cannedFood, stackSize: STACK_SIZE, effects: [impactChip('food-medium'), impactChip('mood-gain')], hint: t('inventory.hint.cannedFood'), onUse: () => onUseSupply('cannedFood') },
    { art: 'readyMeal', name: backpackItemName('readyMeal'), count: inventory.readyMeal, stackSize: STACK_SIZE, effects: [], hint: '', onUse: () => onUseSupply('readyMeal') },
    { art: 'wipes', name: backpackItemName('wipes'), count: inventory.wipes, stackSize: WIPES_STACK_SIZE, effects: [impactChip('hygiene-small')], hint: hygiene >= 60 ? t('inventory.hint.wipesLimited') : t('inventory.hint.wipes'), onUse: () => onUseSupply('wipes'), disabled: hygiene >= 60 },
    { art: 'bottles', name: backpackItemName('bottles'), count: inventory.bottles, stackSize: BOTTLE_STACK_SIZE, effects: [impactChip('deposit-value')], hint: t('inventory.hint.bottles', { deposit: formatNumber(BOTTLE_DEPOSIT, 2, 2) }) },
    { art: 'cigarettes', name: backpackItemName('cigarettes'), count: inventory.cigarettes, stackSize: CIGARETTE_STACK_SIZE, effects: [impactChip('mood-gain'), impactChip('health-loss')], hint: t('inventory.hint.cigarettes'), onUse: onSmoke },
    { art: 'medicines', name: backpackItemName('medicines'), count: inventory.medicines, stackSize: STACK_SIZE, effects: [impactChip('recovery-fast')], hint: t('inventory.hint.medicines'), onUse: onMedicine },
    { art: 'showerGel', name: backpackItemName('showerGel'), count: inventory.showerGel, stackSize: SHOWER_GEL_USES_PER_SLOT, effects: [impactChip('hygiene-large')], hint: t('inventory.hint.showerGel') },
  ]
  return <section className="inventory-screen" aria-label={t('inventory.label')}>
      <div className="inventory-section-heading"><strong>{t('inventory.backpack')}</strong><span>{t('inventory.capacity', { used: usedBackpackSlots, capacity: BACKPACK_CAPACITY })}</span></div>
      <div className="inventory-grid backpack-grid" role="group" aria-label={t('inventory.slotsLabel')}>
        {backpackItems.flatMap(item => Array.from({ length: Math.ceil(item.count / item.stackSize) }, (_, index) => {
          const kind = isPerishableFood(item.art) ? item.art : null
          const slot = kind ? foodSlot(inventory, kind, index) : null
          const quantity = slot?.quantity ?? Math.min(item.stackSize, item.count - index * item.stackSize)
          const freshness = slot?.freshness ?? 100
          const effects = slot && kind ? foodEffectChips(kind, slot) : item.effects
          const hint = slot ? (slot.spoiled && slot.spoiled < quantity ? t('inventory.hint.foodMixed', { freshness: foodFreshnessLabel(freshness), spoiled: slot.spoiled }) : t('inventory.hint.food', { freshness: foodFreshnessLabel(freshness) })) : item.hint
          const onUse = kind ? () => onRequestFood(kind, item.name, index) : item.onUse
          return <InventorySlot key={`${item.art}-${index}`} art={item.art} name={item.name} quantity={quantity} effects={effects} hint={hint} onUse={onUse} disabled={item.disabled} onDiscard={() => onDiscard({ id: item.art, name: item.name, quantity, slotIndex: index, spoiledQuantity: slot?.spoiled })} />
        }))}
      </div>
      {usedBackpackSlots === 0 && <p className="backpack-empty-message">{t('inventory.empty')}</p>}

      <div className="inventory-section-heading essentials-heading"><strong>{t('inventory.essentials')}</strong></div>
      <div className="inventory-grid essentials-grid">
        <div className="inventory-item">
          <ItemArt id="phone" condition={inventory.phoneCondition} /><div><strong>{itemName('phone')}</strong><small>{t(shelterPhoneCharging ? 'inventory.phone.charging' : 'inventory.phone.battery', { percent: Math.round(inventory.phoneBattery) })}<br />{t('inventory.condition', { percent: Math.round(inventory.phoneCondition) })}</small></div>
        </div>
        <div className="inventory-item">
          <ItemArt id="clothing" /><div><strong>{itemName('clothing')}</strong><small>{t('inventory.clothing.clean', { percent: Math.round(inventory.clothingCleanliness) })}<br />{t('inventory.condition', { percent: Math.round(inventory.jacket) })}</small></div>
        </div>
        <div className="inventory-item">
          <ItemArt id="documents" /><div><strong>{itemName('documents')}</strong><small>{t(inventory.documents ? 'inventory.documents.carried' : 'inventory.documents.missing')}</small></div>
        </div>
        <div className="inventory-item">
          <ItemArt id="transitCard" /><div><strong>{itemName('transitCard')}</strong><small>{t(inventory.transitCard ? 'inventory.transit.active' : 'inventory.transit.missing')}</small></div>
        </div>
      </div>
    </section>
}
