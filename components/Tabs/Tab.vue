<template>
  <div
    class="tab-wrapper"
    @mouseenter="handleHover"
    @mouseleave="handleLeave"
  >
    <button
      class="tab-button"
      :class="{ active: isActive }"
      @click="handleClick"
    >
      <img
        :src="`./img/icons/${iconName}.png`"
        class="tab-icon"
        draggable="false"
        :alt="tabLabel"
      />
      <span class="tab-label">
        {{ tabLabel }}
        <span v-if="hasChildren" class="dropdown-arrow">▼</span>
      </span>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="hasChildren && showDropdown"
      class="dropdown-menu"
    >
      <button
        v-for="child in children"
        :key="child.id"
        class="dropdown-item"
        :class="{ active: activeTab === child.id }"
        @click="emitTab(child.id)"
      >
        {{ child.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ChildTab {
  id: string;
  label: string;
}

const props = defineProps({
  activeTab: {
    type: String,
    default: 'character'
  },
  tabIdentifier: {
    type: String,
    default: ''
  },
  tabLabel: {
    type: String,
    default: ''
  },
  iconName: {
    type: String,
    default: 'character'
  },
  children: {
    type: Array as () => ChildTab[],
    default: () => []
  }
})

const emit = defineEmits(['tab'])

const hasChildren = computed(() => props.children && props.children.length > 0)
const showDropdown = ref(false)
const clickedOpen = ref(false)

// Check if this tab or any of its children are active
const isActive = computed(() => {
  if (props.activeTab === props.tabIdentifier) return true
  if (hasChildren.value) {
    return props.children.some(child => child.id === props.activeTab)
  }
  return false
})

function handleClick() {
  if (hasChildren.value) {
    // Toggle dropdown on click
    clickedOpen.value = !clickedOpen.value
    showDropdown.value = clickedOpen.value
  } else {
    // Regular tab click
    emitTab(props.tabIdentifier)
  }
}

function handleHover() {
  if (hasChildren.value && !clickedOpen.value) {
    showDropdown.value = true
  }
}

function handleLeave() {
  if (hasChildren.value && !clickedOpen.value) {
    showDropdown.value = false
  }
}

function emitTab(tabOption: string) {
  clickedOpen.value = false
  showDropdown.value = false
  emit('tab', tabOption)
}
</script>

<style scoped>
.tab-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible; /* Allow dropdowns to show */
}

.tab-button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap-xs); /* Responsive: 0.25em */
  background: var(--color-bg-secondary);
  border: none;
  border-bottom: var(--border-width-accent) solid transparent; /* 3px */
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-hover);
  padding: var(--padding-sm) var(--padding-xs); /* Responsive: 0.74vh 0.37vh */
}

.tab-button:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-gold-inset);
}

.tab-button.active {
  background: var(--color-btn-primary-bg);
  border-bottom-color: var(--color-accent-gold-bright);
  color: #ffffff;
  box-shadow: var(--shadow-gold-inset);
}

.tab-icon {
  width: var(--icon-size-standard); /* Responsive: 1.25vw (~24px at 1920px) */
  height: var(--icon-size-standard);
  filter: brightness(0) invert(0.5);
  transition: filter 0.3s ease;
}

.tab-button:hover .tab-icon {
  filter: brightness(0) invert(0.8);
}

.tab-button.active .tab-icon {
  filter: brightness(0) invert(1);
}

.tab-label {
  font-size: var(--font-size-tiny); /* Responsive: clamp(10px, 0.625vw, 12px) */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  font-size: 8px;
  opacity: 0.7;
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-top: none;
  z-index: 2000; /* Higher than all content and character dropdown */
  box-shadow: var(--shadow-panel);
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-hover);
  font-size: var(--font-size-tiny);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: var(--border-width-thin) solid var(--color-border-tertiary);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--color-btn-primary-bg);
  color: var(--color-text-primary);
}

.dropdown-item.active {
  background: var(--color-btn-primary-bg-hover);
  color: #ffffff;
  font-weight: 600;
}

/* Responsive adjustments - icons scale automatically via vw */
@media (max-width: 768px) {
  .tab-label {
    display: none; /* Hide labels on mobile */
  }

  .tab-icon {
    width: var(--icon-size-large); /* Larger icons when no label */
    height: var(--icon-size-large);
  }

  .dropdown-menu {
    min-width: 150px;
  }
}
</style>