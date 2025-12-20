// Lineage and bloodline ability comparison utility

export interface EffectiveAbilities {
  vision?: any
  skill_bonuses?: any
  resistances?: any
  special_abilities?: any[]
  [key: string]: any
}

export interface Lineage {
  id: number
  name: string
  base_abilities: EffectiveAbilities
  [key: string]: any
}

export interface Bloodline {
  id: number
  name: string
  replaces_abilities: string[]
  new_abilities: EffectiveAbilities
  [key: string]: any
}

// Get effective abilities after applying bloodline modifications
export function getEffectiveAbilities(
  lineage: Lineage | null,
  bloodline: Bloodline | null
): EffectiveAbilities {
  if (!lineage) {
    return {}
  }

  if (!bloodline) {
    // No bloodline, return all base abilities
    return lineage.base_abilities || {}
  }

  // Clone base abilities
  const effective: EffectiveAbilities = JSON.parse(JSON.stringify(lineage.base_abilities || {}))

  // Remove abilities that bloodline replaces
  if (bloodline.replaces_abilities && Array.isArray(bloodline.replaces_abilities)) {
    for (const removedKey of bloodline.replaces_abilities) {
      delete effective[removedKey]
    }
  }

  // Add new abilities from bloodline
  if (bloodline.new_abilities) {
    for (const key in bloodline.new_abilities) {
      effective[key] = bloodline.new_abilities[key]
    }
  }

  return effective
}

// Get human-readable list of removed abilities
export function getRemovedAbilityNames(bloodline: Bloodline | null): string[] {
  if (!bloodline || !bloodline.replaces_abilities) {
    return []
  }

  return bloodline.replaces_abilities.map(key => {
    // Convert snake_case to Title Case
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  })
}

// Get list of granted abilities
export function getGrantedAbilityNames(bloodline: Bloodline | null): string[] {
  if (!bloodline || !bloodline.new_abilities) {
    return []
  }

  const granted: string[] = []

  // Check for special abilities
  if (bloodline.new_abilities.special_abilities && Array.isArray(bloodline.new_abilities.special_abilities)) {
    for (const ability of bloodline.new_abilities.special_abilities) {
      if (ability.name) {
        granted.push(ability.name)
      }
    }
  }

  // Check for other ability types
  for (const key in bloodline.new_abilities) {
    if (key !== 'special_abilities') {
      const formatted = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      granted.push(formatted)
    }
  }

  return granted
}
