/** Remembers, for the session, that the home page's intro has played. */
export const HERO_INTRO_SEEN = 'omarchy-intro-seen'

/**
 * Runs in the head, before the first paint, on every page. The hero's text
 * is in the server's HTML and shows at once, so whether it rises in has to
 * be decided before that first paint. Decided after it, from an effect, the
 * headline showed whole, vanished, and rose back in. The home page marks
 * the intro seen once it has mounted, so it plays once per session.
 */
export const heroIntroInitScript = `(function(){try{if(!sessionStorage.getItem('${HERO_INTRO_SEEN}'))document.documentElement.classList.add('hero-intro')}catch(e){}})()`
