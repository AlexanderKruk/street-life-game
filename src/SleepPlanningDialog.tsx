import { sleepDateLabel, sleepDayLabel, sleepKindLabel } from './sleepText'
import { formatTime } from './game'
import { formatNumber } from './i18n/formatters'
import ChoiceButton from './ChoiceButton'
import { t } from './i18n'
import { Icon } from './Icon'
import { ModalAction, ModalOverlay, ModalPanel } from './Modal'

type SleepKind = 'ground' | 'bench' | 'shelter' | 'residential'
type SleepOption = { hours: number; wake: { day: number; minutes: number }; unavailableReason: string | null }
type Props = {
  kind: SleepKind
  dateLabel: string
  energy: number
  options: SleepOption[]
  selectedHours: number
  durationLabel: string
  wetClothesWarning: boolean
  wetnessEnabled: boolean
  onSelect: (hours: number) => void
  onCancel: () => void
  onConfirm: () => void
}

// The owner calculates fatigue limits, wake times and the shelter checkout cap.
// This view selects an option and delegates confirmation without advancing time.
export default function SleepPlanningDialog({ kind, dateLabel, energy, options, selectedHours, durationLabel, wetClothesWarning, wetnessEnabled, onSelect, onCancel, onConfirm }: Props) {
  const selected = options.find(option => option.hours === selectedHours)!
  return <ModalOverlay className="phone-overlay result-overlay">
    <ModalPanel size="compact" className="phone-modal sleep-choice-modal" role="dialog" aria-modal="true" aria-labelledby="sleep-choice-title">
      <div className="timed-heading"><Icon name="moon" /><div><p className="eyebrow">{t('sleep.plan.label')}</p><h2 id="sleep-choice-title">{t('sleep.plan.title')}</h2></div></div>
      <div className="sleep-choice-context"><span>{sleepKindLabel(kind)}</span><span>{dateLabel}</span></div>
      <p className="sleep-choice-energy"><Icon name="energy" />{t('sleep.plan.energy', { energy: formatNumber(Math.round(energy)), fatigue: t(energy > 75 ? 'sleep.fatigue.rested' : energy > 50 ? 'sleep.fatigue.slightlyTired' : energy > 25 ? 'sleep.fatigue.tired' : 'sleep.fatigue.exhausted') })}</p>
      <div className="sleep-duration-options" role="group" aria-label={t('sleep.plan.durationAccessible')}>
        {options.map(({ hours, wake, unavailableReason: reason }) => {
          const wakeLabel = sleepDateLabel(wake.day, wake.minutes)
          return <ChoiceButton icon="bed" label={t('sleep.plan.choice')} duration={t('choice.duration.exactHours', { hours })} aria-label={reason !== null ? t('sleep.plan.optionUnavailable', { hours, wake: wakeLabel, reason }) : t('sleep.plan.option', { hours, wake: wakeLabel })} detail={<span className="sr-only">{reason !== null ? t('sleep.plan.optionDetailUnavailable', { wake: wakeLabel, reason }) : t('sleep.plan.optionDetail', { wake: wakeLabel })}</span>} key={hours} className={hours === selectedHours ? 'sleep-duration-option selected' : 'sleep-duration-option'} aria-pressed={hours === selectedHours} disabled={reason !== null} title={reason ?? undefined} autoFocus={hours === selectedHours} onClick={() => onSelect(hours)} />
        })}
      </div>
      {options.some(option => option.unavailableReason !== null) && <p className="sleep-choice-note">{t('sleep.plan.fatigueNote')}</p>}
      {wetClothesWarning && <p className="sleep-choice-note">{t('sleep.plan.wetNote')}</p>}
      <div className="sleep-choice-preview" aria-live="polite">
        <small>{t('sleep.plan.wakeDate', { date: sleepDayLabel(selected.wake.day) })}</small><span className="sr-only"> · </span><strong>{formatTime(selected.wake.minutes)}</strong>
      </div>
      <p className="sleep-choice-note">{t('sleep.plan.duration', { duration: durationLabel })}</p>
      {(kind === 'ground' || kind === 'bench') && <p className="sleep-choice-note">{t(wetnessEnabled ? 'sleep.plan.riskWet' : 'sleep.plan.risk')}</p>}
      {kind === 'shelter' && <p className="sleep-choice-note">{t('sleep.plan.checkout')}</p>}
      <div className="sleep-choice-buttons">
        <ModalAction variant="secondary" onClick={onCancel}>{t('common.cancel')}</ModalAction>
        <ModalAction className="trash-stop" disabled={selected.unavailableReason !== null} onClick={onConfirm}>{t('sleep.start.title')}</ModalAction>
      </div>
    </ModalPanel>
  </ModalOverlay>
}
