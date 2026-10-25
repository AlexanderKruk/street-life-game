import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createAutosave, type SaveSnapshot } from './autosave'

import { RAW_SAVE_KEYS } from './saveKeys'

export function useGameAutosave(snapshot: SaveSnapshot, ready: boolean, critical: unknown[]) {
  const [saveFailed, setSaveFailed] = useState(false)
  const failed = useRef(false)
  const [saver] = useState(() => createAutosave(window.localStorage, {
    encode: (key, value) => value === null ? null : RAW_SAVE_KEYS.has(key) ? String(value) : JSON.stringify(value),
    onResult: success => {
      if (failed.current === !success) return
      failed.current = !success
      setSaveFailed(!success)
    },
  }))
  const urgent = useRef(false)
  const previousCritical = useRef<unknown[] | null>(null)

  // Never publish a game tick before inventory aging and action results have settled.
  useLayoutEffect(() => {
    if (!ready) return
    const milestone = !previousCritical.current || critical.some((value, index) => !Object.is(value, previousCritical.current?.[index]))
    previousCritical.current = critical
    saver.stage(snapshot, urgent.current || milestone)
    urgent.current = false
  })

  useEffect(() => {
    const interaction = () => { urgent.current = true }
    const hidden = () => { if (document.visibilityState !== 'visible') saver.flush() }
    const flush = () => { saver.flush() }
    window.addEventListener('click', interaction, true)
    window.addEventListener('change', interaction, true)
    window.addEventListener('keydown', interaction, true)
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    const timer = window.setInterval(() => saver.checkpoint(), 1000)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('click', interaction, true)
      window.removeEventListener('change', interaction, true)
      window.removeEventListener('keydown', interaction, true)
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      saver.flush()
    }
  }, [saver])

  const resetPending = useCallback(() => {
    saver.clear()
    previousCritical.current = null
    urgent.current = true
    if (failed.current) { failed.current = false; setSaveFailed(false) }
  }, [saver])
  return { resetPending, saveFailed }
}
