import type { Catalog } from '../../i18n'
import { pl as interfaceTranslations } from '../interfaceTranslations'
import { opening } from './opening'
import { interfaceMessages } from './interface'
import { inventoryMessages } from './inventory'

export const pl = { ...interfaceTranslations, ...opening, ...interfaceMessages, ...inventoryMessages } as const satisfies Partial<Catalog>
