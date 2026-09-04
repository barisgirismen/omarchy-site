import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  BrushIcon,
  DownloadIcon,
  GithubIcon,
  MenuBarsIcon,
  SearchIcon,
} from '@/components/icons'
import { OmarchyMarkDrawn } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { useHashLink, useTopLink } from '@/lib/hash-scroll'
import { OPEN_PICKER_EVENT } from '@/lib/theme'
import { OPEN_SEARCH_EVENT } from '@/lib/search'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/manual/', label: 'Manual' },
  { to: '/plugins/', label: 'Plugins' },
  { to: '/themes/', label: 'Themes' },
  { to: '/news/', label: 'News' },
] as const

/**
 * One header, always the same content: the glyph, the nav, GitHub, and
 * Install. The only thing scrolling changes is the surface, transparent
 * over the home hero and, past it, one translucent wash of the page's
 * ground with a blur behind it, the same over every section, so nothing
 * appears, disappears, moves or changes colour as you scroll. The name
 * never renders as text; the glyph is the identity.
 */
/**
 * Whether a hero still covers the bar. The bar and its blended ghost both read
 * this, so they can never disagree about which state they are in.
 *
 * Which pages have a hero is a question for the DOM, not for the router. The
 * home page has one; so does the 404, at whatever address someone mistyped,
 * and the router reports nothing about that - a mistyped path resolves to the
 * catch-all route and its match says `success`, or `pending`, and never that
 * it threw. What every one of them does have is the sentinel, so that is what
 * is watched. `seed` only decides the very first paint, before any of this
 * has run, which is the one thing the DOM cannot answer in time.
 */
/**
 * Before the paint, not after it. This chooses which of two label layers is
 * painted, so settling it in a passive effect leaves one frame where the bar
 * is still in the state the previous page left it in: arriving on a page with
 * no hero, that frame has the bar blended with no ghost behind it to fill the
 * labels in, and they vanish. A layout effect runs after the DOM is in place
 * and before anything is drawn, which is exactly when this can be known and
 * still be acted on in time. It does not run on the server, which is what the
 * seed is for.
 */
const useBeforePaint =
  typeof document === 'undefined' ? useEffect : useLayoutEffect

function useHeroInView(seed: boolean) {
  const [heroInView, setHeroInView] = useState(seed)

  useBeforePaint(() => {
    let observer: IntersectionObserver | null = null
    let sizeWatcher: ResizeObserver | null = null
    let settling = 0
    /** The sentinel currently being observed - the element, not the route.
     *  On a client-side navigation the pathname changes before the DOM does:
     *  the outgoing page is still mounted, so an effect keyed on the route
     *  attaches to the outgoing page's sentinel, and when that node is
     *  removed a moment later its observer fires one last time with
     *  isIntersecting false. That false was permanent - the route never
     *  changes again, so nothing re-attached, and the bar arrived at every
     *  hero page unblended. Tracking the element makes the swap visible:
     *  the live sentinel is no longer the watched one, so watch it instead.
     */
    let watched: Element | null = null

    // The same question the observer answers, asked directly: is the hero's
    // bottom edge still below the bar's? Asking it at once matters because
    // the answer is needed on the first frame, and an observer's first
    // callback is not guaranteed to have arrived by then - or at all, while
    // the tab is not being rendered. The observer then keeps it current.
    //
    // null where nothing has been laid out: an unrendered tab measures every
    // box at zero, and zero is not "the hero has scrolled away", it is "no
    // one has asked yet". Answering it would put the bar in the wrong state
    // with no second measurement coming to correct it.
    const covers = (hero: Element, bar: Element) => {
      const barBox = bar.getBoundingClientRect()
      if (barBox.height === 0) return null
      return hero.getBoundingClientRect().bottom > barBox.height
    }

    /**
     * Take the measurement, and if there is nothing to measure yet, come back
     * for it. Bounded, because a tab that is never rendered never lays
     * anything out and would otherwise be asked forever; the observer is
     * still watching either way, and answers as soon as it is shown.
     */
    const settle = (hero: Element, bar: Element, tries = 3) => {
      const covered = covers(hero, bar)
      if (covered !== null) {
        setHeroInView(covered)
        return
      }
      if (tries > 0)
        settling = requestAnimationFrame(() => settle(hero, bar, tries - 1))
    }

    const watch = (hero: Element, bar: Element) => {
      observer?.disconnect()
      // The moment to swap is when the bar's bottom edge meets the hero's,
      // which is the one border the hero and the section under it share.
      // Inset the root by the bar's measured height so the two edges are
      // compared directly: hardcoding it went off by the bar's border, and
      // by a whole row on the narrow layout where the nav wraps under.
      const height = bar.getBoundingClientRect().height
      observer = new IntersectionObserver(
        ([entry]) => setHeroInView(entry.isIntersecting),
        { rootMargin: `-${height}px 0px 0px 0px` },
      )
      observer.observe(hero)
    }

    /**
     * Point everything at whatever sentinel the page has right now. A no-op
     * while the watched one is still the live one; a teardown-and-reattach
     * the moment it is not, whether the page swapped its hero for another or
     * for nothing. Disconnecting the old observer first also discards any
     * report it has queued about the node that just left.
     */
    const sync = () => {
      const hero = document.querySelector('[data-hero-sentinel]')
      if (hero === watched) return
      observer?.disconnect()
      sizeWatcher?.disconnect()
      cancelAnimationFrame(settling)
      watched = hero
      const bar = document.querySelector('header')
      if (!hero || !bar) {
        // Nothing over the bar right now - which is the right answer both on
        // a page with no hero and on one whose chunk is still loading, since
        // the arrivals watcher below re-runs this when a hero does mount.
        setHeroInView(false)
        return
      }
      settle(hero, bar)
      watch(hero, bar)
      // The bar grows a second row of links on narrow screens, so the edge
      // it is measured against moves with the layout.
      sizeWatcher = new ResizeObserver(() => watch(hero, bar))
      sizeWatcher.observe(bar)
    }

    // Every arrival and departure funnels through sync, which is what lets
    // this run once for the life of the header instead of once per route:
    // the DOM says when the hero changes, and the DOM is what is being
    // watched, so there is nothing for the route to add.
    const arrivals = new MutationObserver(sync)
    arrivals.observe(document.body, { childList: true, subtree: true })
    sync()

    return () => {
      cancelAnimationFrame(settling)
      observer?.disconnect()
      sizeWatcher?.disconnect()
      arrivals.disconnect()
    }
  }, [])

  return heroInView
}

