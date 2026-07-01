import { defineStore } from 'pinia'

type CompendiumVersions = {
  core: number
  campaigns: Record<string, number>
}

type RootState = {
  WeaponFeats: any[],
  DestinyFeats: any[],
  WeaponSkills: any[],
  Spells: any[],
  Spirits: any[],
  Items: any[],
  Rings: any[],
  Artifacts: any[],
  Armors: any[],
  Weapons: any[],
  Backgrounds: any[],
  Lineages: any[],
  Bloodlines: any[],
  isLoading: boolean,
  isLoaded: boolean,
  loadError: string | null,
  versions: CompendiumVersions | null,
}

// Optimization 7: version-aware cache.
//
// Server exposes GET /api/compendium/versions/ returning:
//   { core: <int>, campaigns: { <uuid>: <int>, ... } }
//
// Bumps whenever an item on that layer is created, edited, or deleted.
//
// Client caches the full merged compendium arrays plus a versions snapshot in
// localStorage. On load:
//   - Fetch versions (small).
//   - If cached versions match, use cached arrays and skip ALL data fetches.
//   - If any version changed (or no cache), refetch the 13 data endpoints and
//     replace the cache.
//
// The API also supports ?layer=core and ?campaign=<uuid> query params for
// per-layer fetching, which is a future optimization. This implementation
// takes the simpler "fetch everything when anything changed" approach because
// (a) the win from skipping fetches when nothing changed is the dominant
// benefit and (b) mixing per-layer fetching with the always-official endpoints
// (backgrounds, lineages, bloodlines, weaponProfFeat, destinyFeat) adds
// non-trivial complexity for a marginal further win.
const CACHE_STORAGE_KEY = 'sd20_compendium_cache_v1'

type CompendiumCachePayload = {
  versions: CompendiumVersions
  data: {
    WeaponFeats: any[]
    DestinyFeats: any[]
    WeaponSkills: any[]
    Spells: any[]
    Spirits: any[]
    Items: any[]
    Rings: any[]
    Artifacts: any[]
    Armors: any[]
    Weapons: any[]
    Backgrounds: any[]
    Lineages: any[]
    Bloodlines: any[]
  }
  storedAt: number
}

function readCache(): CompendiumCachePayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.versions || !parsed.data) return null
    return parsed as CompendiumCachePayload
  } catch {
    return null
  }
}

function writeCache(payload: CompendiumCachePayload) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    // localStorage may be full or blocked. Cache is a best-effort optimization.
    console.warn('[SD20 Compendium] Failed to persist cache:', err)
  }
}

function sameVersions(a: CompendiumVersions | null, b: CompendiumVersions | null): boolean {
  if (!a || !b) return false
  if (a.core !== b.core) return false
  const aKeys = Object.keys(a.campaigns).sort()
  const bKeys = Object.keys(b.campaigns).sort()
  if (aKeys.length !== bKeys.length) return false
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false
    if (a.campaigns[aKeys[i]] !== b.campaigns[bKeys[i]]) return false
  }
  return true
}

