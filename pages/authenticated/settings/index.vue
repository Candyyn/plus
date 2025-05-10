<script setup lang="ts">
const serverStore = useServerStore()

const info = computed(() => serverStore.info)

console.log(serverStore.testServerURL(serverStore.url))

await serverStore.testServerURL(serverStore.url)
</script>

<template>
  <div class="grid gap-6">
    <h2 class="text-2xl font-semibold">
      General
    </h2>

    <SettingsAdminOnlyOverlay>
      <Card>
        <CardHeader>
          <CardTitle>{{ info?.ProductName }}</CardTitle>
        </CardHeader>
        <CardContent
          class="inline-flex flex-col justify-between gap-3 flex-wrap w-full"
        >
          <div
            class="details inline-flex flex-wrap justify-between w-full gap-4"
          >
            <div class="inline-flex detail flex-col gap-2">
              <span class="font-semibold">Name</span>
              <span class="text-secondary-foreground/50">{{
                info?.ServerName
              }}</span>
            </div>
            <div class="inline-flex detail flex-col gap-2">
              <span>Version</span>
              <span class="text-secondary-foreground/50">{{
                info?.Version
              }}</span>
            </div>

            <div class="inline-flex flex-wrap gap-2 justify-center">
              <SettingsServerScanLibraries />

              <SettingsServerRestart />

              <SettingsServerShutdown />
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsAdminOnlyOverlay>
    <SettingsAdminOnlyOverlay>
      <Card>
        <CardHeader>
          <CardTitle>Active Devices</CardTitle>
          <CardDescription />
        </CardHeader>
        <CardContent
          class="inline-flex flex-col justify-between gap-3 flex-wrap w-full"
        >
          <div
            class="details inline-flex flex-wrap justify-start w-full gap-4 basis-1/4"
          >
            <span class="text-secondary-foreground/50">Coming Soon</span>
          </div>
        </CardContent>
      </Card>
    </SettingsAdminOnlyOverlay>
  </div>
</template>