/**
 * How solid the bar's surface should be, 0 to 1. It starts filling in the
 * moment the bar's top edge reaches the bottom of the hero's buttons, and is
 * fully opaque exactly where it used to appear all at once: when the bar's
 * bottom edge meets the hero's, the border those two sections share.
 *
 * The value is written to a CSS variable rather than React state, so a scroll
 * costs one style write instead of a re-render, and the anchors are measured
 * once per layout rather than on every frame.
 */
function useNavSurface(
  /** An open sheet needs a bar under it wherever it happens to be. */
  sheetOpen: boolean,
  /** The blended ghost is up behind the bar, so the real labels stand aside. */
  blended: boolean,
  bar: RefObject<HTMLElement | null>,
  /** Re-surveyed on arrival at a new page, whose sections are its own. */
  pathname: string,
) {
  useEffect(() => {
    const el = bar.current
    if (!el) return

    // Exactly one of the two label layers is ever painted. They are never
    // cross-faded: two copies of the same word at partial opacity, one blended
    // and one not, read as hollow, embossed text rather than as a label.
    const solid = (on: boolean) => {
      // One attribute on the bar, which a stylesheet rule reads, rather than
      // an inline colour on each label. The server can render it, so the
      // first paint is already the state this would have settled into: it
      // used to take until the effect ran, and for those frames both layers
      // of every label were painted at once.
      if (on) el.removeAttribute('data-nav-blend')
      else el.setAttribute('data-nav-blend', '')
      const ghost = document.querySelector<HTMLElement>('[data-nav-ghost]')
      if (ghost) ghost.style.opacity = on ? '0' : '1'
    }

    /** Where the hero ends, in page coordinates; the bar is bare above it. */
    let heroBottom = 0
    /** The <main> the last survey read. The route changes before the DOM
     *  does, so the one mounted when this effect runs may be the outgoing
     *  page's; comparing identities is how the swap is noticed. */
    let surveyed: Element | null = null
    /** Whether the mounted page has a hero. Over a hero the bar goes bare
     *  and the blended ghost carries the labels; a page without one has no
     *  such moment, and the bar wears its surface from the first pixel - a
     *  bar that is transparent for the first few dozen pixels of scroll
     *  reads as content sliding under a pane of nothing. */
    let heroUp = false
    // Asked, not waited for. Arriving on a page with the pointer already over
    // the bar - which is what clicking a link in it does - no pointerenter
    // ever fires, because nothing crossed the boundary. The bar would sit in
    // its blended state under a pointer that was already there, and the ghost
    // would go on painting labels through a hover chip it was never
    // compensated against, which is to say invisibly.
    let hovering = el.matches(':hover')

    const survey = () => {
      // Keep the size watcher pointed at whichever <main> is actually
      // mounted; the one this effect started with may already be gone.
      const main = document.querySelector('main')
      if (main !== surveyed) {
        surveyed = main
        sizes.disconnect()
        if (main) sizes.observe(main)
      }
      const hero = document.querySelector('[data-hero-sentinel]')
      heroUp = hero !== null
      heroBottom = hero
        ? hero.getBoundingClientRect().bottom + window.scrollY
        : 0
      return main !== null
    }

    /**
     * One surface everywhere: past the hero the bar wears a translucent wash
     * of the page's ground with a blur behind it, and keeps it across every
     * section, so the page slides under the bar without the bar changing
     * colour. It is bare only while the hero is still under its top edge,
     * where the blended ghost carries the labels. Cheap enough to run
     * straight from the scroll event: it reads scrollY, which costs no
     * layout, against an edge measured once.
     */
    const paint = () => {
      const overHero = heroUp && window.scrollY < heroBottom
      el.style.setProperty('--nav-surface', overHero ? '0' : '1')
      // The ghost holds the labels for as long as it is up, and hovering hands
      // them over early: it sits under the bar and cannot answer a pointer.
      solid(sheetOpen || !blended || hovering)
    }

    const onEnter = () => {
      hovering = true
      paint()
    }
    const onLeave = () => {
      hovering = false
      paint()
    }

    const relayout = () => {
      survey()
      paint()
    }

    // Arriving at /#install, the page is moved to the anchor by whatever
    // handles the hash, which may be before this attaches - and a scroll that
    // has already happened sends no event to catch up on. One more pass once
    // the current task is done reads wherever the page actually ended up.
    const settle = window.setTimeout(relayout, 0)

    // Sections grow as images and fonts land, which moves every edge below.
    // survey() points this at the mounted <main>, and re-points it when the
    // page under the bar is swapped for another.
    const sizes = new ResizeObserver(relayout)

    // The page mounts async on a client-side navigation, so wait for it.
    let probe = 0
    const wait = () => {
      if (survey()) {
        paint()
        return
      }
      probe = requestAnimationFrame(wait)
    }
    wait()

    // A survey taken while the outgoing page was still mounted read that
    // page's sections, and painted the bar for a page that was about to
    // leave. The swap is a DOM event, not a route event - the route already
    // changed - so the DOM says when to look again.
    const arrivals = new MutationObserver(() => {
      if (document.querySelector('main') !== surveyed) relayout()
    })
    arrivals.observe(document.body, { childList: true, subtree: true })

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', paint, { passive: true })
    window.addEventListener('resize', relayout)
    return () => {
      cancelAnimationFrame(probe)
      window.clearTimeout(settle)
      arrivals.disconnect()
      sizes.disconnect()
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', paint)
      window.removeEventListener('resize', relayout)
    }
  }, [sheetOpen, blended, bar, pathname])
}

