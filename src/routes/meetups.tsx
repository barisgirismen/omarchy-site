import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { MeetupCover } from '@/components/MeetupCover'
import { MeetupMap, PIN_AT, WHOLE_MAP, boxAround } from '@/components/MeetupMap'
import { SectionActions } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'
import meetups from '@/data/meetups.json'
import { getPortedPage } from '@/lib/content'
import { REGIONS, regionOf } from '@/lib/regions'
import type { Region } from '@/lib/regions'
import { seo } from '@/lib/seo'
import { cn } from '@/lib/utils'

/**
 * The meetups page: what is coming up, from the Omarchy calendar on
 * Luma, month by month, then what has been, then how to run one. The
 * events are meetups.json, which the refresh job keeps current, drawn
 * the way the home page's strip draws them. The guidelines stay as HTML
 * in the site's own meetups page, so they are edited where they always
 * were. The calendar embed that used to stand here is gone: the events
 * are the page now, and the calendar is a door beside the title.
 */
/** A meetup as the data carries it. Written out rather than read off the
 *  JSON, whose shape shifts with what the calendar happens to hold. */
type Meetup = {
  id: string
  title: string
  url: string
  start: string
  timezone: string | null
  address: string | null
  city: string | null
  country: string | null
  cover: string | null
  coverWidth?: number
  coverHeight?: number
  geo: { lat: number; lon: number; approximate?: boolean } | null
}
const events: Meetup[] = meetups.events

const CALENDAR_URL = 'https://luma.com/omarchy'

export const Route = createFileRoute('/meetups')({
  loader: async () => {
    const page = await getPortedPage({ data: 'meetups' })
    // The guidelines only: the calendar block of the old page is what
    // this page replaces.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the server fn's null answer is mis-narrowed here, as in the catch-all route
    const html = page ? page.html : ''
    return {
      rules: html.replace(
        /<div class="meetups__calendar">[\s\S]*?<\/div>\s*/,
        '',
      ),
    }
  },
  head: () =>
    seo({
      title: 'Meetups - Omarchy',
      description:
        'Omarchy meetups around the world, and how to run your own: about Omarchy, Linux and adjacent hacker culture, open to everyone, and run by the community.',
      path: '/meetups',
    }),
  component: MeetupsPage,
})

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

/** The country's name from its code, or the code when it is not one. */
function countryOf(code: string) {
  try {
    return regionNames.of(code) || code
  } catch {
    return code
  }
}

/** Where a meetup is: city and country, the address when there is no
 *  city, or nothing when the calendar keeps the place for its guests. */
function whereOf(meetup: Meetup) {
  const country = meetup.country ? countryOf(meetup.country) : ''
  if (meetup.city) {
    // Some calendars name the country in the city already.
    if (!country || meetup.city.includes(country)) return meetup.city
    return `${meetup.city}, ${country}`
  }
  return meetup.address || country
}

const inZone = (meetup: Meetup, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: meetup.timezone || 'UTC',
  }).format(new Date(meetup.start))

