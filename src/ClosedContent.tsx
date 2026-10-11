import type { ReactNode } from 'react'
import { Icon } from './Icon'

export default function ClosedContent({ closed, opensAt, children }: { closed: boolean; opensAt: string; children: ReactNode }) {
  return <div className={closed ? 'closed-content is-closed' : 'closed-content'}>
    <div className="closed-content-body" inert={closed || undefined} aria-hidden={closed || undefined}>{children}</div>
    {closed && <section className="closed-content-notice" aria-label="Location closed" role="status">
      <Icon name="clock" /><h2>Closed</h2><p>Opens at {opensAt}</p>
    </section>}
  </div>
}
