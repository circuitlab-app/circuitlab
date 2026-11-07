import * as THREE from 'three'

/*
 * Printing on parts (a chip's type number, a symbol on a module) drawn once
 * onto a small canvas. The textures are shared by every card that shows the
 * same print, so like the halo texture they are kept for the whole session.
 */

const cache = new Map<string, THREE.CanvasTexture>()
/** pixels per model unit: sharp enough when the board is zoomed in */
const DENSITY = 640

/** A texture `width` × `height` model units big, drawn by `draw` in pixels, cached under `key`. */
export function printTexture(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const known = cache.get(key)
  if (known) return known
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * DENSITY)
  canvas.height = Math.round(height * DENSITY)
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  cache.set(key, texture)
  return texture
}

const FONT = '"Helvetica Neue", Arial, ui-sans-serif, sans-serif'

/** Lines of small type, left-aligned like the laser marking on a chip; each line may have its own weight. */
export function markingTexture(lines: string[], width: number, height: number, color = '#cfd2d8') {
  return printTexture(`mark:${lines.join('|')}:${width}:${height}:${color}`, width, height, (ctx, w, h) => {
    const row = h / lines.length
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    lines.forEach((line, i) => {
      let size = row * 0.78
      ctx.font = `600 ${size}px ${FONT}`
      const fit = ctx.measureText(line).width
      if (fit > w * 0.98) {
        size *= (w * 0.98) / fit
        ctx.font = `600 ${size}px ${FONT}`
      }
      ctx.fillText(line, 0, row * (i + 0.5))
    })
  })
}

export const PRINT_FONT = FONT
