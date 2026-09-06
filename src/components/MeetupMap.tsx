import { useEffect, useState } from 'react'
import mapData from '@/data/meetup-map.json'
import { cn } from '@/lib/utils'

/**
 * The world's countries, with a dot lit for every meetup you can still go
 * to and a faint one for every meetup there has been. The shapes and each
 * pin's place on them are computed at build time (scripts/meetup-map.mjs)
 * from Natural Earth, so this is a hundred and seventy paths and a few
 * circles: no map library, the theme's inks throughout.
 *
 * The map moves with the page: pick a region and it glides in on that
 * region, its countries lit; pick a country here or in the list and it
 * comes closer still. Rest on a dot and a card names the meetup; rest on a
 * card below and its dot answers; a dot is the meetup's own link, since
 * whoever found it on the map has found it. Lit dots arrive one after
 * another when the page opens, then stand still.
 */
export type MapPin = {
  id: string
  title: string
  url: string
  when: string
  where: string
  cover: string | null
  /** Whether the pin belongs to what the page is showing right now. */
  shown: boolean
  /** Whether the meetup has already happened. */
  past: boolean
  /** Whether the place is the city, found from the title, not the venue. */
  approximate: boolean
}

/** A box on the map, in its units, to glide onto. */
export type MapBox = { x: number; y: number; width: number; height: number }

const { width: W, height: H } = mapData

/** The box that shows everything. */
export const WHOLE_MAP: MapBox = { x: 0, y: 0, width: W, height: H }

/** The box around a set of points, with room to breathe and never so
 *  small that a dot would be huge. */
