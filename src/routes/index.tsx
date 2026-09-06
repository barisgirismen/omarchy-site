import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useState } from 'react'
import {
  AppleIcon,
  ArrowRightIcon,
  XIcon,
  ArrowUpRightIcon,
  BankIcon,
  CalendarFilledIcon,
  DiscordIcon,
  DisplayIcon,
  DownloadIcon,
  GithubIcon,
  UsbIcon,
  PlayIcon,
  WindowsIcon,
} from '@/components/icons'
import { OmarchyWordmark, WORDMARK_BANDS } from '@/components/Brand'
import { HeroNavGhost } from '@/components/SiteHeader'
import { HeroShader } from '@/components/HeroShader'
import { EtchPicker } from '@/components/EtchPicker'
import { CardRail } from '@/components/CardRail'
import { Figures } from '@/components/Figures'
import { HardwareShowcase } from '@/components/HardwareShowcase'
import { AgentShowcase } from '@/components/AgentShowcase'
import { GamingShowcase } from '@/components/GamingShowcase'
import { DeveloperShowcase } from '@/components/DeveloperShowcase'
import { TypewriterTail } from '@/components/TypewriterTail'
import { PluginCard } from '@/components/PluginCard'
import {
  SectionActions,
  SectionAnchor,
  SectionHeading,
} from '@/components/SectionHeading'
import { TeamClusters } from '@/components/TeamClusters'
import { PatronHighlights } from '@/components/PatronHighlights'
import { ThemeShowcase } from '@/components/ThemeShowcase'
import { VideoCarousel } from '@/components/VideoCarousel'
import { Voices } from '@/components/Voices'
import { Button } from '@/components/ui/button'
import { useHashLink } from '@/lib/hash-scroll'
import { cn } from '@/lib/utils'
import { getNewsIndex } from '@/lib/content'
import { getPluginHighlights } from '@/lib/plugins'
import bannerData from '@/data/banner.json'
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
      title: 'Omarchy - Beautiful, fun & agentic Linux by DHH',
      description: SITE_DESCRIPTION,
      path: '/',
    }),
  component: Home,
})

/** The two ways to run the whole desktop in a window without installing
 *  anything: an app for Apple Silicon Macs, an app for Windows 10 and 11. */
