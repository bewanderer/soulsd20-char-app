import { usePlayerStore } from '@/store/player'

// Get stat modifier from character stats
export function getStatMod(stat: 'Vitality' | 'Endurance' | 'Strength' | 'Dexterity' | 'Attunement' | 'Intelligence' | 'Faith'): number {
  const playerStore = usePlayerStore()
  const statValue = playerStore.CharacterStats.Stats[stat]
  return Math.floor((statValue - 10) / 2)
}

// Scaling grade to multiplier mapping
export function getScalingMultiplier(grade: string): number {
  const multipliers: Record<string, number> = {
    '': 0,
    'E': 0.5,
    'D': 1,
    'C': 1.5,
    'B': 2,
    'A': 2.5,
    'S': 3,
    'SS': 4,
    'SSS': 5
  }
  return multipliers[grade?.toUpperCase()] || 0
}

// Adjust scaling grade by offset (for two-handing)
export function adjustScalingGrade(grade: string, offset: number): string {
  const gradeOrder = ['', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']
  const currentIndex = gradeOrder.indexOf(grade?.toUpperCase())

  if (currentIndex === -1) return offset > 0 ? 'E' : ''

  // Max index is 7 (SS), not beyond
  const maxIndex = gradeOrder.length - 1
  const newIndex = Math.max(0, Math.min(currentIndex + offset, maxIndex))
  return gradeOrder[newIndex]
}

// Map API stat names to store stat names
function mapApiStatToStoreStat(apiStat: string): 'Vitality' | 'Endurance' | 'Strength' | 'Dexterity' | 'Attunement' | 'Intelligence' | 'Faith' {
  const mapping: Record<string, 'Vitality' | 'Endurance' | 'Strength' | 'Dexterity' | 'Attunement' | 'Intelligence' | 'Faith'> = {
    'VIT': 'Vitality',
    'END': 'Endurance',
    'STR': 'Strength',
    'DEX': 'Dexterity',
    'ATT': 'Attunement',
    'INT': 'Intelligence',
    'FAI': 'Faith'
  }
  return mapping[apiStat.toUpperCase()] || 'Strength'
}

// Calculate weapon scaling bonus
export function calculateWeaponScaling(weapon: any, twoHanding: boolean = false): number {
  if (!weapon || !weapon.scaling || weapon.scaling.length === 0) return 0

  let totalBonus = 0
  const scalingArray = [...weapon.scaling]

  // Track whether weapon originally had STR scaling
  const hadOriginalStrScaling = scalingArray.some((s: any) => s.stat === 'STR')

  // Two-handing: if no STR scaling exists, add STR: E
  if (twoHanding && !hadOriginalStrScaling) {
    scalingArray.unshift({ stat: 'STR', grade: 'E', value: 'E' })
  }

  scalingArray.forEach((scaling: any) => {
    const apiStat = scaling.stat
    let grade = scaling.grade || scaling.value

    // Skip if no grade found
    if (!grade) return

    // Two-handing: +1 STR scaling (only if weapon originally had STR scaling)
    if (twoHanding && apiStat === 'STR' && hadOriginalStrScaling) {
      grade = adjustScalingGrade(grade, 1)
    }

    const storeStat = mapApiStatToStoreStat(apiStat)
    const statMod = getStatMod(storeStat)
    const multiplier = getScalingMultiplier(grade)

    // Calculate scaling bonus and floor each individual contribution
    const scalingBonus = multiplier * statMod
    totalBonus += Math.floor(scalingBonus)
  })

  return totalBonus
}

// Get spell scaling from equipped casting implement
// Returns the scaling grade based on weapon's spell_scaling and spell requirements
export function getSpellScalingFromImplement(spell: any, equippedWeapon: any): any[] {
  if (!equippedWeapon || !equippedWeapon.spell_scaling || equippedWeapon.spell_scaling.length === 0) {
    return []
  }

  if (!spell || !spell.requirements) {
    // No requirements, use base scaling (lowest tier)
    return equippedWeapon.spell_scaling.map((s: any) => ({
      stat: s.stat,
      grade: s.grade
    }))
  }

  // Get spell requirements
  const spellReqs = spell.requirements

  // Group scaling by stat
  const scalingByStat: Record<string, any[]> = {}
  equippedWeapon.spell_scaling.forEach((scaling: any) => {
    const stat = scaling.stat
    if (!scalingByStat[stat]) scalingByStat[stat] = []
    scalingByStat[stat].push(scaling)
  })

  // For each stat, find the highest tier the spell qualifies for
  const result: any[] = []

  Object.keys(scalingByStat).forEach(statKey => {
    // Check if spell actually has a requirement for this stat
    const spellReqValue = spellReqs[statKey.toLowerCase()] || spellReqs[statKey] || 0

    // If spell has no requirement for this stat (0 or undefined), skip this weapon scaling
    if (!spellReqValue || spellReqValue === 0) {
      return
    }

    const tiers = scalingByStat[statKey]
    // Sort tiers by requirement descending (highest first)
    tiers.sort((a, b) => {
      const reqA = a.requirement || 0
      const reqB = b.requirement || 0
      return reqB - reqA
    })

    // Find the highest tier the spell qualifies for
    let selectedTier = tiers[tiers.length - 1] // Default to lowest tier

    for (const tier of tiers) {
      const tierRequirement = tier.requirement || 0

      if (spellReqValue >= tierRequirement) {
        selectedTier = tier
        break
      }
    }

    result.push({
      stat: selectedTier.stat,
      grade: selectedTier.value || selectedTier.grade,
      requirement: selectedTier.requirement
    })
  })

  return result
}

// Calculate spell scaling bonus (INT/FAI/STR/DEX depending on implement)
export function calculateSpellScaling(spell: any, equippedWeapon: any): number {
  const scalingArray = getSpellScalingFromImplement(spell, equippedWeapon)

  if (scalingArray.length === 0) return 0

  let totalBonus = 0

  scalingArray.forEach((scaling: any) => {
    const apiStat = scaling.stat
    const grade = scaling.grade
    const storeStat = mapApiStatToStoreStat(apiStat)
    const statMod = getStatMod(storeStat)
    const multiplier = getScalingMultiplier(grade)

    // Calculate scaling bonus and floor each individual contribution
    const scalingBonus = multiplier * statMod
    totalBonus += Math.floor(scalingBonus)
  })

  return totalBonus
}

// Format dice for display
export function formatDice(diceArray: any[]): string {
  if (!diceArray || diceArray.length === 0) return 'N/A'

  return diceArray.map(d => `${d.count}d${d.value || d.sides}`).join(' + ')
}

// Get unique damage types from dice
export function getDamageTypes(diceArray: any[]): string {
  if (!diceArray || diceArray.length === 0) return 'N/A'

  const types = diceArray.map(d => d.type || d.element).filter(Boolean)
  return [...new Set(types)].join(', ') || 'Physical'
}
