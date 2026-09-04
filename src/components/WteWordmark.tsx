import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTextEffect } from '@/vendor/wte/react.js'
import {
  WORDMARK_ART,
  WORDMARK_FALLBACK_MS,
  WORDMARK_FRAME_RATE,
  WORDMARK_WASM_URL,
} from '@/data/wordmark-art'
import { effectNames, pickRandomEffect } from '@/lib/wte-catalog'
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
  onFallback?: (show: boolean) => void
}

/**
 * Homepage OMARCHY, played with the Web Text Effects catalog. A random
 * effect starts once the engine is up; when it finishes, another one
 * that is not the same takes its place. The CSS mask wordmark stays
 * hidden unless this fails or the reader prefers less motion.
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
  const fallback = useRef(onFallback)
  fallback.current = onFallback
  const [effect, setEffect] = useState('')
  const [showFallback, setShowFallback] = useState(false)
  const [plate, setPlate] = useState(() =>
    typeof document === 'undefined'
      ? wordmarkPlateOnDark
      : plateForTheme(readTheme()),
  )

  const namesRef = useRef<string[]>([])
  const effectRef = useRef(effect)
  const restartRef = useRef<() => void>(() => undefined)

  const playNext = useCallback(() => {
    const next = pickRandomEffect(namesRef.current, effectRef.current)
    if (next === '') return
    if (next === effectRef.current) {
      restartRef.current()
      return
    }
    setEffect(next)
  }, [])

  const { ready, catalog, restart } = useTextEffect({
    canvas: sourceRef,
    effect,
    input: WORDMARK_ART,
    wasmUrl: WORDMARK_WASM_URL,
    frameRate: WORDMARK_FRAME_RATE,
    onFinished: playNext,
  })

  useLayoutEffect(() => {
    namesRef.current = effectNames(catalog)
    effectRef.current = effect
    restartRef.current = restart
  }, [catalog, effect, restart])

  useEffect(() => {
    if (!ready || effect !== '') return
    const names = effectNames(catalog)
    if (names.length === 0) {
      setShowFallback(true)
      fallback.current?.(true)
      return
    }
    setEffect(pickRandomEffect(names, ''))
  }, [ready, catalog, effect])

  useEffect(() => {
    const onTheme = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      if (typeof id === 'string') setPlate(plateForTheme(id))
    }
    window.addEventListener(THEME_EVENT, onTheme)
    return () => window.removeEventListener(THEME_EVENT, onTheme)
  }, [])

  useEffect(() => {
    if (ready && effect !== '') {
      setShowFallback(false)
      fallback.current?.(false)
      return
    }
    if (ready) return
    const timer = window.setTimeout(() => {
      setShowFallback(true)
      fallback.current?.(true)
    }, WORDMARK_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [ready, effect])

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
    const tick = () => {
      compositor.draw(source, wordmarkEtchPad, plate)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      compositor.destroy()
    }
  }, [ready, plate])

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
            ? 'pointer-events-none absolute inset-0 size-full'
            : 'pointer-events-none absolute inset-0 size-full opacity-0'
        }
      />
    </>
  )
}
