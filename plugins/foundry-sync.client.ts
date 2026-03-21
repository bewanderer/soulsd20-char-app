// Foundry VTT WebSocket sync plugin
// Connects to relay server for Foundry communication

import { getActiveCharacter, getAllCharacters, type StoredCharacter } from '@/mixins/characterStorage'
import { statMod, skillModBonusFromStats } from '@/mixins/utils'
import { useCompendiumStore } from '@/store/compendium'
import { calculateWeaponScaling, calculateSpellScaling } from '@/mixins/combatUtils'

const WEBSOCKET_URL = 'ws://localhost:8080'
const MAX_RECONNECT_ATTEMPTS = 50
const RECONNECT_DELAY = 3000
const CONNECTION_KEY = '__sd20_foundry_sync__'

// Debounce settings for sync
const SYNC_DEBOUNCE_MS = 2000
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Fields that trigger sync when changed
const SIGNIFICANT_CHANGE_PATHS = [
  'stats',
  'skills',
  'knowledge',
  'level',
  'name',
  'equipment',
  'attuned_spells',
  'attuned_spirits',
  'attuned_weapon_skills',
  'bonus_resistances',
  'bonus_statuses',
  'starting_hp',
  'level_hp',
  'max_hp_bonus',
  'max_fp_bonus',
  'max_ap_bonus'
]

const MESSAGE_TYPES = {
  APP_HANDSHAKE: 'app:handshake',
  APP_HEARTBEAT: 'app:heartbeat',
  CHARACTER_RESPONSE_ALL: 'characters:response-all',
  CHARACTER_RESPONSE: 'character:response',
  CHARACTER_RESPONSE_LINKED: 'characters:response-linked',
  CHARACTER_UPDATE: 'character:update',
  FOUNDRY_READY: 'foundry:ready',
  CHARACTER_REQUEST_ALL: 'characters:request-all',
  CHARACTER_REQUEST: 'character:request',
  CHARACTER_REQUEST_LINKED: 'characters:request-linked',
  DAMAGE_APPLIED: 'combat:damage-applied',
  COMBAT_DATA_REQUEST: 'combat:request-data',
  COMBAT_DATA_RESPONSE: 'combat:response-data'
}

const HEARTBEAT_INTERVAL = 10000 // 10 seconds

interface ConnectionState {
  socket: WebSocket | null
  reconnectTimeout: ReturnType<typeof setTimeout> | null
  heartbeatInterval: ReturnType<typeof setInterval> | null
  reconnectAttempts: number
  isConnected: boolean
  isFoundryConnected: boolean
}

// Store connection state on window to survive HMR
function getState(): ConnectionState {
  if (typeof window === 'undefined') {
    return {
      socket: null,
      reconnectTimeout: null,
      heartbeatInterval: null,
      reconnectAttempts: 0,
      isConnected: false,
      isFoundryConnected: false
    }
  }
  if (!(window as any)[CONNECTION_KEY]) {
    (window as any)[CONNECTION_KEY] = {
      socket: null,
      reconnectTimeout: null,
      heartbeatInterval: null,
      reconnectAttempts: 0,
      isConnected: false,
      isFoundryConnected: false
    }
  }
  return (window as any)[CONNECTION_KEY]
}

// CF3: Format weapon type for display (REAPER -> Reaper)
function formatWeaponType(type: string | null | undefined): string {
  if (!type) return ''
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Calculate maxHP from stored character data
function calculateMaxHP(character: ReturnType<typeof getActiveCharacter>): number {
  if (!character) return 0
  const startingHP = character.starting_hp || 0
  const levelHP = character.level_hp || 0
  const bonusHP = character.max_hp_bonus || 0
  const vitality = character.stats?.vitality || 10
  const vitMod = statMod(vitality)
  const level = character.level || 1
  const vitBonus = level === 1 ? vitMod : vitMod * (Math.floor(level / 2) + 1)
  return startingHP + levelHP + bonusHP + vitBonus
}

// Calculate maxFP from stored character data
function calculateMaxFP(character: ReturnType<typeof getActiveCharacter>): number {
  if (!character) return 5
  let baseFP = 5
  const attunement = character.stats?.attunement || 10
  if (attunement >= 10) {
    baseFP += attunement - 10
  } else {
    baseFP += statMod(attunement)
  }
  return baseFP + (character.max_fp_bonus || 0)
}

// Calculate maxAP from stored character data
function calculateMaxAP(character: ReturnType<typeof getActiveCharacter>): number {
  if (!character) return 8
  const endurance = character.stats?.endurance || 10
  const endMod = statMod(endurance)
  return 8 + endMod + (character.max_ap_bonus || 0)
}

function send(type: string, data: Record<string, unknown> = {}): boolean {
  const state = getState()
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    console.warn('[Foundry Sync] Cannot send - not connected')
    return false
  }

  const message = {
    type,
    data,
    timestamp: Date.now(),
    source: 'app'
  }

  state.socket.send(JSON.stringify(message))
  return true
}

