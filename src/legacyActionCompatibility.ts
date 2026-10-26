import type { ResultActionId } from './resultActions'

// Only old History lacks actionId. New dispatch always supplies it explicitly.
const legacyActions: Record<string, ResultActionId> = {
  'Walk through the city': 'city-walk', 'Walk with music': 'music-walk', 'Rest on the bench': 'bench-rest',
  'Sit and recover': 'location:station-rest', 'Shelter from the rain': 'rain-cover',
  'Where can I get help in the morning?': 'question:morning', Arrival: 'arrival', 'Journey stopped': 'journey-stopped',
  'Closing time': 'closing-time',
}
export function legacyActionId(title: string): ResultActionId | undefined { return Object.hasOwn(legacyActions, title) ? legacyActions[title] : undefined }
