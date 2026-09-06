import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PlayIcon } from '@/components/icons'

/**
 * The ISO's installer, screen by screen, drawn the way it draws them: the
 * logo above every screen, the wizard's questions under it with the answers
 * a first install would give, then the install bar and the reboot button.
 * Every line is one the installer prints. It plays once when it scrolls
 * into view, and Replay runs it again. The server renders the last screen,
 * so the static page shows the outcome and the first paint has nothing to
 * reconcile.
 */

/**
 * logo.txt from the Omarchy repository, which the ISO prints in green: ten
 * rows of block glyphs. Drawn here as rectangles, one per run of filled
 * half-cells, since a font sets the glyphs a hair apart and the logo showed
 * its seams; a cell is one unit wide and two tall, the console's shape.
 */
const LOGO = `                 ▄▄▄
 ▄█████▄    ▄███████████▄    ▄███████   ▄███████   ▄███████   ▄█   █▄    ▄█   █▄
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   ███  ███   ███  ███   ███
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   █▀   ███   ███  ███   ███
███   ███  ███   ███   ███ ▄███▄▄▄███ ▄███▄▄▄██▀  ███       ▄███▄▄▄███▄ ███▄▄▄███
███   ███  ███   ███   ███ ▀███▀▀▀███ ▀███▀▀▀▀    ███      ▀▀███▀▀▀███  ▀▀▀▀▀▀███
███   ███  ███   ███   ███  ███   ███ ██████████  ███   █▄   ███   ███  ▄██   ███
███   ███  ███   ███   ███  ███   ███  ███   ███  ███   ███  ███   ███  ███   ███
 ▀█████▀    ▀█   ███   █▀   ███   █▀   ███   ███  ███████▀   ███   █▀    ▀█████▀
                                       ███   █▀`

const LOGO_ROWS = LOGO.split('\n')
const LOGO_COLS = Math.max(...LOGO_ROWS.map((row) => row.length))
const LOGO_RECTS = LOGO_ROWS.flatMap((row, r) =>
  [
    { y: 2 * r, on: (ch: string) => ch === '█' || ch === '▀' },
    { y: 2 * r + 1, on: (ch: string) => ch === '█' || ch === '▄' },
  ].flatMap(({ y, on }) => {
    const rects: { x: number; y: number; w: number }[] = []
    let start = -1
    for (let c = 0; c <= row.length; c++) {
      const lit = c < row.length && on(row[c])
      if (lit && start < 0) start = c
      if (!lit && start >= 0) {
        rects.push({ x: start, y, w: c - start })
        start = -1
      }
    }
    return rects
  }),
)

const Logo = () => (
  <svg
    viewBox={`0 0 ${LOGO_COLS} ${LOGO_ROWS.length * 2}`}
    className="w-full text-brand"
    shapeRendering="crispEdges"
    aria-hidden="true"
  >
    {LOGO_RECTS.map((rect) => (
      <rect
        key={`${rect.x},${rect.y}`}
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={1}
        fill="currentColor"
      />
    ))}
  </svg>
)

const TIPS = [
  'Super + Space opens the Omarchy menu for apps, settings, and more',
  'Super + K shows all the key bindings',
  'Switch themes from Style > Theme in the Omarchy menu',
  'Super + Ctrl + V opens the clipboard manager',
]
/** Cells in the progress bar, and how long the install and each tip hold. */
const CELLS = 34
const INSTALL_MS = 3000
const TIP_MS = 750
const TICK_MS = 60

const DISK = '/dev/nvme0n1'

const Line = ({ children }: { children: ReactNode }) => (
  <p className="text-text">{children}</p>
)
const Dim = ({ children }: { children: ReactNode }) => (
  <p className="text-text-muted">{children}</p>
)
const Blank = () => <p>&nbsp;</p>
/** A gum choose: its header, then the cursor on the picked entry. */
const Choose = ({ header, pick }: { header: string; pick: string }) => (
  <>
    <p className="text-text-secondary">{header}</p>
    <p className="text-text">
      <span className="text-brand">&gt;</span> {pick}
    </p>
  </>
)
/** A gum input, answered. */
const Input = ({ prompt, value }: { prompt: string; value: string }) => (
  <p className="text-text">
    <span className="text-brand">{prompt}&gt;</span> {value}
  </p>
)
/** A gum confirm: the question, then its buttons with the first one lit. */
const Confirm = ({
  prompt,
  yes,
  no,
  center,
}: {
  prompt?: string
  yes: string
  no?: string
  center?: boolean
}) => (
  <>
    {prompt ? <p className="text-text">{prompt}</p> : null}
    <p className={'flex gap-2' + (center ? ' justify-center' : '')}>
      <span className="bg-brand px-3 text-brand-ink">{yes}</span>
      {no ? (
        <span className="bg-bg-deep px-3 text-text-secondary">{no}</span>
      ) : null}
    </p>
  </>
)

/** The wizard's screens, how long each one holds, and whether it is set
 *  centred under the logo (the greeter and the dashboard) or flush with
 *  its left edge (the configurator's steps). */
