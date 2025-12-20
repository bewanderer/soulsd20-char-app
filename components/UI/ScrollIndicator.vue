<template>
  <div
    v-if="hasScroll"
    class="scroll-indicator"
    :class="{ 'absolute-position': isRelative, 'active': isScrolling }"
    :style="{ top: scrollPosition + 'px' }"
  >
    <img src="/img/scroller.png" alt="Scroll position" class="scroll-icon" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(defineProps<{
  targetSelector?: string
  isRelative?: boolean
}>(), {
  targetSelector: '',
  isRelative: false
})

const scrollPosition = ref(0)
const hasScroll = ref(false)
const isScrolling = ref(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null
let targetElement: HTMLElement | Window | null = null
let containerHeight = 0
let iconHeight = 0

function updateScrollPosition() {
  if (!targetElement) return

  let scrollTop: number
  let scrollHeight: number
  let clientHeight: number

  if (targetElement instanceof Window) {
    scrollTop = document.documentElement.scrollTop
    scrollHeight = document.documentElement.scrollHeight
    clientHeight = document.documentElement.clientHeight
    containerHeight = window.innerHeight
  } else {
    scrollTop = targetElement.scrollTop
    scrollHeight = targetElement.scrollHeight
    clientHeight = targetElement.clientHeight
    containerHeight = targetElement.offsetHeight
  }

  const maxScroll = scrollHeight - clientHeight

  // Check if content is scrollable
  if (maxScroll > 0) {
    hasScroll.value = true

    // Calculate icon size (estimate)
    iconHeight = Math.max(24, Math.min(48, containerHeight * 0.03))

    // Calculate available travel distance (container height minus icon height)
    const availableHeight = containerHeight - iconHeight

    // Calculate position in pixels
    const pixelPosition = (scrollTop / maxScroll) * availableHeight
    scrollPosition.value = Math.min(availableHeight, Math.max(0, pixelPosition))

    // Show active state when scrolling
    isScrolling.value = true

    // Hide active state after 1.5 seconds of no scrolling
    if (hideTimeout) clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      isScrolling.value = false
    }, 1500)
  } else {
    hasScroll.value = false
  }
}

function setupScrollListener() {
  // Clean up old listener
  if (targetElement) {
    targetElement.removeEventListener('scroll', updateScrollPosition)
  }

  // Find new target element
  if (props.targetSelector) {
    targetElement = document.querySelector(props.targetSelector) as HTMLElement
  } else {
    targetElement = window
  }

  // Add new listener
  if (targetElement) {
    targetElement.addEventListener('scroll', updateScrollPosition)
    // Check initial scroll state
    updateScrollPosition()
  }
}

onMounted(() => {
  setupScrollListener()
})

onUnmounted(() => {
  if (targetElement) {
    targetElement.removeEventListener('scroll', updateScrollPosition)
  }
  if (hideTimeout) clearTimeout(hideTimeout)
})

// Watch for changes to targetSelector
watch(() => props.targetSelector, () => {
  setupScrollListener()
})
</script>

<style scoped>
.scroll-indicator {
  position: fixed;
  right: 8px;
  transition: top 0.1s ease-out, opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.1;
  transform: scale(0.4);
  border: none;
  outline: none;
  box-shadow: none;
}

.scroll-indicator.active {
  opacity: 0.8;
  transform: scale(1);
}

.scroll-indicator.absolute-position {
  position: absolute;
  right: 4px;
}

.scroll-icon {
  width: 3vw;
  min-width: 24px;
  max-width: 48px;
  height: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  border: none;
  outline: none;
  box-shadow: none;
}

.scroll-indicator:hover .scroll-icon {
  opacity: 1;
}
</style>
