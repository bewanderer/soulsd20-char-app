<template>
  <ClientOnly>
    <div class="character-selector">
      <div v-if="!hasCharacters" class="no-characters">
        <span>No Characters</span>
      </div>

      <div v-else class="selector-dropdown">
        <button @click="toggleDropdown" class="current-character">
          <span class="character-name">{{ currentCharacter?.name || 'Select Character' }}</span>
          <span class="dropdown-arrow">▼</span>
        </button>

        <div v-if="isOpen" class="dropdown-menu">
          <!-- Current character info and actions -->
          <div v-if="currentCharacter" class="character-item active">
            <div class="character-details-row">
              <div class="character-meta">
                <span class="level">Lv {{ currentCharacter.souls_level || currentCharacter.level || 1 }}</span>
                <span class="background">{{ getBackgroundName(currentCharacter.background_id) }}</span>
              </div>
              <div class="character-actions">
                <button
                  @click.stop="confirmReset(currentCharacter.uuid, currentCharacter.name, currentCharacter.background_id)"
                  class="action-btn btn-warning-small"
                  title="Reset character"
                >
                  Reset
                </button>
                <button
                  @click.stop="confirmDelete(currentCharacter.uuid, currentCharacter.name)"
                  class="action-btn btn-warning-small"
                  title="Delete character"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deleteConfirm" class="modal-overlay" @click.self="deleteConfirm = null">
        <div class="modal-content small">
        <h2 class="modal-title">Delete Character</h2>
        <p class="warning-text">
          Are you sure you want to delete <strong>{{ deleteConfirm.name }}</strong>?
        </p>
        <p class="warning-text danger">This cannot be undone.</p>
        <div class="modal-actions">
          <button @click="deleteConfirm = null" class="cancel-btn btn-neutral">Cancel</button>
          <button @click="executeDelete" class="delete-confirm-btn btn-warning">Delete</button>
        </div>
      </div>
      </div>
    </Teleport>

    <!-- Import Mode Selection Modal -->
    <Teleport to="body">
      <div v-if="importModePrompt" class="modal-overlay" @click.self="cancelImport">
        <div class="modal-content small">
          <h2 class="modal-title">Import {{ importModePrompt.type === 'notes' ? 'Notes' : importModePrompt.type === 'compendium' ? 'Compendium' : 'Notes & Compendium' }}</h2>
          <p class="warning-text">
            How would you like to import this data?
          </p>
          <div class="modal-actions import-actions">
            <button @click="executeImport('replace')" class="action-button btn-warning">Replace all existing entries</button>
            <button @click="executeImport('merge')" class="action-button btn-primary">Merge (keep both)</button>
            <button @click="cancelImport" class="cancel-btn btn-neutral">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reset Character Modal -->
    <ResetCharacterModal
      :isOpen="!!resetConfirm"
      :characterName="resetConfirm?.name || ''"
      @close="resetConfirm = null"
      @confirm="(fullReset: boolean) => executeReset(fullReset)"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCompendiumStore } from '~/store/compendium'
import { usePlayerStore } from '~/store/player'
import {
  getAllCharacters,
  setActiveCharacter,
  deleteCharacterWithSync,
  resetCharacterWithSync,
  downloadCharacterAsFile,
  downloadAllCharactersAsFile,
  importMultipleCharactersWithSync
} from '~/mixins/characterStorage'
import {
  exportNotes,
  exportCompendium,
  exportCharacterFull,
  downloadAsFile,
  importNotes,
  importCompendium,
  detectImportType
} from '~/mixins/notesStorage'
import ResetCharacterModal from '~/components/Modals/ResetCharacterModal.vue'

const router = useRouter()
const compendiumStore = useCompendiumStore()
const playerStore = usePlayerStore()

const isOpen = ref(false)
const characterList = ref(getAllCharacters())
const showBulkModal = ref(false)
const bulkFileInput = ref<HTMLInputElement | null>(null)
const notesFileInput = ref<HTMLInputElement | null>(null)
const bulkImportResult = ref<{ success: number; failed: number } | null>(null)
const deleteConfirm = ref<{ uuid: string; name: string } | null>(null)
const resetConfirm = ref<{ uuid: string; name: string; backgroundId: number } | null>(null)

// Watch for Level changes and refresh character list
watch(() => playerStore.Level, () => {
  characterList.value = getAllCharacters()
})

const characters = computed(() => characterList.value.characters)
const activeUuid = computed(() => characterList.value.active_uuid)
const hasCharacters = computed(() => characters.value.length > 0)

