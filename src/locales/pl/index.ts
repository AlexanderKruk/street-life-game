import type { Catalog } from '../../i18n'
import { pl as interfaceTranslations } from '../interfaceTranslations'
import { opening } from './opening'
import { interfaceMessages } from './interface'
import { inventoryMessages } from './inventory'
import { servicesMessages } from './services'
import { restMessages } from './rest'
import { phoneMessages } from './phone'
import { eventsMessages } from './events'
import { activitiesMessages } from './activities'

export const pl = { ...interfaceTranslations, ...opening, ...interfaceMessages, ...inventoryMessages, ...servicesMessages, ...restMessages, ...phoneMessages, ...eventsMessages, ...activitiesMessages } as const satisfies Partial<Catalog>
