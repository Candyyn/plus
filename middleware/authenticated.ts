import type { UserDto } from '@jellyfin/sdk/lib/generated-client'

export default defineNuxtRouteMiddleware(() => {
  callOnce(async () => {
    const serverStore = useServerStore()
    const server = useCookie('server')

    if (window?.wails) {
      await useNativeStorage()
    }
    console.log("MIDDLEWARE");
    console.log(server.value)
    console.log(serverStore.url);
    console.log(!server.value && !serverStore.url)
    if (!server.value && !serverStore.url) return setup()

    const authentication = useCookie('authentication')
    const user = useCookie('user')
    const authStore = useAuthenticationStore()
    const userStore = useUserStore()
    const l = useLoggerStore()

    const auth = authentication.value as unknown as {
      _header: {
        client: string
        device: string
        deviceID: string
        version: string
        authorization: string
      }
      loggedIn: boolean
    }

    if (!auth) return login()

    authStore._header = auth._header
    authStore.loggedIn = auth.loggedIn

    const userVal = user.value as unknown as { user: UserDto }
    if (!userVal?.user) return login()

    userStore.user = userVal.user

    l.$log({
      type: 'info',
      location: 'Middleware',
      message: `You're authenticated! Welcome back ${userStore.user.Name} :)`,
    })
  })
})

function login() {
  return '/login'
}

function setup() {
  return '/setup'
}
