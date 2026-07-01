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

// Item 7 (Batch C): version-aware cache with per-layer refetch.
//
// Server exposes GET /api/compendium/versions/ returning:
//   { core: <int>, campaigns: { <uuid>: <int>, ... } }
//
// The 8 campaign-filtered endpoints accept ?layer=core and ?campaign=<uuid>
// query params. The 5 always-official endpoints (weaponProfFeat, destinyFeat,
// backgrounds, lineages, bloodlines) have no per-campaign concept and always
// return their full official set.
//
// On load:
//   - Fetch versions.
//   - Compare to cached versions per layer.
//   - If nothing changed: use cached arrays, zero fetches.
//   - If only core changed: refetch the 5 always-official endpoints + the 8
//     campaign-filtered endpoints with ?layer=core, merge into cache leaving
//     other campaigns' items intact.
//   - If only campaign X changed: refetch the 8 campaign-filtered endpoints
//     with ?campaign=X, merge into cache leaving core + other campaigns intact.
//   - If both changed: do both passes.
//   - No cache at all: full baseline fetch.
const CACHE_STORAGE_KEY = 'sd20_compendium_cache_v2'

const CAMPAIGN_FILTERED_ENDPOINTS: Array<{ key: keyof RootState; path: string }> = [
  { key: 'WeaponSkills', path: '/weaponSkill/' },
  { key: 'Spells', path: '/spell/' },
  { key: 'Spirits', path: '/spirit/' },
  { key: 'Items', path: '/item/' },
  { key: 'Rings', path: '/ring/' },
  { key: 'Artifacts', path: '/artifact/' },
  { key: 'Armors', path: '/armor/' },
  { key: 'Weapons', path: '/weapon/' },
]

const ALWAYS_OFFICIAL_ENDPOINTS: Array<{ key: keyof RootState; path: string }> = [
  { key: 'WeaponFeats', path: '/weaponProfFeat/' },
  { key: 'DestinyFeats', path: '/destinyFeat/' },
  { key: 'Backgrounds', path: '/backgrounds/' },
  { key: 'Lineages', path: '/lineages/' },
  { key: 'Bloodlines', path: '/bloodlines/' },
]

type CompendiumCachePayload = {
  versions: CompendiumVersions
  data: Record<string, any[]>
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
    console.warn('[SD20 Compendium] Failed to persist cache:', err)
  }
}

function diffVersions(server: CompendiumVersions, cached: CompendiumVersions | null): {
  coreChanged: boolean
  changedCampaigns: string[]
  removedCampaigns: string[]
} {
  if (!cached) {
    return {
      coreChanged: true,
      changedCampaigns: Object.keys(server.campaigns),
      removedCampaigns: [],
    }
  }
  const coreChanged = server.core !== cached.core
  const changedCampaigns: string[] = []
  for (const [uuid, ver] of Object.entries(server.campaigns)) {
    if (cached.campaigns[uuid] !== ver) changedCampaigns.push(uuid)
  }
  const removedCampaigns: string[] = []
  for (const uuid of Object.keys(cached.campaigns)) {
    if (server.campaigns[uuid] === undefined) removedCampaigns.push(uuid)
  }
  return { coreChanged, changedCampaigns, removedCampaigns }
}

async function _fetchLayer(base: string, path: string, params: string, headers: Record<string, string>): Promise<any[]> {
  const url = base + path + (params ? `?${params}` : '')
  return await $fetch<any[]>(url, { headers })
}

