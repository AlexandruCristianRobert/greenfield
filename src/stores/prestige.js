import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { PATTERNS } from '../data/patterns.js'
import { CONTRACTS, rollContract } from '../data/contracts.js'
import { blueprintsFor } from '../lib/prestige.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'
import { useEfStore } from './ef.js'

const PATTERN_BY_ID = new Map(PATTERNS.map((p) => [p.id, p]))
const CONTRACT_BY_ID = new Map(CONTRACTS.map((c) => [c.id, c]))

function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const usePrestigeStore = defineStore('prestige', () => {
  const blueprints = ref(0)
  const patterns = reactive({}) // { [patternId]: true } — permanent
  const rewrites = ref(0)
  const contractId = ref('ct-balanced')

  const contract = computed(() => CONTRACT_BY_ID.get(contractId.value) ?? CONTRACTS[0])
  const pendingBlueprints = computed(() => blueprintsFor(useGameStore().lifetimeLoc))

  // Everything multiplier-shaped from prestige: owned pattern effects + the
  // current contract. Consumed by progress.mods AND ef.throughput.
  const effects = computed(() => {
    const out = [...contract.value.effects]
    for (const id of Object.keys(patterns)) {
      const p = PATTERN_BY_ID.get(id)
      if (p) out.push(...p.effects)
    }
    return out
  })

  function hasPattern(id) {
    return Boolean(patterns[id])
  }

  function buyPattern(id) {
    const p = PATTERN_BY_ID.get(id)
    if (!p || patterns[id] || blueprints.value < p.cost) return false
    blueprints.value -= p.cost
    patterns[id] = true
    return true
  }

  function doRewrite(rand = Math.random) {
    const pending = pendingBlueprints.value
    if (pending < 1) return false
    blueprints.value += pending
    rewrites.value += 1
    contractId.value = rollContract(rand).id
    useGameStore().rewriteReset()
    useShopStore().rewriteReset()
    useProgressStore().rewriteReset()
    useEfStore().rewriteReset()
    return true
  }

  function toSave() {
    return { blueprints: blueprints.value, patterns: { ...patterns }, rewrites: rewrites.value, contract: contractId.value, exit: {} }
  }

  function hydrate(slice) {
    const s = slice || {}
    blueprints.value = Math.floor(toCount(s.blueprints))
    for (const k of Object.keys(patterns)) delete patterns[k]
    for (const id of Object.keys(s.patterns || {})) if (PATTERN_BY_ID.has(id)) patterns[id] = true
    rewrites.value = Math.floor(toCount(s.rewrites))
    contractId.value = CONTRACT_BY_ID.has(s.contract) ? s.contract : 'ct-balanced'
  }

  return { blueprints, patterns, rewrites, contractId, contract, pendingBlueprints, effects, hasPattern, buyPattern, doRewrite, toSave, hydrate }
})
