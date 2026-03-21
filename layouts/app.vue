<template>
  <div id="app">
    <ClientOnly>
      <!-- Toast notifications -->
      <ToastContainer />

      <!-- Custom scroll indicator -->
      <ScrollIndicator />

      <!-- Global User Menu for authenticated users -->
      <div v-if="isAuthenticated" class="global-user-menu">
        <UserMenu />
      </div>

      <!-- Loading overlay while compendium loads -->
      <LoadingOverlay />
    </ClientOnly>

    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCompendiumStore } from '~~/store/compendium'
import { usePlayerStore } from '~~/store/player'
import { useToastStore } from '~~/store/toast'
import { setupGlobalErrorHandler } from '~~/composables/useErrorHandler'
import { useAuth } from '~~/composables/useAuth'
import UserMenu from '~~/components/TopBar/UserMenu.vue'
import LoadingOverlay from '~~/components/UI/LoadingOverlay.vue'

const auth = useAuth()
const isAuthenticated = computed(() => auth.isAuthenticated.value)

// Note: Foundry sync is now handled by the plugin (plugins/foundry-sync.client.ts)
// It connects automatically on app load and persists across HMR

const compendiumStore = useCompendiumStore()
const playerStore = usePlayerStore()
const toast = useToastStore()

useHead({
  title: 'Souls D20 Companion'
})

onBeforeMount(() => {
  // Setup global error handling
  setupGlobalErrorHandler()
  // Compendium is loaded by plugins/compendium.client.ts on app startup
})

// Save before window closes (safety net)
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

.global-user-menu {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1000;
}

body {
  margin: 0;
  padding: 0;
  background-color: #292c33;
}
</style>