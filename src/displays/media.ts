import { useEffect, useState } from 'react'
import type { MediaRef } from '@/circuit/types'
import { loadMedia } from '@/lib/media'

export type MediaSource =
  | { kind: 'image'; element: HTMLImageElement }
  | { kind: 'video'; element: HTMLVideoElement }

/**
 * The photo or video of a screen, read back from IndexedDB and ready to draw.
 * Null while it loads, or when the file is gone. Videos are muted, loop and
 * are never added to the page: each frame is drawn into the screen's canvas.
 */
export function useMediaSource(media: MediaRef | undefined): MediaSource | null {
  const [source, setSource] = useState<MediaSource | null>(null)
  const id = media?.id
  const kind = media?.kind

  useEffect(() => {
    if (!id) return
    let cancelled = false
    let url = ''
    let element: HTMLImageElement | HTMLVideoElement | null = null
    void loadMedia(id).then((blob) => {
      if (cancelled || !blob) return
      url = URL.createObjectURL(blob)
      if (kind === 'video') {
        const video = document.createElement('video')
        video.muted = true
        video.defaultMuted = true
        video.loop = true
        video.playsInline = true
        video.preload = 'auto'
        video.onloadeddata = () => !cancelled && setSource({ kind: 'video', element: video })
        video.src = url
        element = video
      } else {
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => !cancelled && setSource({ kind: 'image', element: image })
        image.src = url
        element = image
      }
    })
    return () => {
      cancelled = true
      if (element instanceof HTMLVideoElement) {
        element.pause()
        element.removeAttribute('src')
        element.load()
      }
      if (url) URL.revokeObjectURL(url)
      setSource(null)
    }
  }, [id, kind])

  return source
}

/** Plays a video while the screen is live, pauses it otherwise. */
export function useVideoPlayback(source: MediaSource | null, playing: boolean) {
  useEffect(() => {
    if (source?.kind !== 'video') return
    const video = source.element
    if (playing) video.play().catch(() => undefined)
    else video.pause()
  }, [source, playing])
}

/** Draws a photo or video frame so it fills the box, cropping the edges. */
export function drawCover(ctx: CanvasRenderingContext2D, source: MediaSource, w: number, h: number) {
  const el = source.element
  const sw = source.kind === 'video' ? (el as HTMLVideoElement).videoWidth : (el as HTMLImageElement).naturalWidth
  const sh = source.kind === 'video' ? (el as HTMLVideoElement).videoHeight : (el as HTMLImageElement).naturalHeight
  if (!sw || !sh) return
  const scale = Math.max(w / sw, h / sh)
  const cw = w / scale
  const ch = h / scale
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(el, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h)
}

/**
 * The picture a screen shows before a child adds their own: a sunny valley,
 * drawn in code so no image is downloaded.
 */
export function drawSamplePicture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#2b6fd6')
  sky.addColorStop(0.62, '#9fd3ff')
  sky.addColorStop(1, '#d8f0ff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)
  const sun = ctx.createRadialGradient(w * 0.74, h * 0.3, 0, w * 0.74, h * 0.3, h * 0.32)
  sun.addColorStop(0, '#fffbe0')
  sun.addColorStop(0.35, '#ffd54a')
  sun.addColorStop(0.36, 'rgba(255, 213, 74, 0.5)')
  sun.addColorStop(1, 'rgba(255, 213, 74, 0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h)
  const hill = (color: string, base: number, amp: number, phase: number) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, h)
    for (let x = 0; x <= w; x += Math.max(1, w / 48)) {
      ctx.lineTo(x, h * base - Math.sin((x / w) * Math.PI * 2 + phase) * h * amp - Math.sin((x / w) * 9 + phase) * h * 0.02)
    }
    ctx.lineTo(w, h)
    ctx.fill()
  }
  hill('#5b8f4a', 0.66, 0.1, 0.4)
  hill('#3f7a39', 0.78, 0.07, 2.2)
  hill('#2c5e2a', 0.9, 0.05, 4.1)
}