function handleMessage(message: { type: string; data: Record<string, unknown> }) {
  console.log('[Foundry Sync] Received:', message.type)
  const state = getState()

  switch (message.type) {
    case MESSAGE_TYPES.FOUNDRY_READY:
      console.log('[Foundry Sync] Foundry is ready')
      state.isFoundryConnected = true
      send(MESSAGE_TYPES.APP_HANDSHAKE, { version: '1.0.0' })
      break

    case MESSAGE_TYPES.CHARACTER_REQUEST_ALL:
      sendAllCharacters()
      break

    case MESSAGE_TYPES.CHARACTER_REQUEST:
      const uuid = message.data.uuid as string
      if (uuid) {
        sendCharacter(uuid)
      }
      break

    case MESSAGE_TYPES.DAMAGE_APPLIED:
      handleDamageApplied(message.data)
      break

    case MESSAGE_TYPES.COMBAT_DATA_REQUEST:
      const requestedUuid = message.data.uuid as string
      const actorId = message.data.actorId as string | undefined
      if (requestedUuid) {
        sendCombatData(requestedUuid, actorId)
      }
      break

    case MESSAGE_TYPES.CHARACTER_REQUEST_LINKED:
      const linkedUuids = message.data.linkedUuids as string[]
      if (linkedUuids && Array.isArray(linkedUuids)) {
        sendLinkedCharacters(linkedUuids)
      }
      break

    default:
      console.log('[Foundry Sync] Unknown message type:', message.type)
  }
}

function sendAllCharacters() {
  const character = getActiveCharacter()
  if (!character) {
    send(MESSAGE_TYPES.CHARACTER_RESPONSE_ALL, { characters: [] })
    return
  }

  send(MESSAGE_TYPES.CHARACTER_RESPONSE_ALL, {
    characters: [{
      uuid: character.uuid,
      name: character.name,
      level: character.level,
      maxHP: calculateMaxHP(character),
      maxFP: calculateMaxFP(character),
      maxAP: calculateMaxAP(character),
      stats: character.stats,
      skills: character.skills
    }]
  })
}

function sendCharacter(uuid: string) {
  const character = getActiveCharacter()
  if (!character || character.uuid !== uuid) {
    send(MESSAGE_TYPES.CHARACTER_RESPONSE, { character: null })
    return
  }

  send(MESSAGE_TYPES.CHARACTER_RESPONSE, {
    character: {
      uuid: character.uuid,
      name: character.name,
      level: character.level,
      maxHP: calculateMaxHP(character),
      maxFP: calculateMaxFP(character),
      maxAP: calculateMaxAP(character),
      stats: character.stats,
      skills: character.skills
    }
  })
}

/**
 * Send character data for specific linked UUIDs
 * Called when Foundry requests data for its linked actors
 */
function sendLinkedCharacters(linkedUuids: string[]) {
  const allChars = getAllCharacters()

  // Filter to only requested UUIDs
  const linkedCharacters = allChars.characters
    .filter(char => linkedUuids.includes(char.uuid))
    .map(char => buildCharacterPayload(char))

  console.log(`[Foundry Sync] Sending ${linkedCharacters.length} linked characters`)
  send(MESSAGE_TYPES.CHARACTER_RESPONSE_LINKED, { characters: linkedCharacters })
}

/**
 * Build a full character payload for Foundry sync
 */
