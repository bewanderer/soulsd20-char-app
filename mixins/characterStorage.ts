// Character storage utility for localStorage persistence

// Character data structure
export interface StoredCharacter {
  uuid: string
  name: string
  gender: string
  level: number
  souls_level?: number
  physical_description?: string

  // Character creation choices (locked after finalization)
  background_id: number
  lineage_id: number
  bloodline_id: number | null
  is_finalized: boolean

  // Character stats and progression
  stats: {
    vitality: number
    endurance: number
    strength: number
    dexterity: number
    attunement: number
    intelligence: number
    faith: number
  }

  // Skills
  skills: {
    Athletics: number
    Acrobatics: number
    Perception: number
    FireKeeping: number
    Sanity: number
    Stealth: number
    Precision: number
    Diplomacy: number
  }

  // Knowledge
  knowledge: {
    Magics: number
    WorldHistory: number
    Monsters: number
    Cosmic: number
  }

  // HP tracking
  starting_hp: number
  level_hp: number
  health_die?: {
    count: number
    sides: number
  }
  current_hp: number
  current_fp: number
  current_ap: number
  temp_hp: number
  max_hp_bonus: number
  max_fp_bonus: number
  max_ap_bonus: number

  // Flasks
  hp_flask: number
  fp_flask: number
  flask_level: number

  // Dodge tracking
  total_dodges: number
  current_dodges: number

  // General tracking
  souls: number
  undying: number
  exhaustion: number
  firekeeping_checks: number
  attunement_slots: number

  // Calculated attribute overrides
  dodge_cost_override?: number | null
  dodge_distance_override?: number | null
  item_usage_cost_override?: number | null
  jump_horizontal_override?: number | null
  jump_vertical_override?: number | null
  running_jump_horizontal_override?: number | null
  running_jump_vertical_override?: number | null
  max_equip_load_override?: number | null

  // Equipment slot toggles
  enable_5th_ring_slot?: boolean
  enable_2nd_artifact_slot?: boolean

  // Status inflictions
  current_statuses: {
    Curse: number
    Frost: number
    Bleed: number
    Poison: number
    Toxic: number
    Poise: number
  }

  // Status bonuses
  bonus_statuses: {
    Curse: number
    Frost: number
    Bleed: number
    Poison: number
    Toxic: number
    Poise: number
  }

  // Damage Calculator - Bonus Resistances (Primary table)
  bonus_resistances?: {
    Physical: number
    Magic: number
    Fire: number
    Lightning: number
    Dark: number
    FlatPhysical: number
    FlatMagic: number
    FlatFire: number
    FlatLightning: number
    FlatDark: number
  }

  // Damage Calculator - Temporary Bonus Resistances (Bonus table)
  bonus_resistances_temp?: {
    Physical: number
    Magic: number
    Fire: number
    Lightning: number
    Dark: number
    FlatPhysical: number
    FlatMagic: number
    FlatFire: number
    FlatLightning: number
    FlatDark: number
  }

  // Damage Calculator - Bonus Resistances Active toggle
  bonus_resistances_active?: boolean

  // Resistances
  resistances: {
    Physical: number
    Magic: number
    Fire: number
    Lightning: number
    Dark: number
    PhysicalFlat: number
    MagicFlat: number
    FireFlat: number
    LightningFlat: number
    DarkFlat: number
  }

  // Combat settings
  combat_settings: {
    twoHandingMainHand: boolean
    twoHandingOffHand: boolean
    activeCompanionId: string | null
    mainHandModifications?: {
      isModified: boolean
      ap?: number
      dice?: any[]
      scaling?: any[]
      spell_scaling?: any[]
    }
    offHandModifications?: {
      isModified: boolean
      ap?: number
      dice?: any[]
      scaling?: any[]
      spell_scaling?: any[]
    }
  }

  // Field notes
  field_notes?: {
    [fieldKey: string]: string
  }

  // Equipment (all slots)
  equipment?: {
    MainHand: { id: number; category: string; name: string } | null
    OffHand: { id: number; category: string; name: string } | null
    Armor: { id: number; category: string; name: string } | null
    Artifact: { id: number; category: string; name: string } | null
    Artifact2: { id: number; category: string; name: string } | null
    Ring1: { id: number; category: string; name: string } | null
    Ring2: { id: number; category: string; name: string } | null
    Ring3: { id: number; category: string; name: string } | null
    Ring4: { id: number; category: string; name: string } | null
    Ring5: { id: number; category: string; name: string } | null
  }

