export type SaveSnapshot = Record<string, unknown>
type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function createAutosave(storage: SaveStorage, options: {
  now?: () => number; delay?: number; encode?: (key: string, value: unknown) => string | null
  onResult?: (success: boolean) => void
} = {}) {
  const now = options.now ?? Date.now
  const delay = options.delay ?? 5000
  const encode = options.encode ?? ((_key, value) => value === null ? null : JSON.stringify(value))
  const savedValues = new Map<string, unknown>()
  const savedText = new Map<string, string | null>()
  let latest: SaveSnapshot | null = null, dirty = false, lastFlush = now()

  function flush() {
    if (!latest || !dirty) return true
    let success = true
    for (const [key, value] of Object.entries(latest)) {
      if (value === undefined || savedValues.has(key) && Object.is(savedValues.get(key), value)) continue
      try {
        const text = encode(key, value)
        const previous = savedText.has(key) ? savedText.get(key) : storage.getItem(key)
        if (text !== previous) {
          if (text === null) storage.removeItem(key)
          else storage.setItem(key, text)
        }
        savedValues.set(key, value)
        savedText.set(key, text)
      } catch { success = false }
    }
    dirty = !success
    lastFlush = now()
    options.onResult?.(success)
    return success
  }

  return {
    stage(snapshot: SaveSnapshot, urgent = false) {
      latest = { ...snapshot }
      dirty = Object.entries(latest).some(([key, value]) => value !== undefined && (!savedValues.has(key) || !Object.is(savedValues.get(key), value)))
      if (urgent || now() - lastFlush >= delay) flush()
    },
    checkpoint() { if (now() - lastFlush >= delay) flush() },
    flush,
    clear() { latest = null; dirty = false; savedValues.clear(); savedText.clear(); lastFlush = now() },
  }
}
