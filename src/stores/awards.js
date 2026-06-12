import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { CONTRIBUTORS } from '../data/contributors.js'
import { SKILL_BRANCHES } from '../data/skills.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'
import { useEfStore } from './ef.js'

const KNOWN_IDS = new Set(ACHIEVEMENTS.map((a) => a.id))
const STAT_KEYS = ['maxCombo', 'nuggetsClicked', 'prsCorrect']

function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const useAwardsStore = defineStore('awards', () => {
  const unlocked = reactive({})
  const stats = reactive({ maxCombo: 0, nuggetsClicked: 0, prsCorrect: 0 })
  const toastQueue = ref([])

  const achMult = computed(() => 1.01 ** Object.keys(unlocked).length)

  function bumpStat(key, value = 1) {
    if (key in stats) stats[key] += value
  }

  function noteCombo(combo) {
    if (combo > stats.maxCombo) stats.maxCombo = combo
  }

  function buildCtx() {
    const game = useGameStore()
    const shop = useShopStore()
    const progress = useProgressStore()
    const ef = useEfStore()
    const counts = CONTRIBUTORS.map((c) => shop.countOf(c.id))
    return {
      lifetimeLoc: game.lifetimeLoc,
      totalContributors: counts.reduce((s, n) => s + n, 0),
      maxSingleContributor: Math.max(0, ...counts),
      cardsOwned: Object.keys(progress.ownedCards).length + Object.keys(ef.ownedCards).length,
      examsPassed: progress.examsPassed.length,
      skillsAllocated: SKILL_BRANCHES.reduce((s, b) => s + (progress.skills[b.id] || 0), 0),
      maxBranchNodes: Math.max(...SKILL_BRANCHES.map((b) => progress.skills[b.id] || 0)),
      maxCombo: stats.maxCombo,
      nuggetsClicked: stats.nuggetsClicked,
      prsCorrect: stats.prsCorrect,
      efTierIndex: ef.tierIndex,
    }
  }

  function evaluate() {
    const ctx = buildCtx()
    for (const a of ACHIEVEMENTS) {
      if (!unlocked[a.id] && a.check(ctx)) {
        unlocked[a.id] = true
        toastQueue.value.push(a)
      }
    }
  }

  function shiftToast() {
    return toastQueue.value.shift() ?? null
  }

  function achievementsToSave() {
    return { unlocked: { ...unlocked } }
  }
  function statsToSave() {
    return { ...stats }
  }
  function hydrate(achSlice, statsSlice) {
    for (const k of Object.keys(unlocked)) delete unlocked[k]
    for (const id of Object.keys(achSlice?.unlocked || {})) if (KNOWN_IDS.has(id)) unlocked[id] = true
    for (const k of STAT_KEYS) stats[k] = Math.floor(toCount(statsSlice?.[k]))
  }

  return { unlocked, stats, toastQueue, achMult, bumpStat, noteCombo, evaluate, shiftToast, achievementsToSave, statsToSave, hydrate }
})
