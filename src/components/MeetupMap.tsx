import { useEffect, useState } from 'react'
import mapData from '@/data/meetup-map.json'
import { cn } from '@/lib/utils'

/**
 * The world as a grid of squares, in the field's own language, with one
 * lit for every meetup you can still go to and a faint one for every
 * meetup there has been. The grid and each pin's place on it are computed
 * at build time (scripts/meetup-map.mjs), so this is one path and a few
 * squares: no map library, no country shapes, the theme's inks throughout.
 *
 * The map moves with the page: pick a region and it glides in on that
 * region; rest on a dot and a card names the meetup; rest on a card below
 * and its dot answers; press a dot and the page goes to its card. Lit dots
 * arrive one after another when the page opens, and then stand still.
 */
export type MapPin = {
  id: string
  title: string
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

/** A box on the grid, in its units, to glide the map onto. */
export type MapBox = { x: number; y: number; width: number; height: number }

const { width: W, height: H } = mapData

/** The box that shows everything. */
export const WHOLE_MAP: MapBox = { x: 0, y: 0, width: W, height: H }

/** The box around a set of pins, with room to breathe and never so small
 *  that the dots would be huge. */
export function boxAround(points: { x: number; y: number }[]): MapBox {
  if (points.length === 0) return WHOLE_MAP
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const pad = 6
  let x0 = Math.min(...xs) - pad
  let x1 = Math.max(...xs) + pad
  let y0 = Math.min(...ys) - pad
  let y1 = Math.max(...ys) + pad
  // No closer than a third of the map, and in the map's own proportions.
  const minW = W / 3
  const minH = H / 3
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

/** Where the pins are on the grid, by meetup. */
export const PIN_AT = new Map(mapData.pins.map((p) => [p.id, p]))

export function MeetupMap({
  pins,
  box,
  active,
  onActive,
  onPress,
  className,
}: {
  pins: MapPin[]
  /** The part of the map to show. */
  box: MapBox
  /** The meetup the reader is on, on the map or in the list. */
  active: string | null
  onActive: (id: string | null) => void
  /** A press on a dot: the page goes to the meetup's card. */
  onPress: (id: string) => void
  className?: string
}) {
  const placed = pins.flatMap((pin) => {
    const at = PIN_AT.get(pin.id)
    return at ? [{ ...pin, x: at.x, y: at.y }] : []
  })
  // Shown pins over past ones, and the active one on top of all.
  placed.sort(
    (a, b) =>
      Number(a.past) - Number(b.past) ||
      Number(a.shown) - Number(b.shown) ||
      Number(a.id === active) - Number(b.id === active),
  )
  const scale = W / box.width
  const hovered = active ? placed.find((p) => p.id === active) : undefined

  // The arrival: the lit dots come in one after another once the page is
  // live, not in the built page, where they simply stand.
  const [arrived, setArrived] = useState(false)
  useEffect(() => setArrived(true), [])
  let order = 0

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`-1 -1 ${W + 2} ${H + 2}`}
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
          <path
            d={mapData.dots}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5 / Math.sqrt(scale)}
            strokeLinecap="square"
            className="text-text-muted/45"
          />
          {placed.map((pin) => {
            const on = pin.id === active
            const delay = pin.shown && !pin.past ? order++ * 35 : 0
            // A lit dot fills its cell of the grid; the others stay
            // smaller. Under the zoom they grow less than the map does.
            const r =
              (pin.past ? 0.28 : pin.shown ? 0.5 : 0.36) / Math.sqrt(scale)
            return (
              <g
                key={pin.id}
                className={cn(
                  'cursor-pointer outline-none',
                  pin.shown && !pin.past && arrived && 'meetup-pin-in',
                )}
                style={{ animationDelay: `${delay}ms` }}
                tabIndex={0}
                role="button"
                aria-label={`${pin.title}, ${pin.when}`}
                onMouseEnter={() => onActive(pin.id)}
                onMouseLeave={() => onActive(null)}
                onFocus={() => onActive(pin.id)}
                onBlur={() => onActive(null)}
                onClick={() => onPress(pin.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onPress(pin.id)
                  }
                }}
              >
                <rect
                  x={pin.x - r}
                  y={pin.y - r}
                  width={r * 2}
                  height={r * 2}
                  className={cn(
                    'transition-[fill,opacity] duration-150 ease-out',
                    pin.past
                      ? 'fill-text-muted/60'
                      : pin.shown
                        ? 'fill-brand'
                        : 'fill-text-muted',
                    on && 'opacity-70',
                  )}
                />
                {/* The cell is the target: exactly one unit of the grid, so a
                    neighbour a cell away is still its own dot. */}
                <rect
                  x={pin.x - 0.5}
                  y={pin.y - 0.5}
                  width={1}
                  height={1}
                  fill="transparent"
                />
              </g>
            )
          })}
        </g>
      </svg>

      {/* The card beside the dot the reader is on. Placed by the dot's
          share of the map, so it follows the zoom, and flipped to the
          left past the middle so it never runs off the edge. */}
      {hovered ? (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-10 flex w-64 max-w-[70vw] gap-3 bg-surface p-3 shadow-lg ring-1 ring-border-strong',
            (hovered.x - box.x) / box.width > 0.55
              ? '-translate-x-full -ml-3'
              : 'ml-3',
            (hovered.y - box.y) / box.height > 0.6
              ? '-translate-y-full -mt-2'
              : 'mt-2',
          )}
          style={{
            left: `${((hovered.x - box.x) / box.width) * 100}%`,
            top: `${((hovered.y - box.y) / box.height) * 100}%`,
          }}
        >
          {hovered.cover ? (
            <img
              src={hovered.cover}
              alt=""
              className="size-12 shrink-0 object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium text-text">
              {hovered.title}
            </p>
            <p className="mt-0.5 font-mono text-xs text-text-muted">
              {hovered.when}
            </p>
            {hovered.where ? (
              <p className="truncate font-mono text-xs text-text-muted">
                {hovered.where}
                {hovered.approximate ? ' (about)' : ''}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
