import { createFileRoute } from '@tanstack/react-router'
import { PageWordmark } from '@/components/PageWordmark'
import themes from '@/data/themes.json'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/themes')({
  head: () =>
    seo({
      title: 'Themes - Omarchy',
      description:
        'Community themes for Omarchy. Install them via Install > Style > Themes in Omarchy.',
      path: '/themes',
    }),
  component: ThemesPage,
})

function ThemesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageWordmark />
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-center page-subtitle text-[0.779625rem] font-normal text-text-secondary sm:text-[0.86625rem]">
          Community themes
        </h1>
        <p className="mt-3 text-[15px] italic leading-relaxed text-text-secondary [text-wrap:pretty]">
          A theme restyles the whole system at once. Install these community
          themes via{' '}
          <span className="font-medium text-text">
            Install &gt; Style &gt; Themes
          </span>{' '}
          in Omarchy. Want yours listed? Open a pull request on the site
          repository.
        </p>
      </header>

      <ul className="mt-10 grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <li key={theme.name}>
            <a
              href={theme.repo}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <img
                src={theme.image}
                alt={`${theme.name} theme screenshot`}
                width={1200}
                height={675}
                loading="lazy"
                decoding="async"
                className="img-outlined aspect-video w-full rounded-lg bg-bg-deep object-cover"
              />
              <span className="mt-2.5 block font-mono text-[13px] text-text-secondary transition-colors duration-150 ease-out group-hover:text-text">
                {theme.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
