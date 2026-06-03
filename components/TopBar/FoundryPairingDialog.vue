<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="isOpen" class="pairing-overlay" @click.self="close">
        <div class="pairing-dialog" role="dialog" aria-labelledby="pairing-title">
          <header class="pairing-header">
            <h2 id="pairing-title">Pair with Foundry</h2>
            <button class="pairing-close" @click="close" aria-label="Close">x</button>
          </header>

          <div class="pairing-body">
            <p class="pairing-hint">
              Open the Souls D20 system in Foundry, click the
              <strong>SD20 Account</strong> button in the sidebar (user icon),
              and enter this code.
            </p>

            <div v-if="isLoading" class="pairing-status">Generating code...</div>

            <div v-else-if="errorMessage" class="pairing-error">
              {{ errorMessage }}
              <button class="pairing-retry" @click="fetchCode">Try again</button>
            </div>

            <div v-else-if="formattedCode" class="pairing-code-block">
              <div class="pairing-code" :title="code">{{ formattedCode }}</div>
              <div class="pairing-actions">
                <button class="pairing-copy" @click="copyCode">
                  {{ copyLabel }}
                </button>
                <button class="pairing-refresh" @click="fetchCode" :disabled="isLoading">
                  Get new code
                </button>
              </div>
              <div class="pairing-ttl">
                <template v-if="secondsRemaining > 0">
                  Valid for {{ formattedTtl }}. The code works once and stops working after it is used.
                </template>
                <template v-else>
                  This code has expired. Generate a new one.
                </template>
              </div>
            </div>
          </div>

          <footer class="pairing-footer">
            <button class="pairing-done" @click="close">Done</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useApi } from '~/composables/useApi'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const api = useApi()

const code = ref<string>('')
const ttlSeconds = ref<number>(0)
const secondsRemaining = ref<number>(0)
const isLoading = ref<boolean>(false)
const errorMessage = ref<string | null>(null)
const copyLabel = ref<string>('Copy')

let countdownTimer: ReturnType<typeof setInterval> | null = null

const formattedCode = computed(() => {
  if (!code.value) return ''
  const c = code.value
  if (c.length === 8) return `${c.slice(0, 4)}-${c.slice(4)}`
  return c
})

const formattedTtl = computed(() => {
  const secs = Math.max(0, secondsRemaining.value)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
})

function stopCountdown() {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function startCountdown() {
  stopCountdown()
  countdownTimer = setInterval(() => {
    if (secondsRemaining.value > 0) {
      secondsRemaining.value -= 1
    } else {
      stopCountdown()
    }
  }, 1000)
}

async function fetchCode() {
  isLoading.value = true
  errorMessage.value = null
  copyLabel.value = 'Copy'

  const response = await api.post<{
    code: string
    expires_at: string
    ttl_seconds: number
  }>('/api/auth/foundry-pair-code/')

  isLoading.value = false

  if (!response.ok || !response.data) {
    errorMessage.value = response.error?.message || 'Could not generate a pairing code.'
    code.value = ''
    secondsRemaining.value = 0
    stopCountdown()
    return
  }

  code.value = response.data.code
  ttlSeconds.value = response.data.ttl_seconds
  secondsRemaining.value = response.data.ttl_seconds
  startCountdown()
}

async function copyCode() {
  if (!code.value) return
  try {
    await navigator.clipboard.writeText(formattedCode.value)
    copyLabel.value = 'Copied'
    setTimeout(() => {
      copyLabel.value = 'Copy'
    }, 1500)
  } catch {
    copyLabel.value = 'Copy failed'
  }
}

function close() {
  emit('close')
}

watch(() => props.isOpen, (open) => {
  if (open) {
    code.value = ''
    errorMessage.value = null
    copyLabel.value = 'Copy'
    fetchCode()
  } else {
    stopCountdown()
  }
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.pairing-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.pairing-dialog {
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.25);
  border-radius: 0.5rem;
  width: min(28rem, 100%);
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
}

.pairing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 0.0625rem solid rgba(255, 255, 255, 0.08);
}

.pairing-header h2 {
  margin: 0;
  font-size: 1rem;
  color: #fff;
}

.pairing-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
}

.pairing-close:hover {
  color: #fff;
}

.pairing-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.pairing-hint {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.45;
}

.pairing-hint strong {
  color: #fff;
}

.pairing-status,
.pairing-ttl {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.pairing-error {
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  background: rgba(220, 53, 69, 0.18);
  border: 0.0625rem solid rgba(220, 53, 69, 0.6);
  color: #f5b5bb;
  font-size: 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.pairing-retry {
  background: transparent;
  border: 0.0625rem solid rgba(245, 181, 187, 0.6);
  border-radius: 0.25rem;
  color: #f5b5bb;
  padding: 0.25rem 0.625rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.pairing-code-block {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.pairing-code {
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.85rem;
  letter-spacing: 0.18em;
  padding: 0.75rem;
  border-radius: 0.375rem;
  background: rgba(0, 0, 0, 0.4);
  border: 0.0625rem solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  user-select: all;
}

.pairing-actions {
  display: flex;
  gap: 0.5rem;
}

.pairing-copy,
.pairing-refresh {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  background: rgba(255, 215, 0, 0.12);
  border: 0.0625rem solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pairing-copy:hover:not(:disabled),
.pairing-refresh:hover:not(:disabled) {
  background: rgba(255, 215, 0, 0.2);
}

.pairing-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pairing-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.08);
}

.pairing-done {
  padding: 0.4rem 1rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}

.pairing-done:hover {
  background: rgba(255, 255, 255, 0.14);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.15s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
