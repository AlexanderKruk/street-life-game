import { Icon } from '../src/Icon'
import { JournalTimeline } from './JournalSections-copy'
import type { JournalEntry } from '../src/journal'
import { weekday } from '../src/gameTime'
import { displayDay } from '../src/gameDate'

type Props = { journalDay: number; today: number; entries: JournalEntry[]; onDayChange: (day: number | null) => void }
export default function PhoneHistoryScreen({ journalDay, today, entries, onDayChange }: Props) {
  return <section className="journal-history" aria-labelledby="journal-day-heading">
        <div className="journal-day-switch" role="group" aria-label="Journal day">
          <button type="button" aria-label="Previous day" disabled={journalDay <= 1} onClick={() => onDayChange(journalDay - 1)}><Icon name="chevron-left" /></button>
          <h3 id="journal-day-heading" aria-live="polite">Day {displayDay(journalDay)} · {weekday(journalDay)}</h3>
          <button type="button" aria-label="Next day" disabled={journalDay >= today} onClick={() => onDayChange(journalDay + 1 === today ? null : journalDay + 1)}><Icon name="chevron-right" /></button>
        </div>
        <JournalTimeline entries={entries} day={journalDay} today={journalDay === today} />
      </section>
}
