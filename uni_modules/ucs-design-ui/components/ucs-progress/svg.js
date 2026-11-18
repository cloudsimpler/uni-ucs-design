import { toBase64, escapeSvgAttribute } from '../../internal/svg.js'

const sources = new Map()

/**
 * 将已规范化的进度和 core 解析后的颜色绘制为静态 SVG。
 * @param {number} percent 0～100 的百分比。
 * @param {number} size 外径 px，正数。
 * @param {number} stroke 线宽 px，正数且不超过外径一半。
 * @param {string} color 已解析的前景色。
 * @param {string} trackColor 已解析的轨道色。
 * @returns {string} UTF-8 Base64 SVG Data URL；模块级 LRU 最多缓存 64 项。
 */
export function getProgressSource(percent, size, stroke, color, trackColor) {
  // 归一化到固定坐标，等比例尺寸共用编码结果。
  const width = stroke / size * 100
  const key = JSON.stringify([percent, width, color, trackColor])
  if (sources.has(key)) {
    const source = sources.get(key)
    sources.delete(key); sources.set(key, source); return source
  }
  const radius = (100 - width) / 2, circumference = 2 * Math.PI * radius
  const geometry = `cx="50" cy="50" r="${radius}" fill="none" stroke-width="${width}"`
  const foreground = percent <= 0 ? '' : `<circle ${geometry} stroke="${escapeSvgAttribute(color)}"${percent >= 100 ? '' : ` stroke-dasharray="${circumference * percent / 100} ${circumference}" stroke-linecap="round" transform="rotate(-90 50 50)"`}/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle ${geometry} stroke="${escapeSvgAttribute(trackColor)}"/>${foreground}</svg>`
  const source = 'data:image/svg+xml;base64,' + toBase64(svg)
  sources.set(key, source)
  if (sources.size > 64) sources.delete(sources.keys().next().value)
  return source
}
