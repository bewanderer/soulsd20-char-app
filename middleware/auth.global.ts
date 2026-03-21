/**
 * Global authentication middleware - protects all routes except /login.
 * Redirects unauthenticated users to the login page.
 *
 * The ".global" suffix makes this middleware run on every route automatically.
 */
import { useApi } from '~/composables/useApi'

export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) return

  // Allow access to login page without authentication
  if (to.path === '/login') {
    return
  }

  const api = useApi()

  // If user is not authenticated, redirect to login
  if (!api.isAuthenticated()) {
    return navigateTo('/login')
  }
})