function buildCharacterPayload(character: StoredCharacter) {
  const compendiumStore = useCompendiumStore()
  const compendiumWeapons = compendiumStore.Weapons

  const twoHandingMainHand = character.combat_settings?.twoHandingMainHand || false
  const twoHandingOffHand = character.combat_settings?.twoHandingOffHand || false

  // Build weapon data
  const mainHandData = buildWeaponData(character.equipment?.MainHand, character.weapon_modifications, compendiumWeapons)
  const offHandData = buildWeaponData(character.equipment?.OffHand, character.weapon_modifications, compendiumWeapons)

  if (mainHandData) {
    mainHandData.scalingBonus = calculateWeaponScaling(mainHandData, twoHandingMainHand)
  }
  if (offHandData) {
    offHandData.scalingBonus = calculateWeaponScaling(offHandData, twoHandingOffHand)
  }

  // CF2 + CF3: Collect ALL catalysts (weapons with spell_scaling) for multi-catalyst macro generation
  // For trick weapons, each form with spell_scaling is a separate catalyst
  const catalysts: any[] = []

  // Helper to add catalyst entries for a weapon
  const addWeaponCatalysts = (weaponData: any, slot: 'mainHand' | 'offHand') => {
    if (!weaponData) return

    if (weaponData.is_trick && weaponData.forms) {
      // CF3: Trick weapon - check each form for spell_scaling
      if (weaponData.forms.primary?.spell_scaling?.length > 0) {
        catalysts.push({
          ...weaponData,
          spell_scaling: weaponData.forms.primary.spell_scaling,
          slot,
          form: 'primary',
          displayName: `${weaponData.name} [${formatWeaponType(weaponData.weapon_type)}]`
        })
      }
      if (weaponData.forms.secondary?.spell_scaling?.length > 0) {
        catalysts.push({
          ...weaponData,
          spell_scaling: weaponData.forms.secondary.spell_scaling,
          slot,
          form: 'secondary',
          displayName: `${weaponData.name} [${formatWeaponType(weaponData.second_type)}]`
        })
      }
    } else if (weaponData.spell_scaling?.length > 0) {
      // Non-trick weapon with spell_scaling
      catalysts.push({
        ...weaponData,
        slot,
        displayName: weaponData.name || (slot === 'mainHand' ? 'Main Hand' : 'Off Hand')
      })
    }
  }

  addWeaponCatalysts(mainHandData, 'mainHand')
  addWeaponCatalysts(offHandData, 'offHand')

  // Primary casting implement for App display (first catalyst with mainHand priority)
  const primaryCastingImplement = catalysts.length > 0 ? catalysts[0] : null

  // Build stat modifiers
  const statMods: Record<string, number> = {}
  if (character.stats) {
    for (const [key, value] of Object.entries(character.stats)) {
      statMods[key] = statMod(value as number)
    }
  }

  // Build skill modifiers
  const skillMods: Record<string, number> = {}
  if (character.skills) {
    for (const [key, value] of Object.entries(character.skills)) {
      skillMods[key] = (value as number) + skillModBonusFromStats(key)
    }
  }

  // Knowledge modifiers
  const knowledgeMods: Record<string, number> = {}
  if (character.knowledge) {
    for (const [key, value] of Object.entries(character.knowledge)) {
      knowledgeMods[key] = value as number
    }
  }

  // Attuned abilities with scaling bonus for App display (using primary catalyst)
  // Foundry will also use the catalysts array to generate per-catalyst macros
  const attunedSpellsWithScaling = (character.attuned_spells || []).map((spell: any) => ({
    ...spell,
    scalingBonus: primaryCastingImplement ? calculateSpellScaling(spell, primaryCastingImplement) : 0
  }))

  const attunedSpiritsWithScaling = (character.attuned_spirits || []).map((spirit: any) => ({
    ...spirit,
    scalingBonus: primaryCastingImplement ? calculateSpellScaling(spirit, primaryCastingImplement) : 0
  }))

  return {
    uuid: character.uuid,
    name: character.name,
    level: character.level,
    stats: character.stats,
    statMods,
    skills: skillMods,
    knowledge: knowledgeMods,

    // Equipment
    mainHand: mainHandData,
    offHand: offHandData,
    equipment: character.equipment,

    // CF2: All catalysts for multi-catalyst spell macro generation
    catalysts,

    // Attuned abilities (with primary catalyst scaling for App display)
    attuned_spells: attunedSpellsWithScaling,
    attuned_spirits: attunedSpiritsWithScaling,
    attuned_weapon_skills: character.attuned_weapon_skills || [],

    // Resistances and status bonuses
    bonus_resistances: character.bonus_resistances,
    bonus_statuses: character.bonus_statuses || { Bleed: 0, Poison: 0, Toxic: 0, Frost: 0, Curse: 0, Poise: 0 }
  }
}

