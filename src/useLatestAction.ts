import { useCallback, useLayoutEffect, useRef } from 'react'

// Stable identity for memoized controls; events always use the committed game state.
export function useLatestAction<Args extends unknown[], Result>(action: (...args: Args) => Result) {
  const latest = useRef(action)
  useLayoutEffect(() => { latest.current = action })
  return useCallback((...args: Args) => latest.current(...args), [])
}
