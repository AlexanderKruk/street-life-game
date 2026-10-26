import { t } from './i18n'
import { actionHistoryReflection } from './actionHistory'
import { eventHistoryReflection } from './eventHistory'
import { inventoryHistoryReflection } from './inventoryHistory'
import { journalMessageIdentity } from './journalMessageIdentity'
import { journalActionToken, journalActionGroup, legacyDecisionToken, legacySameGroup } from './legacyJournalIdentityCompatibility'
import type { ResultAction } from './resultActions'
import type { ResultSummary } from './results'
import type { JournalEntry } from './journal'

export function journalDecisionKey(entries: readonly JournalEntry[]) {
  const last = entries.at(-1)
  const token = last?.decisionId ? journalActionToken(last.decisionId) : last ? legacyDecisionToken(last) : undefined
  return JSON.stringify([entries.length, last?.day, last?.minute, token])
}

// Record message IDs at their source, never parse rendered copy. Equal historical
// messages have frozen aliases so translation keys alone do not split a group.
export function journalPresentation(action: ResultAction, summary?: ResultSummary, memoryId?: string, translate: typeof t = t) {
  const messages: unknown[] = []
  const record = ((key: string, params?: Record<string,string|number>) => {
    const identity = journalMessageIdentity(key)
    if (key === 'history.action.arrived' && !action.actionHistory?.destinationId) throw new Error('Arrival grouping requires a stable destinationId')
    if (identity !== journalMessageIdentity('history.event.generic.empty')) {
      const parameters = params ? Object.entries(params).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([name,value]) => [name, name === 'item' ? action.id : name === 'place' ? action.actionHistory?.destinationId : value]) : undefined
      messages.push([identity, parameters])
    }
    return (translate as (key: string, params?: Record<string,string|number>) => string)(key,params)
  }) as typeof t
  const reflection = action.inventoryHistory ? inventoryHistoryReflection(action.id,action.inventoryHistory,summary,record)
    : action.eventHistory ? eventHistoryReflection(action.eventHistory,summary,record)
    : actionHistoryReflection(action,summary,memoryId,record)
  const decisionId = action.id === 'question:morning' && action.actionHistory?.noNewInformation ? 'question:morning:exhausted' : action.id
  return { ...reflection, decisionId, groupId: JSON.stringify([journalActionGroup(decisionId),messages]) }
}

export type TimelineEntry = JournalEntry & { count: number }
export function groupJournalEntries(entries: readonly JournalEntry[], day: number): TimelineEntry[] {
  const groups: TimelineEntry[] = []
  let last: JournalEntry | undefined
  for (const entry of entries) {
    if (entry.day !== day) continue
    const previous = groups.at(-1)
    const same = previous && last && (last.groupId && entry.groupId ? last.groupId === entry.groupId : legacySameGroup(last,entry))
    if (same) previous.count++
    else groups.push({ ...entry,count:1 })
    last = entry
  }
  return groups.reverse()
}