  // Inventory
  inventory?: any[]

  // Spell system
  attuned_spells?: any[]
  learned_spells?: number[]
  spell_modifications?: Record<number, any>

  // Spirit system
  attuned_spirits?: any[]
  learned_spirits?: number[]
  spirit_modifications?: Record<number, any>

  // Weapon skills
  attuned_weapon_skills?: any[]
  learned_weapon_skills?: number[]
  weapon_skill_modifications?: Record<number, any>

  // Weapon modifications
  weapon_modifications?: Record<number, any>

  // Destined traits
  obtained_destined_traits?: any[]
  destined_trait_modifications?: Record<number, any>

  // Weapon proficiencies
  weapon_proficiency_points?: {
    total: number
    baseFromLevel: number
    customBonus: number
  }
  obtained_weapon_prof_feats?: any[]
  weapon_proficiencies?: {
    FIST: number
    DAGGER: number
    STRAIGHT_THRUST: number
    KATANA_CURVED: number
    ULTRA_GREAT_SWORD: number
    GREAT_AXE: number
    GREAT_HAMMER: number
    TWINBLADE: number
    SPEAR: number
    HALBERD: number
    REAPER: number
    WHIP: number
    CROSS_BOW: number
    GREAT_BOW_BALLISTA: number
    GUN: number
    SHIELD: number
    SORCERY: number
    MIRACLE: number
    PYROMANCY: number
    HEX: number
    SPIRIT_SUMMONING: number
    DUAL_WIELDING: number
  }

  // Cross-tree feat acquisition
  dual_wielding_feat_flags?: {
    skilled_wielder_used: boolean
    skilled_wielder_plus_used: boolean
    master_wielder_used: boolean
    master_wielder_plus_used: boolean
    master_wielder_plus_chose_fate: boolean
  }
  musical_instruments_feat_flags?: {
    skilled_artist_used: boolean
    master_artist_used: boolean
  }
  protege_flags?: {
    protege_1_lv3_obtained: boolean
    protege_1_lv5_used: boolean
    protege_1_lv5_postponed: boolean
    protege_1_postponed_trees: string[]
    protege_2_used: boolean
    protege_2_postponed: boolean
    protege_2_postponed_trees: string[]
    protege_3_used: boolean
    protege_3_postponed: boolean
    protege_3_postponed_trees: string[]
  }
  temporary_fate_points?: number
  fate_points?: number
  destiny_feat_slots?: number

  // Notes and Compendium (separate from notesStorage.ts)
  notes?: {
    sections: any[]
  }
  compendium?: {
    entries: any[]
  }

  // Companions
  companions?: any[]

  // Character image (base64 encoded)
  character_image_path?: string

  // Level up state
  pending_level_up?: any
  has_multi_proficient?: boolean
  multi_proficient_retroactive_points?: number

  // Metadata
  created_at: string
  last_played: string
}

export interface CharacterList {
  characters: StoredCharacter[]
  active_uuid: string | null
  version: string
}

const STORAGE_KEY = 'sd20_characters'
const MAX_CHARACTERS = 10
const STORAGE_VERSION = '1.0'

// Get all characters from localStorage
export function getAllCharacters(): CharacterList {
  if (typeof window === 'undefined') return { characters: [], active_uuid: null, version: STORAGE_VERSION }

  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    return { characters: [], active_uuid: null, version: STORAGE_VERSION }
  }

  try {
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to parse character data:', error)
    return { characters: [], active_uuid: null, version: STORAGE_VERSION }
  }
}

// Save character list to localStorage
export function saveCharacterList(list: CharacterList): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return true
  } catch (error) {
    console.error('Failed to save character list:', error)
    return false
  }
}

// Add new character
export function addCharacter(character: StoredCharacter): boolean {
  const list = getAllCharacters()

  if (list.characters.length >= MAX_CHARACTERS) {
    console.error('Maximum character limit reached')
    return false
  }

  list.characters.push(character)
  list.active_uuid = character.uuid

  return saveCharacterList(list)
}

