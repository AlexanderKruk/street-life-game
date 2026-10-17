import { memo } from 'react'
import { conditionBand } from './game'
import { Icon } from './Icon'

export default memo(function MoodIcon({ value }: { value: number }) {
  return <Icon name={`face-${conditionBand(value).level}`} />
})
