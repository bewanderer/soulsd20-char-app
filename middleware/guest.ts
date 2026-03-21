/**
 * Guest middleware - protects routes that should only be accessible to unauthenticated users.
 * Redirects authenticated users to the home page.
 */
import { useApi } from '~/composables/useApi'

export default defineNuxtRouteMiddleware(() => {
  // Only run on client side
  if (process.server) return

  const api = useApi()

  // If user is already authenticated, redirect to dashboard
  if (api.isAuthenticated()) {
    return navigateTo('/campaigns')
  }
})