function handleDamageApplied(data: Record<string, unknown>) {
  const { uuid, damage, newCurrentHP } = data as { uuid: string; damage: number; newCurrentHP: number }
  const character = getActiveCharacter()

  if (character && character.uuid === uuid) {
    console.log(`[Foundry Sync] Damage applied: ${damage}, new HP: ${newCurrentHP}`)
  }
}

// Build complete weapon data by merging base weapon with user modifications
// CF3: Now includes is_trick flag and per-form data for trick weapons
function buildWeaponData(
  equipmentRef: { id: number; category: string; name: string } | null | undefined,
  modifications: Record<number, any> | undefined,
  compendiumWeapons: any[]
): any | null {
  if (!equipmentRef) return null

  // Look up full weapon from compendium (already loaded in memory)
  const baseWeapon = compendiumWeapons.find(w => w.id === equipmentRef.id)
  if (!baseWeapon) {
    console.warn('[Foundry Sync] Weapon not found in compendium:', equipmentRef.id)
    return null
  }

  // Get user modifications for this weapon (if any)
  const mods = modifications?.[baseWeapon.id]

  // Get dice, scaling, spell_scaling with modifications applied
  const dice = mods?.dice && mods.dice.length > 0 ? mods.dice : baseWeapon.dice
  const scaling = mods?.scaling && mods.scaling.length > 0 ? mods.scaling : baseWeapon.scaling
  const spellScaling = mods?.spell_scaling && mods.spell_scaling.length > 0 ? mods.spell_scaling : baseWeapon.spell_scaling

  // Build complete weapon object with modifications applied
  const weaponData: any = {
    id: baseWeapon.id,
    name: baseWeapon.name,
    weapon_type: baseWeapon.weapon_type,
    second_type: baseWeapon.second_type || null,
    // CF3: Include is_trick flag for Foundry macro generation
    is_trick: baseWeapon.is_trick || false,
    // Apply modifications if they exist, otherwise use base values
    ap: mods?.ap !== undefined ? mods.ap : baseWeapon.ap,
    dice,
    scaling,
    spell_scaling: spellScaling
  }

  // CF3: For trick weapons, include secondary form data
  if (baseWeapon.is_trick) {
    weaponData.second_ap = mods?.second_ap !== undefined ? mods.second_ap : baseWeapon.second_ap
    weaponData.infusion = baseWeapon.infusion || null
    weaponData.second_infusion = baseWeapon.second_infusion || null

    // Include skill URLs for form lookup (Foundry can resolve these if needed)
    weaponData.skill_primary = baseWeapon.skill_primary
    weaponData.skill_secondary = baseWeapon.skill_secondary
    weaponData.second_skill_primary = baseWeapon.second_skill_primary
    weaponData.second_skill_secondary = baseWeapon.second_skill_secondary

    // CF3: Build forms object for easier Foundry access
    // Filter dice/scaling/spell_scaling by form field
    weaponData.forms = {
      primary: {
        type: baseWeapon.weapon_type,
        ap: weaponData.ap,
        dice: (dice || []).filter((d: any) => (d.form || 'primary') === 'primary'),
        scaling: (scaling || []).filter((s: any) => (s.form || 'primary') === 'primary'),
        spell_scaling: (spellScaling || []).filter((s: any) => (s.form || 'primary') === 'primary'),
        infusion: baseWeapon.infusion || null
      },
      secondary: {
        type: baseWeapon.second_type,
        ap: weaponData.second_ap ?? weaponData.ap,
        dice: (dice || []).filter((d: any) => d.form === 'secondary'),
        scaling: (scaling || []).filter((s: any) => s.form === 'secondary'),
        spell_scaling: (spellScaling || []).filter((s: any) => s.form === 'secondary'),
        infusion: baseWeapon.second_infusion || null
      }
    }
  }

  return weaponData
}

