import { t, type MessageKey } from './i18n'

const phaseKeys = {
  "walking": "travel.phase.walking",
  "approachingCrossing": "travel.phase.approachingCrossing",
  "waitingForGreen": "travel.phase.waitingForGreen",
  "crossingRoad": "travel.phase.crossingRoad",
  "walkingOn": "travel.phase.walkingOn",
  "toStop": "travel.phase.toStop",
  "waiting": "travel.phase.waiting",
  "riding": "travel.phase.riding",
  "toDestination": "travel.phase.toDestination"
} as const satisfies Record<string, MessageKey>
export const travelPhaseLabel = (id: string) => t(phaseKeys[id as keyof typeof phaseKeys])