export function SiteHeader() {
  const { pathname } = useLocation()
  // Seeded with the one page the server can be sure about, then handed over
  // to the sentinel.
  const heroInView = useHeroInView(pathname === '/')
  const [menuOpen, setMenuOpen] = useState(false)
  const installLink = useHashLink('install')
  const homeLink = useTopLink()
  const transparent = heroInView

  // Following a link or hitting Escape closes it; leaving it open across a
  // navigation would cover the page you just asked for.
  useEffect(() => setMenuOpen(false), [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])
  // Anything that floats over the page needs to know the sheet is up, so it
  // can stand aside rather than land on the links.
  useEffect(() => {
    const root = document.documentElement
    if (menuOpen) root.dataset.navMenu = 'open'
    else delete root.dataset.navMenu
    return () => {
      delete root.dataset.navMenu
    }
  }, [menuOpen])
  const bar = useRef<HTMLDivElement>(null)
  // The ramp runs for the whole of the home page, not only while the hero is
  // still in view. Past the hero its own geometry already resolves to a full
  // surface, and gating it on the observer meant nothing was listening to the
  // scroll up there: pressing the mark jumped to the top and the bar kept its
  // background until the observer noticed the hero and rebuilt the ramp, a
  // few frames later. An open sheet still gets its bar back - a menu hanging
  // off nothing, with the page running up between it and the logo, reads as a
  // mistake. A phone gets the same bar as everything else: it used to go
  // without one past the hero, with only the menu button carrying a ground,
  // and the mark sat straight on whatever heading scrolled under it.
  useNavSurface(menuOpen, transparent, bar, pathname)

  const glyph = (
    <Link
      to="/"
      aria-label="Omarchy home"
      onClick={homeLink}
      className="mark-draw-trigger flex items-center"
    >
      <OmarchyMarkDrawn className="size-[22px] shrink-0 text-brand lg:size-[calc(var(--pxc)*2)]" />
    </Link>
  )

  const search = (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Search Omarchy"
      data-nav-glyph
      className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
    >
      <SearchIcon className="size-5" />
    </Button>
  )

  /** The same brush the picker's own hint card shows, so the thing that
   *  teaches the shortcut and the thing that opens it are one mark. */
  const theme = (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Change the theme"
      data-nav-glyph
      className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT))}
    >
      <BrushIcon className="size-5" />
    </Button>
  )

  const install = (
    <Button
      className="relative h-8 px-4 before:absolute before:-inset-y-1.5 lg:h-[calc(var(--pxr)*3)]"
      nativeButton={false}
      onClick={installLink}
      render={<Link to="/" hash="install" />}
    >
      Install
    </Button>
  )

  return (
    <header className="pixel-container sticky top-0 z-(--z-nav)">
      {/* The surface fades in across the scroll between the hero's buttons
          and the hero's bottom edge, rather than switching on at one point.
          --nav-surface carries the progress; everything that makes the bar a
          bar reads from it, so they arrive together. */}
      <div
        ref={bar}
        // Over the hero the blended ghost holds the labels from the first
        // frame, so the real ones start out of the way.
        data-nav-blend={transparent ? '' : undefined}
        // With the sheet down, the bar is the top of the sheet and wears its
        // ground rather than the section's: taking a colour from the page
        // behind it would put a seam across the one surface being looked at.
        className={cn(
          'transition-[background-color,box-shadow] duration-150 ease-out',
          menuOpen && 'bg-bg/95 backdrop-blur-lg',
        )}
        style={{
          // On the bar rather than the header, so both the surface it paints
          // and the height the hooks measure include the strip above it.
          paddingTop: 'env(safe-area-inset-top)',
          // The page's ground at 90% with the page blurred behind it, and a
          // hairline along the bottom edge: the same on every section, so
          // nothing changes colour on the way down. --nav-surface takes all
          // three away over the hero; the blur is scaled rather than
          // switched, so at zero it is no filter at all.
          //
          // Mixed in sRGB, not oklch. Mixing a colour with `transparent` in a
          // polar space leaves the hue powerless, and a hue of none renders
          // as 0, which is red.
          backgroundColor: menuOpen
            ? undefined
            : 'color-mix(in srgb, var(--color-bg) calc(var(--nav-surface, 0) * 90%), transparent)',
          backdropFilter: menuOpen
            ? undefined
            : 'blur(calc(var(--nav-surface, 0) * 12px))',
          boxShadow: menuOpen
            ? undefined
            : 'inset 0 -1px 0 color-mix(in srgb, var(--color-border-subtle) calc(var(--nav-surface, 0) * 100%), transparent)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {glyph}

          <nav aria-label="Main" className="hidden items-center sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 text-sm whitespace-nowrap text-text-secondary transition-[background-color] duration-150 ease-out hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                activeProps={{ className: 'text-text bg-surface-2' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden items-center gap-1 sm:flex">
              {search}
              {theme}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Omarchy on GitHub"
                data-nav-glyph
                className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
                nativeButton={false}
                render={<a href="https://github.com/omacom/omarchy" />}
              >
                <GithubIcon className="size-5" />
              </Button>
              <span className="ml-2 flex">{install}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              data-nav-toggle
              className="relative size-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 sm:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'Close menu' : 'Menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuBarsIcon open={menuOpen} className="size-[22px]" />
            </Button>
          </div>
        </div>
      </div>
      {/* Tapping the page behind the sheet closes it. The header is an
          inline-size container, so it is the containing block for fixed
          children as well - bottom-0 would resolve to the bar's own 56px, and
          the scrim is sized explicitly instead. Dimmed and blurred the way
          the search and the theme picker dim the page, so the three layers
          open alike; a wash of the page's own colour barely registered on a
          dark theme. */}
      {menuOpen ? (
        <div
          data-menu-scrim
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="absolute inset-x-0 top-(--nav-h) h-svh bg-black/55 supports-backdrop-filter:backdrop-blur-xs sm:hidden"
        />
      ) : null}

      {/* Overlaid, not stacked: pushing the page down would change the bar's
          height and with it the hero's offsets. */}

      <div
        id="site-menu"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-(--nav-h) border-b border-border-subtle bg-bg/95 backdrop-blur-lg sm:hidden"
      >
        <nav
          aria-label="Main pages"
          className="mx-auto flex max-w-6xl flex-col px-4 py-2"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-[15px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              activeProps={{ className: 'text-text font-medium' }}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
            }}
            className="mt-2 flex items-center gap-2.5 border-t border-border-subtle py-3 pt-4 text-left text-[15px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <SearchIcon className="size-5" />
            Search Omarchy
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT))
            }}
            className="flex items-center gap-2.5 py-3 text-left text-[15px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <BrushIcon className="size-5" />
            Change the theme
          </button>
          <div className="mt-2 flex items-center gap-2.5 border-t border-border-subtle pt-4 pb-2">
            <Button
              className="flex-1"
              nativeButton={false}
              onClick={(event) => {
                setMenuOpen(false)
                installLink(event)
              }}
              render={<Link to="/" hash="install" />}
            >
              <DownloadIcon className="size-5" />
              Install
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              nativeButton={false}
              render={<a href="https://github.com/omacom/omarchy" />}
            >
              <GithubIcon className="size-5" />
              GitHub
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}

