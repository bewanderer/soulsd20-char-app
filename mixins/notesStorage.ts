import { usePlayerStore } from '@/store/player'
import { getAllCharacters, type StoredCharacter } from './characterStorage'

// Export notes standalone
export function exportNotes(): string {
  const playerStore = usePlayerStore()
  return JSON.stringify({
    notes: playerStore.Notes,
    exported_at: new Date().toISOString(),
    version: '1.0'
  }, null, 2)
}

// Export compendium standalone
export function exportCompendium(): string {
  const playerStore = usePlayerStore()
  return JSON.stringify({
    compendium: playerStore.Compendium,
    exported_at: new Date().toISOString(),
    version: '1.0'
  }, null, 2)
}

// Export notes + compendium together
export function exportNotesAndCompendium(): string {
  const playerStore = usePlayerStore()
  return JSON.stringify({
    notes: playerStore.Notes,
    compendium: playerStore.Compendium,
    exported_at: new Date().toISOString(),
    version: '1.0'
  }, null, 2)
}

// Export full character (includes notes & compendium)
export function exportCharacterFull(uuid: string): string | null {
  const characterList = getAllCharacters()
  const character = characterList.characters.find(c => c.uuid === uuid)
  if (!character) return null

  const playerStore = usePlayerStore()

  return JSON.stringify({
    character: character,
    notes: playerStore.Notes,
    compendium: playerStore.Compendium,
    exported_at: new Date().toISOString(),
    version: '1.0'
  }, null, 2)
}

// Download as file helper
export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Import notes standalone
export function importNotes(jsonString: string, mode: 'replace' | 'merge' = 'replace'): boolean {
  try {
    const data = JSON.parse(jsonString)

    if (!data.notes) {
      console.error('Invalid notes data')
      return false
    }

    const playerStore = usePlayerStore()

    if (mode === 'merge' && playerStore.Notes.sections) {
      // Merge: combine existing and new sections
      const existingIds = new Set(playerStore.Notes.sections.map(s => s.id))
      const newSections = data.notes.sections.filter((s: any) => !existingIds.has(s.id))
      playerStore.Notes.sections.push(...newSections)
    } else {
      // Replace: overwrite all sections
      playerStore.Notes = data.notes
    }

    playerStore.save()
    return true
  } catch (error) {
    console.error('Failed to import notes:', error)
    return false
  }
}

// Import compendium standalone
export function importCompendium(jsonString: string, mode: 'replace' | 'merge' = 'replace'): boolean {
  try {
    const data = JSON.parse(jsonString)

    if (!data.compendium) {
      console.error('Invalid compendium data')
      return false
    }

    const playerStore = usePlayerStore()

    if (mode === 'merge' && playerStore.Compendium.entries) {
      // Merge: combine existing and new entries
      const existingIds = new Set(playerStore.Compendium.entries.map(e => e.id))
      const newEntries = data.compendium.entries.filter((e: any) => !existingIds.has(e.id))
      playerStore.Compendium.entries.push(...newEntries)
    } else {
      // Replace: overwrite all entries
      playerStore.Compendium = data.compendium
    }

    playerStore.save()
    return true
  } catch (error) {
    console.error('Failed to import compendium:', error)
    return false
  }
}

// Import notes + compendium together
export function importNotesAndCompendium(
  jsonString: string,
  notesMode: 'replace' | 'merge' = 'replace',
  compendiumMode: 'replace' | 'merge' = 'replace'
): { notes: boolean; compendium: boolean } {
  try {
    const data = JSON.parse(jsonString)
    const playerStore = usePlayerStore()

    let notesSuccess = false
    let compendiumSuccess = false

    if (data.notes) {
      if (notesMode === 'merge' && playerStore.Notes.sections) {
        const existingIds = new Set(playerStore.Notes.sections.map(s => s.id))
        const newSections = data.notes.sections.filter((s: any) => !existingIds.has(s.id))
        playerStore.Notes.sections.push(...newSections)
      } else {
        playerStore.Notes = data.notes
      }
      notesSuccess = true
    }

    if (data.compendium) {
      if (compendiumMode === 'merge' && playerStore.Compendium.entries) {
        const existingIds = new Set(playerStore.Compendium.entries.map(e => e.id))
        const newEntries = data.compendium.entries.filter((e: any) => !existingIds.has(e.id))
        playerStore.Compendium.entries.push(...newEntries)
      } else {
        playerStore.Compendium = data.compendium
      }
      compendiumSuccess = true
    }

    if (notesSuccess || compendiumSuccess) {
      playerStore.save()
    }

    return { notes: notesSuccess, compendium: compendiumSuccess }
  } catch (error) {
    console.error('Failed to import:', error)
    return { notes: false, compendium: false }
  }
}

// Detect import type from JSON
export function detectImportType(jsonString: string): 'notes' | 'compendium' | 'both' | 'character' | 'unknown' {
  try {
    const data = JSON.parse(jsonString)

    if (data.character) return 'character'
    if (data.notes && data.compendium) return 'both'
    if (data.notes) return 'notes'
    if (data.compendium) return 'compendium'

    return 'unknown'
  } catch {
    return 'unknown'
  }
}
