/**
 * Compendium initialization plugin.
 * Loads compendium data (backgrounds, lineages, spells, skills, etc.)
 * once on app startup after authentication is confirmed.
 * Data is cached in the Pinia store and reused across all pages.
 */

import { useCompendiumStore } from '~/store/compendium'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtPlugin(async () => {
  if (typeof window === 'undefined') return

  const auth = useAuth()
  const compendiumStore = useCompendiumStore()

  // Only load if authenticated
  if (!auth.isAuthenticated.value) return

  // Skip if already loaded (e.g. HMR reload)
  if (compendiumStore.isLoaded) return

  try {
    await compendiumStore.getCompendium()
    console.log('[SD20 Compendium] Loaded on startup')
  } catch (error) {
    console.error('[SD20 Compendium] Failed to load on startup:', error)
    // Non-blocking: app continues without compendium, individual pages can retry
  }
})
