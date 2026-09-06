#!/usr/bin/env node
/**
 * The world as a grid of dots, with a dot lit for every meetup that has a
 * place, for the meetups page. Built here, at build time, from
 * src/data/meetups.json, and written to src/data/meetup-map.json as one
 * path of dots and the pins' grid positions, so the page draws it as a
 * small inline SVG in the theme's own inks and the browser never loads a
 * map library or the country shapes.
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
 *  page has, and keeps the path under fifty kilobytes. */
const HEIGHT = 60

const meetups = JSON.parse(
  await readFile(path.join(DATA, 'meetups.json'), 'utf8'),
)

const map = new DottedMap({ height: HEIGHT, grid: 'diagonal' })
const { width, height } = map.image
const round = (n) => Math.round(n * 100) / 100
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
console.log(
  `meetup-map.json: ${map.getPoints().length - pins.length} dots, ${pins.length} pins`,
)
