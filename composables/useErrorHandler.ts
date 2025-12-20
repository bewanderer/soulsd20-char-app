import { useToastStore } from '@/store/toast'

// Global error handler that shows user-friendly messages
export function useErrorHandler() {
  const toast = useToastStore()

  // Handle errors with user-friendly messages
  function handleError(error: any, context?: string) {
    console.error('Error:', error)

    let title = 'Something went wrong'
    let message = 'Please try again'

    // Parse common error types
    if (error.response) {
      // API errors
      title = 'Network Error'
      message = error.response.data?.message || error.response.statusText
    } else if (error.message) {
      // JavaScript errors
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }

    // Add context if provided
    if (context) {
      title = context
    }

    toast.error(title, message)
  }

  // Wrap async functions with error handling
  async function safely<T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      return await fn()
    } catch (error) {
      handleError(error, errorMessage)
      return null
    }
  }

  // Wrap sync functions with error handling
  function safelySync<T>(
    fn: () => T,
    errorMessage?: string
  ): T | null {
    try {
      return fn()
    } catch (error) {
      handleError(error, errorMessage)
      return null
    }
  }

  return {
    handleError,
    safely,
    safelySync
  }
}

// Global error handler for uncaught errors
export function setupGlobalErrorHandler() {
  if (process.client) {
    const toast = useToastStore()

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      toast.error(
        'Unexpected Error',
        'Something went wrong. The page will continue working.'
      )
      event.preventDefault()
    })

    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      toast.error(
        'Unexpected Error',
        'Something went wrong. The page will continue working.'
      )
      event.preventDefault()
    })
  }
}
