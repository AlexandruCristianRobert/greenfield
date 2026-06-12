<script setup>
import { useGameStore } from '../stores/game.js'

const game = useGameStore()
</script>

<template>
  <div class="combo-wrap" v-show="game.combo > 0">
    <div class="combo-bar"><div class="combo-fill" :style="{ width: game.combo + '%' }" /></div>
    <span class="muted combo-label">🌊 flow ×{{ game.comboMult.toFixed(2) }}</span>
  </div>
</template>
