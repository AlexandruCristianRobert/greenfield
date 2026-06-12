<script setup>
import { useGameStore } from '../stores/game.js'
import { formatRate } from '../lib/format.js'
import ComboBar from './ComboBar.vue'

const game = useGameStore()
</script>

<template>
  <div class="click-pane">
    <button class="click-target" aria-label="Write code" @click="game.click()">💻</button>
    <p class="muted">Write code — +{{ formatRate(game.effectiveClick) }} LoC per click</p>
    <ComboBar />
  </div>
</template>
