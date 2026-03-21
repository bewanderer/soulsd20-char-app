/**
 * Base API composable for making HTTP requests to the Django backend.
 * Handles authentication, error handling, and request/response formatting.
 */

// Auth token storage key
const AUTH_TOKEN_KEY = 'sd20_auth_token'

// API error type
export interface ApiError {
  status: number
  message: string
  details?: Record<string, unknown>
}

// API response wrapper
export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  ok: boolean
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.API_BASE_URL as string

  // Token management
  function getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }

  function setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }

  function clearToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }

  function isAuthenticated(): boolean {
    return !!getToken()
  }

  // Build headers with auth token
  function buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }

    const token = getToken()
    if (token) {
      headers['Authorization'] = `Token ${token}`
    }

    return headers
  }

  // Generic request function
  async function request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${baseUrl}${endpoint}`

    try {
      const options: RequestInit = {
        method,
        headers: buildHeaders(additionalHeaders),
      }

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return { data: null, error: null, ok: true }
      }

      // Parse JSON response
      let data: T | null = null
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      }

      // Handle error responses
      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
          message: response.statusText,
          details: data as unknown as Record<string, unknown>
        }

        // Extract error message from response
        if (data && typeof data === 'object') {
          const errorData = data as Record<string, unknown>
          if (errorData.error) {
            error.message = String(errorData.error)
          } else if (errorData.detail) {
            error.message = String(errorData.detail)
          }
        }

        return { data: null, error, ok: false }
      }

      return { data, error: null, ok: true }
    } catch (err) {
      const error: ApiError = {
        status: 0,
        message: err instanceof Error ? err.message : 'Network error'
      }
      return { data: null, error, ok: false }
    }
  }

  // HTTP method shortcuts
  async function get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return request<T>('GET', endpoint, undefined, headers)
  }

  async function post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return request<T>('POST', endpoint, body, headers)
  }

  async function patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return request<T>('PATCH', endpoint, body, headers)
  }

  async function del<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return request<T>('DELETE', endpoint, undefined, headers)
  }

  return {
    // Token management
    getToken,
    setToken,
    clearToken,
    isAuthenticated,

    // HTTP methods
    get,
    post,
    patch,
    delete: del,
    request,

    // Config
    baseUrl
  }
}
