import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRightIcon } from '@/components/icons'
import { CardRail } from '@/components/CardRail'
import voices from '@/data/voices.json'
import { useIsNarrow } from '@/lib/use-media-query'

/**
 * Posts from X, quoted as written and linked to the originals. Each card is
 * the post itself, so the text keeps its own line breaks and its links stay
 * live; the card as a whole is not a link, because a post that mentions
 * someone or something already carries links of its own, and the one to the
 * post sits in the footer where the source is named.
 *
 * On a wide screen the cards flow into columns rather than a grid: the posts
 * run from two lines to a dozen, and a grid would leave a hole under every
 * short one. On a phone they are the same rail as the plugins and themes.
 */
export function Voices() {
  // On a phone the rail ends in the section's own "More on X" button, so
  // the card that says the same would be a slide saying it twice.
  const narrow = useIsNarrow()
  return (
    <CardRail className="mt-10 sm:block sm:columns-2 lg:columns-3">
      {voices.map((post, i) => (
        <Fragment key={post.url}>
          <VoiceCard post={post} />
          {/* The rest are on X, and so is the place to add to them. Placed
              after the fourth post rather than last: the columns fill in
              order, and from there it lands mid-page, under the shortest
              column, instead of dangling off the end of the last one. */}
          {i === 3 && !narrow ? (
            <article className="mb-4 flex w-full flex-col break-inside-avoid gap-4 rounded-xl border border-dashed border-border-subtle p-6">
              <p className="text-[15px] leading-relaxed text-text-muted">
                Running it? Say how it went.
              </p>
              <p className="mt-auto flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
                <PostLink href="https://x.com/intent/post?text=Omarchy%20">
                  Post yours
                </PostLink>
                <PostLink href="https://x.com/search?q=omarchy&f=live">
                  Read the rest
                </PostLink>
              </p>
            </article>
          ) : null}
        </Fragment>
      ))}
    </CardRail>
  )
}

function VoiceCard({ post }: { post: (typeof voices)[number] }) {
  return (
    <article className="ring-elevation mb-4 flex w-full flex-col break-inside-avoid gap-5 rounded-xl bg-surface p-6">
      {/* The longest posts run past a dozen lines; ten keep a card in step
          with its neighbours, and the footer link leads to the whole. */}
      <p className="line-clamp-[10] text-[15px] leading-relaxed whitespace-pre-line text-text-secondary [text-wrap:pretty]">
        {linkify(post.text)}
      </p>
      <footer className="mt-auto flex items-center gap-3">
        <img
          src={post.avatar}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="size-8 shrink-0 rounded-full bg-surface-2 object-cover"
        />
        <span className="flex min-w-0 flex-col">
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
          className="ml-auto inline-flex shrink-0 items-center gap-1 font-mono text-xs text-text-muted underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out hover:text-text hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          on X
          <ArrowUpRightIcon className="size-3.5" />
        </a>
      </footer>
    </article>
  )
}

function PostLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-text-secondary underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out hover:text-text hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
      <ArrowUpRightIcon className="size-3.5" />
    </a>
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
        className="break-all text-text underline decoration-border-strong underline-offset-[3px] transition-colors duration-150 ease-out hover:decoration-brand"
      >
        {token}
      </a>,
    )
    last = at + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
