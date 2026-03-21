<template>
  <div></div>
</template>

<script lang="ts" setup>
// Root page redirects to the dashboard (campaigns page)
definePageMeta({
  middleware: 'auth'
})

if (process.client) {
  navigateTo('/campaigns', { replace: true })
}
</script>
