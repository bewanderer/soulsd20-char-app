// Auto-save composable for character data
// Watches for changes and saves automatically

import { usePlayerStore } from '@/store/player'

export function useAutoSave(intervalSeconds: number = 30) {
  const playerStore = usePlayerStore()
  let saveInterval: NodeJS.Timeout | null = null
  let isEnabled = ref(true)

  // Start auto-save interval
  const start = () => {
    if (saveInterval) return

    saveInterval = setInterval(() => {
      if (isEnabled.value) {
        playerStore.save()
      }
    }, intervalSeconds * 1000)

    console.log(`Auto-save started (every ${intervalSeconds} seconds)`)
  }

  // Stop auto-save interval
  const stop = () => {
    if (saveInterval) {
      clearInterval(saveInterval)
      saveInterval = null
      console.log('Auto-save stopped')
    }
  }

  // Enable auto-save
  const enable = () => {
    isEnabled.value = true
  }

  // Disable auto-save
  const disable = () => {
    isEnabled.value = false
  }

  // Save immediately
  const saveNow = () => {
    return playerStore.save()
  }

  // Clean up on unmount
  onUnmounted(() => {
    stop()
  })

  return {
    start,
    stop,
    enable,
    disable,
    saveNow,
    isEnabled: readonly(isEnabled)
  }
}
