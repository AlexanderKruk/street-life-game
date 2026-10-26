import type { ActionHistoryFacts } from './actionHistory'
import type { InventoryHistoryFacts } from './inventoryHistory'
import type { EventHistoryFacts } from './eventHistory'
export const RESULT_ACTION_IDS = ['sleep-start', 'sleep-complete', 'shelter-checkout', 'shelter-registration', 'shelter-extension', 'music-walk', 'city-walk', 'ask-money', 'find-bench', 'bench-rest', 'medical-appointment', 'emergency-care', 'trash-search', 'social-support', 'day-work', 'phone-collect', 'phone-charging', 'phone-charge', 'call-interrupted', 'search-interrupted', 'mobile-service', 'arrival', 'journey-stopped', 'rain-cover', 'rain-passed', 'rain-stopped', 'closing-time', 'event-result', 'item-stolen', 'caught-stealing', 'use-medicine', 'smoke', 'return-containers', 'store-belongings', 'collect-belongings', 'store-food', 'collect-food'] as const
export type ResultActionId = typeof RESULT_ACTION_IDS[number] | `location:${string}` | `event:${string}` | `call:${string}` | `question:${string}` | `buy:${string}` | `use:${string}`
export type ResultAction = { id: ResultActionId; title: string; eventHistory?: EventHistoryFacts; inventoryHistory?: InventoryHistoryFacts; actionHistory?: ActionHistoryFacts }

export function validResultActionId(value: unknown): value is ResultActionId {
  return typeof value === 'string' && ((RESULT_ACTION_IDS as readonly string[]).includes(value) || /^(location|event|call|question|buy|use):[\w-]+$/.test(value))
}

export function resultActionAllowed(id: ResultActionId, context: { sleepChoice: boolean; shelterQueue: boolean; shelterDeparture: boolean; shelterCheckoutDue: boolean; activeEvent: boolean; diceCheck: boolean; shelterInterview: boolean }) {
  if (context.sleepChoice && id !== 'sleep-start') return false
  if (context.shelterQueue && id !== 'shelter-registration') return false
  if (context.shelterDeparture && id !== 'shelter-checkout') return false
  return !(context.shelterCheckoutDue && !context.activeEvent && !context.diceCheck && !context.shelterInterview && id !== 'sleep-complete' && id !== 'search-interrupted')
}
