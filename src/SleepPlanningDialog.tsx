import ChoiceButton from './ChoiceButton'
import { t } from './i18n'
import { Icon } from './Icon'
import { ModalAction, ModalOverlay, ModalPanel } from './Modal'

type SleepKind = 'ground' | 'bench' | 'shelter' | 'residential'
type SleepOption = { hours: number; wakeLabel: string; unavailableReason: string | null }
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
      <div className="timed-heading"><Icon name="moon" /><div><p className="eyebrow">PLAN YOUR SLEEP · TIME PAUSED</p><h2 id="sleep-choice-title">How long do you want to sleep?</h2></div></div>
      <div className="sleep-choice-context"><span>{kind === 'ground' ? 'On the ground' : kind === 'bench' ? 'On the bench' : kind === 'shelter' ? 'Night shelter' : 'Schronisko'}</span><span>{dateLabel}</span></div>
      <p className="sleep-choice-energy"><Icon name="energy" />Energy {Math.round(energy)}% · {energy > 75 ? 'Rested' : energy > 50 ? 'Slightly tired' : energy > 25 ? 'Tired' : 'Exhausted'}</p>
      <div className="sleep-duration-options" role="group" aria-label="Sleep duration">
        {options.map(({ hours, wakeLabel, unavailableReason: reason }) => <ChoiceButton icon="bed" label="Sleep" duration={t('choice.duration.exactHours', { hours })} aria-label={`${hours} h · Wake ${wakeLabel}${reason ? ` · ${reason}` : ''}`} detail={<span className="sr-only"> · Wake {wakeLabel}{reason && ` · ${reason}`}</span>} key={hours} className={hours === selectedHours ? 'sleep-duration-option selected' : 'sleep-duration-option'} aria-pressed={hours === selectedHours} disabled={reason !== null} title={reason ?? undefined} autoFocus={hours === selectedHours} onClick={() => onSelect(hours)} />)}
      </div>
      {options.some(option => option.unavailableReason) && <p className="sleep-choice-note">Available sleep lengths depend on your fatigue.</p>}
      {wetClothesWarning && <p className="sleep-choice-note">Wet clothes reduce outdoor sleep recovery. Somewhere dry would help.</p>}
      <div className="sleep-choice-preview" aria-live="polite">
        <small>Wake up · {selected.wakeLabel.split(' · ')[0]}</small><span className="sr-only"> · </span><strong>{selected.wakeLabel.split(' · ')[1]}</strong>
      </div>
      <p className="sleep-choice-note">Sleep time: {durationLabel}.</p>
      {(kind === 'ground' || kind === 'bench') && <p className="sleep-choice-note">Cold and {wetnessEnabled ? 'wet clothes and ' : ''}longer exposure increase illness risk. Your belongings may also be stolen.</p>}
      {kind === 'shelter' && <p className="sleep-choice-note">Sleep ends by 07:30 for morning checkout. Longer choices are shortened.</p>}
      <div className="sleep-choice-buttons">
        <ModalAction variant="secondary" onClick={onCancel}>Cancel</ModalAction>
        <ModalAction className="trash-stop" disabled={selected.unavailableReason !== null} onClick={onConfirm}>Start sleeping</ModalAction>
      </div>
    </ModalPanel>
  </ModalOverlay>
}
