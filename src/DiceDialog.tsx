import { t } from './i18n'
import { checkHeading } from './choiceCheckPresentation'
import { Icon } from './Icon'
import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import type { EventDiceState } from './stateTypes'
const stealTitleKeys = {
  water: 'dice.steal.water', food: 'dice.steal.food', bread: 'dice.steal.bread',
  cannedFood: 'dice.steal.cannedFood', readyMeal: 'dice.steal.readyMeal', wipes: 'dice.steal.wipes',
  showerGel: 'dice.steal.showerGel', cigarettes: 'dice.steal.cigarettes', medicines: 'dice.steal.medicines',
} as const

type Props = {
  diceCheck: EventDiceState
  eventText?: string
  onRoll: () => void
  onAccept: () => void
  onCancel: () => void
}
export default function DiceDialog({ diceCheck, eventText, onRoll, onAccept, onCancel }: Props) {
  if (!diceCheck.choice.check) return null
  return <ModalOverlay className="dice-overlay" role="dialog" aria-modal="true" aria-labelledby="dice-action-title">
      <ModalPanel size="compact" className="dice-card">
        <h2 id="dice-action-title">{diceCheck.stealItemId ? t(stealTitleKeys[diceCheck.stealItemId]) : diceCheck.choice.label}</h2>
        <p className="dice-description modal-narrative">{diceCheck.stealItemId ? 'Try to take it without being noticed. If you’re caught, you’ll be thrown out without the item.' : diceCheck.fareDodgeDestinationId ? 'Try to ride without a ticket. If an inspector catches you, you’ll have to pay a penalty.' : eventText}</p>
        <p className="eyebrow">{checkHeading(diceCheck.choice.check.stat)}</p>
        <div className={diceCheck.roll === null ? 'd20 rolling-ready' : diceCheck.roll === 20 ? 'd20 critical' : diceCheck.roll === 1 ? 'd20 critical-fail' : 'd20'} aria-label={diceCheck.roll === null ? 'D20' : `Rolled ${diceCheck.roll}`}><Icon name="dice" />{diceCheck.roll !== null && <span>{diceCheck.roll}</span>}</div>
        <div className="dice-math" aria-label={`${diceCheck.choice.check.stat === 'persuasion' ? 'Hygiene and Mood' : 'Energy'} modifier ${diceCheck.modifier}; target ${diceCheck.choice.check.dc}`}>{diceCheck.roll === null ? `D20 ${diceCheck.modifier >= 0 ? '+' : '−'} ${Math.abs(diceCheck.modifier)} ≥ ${diceCheck.choice.check.dc}` : `${diceCheck.roll} ${diceCheck.modifier >= 0 ? '+' : '−'} ${Math.abs(diceCheck.modifier)} = ${diceCheck.roll + diceCheck.modifier}`}</div>
        {diceCheck.roll === null
          ? <div className="dice-actions"><ModalAction className="dice-attempt" onClick={onRoll}>{diceCheck.stealItemId ? 'Try to steal' : diceCheck.choice.label}</ModalAction><ModalAction variant="secondary" className="dice-cancel" onClick={onCancel}>Cancel</ModalAction></div>
          : <><strong className="dice-result">{diceCheck.roll === 20 ? 'CRITICAL SUCCESS' : diceCheck.roll === 1 ? 'CRITICAL FAILURE' : diceCheck.roll + diceCheck.modifier >= diceCheck.choice.check.dc ? 'SUCCESS' : 'FAILURE'}</strong><ModalAction onClick={onAccept}>Continue</ModalAction></>}
      </ModalPanel>
    </ModalOverlay>
}
