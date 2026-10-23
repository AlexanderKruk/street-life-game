import { memo, useId, useMemo, useState } from 'react'
import { Icon } from './Icon'
import { formatTime } from './game'
import type { JournalEntry } from './journal'
import { displayDay } from './gameDate'

export type JournalGoal = { id: string; title: string; description: string }
type GoalsProps = { pending: JournalGoal[]; completed: JournalGoal[] }

export const JournalGoals = memo(function JournalGoals({ pending, completed }: GoalsProps) {
  return <section className="journal-goals" aria-labelledby="journal-goals-heading">
    <div className="journal-section-title"><h3 id="journal-goals-heading">Goals</h3><span aria-label={`${pending.length} incomplete goals`}>{pending.length}</span></div>
    <ul className="goal-list" aria-label="Goals ordered by priority">
      {pending.map((goal, index) => <li className={index === 0 ? 'goal main-goal' : 'goal'} key={goal.id}>
        <span className="goal-marker" aria-label={index === 0 ? 'Main goal, not completed' : 'Not completed'} /><div><strong>{goal.title}</strong><small>{goal.description}</small></div>
      </li>)}
    </ul>
    {!pending.length && <p className="empty">All starting goals completed.</p>}
    {!!completed.length && <details className="completed-goals">
      <summary><h3>Completed</h3><span aria-label={`${completed.length} completed goals`}>{completed.length}</span><Icon name="chevron-down" /></summary>
      <ul className="goal-list" aria-label="Completed goals">
        {completed.map(goal => <li className="goal done" key={goal.id}>
          <span className="goal-marker" aria-label="Completed"><Icon name="check" /></span><div><strong>{goal.title}</strong><small>{goal.description}</small></div>
        </li>)}
      </ul>
    </details>}
  </section>
})

type TimelineProps = { entries: JournalEntry[]; day: number; today: boolean }
type TimelineEntry = JournalEntry & { count: number }
export const JournalTimeline = memo(function JournalTimeline({ entries, day, today }: TimelineProps) {
  const dayEntries = useMemo(() => {
    const groups: TimelineEntry[] = []
    for (const entry of entries) {
      if (entry.day !== day) continue
      const previous = groups.at(-1)
      if (previous && previous.actionTitle === entry.actionTitle && previous.title === entry.title && previous.text === entry.text) {
        previous.count++
      } else {
        // Copy the first occurrence to retain its time without changing saved records.
        groups.push({ ...entry, count: 1 })
      }
    }
    return groups.reverse()
  }, [entries, day])
  // A new selected day starts with its latest entries; ordinary ticks do not reset reading.
  return <DayTimeline key={day} entries={dayEntries} day={day} today={today} />
})

const HISTORY_BATCH_SIZE = 30
function DayTimeline({ entries, day, today }: Omit<TimelineProps, 'entries'> & { entries: TimelineEntry[] }) {
  const [limit, setLimit] = useState(HISTORY_BATCH_SIZE)
  const listId = useId()
  const visible = entries.slice(0, limit)
  return <>
    <ol id={listId} className="timeline" aria-label={`Day ${displayDay(day)} history`}>
      {visible.map((entry, index) => <li className="timeline-entry" key={`${entry.day}-${entry.minute}-${index}`}>
        <time dateTime={formatTime(entry.minute)}>{formatTime(entry.minute)}</time><span className="timeline-marker" aria-hidden="true" />
        <div><strong>{entry.title}{entry.count > 1 && ` ×${entry.count}`}</strong>{entry.text && <p className="journal-thought">{entry.text}</p>}</div>
      </li>)}
    </ol>
    {!visible.length && <p className="empty">{today ? 'No recorded actions today yet.' : 'No recorded actions on this day.'}</p>}
    {entries.length > HISTORY_BATCH_SIZE && <div className="journal-load-more">
      {visible.length < entries.length && <button type="button" aria-controls={listId} onClick={() => setLimit(previous => Math.min(previous + HISTORY_BATCH_SIZE, entries.length))}>
        <Icon name="chevron-down" />Show older entries
      </button>}
      <p role="status">Showing {visible.length} of {entries.length} entries</p>
    </div>}
  </>
}
