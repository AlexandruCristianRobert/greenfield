import { PR_CONTENT as a } from './content/prs-cs2-7.js'
import { PR_CONTENT as b } from './content/prs-cs8-14.js'
import { ERAS } from './eras.js'

const ERA_INDEX = new Map(ERAS.map((e, i) => [e.id, i]))
export const PR_QUESTIONS = [...a.questions, ...b.questions].map((q) => Object.freeze(Object.assign(q, { options: Object.freeze(q.options) })))
export function prPoolFor(eraIndex) {
  return PR_QUESTIONS.filter((q) => ERA_INDEX.get(q.era) <= eraIndex)
}
