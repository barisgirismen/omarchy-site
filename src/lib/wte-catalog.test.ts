import assert from 'node:assert/strict'
import test from 'node:test'
import { effectNames, pickRandomEffect } from './wte-catalog.ts'

test('reads effect names from a catalog and ignores junk', () => {
  assert.deepEqual(
    effectNames([
      { name: 'laseretch', about: 'etch' },
      { name: 'matrix' },
      { about: 'no name' },
      null,
      'decrypt',
    ]),
    ['laseretch', 'matrix'],
  )
})

test('an empty catalog has no next effect', () => {
  assert.equal(pickRandomEffect([], ''), '')
  assert.equal(pickRandomEffect([], 'laseretch'), '')
})

test('a single effect is the only pick, even when it just played', () => {
  assert.equal(pickRandomEffect(['laseretch'], ''), 'laseretch')
  assert.equal(pickRandomEffect(['laseretch'], 'laseretch'), 'laseretch')
})

test('the next pick is never the one that just finished when others exist', () => {
  const names = ['beams', 'decrypt', 'laseretch']
  names.forEach((last, i) => {
    const next = pickRandomEffect(names, last, () => i / names.length)
    assert.notEqual(next, last)
    assert.ok(names.includes(next))
  })
})
