<template>
  <div class="flex flex-col w-full overflow-hidden main-tab">
    <!-- Header -->
    <div class="page-header-bar" style="justify-content: space-between;">
      <div class="flex items-center gap-4 header-controls">
        <h1 class="page-title">Notes</h1>

        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search sections..."
          class="px-3 py-1 rounded outline-none search-input"
        />

        <!-- Sort -->
        <select
          v-model="sortMode"
          class="px-3 py-1 rounded outline-none sort-select"
        >
          <option value="default">Sort: Default (Creation Order)</option>
          <option value="name-asc">Sort: A-Z</option>
          <option value="name-desc">Sort: Z-A</option>
          <option value="latest">Sort: Latest Created</option>
          <option value="oldest">Sort: Oldest Created</option>
        </select>
      </div>

      <div class="flex gap-2 action-buttons">
        <button
          @click="handleExportNotes"
          class="px-4 py-2 rounded btn-export"
        >
          Export
        </button>
        <button
          @click="handleImportNotes"
          class="px-4 py-2 rounded btn-import"
        >
          Import
        </button>
        <button
          @click="addSection"
          class="px-4 py-2 font-semibold rounded btn-add-section"
        >
          + Add Section
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          @change="handleFileSelect"
          class="hidden"
        />
      </div>
    </div>

    <!-- Sections Grid - Side by Side -->
    <div class="flex-1 overflow-auto p-4 sections-container">
      <div v-if="filteredAndSortedSections.length > 0" class="grid grid-cols-2 gap-4 sections-grid">
        <div
          v-for="section in filteredAndSortedSections"
          :key="section.id"
          :class="[
            'rounded-lg p-4 border flex flex-col section-card',
            section.expanded ? 'row-span-2' : ''
          ]"
        >
          <!-- Section Header -->
          <div class="flex justify-between items-center mb-2 section-header">
            <input
              v-model="section.name"
              @blur="saveSection(section)"
              type="text"
              placeholder="Section Name"
              class="flex-1 text-lg font-bold border-b outline-none px-2 py-1 section-name-input"
            />
            <div class="flex gap-2 ml-4 section-controls">
              <button
                @click="toggleExpand(section.id)"
                class="px-3 py-1 rounded btn-expand"
                :title="section.expanded ? 'Collapse' : 'Expand'"
              >
                {{ section.expanded ? '▼' : '▲' }}
              </button>
              <button
                @click="removeSection(section.id)"
                class="px-3 py-1 rounded btn-delete"
              >
                X
              </button>
            </div>
          </div>

          <!-- Section Content -->
          <textarea
            v-model="section.content"
            @blur="saveSection(section)"
            @input="autoResize($event)"
            placeholder="Write your notes here..."
            rows="8"
            :class="[
              'flex-1 w-full rounded p-3 resize-y section-textarea',
              section.expanded ? 'min-h-[450px]' : 'min-h-[200px]'
            ]"
          ></textarea>

          <!-- Metadata -->
          <div class="text-xs mt-2 flex justify-between section-metadata">
            <span>Created: {{ formatDate(section.created_at) }}</span>
            <span>Edited: {{ formatDate(section.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="sections.length === 0" class="text-center italic py-16 empty-state">
        <p class="text-xl mb-2 empty-title">No notes yet</p>
        <p class="empty-message">Click "+ Add Section" to create your first note section</p>
      </div>

      <!-- No Search Results -->
      <div v-if="sections.length > 0 && filteredAndSortedSections.length === 0" class="text-center italic py-16 empty-state">
        <p class="text-xl mb-2 empty-title">No sections found</p>
        <p class="empty-message">Try a different search term</p>
      </div>
    </div>
  </div>

  <!-- Import Mode Modal -->
  <Teleport to="body">
    <div v-if="importPending" class="import-modal-overlay" @click.self="importPending = null">
      <div class="import-modal-content">
        <h2 class="import-modal-title">Import Notes</h2>
        <p class="import-modal-text">How would you like to import this data?</p>
        <div class="import-modal-actions">
          <button @click="executeNotesImport('replace')" class="import-btn import-btn-replace">Replace all existing entries</button>
          <button @click="executeNotesImport('merge')" class="import-btn import-btn-merge">Merge (keep both)</button>
          <button @click="importPending = null" class="import-btn import-btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/store/player'
import { exportNotes, importNotes, downloadAsFile } from '@/mixins/notesStorage'

const playerStore = usePlayerStore()
const searchQuery = ref('')
const sortMode = ref<'default' | 'name-asc' | 'name-desc' | 'latest' | 'oldest'>('default')
const fileInput = ref<HTMLInputElement | null>(null)

const sections = computed(() => playerStore.Notes.sections || [])

const filteredAndSortedSections = computed(() => {
  let result = [...sections.value]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(section =>
      section.name.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  if (sortMode.value !== 'default') {
    result.sort((a, b) => {
      switch (sortMode.value) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'latest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })
  }
  // Default sort: keep creation order (no sorting needed)

  return result
})

function addSection() {
  const newSection = {
    id: generateUUID(),
    name: 'New Section',
    content: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (!playerStore.Notes.sections) {
    playerStore.Notes.sections = []
  }

  playerStore.Notes.sections.push(newSection)
  playerStore.save()
}

function removeSection(id: string) {
  const confirmRemove = confirm('Are you sure you want to remove this note section?')
  if (!confirmRemove) return

  const index = playerStore.Notes.sections.findIndex(s => s.id === id)
  if (index !== -1) {
    playerStore.Notes.sections.splice(index, 1)
    playerStore.save()
  }
}

function saveSection(section: any) {
  section.updated_at = new Date().toISOString()
  playerStore.save()
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function autoResize(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

function toggleExpand(sectionId: string) {
  const section = playerStore.Notes.sections.find(s => s.id === sectionId)
  if (section) {
    section.expanded = !section.expanded
    playerStore.save()
  }
}

function handleExportNotes() {
  const json = exportNotes()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  downloadAsFile(json, `notes-export-${timestamp}.json`)
}

function handleImportNotes() {
  fileInput.value?.click()
}

// Import modal state
const importPending = ref<string | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    importPending.value = e.target?.result as string
  }
  reader.readAsText(file)

  input.value = ''
}

function executeNotesImport(mode: 'replace' | 'merge') {
  if (!importPending.value) return
  try {
    const success = importNotes(importPending.value, mode)
    importPending.value = null
    alert(success ? 'Notes imported successfully!' : 'Failed to import notes. Invalid file format.')
  } catch (error) {
    console.error('Import error:', error)
    importPending.value = null
    alert('Failed to import notes. Invalid file.')
  }
}
</script>

<style scoped>
/* ===========================================
   Main Container
   =========================================== */
.main-tab {
  height: 100%;
  background: transparent !important;
}

/* ===========================================
   Header Section
   =========================================== */
.notes-header {
  background: var(--color-bg-secondary);
  border-bottom-color: var(--color-border-primary);
  border-bottom-width: var(--border-width-medium);
}

.page-title {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

/* ===========================================
   Search & Sort Controls
   =========================================== */
.search-input,
.sort-select {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: 'EB Garamond', serif;
  transition: var(--transition-hover);
}

.search-input:focus,
.sort-select:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.search-input:hover,
.sort-select:hover {
  border-color: var(--color-accent-gold-dim);
  background: rgba(42, 42, 42, 0.8);
}

/* ===========================================
   Action Buttons (Export/Import/Add)
   =========================================== */
.btn-export {
  background: transparent;
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-hover);
}

.btn-export:hover {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.btn-import {
  background: transparent;
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-hover);
}

.btn-import:hover {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.btn-add-section {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
}

.btn-add-section:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

/* ===========================================
   Section Cards
   =========================================== */
.section-card {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-primary);
  border-width: var(--border-width-medium);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-hover);
}

.section-card:hover {
  border-color: var(--color-accent-gold-dim);
  box-shadow: var(--shadow-gold-soft);
}

/* Section Name Input */
.section-name-input {
  background: transparent;
  color: var(--color-accent-gold-bright);
  border-bottom-color: var(--color-border-secondary);
  border-bottom-width: var(--border-width-thin);
  border-radius: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-sm);
}

.section-name-input:focus {
  border-bottom-color: var(--color-accent-gold-bright);
  box-shadow: none;
}

/* ===========================================
   Section Controls (Expand/Delete)
   =========================================== */
.btn-expand {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-hover);
}

.btn-expand:hover {
  background: rgba(26, 26, 26, 0.8);
  color: var(--color-accent-gold-bright);
  border-color: var(--color-accent-gold-dim);
  box-shadow: var(--shadow-gold-soft);
}

.btn-delete {
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
}

.btn-delete:hover {
  background: var(--color-red-rgba-strong);
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.6);
}

/* ===========================================
   Section Content (Textarea)
   =========================================== */
.section-textarea {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  font-family: 'EB Garamond', serif;
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  resize: vertical;
  transition: var(--transition-hover);
}

.section-textarea:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.section-textarea::placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* ===========================================
   Metadata (Timestamps)
   =========================================== */
.section-metadata {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

/* ===========================================
   Sections Container
   =========================================== */
.sections-container {
  --color-bg-primary: transparent !important;
  --color-bg-secondary: transparent !important;
  background: transparent !important;
}

/* ===========================================
   Empty States
   =========================================== */
.empty-state {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.empty-title {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.empty-message {
  color: var(--color-text-tertiary);
}

/* Import Modal */
.import-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.import-modal-content {
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  padding: clamp(1.5rem, 2.5vw, 1.875rem);
  max-width: clamp(22rem, 35vw, 28rem);
  width: 90%;
}

.import-modal-title {
  color: var(--color-gold-primary);
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  margin: 0 0 0.75em 0;
}

.import-modal-text {
  color: #ccc;
  margin-bottom: 1.25em;
}

.import-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625em;
}

.import-btn {
  width: 100%;
  padding: 0.75em 1.5em;
  border-radius: 0.375rem;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.import-btn-replace {
  background: var(--color-btn-danger-bg);
  border: 0.0625rem solid var(--color-btn-danger-border);
  color: var(--color-btn-danger-text);
}

.import-btn-replace:hover {
  background: var(--color-btn-danger-bg-hover);
}

.import-btn-merge {
  background: rgba(60, 179, 113, 0.12);
  border: 0.0625rem solid rgba(60, 179, 113, 0.4);
  color: var(--color-green-primary);
}

.import-btn-merge:hover {
  background: rgba(60, 179, 113, 0.2);
  border-color: var(--color-green-primary);
}

.import-btn-cancel {
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  color: #ccc;
}
</style>