const currentCharacter = computed(() => {
  return characters.value.find(c => c.uuid === activeUuid.value)
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectCharacter(uuid: string) {
  setActiveCharacter(uuid)
  characterList.value = getAllCharacters()
  playerStore.loadActiveCharacter()
  isOpen.value = false
}

function createNewCharacter() {
  isOpen.value = false
  router.push('/character-creation')
}

function getBackgroundName(backgroundId: number): string {
  const background = compendiumStore.getBackgroundById(backgroundId)
  return background?.name || 'Unknown'
}

function exportCharacter(uuid: string) {
  downloadCharacterAsFile(uuid)
}

function confirmDelete(uuid: string, name: string) {
  deleteConfirm.value = { uuid, name }
}

function executeDelete() {
  if (!deleteConfirm.value) return

  const success = deleteCharacterWithSync(deleteConfirm.value.uuid)
  if (success) {
    characterList.value = getAllCharacters()
    deleteConfirm.value = null
    router.push('/campaigns')
  }
}

function confirmReset(uuid: string, name: string, backgroundId: number) {
  resetConfirm.value = { uuid, name, backgroundId }
}

async function executeReset(fullReset: boolean = false) {
  if (!resetConfirm.value) return

  const background = compendiumStore.getBackgroundById(resetConfirm.value.backgroundId)
  if (!background) {
    console.error('Background not found for reset')
    return
  }

  const success = resetCharacterWithSync(resetConfirm.value.uuid, background, fullReset)
  if (success) {
    characterList.value = getAllCharacters()
    // Reload active character if it was the one reset
    if (resetConfirm.value.uuid === activeUuid.value) {
      playerStore.loadActiveCharacter()
      // Force UI update
      await nextTick()
      // Trigger mandatory level up modal (character is now level 0)
      playerStore.initializeLevel1LevelUp()
    }
    resetConfirm.value = null
  }
}

function exportAll() {
  downloadAllCharactersAsFile()
}

function handleBulkImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const jsonString = e.target?.result as string
    const result = importMultipleCharactersWithSync(jsonString)
    bulkImportResult.value = result
    characterList.value = getAllCharacters()

    // Clear result after 5 seconds
    setTimeout(() => {
      bulkImportResult.value = null
    }, 5000)
  }
  reader.readAsText(file)

  // Reset file input
  if (bulkFileInput.value) {
    bulkFileInput.value.value = ''
  }
}

function closeBulkModal() {
  showBulkModal.value = false
  bulkImportResult.value = null
}

// Notes and Compendium export handlers
function handleExportNotes() {
  const jsonContent = exportNotes()
  const timestamp = new Date().toISOString().split('T')[0]
  downloadAsFile(jsonContent, `notes_${timestamp}.json`)
}

function handleExportCompendium() {
  const jsonContent = exportCompendium()
  const timestamp = new Date().toISOString().split('T')[0]
  downloadAsFile(jsonContent, `compendium_${timestamp}.json`)
}

function handleExportEverything() {
  if (!activeUuid.value) {
    alert('No active character selected')
    return
  }

  const jsonContent = exportCharacterFull(activeUuid.value)
  if (!jsonContent) {
    alert('Failed to export character')
    return
  }

  const timestamp = new Date().toISOString().split('T')[0]
  const charName = currentCharacter.value?.name || 'character'
  downloadAsFile(jsonContent, `${charName}_full_${timestamp}.json`)
}

// Import state for modal-based flow
const importModePrompt = ref<{ type: string; jsonString: string } | null>(null)

function handleImportNotesOrCompendium(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const jsonString = e.target?.result as string
    const importType = detectImportType(jsonString)

    if (importType === 'unknown') {
      alert('Invalid file format')
      return
    }

    if (importType === 'character') {
      alert('This is a character file. Use the dashboard to import characters.')
      return
    }

    // Show modal for replace/merge choice
    importModePrompt.value = { type: importType, jsonString }
  }
  reader.readAsText(file)

  // Reset file input
  if (notesFileInput.value) {
    notesFileInput.value.value = ''
  }
}

function executeImport(mode: 'replace' | 'merge') {
  if (!importModePrompt.value) return
  const { type, jsonString } = importModePrompt.value

  let success = false
  let message = ''

  if (type === 'notes') {
    success = importNotes(jsonString, mode)
    message = success ? 'Notes imported successfully!' : 'Failed to import notes'
  } else if (type === 'compendium') {
    success = importCompendium(jsonString, mode)
    message = success ? 'Compendium imported successfully!' : 'Failed to import compendium'
  } else if (type === 'both') {
    success = importNotes(jsonString, mode) && importCompendium(jsonString, mode)
    message = success ? 'Notes and Compendium imported successfully!' : 'Failed to import data'
  }

  importModePrompt.value = null
  alert(message)
}

