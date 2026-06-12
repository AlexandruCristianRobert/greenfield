<script setup>
import { useMetaStore } from '../stores/meta.js'
import { usePrestigeStore } from '../stores/prestige.js'

const emit = defineEmits(['close'])
const meta = useMetaStore()
const prestige = usePrestigeStore()

function confirm() {
  meta.performRewrite()
  emit('close')
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal card" role="dialog" aria-modal="true" aria-label="Greenfield rewrite">
      <h2>🌱 Rewrite from scratch?</h2>
      <p>Ship this codebase and start a greenfield rewrite for <strong class="loc-counter">📐 {{ prestige.pendingBlueprints }} Blueprints</strong>.</p>
      <p class="muted">Resets: LoC, Contributors, era progress, Feature Cards, EF stack, Skill allocations.<br />
      Keeps: Knowledge, passed Exams (instant-pass their Releases), Achievements, Blueprints &amp; Patterns.</p>
      <p class="muted">A new client contract is rolled for the next run.</p>
      <div class="modal-actions-row">
        <button class="btn" @click="emit('close')">Keep coding</button>
        <button class="btn btn-primary" @click="confirm">🚀 Rewrite</button>
      </div>
    </div>
  </div>
</template>
