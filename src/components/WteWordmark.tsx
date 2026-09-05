import { useCallback, useEffect, useRef, useState } from 'react'
import { useTextEffect } from '@/vendor/wte/react.js'
import {
  WORDMARK_ART,
  WORDMARK_CROP_TOP_HALF_ROWS,
  WORDMARK_EFFECT,
  WORDMARK_FALLBACK_MS,
  WORDMARK_FIT,
  WORDMARK_FRAME_RATE,
  WORDMARK_WASM_URL,
} from '@/data/wordmark-art'
import { themePaletteArg } from '@/lib/theme-palettes'
import { DEFAULT_THEME, SITE_THEMES, THEME_EVENT, readTheme } from '@/lib/theme'
import {
  createWordmarkCompositor,
  wordmarkEtchPad,
  wordmarkOutline,
  wordmarkPlateOnDark,
  wordmarkPlateOnLight,
} from '@/components/wordmark-composite'

function plateForTheme(id: string) {
  return SITE_THEMES.find((theme) => theme.id === id)?.light
    ? wordmarkPlateOnLight
    : wordmarkPlateOnDark
}

type ThemeLook = {
  plate: number
  palette: string | undefined
}

function lookForTheme(id: string): ThemeLook {
  return {
    plate: plateForTheme(id),
    palette: themePaletteArg(id),
  }
}

type Props = {
  onFallback?: (show: boolean) => void
}

/**
 * Homepage OMARCHY, etched once with laseretch in the active theme's
 * palette. The CSS mask stays hidden unless this fails or the reader
 * prefers less motion; the canvas holds its last frame when the etch
 * finishes, and a theme change plays it again in the new inks.
 */
export function WteWordmark({ onFallback }: Props) {
  const [reduced, setReduced] = useState<boolean | null>(null)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  if (reduced !== false) return null
  return <Player onFallback={onFallback} />
}

function Player({ onFallback }: Props) {
  const sourceRef = useRef<HTMLCanvasElement>(null)
  const outputRef = useRef<HTMLCanvasElement>(null)
  const etchedRef = useRef(false)
  const fallback = useRef(onFallback)
  fallback.current = onFallback
  const [showFallback, setShowFallback] = useState(false)
  const [look, setLook] = useState(() =>
    typeof document === 'undefined'
      ? lookForTheme(DEFAULT_THEME)
      : lookForTheme(readTheme()),
  )
  const holdLastFrame = useCallback(() => {
    etchedRef.current = true
  }, [])

  const { ready } = useTextEffect({
    canvas: sourceRef,
    effect: WORDMARK_EFFECT,
    input: WORDMARK_ART,
    wasmUrl: WORDMARK_WASM_URL,
    frameRate: WORDMARK_FRAME_RATE,
    palette: look.palette,
    fit: WORDMARK_FIT,
    cropTopHalfRows: WORDMARK_CROP_TOP_HALF_ROWS,
    onFinished: holdLastFrame,
  })

  useEffect(() => {
    const onTheme = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      if (typeof id !== 'string') return
      etchedRef.current = false
      setLook(lookForTheme(id))
    }
    window.addEventListener(THEME_EVENT, onTheme)
    return () => window.removeEventListener(THEME_EVENT, onTheme)
  }, [])

  useEffect(() => {
    if (ready) {
      setShowFallback(false)
      fallback.current?.(false)
      return
    }
    const timer = window.setTimeout(() => {
      setShowFallback(true)
      fallback.current?.(true)
    }, WORDMARK_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [ready])

  useEffect(() => {
    const source = sourceRef.current
    const output = outputRef.current
    if (!ready || !source || !output) return

    const compositor = createWordmarkCompositor(output)
    if (!compositor) {
      setShowFallback(true)
      fallback.current?.(true)
      return
    }

    let frame = 0
    let settling = false
    const pad = wordmarkOutline.on ? wordmarkEtchPad : 0
    const tick = () => {
      compositor.draw(source, pad, look.plate)
      if (etchedRef.current) {
        if (settling) return
        settling = true
        frame = requestAnimationFrame(() => {
          compositor.draw(source, pad, look.plate)
        })
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      compositor.destroy()
    }
  }, [ready, look])

  if (showFallback) return null

  return (
    <>
      <canvas
        ref={sourceRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-0"
      />
      <canvas
        ref={outputRef}
        aria-hidden
        className={
          ready
            ? 'pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]'
            : 'pointer-events-none absolute inset-0 size-full opacity-0 [image-rendering:pixelated]'
        }
      />
    </>
  )
}
