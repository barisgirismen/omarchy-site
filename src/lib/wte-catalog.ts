/** Names from a WTE effect catalog, dropping anything that is not a named effect. */
export function effectNames(catalog: readonly unknown[]): string[] {
  const names: string[] = []
  for (const item of catalog) {
    if (typeof item !== 'object' || item === null || !('name' in item)) continue
    const name = item.name
    if (typeof name === 'string') names.push(name)
  }
  return names
}

/**
 * The next effect to play. Uniform among every name except `last`, so the
 * same effect does not fire twice in a row when the catalog has another
 * choice. A one-effect catalog repeats.
 */
export function pickRandomEffect(
  names: readonly string[],
  last: string,
  random: () => number = Math.random,
): string {
  const others: string[] = []
  for (const name of names) {
    if (name !== last) others.push(name)
  }
  const pool = others.length > 0 ? others : names
  if (pool.length === 0) return ''
  return pool[Math.floor(random() * pool.length)] ?? ''
}
