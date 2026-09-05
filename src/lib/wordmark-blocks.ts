/**
 * The field's 81x19 bitmap as TTFX input: one █ or space per shader cell.
 * Laseretch then runs on the same lattice the hover and click ripples use.
 */
export function bitmapToBlockArt(rows: ReadonlyArray<string>): string {
  return rows
    .map((row) => {
      let line = ''
      for (const cell of row) {
        line += cell === '1' ? '\u2588' : ' '
      }
      return line
    })
    .join('\n')
}
