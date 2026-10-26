type TravelProgress = { mode: 'walk' | 'transit' | 'fare-dodge'; total: number; remaining: number }
type TravelPhase = { id: string; walking: boolean; exposure: 'outside' | 'cover' | 'transit' }

const walking: TravelPhase = { id: 'walking', walking: true, exposure: 'outside' }
const approachingCrossing: TravelPhase = { id: 'approachingCrossing', walking: true, exposure: 'outside' }
const waitingForGreen: TravelPhase = { id: 'waitingForGreen', walking: false, exposure: 'outside' }
const crossingRoad: TravelPhase = { id: 'crossingRoad', walking: true, exposure: 'outside' }
const walkingOn: TravelPhase = { id: 'walkingOn', walking: true, exposure: 'outside' }
const toStop: TravelPhase = { id: 'toStop', walking: true, exposure: 'outside' }
const waiting: TravelPhase = { id: 'waiting', walking: false, exposure: 'cover' }
const riding: TravelPhase = { id: 'riding', walking: false, exposure: 'transit' }
const toDestination: TravelPhase = { id: 'toDestination', walking: true, exposure: 'outside' }

function getWalkingStage(trip: TravelProgress): { phase: TravelPhase; minutes: number } {
  const elapsed = Math.max(0, trip.total - trip.remaining)
  if (trip.total < 5) return { phase: walking, minutes: Math.max(1, trip.total) }
  // Spread complete junction sequences across the route; avoid a partial final one.
  const junctions = Math.max(1, Math.floor(trip.total / 30))
  const blockMinutes = Math.floor(trip.total / junctions)
  const block = Math.min(junctions - 1, Math.floor(elapsed / blockMinutes))
  const start = block * blockMinutes
  const end = block === junctions - 1 ? trip.total : start + blockMinutes
  const position = elapsed - start
  const walkingMinutes = end - start - 4
  if (position < walkingMinutes) return { phase: walking, minutes: walkingMinutes }
  if (position < walkingMinutes + 1) return { phase: approachingCrossing, minutes: 1 }
  if (position < walkingMinutes + 2) return { phase: waitingForGreen, minutes: 1 }
  if (position < walkingMinutes + 3) return { phase: crossingRoad, minutes: 1 }
  return { phase: walkingOn, minutes: 1 }
}

// Simulation phases determine physical effort and weather independently of text.
export function getTravelPhase(trip: TravelProgress): TravelPhase {
  const elapsed = Math.max(0, trip.total - trip.remaining)
  if (trip.mode === 'walk') return getWalkingStage(trip).phase
  if (elapsed < Math.max(1, Math.round(trip.total * 0.2))) return toStop
  if (elapsed < Math.max(2, Math.round(trip.total * 0.55))) return waiting
  if (elapsed < Math.max(3, Math.round(trip.total * 0.85))) return riding
  return toDestination
}

// Display labels last at least two seconds of active travel (8 game minutes at ×4).
// Presentation never controls the clock or costs; arrival can end a label early.
export function getTravelDisplayPhase(trip: TravelProgress): TravelPhase {
  if (trip.mode !== 'walk') return getTravelPhase(trip)
  const stages = [
    { phase: walking, minutes: 16 },
    { phase: approachingCrossing, minutes: 8 },
    { phase: waitingForGreen, minutes: 12 },
    { phase: crossingRoad, minutes: 8 },
  ]
  const elapsed = Math.max(0, trip.total - trip.remaining)
  const cycleMinutes = stages.reduce((total, stage) => total + stage.minutes, 0)
  let position = elapsed % cycleMinutes
  for (const stage of stages) {
    if (position < stage.minutes) return elapsed >= cycleMinutes && stage.phase === walking ? walkingOn : stage.phase
    position -= stage.minutes
  }
  return walking
}
