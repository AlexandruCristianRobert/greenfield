// Blueprints awarded at a Rewrite — cube-root curve over the RUN's lifetime
// LoC (per design: each ascension meaningful, longer runs superlinear-ish).
export function blueprintsFor(lifetimeLoc) {
  const n = Number(lifetimeLoc)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.floor(Math.cbrt(n / 1e9))
}
