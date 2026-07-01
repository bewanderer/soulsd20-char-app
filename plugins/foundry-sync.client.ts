// Foundry VTT WebSocket sync plugin
// Connects to relay server for Foundry communication

import { getActiveCharacter, getAllCharacters, onCharacterSync, type StoredCharacter } from '@/mixins/characterStorage'
import { statMod, skillModBonusFromStats } from '@/mixins/utils'
import { useCompendiumStore } from '@/store/compendium'
import { calculateWeaponScaling, calculateSpellScaling } from '@/mixins/combatUtils'
import { computeCombatHash } from '@/mixins/payloadHash'

// Set at plugin init from runtime config
let WEBSOCKET_URL = 'ws://localhost:8080'
const MAX_RECONNECT_ATTEMPTS = 50
const RECONNECT_DELAY = 3000
const CONNECTION_KEY = '__sd20_foundry_sync__'

// Debounce settings for sync
const SYNC_DEBOUNCE_MS = 2000
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Item 1 (Batch C): field-scoped delta emit.
// Fields listed here map to Foundry's DELTA_REGEN_MAP. If every changed field
// since the last transmit lands in this set, send a delta; otherwise fall
// back to the full CHARACTER_UPDATE payload. Keep the two sides in sync when
// adding new fields.
const DELTA_ELIGIBLE_ROOT_FIELDS = new Set([
  'stats',
  'skills',
  'knowledge',
  'level',
  'attuned_spells',
  'attuned_spirits',
  'attuned_weapon_skills',
  'bonus_resistances',
  'bonus_statuses',
  'bonus_resistances_active',
])
const DELTA_ELIGIBLE_DOT_FIELDS = new Set([
  'equipment.MainHand',
  'equipment.OffHand',
  'weapon_modifications',
  'combat_settings.twoHandingMainHand',
  'combat_settings.twoHandingOffHand',
])

const _lastSentSnapshots = new Map<string, string>()

function _stableStringify(value: unknown): string {
  const seen = new WeakSet()
  const walk = (v: any): any => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return null
      seen.add(v)
      if (Array.isArray(v)) return v.map(walk)
      const out: Record<string, unknown> = {}
      for (const key of Object.keys(v).sort()) out[key] = walk(v[key])
      return out
    }
    return v
  }
  return JSON.stringify(walk(value))
}

function _extractDeltaCandidates(character: any): Record<string, unknown> {
  const flat: Record<string, unknown> = {}
  if (!character || typeof character !== 'object') return flat
  for (const root of DELTA_ELIGIBLE_ROOT_FIELDS) {
    if (character[root] !== undefined) flat[root] = character[root]
  }
  for (const path of DELTA_ELIGIBLE_DOT_FIELDS) {
    const parts = path.split('.')
    let cur: any = character
    for (const p of parts) {
      if (cur == null) { cur = undefined; break }
      cur = cur[p]
    }
    if (cur !== undefined) flat[path] = cur
  }
  return flat
}

function _diffDeltaCandidates(current: Record<string, unknown>, prev: Record<string, unknown> | null): {
  eligible: boolean
  delta: Record<string, unknown>
} {
  const delta: Record<string, unknown> = {}
  const currentKeys = new Set(Object.keys(current))
  const prevKeys = new Set(prev ? Object.keys(prev) : [])
  const all = new Set<string>([...currentKeys, ...prevKeys])
  for (const key of all) {
    const c = current[key]
    const p = prev ? prev[key] : undefined
    if (_stableStringify(c) !== _stableStringify(p)) {
      delta[key] = c
    }
  }
  return { eligible: Object.keys(delta).length > 0, delta }
}

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
  // Optimization 3: field-scoped delta. Currently the full payload sync is
  // still the default path. This constant lets a caller opt in by calling
  // sendCharacterDelta directly.
  CHARACTER_DELTA_UPDATE: 'character:delta-update',
  FOUNDRY_READY: 'foundry:ready',
  CHARACTER_REQUEST_ALL: 'characters:request-all',
  CHARACTER_REQUEST: 'character:request',
  CHARACTER_REQUEST_LINKED: 'characters:request-linked',
  DAMAGE_APPLIED: 'combat:damage-applied',
  COMBAT_DATA_REQUEST: 'combat:request-data',
  COMBAT_DATA_RESPONSE: 'combat:response-data',
  CAMPAIGN_COMPENDIUM_UPDATED: 'campaign:compendium-updated',
  APP_SUBSCRIBE_CHARACTER: 'app:subscribe-character',
  APP_UNSUBSCRIBE_CHARACTER: 'app:unsubscribe-character',
  APP_CHARACTER_UPDATE: 'app:character-update'
}

