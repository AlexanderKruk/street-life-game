// Frozen 1f39ed9 shelter copy and behaviour for localisation parity.
import { Icon } from '../src/Icon'
import { ModalOverlay, ModalPanel } from '../src/Modal'
import { formatTime } from '../src/game'
import { SHELTER_ENTRY_OPEN, SHELTER_REGISTRATION_OPEN, SHELTER_QUEUE_MINUTES } from '../src/shelterRules'
import type { ShelterQueue } from '../src/stateTypes'
export default function ShelterQueueDialog({ shelterQueue, minute }: { shelterQueue: ShelterQueue; minute: number }) {
  return <ModalOverlay className="sleep-overlay queue-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Shelter registration queue">
      <ModalPanel size="compact" className="sleep-card timed-card rest-card">
        <div className="timed-heading"><Icon name="clock" /><div><p className="eyebrow">NIGHT SHELTER</p><h2>Registration queue</h2></div></div>
        <p className="timed-description modal-narrative">{minute < SHELTER_ENTRY_OPEN ? 'Waiting outside. Doors open at 18:00.' : minute < SHELTER_REGISTRATION_OPEN ? 'Waiting inside. Registration starts at 18:20.' : 'Waiting for your turn. A bed isn’t guaranteed.'}</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>{shelterQueue.remaining} min remaining</span></div>
        <div className="sleep-progress" role="progressbar" aria-label="Registration queue progress" aria-valuemin={0} aria-valuemax={shelterQueue.total ?? SHELTER_QUEUE_MINUTES} aria-valuenow={(shelterQueue.total ?? SHELTER_QUEUE_MINUTES) - shelterQueue.remaining}><i style={{ width: `${(1 - shelterQueue.remaining / (shelterQueue.total ?? SHELTER_QUEUE_MINUTES)) * 100}%` }} /></div>
        <p className="timed-footnote">Arrived at {formatTime(shelterQueue.arrivalMinute ?? shelterQueue.joinedAt)} · {shelterQueue.peopleAhead} ahead of you. Today’s availability: 0–3 places.</p>
      </ModalPanel>
    </ModalOverlay>
}
