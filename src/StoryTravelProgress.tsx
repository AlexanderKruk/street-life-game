import { ActivityCancel } from './ActivityDialog'
import { memo } from 'react'

/** Only the current phase is transient; the route and actual result are archived. */
export default memo(function StoryTravelProgress({ phaseId, text, onCancel }: { phaseId: string; text: string; onCancel: () => void }) {
  return <div className="story-travel-progress">
    <p role="status"><span key={phaseId} className="story-travel-phase">{text}</span><span className="story-process-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></p>
    <ActivityCancel onClick={onCancel} />
  </div>
})
