import { getEmptySvgTemplate } from './illustrations.js'
import { escapeSvgAttribute } from '../../internal/svg.js'

// 类型合法性与原图尺寸共用一份元数据，尺寸保持原始 viewBox 比例。
const illustrations = Object.freeze(Object.fromEntries(Object.entries({
  data: { width: 148, height: 133 },
  content: { width: 151, height: 137 },
  notice: { width: 154, height: 134 },
  permission: { width: 149, height: 142 },
  review: { width: 150, height: 132 },
  network: { width: 161, height: 139 },
  offline: { width: 161, height: 139 },
  link: { width: 161, height: 139 },
  image: { width: 151, height: 143 },
  maintenance: { width: 162, height: 139 },
  upload: { width: 150, height: 127 },
  download: { width: 150, height: 127 }
}).map(([type, size]) => [type, Object.freeze(size)])))

/** 将未知类型收敛到内置的暂无数据类型。 */
export function normalizeEmptyType(value) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(illustrations, value) ? value : 'data'
}

/** 获取只读的原图尺寸，无效类型使用 data。 */
export function getEmptyIllustrationSize(type) {
  return illustrations[normalizeEmptyType(type)]
}

/**
 * 创建主题化空状态图。
 *
 * @description 每种插画保留独立构图，仅将设计稿中的固定色映射到统一组件令牌。
 */
export function createEmptySvg(
	type,
	accentColor,
	accentMutedColor,
	surfaceColor,
	surfaceMutedColor,
	outlineColor,
	detailColor,
	cutoutColor
) {
	const accent = escapeSvgAttribute(accentColor);
	const accentMuted = escapeSvgAttribute(accentMutedColor);
	const surface = escapeSvgAttribute(surfaceColor);
	const surfaceMuted = escapeSvgAttribute(surfaceMutedColor);
	const outline = escapeSvgAttribute(outlineColor);
	const detail = escapeSvgAttribute(detailColor);
	const cutout = escapeSvgAttribute(cutoutColor);

	return getEmptySvgTemplate(normalizeEmptyType(type))
		.split('#417aff').join(accent)
		.split('#a4bfff').join(accentMuted)
		.split('#e2e5f1').join(surface)
		.split('#f1f3f8').join(surfaceMuted)
		.split('#c2c8d8').join(outline)
		.split('#697391').join(detail)
		.split('#2a3a60').join(detail)
		.split('#000000').join(detail)
		.split('#ffffff').join(cutout);
}
