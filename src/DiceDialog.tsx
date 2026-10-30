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
  onRoll: () => void
  onAccept: () => void
  onCancel: () => void
}
export function DiceContents({ diceCheck, onRoll, onAccept, onCancel }: Props) {
  if (!diceCheck.choice.check) return null
  return <>
        <h2 id="dice-action-title">{diceCheck.stealItemId ? t(stealTitleKeys[diceCheck.stealItemId]) : diceCheck.choice.label}</h2>
        <p className="eyebrow">{checkHeading(diceCheck.choice.check.stat)}</p>
        <div className={diceCheck.roll === null ? 'd20 rolling-ready' : diceCheck.roll === 20 ? 'd20 critical' : diceCheck.roll === 1 ? 'd20 critical-fail' : 'd20'} aria-label={diceCheck.roll === null ? 'D20' : t('dice.rolled', { roll: diceCheck.roll })}><Icon name="dice" />{diceCheck.roll !== null && <span>{diceCheck.roll}</span>}</div>
        <div className="dice-math" aria-label={t('dice.math.accessible', { stat: t(diceCheck.choice.check.stat === 'persuasion' ? 'dice.math.persuasion' : 'dice.math.energy'), modifier: diceCheck.modifier, target: diceCheck.choice.check.dc })}>{diceCheck.roll === null ? t('dice.math.ready', { sign: diceCheck.modifier >= 0 ? '+' : '−', modifier: Math.abs(diceCheck.modifier), target: diceCheck.choice.check.dc }) : t('dice.math.rolled', { roll: diceCheck.roll, sign: diceCheck.modifier >= 0 ? '+' : '−', modifier: Math.abs(diceCheck.modifier), total: diceCheck.roll + diceCheck.modifier })}</div>
        {diceCheck.roll === null
          ? <div className="dice-actions"><ModalAction className="dice-attempt" onClick={onRoll}>{t('dice.attempt')}</ModalAction>{!diceCheck.fareDodgeInTransit && <ModalAction variant="secondary" className="dice-cancel" onClick={onCancel}>{t('common.cancel')}</ModalAction>}</div>
          : <><strong className="dice-result">{diceCheck.roll === 20 ? t('dice.result.criticalSuccess') : diceCheck.roll === 1 ? t('dice.result.criticalFailure') : diceCheck.roll + diceCheck.modifier >= diceCheck.choice.check.dc ? t('dice.result.success') : t('dice.result.failure')}</strong><ModalAction onClick={onAccept}>{t('dice.continue')}</ModalAction></>}
    </>
}
export default function DiceDialog(props: Props) {
  return <ModalOverlay className="dice-overlay" role="dialog" aria-modal="true" aria-labelledby="dice-action-title">
    <ModalPanel size="compact" className="dice-card"><DiceContents {...props} /></ModalPanel>
  </ModalOverlay>
}
