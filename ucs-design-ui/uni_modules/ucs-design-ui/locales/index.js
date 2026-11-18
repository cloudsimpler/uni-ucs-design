import { zhHans } from './zh-Hans.js'
import { zhHant } from './zh-Hant.js'
import { en } from './en.js'
import { cloneValue } from '../utils/object.js'

export function createBuiltinLanguagePacks() {
  return cloneValue({ 'zh-Hans': zhHans, 'zh-Hant': zhHant, en })
}
