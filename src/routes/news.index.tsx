import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRightIcon } from '@/components/icons'
import { OmarchyWordmark, WORDMARK_BANDS } from '@/components/Brand'
import { getNewsIndex } from '@/lib/content'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/news/')({
  // Live from omarchy.org's feed, so a post published this morning is on
  // this page this morning, no import and no deploy in between.
  loader: () => getNewsIndex(),
  head: () =>
    seo({
      title: 'News - Omarchy',
      description:
        'Announcements, releases, and other news from the Omarchy project.',
      path: '/news',
    }),
  component: NewsPage,
})

function NewsPage() {
  const news = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* The wordmark over the page, as the site's own news pages carry the
          mark at the top, in the hero's own bands. */}
      <OmarchyWordmark
        label="Omarchy"
        className="mx-auto mb-[2.6rem] w-full max-w-sm text-[color:var(--t-field-lit)]"
        background={WORDMARK_BANDS}
      />
      <h1 className="sr-only">News</h1>

      <ul className="divide-y divide-border-subtle [&>li:first-child>a]:pt-0">
        {news.map((post) => {
          return (
            <li key={post.slug}>
              <Link
                to="/news/$year/$month/$slug/"
                params={{ year: post.year, month: post.month, slug: post.slug }}
                className="group flex flex-col gap-1.5 py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <time
                  dateTime={post.date}
                  className="font-mono text-xs text-text-muted"
                >
                  {post.dateStr}
                </time>
                <span className="flex items-baseline gap-1.5 font-sans text-lg font-medium text-text transition-colors duration-150 ease-out group-hover:text-brand">
                  {post.title}
                  <ArrowRightIcon className="size-5 shrink-0 self-center text-text-muted transition-[color,translate] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-brand" />
                </span>
                {post.excerpt ? (
                  <span className="text-sm leading-relaxed text-text-secondary [text-wrap:pretty]">
                    {post.excerpt}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
