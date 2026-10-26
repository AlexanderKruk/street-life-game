import { t } from './i18n'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

export default function ClosedContent({ closed, opensAt, children }: { closed: boolean; opensAt: string; children: ReactNode }) {
  return <div className={closed ? 'closed-content is-closed' : 'closed-content'}>
    <div className="closed-content-body" inert={closed || undefined} aria-hidden={closed || undefined}>{children}</div>
    {closed && <section className="closed-content-notice" aria-label={t('location.closedAccessible')} role="status">
      <Icon name="clock" /><h2>{t('location.closed')}</h2><p>{t('location.opensAt', { time: opensAt })}</p>
    </section>}
  </div>
}
