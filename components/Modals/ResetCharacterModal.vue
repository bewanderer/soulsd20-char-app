<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <h2 class="modal-title">Reset Character</h2>

          <!-- Reset Mode Toggle -->
          <div class="reset-mode-toggle">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="fullReset"
              />
              <span class="toggle-text">Full Reset</span>
            </label>
            <span class="mode-indicator" :class="{ full: fullReset }">
              {{ fullReset ? 'Full Reset' : 'Respec' }}
            </span>
          </div>

          <!-- Dynamic Description -->
          <div class="reset-description">
            <template v-if="!fullReset">
              <p class="description-header">Respec Reset for <strong>{{ characterName }}</strong></p>
              <p class="description-text">
                This will reset your character's progression while keeping roleplay-acquired items and knowledge.
              </p>
              <div class="reset-details">
                <div class="detail-section">
                  <span class="section-title">Will be reset:</span>
                  <ul>
                    <li>Level → 0 (triggers level-up modal)</li>
                    <li>Stats → Creation values</li>
                    <li>Skills & Knowledge → 0</li>
                    <li>Weapon Proficiencies → 0</li>
                    <li>Feat flags & Destiny/Fate points</li>
                    <li>HP, FP, AP, Dodges, Statuses</li>
                    <li>Attuned spells/spirits/skills → Unattune all</li>
                    <li>All modifications → Cleared</li>
                  </ul>
                </div>
                <div class="detail-section kept">
                  <span class="section-title">Will be kept:</span>
                  <ul>
                    <li>Equipment (all slots)</li>
                    <li>Inventory</li>
                    <li>Flasks (HP/FP/Level)</li>
                    <li>Learned spells, spirits, weapon skills</li>
                    <li>Companions</li>
                    <li>Notes, Compendium, Field Notes</li>
                  </ul>
                </div>
              </div>
            </template>
            <template v-else>
              <p class="description-header full-reset">Full Reset for <strong>{{ characterName }}</strong></p>
              <p class="description-text danger">
                This will completely wipe your character back to creation defaults. Everything will be lost.
              </p>
              <div class="reset-details">
                <div class="detail-section danger">
                  <span class="section-title">Will be cleared:</span>
                  <ul>
                    <li>All progression (level, stats, skills, etc.)</li>
                    <li>All equipment and inventory</li>
                    <li>All spells, spirits, and weapon skills</li>
                    <li>All companions</li>
                    <li>All notes, compendium, and field notes</li>
                    <li>Flasks reset to defaults</li>
                    <li>Everything else</li>
                  </ul>
                </div>
              </div>
            </template>
          </div>

          <p class="warning-text danger">
            <strong>This cannot be undone.</strong>
          </p>

          <div class="confirmation-input">
            <label>Type the character name to confirm:</label>
            <input
              v-model="confirmName"
              type="text"
              :placeholder="characterName"
              @keyup.enter="confirmReset"
            />
          </div>

          <div class="modal-actions">
            <button @click="close" class="cancel-btn">Cancel</button>
            <button
              @click="confirmReset"
              :disabled="!canConfirm"
              class="reset-btn"
              :class="{ 'full-reset': fullReset }"
            >
              {{ fullReset ? 'Full Reset' : 'Respec Character' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  characterName: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [fullReset: boolean]
}>()

const confirmName = ref('')
const fullReset = ref(false)

// Reset state when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    confirmName.value = ''
    fullReset.value = false
  }
})

const canConfirm = computed(() => {
  return confirmName.value.trim() === props.characterName
})

function close() {
  confirmName.value = ''
  fullReset.value = false
  emit('close')
}

function confirmReset() {
  if (canConfirm.value) {
    emit('confirm', fullReset.value)
    close()
  }
}
</script>

<style scoped>
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
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  padding: 30px;
  max-width: 550px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-title {
  color: var(--color-accent-gold-bright);
  margin-bottom: 20px;
  text-align: center;
}

/* Reset Mode Toggle */
.reset-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  margin-bottom: 20px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #ff4444;
}

.toggle-text {
  color: #ccc;
  font-size: 0.95em;
}

.mode-indicator {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: bold;
  background: rgba(100, 180, 100, 0.3);
  color: #8f8;
  border: 1px solid rgba(100, 180, 100, 0.5);
}

.mode-indicator.full {
  background: rgba(200, 50, 50, 0.3);
  color: #ff6666;
  border: 1px solid rgba(200, 50, 50, 0.5);
}

/* Reset Description */
.reset-description {
  margin-bottom: 20px;
}

.description-header {
  color: var(--color-accent-gold-bright);
  font-size: 1.1em;
  margin-bottom: 8px;
}

.description-header.full-reset {
  color: #ff6666;
}

.description-text {
  color: #aaa;
  margin-bottom: 15px;
  line-height: 1.5;
}

.description-text.danger {
  color: #ff8888;
}

.reset-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-section {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border-left: 3px solid rgba(255, 100, 100, 0.6);
}

.detail-section.kept {
  border-left-color: rgba(100, 200, 100, 0.6);
}

.detail-section.danger {
  border-left-color: #ff4444;
  background: rgba(100, 0, 0, 0.2);
}

.section-title {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #ddd;
  font-size: 0.9em;
}

.detail-section.kept .section-title {
  color: #8f8;
}

.detail-section.danger .section-title {
  color: #ff6666;
}

.detail-section ul {
  margin: 0;
  padding-left: 20px;
  color: #999;
  font-size: 0.85em;
  line-height: 1.6;
}

.detail-section.kept ul {
  color: #9d9;
}

.detail-section.danger ul {
  color: #faa;
}

.warning-text {
  color: #ccc;
  margin-bottom: 15px;
  line-height: 1.6;
  text-align: center;
}

.warning-text.danger {
  color: #ff6666;
  font-weight: bold;
}

.confirmation-input {
  margin: 20px 0;
}

.confirmation-input label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
}

.confirmation-input input {
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-size: 1em;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.reset-btn {
  flex: 1;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s;
}

.cancel-btn {
  background: rgba(100, 100, 100, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.cancel-btn:hover {
  background: rgba(100, 100, 100, 0.7);
}

.reset-btn {
  background: rgba(80, 120, 80, 0.5);
  border: 1px solid #6a6;
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: rgba(80, 150, 80, 0.7);
}

.reset-btn.full-reset {
  background: rgba(150, 0, 0, 0.5);
  border: 1px solid #ff4444;
}

.reset-btn.full-reset:hover:not(:disabled) {
  background: rgba(200, 0, 0, 0.7);
}

.reset-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
