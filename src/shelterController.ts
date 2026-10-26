import { shelterDepartureText } from './shelterText'
import { t } from './i18n'
import { actions, applyAction as applyGameAction, type GameState, type ActionResult, type Housing, type TimeContext } from './game'
import { displayDay } from './gameDate'
import { absoluteMinutes, weekday } from './gameTime'
import { SHELTER_DEPARTURE_MINUTES, shelterPeopleAhead, shelterQueueMinutes } from './shelterRules'
import type { ShelterSession } from './restSessions'
import type { LifeSituation, Screen, SleepState } from './stateTypes'
import type { ResultSnapshot } from './results'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
type Context = { game: GameState; life: LifeSituation; current: { id: string }; shelterCheckoutDue: boolean; departureBlocked: boolean; shelterPhoneCharging: boolean; shelterBooked: boolean }
type Host = {
  setGame: GameSetter; setLife: Setter<LifeSituation>; setMessage: Setter<string>; setMusicOn: Setter<boolean>; setPhoneOpen: Setter<boolean>; setShelterPhoneCharging: Setter<boolean>
  setSelectedDestination: Setter<string | null>; setScreen: Setter<Screen>; setActiveGoal: Setter<{ type: 'night-shelter'; day: number; minute: number } | null>
  applyAction: (state: GameState, action: ActionResult) => GameState; moodContext: (state: GameState, housing?: Housing) => TimeContext
  requestSleep: (kind: SleepState['kind']) => void; resultSnapshot: () => ResultSnapshot; runWithResult: RunWithResult
}
export function createShelterController(session: ShelterSession, context: Context, host: Host) {
  const { shelterArrival, shelterDeparture, shelterQueue, shelterInterview, setShelterQueue, setShelterDeparture, setShelterInterview, lastQueue, lastDeparture } = session
  const { game, life, current, shelterCheckoutDue, departureBlocked, shelterPhoneCharging, shelterBooked } = context
  const { setGame, setLife, setMessage, setMusicOn, setPhoneOpen, setShelterPhoneCharging, setSelectedDestination, setScreen, setActiveGoal, applyAction, moodContext, requestSleep, resultSnapshot, runWithResult } = host
  function recordShelterDeparture(id: string) {
    if (game.locationId === 'shelter' && id !== 'shelter') setShelterPhoneCharging(false)
    if (game.locationId === 'shelter' && id !== 'shelter' && game.minutes > 480 && game.minutes < 1080 && (life.shelterUntilDay ?? 0) >= game.day) {
      const strikes = (life.shelterStrikes ?? 0) + 1
      const evicted = strikes >= 3
      const month = Math.floor((game.day - 1) / 30)
      const blockedUntil = (month + 1) * 30 + 1
      setLife((status) => ({ ...status, shelterStrikes: strikes, ...(evicted ? { housing: 'Street' as const, housingUntil: undefined, shelterUntilDay: undefined, shelterBlockedUntilDay: blockedUntil } : {}) }))
      setMessage(evicted ? t('shelter.violation.cancelled', { day: displayDay(blockedUntil) }) : t('shelter.violation.recorded', { strikes }))
    }
  }

  function startShelterDeparture() {
    if (!shelterCheckoutDue || departureBlocked) return
    setMusicOn(false)
    setPhoneOpen(false)
    setShelterDeparture({ day: game.day, startAbsolute: absoluteMinutes(game), before: resultSnapshot() })
    setMessage(t("shelter.packing.started"))
  }

  function completeShelterDeparture() {
    if (!shelterDeparture || lastDeparture.current === shelterDeparture) return
    const departure = shelterDeparture
    runWithResult({ id: 'shelter-checkout', title: t("shelter.checkout.title") }, () => {
      lastDeparture.current = departure
      setShelterDeparture(null)
      setGame(previous => ({ ...previous, locationId: 'street' }))
      setLife(previous => ({ ...previous, housing: 'Street', housingUntil: undefined, shelterCheckoutDay: departure.day }))
      setSelectedDestination(null)
      setPhoneOpen(false)
      setShelterPhoneCharging(false)
      setScreen('location')
      setMessage(shelterDepartureText(shelterPhoneCharging, shelterBooked))
    }, departure.before, true, true)
  }
  function completeShelterQueue() {
    if (!shelterQueue || lastQueue.current === shelterQueue) return
    const queued = shelterQueue
    runWithResult({ id: 'shelter-registration', title: t("shelter.registration.title"), actionHistory: { kind: 'action', failed: queued.vacancies <= queued.peopleAhead } }, () => {
      lastQueue.current = queued
      setShelterQueue(null)
      if (queued.vacancies > queued.peopleAhead) {
        setLife(status => ({ ...status, housing: 'Night shelter', shelterRegisteredDay: queued.day,
          shelterUntilDay: queued.day + 6, shelterLastStayDay: queued.day, shelterAuditDay: queued.day, shelterEntry: { night: queued.day, admitted: true },
          shelterMisses: 0, shelterMissMonth: Math.floor((queued.day - 1) / 30), shelterStrikes: 0 }))
        setGame(prev => applyGameAction(prev, { minutes: 0, mood: 3 }, moodContext(prev, 'Night shelter')), 'Night shelter')
        setActiveGoal(goal => goal?.type === 'night-shelter' ? null : goal)
        setMessage(t("shelter.registration.success"))
      } else {
        setGame(prev => applyAction(prev, { minutes: 0, mood: -5 }))
        setMessage(queued.vacancies === 0 ? t("shelter.registration.noVacancies") :
          t("shelter.registration.lostPriority"))
      }
      setScreen('location')
    }, queued.before, true, true)
  }
  function answerShelterInterviewImpl(value: string) {
    if (!shelterInterview) return
    if (shelterInterview.step === 'reason') {
      setShelterInterview({ ...shelterInterview, reason: value, step: 'action' })
      return
    }
    if (shelterInterview.step === 'action') {
      setShelterInterview({ ...shelterInterview, action: value, step: 'plan' })
      return
    }
    const renewals = life.shelterRenewals ?? 0
    const realProgress = life.employment === 'Day work' || life.schroniskoReferral || shelterInterview.action === 'documents'
    const constructive = value !== 'nothing'
    let extension = renewals === 0 ? 30 : realProgress && constructive ? 30 : constructive ? 14 : 7
    if (renewals >= 2 && !realProgress) extension = constructive ? 14 : 7
    const plan = value === 'jobcenter' || value === 'daywork' || value === 'documents' || value === 'benefits' ? value : undefined
    setLife((status) => ({ ...status, shelterUntilDay: game.day + extension - 1, shelterRenewals: renewals + 1, shelterPlan: plan }))
    setGame((prev) => applyAction(prev, { minutes: 30, mood: extension >= 14 ? 3 : -2 }))
    setMessage(t(plan ? 'shelter.extension.planned' : 'shelter.extension.unplanned', { days: extension }))
    setShelterInterview(null)
  }

  function beginShelterInterview() {
      const workerDay = weekday(game.day)
      if ((workerDay !== 'Tu' && workerDay !== 'Fr') || game.minutes < 960 || game.minutes >= 1200) {
        setMessage(t("shelter.interview.hours"))
        return
      }
      if ((life.shelterUntilDay ?? 0) < game.day) {
        setMessage(t("shelter.interview.noBooking"))
        return
      }
      setShelterInterview({ step: 'reason' })
      setMessage(t("shelter.interview.started"))
      return

  }
  function prepareShelterAction(actionId: string) {
    if (actionId === 'shelter-dinner') {
      if (game.minutes < 1140 || game.minutes >= 1230) { setMessage(t("shelter.dinner.hours")); return true }
      if (life.shelterDinnerDay === game.day) { setMessage(t("shelter.dinner.used")); return true }
      setLife((status) => ({ ...status, shelterDinnerDay: game.day }))
    }
    if (actionId === 'shelter-breakfast') {
      if (game.minutes < 390 || game.minutes >= 420) { setMessage(t("shelter.breakfast.hours")); return true }
      if (life.shelterBreakfastDay === game.day) { setMessage(t("shelter.breakfast.used")); return true }
      setLife((status) => ({ ...status, shelterBreakfastDay: game.day }))
    }
    if (actionId === 'shelter-laundry-drop') {
      if (weekday(game.day) !== 'Th' || game.minutes < 390 || game.minutes >= 480) { setMessage(t("shelter.laundry.dropHours")); return true }
      if (life.shelterLaundryDropDay === game.day) { setMessage(t("shelter.laundry.dropped")); return true }
      setLife((status) => ({ ...status, shelterLaundryDropDay: game.day }))
    }
    if (actionId === 'shelter-laundry-pickup') {
      if (weekday(game.day) !== 'Th' || game.minutes < 1080 || game.minutes >= 1320) { setMessage(t("shelter.laundry.pickupHours")); return true }
      if (life.shelterLaundryDropDay !== game.day) { setMessage(t("shelter.laundry.notDropped")); return true }
      setLife((status) => ({ ...status, shelterLaundryDropDay: undefined }))
    }
    if (actionId === 'shelter-rest') {
      const blocked = (life.shelterBlockedUntilDay ?? 0) > game.day
      if (blocked) { setMessage(t('shelter.registration.blocked', { day: displayDay(life.shelterBlockedUntilDay ?? game.day) })); return true }
      const activeBooking = (life.shelterUntilDay ?? 0) >= game.day
      if (!activeBooking) {
        if (game.minutes < 480 || game.minutes >= 1320) { setMessage(t("shelter.registration.hours")); return true }
        if (life.shelterRegistrationAttemptDay === game.day) { setMessage(t("shelter.registration.used")); return true }
        // Arrival, rather than the time the registration button is pressed,
        // fixes priority while the player stays here. Vacancies never reroll.
        const vacancies = life.shelterVacancyDay === game.day ? life.shelterVacancies ?? 0 : session.rollVacancies(game.day)
        const arrivalMinute = shelterArrival?.day === game.day ? shelterArrival.minute : game.minutes
        const peopleAhead = shelterPeopleAhead(arrivalMinute)
        const total = shelterQueueMinutes(game.minutes)
        setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: vacancies, shelterRegistrationAttemptDay: game.day }))
        setShelterQueue({ day: game.day, remaining: total, total, arrivalMinute, joinedAt: game.minutes, vacancies, peopleAhead, before: resultSnapshot() })
        setMusicOn(false)
        setMessage(t("shelter.registration.joined"))
        return true
      }
      requestSleep('shelter')
      return true
    }
    return false
  }
  function tickShelterQueue(minutes: number) {
    setShelterQueue(active => active ? { ...active, remaining: Math.max(0, active.remaining - minutes) } : null)
  }
  function answerShelterInterview(value: string) { runWithResult({ id: 'shelter-extension', title: t("shelter.extension.title") }, () => answerShelterInterviewImpl(value)) }
  return { recordShelterDeparture, startShelterDeparture, completeShelterDeparture, completeShelterQueue, answerShelterInterview, beginShelterInterview, prepareShelterAction, tickShelterQueue }
}
export type ShelterController = ReturnType<typeof createShelterController>
