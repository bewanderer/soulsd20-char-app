<template>
  <div class="panel-border attuned-weapon-skills-panel">
    <h3 class="panel-title">Attuned Weapon Skills</h3>

    <div v-if="attunedWeaponSkills.length > 0" class="weapon-skills-container">
      <div
        v-for="skill in attunedWeaponSkills"
        :key="skill.id"
        class="skill-card"
        @click="toggleSkillDescription(skill.id)"
      >
        <!-- Skill Header -->
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="text-base font-semibold text-yellow-500">
              {{ skill.name }}
            </div>
            <div class="text-sm text-gray-300 mt-1 space-y-1">
              <div class="flex gap-4">
                <span v-if="(skill as any).ap || (skill as any).cost_ap">
                  <span class="text-gray-400">AP:</span> {{ (skill as any).ap || (skill as any).cost_ap || 'N/A' }}
                </span>
                <span v-if="(skill as any).fp || (skill as any).cost_fp">
                  <span class="text-gray-400">FP:</span> {{ (skill as any).fp || (skill as any).cost_fp || 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Toggle Icon -->
          <div class="text-gray-400 ml-2">
            {{ expandedSkills.has(skill.id) ? '▼' : '▶' }}
          </div>
        </div>

        <!-- Skill Description (Toggled) -->
        <div
          v-if="expandedSkills.has(skill.id)"
          class="mt-3 pt-3 border-t border-gray-600 text-sm text-gray-300"
        >
          {{ skill.description || 'No description available.' }}
        </div>
      </div>
    </div>

    <div v-else class="text-gray-400 italic text-center py-4">
      No weapon skills attuned
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()
const expandedSkills = ref<Set<number>>(new Set())

// Apply modifications to attuned weapon skills
const attunedWeaponSkills = computed(() => {
  return (playerStore.AttunedWeaponSkills || []).map(skill => {
    const modifications = playerStore.WeaponSkillModifications[skill.id]
    if (!modifications) return skill
    // Merge modifications with original skill data
    return { ...skill, ...modifications }
  })
})

function toggleSkillDescription(skillId: number) {
  if (expandedSkills.value.has(skillId)) {
    expandedSkills.value.delete(skillId)
  } else {
    expandedSkills.value.add(skillId)
  }
}
</script>

<style scoped>
.attuned-weapon-skills-panel {
  height: 100%;
}

.panel-title {
  color: var(--color-accent-gold-bright);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  border-bottom: var(--border-width-medium) solid var(--color-border-primary);
  padding-bottom: var(--spacing-sm);
}

.weapon-skills-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skill-card {
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: var(--transition-hover);
}

.skill-card:hover {
  background: rgba(42, 42, 42, 0.8);
  border-color: var(--color-accent-gold-dim);
  box-shadow: var(--shadow-gold-soft);
}

.text-yellow-500 {
  color: var(--color-accent-gold-bright);
}

.text-gray-300 {
  color: var(--color-text-primary);
}

.text-gray-400 {
  color: var(--color-text-secondary);
}

.text-sm {
  font-size: var(--font-size-sm);
}

.text-base {
  font-size: var(--font-size-base);
}

.font-semibold {
  font-weight: var(--font-weight-semibold);
}

.italic {
  font-style: italic;
}

.space-y-1 > * + * {
  margin-top: var(--spacing-xs);
}

.flex {
  display: flex;
}

.flex-1 {
  flex: 1;
}

.gap-4 {
  gap: var(--spacing-lg);
}

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.mt-1 {
  margin-top: var(--spacing-xs);
}

.mt-3 {
  margin-top: var(--spacing-md);
}

.ml-2 {
  margin-left: var(--spacing-sm);
}

.pt-3 {
  padding-top: var(--spacing-md);
}

.py-4 {
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.border-t {
  border-top-width: var(--border-width-thin);
  border-top-style: solid;
}

.border-gray-600 {
  border-color: var(--color-border-primary);
}

.text-center {
  text-align: center;
}
</style>
