<script setup lang="ts">
import { PhCornersIn, PhCornersOut } from '@phosphor-icons/vue'
import { addComponentEventListener } from '#imports'
import { Button } from '@/components/ui/button'
import {
  fullscreen as enterFullscreen,
  exitFullscreen,
} from '~/native/app/App'

const device = useDeviceStore()
const playerStore = usePlayerStore()
const fullscreen = computed(() => playerStore.fullscreen)

onMounted(() => {
  addComponentEventListener(
    document.documentElement,
    'fullscreenchange',
    () => {
      playerStore.fullscreen = !playerStore.fullscreen
    },
  )
})

function toggleFullscreen() {
  if (device.nativeEnvironment) {
    return toggleFullscreenNative()
  }

  return toggleFullscreenBrowser()
}

function toggleFullscreenBrowser() {
  if (fullscreen.value) {
    return document.exitFullscreen()
  }

  return document.documentElement.requestFullscreen()
}

function toggleFullscreenNative() {
  if (fullscreen.value) {
    playerStore.fullscreen = false
    return exitFullscreen()
  }
  playerStore.fullscreen = true
  return enterFullscreen()
}
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    @click="toggleFullscreen"
  >
    <PhCornersOut
      v-if="!fullscreen"
      :size="24"
    />

    <PhCornersIn
      v-else
      :size="24"
    />
  </Button>
</template>
