// Number display: integers under 1000, then K/M/B/T… with 3 significant digits,
// exponential past the suffix table. LoC totals use formatNumber; per-second
// rates use formatRate (keeps one decimal for small rates like 0.1 LoC/s).
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No']

export function formatNumber(n) {
  if (!Number.isFinite(n)) return '∞'
  if (n < 0) return '-' + formatNumber(-n)
  if (n < 1000) return String(Math.floor(n))
  const tier = Math.floor(Math.log10(n) / 3)
  if (tier >= SUFFIXES.length) return n.toExponential(2)
  const scaled = n / 10 ** (tier * 3)
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0
  return scaled.toFixed(digits) + SUFFIXES[tier]
}

export function formatRate(n) {
  if (!Number.isFinite(n)) return '∞'
  if (n < 1000) return String(Math.round(n * 10) / 10)
  return formatNumber(n)
}