const SCREENS: { ms: number; center?: boolean; body: ReactNode }[] = [
  {
    ms: 1100,
    center: true,
    body: (
      <>
        <Line>Beautiful, Fun &amp; Agentic Linux by DHH</Line>
        <Blank />
        <Dim>Press Return to Start Install</Dim>
      </>
    ),
  },
  {
    ms: 1100,
    body: (
      <>
        <Line>Let&apos;s setup your machine...</Line>
        <Dim>Press Ctrl+C to prepare this machine for another owner.</Dim>
        <Blank />
        <Choose header="Select keyboard layout" pick="English (US)" />
      </>
    ),
  },
  {
    ms: 1500,
    body: (
      <>
        <Line>Let&apos;s setup your user account...</Line>
        <Blank />
        <Input prompt="Username" value="dhh" />
        <Input prompt="Password" value="••••••••" />
        <Blank />
        <Confirm prompt="Does this look right?" yes="Yes" no="No, change it" />
      </>
    ),
  },
  {
    ms: 1000,
    body: (
      <>
        <Line>Let&apos;s select where to install Omarchy...</Line>
        <Blank />
        <Choose header="Select install disk" pick={`${DISK} (931.5G)`} />
      </>
    ),
  },
  {
    ms: 900,
    body: (
      <>
        <Line>Let&apos;s select how to install Omarchy...</Line>
        <Blank />
        <Choose
          header={`Select installation mode on ${DISK}`}
          pick="Full disk install"
        />
      </>
    ),
  },
  {
    ms: 1200,
    body: (
      <>
        <Line>
          Everything will be overwritten. There is no recovery possible.
        </Line>
        <Dim>Press Ctrl+C for unencrypted install.</Dim>
        <Blank />
        <Confirm
          prompt={`Confirm overwriting ${DISK}`}
          yes="Yes, install"
          no="No, change it"
        />
      </>
    ),
  },
]

const Installing = ({ elapsed }: { elapsed: number }) => {
  const on = Math.round(Math.min(elapsed / INSTALL_MS, 1) * CELLS)
  const tip = TIPS[Math.min(Math.floor(elapsed / TIP_MS), TIPS.length - 1)]
  return (
    <>
      <Line>Installing Omarchy</Line>
      <Blank />
      <p className="overflow-hidden whitespace-nowrap">
        <span className="text-text">{'█'.repeat(on)}</span>
        <span className="text-text-muted">{'░'.repeat(CELLS - on)}</span>
      </p>
      <Blank />
      <p>
        <span className="text-text-muted">Tip:</span>{' '}
        <span className="text-brand">{tip}</span>
      </p>
    </>
  )
}

const Done = () => (
  <>
    <Line>Installed Omarchy in 0m 52s</Line>
    <Blank />
    <Confirm yes="Reboot Now" center />
  </>
)

type Frame =
  | { kind: 'screen'; index: number }
  | { kind: 'install'; elapsed: number }
  | { kind: 'done' }

export function InstallWalkthrough({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState<Frame>({ kind: 'done' })
  // Counts the runs; each change starts the wizard over from the first
  // screen and cancels whatever the last run still had scheduled.
  const [run, setRun] = useState(0)

  // The first run starts once the whole window has cleared the bottom
  // quarter of the viewport: fully in view, and not just peeking over the
  // edge, so nobody catches it half way through. A window taller than
  // that (a phone, landscape) settles for as much of it as can show.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const room = window.innerHeight * 0.75
    const threshold = Math.min(
      0.98,
      (room * 0.9) / Math.max(1, el.offsetHeight),
    )
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        io.disconnect()
        setRun((n) => n + 1)
      },
      { threshold, rootMargin: '0px 0px -25% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (run === 0) return
    // With motion reduced the outcome is the whole show.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame({ kind: 'done' })
      return
    }
    let index = 0
    let timer = 0
    let ticker = 0
    const next = () => {
      if (index < SCREENS.length) {
        setFrame({ kind: 'screen', index })
        timer = window.setTimeout(next, SCREENS[index].ms)
        index++
        return
      }
      let elapsed = 0
      setFrame({ kind: 'install', elapsed })
      ticker = window.setInterval(() => {
        elapsed += TICK_MS
        if (elapsed >= INSTALL_MS) {
          clearInterval(ticker)
          setFrame({ kind: 'done' })
          return
        }
        setFrame({ kind: 'install', elapsed })
      }, TICK_MS)
    }
    next()
    return () => {
      clearTimeout(timer)
      clearInterval(ticker)
    }
  }, [run])

  const center = frame.kind === 'screen' ? SCREENS[frame.index].center : true

  return (
    <div
      ref={root}
      className={className}
      aria-label="The installer, screen by screen"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5 font-mono text-xs text-text-muted select-none">
        <span className="text-text">omarchy-iso</span>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="flex items-center gap-1.5 border border-border-subtle px-2 py-0.5 text-text-muted transition-colors duration-150 ease-out hover:border-brand hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <PlayIcon className="size-3" />
          Replay
        </button>
      </div>
      {/* The logo stays put; only the lines under it change. Those reserve
          the height of the tallest screen, so the window never resizes
          mid-run. */}
      <div aria-hidden="true" className="p-5 font-mono text-text-secondary">
        <Logo />
        <div
          className={
            'installer-lines mt-3 grid content-start gap-0.5 text-[13px] leading-normal' +
            (center ? ' text-center' : '')
          }
        >
          {frame.kind === 'screen' ? (
            SCREENS[frame.index].body
          ) : frame.kind === 'install' ? (
            <Installing elapsed={frame.elapsed} />
          ) : (
            <Done />
          )}
        </div>
      </div>
    </div>
  )
}
