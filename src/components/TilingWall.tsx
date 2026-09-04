import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import release from '@/data/version.json'
import { DEFAULT_THEME, THEME_EVENT } from '@/lib/theme'

/**
 * Five windows tiled the way Hyprland tiles them, and moved the way Hyprland
 * moves them. The slots are the layout and the windows only travel between
 * them: the wide and the tall span belong to the slot, so a swap moves a
 * window, never the wall. Arrows walk the focus by geometry and Shift swaps,
 * the same keys as on the desktop minus the Super the browser would never
 * hand over; a pointer drags one window onto another. Left alone in view, the
 * wall demonstrates itself and always finds its way back home. The sizing
 * and the rings live in styles.css under "tiling wall".
 */

type Window = {
  id: string
  name: string
  rest: string
  note: string
  image?: {
    src: string
    width: number
    height: number
    alt: string
    /** The clipboard shot's right half is an empty preview column; the
     *  search line and the list are on the left and have to survive the
     *  crop. */
    left?: true
  }
}

const WINDOWS: Window[] = [
  {
    id: 'tiling',
    name: 'Hyprland',
    rest: 'four-way tiling',
    note: 'workspace 1',
    image: {
      src: '/assets/images/desktop/fourway-tiling.webp',
      width: 1600,
      height: 900,
      alt: 'Four terminals and an editor tiled in four quadrants',
    },
  },
  {
    id: 'clipboard',
    name: 'Clipboard',
    rest: 'history',
    note: 'Super + Ctrl + V',
    image: {
      src: '/assets/images/desktop/clipboard-history.webp',
      width: 1600,
      height: 1132,
      alt: 'The unified clipboard history overlay listing recent copies',
      left: true,
    },
  },
  { id: 'fetch', name: 'fastfetch', rest: '', note: 'live' },
  {
    id: 'browser',
    name: 'Browser',
    rest: 'and terminal',
    note: 'workspace 2',
    image: {
      src: '/assets/images/desktop/browser-terminal.webp',
      width: 1600,
      height: 900,
      alt: 'A browser and a terminal tiled side by side',
    },
  },
  {
    id: 'tmux',
    name: 'tmux',
    rest: 'session',
    note: 'workspace 3',
    image: {
      src: '/assets/images/desktop/tmux-session.webp',
      width: 1600,
      height: 900,
      alt: 'A tmux session split into several panes',
    },
  },
]

type Dir = readonly [number, number]
const LEFT: Dir = [-1, 0]
const RIGHT: Dir = [1, 0]
const UP: Dir = [0, -1]
const DOWN: Dir = [0, 1]
/** The arrows, and hjkl for the hands that never leave the home row. */
const DIRS: Partial<Record<string, Dir>> = {
  ArrowLeft: LEFT,
  ArrowRight: RIGHT,
  ArrowUp: UP,
  ArrowDown: DOWN,
  h: LEFT,
  l: RIGHT,
  k: UP,
  j: DOWN,
}
/** The autopilot's round: right, down, left, up, and back where it started. */
const TOUR: Dir[] = [RIGHT, DOWN, LEFT, UP]

const SWAP_MS = 180
const EASE = 'cubic-bezier(0.21, 0.47, 0.32, 0.98)'
/** One autopilot move every beat; a swap on every second one. */
const BEAT_MS = 2500
/** How long the wall waits after coming into view before it starts. */
const IDLE_MS = 6000
/** How long any input from the reader keeps the autopilot away. */
const PAUSE_MS = 10000
/** Movement under this is a click, not a drag. */
const DRAG_SLOP = 5

const HOME = WINDOWS.map((_, i) => i)

/** Capture keeps a drag alive past the element's edges. It is a nicety, and
 *  a browser that refuses it must not take the whole gesture down with it. */
const capture = (el: Element, pointerId: number) => {
  try {
    el.setPointerCapture(pointerId)
  } catch {
    /* the drag still tracks through the events bubbling to the wall */
  }
}

const centre = (r: DOMRect) => [r.left + r.width / 2, r.top + r.height / 2]

