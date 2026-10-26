import { t } from './i18n'
import { formatLabelList } from './i18n/formatters'
import type { Housing, MoodLimitReason, conditionBand } from './game'
import type { LifeSituation } from './stateTypes'

// Persisted English-looking values remain machine identities, never display copy.
const housingKeys = { Street: 'status.housing.street', 'Night shelter': 'status.housing.shelter', Schronisko: 'status.housing.schronisko', Hostel: 'status.housing.hostel', Room: 'status.housing.room', Apartment: 'status.housing.apartment' } as const
const employmentKeys = { Unemployed: 'status.employment.unemployed', 'Day work': 'status.employment.dayWork' } as const
const incomeKeys = { None: 'status.income.none', Irregular: 'status.income.irregular' } as const
export type DocumentState = 'carried' | 'stored' | 'missing'
const documentKeys = { carried: 'inventory.documents.carried', stored: 'inventory.storage.documentsStored', missing: 'inventory.documents.missing' } as const
export function housingLabel(id: Housing) { return t(housingKeys[id]) }
export function employmentLabel(id: LifeSituation['employment']) { return t(employmentKeys[id]) }
export function incomeLabel(id: LifeSituation['income']) { return t(incomeKeys[id]) }
export function documentStateLabel(id: DocumentState) { return t(documentKeys[id]) }

export type LimitReason = MoodLimitReason | 'Dirty clothes'
const reasonKeys = { ...housingKeys, Hunger: 'status.cause.hunger', Thirst: 'stat.thirst', Health: 'stat.health', Tiredness: 'status.cause.tiredness', Hygiene: 'stat.hygiene', Cold: 'effect.cold.name', 'Dirty clothes': 'status.cause.dirtyClothes' } as const
const causeKeys = { ...reasonKeys, Street: 'status.cause.street', Room: 'status.cause.room', Hygiene: 'status.cause.hygiene' } as const
export function limitReasonLabel(id: LimitReason) { return t(reasonKeys[id]) }
export function limitCauseLabel(id: LimitReason) { return t(causeKeys[id]) }
export function limitReasonsLabel(ids: readonly MoodLimitReason[]) { return formatLabelList(ids.map(limitReasonLabel)) }
export function conditionLabel(level: ReturnType<typeof conditionBand>['level']) { return t(`condition.${level}`) }
