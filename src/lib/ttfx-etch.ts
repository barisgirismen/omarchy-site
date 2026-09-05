import {
  WORDMARK_EFFECT,
  WORDMARK_FRAME_RATE,
  WORDMARK_WASM_URL,
} from '@/data/wordmark-art'
import { bitmapToBlockArt } from '@/lib/wordmark-blocks'
import init, { Session } from '@/vendor/ttfx.js'

let gluePromise: Promise<typeof Session> | null = null

function loadGlue(): Promise<typeof Session> {
  gluePromise ??= init({ module_or_path: WORDMARK_WASM_URL }).then(
    () => Session,
  )
  return gluePromise
}

const FULL_BLOCK = 0x2588
const CARET = 0x5e
const SLASH = 0x2f
const STAR = 0x2a
const DOT = 0x2e
const COMMA = 0x2c

/** Stroke weight as a fraction of the cell, matching WTE's light box lines. */
const BEAM_WEIGHT = 0.1
const SPARK_WEIGHT = 0.18

export type EtchSymbolKind = 'empty' | 'letter' | 'beam' | 'spark'

export type EtchMarkGeom = {
  originX: number
  originY: number
  cellW: number
  cellH: number
  cols: number
  rows: number
  fallback: string
}

export type WordmarkEtch = {
  /** 1 where a letter block is visible this frame. Length width*height. */
  mask: Uint8Array
  symbols: Uint32Array
  fg: Uint32Array
  done: boolean
  advance: (dtMs: number) => void
  restart: (palette?: string) => void
  destroy: () => void
}

/**
 * Laseretch draws `/` `.` `,` `*` as terminal glyphs. The field paints every
 * occupied letter as a full square, so those marks have to stay strokes or
 * they read as a beam as wide as the word.
 */
export function etchSymbolKind(cp: number): EtchSymbolKind {
  if (cp === FULL_BLOCK || cp === CARET) return 'letter'
  if (cp === SLASH) return 'beam'
  if (cp === STAR || cp === DOT || cp === COMMA) return 'spark'
  return 'empty'
}

export function paintEtchMarks(
  ctx: CanvasRenderingContext2D,
  symbols: Uint32Array,
  fg: Uint32Array,
  geom: EtchMarkGeom,
): void {
  const { originX, originY, cellW, cellH, cols, rows, fallback } = geom
  const beamW = Math.max(1, Math.round(Math.min(cellW, cellH) * BEAM_WEIGHT))
  const spark = Math.max(1, Math.round(Math.min(cellW, cellH) * SPARK_WEIGHT))
  ctx.save()
  ctx.lineCap = 'butt'
  ctx.lineWidth = beamW
  for (let row = 0; row < rows; row++) {
    const y = originY + row * cellH
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col
      const kind = etchSymbolKind(symbols[i] ?? 32)
      if (kind === 'empty' || kind === 'letter') continue
      const x = originX + col * cellW
      const color = cssFromPacked(fg[i] ?? 0, fallback)
      if (kind === 'beam') {
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(x, y + cellH)
        ctx.lineTo(x + cellW, y)
        ctx.stroke()
      } else {
        ctx.fillStyle = color
        ctx.fillRect(
          Math.round(x + (cellW - spark) / 2),
          Math.round(y + (cellH - spark) / 2),
          spark,
          spark,
        )
      }
    }
  }
  ctx.restore()
}

function cssFromPacked(packed: number, fallback: string): string {
  if (packed === 0) return fallback
  const r = (packed >> 16) & 255
  const g = (packed >> 8) & 255
  const b = packed & 255
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Runs laseretch against the glyph bitmap as █ blocks. Call `advance` from
 * the field's frame loop and stamp `mask` into the same cells.
 */
export async function createWordmarkEtch(
  glyph: {
    rows: ReadonlyArray<string>
    width: number
    height: number
  },
  palette?: string,
): Promise<WordmarkEtch> {
  const SessionCtor = await loadGlue()
  const art = bitmapToBlockArt(glyph.rows)
  const cells = glyph.width * glyph.height
  const packedSymbols = new Uint32Array(cells)
  const packedFg = new Uint32Array(cells)
  const symbols = new Uint32Array(cells)
  const fg = new Uint32Array(cells)
  const bg = new Uint32Array(cells)
  const flags = new Uint8Array(cells)
  const mask = new Uint8Array(cells)
  const frameMs = 1000 / WORDMARK_FRAME_RATE
  let session: InstanceType<typeof Session> | null = null
  let acc = 0
  let done = false

  const capture = () => {
    if (!session) return
    session.fill(packedSymbols, packedFg, bg, flags)
    const width = Math.min(glyph.width, session.width())
    const height = Math.min(glyph.height, session.height())
    mask.fill(0)
    symbols.fill(32)
    fg.fill(0)
    for (let row = 0; row < height; row++) {
      const srcRow = row * session.width()
      const dstRow = row * glyph.width
      for (let col = 0; col < width; col++) {
        const cp = packedSymbols[srcRow + col] ?? 32
        const i = dstRow + col
        symbols[i] = cp
        fg[i] = packedFg[srcRow + col] ?? 0
        mask[i] = etchSymbolKind(cp) === 'letter' ? 1 : 0
      }
    }
  }

  const start = (nextPalette?: string) => {
    session?.free()
    session = new SessionCtor(
      art,
      WORDMARK_EFFECT,
      glyph.width,
      glyph.height,
      undefined,
      WORDMARK_FRAME_RATE,
      nextPalette ?? palette,
      null,
    )
    acc = 0
    done = false
    if (session.step()) capture()
    else {
      done = true
      capture()
    }
  }

  start(palette)

  return {
    mask,
    symbols,
    fg,
    get done() {
      return done
    },
    advance(dtMs) {
      if (!session || done) return
      acc += Math.max(0, dtMs)
      let alive = true
      while (acc >= frameMs) {
        acc -= frameMs
        alive = session.step()
        if (!alive) {
          done = true
          break
        }
      }
      capture()
    },
    restart(nextPalette) {
      start(nextPalette)
    },
    destroy() {
      session?.free()
      session = null
      done = true
    },
  }
}
