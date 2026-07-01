/**
 * Item 6 (Batch C): coalesce update-last-played API calls.
 *
 * The API exposes POST /api/characters/{id}/update-last-played/. Every
 * character page navigation used to imply a call but no App code was wired
 * to fire it. This module wires it and coalesces up to 30 seconds of calls
 * per character into a single API request that stamps the newest queue
 * timestamp for that uuid. beforeunload and logout flush any pending queue
 * synchronously so a browser close does not lose a fresh selection.
 */

const COALESCE_WINDOW_MS = 30000

type QueueEntry = {
  uuid: string
  timestamp: number
}

const _pending = new Map<string, QueueEntry>()
let _timer: ReturnType<typeof setTimeout> | null = null
let _unloadHooked = false

function _now(): number {
  return Date.now()
}

async function _flushOne(uuid: string): Promise<void> {
  const entry = _pending.get(uuid)
  if (!entry) return
  _pending.delete(uuid)

  const config = useRuntimeConfig()
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('sd20_auth_token') : null
  if (!token) return

  const url = `${config.public.API_BASE_URL}/characters/${uuid}/update-last-played/`
  try {
    await $fetch(url, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    })
  } catch (err) {
    console.warn('[SD20 LastPlayed] update-last-played failed for', uuid, err)
  }
}

async function _flushAll(): Promise<void> {
  const uuids = Array.from(_pending.keys())
  await Promise.all(uuids.map(_flushOne))
}

function _flushAllSync(): void {
  // Used inside beforeunload. sendBeacon delivers even if the tab is being
  // destroyed. If auth is not present or sendBeacon is unsupported, we drop
  // the calls silently (the API tolerates a stale last_played timestamp).
  if (typeof window === 'undefined') return
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return
  const token = window.localStorage.getItem('sd20_auth_token')
  if (!token) return
  const config = useRuntimeConfig()
  for (const [uuid] of _pending) {
    const url = `${config.public.API_BASE_URL}/characters/${uuid}/update-last-played/`
    try {
      navigator.sendBeacon(
        `${url}?token=${encodeURIComponent(token)}`,
        new Blob([JSON.stringify({})], { type: 'application/json' })
      )
    } catch { /* ignore */ }
  }
  _pending.clear()
}

function _hookUnloadOnce() {
  if (_unloadHooked || typeof window === 'undefined') return
  _unloadHooked = true
  window.addEventListener('beforeunload', () => {
    _flushAllSync()
  })
}

/**
 * Queue a last-played update for a character. Subsequent calls for the same
 * uuid within the coalesce window replace the queued timestamp. A single
 * API call fires at the end of the window per uuid.
 */
export function queueLastPlayed(uuid: string): void {
  if (!uuid) return
  _hookUnloadOnce()
  _pending.set(uuid, { uuid, timestamp: _now() })
  if (_timer) return
  _timer = setTimeout(() => {
    _timer = null
    _flushAll()
  }, COALESCE_WINDOW_MS)
}

/**
 * Flush any pending last-played updates immediately. Awaits every API call
 * so callers (like logout) can be sure the updates land before the token
 * is invalidated.
 */
export async function flushLastPlayed(): Promise<void> {
  if (_timer) {
    clearTimeout(_timer)
    _timer = null
  }
  await _flushAll()
}
