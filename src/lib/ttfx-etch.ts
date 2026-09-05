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

export type WordmarkEtch = {
  /** 1 where laseretch has a visible cell this frame. Length width*height. */
  mask: Uint8Array
  done: boolean
  advance: (dtMs: number) => void
  restart: (palette?: string) => void
  destroy: () => void
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
    session.fill(symbols, fg, bg, flags)
    const width = Math.min(glyph.width, session.width())
    const height = Math.min(glyph.height, session.height())
    mask.fill(0)
    for (let row = 0; row < height; row++) {
      const srcRow = row * session.width()
      const dstRow = row * glyph.width
      for (let col = 0; col < width; col++) {
        const cp = symbols[srcRow + col] ?? 32
        mask[dstRow + col] = cp === 32 || cp === 0 ? 0 : 1
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
