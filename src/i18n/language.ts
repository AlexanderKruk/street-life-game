export type LanguageId = 'en' | 'pl' | 'ru'
export const LANGUAGE_KEY = 'street-life-language-v1'
export const LANGUAGE_RETURN_KEY = 'street-life-language-return-v1'
export const languageIds: readonly LanguageId[] = ['en', 'pl', 'ru']
export function isLanguage(value: unknown): value is LanguageId {
  return value === 'en' || value === 'pl' || value === 'ru'
}
export function loadLanguage(): LanguageId {
  try { const value = localStorage.getItem(LANGUAGE_KEY); return isLanguage(value) ? value : 'en' } catch { return 'en' }
}
export function languageReturn(): boolean {
  try { return sessionStorage.getItem(LANGUAGE_RETURN_KEY) === 'language' } catch { return false }
}
export function clearLanguageReturn() {
  try { sessionStorage.removeItem(LANGUAGE_RETURN_KEY) } catch { /* Optional navigation hint. */ }
}
export function changeLanguage(language: LanguageId) {
  // Flush the existing autosave before reloading module-level catalogue bindings.
  window.dispatchEvent(new Event('pagehide'))
  localStorage.setItem(LANGUAGE_KEY, language)
  if (localStorage.getItem(LANGUAGE_KEY) !== language) throw new Error('Language preference not saved')
  try { sessionStorage.setItem(LANGUAGE_RETURN_KEY, 'language') } catch { /* Reload can still apply the language. */ }
  window.location.reload()
}
