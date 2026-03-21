/**
 * Auth middleware - protects routes that require authentication.
 * Redirects unauthenticated users to the login page.
 */
import { useApi } from '~/composables/useApi'

export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) return

  const api = useApi()

  // Check if user is authenticated
  if (!api.isAuthenticated()) {
    // Store the intended destination for post-login redirect
    const redirect = to.fullPath !== '/' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
    return navigateTo(`/login${redirect}`)
  }
})
