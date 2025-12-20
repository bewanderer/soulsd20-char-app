<template>
  <div class="panel-border companion-panel">
    <!-- Header -->
    <div class="companion-header">
      <div class="flex items-center gap-3">
        <h3 class="text-xl font-bold">Companion</h3>

        <!-- Companion Selector Tags -->
        <div v-if="playerStore.Companions.length > 0" class="flex gap-2">
          <button
            v-for="companion in playerStore.Companions"
            :key="companion.id"
            @click="playerStore.setActiveCompanion(companion.id)"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors companion-tag',
              playerStore.CombatSettings.activeCompanionId === companion.id
                ? 'companion-tag-active'
                : 'companion-tag-inactive'
            ]"
          >
            {{ companion.name || 'Unnamed' }} - {{ companion.type || 'Unknown' }}
          </button>
        </div>

        <!-- Add Companion Button -->
        <button
          v-if="playerStore.Companions.length < 4"
          @click="playerStore.addCompanion()"
          class="px-3 py-1 rounded text-sm transition-colors btn-add-companion"
        >
          + Add
        </button>
      </div>

      <label class="flex items-center gap-2 cursor-pointer checkbox-label">
        <input
          v-model="companionActive"
          type="checkbox"
          class="w-5 h-5 rounded cursor-pointer companion-checkbox"
        />
        Active
      </label>
    </div>

    <!-- No Companions Message -->
    <div v-if="playerStore.Companions.length === 0" class="text-center py-8">
      <p class="italic mb-4 no-companions-text">No companions yet.</p>
      <button
        @click="playerStore.addCompanion()"
        class="px-4 py-2 rounded transition-colors btn-add-companion-large"
      >
        Add Companion
      </button>
    </div>

    <!-- Companion Content (only if active and companion selected) -->
    <div v-else-if="companionActive && activeCompanion" class="space-y-4">
      <!-- Delete Companion Button -->
      <div class="flex justify-end">
        <button
          @click="playerStore.deleteCompanion(activeCompanion.id)"
          class="px-3 py-1 rounded text-sm transition-colors btn-delete-companion"
        >
          Delete Companion
        </button>
      </div>

      <!-- Name & Type -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm field-label">Name</label>
          <input
            v-model="activeCompanion.name"
            type="text"
            placeholder="Companion Name"
            class="w-full px-3 py-2 rounded companion-input"
          />
        </div>
        <div>
          <label class="text-sm field-label">Type</label>
          <input
            v-model="activeCompanion.type"
            type="text"
            placeholder="Companion Type"
            class="w-full px-3 py-2 rounded companion-input"
          />
        </div>
      </div>

      <!-- Stats Card -->
      <div class="rounded p-4 companion-card">
        <h4 class="font-semibold mb-3 card-title">Stats</h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="text-sm field-label">HP</label>
            <input
              v-model.number="activeCompanion.hp"
              type="number"
              class="w-full px-3 py-2 rounded companion-stat-input"
            />
          </div>
          <div>
            <label class="text-sm field-label">FP</label>
            <input
              v-model.number="activeCompanion.fp"
              type="number"
              class="w-full px-3 py-2 rounded companion-stat-input"
            />
          </div>
          <div>
            <label class="text-sm field-label">AP</label>
            <input
              v-model.number="activeCompanion.ap"
              type="number"
              class="w-full px-3 py-2 rounded companion-stat-input"
            />
          </div>
        </div>
      </div>

      <!-- Skills Card -->
      <div class="rounded p-4 companion-card">
        <h4 class="font-semibold mb-3 card-title">Skills</h4>
        <div class="grid grid-cols-2 gap-4">
          <div v-for="(value, skill) in activeCompanion.skills" :key="skill">
            <label class="text-sm field-label">{{ skill }}</label>
            <input
              v-model.number="activeCompanion.skills[skill]"
              type="number"
              class="w-full px-3 py-2 rounded companion-stat-input"
            />
          </div>
        </div>
      </div>

      <!-- Resistances Card -->
      <div class="rounded p-4 companion-card">
        <h4 class="font-semibold mb-3 card-title">Resistances (%)</h4>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="(value, resistance) in activeCompanion.resistances" :key="resistance">
            <label class="text-sm field-label">{{ resistance }}</label>
            <div class="relative">
              <input
                v-model.number="activeCompanion.resistances[resistance]"
                type="number"
                class="w-full px-3 py-2 rounded pr-8 companion-stat-input"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 percent-symbol">%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statuses Card -->
      <div class="rounded p-4 companion-card">
        <h4 class="font-semibold mb-3 card-title">Statuses (Flat)</h4>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="(value, status) in activeCompanion.statuses" :key="status">
            <label class="text-sm field-label">{{ status }}</label>
            <input
              v-model.number="activeCompanion.statuses[status]"
              type="number"
              class="w-full px-3 py-2 rounded companion-stat-input"
            />
          </div>
        </div>
      </div>

      <!-- Notes Card -->
      <div class="rounded p-4 companion-card">
        <h4 class="font-semibold mb-3 card-title">Notes</h4>
        <textarea
          v-model="activeCompanion.notes"
          rows="6"
          placeholder="Companion abilities and notes..."
          class="w-full px-3 py-2 rounded resize-y companion-textarea"
        ></textarea>
      </div>
    </div>

    <!-- Inactive Message -->
    <div v-else-if="!companionActive && playerStore.Companions.length > 0" class="italic text-center py-8 inactive-message">
      Companion inactive. Check "Active" to manage companion.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()

