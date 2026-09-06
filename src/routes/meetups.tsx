import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MeetupCover } from '@/components/MeetupCover'
import { SectionActions } from '@/components/SectionHeading'
import { CalendarIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import meetups from '@/data/meetups.json'
import { getPortedPage } from '@/lib/content'
import { seo } from '@/lib/seo'

/**
 * The meetups page: what is coming up, from the Omarchy calendar on
 * Luma, month by month, then what has been, then how to run one. The
 * events are meetups.json, which the refresh job keeps current, drawn
 * the way the home page's strip draws them. The guidelines stay as HTML
 * in the site's own meetups page, so they are edited where they always
 * were. The calendar embed that used to stand here is gone: the events
 * are the page now, and the calendar is a door beside the title.
 */
type Meetup = (typeof meetups.events)[number]

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

function MeetupCard({ meetup }: { meetup: Meetup }) {
  const where = whereOf(meetup)
  return (
    <li>
      <a
        href={meetup.url}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {meetup.cover ? (
          <img
            src={meetup.cover}
            alt={meetup.title}
            width={meetup.coverWidth}
            height={meetup.coverHeight}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full object-cover"
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
  const upcoming = meetups.events
    .filter((event) => Date.parse(event.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  const past = meetups.events
    .filter((event) => Date.parse(event.start) < now)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start))

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

  const calendar = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={CALENDAR_URL} />}
    >
      <CalendarIcon data-icon="inline-start" />
      The calendar on Luma
    </Button>
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

      {months.length === 0 ? (
        <p className="mt-10 text-[15px] text-text-secondary">
          Nothing on the calendar right now. The next one may be yours.
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
                <MeetupCard key={meetup.id} meetup={meetup} />
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
