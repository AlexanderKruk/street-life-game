import { memo } from 'react'
import { Icon } from './Icon'

type Props = { housing: string; employment: string; income: string; documents: string }
export default memo(function LifeSituation({ housing, employment, income, documents }: Props) {
  return <>
    <div className="life-heading"><h3>Life situation</h3></div>
    <div className="life-situation">
      <div className="life-card"><Icon name="house" /><span>Housing</span><strong>{housing}</strong></div>
      <div className="life-card"><Icon name="work" /><span>Employment</span><strong>{employment}</strong></div>
      <div className="life-card"><Icon name="banknote" /><span>Income</span><strong>{income}</strong></div>
      <div className="life-card"><Icon name="documents" /><span>Documents</span><strong>{documents}</strong></div>
    </div>
  </>
})
