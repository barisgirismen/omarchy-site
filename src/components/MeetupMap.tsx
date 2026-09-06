import mapData from '@/data/meetup-map.json'
import { cn } from '@/lib/utils'

/**
 * The world as a grid of dots, in the field's own language, with a dot
 * lit for every meetup that has a place. The grid and the pins' places
 * on it are computed at build time (scripts/meetup-map.mjs), so this is
 * one path and a few circles: no map library, no country shapes, and the
 * theme's inks throughout. A lit dot is the meetup's link, and the dots
 * outside the region being looked at fall back to the grid's own grey.
 */
export type MapPin = {
  id: string
  title: string
  url: string
  /** Whether the pin belongs to what the page is showing right now. */
  shown: boolean
}

export function MeetupMap({
  pins,
  className,
}: {
  pins: MapPin[]
  className?: string
}) {
  const byId = new Map(mapData.pins.map((p) => [p.id, p]))
  const placed = pins.flatMap((pin) => {
    const at = byId.get(pin.id)
    return at ? [{ ...pin, x: at.x, y: at.y }] : []
  })
  // Shown pins last, so they sit on top where dots share a cell.
  placed.sort((a, b) => Number(a.shown) - Number(b.shown))

  return (
    <svg
      viewBox={`0 0 ${mapData.width} ${mapData.height}`}
      role="img"
      aria-label="Where the meetups are, on a map of the world"
      className={cn('block h-auto w-full', className)}
    >
      <path
        d={mapData.dots}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.55"
        strokeLinecap="round"
        className="text-text-muted/45"
      />
      {placed.map((pin) => (
        <a key={pin.id} href={pin.url}>
          <title>{pin.title}</title>
          {pin.shown ? (
            <circle cx={pin.x} cy={pin.y} r="1.6" className="fill-brand/25" />
          ) : null}
          <circle
            cx={pin.x}
            cy={pin.y}
            r={pin.shown ? 0.75 : 0.45}
            className={cn(
              'transition-[fill] duration-150 ease-out',
              pin.shown ? 'fill-brand' : 'fill-text-muted',
            )}
          />
          {/* A hand's worth of target around a dot the size of a grain. */}
          <circle cx={pin.x} cy={pin.y} r="2.4" fill="transparent" />
        </a>
      ))}
    </svg>
  )
}
