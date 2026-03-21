/**
 * Auth initialization plugin.
 * Runs on app startup to restore authentication state from localStorage.
 *
 * Session marker: uses sessionStorage to detect browser close/reopen.
 * sessionStorage is cleared when the browser tab closes, while localStorage persists.
 * If the auth token exists but the session marker is missing, the user reopened
 * the browser and must log in again.
 */

import { useAuth } from '~/composables/useAuth'

const SESSION_MARKER_KEY = 'sd20_session_active'

export default defineNuxtPlugin(async () => {
  if (typeof window === 'undefined') return

  const auth = useAuth()

  // Check session marker: if auth token exists but no session marker,
  // the browser was closed and reopened - force logout
  const hasToken = !!localStorage.getItem('sd20_auth_token')
  const hasSession = !!sessionStorage.getItem(SESSION_MARKER_KEY)

  console.log(`[SD20 Auth] Plugin init: hasToken=${hasToken}, hasSession=${hasSession}`)

  if (hasToken && !hasSession) {
    console.log('[Auth] No session marker found - browser was closed. Clearing auth.')
    console.log('[SD20 Auth] Decision: forcing logout (token exists but no session marker)')
    await auth.logout()
    return
  }

  console.log('[SD20 Auth] Decision: session valid, proceeding with initAuth')

  // Initialize auth - loads persisted user and validates token with server
  await auth.initAuth()

  // Set session marker if authenticated
  if (auth.isAuthenticated.value) {
    sessionStorage.setItem(SESSION_MARKER_KEY, '1')
  }

  console.log('Auth plugin initialized, authenticated:', auth.isAuthenticated.value)
  console.log(`[SD20 Auth] After initAuth: authenticated=${auth.isAuthenticated.value}`)
})
