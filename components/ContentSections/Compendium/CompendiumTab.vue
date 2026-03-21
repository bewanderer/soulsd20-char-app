<template>
  <div class="flex w-full compendium-content-wrapper main-tab">
    <!-- Left Panel - Entries List -->
    <div class="w-1/2 flex flex-col border-r overflow-auto compendium-panel-left left-panel">
      <!-- Header -->
      <div class="page-header-bar" style="justify-content: space-between;">
        <h1 class="page-title">Personal Compendium</h1>
        <div class="flex gap-2">
          <button
            @click="handleExportCompendium"
            class="btn-export"
          >
            Export
          </button>
          <button
            @click="handleImportCompendium"
            class="btn-import"
          >
            Import
          </button>
          <button
            @click="showCreateModal = true"
            class="btn-add-entry"
          >
            + Add Entry
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="p-4 flex gap-2" style="background: var(--color-bg-secondary); border-bottom: var(--border-width-thin) solid var(--color-border-primary);">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search entries..."
          class="flex-1 px-3 py-2 rounded outline-none search-input"
        />
        <select
          v-model="filterType"
          class="px-3 py-2 rounded outline-none filter-select"
        >
          <option value="all">All Types</option>
          <option value="lore">Lore</option>
          <option value="character">Character</option>
          <option value="location">Location</option>
          <option value="monster">Monster</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Hidden file input for import -->
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        @change="onFileSelected"
        style="display: none"
      />

      <!-- Entries List -->
      <div class="flex-1 overflow-auto p-4 entries-list-container" style="min-height: 0;">
        <div v-if="groupedEntries.lore.length > 0" class="mb-4">
          <h3 class="text-lg font-bold mb-2 section-header-lore">Lore ({{ groupedEntries.lore.length }})</h3>
          <div class="space-y-1">
            <div
              v-for="entry in groupedEntries.lore"
              :key="entry.id"
              @click="selectEntry(entry)"
              :class="selectedEntry?.id === entry.id ? 'entry-item-lore-selected' : 'entry-item-lore'"
            >
              {{ entry.name }}
            </div>
          </div>
        </div>

        <div v-if="groupedEntries.character.length > 0" class="mb-4">
          <h3 class="text-lg font-bold mb-2 section-header-character">Characters ({{ groupedEntries.character.length }})</h3>
          <div class="space-y-1">
            <div
              v-for="entry in groupedEntries.character"
              :key="entry.id"
              @click="selectEntry(entry)"
              :class="selectedEntry?.id === entry.id ? 'entry-item-character-selected' : 'entry-item-character'"
            >
              {{ entry.name }}
            </div>
          </div>
        </div>

        <div v-if="groupedEntries.location.length > 0" class="mb-4">
          <h3 class="text-lg font-bold mb-2 section-header-location">Locations ({{ groupedEntries.location.length }})</h3>
          <div class="space-y-1">
            <div
              v-for="entry in groupedEntries.location"
              :key="entry.id"
              @click="selectEntry(entry)"
              :class="selectedEntry?.id === entry.id ? 'entry-item-location-selected' : 'entry-item-location'"
            >
              {{ entry.name }}
            </div>
          </div>
        </div>

        <div v-if="groupedEntries.monster.length > 0" class="mb-4">
          <h3 class="text-lg font-bold mb-2 section-header-monster-compact">Monsters ({{ groupedEntries.monster.length }})</h3>
          <div class="space-y-1">
            <div
              v-for="entry in groupedEntries.monster"
              :key="entry.id"
              @click="selectEntry(entry)"
              :class="[
                'flex justify-between items-center',
                selectedEntry?.id === entry.id ? 'entry-item-monster-selected' : 'entry-item-monster'
              ]"
            >
              <span>{{ entry.name }}</span>
              <span v-if="entry.is_boss" class="boss-badge">BOSS</span>
            </div>
          </div>
        </div>

        <div v-if="groupedEntries.other.length > 0" class="mb-4">
          <h3 class="text-lg font-bold mb-2 section-header-other">Other ({{ groupedEntries.other.length }})</h3>
          <div class="space-y-1">
            <div
              v-for="entry in groupedEntries.other"
              :key="entry.id"
              @click="selectEntry(entry)"
              :class="selectedEntry?.id === entry.id ? 'entry-item-other-selected' : 'entry-item-other'"
            >
              {{ entry.name }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="entries.length === 0" class="text-center italic py-16 empty-state">
          <p class="text-xl mb-2">No compendium entries yet</p>
          <p>Click "+ Add Entry" to create your first entry</p>
        </div>

        <!-- No Results -->
        <div v-if="entries.length > 0 && filteredEntries.length === 0" class="text-center italic py-16 empty-state">
          <p class="text-xl mb-2">No entries found</p>
          <p>Try a different search term or filter</p>
        </div>
      </div>
    </div>

    <!-- Right Panel - Detail View -->
    <div class="w-1/2 overflow-auto compendium-panel-right right-panel">
      <div v-if="selectedEntry" class="p-6">
        <!-- Entry Header -->
        <div class="mb-6">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <h2 class="text-3xl font-bold entry-title">{{ selectedEntry.name }}</h2>
              <span v-if="selectedEntry.type === 'monster' && selectedEntry.is_boss" class="boss-badge">BOSS</span>
            </div>
            <div class="flex gap-2">
              <button
                @click="editEntry"
                class="px-4 py-2 rounded transition-colors btn-edit"
              >
                Edit
              </button>
              <button
                @click="deleteEntry"
                class="btn-delete"
              >
                Delete
              </button>
            </div>
          </div>

          <!-- Type Badge -->
          <div class="flex items-center gap-2 mb-3">
            <span :class="getTypeBadgeClass(selectedEntry.type)" class="px-3 py-1 rounded text-sm font-semibold">
              {{ selectedEntry.type.toUpperCase() }}
            </span>
            <span class="text-sm metadata-text">
              Created: {{ formatDate(selectedEntry.created_at) }}
            </span>
          </div>

          <!-- Auto-generated Tags -->
          <div class="flex flex-wrap gap-3 mb-4">
            <span
              v-for="(tag, index) in getAutoTags(selectedEntry)"
              :key="index"
              class="px-2 py-1 rounded text-xs auto-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Type-specific Fields -->
        <div class="space-y-4">
          <!-- Character Fields -->
          <div v-if="selectedEntry.type === 'character'">
            <div v-if="selectedEntry.lineage_id" class="mb-3">
              <label class="block text-sm font-semibold mb-1 field-label">Lineage</label>
              <p class="field-value">{{ getLineageName(selectedEntry.lineage_id) }}</p>
            </div>
            <div v-if="selectedEntry.bloodline_id" class="mb-3">
              <label class="block text-sm font-semibold mb-1 field-label">Bloodline</label>
              <p class="field-value">{{ getBloodlineName(selectedEntry.bloodline_id) }}</p>
            </div>
            <div v-if="selectedEntry.age" class="mb-3">
              <label class="block text-sm font-semibold mb-1 field-label">Age</label>
              <p class="field-value">{{ selectedEntry.age }}</p>
            </div>
          </div>

          <!-- Monster Fields -->
          <div v-if="selectedEntry.type === 'monster'">
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div v-if="selectedEntry.hp !== null">
                <label class="block text-lg font-bold mb-1 field-label-hp">HP</label>
                <p class="text-lg field-value">{{ selectedEntry.hp }}</p>
              </div>
              <div v-if="selectedEntry.fp !== null">
                <label class="block text-lg font-bold mb-1 field-label-fp">FP</label>
                <p class="text-lg field-value">{{ selectedEntry.fp }}</p>
              </div>
              <div v-if="selectedEntry.ap !== null">
                <label class="block text-lg font-bold mb-1 field-label-ap">AP</label>
                <p class="text-lg field-value">{{ selectedEntry.ap }}</p>
              </div>
            </div>

            <!-- Boss Phases Display (Compact) -->
            <div v-if="selectedEntry.is_boss" class="space-y-3">
              <div v-for="phase in getPhases(selectedEntry)" :key="phase" class="p-3 rounded phase-section-compact">
                <h3 class="text-lg font-semibold mb-2 phase-header-compact">Phase {{ phase }}</h3>

                <div v-if="getResistancesForPhase(selectedEntry, phase).length > 0" class="mb-2">
                  <label class="block text-sm font-semibold mb-0 field-label-compact">Resistances</label>
                  <div class="flex flex-wrap gap-3">
                    <div
                      v-for="(res, index) in getResistancesForPhase(selectedEntry, phase)"
                      :key="index"
                      class="flex items-center gap-1 px-2 py-1 rounded resistance-item-phase-compact"
                    >
                      <span class="field-value-compact">{{ res.resistance_type }}</span>
                      <span :class="res.modifier >= 0 ? 'modifier-positive-compact' : 'modifier-negative-compact'" class="font-semibold">
                        {{ res.modifier >= 0 ? '+' : '' }}{{ res.modifier }}%
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="getStatusesForPhase(selectedEntry, phase).length > 0">
                  <label class="block text-sm font-semibold mb-0 field-label-compact">Statuses</label>
                  <div class="flex flex-wrap gap-3">
                    <div
                      v-for="(status, index) in getStatusesForPhase(selectedEntry, phase)"
                      :key="index"
                      class="flex items-center gap-1 px-2 py-1 rounded status-item-phase-compact"
                    >
                      <span class="field-value-compact">{{ status.status_type }}</span>
                      <span :class="status.modifier < 0 ? 'status-modifier-negative-compact' : 'status-modifier-compact'" class="font-semibold">{{ status.modifier }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Non-Boss Display -->
            <div v-else>
              <div v-if="selectedEntry.resistances && selectedEntry.resistances.length > 0" class="mb-4">
                <label class="block text-sm font-semibold mb-2 field-label">Resistances</label>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="(res, index) in selectedEntry.resistances"
                    :key="index"
                    class="flex justify-between items-center p-2 rounded resistance-item"
                  >
                    <span class="field-value">{{ res.resistance_type }}</span>
                    <span :class="res.modifier >= 0 ? 'modifier-positive' : 'modifier-negative'" class="font-semibold">
                      {{ res.modifier >= 0 ? '+' : '' }}{{ res.modifier }}%
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="selectedEntry.statuses && selectedEntry.statuses.length > 0" class="mb-4">
                <label class="block text-sm font-semibold mb-2 field-label">Statuses</label>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="(status, index) in selectedEntry.statuses"
                    :key="index"
                    class="flex justify-between items-center p-2 rounded status-item"
                  >
                    <span class="field-value">{{ status.status_type }}</span>
                    <span class="font-semibold status-modifier">{{ status.modifier }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedEntry.behavior_notes" class="mb-4 p-3 rounded behavior-notes-section">
              <label class="block text-sm font-semibold mb-2 behavior-notes-label">Behavior Notes</label>
              <p class="whitespace-pre-wrap content-text">{{ selectedEntry.behavior_notes }}</p>
            </div>
          </div>

          <!-- Content (all types except monster which uses behavior_notes) -->
          <div v-if="selectedEntry.content">
            <label class="block text-sm font-semibold mb-1 field-label">
              {{ selectedEntry.type === 'monster' ? 'Additional Notes' : 'Content' }}
            </label>
            <p class="whitespace-pre-wrap content-text">{{ selectedEntry.content }}</p>
          </div>

          <!-- Metadata -->
          <div class="text-xs mt-6 pt-4 border-t metadata-footer">
            Last updated: {{ formatDate(selectedEntry.updated_at) }}
          </div>
        </div>
      </div>

      <!-- No Selection State -->
      <div v-else class="flex items-center justify-center italic no-selection" style="min-height: 300px;">
        <p>Select an entry to view details</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 flex items-center justify-center p-4 modal-overlay"
      @click.self="closeModal"
    >
      <div class="rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto modal-content">
        <h2 class="text-2xl font-bold mb-4 modal-title">
          {{ showEditModal ? 'Edit Entry' : 'Create New Entry' }}
        </h2>

        <!-- Step 1: Select Type (Create Only) -->
        <div v-if="showCreateModal && createStep === 1" class="space-y-3">
          <p class="mb-4 form-label">Select the type of entry you want to create:</p>
          <button
            @click="selectType('lore')"
            class="type-btn-lore"
          >
            <span class="font-bold">Lore</span> - General knowledge, history, or information
          </button>
          <button
            @click="selectType('character')"
            class="type-btn-character"
          >
            <span class="font-bold">Character</span> - NPCs, companions, or notable figures
          </button>
          <button
            @click="selectType('location')"
            class="type-btn-location"
          >
            <span class="font-bold">Location</span> - Places, regions, or landmarks
          </button>
          <button
            @click="selectType('monster')"
            class="type-btn-monster"
          >
            <span class="font-bold">Monster</span> - Enemies, creatures, or bosses
          </button>
          <button
            @click="selectType('other')"
            class="type-btn-other"
          >
            <span class="font-bold">Other</span> - Anything else
          </button>
          <button
            @click="closeModal"
            class="w-full p-3 rounded transition-colors mt-4 btn-cancel"
          >
            Cancel
          </button>
        </div>

        <!-- Step 2: Fill Form -->
        <div v-if="(showCreateModal && createStep === 2) || showEditModal" class="space-y-4">
          <!-- Common Fields -->
          <div>
            <label class="block text-sm font-semibold mb-1 form-label">Name *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Entry name"
              class="w-full px-3 py-2 rounded outline-none form-input"
            />
          </div>

          <!-- Character-specific Fields -->
          <div v-if="form.type === 'character'" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1 form-label">Lineage</label>
              <select
                v-model="form.lineage_id"
                @change="onLineageChange"
                class="w-full px-3 py-2 rounded outline-none form-select"
              >
                <option :value="null">No Lineage</option>
                <option v-for="lineage in compendiumStore.Lineages" :key="lineage.id" :value="lineage.id">
                  {{ lineage.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1 form-label">Bloodline</label>
              <select
                v-model="form.bloodline_id"
                :disabled="!form.lineage_id || availableBloodlines.length === 0"
                class="w-full px-3 py-2 rounded outline-none form-select"
              >
                <option :value="null">No Bloodline</option>
                <option v-for="bloodline in availableBloodlines" :key="bloodline.id" :value="bloodline.id">
                  {{ bloodline.name }}
                </option>
              </select>
              <p v-if="form.lineage_id && availableBloodlines.length === 0" class="text-xs mt-1 helper-text">
                No bloodlines available for this lineage
              </p>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1 form-label">Age</label>
              <input
                v-model.number="form.age"
                type="number"
                placeholder="Age"
                class="w-full px-3 py-2 rounded outline-none form-input"
              />
            </div>
          </div>

          <!-- Monster-specific Fields -->
          <div v-if="form.type === 'monster'" class="space-y-4">
            <!-- Boss Checkbox -->
            <div class="flex items-center gap-2">
              <input
                v-model="form.is_boss"
                type="checkbox"
                id="is-boss"
                class="w-5 h-5 rounded form-checkbox"
              />
              <label for="is-boss" class="text-sm font-semibold form-label">Boss Monster</label>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-1 form-label">HP</label>
                <input
                  v-model.number="form.hp"
                  type="number"
                  placeholder="HP"
                  class="w-full px-3 py-2 rounded outline-none form-input"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1 form-label">FP</label>
                <input
                  v-model.number="form.fp"
                  type="number"
                  placeholder="FP"
                  class="w-full px-3 py-2 rounded outline-none form-input"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1 form-label">AP</label>
                <input
                  v-model.number="form.ap"
                  type="number"
                  placeholder="AP"
                  class="w-full px-3 py-2 rounded outline-none form-input"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2 form-label">
                Resistances (%)
                <button
                  @click="addResistance"
                  class="btn-add-small"
                >
                  + Add
                </button>
              </label>
              <div class="space-y-2">
                <div
                  v-for="(res, index) in form.resistances"
                  :key="index"
                  class="flex gap-2 items-center"
                >
                  <select
                    v-model="res.resistance_type"
                    :disabled="!canAddResistanceType(res.resistance_type, res.phase, index)"
                    class="flex-1 px-3 py-2 rounded outline-none form-select"
                  >
                    <option v-for="type in getAvailableResistanceTypes(res.phase, index)" :key="type" :value="type">{{ type }}</option>
                  </select>
                  <div v-if="form.is_boss" class="w-24">
                    <select
                      v-model.number="res.phase"
                      class="w-full px-3 py-2 rounded outline-none form-select"
                    >
                      <option v-for="p in 10" :key="p" :value="p">Phase {{ p }}</option>
                    </select>
                  </div>
                  <div class="relative w-28">
                    <input
                      v-model.number="res.modifier"
                      type="number"
                      min="-100"
                      max="999"
                      placeholder="%"
                      class="w-full px-3 py-2 pr-8 rounded outline-none form-input"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none percent-symbol">%</span>
                  </div>
                  <button
                    @click="removeResistance(index)"
                    class="btn-remove-small"
                  >
                    X
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2 form-label">
                Statuses (Flat)
                <button
                  @click="addStatus"
                  class="btn-add-small"
                >
                  + Add
                </button>
              </label>
              <div class="space-y-2">
                <div
                  v-for="(status, index) in form.statuses"
                  :key="index"
                  class="flex gap-2 items-center"
                >
                  <select
                    v-model="status.status_type"
                    :disabled="!canAddStatusType(status.status_type, status.phase, index)"
                    class="flex-1 px-3 py-2 rounded outline-none form-select"
                  >
                    <option v-for="type in getAvailableStatusTypes(status.phase, index)" :key="type" :value="type">{{ type }}</option>
                  </select>
                  <div v-if="form.is_boss" class="w-24">
                    <select
                      v-model.number="status.phase"
                      class="w-full px-3 py-2 rounded outline-none form-select"
                    >
                      <option v-for="p in 10" :key="p" :value="p">Phase {{ p }}</option>
                    </select>
                  </div>
                  <input
                    v-model.number="status.modifier"
                    type="number"
                    placeholder="Value"
                    class="w-28 px-3 py-2 rounded outline-none form-input"
                  />
                  <button
                    @click="removeStatus(index)"
                    class="btn-remove-small"
                  >
                    X
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1 form-label">Behavior Notes</label>
              <textarea
                v-model="form.behavior_notes"
                rows="6"
                placeholder="Describe the monster's behavior, tactics, weaknesses..."
                class="w-full px-3 py-2 rounded outline-none resize-y form-textarea"
              ></textarea>
            </div>
          </div>

          <!-- Content Field (for non-monster or additional notes) -->
          <div v-if="form.type !== 'monster'">
            <label class="block text-sm font-semibold mb-1 form-label">Content</label>
            <textarea
              v-model="form.content"
              rows="10"
              placeholder="Enter content here..."
              class="w-full px-3 py-2 rounded outline-none resize-y form-textarea"
            ></textarea>
          </div>

          <!-- Form Actions -->
          <div class="flex gap-3 pt-4">
            <button
              @click="saveEntry"
              class="btn-save flex-1"
            >
              {{ showEditModal ? 'Save Changes' : 'Create Entry' }}
            </button>
            <button
              @click="closeModal"
              class="px-4 py-2 rounded transition-colors btn-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Import Mode Modal -->
  <Teleport to="body">
    <div v-if="importPending" class="import-modal-overlay" @click.self="importPending = null">
      <div class="import-modal-content">
        <h2 class="import-modal-title">Import Compendium</h2>
        <p class="import-modal-text">How would you like to import this data?</p>
        <div class="import-modal-actions">
          <button @click="executeCompendiumImport('replace')" class="import-btn import-btn-replace">Replace all existing entries</button>
          <button @click="executeCompendiumImport('merge')" class="import-btn import-btn-merge">Merge (keep both)</button>
          <button @click="importPending = null" class="import-btn import-btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerStore } from '@/store/player'
import { useCompendiumStore } from '@/store/compendium'
import { ResistanceType, StatusType } from '@/mixins/types'
import {
  exportCompendium,
  importCompendium,
  downloadAsFile
} from '@/mixins/notesStorage'

const playerStore = usePlayerStore()
const compendiumStore = useCompendiumStore()

const searchQuery = ref('')
const filterType = ref<'all' | 'lore' | 'character' | 'location' | 'monster' | 'other'>('all')
const selectedEntry = ref<any>(null)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const createStep = ref(1)
const fileInput = ref<HTMLInputElement | null>(null)

const form = ref<any>({
  type: '',
  name: '',
  content: '',
  lineage_id: null,
  bloodline_id: null,
  age: null,
  is_boss: false,
  resistances: [],
  statuses: [],
  hp: null,
  fp: null,
  ap: null,
  behavior_notes: ''
})

const resistanceTypes = Object.values(ResistanceType)
const statusTypes = Object.values(StatusType)

const entries = computed(() => playerStore.Compendium.entries || [])

// Watch for entries changes and clear selectedEntry if it's no longer in the list
// This handles character reset scenarios where compendium gets wiped
watch(entries, (newEntries) => {
  if (selectedEntry.value) {
    const stillExists = newEntries.some(e => e.id === selectedEntry.value.id)
    if (!stillExists) {
      selectedEntry.value = null
    }
  }
}, { deep: true })

const filteredEntries = computed(() => {
  let result = [...entries.value]

  // Apply type filter
  if (filterType.value !== 'all') {
    result = result.filter(e => e.type === filterType.value)
  }

  // Apply search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.name.toLowerCase().includes(query)
    )
  }

  return result
})

const groupedEntries = computed(() => {
  const groups = {
    lore: [] as any[],
    character: [] as any[],
    location: [] as any[],
    monster: [] as any[],
    other: [] as any[]
  }

  filteredEntries.value.forEach(entry => {
    if (entry.type in groups) {
      groups[entry.type].push(entry)
    }
  })

  return groups
})

// Computed property for available bloodlines based on selected lineage
const availableBloodlines = computed(() => {
  if (!form.value.lineage_id) return []
  return compendiumStore.getBloodlinesForLineage(form.value.lineage_id)
})

// Watch lineage changes to reset bloodline if it's not available
watch(() => form.value.lineage_id, () => {
  if (form.value.bloodline_id) {
    const isAvailable = availableBloodlines.value.some((b: any) => b.id === form.value.bloodline_id)
    if (!isAvailable) {
      form.value.bloodline_id = null
    }
  }
})

// Get available resistance types (prevent duplicates for same phase)
function getAvailableResistanceTypes(phase: number | undefined, currentIndex: number): ResistanceType[] {
  const usedTypes = form.value.resistances
    .filter((r: any, i: number) => i !== currentIndex && (form.value.is_boss ? r.phase === phase : true))
    .map((r: any) => r.resistance_type)

  return resistanceTypes.filter(type => !usedTypes.includes(type))
}

// Get available status types (prevent duplicates for same phase)
function getAvailableStatusTypes(phase: number | undefined, currentIndex: number): StatusType[] {
  const usedTypes = form.value.statuses
    .filter((s: any, i: number) => i !== currentIndex && (form.value.is_boss ? s.phase === phase : true))
    .map((s: any) => s.status_type)

  return statusTypes.filter(type => !usedTypes.includes(type))
}

// Check if can add resistance type
function canAddResistanceType(type: ResistanceType, phase: number | undefined, currentIndex: number): boolean {
  const availableTypes = getAvailableResistanceTypes(phase, currentIndex)
  return availableTypes.includes(type)
}

// Check if can add status type
function canAddStatusType(type: StatusType, phase: number | undefined, currentIndex: number): boolean {
  const availableTypes = getAvailableStatusTypes(phase, currentIndex)
  return availableTypes.includes(type)
}

// Get unique phases from resistances and statuses
function getPhases(entry: any): number[] {
  const phases = new Set<number>()

  if (entry.resistances) {
    entry.resistances.forEach((r: any) => {
      if (r.phase) phases.add(r.phase)
    })
  }

  if (entry.statuses) {
    entry.statuses.forEach((s: any) => {
      if (s.phase) phases.add(s.phase)
    })
  }

  return Array.from(phases).sort((a, b) => a - b)
}

function getResistancesForPhase(entry: any, phase: number) {
  return entry.resistances?.filter((r: any) => r.phase === phase) || []
}

function getStatusesForPhase(entry: any, phase: number) {
  return entry.statuses?.filter((s: any) => s.phase === phase) || []
}

function selectEntry(entry: any) {
  selectedEntry.value = entry
}

function selectType(type: string) {
  form.value.type = type
  createStep.value = 2
}

function onLineageChange() {
  form.value.bloodline_id = null
}

function addResistance() {
  const newResistance: any = {
    resistance_type: getAvailableResistanceTypes(form.value.is_boss ? 1 : undefined, -1)[0] || ResistanceType.PHYSICAL,
    modifier: 0
  }

  if (form.value.is_boss) {
    newResistance.phase = 1
  }

  form.value.resistances.push(newResistance)
}

function removeResistance(index: number) {
  form.value.resistances.splice(index, 1)
}

function addStatus() {
  const newStatus: any = {
    status_type: getAvailableStatusTypes(form.value.is_boss ? 1 : undefined, -1)[0] || StatusType.FROST,
    modifier: 0
  }

  if (form.value.is_boss) {
    newStatus.phase = 1
  }

  form.value.statuses.push(newStatus)
}

function removeStatus(index: number) {
  form.value.statuses.splice(index, 1)
}

// Watch is_boss to add/remove phase field
watch(() => form.value.is_boss, (isBoss) => {
  // Only process if resistances and statuses arrays exist
  if (form.value.resistances && Array.isArray(form.value.resistances)) {
    form.value.resistances.forEach((r: any) => {
      if (isBoss && !r.phase) {
        r.phase = 1
      } else if (!isBoss) {
        delete r.phase
      }
    })
  }

  if (form.value.statuses && Array.isArray(form.value.statuses)) {
    form.value.statuses.forEach((s: any) => {
      if (isBoss && !s.phase) {
        s.phase = 1
      } else if (!isBoss) {
        delete s.phase
      }
    })
  }
})

function saveEntry() {
  if (!form.value.name.trim()) {
    alert('Please enter a name for the entry')
    return
  }

  const entryData: any = {
    type: form.value.type,
    name: form.value.name
  }

  if (form.value.type === 'character') {
    entryData.content = form.value.content
    entryData.lineage_id = form.value.lineage_id
    entryData.bloodline_id = form.value.bloodline_id
    entryData.age = form.value.age
  } else if (form.value.type === 'monster') {
    entryData.is_boss = form.value.is_boss
    entryData.resistances = form.value.resistances
    entryData.statuses = form.value.statuses
    entryData.hp = form.value.hp
    entryData.fp = form.value.fp
    entryData.ap = form.value.ap
    entryData.behavior_notes = form.value.behavior_notes
    entryData.content = form.value.content
  } else {
    entryData.content = form.value.content
  }

  if (showEditModal.value && selectedEntry.value) {
    Object.assign(selectedEntry.value, entryData)
    selectedEntry.value.updated_at = new Date().toISOString()
    playerStore.save()
  } else {
    const newEntry = {
      ...entryData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (!playerStore.Compendium.entries) {
      playerStore.Compendium.entries = []
    }

    playerStore.Compendium.entries.push(newEntry)
    playerStore.save()
    selectedEntry.value = newEntry
  }

  closeModal()
}

function editEntry() {
  if (!selectedEntry.value) return

  // Deep clone the entry to avoid modifying the original
  form.value = JSON.parse(JSON.stringify(selectedEntry.value))

  if (form.value.type === 'monster') {
    if (!form.value.resistances) form.value.resistances = []
    if (!form.value.statuses) form.value.statuses = []
    if (form.value.is_boss === undefined) form.value.is_boss = false
  }

  showEditModal.value = true
}

function deleteEntry() {
  if (!selectedEntry.value) return

  const confirmDelete = confirm(`Are you sure you want to delete "${selectedEntry.value.name}"?`)
  if (!confirmDelete) return

  const index = playerStore.Compendium.entries.findIndex(e => e.id === selectedEntry.value.id)
  if (index !== -1) {
    playerStore.Compendium.entries.splice(index, 1)
    playerStore.save()
    selectedEntry.value = null
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  createStep.value = 1
  form.value = {
    type: '',
    name: '',
    content: '',
    lineage_id: null,
    bloodline_id: null,
    age: null,
    is_boss: false,
    resistances: [],
    statuses: [],
    hp: null,
    fp: null,
    ap: null,
    behavior_notes: ''
  }
}

// Export/Import handlers
function handleExportCompendium() {
  const jsonContent = exportCompendium()
  const timestamp = new Date().toISOString().split('T')[0]
  downloadAsFile(jsonContent, `compendium_${timestamp}.json`)
}

function handleImportCompendium() {
  fileInput.value?.click()
}

// Import modal state
const importPending = ref<string | null>(null)

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    importPending.value = e.target?.result as string
  }
  reader.readAsText(file)

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function executeCompendiumImport(mode: 'replace' | 'merge') {
  if (!importPending.value) return
  const success = importCompendium(importPending.value, mode)
  importPending.value = null
  alert(success ? 'Compendium imported successfully!' : 'Failed to import compendium')
}

function getTypeBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    lore: 'badge-lore',
    character: 'badge-character',
    location: 'badge-location',
    monster: 'badge-monster',
    other: 'badge-other'
  }
  return classes[type] || 'badge-other'
}

function getAutoTags(entry: any): string[] {
  const tags: string[] = []

  if (entry.type === 'character') {
    if (entry.lineage_id) {
      const lineage = compendiumStore.getLineageById(entry.lineage_id)
      if (lineage) tags.push(`Lineage: ${lineage.name}`)
    }
    if (entry.bloodline_id) {
      const bloodline = compendiumStore.getBloodlineById(entry.bloodline_id)
      if (bloodline) tags.push(`Bloodline: ${bloodline.name}`)
    }
    if (entry.age) tags.push(`Age: ${entry.age}`)
  } else if (entry.type === 'monster') {
    if (entry.resistances) {
      entry.resistances.forEach((res: any) => {
        if (res.modifier >= 25) {
          tags.push(`Resistant: ${res.resistance_type}`)
        } else if (res.modifier <= -25) {
          tags.push(`Weak: ${res.resistance_type}`)
        }
      })
    }
  }

  return tags
}

function getLineageName(id: number): string {
  const lineage = compendiumStore.getLineageById(id)
  return lineage?.name || 'Unknown'
}

function getBloodlineName(id: number): string {
  const bloodline = compendiumStore.getBloodlineById(id)
  return bloodline?.name || 'Unknown'
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
</script>

<style scoped>
/* Independent scroll for split layout - Task 4.2 */
.compendium-content-wrapper {
  height: calc(100vh - 190px); /* Same as CharacterTab */
  width: 100%;
}

.compendium-panel-left,
.compendium-panel-right {
  height: 100%; /* Fill wrapper height */
}

.main-tab {
  height: 100%;
  background: transparent !important;
}

.bg-dislight {
  background-color: #2d3748;
}

/* Action buttons */
.btn-export {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-export:hover {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.btn-import {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-import:hover {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.btn-add-entry {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-btn-primary-border);
  border: var(--border-width-thin) solid var(--color-accent-gold);
  color: #ffffff;
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-add-entry:hover {
  background: var(--color-btn-primary-border-hover);
  box-shadow: var(--shadow-gold-medium);
}

.btn-delete {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-delete:hover {
  background: var(--color-red-rgba-strong);
  box-shadow: 0 0 10px var(--color-red-rgba-strong);
}

.btn-save {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff; /* White text for readability on green background */
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-save:hover {
  background: var(--color-green-rgba-strong);
}

/* Entry type buttons in modal */
.type-btn-lore {
  width: 100%;
  padding: var(--spacing-lg);
  background: var(--color-btn-primary-bg-active);
  border: var(--border-width-thin) solid var(--color-accent-gold);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  text-align: left;
  cursor: pointer;
}

.type-btn-lore:hover {
  background: var(--color-btn-primary-border);
  box-shadow: var(--shadow-gold-soft);
}

.type-btn-character {
  width: 100%;
  padding: var(--spacing-lg);
  background: rgba(65, 105, 225, 0.3);
  border: var(--border-width-thin) solid var(--color-fp);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  text-align: left;
  cursor: pointer;
}

.type-btn-character:hover {
  background: rgba(65, 105, 225, 0.5);
}

.type-btn-location {
  width: 100%;
  padding: var(--spacing-lg);
  background: var(--color-green-rgba-light);
  border: var(--border-width-thin) solid var(--color-success);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  text-align: left;
  cursor: pointer;
}

.type-btn-location:hover {
  background: var(--color-green-rgba-medium);
}

.type-btn-monster {
  width: 100%;
  padding: var(--spacing-lg);
  background: var(--color-red-rgba-light);
  border: var(--border-width-thin) solid var(--color-danger);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  text-align: left;
  cursor: pointer;
}

.type-btn-monster:hover {
  background: var(--color-red-rgba-medium);
}

.type-btn-other {
  width: 100%;
  padding: var(--spacing-lg);
  background: rgba(147, 51, 234, 0.3);
  border: var(--border-width-thin) solid rgba(147, 51, 234, 0.8);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  text-align: left;
  cursor: pointer;
}

.type-btn-other:hover {
  background: rgba(147, 51, 234, 0.5);
}

/* Entry list items - type specific */
.entry-item-lore {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.entry-item-lore:hover {
  background: var(--color-bg-tertiary);
}

.entry-item-lore-selected {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-btn-primary-border);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-gold-soft);
}

.entry-item-character {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.entry-item-character:hover {
  background: var(--color-bg-tertiary);
}

.entry-item-character-selected {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: rgba(65, 105, 225, 0.5);
  color: var(--color-text-primary);
}

.entry-item-location {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.entry-item-location:hover {
  background: var(--color-bg-tertiary);
}

.entry-item-location-selected {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-green-rgba-medium);
  color: var(--color-text-primary);
}

.entry-item-monster {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.entry-item-monster:hover {
  background: var(--color-bg-tertiary);
}

.entry-item-monster-selected {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-red-rgba-medium);
  color: var(--color-text-primary);
}

.entry-item-other {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.entry-item-other:hover {
  background: var(--color-bg-tertiary);
}

.entry-item-other-selected {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-primary);
  cursor: pointer;
  transition: var(--transition-hover);
  background: rgba(147, 51, 234, 0.6);
  color: var(--color-text-primary);
}

/* Boss badge */
.boss-badge {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-gold-primary);
  color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-bold);
}

/* Type badges in detail view */
.badge-lore {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-btn-primary-border);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.badge-character {
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(65, 105, 225, 0.5);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.badge-location {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-green-rgba-medium);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.badge-monster {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-red-rgba-medium);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.badge-other {
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(147, 51, 234, 0.6);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

/* Small add buttons in form */
.btn-add-small {
  margin-left: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff; /* White text for readability on green background */
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-add-small:hover {
  background: var(--color-green-rgba-strong);
}

/* Remove buttons in form */
.btn-remove-small {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
  border-radius: var(--border-radius-md);
  transition: var(--transition-hover);
  cursor: pointer;
}

.btn-remove-small:hover {
  background: var(--color-red-rgba-strong);
}

/* Left Panel */
.left-panel {
  border-color: var(--color-border-primary);
  background: transparent !important;
}

/* Header */
.compendium-header {
  border-color: var(--color-border-primary);
  background: var(--color-bg-secondary);
}

.page-title {
  color: var(--color-accent-gold-bright);
}

/* Search and Filter Inputs */
.search-input,
.filter-select {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  transition: var(--transition-hover);
}

.search-input:focus,
.filter-select:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

/* Section Headers - Type Specific Colors */
.section-header-lore {
  color: var(--color-accent-gold-bright);
}

.section-header-character {
  color: var(--color-fp);
  filter: brightness(1.2);
}

.section-header-location {
  color: var(--color-success);
  filter: brightness(1.8);
}

.section-header-monster {
  color: var(--color-danger);
  filter: brightness(1.5);
}

.section-header-monster-compact {
  color: var(--color-red-bright);
}

.section-header-other {
  color: rgba(147, 51, 234, 1);
  filter: brightness(1.3);
}

/* Entries List Container */
.entries-list-container {
  --color-bg-primary: transparent !important;
  --color-bg-secondary: transparent !important;
  background: transparent !important;
}

/* Empty State */
.empty-state {
  color: var(--color-text-tertiary);
}

/* Right Panel */
.right-panel {
  --color-bg-primary: transparent !important;
  --color-bg-secondary: transparent !important;
  background: transparent !important;
}

/* Entry Title */
.entry-title {
  color: var(--color-text-primary);
}

/* Edit Button */
.btn-edit {
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff;
  transition: var(--transition-hover);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.btn-edit:hover {
  background: var(--color-green-rgba-strong);
}

/* Metadata Text */
.metadata-text {
  color: var(--color-text-tertiary);
}

/* Auto Tags */
.auto-tag {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

/* Field Labels and Values */
.field-label {
  color: var(--color-text-tertiary);
}

.field-value {
  color: var(--color-text-primary);
}

/* Phase Section */
.phase-section {
  background: var(--color-bg-tertiary);
}

/* Phase Section Headers */
.phase-header {
  color: var(--color-accent-gold-bright);
}

/* Compact Phase Section (Task #11) */
.phase-section-compact {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.phase-header-compact {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-lg);
}

.field-label-compact {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.field-value-compact {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.resistance-item-phase-compact,
.status-item-phase-compact {
  background: rgba(42, 42, 42, 0.5);
  border: var(--border-width-thin) solid rgba(255, 255, 255, 0.05);
  max-width: 70%;
}

.modifier-positive-compact {
  color: var(--color-green-dim);
  filter: brightness(1.5);
  font-size: var(--font-size-base);
}

.modifier-negative-compact {
  color: var(--color-red-bright);
  font-size: var(--font-size-base);
}

.status-modifier-compact {
  color: var(--color-fp);
  font-size: var(--font-size-base);
}

.status-modifier-negative-compact {
  color: var(--color-red-bright);
  font-size: var(--font-size-base);
}

/* HP/FP/AP label colors */
.field-label-hp {
  color: var(--color-red-bright);
}

.field-label-fp {
  color: var(--color-fp);
  filter: brightness(1.2);
}

.field-label-ap {
  color: var(--color-green-dim);
  filter: brightness(1.2);
}

/* Behavior Notes Section */
.behavior-notes-section {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.behavior-notes-label {
  color: var(--color-text-secondary);
}

/* Resistance/Status Items */
.resistance-item,
.status-item {
  background: var(--color-bg-tertiary);
}

.resistance-item-phase,
.status-item-phase {
  background: var(--color-bg-tertiary);
  max-width: 70%;
}

/* Positive/Negative Modifiers */
.modifier-positive {
  color: var(--color-success);
  filter: brightness(1.8);
}

.modifier-negative {
  color: var(--color-red-bright);
  filter: brightness(1.5);
}

/* Status Modifier */
.status-modifier {
  color: var(--color-fp);
}

/* Content Text */
.content-text {
  color: var(--color-text-primary);
}

/* Metadata Footer */
.metadata-footer {
  color: var(--color-text-tertiary);
  border-color: var(--color-border-primary);
}

/* No Selection State */
.no-selection {
  color: var(--color-text-tertiary);
}

/* Modal Overlay */
.modal-overlay {
  background: rgba(0, 0, 0, 0.85);
  z-index: 20000;
}

/* Modal Content */
.modal-content {
  background: var(--color-bg-secondary);
}

.modal-title {
  color: var(--color-text-primary);
}

/* Form Labels */
.form-label {
  color: var(--color-text-secondary);
}

/* Form Inputs (name, age, behavior_notes, content) */
.form-input,
.form-select,
.form-textarea {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  transition: var(--transition-hover);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--color-accent-gold-bright);
  outline: none;
}

.form-input:disabled,
.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Checkbox */
.form-checkbox {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
}

.form-checkbox:focus {
  border-color: var(--color-accent-gold-bright);
}

/* Cancel Button */
.btn-cancel {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  transition: var(--transition-hover);
}

.btn-cancel:hover {
  background: var(--color-bg-secondary);
}

/* Helper Text */
.helper-text {
  color: var(--color-text-tertiary);
}

/* Percent Symbol */
.percent-symbol {
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
  box-sizing: border-box;
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

.import-btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
