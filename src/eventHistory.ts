import { t, type MessageKey } from './i18n'
import { eventHistoryDefinitions, type EventHistoryOutcomeId } from './eventHistoryDefinitions'
import { resultChangeId } from './legacyResultCompatibility'
import type { ResultSummary } from './results'
export type EventHistoryFacts = {
  outcomeId: EventHistoryOutcomeId
  suppliesRejected: boolean
  documents: 'carried' | 'stored' | 'missing'
}
export function eventHistoryReflection(facts: EventHistoryFacts, summary?: ResultSummary) {
  const definition = eventHistoryDefinitions[facts.outcomeId]
  const rows = [...(summary?.costs ?? []), ...(summary?.changes ?? [])]
  const changed = (id: string, kind: string) => rows.some(row => resultChangeId(row) === id && row.kind === kind)
  let key: Extract<MessageKey, `history.event.${string}`> = definition.textKey
  if (definition.eventId === 'spare-change' || definition.eventId === 'dropped-glove') key = changed('mood', 'negative') || changed('health', 'negative') ? 'history.event.generic.negative' : changed('mood', 'positive') ? 'history.event.generic.positive' : 'history.event.generic.empty'
  if (definition.eventId === 'phone-drop') key = changed('phoneCondition', 'negative') ? 'history.event.special.phone-damaged' : 'history.event.special.phone-caught'
  if (facts.suppliesRejected) {
    if (definition.eventId === 'first-night-door') key = 'history.event.special.supplies-full'
    if (definition.eventId === 'free-snack' || definition.eventId === 'station-food') key = 'history.event.special.food-declined'
  }
  if (definition.eventId === 'street-patrol-wake' || definition.eventId === 'station-patrol-wake') {
    if (facts.documents === 'stored') key = 'history.event.special.documents-stored'
    if (facts.documents === 'missing') key = 'history.event.special.documents-missing'
  }
  return { title: t(definition.titleKey), text: t(key) }
}
