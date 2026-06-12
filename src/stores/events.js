import { ref } from 'vue'
import { defineStore } from 'pinia'
import { prPoolFor } from '../data/prs.js'
import { useGameStore } from './game.js'
import { useShopStore } from './shop.js'
import { useProgressStore } from './progress.js'
import { useAwardsStore } from './awards.js'

export const PR_MIN_GAP = 180_000
export const PR_MAX_GAP = 360_000
export const NUGGET_MIN_GAP = 120_000
export const NUGGET_MAX_GAP = 300_000
export const PR_TOAST_MS = 20_000
export const NUGGET_MS = 12_000
export const FRENZY_MULT = 7
export const CONFLICT_MULT = 0.5
export const BUFF_MS = 30_000

export const useEventsStore = defineStore('events', () => {
  const prOffer = ref(null)    // { until }
  const activePr = ref(null)   // question (modal open)
  const nugget = ref(null)     // { until, xPct, yPct }
  const buff = ref(null)       // { kind, mult, until }
  const buffMult = ref(1)

  let nextPrAt = Infinity
  let nextNuggetAt = Infinity
  let rand = Math.random

  function gap(min, max) {
    return min + rand() * (max - min)
  }

  function init(now, r = Math.random) {
    rand = r
    prOffer.value = null
    activePr.value = null
    nugget.value = null
    buff.value = null
    buffMult.value = 1
    nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    nextNuggetAt = now + gap(NUGGET_MIN_GAP, NUGGET_MAX_GAP)
  }

  function tick(now) {
    if (buff.value && now >= buff.value.until) buff.value = null
    buffMult.value = buff.value ? buff.value.mult : 1
    if (prOffer.value && now >= prOffer.value.until) {
      prOffer.value = null
      nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    }
    if (nugget.value && now >= nugget.value.until) {
      nugget.value = null
      nextNuggetAt = now + gap(NUGGET_MIN_GAP, NUGGET_MAX_GAP)
    }
    if (!prOffer.value && !activePr.value && now >= nextPrAt) {
      const pool = prPoolFor(useProgressStore().eraIndex)
      if (pool.length > 0) prOffer.value = { until: now + PR_TOAST_MS }
      else nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    }
    if (!nugget.value && now >= nextNuggetAt) {
      nugget.value = { until: now + NUGGET_MS, xPct: 10 + rand() * 70, yPct: 20 + rand() * 50 }
    }
  }

  function applyBuff(kind, mult, now) {
    buff.value = { kind, mult, until: now + BUFF_MS }
    buffMult.value = mult
  }

  function openPr(now) {
    if (!prOffer.value) return null
    const pool = prPoolFor(useProgressStore().eraIndex)
    if (pool.length === 0) return null
    prOffer.value = null
    activePr.value = pool[Math.floor(rand() * pool.length)]
    nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
    return activePr.value
  }

  // Test hook: place a specific PR in the modal regardless of scheduling.
  function forcePr(question, now) {
    activePr.value = question
    nextPrAt = now + gap(PR_MIN_GAP, PR_MAX_GAP)
  }

  function answerPr(optionIndex, now) {
    if (!activePr.value) return null
    const correct = optionIndex === activePr.value.answer
    activePr.value = null
    if (correct) {
      applyBuff('frenzy', FRENZY_MULT, now)
      useProgressStore().addKnowledge(1)
      useAwardsStore().bumpStat('prsCorrect')
    } else {
      applyBuff('conflict', CONFLICT_MULT, now)
    }
    return correct
  }

  function clickNugget(now, r = rand) {
    if (!nugget.value) return false
    nugget.value = null
    nextNuggetAt = now + gap(NUGGET_MIN_GAP, NUGGET_MAX_GAP)
    useAwardsStore().bumpStat('nuggetsClicked')
    if (r() < 0.7) {
      applyBuff('frenzy', FRENZY_MULT, now)
    } else {
      const game = useGameStore()
      const shop = useShopStore()
      game.addLoc(Math.max(shop.lps * 600, game.effectiveClick * 100))
    }
    return true
  }

  return { prOffer, activePr, nugget, buff, buffMult, init, tick, openPr, forcePr, answerPr, clickNugget }
})
