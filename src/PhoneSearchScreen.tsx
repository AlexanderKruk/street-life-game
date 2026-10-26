import { t } from './i18n'
import ChoiceButton from './ChoiceButton'
import type { IconName } from './Icon'
import { PHONE_SEARCH_ESTIMATE } from './phoneQuestions'

type Props = { serviceActive: boolean; answeredQuestions: string[]; battery: number; phoneSearchCost: number; onOpenNotes: () => void; onSearch: (id: string) => void }
export default function PhoneSearchScreen({ serviceActive, answeredQuestions, battery, phoneSearchCost, onOpenNotes, onSearch }: Props) {
  return <>
        <p className="phone-section-label">{t('phone.search.label')}</p>
        <div className="phone-search-list">
          {([
            { id: 'bed', title: t('phone.search.bed.title'), detail: t('phone.search.bed.detail'), icon: 'bed' },
            { id: 'morning', title: t('phone.search.morning.title'), detail: t('phone.search.morning.detail'), icon: 'shower' },
            { id: 'work', title: t('phone.search.work.title'), detail: t('phone.search.work.detail'), icon: 'work' },
            { id: 'clinic', title: t('phone.search.clinic.title'), detail: t('phone.search.clinic.detail'), icon: 'hospital' },
            { id: 'supplies', title: t('phone.search.supplies.title'), detail: t('phone.search.supplies.detail'), icon: 'food' },
          ] as { id: string; title: string; detail: string; icon: IconName }[]).map(search => {
            const saved = search.id !== 'morning' && answeredQuestions.includes(search.id)
            return <ChoiceButton className="phone-search-row" type="button" key={search.id} aria-label={search.title} data-choice={`question-${search.id}`} disabled={!serviceActive || (!saved && battery < phoneSearchCost)} onClick={() => saved ? onOpenNotes() : onSearch(search.id)}
              icon={search.icon} label={search.title} detail={<small className="choice-description">{search.detail}</small>} duration={saved ? t('phone.search.saved') : undefined} estimate={saved ? undefined : { minutes: PHONE_SEARCH_ESTIMATE }} />
          })}
        </div>
        <p className={`phone-search-hint${!serviceActive ? ' warning' : ''}`}>{!serviceActive ? t('phone.search.unpaid') : battery < phoneSearchCost ? t('phone.search.lowBattery') : t('phone.search.hint')}</p>
      </>
}