const companionActive = computed({
  get: () => playerStore.CombatSettings.companionActive,
  set: (value: boolean) => {
    playerStore.CombatSettings.companionActive = value
  }
})

const activeCompanion = computed(() => {
  if (!playerStore.CombatSettings.activeCompanionId) return null
  return playerStore.Companions.find(c => c.id === playerStore.CombatSettings.activeCompanionId)
})
</script>

<style scoped>
.companion-panel {
  height: 100%;
}

.companion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.companion-header h3 {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.companion-header label {
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.companion-header input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-sm);
}

.text-center {
  text-align: center;
}

.py-8 {
  padding-top: var(--spacing-2xl);
  padding-bottom: var(--spacing-2xl);
}

.space-y-4 > * + * {
  margin-top: var(--spacing-lg);
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: var(--spacing-sm);
}

.gap-3 {
  gap: var(--spacing-md);
}

.gap-4 {
  gap: var(--spacing-lg);
}

.mb-3 {
  margin-bottom: var(--spacing-md);
}

.mb-4 {
  margin-bottom: var(--spacing-lg);
}

.px-3 {
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

.px-4 {
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

.py-1 {
  padding-top: var(--spacing-xs);
  padding-bottom: var(--spacing-xs);
}

.py-2 {
  padding-top: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
}

.p-4 {
  padding: var(--spacing-lg);
}

.rounded {
  border-radius: var(--border-radius-md);
}

.text-sm {
  font-size: var(--font-size-sm);
}

.text-white {
  color: var(--color-text-primary);
}

.text-gray-300 {
  color: var(--color-text-primary);
}

.text-gray-400 {
  color: var(--color-text-secondary);
}

.font-semibold {
  font-weight: var(--font-weight-semibold);
}

.italic {
  font-style: italic;
}

.transition-colors {
  transition: var(--transition-hover);
}

.bg-yellow-600 {
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  color: #ffffff;
  transition: var(--transition-hover);
}

.bg-yellow-600:hover {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-primary);
  color: #ffffff;
  box-shadow: var(--shadow-gold-medium);
}

.bg-gray-700 {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  color: var(--color-text-primary);
}

.bg-gray-700:hover {
  background: rgba(42, 42, 42, 0.8);
  border-color: var(--color-border-primary);
}

.bg-green-600 {
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff; /* White text for readability on green background */
}

.bg-green-600:hover,
.bg-green-500:hover {
  background: var(--color-green-rgba-strong);
}

.bg-red-600 {
  background: var(--color-red-rgba-light);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
}

.bg-red-600:hover,
.bg-red-500:hover {
  background: var(--color-red-rgba-medium);
}

.text-black {
  color: var(--color-text-primary);
}

button {
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-hover);
  border: none;
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

label {
  display: block;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

input[type="text"],
input[type="number"] {
  width: 100%;
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

input[type="text"]:focus,
input[type="number"]:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.bg-gray-600 {
  background: var(--color-bg-secondary);
}

.border-gray-500 {
  border-color: var(--color-border-primary);
}

.border-gray-600 {
  border-color: var(--color-border-primary);
}

textarea {
  width: 100%;
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: 'EB Garamond', serif;
  resize: vertical;
}

textarea:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.right-3 {
  right: var(--spacing-md);
}

.top-1\/2 {
  top: 50%;
}

.-translate-y-1\/2 {
  transform: translateY(-50%);
}

.pr-8 {
  padding-right: var(--spacing-2xl);
}

.w-full {
  width: 100%;
}

.w-5 {
  width: 20px;
}

.h-5 {
  height: 20px;
}

.justify-end {
  justify-content: flex-end;
}

.resize-y {
  resize: vertical;
}

/* New semantic CSS classes */
.companion-tag {
  cursor: pointer;
  font-weight: var(--font-weight-normal);
}

.companion-tag-active {
  background: var(--color-btn-primary-border);
  border: var(--border-width-thin) solid var(--color-accent-gold);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-gold-soft);
}

.companion-tag-inactive {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  color: var(--color-text-secondary);
}

.companion-tag-inactive:hover {
  background: rgba(42, 42, 42, 0.8);
  border-color: var(--color-border-primary);
}

.btn-add-companion {
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff; /* White text for readability on green background */
}

.btn-add-companion:hover {
  background: var(--color-green-rgba-strong);
}

.checkbox-label {
  color: var(--color-text-primary);
}

.companion-checkbox {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
}

.no-companions-text {
  color: var(--color-text-tertiary);
}

.btn-add-companion-large {
  background: var(--color-green-rgba-medium);
  border: var(--border-width-thin) solid var(--color-success);
  color: #ffffff; /* White text for readability on green background */
}

.btn-add-companion-large:hover {
  background: var(--color-green-rgba-strong);
}

.btn-delete-companion {
  background: var(--color-red-rgba-light);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff; /* White text for readability on red background */
}

.btn-delete-companion:hover {
  background: var(--color-red-rgba-medium);
}

.field-label {
  color: var(--color-text-secondary);
}

.companion-input {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
}

.companion-input:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.companion-card {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
}

.card-title {
  color: var(--color-text-primary);
}

.companion-stat-input {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
}

.companion-stat-input:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.percent-symbol {
  color: var(--color-text-tertiary);
}

.companion-textarea {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  color: var(--color-text-primary);
}

.companion-textarea:focus {
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
  outline: none;
}

.inactive-message {
  color: var(--color-text-tertiary);
}
</style>
