import { EF_CONTENT } from './content/ef.js'

export const EF_FEATURES = EF_CONTENT.features.map((f) => Object.freeze(Object.assign(f, { effect: Object.freeze(f.effect) })))
export function efFeaturesOf(tierId) {
  return EF_FEATURES.filter((f) => f.tier === tierId)
}