export function boxAround(points: { x: number; y: number }[]): MapBox {
  if (points.length === 0) return WHOLE_MAP
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const pad = 40
  let x0 = Math.min(...xs) - pad
  let x1 = Math.max(...xs) + pad
  let y0 = Math.min(...ys) - pad
  let y1 = Math.max(...ys) + pad
  const minW = W / 4
  const minH = H / 4
  if (x1 - x0 < minW) {
    const c = (x0 + x1) / 2
    x0 = c - minW / 2
    x1 = c + minW / 2
  }
  if (y1 - y0 < minH) {
    const c = (y0 + y1) / 2
    y0 = c - minH / 2
    y1 = c + minH / 2
  }
  const ratio = W / H
  if ((x1 - x0) / (y1 - y0) > ratio) {
    const h = (x1 - x0) / ratio
    const c = (y0 + y1) / 2
    y0 = c - h / 2
    y1 = c + h / 2
  } else {
    const w = (y1 - y0) * ratio
    const c = (x0 + x1) / 2
    x0 = c - w / 2
    x1 = c + w / 2
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/** Where the pins are on the map, by meetup. */
export const PIN_AT = new Map(mapData.pins.map((p) => [p.id, p]))

/** The countries the map draws, by code. */
export const COUNTRIES_DRAWN = new Set(mapData.countries.map((c) => c.id))

export function MeetupMap({
  pins,
  box,
  lit,
  chosen,
  pickable,
  onPickCountry,
  active,
  onActive,
  className,
}: {
  pins: MapPin[]
  /** The part of the map to show. */
  box: MapBox
  /** Country codes to light: the region being looked at. */
  lit: Set<string>
  /** The one country chosen, if any. */
  chosen: string | null
  /** Country codes with a meetup coming up, which a press can choose. */
  pickable: Set<string>
  onPickCountry: (code: string | null) => void
  /** The meetup the reader is on, on the map or in the list. */
  active: string | null
  onActive: (id: string | null) => void
  className?: string
}) {
  const placed = pins.flatMap((pin) => {
    const at = PIN_AT.get(pin.id)
    return at ? [{ ...pin, x: at.x, y: at.y }] : []
  })
  // Shown pins over past ones. The order never changes after that: a dot
  // moved in the tree would restart its arrival and blink. The dot the
  // reader is on is drawn again on top instead, further down.
  placed.sort(
    (a, b) =>
      Number(a.past) - Number(b.past) || Number(a.shown) - Number(b.shown),
  )
  const scale = W / box.width
  const k = 1 / Math.sqrt(scale)
  const hovered = active ? placed.find((p) => p.id === active) : undefined

  // The arrival: the lit dots come in one after another once the page is
  // live, not in the built page, where they simply stand. Once they have
  // all come in, the animation is taken off them for good, so nothing
  // that happens later, a hover, a filter, can play it again.
  const [arrival, setArrival] = useState<'still' | 'playing' | 'done'>('still')
  useEffect(() => {
    setArrival('playing')
    const done = window.setTimeout(() => setArrival('done'), 3000)
    return () => window.clearTimeout(done)
  }, [])
  const litPins = placed.filter((p) => p.shown && !p.past)
  const orderOf = new Map(litPins.map((p, i) => [p.id, i]))

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Where the meetups are, on a map of the world"
        className="block h-auto w-full overflow-hidden"
      >
        <g
          className="[transition:transform_600ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `scale(${scale}) translate(${-box.x}px, ${-box.y}px)`,
            transformOrigin: '0 0',
          }}
        >
          {mapData.countries.map((country) => {
            const canPick = pickable.has(country.id)
            const isChosen = chosen === country.id
            return (
              <path
                key={country.id}
                d={country.d}
                onClick={
                  canPick
                    ? () => onPickCountry(isChosen ? null : country.id)
                    : undefined
                }
                className={cn(
                  'transition-[fill] duration-300 ease-out',
                  // The chosen country, then the region's countries with a
                  // meetup, then the rest of the region only just, so a
                  // wide country with none does not flood the view.
                  isChosen
                    ? 'fill-brand/40'
                    : lit.has(country.id) && canPick
                      ? 'fill-brand/20'
                      : lit.has(country.id)
                        ? 'fill-brand/8'
                        : 'fill-surface-2',
                  canPick && 'cursor-pointer hover:fill-brand/30',
                )}
                stroke="var(--color-bg)"
                strokeWidth={0.7 * k}
                strokeLinejoin="round"
              />
            )
          })}
          {placed.map((pin) => {
            const delay = (orderOf.get(pin.id) ?? 0) * 35
            const r = (pin.past ? 2.2 : pin.shown ? 4 : 2.8) * k
            return (
              <a
                key={pin.id}
                href={pin.url}
                className={cn(
                  'cursor-pointer outline-none',
                  arrival === 'playing' &&
                    orderOf.has(pin.id) &&
                    'meetup-pin-in',
                )}
                style={
                  arrival === 'playing'
                    ? { animationDelay: `${delay}ms` }
                    : undefined
                }
                aria-label={`${pin.title}, ${pin.when}, on Luma`}
                onMouseEnter={() => onActive(pin.id)}
                onMouseLeave={() => onActive(null)}
                onFocus={() => onActive(pin.id)}
                onBlur={() => onActive(null)}
              >
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r={r}
                  className={cn(
                    'transition-[fill] duration-150 ease-out',
                    pin.past
                      ? 'fill-text-muted/55'
                      : pin.shown
                        ? 'fill-brand'
                        : 'fill-text-muted',
                  )}
                  stroke="var(--color-bg)"
                  strokeWidth={1.2 * k}
                />
                {/* Room to land on around the dot, but not so much that
                    the next city's dot is under it. */}
                <circle cx={pin.x} cy={pin.y} r={5.5 * k} fill="transparent" />
              </a>
            )
          })}
          {hovered ? (
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={(hovered.past ? 3 : 5) * k}
              className="pointer-events-none fill-brand"
              stroke="var(--color-text)"
              strokeWidth={1.2 * k}
            />
          ) : null}
        </g>
      </svg>

      {/* The card beside the dot the reader is on: the cover, the name,
          when and where, and what a press does. Placed by the dot's share
          of the map, so it follows the zoom, and flipped to the left past
          the middle and upward past the lower part so it never runs off
          the edge. */}
      {hovered ? (
        <div
          role="tooltip"
          className={cn(
            'meetup-card-in pointer-events-none absolute z-10 w-72 max-w-[75vw] overflow-hidden bg-surface shadow-xl ring-1 ring-border-strong',
            (hovered.x - box.x) / box.width > 0.55
              ? '-ml-4 -translate-x-full'
              : 'ml-4',
            (hovered.y - box.y) / box.height > 0.55
              ? '-mt-3 -translate-y-full'
              : 'mt-3',
          )}
          style={{
            left: `${((hovered.x - box.x) / box.width) * 100}%`,
            top: `${((hovered.y - box.y) / box.height) * 100}%`,
          }}
        >
          <div className="flex gap-3 p-3">
            <div
              className={cn(
                'size-16 shrink-0 overflow-hidden bg-bg-deep',
                hovered.past && 'grayscale',
              )}
            >
              {hovered.cover ? (
                <img
                  src={hovered.cover}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm leading-snug font-medium text-text">
                {hovered.title}
              </p>
              <p className="mt-1 font-mono text-xs text-text-secondary">
                {hovered.when}
              </p>
              {hovered.where ? (
                <p className="truncate font-mono text-xs text-text-muted">
                  {hovered.where}
                  {hovered.approximate ? ' · about' : ''}
                </p>
              ) : null}
            </div>
          </div>
          <p className="border-t border-border-subtle px-3 py-1.5 font-mono text-[11px] text-text-muted">
            {hovered.past ? 'Already happened' : 'Coming up'} · opens on Luma
          </p>
        </div>
      ) : null}
    </div>
  )
}
