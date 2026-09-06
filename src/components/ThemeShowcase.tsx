import { useEffect, useState } from 'react'
import { SITE_THEMES, THEME_EVENT, applyTheme, readTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/** A theme's desktop screenshot, the same one the picker shows. */
const previewSrc = (id: string) => `/assets/images/theme-previews/${id}.webp`

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

/** Fade in each screenshot once it loads, keeping the previous one below. */
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
        'img-outlined absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

/** The selected desktop above a compact grid of theme alternatives. */
export function ThemeShowcase() {
  const worn = useWornTheme()
  const [shown, setShown] = useState<string[]>([])
  useEffect(() => {
    if (!worn) return
    setShown((list) =>
      list.at(-1) === worn ? list : [...list.slice(-1), worn],
    )
  }, [worn])

  return (
    <div className="mt-6 lg:mt-10">
      <figure className="ring-elevation overflow-hidden rounded-xl bg-bg-deep">
        <div className="relative aspect-video bg-bg-deep">
          {shown.map((id) => (
            <Preview
              key={id}
              id={id}
              name={SITE_THEMES.find((theme) => theme.id === id)?.name ?? id}
            />
          ))}
        </div>
      </figure>
      <ul className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:mt-6 lg:grid-cols-6">
        {SITE_THEMES.map((theme) => {
          const selected = theme.id === worn
          return (
            <li key={theme.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => applyTheme(theme.id)}
                className={cn(
                  'group flex w-full flex-col gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
                  selected
                    ? 'text-brand'
                    : 'text-text-secondary hover:text-text',
                )}
              >
                <img
                  src={previewSrc(theme.id)}
                  alt=""
                  width={1200}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    'aspect-video w-full object-cover ring-1 transition-shadow duration-150 group-hover:ring-brand',
                    selected ? 'ring-2 ring-brand' : 'ring-border-subtle',
                  )}
                />
                <span className="text-[11px] leading-snug sm:text-xs">
                  {theme.name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
