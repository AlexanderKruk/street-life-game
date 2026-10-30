import type { ImpactId } from './effectChips'
import type { StreetEventChoice } from './events'
import type { ResultSnapshot } from './results'
import type { Housing } from './game'
import type { FoodPortionFields } from './foodInventory'

export type Inventory = { clothingCleanliness: number; showerGel: number; bread: number; breadFreshness: number; cannedFood: number; readyMeal: number; readyMealFreshness: number; wipes: number; water: number; food: number; foodFreshness: number; bottles: number; phoneBattery: number; phoneCondition: number; jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean } & FoodPortionFields

export type ShopItem = { id: 'water' | 'food' | 'bread' | 'cannedFood' | 'readyMeal' | 'wipes' | 'showerGel' | 'cigarettes' | 'medicines'; name: string; icon: string; price: number; quantity: number; description: string; impacts: ImpactId[] }

export type BackpackItemId = ShopItem['id'] | 'bottles'

export type EffectId = 'cold' | 'free-transit' | 'well-fed'

export type ActiveEffect = { id: EffectId; expiresAt: number; treated?: boolean }

export type LifeSituation = { shelterEntry?: { night: number; admitted: boolean }; housing: Housing; housingUntil?: number; employment: 'Unemployed' | 'Day work'; income: 'None' | 'Irregular'; schroniskoReferral?: boolean; shelterRegisteredDay?: number; shelterUntilDay?: number; shelterLastStayDay?: number; shelterAuditDay?: number; shelterMisses?: number; shelterMissMonth?: number; shelterStrikes?: number; shelterBlockedUntilDay?: number; shelterRenewals?: number; shelterPlan?: 'jobcenter' | 'daywork' | 'documents' | 'benefits'; shelterDinnerDay?: number; shelterBreakfastDay?: number; shelterLaundryDropDay?: number; shelterVacancyDay?: number; shelterVacancies?: number; shelterRegistrationAttemptDay?: number; shelterCheckoutDay?: number }

export type StoredItems = { documents: boolean; medicines: number; cigarettes: number; food: number; foodFreshness: number } & FoodPortionFields


export type Screen = 'story' | 'location' | 'map' | 'inventory' | 'status' | 'phone' | 'travel'

export type DeferredEncounter = { token: number; locationId: string; trigger: 'location' | 'bench'; elapsedMinutes: number; delayMs: number; remainingMs: number }
export type FirstNightEvents = { seen: string[]; lastAt: number | null; pendingId: string | null; pendingRoll?: number | null; pendingChoiceId?: string; pendingModifier?: number; deferred?: DeferredEncounter }
export type PhoneActivity = { questionId: string; total: number; remaining: number; before: ResultSnapshot; pausedMinutes?: number }
export type JournalGoalId = 'shelter' | 'charge' | 'work' | 'cold'
export type JournalGoals = {
  version: 2
  shelter: boolean; charge: boolean; work: boolean; cold: boolean
  chargeKnown: boolean; workKnown: boolean; coldKnown: boolean
  battery: number
  pendingCompletions?: JournalGoalId[]
}
export type TravelMode = 'walk' | 'transit' | 'fare-dodge'
export type TripInspection = { at: number; status: 'scheduled' | 'rolling' | 'done'; roll?: number | null; modifier?: number }
export type Trip = { destinationId: string; mode: TravelMode; total: number; remaining: number; before?: ResultSnapshot; inspection?: TripInspection; storyEpisodeId?: number }
export type ShelterDeparture = { day: number; startAbsolute: number; before: ResultSnapshot }
export type ShelterArrival = { day: number; minute: number }
export type ShelterQueue = { day: number; remaining: number; total?: number; arrivalMinute?: number; joinedAt: number; vacancies: number; peopleAhead: number; before: ResultSnapshot }
export type SleepState = { kind: 'ground' | 'bench' | 'shelter' | 'residential'; total: number; remaining: number; startAbsolute: number; realStartedAt: number; realWakeAt: number; forced?: boolean; before?: ResultSnapshot }

export type EventDiceState = { choice: StreetEventChoice; roll: number | null; modifier: number; resolved: boolean; stealItemId?: ShopItem['id']; fareDodgeDestinationId?: string; fareDodgeInTransit?: boolean }

export type ShelterInterview = { step: 'reason' | 'action' | 'plan'; reason?: string; action?: string }
