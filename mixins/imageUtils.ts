/**
 * Image utilities for inventory/equipment icons
 * Maps item data to appropriate icon filenames
 */

export interface IconCustomSettings {
  apply: boolean
  width?: number  // Percentage (0-100)
  height?: number  // Percentage (0-100)
  rotation?: number  // Degrees (-360 to 360)
  top?: number  // Percentage (0-100)
  left?: number  // Percentage (0-100)
}

// Default custom settings per item category
// To customize a whole category, change the settings here and set apply: true
const DEFAULT_CUSTOM_SETTINGS: Record<string, IconCustomSettings> = {
  'artifact': {
    apply: false,     // Set to true to apply custom settings to ALL artifacts
    width: 100,
    height: 100,
    rotation: 33,
    top: 45,
    left: 50
  },
  'weapon': {
    apply: false,     // Set to true to apply custom settings to ALL weapons
    width: 75,
    height: 75,
    rotation: 0,
    top: 45,
    left: 50
  },
  'armor': {
    apply: false,     // Set to true to apply custom settings to ALL armor
    width: 75,
    height: 75,
    rotation: 0,
    top: 45,
    left: 50
  },
  'ring': {
    apply: true,     // Set to true to apply custom settings to ALL rings
    width: 100,
    height: 100,
    rotation: 0,
    top: 47,
    left: 50
  },
  'tools': {
    apply: false,     // Set to true to apply custom settings to ALL tools
    width: 75,
    height: 75,
    rotation: 0,
    top: 45,
    left: 50
  },
  'misc': {
    apply: false,     // Set to true to apply custom settings to ALL misc items
    width: 75,
    height: 75,
    rotation: 0,
    top: 45,
    left: 50
  }
}

/**
 * Update default settings for an entire category
 * Use this to customize all items of a specific category at once
 */
export function setCategoryDefaultSettings(category: string, settings: Partial<IconCustomSettings>) {
  const normalizedCategory = category.toLowerCase()

  if (DEFAULT_CUSTOM_SETTINGS[normalizedCategory]) {
    DEFAULT_CUSTOM_SETTINGS[normalizedCategory] = {
      ...DEFAULT_CUSTOM_SETTINGS[normalizedCategory],
      ...settings
    }
  }
}

export function getIconCustomSettings(item: any): IconCustomSettings {
  const category = item?.category?.toLowerCase() || 'misc'

  // If item has custom settings and apply is true, use those
  if (item?.iconCustomSettings?.apply) {
    return item.iconCustomSettings
  }

  // Otherwise return default for category
  return DEFAULT_CUSTOM_SETTINGS[category] || DEFAULT_CUSTOM_SETTINGS['misc']
}

/**
 * Get the tier name based on requirement value
 * Used for weapons and armor
 */
function getTierFromRequirement(requirement: number): string {
  if (requirement >= 20) return 'Legendary'
  if (requirement >= 17) return 'High'
  if (requirement >= 14) return 'Medium'
  return 'Low'
}

/**
 * Get the highest requirement value from an item's requirements
 */
function getMaxRequirement(requirements: any): number {
  if (!requirements) return 0

  const values = [
    requirements.str || 0,
    requirements.dex || 0,
    requirements.int || 0,
    requirements.fai || 0,
    requirements.att || 0
  ]

  return Math.max(...values)
}

/**
 * Get icon filename for a weapon
 * Based on highest stat requirement
 */
export function getWeaponIconFile(weapon: any): string {
  const maxReq = getMaxRequirement(weapon.requirements)
  const tier = getTierFromRequirement(maxReq)
  return `Weapons_${tier} (1).png`
}

/**
 * Get icon filename for armor
 * Based on armor_type (LIGHT/MEDIUM/HEAVY) and highest stat requirement
 */
export function getArmorIconFile(armor: any): string {
  if (!armor.armor_type) return 'MArmor_Low (1).png'

  const maxReq = getMaxRequirement(armor.requirements)
  const tier = getTierFromRequirement(maxReq)

  // Map armor_type to prefix
  const typeMap: Record<string, string> = {
    'LIGHT': 'L',
    'MEDIUM': 'M',
    'HEAVY': 'H'
  }

  const prefix = typeMap[armor.armor_type] || 'M'
  return `${prefix}Armor_${tier} (1).png`
}

/**
 * Get icon filename for a ring
 * Based on tier field (1-4)
 */
export function getRingIconFile(ring: any): string {
  const tier = ring.tier || 1

  const tierMap: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Legendary'
  }

  const tierName = tierMap[tier] || 'Low'
  return `Ring_${tierName} (1).png`
}

/**
 * Get icon filename for an artifact
 * Artifacts have no tier variations
 */
export function getArtifactIconFile(): string {
  return 'Artifact (1).png'
}

/**
 * Get icon filename for tools
 */
export function getToolsIconFile(): string {
  return 'Tools (1).png'
}

/**
 * Get icon filename for miscellaneous items
 */
export function getMiscIconFile(): string {
  return 'Miscelaneous (1).png'
}

/**
 * Get the pedestal background image
 * Used as base layer for all item icons
 */
export function getPedestalIconFile(): string {
  return 'Pedestal (1).png'
}

/**
 * Main function to get icon filename for any item
 * Determines category and calls appropriate function
 */
export function getItemIconFile(item: any): string {
  if (!item || !item.category) return getMiscIconFile()

  const category = item.category.toLowerCase()

  switch (category) {
    case 'weapon':
      return getWeaponIconFile(item)
    case 'armor':
      return getArmorIconFile(item)
    case 'ring':
      return getRingIconFile(item)
    case 'artifact':
      return getArtifactIconFile()
    case 'tools':
      return getToolsIconFile()
    case 'misc':
    default:
      return getMiscIconFile()
  }
}
