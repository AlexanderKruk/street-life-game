import { memo } from 'react'
import { Icon } from '../src/Icon'

type SleepHeadingProps = { kind: 'ground' | 'bench' | 'shelter' | 'residential' }
export const SleepHeading = memo(function SleepHeading({ kind }: SleepHeadingProps) {
  return <div className="timed-heading"><Icon name="moon" /><div>
    <p className="eyebrow">SLEEPING</p>
    <h2>{kind === 'ground' ? 'On the ground' : kind === 'bench' ? 'On the bench' : kind === 'shelter' ? 'Night shelter' : 'Schronisko'}</h2>
  </div></div>
})
