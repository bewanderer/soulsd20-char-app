/**
 * Character API composable for syncing characters with the Django backend.
 * Handles data transformation between localStorage format and API format.
 */

import type { StoredCharacter } from '~/mixins/characterStorage'
import { useApi, type ApiResponse } from './useApi'
import { useCompendiumStore } from '~/store/compendium'

// API character format (normalized structure from Django)
export interface ApiCharacter {
  id: string
  name: string
  gender: string
  physical_description: string
  level: number
  souls_level: number
  background_id: number
  lineage_id: number
  bloodline_id: number | null
  is_finalized: boolean
  is_active: boolean
  image_url: string | null
  owner?: { id: number; username: string }
  created_at: string
  updated_at: string
  last_played: string

  // One-to-One nested data
  stats?: {
    vitality: number
    endurance: number
    strength: number
    dexterity: number
    attunement: number
    intelligence: number
    faith: number
  }
  creation_stats?: {
    vitality: number
    endurance: number
    strength: number
    dexterity: number
    attunement: number
    intelligence: number
    faith: number
    starting_hp: number
  }
  skills?: {
    athletics: number
    acrobatics: number
    perception: number
    fire_keeping: number
    sanity: number
    stealth: number
    precision: number
    diplomacy: number
  }
  knowledge?: {
    magics: number
    world_history: number
    monsters: number
    cosmic: number
  }
  resources?: {
    starting_hp: number
    level_hp: number
    current_hp: number
    temp_hp: number
    max_hp_bonus: number
    health_die_count: number
    health_die_sides: number
    current_fp: number
    current_ap: number
    max_fp_bonus: number
    max_ap_bonus: number
    hp_flask: number
    fp_flask: number
    flask_level: number
    total_dodges: number
    current_dodges: number
    souls: number
    undying: number
    exhaustion: number
    firekeeping_checks: number
    attunement_slots: number
    fate_points: number
    temporary_fate_points: number
  }
  resistances?: {
    physical: number
    magic: number
    fire: number
    lightning: number
    dark: number
    physical_flat: number
    magic_flat: number
    fire_flat: number
    lightning_flat: number
    dark_flat: number
    bonus_physical: number
    bonus_magic: number
    bonus_fire: number
    bonus_lightning: number
    bonus_dark: number
    bonus_physical_flat: number
    bonus_magic_flat: number
    bonus_fire_flat: number
    bonus_lightning_flat: number
    bonus_dark_flat: number
    temp_physical: number
    temp_magic: number
    temp_fire: number
    temp_lightning: number
    temp_dark: number
    temp_physical_flat: number
    temp_magic_flat: number
    temp_fire_flat: number
    temp_lightning_flat: number
    temp_dark_flat: number
    bonus_resistances_active: boolean
  }
  statuses?: {
    curse: number
    frost: number
    bleed: number
    poison: number
    toxic: number
    poise: number
    bonus_curse: number
    bonus_frost: number
    bonus_bleed: number
    bonus_poison: number
    bonus_toxic: number
    bonus_poise: number
  }
  combat_settings?: {
    two_handing_main_hand: boolean
    two_handing_off_hand: boolean
    active_companion_id: string | null
    dodge_cost_override: number | null
    dodge_distance_override: number | null
    item_usage_cost_override: number | null
    jump_horizontal_override: number | null
    jump_vertical_override: number | null
    running_jump_horizontal_override: number | null
    running_jump_vertical_override: number | null
    max_equip_load_override: number | null
    undying_dc_override: number | null
    undying_roll_mod_override: number | null
    enable_5th_ring_slot: boolean
    enable_2nd_artifact_slot: boolean
  }
  proficiency_points?: {
    total: number
    base_from_level: number
    custom_bonus: number
  }
  misc_data?: {
    notes: Record<string, unknown>
    field_notes: Record<string, string>
    compendium_entries: unknown[]
    pending_level_up: unknown | null
    has_multi_proficient: boolean
    multi_proficient_retroactive_points: number
    dual_wielding_feat_flags: Record<string, boolean>
    musical_instruments_feat_flags: Record<string, boolean>
    halberd_feat_flags: Record<string, boolean>
    protege_flags: Record<string, unknown>
  }

  // One-to-Many nested data
  equipment_slots?: Array<{
    id?: number
    slot_type: string
    item_id: number
    item_category: string
    item_name: string
    modifications: Record<string, unknown>
  }>
  weapon_proficiencies?: Array<{
    weapon_tree: string
    level: number
  }>
  learned_spells?: Array<{
    spell_id: number
    modifications: Record<string, unknown>
  }>
  attuned_spells?: Array<{
    spell_id: number
    slot_number: number
  }>
  learned_spirits?: Array<{
    spirit_id: number
    modifications: Record<string, unknown>
  }>
  attuned_spirits?: Array<{
    spirit_id: number
    slot_number: number
  }>
  learned_weapon_skills?: Array<{
    skill_id: number
    modifications: Record<string, unknown>
  }>
  attuned_weapon_skills?: Array<{
    skill_id: number
    slot_number: number
  }>
  obtained_feats?: Array<{
    feat_id: number
    feat_type: string
    weapon_tree: string
    source: string
    source_feat_id: number | null
    is_greyed_out: boolean
    modifications: Record<string, unknown>
  }>
  companions?: Array<{
    id: string
    name: string
    companion_type: string
    hp: number | null
    fp: number | null
    ap: number | null
    athletics: number
    acrobatics: number
    perception: number
    fire_keeping: number
    sanity: number
    stealth: number
    precision: number
    diplomacy: number
    physical: number
    magic: number
    fire: number
    lightning: number
    dark: number
    frost: number
    bleed: number
    poison: number
    toxic: number
    curse: number
    poise: number
    notes: string
  }>
  inventory_items?: Array<{
    item_id: number
    item_category: string
    item_name: string
    quantity: number
  }>
}

