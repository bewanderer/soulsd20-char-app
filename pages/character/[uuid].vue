<template>
  <ClientOnly>
    <!-- Loading state while character loads -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-text">Loading character...</div>
    </div>

    <!-- Character not found -->
    <div v-else-if="loadError" class="error-container">
      <h2>Character Not Found</h2>
      <p>{{ loadError }}</p>
      <button @click="goToDashboard" class="btn-back">Back to Dashboard</button>
    </div>

    <!-- Character sheet -->
    <div v-else class="app-container">
      <!-- Top bar -->
      <TopBar />

      <!-- Tab Navigation (horizontal) -->
      <TabOptions :active-tab="activeTab" @tab="activeTab = $event" />

      <!-- Tab Content - KeepAlive preserves filter/sort state when switching tabs -->
      <div class="tab-content">
        <KeepAlive>
          <component :is="activeTabComponent" :key="activeTab" />
        </KeepAlive>
      </div>

      <!-- Level Up Modal -->
      <LevelUpModal />
    </div>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setActiveCharacter, getAllCharacters, saveCharacterList } from '~/mixins/characterStorage'
import { usePlayerStore } from '~/store/player'
import { useCompendiumStore } from '~/store/compendium'
import { waitForInitialSync } from '~/composables/useCharacterSync'
import { useCharacterApi } from '~/composables/useCharacterApi'
import { useAuth } from '~/composables/useAuth'

// Import tab components
import CharacterTab from '~/components/ContentSections/Character/CharacterTab.vue'
import CombatTab from '~/components/ContentSections/Combat/CombatTab.vue'
import InventoryTab from '~/components/ContentSections/InventoryTab.vue'
import EquipmentTab from '~/components/ContentSections/Equipment/EquipmentTab.vue'
import SpellsTab from '~/components/ContentSections/Spells/SpellsTab.vue'
import DestinedTraitsTab from '~/components/ContentSections/Feats/DestinedTraitsTab.vue'
import WeaponProficienciesTab from '~/components/ContentSections/Feats/WeaponProficienciesTab.vue'
import NotesTab from '~/components/ContentSections/Notes/NotesTab.vue'
import CompendiumTab from '~/components/ContentSections/Compendium/CompendiumTab.vue'

definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()
const characterApi = useCharacterApi()
const auth = useAuth()

const activeTab = ref('character')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isGmViewing = ref(false)

// Mode detection from query params (GM view/edit from campaign management)
const isViewMode = computed(() => route.query.mode === 'view')
const fromCampaignId = computed(() => route.query.from_campaign as string || null)
const campaignName = ref('')

function goToCampaign() {
  if (fromCampaignId.value) {
    router.push(`/campaigns/${fromCampaignId.value}`)
  } else {
    router.push('/campaigns')
  }
}

function goToDashboard() {
  router.push('/campaigns')
}

const tabComponents: Record<string, any> = {
  character: CharacterTab,
  combat: CombatTab,
  inventory: InventoryTab,
  equipment: EquipmentTab,
  spells: SpellsTab,
  feats: DestinedTraitsTab,
  proficiencies: WeaponProficienciesTab,
  notes: NotesTab,
  compendium: CompendiumTab
}

const activeTabComponent = computed(() => tabComponents[activeTab.value] || CharacterTab)

