/**
 * Authentication composable
 *
 * Handles user authentication state and login/logout.
 * Supports both username/password and Patreon OAuth.
 * Integrates with Django REST Framework Token Authentication.
 */

import { ref, computed, readonly } from 'vue'
import { useApi } from './useApi'
import { useNuxtApp } from '#app'

// User storage key for persisting user data
const USER_STORAGE_KEY = 'sd20_user'

export interface User {
  id: number
  uuid: string
  username: string
  user_type: 'patreon' | 'permanent'
  subscription_status: string | null
  subscription_tier: string | null
  max_characters: number
  max_campaigns_as_gm: number
  is_admin: boolean
  patreon_connected: boolean
}

// Module-level state for sharing across components
// This ensures all calls to useAuth() share the same reactive state
const user = ref<User | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useAuth() {
  const api = useApi()

  // Check if user is authenticated (reactive - responds to login/logout)
  const isAuthenticated = computed(() => !!user.value || api.isAuthenticated())

  // Check if user has active subscription
  const isActiveSubscriber = computed(() => {
    if (!user.value) return false
    if (user.value.is_admin) return true
    if (user.value.user_type === 'permanent') return true
    return user.value.subscription_status === 'active_patron'
  })

  // Persist user to localStorage
  function persistUser(userData: User | null): void {
    if (typeof window === 'undefined') return
    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  // Load user from localStorage
  function loadPersistedUser(): User | null {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  // ============================================
  // Username/Password Auth
  // ============================================

  async function login(username: string, password: string): Promise<boolean> {
    console.log(`[SD20 Auth] login() called for username="${username}"`)
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<{ token: string; user: User }>('/api/auth/login/', {
        username,
        password
      })

      if (response.ok && response.data) {
        console.log(`[SD20 Auth] login() success: user=${response.data.user.username}, id=${response.data.user.id}`)
        api.setToken(response.data.token)
        user.value = response.data.user
        persistUser(response.data.user)

        // Set session marker for browser close detection
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sd20_session_active', '1')
        }

        // Load compendium data (blocks UI via LoadingOverlay)
        try {
          const { useCompendiumStore } = await import('~/store/compendium')
          const compendiumStore = useCompendiumStore()
          await compendiumStore.getCompendium()
        } catch {
          console.warn('[SD20 Auth] Compendium load failed during login, will retry on page')
        }

        // Initialize character sync after login
        const { $initCharacterSync } = useNuxtApp()
        if ($initCharacterSync) {
          await ($initCharacterSync as () => Promise<void>)()
        }

        return true
      } else {
        console.warn(`[SD20 Auth] login() failed: ${response.error?.message || 'Login failed'}`)
        error.value = response.error?.message || 'Login failed'
        return false
      }
    } catch (err) {
      console.error(`[SD20 Auth] login() error:`, err)
      error.value = err instanceof Error ? err.message : 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // Patreon OAuth
  // ============================================

  /**
   * Get the Patreon OAuth URL to redirect the user to.
   */
  async function getPatreonAuthUrl(state?: string): Promise<string | null> {
    const params = state ? `?state=${encodeURIComponent(state)}` : ''
    const response = await api.get<{ auth_url: string }>(`/api/auth/patreon/${params}`)

    if (response.ok && response.data) {
      return response.data.auth_url
    }

    error.value = response.error?.message || 'Failed to get Patreon auth URL'
    return null
  }

  /**
   * Start Patreon OAuth flow by redirecting to Patreon.
   */
  async function loginWithPatreon(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(7)
      sessionStorage.setItem('patreon_oauth_state', state)

      const authUrl = await getPatreonAuthUrl(state)
      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start Patreon login'
      isLoading.value = false
    }
  }

  /**
   * Handle Patreon OAuth callback.
   * Call this when user returns from Patreon with authorization code.
   */
  async function handlePatreonCallback(code: string, state?: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      // Verify state if provided
      if (state) {
        const savedState = sessionStorage.getItem('patreon_oauth_state')
        if (savedState !== state) {
          error.value = 'Invalid OAuth state'
          return false
        }
        sessionStorage.removeItem('patreon_oauth_state')
      }

      const response = await api.post<{
        token: string
        user: User
        is_new_user: boolean
      }>('/api/auth/patreon/callback/', { code, state })

      if (response.ok && response.data) {
        api.setToken(response.data.token)
        user.value = response.data.user
        persistUser(response.data.user)

        // Set session marker for browser close detection
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sd20_session_active', '1')
        }

        // Initialize character sync after Patreon login
        const { $initCharacterSync } = useNuxtApp()
        if ($initCharacterSync) {
          await ($initCharacterSync as () => Promise<void>)()
        }

        return true
      } else {
        error.value = response.error?.message || 'Patreon login failed'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Patreon login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh Patreon membership status.
   */
  async function refreshPatreonStatus(): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<{ user: User }>('/api/auth/patreon/refresh/')

      if (response.ok && response.data) {
        user.value = response.data.user
        persistUser(response.data.user)
        return true
      } else {
        error.value = response.error?.message || 'Failed to refresh Patreon status'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh Patreon status'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Disconnect Patreon from the account.
   */
  async function disconnectPatreon(): Promise<boolean> {
    const response = await api.post<{ message: string }>('/api/auth/patreon/disconnect/')

    if (response.ok) {
      // Refresh user data
      await fetchUser()
      return true
    }

    error.value = response.error?.message || 'Failed to disconnect Patreon'
    return false
  }

  // ============================================
  // Common Auth Functions
  // ============================================

  async function logout(): Promise<void> {
    console.log('[SD20 Auth] logout() called')
    try {
      await api.post('/api/auth/logout/')
      console.log('[SD20 Auth] logout() API call complete')
    } catch {
      // Ignore errors, local state is cleared regardless
      console.warn('[SD20 Auth] logout() API call failed (continuing with local cleanup)')
    }

    // Clear character localStorage BEFORE clearing user (need user UUID for key)
    try {
      const { getStorageKey } = await import('~/mixins/characterStorage')
      const key = getStorageKey()
      console.log(`[SD20 Auth] logout() clearing character storage key="${key}"`)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
        localStorage.removeItem('sd20_characters') // Legacy global key
        localStorage.removeItem('sd20_sync_queue')
      }
    } catch {
      // characterStorage not available
    }

    console.log('[SD20 Auth] logout() clearing auth token')
    api.clearToken()
    user.value = null
    persistUser(null)

    // Reset character sync state
    console.log('[SD20 Auth] logout() resetting character sync state')
    const { $resetCharacterSync } = useNuxtApp()
    if ($resetCharacterSync) {
      ($resetCharacterSync as () => void)()
    }

    // Clear campaign state if available
    try {
      const { useCampaigns } = await import('./useCampaigns')
      const campaigns = useCampaigns()
      campaigns.clearState()
      console.log('[SD20 Auth] logout() cleared campaign state')
    } catch {
      // useCampaigns not available
    }

    // Reset player store to clear stale character data from memory
    try {
      const { usePlayerStore } = await import('~/store/player')
      const playerStore = usePlayerStore()
      playerStore.resetToDefaults()
      console.log('[SD20 Auth] logout() reset player store')
    } catch {
      // playerStore not available
    }

    // Reset compendium so it reloads on next login (with new user's campaign items)
    try {
      const { useCompendiumStore } = await import('~/store/compendium')
      const compendiumStore = useCompendiumStore()
      compendiumStore.$reset()
    } catch {
      // compendiumStore not available
    }

    // Clear session marker
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sd20_session_active')
    }
    console.log('[SD20 Auth] logout() complete')
  }

  async function fetchUser(): Promise<boolean> {
    console.log('[SD20 Auth] fetchUser() called')
    if (!api.isAuthenticated()) {
      console.log('[SD20 Auth] fetchUser() skipped: not authenticated')
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<User>('/api/auth/me/')

      if (response.ok && response.data) {
        console.log(`[SD20 Auth] fetchUser() success: user=${response.data.username}, id=${response.data.id}`)
        user.value = response.data
        persistUser(response.data)
        return true
      } else {
        console.warn(`[SD20 Auth] fetchUser() failed: status=${response.error?.status}, message=${response.error?.message}`)
        if (response.error?.status === 401) {
          console.warn('[SD20 Auth] fetchUser() 401 - clearing token and user data')
          // Token expired or invalid - clear everything
          try {
            const { getStorageKey } = await import('~/mixins/characterStorage')
            const key = getStorageKey()
            localStorage.removeItem(key)
            localStorage.removeItem('sd20_characters')
            localStorage.removeItem('sd20_sync_queue')
          } catch { /* ignore */ }
          api.clearToken()
          user.value = null
          persistUser(null)
        }
        error.value = response.error?.message || 'Failed to fetch user'
        return false
      }
    } catch (err) {
      console.error('[SD20 Auth] fetchUser() error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch user'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function initAuth(): Promise<void> {
    console.log('[SD20 Auth] initAuth() called')
    // Load persisted user first for instant UI
    const persisted = loadPersistedUser()
    if (persisted) {
      console.log(`[SD20 Auth] initAuth() loaded persisted user: ${persisted.username} (id=${persisted.id})`)
      user.value = persisted
    } else {
      console.log('[SD20 Auth] initAuth() no persisted user found')
    }

    // Then verify with server
    if (api.isAuthenticated()) {
      console.log('[SD20 Auth] initAuth() token present, verifying with server...')
      await fetchUser()
    } else {
      console.log('[SD20 Auth] initAuth() no token, skipping server verification')
    }
  }

  return {
    // State
    user: readonly(user),
    isAuthenticated,
    isActiveSubscriber,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Username/Password auth
    login,

    // Patreon OAuth
    loginWithPatreon,
    handlePatreonCallback,
    refreshPatreonStatus,
    disconnectPatreon,
    getPatreonAuthUrl,

    // Common
    logout,
    fetchUser,
    initAuth
  }
}
