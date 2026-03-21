import { defineStore } from 'pinia'

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
  } as RootState),

  actions: {
    async getCompendium() {
      // Skip if already loaded
      if (this.isLoaded) return

      this.isLoading = true
      this.loadError = null
      const config = useRuntimeConfig()

      // Get auth token for campaign-filtered results
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('sd20_auth_token')
        : null
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Token ${token}`
      }

      try {
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
