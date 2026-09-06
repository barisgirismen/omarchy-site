import { useEffect, useState } from 'react'
import { SectionHeading } from '@/components/SectionHeading'
import { MeetupCover } from '@/components/MeetupCover'
import { ArrowRightIcon } from '@/components/icons'
import meetups from '@/data/meetups.json'

export function MeetupShowcase() {
  // Keep the first render identical to the built page, then drop past events
  // using the visitor's current time when the page opens.
  const [now, setNow] = useState(() =>
    Date.parse(`${meetups.refreshed}T00:00:00Z`),
  )
  useEffect(() => setNow(Date.now()), [])
  const upcoming = meetups.events
    .filter((event) => Date.parse(event.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .slice(0, 15)

  return (
    <>
      <SectionHeading
        wide
        anchor="meetups"
        title="Share the love of beautiful, fun & agentic Linux"
        description="Get together with others who love computers as much as you do. Share plugins, present work, and help newcomers into the community."
      />
      <ul
        aria-label="Upcoming Omarchy meetups"
        className="scroll-accent mt-6 flex snap-x snap-proximity gap-6 overflow-x-auto pb-5 lg:mt-10"
      >
        {upcoming.map((event) => (
          <li
            key={event.id}
            className="w-[42.5%] max-w-[15rem] shrink-0 snap-start"
          >
            <a
              href={event.url}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {event.cover ? (
                <img
                  src={event.cover}
                  alt={event.title}
                  width={event.coverWidth}
                  height={event.coverHeight}
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
                <time dateTime={event.start}>
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: event.timezone || 'UTC',
                  }).format(new Date(event.start))}
                </time>
                {event.city ? ` · ${event.city}` : ''}
              </p>
              <h3 className="mt-1 line-clamp-2 text-lg font-medium text-text group-hover:text-brand">
                {event.title}
              </h3>
            </a>
          </li>
        ))}
        <li className="w-40 shrink-0 snap-start sm:w-56">
          <a
            href="https://luma.com/omarchy"
            className="flex aspect-video h-auto min-h-40 items-center justify-center gap-3 font-mono text-lg text-text underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="underline">MORE</span>
            <ArrowRightIcon className="size-6" aria-hidden="true" />
          </a>
        </li>
      </ul>
      <p className="mt-6 text-[15px] leading-relaxed text-text-secondary">
        Don't see a meetup in your city?{' '}
        <a
          href="/meetups/"
          className="whitespace-nowrap underline decoration-border-strong underline-offset-4 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Start your own
        </a>
        .
      </p>
    </>
  )
}
