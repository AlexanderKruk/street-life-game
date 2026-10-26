import { trashSearchMinutes } from '../src/trashSearchRules'
export { trashSearchMinutes } from '../src/trashSearchRules'
import { useEffect, useState } from 'react'
import { Icon } from '../src/Icon'

export default function TrashSearchTime({ startedAt, onDeadline }: { startedAt: number; onDeadline: () => void }) {
  const [minutes, setMinutes] = useState(() => trashSearchMinutes(startedAt))
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMinutes(trashSearchMinutes(startedAt))
      onDeadline()
    }, 250)
    return () => window.clearInterval(timer)
  }, [startedAt, onDeadline])
  return <span aria-label={`Search time: ${minutes} minutes`}><Icon name="clock" />{minutes} min</span>
}
