import { expect, test } from 'vite-plus/test'
import {
  WORDMARK_HEIGHT,
  WORDMARK_ROWS,
  WORDMARK_WIDTH,
} from '../data/wordmark-bitmap'
import { bitmapToBlockArt } from './wordmark-blocks'

test('block art is one █ per lit bitmap cell, one line per row', () => {
  const art = bitmapToBlockArt(WORDMARK_ROWS)
  const lines = art.split('\n')
  expect(lines).toHaveLength(WORDMARK_HEIGHT)
  expect(lines[0]?.length).toBe(WORDMARK_WIDTH)
  let blocks = 0
  let bits = 0
  for (let row = 0; row < WORDMARK_HEIGHT; row++) {
    const line = lines[row] ?? ''
    const bitsRow = WORDMARK_ROWS[row] ?? ''
    for (let col = 0; col < WORDMARK_WIDTH; col++) {
      const on = bitsRow[col] === '1'
      bits += on ? 1 : 0
      blocks += line[col] === '\u2588' ? 1 : 0
      expect(line[col] === '\u2588').toBe(on)
    }
  }
  expect(blocks).toBe(bits)
})
