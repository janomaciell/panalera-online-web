// Client-side cycle calculation for UI previews
export function getNextTwoCycles() {
  const now = new Date()
  const results = []
  let y = now.getFullYear(), m = now.getMonth()

  while (results.length < 2) {
    // Cycle day 1
    const ship1 = new Date(y, m, 1)
    const lastDayPrev = new Date(y, m, 0).getDate()
    const cutoff1 = new Date(y, m - 1 < 0 ? 11 : m - 1, m - 1 < 0 ? lastDayPrev : lastDayPrev, 0, 0, 0)
    const cutoff1Fixed = new Date(y, m, 0) // last day of previous month
    if (cutoff1Fixed >= now) results.push({ ship: ship1, cutoff: cutoff1Fixed, label: '1°', day: 1 })

    // Cycle day 15
    const ship15 = new Date(y, m, 15)
    const cutoff15 = new Date(y, m, 14)
    if (cutoff15 >= now && results.length < 2) results.push({ ship: ship15, cutoff: cutoff15, label: '15', day: 15 })

    m++
    if (m > 11) { m = 0; y++ }
  }
  return results.slice(0, 2)
}

export function formatCycleDate(d) {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function formatCycleDateLong(d) {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}
