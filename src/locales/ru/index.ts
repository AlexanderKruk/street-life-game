import type { Catalog } from '../../i18n'
import { ru as interfaceTranslations } from '../interfaceTranslations'
import { opening } from './opening'

export const ru = { ...interfaceTranslations, ...opening } as const satisfies Partial<Catalog>
