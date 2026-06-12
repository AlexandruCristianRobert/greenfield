<script setup>
import { ref } from 'vue'
import { CONTRIBUTORS } from '../data/contributors.js'
import ContributorRow from './ContributorRow.vue'
import FeatureList from './FeatureList.vue'
import SkillTreePanel from './SkillTreePanel.vue'

const TABS = [
  { id: 'contributors', label: 'Contributors' },
  { id: 'features', label: 'Features' },
  { id: 'skills', label: 'Skills' },
]
const active = ref('contributors')
</script>

<template>
  <div class="shop">
    <nav class="shop-tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="shop-tab"
        :class="{ active: active === t.id }"
        @click="active = t.id"
      >{{ t.label }}</button>
    </nav>
    <div v-if="active === 'contributors'" class="shop-list">
      <ContributorRow v-for="c in CONTRIBUTORS" :key="c.id" :contributor="c" />
    </div>
    <FeatureList v-else-if="active === 'features'" />
    <SkillTreePanel v-else />
  </div>
</template>
