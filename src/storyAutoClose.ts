export const STORY_QUICK_RESULT_PAUSE_MS = 1000
export const STORY_QUICK_RESULT_FADE_MS = 200
type TimerHost = { setTimeout: (callback: () => void, delay: number) => number; clearTimeout: (id: number) => void }

/** Presentation only. Called after the entire result, including effects, settles. */
export function scheduleStoryClose(host: TimerHost, fade: () => void, close: () => void, reduced = false) {
  let cancelled = false, finish = 0
  const hold = host.setTimeout(() => {
    if (cancelled) return
    fade()
    finish = host.setTimeout(() => { if (!cancelled) close() }, reduced ? 0 : STORY_QUICK_RESULT_FADE_MS)
  }, STORY_QUICK_RESULT_PAUSE_MS)
  return () => { cancelled = true; host.clearTimeout(hold); host.clearTimeout(finish) }
}
