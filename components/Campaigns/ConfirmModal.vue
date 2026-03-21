<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-message">{{ message }}</p>

      <div class="modal-actions">
        <button @click="$emit('cancel')" class="btn-cancel">Cancel</button>
        <button @click="$emit('confirm')" class="btn-confirm" :class="{ danger: isDanger }">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmText?: string
  isDanger?: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
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
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  padding: clamp(1.5rem, 2.5vw, 1.875rem);
  max-width: clamp(22rem, 35vw, 28rem);
  width: 90%;
}

.modal-title {
  color: #fff;
  font-size: clamp(1.25rem, 1.6vw, 1.5rem);
  margin: 0 0 0.9375em 0;
}

.modal-message {
  color: #999;
  line-height: 1.5;
  font-size: clamp(0.9rem, 1vw, 1rem);
  margin: 0 0 1.5625em 0;
}

.modal-actions {
  display: flex;
  gap: clamp(0.75rem, 1.2vw, 0.9375rem);
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 0.75em 1.5em;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: clamp(0.85rem, 1vw, 1rem);
  cursor: pointer;
  transition: all 0.2s;
  border: 0.125rem solid;
}

.btn-cancel {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: #ccc;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-confirm {
  background: var(--color-btn-primary-border);
  border-color: var(--color-gold-dim);
  color: #fff;
}

.btn-confirm:hover {
  border-color: var(--color-gold-primary);
}

.btn-confirm.danger {
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.btn-confirm.danger:hover {
  background: rgba(255, 107, 107, 0.3);
}
</style>
