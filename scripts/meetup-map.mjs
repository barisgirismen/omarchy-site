#!/usr/bin/env node
/**
 * The world as a grid of squares, with one lit for every meetup that has
 * a place, for the meetups page. Built here, at build time, from
 * src/data/meetups.json, and written to src/data/meetup-map.json as one
 * path of dots and the pins' grid positions, so the page draws it as a
 * small inline SVG in the theme's own inks and the browser never loads a
 * map library or the country shapes. The poles are left off: nothing
 * happens there, and the band that is left is wider than it is tall.
 *
 * Run: node scripts/meetup-map.mjs   (part of npm run port)
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import DottedMap from 'dotted-map'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'src/data')

/** Rows of dots. Sixty gives the continents their shape at the width the
 *  page has, and keeps the path small. */
const HEIGHT = 60
/** The band of the world that is kept: Antarctica and the far Arctic go,
 *  where nothing happens, and only sparse islands stand at the edge. */
const REGION = { lat: { min: -56, max: 78 }, lng: { min: -180, max: 180 } }

const meetups = JSON.parse(
  await readFile(path.join(DATA, 'meetups.json'), 'utf8'),
)

const map = new DottedMap({ height: HEIGHT, grid: 'vertical', region: REGION })
const { width, height } = map.image
const round = (n) => Math.round(n * 100) / 100
const land = map.getPoints().length
const dots = map
  .getPoints()
  .map((p) => `M${round(p.x)} ${round(p.y)}h0`)
  .join('')

// Each pin snaps to the nearest dot of the grid, which is where it is drawn.
const pins = []
for (const event of meetups.events) {
  if (!event.geo) continue
  const pin = map.addPin({ lat: event.geo.lat, lng: event.geo.lon })
  pins.push({ id: event.id, x: round(pin.x), y: round(pin.y) })
}

await writeFile(
  path.join(DATA, 'meetup-map.json'),
  JSON.stringify({ width, height, dots, pins }),
)
console.log(`meetup-map.json: ${land} dots, ${pins.length} pins`)
