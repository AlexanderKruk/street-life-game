import { t } from './i18n'
import { sleepCompletionText } from './sleepText'
import { locationName } from './locationText'
import type { WeatherId } from './weather'
import { useEffect } from 'react'
import { applySleepTime as applyGameSleepTime, weatherAt, type ActionResult, type GameState, type TimeContext } from './game'
import { firstNightTime, nextStreetEvent, type StreetEvent } from './events'
import { absoluteMinutes } from './gameTime'
import { CLOTHING_WETNESS_ENABLED } from './gameplayFeatures'
import { sleepIllnessChance } from './sleepIllness'
import { availableSleepHours, clearSleepIllness, DEBUG_SLEEP_SPEED, SHELTER_CHECKOUT_WARNING, shelterSleepMinutes, sleepDurationBlock, sleepElapsed } from './sleepRules'
import type { SleepSession } from './restSessions'
import type { EncounterQueue } from './encounterQueue'
import type { EventSession } from './eventSession'
import type { ActiveEffect, Inventory, LifeSituation, Screen, SleepState, Trip } from './stateTypes'
import type { ResultCardData } from './ResultCard'
import type { ResultSnapshot } from './results'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'

type Context = {
  game: GameState; inventory: Inventory; effects: ActiveEffect[]; current: { id: string }
  weather: { id: WeatherId }; underRainCover: boolean; insideNightShelter: boolean; streetBenchFound: boolean; blocked: boolean
}
type Host = {
  setGame: GameSetter; setLife: Setter<LifeSituation>; setEffects: Setter<ActiveEffect[]>; setMessage: Setter<string>; setInfoModal: Setter<ResultCardData | null>
  setMusicOn: Setter<boolean>; setTrip: Setter<Trip | null>; setSelectedDestination: Setter<string | null>; setPhoneOpen: Setter<boolean>; setScreen: Setter<Screen>
  recordShelterDeparture: (id: string) => void; moodContext: (state?: GameState) => TimeContext
  applyAction: (state: GameState, action: ActionResult) => GameState; resultSnapshot: () => ResultSnapshot; runWithResult: RunWithResult
}
export function createSleepController(session: SleepSession, eventSession: EventSession, queue: EncounterQueue, context: Context, host: Host) {
  const { sleeping, setSleeping, sleepChoice, setSleepChoice, setSleepHours, lastFinishedSleep, groundSleepWindow, forcedSleep } = session
  const { firstNightEvents, encounters, setEncounters, setActiveEvent } = eventSession
  const { rememberFirstNightEvent, rememberEncounter, encounterDue } = queue
  const { game, inventory, effects, current, weather, underRainCover, insideNightShelter, streetBenchFound, blocked } = context
  const { setGame, setLife, setEffects, setMessage, setInfoModal, setMusicOn, setTrip, setSelectedDestination, setPhoneOpen, setScreen, recordShelterDeparture, moodContext, applyAction, resultSnapshot, runWithResult } = host
  function applySleepTime(state: GameState, minutes: number) {
    const kind = sleeping?.kind ?? sleepChoice
    return applyGameSleepTime(state, minutes, { ...moodContext(state), ...(kind ? { sleepKind: kind, exposure: kind === 'ground' || (kind === 'bench' && state.locationId === 'street') ? underRainCover ? 'cover' as const : 'outside' as const : 'indoors' as const } : {}) })
  }

  function canStartSleep(kind: SleepState['kind']) {
    if (blocked || sleeping) return false
    if (kind === 'bench' && current.id !== 'station' && (!streetBenchFound || current.id !== 'street')) return false
    if (kind === 'ground' && current.id !== 'street') return false
    if (kind === 'shelter' && !insideNightShelter) return false
    if (kind === 'residential' && current.id !== 'residential-shelter') return false
    return true
  }

  function requestSleep(kind: SleepState['kind']) {
    if (sleepChoice || !canStartSleep(kind)) return
    const available = availableSleepHours(game.energy)
    setSleepHours(previous => available.includes(previous) ? previous : available[available.length - 1])
    setSleepChoice(kind)
  }

  function chosenSleepMinutes(hours: number, kind: SleepState['kind']) {
    return kind === 'shelter' ? shelterSleepMinutes(absoluteMinutes(game), hours * 60) : hours * 60
  }

  function wakeTime(hours: number, kind: SleepState['kind']) {
    const wake = absoluteMinutes(game) + chosenSleepMinutes(hours, kind)
    const day = Math.floor(wake / 1440) + 1
    return { day, minutes: wake % 1440 }
  }

  function sleep(hours: number, kind: SleepState['kind']) {
    if (!canStartSleep(kind) || sleepDurationBlock(hours, game.energy) !== null) return
    setSleepChoice(null)
    if (kind === 'shelter') {
      const stayNightDay = game.minutes < 480 ? game.day - 1 : game.day
      setLife(status => ({ ...status, shelterLastStayDay: stayNightDay, housing: 'Night shelter' }))
    }
    setMusicOn(false)
    const realStartedAt = Date.now()
    setGame(clearSleepIllness)
    const total = chosenSleepMinutes(hours, kind)
    groundSleepWindow.current = kind === 'ground' ? { start: absoluteMinutes(game), end: absoluteMinutes(game) + total } : null
    setSleeping({ kind, total, remaining: total, startAbsolute: absoluteMinutes(game), realStartedAt, realWakeAt: realStartedAt + (total * 1000) / DEBUG_SLEEP_SPEED, before: resultSnapshot() })
    setMessage(t('sleep.started'))
  }

  function finishSleep(sleep: SleepState) {
    if (lastFinishedSleep.current === sleep) return
    lastFinishedSleep.current = sleep
    forcedSleep.current = null
    setSleeping(null)
    const before = sleep.before ?? { ...resultSnapshot(), game: { ...game, day: Math.floor(sleep.startAbsolute / 1440) + 1, minutes: sleep.startAbsolute % 1440 } }
    runWithResult({ id: 'sleep-complete', title: t('sleep.complete.title') }, () => {
      setGame(previous => applySleepTime(previous, Math.max(0, sleep.startAbsolute + sleep.total - absoluteMinutes(previous))))
      return finishSleepImpl(sleep)
    }, before, false, true)
  }

  function presentWakeEvent(event: StreetEvent | null, title: string, completionText: string, state = game) {
    if (!event) return
    const outcome = event.choices[0]?.outcome
    rememberEncounter(event, state)
    if (event.id !== 'quiet-night' || !outcome) return
    setActiveEvent(null)
    setEncounters(previous => ({ ...previous, pendingId: null }))
    // Peaceful rest has no decision to make: fold its bonus and artwork into
    // the existing sleep result instead of asking for another confirmation.
    const text = t('sleep.wake.combined', { completion: completionText, outcome: outcome.message })
    setGame(previous => applyAction(previous, { minutes: outcome.minutes ?? 0, energy: outcome.energy, mood: outcome.mood }))
    setMessage(text)
    setInfoModal({ title, text, label: t('sleep.wake.afterRest'), illustration: outcome.illustration ?? event.illustration, illustrationAlt: event.text })
  }

  function finishSleepImpl(sleep: SleepState) {
    const hours = sleep.total / 60
    const scale = hours / 8
    const wakeState = applySleepTime(game, Math.max(0, sleep.startAbsolute + sleep.total - absoluteMinutes(game)))
    const fed = wakeState.hunger > 20 && wakeState.thirst > 20
    const result = sleep.kind === 'ground'
      ? { minutes: 0, energy: 52 * scale, hygiene: -12 * scale, mood: -9 * scale }
      : sleep.kind === 'bench'
        ? { minutes: 0, energy: 66 * scale, hygiene: -7 * scale, mood: -5 * scale }
        : sleep.kind === 'shelter'
          ? { minutes: 0, energy: 100 * scale, health: fed ? 2 * scale : 0, hygiene: 5 * scale, mood: 10 * scale }
          : { minutes: 0, energy: 100 * scale, health: fed ? 3 * scale : 0, hygiene: 3 * scale, mood: 8 * scale }
    const wetRestLoss = CLOTHING_WETNESS_ENABLED ? Math.max(0, (wakeState.wetSleepLoss ?? 0) - (sleep.before?.game.wetSleepLoss ?? 0)) : 0
    setGame((prev) => {
      const next = applyAction(prev, { ...result, energy: Math.max(0, result.energy - wetRestLoss) })
      delete next.wetSleepLoss
      delete next.sleepIllnessDose
      delete next.sleepIllnessMinutes
      return next
    })
    let newlyIll = false
    let wakeEvent: StreetEvent | null = null
    if (sleep.kind === 'ground' || sleep.kind === 'bench') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const sleepWeather = weatherAt(wakeState)
      const alreadyIll = effects.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(wakeState))
      newlyIll = !alreadyIll && Math.random() < sleepIllnessChance(wakeState.sleepIllnessDose ?? 0)
      if (newlyIll) {
        setEffects(active => [...active.filter(effect => effect.id !== 'cold'), { id: 'cold', expiresAt: absoluteMinutes(wakeState) + 2 * 1440 }])
      }
      const sleepStart = { day: Math.floor(sleep.startAbsolute / 1440) + 1, minutes: sleep.startAbsolute % 1440 }
      wakeEvent = newlyIll || !encounterDue(wakeState) ? null : nextStreetEvent('wake', { locationId: current.id, weather: sleepWeather.id, housing: 'Street', documents: inventory.documents, firstNight: firstNightTime(sleepStart), sleepKind: sleep.kind, seenEventIds: [...firstNightEvents.seen, ...encounters.seen, ...(firstNightTime(sleepStart) && sleep.kind === 'bench' && !firstNightEvents.seen.includes('first-night-bench-wake') ? ['quiet-night','night-theft'] : [])] })
      if (wakeEvent?.id.startsWith('first-night-')) { rememberFirstNightEvent(wakeEvent, wakeState); wakeEvent = null }
    } else if (sleep.kind === 'shelter') {
      const sleepStartDay = Math.floor(sleep.startAbsolute / 1440) + 1
      const stayNightDay = sleep.startAbsolute % 1440 < 480 ? sleepStartDay - 1 : sleepStartDay
      setLife((status) => ({ ...status, housing: 'Night shelter', shelterLastStayDay: Math.max(status.shelterLastStayDay ?? 0, stayNightDay) }))
      const event = !encounterDue(wakeState) ? null : nextStreetEvent('wake', { locationId: current.id, weather: weather.id, housing: 'Night shelter', documents: inventory.documents, sleepKind: sleep.kind, seenEventIds: [...encounters.seen, ...firstNightEvents.seen] })
      if (wakeState.minutes < SHELTER_CHECKOUT_WARNING) wakeEvent = event
    } else {
      setLife((status) => ({ ...status, housing: 'Schronisko', housingUntil: undefined }))
    }
    const completionText = sleepCompletionText(sleep.total, wetRestLoss >= 0.5, newlyIll)
    setMessage(completionText)
    if (newlyIll) setInfoModal({ title: t('sleep.illness.title'), label: t('sleep.illness.label'), text: completionText,
      illustration: `/street-life-game/assets/event-sleep-cold-${sleep.kind === 'bench' ? 'bench' : 'ground'}.webp`,
      illustrationAlt: t(sleep.kind === 'bench' ? 'sleep.illness.benchAlt' : 'sleep.illness.groundAlt'),
    })
    else presentWakeEvent(wakeEvent, t('sleep.complete.title'), completionText, wakeState)
    return { kind: 'action' as const, sleepIllness: newlyIll }
  }

  function finishRestAction(actionId: string, actionName: string, result: ActionResult, next: GameState) {
    if (actionId === 'street-sleep') {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
      const wakeEvent = nextStreetEvent('wake', { locationId: current.id, weather: weather.id, housing: 'Street', documents: inventory.documents, sleepKind: current.id === 'station' ? 'bench' : 'ground', seenEventIds: encounters.seen })
      presentWakeEvent(wakeEvent, actionName, result.message ?? t('sleep.timePasses'))
      return true
    } else if (actionId === 'shelter-rest' && result.minutes >= 8 * 60) {
      setLife((status) => ({ ...status, housing: 'Night shelter', housingUntil: absoluteMinutes(next) }))
      const wakeEvent = nextStreetEvent('wake', { locationId: current.id, weather: weather.id, housing: 'Night shelter', documents: inventory.documents, seenEventIds: encounters.seen })
      presentWakeEvent(wakeEvent, actionName, result.message ?? t('sleep.timePasses'))
      return true
    }
    return false
  }
  function tickSleep() {
    if (!sleeping) return
    const targetAbsolute = sleeping.startAbsolute + sleepElapsed(sleeping)
    setGame(previous => {
      const delta = Math.max(0, targetAbsolute - absoluteMinutes(previous))
      return delta > 0 ? applySleepTime(previous, delta) : previous
    })
  }
  function forceSleep() {
    const safeKind = current.id === 'residential-shelter' ? 'residential' : insideNightShelter ? 'shelter' : 'ground'
    if (forcedSleep.current) return
    const hours = 8
    const realStartedAt = Date.now()
    setGame(clearSleepIllness)
    setMusicOn(false)
    setTrip(null)
    if (safeKind === 'ground' && current.id !== 'street') {
      recordShelterDeparture('street')
      setGame((prev) => ({ ...prev, locationId: 'street' }))
      setSelectedDestination(null)
      setPhoneOpen(false)
      setScreen('location')
    }
    const total = safeKind === 'shelter' ? shelterSleepMinutes(absoluteMinutes(game), hours * 60) : hours * 60
    groundSleepWindow.current = safeKind === 'ground' ? { start: absoluteMinutes(game), end: absoluteMinutes(game) + total } : null
    const active: SleepState = { kind: safeKind, total, remaining: total, startAbsolute: absoluteMinutes(game), realStartedAt, realWakeAt: realStartedAt + (total * 1000) / DEBUG_SLEEP_SPEED, before: resultSnapshot(), forced: true }
    forcedSleep.current = active
    setSleeping(active)
    setMessage(safeKind === 'ground'
      ? current.id !== 'street'
        ? t('sleep.forced.leave', { place: locationName(current.id), hours })
        : t('sleep.forced.outside', { hours })
      : t('sleep.forced.bed'))
  }
  return { requestSleep, chosenSleepMinutes, wakeTime, sleep, finishSleep, presentWakeEvent, applySleepTime, tickSleep, forceSleep, finishRestAction }
}
export type SleepController = ReturnType<typeof createSleepController>
export function useSleepCompletion(session: SleepSession, game: GameState, controller: SleepController) {
  const { sleeping } = session
  const { finishSleep } = controller
  useEffect(() => {
    if (!sleeping || absoluteMinutes(game) < sleeping.startAbsolute + sleeping.total) return
    finishSleep(sleeping)
  }, [sleeping, game.day, game.minutes])

}
export function useForcedSleep(session: SleepSession, game: GameState, blocked: boolean, controller: SleepController) {
  const { sleeping, sleepChoice } = session
  useEffect(() => {
    if (blocked || game.energy > 0 || sleeping || sleepChoice) return
    controller.forceSleep()
  }, [game.energy, sleeping, sleepChoice, blocked])
}
