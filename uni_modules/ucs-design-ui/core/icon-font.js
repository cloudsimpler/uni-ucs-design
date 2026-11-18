import { UCS_ICON_GLYPHS } from './icon-glyphs.js'
import { isSafeKey } from '../utils/object.js'

const UCS_ICON_FONT_FAMILY = 'UcsDesignIcons'
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

/** Resolve metadata only. Font loading and actual rendering belong to the host. */
export function resolveIconDefinition(name, config) {
  const key = typeof name === 'string' ? name.trim() : ''
  if (!key || !isSafeKey(key)) return { fontFamily: UCS_ICON_FONT_FAMILY, glyph: '' }
  if (config.iconFontFamily && own(config.icons, key)) {
    return { fontFamily: config.iconFontFamily, glyph: config.icons[key] }
  }
  return { fontFamily: UCS_ICON_FONT_FAMILY, glyph: own(UCS_ICON_GLYPHS, key) ? UCS_ICON_GLYPHS[key] : '' }
}