function sendCombatData(uuid: string, actorId?: string) {
  // Try to find the character by UUID (not just active character)
  const allChars = getAllCharacters()
  const character = allChars.characters.find(c => c.uuid === uuid)

  if (!character) {
    send(MESSAGE_TYPES.COMBAT_DATA_RESPONSE, { uuid, actorId, combatData: null })
    return
  }

  // Get compendium data (already loaded in memory)
  const compendiumStore = useCompendiumStore()
  const compendiumWeapons = compendiumStore.Weapons

  // Get two-handing settings
  const twoHandingMainHand = character.combat_settings?.twoHandingMainHand || false
  const twoHandingOffHand = character.combat_settings?.twoHandingOffHand || false

  // Build complete weapon data with modifications applied
  const mainHandData = buildWeaponData(
    character.equipment?.MainHand,
    character.weapon_modifications,
    compendiumWeapons
  )

  const offHandData = buildWeaponData(
    character.equipment?.OffHand,
    character.weapon_modifications,
    compendiumWeapons
  )

  // Calculate and attach scaling bonuses (pre-calculated for Foundry)
  if (mainHandData) {
    mainHandData.scalingBonus = calculateWeaponScaling(mainHandData, twoHandingMainHand)
  }
  if (offHandData) {
    offHandData.scalingBonus = calculateWeaponScaling(offHandData, twoHandingOffHand)
  }

  // CF2 + CF3: Collect ALL catalysts (weapons with spell_scaling) for multi-catalyst macro generation
  // For trick weapons, each form with spell_scaling is a separate catalyst
  const catalysts: any[] = []

  // Helper to add catalyst entries for a weapon
  const addWeaponCatalysts = (weaponData: any, slot: 'mainHand' | 'offHand') => {
    if (!weaponData) return

    if (weaponData.is_trick && weaponData.forms) {
      // CF3: Trick weapon - check each form for spell_scaling
      if (weaponData.forms.primary?.spell_scaling?.length > 0) {
        catalysts.push({
          ...weaponData,
          spell_scaling: weaponData.forms.primary.spell_scaling,
          slot,
          form: 'primary',
          displayName: `${weaponData.name} [${formatWeaponType(weaponData.weapon_type)}]`
        })
      }
      if (weaponData.forms.secondary?.spell_scaling?.length > 0) {
        catalysts.push({
          ...weaponData,
          spell_scaling: weaponData.forms.secondary.spell_scaling,
          slot,
          form: 'secondary',
          displayName: `${weaponData.name} [${formatWeaponType(weaponData.second_type)}]`
        })
      }
    } else if (weaponData.spell_scaling?.length > 0) {
      // Non-trick weapon with spell_scaling
      catalysts.push({
        ...weaponData,
        slot,
        displayName: weaponData.name || (slot === 'mainHand' ? 'Main Hand' : 'Off Hand')
      })
    }
  }

  addWeaponCatalysts(mainHandData, 'mainHand')
  addWeaponCatalysts(offHandData, 'offHand')

  // Primary casting implement for App display (first catalyst with mainHand priority)
  const primaryCastingImplement = catalysts.length > 0 ? catalysts[0] : null

  // Attuned abilities with scaling bonus for App display (using primary catalyst)
  // Foundry will also use the catalysts array to generate per-catalyst macros
  const attunedSpellsWithScaling = (character.attuned_spells || []).map((spell: any) => ({
    ...spell,
    scalingBonus: primaryCastingImplement ? calculateSpellScaling(spell, primaryCastingImplement) : 0
  }))

  const attunedSpiritsWithScaling = (character.attuned_spirits || []).map((spirit: any) => ({
    ...spirit,
    scalingBonus: primaryCastingImplement ? calculateSpellScaling(spirit, primaryCastingImplement) : 0
  }))

  // Build stat modifiers from raw stat values (matches what the app displays)
  const statMods: Record<string, number> = {}
  if (character.stats) {
    for (const [key, value] of Object.entries(character.stats)) {
      statMods[key] = statMod(value as number)
    }
  }

  // Build skill modifiers as displayed in the app: raw skill points + bonus from stats
  const skillMods: Record<string, number> = {}
  if (character.skills) {
    for (const [key, value] of Object.entries(character.skills)) {
      skillMods[key] = (value as number) + skillModBonusFromStats(key)
    }
  }

  // Knowledge modifiers are just the raw stored value (matches app display)
  const knowledgeMods: Record<string, number> = {}
  if (character.knowledge) {
    for (const [key, value] of Object.entries(character.knowledge)) {
      knowledgeMods[key] = value as number
    }
  }

  // Build combat data for macro generation
  const combatData = {
    uuid: character.uuid,
    actorId,  // Include actorId for immediate fetch response
    name: character.name,
    stats: character.stats,
    statMods,
    skills: skillMods,
    knowledge: knowledgeMods,
    level: character.level,

    // Equipment - now includes full weapon data with scalingBonus
    mainHand: mainHandData,
    offHand: offHandData,

    // CF2: All catalysts for multi-catalyst spell macro generation
    catalysts,

    // Attuned abilities (with primary catalyst scaling for display)
    attunedSpells: attunedSpellsWithScaling,
    attunedSpirits: attunedSpiritsWithScaling,
    attunedWeaponSkills: character.attuned_weapon_skills || [],

    // Combat settings
    combatSettings: {
      twoHandingMainHand,
      twoHandingOffHand
    },

    // Resistance tables (for damage calculation in Foundry)
    resistances: {
      primary: {
        Physical: character.bonus_resistances?.Physical || 0,
        Magic: character.bonus_resistances?.Magic || 0,
        Fire: character.bonus_resistances?.Fire || 0,
        Lightning: character.bonus_resistances?.Lightning || 0,
        Dark: character.bonus_resistances?.Dark || 0,
        FlatPhysical: character.bonus_resistances?.FlatPhysical || 0,
        FlatMagic: character.bonus_resistances?.FlatMagic || 0,
        FlatFire: character.bonus_resistances?.FlatFire || 0,
        FlatLightning: character.bonus_resistances?.FlatLightning || 0,
        FlatDark: character.bonus_resistances?.FlatDark || 0
      },
      bonus: {
        active: character.bonus_resistances_active || false,
        Physical: character.bonus_resistances_temp?.Physical || 0,
        Magic: character.bonus_resistances_temp?.Magic || 0,
        Fire: character.bonus_resistances_temp?.Fire || 0,
        Lightning: character.bonus_resistances_temp?.Lightning || 0,
        Dark: character.bonus_resistances_temp?.Dark || 0,
        FlatPhysical: character.bonus_resistances_temp?.FlatPhysical || 0,
        FlatMagic: character.bonus_resistances_temp?.FlatMagic || 0,
        FlatFire: character.bonus_resistances_temp?.FlatFire || 0,
        FlatLightning: character.bonus_resistances_temp?.FlatLightning || 0,
        FlatDark: character.bonus_resistances_temp?.FlatDark || 0
      }
    },

    // Status bonus values (Foundry computes thresholds using these + statMods)
    bonusStatuses: character.bonus_statuses || { Bleed: 0, Poison: 0, Toxic: 0, Frost: 0, Curse: 0, Poise: 0 }
  }

  console.log('[Foundry Sync] Sending combat data for', character.name, combatData)
  send(MESSAGE_TYPES.COMBAT_DATA_RESPONSE, combatData)
}

