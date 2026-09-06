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

/** A compact grid of the desktop themes; each preview applies its theme. */
export function ThemeShowcase() {
  const worn = useWornTheme()

  return (
    <ul className="mt-10 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
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
                selected ? 'text-brand' : 'text-text-secondary hover:text-text',
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
  )
}
