import { t, type MessageKey } from './i18n'
import { actionHistoryDefinitions } from './actionHistoryDefinitions'
import { resultChangeId } from './legacyResultCompatibility'
import type { ResultAction } from './resultActions'
import type { ResultSummary } from './results'
export type ActionHistoryFacts = {
  kind: 'action'
  failed?: boolean
  supportOutcome?: 'needed' | 'restored' | 'referral' | 'transport' | 'benefits' | 'unchanged'
  noNewInformation?: boolean
  sleepIllness?: boolean
  destinationName?: string
  destinationId?: string
}
type Key = Exclude<Extract<MessageKey, `history.action.${string}`>, 'history.action.arrived'>
type Definition = { titleKey: Key; neutral: Key } & Partial<Record<'failed' | 'moodNegative' | 'healthNegative' | 'moodPositive' | 'moneyPositive' | 'bottlesPositive', Key>>
export function actionHistoryReflection(action: ResultAction, summary?: ResultSummary, memoryId?: string, translate: typeof t = t) {
  const facts = action.actionHistory
  const definitions: Partial<Record<string, Definition>> = actionHistoryDefinitions
  const definition: Definition = definitions[action.id] ?? actionHistoryDefinitions['event-result']
  const rows = [...(summary?.costs ?? []), ...(summary?.changes ?? [])]
  const changed = (id: string, kind: string) => rows.some(row => resultChangeId(row) === id && row.kind === kind)
  const moneyBased = action.id === 'ask-money' || action.id === 'trash-search'
  const mode = facts?.failed ? 'failed' : moneyBased
    ? changed('money', 'positive') ? 'moneyPositive' : changed('bottles', 'positive') ? 'bottlesPositive' : 'neutral'
    : changed('mood', 'negative') ? 'moodNegative' : changed('health', 'negative') ? 'healthNegative' : changed('mood', 'positive') ? 'moodPositive' : 'neutral'
  let key = definition[mode] ?? definition.neutral
  let title = definitions[action.id] ? translate(definition.titleKey) : action.title
  if (facts?.sleepIllness) {
    title = translate('history.action.illnessTitle')
    const generic = actionHistoryDefinitions['event-result'] as Definition
    key = generic[mode] ?? generic.neutral
  } else if ((action.id === 'sleep-complete' || action.id === 'sleep-start') && rows.some(row => resultChangeId(row) === 'cold' && row.effectTransition === 'started')) key = 'history.action.coldText'
  if (facts?.noNewInformation) { title = translate('history.action.noNewTitle'); key = 'history.action.noNewText' }
  if (facts?.supportOutcome) key = `history.action.support.${facts.supportOutcome}`
  if (facts?.destinationName !== undefined) title = translate('history.action.arrived', { place: facts.destinationName })
  if (memoryId && ['office-routine','redundancy-savings','unanswered-applications','lost-home'].includes(memoryId)
    && !['sleep-start','sleep-complete','shelter-registration','search-interrupted'].includes(action.id)) key = `history.action.memory.${memoryId}` as Key
  return { title, text: translate(key) }
}
