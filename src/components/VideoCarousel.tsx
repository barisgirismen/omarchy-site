import { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@/components/icons'
import { OmarchyMark } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { RailBar, useRail } from '@/components/Rail'
import { SectionActions, SectionHeading } from '@/components/SectionHeading'
import { cn } from '@/lib/utils'
import { useIsNarrow } from '@/lib/use-media-query'

export type CarouselVideo = {
  id: string
  title: string
  channel: string
  thumb: string
  start?: number
}

/**
 * A full-bleed video rail, one big slide centered with its neighbours
 * peeking dimmed from the edges, the same way the themes rail runs the
 * whole page width. Swiping works natively through scroll-snap; the
 * arrows in the heading row page the same strip. Clicking a peeking
 * slide brings it to center; clicking the centered slide swaps its
 * thumbnail for the YouTube embed playing in place, and moving on
 * silences it so a video can never keep talking from off-screen.
 */
export function VideoCarousel({
  title,
  description,
  videos,
  level = 2,
  anchor,
}: {
  title: string
  description?: string
  videos: readonly CarouselVideo[]
  level?: 2 | 3
  anchor?: string
}) {
  // Narrow screens get the plain YouTube embed. The badge is a desktop
  // affordance: it exists so a hover can promise the click, and a thumbnail
  // you tap once to reveal a player you tap again is a step too many on a
  // phone.
  const narrow = useIsNarrow()
  const rail = useRail({ count: videos.length, align: 'center' })
  const { index, glideTo } = rail
  const [playing, setPlaying] = useState<string | null>(null)

  const goTo = (i: number) => glideTo((i + videos.length) % videos.length)

  // Leaving a slide silences it, however you left.
  useEffect(() => {
    setPlaying((current) =>
      current && current !== videos[index]?.id ? null : current,
    )
  }, [index, videos])

  const arrows = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous video"
        onClick={() => goTo(index - 1)}
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next video"
        onClick={() => goTo(index + 1)}
      >
        <ChevronRightIcon className="size-5" />
      </Button>
    </div>
  )

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          anchor={anchor}
          title={title}
          description={description}
          level={level}
          action={arrows}
        />
      </div>

      <div
        ref={rail.scroller}
        {...rail.scrollerProps}
        className="rail-bare rail-column mt-6 lg:mt-10 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto select-none active:cursor-grabbing motion-reduce:scroll-auto"
        aria-roledescription="carousel"
        aria-label={title}
      >
        {videos.map((video, i) => (
          <div
            key={video.id}
            className={cn(
              'w-full shrink-0 snap-center transition-[opacity,filter] duration-300 ease-out',
              i !== index && 'opacity-40 brightness-75',
            )}
            data-slide={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${videos.length}: ${video.title}`}
          >
            {narrow || playing === video.id ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}?${new URLSearchParams(
                  {
                    ...(video.start ? { start: String(video.start) } : {}),
                    ...(playing === video.id ? { autoplay: '1' } : {}),
                  },
                )}`}
                title={`${video.title} by ${video.channel}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="img-outlined aspect-video w-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => (i === index ? setPlaying(video.id) : goTo(i))}
                // A thumbnail is something you drag; a button would otherwise
                // claim the pointer cursor across the whole rail and leave
                // grab showing only in the gaps. Only the play badge asks
                // to be clicked, so only it carries the pointer.
                className="group relative block w-full cursor-grab text-left active:cursor-grabbing"
                aria-label={
                  i === index
                    ? `Play: ${video.title} by ${video.channel}`
                    : `Show: ${video.title} by ${video.channel}`
                }
              >
                <img
                  src={video.thumb}
                  alt=""
                  width={1280}
                  height={720}
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                  draggable={false}
                  className="img-outlined aspect-video w-full object-cover"
                />
                {i === index ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {/* The mark is already a frame: its spiral leaves the
                        middle nine of its fifteen cells hollow, so the play
                        glyph sits inside the logo. Both draw in currentColor
                        and there is nothing behind them, so the badge is one
                        accent-colored object rather than a glyph on a plate,
                        and a single shadow lifts the whole of it off the
                        thumbnail. At 75px a cell is exactly 5px, and nothing
                        scales on hover, which would land the mark's edges
                        between pixels. At rest the badge sits a little faded
                        into the still, and hovering the thumbnail brings it
                        back to full colour; on touch, where nothing hovers,
                        it stays at full. */}
                    <span className="relative flex size-[75px] cursor-pointer items-center justify-center text-brand drop-shadow-[0_1px_6px_rgb(0_0_0/0.7)] transition-opacity duration-200 ease-out [@media(hover:hover)]:opacity-60 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
                      <OmarchyMark className="absolute inset-0 size-full" />
                      <PlayIcon className="relative size-[25px]" />
                    </span>
                  </span>
                ) : null}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
                  <span className="block font-sans text-base font-medium text-white">
                    {video.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-[13px] text-white/70">
                    {video.channel}
                  </span>
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* The rail's scrollbar, drawn here so it measures the content
          column rather than the window the rail bleeds across. */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RailBar rail={rail} />
        {/* On a phone the slides are players, and a player answers a touch
            itself rather than passing it to the rail underneath, so these
            stop being a shortcut and become the way through. */}
        <SectionActions>{arrows}</SectionActions>
      </div>
    </>
  )
}
