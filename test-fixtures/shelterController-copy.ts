// Frozen 1f39ed9 shelter copy and behaviour for localisation parity.
import { actions, applyAction as applyGameAction, type GameState, type ActionResult, type Housing, type TimeContext } from '../src/game'
import { displayDay } from '../src/gameDate'
import { absoluteMinutes, weekday } from '../src/gameTime'
import { SHELTER_DEPARTURE_MINUTES, shelterPeopleAhead, shelterQueueMinutes } from '../src/shelterRules'
import type { ShelterSession } from '../src/restSessions'
import type { LifeSituation, Screen, SleepState } from '../src/stateTypes'
import type { ResultSnapshot } from '../src/results'
import type { GameSetter, RunWithResult, Setter } from '../src/controllerTypes'
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
      setMessage(evicted ? `Third shelter rule violation: your place was cancelled. You can register again on Day ${displayDay(blockedUntil)}.` : `You left the shelter after 08:00. Rule violation ${strikes}/3.`)
    }
  }

  function startShelterDeparture() {
    if (!shelterCheckoutDue || departureBlocked) return
    setMusicOn(false)
    setPhoneOpen(false)
    setShelterDeparture({ day: game.day, startAbsolute: absoluteMinutes(game), before: resultSnapshot() })
    setMessage('Packing your things and leaving the night shelter. This takes 30 minutes.')
  }

  function completeShelterDeparture() {
    if (!shelterDeparture || lastDeparture.current === shelterDeparture) return
    const departure = shelterDeparture
    runWithResult({ id: 'shelter-checkout', title: 'Shelter checkout' }, () => {
      lastDeparture.current = departure
      setShelterDeparture(null)
      setGame(previous => ({ ...previous, locationId: 'street' }))
      setLife(previous => ({ ...previous, housing: 'Street', housingUntil: undefined, shelterCheckoutDay: departure.day }))
      setSelectedDestination(null)
      setPhoneOpen(false)
      setShelterPhoneCharging(false)
      setScreen('location')
      setMessage('You pack your things and step outside. The night shelter is behind you for now.' + (shelterPhoneCharging ? ' You collect your phone from the charger.' : '') + (shelterBooked ? ' Your reserved place remains available for tonight.' : ''))
    }, departure.before, true, true)
  }
  function completeShelterQueue() {
    if (!shelterQueue || lastQueue.current === shelterQueue) return
    const queued = shelterQueue
    runWithResult({ id: 'shelter-registration', title: 'Shelter registration', actionHistory: { kind: 'action', failed: queued.vacancies <= queued.peopleAhead } }, () => {
      lastQueue.current = queued
      setShelterQueue(null)
      if (queued.vacancies > queued.peopleAhead) {
        setLife(status => ({ ...status, housing: 'Night shelter', shelterRegisteredDay: queued.day,
          shelterUntilDay: queued.day + 6, shelterLastStayDay: queued.day, shelterAuditDay: queued.day, shelterEntry: { night: queued.day, admitted: true },
          shelterMisses: 0, shelterMissMonth: Math.floor((queued.day - 1) / 30), shelterStrikes: 0 }))
        setGame(prev => applyGameAction(prev, { minutes: 0, mood: 3 }, moodContext(prev, 'Night shelter')), 'Night shelter')
        setActiveGoal(goal => goal?.type === 'night-shelter' ? null : goal)
        setMessage('When your turn comes, there is a place left. You have a bed for the next seven nights, with access to meals and other shelter services.')
      } else {
        setGame(prev => applyAction(prev, { minutes: 0, mood: -5 }))
        setMessage(queued.vacancies === 0 ? 'You waited, but there are no free places today. Try arriving before 18:00 tomorrow; registration starts at 18:20.' :
          'You waited, but people ahead of you took the remaining places. Try arriving before 18:00 tomorrow; registration starts at 18:20.')
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
    setMessage(`After the interview, your shelter place is extended for ${extension} days.${plan ? ' The social worker expects you to follow the plan you agreed to.' : ''}`)
    setShelterInterview(null)
  }

  function beginShelterInterview() {
      const workerDay = weekday(game.day)
      if ((workerDay !== 'Tu' && workerDay !== 'Fr') || game.minutes < 960 || game.minutes >= 1200) {
        setMessage('The shelter social worker is available Tuesdays and Fridays from 16:00 to 20:00.')
        return
      }
      if ((life.shelterUntilDay ?? 0) < game.day) {
        setMessage('There is no active shelter booking to extend. Register at the shelter first.')
        return
      }
      setShelterInterview({ step: 'reason' })
      setMessage('The social worker asks why you still need the shelter place.')
      return

  }
  function prepareShelterAction(actionId: string) {
    if (actionId === 'shelter-dinner') {
      if (game.minutes < 1140 || game.minutes >= 1230) { setMessage('Dinner is served from 19:00 to 20:30.'); return true }
      if (life.shelterDinnerDay === game.day) { setMessage('You already had dinner here today.'); return true }
      setLife((status) => ({ ...status, shelterDinnerDay: game.day }))
    }
    if (actionId === 'shelter-breakfast') {
      if (game.minutes < 390 || game.minutes >= 420) { setMessage('Breakfast is served from 06:30 to 07:00.'); return true }
      if (life.shelterBreakfastDay === game.day) { setMessage('You already had breakfast here today.'); return true }
      setLife((status) => ({ ...status, shelterBreakfastDay: game.day }))
    }
    if (actionId === 'shelter-laundry-drop') {
      if (weekday(game.day) !== 'Th' || game.minutes < 390 || game.minutes >= 480) { setMessage('Laundry can be left on Thursday morning, 06:30–08:00.'); return true }
      if (life.shelterLaundryDropDay === game.day) { setMessage('Your clothes are already in the laundry. Collect them this evening.'); return true }
      setLife((status) => ({ ...status, shelterLaundryDropDay: game.day }))
    }
    if (actionId === 'shelter-laundry-pickup') {
      if (weekday(game.day) !== 'Th' || game.minutes < 1080 || game.minutes >= 1320) { setMessage('Clean laundry can be collected Thursday evening, 18:00–22:00.'); return true }
      if (life.shelterLaundryDropDay !== game.day) { setMessage('You did not leave clothes for laundry this morning.'); return true }
      setLife((status) => ({ ...status, shelterLaundryDropDay: undefined }))
    }
    if (actionId === 'shelter-rest') {
      const blocked = (life.shelterBlockedUntilDay ?? 0) > game.day
      if (blocked) { setMessage(`You lost your shelter place. You can register again on Day ${displayDay(life.shelterBlockedUntilDay ?? game.day)}.`); return true }
      const activeBooking = (life.shelterUntilDay ?? 0) >= game.day
      if (!activeBooking) {
        if (game.minutes < 480 || game.minutes >= 1320) { setMessage('Queue during the day. Doors open at 18:00; registration starts at 18:20.'); return true }
        if (life.shelterRegistrationAttemptDay === game.day) { setMessage('You already waited for registration today. Arrive before 18:00 tomorrow.'); return true }
        // Arrival, rather than the time the registration button is pressed,
        // fixes priority while the player stays here. Vacancies never reroll.
        const vacancies = life.shelterVacancyDay === game.day ? life.shelterVacancies ?? 0 : session.rollVacancies(game.day)
        const arrivalMinute = shelterArrival?.day === game.day ? shelterArrival.minute : game.minutes
        const peopleAhead = shelterPeopleAhead(arrivalMinute)
        const total = shelterQueueMinutes(game.minutes)
        setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: vacancies, shelterRegistrationAttemptDay: game.day }))
        setShelterQueue({ day: game.day, remaining: total, total, arrivalMinute, joinedAt: game.minutes, vacancies, peopleAhead, before: resultSnapshot() })
        setMusicOn(false)
        setMessage('You join the queue. Doors open at 18:00; registration starts at 18:20. Your arrival time keeps your priority while you stay here.')
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
  function answerShelterInterview(value: string) { runWithResult({ id: 'shelter-extension', title: 'Shelter extension' }, () => answerShelterInterviewImpl(value)) }
  return { recordShelterDeparture, startShelterDeparture, completeShelterDeparture, completeShelterQueue, answerShelterInterview, beginShelterInterview, prepareShelterAction, tickShelterQueue }
}
export type ShelterController = ReturnType<typeof createShelterController>