export const useCompendiumStore = defineStore({
  id: 'compendiumStore',
  state: () => ({
    WeaponFeats: [],
    DestinyFeats: [],
    WeaponSkills: [],
    Spells: [],
    Spirits: [],
    Items: [],
    Rings: [],
    Artifacts: [],
    Armors: [],
    Weapons: [],
    Backgrounds: [],
    Lineages: [],
    Bloodlines: [],
    isLoading: false,
    isLoaded: false,
    loadError: null,
    versions: null,
  } as RootState),

  actions: {
    async getCompendium() {
      // Skip if already loaded in this session
      if (this.isLoaded) return

      this.isLoading = true
      this.loadError = null
      const config = useRuntimeConfig()

      const token = typeof window !== 'undefined'
        ? localStorage.getItem('sd20_auth_token')
        : null
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Token ${token}`
      }

      try {
        // Optimization 7: check server versions before any data fetch.
        let serverVersions: CompendiumVersions | null = null
        try {
          serverVersions = await $fetch<CompendiumVersions>(
            config.public.API_BASE_URL + '/versions/',
            { headers }
          )
        } catch (err) {
          console.warn('[SD20 Compendium] Version check failed, falling through to full fetch:', err)
        }

        // Try the cache. If server versions match cached versions we can skip
        // all 13 data fetches. Failure to read the cache falls through to
        // network as if there was no cache.
        if (serverVersions) {
          const cache = readCache()
          if (cache && sameVersions(serverVersions, cache.versions)) {
            console.log('[SD20 Compendium] Cache HIT, skipping 13 data fetches')
            this.WeaponFeats = cache.data.WeaponFeats
            this.DestinyFeats = cache.data.DestinyFeats
            this.WeaponSkills = cache.data.WeaponSkills
            this.Spells = cache.data.Spells
            this.Spirits = cache.data.Spirits
            this.Items = cache.data.Items
            this.Rings = cache.data.Rings
            this.Artifacts = cache.data.Artifacts
            this.Armors = cache.data.Armors
            this.Weapons = cache.data.Weapons
            this.Backgrounds = cache.data.Backgrounds
            this.Lineages = cache.data.Lineages
            this.Bloodlines = cache.data.Bloodlines
            this.versions = serverVersions
            this.isLoaded = true
            this.isLoading = false
            return
          }
        }

        console.log('[SD20 Compendium] Cache MISS or version changed, fetching all endpoints')

        const [
          weaponFeats, destinyFeats, weaponSkills, spells, spirits,
          items, rings, artifacts, armors, weapons,
          backgrounds, lineages, bloodlines
        ] = await Promise.all([
          $fetch<any[]>(config.public.API_BASE_URL + '/weaponProfFeat/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/destinyFeat/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/weaponSkill/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/spell/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/spirit/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/item/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/ring/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/artifact/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/armor/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/weapon/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/backgrounds/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/lineages/', { headers }),
          $fetch<any[]>(config.public.API_BASE_URL + '/bloodlines/', { headers }),
        ])

        this.WeaponFeats = weaponFeats
        this.DestinyFeats = destinyFeats
        this.WeaponSkills = weaponSkills
        this.Spells = spells
        this.Spirits = spirits
        this.Items = items
        this.Rings = rings
        this.Artifacts = artifacts
        this.Armors = armors
        this.Weapons = weapons
        this.Backgrounds = backgrounds
        this.Lineages = lineages
        this.Bloodlines = bloodlines
        this.versions = serverVersions

        if (serverVersions) {
          writeCache({
            versions: serverVersions,
            data: {
              WeaponFeats: weaponFeats,
              DestinyFeats: destinyFeats,
              WeaponSkills: weaponSkills,
              Spells: spells,
              Spirits: spirits,
              Items: items,
              Rings: rings,
              Artifacts: artifacts,
              Armors: armors,
              Weapons: weapons,
              Backgrounds: backgrounds,
              Lineages: lineages,
              Bloodlines: bloodlines,
            },
            storedAt: Date.now(),
          })
        }

        this.isLoaded = true
        this.isLoading = false

        console.log('[SD20 Compendium] Loaded:', {
          backgrounds: this.Backgrounds.length,
          lineages: this.Lineages.length,
          bloodlines: this.Bloodlines.length,
          weapons: this.Weapons.length,
          skills: this.WeaponSkills.length,
        })
      } catch (error) {
        console.error('[SD20 Compendium] Failed to fetch:', error)
        this.isLoading = false
        this.loadError = 'Failed to load game data'
        throw error
      }
    },

    createItem(item: any) {
      this.Items.push(item)
    },

    getBackgroundById(id: number) {
      return this.Backgrounds.find(b => b.id === id)
    },

    getLineageById(id: number) {
      return this.Lineages.find(l => l.id === id)
    },

    getBloodlineById(id: number) {
      return this.Bloodlines.find(b => b.id === id)
    },

    getBloodlinesForLineage(lineageId: number) {
      return this.Bloodlines.filter(b => b.lineage === lineageId)
    },
  }
})
