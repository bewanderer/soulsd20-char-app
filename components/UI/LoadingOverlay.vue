<template>
  <Teleport to="body">
    <div v-if="compendiumStore.isLoading" class="loading-overlay">
      <div class="loading-box">
        <h2 class="loading-title">Loading Data...</h2>
        <div class="loading-bar-track">
          <div class="loading-bar-fill"></div>
        </div>
        <p class="loading-hint">Preparing game compendium</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useCompendiumStore } from '~/store/compendium'

const compendiumStore = useCompendiumStore()
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-box {
  text-align: center;
  max-width: 20rem;
  width: 90%;
}

.loading-title {
  color: #ffd700;
  font-size: clamp(1.25rem, 1.8vw, 1.5rem);
  margin: 0 0 1.5em 0;
  letter-spacing: 0.05em;
}

.loading-bar-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37);
  border-radius: 2px;
  animation: loading-slide 1.5s ease-in-out infinite;
}

@keyframes loading-slide {
  0% { transform: translateX(-100%); width: 30%; }
  50% { width: 60%; }
  100% { transform: translateX(400%); width: 30%; }
}

.loading-hint {
  color: #666;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  margin-top: 1em;
}
</style>
