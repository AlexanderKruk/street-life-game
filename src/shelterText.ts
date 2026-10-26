import { t } from './i18n'

// Whole outcomes preserve all four charging/booking contexts for translators.
export function shelterDepartureText(charging: boolean, booked: boolean) {
  return t(charging ? booked ? 'shelter.departure.resultChargingBooked' : 'shelter.departure.resultCharging'
    : booked ? 'shelter.departure.resultBooked' : 'shelter.departure.result')
}
