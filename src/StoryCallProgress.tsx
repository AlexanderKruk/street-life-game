import { Icon } from './Icon'
import { t } from './i18n'

/** Transient process only; the settled answer and its art belong to Story. */
export default function StoryCallProgress({ talking }: { talking: boolean }) {
  return <div className="story-travel-progress">
    <Icon name="phone" className="icon" />
    <p role="status"><span key={String(talking)} className="story-travel-phase">{t(talking ? 'phone.ui.phase.talking' : 'phone.story.waiting')}</span><span className="story-process-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></p>
  </div>
}
