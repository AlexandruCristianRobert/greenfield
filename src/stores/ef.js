import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { EF_TIERS } from '../data/ef.js'
import { EF_FEATURES } from '../data/efFeatures.js'
import { ERAS } from '../data/eras.js'
import { combineMods } from '../lib/modifiers.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'

const CARD_BY_ID = new Map(EF_FEATURES.map((f) => [f.id, f]))
const ERA_INDEX = new Map(ERAS.map((e, i) => [e.id, i]))

export const useEfStore = defineStore('ef', () => {
  const tierIndex = ref(-1) // -1 = Data track not started
  const ownedCards = reactive({})
  const firstReads = reactive({}) // permanent — Knowledge dedup across Rewrites

  const currentTier = computed(() => (tierIndex.value >= 0 ? EF_TIERS[tierIndex.value] : null))
  const nextTier = computed(() => EF_TIERS[tierIndex.value + 1] ?? null)
  const nextTierUnlocked = computed(() => {
    if (!nextTier.value) return false
    const progress = useProgressStore()
    return progress.eraIndex >= ERA_INDEX.get(nextTier.value.requiresEra)
  })

  const throughput = computed(() => {
    if (!currentTier.value) return 0
    const effects = Object.keys(ownedCards).map((id) => CARD_BY_ID.get(id)?.effect).filter(Boolean)
    return currentTier.value.baseThroughput * combineMods(effects).tpMult
  })

  // Emission = steady pre-Data production (shop.baseLps): using the PRE-multiplier
  // rate keeps the loop non-recursive and stable.
  const ratio = computed(() => {
    if (!currentTier.value) return 0
    const shop = useShopStore()
    return Math.min(1, throughput.value / Math.max(shop.baseLps, 1))
  })
  const dataMult = computed(() => (currentTier.value ? 1 + 2 * ratio.value : 1))

  function buyNextTier() {
    if (!nextTier.value || !nextTierUnlocked.value) return false
    const game = useGameStore()
    if (!game.spend(nextTier.value.cost)) return false
    tierIndex.value += 1
    return true
  }

  function buyCard(card) {
    if (ownedCards[card.id]) return false
    const game = useGameStore()
    if (!game.spend(card.cost)) return false
    ownedCards[card.id] = true
    if (!firstReads[card.id]) {
      firstReads[card.id] = true
      useProgressStore().addKnowledge(1)
    }
    return true
  }

  function toSave() {
    return { tierIndex: tierIndex.value, ownedCards: { ...ownedCards }, firstReads: { ...firstReads } }
  }

  function hydrate(slice) {
    const s = slice || {}
    const n = Number(s.tierIndex)
    tierIndex.value = Number.isInteger(n) ? Math.min(Math.max(n, -1), EF_TIERS.length - 1) : -1
    for (const k of Object.keys(ownedCards)) delete ownedCards[k]
    for (const id of Object.keys(s.ownedCards || {})) if (CARD_BY_ID.has(id)) ownedCards[id] = true
    for (const k of Object.keys(firstReads)) delete firstReads[k]
    for (const id of Object.keys(s.firstReads || {})) if (CARD_BY_ID.has(id)) firstReads[id] = true
  }

  return { tierIndex, ownedCards, firstReads, currentTier, nextTier, nextTierUnlocked, throughput, ratio, dataMult, buyNextTier, buyCard, toSave, hydrate }
})
