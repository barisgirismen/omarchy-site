import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BrushIcon,
  CalendarIcon,
  DiscordIcon,
  DisplayIcon,
  DownloadIcon,
  UsbIcon,
  PlayIcon,
  StoreIcon,
} from '@/components/icons'
import { OmarchyWordmark } from '@/components/Brand'
import { HeroNavGhost } from '@/components/SiteHeader'
import { HeroShader } from '@/components/HeroShader'
import { InstallWalkthrough } from '@/components/InstallWalkthrough'
import { CardRail } from '@/components/CardRail'
import { Figures } from '@/components/Figures'
import { TypewriterTail } from '@/components/TypewriterTail'
import { PluginCard } from '@/components/PluginCard'
import { SectionActions, SectionHeading } from '@/components/SectionHeading'
import { ThemeCard } from '@/components/ThemeCard'
import { VideoCarousel } from '@/components/VideoCarousel'
import { Button } from '@/components/ui/button'
import { useHashLink } from '@/lib/hash-scroll'
import { getNewsIndex } from '@/lib/content'
import { getPluginHighlights } from '@/lib/plugins'
import teams from '@/data/teams.json'
import themes from '@/data/themes.json'
import release from '@/data/version.json'
import { SITE_DESCRIPTION, seo } from '@/lib/seo'

export const Route = createFileRoute('/')({
  // The plugin highlights and the news teasers are independent reads, and
  // the news is live from omarchy.org's feed - so a post published this
  // morning is on the home page this morning. Both are cached server-side,
  // so a cold isolate is the only one that waits on either.
  loader: async () => {
    const [highlights, news] = await Promise.all([
      getPluginHighlights(),
      getNewsIndex(),
    ])
    return { ...highlights, news }
  },
  head: () =>
    seo({
      title: 'Omarchy - Beautiful, fun & opinionated Linux by DHH',
      description: SITE_DESCRIPTION,
      path: '/',
    }),
  component: Home,
})

/** The two ways to run the whole desktop in a window without installing
 *  anything: an app for Apple Silicon Macs, an app for Windows 10 and 11. */
const TRY = {
  mac: { label: 'Try on Mac', href: 'https://github.com/omacom/try-omarchy' },
  windows: {
    label: 'Try on Windows',
    href: 'https://github.com/omacom/try-omarchy-windows',
  },
} as const

/** Which of the two the visitor is most likely on, read after mount so the
 *  server and the first paint agree; null on Linux and on anything unsure. */
function useTryDevice() {
  const [device, setDevice] = useState<keyof typeof TRY | null>(null)
  useEffect(() => {
    const ua = navigator.userAgent
    if (/iPhone|iPad/.test(ua)) return
    if (/Mac/.test(ua)) setDevice('mac')
    else if (/Win/.test(ua)) setDevice('windows')
  }, [])
  return device
}

/* What the section's title finishes with, in turn. The first is the claim the
   campaign makes - everything is every + thing, so its line still types out
   whole - and the rest are what it means on a desktop. The shared "every"
   stays put: retyping it four times would spend the animation on the one part
   that never changes, and holding on "We can fix every" reads as a sentence
   about to be finished rather than one merely cut off. */
const FIXES = [
  'thing.',
  ' missing app.',
  ' incompatibility.',
  ' paper cut.',
] as const
const ISO_URL = release.isoUrl

/** The Getting Started chapter, cut to what happens before the ISO boots. */
const BOOT_STEPS = [
  {
    title: 'Get the ISO',
    body: (
      <>
        <a
          href={ISO_URL}
          className="text-text underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out hover:decoration-brand"
        >
          Download {release.version}
        </a>{' '}
        and write it to a USB stick (balenaEtcher, caligula).
      </>
    ),
  },
  {
    title: 'Turn off Secure Boot',
    body: 'And TPM, in the BIOS. The installer needs them off.',
  },
  {
    title: 'Choose where it goes',
    body: 'The whole drive, or the free space beside Windows for a dual boot.',
  },
  {
    title: 'Back up first',
    body: 'Everything is encrypted by default, and a full-disk install wipes the drive.',
  },
]

/* A link inside a card's note: underlined from the start, in the border
   colour, brand on hover - the same as the prose links under the cards. */
