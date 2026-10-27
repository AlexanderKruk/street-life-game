import { sleepKindLabel } from './sleepText'
import { formatNumber } from './i18n/formatters'
import { t } from './i18n'
import { Icon } from './Icon'
import { ModalAction, ModalOverlay, ModalPanel } from './Modal'

type SleepKind = 'ground' | 'bench' | 'shelter' | 'residential'
type SleepOption = { hours: number; unavailableReason: string | null }
type Props = {
  kind: SleepKind
  energy: number
  options: SleepOption[]
  selectedHours: number
  wetClothesWarning: boolean
  onSelect: (hours: number) => void
  onCancel: () => void
  onConfirm: () => void
}

// The owner calculates fatigue limits and the shelter checkout cap.
// This view selects an option and delegates confirmation without advancing time.
export default function SleepPlanningDialog({ kind, energy, options, selectedHours, wetClothesWarning, onSelect, onCancel, onConfirm }: Props) {
  const selected = options.find(option => option.hours === selectedHours)!
  return <ModalOverlay className="phone-overlay result-overlay">
    <ModalPanel size="compact" className="phone-modal sleep-choice-modal" role="dialog" aria-modal="true" aria-labelledby="sleep-choice-title">
      <div className="timed-heading"><Icon name="moon" /><h2 id="sleep-choice-title">{t('sleep.plan.title')}</h2></div>
      <div className="sleep-duration-options" role="group" aria-label={t('sleep.plan.durationAccessible')}>
        {options.map(({ hours, unavailableReason: reason }) => <button type="button" key={hours}
          className={hours === selectedHours ? 'sleep-duration-option selected' : 'sleep-duration-option'}
          aria-label={reason !== null ? t('sleep.plan.durationUnavailable', { hours, reason }) : t('sleep.plan.durationOption', { hours })}
          aria-pressed={hours === selectedHours} disabled={reason !== null} title={reason ?? undefined}
          autoFocus={hours === selectedHours} onClick={() => onSelect(hours)}>
          {t('choice.duration.exactHours', { hours })}{reason !== null && <span className="sr-only">{reason}</span>}
        </button>)}
      </div>
      <div className="sleep-choice-context"><span>{sleepKindLabel(kind)}</span><span className="sleep-choice-energy"><Icon name="energy" /><span>{t('stat.energy')} <strong>{t('format.percent', { amount: formatNumber(Math.round(energy)) })}</strong></span></span></div>
      {wetClothesWarning && <p className="sleep-choice-note">{t('sleep.plan.wetNote')}</p>}
      {kind === 'shelter' && <p className="sleep-choice-note">{t('sleep.plan.checkout')}</p>}
      <div className="sleep-choice-buttons">
        <ModalAction variant="secondary" onClick={onCancel}>{t('common.cancel')}</ModalAction>
        <ModalAction className="trash-stop" disabled={selected.unavailableReason !== null} onClick={onConfirm}>{t('sleep.plan.choice')}</ModalAction>
      </div>
    </ModalPanel>
  </ModalOverlay>
}
