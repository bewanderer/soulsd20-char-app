<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <h1 class="title">Welcome to Souls D20</h1>
      <p class="subtitle">You have no characters yet.</p>
      <p class="description">
        Create your first character to begin your journey through
        the dark and challenging world of Souls D20.
      </p>

      <div class="action-buttons">
        <button @click="createCharacter" class="create-btn">
          Create New Character
        </button>
        <button @click="showImportModal = true" class="import-btn">
          Import Character
        </button>
      </div>

      <p class="import-hint">Switching devices? Import your character from a JSON file.</p>

      <div class="secondary-actions">
        <NuxtLink to="/campaigns" class="campaigns-link">
          Browse Campaigns
        </NuxtLink>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-content">
        <h2 class="modal-title">Import Character</h2>

        <p class="modal-description">
          Paste your character's JSON data below, or upload a .json file.
        </p>

        <div class="import-methods">
          <div class="method-section">
            <label class="method-label">Upload JSON File:</label>
            <input
              type="file"
              accept=".json"
              @change="handleFileUpload"
              class="file-input"
            />
          </div>

          <div class="method-divider">OR</div>

          <div class="method-section">
            <label class="method-label">Paste JSON:</label>
            <textarea
              v-model="importJson"
              placeholder="Paste character JSON here..."
              class="json-textarea"
            ></textarea>
          </div>
        </div>

        <div v-if="importError" class="error-message">
          {{ importError }}
        </div>

        <div class="modal-actions">
          <button @click="closeImportModal" class="cancel-btn">Cancel</button>
          <button @click="handleImport" class="import-action-btn">Import</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { importCharacterWithSync } from '~/mixins/characterStorage'

const router = useRouter()
const showImportModal = ref(false)
const importJson = ref('')
const importError = ref('')

function createCharacter() {
  router.push('/character-creation')
}

function closeImportModal() {
  showImportModal.value = false
  importJson.value = ''
  importError.value = ''
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    importJson.value = e.target?.result as string
  }
  reader.readAsText(file)
}

function handleImport() {
  importError.value = ''

  if (!importJson.value.trim()) {
    importError.value = 'Please provide character data to import.'
    return
  }

  const success = importCharacterWithSync(importJson.value)

  if (success) {
    // Navigate to character sheet after successful import
    router.push('/')
  } else {
    importError.value = 'Failed to import character. Please check the JSON format and try again.'
  }
}
</script>

<style scoped>
.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(10, 10, 10, 0.95), rgba(20, 20, 30, 0.95));
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.title {
  font-size: 3em;
  color: var(--color-gold-primary);
  margin-bottom: 20px;
}

.subtitle {
  font-size: 1.5em;
  color: #ccc;
  margin-bottom: 20px;
}

.description {
  color: #999;
  margin-bottom: 40px;
  line-height: 1.6;
  font-size: 1.1em;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
}

.create-btn, .import-btn {
  padding: 16px 32px;
  font-size: 1.2em;
  border: 2px solid;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.create-btn {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.create-btn:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  transform: scale(1.05);
  box-shadow: var(--shadow-gold-medium);
}

.import-btn {
  background: transparent;
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

.import-btn:hover {
  border-color: var(--color-accent-gold-bright);
  transform: scale(1.05);
  box-shadow: var(--shadow-gold-soft);
}

.import-hint {
  color: #888;
  font-size: 0.9em;
  font-style: italic;
}

.secondary-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.campaigns-link,
.campaigns-link:link,
.campaigns-link:visited,
.campaigns-link:hover {
  color: #ffd700 !important;
  text-decoration: none !important;
  font-size: 1.1em;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: rgba(30, 30, 30, 0.98);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  color: var(--color-gold-primary);
  font-size: 1.8em;
  margin-bottom: 15px;
}

.modal-description {
  color: #ccc;
  margin-bottom: 25px;
  line-height: 1.5;
}

.import-methods {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.method-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.method-label {
  color: #fff;
  font-weight: bold;
  font-size: 0.95em;
}

.file-input {
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.file-input:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.method-divider {
  text-align: center;
  color: #888;
  font-weight: bold;
  padding: 10px 0;
}

.json-textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-family: monospace;
  font-size: 0.9em;
  resize: vertical;
}

.json-textarea:focus {
  outline: none;
  border-color: var(--color-gold-primary);
}

.error-message {
  padding: 12px;
  background: rgba(200, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  border-radius: 4px;
  color: #ffcccc;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.cancel-btn, .import-action-btn {
  padding: 12px 24px;
  border-radius: 4px;
  border: 2px solid;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--color-btn-transparent-bg);
  border-color: var(--color-btn-transparent-border);
  color: var(--color-text-primary);
}

.cancel-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-primary);
  box-shadow: var(--shadow-gold-soft);
}

.import-action-btn {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.import-action-btn:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}
</style>
