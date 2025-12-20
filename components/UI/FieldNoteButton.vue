<template>
  <div class="field-note-wrapper">
    <button
      @click="showNotePopup = true"
      class="note-btn"
      :class="{ 'has-note': hasNote }"
      type="button"
      title="Add/Edit Note"
    >
      <UIcon name="i-heroicons-pencil-square" />
    </button>

    <div v-if="showNotePopup" class="note-popup-overlay" @click="showNotePopup = false">
      <div class="note-popup" @click.stop>
        <div class="note-header">
          <h4>Note for: {{ fieldLabel }}</h4>
          <button @click="showNotePopup = false" class="close-btn" type="button">×</button>
        </div>

        <textarea
          v-model="noteText"
          class="note-textarea"
          :placeholder="`Add notes for ${fieldLabel}...`"
          rows="6"
        />

        <div class="note-footer">
          <button @click="saveNote" class="save-btn" type="button">Save</button>
          <button @click="clearNote" class="clear-btn" type="button">Clear</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlayerStore } from '~/store/player'

const props = defineProps<{
  fieldKey: string
  fieldLabel: string
}>()

const playerStore = usePlayerStore()
const showNotePopup = ref(false)
const noteText = ref('')

const hasNote = computed(() => {
  return !!(playerStore.FieldNotes && playerStore.FieldNotes[props.fieldKey])
})

watch(() => playerStore.FieldNotes[props.fieldKey], (newValue) => {
  noteText.value = newValue || ''
}, { immediate: true })

function saveNote() {
  playerStore.updateFieldNote(props.fieldKey, noteText.value)
  showNotePopup.value = false
}

function clearNote() {
  noteText.value = ''
  playerStore.updateFieldNote(props.fieldKey, '')
  showNotePopup.value = false
}
</script>

<style scoped>
.field-note-wrapper {
  position: relative;
}

.note-btn {
  width: 20px;
  height: 20px;
  border-radius: var(--border-radius-sm);
  background: rgba(255, 255, 255, 0.1);
  border: var(--border-width-thin) solid rgba(255, 255, 255, 0.3);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.note-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.note-btn.has-note {
  background: var(--color-btn-primary-bg-hover);
  border-color: var(--color-accent-gold-bright);
  color: var(--color-accent-gold-bright);
  box-shadow: inset 0 0 8px var(--color-gold-rgba-medium);
}

.note-btn.has-note:hover {
  background: var(--color-btn-primary-bg-active);
  box-shadow: inset 0 0 12px var(--color-gold-rgba-medium);
}

.note-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15000; /* Above navigation and modals */
}

.note-popup {
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-accent-gold-bright);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-gold-strong);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.note-header h4 {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-xl);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 2em;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-hover);
}

.close-btn:hover {
  color: var(--color-accent-gold-bright);
  transform: scale(1.1);
}

.note-textarea {
  width: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  font-size: var(--font-size-sm);
  resize: vertical;
  font-family: inherit;
  margin-bottom: var(--spacing-lg);
  transition: var(--transition-hover);
}

.note-textarea:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.note-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.save-btn,
.clear-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-sm);
  border: var(--border-width-medium) solid;
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  transition: var(--transition-hover);
}

.save-btn {
  background: var(--color-btn-success-bg);
  border-color: var(--color-btn-success-border);
  color: var(--color-btn-success-text);
}

.save-btn:hover {
  background: var(--color-btn-success-bg-hover);
  box-shadow: 0 0 10px rgba(32, 103, 34, 0.5);
}

.clear-btn {
  background: var(--color-btn-danger-bg);
  border-color: var(--color-btn-danger-border);
  color: var(--color-btn-danger-text);
}

.clear-btn:hover {
  background: var(--color-btn-danger-bg-hover);
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.6);
}
</style>
