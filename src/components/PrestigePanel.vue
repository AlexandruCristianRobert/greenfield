<script setup>
import { ref } from 'vue'
import { usePrestigeStore } from '../stores/prestige.js'
import RewriteModal from './RewriteModal.vue'

const prestige = usePrestigeStore()
const confirming = ref(false)
</script>

<template>
  <div v-if="prestige.pendingBlueprints >= 1 || prestige.rewrites > 0" class="era-panel card">
    <RewriteModal v-if="confirming" @close="confirming = false" />
    <p class="ef-line"><strong>📐 The Rewrite</strong> <span class="muted">· run #{{ prestige.rewrites + 1 }} · {{ prestige.contract.name }}</span></p>
    <p class="muted ef-line">{{ prestige.contract.desc }}</p>
    <button class="btn btn-primary" :disabled="prestige.pendingBlueprints < 1" @click="confirming = true">
      🌱 Rewrite — bank {{ prestige.pendingBlueprints }} Blueprint{{ prestige.pendingBlueprints === 1 ? '' : 's' }}
    </button>
    <p v-if="prestige.pendingBlueprints < 1" class="muted ef-line">Reach 100T run LoC to unlock the next Rewrite.</p>
  </div>
</template>