function connect() {
  if (typeof window === 'undefined') return

  const state = getState()

  // Already connected or connecting - skip
  if (state.socket && (state.socket.readyState === WebSocket.OPEN || state.socket.readyState === WebSocket.CONNECTING)) {
    console.log('[Foundry Sync] Already connected')
    return
  }

  try {
    console.log('[Foundry Sync] Connecting to relay:', WEBSOCKET_URL)
    state.socket = new WebSocket(WEBSOCKET_URL)

    state.socket.onopen = () => {
      console.log('[Foundry Sync] Connected to relay')
      state.isConnected = true
      state.reconnectAttempts = 0
      send(MESSAGE_TYPES.APP_HANDSHAKE, { version: '1.0.0' })
      startHeartbeat()
    }

    state.socket.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error('[Foundry Sync] Failed to parse message:', err)
      }
    }

    state.socket.onclose = (event: CloseEvent) => {
      console.log('[Foundry Sync] Disconnected, code:', event.code)
      state.isConnected = false
      state.isFoundryConnected = false
      state.socket = null
      stopHeartbeat()
      scheduleReconnect()
    }

    state.socket.onerror = () => {
      console.warn('[Foundry Sync] Connection error - is the relay server running?')
    }

  } catch (err) {
    console.error('[Foundry Sync] Failed to connect:', err)
    scheduleReconnect()
  }
}

