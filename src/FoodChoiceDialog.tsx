import { ModalAction } from './Modal'
import ChoiceButton from './ChoiceButton'
import InventoryDialog from './InventoryDialog'
import type { FoodCondition } from './foodInventory'

export default function FoodChoiceDialog({ name, counts, onCancel, onChoose }: { name: string; counts: Record<FoodCondition, number>; onCancel: () => void; onChoose: (condition: FoodCondition) => void }) {
  return <InventoryDialog icon="food" title={`Eat ${name}?`} description="Choose one portion from this slot. Only the freshness groups present here are available." onCancel={onCancel}>
    <div className="food-choice-actions">
      <ModalAction variant="secondary" type="button" className="food-choice-cancel" onClick={onCancel}>Cancel</ModalAction>
      {(['fresh', 'stale', 'spoiled'] as const).filter(condition => counts[condition] > 0).map(condition => {
        const label = `${condition === 'fresh' ? 'Fresh' : condition === 'stale' ? 'Stale' : 'Spoiled'} ×${counts[condition]}`
        return <ChoiceButton icon="food" label={label} detail={condition !== 'fresh' && <small id={`food-risk-${condition}`} className="food-choice-risk">Food poisoning risk</small>} type="button" className={`food-choice ${condition}`} key={condition} aria-label={label} aria-describedby={condition !== 'fresh' ? `food-risk-${condition} food-risk-effects` : undefined} onClick={() => onChoose(condition)} />
      })}
    </div>
    <p id="food-risk-effects" className="food-risk-effects">Food poisoning may cause nausea (Mood −3) or vomiting (Food −10, Water −20, Energy −5–10, Health −5). If you vomit, this portion gives no Food.</p>
  </InventoryDialog>
}
