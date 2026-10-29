import type { Catalog } from '../../i18n'
import { ru as interfaceTranslations } from '../interfaceTranslations'
import { opening } from './opening'
import { interfaceMessages } from './interface'
import { inventoryMessages } from './inventory'
import { servicesMessages } from './services'
import { restMessages } from './rest'

export const ru = { ...interfaceTranslations, ...opening, ...interfaceMessages, ...inventoryMessages, ...servicesMessages, ...restMessages } as const satisfies Partial<Catalog>
