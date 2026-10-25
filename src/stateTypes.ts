import type { Housing } from './game'
import type { FoodPortionFields } from './foodInventory'

export type Inventory = { clothingCleanliness: number; showerGel: number; bread: number; breadFreshness: number; cannedFood: number; readyMeal: number; readyMealFreshness: number; wipes: number; water: number; food: number; foodFreshness: number; bottles: number; phoneBattery: number; phoneCondition: number; jacket: number; documents: boolean; cigarettes: number; medicines: number; transitCard: boolean } & FoodPortionFields

export type ShopItem = { id: 'water' | 'food' | 'bread' | 'cannedFood' | 'readyMeal' | 'wipes' | 'showerGel' | 'cigarettes' | 'medicines'; name: string; icon: string; price: number; quantity: number; description: string; impacts: string[] }

export type BackpackItemId = ShopItem['id'] | 'bottles'

export type EffectId = 'cold' | 'free-transit' | 'well-fed'

export type ActiveEffect = { id: EffectId; expiresAt: number; treated?: boolean }

export type LifeSituation = { shelterEntry?: { night: number; admitted: boolean }; housing: Housing; housingUntil?: number; employment: 'Unemployed' | 'Day work'; income: 'None' | 'Irregular'; schroniskoReferral?: boolean; shelterRegisteredDay?: number; shelterUntilDay?: number; shelterLastStayDay?: number; shelterAuditDay?: number; shelterMisses?: number; shelterMissMonth?: number; shelterStrikes?: number; shelterBlockedUntilDay?: number; shelterRenewals?: number; shelterPlan?: 'jobcenter' | 'daywork' | 'documents' | 'benefits'; shelterDinnerDay?: number; shelterBreakfastDay?: number; shelterLaundryDropDay?: number; shelterVacancyDay?: number; shelterVacancies?: number; shelterRegistrationAttemptDay?: number; shelterCheckoutDay?: number }

export type StoredItems = { documents: boolean; medicines: number; cigarettes: number; food: number; foodFreshness: number } & FoodPortionFields


export type Screen = 'location' | 'map' | 'inventory' | 'status' | 'phone' | 'travel'
