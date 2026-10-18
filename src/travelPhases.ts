type TravelProgress = { mode: 'walk' | 'transit' | 'fare-dodge'; total: number; remaining: number }
type TravelPhase = { label: string; walking: boolean; exposure: 'outside' | 'cover' | 'transit' }

const walking: TravelPhase = { label: 'Walking', walking: true, exposure: 'outside' }
const approachingCrossing: TravelPhase = { label: 'Approaching a junction', walking: true, exposure: 'outside' }
const waitingForGreen: TravelPhase = { label: 'Waiting for the green light', walking: false, exposure: 'outside' }
const crossingRoad: TravelPhase = { label: 'Crossing the road', walking: true, exposure: 'outside' }
const walkingOn: TravelPhase = { label: 'Walking on', walking: true, exposure: 'outside' }
const toStop: TravelPhase = { label: 'Walking to the stop', walking: true, exposure: 'outside' }
const waiting: TravelPhase = { label: 'Waiting for the bus', walking: false, exposure: 'cover' }
const riding: TravelPhase = { label: 'Riding the bus', walking: false, exposure: 'transit' }
const toDestination: TravelPhase = { label: 'Walking to your destination', walking: true, exposure: 'outside' }

// Text and weather effects use the same saved trip progress and boundaries.
export function getTravelPhase(trip: TravelProgress): TravelPhase {
  const elapsed = Math.max(0, trip.total - trip.remaining)
  if (trip.mode === 'walk') {
    const blockMinutes = Math.min(12, trip.total)
    if (blockMinutes < 5) return walking
    const position = elapsed % blockMinutes
    if (position < blockMinutes - 4) return walking
    if (position < blockMinutes - 3) return approachingCrossing
    if (position < blockMinutes - 2) return waitingForGreen
    if (position < blockMinutes - 1) return crossingRoad
    return walkingOn
  }
  if (elapsed < Math.max(1, Math.round(trip.total * 0.2))) return toStop
  if (elapsed < Math.max(2, Math.round(trip.total * 0.55))) return waiting
  if (elapsed < Math.max(3, Math.round(trip.total * 0.85))) return riding
  return toDestination
}
