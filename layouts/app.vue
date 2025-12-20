<template>
  <div id="app">
    <!-- Toast notifications -->
    <ToastContainer />

    <!-- Custom scroll indicator -->
    <ScrollIndicator />

    <slot />
  </div>
</template>

<script setup>
import { useCompendiumStore } from '~~/store/compendium'
import { usePlayerStore } from '~~/store/player'
import { useToastStore } from '~~/store/toast'
import { setupGlobalErrorHandler } from '~~/composables/useErrorHandler'

const compendiumStore = useCompendiumStore()
const playerStore = usePlayerStore()
const toast = useToastStore()
const autoSave = useAutoSave(30) // Auto-save every 30 seconds

useHead({
  title: 'Souls D20 Companion'
})

onBeforeMount(async () => {
  // Setup global error handling
  setupGlobalErrorHandler()

  // Load compendium data from API
  try {
    await compendiumStore.getCompendium()
    console.log('Compendium loaded successfully')
  } catch (error) {
    console.error('Failed to load compendium:', error)
    toast.error('Failed to load game data', 'Please check your connection and refresh the page')
  }

  // IMPORTANT: Do NOT setup auto-save here
  // Auto-save watchers must be set up AFTER character is loaded
  // This is now handled in pages/index.vue after loadActiveCharacter()

  // Start periodic backup interval (independent of watchers)
  autoSave.start()
})

// Save character before page unload
onBeforeUnmount(() => {
  try {
    playerStore.save()
    autoSave.stop()
  } catch (error) {
    console.error('Failed to save on unmount:', error)
  }
})

// Save before window closes
if (process.client) {
  window.addEventListener('beforeunload', () => {
    try {
      playerStore.save()
    } catch (error) {
      console.error('Failed to save on window close:', error)
    }
  })
}
</script>

<style lang="less">
#app {
  font-family: 'Cardo', serif;
  width: 100%;
  height: 100vh;
  color: #333333;

  * {
    border-color: #616161;
  }

  input:focus {
    outline-width: 0;
  }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

body {
  margin: 0;
  padding: 0;
  background-color: #292c33;
}
</style>