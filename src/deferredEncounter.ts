import type { DeferredEncounter } from './stateTypes'

export function encounterDelayMs(random = Math.random) {
  return 5000 + Math.floor(random() * 10001)
}

export function loadDeferredEncounter(raw: unknown, locationId: string): DeferredEncounter | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as DeferredEncounter
  if (!['street', 'station'].includes(value.locationId) || value.locationId !== locationId ||
    !['location', 'bench'].includes(value.trigger) || !Number.isSafeInteger(value.token) || value.token < 1 ||
    !Number.isFinite(value.elapsedMinutes) || value.elapsedMinutes < 0 ||
    !Number.isInteger(value.delayMs) || value.delayMs < 5000 || value.delayMs > 15000 ||
    !Number.isFinite(value.remainingMs) || value.remainingMs < 0 || value.remainingMs > value.delayMs) return undefined
  return { token: value.token, locationId: value.locationId, trigger: value.trigger, elapsedMinutes: value.elapsedMinutes, delayMs: value.delayMs, remainingMs: value.remainingMs }
}
