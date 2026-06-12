<script setup>
import { useGameStore } from '../stores/game.js'
import { useShopStore } from '../stores/shop.js'
import { useMetaStore } from '../stores/meta.js'
import { useProgressStore } from '../stores/progress.js'
import { useEfStore } from '../stores/ef.js'
import { formatNumber, formatRate } from '../lib/format.js'

const game = useGameStore()
const shop = useShopStore()
const meta = useMetaStore()
const progress = useProgressStore()
const ef = useEfStore()
</script>

<template>
  <header class="header">
    <span class="brand">🌱 Greenfield</span>
    <div class="counters">
      <span class="era-chip" :style="{ borderColor: progress.currentEra.color }">{{ progress.currentEra.csVersion }}</span>
      <strong class="loc-counter">{{ formatNumber(game.loc) }} LoC</strong>
      <span class="muted">{{ formatRate(shop.lps) }} LoC/s</span>
      <span class="muted">🧠 {{ progress.knowledgeFree }}</span>
      <span v-if="ef.tierIndex >= 0" class="muted">💾 {{ Math.round(ef.ratio * 100) }}%</span>
    </div>
    <span class="muted">{{ meta.nickname || '—' }}</span>
  </header>
</template>
