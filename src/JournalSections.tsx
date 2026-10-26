import { t } from './i18n'
import { groupJournalEntries, type TimelineEntry } from './journalIdentity'
import { memo, useId, useMemo, useState } from 'react'
import { Icon } from './Icon'
import { formatTime } from './game'
import type { JournalEntry } from './journal'
import { displayDay } from './gameDate'

export type JournalGoal = { id: string; title: string; description: string }
type GoalsProps = { pending: JournalGoal[]; completed: JournalGoal[] }

export const JournalGoals = memo(function JournalGoals({ pending, completed }: GoalsProps) {
  return <section className="journal-goals" aria-label={t('journal.ui.goals')}>
    <ul className="goal-list" aria-label={t('journal.ui.priority')}>
      {pending.map((goal, index) => <li className={index === 0 ? 'goal main-goal' : 'goal'} key={goal.id}>
        <span className="goal-marker" aria-label={t(index === 0 ? 'journal.ui.mainPending' : 'journal.ui.pending')} /><div><strong>{goal.title}</strong><small>{goal.description}</small></div>
      </li>)}
    </ul>
    {!pending.length && <p className="empty">{t('journal.ui.allDone')}</p>}
    {!!completed.length && <details className="completed-goals">
      <summary><h3>{t('journal.ui.completed')}</h3><span aria-label={t('journal.ui.completedCount', { count: completed.length })}>{completed.length}</span><Icon name="chevron-down" /></summary>
      <ul className="goal-list" aria-label={t('journal.ui.completedList')}>
        {completed.map(goal => <li className="goal done" key={goal.id}>
          <span className="goal-marker" aria-label={t('journal.ui.completed')}><Icon name="check" /></span><div><strong>{goal.title}</strong><small>{goal.description}</small></div>
        </li>)}
      </ul>
    </details>}
  </section>
})

type TimelineProps = { entries: JournalEntry[]; day: number; today: boolean }
export const JournalTimeline = memo(function JournalTimeline({ entries, day, today }: TimelineProps) {
  const dayEntries = useMemo(() => groupJournalEntries(entries, day), [entries, day])
  // A new selected day starts with its latest entries; ordinary ticks do not reset reading.
  return <DayTimeline key={day} entries={dayEntries} day={day} today={today} />
})

const HISTORY_BATCH_SIZE = 30
function DayTimeline({ entries, day, today }: Omit<TimelineProps, 'entries'> & { entries: TimelineEntry[] }) {
  const [limit, setLimit] = useState(HISTORY_BATCH_SIZE)
  const listId = useId()
  const visible = entries.slice(0, limit)
  return <>
    <ol id={listId} className="timeline" aria-label={t('journal.ui.dayHistory', { day: displayDay(day) })}>
      {visible.map((entry, index) => <li className="timeline-entry" key={`${entry.day}-${entry.minute}-${index}`}>
        <time dateTime={formatTime(entry.minute)}>{formatTime(entry.minute)}</time><span className="timeline-marker" aria-hidden="true" />
        <div><strong>{entry.title}{entry.count > 1 && ` ×${entry.count}`}</strong>{entry.text && <p className="journal-thought">{entry.text}</p>}</div>
      </li>)}
    </ol>
    {!visible.length && <p className="empty">{t(today ? 'journal.ui.emptyToday' : 'journal.ui.emptyDay')}</p>}
    {entries.length > HISTORY_BATCH_SIZE && <div className="journal-load-more">
      {visible.length < entries.length && <button type="button" aria-controls={listId} onClick={() => setLimit(previous => Math.min(previous + HISTORY_BATCH_SIZE, entries.length))}>
        <Icon name="chevron-down" />{t('journal.ui.older')}
      </button>}
      <p role="status">{t('journal.ui.showing', { visible: visible.length, total: entries.length })}</p>
    </div>}
  </>
}
