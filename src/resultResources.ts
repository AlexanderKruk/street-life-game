import { t } from './i18n'

// Domain identities, independent of English wording and translation keys.
export const RESULT_RESOURCES = ['time', 'money', 'hunger', 'thirst', 'energy', 'health', 'hygiene', 'mood', 'intoxication', 'wetness', 'phoneBattery', 'phoneCondition', 'clothingCleanliness', 'jacket', 'water', 'food', 'bottles', 'bread', 'cannedFood', 'readyMeal', 'wipes', 'showerGel', 'cigarettes', 'medicines', 'documents', 'cold', 'free-transit', 'well-fed', 'coldRecovery'] as const
export type ResultResourceId = typeof RESULT_RESOURCES[number]
export function resultResourceLabel(id: ResultResourceId) { return t(`result.resource.${id}`) }
