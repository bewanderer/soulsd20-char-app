/**
 * Optimization 2: cache-key hash for the combat payload sent to Foundry.
 *
 * Hashing only the fields that actually affect the built combat payload lets us
 * short-circuit rebuilds when a save is triggered by an unrelated edit (notes,
 * companions, etc.). See Debugging_2026_06_29.md Batch 1 for the field list.
 *
 * Uses FNV-1a because it is stable, small, and dependency-free. Not a
 * cryptographic hash and not meant to be one; false positives are impossible
 * (identical stable JSON always produces identical hash) and false negatives
 * are astronomically unlikely at this input size.
 */

import type { StoredCharacter } from './characterStorage'

function fnv1a(str: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return String(obj)
  if (typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']'
  const keys = Object.keys(obj as Record<string, unknown>).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify((obj as any)[k])).join(',') + '}'
}

export function computeCombatHash(c: Partial<StoredCharacter>): string {
  const relevant = {
    uuid: c.uuid,
    stats: c.stats,
    skills: c.skills,
    knowledge: c.knowledge,
    level: c.level,
    starting_hp: c.starting_hp,
    level_hp: c.level_hp,
    max_hp_bonus: c.max_hp_bonus,
    max_fp_bonus: c.max_fp_bonus,
    max_ap_bonus: c.max_ap_bonus,
    mainHand: c.equipment?.MainHand ?? null,
    offHand: c.equipment?.OffHand ?? null,
    weapon_modifications: c.weapon_modifications ?? {},
    attuned_spells: c.attuned_spells ?? [],
    attuned_spirits: c.attuned_spirits ?? [],
    attuned_weapon_skills: c.attuned_weapon_skills ?? [],
    twoHandingMainHand: c.combat_settings?.twoHandingMainHand ?? false,
    twoHandingOffHand: c.combat_settings?.twoHandingOffHand ?? false,
    bonus_resistances: c.bonus_resistances ?? null,
    bonus_resistances_active: c.bonus_resistances_active ?? false,
    bonus_statuses: c.bonus_statuses ?? null,
  }
  return fnv1a(stableStringify(relevant))
}