const TRY = {
  mac: {
    label: 'Try on Mac',
    href: 'https://github.com/omacom/try-omarchy',
    icon: AppleIcon,
  },
  windows: {
    label: 'Try on Windows',
    href: 'https://github.com/omacom/try-omarchy-windows',
    icon: WindowsIcon,
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

/* A link inside a card's note: underlined from the start, in the border
   colour, brand on hover - the same as the prose links under the cards. */
const noteLink =
  'text-text-secondary underline decoration-border-strong underline-offset-4 transition-colors duration-150 ease-out hover:text-text hover:decoration-brand'

// Section navigation stays light, with a full-height target for touch and focus.
const sectionLink =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap text-text underline decoration-white underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0'

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

const communityCards = [
  {
    icon: DiscordIcon,
    title: 'Discord',
    body: 'Daily chatter, support, and show-and-tell with thousands of Omarchs.',
    href: 'https://discord.gg/tXFUdasqhY',
    cta: 'Join the server',
  },
  {
    icon: CalendarFilledIcon,
    title: 'Meetups',
    body: 'Omarchy meetups are popping up around the world. Find one near you, or start one.',
    splat: 'meetups',
    cta: 'Find a meetup',
  },
  {
    icon: GithubIcon,
    title: 'Contribute',
    body: 'File issues, fix bugs, and submit features.',
    href: 'https://github.com/omacom-io/omarchy',
    cta: 'Contribute on GitHub',
  },
  {
    icon: BankIcon,
    title: 'Donate',
    body: 'Help fund the people and projects making Omarchy better for everyone.',
    href: 'https://donate.omarchy.org',
    cta: 'Become a patron',
  },
]

/** The site's callout, or null when banner.json carries none; the JSON's
 *  type only ever sees one of the two. */
const banner = bannerData as typeof bannerData | null

const NEWS_PATH = /^\/news\/(\d{4})\/(\d{2})\/([^/]+)\/?$/

/** The callout pill. A news address is a router link, so the music keeps
 *  playing across the visit; anything else is a plain link. */
function HeroCallout({ href, html }: { href: string; html: string }) {
  const className =
    'group inline-flex max-w-full items-center gap-2 border border-brand/40 bg-bg/60 px-3.5 py-1.5 text-left font-mono text-[13px] leading-snug text-brand transition-colors duration-150 ease-out hover:border-brand hover:bg-brand hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
  const inner = (
    <>
      {/* Wraps on a narrow screen rather than cutting the news short; the
          <s> the old numbers wear when a figure is updated stays legible. */}
      <span
        className="min-w-0 [&_s]:text-current/60"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <ArrowRightIcon className="size-4 shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
    </>
  )
  const news = NEWS_PATH.exec(href)
  if (news)
    return (
      <Link
        to="/news/$year/$month/$slug/"
        params={{ year: news[1], month: news[2], slug: news[3] }}
        className={className}
      >
        {inner}
      </Link>
    )
  return (
    <a href={href} className={className}>
      {inner}
    </a>
  )
}

function Home() {
  const { top, news } = Route.useLoaderData()
  const device = useTryDevice()
  const [intro, setIntro] = useState(false)
  const installLink = useHashLink('install')
  const watchLink = useHashLink('watch')
  const [painted, setPainted] = useState(false)
  const [etchAsked, setEtchAsked] = useState(false)
  useEffect(() => {
    setEtchAsked(new URLSearchParams(window.location.search).has('etch'))
  }, [])
  // The canvas cuts the word in as an entrance, so when it is going to, the
  // server-rendered word steps aside at once rather than showing whole and
  // then vanishing to be redrawn. Reduced motion keeps the plain handover.
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      setPainted(true)
  }, [])
  // The class from the head kept the word hidden until now. It can only go
  // once the word's own hidden class is in the DOM, before the next paint,
  // or the word shows for a frame in between.
  useLayoutEffect(() => {
    if (painted) document.documentElement.classList.remove('etch-pending')
  }, [painted])

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
    <a href="https://plugins.omarchy.org" className={sectionLink}>
      All plugins
      <ArrowRightIcon />
    </a>
  )
  const extraThemes = (
    <Link to="/themes/" className={sectionLink}>
      More community themes
      <ArrowRightIcon />
    </Link>
  )
  const allNews = (
    <Link to="/news/" className={sectionLink}>
      All news
      <ArrowRightIcon />
    </Link>
  )
  const installGuide = (
    <Link
      to="/manual/$slug/"
      params={{ slug: 'getting-started' }}
      className={sectionLink}
    >
      Full installation guide
      <ArrowRightIcon />
    </Link>
  )
  const moreOnX = (
    <a
      href="https://x.com/search?q=omarchy&f=live"
      target="_blank"
      rel="noopener noreferrer"
      className={sectionLink}
    >
      More on <XIcon aria-label="X" />
      <ArrowUpRightIcon />
    </a>
  )
  const allTeams = (
    <Link to="/teams/" className={sectionLink}>
      All teams
      <ArrowRightIcon />
    </Link>
  )
  const allPatrons = (
    <Link to="/$/" params={{ _splat: 'patrons' }} className={sectionLink}>
      All patrons
      <ArrowRightIcon />
    </Link>
  )

  return (
    <main>
      {/* hero: one screen, three elements. The field and the wordmark are
          drawn on one shared pixel grid; nothing here repeats the nav. */}
      <section
        id="home"
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
        {/* The effect panel, only for an address that asks (?etch=...), so
            the dev server shows the same page as the live one. */}
        {etchAsked ? <EtchPicker /> : null}

        {/* The bar's labels, blended against the canvas. They have to live in
            here to reach it: the real header is sticky, and a sticky element
            isolates everything inside it from the page behind. */}
        <HeroNavGhost />

        {/* The wordmark, the tagline and the buttons are one block, with
            the same space above it, under the bar, as below it, at the foot
            of the screen. Before, the word sat a third of the way down and
            the copy at the very bottom, and the eye had to read the foot of
            the screen. */}
        <div className="pointer-events-none relative flex flex-1 flex-col items-center px-6">
          <div className="flex-1" />
          {/* The callout, when there is one: the line the site keeps in its
              banner.json for the news of the moment, read at build time. A
              pill over the word, first thing read top down, five cells
              above it as the copy is five below. The field stands clear of
              it like it does of the copy. Nothing shifts when there is
              none; the block is simply shorter. */}
          {banner ? (
            <div
              data-hero-quiet
              className="pointer-events-auto mb-12 flex w-full justify-center lg:mb-[calc(var(--pxr)*5)]"
            >
              <HeroCallout href={banner.href} html={banner.html} />
            </div>
          ) : null}
          {/* The slot the field measures its cell size from. Server-rendered
              as the SVG so the wordmark is there before any script runs, then
              handed over to the canvas once it has painted the same pixels. */}
          {/* In the same bands the field paints the word at rest, so the
              handover to the canvas changes no pixel. */}
          <OmarchyWordmark
            data-hero-wordmark
            className={
              'w-[88%] max-w-4xl text-[color:var(--t-field-lit)]' +
              (painted ? ' invisible' : '')
            }
            background={WORDMARK_BANDS}
          />
          {/* Straight under the word, five cells of the lattice down, on
              every screen. */}
          <div
            data-hero-quiet
            className="pointer-events-auto mt-12 flex w-full max-w-2xl flex-col items-center text-center lg:mt-[calc(var(--pxr)*5)]"
          >
            <h1
              data-hero-stagger
              style={{ '--stagger': 0 } as React.CSSProperties}
              className="text-2xl font-medium tracking-tight text-text [text-wrap:balance] sm:text-3xl"
            >
              <SectionAnchor anchor="home">
                <span className="sr-only">Omarchy: </span>
                Beautiful, fun &amp; agentic Linux
              </SectionAnchor>{' '}
              by{' '}
              <a
                href="https://dhh.dk"
                className="underline decoration-transparent underline-offset-[6px] transition-colors duration-150 ease-out hover:decoration-brand"
              >
                DHH
              </a>
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
                Vibe your way through every alteration, tweak, or trouble.
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
                  one place on the site with a moving background. Both are
                  40px tall, the pill above the word 32px: two heights on
                  one 8px grid, and the pill stays a line, not a third
                  button. Width follows the label. The padding is set by
                  eye: 16px on the text side, 12px on the icon side, since
                  the glyphs leave white space inside their own box and the
                  eye adds it to the padding. The play triangle also moves a
                  pixel toward its point. */}
              <Button
                size="lg"
                className="h-10 pr-4 has-data-[icon=inline-start]:pl-3"
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
                className="h-10 pr-4 has-data-[icon=inline-start]:pl-3"
                nativeButton={false}
                onClick={watchLink}
                render={<Link to="/" hash="watch" />}
              >
                {/* Filled, and its point is its right edge, so it gets two
                    pixels more room before the label than the outlined
                    download glyph needs. */}
                <PlayIcon data-icon="inline-start" className="mr-0.5" />
                See it in action
              </Button>
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </section>

      {/* The case for Omarchy, in one section: what it is, what that buys
          you, what it looks like in use, and how to get it. These were four
          separate sections that mostly restated each other. A column of five
          pillars used to run beside this one, restating in a list what these
          few sentences and the quote already say; the page introduces the
          idea here and lets the manual do the explaining. The install is
          deliberately thin here too: this is a landing page. */}
      <section id="about">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-28">
          {/* The words on the left, the quote across from them: with the
              column of pillars gone, a single column left the right half of
              the page empty. */}
          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
            <div>
              {/* Unattributed on purpose: this is the site's own voice, not
                  a quotation set apart from it. */}
              <h2
                data-typed-block
                className="text-2xl font-semibold tracking-tight text-text [contain:layout] [text-wrap:balance] sm:text-[1.75rem]"
              >
                <SectionAnchor anchor="about">
                  <span className="sr-only">We can fix everything.</span>
                  <span aria-hidden="true">
                    We can fix every
                    <TypewriterTail phrases={FIXES} />
                  </span>
                </SectionAnchor>
              </h2>
              <p className="mt-6 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                Linux used to be a chore to setup, difficult to debug, and full
                of confusing upfront choices. Omarchy solves all of it with a
                lightning fast installation, agents that debug all issues, and
                fantastic defaults that give you a fully functioning system that
                looks amazing out of the box.
              </p>
              <p className="mt-5 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                Oma is for omakase, chef's choice: the chef picks the courses,
                but you are always free to send anything back. Omarchy lets you
                take an exquisite baseline and then make it your own.
              </p>
              <p className="mt-5 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                It's not perfect... yet. But{' '}
                <a
                  href="https://wecanfixeverything.com/"
                  className="underline decoration-border-strong underline-offset-4 hover:decoration-current"
                >
                  we can fix everything now.
                </a>
              </p>

              {/* A quote marked as one by being one: bigger type, real
                  quotation marks, a name under it. The accent bar down the
                  left was generic blockquote furniture, and it read as a
                  rule the rest of the page does not use. */}
            </div>

            {/* The grid sets the gap below the words on smaller screens. */}
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
          className="border-y border-border-subtle bg-bg-deep py-12 lg:py-24"
        >
          <VideoCarousel
            anchor="watch"
            level={3}
            title="See it in action"
            description="Experience a transfer of enthusiasm."
            videos={videos}
          />
        </div>

        <div
          id="install"
          className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6"
        >
          <SectionHeading
            level={3}
            anchor="install"
            title="Install Omarchy"
            description="Be up and running in as little as 35 seconds on the fastest machines, and in less than two minutes on the majority of computers."
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
          <div className="mt-6 lg:mt-10 grid gap-4 md:grid-cols-2">
            <div className="@container ring-elevation flex min-w-0 flex-col bg-surface p-6">
              <div className="flex items-center gap-2.5">
                <UsbIcon className="size-5 text-brand" />
                <h4 className="text-lg font-medium tracking-tight text-text">
                  Full-disk or dual-boot installation
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
                  Under a minute from stick to desktop.{' '}
                  <span className="block @min-[44rem]:inline">
                    Verify the file:{' '}
                    <a
                      href={`${ISO_URL}.sha256`}
                      className={`${noteLink} whitespace-nowrap`}
                    >
                      SHA-256
                    </a>
                    ,{' '}
                    <a href={`${ISO_URL}.sig`} className={noteLink}>
                      signature
                    </a>
                    .
                  </span>
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
                All of Omarchy running in a virtual machine, so you can get a
                taste first.
              </p>
              <div className="mt-auto pt-6">
                {/* Both apps, the visitor's own machine's filled in once the
                    browser has said which it is; on Linux, neither. */}
                <div className="flex flex-wrap gap-2">
                  {(['mac', 'windows'] as const).map((key) => {
                    const Mark = TRY[key].icon
                    return (
                      <Button
                        key={key}
                        size="lg"
                        variant={device === key ? 'default' : 'outline'}
                        nativeButton={false}
                        render={<a href={TRY[key].href} />}
                      >
                        <Mark data-icon="inline-start" />
                        {TRY[key].label}
                        <ArrowUpRightIcon data-icon="inline-end" />
                      </Button>
                    )
                  })}
                </div>
                <p className="mt-2.5 text-[13px] text-text-muted">
                  Apple Silicon Macs, Windows 10 and 11.
                  <span className="block">
                    On Linux, the ISO is the way in.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* The two variants worth knowing about. Getting Started is the
              button above, so it is not repeated here. */}
          <p className="mt-6 text-[13px] leading-relaxed text-text-muted [text-wrap:pretty]">
            The manual also covers{' '}
            <ManualLink slug="dual-boot-install">
              dual booting beside Windows
            </ManualLink>{' '}
            and{' '}
            <ManualLink slug="unattended-installs">
              unattended installs
            </ManualLink>
            .
          </p>
          <SectionActions>{installGuide}</SectionActions>
        </div>
      </section>

      <section
        id="hardware"
        className="border-t border-border-subtle bg-bg-deep"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <HardwareShowcase />
        </div>
      </section>

      {/* plugins */}
      <section id="plugins" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="plugins"
            title="A plugin for every dream, every desire"
            description="Thousands of community plugins are available for Omarchy. Don't find what you need? Just put your agent on the job, then share when done."
            action={allPlugins}
          />
          <CardRail className="mt-6 lg:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </CardRail>
          <SectionActions>{allPlugins}</SectionActions>
        </div>
      </section>

      <section id="agents" className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <AgentShowcase />
        </div>
      </section>

      {/* themes: the ones Omarchy ships with, shown the way the picker
          shows them. Pressing one dresses this site in it, the same trick
          the picker does behind T, so the keystroke can be tried by hand.
          The extra themes the community made get their link at the end. */}
      <section id="themes" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="themes"
            title="Pick a theme, change everything"
            description={
              <>
                A theme restyles the whole system at once: terminal, bar,
                notifications, wallpaper. Pick one and this site wears it too.
                <span className="hidden sm:inline">
                  {' '}
                  Or press{' '}
                  <kbd className="border border-border-strong px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
                    T
                  </kbd>{' '}
                  to flip through them.
                </span>
              </>
            }
            action={extraThemes}
          />
          <ThemeShowcase />
          <SectionActions>{extraThemes}</SectionActions>
        </div>
      </section>

      <section id="gaming" className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <GamingShowcase />
        </div>
      </section>

      <section id="developers" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <DeveloperShowcase />
        </div>
      </section>

      {/* news: what the project said lately, full width. The figures used to
          sit beside it and made one screen answer four questions at once;
          they have the section after this one now, so each can be read on
          its own. */}
      <section id="news" className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="news"
            title="What's been happening"
            action={allNews}
          />
          {/* Two columns of three: six posts down one wide column read as a
              thin list. Each item draws its own line, so the rules meet
              across the gap where a divide-y would stagger. */}
          <ul className="mt-6 lg:mt-8 grid border-t border-border-subtle sm:grid-cols-2 sm:gap-x-10">
            {/* Six on a wide screen, three on a phone: one column of six
                posts is a page of scrolling before the numbers, and the
                button under the list leads to the rest. */}
            {news.slice(0, 6).map((post, i) => (
              <li
                key={post.slug}
                className={cn(
                  'border-b border-border-subtle',
                  i >= 3 && 'hidden sm:block',
                )}
              >
                <Link
                  to="/news/$year/$month/$slug/"
                  params={{
                    year: post.year,
                    month: post.month,
                    slug: post.slug,
                  }}
                  className="group flex h-full flex-col gap-1.5 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <time
                    dateTime={post.date}
                    className="font-mono text-xs text-text-muted"
                  >
                    {post.dateStr}
                  </time>
                  <span className="font-sans text-base font-medium text-text transition-colors duration-150 ease-out group-hover:text-brand">
                    {post.title}
                  </span>
                  {/* Two lines of the post, enough to tell what it is about;
                      the whole first paragraph made six posts read as one
                      wall of text, and the title carried less weight than
                      the excerpt under it. */}
                  <span className="line-clamp-2 text-[13px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                    {post.excerpt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <SectionActions>{allNews}</SectionActions>
        </div>
      </section>

      {/* the figures, on their own: the foundation's funding, the ISO
          downloads and the repository, one card each, counting up as they
          arrive. On the light ground, so the page keeps trading dark and
          light section by section. */}
      <section
        id="figures"
        className="border-t border-border-subtle"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="figures"
            title="Momentum by the numbers"
            description="Donations, downloads, and contributions. Momentum is based on all of it."
          />
          <Figures />
        </div>
      </section>

      {/* voices: posts from the people who installed it, quoted as written. */}
      <section id="voices" className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="voices"
            title="People love Omarchy"
            description="What people posted on X after installing it."
            action={moreOnX}
          />
          <Voices />
          <SectionActions>{moreOnX}</SectionActions>
        </div>
      </section>

      {/* the teams: who steers it, shown together as clusters of faces. */}
      <section id="teams" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="teams"
            title="It takes a village to raise a distro"
            description="Omarchy Core sets the direction, the Security team keeps your system safe, Design shapes how it looks and feels, and the Rangers help others find their way."
            action={allTeams}
          />
          <TeamClusters />
          <SectionActions>{allTeams}</SectionActions>
        </div>
      </section>

      <section id="patrons" className="border-t border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="patrons"
            title="Backed by the oligarchy"
            description="The billionaires, mere millionaires, and corporations funding the lion's share of the development, maintenance, and spread of Omarchy."
            action={allPatrons}
          />
          <PatronHighlights />
          <SectionActions>{allPatrons}</SectionActions>
        </div>
      </section>

      {/* community */}
      <section
        id="community"
        className="border-t border-border-subtle"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="community"
            title="Get involved with Omarchy"
            description="Command your agent, and hang out with the people doing the same."
          />
          <div className="mt-6 lg:mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
/** Where he said it: the Lex Fridman conversation, at the moment. */
const DHH_QUOTE_URL = 'https://youtu.be/NYFGCESmikA?t=7104'

function DhhQuote() {
  return (
    <figure className="group relative max-w-md border border-border-subtle bg-surface p-5 transition-colors duration-150 ease-out hover:border-border-strong lg:p-7 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div
        aria-hidden="true"
        className="h-10 font-sans text-6xl leading-none font-bold text-brand"
      >
        &ldquo;
      </div>
      {/* Balanced, so the break lands at the comma between the two clauses
          instead of stranding "you should" on a line. */}
      <blockquote
        cite={DHH_QUOTE_URL}
        className="font-sans text-xl leading-snug font-medium text-text [text-wrap:balance]"
      >
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
        {/* The whole card opens the moment he said it, through this link
            stretched over it; the play mark is the only thing that shows. */}
        <a
          href={DHH_QUOTE_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Watch him say it, on YouTube"
          className="ml-auto text-text-muted transition-colors duration-150 ease-out group-hover:text-text focus-visible:outline-none before:absolute before:inset-0"
        >
          <PlayIcon className="size-5" />
        </a>
      </figcaption>
    </figure>
  )
}
