import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Greenfield — C#/EF learning clicker. Vue 3 + Vite.
// `base` targets the GitHub Pages project site on build; '/' for local dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/greenfield/' : '/',
  plugins: [vue()],
  server: { port: 5175 },
}))
