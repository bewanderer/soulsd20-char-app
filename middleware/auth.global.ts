/**
 * Global authentication middleware - protects all routes except /login.
 * Redirects unauthenticated users to the login page.
 *
 * The ".global" suffix makes this middleware run on every route automatically.
 */
import { useApi } from '~/composables/useApi'

// Patreon callback runs the OAuth code-for-token exchange; it has no stored token until that completes.
const PUBLIC_PATHS = new Set([
  '/login',
  '/auth/patreon/callback'
])

export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) return

  if (PUBLIC_PATHS.has(to.path)) {
    return
  }

  const api = useApi()

  // If user is not authenticated, redirect to login
  if (!api.isAuthenticated()) {
    return navigateTo('/login')
  }
})
