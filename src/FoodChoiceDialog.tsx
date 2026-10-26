import { ModalAction } from './Modal'
import ChoiceButton from './ChoiceButton'
import InventoryDialog from './InventoryDialog'
import type { FoodCondition } from './foodInventory'
import { t } from './i18n'

export default function FoodChoiceDialog({ name, counts, onCancel, onChoose }: { name: string; counts: Record<FoodCondition, number>; onCancel: () => void; onChoose: (condition: FoodCondition) => void }) {
  return <InventoryDialog icon="food" title={t('foodChoice.title', { name })} description={t('foodChoice.description')} onCancel={onCancel}>
    <div className="food-choice-actions">
      <ModalAction variant="secondary" type="button" className="food-choice-cancel" onClick={onCancel}>{t('common.cancel')}</ModalAction>
      {(['fresh', 'stale', 'spoiled'] as const).filter(condition => counts[condition] > 0).map(condition => {
        const label = t(`foodChoice.${condition}`, { quantity: counts[condition] })
        return <ChoiceButton icon="food" label={label} detail={condition !== 'fresh' && <small id={`food-risk-${condition}`} className="food-choice-risk">{t('foodChoice.risk')}</small>} type="button" className={`food-choice ${condition}`} key={condition} aria-label={label} aria-describedby={condition !== 'fresh' ? `food-risk-${condition} food-risk-effects` : undefined} onClick={() => onChoose(condition)} />
      })}
    </div>
    <p id="food-risk-effects" className="food-risk-effects modal-narrative">{t('foodChoice.effects')}</p>
  </InventoryDialog>
}
