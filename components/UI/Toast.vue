<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', `toast-${type}`]">
      <div class="toast-icon">
        <span v-if="type === 'success'">✓</span>
        <span v-else-if="type === 'error'">✕</span>
        <span v-else-if="type === 'warning'">⚠</span>
        <span v-else>ℹ</span>
      </div>
      <div class="toast-content">
        <div class="toast-title">{{ title }}</div>
        <div v-if="message" class="toast-message">{{ message }}</div>
      </div>
      <button class="toast-close" @click="close">×</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 3000
})

const emit = defineEmits(['close'])

const visible = ref(true)
let timeout: NodeJS.Timeout | null = null

onMounted(() => {
  if (props.duration > 0) {
    timeout = setTimeout(() => {
      close()
    }, props.duration)
  }
})

onUnmounted(() => {
  if (timeout) {
    clearTimeout(timeout)
  }
})

function close() {
  visible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-width: 300px;
  max-width: 500px;
  background: #2a2d35;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 14px;
  border-left: 4px solid;
  pointer-events: auto;
}

.toast-success {
  border-left-color: #22c55e;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  font-size: 16px;
}

.toast-success .toast-icon {
  background: #22c55e;
  color: white;
}

.toast-error .toast-icon {
  background: #ef4444;
  color: white;
}

.toast-warning .toast-icon {
  background: #f59e0b;
  color: white;
}

.toast-info .toast-icon {
  background: #3b82f6;
  color: white;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.toast-message {
  font-size: 13px;
  opacity: 0.9;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