function startHeartbeat() {
  const state = getState()

  if (state.heartbeatInterval) return

  state.heartbeatInterval = setInterval(() => {
    if (state.isConnected) {
      send(MESSAGE_TYPES.APP_HEARTBEAT, { timestamp: Date.now() })
    }
  }, HEARTBEAT_INTERVAL)
}

function stopHeartbeat() {
  const state = getState()

  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval)
    state.heartbeatInterval = null
  }
}

function scheduleReconnect() {
  const state = getState()

  if (state.reconnectTimeout) return

  if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[Foundry Sync] Max reconnect attempts reached')
    return
  }

  state.reconnectAttempts++
  console.log(`[Foundry Sync] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${state.reconnectAttempts})`)

  state.reconnectTimeout = setTimeout(() => {
    state.reconnectTimeout = null
    connect()
  }, RECONNECT_DELAY)
}

function disconnect() {
  const state = getState()

  if (state.reconnectTimeout) {
    clearTimeout(state.reconnectTimeout)
    state.reconnectTimeout = null
  }

  if (state.socket) {
    state.socket.close()
    state.socket = null
  }

  state.isConnected = false
  state.isFoundryConnected = false
}

function notifyCharacterUpdate() {
  const character = getActiveCharacter()
  const state = getState()

  if (!character || !state.isConnected) return

  const compendiumStore = useCompendiumStore()
  const compendiumWeapons = compendiumStore.Weapons

  const twoHandingMainHand = character.combat_settings?.twoHandingMainHand || false
  const twoHandingOffHand = character.combat_settings?.twoHandingOffHand || false

  // Build weapon data with scaling
  const mainHandData = buildWeaponData(character.equipment?.MainHand, character.weapon_modifications, compendiumWeapons)
  const offHandData = buildWeaponData(character.equipment?.OffHand, character.weapon_modifications, compendiumWeapons)

  if (mainHandData) {
    mainHandData.scalingBonus = calculateWeaponScaling(mainHandData, twoHandingMainHand)
  }
  if (offHandData) {
    offHandData.scalingBonus = calculateWeaponScaling(offHandData, twoHandingOffHand)
  }

  // Build stat modifiers
  const statMods: Record<string, number> = {}
  if (character.stats) {
    for (const [key, value] of Object.entries(character.stats)) {
      statMods[key] = statMod(value as number)
    }
  }

  // Build skill modifiers
  const skillMods: Record<string, number> = {}
  if (character.skills) {
    for (const [key, value] of Object.entries(character.skills)) {
      skillMods[key] = (value as number) + skillModBonusFromStats(key)
    }
  }

  // Knowledge modifiers
  const knowledgeMods: Record<string, number> = {}
  if (character.knowledge) {
    for (const [key, value] of Object.entries(character.knowledge)) {
      knowledgeMods[key] = value as number
    }
  }

  send(MESSAGE_TYPES.CHARACTER_UPDATE, {
    uuid: character.uuid,
    name: character.name,
    maxHP: calculateMaxHP(character),
    maxFP: calculateMaxFP(character),
    maxAP: calculateMaxAP(character),
    stats: character.stats,
    statMods,
    skills: skillMods,
    knowledge: knowledgeMods,
    level: character.level,

    // Equipment
    mainHand: mainHandData,
    offHand: offHandData,

    // Resistance tables
    resistances: {
      primary: {
        Physical: character.bonus_resistances?.Physical || 0,
        Magic: character.bonus_resistances?.Magic || 0,
        Fire: character.bonus_resistances?.Fire || 0,
        Lightning: character.bonus_resistances?.Lightning || 0,
        Dark: character.bonus_resistances?.Dark || 0,
        FlatPhysical: character.bonus_resistances?.FlatPhysical || 0,
        FlatMagic: character.bonus_resistances?.FlatMagic || 0,
        FlatFire: character.bonus_resistances?.FlatFire || 0,
        FlatLightning: character.bonus_resistances?.FlatLightning || 0,
        FlatDark: character.bonus_resistances?.FlatDark || 0
      },
      bonus: {
        active: character.bonus_resistances_active || false,
        Physical: character.bonus_resistances_temp?.Physical || 0,
        Magic: character.bonus_resistances_temp?.Magic || 0,
        Fire: character.bonus_resistances_temp?.Fire || 0,
        Lightning: character.bonus_resistances_temp?.Lightning || 0,
        Dark: character.bonus_resistances_temp?.Dark || 0,
        FlatPhysical: character.bonus_resistances_temp?.FlatPhysical || 0,
        FlatMagic: character.bonus_resistances_temp?.FlatMagic || 0,
        FlatFire: character.bonus_resistances_temp?.FlatFire || 0,
        FlatLightning: character.bonus_resistances_temp?.FlatLightning || 0,
        FlatDark: character.bonus_resistances_temp?.FlatDark || 0
      }
    },

    // Status bonus values
    bonusStatuses: character.bonus_statuses || { Bleed: 0, Poison: 0, Toxic: 0, Frost: 0, Curse: 0, Poise: 0 }
  })
}

