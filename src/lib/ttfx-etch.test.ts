import { expect, test } from 'vite-plus/test'
import { etchSymbolKind, paintEtchMarks } from './ttfx-etch'

test('only block letters occupy a shader cell', () => {
  expect(etchSymbolKind(0x20)).toBe('empty')
  expect(etchSymbolKind(0)).toBe('empty')
  expect(etchSymbolKind(0x2588)).toBe('letter')
  expect(etchSymbolKind(0x5e)).toBe('letter')
  expect(etchSymbolKind(0x2f)).toBe('beam')
  expect(etchSymbolKind(0x2a)).toBe('spark')
  expect(etchSymbolKind(0x2e)).toBe('spark')
  expect(etchSymbolKind(0x2c)).toBe('spark')
  expect(etchSymbolKind(0x41)).toBe('empty')
})

test('beam cells stroke a thin diagonal instead of filling the cell', () => {
  const { ctx, strokes, rects } = mockCtx()
  const symbols = Uint32Array.from([0x20, 0x2f, 0x20])
  const fg = Uint32Array.from([0, 0xff_ff_ff_ff, 0])
  paintEtchMarks(ctx, symbols, fg, {
    originX: 0,
    originY: 0,
    cellW: 10,
    cellH: 10,
    cols: 3,
    rows: 1,
    fallback: '#daecc6',
  })
  expect(rects).toHaveLength(0)
  expect(strokes).toHaveLength(1)
  const stroke = strokes[0]!
  expect(stroke.w).toBe(1)
  expect(stroke.x1).toBe(10)
  expect(stroke.y1).toBe(10)
  expect(stroke.x2).toBe(20)
  expect(stroke.y2).toBe(0)
})

test('sparks are a small rect at the cell centre', () => {
  const { ctx, strokes, rects } = mockCtx()
  const symbols = Uint32Array.from([0x2a])
  const fg = Uint32Array.from([0xff_ff_e6_80])
  paintEtchMarks(ctx, symbols, fg, {
    originX: 0,
    originY: 0,
    cellW: 10,
    cellH: 10,
    cols: 1,
    rows: 1,
    fallback: '#daecc6',
  })
  expect(strokes).toHaveLength(0)
  expect(rects).toHaveLength(1)
  const spark = rects[0]!
  expect(spark.w).toBeLessThan(10)
  expect(spark.h).toBeLessThan(10)
  expect(spark.w).toBe(spark.h)
})

test('letter cells are left to the field stamp', () => {
  const { ctx, strokes, rects } = mockCtx()
  paintEtchMarks(
    ctx,
    Uint32Array.from([0x2588, 0x5e]),
    Uint32Array.from([0xff_9e_ce_6a, 0xff_ff_e6_80]),
    {
      originX: 0,
      originY: 0,
      cellW: 8,
      cellH: 8,
      cols: 2,
      rows: 1,
      fallback: '#daecc6',
    },
  )
  expect(strokes).toHaveLength(0)
  expect(rects).toHaveLength(0)
})

function mockCtx() {
  const strokes: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    w: number
    color: string
  }> = []
  const rects: Array<{
    x: number
    y: number
    w: number
    h: number
    color: string
  }> = []
  let x = 0
  let y = 0
  let strokeStyle = ''
  let fillStyle = ''
  let lineWidth = 1
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    moveTo(nx: number, ny: number) {
      x = nx
      y = ny
    },
    lineTo(nx: number, ny: number) {
      strokes.push({
        x1: x,
        y1: y,
        x2: nx,
        y2: ny,
        w: lineWidth,
        color: strokeStyle,
      })
      x = nx
      y = ny
    },
    stroke() {},
    fillRect(rx: number, ry: number, rw: number, rh: number) {
      rects.push({ x: rx, y: ry, w: rw, h: rh, color: fillStyle })
    },
    set strokeStyle(value: string) {
      strokeStyle = String(value)
    },
    get strokeStyle() {
      return strokeStyle
    },
    set fillStyle(value: string) {
      fillStyle = String(value)
    },
    get fillStyle() {
      return fillStyle
    },
    set lineWidth(value: number) {
      lineWidth = value
    },
    get lineWidth() {
      return lineWidth
    },
    lineCap: 'butt',
  }
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    strokes,
    rects,
  }
}
