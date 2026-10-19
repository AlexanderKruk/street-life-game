export const SHELTER_PHONE_CHARGE_KEY = 'street-life-shelter-phone-charge-v1'
export const SHELTER_CHARGE_PER_HOUR = 60

// A plugged-in phone charges only until this night's closing time, never
// through the daytime closure into another evening after a large time jump.
export function shelterChargingMinutes(from: number, to: number) {
  const minute = from % 1440
  if (minute >= 480 && minute < 1080) return 0
  const closing = from - minute + (minute >= 1080 ? 1440 + 480 : 480)
  return Math.max(0, Math.min(to, closing) - from)
}
