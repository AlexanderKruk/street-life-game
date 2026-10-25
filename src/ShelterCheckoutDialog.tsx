import { Icon } from './Icon'
import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import { formatTime } from './game'
import { SHELTER_DEPARTURE_MINUTES } from './shelterRules'
import type { ShelterDeparture } from './stateTypes'
export function ShelterCheckoutWarning({ minute, onStart }: { minute: number; onStart: () => void }) {
  return <ModalOverlay className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Leave the night shelter" onKeyDown={event => {
      if (event.key === 'Tab') {
        event.preventDefault()
        event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }}>
      <ModalPanel size="compact" className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">MORNING CHECKOUT</p><h2>Time to leave the night shelter</h2></div></div>
        <p className="timed-description modal-narrative">You must leave by 08:00. Packing and leaving takes 30 minutes.</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>On the street at {formatTime((minute + SHELTER_DEPARTURE_MINUTES) % 1440)}</span></div>
        <ModalAction className="checkout-start" autoFocus onClick={onStart}>Leave the night shelter · 30 min</ModalAction>
      </ModalPanel>
    </ModalOverlay>
}
export function ShelterDepartureDialog({ minute, shelterDeparture, shelterDepartureRemaining, shelterPhoneCharging }: { minute: number; shelterDeparture: ShelterDeparture; shelterDepartureRemaining: number; shelterPhoneCharging: boolean }) {
  return <ModalOverlay className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label="Leaving the night shelter">
      <ModalPanel size="compact" className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">MORNING CHECKOUT</p><h2>Leaving the night shelter</h2></div></div>
        <p className="timed-description modal-narrative">Packing your things and heading outside.{shelterPhoneCharging && ' Your phone keeps charging until you collect it on the way out.'}</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>{shelterDepartureRemaining} min remaining</span></div>
        <div className="sleep-progress" role="progressbar" aria-label="Packing progress" aria-valuemin={0} aria-valuemax={SHELTER_DEPARTURE_MINUTES} aria-valuenow={SHELTER_DEPARTURE_MINUTES - shelterDepartureRemaining}><i style={{ width: `${(1 - shelterDepartureRemaining / SHELTER_DEPARTURE_MINUTES) * 100}%` }} /></div>
        <p className="timed-footnote"><Icon name="clock" />On the street at {formatTime((shelterDeparture.startAbsolute + SHELTER_DEPARTURE_MINUTES) % 1440)}</p>
      </ModalPanel>
    </ModalOverlay>
}
