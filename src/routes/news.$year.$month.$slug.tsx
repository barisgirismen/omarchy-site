import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@/components/icons'
import { OmarchyWordmark, WORDMARK_BANDS } from '@/components/Brand'
import { getNewsPost } from '@/lib/content'
import { SITE_DESCRIPTION, seo } from '@/lib/seo'

/**
 * A post at its canonical address, /news/YYYY/MM/slug/ - the one the feed
 * carries as its GUID and the one every shared link points at. The year and
 * month are part of the address, not of the lookup: the slug alone finds the
 * post, and the date in the path is checked against it so a wrong date is a
 * 404 rather than a duplicate page.
 */
export const Route = createFileRoute('/news/$year/$month/$slug')({
  loader: async ({ params }) => {
    const post = await getNewsPost({ data: params.slug })
    if (!post || post.year !== params.year || post.month !== params.month) {
      throw notFound()
    }
    return post
  },
  head: ({ loaderData }) =>
    seo({
      title: `${loaderData?.title ?? 'News'} - Omarchy News`,
      description: loaderData?.excerpt || SITE_DESCRIPTION,
      path: loaderData?.path ?? '/news/',
      type: 'article',
    }),
  component: NewsPostPage,
})

function NewsPostPage() {
  const post = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* The wordmark over the post, as on the news page. */}
      <OmarchyWordmark
        label="Omarchy"
        className="mx-auto mb-[2.6rem] w-full max-w-sm text-[color:var(--t-field-lit)]"
        background={WORDMARK_BANDS}
      />
      <article>
        <header>
          <p className="font-mono text-xs text-text-muted">
            By{' '}
            <a
              href="https://dhh.dk"
              rel="author"
              className="text-text-secondary"
            >
              DHH
            </a>{' '}
            on <time dateTime={post.date}>{post.dateStr}</time>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">
            {post.title}
          </h1>
        </header>
        <div
          className="prose mt-8"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>

      <Link
        to="/news/"
        className="mt-10 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors duration-150 ease-out hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeftIcon className="size-5" />
        All news
      </Link>
    </main>
  )
}
