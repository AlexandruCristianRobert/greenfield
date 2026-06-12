<script setup>
import { useMetaStore } from '../stores/meta.js'
import { formatNumber } from '../lib/format.js'

const meta = useMetaStore()

function hours(s) {
  return (s / 3600).toFixed(1)
}
</script>

<template>
  <div v-if="meta.offlineReport" class="modal-overlay">
    <div class="modal card" role="dialog" aria-modal="true" aria-label="While you were away">
      <h2>🌙 CI ran overnight</h2>
      <p>Your Contributors produced <strong class="loc-counter">{{ formatNumber(meta.offlineReport.gain) }} LoC</strong> over {{ hours(meta.offlineReport.seconds) }}h.</p>
      <p v-if="meta.offlineReport.capped" class="muted">Capped — Tooling skill points extend the offline window (+2h each).</p>
      <button class="btn btn-primary" @click="meta.offlineReport = null">Nice</button>
    </div>
  </div>
</template>
