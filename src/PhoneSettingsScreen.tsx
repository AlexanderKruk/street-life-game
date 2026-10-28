import { useState } from 'react'
import { language, t } from './i18n'
import { changeLanguage, languageIds } from './i18n/language'
import { Icon } from './Icon'

type Props = { page: 'settings' | 'language'; onLanguage: () => void }
export default function PhoneSettingsScreen({ page, onLanguage }: Props) {
  const [failed, setFailed] = useState(false)
  if (page === 'settings') return <button type="button" className="phone-settings-row" onClick={onLanguage}>
    <Icon name="globe" /><span>{t('phone.ui.language')}</span>
    <span className="phone-settings-value">{t(`phone.ui.language.${language}`)}</span><Icon name="chevron-right" />
  </button>
  return <>
    <fieldset className="phone-language-options" aria-label={t('phone.ui.language')}>
      {languageIds.map(id => <label className="phone-settings-row" key={id} lang={id}>
        <span>{t(`phone.ui.language.${id}`)}</span><input type="radio" name="game-language" value={id} checked={id === language} autoFocus={id === language} onChange={() => {
          if (id === language) return
          try { changeLanguage(id) } catch { setFailed(true) }
        }} />
      </label>)}
    </fieldset>
    {language !== 'en' && <p className="phone-language-notice">{t('phone.ui.language.partial')}</p>}
    {failed && <p role="alert" className="phone-language-notice">{t('phone.ui.language.error')}</p>}
  </>
}
