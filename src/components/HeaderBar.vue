<script setup>
import { useGameStore } from '../stores/game.js'
import { useShopStore } from '../stores/shop.js'
import { useMetaStore } from '../stores/meta.js'
import { formatNumber, formatRate } from '../lib/format.js'

const game = useGameStore()
const shop = useShopStore()
const meta = useMetaStore()
</script>

<template>
  <header class="header">
    <span class="brand">🌱 Greenfield</span>
    <div class="counters">
      <strong class="loc-counter">{{ formatNumber(game.loc) }} LoC</strong>
      <span class="muted">{{ formatRate(shop.lps) }} LoC/s</span>
    </div>
    <span class="muted">{{ meta.nickname || '—' }}</span>
  </header>
</template>
