<script setup>
import { CONTRIBUTORS } from '../data/contributors.js'
import ContributorRow from './ContributorRow.vue'
</script>

<template>
  <div class="shop">
    <h2>Contributors</h2>
    <ContributorRow v-for="c in CONTRIBUTORS" :key="c.id" :contributor="c" />
  </div>
</template>
