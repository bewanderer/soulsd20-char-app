/**
 * Character Sync Manager
 *
 * Orchestrates the hybrid localStorage + API approach:
 * - localStorage: Fast local cache, Foundry reads from here
 * - API: Persistent cloud storage, synced in background
 *
 * Flow:
 * 1. On app load: Fetch from API → merge with localStorage → update localStorage
 * 2. On changes: Update localStorage immediately → queue API sync
 * 3. Foundry always reads from localStorage
 *
 * Sync Strategy:
 * - "API-first on load": Pull latest from API when app starts
 * - "Local-first during session": Changes go to localStorage immediately
 * - "Background sync": Queue changes and sync to API periodically
 */

import {
  getAllCharacters,
  saveCharacterList,
  type StoredCharacter,
  type CharacterList
} from '~/mixins/characterStorage'
import { useApi } from './useApi'
import { useCharacterApi } from './useCharacterApi'
import { useFoundrySync } from './useFoundrySync'

// Sync status
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline'

// Sync queue item
interface SyncQueueItem {
  type: 'create' | 'update' | 'delete'
  uuid: string
  data?: Partial<StoredCharacter>
  timestamp: number
  retries: number
}

// Sync state
interface SyncState {
  status: SyncStatus
  lastSyncedAt: string | null
  pendingChanges: number
  error: string | null
  isOnline: boolean
}

// Queue storage key
const SYNC_QUEUE_KEY = 'sd20_sync_queue'
const MAX_RETRIES = 3
const SYNC_DEBOUNCE_MS = 5000 // Debounce API calls by 5 seconds

// Module-level flag: initial sync has completed (API data loaded into localStorage)
// Components should wait for this before loading characters from localStorage
let _initialSyncComplete = false
let _initialSyncPromise: Promise<void> | null = null
let _initialSyncResolve: (() => void) | null = null

// Module-level flag: sync is actively pulling from API
// Prevents save() from writing stale data while API data is being fetched
let _syncInProgress = false

// Monotonic session token incremented whenever pullFromApi starts. flushSyncQueue
// captures this value and bails out of the loop if it changes mid-flight so that
// PATCHes carrying state we just pulled fresher from the API cannot clobber it.
let _syncSessionToken = 0

export function isSyncInProgress(): boolean {
  return _syncInProgress
}

export function isInitialSyncComplete(): boolean {
  return _initialSyncComplete
}

export function waitForInitialSync(): Promise<void> {
  if (_initialSyncComplete) return Promise.resolve()
  if (!_initialSyncPromise) {
    _initialSyncPromise = new Promise<void>(resolve => {
      _initialSyncResolve = resolve
    })
  }
  return _initialSyncPromise
}

export function markInitialSyncComplete(): void {
  _initialSyncComplete = true
  if (_initialSyncResolve) {
    _initialSyncResolve()
    _initialSyncResolve = null
  }
}

