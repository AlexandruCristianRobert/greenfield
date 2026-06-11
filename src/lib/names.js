// Normalized nickname → DB key: trim, lowercase, collapse inner whitespace.
export function keyOf(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}
