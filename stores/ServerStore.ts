import type {
  BrandingOptions,
  PublicSystemInfo,
} from '@jellyfin/sdk/lib/generated-client'
import { defineStore } from 'pinia'

export enum ScheduledTasks {
  GLOBAL_SCAN = '7738148ffcd07979c7ceb148e06b3aed',
}

export const useServerStore = defineStore('server', {
  state: () => ({
    _url: null as null | string,

    info: null as null | PublicSystemInfo,
    config: null as null | BrandingOptions,
  }),

  getters: {
    url(): string {
      const config = useRuntimeConfig()
      console.log("Accesing server url")
      console.log(config.public)
      console.log(config.internalServerUrl)

      if (import.meta.server && config.internalServerUrl)
        return config.internalServerUrl

      if (config.public.serverUrl) return config.public.serverUrl

      return this._url!
    },

    public_url(): string {
      const config = useRuntimeConfig()
      console.log("Accesing public URL")
      console.log(config.public)
      console.log(config.internalServerUrl)

      if (config.public.serverUrl) return config.public.serverUrl

      return this._url!
    },
  },
  actions: {
    async testServerURL(url: string) {
      const uri = new URL(url).href.replace(/\/+$/, '')

      const { data, error } = await useFetch<PublicSystemInfo>(
        `${uri}/System/Info/Public`,
        { timeout: 5000 },
      )

      if (error.value) {
        throw new Error(error.value.message)
      }

      const info = data.value!

      if (!info.Id) {
        throw new Error('Unexpected Response')
      }

      this._url = uri
      this.info = info
    },

    async getServerConfig() {
      if (!this.url) return
      const { data, error } = await useFetch<BrandingOptions>(
        `${this.url}/Branding/Configuration`,
      )

      if (error.value) {
        throw new Error(error.value.message)
      }

      this.config = data.value!
    },

    async scanAllLibraries() {
      const auth = useAuthenticationStore()

      await useApiFetch(
        `ScheduledTasks/Running/${ScheduledTasks.GLOBAL_SCAN}`,
        {
          method: 'POST',
          headers: {
            Authorization: auth.header,
          },
        },
      )
    },

    async restartServer() {
      const auth = useAuthenticationStore()

      await useApiFetch(`System/Restart`, {
        method: 'POST',
        headers: {
          Authorization: auth.header,
        },
      })
    },

    async shutdownServer() {
      const auth = useAuthenticationStore()

      await useApiFetch(`System/Shutdown`, {
        method: 'POST',
        headers: {
          Authorization: auth.header,
        },
      })
    },
    setServerURL(url: string) {
      this._url = url
    },
  },

  persist: {
    pick: ['_url', 'info', 'config'],
  },
})
