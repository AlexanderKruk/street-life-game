import { t } from './i18n'
import { Icon } from './Icon'
import { JournalTimeline } from './JournalSections'
import type { JournalEntry } from './journal'
import { weekdayLabel } from './hudPresentation'
import { displayDay } from './gameDate'

type Props = { journalDay: number; today: number; entries: JournalEntry[]; onDayChange: (day: number | null) => void }
export default function PhoneHistoryScreen({ journalDay, today, entries, onDayChange }: Props) {
  return <section className="journal-history" aria-labelledby="journal-day-heading">
        <div className="journal-day-switch" role="group" aria-label={t('journal.ui.dayGroup')}>
          <button type="button" aria-label={t('journal.ui.previousDay')} disabled={journalDay <= 1} onClick={() => onDayChange(journalDay - 1)}><Icon name="chevron-left" /></button>
          <h3 id="journal-day-heading" aria-live="polite">{t('journal.ui.dayHeading', { day: displayDay(journalDay), weekday: weekdayLabel(journalDay) })}</h3>
          <button type="button" aria-label={t('journal.ui.nextDay')} disabled={journalDay >= today} onClick={() => onDayChange(journalDay + 1 === today ? null : journalDay + 1)}><Icon name="chevron-right" /></button>
        </div>
        <JournalTimeline entries={entries} day={journalDay} today={journalDay === today} />
      </section>
}
