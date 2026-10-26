import { t } from './i18n'
import type { GameState } from './game'
import type { LifeSituation } from './stateTypes'
import { displayDay } from './gameDate'
import { SHELTER_CHECKOUT_WARNING } from './sleepRules'
export const SHELTER_QUEUE_MINUTES = 20

export const SHELTER_ENTRY_OPEN = 18 * 60

export const SHELTER_REGISTRATION_OPEN = SHELTER_ENTRY_OPEN + 20


export function shelterPeopleAhead(arrivalMinute: number) {
  // Applicants gather before the doors open; earlier arrival keeps priority.
  return Math.floor(Math.max(0, arrivalMinute - 17 * 60) / 45)
}


export function shelterQueueMinutes(minute: number) {
  return Math.max(SHELTER_QUEUE_MINUTES, SHELTER_REGISTRATION_OPEN - minute)
}


export const SHELTER_DEPARTURE_MINUTES = 30
export function shelterAccess(game: GameState, life: LifeSituation, currentId: string, travelling: boolean, open: boolean, departing: boolean) {
  const shelterNightDay = game.minutes < 480 ? game.day - 1 : game.day
  const shelterBooked = (life.shelterUntilDay ?? 0) > 0 && (life.shelterUntilDay ?? 0) >= shelterNightDay
  const canEnter = game.minutes >= 1080 && game.minutes <= 1320 && game.intoxication <= 10
  const shelterAdmitted = shelterBooked && (canEnter || life.shelterEntry?.night !== shelterNightDay || life.shelterEntry.admitted)
  const insideNightShelter = currentId === 'shelter' && !travelling && open && game.intoxication <= 10 && shelterAdmitted
  const shelterCheckoutDue = currentId === 'shelter' && shelterAdmitted && !departing && !travelling &&
    life.shelterCheckoutDay !== game.day && game.minutes >= SHELTER_CHECKOUT_WARNING && game.minutes < 12 * 60 &&
    (game.minutes < 8 * 60 || life.shelterLastStayDay === game.day - 1)
  return { shelterNightDay, shelterBooked, shelterAdmitted, insideNightShelter, shelterCheckoutDue }
}
export function shelterAttendance(life: LifeSituation, day: number): { life: LifeSituation; message?: string } {
  if (!life.shelterRegisteredDay || !life.shelterUntilDay) return { life }
  const previousDay = day - 1
  if (previousDay < life.shelterRegisteredDay || (life.shelterAuditDay ?? 0) >= previousDay) return { life }
  const month = Math.floor((previousDay - 1) / 30)
  const missesBefore = life.shelterMissMonth === month ? (life.shelterMisses ?? 0) : 0
  const misses = missesBefore + (life.shelterLastStayDay !== previousDay ? 1 : 0)
  if (misses >= 3) {
    const blockedUntil = (month + 1) * 30 + 1
    return { life: { ...life, housing: 'Street', housingUntil: undefined, shelterUntilDay: undefined, shelterAuditDay: previousDay, shelterMisses: misses, shelterMissMonth: month, shelterBlockedUntilDay: blockedUntil },
      message: t('shelter.attendance.cancelled', { day: displayDay(blockedUntil) }) }
  }
  return { life: { ...life, shelterAuditDay: previousDay, shelterMisses: misses, shelterMissMonth: month } }
}
