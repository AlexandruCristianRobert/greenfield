<script setup>
import { useProgressStore } from '../stores/progress.js'
import { SKILL_BRANCHES, MAX_SKILL_NODES, skillNodeCost } from '../data/skills.js'

const progress = useProgressStore()

function nextCost(branchId) {
  return skillNodeCost(progress.skills[branchId] || 0)
}
</script>

<template>
  <div class="shop-list">
    <p class="knowledge-line">
      🧠 Knowledge: <strong>{{ progress.knowledgeFree }}</strong> free / {{ progress.knowledge }} total
    </p>
    <p class="muted">Earn Knowledge by learning Feature Cards (first read) and passing Certification Exams. Allocation respecs at every Rewrite.</p>
    <div v-for="b in SKILL_BRANCHES" :key="b.id" class="skill-branch card">
      <div class="skill-head">
        <span class="skill-icon">{{ b.icon }}</span>
        <div class="skill-info">
          <strong>{{ b.name }}</strong>
          <span class="muted">{{ b.blurb }}</span>
        </div>
        <button
          class="btn"
          :disabled="(progress.skills[b.id] || 0) >= MAX_SKILL_NODES || progress.knowledgeFree < nextCost(b.id)"
          @click="progress.allocateSkill(b.id)"
        >
          {{ (progress.skills[b.id] || 0) >= MAX_SKILL_NODES ? 'MAX' : `+1 (${nextCost(b.id)} 🧠)` }}
        </button>
      </div>
      <div class="skill-pips">
        <span v-for="i in MAX_SKILL_NODES" :key="i" class="pip" :class="{ filled: i <= (progress.skills[b.id] || 0) }" />
      </div>
    </div>
  </div>
</template>
