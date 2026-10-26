import { t } from './i18n'
import { housingLabel, employmentLabel, incomeLabel, documentStateLabel, type DocumentState } from './statusPresentation'
import type { LifeSituation as Situation } from './stateTypes'
import { memo } from 'react'
import { Icon } from './Icon'

type Props = Pick<Situation, 'housing' | 'employment' | 'income'> & { documents: DocumentState }
export default memo(function LifeSituation({ housing, employment, income, documents }: Props) {
  return <>
    <div className="life-heading"><h3>{t('status.life.title')}</h3></div>
    <div className="life-situation">
      <div className="life-card"><Icon name="house" /><span>{t('status.life.housing')}</span><strong>{housingLabel(housing)}</strong></div>
      <div className="life-card"><Icon name="work" /><span>{t('status.life.employment')}</span><strong>{employmentLabel(employment)}</strong></div>
      <div className="life-card"><Icon name="banknote" /><span>{t('status.life.income')}</span><strong>{incomeLabel(income)}</strong></div>
      <div className="life-card"><Icon name="documents" /><span>{t('status.life.documents')}</span><strong>{documentStateLabel(documents)}</strong></div>
    </div>
  </>
})
