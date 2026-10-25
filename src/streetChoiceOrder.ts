import type { SaveReader } from './saveCompatibility'
export const CHOICE_SEED_KEY = 'street-life-choice-seed-v1'

export function newChoiceSeed(): number {
  return window.crypto?.getRandomValues?.(new Uint32Array(1))?.[0] ?? (Date.now() >>> 0)
}

export function loadChoiceSeed(storage: SaveReader = localStorage): number {
  try {
    const saved = JSON.parse(storage.getItem(CHOICE_SEED_KEY) ?? 'null')
    if (Number.isInteger(saved) && saved >= 0 && saved <= 0xffffffff) return saved
  } catch { /* Older or invalid saves receive a new presentation seed. */ }
  return newChoiceSeed()
}

// A separate seeded generator keeps UI ordering independent of gameplay rolls.
export function shuffleChoiceOrder<T>(items: readonly T[], seed: number, decision: string): T[] {
  let state = seed >>> 0
  for (let i = 0; i < decision.length; i++) state = Math.imul(state ^ decision.charCodeAt(i), 16777619) >>> 0
  function random() {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), state | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
