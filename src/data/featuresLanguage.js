import { ERA_CONTENT as cs2 } from './content/cs2.js'
import { ERA_CONTENT as cs3 } from './content/cs3.js'
import { ERA_CONTENT as cs4 } from './content/cs4.js'
import { ERA_CONTENT as cs5 } from './content/cs5.js'
import { ERA_CONTENT as cs6 } from './content/cs6.js'
import { ERA_CONTENT as cs7 } from './content/cs7.js'

const ALL = [cs2, cs3, cs4, cs5, cs6, cs7]
export const LANGUAGE_FEATURES = ALL.flatMap((c) => c.features)
export const QUESTIONS = ALL.flatMap((c) => c.questions)
export function featuresOf(eraId) {
  return LANGUAGE_FEATURES.filter((f) => f.era === eraId)
}
