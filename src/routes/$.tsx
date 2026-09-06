import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPortedPage } from '@/lib/content'
import { SITE_DESCRIPTION, excerptFromHtml, seo } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { PageWordmark } from '@/components/PageWordmark'

/**
 * Serves every standalone page ported from omarchy.org: /air, /foundation,
 * /meetups, /patrons, /security, /security/credits, /sponsorships,
 * /workstations, /potato, /server, /omakub, /brand. Unknown paths 404. The
 * teams page has a route of its own, built from teams.json.
 */
/**
 * The pages ported from omarchy.org are a title and a body of HTML, and
 * neither works as a social card on its own. Their titles are page headings
 * ("Runs great on ancient hardware", "#omarchy-workstations") and two
 * different pages both call themselves "The Omacom Foundation"; their first
 * paragraphs are as often a list of names or a single sponsorship as they
 * are a summary. The set is small, fixed and known, so it is written out.
 *
 * Anything not listed still falls back to the page's own title and first
 * paragraph, which is right for a page added later and never revisited.
 */
const PORTED: Partial<Record<string, { title: string; description: string }>> =
  {
    air: {
      title: 'Artists in Residence - Omarchy',
      description:
        'A six-month residency for artists who make Omarchy beautiful: themes, plugins, and whatever else. Up to five seats at any one time, supported by the Omacom Foundation.',
    },
    brand: {
      title: 'Brand - Omarchy',
      description:
        'The Omarchy wordmark and logo, as vectors and at 4096px, and the terms for using them. Omarchy is a pending trademark.',
    },
    foundation: {
      title: 'Omacom Foundation - Omarchy',
      description:
        'The nonprofit behind Omarchy. It holds the trademarks, funds the infrastructure, promotes the work, and supports the open-source projects and developers it is built on.',
    },
    meetups: {
      title: 'Meetups - Omarchy',
      description:
        'Omarchy meetups around the world, and how to run your own: about Omarchy, Linux and adjacent hacker culture, open to everyone, and run by the community.',
    },
    omakub: {
      title: 'Omakub - Omarchy',
      description:
        'The road to Omarchy started with Omakub, which proved the thesis: give developers a beautiful, complete Linux out of the box and they show up.',
    },
    patrons: {
      title: 'Patrons - Omarchy',
      description:
        'The people and companies funding the Omacom Foundation. Founding patrons contribute $1,000,000 to the mission; distinguished patrons, $100,000.',
    },
    'patrons/badges': {
      title: 'Patron badges - Omarchy',
      description:
        'Every patron of the Omacom Foundation gets a digital rally credential: a badge, a social card, and wallpapers, in four classes, one for each tier of patronage.',
    },
    potato: {
      title: 'Ancient Hardware - Omarchy',
      description: 'Omarchy runs great on ancient hardware.',
    },
    security: {
      title: 'Security - Omarchy',
      description:
        'How to report a vulnerability in Omarchy - tell the Security Team privately at security@omarchy.org - and the people credited for doing exactly that.',
    },
    'security/credits': {
      title: 'Security Credits - Omarchy',
      description: 'The people who responsibly disclosed security vulnerabilities in Omarchy.',
    },
    server: {
      title: 'Server - Omarchy',
      description: 'Omarchy Server 4.0, coming in 2026.',
    },
    sponsorships: {
      title: 'Sponsorships - Omarchy',
      description:
        'How the Omacom Foundation funds the projects Omarchy is built on, starting with an exclusive three-year sponsorship of Hyprland.',
    },
    workstations: {
      title: 'Workstations - Omarchy',
      description:
        'Desks and machines running Omarchy, shared under #omarchy-workstations.',
    },
  }

/** The pages that read best on the news column's measure: prose and short
 *  lists, no galleries or member grids to give the room to. */
const NARROW = new Set([
  'patrons/badges',
  'server',
  'meetups',
  'air',
  'foundation',
  'sponsorships',
  'security',
  'security/credits',
  'brand',
  'omakub',
])

export const Route = createFileRoute('/$')({
  loader: async ({ params }) => {
    const path = (params._splat ?? '').replace(/\/+$/, '')
    const page = await getPortedPage({ data: path })
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- eslint mis-narrows the server-fn return here; tsc sees PortedPage | null
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData, params }) => {
    const path = (params._splat ?? '').replace(/\/+$/, '')
    const written = PORTED[path]
    return seo({
      title: written?.title ?? `${loaderData?.title ?? 'Omarchy'} - Omarchy`,
      description:
        written?.description ??
        ((loaderData && excerptFromHtml(loaderData.html)) || SITE_DESCRIPTION),
      path: `/${path}`,
    })
  },
  component: PortedPage,
})

function PortedPage() {
  const page = Route.useLoaderData()
  const { _splat } = Route.useParams()
  const path = (_splat ?? '').replace(/\/+$/, '')
  const narrow = NARROW.has(path)
  const hasSubtitle = ['foundation', 'potato'].includes(path)
  // Centre the titles beneath the security wordmark and above the badges.
  const centred = path === 'patrons/badges' || path === 'patrons' || path.startsWith('security')

  return (
    <main
      className={cn(
        'mx-auto px-4 sm:px-6',
        path.startsWith('security') || path === 'patrons' ? 'py-8' : 'py-12',
        narrow ? 'max-w-3xl' : 'max-w-6xl',
      )}
    >
      {(path.startsWith('security') || path === 'patrons') && (
        <PageWordmark />
      )}
      <h1
        className={cn(
          path.startsWith('security') || path === 'patrons'
            ? 'page-subtitle text-[0.779625rem] font-normal text-text-secondary sm:text-[0.86625rem]'
            : 'text-3xl font-semibold tracking-tight text-text',
          centred && 'text-center',
        )}
      >
        {page.title}
      </h1>
      <div
        className={cn(
          'prose ported',
          hasSubtitle ? 'mt-2' : 'mt-8',
        )}
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </main>
  )
}
