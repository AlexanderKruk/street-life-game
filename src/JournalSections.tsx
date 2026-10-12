import { memo, useMemo } from 'react'
import { Icon } from './Icon'
import { formatTime } from './game'
import type { JournalEntry } from './journal'

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
export const JournalTimeline = memo(function JournalTimeline({ entries, day, today }: TimelineProps) {
  const visible = useMemo(() => entries.filter(entry => entry.day === day).reverse(), [entries, day])
  return <>
    <ol className="timeline" aria-label={`Day ${day} history`}>
      {visible.map((entry, index) => <li className="timeline-entry" key={`${entry.day}-${entry.minute}-${index}`}>
        <time dateTime={formatTime(entry.minute)}>{formatTime(entry.minute)}</time><span className="timeline-marker" aria-hidden="true" />
        <div><strong>{entry.title}</strong>{entry.text && <p className="journal-thought">{entry.text}</p>}</div>
      </li>)}
    </ol>
    {!visible.length && <p className="empty">{today ? 'No recorded actions today yet.' : 'No recorded actions on this day.'}</p>}
  </>
})
