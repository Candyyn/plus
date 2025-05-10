<script setup lang="ts">
const serverStore = useServerStore()

if (!serverStore.url) {
    await navigateTo('/setup')

}
</script>

<template>
  <AsideNavigation>
    <slot />
  </AsideNavigation>
</template>
