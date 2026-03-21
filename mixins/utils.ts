import { usePlayerStore } from "~~/store/player"

export function skillModBonusFromStats(identifier: string): number {
  const playerStore = usePlayerStore()
  if (identifier === 'Athletics') return statMod(playerStore.CharacterStats.Stats.Strength) + statMod(playerStore.CharacterStats.Stats.Endurance)
  else if (identifier === 'Acrobatics') return statMod(playerStore.CharacterStats.Stats.Dexterity) + statMod(playerStore.CharacterStats.Stats.Endurance)
  else if (identifier === 'Perception') return statMod(playerStore.CharacterStats.Stats.Intelligence) + statMod(playerStore.CharacterStats.Stats.Endurance)
  else if (identifier === 'FireKeeping') return statMod(playerStore.CharacterStats.Stats.Faith) + statMod(playerStore.CharacterStats.Stats.Endurance)
  else if (identifier === 'Sanity') return statMod(playerStore.CharacterStats.Stats.Strength) + statMod(playerStore.CharacterStats.Stats.Attunement)
  else if (identifier === 'Stealth') return statMod(playerStore.CharacterStats.Stats.Dexterity) + statMod(playerStore.CharacterStats.Stats.Attunement)
  else if (identifier === 'Precision') return statMod(playerStore.CharacterStats.Stats.Intelligence) + statMod(playerStore.CharacterStats.Stats.Attunement)
  else if (identifier === 'Diplomacy') return statMod(playerStore.CharacterStats.Stats.Faith) + statMod(playerStore.CharacterStats.Stats.Attunement)
  return 0
}

export function statMod(statAmount: number): number {
  return Math.floor((statAmount - 10) / 2)
}

export function decreaseValue(value: string | number, min?: string | number) {
  value = Number(value)
  if (min === 0 || min) {
    min = Number(min)
    if (value <= min) return min
  }

  return value - 1
}

export function increaseValue(value: string | number, max?: string | number) {
  value = Number(value)
  if (max === 0 || max) {
    max = Number(max)
    if (value >= max) return max
  }

  return value + 1
}

export function getBackgroundHP(backgroundName: string) {
  switch (backgroundName) {
    case 'Knight':
      return 24
    case 'Mercenary':
      return 20
    case 'Warrior':
      return 27
    case 'Herald':
      return 20
    case 'Cruel Veteran':
      return 22
    case 'Assassin':
      return 20
    case 'Thief':
      return 17
    case 'Inquisitor':
      return 20
    case 'Sorcerer':
      return 14
    case 'Cleric':
      return 27
    case 'Pyromancer':
      return 17
    case 'Curious Noble':
      return 20
    case 'Wanderer':
      return 17
    case 'Deprived':
      return 20
    case 'Chaotic Tarnished':
      return 20
  }

  return 20
}