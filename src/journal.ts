import type { ResultActionId } from './resultActions'
export type JournalEntry = {
  day: number
  minute: number
  title: string
  text: string
  actionTitle: string
  actionId?: ResultActionId
  outcomeId?: string
  decisionId?: string
  groupId?: string
  reflection: true
}

export { loadJournalEntries, legacyJournalReflection as journalReflection } from './legacyJournalCompatibility'
