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
  Bloodlines: any[]
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
    Bloodlines: []
  } as RootState),

  actions: {
    async getCompendium() {
      const config = useRuntimeConfig()

      try {
        const weaponFeatsData: any[] = await $fetch(config.public.API_BASE_URL + '/weaponProfFeat/', {
          method: 'GET',
        })
        this.WeaponFeats = weaponFeatsData

        const destinyFeatsData: any[] = await $fetch(config.public.API_BASE_URL + '/destinyFeat/', {
          method: 'GET',
        })
        this.DestinyFeats = destinyFeatsData

        const weaponSkillsData: any[] = await $fetch(config.public.API_BASE_URL + '/weaponSkill/', {
          method: 'GET',
        })
        this.WeaponSkills = weaponSkillsData

        const spellsData: any[] = await $fetch(config.public.API_BASE_URL + '/spell/', {
          method: 'GET',
        })
        this.Spells = spellsData

        const spiritsData: any[] = await $fetch(config.public.API_BASE_URL + '/spirit/', {
          method: 'GET',
        })
        this.Spirits = spiritsData

        const itemsData: any[] = await $fetch(config.public.API_BASE_URL + '/item/', {
          method: 'GET',
        })
        this.Items = itemsData

        const ringsData: any[] = await $fetch(config.public.API_BASE_URL + '/ring/', {
          method: 'GET',
        })
        this.Rings = ringsData

        const artifactsData: any[] = await $fetch(config.public.API_BASE_URL + '/artifact/', {
          method: 'GET',
        })
        this.Artifacts = artifactsData

        const armorsData: any[] = await $fetch(config.public.API_BASE_URL + '/armor/', {
          method: 'GET',
        })
        this.Armors = armorsData

        const weaponsData: any[] = await $fetch(config.public.API_BASE_URL + '/weapon/', {
          method: 'GET',
        })
        this.Weapons = weaponsData

        const backgroundsData: any[] = await $fetch(config.public.API_BASE_URL + '/backgrounds/', {
          method: 'GET',
        })
        this.Backgrounds = backgroundsData

        const lineagesData: any[] = await $fetch(config.public.API_BASE_URL + '/lineages/', {
          method: 'GET',
        })
        this.Lineages = lineagesData

        const bloodlinesData: any[] = await $fetch(config.public.API_BASE_URL + '/bloodlines/', {
          method: 'GET',
        })
        this.Bloodlines = bloodlinesData

        console.log('Compendium loaded successfully:', {
          backgrounds: this.Backgrounds.length,
          lineages: this.Lineages.length,
          bloodlines: this.Bloodlines.length
        })
      } catch (error) {
        console.error('Failed to fetch compendium data:', error)
        throw error
      }
    },

    createItem(item: any) {
      this.Items.push(item)
    },

    // Get background by ID
    getBackgroundById(id: number) {
      return this.Backgrounds.find(b => b.id === id)
    },

    // Get lineage by ID (includes nested bloodlines)
    getLineageById(id: number) {
      return this.Lineages.find(l => l.id === id)
    },

    // Get bloodline by ID
    getBloodlineById(id: number) {
      return this.Bloodlines.find(b => b.id === id)
    },

    // Get bloodlines for a specific lineage
    getBloodlinesForLineage(lineageId: number) {
      const lineage = this.getLineageById(lineageId)
      return lineage?.bloodlines || []
    }
  }
})