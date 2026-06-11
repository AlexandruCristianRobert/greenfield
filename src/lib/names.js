// Normalized nickname → DB key: NFC-normalize (macOS often inputs NFD),
// trim, lowercase, collapse inner whitespace.
export function keyOf(name) {
  return (name || '').normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ')
}
