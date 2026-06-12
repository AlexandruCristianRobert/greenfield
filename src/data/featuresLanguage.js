import { ERA_CONTENT as cs2 } from './content/cs2.js'
import { ERA_CONTENT as cs3 } from './content/cs3.js'
import { ERA_CONTENT as cs4 } from './content/cs4.js'
import { ERA_CONTENT as cs5 } from './content/cs5.js'
import { ERA_CONTENT as cs6 } from './content/cs6.js'
import { ERA_CONTENT as cs7 } from './content/cs7.js'
import { ERA_CONTENT as cs8 } from './content/cs8.js'
import { ERA_CONTENT as cs9 } from './content/cs9.js'
import { ERA_CONTENT as cs10 } from './content/cs10.js'
import { ERA_CONTENT as cs11 } from './content/cs11.js'
import { ERA_CONTENT as cs12 } from './content/cs12.js'
import { ERA_CONTENT as cs13 } from './content/cs13.js'
import { ERA_CONTENT as cs14 } from './content/cs14.js'

const ALL = [cs2, cs3, cs4, cs5, cs6, cs7, cs8, cs9, cs10, cs11, cs12, cs13, cs14]
export const LANGUAGE_FEATURES = ALL.flatMap((c) => c.features).map((f) => Object.freeze(Object.assign(f, { effect: Object.freeze(f.effect) })))
export const QUESTIONS = ALL.flatMap((c) => c.questions).map((q) => Object.freeze(Object.assign(q, { options: Object.freeze(q.options) })))
export function featuresOf(eraId) {
  return LANGUAGE_FEATURES.filter((f) => f.era === eraId)
}
