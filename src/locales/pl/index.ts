import type { Catalog } from '../../i18n'
import { pl as interfaceTranslations } from '../interfaceTranslations'
import { opening } from './opening'

export const pl = { ...interfaceTranslations, ...opening } as const satisfies Partial<Catalog>