function cancelImport() {
  importModePrompt.value = null
}

// Refresh character list on mount
onMounted(() => {
  characterList.value = getAllCharacters()
})
</script>

<style scoped>
.character-selector {
  position: relative;
  font-size: var(--font-size-body); /* Base responsive font size for em units */
}

.selector-dropdown {
  position: relative;
}

.current-character {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 12.5vw;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  color: var(--color-text-primary);
  min-height: 1.67vw;
  transition: var(--transition-hover);
}

.current-character:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent-gold-dim);
  box-shadow: var(--shadow-gold-soft);
}

.current-character .character-name {
  font-weight: bold;
  flex: 1;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
  font-size: 1em;
  text-align: left;
}

.current-character .dropdown-arrow {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85em;
  line-height: 1;
  margin-left: 4px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--spacing-sm);
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  min-width: 18.23vw;
  max-height: 37.04vh;
  overflow-y: auto;
  z-index: 9000; /* Very high to appear above all content */
  box-shadow: var(--shadow-panel);
}

.character-list {
  padding: 8px 0;
}

.character-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-primary);
  transition: var(--transition-hover);
}

.character-item:hover {
  background: var(--color-btn-primary-bg);
}

.character-item.active {
  background: var(--color-btn-primary-bg-hover);
  border-left: var(--border-width-thick) solid var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.character-name-row {
  display: flex;
  width: 100%;
  cursor: pointer;
}

.character-name-row .name {
  font-weight: bold;
  font-size: 1em;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.character-details-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.character-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.character-meta .level {
  color: var(--color-accent-gold-bright);
  font-size: 0.85em;
  white-space: nowrap;
}

.character-meta .background {
  color: var(--color-text-secondary);
  font-size: 0.85em;
  white-space: nowrap;
}

.character-actions {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  font-size: 0.9em;
  line-height: 1.2;
  transition: all 0.2s;
  min-height: 28px;
}

.export-btn:hover {
  background: rgba(0, 100, 200, 0.5);
  border-color: rgba(100, 150, 255, 0.5);
}

.reset-btn:hover {
  background: rgba(200, 100, 0, 0.5);
  border-color: rgba(255, 150, 50, 0.5);
}

.delete-btn:hover {
  background: rgba(200, 0, 0, 0.5);
  border-color: rgba(255, 100, 100, 0.5);
}

.dropdown-actions {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-button {
  width: 100%;
  padding: 10px;
  border: 1px solid;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button.btn-primary {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.action-button.btn-primary:hover:not(:disabled) {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.action-button.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-options-btn {
  background: transparent;
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

.bulk-options-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.no-characters {
  padding: 8px 12px;
  color: #888;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* Above all dropdowns and content */
}

.modal-content {
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-border-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-panel);
}

.modal-content.small {
  max-width: 400px;
}

.modal-title {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-lg);
}

.bulk-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.bulk-action-card {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
}

.bulk-action-card h3 {
  color: var(--color-text-gold);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.bulk-action-card p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.bulk-action-btn {
  width: 100%;
  padding: 12px;
  border: 2px solid;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-weight: bold;
  font-size: 1em;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bulk-action-btn.import {
  background: rgba(0, 150, 0, 0.5);
  border-color: rgba(0, 255, 0, 0.5);
}

.bulk-action-btn.import:hover {
  background: rgba(0, 150, 0, 0.7);
}

.import-result {
  padding: 15px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  margin-bottom: 20px;
}

.import-result .success {
  color: #4caf50;
  margin-bottom: 5px;
}

.import-result .error {
  color: var(--color-red-bright);
}

.warning-text {
  color: #ccc;
  margin-bottom: 15px;
  line-height: 1.5;
}

.warning-text.danger {
  color: var(--color-red-bright);
  font-weight: bold;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.import-actions {
  flex-direction: column;
  align-items: stretch;
  gap: 0.625em;
}

.import-actions .action-button,
.import-actions .cancel-btn {
  text-align: center;
  padding: 0.75em 1.5em;
  width: 100%;
  box-sizing: border-box;
}

.cancel-btn, .close-btn, .delete-confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 4px;
  border: 2px solid;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.2s;
}

.cancel-btn, .close-btn {
  background: var(--color-btn-transparent-bg);
  border-color: var(--color-btn-transparent-border);
  color: var(--color-text-primary);
}

.cancel-btn:hover, .close-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-primary);
  box-shadow: var(--shadow-gold-soft);
}

.delete-confirm-btn {
  background: rgba(200, 0, 0, 0.5);
  border-color: rgba(255, 100, 100, 0.5);
  color: white;
}

.delete-confirm-btn:hover {
  background: rgba(200, 0, 0, 0.7);
}
</style>
