<script setup>
import { useAwardsStore } from '../stores/awards.js'
import { ACHIEVEMENTS } from '../data/achievements.js'

const awards = useAwardsStore()
</script>

<template>
  <div class="shop-list">
    <p class="knowledge-line">🏆 {{ Object.keys(awards.unlocked).length }} / {{ ACHIEVEMENTS.length }} · production ×{{ awards.achMult.toFixed(2) }}</p>
    <div v-for="a in ACHIEVEMENTS" :key="a.id" class="card award" :class="{ locked: !awards.unlocked[a.id] }">
      <span class="award-icon">{{ a.icon }}</span>
      <div class="contributor-info">
        <strong>{{ a.name }}</strong>
        <span class="muted">{{ a.desc }} · +1% LoC/s</span>
      </div>
    </div>
  </div>
</template>