export function TilingWall() {
  /** slots[i] is the window living in slot i. */
  const [slots, setSlots] = useState<number[]>(HOME)
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState<number | null>(null)
  const [drop, setDrop] = useState<number | null>(null)

  const wall = useRef<HTMLDivElement>(null)
  const tiles = useRef<(HTMLElement | null)[]>([])
  // The latest state, readable from timers and pointer handlers without
  // re-binding them on every render.
  const latest = useRef({ slots, active })
  latest.current = { slots, active }
  const reduced = useRef(false)
  /** Rects taken just before a swap, for the FLIP that plays it back. */
  const before = useRef<DOMRect[] | null>(null)
  const drag = useRef<{
    tile: number
    id: number
    x: number
    y: number
    live: boolean
  } | null>(null)
  const pilot = useRef({
    visible: false,
    resumeAt: 0,
    nextBeat: 0,
    beat: 0,
    undo: [] as [number, number][],
  })

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => (reduced.current = mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const rects = () =>
    tiles.current.map((t) => t?.getBoundingClientRect() ?? new DOMRect())

  /** The nearest window in that direction, measured centre to centre. The
   *  sideways offset counts double, so a straight neighbour always wins. */
  const neighbour = (from: number, dir: Dir) => {
    const all = rects()
    const [ax, ay] = centre(all[from])
    let best: number | null = null
    let score = Infinity
    for (let i = 0; i < all.length; i++) {
      if (i === from) continue
      const [bx, by] = centre(all[i])
      const dx = bx - ax
      const dy = by - ay
      const along = dx * dir[0] + dy * dir[1]
      if (along <= 4) continue
      const off = Math.abs(dx * dir[1] + dy * dir[0])
      const s = along + off * 2
      if (s < score) {
        score = s
        best = i
      }
    }
    return best
  }

  const swap = (a: number, b: number) => {
    const next = latest.current.slots.slice()
    const i = next.indexOf(a)
    const j = next.indexOf(b)
    if (i < 0 || j < 0) return
    next[i] = b
    next[j] = a
    if (!reduced.current) before.current = rects()
    setSlots(next)
  }

  // FLIP: the slots have changed and the browser has laid the windows out in
  // their new places; each one starts from where it was and glides the delta
  // back to nothing.
  useLayoutEffect(() => {
    const from = before.current
    before.current = null
    if (!from) return
    tiles.current.forEach((t, i) => {
      if (!t) return
      const a = from[i]
      const b = t.getBoundingClientRect()
      const dx = a.left - b.left
      const dy = a.top - b.top
      const sx = b.width ? a.width / b.width : 1
      const sy = b.height ? a.height / b.height : 1
      if (!dx && !dy && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
        return
      }
      t.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transform: 'none' },
        ],
        { duration: SWAP_MS, easing: EASE },
      )
    })
  }, [slots])

  const focusTile = (i: number) => {
    setActive(i)
    tiles.current[i]?.focus({ preventScroll: true })
  }

  /** Any input from the reader parks the autopilot; its own moves must not. */
  const nudge = () => {
    pilot.current.resumeAt = performance.now() + PAUSE_MS
  }
  /** A swap by hand makes the autopilot's pending way home meaningless. */
  const userSwap = (a: number, b: number) => {
    pilot.current.undo.length = 0
    swap(a, b)
  }

  // ---- keyboard: only while the focus is inside the wall ----
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const dir = DIRS[event.key] ?? DIRS[event.key.toLowerCase()]
    if (!dir) return
    event.preventDefault()
    nudge()
    const n = neighbour(latest.current.active, dir)
    if (n === null) return
    if (event.shiftKey) userSwap(latest.current.active, n)
    else focusTile(n)
  }

  const tileOf = (target: EventTarget | null) => {
    const el = (target as Element | null)?.closest<HTMLElement>('[data-tile]')
    return el ? Number(el.dataset.tile) : null
  }

  // ---- pointer: drag one window onto another ----
  const tileAt = (x: number, y: number) => {
    const skip = drag.current?.tile
    const all = rects()
    for (let i = 0; i < all.length; i++) {
      if (i === skip) continue
      const r = all[i]
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i
    }
    return null
  }

  const onPointerDown = (event: React.PointerEvent) => {
    const tile = tileOf(event.target)
    if (tile === null) return
    nudge()
    focusTile(tile)
    const target = event.target as Element
    // A mouse grabs the whole window, like Super + drag; a finger keeps to
    // the title bar so the page still scrolls over the screenshots.
    const handle =
      event.pointerType === 'touch'
        ? target.closest<HTMLElement>('[data-bar]')
        : tiles.current[tile]
    if (event.button !== 0 || !handle || target.closest('a, button')) return
    // The screenshots would start a native image drag and swallow the moves.
    if (event.pointerType !== 'touch') event.preventDefault()
    tiles.current[tile]?.getAnimations().forEach((a) => a.cancel())
    drag.current = {
      tile,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      live: false,
    }
    capture(handle, event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const d = drag.current
    if (!d || event.pointerId !== d.id) return
    const dx = event.clientX - d.x
    const dy = event.clientY - d.y
    if (!d.live) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_SLOP) return
      d.live = true
      setDragging(d.tile)
    }
    event.preventDefault()
    const t = tiles.current[d.tile]
    if (t) t.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`
    setDrop(tileAt(event.clientX, event.clientY))
  }

  const endDrag = (event: React.PointerEvent) => {
    const d = drag.current
    if (!d || event.pointerId !== d.id) return
    const over = d.live ? tileAt(event.clientX, event.clientY) : null
    drag.current = null
    const t = tiles.current[d.tile]
    if (t) t.style.transform = ''
    setDragging(null)
    setDrop(null)
    nudge()
    if (over !== null && over !== d.tile) userSwap(d.tile, over)
  }

  // ---- autopilot ----
  useEffect(() => {
    const el = wall.current
    if (!el) return
    const p = pilot.current

    /** The tour's direction, or the next one with a window in it: an edge
     *  must not cost the demo a beat. */
    const tourStep = (from: number, i: number) => {
      for (let k = 0; k < TOUR.length; k++) {
        const n = neighbour(from, TOUR[(i + k) % TOUR.length])
        if (n !== null) return n
      }
      return null
    }
    // Every second beat swaps; three swaps out, then three back, so the wall
    // always returns to how it was.
    const beat = () => {
      const from = latest.current.active
      const n = tourStep(from, p.beat >> 1)
      if (p.beat % 2 === 0) {
        if (n !== null) setActive(n)
      } else if (p.undo.length >= 3) {
        const pair = p.undo.pop()
        if (pair) swap(pair[0], pair[1])
      } else if (n !== null) {
        p.undo.push([from, n])
        swap(from, n)
      }
      p.beat = (p.beat + 1) % (TOUR.length * 2)
    }
    const ticker = setInterval(() => {
      if (!p.visible || reduced.current || drag.current) return
      const now = performance.now()
      if (now < p.resumeAt || now < p.nextBeat) return
      p.nextBeat = now + BEAT_MS
      beat()
    }, 250)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          p.visible = e.intersectionRatio >= 0.4
          if (p.visible) {
            p.resumeAt = Math.max(p.resumeAt, performance.now() + IDLE_MS)
          }
        }
      },
      { threshold: [0.4] },
    )
    io.observe(el)
    return () => {
      clearInterval(ticker)
      io.disconnect()
    }
    // The helpers close over refs only, so this binds once.
  }, [])

  const slotOf = (i: number) => slots.indexOf(i)

  return (
    <div>
      <div
        ref={wall}
        className="tiling-wall grid gap-4"
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          const t = tileOf(event.target)
          if (t !== null) setActive(t)
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {WINDOWS.map((w, i) => (
          <section
            key={w.id}
            ref={(el) => {
              tiles.current[i] = el
            }}
            data-tile={i}
            data-slot={slotOf(i)}
            data-active={active === i || undefined}
            data-dragging={dragging === i || undefined}
            data-drop={drop === i || undefined}
            tabIndex={0}
            aria-label={`${w.name} ${w.rest}`.trim()}
            style={{ order: slotOf(i) }}
            className="tiling-tile ring-elevation flex min-w-0 flex-col overflow-hidden bg-surface select-none"
          >
            {/* Hyprland has no window buttons: the active window is marked
                by its border alone, and the bar is the handle on touch. */}
            <div
              data-bar
              className="flex touch-none items-center gap-[1ch] border-b border-border-subtle px-3 py-2 font-mono text-xs whitespace-nowrap text-text-muted"
            >
              <span className="overflow-hidden text-ellipsis">
                <b className="font-medium text-text">{w.name}</b>
                {w.rest ? ` ${w.rest}` : ''}
              </span>
              <span className="ml-auto shrink-0">{w.note}</span>
            </div>
            {w.image ? (
              <div className="tiling-view relative min-h-0 flex-1">
                <img
                  src={w.image.src}
                  width={w.image.width}
                  height={w.image.height}
                  alt={w.image.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className={
                    'absolute inset-0 size-full object-cover' +
                    (w.image.left ? ' object-left' : '')
                  }
                />
              </div>
            ) : (
              <Fetch />
            )}
          </section>
        ))}
      </div>
      <p className="mt-4 hidden font-mono text-xs text-text-muted sm:block">
        <Key>←</Key>
        <Key>↑</Key>
        <Key>↓</Key>
        <Key>→</Key> focus · <Key>Shift</Key> + arrows swap · drag to swap
      </p>
      <p className="mt-4 font-mono text-xs text-text-muted sm:hidden">
        Hold a title bar to drag a window onto another.
      </p>
    </div>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mr-1 border border-border-strong px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
      {children}
    </kbd>
  )
}

/**
 * The one window without a screenshot: what fastfetch prints on a fresh
 * install. The theme is the site's own, read after mount so the server and
 * the first paint agree, and it follows the picker from then on.
 */
function Fetch() {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  useEffect(() => {
    const sync = () =>
      setTheme(document.documentElement.dataset.theme || DEFAULT_THEME)
    sync()
    window.addEventListener(THEME_EVENT, sync)
    return () => window.removeEventListener(THEME_EVENT, sync)
  }, [])
  const rows: [string, React.ReactNode][] = [
    ['OS', `Omarchy ${release.version}`],
    ['Base', 'Arch Linux'],
    ['Compositor', 'Hyprland'],
    ['Font', 'JetBrains Mono'],
    ['Theme', theme],
    [
      'Source',
      <a
        key="source"
        href="https://github.com/omacom/omarchy"
        className="underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out hover:decoration-brand"
      >
        github.com/omacom/omarchy
      </a>,
    ],
  ]
  return (
    <div className="tiling-view tiling-fetch flex min-h-0 flex-1 flex-col justify-start overflow-hidden p-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs leading-tight">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-brand after:text-text-muted after:content-[':']">
              {k}
            </dt>
            <dd className="truncate text-text">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