/**
 * The blended half of the bar, rendered inside the hero so it shares a
 * stacking context with the pixel canvas. The real header cannot do this
 * itself: it is sticky, sticky always forms a stacking context, and
 * mix-blend-mode inside one has no backdrop to blend against, which is why
 * the bar used to look identical whether or not a lit pixel was behind it.
 *
 * Fixed rather than absolute, so it tracks the sticky bar as the hero scrolls
 * under it. Inert to pointers and to screen readers, and it carries only the
 * labels: the mark and Install keep their own colours and stay with the real
 * header. Colours are pre-compensated (--t-hdr-*), so over the plain field
 * background the difference resolves back to the authored colour and nothing
 * looks different until a pixel actually passes behind.
 */
export function HeroNavGhost() {
  // It does not decide for itself whether the hero is still up. It used to,
  // with a second copy of the watcher the bar uses, and two copies of a
  // watcher are two answers: they were seen reporting opposite things in the
  // same millisecond, which left the bar blended and the labels that fill it
  // hidden. The bar's own effect writes this node's opacity as part of
  // choosing which of the two label layers is painted, so the question is
  // asked once, in one place, and this only has to be here to be filled in.
  return (
    <div
      aria-hidden="true"
      data-nav-ghost
      className="pointer-events-none fixed inset-x-0 top-0 z-(--z-nav) mix-blend-difference"
      // opacity is declared, not left to the stylesheet, because the header
      // hydrates before the hero does and its effect writes this very
      // property onto this node in between; without it here React finds an
      // inline opacity it never rendered and reports a hydration mismatch.
      style={{ paddingTop: 'env(safe-area-inset-top)', opacity: 1 }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* Holds the mark's slot without painting it */}
        <span className="flex items-center">
          <span className="block size-[22px] shrink-0 lg:size-[calc(var(--pxc)*2)]" />
        </span>

        <span className="hidden items-center sm:flex">
          {navLinks.map((link) => (
            <span
              key={link.to}
              className="px-3 py-1.5 text-sm whitespace-nowrap"
              style={{ color: 'var(--t-hdr-text-2)' }}
            >
              {link.label}
            </span>
          ))}
        </span>

        <span className="ml-auto flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1 sm:flex"
            style={{ color: 'var(--t-hdr-text-2)' }}
          >
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <SearchIcon className="size-5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <BrushIcon className="size-5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <GithubIcon className="size-5" />
            </span>
            {/* Install holds its own colours, so the ghost only holds its
                place - same box, same type metrics, nothing painted. The
                border is part of the box: the real button wears a 1px
                transparent one, and without it here the ghost's icons sat
                2px to the right of the real ones, so every swap between
                the two layers read as a wiggle. */}
            <span
              aria-hidden="true"
              className="ml-2 inline-flex h-8 items-center border border-transparent px-4 text-sm font-medium lg:h-[calc(var(--pxr)*3)]"
              style={{ color: 'transparent' }}
            >
              Install
            </span>
          </span>

          <span
            className="flex size-8 items-center justify-center sm:hidden"
            style={{ color: 'var(--t-hdr-text-2)' }}
          >
            <MenuBarsIcon className="size-[22px]" />
          </span>
        </span>
      </div>
    </div>
  )
}