function _stripLayerFromCached(cachedArr: any[] | undefined, mode: 'core' | 'campaign', campaignUuid?: string): any[] {
  if (!Array.isArray(cachedArr)) return []
  if (mode === 'core') {
    return cachedArr.filter(item => !item.is_official)
  }
  if (mode === 'campaign' && campaignUuid !== undefined) {
    return cachedArr.filter(item => String(item.campaign) !== String(campaignUuid))
  }
  return cachedArr
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
      if (this.isLoaded) return

      this.isLoading = true
      this.loadError = null
      const config = useRuntimeConfig()
      const base = config.public.API_BASE_URL as string

      const token = typeof window !== 'undefined' ? localStorage.getItem('sd20_auth_token') : null
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Token ${token}`

      try {
        let serverVersions: CompendiumVersions | null = null
        try {
          serverVersions = await $fetch<CompendiumVersions>(`${base}/versions/`, { headers })
        } catch (err) {
          console.warn('[SD20 Compendium] Version check failed, falling through to full fetch:', err)
        }

        const cache = readCache()
        const cachedVersions = cache?.versions || null

        if (serverVersions && cache) {
          const diff = diffVersions(serverVersions, cachedVersions)

          if (!diff.coreChanged && diff.changedCampaigns.length === 0 && diff.removedCampaigns.length === 0) {
            this._applyCache(cache.data)
            this.versions = serverVersions
            this.isLoaded = true
            this.isLoading = false
            console.log('[SD20 Compendium] Cache HIT (all versions match), zero fetches')
            return
          }

          console.log('[SD20 Compendium] Granular refetch:', diff)
          const nextData: Record<string, any[]> = { ...cache.data }

          // Removed campaigns: drop their items from every campaign-filtered layer.
          for (const uuid of diff.removedCampaigns) {
            for (const { key } of CAMPAIGN_FILTERED_ENDPOINTS) {
              nextData[key] = _stripLayerFromCached(nextData[key], 'campaign', uuid)
            }
          }

          // Core changed: refetch the 5 always-official endpoints and the 8
          // campaign-filtered endpoints with ?layer=core. Merge.
          if (diff.coreChanged) {
            const alwaysOfficial = await Promise.all(
              ALWAYS_OFFICIAL_ENDPOINTS.map(({ path }) => _fetchLayer(base, path, '', headers))
            )
            ALWAYS_OFFICIAL_ENDPOINTS.forEach(({ key }, i) => {
              nextData[key] = alwaysOfficial[i]
            })
            const coreOnly = await Promise.all(
              CAMPAIGN_FILTERED_ENDPOINTS.map(({ path }) => _fetchLayer(base, path, 'layer=core', headers))
            )
            CAMPAIGN_FILTERED_ENDPOINTS.forEach(({ key }, i) => {
              const kept = _stripLayerFromCached(nextData[key], 'core')
              nextData[key] = coreOnly[i].concat(kept)
            })
          }

          // Each changed campaign: refetch the 8 campaign-filtered endpoints
          // with ?campaign=<uuid>. Replace only that campaign's items.
          for (const uuid of diff.changedCampaigns) {
            const results = await Promise.all(
              CAMPAIGN_FILTERED_ENDPOINTS.map(({ path }) => _fetchLayer(base, path, `campaign=${encodeURIComponent(uuid)}`, headers))
            )
            CAMPAIGN_FILTERED_ENDPOINTS.forEach(({ key }, i) => {
              const kept = _stripLayerFromCached(nextData[key], 'campaign', uuid)
              nextData[key] = kept.concat(results[i])
            })
          }

          this._applyCache(nextData)
          this.versions = serverVersions
          writeCache({ versions: serverVersions, data: nextData, storedAt: Date.now() })
          this.isLoaded = true
          this.isLoading = false
          return
        }

        // No cache OR no version response: full baseline fetch.
        console.log('[SD20 Compendium] Full baseline fetch (no cache or no version response)')

        const [
          weaponFeats, destinyFeats, weaponSkills, spells, spirits,
          items, rings, artifacts, armors, weapons,
          backgrounds, lineages, bloodlines
        ] = await Promise.all([
          $fetch<any[]>(base + '/weaponProfFeat/', { headers }),
          $fetch<any[]>(base + '/destinyFeat/', { headers }),
          $fetch<any[]>(base + '/weaponSkill/', { headers }),
          $fetch<any[]>(base + '/spell/', { headers }),
          $fetch<any[]>(base + '/spirit/', { headers }),
          $fetch<any[]>(base + '/item/', { headers }),
          $fetch<any[]>(base + '/ring/', { headers }),
          $fetch<any[]>(base + '/artifact/', { headers }),
          $fetch<any[]>(base + '/armor/', { headers }),
          $fetch<any[]>(base + '/weapon/', { headers }),
          $fetch<any[]>(base + '/backgrounds/', { headers }),
          $fetch<any[]>(base + '/lineages/', { headers }),
          $fetch<any[]>(base + '/bloodlines/', { headers }),
        ])

        const data: Record<string, any[]> = {
          WeaponFeats: weaponFeats, DestinyFeats: destinyFeats, WeaponSkills: weaponSkills,
          Spells: spells, Spirits: spirits, Items: items, Rings: rings,
          Artifacts: artifacts, Armors: armors, Weapons: weapons,
          Backgrounds: backgrounds, Lineages: lineages, Bloodlines: bloodlines,
        }
        this._applyCache(data)
        this.versions = serverVersions
        if (serverVersions) {
          writeCache({ versions: serverVersions, data, storedAt: Date.now() })
        }
        this.isLoaded = true
        this.isLoading = false
      } catch (error) {
        console.error('[SD20 Compendium] Failed to fetch:', error)
        this.isLoading = false
        this.loadError = 'Failed to load game data'
        throw error
      }
    },

    _applyCache(data: Record<string, any[]>) {
      this.WeaponFeats = data.WeaponFeats || []
      this.DestinyFeats = data.DestinyFeats || []
      this.WeaponSkills = data.WeaponSkills || []
      this.Spells = data.Spells || []
      this.Spirits = data.Spirits || []
      this.Items = data.Items || []
      this.Rings = data.Rings || []
      this.Artifacts = data.Artifacts || []
      this.Armors = data.Armors || []
      this.Weapons = data.Weapons || []
      this.Backgrounds = data.Backgrounds || []
      this.Lineages = data.Lineages || []
      this.Bloodlines = data.Bloodlines || []
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
