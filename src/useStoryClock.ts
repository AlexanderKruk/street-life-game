import { useEffect, useRef, useState } from 'react'

/** Presentation clock only; never advances the game's time or consequences. */
export function useStoryClock(actual: number | undefined, running: boolean) {
  const [minute, setMinute] = useState(actual)
  const clock = useRef({ minute: actual, elapsed: 0 })
  useEffect(() => {
    if (actual !== undefined && (clock.current.minute === undefined || actual >= clock.current.minute)) {
      clock.current = { minute: actual, elapsed: 0 }
      setMinute(actual)
    }
  }, [actual])
  useEffect(() => {
    if (actual === undefined || !running) return
    let frame = 0, last: number | null = null
    const tick = (now: number) => {
      clock.current.elapsed += last === null ? 0 : Math.min(80, now - last)
      last = now
      if (clock.current.elapsed >= 1000) {
        clock.current.elapsed -= 1000
        clock.current.minute = (clock.current.minute ?? actual) + 1
        setMinute(clock.current.minute)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [actual === undefined, running])
  return minute
}
