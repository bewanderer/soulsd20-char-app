<template>
  <div class="login-screen">
    <div class="login-content">
      <h1 class="title">Souls D20</h1>
      <p class="subtitle">Sign in to your account</p>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter your username"
            :disabled="isLoading"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            :disabled="isLoading"
            required
          />
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="divider">
        <span>or continue with</span>
      </div>

      <!-- Patreon OAuth -->
      <button @click="handlePatreonLogin" class="patreon-btn" :disabled="isLoading">
        <svg class="patreon-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003"/>
        </svg>
        <span>Patreon</span>
      </button>

      <p class="register-hint">
        Don't have an account? Sign up through Patreon to get started.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password'
    return
  }

  isLoading.value = true
  error.value = null

  const success = await auth.login(username.value, password.value)

  isLoading.value = false

  if (success) {
    // Redirect to dashboard (campaigns page)
    const redirect = route.query.redirect as string || '/campaigns'
    router.push(redirect)
  } else {
    error.value = auth.error.value || 'Invalid username or password'
  }
}

async function handlePatreonLogin() {
  isLoading.value = true
  error.value = null

  try {
    await auth.loginWithPatreon()
    // Redirects to Patreon, no success handling needed here
  } catch (err) {
    error.value = 'Failed to connect to Patreon. Please try again.'
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: clamp(1rem, 2vw, 1.5rem);
  background: linear-gradient(to bottom, rgba(10, 10, 10, 0.95), rgba(20, 20, 30, 0.95));
}

.login-content {
  text-align: center;
  max-width: clamp(20rem, 30vw, 28rem);
  width: 100%;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  background: rgba(20, 20, 25, 0.9);
  border: 0.125rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  box-shadow: 0 0.25rem 1.875rem rgba(0, 0, 0, 0.5);
}

.title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  color: var(--color-gold-primary);
  margin-bottom: 0.5em;
  letter-spacing: 0.125em;
}

.subtitle {
  font-size: clamp(0.9rem, 1.2vw, 1.1rem);
  color: #999;
  margin-bottom: 1.875em;
}

.error-message {
  padding: 0.75em;
  background: rgba(200, 0, 0, 0.2);
  border: 0.0625rem solid rgba(255, 0, 0, 0.5);
  border-radius: 0.25rem;
  color: #ffcccc;
  margin-bottom: 1.25em;
  text-align: left;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
  margin-bottom: 1.5625em;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  text-align: left;
}

.form-group label {
  color: #ccc;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.875em 1em;
  background: rgba(0, 0, 0, 0.5);
  border: 0.125rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: white;
  font-size: clamp(0.9rem, 1vw, 1rem);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-gold-primary);
  box-shadow: 0 0 0 0.1875rem rgba(255, 215, 0, 0.1);
}

.form-group input::placeholder {
  color: #666;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  padding: 1em;
  background: var(--color-btn-primary-border);
  border: 0.125rem solid var(--color-gold-dim);
  border-radius: 0.375rem;
  color: #ffffff;
  font-size: clamp(0.95rem, 1.1vw, 1.1rem);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
  transform: translateY(-0.0625rem);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 1.5625em 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 0.0625rem;
  background: rgba(255, 255, 255, 0.2);
}

.divider span {
  padding: 0 0.9375em;
  color: #666;
  font-size: clamp(0.75rem, 0.9vw, 0.9rem);
  text-transform: uppercase;
  letter-spacing: 0.0625em;
}

.patreon-btn {
  width: 100%;
  padding: 0.875em;
  background: #FF424D;
  border: 0.125rem solid #FF424D;
  border-radius: 0.375rem;
  color: white;
  font-size: clamp(0.9rem, 1vw, 1rem);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625em;
}

.patreon-btn:hover:not(:disabled) {
  background: #e63946;
  border-color: #e63946;
  transform: translateY(-0.0625rem);
  box-shadow: 0 0.25rem 0.9375rem rgba(255, 66, 77, 0.4);
}

.patreon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.patreon-icon {
  width: 1.25em;
  height: 1.25em;
}

.register-hint {
  margin-top: 1.5625em;
  color: #888;
  font-size: clamp(0.8rem, 0.9vw, 0.9rem);
  line-height: 1.5;
}
</style>
