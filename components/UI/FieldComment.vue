<template>
  <div class="field-comment-wrapper" ref="triggerElement">
    <!-- Note icon button - changes appearance when note exists -->
    <button
      @click="togglePopover"
      class="comment-button"
      :class="{ 'has-comment': hasComment }"
      type="button"
      :title="hasComment ? 'View/Edit note' : 'Add note'"
    >
      <UIcon name="i-heroicons-pencil-square" class="comment-icon" />
    </button>

    <!-- Popover (not modal) - teleported to body to avoid z-index issues -->
    <Teleport to="body">
      <div v-if="showPopover" class="comment-popover" :style="popoverPosition" @click.stop>
        <textarea
          v-model="commentText"
          :placeholder="`Add notes for ${fieldLabel}...`"
          rows="6"
          @blur="saveComment"
        />
        <button @click="clearComment" class="clear-btn">Clear</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '~/store/player'

const props = defineProps<{
  fieldKey: string
  fieldLabel: string
}>()

const playerStore = usePlayerStore()
const showPopover = ref(false)
const commentText = ref(playerStore.FieldNotes[props.fieldKey] || '')
const triggerElement = ref<HTMLElement | null>(null)
const popoverPosition = ref({ top: '0px', left: '0px' })

const hasComment = computed(() => {
  return !!(playerStore.FieldNotes && playerStore.FieldNotes[props.fieldKey])
})

function updatePopoverPosition() {
  if (!triggerElement.value) return

  const rect = triggerElement.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const popoverWidth = 400 // max-width from CSS

  // Position below the trigger
  let top = rect.bottom + 4
  let left = rect.right - popoverWidth

  // If popover would go off left edge, align to left of trigger
  if (left < 8) {
    left = rect.left
  }

  // If popover would go off right edge, align to right edge of viewport
  if (left + popoverWidth > viewportWidth - 8) {
    left = viewportWidth - popoverWidth - 8
  }

  popoverPosition.value = {
    top: `${top}px`,
    left: `${left}px`
  }
}

function togglePopover() {
  showPopover.value = !showPopover.value
  if (showPopover.value) {
    updatePopoverPosition()
  }
}

function saveComment() {
  if (commentText.value.trim() === '') {
    clearComment()
  } else {
    playerStore.updateFieldNote(props.fieldKey, commentText.value)
  }
  showPopover.value = false
}

function clearComment() {
  commentText.value = ''
  playerStore.updateFieldNote(props.fieldKey, '')
  showPopover.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (showPopover.value && !target.closest('.comment-popover') && !target.closest('.field-comment-wrapper')) {
    showPopover.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', updatePopoverPosition, true)
  window.addEventListener('resize', updatePopoverPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updatePopoverPosition, true)
  window.removeEventListener('resize', updatePopoverPosition)
})
</script>

<style scoped>
.field-comment-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem; /* Add spacing from adjacent elements */
  padding: 0.125rem; /* Add padding to prevent clipping */
}

/* Note button - 40% larger, with proper spacing to avoid clipping */
.comment-button {
  width: 1.6rem; /* 40% larger than 18px (~25px) */
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-hover);
  padding: 0.2rem; /* Add internal padding */
  flex-shrink: 0; /* Prevent shrinking in flex layouts */
}

.comment-icon {
  width: 100%; /* Responsive size relative to button */
  height: 100%;
  color: rgba(255, 255, 255, 0.4);
  transition: var(--transition-hover);
  flex-shrink: 0;
}

/* When note exists - make it VERY visible with golden color */
.comment-button.has-comment {
  background: var(--color-btn-primary-bg-hover);
  border-color: var(--color-accent-gold-bright);
  box-shadow: inset 0 0 8px var(--color-gold-rgba-medium);
}

.comment-button.has-comment .comment-icon {
  color: var(--color-accent-gold-bright);
}

/* Hover states */
.comment-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.comment-button:hover .comment-icon {
  color: rgba(255, 255, 255, 0.7);
}

.comment-button.has-comment:hover {
  background: var(--color-btn-primary-bg-active);
  border-color: var(--color-accent-gold);
  box-shadow: inset 0 0 12px var(--color-gold-rgba-medium), 0 0 8px var(--color-gold-rgba-medium);
}

.comment-button.has-comment:hover .comment-icon {
  color: var(--color-accent-gold-bright);
  transform: scale(1.1);
}

/* Popover (not modal - positioned near field) - uses fixed positioning when teleported */
.comment-popover {
  position: fixed;
  background: var(--color-bg-secondary);
  border: var(--border-width-medium) solid var(--color-accent-gold-bright);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm);
  min-width: 250px;
  max-width: 400px;
  box-shadow: var(--shadow-gold-strong);
  z-index: 15000; /* Above navigation */
}

.comment-popover textarea {
  width: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: var(--border-width-thin) solid var(--color-border-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: var(--spacing-sm);
  transition: var(--transition-hover);
}

.comment-popover textarea:focus {
  outline: none;
  border-color: var(--color-accent-gold-bright);
  box-shadow: var(--shadow-gold-soft);
}

.clear-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: var(--border-width-thin) solid var(--color-btn-danger-border);
  background: var(--color-btn-danger-bg);
  color: var(--color-btn-danger-text);
  font-size: 11px;
  cursor: pointer;
  transition: var(--transition-hover);
}

.clear-btn:hover {
  background: var(--color-btn-danger-bg-hover);
  box-shadow: 0 0 8px rgba(220, 20, 60, 0.6);
}
</style>
