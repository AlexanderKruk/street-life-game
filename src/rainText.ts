import { t } from './i18n'
import type { RainEpisode, RainLevel, rainResultActionId } from './rain'

export const rainOpening = (level: RainLevel) => ({ title: t(`rain.opening.${level}.title`), text: t(`rain.opening.${level}.text`) })
export function rainWaitingText(rain: RainEpisode) {
  return t(rain.choice === 'proper' ? rain.searchRemaining > 0 ? 'rain.wait.searching' : 'rain.wait.passage'
    : rain.shelter === 'tree' ? 'rain.wait.tree' : 'rain.wait.awning')
}
export function rainWaitingAlt(rain: RainEpisode) {
  return t(rain.choice === 'proper' ? 'rain.wait.passageAlt' : rain.shelter === 'tree' ? 'rain.wait.treeAlt' : 'rain.wait.awningAlt')
}
export function rainResultText(rain: RainEpisode, newlyCold = false) {
  const outcome = rain.choice === 'proper' && rain.searchRemaining > 0 ? 'stoppedSearch' : rain.choice ?? 'continue'
  return t(`rain.result.${rain.level}.${outcome}${newlyCold ? '.cold' : ''}`)
}
export function rainResultTitle(actionId: ReturnType<typeof rainResultActionId>) {
  return t(actionId === 'rain-stopped' ? 'rain.result.title.stopped' : actionId === 'rain-passed' ? 'rain.result.title.passed' : 'rain.result.title.cover')
}

export function rainHistoryText(rain: RainEpisode, newlyCold = false) {
  const outcome = rain.choice === 'proper' && rain.searchRemaining > 0 ? 'stoppedSearch' : rain.choice ?? 'continue'
  return t(`rain.history.${outcome}${newlyCold ? '.cold' : ''}`)
}
