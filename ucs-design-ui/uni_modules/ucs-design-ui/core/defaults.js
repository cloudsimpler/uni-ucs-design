import { createBuiltinLanguagePacks } from '../locales/index.js'

export function createDefaultConfig() {
  return {
    themeMode: 'light',
    themeColors: { primary: '#604CFC', secondary: null, success: '#07C160', warning: '#EDA20C', danger: '#D9514C' },
    typographyOffset: 0,
    language: 'zh-Hans',
    fallbackLanguage: 'zh-Hans',
    designLanguagePacks: createBuiltinLanguagePacks(),
    i18nLanguagePacks: {},
    iconFontFamily: '',
    icons: {},
    request: { env: 'auto', developmentBaseURL: '', productionBaseURL: '', timeout: 15000, headers: {} }
  }
}
