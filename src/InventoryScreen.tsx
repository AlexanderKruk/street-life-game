import InventorySlot from './InventorySlot'
import ItemArt from './ItemArt'
import type { BackpackItemId, Inventory } from './stateTypes'
import { foodSlot, isPerishableFood, type FoodKind } from './foodInventory'
import { BACKPACK_CAPACITY, STACK_SIZE, WIPES_STACK_SIZE, CIGARETTE_STACK_SIZE, BOTTLE_STACK_SIZE, SHOWER_GEL_USES_PER_SLOT, foodFreshnessLabel } from './inventory'

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
  const backpackItems: { art: BackpackItemId; name: string; count: number; stackSize: number; effects: string[]; hint: string; onUse?: () => void; disabled?: boolean }[] = [
    { art: 'water', name: 'Water', count: inventory.water, stackSize: STACK_SIZE, effects: ['Thirst+++'], hint: 'tap to drink', onUse: () => onUseItem('water') },
    { art: 'food', name: 'Food', count: inventory.food, stackSize: STACK_SIZE, effects: inventory.foodFreshness > 50 ? ['Food++', 'Mood+'] : inventory.foodFreshness > 20 ? ['Food++', 'Stale'] : ['Food+', 'Spoiled'], hint: `${foodFreshnessLabel(inventory.foodFreshness)} · tap to eat`, onUse: () => onUseItem('food') },
    { art: 'bread', name: 'Bread roll', count: inventory.bread, stackSize: STACK_SIZE, effects: ['Food+', ...(inventory.breadFreshness <= 50 ? [foodFreshnessLabel(inventory.breadFreshness)] : [])], hint: `${foodFreshnessLabel(inventory.breadFreshness)} · tap to eat`, onUse: () => onUseSupply('bread') },
    { art: 'cannedFood', name: 'Canned food', count: inventory.cannedFood, stackSize: STACK_SIZE, effects: ['Food++', 'Mood+'], hint: 'Keeps well · tap to eat', onUse: () => onUseSupply('cannedFood') },
    { art: 'readyMeal', name: 'Ready meal', count: inventory.readyMeal, stackSize: STACK_SIZE, effects: inventory.readyMealFreshness > 50 ? ['Food+++'] : inventory.readyMealFreshness > 20 ? ['Food++', 'Stale'] : ['Food+', 'Spoiled'], hint: `${foodFreshnessLabel(inventory.readyMealFreshness)} · tap to eat`, onUse: () => onUseSupply('readyMeal') },
    { art: 'wipes', name: 'Wet wipes', count: inventory.wipes, stackSize: WIPES_STACK_SIZE, effects: ['Hygiene+'], hint: hygiene >= 60 ? 'Hygiene 60+ · find a shower' : 'tap to clean', onUse: () => onUseSupply('wipes'), disabled: hygiene >= 60 },
    { art: 'bottles', name: 'Bottles & cans', count: inventory.bottles, stackSize: BOTTLE_STACK_SIZE, effects: ['0.50 zł'], hint: 'Deposit containers · 0.50 zł each · return at shop' },
    { art: 'cigarettes', name: 'Cigarettes', count: inventory.cigarettes, stackSize: CIGARETTE_STACK_SIZE, effects: ['Mood+', 'Health−'], hint: 'tap to smoke', onUse: onSmoke },
    { art: 'medicines', name: 'Medicine', count: inventory.medicines, stackSize: STACK_SIZE, effects: ['Recovery ×3'], hint: 'treats Cold · one dose per illness', onUse: onMedicine },
    { art: 'showerGel', name: '3-in-1 shower gel', count: inventory.showerGel, stackSize: SHOWER_GEL_USES_PER_SLOT, effects: ['Hygiene+++'], hint: 'Uses left · automatic with a shower · Hygiene max 100' },
  ]
  return <section className="inventory-screen" aria-label="Inventory">
      <div className="inventory-section-heading"><strong>Backpack</strong><span>{usedBackpackSlots} / {BACKPACK_CAPACITY} slots</span></div>
      <div className="inventory-grid backpack-grid" role="group" aria-label="Backpack slots">
        {backpackItems.flatMap(item => Array.from({ length: Math.ceil(item.count / item.stackSize) }, (_, index) => {
          const kind = isPerishableFood(item.art) ? item.art : null
          const slot = kind ? foodSlot(inventory, kind, index) : null
          const quantity = slot?.quantity ?? Math.min(item.stackSize, item.count - index * item.stackSize)
          const freshness = slot?.freshness ?? 100
          const effects = !slot ? item.effects : [
            kind === 'bread' ? 'Food+' : kind === 'readyMeal' && freshness > 50 ? 'Food+++' : freshness > 20 ? 'Food++' : 'Food+',
            ...(kind === 'food' && freshness > 50 ? ['Mood+'] : []),
            ...(slot.stale ? [`Stale ×${slot.stale}`] : []),
            ...(slot.spoiled ? [`Spoiled ×${slot.spoiled}`] : []),
          ]
          const hint = slot ? `${foodFreshnessLabel(freshness)}${slot.spoiled && slot.spoiled < quantity ? ` · ${slot.spoiled} spoiled` : ''} · tap to eat` : item.hint
          const onUse = kind ? () => onRequestFood(kind, item.name, index) : item.onUse
          return <InventorySlot key={`${item.art}-${index}`} art={item.art} name={item.name} quantity={quantity} effects={effects} hint={hint} onUse={onUse} disabled={item.disabled} onDiscard={() => onDiscard({ id: item.art, name: item.name, quantity, slotIndex: index, spoiledQuantity: slot?.spoiled })} />
        }))}
      </div>
      {usedBackpackSlots === 0 && <p className="backpack-empty-message">Your backpack is empty.</p>}

      <div className="inventory-section-heading essentials-heading"><strong>Essentials</strong></div>
      <div className="inventory-grid essentials-grid">
        <div className="inventory-item">
          <ItemArt id="phone" condition={inventory.phoneCondition} /><div><strong>Phone</strong><small>Battery {Math.round(inventory.phoneBattery)}%{shelterPhoneCharging ? ' · Charging' : ''}<br />Condition {Math.round(inventory.phoneCondition)}%</small></div>
        </div>
        <div className="inventory-item">
          <ItemArt id="clothing" /><div><strong>Clothing</strong><small>Clean {Math.round(inventory.clothingCleanliness)}%<br />Condition {Math.round(inventory.jacket)}%</small></div>
        </div>
        <div className="inventory-item">
          <ItemArt id="documents" /><div><strong>Documents</strong><small>{inventory.documents ? 'With you' : 'Missing'}</small></div>
        </div>
        <div className="inventory-item">
          <ItemArt id="transitCard" /><div><strong>Transit card</strong><small>{inventory.transitCard ? 'Active' : 'Missing'}</small></div>
        </div>
      </div>
    </section>
}
