<script setup>
import { useGameStore } from '../stores/game.js'

const game = useGameStore()
</script>

<template>
  <div class="click-pane">
    <button class="click-target" aria-label="Write code" @click="game.click()">💻</button>
    <p class="muted">Write code — +{{ game.clickPower }} LoC per click</p>
  </div>
</template>
