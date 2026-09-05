import { expect, test } from 'vite-plus/test'
import { themePaletteArg } from './theme-palettes'
import {
  WORDMARK_ART,
  WORDMARK_CROP_TOP_HALF_ROWS,
  WORDMARK_EFFECT,
  WORDMARK_FIT,
  WORDMARK_FRAME_RATE,
  WORDMARK_WASM_URL,
} from '../data/wordmark-art'
import { WORDMARK_ROWS } from '../data/wordmark-bitmap'

const SITE_THEME_IDS = [
  'catppuccin',
  'catppuccin-latte',
  'ethereal',
  'everforest',
  'flexoki-light',
  'gruvbox',
  'hackerman',
  'kanagawa',
  'last-horizon',
  'lumon',
  'lupine',
  'matte-black',
  'miasma',
  'nord',
  'osaka-jade',
  'retro-82',
  'ristretto',
  'rose-pine',
  'solitude',
  'tokyo-night',
  'vantablack',
  'white',
]

test('the homepage mark is laseretch from the single-effect wasm', () => {
  expect(WORDMARK_EFFECT).toBe('laseretch')
  expect(WORDMARK_WASM_URL).toBe('/ttfx/effects/laseretch.wasm')
  expect(WORDMARK_FRAME_RATE).toBe(240)
  expect(WORDMARK_FIT).toBe('fill')
  expect(WORDMARK_CROP_TOP_HALF_ROWS).toBe(1)
})

test('half-block ASCII cropped one half-row matches the 81x19 bitmap', () => {
  const half: Record<string, readonly [number, number]> = {
    ' ': [0, 0],
    '\u2580': [1, 0],
    '\u2584': [0, 1],
    '\u2588': [1, 1],
  }
  const lines = WORDMARK_ART.split('\n')
  const width = Math.max(...lines.map((line) => line.length))
  const rows: string[] = []
  for (const line of lines) {
    const padded = line.padEnd(width, ' ')
    let top = ''
    let bot = ''
    for (const ch of padded) {
      const pair = half[ch] ?? [0, 0]
      top += String(pair[0])
      bot += String(pair[1])
    }
    rows.push(top, bot)
  }
  const cropped = rows.slice(WORDMARK_CROP_TOP_HALF_ROWS)
  expect(cropped).toEqual([...WORDMARK_ROWS])
})

test('tokyo-night palette is the WTE comma-separated hex list', () => {
  const palette = themePaletteArg('tokyo-night')
  expect(palette).toBeTruthy()
  expect(palette?.startsWith('#7aa2f7')).toBe(true)
  expect(palette).toContain('#9ece6a')
})

test('every site theme has a palette, unknowns have none', () => {
  for (const id of SITE_THEME_IDS) {
    const palette = themePaletteArg(id)
    expect(palette, id).toBeTruthy()
    expect(palette, id).toContain('#')
  }
  expect(themePaletteArg('not-a-theme')).toBeUndefined()
})
