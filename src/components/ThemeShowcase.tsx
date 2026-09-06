import { useEffect, useState } from 'react'
import { SITE_THEMES, THEME_EVENT, applyTheme, readTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/** A theme's desktop screenshot, the same one the picker shows. */
const previewSrc = (id: string) => `/assets/images/theme-previews/${id}.webp`

/** The inks a row shows for its theme, ground to accent, read straight from
 *  the theme's own tokens by putting the row's chips under its data-theme. */
const CHIPS = [
  '--t-bg',
  '--t-surface-2',
  '--t-text-muted',
  '--t-text',
  '--t-brand',
]

/** The theme the site wears right now, kept current as it changes. Null
 *  until the page is live, since the server cannot know which one the
 *  head script drew. */
function useWornTheme() {
  const [worn, setWorn] = useState<string | null>(null)
  useEffect(() => {
    setWorn(readTheme())
    const onTheme = (event: Event) =>
      setWorn((event as CustomEvent<string>).detail)
    window.addEventListener(THEME_EVENT, onTheme)
    return () => window.removeEventListener(THEME_EVENT, onTheme)
  }, [])
  return worn
}

/** One screenshot in the preview, fading in once it has arrived so a
 *  theme swap is a crossfade and never a pop from an empty box. */
function Preview({ id, name }: { id: string; name: string }) {
  const [ready, setReady] = useState(false)
  return (
    <img
      src={previewSrc(id)}
      alt={`${name} on the desktop`}
      width={1200}
      height={675}
      decoding="async"
      onLoad={() => setReady(true)}
      ref={(img) => {
        if (img?.complete) setReady(true)
      }}
      className={cn(
        'img-outlined absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

/**
 * The themes Omarchy ships with, shown the way the picker shows them: one
 * big screenshot of the theme this site is wearing, and beside it every
 * built-in theme as a row of its own inks. Pressing a row dresses the site
 * in that theme and swaps the screenshot, so the section is the keystroke
 * it talks about, tried by hand.
 */
export function ThemeShowcase() {
  const worn = useWornTheme()

  // The screenshot underneath stays until the next one has faded in over
  // it: the last two worn themes, newest on top.
  const [shown, setShown] = useState<string[]>([])
  useEffect(() => {
    if (!worn) return
    setShown((list) =>
      list.at(-1) === worn ? list : [...list.slice(-1), worn],
    )
  }, [worn])

  const warm = (id: string) => {
    const img = new Image()
    img.src = previewSrc(id)
  }

  return (
    <div className="mt-10">
      <figure className="ring-elevation overflow-hidden rounded-xl bg-bg-deep">
        <div className="relative aspect-video bg-bg-deep">
          {shown.map((id) => (
            <Preview
              key={id}
              id={id}
              name={SITE_THEMES.find((t) => t.id === id)?.name ?? id}
            />
          ))}
        </div>
      </figure>

      <ul
        className="mt-8 grid content-start gap-x-8 sm:grid-cols-2 lg:grid-cols-4"
        role="list"
      >
        {SITE_THEMES.map((t) => {
          const on = t.id === worn
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => applyTheme(t.id)}
                onPointerEnter={() => warm(t.id)}
                onFocus={() => warm(t.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 border-b border-border-subtle py-2.5 text-left text-sm transition-colors duration-150 ease-out',
                  on
                    ? 'font-medium text-brand'
                    : 'text-text-secondary hover:text-text',
                )}
              >
                <span className="truncate">{t.name}</span>
                {/* The chips sit in a hairline grid drawn in the page's
                    own border ink, outside the row's theme, so a theme's
                    ground reads as a square of its own even where it is
                    the page's ground too. */}
                <span
                  aria-hidden="true"
                  className="shrink-0 bg-border-strong p-px"
                >
                  <span data-theme={t.id} className="flex gap-px">
                    {CHIPS.map((v) => (
                      <i
                        key={v}
                        className="block size-3"
                        style={{ background: `var(${v})` }}
                      />
                    ))}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
