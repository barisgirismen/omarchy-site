import assert from 'node:assert/strict'
import test from 'node:test'
import { themePaletteArg } from './theme-palettes.ts'
import {
  WORDMARK_EFFECT,
  WORDMARK_FRAME_RATE,
  WORDMARK_WASM_URL,
} from '../data/wordmark-art.ts'

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
  assert.equal(WORDMARK_EFFECT, 'laseretch')
  assert.equal(WORDMARK_WASM_URL, '/ttfx/effects/laseretch.wasm')
  assert.equal(WORDMARK_FRAME_RATE, 240)
})

test('tokyo-night palette is the WTE comma-separated hex list', () => {
  const palette = themePaletteArg('tokyo-night')
  assert.ok(palette)
  assert.ok(palette.startsWith('#7aa2f7'))
  assert.ok(palette.includes('#9ece6a'))
})

test('every site theme has a palette, unknowns have none', () => {
  for (const id of SITE_THEME_IDS) {
    const palette = themePaletteArg(id)
    assert.ok(palette, id)
    assert.ok(palette.includes('#'), id)
  }
  assert.equal(themePaletteArg('not-a-theme'), undefined)
})
