import { useEffect, useMemo, useRef, useState } from 'react'
import { t } from './i18n'
import template from './storyPreview.html?raw'

/** Isolated animation comparison, deliberately independent of the classic run. */
export default function StoryComparison() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(240)
  const document = useMemo(() => {
    const keys = ['nav', 'place', 'intro', 'wait', 'waitSelected', 'waitPending', 'waitResult', 'phone', 'phoneSelected', 'phonePending', 'phoneResult', 'leave', 'leaveSelected', 'leavePending', 'leaveResult', 'search', 'skip', 'choices', 'next', 'walking', 'start', 'replay', 'art'] as const
    const copy = Object.fromEntries(keys.map(key => [key, t(`story.${key}`)]))
    // A translated apostrophe or closing script tag must remain data.
    const json = JSON.stringify(copy).replace(/</g, '\\u003c')
    return template.replace('__STORY_COPY__', json).replace('__STORY_ART__', new URL('assets/event-rain-rain-proper-480.webp', window.document.baseURI).href)
  }, [])
  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'street-life-story-height') return
      const value = event.data.height
      if (typeof value === 'number' && Number.isFinite(value) && value >= 80 && value < 100000) setHeight(Math.ceil(value))
    }
    window.addEventListener('message', resize)
    return () => window.removeEventListener('message', resize)
  }, [])
  return <iframe ref={frame} className="story-preview" title={t('story.nav')} srcDoc={document} style={{ height }} sandbox="allow-scripts" />
}
