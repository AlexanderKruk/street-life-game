import { useRef, useState } from 'react'
import type { ShelterArrival, ShelterDeparture, ShelterInterview, ShelterQueue, SleepState } from './stateTypes'
export function useSleepSession(initial: { sleeping: SleepState | null }) {
  const [sleepHours, setSleepHours] = useState(8)
  const [sleepChoice, setSleepChoice] = useState<SleepState['kind'] | null>(null)
  const [sleeping, setSleeping] = useState(initial.sleeping)
  const lastFinishedSleep = useRef<SleepState | null>(null)
  const groundSleepWindow = useRef<{ start: number; end: number } | null>(initial.sleeping?.kind === 'ground' ? { start: initial.sleeping.startAbsolute, end: initial.sleeping.startAbsolute + initial.sleeping.total } : null)
  const forcedSleep = useRef<SleepState | null>(null)
  function resetSleepSession() {
    setSleeping(null); setSleepChoice(null); setSleepHours(8)
    lastFinishedSleep.current = null; groundSleepWindow.current = null; forcedSleep.current = null
  }
  return { sleepHours, setSleepHours, sleepChoice, setSleepChoice, sleeping, setSleeping, lastFinishedSleep, groundSleepWindow, forcedSleep, resetSleepSession }
}
export type SleepSession = ReturnType<typeof useSleepSession>
export function useShelterSession(initial: { shelterQueue: ShelterQueue | null; shelterArrival: ShelterArrival | null; shelterDeparture: ShelterDeparture | null }) {
  const [shelterQueue, setShelterQueue] = useState(initial.shelterQueue)
  const [shelterArrival, setShelterArrival] = useState(initial.shelterArrival)
  const [shelterDeparture, setShelterDeparture] = useState(initial.shelterDeparture)
  const [shelterInterview, setShelterInterview] = useState<ShelterInterview | null>(null)
  const lastQueue = useRef<ShelterQueue | null>(null)
  const lastDeparture = useRef<ShelterDeparture | null>(null)
  const vacancyRoll = useRef<{ day: number; value: number } | null>(null)
  function rollVacancies(day: number) {
    if (vacancyRoll.current?.day !== day) vacancyRoll.current = { day, value: Math.floor(Math.random() * 4) }
    return vacancyRoll.current.value
  }
  function resetShelterSession() {
    setShelterQueue(null); setShelterArrival(null); setShelterDeparture(null); setShelterInterview(null)
    lastQueue.current = null; lastDeparture.current = null; vacancyRoll.current = null
  }
  return { shelterQueue, setShelterQueue, shelterArrival, setShelterArrival, shelterDeparture, setShelterDeparture,
    shelterInterview, setShelterInterview, lastQueue, lastDeparture, rollVacancies, resetShelterSession }
}
export type ShelterSession = ReturnType<typeof useShelterSession>
