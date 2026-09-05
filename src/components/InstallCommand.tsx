import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CopyIcon } from '@/components/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const swapTransition = { type: 'spring', duration: 0.3, bounce: 0 } as const

/**
 * A terminal-style one-liner with a copy button. The confirmation swaps the
 * icon (blur + scale cross-fade, checkmark draws itself in) for ~1.5s so the
 * user knows the copy landed.
 *
 * `compact` is the same thing at card size: smaller type, a smaller button,
 * and a command that ends in an ellipsis rather than scrolling or wrapping,
 * since a card is a place to grab the command, not to read the URL. The
 * whole command is still what gets copied, and a tooltip shows it on hover.
 */
export function InstallCommand({
  command,
  className,
  compact = false,
  label = 'Copy install command',
}: {
  command: string
  className?: string
  compact?: boolean
  /** What the copy button is called, when there are several on a page. */
  label?: string
}) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reducedMotion = useReducedMotion()

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (permissions, http): leave the text selectable.
    }
  }

  return (
    <div
      className={cn(
        'ring-elevation flex min-w-0 items-center gap-1 bg-bg-deep',
        compact ? 'rounded-md py-1 pr-1 pl-3' : 'rounded-lg py-1.5 pr-1.5 pl-4',
        className,
      )}
    >
      {/* One line on a wide screen, where it fits. On a phone it wraps at its
          spaces instead: a command held to one line is both cut off mid-URL
          and, because a grid column will not size below its content's minimum,
          wide enough to drag the whole page sideways. The type drops a step
          there too, so the URL and what follows it share a line: at 14px a
          375px phone broke the command over three. */}
      {/* The whole command, where the compact line had to cut it. */}
      {compact ? (
        <Tooltip>
          <TooltipTrigger
            delay={300}
            render={
              <code className="min-w-0 flex-1 truncate py-1 font-mono text-xs text-text" />
            }
          >
            <span aria-hidden="true" className="mr-2 text-brand select-none">
              $
            </span>
            {command}
          </TooltipTrigger>
          <TooltipContent
            align="start"
            className="max-w-sm font-mono break-all select-text"
          >
            {command}
          </TooltipContent>
        </Tooltip>
      ) : (
        <code className="min-w-0 flex-1 overflow-x-auto py-1.5 font-mono text-[11px] break-words whitespace-normal text-text sm:text-sm sm:whitespace-nowrap">
          <span aria-hidden="true" className="mr-2 text-brand select-none">
            $
          </span>
          {command}
        </code>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : label}
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-md text-text-secondary transition-[background-color,color,scale] duration-150 ease-out before:absolute before:-inset-2 hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.96]',
          compact ? 'size-7' : 'size-8',
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? 'check' : 'copy'}
            className="flex items-center justify-center"
            initial={
              reducedMotion
                ? false
                : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
            }
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
            }
            transition={reducedMotion ? { duration: 0 } : swapTransition}
          >
            {copied ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="square"
                strokeLinejoin="miter"
                className={cn('text-brand', compact ? 'size-4' : 'size-5')}
                aria-hidden="true"
              >
                <motion.path
                  d="M4 12l5 5L20 6"
                  initial={reducedMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                          delay: 0.05,
                        }
                  }
                />
              </svg>
            ) : (
              <CopyIcon className={compact ? 'size-4' : 'size-5'} />
            )}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
