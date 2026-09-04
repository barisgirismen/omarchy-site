import { useCallback, useEffect, useRef, useState } from 'react'
import { useTextEffect } from '@/vendor/wte/react.js'
import {
  WORDMARK_ART,
  WORDMARK_EFFECT,
  WORDMARK_FALLBACK_MS,
  WORDMARK_FRAME_RATE,
  WORDMARK_WASM_URL,
} from '@/data/wordmark-art'
import { SITE_THEMES, THEME_EVENT, readTheme } from '@/lib/theme'
import {
  createWordmarkCompositor,
  wordmarkEtchPad,
  wordmarkPlateOnDark,
  wordmarkPlateOnLight,
} from '@/components/wordmark-composite'

function plateForTheme(id: string) {
  return SITE_THEMES.find((theme) => theme.id === id)?.light
    ? wordmarkPlateOnLight
    : wordmarkPlateOnDark
}

type Props = {
  onReady?: () => void
}

/**
 * Homepage OMARCHY, etched once with Web Text Effects laseretch. The CSS
 * mask wordmark stays as the layout slot and the fallback; this canvas sits
 * on top and holds its last frame when the effect finishes.
 */
export function LaserEtchWordmark({ onReady }: Props) {
  const [reduced, setReduced] = useState<boolean | null>(null)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  if (reduced !== false) return null
  return <Etch onReady={onReady} />
}

function Etch({ onReady }: Props) {
  const sourceRef = useRef<HTMLCanvasElement>(null)
  const outputRef = useRef<HTMLCanvasElement>(null)
  const etchedRef = useRef(false)
  const [showFallback, setShowFallback] = useState(false)
  const [plate, setPlate] = useState(() =>
    typeof document === 'undefined'
      ? wordmarkPlateOnDark
      : plateForTheme(readTheme()),
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
    onFinished: holdLastFrame,
  })

  useEffect(() => {
    const onTheme = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      if (typeof id === 'string') setPlate(plateForTheme(id))
    }
    window.addEventListener(THEME_EVENT, onTheme)
    return () => window.removeEventListener(THEME_EVENT, onTheme)
  }, [])

  useEffect(() => {
    if (ready) {
      onReady?.()
      return
    }
    const timer = window.setTimeout(() => {
      setShowFallback(true)
    }, WORDMARK_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [ready, onReady])

  useEffect(() => {
    const source = sourceRef.current
    const output = outputRef.current
    if (!ready || !source || !output) return

    const compositor = createWordmarkCompositor(output)
    if (!compositor) {
      source.classList.remove('opacity-0')
      return
    }

    let frame = 0
    let settling = false
    const tick = () => {
      compositor.draw(source, wordmarkEtchPad, plate)
      if (etchedRef.current) {
        if (settling) return
        settling = true
        frame = requestAnimationFrame(() => {
          compositor.draw(source, wordmarkEtchPad, plate)
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
  }, [ready, plate])

  if (showFallback && !ready) return null

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
            ? 'pointer-events-none absolute inset-0 size-full'
            : 'pointer-events-none absolute inset-0 size-full opacity-0'
        }
      />
    </>
  )
}
