/**
 * Character Sync Plugin
 *
 * Initializes the character synchronization system on app startup.
 * Connects the localStorage character storage layer to the API sync system.
 *
 * Flow:
 * 1. On app load: Pull latest from API, merge with localStorage
 * 2. Subscribe to storage events (create, update, delete)
 * 3. When storage events fire, queue them for API sync
 * 4. Watch for auth state changes and re-sync when user logs in
 */

import { useCharacterSync } from '~/composables/useCharacterSync'
import { onCharacterSync } from '~/mixins/characterStorage'
import { useApi } from '~/composables/useApi'

// Track if sync has been initialized for this session
let syncInitialized = false
let eventListenerSetup = false

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client
  if (typeof window === 'undefined') return

  const api = useApi()
  const characterSync = useCharacterSync()

  // Set up storage event listeners (only once)
  if (!eventListenerSetup) {
    onCharacterSync((type, character) => {
      // Only sync if authenticated
      if (api.isAuthenticated()) {
        console.log(`[CharacterSync Plugin] Storage event: ${type}`, character.uuid)
        characterSync.pushChange(type, character)
      }
    })
    eventListenerSetup = true
  }

  // Function to initialize sync (called on login or if already authenticated)
  async function initializeSyncIfNeeded(): Promise<void> {
    if (!api.isAuthenticated()) {
      console.log('[CharacterSync Plugin] Not authenticated, skipping sync')
      return
    }

    if (syncInitialized) {
      console.log('[CharacterSync Plugin] Already initialized, pulling latest')
      await characterSync.pullFromApi()
      return
    }

    await characterSync.initSync()
    syncInitialized = true
    console.log('[CharacterSync Plugin] Initialized, sync status:', characterSync.syncState.status)
  }

  // If already authenticated on load, initialize sync
  // initSync() will call markInitialSyncComplete() when done
  if (api.isAuthenticated()) {
    await initializeSyncIfNeeded()
  } else {
    // Not authenticated - mark sync as complete immediately
    // so components don't wait forever for sync that won't happen
    const { markInitialSyncComplete } = await import('~/composables/useCharacterSync')
    markInitialSyncComplete()
  }

  // Provide the init function so it can be called after login
  nuxtApp.provide('initCharacterSync', initializeSyncIfNeeded)

  // Also provide a way to reset sync state on logout
  nuxtApp.provide('resetCharacterSync', () => {
    syncInitialized = false
    console.log('[CharacterSync Plugin] Sync state reset')
  })
})
