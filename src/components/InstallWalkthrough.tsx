import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PlayIcon } from '@/components/icons'

/**
 * The ISO's installer, screen by screen, in a window the size of the real
 * thing. Every line is one the installer prints; the answers are the ones a
 * first install would give. It plays once when it scrolls into view, and
 * Replay runs it again. The server renders the last screen, so the static
 * page shows the outcome and the first paint has nothing to reconcile.
 */

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

const Brand = () => (
  <p className="text-lg font-extrabold tracking-[0.5em] text-brand">OMARCHY</p>
)
const Step = ({ children }: { children: ReactNode }) => (
  <p className="font-bold text-text">{children}</p>
)
const Pick = ({ children }: { children: ReactNode }) => (
  <p className="flex gap-[1ch] text-text">
    <span className="font-bold text-brand">❯</span>
    {children}
  </p>
)
const Typed = ({ children }: { children: ReactNode }) => (
  <span className="text-text">{children}</span>
)

/** The wizard's screens and how long each one holds. */
const SCREENS: { ms: number; body: ReactNode }[] = [
  {
    ms: 1100,
    body: (
      <>
        <Brand />
        <p>Beautiful, Fun &amp; Agentic Linux by DHH</p>
        <p className="text-text-muted">Press Return to Start Install</p>
      </>
    ),
  },
  {
    ms: 1100,
    body: (
      <>
        <Step>Let&apos;s setup your machine...</Step>
        <p>Select keyboard layout</p>
        <Pick>English (US)</Pick>
      </>
    ),
  },
  {
    ms: 1500,
    body: (
      <>
        <Step>Let&apos;s setup your user account...</Step>
        <p>
          Username&gt; <Typed>dhh</Typed>
        </p>
        <p>
          Password&gt; <Typed>••••••••</Typed>
        </p>
        <p>
          Hostname&gt; <Typed>omarchy</Typed>
        </p>
        <p>Does this look right?</p>
        <Pick>Yes</Pick>
      </>
    ),
  },
  {
    ms: 1000,
    body: (
      <>
        <Step>Let&apos;s select where to install Omarchy...</Step>
        <p>Select install disk</p>
        <Pick>/dev/nvme0n1</Pick>
      </>
    ),
  },
  {
    ms: 1100,
    body: (
      <>
        <p className="font-bold text-text">
          Everything will be overwritten. There is no recovery possible.
        </p>
        <Pick>Yes, install</Pick>
      </>
    ),
  },
]

const Installing = ({ elapsed }: { elapsed: number }) => {
  const on = Math.round(Math.min(elapsed / INSTALL_MS, 1) * CELLS)
  const tip = TIPS[Math.min(Math.floor(elapsed / TIP_MS), TIPS.length - 1)]
  return (
    <>
      <Step>Installing Omarchy</Step>
      <p className="overflow-hidden whitespace-nowrap text-brand">
        {'█'.repeat(on)}
        {'░'.repeat(CELLS - on)}
      </p>
      <p>
        <span className="font-bold text-text">Tip:</span> {tip}
      </p>
    </>
  )
}

const Done = () => (
  <>
    <Brand />
    <p className="font-bold text-brand">Installed Omarchy</p>
    <p>
      <span className="mt-2 inline-block bg-brand px-3.5 py-0.5 text-xs font-bold tracking-wide text-brand-ink">
        Reboot Now
      </span>
    </p>
  </>
)

type Frame =
  | { kind: 'screen'; index: number }
  | { kind: 'install'; elapsed: number }
  | { kind: 'done' }

export function InstallWalkthrough({
  className,
  aside,
}: {
  className?: string
  /** A line under the screen, so the window holds more than six short
   *  lines of wizard next to a taller card. */
  aside?: ReactNode
}) {
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
      {/* Every screen reserves the height of the tallest (the account, six
          lines), so the window never resizes mid-run. */}
      <div
        aria-hidden="true"
        className="installer-screen grid content-start gap-0.5 p-5 font-mono text-sm leading-relaxed text-text-secondary"
      >
        {frame.kind === 'screen' ? (
          SCREENS[frame.index].body
        ) : frame.kind === 'install' ? (
          <Installing elapsed={frame.elapsed} />
        ) : (
          <Done />
        )}
      </div>
      {aside ? (
        <p className="mt-auto border-t border-border-subtle px-5 py-4 text-[13px] leading-relaxed text-text-muted [text-wrap:pretty]">
          {aside}
        </p>
      ) : null}
    </div>
  )
}
