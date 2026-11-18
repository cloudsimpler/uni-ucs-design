import { languageCandidates } from './validation.js'
import { isSafeKey } from '../utils/object.js'
import { computed } from 'vue'

function readPath(pack, path, paths) {
  if (typeof path !== 'string' || !path) return undefined
  let value = pack
  let keys = paths.get(path)
  if (!keys) {
    keys = path.split('.')
    paths.set(path, keys)
    if (paths.size > 256) paths.delete(paths.keys().next().value)
  }
  for (const key of keys) {
    if (!isSafeKey(key) || value === null || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key)) return undefined
    value = value[key]
  }
  return typeof value === 'string' ? value : undefined
}

function interpolate(text, params) {
  return text.replace(/\{([^{}]+)\}/g, (placeholder, key) => {
    if (!isSafeKey(key) || !params || !Object.prototype.hasOwnProperty.call(params, key)) return placeholder
    return params[key] == null ? '' : String(params[key])
  })
}

export function createLanguageAccessors(config, update) {
  const language = computed(() => config.value.language)
  const fallbackLanguage = computed(() => config.value.fallbackLanguage)
  const packViews = {
    designLanguagePacks: computed(() => config.value.designLanguagePacks),
    i18nLanguagePacks: computed(() => config.value.i18nLanguagePacks)
  }
  const candidates = computed(() => [...new Set([...languageCandidates(language.value), ...languageCandidates(fallbackLanguage.value)])])
  const indexes = new WeakMap()
  const paths = new Map()
  const text = (field, path, options = {}) => {
    const packs = packViews[field].value
    let index = indexes.get(packs)
    if (!index) {
      index = new Map(Object.keys(packs).map(key => [key.toLowerCase(), key]))
      indexes.set(packs, index)
    }
    for (const candidate of candidates.value) {
      const key = index.get(candidate.toLowerCase())
      const value = readPath(key ? packs[key] : undefined, path, paths)
      if (value !== undefined) return interpolate(value, options.params)
    }
    return interpolate(options.fallbackValue ?? path, options.params)
  }
  return {
    getLanguage: () => language.value,
    setLanguage: language => update({ language }),
    getFallbackLanguage: () => fallbackLanguage.value,
    setFallbackLanguage: fallbackLanguage => update({ fallbackLanguage }),
    getUcsDesignText: (path, options) => text('designLanguagePacks', path, options),
    getI18nText: (path, options) => text('i18nLanguagePacks', path, options)
  }
}
