import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { XIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CardRail } from '@/components/CardRail'
import voices from '@/data/voices.json'

/**
 * Posts from X, quoted as written and linked to the originals. Each card is
 * the post itself, so the text keeps its own line breaks and its links stay
 * live. The whole card opens the post, through the mark's link stretched
 * over it; the links inside the text sit above that and stay their own.
 *
 * On a wide screen the cards flow into columns rather than a grid: the posts
 * run from two lines to a dozen, and a grid would leave a hole under every
 * short one. On a phone they are the same rail as the plugins and themes.
 */
/** The wall's height before the fold, on a wide screen. */
const FOLD_REM = 42

export function Voices() {
  const [open, setOpen] = useState(false)
  const wall = useRef<HTMLDivElement>(null)

  // The fold opens and closes as a height, not a jump, and a height only
  // moves between two numbers. Opening: from the height it has to the
  // height of the whole, measured, and once there the cap comes off so the
  // wall can reflow with the window. Closing: from the whole, set as a
  // number first so there is a start, down to the fold. The fade goes on the
  // same clock, from the class.
  const toggle = () => {
    const el = wall.current
    if (!el) return
    el.style.maxHeight = `${el.offsetHeight}px`
    void el.offsetHeight
    // The class goes on here as well as through state, so the fade starts
    // on the same frame as the height rather than a render later.
    el.classList.toggle('voices-open', !open)
    if (!open) {
      el.style.maxHeight = `${el.scrollHeight}px`
      setOpen(true)
    } else {
      el.style.maxHeight = `${FOLD_REM}rem`
      setOpen(false)
    }
  }
  const settled = () => {
    if (open && wall.current) wall.current.style.maxHeight = 'none'
  }

  return (
    <>
      <div
        ref={wall}
        onTransitionEnd={(event) => {
          if (event.target === wall.current && event.propertyName === 'max-height')
            settled()
        }}
        className={cn('voices', open && 'voices-open')}
        style={{ '--voices-fold': `${FOLD_REM}rem` } as React.CSSProperties}
      >
        <CardRail className="mt-10 sm:block sm:columns-2 lg:columns-3">
          {voices.map((post) => (
            <VoiceCard key={post.url} post={post} />
          ))}
        </CardRail>
      </div>
      {/* The fold is a wide-screen thing; on a phone the rail already shows
          one card at a time. */}
      <div className="mt-6 hidden justify-center sm:flex">
        <Button variant="outline" aria-expanded={open} onClick={toggle}>
          {open ? 'Show less' : 'View more'}
        </Button>
      </div>
    </>
  )
}

function VoiceCard({ post }: { post: (typeof voices)[number] }) {
  return (
    <article className="ring-elevation ring-elevation-hover group relative mb-4 flex w-full flex-col break-inside-avoid gap-4 rounded-xl bg-surface p-6">
      {/* The author first, the way a post reads on the timeline. The mark's
          link is stretched over the whole card, so anywhere on it opens the
          post; the links inside the text sit above it and stay their own. */}
      <header className="flex items-center gap-3">
        <img
          src={post.avatar}
          alt=""
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="size-9 shrink-0 rounded-full bg-surface-2 object-cover"
        />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium text-text">
            {post.name}
          </span>
          <span className="truncate font-mono text-xs text-text-muted">
            @{post.handle} · {shortDate(post.date)}
          </span>
        </span>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the post by ${post.name} on X`}
          className="ml-auto flex size-8 shrink-0 items-center justify-center text-text-muted transition-colors duration-150 ease-out group-hover:text-text before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <XIcon className="size-5" />
        </a>
      </header>
      {/* Sans, not mono: six cards of monospaced prose were a wall. Six lines
          keep the cards in step with each other, and the mark in the header
          leads to the whole post. */}
      <p className="line-clamp-6 font-sans text-[15px] leading-relaxed whitespace-pre-line text-text-secondary [text-wrap:pretty]">
        {/* A blank line in a post is a paragraph break, kept as a small gap
            rather than a whole empty line. */}
        {post.text.split(/\n{2,}/).map((paragraph, i) => (
          <span key={i} className={i ? 'mt-2 block' : 'block'}>
            {linkify(paragraph)}
          </span>
        ))}
      </p>
    </article>
  )
}

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')

/** "2026-09-01" as "Sep 1", the way the timeline itself dates a post. */
function shortDate(iso: string) {
  const [, month, day] = iso.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}`
}

/** A URL, or an @handle at the start of the text or after whitespace. */
const LINK = /(https?:\/\/[^\s<]+)|((?:^|(?<=\s))@[A-Za-z0-9_]{1,15})/g

/**
 * The post's links, made live: a URL opens where it points, an @handle opens
 * the account on X. Everything else stays text, so nothing in a post can
 * become markup.
 */
function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(LINK)) {
    const [token] = match
    const at = match.index
    if (at > last) out.push(text.slice(last, at))
    const href = token.startsWith('@')
      ? `https://x.com/${token.slice(1)}`
      : token
    out.push(
      <a
        key={at}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        // A URL may break anywhere, since it can be longer than the column;
        // a handle is one word and never breaks inside itself.
        className={
          (token.startsWith('@') ? 'whitespace-nowrap ' : 'break-all ') +
          'relative z-10 text-text underline decoration-border-strong underline-offset-[3px] transition-colors duration-150 ease-out hover:decoration-brand'
        }
      >
        {token}
      </a>,
    )
    last = at + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
