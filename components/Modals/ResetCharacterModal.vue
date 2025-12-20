<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <h2 class="modal-title">Reset Character</h2>

          <p class="warning-text">
            This will completely reset <strong>{{ characterName }}</strong> to creation defaults.
            All stats, equipment, and progression will be lost.
          </p>

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
            >
              Reset Character
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  characterName: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const confirmName = ref('')

const canConfirm = computed(() => {
  return confirmName.value.trim() === props.characterName
})

function close() {
  confirmName.value = ''
  emit('close')
}

function confirmReset() {
  if (canConfirm.value) {
    emit('confirm')
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
  border: 2px solid #ff4444;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
}

.modal-title {
  color: #ff4444;
  margin-bottom: 20px;
  text-align: center;
}

.warning-text {
  color: #ccc;
  margin-bottom: 15px;
  line-height: 1.6;
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
  background: rgba(150, 0, 0, 0.5);
  border: 1px solid #ff4444;
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: rgba(200, 0, 0, 0.7);
}

.reset-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
