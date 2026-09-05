import type { CSSProperties, RefObject } from 'react'

export type UseTextEffectOptions = {
  canvas: RefObject<HTMLCanvasElement | null>
  effect?: string
  input: string
  wasmUrl?: string
  frameRate?: number
  palette?: string
  background?: string
  backgroundPacked?: number
  fit?: 'terminal' | 'fill'
  cropTopHalfRows?: number
  onFinished?: () => void
}

export type EffectInfo = {
  name: string
  about: string
}

export type UseTextEffectResult = {
  ready: boolean
  catalog: EffectInfo[]
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
