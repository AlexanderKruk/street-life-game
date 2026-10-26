import type { Message, MessageCatalog, ParameterValue, TranslationCatalog, Translator } from './types'

const pluralCategories = ['zero', 'one', 'two', 'few', 'many', 'other'] as const
const placeholders = (value: string) => [...new Set([...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort()
const variants = (message: Message) => typeof message === 'string' ? [message] : pluralCategories.flatMap(category => message[category] === undefined ? [] : [message[category]!])

// Used by checks and when introducing another locale, never to parse game copy.
export function validateCatalog<C extends MessageCatalog>(source: C, candidate: TranslationCatalog<C>): string[] {
  const errors: string[] = []
  for (const key of Object.keys(candidate)) if (!(key in source)) errors.push(`${key}: unknown key`)
  for (const [key, expected] of Object.entries(source)) {
    const actual = candidate[key]
    if (actual === undefined) { errors.push(`${key}: missing message`); continue }
    if ((typeof expected === 'string') !== (typeof actual === 'string')) { errors.push(`${key}: inconsistent plural form`); continue }
    if (typeof expected !== 'string' && typeof actual !== 'string' && (actual.plural !== expected.plural || typeof actual.other !== 'string')) errors.push(`${key}: invalid plural selector/fallback`)
    const reference = placeholders(typeof expected === 'string' ? expected : expected.other).join(',')
    for (const value of [...variants(expected), ...variants(actual)]) {
      if (/[{}]/.test(value.replace(/\{\w+\}/g, ''))) errors.push(`${key}: malformed placeholder`)
      if (placeholders(value).join(',') !== reference) errors.push(`${key}: inconsistent parameters`)
    }
  }
  return errors
}

export function createTranslator<C extends MessageCatalog>(locale: string, catalog: C): Translator<C> {
  const plurals = new Intl.PluralRules(locale)
  const translate = (key: string, params: Record<string, ParameterValue> = {}) => {
    const message = catalog[key]
    if (!Object.hasOwn(catalog, key)) throw new Error(`Unknown message: ${key}`)
    let template: string
    if (typeof message === 'string') template = message
    else {
      const count = params[message.plural]
      if (typeof count !== 'number' || !Number.isFinite(count)) throw new Error(`Invalid plural count: ${key}.${message.plural}`)
      template = message[plurals.select(count)] ?? message.other
    }
    return template.replace(/\{(\w+)\}/g, (_, name: string) => {
      if (!Object.hasOwn(params, name)) throw new Error(`Missing parameter: ${key}.${name}`)
      return String(params[name])
    })
  }
  return translate as Translator<C>
}
