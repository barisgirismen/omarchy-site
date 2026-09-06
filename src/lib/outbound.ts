/**
 * Links to other sites open in a new tab, everywhere. Stamped on the page
 * rather than written on each link, since links come from many places -
 * components, the manual and news pages ported from HTML, the plugin
 * directory - and one rule keeps them all the same. Anything on another
 * host over http(s) counts; same-site links, mail links and anchors stay
 * as they are. A link that already says where to open is left alone.
 */
export function watchOutbound() {
  const stamp = (root: ParentNode) => {
    const links =
      root instanceof HTMLAnchorElement
        ? [root]
        : root.querySelectorAll<HTMLAnchorElement>('a[href]')
    for (const a of links) {
      if (a.target) continue
      let url: URL
      try {
        url = new URL(a.href, location.href)
      } catch {
        continue
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') continue
      if (url.host === location.host) continue
      a.target = '_blank'
      // The rel keeps what it had; noopener is what a new tab needs.
      if (!a.relList.contains('noopener') && !a.relList.contains('noreferrer'))
        a.relList.add('noopener')
    }
  }

  stamp(document)
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        stamp(record.target as HTMLAnchorElement)
        continue
      }
      for (const node of record.addedNodes) {
        if (node instanceof Element) stamp(node)
      }
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  })
  return () => observer.disconnect()
}
