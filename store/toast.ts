import { defineStore } from 'pinia'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose?: () => void
  dedupeKey?: string
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[]
  }),

  actions: {
    show(toast: Omit<Toast, 'id'>) {
      if (toast.dedupeKey && this.toasts.some(t => t.dedupeKey === toast.dedupeKey)) {
        return ''
      }
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      this.toasts.push({
        id,
        ...toast,
        duration: toast.duration ?? 3000
      })

      return id
    },

    success(title: string, message?: string) {
      return this.show({ type: 'success', title, message })
    },

    error(title: string, message?: string) {
      return this.show({ type: 'error', title, message, duration: 5000 })
    },

    warning(title: string, message?: string) {
      return this.show({ type: 'warning', title, message })
    },

    info(title: string, message?: string) {
      return this.show({ type: 'info', title, message })
    },

    remove(id: string) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index !== -1) {
        const [removed] = this.toasts.splice(index, 1)
        if (removed?.onClose) {
          try { removed.onClose() } catch { /* swallow */ }
        }
      }
    },

    clear() {
      this.toasts = []
    }
  }
})
