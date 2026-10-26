import { t } from './i18n'
import { Icon } from './Icon'
import { ModalOverlay, ModalPanel, ModalAction } from './Modal'
import { formatTime } from './game'
import { SHELTER_DEPARTURE_MINUTES } from './shelterRules'
import type { ShelterDeparture } from './stateTypes'
export function ShelterCheckoutWarning({ minute, onStart }: { minute: number; onStart: () => void }) {
  return <ModalOverlay className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label={t("shelter.checkout.accessible")} onKeyDown={event => {
      if (event.key === 'Tab') {
        event.preventDefault()
        event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }}>
      <ModalPanel size="compact" className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">{t("shelter.checkout.label")}</p><h2>{t("shelter.checkout.warningTitle")}</h2></div></div>
        <p className="timed-description modal-narrative">{t("shelter.checkout.warning")}</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>{t('shelter.streetAt', { time: formatTime((minute + SHELTER_DEPARTURE_MINUTES) % 1440) })}</span></div>
        <ModalAction className="checkout-start" autoFocus onClick={onStart}>{t("shelter.checkout.start")}</ModalAction>
      </ModalPanel>
    </ModalOverlay>
}
export function ShelterDepartureDialog({ minute, shelterDeparture, shelterDepartureRemaining, shelterPhoneCharging }: { minute: number; shelterDeparture: ShelterDeparture; shelterDepartureRemaining: number; shelterPhoneCharging: boolean }) {
  return <ModalOverlay className="sleep-overlay checkout-overlay timed-overlay" role="dialog" aria-modal="true" aria-label={t("shelter.departure.title")}>
      <ModalPanel size="compact" className="sleep-card timed-card">
        <div className="timed-heading"><Icon name="backpack" /><div><p className="eyebrow">{t("shelter.checkout.label")}</p><h2>{t("shelter.departure.title")}</h2></div></div>
        <p className="timed-description modal-narrative">{t(shelterPhoneCharging ? 'shelter.departure.descriptionCharging' : 'shelter.departure.description')}</p>
        <div className="sleep-clock"><strong>{formatTime(minute)}</strong><span>{t('shelter.remaining', { minutes: shelterDepartureRemaining })}</span></div>
        <div className="sleep-progress" role="progressbar" aria-label={t("shelter.departure.progress")} aria-valuemin={0} aria-valuemax={SHELTER_DEPARTURE_MINUTES} aria-valuenow={SHELTER_DEPARTURE_MINUTES - shelterDepartureRemaining}><i style={{ width: `${(1 - shelterDepartureRemaining / SHELTER_DEPARTURE_MINUTES) * 100}%` }} /></div>
        <p className="timed-footnote"><Icon name="clock" />{t('shelter.streetAt', { time: formatTime((shelterDeparture.startAbsolute + SHELTER_DEPARTURE_MINUTES) % 1440) })}</p>
      </ModalPanel>
    </ModalOverlay>
}
