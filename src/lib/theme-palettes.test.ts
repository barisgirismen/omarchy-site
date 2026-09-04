import { expect, test } from 'vite-plus/test'
import { themePaletteArg } from './theme-palettes'
import {
  WORDMARK_EFFECT,
  WORDMARK_FRAME_RATE,
  WORDMARK_WASM_URL,
} from '../data/wordmark-art'

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
