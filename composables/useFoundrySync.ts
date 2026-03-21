// Foundry VTT sync composable
// Thin wrapper around the plugin-provided API for component usage

export function useFoundrySync() {
  const nuxtApp = useNuxtApp()

  // Get the plugin-provided API
  // The plugin handles all connection logic, this just exposes it to components
  const api = nuxtApp.$foundrySync as {
    connect: () => void
    disconnect: () => void
    send: (type: string, data?: Record<string, unknown>) => boolean
    notifyCharacterUpdate: () => void
    getState: () => { isConnected: boolean; isFoundryConnected: boolean }
  } | undefined

  // Return reactive refs that track the state
  const isConnected = computed(() => api?.getState().isConnected ?? false)
  const isFoundryConnected = computed(() => api?.getState().isFoundryConnected ?? false)

  return {
    connect: () => api?.connect(),
    disconnect: () => api?.disconnect(),
    send: (type: string, data?: Record<string, unknown>) => api?.send(type, data) ?? false,
    notifyCharacterUpdate: () => api?.notifyCharacterUpdate(),
    isConnected,
    isFoundryConnected
  }
}
