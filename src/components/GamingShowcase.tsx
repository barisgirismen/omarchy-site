import { SectionHeading } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'

const games = [
  {
    name: 'Steam',
    image: 'gaming-steam.webp',
    alt: 'Steam showing its game store on Omarchy',
    section: 'steam',
    description:
      'Your PC gaming library, right at home on Linux. Steam and Proton bring a huge world of modern games to Omarchy.',
  },
  {
    name: 'RetroArch',
    image: 'gaming-retroarch.webp',
    alt: 'A classic arcade game running with RetroArch’s CRT shader',
    section: 'retroarch',
    description:
      'Revisit the classics with a full set of emulator cores and the beautiful CRT Royale shader, already configured for that retro look.',
  },
  {
    name: 'Minecraft',
    image: 'gaming-minecraft.webp',
    alt: 'Minecraft running on Omarchy',
    section: 'minecraft',
    description:
      'Build, explore, and make a world of your own. Install Minecraft straight from the Omarchy gaming menu and let your imagination run.',
  },
]

export function GamingShowcase() {
  return (
    <>
      <SectionHeading
        anchor="gaming"
        title="All work and all play is all good"
        description="Omarchy comes ready for Steam, RetroArch, and a whole world of gaming. Graphics drivers and configuration, including NVIDIA on supported hardware, are sorted during installation."
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3 lg:mt-10 lg:gap-8">
        {games.map((game) => (
          <a
            key={game.name}
            href={`/manual/gaming/#${game.section}`}
            className="group block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <img
              src={`/manual/images/${game.image}`}
              alt={game.alt}
              width={1600}
              height={1200}
              loading="lazy"
              decoding="async"
              className="aspect-4/3 w-full object-cover"
            />
            <h3 className="mt-4 text-lg font-medium tracking-tight text-text group-hover:text-brand">
              {game.name}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              {game.description}
            </p>
          </a>
        ))}
      </div>
      <p className="mt-6 text-[15px] leading-relaxed text-text-secondary">
        Also available:{' '}
        {[
          ['Battle.net', 'battlenet'],
          ['Lutris', 'lutris-windows-games'],
          ['Heroic', 'heroic-launcher-epic-games'],
          ['Moonlight', 'moonlight-game-streaming-from-a-pc'],
          ['GeForce NOW', 'nvidia-geforce-now'],
          ['Xbox Cloud Gaming', 'xbox-cloud-gaming'],
        ].map(([name, section], index) => (
          <span key={section}>
            {index > 0 && (index === 5 ? ', and ' : ', ')}
            <a
              href={`/manual/gaming/#${section}`}
              className="whitespace-nowrap underline decoration-border-strong underline-offset-4 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {name}
            </a>
          </span>
        ))}
        .
      </p>
      <a
        href="/manual/gaming/"
        className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-text underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&:hover_span]:decoration-current"
      >
        <span className="underline decoration-current">Get your game on</span>
        <ArrowRightIcon className="size-5 shrink-0" aria-hidden="true" />
      </a>
    </>
  )
}
