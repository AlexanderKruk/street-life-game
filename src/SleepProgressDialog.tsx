import { ModalOverlay, ModalPanel } from './Modal'
import { SleepHeading } from './LocationPresentation'
import { formatTime } from './game'
import { formatTravelTime } from './gameTime'
import { DEBUG_SLEEP_SPEED, sleepElapsed } from './sleepRules'
import type { SleepState } from './stateTypes'
export default function SleepProgressDialog({ sleeping, minute, onWake }: { sleeping: SleepState; minute: number; onWake: () => void }) {
  return <ModalOverlay className="sleep-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Sleeping">
      <ModalPanel size="compact" className="sleep-card timed-card rest-card">
        <SleepHeading kind={sleeping.kind} />
        <p className="timed-description modal-narrative">{sleeping.kind === 'shelter' ? 'Resting in your reserved bed.' : sleeping.kind === 'residential' ? 'Resting in your room.' : sleeping.kind === 'bench' ? 'Resting on a bench, still exposed.' : 'Resting on the ground, out in the open.'}</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>Wake at {formatTime((sleeping.startAbsolute + sleeping.total) % 1440)}</span></div>
        {(() => {
          const elapsed = sleepElapsed(sleeping)
          return <>
            <div className="sleep-progress" role="progressbar" aria-label="Sleep progress" aria-valuemin={0} aria-valuemax={sleeping.total} aria-valuenow={elapsed}><i style={{ width: `${(elapsed / sleeping.total) * 100}%` }} /></div>
            <div className="timed-progress-detail"><span>{Math.floor(elapsed / 60)}h {elapsed % 60}m of {formatTravelTime(sleeping.total)}</span><span>×{DEBUG_SLEEP_SPEED}</span></div>
          </>
        })()}
        <p className="timed-footnote">{sleeping.kind === 'shelter' ? 'Sleep ends by 07:30 for morning checkout.' : 'You cannot perform other actions until you wake up.'}</p>
        <button className="sleep-debug-wake" onClick={onWake}>Wake up (debug)</button>
      </ModalPanel>
    </ModalOverlay>
}