onMounted(async () => {
  const uuid = route.params.uuid as string
  console.log(`[SD20 Nav] [uuid].vue mounted, uuid from route: "${uuid}"`)
  if (!uuid) {
    loadError.value = 'No character UUID provided'
    isLoading.value = false
    return
  }

  // Compendium is loaded by plugins/compendium.client.ts on startup

  // Wait for API sync to complete first
  console.log('[SD20 Nav] Waiting for initial sync...')
  await waitForInitialSync()
  console.log('[SD20 Nav] Initial sync complete')

  // Find the character in localStorage
  let characterList = getAllCharacters()
  let character = characterList.characters.find(c => c.uuid === uuid)

  if (character) {
    console.log(`[SD20 Nav] Character found in localStorage: "${character.name}" (uuid=${uuid})`)
  }

  // If not in localStorage, fetch directly from API (only own characters)
  if (!character) {
    console.log(`[SD20 Nav] Character NOT found in localStorage, fetching from API: ${uuid}`)
    const response = await characterApi.fetchCharacter(uuid)
    if (response.ok && response.data) {
      const apiChar = response.data as any
      const currentUserUuid = auth.user.value?.uuid

      // Only save to localStorage if the character belongs to the current user
      if (apiChar.owner?.uuid === currentUserUuid || apiChar.owner?.id === auth.user.value?.id) {
        const converted = characterApi.fromApiFormat(response.data)
        characterList = getAllCharacters()
        characterList.characters.push(converted)
        saveCharacterList(characterList)
        character = converted
        console.log(`[SD20 Nav] Own character fetched from API: "${converted.name}"`)
      } else {
        // GM viewing another player's character (read-only or edit mode from campaign)
        const converted = characterApi.fromApiFormat(response.data)
        character = converted
        isGmViewing.value = true
        console.log(`[SD20 Nav] Viewing other user's character (GM mode): "${converted.name}"`)
      }
    } else {
      console.warn(`[SD20 Nav] API fetch failed for uuid=${uuid}`)
    }
  }

  if (!character) {
    console.warn(`[SD20 Nav] Character not found anywhere: uuid=${uuid}`)
    loadError.value = 'Character not found. It may have been deleted.'
    isLoading.value = false
    return
  }

  // Set as active and load into store
  setActiveCharacter(uuid)
  const loaded = playerStore.loadActiveCharacter()
  console.log(`[SD20 Store] loadActiveCharacter() result: ${loaded}`)

  if (!loaded) {
    loadError.value = 'Failed to load character data'
    isLoading.value = false
    return
  }

  // Setup auto-save AFTER character is loaded
  playerStore.setupAutoSave()

  // Check for Level 0 character (incomplete character creation)
  if (playerStore.Level === 0 && !playerStore.PendingLevelUp?.active) {
    playerStore.initializeLevel1LevelUp()
  }

  console.log(`[SD20 Nav] Character page fully loaded: "${playerStore.Name}" (Level ${playerStore.Level})`)
  isLoading.value = false
})
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

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #ccc;
  gap: 1rem;
}

.loading-text {
  font-size: 1.2rem;
  color: #ffd700;
}

.error-container h2 {
  color: #ff6b6b;
}

.btn-back {
  padding: 0.75em 1.5em;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0.375rem;
  color: #ffd700;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-back:hover {
  background: rgba(255, 215, 0, 0.25);
  border-color: rgba(255, 215, 0, 0.5);
}

.tab-content::-webkit-scrollbar { width: 8px; }
.tab-content::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); border-radius: 4px; }
.tab-content::-webkit-scrollbar-thumb { background: #2a6c24; border-radius: 4px; }
.tab-content::-webkit-scrollbar-thumb:hover { background: #3a8c34; }

/* Read-only mode: disable all inputs */
.readonly-mode input,
.readonly-mode select,
.readonly-mode textarea,
.readonly-mode button:not(.btn-back-campaign):not(.tab-btn) {
  pointer-events: none;
  opacity: 0.7;
}

.readonly-banner, .edit-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  font-size: clamp(0.8rem, 0.95vw, 0.9rem);
  font-weight: 600;
}

.readonly-banner {
  background: rgba(255, 165, 0, 0.15);
  border-bottom: 1px solid rgba(255, 165, 0, 0.3);
  color: #ffa500;
}

.edit-banner {
  background: rgba(60, 179, 113, 0.1);
  border-bottom: 1px solid rgba(60, 179, 113, 0.3);
  color: var(--color-green-primary);
}

.btn-back-campaign {
  padding: 0.375em 1em;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  color: inherit;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-campaign:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
