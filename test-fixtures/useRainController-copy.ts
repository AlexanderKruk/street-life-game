import { useEffect, useRef } from 'react'
import { rainDailyLimit, type GameState } from '../src/game'
import { absoluteMinutes } from '../src/gameTime'
import { chooseRain, createRain, planRainDay, rainArt, rainResultText, type RainChoice } from './rain-copy'
import { summarizeResult, type ResultSnapshot } from '../src/results'
import { resultResourceLabel } from '../src/resultResources'
import { t } from '../src/i18n'
import type { ActiveEffect } from '../src/stateTypes'
import type { ResultCardData } from '../src/ResultCard'
import type { JournalEntry } from '../src/journal'
import type { GameSetter, Setter } from '../src/controllerTypes'
export function useRainScheduling(context: { game: GameState; gameOver: boolean; currentExposure: string; sleeping: boolean; currentId: string }, setGame: GameSetter, setRainChoice: Setter<boolean>) {
  const { game, gameOver, currentExposure, sleeping, currentId } = context
  useEffect(() => {
    if (gameOver || (game.rainSystemStarted && game.rainScheduleDay === game.day)) return
    const plan = planRainDay(game, rainDailyLimit(game.day))
    setGame(previous => previous.rainSystemStarted && previous.rainScheduleDay === previous.day ? previous
      : { ...previous, ...plan, rainSystemStarted: true, rainUntil: undefined })
  }, [game.day, game.rainSystemStarted, game.rainScheduleDay, gameOver])
  useEffect(() => {
    const limit = rainDailyLimit(game.day)
    if (!game.rainSystemStarted || game.rainScheduleDay !== game.day || (game.rainStartsToday ?? 0) >= limit || game.rain || game.rainResults?.length || gameOver || absoluteMinutes(game) < (game.nextRainAt ?? Infinity)) return
    const rain = createRain(absoluteMinutes(game))
    // Keep the inter-episode deadline across midnight even after a cloudy day
    // uses its allowance. The daily counter blocks another episode today.
    const nextRainAt = rain.end + 180 + Math.floor(Math.random() * 301)
    setGame(previous => previous.rain || previous.rainResults?.length || (previous.rainStartsToday ?? 0) >= rainDailyLimit(previous.day) ? previous
      : { ...previous, rain, nextRainAt, rainStartsToday: (previous.rainStartsToday ?? 0) + 1 })
  }, [game.day, game.minutes, game.rainSystemStarted, game.rainScheduleDay, game.rainStartsToday, game.rain, game.rainResults, game.nextRainAt, gameOver])
  useEffect(() => {
    const eligible = !!game.rain && !game.rain.choice && currentExposure === 'outside' && !sleeping && !gameOver
    setRainChoice(eligible)
  }, [game.rain, currentExposure, sleeping, gameOver])
  function respondToRain(choice: RainChoice) {
    if (!game.rain || game.rain.choice) return
    const rain = chooseRain(game.rain, choice, absoluteMinutes(game), currentId)
    setRainChoice(false)
    setGame(previous => previous.rain?.id === rain.id && !previous.rain.choice ? { ...previous, rain } : previous)
  }

  function findProperShelter() {
    if (!game.rain) return
    const rain = chooseRain(game.rain, 'proper', absoluteMinutes(game), currentId)
    setGame(previous => previous.rain?.id === rain.id ? { ...previous, rain: { ...rain, choiceAt: previous.rain.choiceAt } } : previous)
  }
  function continueInRain() {
    setGame(previous => previous.rain ? { ...previous, rain: { ...previous.rain, choice: 'continue', searchRemaining: 0 } } : previous)
  }
  return { respondToRain, findProperShelter, continueInRain }
}
export function useRainResults(context: { game: GameState; effects: ActiveEffect[]; blocked: boolean }, host: {
  setGame: GameSetter; setEffects: Setter<ActiveEffect[]>; setInfoModal: Setter<ResultCardData | null>; setEventResultOpen: Setter<boolean>; setJournalEntries: Setter<JournalEntry[]>; resultSnapshot: () => ResultSnapshot
}) {
  const { game, effects, blocked } = context
  const { setGame, setEffects, setInfoModal, setEventResultOpen, setJournalEntries, resultSnapshot } = host
  const lastReported = useRef<GameState['rain']>(undefined)
  useEffect(() => {
    const rain = game.rainResults?.[0]
    if (!rain || blocked) return
    const granted = rain.coldGranted ?? (!!rain.cold && !effects.some(effect => effect.id === 'cold' && effect.expiresAt > absoluteMinutes(game)))
    const newlyReported = !rain.reported && lastReported.current !== rain
    if (newlyReported) {
      lastReported.current = rain
      if (granted) setEffects(previous => [...previous.filter(effect => effect.id !== 'cold'), { id: 'cold', expiresAt: absoluteMinutes(game) + 2 * 1440 }])
      setGame(previous => ({ ...previous, rainResults: previous.rainResults?.map(item => item.id === rain.id ? { ...item, reported: true, coldGranted: granted } : item) }))
    }
    const title = rain.choice === 'proper' && rain.searchRemaining > 0 ? 'The rain has stopped' : rain.choice === 'continue' ? 'The rain has passed' : 'Shelter from the rain'
    const text = rainResultText(rain) + (granted ? ' A chill lingers, and your throat feels sore. You have caught a cold.' : '')
    const after = resultSnapshot()
    const before = { ...after, game: { ...game, energy: Math.min(100, game.energy + rain.energyLoss), mood: Math.min(100, game.mood + rain.moodLoss) } }
    const summary = summarizeResult(before, after, false)
    if (rain.choice === 'continue') {
      // Background costs may already have been offset by eating/resting. Report
      // the recorded rain totals, without fabricating a before/after stat meter.
      summary.changes = []
      for (const [id, loss] of [['energy', rain.energyLoss], ['mood', rain.moodLoss]] as const) {
        const amount = Number(loss.toFixed(1))
        if (amount > 0) summary.changes.push({ id, amount: -amount, label: resultResourceLabel(id), value: `−${amount}`, kind: 'negative' })
      }
    }
    // Only the rain's own losses belong here. Purchases, food, recovery and
    // ordinary passive costs during a background episode are unrelated.
    if (rain.choice !== 'continue' && rain.waited > 0) summary.costs.push({ id: 'time', amount: Math.round(rain.waited), label: resultResourceLabel('time'), value: t('format.minutes', { minutes: Math.round(rain.waited) }), kind: 'neutral' })
    if (granted) summary.changes.push({ id: 'cold', effectTransition: 'started', label: resultResourceLabel('cold'), value: t('result.effectStarted'), kind: 'negative' })
    const illustration = rain.choice === 'proper' && rain.searchRemaining > 0
      ? '/street-life-game/assets/event-rain-stopped-search.webp'
      : rainArt(rain, rain.choice ?? 'continue')
    setInfoModal({ title, text, label: 'AFTER THE RAIN', illustration, illustrationAlt: text, visibleStats: ['energy', 'mood'], rainResultId: rain.id, ...summary })
    setEventResultOpen(true)
    if (newlyReported) {
      const actionId = rain.choice === 'proper' && rain.searchRemaining > 0 ? 'rain-stopped' : rain.choice === 'continue' ? 'rain-passed' : 'rain-cover'
      const entry: JournalEntry = { day: game.day, minute: game.minutes, title, text, actionId, decisionId: actionId, groupId: JSON.stringify([actionId,rain.level,rain.choice ?? 'continue',granted]), actionTitle: title, reflection: true }
      setJournalEntries(previous => [...previous,entry].slice(-500))
    }
  }, [game, effects, blocked])

}
