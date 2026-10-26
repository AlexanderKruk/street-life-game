import { formatMoney } from './i18n/formatters'
import { t } from './i18n'
import { applyAction as applyGameAction, moodLimit, type ActionResult, type GameState, type TimeContext } from './game'
import { phoneDrainMultiplier } from './phonePower'
import type { EncounterQueue } from './encounterQueue'
import type { Inventory, SleepState } from './stateTypes'
import type { ResultCardData } from './ResultCard'
import type { ResultSnapshot } from './results'
import type { GameSetter, RunWithResult, Setter } from './controllerTypes'
type Context = {
  game: GameState
  inventory: Inventory
  currentId: string
  activeEvent: boolean
  sleeping: boolean
  trip: boolean
  infoModal: boolean
  musicWalkUsed: boolean
  mobileServiceActive: boolean
  musicOn: boolean
  streetBenchFound: boolean
  begging: { day: number; attempts: number }
}
type Host = {
  setGame: GameSetter
  setInventory: Setter<Inventory>
  setInfoModal: Setter<ResultCardData | null>
  setMessage: Setter<string>
  setBegging: Setter<{ day: number; attempts: number }>
  setMusicWalkUsed: Setter<boolean>
  setRainChoice: Setter<boolean>
  setStreetBenchFound: Setter<boolean>
  moodContext: (state?: GameState) => TimeContext
  resultSnapshot: () => ResultSnapshot
  runWithResult: RunWithResult
  applyAction: (state: GameState, action: ActionResult) => GameState
  requestSleep: (kind: SleepState['kind']) => void
}
export function createStreetController(context: Context, host: Host, queue: EncounterQueue) {
  const { game, inventory, currentId, activeEvent, sleeping, trip, infoModal, musicWalkUsed, mobileServiceActive, musicOn, streetBenchFound, begging } = context
  const { setGame, setInventory, setInfoModal, setMessage, setBegging, setMusicWalkUsed, setRainChoice, setStreetBenchFound, moodContext, resultSnapshot, runWithResult, requestSleep, applyAction } = host
  const { observeFirstNight, observeOrdinaryEvent } = queue
  function askForMoneyImpl() {
    if (activeEvent || currentId !== 'street') return
    const attemptsToday = begging.day === game.day ? begging.attempts : 0
    if (attemptsToday >= 3) {
      setMessage(t("controller.street.beg.exhausted"))
      return
    }
    setBegging({ day: game.day, attempts: attemptsToday + 1 })
    const roll = Math.random()
    const earned = roll < 0.35 ? 0 : roll < 0.65 ? 1 : roll < 0.85 ? 2 : roll < 0.96 ? 3 : 5
    setGame((prev) => applyAction(prev, { minutes: 45, money: earned, energy: -2, mood: earned > 0 ? 1 : -3 }))
    setMessage(earned > 0 ? t('controller.street.beg.earned', { amount: formatMoney(earned, true) }) : t("controller.street.beg.empty"))
    return { kind: 'action' as const, failed: earned === 0 }
  }

  const walkMusicCost = 2 * phoneDrainMultiplier(inventory.phoneCondition)
  const canWalkWithMusic = !musicWalkUsed && mobileServiceActive && inventory.phoneCondition > 0 && inventory.phoneBattery >= walkMusicCost
  function walkCity(withMusic = false) {
    if (currentId !== 'street' || sleeping || trip || activeEvent || infoModal) return
    if (withMusic && !canWalkWithMusic) return
    // The authored music walk has one +3 reward, rather than stacked walking/music bonuses.
    const passiveMusic = !withMusic && musicOn
    const musicText = t("controller.street.music.text")
    const musicIllustration = '/street-life-game/assets/event-music-walk.webp'
    runWithResult({ id: withMusic ? 'music-walk' : 'city-walk', title: withMusic ? t("controller.street.music.title") : t("controller.street.walk.title") }, () => {
      if (withMusic) setMusicWalkUsed(true)
      setRainChoice(false)
      let next = applyGameAction(game, { minutes: 15, energy: -1 }, { ...moodContext(), walking: true, music: passiveMusic })
      next = applyGameAction(next, { minutes: 15, energy: -1, mood: withMusic ? 0 : 2 }, { ...moodContext(next), walking: true, music: passiveMusic })
      if (withMusic) next.mood = Math.min(moodLimit(next, moodContext(next)).cap, next.mood + 3)
      setInventory(previous => ({ ...previous, phoneBattery: Math.max(0, previous.phoneBattery - (withMusic && !musicOn ? walkMusicCost : 0)), clothingCleanliness: Math.max(0, previous.clothingCleanliness - 30 * (10 / 1440)) }))
      setGame(next)
        setMessage(withMusic ? musicText : t("controller.street.walk.text"))
        if (withMusic) setInfoModal({ title: t("controller.street.music.title"), text: musicText, illustration: musicIllustration, illustrationAlt: t("controller.street.music.alt"), batteryInSummary: true })
        if (!observeFirstNight('walk', next)) observeOrdinaryEvent('travel', next, 'walk')
    }, resultSnapshot(), true, true)
  }

  function streetActionImpl(kind: 'find-bench' | 'bench-rest' | 'bench-sleep') {
    if (activeEvent || currentId !== 'street') return
    if (kind === 'find-bench') {
      const found = Math.random() < 0.7
      setGame((prev) => applyGameAction(prev, { minutes: 20, energy: -2, mood: found ? 1 : -2 }, { ...moodContext(prev), exposure: 'outside', music: musicOn }))
      setStreetBenchFound(found)
      setMessage(found ? t("controller.street.bench.found") : t("controller.street.bench.missing"))
      return { kind: 'action' as const, failed: !found }
    }
    if (!streetBenchFound) return
    if (kind === 'bench-rest') {
      const next = applyGameAction(game, { minutes: 45, energy: 18, mood: 2 }, { ...moodContext(), exposure: 'outside', music: musicOn })
      setGame(next)
      setMessage(t("controller.street.bench.restText"))
      if (!observeFirstNight('bench', next)) observeOrdinaryEvent('location', next, undefined, { observation: 'action', elapsedMinutes: 45 })
      return
    }
    requestSleep('bench')
  }

  function askForMoney() { runWithResult({ id: 'ask-money', title: t("controller.street.beg.title") }, askForMoneyImpl) }
  function streetAction(kind: 'find-bench' | 'bench-rest' | 'bench-sleep') { runWithResult({ id: kind === 'find-bench' ? 'find-bench' : 'bench-rest', title: kind === 'find-bench' ? t("action.street.findBench") : t("controller.street.bench.restTitle") }, () => streetActionImpl(kind)) }
  return { walkMusicCost, canWalkWithMusic, walkCity, askForMoney, streetAction }
}