/**
 * Check if a change path is significant enough to trigger sync
 */
function isSignificantChange(changedPath: string): boolean {
  return SIGNIFICANT_CHANGE_PATHS.some(path =>
    changedPath === path || changedPath.startsWith(`${path}.`)
  )
}

/**
 * Schedule a debounced sync to Foundry
 * Called when character data changes significantly
 */
function scheduleDebouncedSync(characterUuid: string) {
  const state = getState()
  if (!state.isConnected) return

  // Clear existing timer
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer)
  }

  // Start new debounce timer
  syncDebounceTimer = setTimeout(() => {
    syncDebounceTimer = null
    sendCharacterUpdateForUuid(characterUuid)
  }, SYNC_DEBOUNCE_MS)
}

/**
 * Send character update for a specific UUID
 */
function sendCharacterUpdateForUuid(uuid: string) {
  const allChars = getAllCharacters()
  const character = allChars.characters.find(c => c.uuid === uuid)

  if (!character) return

  console.log(`[Foundry Sync] Sending debounced update for ${character.name}`)
  const payload = buildCharacterPayload(character)
  send(MESSAGE_TYPES.CHARACTER_UPDATE, payload)
}

/**
 * Notify Foundry of a character data change
 * Will debounce if the change is significant
 */
function onCharacterDataChanged(characterUuid: string, changedPath: string) {
  if (!isSignificantChange(changedPath)) {
    return // Not significant, don't sync
  }

  console.log(`[Foundry Sync] Significant change detected: ${changedPath}`)
  scheduleDebouncedSync(characterUuid)
}

export const foundrySyncApi = {
  connect,
  disconnect,
  send,
  notifyCharacterUpdate,
  onCharacterDataChanged,  // New: debounced sync on significant changes
  getState: () => {
    const state = getState()
    return {
      isConnected: state.isConnected,
      isFoundryConnected: state.isFoundryConnected
    }
  }
}

// Periodic check to ensure connection stays alive
function startConnectionMonitor() {
  const MONITOR_INTERVAL = 5000

  // Only start one monitor
  if ((window as any).__sd20_monitor__) return

  (window as any).__sd20_monitor__ = setInterval(() => {
    const state = getState()

    // If socket is closed/null and no reconnect scheduled, reconnect now
    if ((!state.socket || state.socket.readyState === WebSocket.CLOSED) && !state.reconnectTimeout) {
      console.log('[Foundry Sync] Monitor detected dead connection, reconnecting')
      state.socket = null
      state.isConnected = false
      connect()
    }
  }, MONITOR_INTERVAL)
}

export default defineNuxtPlugin(() => {
  console.log('[Foundry Sync] Plugin initializing')

  const state = getState()

  // Clean up dead socket if exists
  if (state.socket && state.socket.readyState === WebSocket.CLOSED) {
    console.log('[Foundry Sync] Cleaning up dead socket')
    state.socket = null
    state.isConnected = false
  }

  connect()
  startConnectionMonitor()

  return {
    provide: {
      foundrySync: foundrySyncApi
    }
  }
})
