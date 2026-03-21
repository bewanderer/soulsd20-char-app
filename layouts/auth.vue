<template>
  <div id="auth-layout">
    <!-- Global User Menu for authenticated users -->
    <ClientOnly>
      <div v-if="isAuthenticated" class="global-user-menu">
        <UserMenu />
      </div>
    </ClientOnly>

    <slot />

    <ClientOnly>
      <LoadingOverlay />
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import UserMenu from '~/components/TopBar/UserMenu.vue'
import LoadingOverlay from '~/components/UI/LoadingOverlay.vue'

const auth = useAuth()
const isAuthenticated = computed(() => auth.isAuthenticated.value)

useHead({
  title: 'Souls D20 - Sign In'
})
</script>

<style lang="less">
#auth-layout {
  font-family: 'Cardo', serif;
  width: 100%;
  min-height: 100vh;
  color: #fff;
  background-color: #0a0a0a;
  position: relative;

  * {
    box-sizing: border-box;
  }

  input:focus {
    outline-width: 0;
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
  background-color: #0a0a0a;
}
</style>
