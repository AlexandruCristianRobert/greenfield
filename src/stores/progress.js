import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { ERAS } from '../data/eras.js'
import { LANGUAGE_FEATURES, featuresOf } from '../data/featuresLanguage.js'
import { QUESTIONS } from '../data/questions.js'
import { SKILL_BRANCHES, MAX_SKILL_NODES, skillNodeCost } from '../data/skills.js'
import { combineMods } from '../lib/modifiers.js'
import { poolFor, drawExam, gradeExam, examEligibility } from '../lib/exam.js'
import { useGameStore } from './game.js'

const KNOWN_CARD_IDS = new Set(LANGUAGE_FEATURES.map((f) => f.id))
const KNOWN_ERA_IDS = new Set(ERAS.map((e) => e.id))
const CARD_BY_ID = new Map(LANGUAGE_FEATURES.map((f) => [f.id, f]))

function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const useProgressStore = defineStore('progress', () => {
  const eraIndex = ref(0)
  const releaseFunded = ref(false)
  const ownedCards = reactive({})   // per-run (reset at Rewrite in M4)
  const examsPassed = ref([])       // permanent era ids
  const knowledge = ref(0)          // permanent budget
  const firstReads = reactive({})   // permanent card ids
  const skills = reactive({ language: 0, data: 0, performance: 0, tooling: 0 })
  const lastExamFailAt = ref(0)

  const currentEra = computed(() => ERAS[eraIndex.value])
  const allErasDone = computed(() => examsPassed.value.includes(ERAS[ERAS.length - 1].id))
  const eraFeatures = computed(() => featuresOf(currentEra.value.id))
  const ownedEraCount = computed(() => eraFeatures.value.filter((f) => ownedCards[f.id]).length)

  const mods = computed(() => {
    const effects = []
    for (const id of Object.keys(ownedCards)) {
      const card = CARD_BY_ID.get(id)
      if (card) effects.push(card.effect)
    }
    for (const branch of SKILL_BRANCHES) {
      for (let i = 0; i < (skills[branch.id] || 0); i++) {
        effects.push({ type: branch.effectType, value: branch.perNode })
      }
    }
    return combineMods(effects)
  })

  const allocatedKnowledge = computed(() =>
    SKILL_BRANCHES.reduce((sum, b) => {
      let cost = 0
      for (let i = 0; i < (skills[b.id] || 0); i++) cost += skillNodeCost(i)
      return sum + cost
    }, 0),
  )
  const knowledgeFree = computed(() => knowledge.value - allocatedKnowledge.value)

  const releaseCost = computed(() => Math.ceil(currentEra.value.releaseCost * mods.value.releaseMult))

  function eligibility(now = Date.now()) {
    return examEligibility({
      releaseFunded: releaseFunded.value,
      ownedEraCount: ownedEraCount.value,
      eraCardCount: eraFeatures.value.length,
      lastExamFailAt: lastExamFailAt.value,
      now,
    })
  }

  function buyCard(card) {
    if (ownedCards[card.id]) return false
    const game = useGameStore()
    if (!game.spend(card.cost)) return false
    ownedCards[card.id] = true
    if (!firstReads[card.id]) {
      firstReads[card.id] = true
      knowledge.value += 1
    }
    return true
  }

  function fundRelease() {
    if (releaseFunded.value || allErasDone.value) return false
    const game = useGameStore()
    if (!game.spend(releaseCost.value)) return false
    releaseFunded.value = true
    return true
  }

  // The active exam lives in the STORE, not the component: finishExam grades
  // only the store-held draw and consumes it, so a double-fire can't skip an
  // era and a console call can't forge a pass with a fabricated exam.
  // Not persisted: refreshing mid-exam abandons it (no fail recorded).
  const activeExam = ref(null)

  function beginExam(rand = Math.random) {
    if (activeExam.value) return activeExam.value
    if (allErasDone.value || !eligibility().eligible) return null
    const pool = poolFor(QUESTIONS, currentEra.value.id, Object.keys(ownedCards))
    if (pool.length === 0) return null
    activeExam.value = drawExam(pool, rand)
    return activeExam.value
  }

  function finishExam(answers) {
    if (!activeExam.value) return null
    const result = gradeExam(activeExam.value, answers)
    activeExam.value = null
    if (result.passed) {
      if (!examsPassed.value.includes(currentEra.value.id)) examsPassed.value.push(currentEra.value.id)
      knowledge.value += 3
      releaseFunded.value = false
      if (eraIndex.value < ERAS.length - 1) eraIndex.value += 1
    } else {
      lastExamFailAt.value = Date.now()
    }
    return result
  }

  function allocateSkill(branchId) {
    const branch = SKILL_BRANCHES.find((b) => b.id === branchId)
    if (!branch) return false
    const nodes = skills[branchId] || 0
    if (nodes >= MAX_SKILL_NODES) return false
    if (knowledgeFree.value < skillNodeCost(nodes)) return false
    skills[branchId] = nodes + 1
    return true
  }

  function toSave() {
    return {
      eraIndex: eraIndex.value,
      releaseFunded: releaseFunded.value,
      ownedCards: { ...ownedCards },
      examsPassed: [...examsPassed.value],
      knowledge: knowledge.value,
      firstReads: { ...firstReads },
      skills: { ...skills },
      lastExamFailAt: lastExamFailAt.value,
    }
  }

  function hydrate(slice) {
    const s = slice || {}
    eraIndex.value = Math.min(Math.floor(toCount(s.eraIndex)), ERAS.length - 1)
    releaseFunded.value = Boolean(s.releaseFunded)
    for (const k of Object.keys(ownedCards)) delete ownedCards[k]
    for (const id of Object.keys(s.ownedCards || {})) if (KNOWN_CARD_IDS.has(id)) ownedCards[id] = true
    examsPassed.value = [...new Set((Array.isArray(s.examsPassed) ? s.examsPassed : []).filter((id) => KNOWN_ERA_IDS.has(id)))]
    knowledge.value = Math.min(toCount(s.knowledge), 10_000)
    for (const k of Object.keys(firstReads)) delete firstReads[k]
    for (const id of Object.keys(s.firstReads || {})) if (KNOWN_CARD_IDS.has(id)) firstReads[id] = true
    for (const b of SKILL_BRANCHES) skills[b.id] = Math.min(Math.floor(toCount(s.skills?.[b.id])), MAX_SKILL_NODES)
    // A save can't allocate more than it earned — hostile or corrupt
    // allocations reset rather than rendering negative free Knowledge.
    if (allocatedKnowledge.value > knowledge.value) {
      for (const b of SKILL_BRANCHES) skills[b.id] = 0
    }
    // Clamp to the past: a future timestamp (hostile cloud save or clock skew)
    // would otherwise lock the exam cooldown forever.
    lastExamFailAt.value = Math.min(toCount(s.lastExamFailAt), Date.now())
  }

  return {
    eraIndex, releaseFunded, ownedCards, examsPassed, knowledge, firstReads, skills, lastExamFailAt, activeExam,
    currentEra, allErasDone, eraFeatures, ownedEraCount, mods, knowledgeFree, allocatedKnowledge, releaseCost,
    eligibility, buyCard, fundRelease, beginExam, finishExam, allocateSkill, toSave, hydrate,
  }
})