// Update existing character
export function updateCharacter(uuid: string, updates: Partial<StoredCharacter>): boolean {
  const list = getAllCharacters()
  const index = list.characters.findIndex(c => c.uuid === uuid)

  if (index === -1) {
    console.error('Character not found:', uuid)
    return false
  }

  list.characters[index] = { ...list.characters[index], ...updates }
  list.characters[index].last_played = new Date().toISOString()

  return saveCharacterList(list)
}

// Delete character
export function deleteCharacter(uuid: string): boolean {
  const list = getAllCharacters()
  list.characters = list.characters.filter(c => c.uuid !== uuid)

  if (list.active_uuid === uuid) {
    list.active_uuid = list.characters.length > 0 ? list.characters[0].uuid : null
  }

  return saveCharacterList(list)
}

// Set active character
export function setActiveCharacter(uuid: string): boolean {
  const list = getAllCharacters()
  const character = list.characters.find(c => c.uuid === uuid)

  if (!character) {
    console.error('Character not found:', uuid)
    return false
  }

  list.active_uuid = uuid
  character.last_played = new Date().toISOString()

  return saveCharacterList(list)
}

// Get active character
export function getActiveCharacter(): StoredCharacter | null {
  const list = getAllCharacters()
  if (!list.active_uuid) return null

  return list.characters.find(c => c.uuid === list.active_uuid) || null
}

// Generate UUID for new characters
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Export character to JSON string
export function exportCharacter(uuid: string): string | null {
  const character = getAllCharacters().characters.find(c => c.uuid === uuid)
  if (!character) {
    console.error('Character not found for export:', uuid)
    return null
  }

  return JSON.stringify(character, null, 2)
}

// Import character from JSON string
export function importCharacter(jsonString: string): boolean {
  try {
    const character: StoredCharacter = JSON.parse(jsonString)

    // Validate required fields
    if (!character.uuid || !character.name || !character.gender || !character.background_id || !character.lineage_id) {
      console.error('Invalid character data: missing required fields')
      return false
    }

    const list = getAllCharacters()

    // Check if character limit reached
    if (list.characters.length >= MAX_CHARACTERS) {
      console.error('Maximum character limit reached')
      return false
    }

    // Check if UUID already exists
    if (list.characters.some(c => c.uuid === character.uuid)) {
      // Generate new UUID to avoid conflicts
      character.uuid = generateUUID()
    }

    // Update timestamps
    character.last_played = new Date().toISOString()

    list.characters.push(character)
    list.active_uuid = character.uuid

    return saveCharacterList(list)
  } catch (error) {
    console.error('Failed to import character:', error)
    return false
  }
}

// Export all characters to JSON string
export function exportAllCharacters(): string {
  const list = getAllCharacters()
  return JSON.stringify(list, null, 2)
}

// Import multiple characters from JSON string
export function importMultipleCharacters(jsonString: string): { success: number; failed: number } {
  try {
    const data = JSON.parse(jsonString)
    let importData: StoredCharacter[] = []

    // Handle both single character and character list formats
    if (data.characters && Array.isArray(data.characters)) {
      // Character list format
      importData = data.characters
    } else if (Array.isArray(data)) {
      // Array of characters
      importData = data
    } else {
      // Single character
      importData = [data]
    }

    // Get character list once before loop to accumulate all characters
    const list = getAllCharacters()
    let successCount = 0
    let failedCount = 0

    for (const character of importData) {
      // Validate required fields
      if (!character.uuid || !character.name || !character.gender || !character.background_id || !character.lineage_id) {
        failedCount++
        continue
      }

      // Check if character limit reached
      if (list.characters.length >= MAX_CHARACTERS) {
        failedCount++
        console.error('Maximum character limit reached')
        break
      }

      // Check if UUID already exists, generate new one if needed
      if (list.characters.some(c => c.uuid === character.uuid)) {
        character.uuid = generateUUID()
      }

      // Update timestamps
      character.last_played = new Date().toISOString()

      // Accumulate characters in the list
      list.characters.push(character)
      successCount++
    }

    // Save once at the end with all accumulated characters
    if (successCount > 0) {
      const saveSuccess = saveCharacterList(list)
      if (!saveSuccess) {
        console.error('Failed to save character list after bulk import')
        return { success: 0, failed: importData.length }
      }

      // Set last imported character as active
      if (list.characters.length > 0) {
        list.active_uuid = list.characters[list.characters.length - 1].uuid
      }
    }

    return { success: successCount, failed: failedCount }
  } catch (error) {
    console.error('Failed to import characters:', error)
    return { success: 0, failed: 1 }
  }
}

