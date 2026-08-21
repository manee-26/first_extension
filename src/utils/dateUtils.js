// ── Shared date utilities ────────────────────────
export const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                       'Jul','Aug','Sep','Oct','Nov','Dec']

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(dateObj, n) {
  const d = new Date(dateObj.getTime())
  d.setDate(d.getDate() + n)
  return d
}

function pad(n) { return String(n).padStart(2, '0') }
