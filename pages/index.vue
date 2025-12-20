<template>
  <ClientOnly>
    <!-- Welcome screen when no characters exist -->
    <WelcomeScreen v-if="!hasCharacters" />

    <!-- Character sheet when characters exist -->
    <div v-else class="app-container">
      <!-- Top bar -->
      <TopBar />

      <!-- Tab Navigation (horizontal) -->
      <TabOptions :active-tab="activeTab" @tab="activeTab = $event" />

      <!-- Tab Content -->
      <div class="tab-content">
        <CharacterTab v-if="activeTab === 'character'" />
        <CombatTab v-if="activeTab === 'combat'" />
        <InventoryTab v-if="activeTab === 'inventory'" />
        <EquipmentTab v-if="activeTab === 'equipment'" />
        <SpellsTab v-if="activeTab === 'spells'" />
        <DestinedTraitsTab v-if="activeTab === 'feats'" />
        <WeaponProficienciesTab v-if="activeTab === 'proficiencies'" />
        <NotesTab v-if="activeTab === 'notes'" />
        <CompendiumTab v-if="activeTab === 'compendium'" />
      </div>

      <!-- Level Up Modal -->
      <LevelUpModal />
    </div>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { getAllCharacters } from '~/mixins/characterStorage'
import { usePlayerStore } from '~/store/player'

definePageMeta({
  layout: 'app'
})

const playerStore = usePlayerStore()
const activeTab = ref('character')
const hasCharacters = ref(false)
const isInitialized = ref(false)

// Check if characters exist
function checkCharacters() {
  const characterList = getAllCharacters()
  const hadCharacters = hasCharacters.value
  hasCharacters.value = characterList.characters.length > 0

  // Only load character on initial mount or when character list changes from empty to non-empty
  if (hasCharacters.value && !isInitialized.value) {
    const loaded = playerStore.loadActiveCharacter()

    // Setup auto-save watchers AFTER character is loaded
    // This prevents the default store state from overwriting localStorage
    if (loaded) {
      playerStore.setupAutoSave()
      console.log('Character loaded and auto-save initialized')
      isInitialized.value = true
    }
  }

  // Handle case where all characters were deleted
  if (!hasCharacters.value && hadCharacters) {
    isInitialized.value = false
  }
}

// Check on mount
onMounted(() => {
  checkCharacters()
})

// Re-check characters periodically (every second) to catch localStorage changes
// This handles cases where characters are deleted via CharacterSelector
// Note: This only checks for existence, not reloading character data every second
if (typeof window !== 'undefined') {
  setInterval(() => {
    checkCharacters()
  }, 1000)
}
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.tab-content {
  flex: 1;
  width: 100%;
  overflow: hidden;
  padding: 16px;
}

/* Custom scrollbar */
.tab-content::-webkit-scrollbar {
  width: 8px;
}

.tab-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #2a6c24;
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: #3a8c34;
}
</style>