export type ThemeTransitionDocument = {
  startViewTransition?: (update: () => void) => unknown
}

export const THEME_FROST_CLASS = 'theme-frost-layer'
export const THEME_FROST_ON_CLASS = 'theme-frost-layer-on'
export const THEME_FROST_MS = 160

export function prefersReducedMotion(
  media: Pick<MediaQueryList, 'matches'> = matchReducedMotion(),
): boolean {
  return media.matches
}

export function shouldAnimateThemeTransition(
  doc: ThemeTransitionDocument,
  reducedMotion: boolean,
): boolean {
  return typeof doc.startViewTransition === 'function' && !reducedMotion
}

export function runThemeViewTransition(
  update: () => void,
  doc: ThemeTransitionDocument = globalDocument(),
  reducedMotion = prefersReducedMotion(),
): void {
  if (!shouldAnimateThemeTransition(doc, reducedMotion)) {
    update()
    return
  }

  if (canFrostLiveDocument(doc)) {
    void frostThenWipe(update, doc)
    return
  }

  startWipe(update, doc)
}

function canFrostLiveDocument(doc: ThemeTransitionDocument): boolean {
  return (
    typeof document !== 'undefined' &&
    doc === document &&
    Boolean(document.body)
  )
}

async function frostThenWipe(
  update: () => void,
  doc: ThemeTransitionDocument,
): Promise<void> {
  const layer = document.createElement('div')
  layer.className = THEME_FROST_CLASS
  document.body.append(layer)
  void layer.offsetWidth
  layer.classList.add(THEME_FROST_ON_CLASS)
  await waitForFrost()
  startWipe(() => {
    layer.remove()
    update()
  }, doc)
}

function waitForFrost(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, THEME_FROST_MS)
  })
}

function startWipe(update: () => void, doc: ThemeTransitionDocument): void {
  try {
    doc.startViewTransition?.(update)
  } catch {
    update()
  }
}

function matchReducedMotion(): Pick<MediaQueryList, 'matches'> {
  if (typeof window === 'undefined') {
    return { matches: false }
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)')
}

function globalDocument(): ThemeTransitionDocument {
  if (typeof document === 'undefined') {
    return {}
  }

  return document
}
