/** Stable per encounter/outcome across reloads; independent of dice and reward RNG. */
export function encounterDuration(base: number | undefined, seed: number, eventId: string, minute: number, outcomeId: string) {
  let hash = seed >>> 0
  for (const character of `duration:${eventId}:${minute}:${outcomeId}`) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619) >>> 0
  const minutes = base && base > 0 ? Math.round(base) : 2
  return Math.max(1, minutes + hash % 3 - 1)
}
