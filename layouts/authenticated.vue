<script setup lang="ts">
const serverStore = useServerStore()
console.log("authenticated")
console.log(serverStore.url)
if (!serverStore.url) {
  await navigateTo('/setup')
}
</script>

<template>
  <AsideNavigation>
    <slot />
  </AsideNavigation>
</template>