// Stable per-tab origin used to suppress echo when our own broadcast comes back
// through the relay. (Belt-and-suspenders: the relay already excludes the sender.)
const APP_ORIGIN_ID = (typeof window !== 'undefined'
  ? ((window as any).__sd20_origin_id__ ||= `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
  : 'app-server')

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

// Foundry only knows what the App sends. When localStorage holds attunement
// stubs (loaded into Pinia before the compendium was ready and then persisted),
// re-hydrate from the in-memory compendium right before transmitting so the
// receiver never sees `{ skill_id: X, slot_number: Y }` shaped entries that
// turn into "undefined" macros downstream.
function rehydrateAttuned(items: any[] | undefined, compendiumList: any[] | undefined, idKey: string): any[] {
  if (!Array.isArray(items) || items.length === 0) return []
  if (!Array.isArray(compendiumList) || compendiumList.length === 0) {
    return items.filter(item => item && item.name)
  }
  const result: any[] = []
  for (const item of items) {
    if (!item) continue
    if (item.name && item.dice !== undefined) {
      result.push(item)
      continue
    }
    const id = item[idKey] ?? item.id
    if (id == null) continue
    const found = compendiumList.find(c => c.id === id)
    if (found) {
      result.push({ ...found, slot_number: item.slot_number })
    }
  }
  return result
}

// Same formula as ActiveCombatValueTracker.vue. Keep in sync if either changes.
function calculateMaxHP(character: ReturnType<typeof getActiveCharacter>): number {
  if (!character) return 0
  const startingHP = character.starting_hp || 0
  const levelHP = character.level_hp || 0
  const bonusHP = character.max_hp_bonus || 0
  const vitality = character.stats?.vitality || 10
  const vitMod = statMod(vitality)
  const level = character.level || 1
  const vitBonus = vitMod * Math.floor(level / 2)
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
    case MESSAGE_TYPES.APP_CHARACTER_UPDATE:
      handleIncomingAppUpdate(message.data)
      break

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
      const requestId = message.data.requestId as string | undefined
      if (requestedUuid) {
        sendCombatData(requestedUuid, actorId, requestId)
      }
      break

    case MESSAGE_TYPES.CHARACTER_REQUEST_LINKED:
      const linkedUuids = message.data.linkedUuids as string[]
      if (linkedUuids && Array.isArray(linkedUuids)) {
        sendLinkedCharacters(linkedUuids)
      }
      break

    case MESSAGE_TYPES.CAMPAIGN_COMPENDIUM_UPDATED:
      console.log('[Foundry Sync] Campaign compendium updated, refreshing...')
      const compStore = useCompendiumStore()
      compStore.isLoaded = false
      compStore.getCompendium()
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

  // Re-hydrate attunement stubs from the live compendium so any localStorage
  // entries that were saved before the compendium loaded do not propagate.
  const hydratedSpells = rehydrateAttuned(character.attuned_spells, compendiumStore.Spells, 'spell_id')
  const hydratedSpirits = rehydrateAttuned(character.attuned_spirits, compendiumStore.Spirits, 'spirit_id')
  const hydratedWeaponSkills = rehydrateAttuned(character.attuned_weapon_skills, compendiumStore.WeaponSkills, 'skill_id')

  // Attuned abilities with scaling bonus for App display (using primary catalyst)
  // Foundry will also use the catalysts array to generate per-catalyst macros
  const attunedSpellsWithScaling = hydratedSpells.map((spell: any) => ({
    ...spell,
    scalingBonus: primaryCastingImplement ? calculateSpellScaling(spell, primaryCastingImplement) : 0
  }))

  const attunedSpiritsWithScaling = hydratedSpirits.map((spirit: any) => ({
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

    maxHP: calculateMaxHP(character),
    maxFP: calculateMaxFP(character),
    maxAP: calculateMaxAP(character),

    // Equipment
    mainHand: mainHandData,
    offHand: offHandData,
    equipment: character.equipment,

    // CF2: All catalysts for multi-catalyst spell macro generation
    catalysts,

    // Attuned abilities (with primary catalyst scaling for App display)
    attuned_spells: attunedSpellsWithScaling,
    attuned_spirits: attunedSpiritsWithScaling,
    attuned_weapon_skills: hydratedWeaponSkills,

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

// Foundry's damageSystem.getActorResistances reads the {primary, bonus} shape;
// other consumers read the raw bonus_resistances. The combat payload ships both.
function buildCombatResistances(character: StoredCharacter) {
  const base = character.bonus_resistances
  const temp = character.bonus_resistances_temp
  return {
    primary: {
      Physical: base?.Physical || 0,
      Magic: base?.Magic || 0,
      Fire: base?.Fire || 0,
      Lightning: base?.Lightning || 0,
      Dark: base?.Dark || 0,
      FlatPhysical: base?.FlatPhysical || 0,
      FlatMagic: base?.FlatMagic || 0,
      FlatFire: base?.FlatFire || 0,
      FlatLightning: base?.FlatLightning || 0,
      FlatDark: base?.FlatDark || 0
    },
    bonus: {
      active: character.bonus_resistances_active || false,
      Physical: temp?.Physical || 0,
      Magic: temp?.Magic || 0,
      Fire: temp?.Fire || 0,
      Lightning: temp?.Lightning || 0,
      Dark: temp?.Dark || 0,
      FlatPhysical: temp?.FlatPhysical || 0,
      FlatMagic: temp?.FlatMagic || 0,
      FlatFire: temp?.FlatFire || 0,
      FlatLightning: temp?.FlatLightning || 0,
      FlatDark: temp?.FlatDark || 0
    }
  }
}

// Optimization 2: cache the built combat payload keyed by character uuid so
// we can short-circuit rebuilds when nothing that affects combat has changed.
// sourceHash is computed from computeCombatHash() over the fields that actually
// influence the built payload (stats, skills, equipment, attunements, two-hand
// flags, bonus resistances). If the hash matches, the cached payload is safe
// to reuse; if not, we rebuild and update the cache.
interface CombatPayloadCacheEntry {
  payload: ReturnType<typeof buildCharacterPayload>
  combatResistances: ReturnType<typeof buildCombatResistances>
  sourceHash: string
}
const combatPayloadCache = new Map<string, CombatPayloadCacheEntry>()

// Per-tab dedupe for combat:request-data. Multiple App tabs on the same
// account all see the request and would all respond, so Foundry receives
// duplicates. A short cross-tab claim via localStorage picks one responder.
const _respondedRequests = new Map<string, number>()
function _claimCombatDataRequest(uuid: string, requestId: string | undefined): boolean {
  if (!requestId) return true
  const key = `sd20_combat_req_${requestId}`
  if (typeof window === 'undefined') return true
  try {
    const existing = window.localStorage.getItem(key)
    if (existing) return false
    window.localStorage.setItem(key, String(Date.now()))
    // Stale cleanup
    const now = Date.now()
    for (const [k, ts] of _respondedRequests) {
      if (now - ts > 5000) _respondedRequests.delete(k)
    }
    _respondedRequests.set(requestId, now)
    setTimeout(() => {
      try { window.localStorage.removeItem(key) } catch {}
    }, 2000)
    return true
  } catch {
    return true
  }
}

function sendCombatData(uuid: string, actorId?: string, requestId?: string) {
  if (!_claimCombatDataRequest(uuid, requestId)) {
    console.log('[Foundry Sync] Skipping duplicate response, another tab is handling requestId=', requestId)
    return
  }

  const allChars = getAllCharacters()
  const character = allChars.characters.find(c => c.uuid === uuid)

  if (!character) {
    send(MESSAGE_TYPES.COMBAT_DATA_RESPONSE, { uuid, actorId, requestId, combatData: null })
    return
  }

  // Optimization 2: hash the fields that actually feed the combat payload.
  // If the cache entry matches, we skip the rebuild entirely.
  const currentHash = computeCombatHash(character)
  const cached = combatPayloadCache.get(uuid)
  let payload: ReturnType<typeof buildCharacterPayload>
  let resistances: ReturnType<typeof buildCombatResistances>

  if (cached && cached.sourceHash === currentHash) {
    console.log('[Foundry Sync] Combat payload cache HIT for', character.name)
    payload = cached.payload
    resistances = cached.combatResistances
  } else {
    console.log('[Foundry Sync] Combat payload cache MISS for', character.name, cached ? '(hash changed)' : '(first fetch)')
    payload = buildCharacterPayload(character)
    resistances = buildCombatResistances(character)
    combatPayloadCache.set(uuid, {
      payload,
      combatResistances: resistances,
      sourceHash: currentHash,
    })
  }

  const combatData = {
    ...payload,
    actorId,
    requestId,
    combatSettings: {
      twoHandingMainHand: character.combat_settings?.twoHandingMainHand || false,
      twoHandingOffHand: character.combat_settings?.twoHandingOffHand || false
    },
    // camelCase aliases consumed by Foundry's macroManager and damageSystem.
    attunedSpells: payload.attuned_spells,
    attunedSpirits: payload.attuned_spirits,
    attunedWeaponSkills: payload.attuned_weapon_skills,
    bonusStatuses: payload.bonus_statuses,
    resistances
  }

  console.log('[Foundry Sync] Sending combat data for', character.name, 'requestId=', requestId)
  send(MESSAGE_TYPES.COMBAT_DATA_RESPONSE, combatData)
}

function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sd20_auth_token')
}

function connect() {
  if (typeof window === 'undefined') return

  const state = getState()

  // Already connected or connecting - skip
  if (state.socket && (state.socket.readyState === WebSocket.OPEN || state.socket.readyState === WebSocket.CONNECTING)) {
    console.log('[Foundry Sync] Already connected')
    return
  }

  const token = getStoredAuthToken()
  if (!token) {
    console.log('[Foundry Sync] No auth token, skipping connect')
    return
  }

  try {
    const connectUrl = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`
    console.log('[Foundry Sync] Connecting to relay (authenticated)')
    state.socket = new WebSocket(connectUrl)

    state.socket.onopen = () => {
      console.log('[Foundry Sync] Connected to relay')
      state.isConnected = true
      state.reconnectAttempts = 0
      send(MESSAGE_TYPES.APP_HANDSHAKE, { version: '1.0.0' })
      // Item 9 (Batch C): relay only routes broadcasts to sockets that
      // explicitly subscribed. Reconnecting after a drop leaves the new
      // socket with an empty subscription list until we replay the ones
      // this tab already registered during the session.
      replaySessionSubscriptions()
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
      // 4401: relay rejected the token; retry would loop. Wait for re-login.
      if (event.code === 4401) {
        console.warn('[Foundry Sync] Auth rejected by relay - not auto-reconnecting')
        return
      }
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
 * Optimization 3: send a field-scoped delta instead of the full payload.
 * The delta can be either nested (`{ stats: { strength: 16 } }`) or dot-path
 * (`{ 'stats.strength': 16 }`). Foundry merges it into its stored snapshot
 * and invalidates cached macros for the character. Full CHARACTER_UPDATE
 * remains the default sync path today - this helper is available for
 * callers that already know which field changed.
 */
export function sendCharacterDelta(uuid: string, delta: Record<string, unknown>) {
  if (!uuid || !delta || typeof delta !== 'object' || Object.keys(delta).length === 0) return
  send(MESSAGE_TYPES.CHARACTER_DELTA_UPDATE, { uuid, delta })
}

/**
 * Send character update for a specific UUID.
 *
 * Item 1 (Batch C): try delta emit first. Extract the fields that Foundry's
 * macro dependency map cares about, compare against the last-sent snapshot
 * for this uuid. If only delta-eligible fields changed, send a delta message.
 * Otherwise fall back to the full CHARACTER_UPDATE payload. First-ever send
 * for a uuid is always the full payload since no prior snapshot exists.
 */
function sendCharacterUpdateForUuid(uuid: string) {
  const allChars = getAllCharacters()
  const character = allChars.characters.find(c => c.uuid === uuid)

  if (!character) return

  const candidates = _extractDeltaCandidates(character)
  const prev = _lastSentSnapshots.get(uuid)
  const prevParsed = prev ? JSON.parse(prev) as Record<string, unknown> : null
  const { eligible, delta } = _diffDeltaCandidates(candidates, prevParsed)

  if (prev && eligible) {
    // Send a delta. The Foundry receiver merges the delta into its cached
    // snapshot and calls invalidateCache(uuid, changedFields) so only the
    // affected macro categories regen.
    console.log(`[Foundry Sync] Sending delta for ${character.name}:`, Object.keys(delta))
    sendCharacterDelta(uuid, delta)
  } else {
    console.log(`[Foundry Sync] Sending full update for ${character.name}`)
    const payload = buildCharacterPayload(character)
    send(MESSAGE_TYPES.CHARACTER_UPDATE, payload)
  }

  _lastSentSnapshots.set(uuid, JSON.stringify(candidates))

  // Mirror the same snapshot to other App clients subscribed to this character.
  send(MESSAGE_TYPES.APP_CHARACTER_UPDATE, {
    characterUuid: uuid,
    origin: APP_ORIGIN_ID,
    snapshot: character,
    updated_at: character.updated_at || new Date().toISOString()
  })
}

// Item 9 (Batch C): remember every character uuid we have subscribed to in
// this session so the WS reconnect flow can replay the subscriptions and the
// relay keeps routing broadcasts to this tab.
const _sessionSubscribedUuids = new Set<string>()

let _isApplyingRemoteUpdate = false

export function isApplyingRemoteCharacterUpdate(): boolean {
  return _isApplyingRemoteUpdate
}

async function handleIncomingAppUpdate(data: Record<string, unknown>) {
  const characterUuid = data?.characterUuid as string | undefined
  const origin = data?.origin as string | undefined
  const snapshot = data?.snapshot as StoredCharacter | undefined
  if (!characterUuid || !snapshot) return
  if (origin && origin === APP_ORIGIN_ID) return // our own echo

  const incomingStamp = (data?.updated_at as string) || snapshot.updated_at
  try {
    const { getAllCharacters: getAll, saveCharacterList } = await import('@/mixins/characterStorage')
    const list = getAll()
    const existing = list.characters.find(c => c.uuid === characterUuid)
    const localStamp = existing?.updated_at
    if (localStamp && incomingStamp && Date.parse(localStamp) > Date.parse(incomingStamp)) {
      console.warn(`[Foundry Sync] Ignoring remote update for ${characterUuid}: local copy is newer`)
      return
    }

    _isApplyingRemoteUpdate = true
    try {
      if (existing) {
        Object.assign(existing, snapshot)
      } else {
        list.characters.push(snapshot)
      }
      saveCharacterList(list)
    } finally {
      _isApplyingRemoteUpdate = false
    }

    // If the affected character is the active one in the player store, ask it
    // to reload from localStorage so reactive views update instantly.
    try {
      const { usePlayerStore } = await import('@/store/player')
      const store = usePlayerStore()
      if ((store as any).UUID === characterUuid) {
        (store as any).loadActiveCharacter()
      }
    } catch (err) {
      console.warn('[Foundry Sync] Could not refresh playerStore after remote update', err)
    }
  } catch (err) {
    console.error('[Foundry Sync] Failed to apply remote character update', err)
  }
}

function subscribeToCharacter(uuid: string) {
  if (!uuid) return
  _sessionSubscribedUuids.add(uuid)
  send(MESSAGE_TYPES.APP_SUBSCRIBE_CHARACTER, { characterUuid: uuid, origin: APP_ORIGIN_ID })
}

function unsubscribeFromCharacter(uuid: string) {
  if (!uuid) return
  _sessionSubscribedUuids.delete(uuid)
  send(MESSAGE_TYPES.APP_UNSUBSCRIBE_CHARACTER, { characterUuid: uuid, origin: APP_ORIGIN_ID })
}

function replaySessionSubscriptions() {
  if (_sessionSubscribedUuids.size === 0) return
  console.log(`[Foundry Sync] Replaying ${_sessionSubscribedUuids.size} character subscriptions after reconnect`)
  for (const uuid of _sessionSubscribedUuids) {
    send(MESSAGE_TYPES.APP_SUBSCRIBE_CHARACTER, { characterUuid: uuid, origin: APP_ORIGIN_ID })
  }
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
  subscribeToCharacter,
  unsubscribeFromCharacter,
  isApplyingRemoteCharacterUpdate,
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
  // Set relay URL from runtime config
  const config = useRuntimeConfig()
  WEBSOCKET_URL = (config.public.RELAY_URL as string) || 'ws://localhost:8080'
  console.log('[Foundry Sync] Plugin initializing, relay:', WEBSOCKET_URL)

  const state = getState()

  // Clean up dead socket if exists
  if (state.socket && state.socket.readyState === WebSocket.CLOSED) {
    console.log('[Foundry Sync] Cleaning up dead socket')
    state.socket = null
    state.isConnected = false
  }

  connect()
  startConnectionMonitor()

  // Bug 20 + Bug 23: when any character changes in localStorage (active or not),
  // push a debounced full-snapshot update to Foundry so the actor stays in sync
  // without requiring a page reload or an explicit refresh. Storage events
  // always represent a real mutation, so we bypass the significance whitelist
  // and schedule a debounced sync directly.
  if (!(window as any).__sd20_storage_to_foundry__) {
    (window as any).__sd20_storage_to_foundry__ = true
    onCharacterSync((type, character) => {
      if (type === 'delete' || !character?.uuid) return
      scheduleDebouncedSync(character.uuid)
    })
  }

  return {
    provide: {
      foundrySync: foundrySyncApi
    }
  }
})