export function useCharacterApi() {
  const api = useApi()

  // Fetch all characters from API
  async function fetchCharacters(): Promise<ApiResponse<ApiCharacter[]>> {
    return api.get<ApiCharacter[]>('/api/characters/')
  }

  // Fetch single character detail
  async function fetchCharacter(uuid: string): Promise<ApiResponse<ApiCharacter>> {
    return api.get<ApiCharacter>(`/api/characters/${uuid}/`)
  }

  // Create a new character
  async function createCharacter(character: Partial<ApiCharacter>): Promise<ApiResponse<ApiCharacter>> {
    return api.post<ApiCharacter>('/api/characters/', character)
  }

  // Update a character (partial update)
  async function updateCharacter(uuid: string, updates: Partial<ApiCharacter>): Promise<ApiResponse<ApiCharacter>> {
    return api.patch<ApiCharacter>(`/api/characters/${uuid}/`, updates)
  }

  // Delete a character (soft delete)
  async function deleteCharacter(uuid: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/api/characters/${uuid}/`)
  }

  // Export character
  async function exportCharacter(uuid: string): Promise<ApiResponse<ApiCharacter>> {
    return api.get<ApiCharacter>(`/api/characters/${uuid}/export/`)
  }

  // Import character
  async function importCharacter(data: Partial<ApiCharacter>): Promise<ApiResponse<ApiCharacter>> {
    return api.post<ApiCharacter>('/api/characters/import/', data)
  }

  // Equipment endpoints
  async function equipItem(uuid: string, data: {
    slot_type: string
    item_id: number
    item_category: string
    item_name: string
    modifications?: Record<string, unknown>
  }): Promise<ApiResponse<unknown>> {
    return api.post(`/api/characters/${uuid}/equip/`, data)
  }

  async function unequipItem(uuid: string, slotType: string): Promise<ApiResponse<unknown>> {
    return api.post(`/api/characters/${uuid}/unequip/`, { slot_type: slotType })
  }

  // Proficiency endpoints
  async function updateProficiency(uuid: string, weaponTree: string, level: number): Promise<ApiResponse<unknown>> {
    return api.post(`/api/characters/${uuid}/proficiency/`, { weapon_tree: weaponTree, level })
  }

  // Spell endpoints
  async function learnSpell(uuid: string, spellId: number, modifications?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return api.post(`/api/characters/${uuid}/spell/learn/`, { spell_id: spellId, modifications })
  }

  async function unlearnSpell(uuid: string, spellId: number): Promise<ApiResponse<unknown>> {
    return api.post(`/api/characters/${uuid}/spell/unlearn/`, { spell_id: spellId })
  }

  async function attuneSpell(uuid: string, spellId: number, slotNumber: number): Promise<ApiResponse<unknown>> {
    return api.post(`/api/characters/${uuid}/spell/attune/`, { spell_id: spellId, slot_number: slotNumber })
  }

  async function unattuneSpell(uuid: string, slotNumber: number): Promise<ApiResponse<unknown>> {
    return api.post(`/api/characters/${uuid}/spell/unattune/`, { slot_number: slotNumber })
  }

  // Transform localStorage format to API format
  function toApiFormat(local: StoredCharacter): Partial<ApiCharacter> {
    return {
      id: local.uuid, // Include UUID so backend uses client-generated ID
      name: local.name,
      gender: local.gender,
      physical_description: local.physical_description || '',
      level: local.level,
      souls_level: local.souls_level || 0,
      background_id: local.background_id,
      lineage_id: local.lineage_id,
      bloodline_id: local.bloodline_id,
      is_finalized: local.is_finalized,
      image_url: extractImageUrl(local.character_image_path),

      stats: local.stats,
      creation_stats: local.creation_stats ? {
        ...local.creation_stats,
        starting_hp: local.creation_starting_hp || local.starting_hp
      } : undefined,
      skills: {
        athletics: local.skills.Athletics,
        acrobatics: local.skills.Acrobatics,
        perception: local.skills.Perception,
        fire_keeping: local.skills.FireKeeping,
        sanity: local.skills.Sanity,
        stealth: local.skills.Stealth,
        precision: local.skills.Precision,
        diplomacy: local.skills.Diplomacy
      },
      knowledge: {
        magics: local.knowledge.Magics,
        world_history: local.knowledge.WorldHistory,
        monsters: local.knowledge.Monsters,
        cosmic: local.knowledge.Cosmic
      },
      resources: {
        starting_hp: local.starting_hp,
        level_hp: local.level_hp,
        current_hp: local.current_hp,
        temp_hp: local.temp_hp,
        max_hp_bonus: local.max_hp_bonus,
        health_die_count: local.health_die?.count || 1,
        health_die_sides: local.health_die?.sides || 6,
        current_fp: local.current_fp,
        current_ap: local.current_ap,
        max_fp_bonus: local.max_fp_bonus,
        max_ap_bonus: local.max_ap_bonus,
        hp_flask: local.hp_flask,
        fp_flask: local.fp_flask,
        flask_level: local.flask_level,
        total_dodges: local.total_dodges,
        current_dodges: local.current_dodges,
        souls: local.souls,
        undying: local.undying,
        exhaustion: local.exhaustion,
        firekeeping_checks: local.firekeeping_checks,
        attunement_slots: local.attunement_slots,
        fate_points: local.fate_points || 2,
        temporary_fate_points: local.temporary_fate_points || 0
      },
      resistances: {
        physical: local.resistances.Physical,
        magic: local.resistances.Magic,
        fire: local.resistances.Fire,
        lightning: local.resistances.Lightning,
        dark: local.resistances.Dark,
        physical_flat: local.resistances.PhysicalFlat,
        magic_flat: local.resistances.MagicFlat,
        fire_flat: local.resistances.FireFlat,
        lightning_flat: local.resistances.LightningFlat,
        dark_flat: local.resistances.DarkFlat,
        bonus_physical: local.bonus_resistances?.Physical || 0,
        bonus_magic: local.bonus_resistances?.Magic || 0,
        bonus_fire: local.bonus_resistances?.Fire || 0,
        bonus_lightning: local.bonus_resistances?.Lightning || 0,
        bonus_dark: local.bonus_resistances?.Dark || 0,
        bonus_physical_flat: local.bonus_resistances?.FlatPhysical || 0,
        bonus_magic_flat: local.bonus_resistances?.FlatMagic || 0,
        bonus_fire_flat: local.bonus_resistances?.FlatFire || 0,
        bonus_lightning_flat: local.bonus_resistances?.FlatLightning || 0,
        bonus_dark_flat: local.bonus_resistances?.FlatDark || 0,
        temp_physical: local.bonus_resistances_temp?.Physical || 0,
        temp_magic: local.bonus_resistances_temp?.Magic || 0,
        temp_fire: local.bonus_resistances_temp?.Fire || 0,
        temp_lightning: local.bonus_resistances_temp?.Lightning || 0,
        temp_dark: local.bonus_resistances_temp?.Dark || 0,
        temp_physical_flat: local.bonus_resistances_temp?.FlatPhysical || 0,
        temp_magic_flat: local.bonus_resistances_temp?.FlatMagic || 0,
        temp_fire_flat: local.bonus_resistances_temp?.FlatFire || 0,
        temp_lightning_flat: local.bonus_resistances_temp?.FlatLightning || 0,
        temp_dark_flat: local.bonus_resistances_temp?.FlatDark || 0,
        bonus_resistances_active: local.bonus_resistances_active || false
      },
      statuses: {
        curse: local.current_statuses.Curse,
        frost: local.current_statuses.Frost,
        bleed: local.current_statuses.Bleed,
        poison: local.current_statuses.Poison,
        toxic: local.current_statuses.Toxic,
        poise: local.current_statuses.Poise,
        bonus_curse: local.bonus_statuses.Curse,
        bonus_frost: local.bonus_statuses.Frost,
        bonus_bleed: local.bonus_statuses.Bleed,
        bonus_poison: local.bonus_statuses.Poison,
        bonus_toxic: local.bonus_statuses.Toxic,
        bonus_poise: local.bonus_statuses.Poise
      },
      combat_settings: {
        two_handing_main_hand: local.combat_settings.twoHandingMainHand,
        two_handing_off_hand: local.combat_settings.twoHandingOffHand,
        active_companion_id: local.combat_settings.activeCompanionId,
        dodge_cost_override: local.dodge_cost_override ?? null,
        dodge_distance_override: local.dodge_distance_override ?? null,
        item_usage_cost_override: local.item_usage_cost_override ?? null,
        jump_horizontal_override: local.jump_horizontal_override ?? null,
        jump_vertical_override: local.jump_vertical_override ?? null,
        running_jump_horizontal_override: local.running_jump_horizontal_override ?? null,
        running_jump_vertical_override: local.running_jump_vertical_override ?? null,
        max_equip_load_override: local.max_equip_load_override ?? null,
        undying_dc_override: local.undying_dc ?? null,
        undying_roll_mod_override: local.undying_roll_mod ?? null,
        enable_5th_ring_slot: local.enable_5th_ring_slot || false,
        enable_2nd_artifact_slot: local.enable_2nd_artifact_slot || false
      },
      proficiency_points: local.weapon_proficiency_points ? {
        total: local.weapon_proficiency_points.total,
        base_from_level: local.weapon_proficiency_points.baseFromLevel,
        custom_bonus: local.weapon_proficiency_points.customBonus
      } : undefined,
      misc_data: {
        notes: local.notes || {},
        field_notes: local.field_notes || {},
        compendium_entries: local.compendium?.entries || [],
        pending_level_up: local.pending_level_up || null,
        has_multi_proficient: local.has_multi_proficient || false,
        multi_proficient_retroactive_points: local.multi_proficient_retroactive_points || 0,
        dual_wielding_feat_flags: local.dual_wielding_feat_flags || {},
        musical_instruments_feat_flags: local.musical_instruments_feat_flags || {},
        halberd_feat_flags: local.halberd_feat_flags || {},
        protege_flags: local.protege_flags || {}
      },

      // One-to-Many relationships
      weapon_proficiencies: buildProficienciesToArray(local.weapon_proficiencies),
      equipment_slots: buildEquipmentToSlots(local.equipment, local.weapon_modifications),
      learned_spells: local.learned_spells?.map(spellId => ({
        spell_id: spellId,
        modifications: local.spell_modifications?.[spellId] || {}
      })) || [],
      attuned_spells: (local.attuned_spells || []).map((s: any, i: number) => ({
        spell_id: typeof s === 'number' ? s : (s.id || s.spell_id || 0),
        slot_number: s.slot_number ?? i
      })),
      learned_spirits: local.learned_spirits?.map(spiritId => ({
        spirit_id: spiritId,
        modifications: local.spirit_modifications?.[spiritId] || {}
      })) || [],
      attuned_spirits: (local.attuned_spirits || []).map((s: any, i: number) => ({
        spirit_id: typeof s === 'number' ? s : (s.id || s.spirit_id || 0),
        slot_number: s.slot_number ?? i
      })),
      learned_weapon_skills: local.learned_weapon_skills?.map(skillId => ({
        skill_id: skillId,
        modifications: local.weapon_skill_modifications?.[skillId] || {}
      })) || [],
      attuned_weapon_skills: (local.attuned_weapon_skills || []).map((s: any, i: number) => ({
        skill_id: typeof s === 'number' ? s : (s.id || s.skill_id || 0),
        slot_number: s.slot_number ?? i
      })),
      obtained_feats: buildObtainedFeatsForApi(local),
      companions: buildCompanionsForApi(local.companions),
      inventory_items: (local.inventory || []).map((item: any) => ({
        item_id: item.id,
        item_category: item.category || '',
        item_name: item.name || '',
        quantity: item.Quantity || 1
      }))
    }
  }

  // Helper: Extract just the URL from character_image_path JSON
  function extractImageUrl(imagePath: string | undefined): string | null {
    if (!imagePath) return null
    try {
      const data = JSON.parse(imagePath)
      return data.url || null
    } catch {
      // Plain URL string
      return imagePath || null
    }
  }

  // Helper: Convert weapon proficiencies object to array for API
  function buildProficienciesToArray(profs: StoredCharacter['weapon_proficiencies']): ApiCharacter['weapon_proficiencies'] {
    if (!profs) return []
    const result: Array<{ weapon_tree: string; level: number }> = []
    for (const [tree, level] of Object.entries(profs)) {
      if (level > 0) {
        result.push({ weapon_tree: tree, level })
      }
    }
    return result
  }

  // Helper: Convert equipment object to slots array for API
  function buildEquipmentToSlots(
    equipment: StoredCharacter['equipment'],
    weaponMods?: Record<number, any>
  ): ApiCharacter['equipment_slots'] {
    if (!equipment) return []
    const slots: NonNullable<ApiCharacter['equipment_slots']> = []

    const slotTypes = ['MainHand', 'OffHand', 'Armor', 'Artifact', 'Artifact2', 'Ring1', 'Ring2', 'Ring3', 'Ring4', 'Ring5']
    for (const slotType of slotTypes) {
      const item = equipment[slotType as keyof typeof equipment]
      if (item && item.id) {
        slots.push({
          slot_type: slotType,
          item_id: item.id,
          item_category: item.category || '',
          item_name: item.name || '',
          modifications: weaponMods?.[item.id] || {}
        })
      }
    }
    return slots
  }

  // Helper: Convert obtained feats to API format (strip extra fields)
  function buildObtainedFeatsForApi(local: StoredCharacter): ApiCharacter['obtained_feats'] {
    const feats: Array<{
      feat_id: number
      feat_type: string
      weapon_tree: string
      source: string
      source_feat_id: number | null
      is_greyed_out: boolean
      modifications: Record<string, unknown>
    }> = []

    for (const f of (local.obtained_weapon_prof_feats || [])) {
      feats.push({
        feat_id: f.feat_id,
        feat_type: 'weapon_prof',
        weapon_tree: f.weapon_tree || '',
        source: f.source || '',
        source_feat_id: f.source_feat_id ?? null,
        is_greyed_out: f.is_greyed_out || false,
        modifications: {}
      })
    }

    for (const f of (local.obtained_destined_traits || [])) {
      feats.push({
        feat_id: f.feat_id || f.id,
        feat_type: 'destiny',
        weapon_tree: '',
        source: f.source || '',
        source_feat_id: f.source_feat_id ?? null,
        is_greyed_out: f.is_greyed_out || false,
        modifications: local.destined_trait_modifications?.[f.feat_id || f.id] || {}
      })
    }

    return feats
  }

  // Helper: Convert localStorage companions to API flat format
  function buildCompanionsForApi(companions: StoredCharacter['companions']): ApiCharacter['companions'] {
    if (!companions || companions.length === 0) return []

    return companions.map(c => ({
      id: c.id,
      name: c.name || '',
      companion_type: c.type || '',
      hp: c.hp ?? null,
      fp: c.fp ?? null,
      ap: c.ap ?? null,
      // Flatten skills
      athletics: c.skills?.Athletics || 0,
      acrobatics: c.skills?.Acrobatics || 0,
      perception: c.skills?.Perception || 0,
      fire_keeping: c.skills?.FireKeeping || 0,
      sanity: c.skills?.Sanity || 0,
      stealth: c.skills?.Stealth || 0,
      precision: c.skills?.Precision || 0,
      diplomacy: c.skills?.Diplomacy || 0,
      // Flatten resistances
      physical: c.resistances?.Physical || 0,
      magic: c.resistances?.Magic || 0,
      fire: c.resistances?.Fire || 0,
      lightning: c.resistances?.Lightning || 0,
      dark: c.resistances?.Dark || 0,
      // Flatten statuses
      frost: c.statuses?.Frost || 0,
      bleed: c.statuses?.Bleed || 0,
      poison: c.statuses?.Poison || 0,
      toxic: c.statuses?.Toxic || 0,
      curse: c.statuses?.Curse || 0,
      poise: c.statuses?.Poise || 0,
      notes: c.notes || ''
    }))
  }

  // Helper: Convert API flat companion format to localStorage nested format
  function buildCompanionsFromApi(companions: ApiCharacter['companions']): StoredCharacter['companions'] {
    if (!companions || companions.length === 0) return []

    return companions.map(c => ({
      id: c.id,
      name: c.name || '',
      type: c.companion_type || '',
      hp: c.hp ?? null,
      fp: c.fp ?? null,
      ap: c.ap ?? null,
      skills: {
        Athletics: c.athletics || 0,
        Acrobatics: c.acrobatics || 0,
        Perception: c.perception || 0,
        FireKeeping: c.fire_keeping || 0,
        Sanity: c.sanity || 0,
        Stealth: c.stealth || 0,
        Precision: c.precision || 0,
        Diplomacy: c.diplomacy || 0
      },
      resistances: {
        Physical: c.physical || 0,
        Magic: c.magic || 0,
        Fire: c.fire || 0,
        Lightning: c.lightning || 0,
        Dark: c.dark || 0
      },
      statuses: {
        Frost: c.frost || 0,
        Bleed: c.bleed || 0,
        Poison: c.poison || 0,
        Toxic: c.toxic || 0,
        Curse: c.curse || 0,
        Poise: c.poise || 0
      },
      notes: c.notes || ''
    }))
  }

  // Transform API format to localStorage format
  function fromApiFormat(api: ApiCharacter): StoredCharacter {
    return {
      uuid: api.id,
      name: api.name,
      gender: api.gender,
      physical_description: api.physical_description,
      level: api.level,
      souls_level: api.souls_level,
      background_id: api.background_id,
      lineage_id: api.lineage_id,
      bloodline_id: api.bloodline_id,
      is_finalized: api.is_finalized,
      // Wrap server URL in JSON format for frontend consumption
      character_image_path: api.image_url
        ? JSON.stringify({ url: api.image_url, position: 'center' })
        : undefined,

      stats: api.stats || {
        vitality: 10, endurance: 10, strength: 10, dexterity: 10,
        attunement: 10, intelligence: 10, faith: 10
      },
      creation_stats: api.creation_stats ? {
        vitality: api.creation_stats.vitality,
        endurance: api.creation_stats.endurance,
        strength: api.creation_stats.strength,
        dexterity: api.creation_stats.dexterity,
        attunement: api.creation_stats.attunement,
        intelligence: api.creation_stats.intelligence,
        faith: api.creation_stats.faith
      } : undefined,
      creation_starting_hp: api.creation_stats?.starting_hp,

      skills: {
        Athletics: api.skills?.athletics || 0,
        Acrobatics: api.skills?.acrobatics || 0,
        Perception: api.skills?.perception || 0,
        FireKeeping: api.skills?.fire_keeping || 0,
        Sanity: api.skills?.sanity || 0,
        Stealth: api.skills?.stealth || 0,
        Precision: api.skills?.precision || 0,
        Diplomacy: api.skills?.diplomacy || 0
      },
      knowledge: {
        Magics: api.knowledge?.magics || 0,
        WorldHistory: api.knowledge?.world_history || 0,
        Monsters: api.knowledge?.monsters || 0,
        Cosmic: api.knowledge?.cosmic || 0
      },

      starting_hp: api.resources?.starting_hp || 20,
      level_hp: api.resources?.level_hp || 0,
      current_hp: api.resources?.current_hp || 20,
      temp_hp: api.resources?.temp_hp || 0,
      max_hp_bonus: api.resources?.max_hp_bonus || 0,
      health_die: {
        count: api.resources?.health_die_count || 1,
        sides: api.resources?.health_die_sides || 6
      },
      current_fp: api.resources?.current_fp || 2,
      current_ap: api.resources?.current_ap || 8,
      max_fp_bonus: api.resources?.max_fp_bonus || 0,
      max_ap_bonus: api.resources?.max_ap_bonus || 0,
      hp_flask: api.resources?.hp_flask || 4,
      fp_flask: api.resources?.fp_flask || 4,
      flask_level: api.resources?.flask_level || 0,
      total_dodges: api.resources?.total_dodges || 0,
      current_dodges: api.resources?.current_dodges || 0,
      souls: api.resources?.souls || 0,
      undying: api.resources?.undying || 0,
      exhaustion: api.resources?.exhaustion || 0,
      firekeeping_checks: api.resources?.firekeeping_checks || 0,
      attunement_slots: api.resources?.attunement_slots || 0,
      fate_points: api.resources?.fate_points || 2,
      temporary_fate_points: api.resources?.temporary_fate_points || 0,

      resistances: {
        Physical: api.resistances?.physical || 0,
        Magic: api.resistances?.magic || 0,
        Fire: api.resistances?.fire || 0,
        Lightning: api.resistances?.lightning || 0,
        Dark: api.resistances?.dark || 0,
        PhysicalFlat: api.resistances?.physical_flat || 0,
        MagicFlat: api.resistances?.magic_flat || 0,
        FireFlat: api.resistances?.fire_flat || 0,
        LightningFlat: api.resistances?.lightning_flat || 0,
        DarkFlat: api.resistances?.dark_flat || 0
      },
      bonus_resistances: {
        Physical: api.resistances?.bonus_physical || 0,
        Magic: api.resistances?.bonus_magic || 0,
        Fire: api.resistances?.bonus_fire || 0,
        Lightning: api.resistances?.bonus_lightning || 0,
        Dark: api.resistances?.bonus_dark || 0,
        FlatPhysical: api.resistances?.bonus_physical_flat || 0,
        FlatMagic: api.resistances?.bonus_magic_flat || 0,
        FlatFire: api.resistances?.bonus_fire_flat || 0,
        FlatLightning: api.resistances?.bonus_lightning_flat || 0,
        FlatDark: api.resistances?.bonus_dark_flat || 0
      },
      bonus_resistances_temp: {
        Physical: api.resistances?.temp_physical || 0,
        Magic: api.resistances?.temp_magic || 0,
        Fire: api.resistances?.temp_fire || 0,
        Lightning: api.resistances?.temp_lightning || 0,
        Dark: api.resistances?.temp_dark || 0,
        FlatPhysical: api.resistances?.temp_physical_flat || 0,
        FlatMagic: api.resistances?.temp_magic_flat || 0,
        FlatFire: api.resistances?.temp_fire_flat || 0,
        FlatLightning: api.resistances?.temp_lightning_flat || 0,
        FlatDark: api.resistances?.temp_dark_flat || 0
      },
      bonus_resistances_active: api.resistances?.bonus_resistances_active || false,

      current_statuses: {
        Curse: api.statuses?.curse || 0,
        Frost: api.statuses?.frost || 0,
        Bleed: api.statuses?.bleed || 0,
        Poison: api.statuses?.poison || 0,
        Toxic: api.statuses?.toxic || 0,
        Poise: api.statuses?.poise || 0
      },
      bonus_statuses: {
        Curse: api.statuses?.bonus_curse || 0,
        Frost: api.statuses?.bonus_frost || 0,
        Bleed: api.statuses?.bonus_bleed || 0,
        Poison: api.statuses?.bonus_poison || 0,
        Toxic: api.statuses?.bonus_toxic || 0,
        Poise: api.statuses?.bonus_poise || 0
      },

      combat_settings: {
        twoHandingMainHand: api.combat_settings?.two_handing_main_hand || false,
        twoHandingOffHand: api.combat_settings?.two_handing_off_hand || false,
        activeCompanionId: api.combat_settings?.active_companion_id || null
      },
      dodge_cost_override: api.combat_settings?.dodge_cost_override,
      dodge_distance_override: api.combat_settings?.dodge_distance_override,
      item_usage_cost_override: api.combat_settings?.item_usage_cost_override,
      jump_horizontal_override: api.combat_settings?.jump_horizontal_override,
      jump_vertical_override: api.combat_settings?.jump_vertical_override,
      running_jump_horizontal_override: api.combat_settings?.running_jump_horizontal_override,
      running_jump_vertical_override: api.combat_settings?.running_jump_vertical_override,
      max_equip_load_override: api.combat_settings?.max_equip_load_override,
      undying_dc: api.combat_settings?.undying_dc_override,
      undying_roll_mod: api.combat_settings?.undying_roll_mod_override,
      enable_5th_ring_slot: api.combat_settings?.enable_5th_ring_slot || false,
      enable_2nd_artifact_slot: api.combat_settings?.enable_2nd_artifact_slot || false,

      field_notes: api.misc_data?.field_notes || {},
      notes: api.misc_data?.notes as { sections: unknown[] } || { sections: [] },
      compendium: { entries: api.misc_data?.compendium_entries || [] },
      pending_level_up: api.misc_data?.pending_level_up,
      has_multi_proficient: api.misc_data?.has_multi_proficient || false,
      multi_proficient_retroactive_points: api.misc_data?.multi_proficient_retroactive_points || 0,
      dual_wielding_feat_flags: api.misc_data?.dual_wielding_feat_flags as StoredCharacter['dual_wielding_feat_flags'],
      musical_instruments_feat_flags: api.misc_data?.musical_instruments_feat_flags as StoredCharacter['musical_instruments_feat_flags'],
      halberd_feat_flags: api.misc_data?.halberd_feat_flags as StoredCharacter['halberd_feat_flags'],
      protege_flags: api.misc_data?.protege_flags as StoredCharacter['protege_flags'],

      // Equipment from slots + weapon modifications
      ...(() => {
        const { equipment, weaponModifications } = buildEquipmentFromSlots(api.equipment_slots || [])
        return { equipment, weapon_modifications: weaponModifications }
      })(),

      // Weapon proficiencies
      weapon_proficiency_points: api.proficiency_points ? {
        total: api.proficiency_points.total,
        baseFromLevel: api.proficiency_points.base_from_level,
        customBonus: api.proficiency_points.custom_bonus
      } : { total: 0, baseFromLevel: 0, customBonus: 0 },
      weapon_proficiencies: buildProficienciesFromArray(api.weapon_proficiencies || []),

      // Spells
      learned_spells: api.learned_spells?.map(s => s.spell_id) || [],
      attuned_spells: api.attuned_spells || [],
      spell_modifications: buildModificationsMap(api.learned_spells || [], 'spell_id'),

      // Spirits
      learned_spirits: api.learned_spirits?.map(s => s.spirit_id) || [],
      attuned_spirits: api.attuned_spirits || [],
      spirit_modifications: buildModificationsMap(api.learned_spirits || [], 'spirit_id'),

      // Weapon skills
      learned_weapon_skills: api.learned_weapon_skills?.map(s => s.skill_id) || [],
      attuned_weapon_skills: api.attuned_weapon_skills || [],
      weapon_skill_modifications: buildModificationsMap(api.learned_weapon_skills || [], 'skill_id'),

      // Feats
      obtained_weapon_prof_feats: api.obtained_feats?.filter(f => f.feat_type === 'weapon_prof') || [],
      obtained_destined_traits: api.obtained_feats?.filter(f => f.feat_type === 'destiny') || [],
      destined_trait_modifications: buildDestinedTraitModificationsMap(
        api.obtained_feats?.filter(f => f.feat_type === 'destiny') || []
      ),

      // Companions
      companions: buildCompanionsFromApi(api.companions || []),

      // Inventory — hydrate from compendium to restore full item data
      inventory: (api.inventory_items || []).map(item => {
        const compendiumStore = useCompendiumStore()
        let fullItem: any = null
        switch (item.item_category) {
          case 'weapon':
            fullItem = compendiumStore.Weapons.find((w: any) => w.id === item.item_id)
            break
          case 'armor':
            fullItem = compendiumStore.Armors.find((a: any) => a.id === item.item_id)
            break
          case 'ring':
            fullItem = compendiumStore.Rings.find((r: any) => r.id === item.item_id)
            break
          case 'artifact':
            fullItem = compendiumStore.Artifacts.find((a: any) => a.id === item.item_id)
            break
          default:
            fullItem = compendiumStore.Items.find((i: any) => i.id === item.item_id)
            break
        }
        if (fullItem) {
          return { ...JSON.parse(JSON.stringify(fullItem)), category: item.item_category, Quantity: item.quantity }
        }
        return { id: item.item_id, name: item.item_name, category: item.item_category, Quantity: item.quantity }
      }),

      created_at: api.created_at,
      last_played: api.last_played
    }
  }

  // Helper: Build equipment object + weapon modifications from slots array
  function buildEquipmentFromSlots(slots: ApiCharacter['equipment_slots']): {
    equipment: StoredCharacter['equipment']
    weaponModifications: Record<number, any>
  } {
    const equipment: StoredCharacter['equipment'] = {
      MainHand: null, OffHand: null, Armor: null,
      Artifact: null, Artifact2: null,
      Ring1: null, Ring2: null, Ring3: null, Ring4: null, Ring5: null
    }
    const weaponModifications: Record<number, any> = {}

    for (const slot of slots || []) {
      const itemData = { id: slot.item_id, category: slot.item_category, name: slot.item_name }
      switch (slot.slot_type) {
        case 'MainHand': equipment.MainHand = itemData; break
        case 'OffHand': equipment.OffHand = itemData; break
        case 'Armor': equipment.Armor = itemData; break
        case 'Artifact': equipment.Artifact = itemData; break
        case 'Artifact2': equipment.Artifact2 = itemData; break
        case 'Ring1': equipment.Ring1 = itemData; break
        case 'Ring2': equipment.Ring2 = itemData; break
        case 'Ring3': equipment.Ring3 = itemData; break
        case 'Ring4': equipment.Ring4 = itemData; break
        case 'Ring5': equipment.Ring5 = itemData; break
      }
      // Extract weapon modifications if present
      if (slot.modifications && Object.keys(slot.modifications).length > 0) {
        weaponModifications[slot.item_id] = slot.modifications
      }
    }

    return { equipment, weaponModifications }
  }

  // Helper: Build proficiencies object from array
  function buildProficienciesFromArray(profs: ApiCharacter['weapon_proficiencies']): StoredCharacter['weapon_proficiencies'] {
    const proficiencies: StoredCharacter['weapon_proficiencies'] = {
      FIST: 0, DAGGER: 0, STRAIGHT_THRUST: 0, KATANA_CURVED: 0,
      ULTRA_GREAT_SWORD: 0, GREAT_AXE: 0, GREAT_HAMMER: 0, TWINBLADE: 0,
      SPEAR: 0, HALBERD: 0, REAPER: 0, WHIP: 0, CROSS_BOW: 0,
      GREAT_BOW_BALLISTA: 0, GUN: 0, SHIELD: 0, SORCERY: 0, MIRACLE: 0,
      PYROMANCY: 0, HEX: 0, SPIRIT_SUMMONING: 0, DUAL_WIELDING: 0
    }

    for (const prof of profs || []) {
      switch (prof.weapon_tree) {
        case 'FIST': proficiencies.FIST = prof.level; break
        case 'DAGGER': proficiencies.DAGGER = prof.level; break
        case 'STRAIGHT_THRUST': proficiencies.STRAIGHT_THRUST = prof.level; break
        case 'KATANA_CURVED': proficiencies.KATANA_CURVED = prof.level; break
        case 'ULTRA_GREAT_SWORD': proficiencies.ULTRA_GREAT_SWORD = prof.level; break
        case 'GREAT_AXE': proficiencies.GREAT_AXE = prof.level; break
        case 'GREAT_HAMMER': proficiencies.GREAT_HAMMER = prof.level; break
        case 'TWINBLADE': proficiencies.TWINBLADE = prof.level; break
        case 'SPEAR': proficiencies.SPEAR = prof.level; break
        case 'HALBERD': proficiencies.HALBERD = prof.level; break
        case 'REAPER': proficiencies.REAPER = prof.level; break
        case 'WHIP': proficiencies.WHIP = prof.level; break
        case 'CROSS_BOW': proficiencies.CROSS_BOW = prof.level; break
        case 'GREAT_BOW_BALLISTA': proficiencies.GREAT_BOW_BALLISTA = prof.level; break
        case 'GUN': proficiencies.GUN = prof.level; break
        case 'SHIELD': proficiencies.SHIELD = prof.level; break
        case 'SORCERY': proficiencies.SORCERY = prof.level; break
        case 'MIRACLE': proficiencies.MIRACLE = prof.level; break
        case 'PYROMANCY': proficiencies.PYROMANCY = prof.level; break
        case 'HEX': proficiencies.HEX = prof.level; break
        case 'SPIRIT_SUMMONING': proficiencies.SPIRIT_SUMMONING = prof.level; break
        case 'DUAL_WIELDING': proficiencies.DUAL_WIELDING = prof.level; break
      }
    }

    return proficiencies
  }

  // Helper: Build modifications map from array
  function buildModificationsMap<T extends { modifications: Record<string, unknown> }>(
    items: T[],
    idKey: string
  ): Record<number, unknown> {
    const map: Record<number, unknown> = {}
    for (const item of items) {
      const id = (item as unknown as Record<string, number>)[idKey]
      if (item.modifications && Object.keys(item.modifications).length > 0) {
        map[id] = item.modifications
      }
    }
    return map
  }

  // Helper: Extract destined trait modifications from obtained feats into separate map
  function buildDestinedTraitModificationsMap(
    destinyFeats: Array<{ feat_id: number; modifications: Record<string, unknown> }>
  ): Record<number, unknown> {
    const map: Record<number, unknown> = {}
    for (const feat of destinyFeats) {
      if (feat.modifications && Object.keys(feat.modifications).length > 0) {
        map[feat.feat_id] = feat.modifications
      }
    }
    return map
  }

  return {
    // API methods
    fetchCharacters,
    fetchCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    exportCharacter,
    importCharacter,

    // Equipment
    equipItem,
    unequipItem,

    // Proficiencies
    updateProficiency,

    // Spells
    learnSpell,
    unlearnSpell,
    attuneSpell,
    unattuneSpell,

    // Data transformation
    toApiFormat,
    fromApiFormat
  }
}
