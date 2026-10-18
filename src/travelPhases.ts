type TravelProgress = { mode: 'walk' | 'transit' | 'fare-dodge'; total: number; remaining: number }
type TravelPhase = { label: string; walking: boolean; exposure: 'outside' | 'cover' | 'transit' }

const walking: TravelPhase = { label: 'Walking', walking: true, exposure: 'outside' }
const toStop: TravelPhase = { label: 'Walking to the stop', walking: true, exposure: 'outside' }
const waiting: TravelPhase = { label: 'Waiting for the bus', walking: false, exposure: 'cover' }
const riding: TravelPhase = { label: 'Riding the bus', walking: false, exposure: 'transit' }
const toDestination: TravelPhase = { label: 'Walking to your destination', walking: true, exposure: 'outside' }

// Text and weather effects use the same saved trip progress and boundaries.
export function getTravelPhase(trip: TravelProgress): TravelPhase {
  if (trip.mode === 'walk') return walking
  const elapsed = Math.max(0, trip.total - trip.remaining)
  if (elapsed < Math.max(1, Math.round(trip.total * 0.2))) return toStop
  if (elapsed < Math.max(2, Math.round(trip.total * 0.55))) return waiting
  if (elapsed < Math.max(3, Math.round(trip.total * 0.85))) return riding
  return toDestination
}
