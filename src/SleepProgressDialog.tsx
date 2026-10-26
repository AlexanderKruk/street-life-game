import { t } from './i18n'
import { ModalOverlay, ModalPanel } from './Modal'
import { SleepHeading } from './LocationPresentation'
import { formatTime } from './game'
import { formatSleepDuration } from './sleepText'
import { DEBUG_SLEEP_SPEED, sleepElapsed } from './sleepRules'
import type { SleepState } from './stateTypes'
export default function SleepProgressDialog({ sleeping, minute, onWake }: { sleeping: SleepState; minute: number; onWake: () => void }) {
  return <ModalOverlay className="sleep-overlay timed-overlay" role="dialog" aria-modal="true" aria-label={t('sleep.progress.accessible')}>
      <ModalPanel size="compact" className="sleep-card timed-card rest-card">
        <SleepHeading kind={sleeping.kind} />
        <p className="timed-description modal-narrative">{t(`sleep.progress.${sleeping.kind}`)}</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>{t('sleep.progress.wakeAt', { time: formatTime((sleeping.startAbsolute + sleeping.total) % 1440) })}</span></div>
        {(() => {
          const elapsed = sleepElapsed(sleeping)
          return <>
            <div className="sleep-progress" role="progressbar" aria-label={t('sleep.progress.accessibleProgress')} aria-valuemin={0} aria-valuemax={sleeping.total} aria-valuenow={elapsed}><i style={{ width: `${(elapsed / sleeping.total) * 100}%` }} /></div>
            <div className="timed-progress-detail"><span>{t('sleep.progress.elapsed', { hours: Math.floor(elapsed / 60), minutes: elapsed % 60, duration: formatSleepDuration(sleeping.total) })}</span><span>{t('sleep.progress.speed', { speed: DEBUG_SLEEP_SPEED })}</span></div>
          </>
        })()}
        <p className="timed-footnote">{t(sleeping.kind === 'shelter' ? 'sleep.progress.checkout' : 'sleep.progress.blocked')}</p>
        <button className="sleep-debug-wake" onClick={onWake}>{t('sleep.progress.debugWake')}</button>
      </ModalPanel>
    </ModalOverlay>
}
