<template>
  <div class="tab-navigation">
    <Tab
      :active-tab="activeTab"
      tab-identifier="character"
      tab-label="Character"
      icon-name="character"
      @tab="emitTab($event)"
    />

    <Tab
      :active-tab="activeTab"
      tab-identifier="combat"
      tab-label="Combat"
      icon-name="weapons_high"
      @tab="emitTab($event)"
    />

    <Tab
      :active-tab="activeTab"
      tab-identifier="inventory"
      tab-label="Inventory"
      icon-name="backpack"
      @tab="emitTab($event)"
    />

    <Tab
      :active-tab="activeTab"
      tab-identifier="equipment"
      tab-label="Equipment"
      icon-name="armor"
      @tab="emitTab($event)"
    />

    <Tab
      :active-tab="activeTab"
      tab-identifier="spells"
      tab-label="Spells | Spirits | Weapon Skills"
      icon-name="book"
      @tab="emitTab($event)"
    />

    <Tab
      :active-tab="activeTab"
      tab-identifier="progression"
      tab-label="Progression"
      icon-name="tarot"
      :children="[
        { id: 'proficiencies', label: 'Weapon Proficiency Trees' },
        { id: 'feats', label: 'Destined Traits' }
      ]"
      @tab="emitTab($event)"
    />

    <Tab
      :active-tab="activeTab"
      tab-identifier="library"
      tab-label="Library"
      icon-name="dictionary"
      :children="[
        { id: 'notes', label: 'Notes' },
        { id: 'compendium', label: 'Compendium' }
      ]"
      @tab="emitTab($event)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps({
  activeTab: {
    type: String,
    default: 'character'
  }
})

const emit = defineEmits(['tab'])

function emitTab(tabOption: string) {
  emit('tab', tabOption)
}
</script>

<style scoped>
.tab-navigation {
  display: flex;
  width: 100%;
  height: var(--tab-navigation-height); /* Responsive: 6.02vh (~65px at 1080p) */
  background: #1f1f1f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  overflow: visible; /* Allow tab dropdowns to show */
  position: relative;
  z-index: 100; /* Base z-index for navigation */
}
</style>