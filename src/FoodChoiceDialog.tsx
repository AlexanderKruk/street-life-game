import InventoryDialog from './InventoryDialog'
import type { FoodCondition } from './foodInventory'

export default function FoodChoiceDialog({ name, counts, onCancel, onChoose }: { name: string; counts: Record<FoodCondition, number>; onCancel: () => void; onChoose: (condition: FoodCondition) => void }) {
  return <InventoryDialog icon="food" title={`Eat ${name}?`} description="Choose one portion from this slot. Only the freshness groups present here are available." onCancel={onCancel}>
    <div className="food-choice-actions">
      <button type="button" className="food-choice-cancel" onClick={onCancel}>Cancel</button>
      {(['fresh', 'stale', 'spoiled'] as const).filter(condition => counts[condition] > 0).map(condition => <button type="button" className={`food-choice ${condition}`} key={condition} onClick={() => onChoose(condition)}>{condition === 'fresh' ? 'Fresh' : condition === 'stale' ? 'Stale' : 'Spoiled'} ×{counts[condition]}</button>)}
    </div>
  </InventoryDialog>
}