const noteLink =
  'text-text-secondary underline decoration-border-strong underline-offset-4 transition-colors duration-150 ease-out hover:text-text hover:decoration-brand'

function ManualLink({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  return (
    <Link to="/manual/$slug/" params={{ slug }} className={noteLink}>
      {children}
    </Link>
  )
}

const videos = [
  {
    id: 'F7fe9pa8OeE',
    title: 'Omarchy Quattro by David Heinemeier Hansson',
    channel: 'DHH',
    thumb: 'https://omarchy.org/assets/images/video/omarchy-quattro.webp',
  },
  {
    id: '9SDkU5VDQEQ',
    title: 'You need to switch to Linux RIGHT NOW!!',
    channel: 'NetworkChuck',
    thumb: 'https://omarchy.org/assets/images/video/networkchuck.webp',
  },
  {
    id: '5JPYJfN7HY0',
    title: 'They finally fixed linux',
    channel: 'typecraft',
    thumb: 'https://omarchy.org/assets/images/video/typecraft.webp',
  },
  {
    id: 'qBKMe8AatY0',
    title: "I Didn't Expect Omarchy 4 to Be This Good",
    channel: 'LinuxBTW',
    thumb: 'https://omarchy.org/assets/images/video/linuxbtw.webp',
  },
  {
    id: 'KO2T0oET9go',
    title: 'If you use AI, switch to Omarchy immediately',
    channel: 'Alex Finn',
    thumb: 'https://omarchy.org/assets/images/video/alex-finn.webp',
  },
]

/** Core is the team the home page shows; the rest are one click away. The copy
 *  deliberately counts nobody: the roster changes, and a headcount in prose is
 *  the kind of number that quietly goes wrong between content refreshes. */
const core = teams.find((t) => t.id === 'core') ?? teams[0]

const communityCards = [
  {
    icon: DiscordIcon,
    title: 'Discord',
    body: 'Daily chatter, support, and show-and-tell with thousands of Omarchs.',
    href: 'https://discord.gg/tXFUdasqhY',
    cta: 'Join the server',
  },
  {
    icon: CalendarIcon,
    title: 'Meetups',
    body: 'Omarchy meetups are popping up around the world. Find one near you, or start one.',
    splat: 'meetups',
    cta: 'Find a meetup',
  },
  {
    icon: BrushIcon,
    title: 'Artists in Residence',
    body: 'A six-month, funded residency for the artists who make Omarchy beautiful.',
    splat: 'air',
    cta: 'Meet the artists',
  },
  {
    icon: StoreIcon,
    title: 'Merch',
    body: 'Wear the wordmark. Official Omarchy gear from the 37signals supply store.',
    href: 'https://supply.37signals.com/collections/omarchy',
    cta: 'Browse the store',
  },
]

function Home() {
  const { top, total, news } = Route.useLoaderData()
  const device = useTryDevice()
  const [intro, setIntro] = useState(false)
  const installLink = useHashLink('install')
  const watchLink = useHashLink('watch')
  const [painted, setPainted] = useState(false)

  // Intro stagger plays once per session; returning within the session
  // renders the resting state immediately.
  useEffect(() => {
    if (!sessionStorage.getItem('omarchy-intro-seen')) {
      sessionStorage.setItem('omarchy-intro-seen', 'true')
      setIntro(true)
    }
  }, [])

  // Each of these renders twice: in the heading row on a wide screen, at the
  // end of its section on a narrow one.
  const allPlugins = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link to="/plugins/" />}
    >
      All plugins
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )
  const allThemes = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link to="/themes/" />}
    >
      All themes
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )
  const allNews = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link to="/news/" />}
    >
      All news
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )
  const installGuide = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link to="/manual/$slug/" params={{ slug: 'getting-started' }} />}
    >
      Read the install guide
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )
  const allTeams = (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link to="/$/" params={{ _splat: 'teams' }} />}
    >
      All teams
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )

  return (
    <main>
      {/* hero: one screen, three elements. The field and the wordmark are
          drawn on one shared pixel grid; nothing here repeats the nav. */}
      <section
        data-hero-sentinel
        className={
          // The hero is a surface you touch, not a passage you read: a long
          // press on it was raising a selection and the callout menu over the
          // field instead of doing nothing.
          'pixel-container relative -mt-(--nav-h) flex min-h-svh flex-col overflow-hidden border-b border-border-subtle pt-(--nav-h) select-none [-webkit-touch-callout:none]' +
          (intro ? ' hero-intro' : '')
        }
        style={{ background: 'var(--t-field-bg)' }}
      >
        <HeroShader onPainted={() => setPainted(true)} />

        {/* The bar's labels, blended against the canvas. They have to live in
            here to reach it: the real header is sticky, and a sticky element
            isolates everything inside it from the page behind. */}
        <HeroNavGhost />

        <div className="pointer-events-none relative flex flex-1 flex-col items-center px-6">
          {/* 2.1 : 1 puts the wordmark's center about 5.7% above the
              viewport's, the classic optical center. Dead center would read
              as sitting low and crowd the copy below. */}
          <div className="flex-[2.1]" />
          {/* The slot the field measures its cell size from. Server-rendered
              as the SVG so the wordmark is there before any script runs, then
              handed over to the canvas once it has painted the same pixels. */}
          <OmarchyWordmark
            data-hero-wordmark
            className={
              'w-[88%] max-w-4xl text-[color:var(--t-field-lit)]' +
              (painted ? ' invisible' : '')
            }
          />
          <div className="flex-1" />

          <div
            data-hero-quiet
            className="pointer-events-auto flex w-full max-w-2xl flex-col items-center pb-24 text-center"
          >
            <h1
              data-hero-stagger
              style={{ '--stagger': 0 } as React.CSSProperties}
              className="text-2xl font-medium tracking-tight text-text [text-wrap:balance] sm:text-3xl"
            >
              <span className="sr-only">Omarchy: </span>
              Beautiful, fun &amp; opinionated Linux by{' '}
              <a
                href="https://dhh.dk"
                className="underline decoration-border-strong underline-offset-[6px] transition-colors duration-150 ease-out hover:decoration-brand"
              >
                DHH
              </a>
              .
            </h1>
            <p
              data-hero-stagger
              style={{ '--stagger': 1 } as React.CSSProperties}
              className="mt-4 text-[15px] leading-relaxed text-text-secondary"
            >
              {/* Each sentence keeps its own line, so balancing can never
                  strand the opening word of the second one up on the first. */}
              <span className="block [text-wrap:balance]">
                The malleable OS for the age of agents.
              </span>
              <span className="block [text-wrap:balance]">
                Vibe your way through every alteration, tweak, and desire.
              </span>
            </p>

            <div
              data-hero-stagger
              data-hero-cta
              style={{ '--stagger': 2 } as React.CSSProperties}
              className="mt-9 flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row lg:gap-[calc(var(--pxc)*2)]"
            >
              {/* Both stay fully opaque, hover included: the default hover
                  drops the fill to 80% and the outline variant is a tinted
                  translucent panel, which lets the field show through the
                  one place on the site with a moving background. Height
                  still tracks the lattice; width follows the label so the
                  padding is not eaten by a cell count. */}
              <Button
                size="lg"
                className="lg:h-[calc(var(--pxr)*4)]"
                nativeButton={false}
                onClick={installLink}
                render={<Link to="/" hash="install" />}
              >
                <DownloadIcon data-icon="inline-start" />
                Get Omarchy
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="lg:h-[calc(var(--pxr)*4)]"
                nativeButton={false}
                onClick={watchLink}
                render={<Link to="/" hash="watch" />}
              >
                <PlayIcon data-icon="inline-start" />
                See it in action
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The case for Omarchy, in one section: what it is, what that buys
          you, what it looks like in use, and how to get it. These were four
          separate sections that mostly restated each other. A column of five
          pillars used to run beside this one, restating in a list what these
          few sentences and the quote already say; the page introduces the
          idea here and lets the manual do the explaining. The install is
          deliberately thin here too: this is a landing page. */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
          {/* The words on the left, the quote across from them: with the
              column of pillars gone, a single column left the right half of
              the page empty. */}
          <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
            <div>
              {/* Unattributed on purpose: this is the site's own voice, not
                  a quotation set apart from it. */}
              {/* The line is a quotation of the campaign it names, so it
                  points at it, wearing the hero byline's underline. The
                  sentence it reads out is the campaign's, whatever the tail
                  happens to be showing. */}
              <h2
                data-typed-block
                className="text-2xl font-semibold tracking-tight text-text [contain:layout] [text-wrap:balance] sm:text-[1.75rem]"
              >
                <a
                  href="https://wecanfixeverything.com/"
                  className="underline decoration-border-strong underline-offset-[6px] transition-colors duration-150 ease-out hover:decoration-brand"
                >
                  <span className="sr-only">We can fix everything.</span>
                  <span aria-hidden="true">
                    We can fix every
                    <TypewriterTail phrases={FIXES} />
                  </span>
                </a>
              </h2>
              <p className="mt-6 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                Linux on the desktop has always asked for a weekend before it
                gave anything back: a window manager to pick, a terminal to
                theme, a hundred small decisions between you and a machine you
                like using. Omarchy answers those decisions with taste, and then
                leaves every one of them open.
              </p>
              <p className="mt-5 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                The name says as much. Oma is for omakase, chef's choice: the
                chef picks the courses, and you are still free to send anything
                back.
              </p>

              {/* A quote marked as one by being one: bigger type, real
                  quotation marks, a name under it. The accent bar down the
                  left was generic blockquote furniture, and it read as a
                  rule the rest of the page does not use. */}
            </div>

            {/* Sat under the words before, so it keeps a top margin for
                that; beside them it has none, and it holds the page's right
                edge rather than floating in the middle of the column. */}
            <div className="lg:justify-self-end lg:self-center lg:[&>figure]:-mt-[3px]">
              <DhhQuote />
            </div>
          </div>
        </div>

        {/* seeing it, as a band across the page: the rail wants the whole
            window, and the change of ground marks the turn from the case to
            the evidence without starting a new section */}
        <div
          id="watch"
          data-ground
          className="border-y border-border-subtle bg-bg-deep py-24"
        >
          <VideoCarousel
            level={3}
            title="See it in action"
            description="The introduction from DHH, and what the Linux YouTube circuit made of it."
            videos={videos}
          />
        </div>

        <div id="install" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading
            level={3}
            title="Install Omarchy"
            description="Omarchy installs as a complete operating system: from a USB stick to a full, encrypted desktop in under a minute. Not ready to give it a drive? Try it as an app first."
            action={installGuide}
          />

          {/* A fork in the road reads as two things you pick between, so they
              are cards, the same ones the plugins, themes and community use.
              Both blurbs run to two lines and both notes to one, so the thing
              you press sits on the same line in each. The second card used to
              carry the curl one-liner for an existing Arch install; that route
              is gone, and in its place are the two Try apps, which is what
              someone not ready to wipe a drive is actually looking for. The
              note under the download says how long it takes, and where the
              checksum is, rather than the size and architecture, which nobody
              would remember to keep current. */}
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="ring-elevation flex min-w-0 flex-col bg-surface p-6">
              <div className="flex items-center gap-2.5">
                <UsbIcon className="size-5 text-brand" />
                <h4 className="text-lg font-medium tracking-tight text-text">
                  Start from scratch
                </h4>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                Write the ISO to a USB stick and answer five questions. It hands
                back a finished desktop.
              </p>
              <div className="mt-auto pt-6">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<a href={ISO_URL} />}
                >
                  <DownloadIcon data-icon="inline-start" />
                  Download Omarchy {release.version}
                </Button>
                <p className="mt-2.5 text-[13px] text-text-muted">
                  Under a minute from stick to desktop.
                  <br className="hidden md:inline" />
                  Verify the file:{' '}
                  <a href={`${ISO_URL}.sha256`} className={noteLink}>
                    SHA-256
                  </a>
                  ,{' '}
                  <a href={`${ISO_URL}.sig`} className={noteLink}>
                    signature
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="ring-elevation flex min-w-0 flex-col bg-surface p-6">
              <div className="flex items-center gap-2.5">
                <DisplayIcon className="size-5 text-brand" />
                <h4 className="text-lg font-medium tracking-tight text-text">
                  Try it first
                </h4>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                The whole desktop as an app on your Mac or Windows PC. Nothing
                partitioned, nothing changed underneath.
              </p>
              <div className="mt-auto pt-6">
                {/* Both apps, the visitor's own machine's filled in once the
                    browser has said which it is; on Linux, neither. */}
                <div className="flex flex-wrap gap-2">
                  {(['mac', 'windows'] as const).map((key) => (
                    <Button
                      key={key}
                      size="lg"
                      variant={device === key ? 'default' : 'outline'}
                      nativeButton={false}
                      render={<a href={TRY[key].href} />}
                    >
                      {TRY[key].label}
                      <ArrowUpRightIcon data-icon="inline-end" />
                    </Button>
                  ))}
                </div>
                <p className="mt-2.5 text-[13px] text-text-muted">
                  Apple Silicon Macs, Windows 10 and 11.
                  <br className="hidden md:inline" />
                  On Linux, the ISO is the way in.
                </p>
              </div>
            </div>
          </div>

          {/* Then, in reading order, what the ISO route asks of you: the
              Getting Started chapter cut to what has to happen before the
              stick goes in, and the installer playing its questions through,
              side by side where there is room. The dual boot and unattended
              variants hang off the list, so they are not repeated below the
              cards. */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="ring-elevation flex min-w-0 flex-col bg-surface p-6">
              <h4 className="text-lg font-medium tracking-tight text-text">
                Before you boot
              </h4>
              <ol className="mt-4 grid gap-4 text-[15px] leading-relaxed sm:grid-cols-2">
                {BOOT_STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className="grid grid-cols-[2ch_1fr] content-start gap-x-3"
                  >
                    <span className="pt-0.5 font-mono text-xs font-medium text-brand">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-text">{step.title}</span>
                    <span className="col-start-2 text-[13px] text-text-secondary">
                      {step.body}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-auto pt-6 text-[13px] leading-relaxed text-text-muted [text-wrap:pretty]">
                <ManualLink slug="dual-boot-install">Dual boot</ManualLink> and{' '}
                <ManualLink slug="unattended-installs">
                  unattended installs
                </ManualLink>{' '}
                have their own chapters.
              </p>
            </div>
            <InstallWalkthrough
              className="ring-elevation flex min-w-0 flex-col bg-surface"
              aside={
                <>Keyboard, account, disk. The installer takes it from there.</>
              }
            />
          </div>
          <SectionActions>{installGuide}</SectionActions>
        </div>
      </section>

      {/* plugins */}
      <section className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading
            title="A marketplace built into the OS"
            description={`${total.toLocaleString('en-US')} community plugins for the Quattro shell: bars, widgets, overlays, and services, each one a single command away.`}
            action={allPlugins}
          />
          <CardRail className="mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </CardRail>
          <SectionActions>{allPlugins}</SectionActions>
        </div>
      </section>

      {/* themes: the same grid as the plugins above, since a theme and a
          plugin are the same kind of thing to go browsing through */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading
            title="Change everything with one keystroke"
            description={
              <>
                A theme restyles the whole system at once: terminal, bar,
                notifications, wallpaper.
                {/* The site answers the same key Omarchy does, so the section
                    about changing everything with one keystroke can be tried
                    with one. Only where there is a keyboard to try it on -
                    and what that key offers is the themes Omarchy ships
                    with, all of which are here. Named rather than called the
                    built-in ones, which contrasted with nothing once the
                    sentence about community themes came out - and with no
                    count in it, since that is the sort of number that goes
                    quietly stale. */}
                <span className="hidden sm:inline">
                  {' '}
                  Press{' '}
                  <kbd className="border border-border-strong px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
                    T
                  </kbd>{' '}
                  to try the ones Omarchy ships with.
                </span>
              </>
            }
            action={allThemes}
          />
          <CardRail className="mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {themes.slice(0, 6).map((theme) => (
              <ThemeCard key={theme.name} theme={theme} />
            ))}
          </CardRail>
          <SectionActions>{allThemes}</SectionActions>
        </div>
      </section>

      {/* news + foundation */}
      <section className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
            <div>
              <SectionHeading
                title="Latest from the project"
                action={allNews}
              />
              <ul className="mt-8 divide-y divide-border-subtle">
                {news.slice(0, 6).map((post) => (
                  <li key={post.slug}>
                    <Link
                      to="/news/$year/$month/$slug/"
                      params={{
                        year: post.year,
                        month: post.month,
                        slug: post.slug,
                      }}
                      className="group flex flex-col gap-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <time
                        dateTime={post.date}
                        className="font-mono text-xs text-text-muted"
                      >
                        {post.dateStr}
                      </time>
                      <span className="font-sans text-[15px] font-medium text-text transition-colors duration-150 ease-out group-hover:text-brand">
                        {post.title}
                      </span>
                      <span className="text-sm text-text-secondary [text-wrap:pretty]">
                        {post.excerpt}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <SectionActions>{allNews}</SectionActions>
            </div>

            {/* The project in numbers, beside the news the numbers come
                from. Three cards, each counting up once as it arrives. */}
            <Figures />
          </div>
        </div>
      </section>

      {/* the teams, between the project and the people around it: this is
          who steers it. Core is the one shown; the other two are a click
          away rather than sixteen more faces on a landing page. */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading
            title="The people steering it"
            description="Omarchy Core sets the direction, the Security team keeps your system safe, and the Rangers help others find their way."
            action={allTeams}
          />
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {core.members.map((member) => (
              <li key={member.name}>
                <a
                  href={member.href || undefined}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt=""
                      width={240}
                      height={240}
                      loading="lazy"
                      decoding="async"
                      className="img-outlined aspect-square w-full object-cover"
                    />
                  ) : null}
                  {/* Underlined from the start in nothing, so the hover is a
                      colour arriving rather than a line, and the whole card
                      carries it - the same as on the teams page. */}
                  <span className="mt-2.5 block font-sans text-sm font-medium text-text underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out group-hover:decoration-brand">
                    {member.name}
                  </span>
                  <span className="block font-mono text-xs text-text-muted">
                    {member.meta}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <SectionActions>{allTeams}</SectionActions>
        </div>
      </section>

      {/* community */}
      <section className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading
            title="Be the Omarch"
            description="Command your agent, and hang out with the people doing the same."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {communityCards.map((card) => {
              const inner = (
                <>
                  <card.icon className="size-5 text-brand" />
                  <h3 className="mt-3.5 text-[15px] font-medium text-text">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                    {card.body}
                  </p>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-[13px] font-medium text-brand">
                    {card.cta}
                    <ArrowRightIcon className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                  </span>
                </>
              )
              const className =
                'ring-elevation ring-elevation-hover group flex flex-col bg-surface p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
              return 'href' in card ? (
                <a key={card.title} href={card.href} className={className}>
                  {inner}
                </a>
              ) : (
                <Link
                  key={card.title}
                  to="/$/"
                  params={{ _splat: card.splat }}
                  className={className}
                >
                  {inner}
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

/**
 * The quote, in the dressing that won: the glyph inside the card. The panel
 * gives it a place, the oversized green mark anchors it - at this size it
 * reads as two lit pixels, which is the identity - and the inline quotes
 * stay dropped so the mark is the only punctuation dressing the words.
 */
function DhhQuote() {
  return (
    <figure className="mt-12 max-w-md border border-border-subtle bg-surface p-7">
      <div
        aria-hidden="true"
        className="h-10 font-sans text-6xl leading-none font-bold text-brand"
      >
        &ldquo;
      </div>
      {/* Balanced, so the break lands at the comma between the two clauses
          instead of stranding "you should" on a line. */}
      <blockquote className="font-sans text-xl leading-snug font-medium text-text [text-wrap:balance]">
        When you can vibe code whatever app comes to your mind, you should be
        able to vibe code your operating system.
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3.5">
        {/* Sized to weigh the same as the two lines beside it, and framed:
            the photo's bright ground floated loose on the panel without the
            hairline seating it. */}
        <img
          src="/assets/images/team/dhh.webp"
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="size-12 shrink-0 border border-border-subtle object-cover"
        />
        <span className="flex flex-col font-mono leading-snug">
          <span className="text-[15px] font-medium text-text">
            David Heinemeier Hansson
          </span>
          <span className="text-[13px] text-text-muted">
            Creator of Omarchy
          </span>
        </span>
      </figcaption>
    </figure>
  )
}
