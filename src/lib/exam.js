// Certification Exam mechanics (pure). Design contract: exam draws only from
// questions whose Feature Card is OWNED (teach first, test second); the gate
// itself additionally requires the Release funded and ≥50% era cards owned.
export const EXAM_SIZE = 6
export const EXAM_COOLDOWN_MS = 90_000

export function poolFor(questions, eraId, ownedCardIds) {
  const owned = new Set(ownedCardIds)
  return questions.filter((q) => q.era === eraId && owned.has(q.feature))
}

// Fisher–Yates with injectable rand so tests are deterministic.
export function drawExam(pool, rand = Math.random) {
  const deck = [...pool]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.min(Math.floor(rand() * (i + 1)), i)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.slice(0, Math.min(EXAM_SIZE, deck.length))
}

export function passMarkFor(size) {
  return Math.max(1, size - 1)
}

export function gradeExam(drawn, answers) {
  const correct = drawn.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)
  return { correct, size: drawn.length, passed: correct >= passMarkFor(drawn.length) }
}

export function examEligibility({ releaseFunded, ownedEraCount, eraCardCount, lastExamFailAt, now }) {
  if (!releaseFunded) return { eligible: false, reason: 'release' }
  if (ownedEraCount * 2 < eraCardCount) return { eligible: false, reason: 'cards' }
  if (now - lastExamFailAt < EXAM_COOLDOWN_MS) return { eligible: false, reason: 'cooldown' }
  return { eligible: true, reason: null }
}
