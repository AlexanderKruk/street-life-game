import { t } from './i18n'
import { Icon } from './Icon'
import { ModalOverlay, ModalPanel } from './Modal'
import { formatTime } from './game'
import { SHELTER_ENTRY_OPEN, SHELTER_REGISTRATION_OPEN, SHELTER_QUEUE_MINUTES } from './shelterRules'
import type { ShelterQueue } from './stateTypes'
export default function ShelterQueueDialog({ shelterQueue, minute }: { shelterQueue: ShelterQueue; minute: number }) {
  return <ModalOverlay className="sleep-overlay queue-overlay timed-overlay" role="dialog" aria-modal="true" aria-label={t("shelter.queue.accessible")}>
      <ModalPanel size="compact" className="sleep-card timed-card rest-card">
        <div className="timed-heading"><Icon name="clock" /><div><p className="eyebrow">{t("shelter.queue.label")}</p><h2>{t("shelter.queue.title")}</h2></div></div>
        <p className="timed-description modal-narrative">{minute < SHELTER_ENTRY_OPEN ? t("shelter.queue.outside") : minute < SHELTER_REGISTRATION_OPEN ? t("shelter.queue.inside") : t("shelter.queue.turn")}</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>{t('shelter.remaining', { minutes: shelterQueue.remaining })}</span></div>
        <div className="sleep-progress" role="progressbar" aria-label={t("shelter.queue.progress")} aria-valuemin={0} aria-valuemax={shelterQueue.total ?? SHELTER_QUEUE_MINUTES} aria-valuenow={(shelterQueue.total ?? SHELTER_QUEUE_MINUTES) - shelterQueue.remaining}><i style={{ width: `${(1 - shelterQueue.remaining / (shelterQueue.total ?? SHELTER_QUEUE_MINUTES)) * 100}%` }} /></div>
        <p className="timed-footnote">{t('shelter.queue.arrival', { time: formatTime(shelterQueue.arrivalMinute ?? shelterQueue.joinedAt), people: shelterQueue.peopleAhead })}</p>
      </ModalPanel>
    </ModalOverlay>
}
