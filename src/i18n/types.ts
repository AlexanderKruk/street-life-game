export type PluralCategory = Intl.LDMLPluralRule
export type PluralMessage = { readonly plural: string; readonly other: string } & Partial<Readonly<Record<PluralCategory, string>>>
export type Message = string | PluralMessage
export type MessageCatalog = Readonly<Record<string, Message>>
export type ParameterValue = string | number

type Placeholders<S extends string> = S extends `${string}{${infer Name}}${infer Rest}` ? Name | Placeholders<Rest> : never
type Parameters<M extends Message> = M extends string ? Placeholders<M>
  : M extends PluralMessage ? M['plural'] | Placeholders<Extract<M[Extract<keyof M, PluralCategory>], string>> : never
export type MessageArgs<M extends Message> = [Parameters<M>] extends [never] ? [] : [params: {
  [P in Parameters<M>]: M extends PluralMessage ? P extends M['plural'] ? number : ParameterValue : ParameterValue
}]
export type Translator<C extends MessageCatalog> = <K extends Extract<keyof C, string>>(key: K, ...args: MessageArgs<C[K]>) => string
export type TranslationCatalog<C extends MessageCatalog> = { readonly [K in keyof C]: C[K] extends string ? string : PluralMessage }
