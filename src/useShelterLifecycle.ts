import { useEffect } from 'react'
import type { GameState } from './game'
import { absoluteMinutes } from './gameTime'
import { shelterAttendance } from './shelterRules'
import type { LifeSituation } from './stateTypes'
import type { ShelterSession } from './restSessions'
import type { ShelterController } from './shelterController'
import type { Setter } from './controllerTypes'
export function useShelterAdmission(insideNightShelter: boolean, shelterNightDay: number, life: LifeSituation, setLife: Setter<LifeSituation>) {
  useEffect(() => {
    if (!insideNightShelter || (life.shelterEntry?.night === shelterNightDay && life.shelterEntry.admitted)) return
    setLife(status => ({ ...status, shelterEntry: { night: shelterNightDay, admitted: true }, shelterLastStayDay: shelterNightDay }))
  }, [insideNightShelter, shelterNightDay, life.shelterEntry?.night, life.shelterEntry?.admitted])
}
export function useShelterProcesses(session: ShelterSession, controller: ShelterController, context: { game: GameState; life: LifeSituation; current: { id: string }; trip: boolean; shelterBooked: boolean; shelterDepartureRemaining: number; gameOver: boolean }, setLife: Setter<LifeSituation>) {
  const { game, life, current, trip, shelterBooked, shelterDepartureRemaining, gameOver } = context
  const { setShelterArrival, shelterDeparture, shelterQueue } = session
  useEffect(() => {
    if (current.id !== 'shelter' || life.shelterVacancyDay === game.day) return
    const vacancies = session.rollVacancies(game.day)
    setLife(status => ({ ...status, shelterVacancyDay: game.day, shelterVacancies: vacancies }))
  }, [current.id, game.day, life.shelterVacancyDay])
  useEffect(() => {
    const waitingHere = current.id === 'shelter' && !trip && !shelterBooked && game.minutes >= 480 && game.minutes < 1320
    setShelterArrival(previous => waitingHere
      ? previous?.day === game.day ? previous : { day: game.day, minute: game.minutes }
      : previous === null ? previous : null)
  }, [current.id, !!trip, shelterBooked, game.day, game.minutes])

  useEffect(() => {
    if (shelterDeparture && shelterDepartureRemaining <= 0 && !gameOver) controller.completeShelterDeparture()
  }, [shelterDeparture, shelterDepartureRemaining, gameOver])
  useEffect(() => {
    if (shelterQueue && shelterQueue.remaining <= 0 && !gameOver) controller.completeShelterQueue()
  }, [shelterQueue, gameOver])
  useEffect(() => {
    if (life.housing === 'Night shelter' && life.housingUntil !== undefined && absoluteMinutes(game) >= life.housingUntil) {
      setLife((status) => ({ ...status, housing: 'Street', housingUntil: undefined }))
    }
  }, [game.day, game.minutes, life.housing, life.housingUntil])
}
export function useShelterAttendance(game: GameState, life: LifeSituation, setLife: Setter<LifeSituation>, setMessage: Setter<string>) {
  useEffect(() => {
    const audit = shelterAttendance(life, game.day)
    if (audit.life === life) return
    setLife(previous => shelterAttendance(previous, game.day).life)
    if (audit.message !== undefined) setMessage(audit.message)
  }, [game.day, life.shelterRegisteredDay, life.shelterUntilDay, life.shelterAuditDay, life.shelterLastStayDay])
}
