import type { CSSProperties, RefObject } from 'react'

export type UseTextEffectOptions = {
  canvas: RefObject<HTMLCanvasElement | null>
  effect?: string
  input: string
  wasmUrl?: string
  frameRate?: number
  onFinished?: () => void
}

export type UseTextEffectResult = {
  ready: boolean
  catalog: unknown[]
  effect: string
  restart: () => void
}

export function useTextEffect(
  options: UseTextEffectOptions,
): UseTextEffectResult

export type WebTextEffectCanvasProps = {
  effect?: string
  input: string
  wasmUrl?: string
  frameRate?: number
  className?: string
  style?: CSSProperties
}

export function WebTextEffectCanvas(
  props: WebTextEffectCanvasProps,
): JSX.Element
