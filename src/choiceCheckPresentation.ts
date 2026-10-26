import { t } from './i18n'
import type { StreetEventChoice, DiceCheck } from './events'

const statKeys = { reflex: 'check.stat.reflex', persuasion: 'check.stat.persuasion' } as const
const headingKeys = { reflex: 'check.heading.reflex', persuasion: 'check.heading.persuasion' } as const
export function checkStatName(stat: DiceCheck['stat']) { return t(statKeys[stat]) }
export function checkHeading(stat: DiceCheck['stat']) { return t(headingKeys[stat]) }
export function choiceAccessibleLabel(choice: Pick<StreetEventChoice, 'label' | 'check'>) {
  return choice.check ? t('check.accessibleChoice', { label: choice.label, stat: checkStatName(choice.check.stat), dc: choice.check.dc }) : choice.label
}
export function choiceCheckDetail(check: DiceCheck) {
  return t('check.detail', { stat: checkStatName(check.stat), dc: check.dc })
}