export function useCharacterSync() {
  const characterApi = useCharacterApi()
  const api = useApi()
  const foundrySync = useFoundrySync()

  // Reactive state
  const syncState = reactive<SyncState>({
    status: 'synced',
    lastSyncedAt: null,
    pendingChanges: 0,
    error: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  })

  // Debounce timer
  let syncTimer: ReturnType<typeof setTimeout> | null = null

  // Load sync queue from localStorage
  function loadSyncQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  // Save sync queue to localStorage
  function saveSyncQueue(queue: SyncQueueItem[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
    syncState.pendingChanges = queue.length
  }

  // Add item to sync queue
  function queueSync(type: SyncQueueItem['type'], uuid: string, data?: Partial<StoredCharacter>): void {
    const queue = loadSyncQueue()

    // Check if there's a pending CREATE for this UUID
    const hasPendingCreate = queue.some(item => item.uuid === uuid && item.type === 'create')

    if (type === 'update' && hasPendingCreate) {
      // Update the CREATE entry's data instead of adding a separate UPDATE
      // This ensures the character is created with the latest data
      const createIndex = queue.findIndex(item => item.uuid === uuid && item.type === 'create')
      if (createIndex >= 0) {
        queue[createIndex].data = data
        queue[createIndex].timestamp = Date.now()
        // Remove any existing UPDATE entries for this UUID
        const filtered = queue.filter((item, i) => i === createIndex || !(item.uuid === uuid && item.type === 'update'))
        saveSyncQueue(filtered)
        syncState.status = 'pending'
        scheduleSyncFlush()
        return
      }
    }

    // Remove existing entry for same UUID and type (keep latest)
    const filtered = queue.filter(item => !(item.uuid === uuid && item.type === type))

    filtered.push({
      type,
      uuid,
      data,
      timestamp: Date.now(),
      retries: 0
    })

    saveSyncQueue(filtered)
    syncState.status = 'pending'
    scheduleSyncFlush()
  }

  // Schedule a debounced sync flush
  function scheduleSyncFlush(): void {
    if (syncTimer) {
      clearTimeout(syncTimer)
    }
    syncTimer = setTimeout(() => {
      flushSyncQueue()
    }, SYNC_DEBOUNCE_MS)
  }

  // Process the sync queue
  async function flushSyncQueue(): Promise<void> {
    if (!api.isAuthenticated()) {
      console.log('[CharacterSync] Not authenticated, skipping sync')
      return
    }

    if (!syncState.isOnline) {
      console.log('[CharacterSync] Offline, skipping sync')
      return
    }

    const queue = loadSyncQueue()
    if (queue.length === 0) {
      syncState.status = 'synced'
      return
    }

    console.log(`[SD20 Sync] flushSyncQueue() processing ${queue.length} items`)
    syncState.status = 'syncing'
    const failedItems: SyncQueueItem[] = []
    const sessionAtStart = _syncSessionToken

    for (const item of queue) {
      if (_syncSessionToken !== sessionAtStart) {
        console.warn('[SD20 Sync] flushSyncQueue() aborting: pullFromApi started during flush; remaining items kept in queue')
        failedItems.push(item)
        continue
      }
      console.log(`[SD20 Sync] flushSyncQueue() processing: type="${item.type}" uuid="${item.uuid}" retries=${item.retries}`)
      try {
        let success = false
        let lastResponseStatus = 0

        switch (item.type) {
          case 'create': {
            if (item.data) {
              const apiData = characterApi.toApiFormat(item.data as StoredCharacter)
              const response = await characterApi.createCharacter(apiData)
              success = response.ok
              lastResponseStatus = response.error?.status || 0
              if (!success) {
                console.error('[CharacterSync] Create failed:', response.error)
              } else {
                console.log(`[SD20 Sync] flushSyncQueue() create success: uuid="${item.uuid}"`)
              }
            }
            break
          }
          case 'update': {
            if (item.data) {
              const apiData = characterApi.toApiFormat(item.data as StoredCharacter)
              const response = await characterApi.updateCharacter(item.uuid, apiData)
              success = response.ok
              lastResponseStatus = response.error?.status || 0
              if (!success) {
                console.error('[CharacterSync] Update failed:', response.error)
              } else {
                console.log(`[SD20 Sync] flushSyncQueue() update success: uuid="${item.uuid}"`)
              }
            }
            break
          }
          case 'delete': {
            const response = await characterApi.deleteCharacter(item.uuid)
            success = response.ok
            lastResponseStatus = response.error?.status || 0
            if (!success) {
              console.error('[CharacterSync] Delete failed:', response.error)
            } else {
              console.log(`[SD20 Sync] flushSyncQueue() delete success: uuid="${item.uuid}"`)
            }
            break
          }
        }

        if (!success) {
          // Don't retry 400 errors (validation failures won't fix themselves)
          const isValidationError = lastResponseStatus === 400
          if (isValidationError) {
            console.error(`[SD20 Sync] Validation error for ${item.type} ${item.uuid} - not retrying (400)`)
          } else {
            item.retries++
            if (item.retries < MAX_RETRIES) {
              console.warn(`[SD20 Sync] flushSyncQueue() item failed, will retry: type="${item.type}" uuid="${item.uuid}" retries=${item.retries}`)
              failedItems.push(item)
            } else {
              console.error(`[SD20 Sync] Max retries reached for ${item.type} ${item.uuid}`)
            }
          }
        }
      } catch (error) {
        console.error('[CharacterSync] Sync error:', error)
        item.retries++
        if (item.retries < MAX_RETRIES) {
          failedItems.push(item)
        }
      }
    }

    // Update queue with failed items
    saveSyncQueue(failedItems)

    if (failedItems.length > 0) {
      syncState.status = 'error'
      syncState.error = `${failedItems.length} changes failed to sync`
    } else {
      syncState.status = 'synced'
      syncState.lastSyncedAt = new Date().toISOString()
      syncState.error = null
    }
  }

  // Pull characters from API and merge with localStorage
  /**
   * Optimization 1: two-phase pull. Fetch the lightweight list first, then
   * only fetch full details for characters whose server updated_at is newer
   * than the local copy (or characters we do not have locally at all).
   *
   * Cost: 1 small list request + N small detail requests where N = characters
   * changed since last sync. First-run for a new device: 1 list + M full
   * details where M = total character count (same total as legacy pullFromApi
   * but split across small requests, which lets the UI render partial state
   * as they arrive).
   */
  async function pullFromApiLight(): Promise<boolean> {
    if (!api.isAuthenticated()) {
      console.log('[CharacterSync] Not authenticated, using localStorage only')
      return false
    }

    try {
      console.log('[SD20 Sync] pullFromApiLight() fetching lightlist')
      _syncInProgress = true
      _syncSessionToken++
      syncState.status = 'syncing'

      const listResp = await characterApi.fetchLightList()
      if (!listResp.ok || !listResp.data) {
        console.error('[CharacterSync] Lightlist fetch failed:', listResp.error)
        syncState.status = 'error'
        syncState.error = listResp.error?.message || 'Failed to fetch character list'
        _syncInProgress = false
        return false
      }

      const localList = getAllCharacters()
      const localByUuid = new Map<string, StoredCharacter>()
      const normalizeUuid = (uuid: string) => uuid.toLowerCase().trim()
      for (const c of localList.characters) {
        localByUuid.set(normalizeUuid(c.uuid), c)
      }

      // Decide which characters need a detail fetch.
      const toFetch: string[] = []
      const serverUuids = new Set<string>()
      for (const light of listResp.data) {
        serverUuids.add(normalizeUuid(light.id))
        const localChar = localByUuid.get(normalizeUuid(light.id))
        if (!localChar) {
          toFetch.push(light.id)
          continue
        }
        const localStamp = localChar.updated_at ? Date.parse(localChar.updated_at) : NaN
        const serverStamp = light.updated_at ? Date.parse(light.updated_at) : NaN
        if (!isNaN(localStamp) && !isNaN(serverStamp) && serverStamp <= localStamp) {
          continue
        }
        toFetch.push(light.id)
      }

      console.log(`[SD20 Sync] pullFromApiLight() lightlist=${listResp.data.length}, needs detail=${toFetch.length}`)

      // Fetch stale ones in parallel. Small array, small requests, safe to fan out.
      const detailResponses = await Promise.all(
        toFetch.map(id => characterApi.fetchCharacter(id))
      )

      const fetchedChars: StoredCharacter[] = []
      for (const resp of detailResponses) {
        if (resp.ok && resp.data) {
          fetchedChars.push(characterApi.fromApiFormat(resp.data))
        }
      }

      // Merge: fresh detail wins for characters we refetched, local wins for
      // characters we did not (server said their updated_at is not newer).
      const merged: StoredCharacter[] = []
      const fetchedByUuid = new Map<string, StoredCharacter>()
      for (const c of fetchedChars) {
        fetchedByUuid.set(normalizeUuid(c.uuid), c)
      }
      for (const light of listResp.data) {
        const normalizedId = normalizeUuid(light.id)
        const fresh = fetchedByUuid.get(normalizedId)
        if (fresh) {
          const localChar = localByUuid.get(normalizedId)
          if (localChar && !fresh.creation_stats && localChar.creation_stats) {
            fresh.creation_stats = localChar.creation_stats
          }
          if (localChar && !fresh.creation_starting_hp && localChar.creation_starting_hp) {
            fresh.creation_starting_hp = localChar.creation_starting_hp
          }
          merged.push(fresh)
        } else {
          const localChar = localByUuid.get(normalizedId)
          if (localChar) merged.push(localChar)
        }
      }

      // Preserve local-only queued characters not yet in API.
      const queue = loadSyncQueue()
      for (const localChar of localList.characters) {
        if (!serverUuids.has(normalizeUuid(localChar.uuid))) {
          const isQueued = queue.some(item => normalizeUuid(item.uuid) === normalizeUuid(localChar.uuid))
          if (isQueued) merged.push(localChar)
        }
      }

      const mergedList: CharacterList = {
        characters: merged,
        active_uuid: localList.active_uuid,
        version: localList.version,
      }
      if (mergedList.active_uuid && !merged.some(c => c.uuid === mergedList.active_uuid)) {
        mergedList.active_uuid = merged.length > 0 ? merged[0].uuid : null
      } else if (!mergedList.active_uuid && merged.length > 0) {
        mergedList.active_uuid = merged[0].uuid
      }

      saveCharacterList(mergedList)
      foundrySync.notifyCharacterUpdate()

      syncState.status = 'synced'
      syncState.lastSyncedAt = new Date().toISOString()
      syncState.error = null
      _syncInProgress = false
      return true
    } catch (error) {
      console.error('[CharacterSync] pullFromApiLight error:', error)
      syncState.status = 'error'
      syncState.error = error instanceof Error ? error.message : 'Unknown error'
      _syncInProgress = false
      return false
    }
  }

  /**
   * Bug 2: refetch a single character in the background when the character
   * page mounts. Compares server updated_at against local before doing the
   * heavy detail fetch. Does NOT block page render.
   */
  async function refreshSingleCharacter(uuid: string): Promise<boolean> {
    if (!api.isAuthenticated()) return false
    try {
      const listResp = await characterApi.fetchLightList()
      if (!listResp.ok || !listResp.data) return false

      const light = listResp.data.find(c => c.id.toLowerCase() === uuid.toLowerCase())
      if (!light) return false

      const localList = getAllCharacters()
      const localChar = localList.characters.find(
        c => c.uuid.toLowerCase() === uuid.toLowerCase()
      )
      const localStamp = localChar?.updated_at ? Date.parse(localChar.updated_at) : NaN
      const serverStamp = light.updated_at ? Date.parse(light.updated_at) : NaN
      if (localChar && !isNaN(localStamp) && !isNaN(serverStamp) && serverStamp <= localStamp) {
        return true
      }

      const detailResp = await characterApi.fetchCharacter(uuid)
      if (!detailResp.ok || !detailResp.data) return false

      const fresh = characterApi.fromApiFormat(detailResp.data)
      if (localChar) {
        if (!fresh.creation_stats && localChar.creation_stats) fresh.creation_stats = localChar.creation_stats
        if (!fresh.creation_starting_hp && localChar.creation_starting_hp) fresh.creation_starting_hp = localChar.creation_starting_hp
      }

      const idx = localList.characters.findIndex(c => c.uuid.toLowerCase() === uuid.toLowerCase())
      if (idx >= 0) {
        localList.characters[idx] = fresh
      } else {
        localList.characters.push(fresh)
      }
      saveCharacterList(localList)
      return true
    } catch (error) {
      console.error('[CharacterSync] refreshSingleCharacter error:', error)
      return false
    }
  }

  async function pullFromApi(): Promise<boolean> {
    if (!api.isAuthenticated()) {
      console.log('[CharacterSync] Not authenticated, using localStorage only')
      return false
    }

    try {
      console.log('[SD20 Sync] pullFromApi() fetching characters from API...')
      _syncInProgress = true
      _syncSessionToken++
      syncState.status = 'syncing'
      const response = await characterApi.fetchCharacters()

      if (!response.ok || !response.data) {
        console.error('[CharacterSync] Failed to fetch from API:', response.error)
        syncState.status = 'error'
        syncState.error = response.error?.message || 'Failed to fetch characters'
        _syncInProgress = false
        return false
      }

      // Get current localStorage data
      const localList = getAllCharacters()

      // Convert API characters to localStorage format
      const apiCharacters = response.data.map(c => characterApi.fromApiFormat(c))
      console.log(`[SD20 Sync] pullFromApi() received ${apiCharacters.length} characters from API`)

      // Merge strategy: API characters replace local ones with same UUID
      // Keep local characters that don't exist in API (newly created offline)
      const mergedCharacters: StoredCharacter[] = []

      // Normalize UUIDs for comparison (lowercase, trimmed)
      const normalizeUuid = (uuid: string) => uuid.toLowerCase().trim()
      const apiUuids = new Set(apiCharacters.map(c => normalizeUuid(c.uuid)))

      // Build local lookup for preserving fields API might not have
      const localByUuid = new Map<string, StoredCharacter>()
      for (const localChar of localList.characters) {
        localByUuid.set(normalizeUuid(localChar.uuid), localChar)
      }

      // Add all API characters, preserving local-only fields
      for (const apiChar of apiCharacters) {
        const localChar = localByUuid.get(normalizeUuid(apiChar.uuid))
        if (localChar) {
          // Preserve creation_stats if API version is missing it
          if (!apiChar.creation_stats && localChar.creation_stats) {
            apiChar.creation_stats = localChar.creation_stats
          }
          if (!apiChar.creation_starting_hp && localChar.creation_starting_hp) {
            apiChar.creation_starting_hp = localChar.creation_starting_hp
          }
          // If the local copy is stamped newer than what the API just returned
          // (in-flight save not yet processed, or another tab raced us), keep
          // the local state rather than overwriting with stale API data.
          const localStamp = localChar.updated_at ? Date.parse(localChar.updated_at) : NaN
          const apiStamp = apiChar.updated_at ? Date.parse(apiChar.updated_at) : NaN
          if (!isNaN(localStamp) && !isNaN(apiStamp) && localStamp > apiStamp) {
            console.warn(`[CharacterSync] Local copy of ${apiChar.name} is newer than API; keeping local (${localChar.updated_at} > ${apiChar.updated_at})`)
            mergedCharacters.push(localChar)
            continue
          }
        }
        mergedCharacters.push(apiChar)
      }

      // Add local-only characters (created while offline)
      const queue = loadSyncQueue()
      for (const localChar of localList.characters) {
        const normalizedLocalUuid = normalizeUuid(localChar.uuid)
        if (!apiUuids.has(normalizedLocalUuid)) {
          // Check if this character is in the sync queue for creation
          const isQueued = queue.some(item => normalizeUuid(item.uuid) === normalizedLocalUuid)
          if (isQueued) {
            mergedCharacters.push(localChar)
            console.log(`[CharacterSync] Keeping local-only character (queued): ${localChar.name} (${localChar.uuid})`)
          } else {
            console.log(`[CharacterSync] Dropping local character not in API or queue: ${localChar.name} (${localChar.uuid})`)
          }
        }
      }

      // Final deduplication pass (just in case)
      const seenUuids = new Set<string>()
      const dedupedCharacters: StoredCharacter[] = []
      for (const char of mergedCharacters) {
        const normalizedUuid = normalizeUuid(char.uuid)
        if (!seenUuids.has(normalizedUuid)) {
          seenUuids.add(normalizedUuid)
          dedupedCharacters.push(char)
        } else {
          console.log(`[CharacterSync] Removing duplicate character: ${char.name} (${char.uuid})`)
        }
      }

      // Save merged data to localStorage
      const mergedList: CharacterList = {
        characters: dedupedCharacters,
        active_uuid: localList.active_uuid,
        version: localList.version
      }

      // Validate and set active_uuid
      // If active_uuid is set but invalid, or if no active_uuid and characters exist, set to first character
      if (mergedList.active_uuid && !dedupedCharacters.some(c => c.uuid === mergedList.active_uuid)) {
        // Current active_uuid is invalid
        mergedList.active_uuid = dedupedCharacters.length > 0 ? dedupedCharacters[0].uuid : null
      } else if (!mergedList.active_uuid && dedupedCharacters.length > 0) {
        // No active_uuid set but characters exist - set to first character
        mergedList.active_uuid = dedupedCharacters[0].uuid
        console.log(`[CharacterSync] Set active character to: ${dedupedCharacters[0].name} (${dedupedCharacters[0].uuid})`)
      }

      saveCharacterList(mergedList)

      // Notify Foundry of update
      foundrySync.notifyCharacterUpdate()

      syncState.status = 'synced'
      syncState.lastSyncedAt = new Date().toISOString()
      syncState.error = null

      console.log(`[CharacterSync] Sync complete: ${apiCharacters.length} from API, ${dedupedCharacters.length} total after merge`)
      _syncInProgress = false
      return true
    } catch (error) {
      console.error('[CharacterSync] Pull error:', error)
      syncState.status = 'error'
      syncState.error = error instanceof Error ? error.message : 'Unknown error'
      _syncInProgress = false
      return false
    }
  }

  // Push a character change to the sync queue
  function pushChange(type: SyncQueueItem['type'], character: StoredCharacter): void {
    console.log(`[SD20 Sync] pushChange() type="${type}" uuid="${character.uuid}" name="${character.name}"`)
    queueSync(type, character.uuid, type !== 'delete' ? character : undefined)
  }

  // Force immediate sync
  async function forceSync(): Promise<void> {
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    await flushSyncQueue()
  }

  // Initialize sync (call on app mount)
  async function initSync(): Promise<void> {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        syncState.isOnline = true
        syncState.status = 'pending'
        scheduleSyncFlush()
      })
      window.addEventListener('offline', () => {
        syncState.isOnline = false
        syncState.status = 'offline'
      })
    }

    // Load pending changes count
    const queue = loadSyncQueue()
    syncState.pendingChanges = queue.length

    // Pull latest from API
    if (api.isAuthenticated()) {
      await pullFromApi()

      // Flush any pending local changes
      if (queue.length > 0) {
        await flushSyncQueue()
      }
    }

    // Mark initial sync as complete - components can now safely load from localStorage
    markInitialSyncComplete()
    console.log('[CharacterSync] Initial sync complete, components can now load characters')
  }

  // Check if sync is available
  function canSync(): boolean {
    return api.isAuthenticated() && syncState.isOnline
  }

  return {
    // State
    syncState: readonly(syncState),

    // Actions
    initSync,
    pullFromApi,
    pullFromApiLight,
    refreshSingleCharacter,
    pushChange,
    forceSync,
    canSync,

    // Queue management
    queueSync,
    flushSyncQueue
  }
}