function MeetupCard({
  meetup,
  active,
  onActive,
}: {
  meetup: Meetup
  active: boolean
  onActive: (id: string | null) => void
}) {
  const where = whereOf(meetup)
  return (
    <li
      id={`meetup-${meetup.id}`}
      onMouseEnter={() => onActive(meetup.id)}
      onMouseLeave={() => onActive(null)}
    >
      <a
        href={meetup.url}
        className={cn(
          'group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
          active && '[&_h3]:text-brand',
        )}
      >
        {meetup.cover ? (
          <img
            src={meetup.cover}
            alt={meetup.title}
            width={meetup.coverWidth}
            height={meetup.coverHeight}
            loading="lazy"
            decoding="async"
            className={cn(
              'aspect-square w-full object-cover transition-[outline-color] duration-150 ease-out',
              active && 'outline-2 outline-offset-2 outline-brand',
            )}
          />
        ) : (
          <div className="aspect-square w-full">
            <MeetupCover />
          </div>
        )}
        <p className="mt-3 font-mono text-xs text-text-muted">
          <time dateTime={meetup.start}>
            {inZone(meetup, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            {' · '}
            {inZone(meetup, { hour: 'numeric', minute: '2-digit' })}
          </time>
        </p>
        <h3 className="mt-1 line-clamp-2 text-lg font-medium text-text group-hover:text-brand">
          {meetup.title}
        </h3>
        {where ? (
          <p className="mt-1 truncate font-mono text-xs text-text-muted">
            {where}
          </p>
        ) : null}
      </a>
    </li>
  )
}

function MeetupsPage() {
  const { rules } = Route.useLoaderData()

  // The first render matches the built page, then the visitor's own clock
  // decides what has passed, the same way the home page's strip does.
  const [now, setNow] = useState(() =>
    Date.parse(`${meetups.refreshed}T00:00:00Z`),
  )
  useEffect(() => setNow(Date.now()), [])
  const allUpcoming = events
    .filter((event) => Date.parse(event.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  const past = events
    .filter((event) => Date.parse(event.start) < now)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start))

  // A region, then a country in it, narrow what is shown: the cards, and
  // which dots on the map are lit. Meetups whose place the calendar keeps
  // for its guests have no country, so they show under every region.
  const [region, setRegion] = useState<Region | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const regions = REGIONS.filter((r) =>
    allUpcoming.some((e) => regionOf(e.country) === r),
  )
  const countries = region
    ? [
        ...new Set(
          allUpcoming
            .filter((e) => regionOf(e.country) === region)
            .flatMap((e) => (e.country ? [e.country] : [])),
        ),
      ].sort((a, b) => countryOf(a).localeCompare(countryOf(b)))
    : []
  const matches = (event: Meetup) =>
    (!region || !event.country || regionOf(event.country) === region) &&
    (!country || event.country === country)
  const upcoming = allUpcoming.filter(matches)
  const pins = [...allUpcoming, ...past].map((event) => ({
    id: event.id,
    title: event.title,
    when: `${inZone(event, { weekday: 'short', month: 'short', day: 'numeric' })} · ${inZone(event, { hour: 'numeric', minute: '2-digit' })}`,
    where: whereOf(event),
    cover: event.cover,
    shown: matches(event),
    past: Date.parse(event.start) < now,
    approximate: Boolean(event.geo?.approximate),
  }))
  // The map glides onto the region or country being looked at: the box
  // around its dots, past and upcoming, or the whole world.
  const focused = allUpcoming.filter(matches)
  const box =
    region || country
      ? boxAround(
          focused.flatMap((e) => (PIN_AT.get(e.id) ? [PIN_AT.get(e.id)!] : [])),
        )
      : WHOLE_MAP
  const pickRegion = (next: Region | null) => {
    setRegion(next)
    setCountry(null)
  }

  // The meetup the reader is on, on the map or in the list; a press on a
  // dot takes the page to its card.
  const [active, setActive] = useState<string | null>(null)
  const goTo = useCallback((id: string) => {
    const card = document.getElementById(`meetup-${id}`)
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    card.querySelector('a')?.focus({ preventScroll: true })
  }, [])

  // Upcoming meetups by month, in the order they come.
  const months: { name: string; id: string; meetups: Meetup[] }[] = []
  for (const meetup of upcoming) {
    const name = inZone(meetup, { month: 'long', year: 'numeric' })
    const last = months.at(-1)
    if (last && last.name === name) last.meetups.push(meetup)
    else
      months.push({
        name,
        id: name.toLowerCase().replace(/\s+/g, '-'),
        meetups: [meetup],
      })
  }

  // The way on to the calendar, in the plain link the home page's
  // sections end on rather than a boxed button.
  const calendar = (
    <a
      href={CALENDAR_URL}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap text-text underline decoration-current underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0"
    >
      The calendar on Luma
      <ArrowRightIcon aria-hidden="true" />
    </a>
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-text">
            Meetups
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
            Omarchy meetups are popping up around the world. Find one near you,
            or start one. Every one of them is on the Omarchy calendar on Luma,
            and this page follows it.
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">{calendar}</div>
      </header>

      <MeetupMap
        pins={pins}
        box={box}
        active={active}
        onActive={setActive}
        onPress={goTo}
        className="mt-10"
      />

      {/* The regions as chips, a legend for the map and a filter for the
          cards in one, with the countries of the chosen region under
          them. Each chip carries its count. */}
      <nav aria-label="Filter the meetups by region" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {[null, ...regions].map((r) => {
            const on = region === r
            const count = r
              ? allUpcoming.filter((e) => regionOf(e.country) === r).length
              : allUpcoming.length
            return (
              <li key={r ?? 'all'}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickRegion(r)}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 border px-3 text-sm transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    on
                      ? 'border-brand bg-brand text-brand-ink'
                      : 'border-border-strong bg-surface text-text hover:bg-surface-2',
                  )}
                >
                  {r ?? 'Everywhere'}
                  <span
                    className={cn(
                      'font-mono text-xs',
                      on ? 'text-brand-ink/70' : 'text-text-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {countries.length > 1 ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {countries.map((code) => {
              const on = country === code
              return (
                <li key={code}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCountry(on ? null : code)}
                    className={cn(
                      'min-h-9 text-sm underline-offset-4 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      on
                        ? 'text-brand underline decoration-current'
                        : 'text-text-secondary hover:text-text',
                    )}
                  >
                    {countryOf(code)}
                    <span className="ml-1.5 font-mono text-xs text-text-muted">
                      {allUpcoming.filter((e) => e.country === code).length}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </nav>

      {months.length === 0 ? (
        <p className="mt-10 text-[15px] text-text-secondary">
          {region || country
            ? 'Nothing coming up there yet. The next one may be yours.'
            : 'Nothing on the calendar right now. The next one may be yours.'}
        </p>
      ) : (
        months.map((month) => (
          <section
            key={month.id}
            aria-labelledby={`month-${month.id}`}
            className="mt-12 first-of-type:mt-10"
          >
            <h2
              id={`month-${month.id}`}
              className="font-sans text-lg font-medium text-text"
            >
              {month.name}
            </h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {month.meetups.map((meetup) => (
                <MeetupCard
                  key={meetup.id}
                  meetup={meetup}
                  active={active === meetup.id}
                  onActive={setActive}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <SectionActions>{calendar}</SectionActions>

      {past.length > 0 ? (
        <section
          aria-labelledby="past-meetups"
          className="mt-14 border-t border-border-subtle pt-10"
        >
          <h2
            id="past-meetups"
            className="font-sans text-lg font-medium text-text"
          >
            Already happened
          </h2>
          <ul className="mt-5 divide-y divide-border-subtle">
            {past.map((meetup) => {
              const where = whereOf(meetup)
              return (
                <li key={meetup.id}>
                  <a
                    href={meetup.url}
                    className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <time
                      dateTime={meetup.start}
                      className="w-24 shrink-0 font-mono text-xs text-text-muted"
                    >
                      {inZone(meetup, { month: 'short', day: 'numeric' })}
                    </time>
                    <span className="min-w-0 flex-1 text-sm text-text-secondary transition-colors duration-150 ease-out group-hover:text-brand">
                      {meetup.title}
                    </span>
                    {where ? (
                      <span className="font-mono text-xs text-text-muted">
                        {where}
                      </span>
                    ) : null}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {/* The guidelines, as the site's own meetups page keeps them: HTML
          edited in place, drawn here in the ported prose. */}
      {rules ? (
        <section
          id="run-your-own"
          className="mt-14 max-w-3xl scroll-mt-[calc(var(--nav-h)+2rem)] border-t border-border-subtle pt-10"
        >
          <div
            className="prose ported"
            dangerouslySetInnerHTML={{ __html: rules }}
          />
        </section>
      ) : null}
    </main>
  )
}
