<template>
  <div class="callback-screen">
    <div class="callback-content">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <h2>Authenticating with Patreon...</h2>
        <p>Please wait while we verify your account.</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">!</div>
        <h2>Authentication Failed</h2>
        <p class="error-message">{{ error }}</p>
        <button @click="goToLogin" class="retry-btn">
          Back to Login
        </button>
      </div>

      <div v-else class="success-state">
        <div class="success-icon">✓</div>
        <h2>Authentication Successful</h2>
        <p>Redirecting you to the app...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const isLoading = ref(true)
const error = ref<string | null>(null)

function goToLogin() {
  router.push('/login')
}

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const errorParam = route.query.error as string
  const errorDescription = route.query.error_description as string

  // Check for OAuth errors from Patreon
  if (errorParam) {
    isLoading.value = false
    error.value = errorDescription || 'Patreon authorization was denied or failed.'
    return
  }

  // Verify authorization code is present
  if (!code) {
    isLoading.value = false
    error.value = 'No authorization code received from Patreon.'
    return
  }

  // Exchange the code for a token
  try {
    const success = await auth.handlePatreonCallback(code, state)

    if (success) {
      // Redirect to dashboard after brief success message
      setTimeout(() => {
        router.push('/campaigns')
      }, 1000)
    } else {
      error.value = auth.error.value || 'Failed to complete Patreon authentication.'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.callback-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: clamp(1rem, 2vw, 1.5rem);
  background: linear-gradient(to bottom, rgba(10, 10, 10, 0.95), rgba(20, 20, 30, 0.95));
}

.callback-content {
  text-align: center;
  max-width: clamp(22rem, 32vw, 28rem);
  width: 100%;
  padding: clamp(2rem, 4vw, 3.125rem) clamp(1.5rem, 3vw, 2.5rem);
  background: rgba(20, 20, 25, 0.9);
  border: 0.125rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  box-shadow: 0 0.25rem 1.875rem rgba(0, 0, 0, 0.5);
}

.loading-state h2,
.error-state h2,
.success-state h2 {
  color: #fff;
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
  margin-bottom: 0.9375em;
}

.loading-state p,
.success-state p {
  color: #999;
  font-size: clamp(0.9rem, 1vw, 1rem);
}

/* Spinner */
.spinner {
  width: clamp(2.5rem, 4vw, 3.125rem);
  height: clamp(2.5rem, 4vw, 3.125rem);
  border: 0.25rem solid rgba(255, 215, 0, 0.2);
  border-top-color: var(--color-gold-primary);
  border-radius: 50%;
  margin: 0 auto 1.5625em;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  color: #fff;
}

.error-icon {
  width: clamp(3rem, 5vw, 3.75rem);
  height: clamp(3rem, 5vw, 3.75rem);
  border-radius: 50%;
  background: rgba(200, 0, 0, 0.2);
  border: 0.125rem solid rgba(255, 0, 0, 0.5);
  color: #ff6b6b;
  font-size: clamp(1.5rem, 2vw, 2rem);
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25em;
}

.error-message {
  color: #ffcccc;
  background: rgba(200, 0, 0, 0.15);
  border: 0.0625rem solid rgba(255, 0, 0, 0.3);
  border-radius: 0.375rem;
  padding: 0.9375em;
  margin-bottom: 1.5625em;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
}

.retry-btn {
  padding: 0.875em 1.875em;
  background: transparent;
  border: 0.125rem solid var(--color-gold-dim);
  border-radius: 0.375rem;
  color: var(--color-gold-primary);
  font-size: clamp(0.9rem, 1vw, 1rem);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: var(--color-gold-primary);
}

/* Success State */
.success-icon {
  width: clamp(3rem, 5vw, 3.75rem);
  height: clamp(3rem, 5vw, 3.75rem);
  border-radius: 50%;
  background: rgba(42, 108, 36, 0.3);
  border: 0.125rem solid rgba(42, 108, 36, 0.6);
  color: #4caf50;
  font-size: clamp(1.5rem, 2vw, 2rem);
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25em;
}
</style>
