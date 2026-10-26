import ChoiceButton from './ChoiceButton'
import type { IconName } from './Icon'
import { PHONE_SEARCH_ESTIMATE } from './phoneQuestions'

type Props = { serviceActive: boolean; answeredQuestions: string[]; battery: number; phoneSearchCost: number; onOpenNotes: () => void; onSearch: (id: string) => void }
export default function PhoneSearchScreen({ serviceActive, answeredQuestions, battery, phoneSearchCost, onOpenNotes, onSearch }: Props) {
  return <>
        <p className="phone-section-label">What do you need to find?</p>
        <div className="phone-search-list">
          {([
            { id: 'bed', title: 'Shelter', detail: 'A bed and registration information', icon: 'bed' },
            { id: 'morning', title: 'Help & hygiene', detail: 'Help centres, showers and daytime support', icon: 'shower' },
            { id: 'work', title: 'Work', detail: 'A place offering short shifts', icon: 'work' },
            { id: 'clinic', title: 'Medical help', detail: 'Free basic care without insurance', icon: 'hospital' },
            { id: 'supplies', title: 'Food & water', detail: 'Affordable supplies and meal times', icon: 'food' },
          ] as { id: string; title: string; detail: string; icon: IconName }[]).map(search => {
            const saved = search.id !== 'morning' && answeredQuestions.includes(search.id)
            return <ChoiceButton className="phone-search-row" type="button" key={search.id} aria-label={search.title} data-choice={`question-${search.id}`} disabled={!serviceActive || (!saved && battery < phoneSearchCost)} onClick={() => saved ? onOpenNotes() : onSearch(search.id)}
              icon={search.icon} label={search.title} detail={<small className="choice-description">{search.detail}</small>} duration={saved ? 'Notes' : undefined} estimate={saved ? undefined : { minutes: PHONE_SEARCH_ESTIMATE }} />
          })}
        </div>
        <p className={`phone-search-hint${!serviceActive ? ' warning' : ''}`}>{!serviceActive ? 'Mobile internet is unpaid. Activate the 1 zł/day plan in the header to search.' : battery < phoneSearchCost ? 'Not enough battery to search. Charge your phone first.' : 'Searching uses time and battery.'}</p>
      </>
}
