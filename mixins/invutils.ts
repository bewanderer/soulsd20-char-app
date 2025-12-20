export function itemCategoryDescription(tabName: string) {
  switch (tabName) {
    case 'all':
      return 'items'
    case 'tools':
      return 'tools'
    case 'misc':
      return 'miscellaneous items'
    case 'weapon':
      return 'weapons'
    case 'armor':
      return 'armor'
    case 'ring':
      return 'rings'
    case 'artifact':
      return 'artifacts'
  }

  return ''
}

// Slot-to-category mapping for equipment
export const slotCategoryMap: Record<string, string> = {
  MainHand: 'weapon',
  OffHand: 'weapon',
  Armor: 'armor',
  Artifact: 'artifact',
  Artifact2: 'artifact',
  Ring1: 'ring',
  Ring2: 'ring',
  Ring3: 'ring',
  Ring4: 'ring',
  Ring5: 'ring',
}

// Check if item can be equipped to slot
export function canEquipToSlot(item: any, slotName: string): boolean {
  const requiredCategory = slotCategoryMap[slotName]
  if (!requiredCategory) return false
  return item.category === requiredCategory
}

// Get valid slot names for an item category
export function getValidSlotsForCategory(category: string): string[] {
  return Object.entries(slotCategoryMap)
    .filter(([_, cat]) => cat === category)
    .map(([slot, _]) => slot)
}