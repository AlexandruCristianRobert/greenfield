<script setup>
import { computed } from 'vue'
import { useProgressStore } from '../stores/progress.js'
import { ERAS } from '../data/eras.js'
import { featuresOf } from '../data/featuresLanguage.js'
import FeatureCardItem from './FeatureCardItem.vue'

const progress = useProgressStore()
const unlockedEras = computed(() =>
  ERAS.slice(0, progress.eraIndex + 1).slice().reverse(), // current era first
)
</script>

<template>
  <div class="shop-list">
    <section v-for="era in unlockedEras" :key="era.id" class="era-section">
      <h3 class="era-heading" :style="{ color: era.color }">
        {{ era.csVersion }} — {{ era.name }} ({{ era.year }})
      </h3>
      <FeatureCardItem v-for="card in featuresOf(era.id)" :key="card.id" :card="card" />
    </section>
  </div>
</template>