// Download character as JSON file
export function downloadCharacterAsFile(uuid: string): void {
  const json = exportCharacter(uuid)
  if (!json) return

  const character = getAllCharacters().characters.find(c => c.uuid === uuid)
  const filename = `${character?.name || 'character'}_${Date.now()}.json`

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Download all characters as JSON file
export function downloadAllCharactersAsFile(): void {
  const json = exportAllCharacters()
  const filename = `sd20_all_characters_${Date.now()}.json`

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Reset character to creation defaults (keeps identity, resets progression)
export function resetCharacter(uuid: string, backgroundStats: any): boolean {
  const list = getAllCharacters()
  const index = list.characters.findIndex(c => c.uuid === uuid)

  if (index === -1) {
    console.error('Character not found:', uuid)
    return false
  }

  const character = list.characters[index]

  // Reset to creation defaults but keep identity
  list.characters[index] = {
    // Keep identity fields
    uuid: character.uuid,
    name: character.name,
    gender: character.gender,
    physical_description: character.physical_description || '',
    background_id: character.background_id,
    lineage_id: character.lineage_id,
    bloodline_id: character.bloodline_id,
    is_finalized: character.is_finalized,
    created_at: character.created_at,
    last_played: new Date().toISOString(),

    // Reset progression to level 1
    level: 1,
    stats: {
      vitality: backgroundStats.vitality,
      endurance: backgroundStats.endurance,
      strength: backgroundStats.strength,
      dexterity: backgroundStats.dexterity,
      attunement: backgroundStats.attunement,
      intelligence: backgroundStats.intelligence,
      faith: backgroundStats.faith
    },

    // Reset skills to 0
    skills: {
      Athletics: 0,
      Acrobatics: 0,
      Perception: 0,
      FireKeeping: 0,
      Sanity: 0,
      Stealth: 0,
      Precision: 0,
      Diplomacy: 0
    },

    // Reset knowledge to 0
    knowledge: {
      Magics: 0,
      WorldHistory: 0,
      Monsters: 0,
      Cosmic: 0
    },

    // Reset HP tracking
    starting_hp: backgroundStats.starting_hp,
    level_hp: 0,
    health_die: { count: 1, sides: 6 },
    current_hp: backgroundStats.starting_hp,
    current_fp: 2,
    current_ap: 8,
    temp_hp: 0,
    max_hp_bonus: 0,
    max_fp_bonus: 0,
    max_ap_bonus: 0,

    // Reset flasks
    hp_flask: 4,
    fp_flask: 4,
    flask_level: 0,

    // Reset dodge tracking
    total_dodges: 0,
    current_dodges: 0,

    // Reset general tracking
    souls: 0,
    undying: 0,
    exhaustion: 0,
    firekeeping_checks: 0,
    attunement_slots: 0,

    // Reset status inflictions
    current_statuses: {
      Curse: 0,
      Frost: 0,
      Bleed: 0,
      Poison: 0,
      Toxic: 0,
      Poise: 0
    },

    // Reset status bonuses
    bonus_statuses: {
      Curse: 0,
      Frost: 0,
      Bleed: 0,
      Poison: 0,
      Toxic: 0,
      Poise: 0
    },

    // Reset resistances
    resistances: {
      Physical: 0,
      Magic: 0,
      Fire: 0,
      Lightning: 0,
      Dark: 0,
      PhysicalFlat: 0,
      MagicFlat: 0,
      FireFlat: 0,
      LightningFlat: 0,
      DarkFlat: 0
    },

    // Reset combat settings
    combat_settings: {
      twoHandingMainHand: false,
      twoHandingOffHand: false,
      activeCompanionId: null
    },

    // Reset field notes
    field_notes: {},

    // Clear equipment
    equipment: {
      MainHand: null,
      OffHand: null,
      Armor: null,
      Artifact: null,
      Artifact2: null,
      Ring1: null,
      Ring2: null,
      Ring3: null,
      Ring4: null,
      Ring5: null
    },

    // Clear inventory
    inventory: [],

    // Clear spell system
    attuned_spells: [],
    learned_spells: [],
    spell_modifications: {},

    // Clear spirit system
    attuned_spirits: [],
    learned_spirits: [],
    spirit_modifications: {},

    // Clear weapon skills
    attuned_weapon_skills: [],
    learned_weapon_skills: [],
    weapon_skill_modifications: {},

    // Clear weapon modifications
    weapon_modifications: {},

    // Clear destined traits
    obtained_destined_traits: [],
    destined_trait_modifications: {},

    // Reset weapon proficiencies
    weapon_proficiency_points: {
      total: 0,
      baseFromLevel: 0,
      customBonus: 0
    },
    obtained_weapon_prof_feats: [],
    weapon_proficiencies: {
      FIST: 0,
      DAGGER: 0,
      STRAIGHT_THRUST: 0,
      KATANA_CURVED: 0,
      ULTRA_GREAT_SWORD: 0,
      GREAT_AXE: 0,
      GREAT_HAMMER: 0,
      TWINBLADE: 0,
      SPEAR: 0,
      HALBERD: 0,
      REAPER: 0,
      WHIP: 0,
      CROSS_BOW: 0,
      GREAT_BOW_BALLISTA: 0,
      GUN: 0,
      SHIELD: 0,
      SORCERY: 0,
      MIRACLE: 0,
      PYROMANCY: 0,
      HEX: 0,
      SPIRIT_SUMMONING: 0,
      DUAL_WIELDING: 0
    },

    // Reset cross-tree feat acquisition flags
    dual_wielding_feat_flags: {
      skilled_wielder_used: false,
      skilled_wielder_plus_used: false,
      master_wielder_used: false,
      master_wielder_plus_used: false,
      master_wielder_plus_chose_fate: false
    },
    musical_instruments_feat_flags: {
      skilled_artist_used: false,
      master_artist_used: false
    },
    protege_flags: {
      protege_1_lv3_obtained: false,
      protege_1_lv5_used: false,
      protege_1_lv5_postponed: false,
      protege_1_postponed_trees: [],
      protege_2_used: false,
      protege_2_postponed: false,
      protege_2_postponed_trees: [],
      protege_3_used: false,
      protege_3_postponed: false,
      protege_3_postponed_trees: []
    },
    temporary_fate_points: 0,
    fate_points: 2,
    destiny_feat_slots: 1,

    // Clear notes and compendium
    notes: { sections: [] },
    compendium: { entries: [] },

    // Clear companions
    companions: [],

    // Clear level up state
    pending_level_up: null,
    has_multi_proficient: false,
    multi_proficient_retroactive_points: 0
  }

  return saveCharacterList(list)
}

// Migrate old characters to include weapon_proficiencies field
export function migrateCharacterData(): boolean {
  if (typeof window === 'undefined') return false

  const list = getAllCharacters()
  let migrated = false

  list.characters.forEach(character => {
    // Check if character is missing weapon_proficiencies
    if (!character.weapon_proficiencies) {
      character.weapon_proficiencies = {
        FIST: 0,
        DAGGER: 0,
        STRAIGHT_THRUST: 0,
        KATANA_CURVED: 0,
        ULTRA_GREAT_SWORD: 0,
        GREAT_AXE: 0,
        GREAT_HAMMER: 0,
        TWINBLADE: 0,
        SPEAR: 0,
        HALBERD: 0,
        REAPER: 0,
        WHIP: 0,
        CROSS_BOW: 0,
        GREAT_BOW_BALLISTA: 0,
        GUN: 0,
        SHIELD: 0,
        SORCERY: 0,
        MIRACLE: 0,
        PYROMANCY: 0,
        HEX: 0,
        SPIRIT_SUMMONING: 0,
        DUAL_WIELDING: 0
      }
      migrated = true
      console.log(`Migrated character: ${character.name} - added weapon_proficiencies`)
    }
  })

  if (migrated) {
    const success = saveCharacterList(list)
    if (success) {
      console.log('Character data migration completed successfully')
    }
    return success
  }

  return true
}
