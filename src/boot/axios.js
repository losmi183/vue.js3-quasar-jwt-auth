import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useAuthStore } from 'src/stores/auth'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: 'http://crypt-talk.test/api' })
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password']

function isPublicRoute(url) {
  return PUBLIC_ROUTES.some((route) => url.includes(route))
}

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  // request interceptor
  api.interceptors.request.use((config) => {
    const authStore = useAuthStore()

    if (!isPublicRoute(config.url) && authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  })

  // optional: response interceptor (401 handling)
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const authStore = useAuthStore()

      if (error.response?.status === 403) {
        const originalRequest = error.config

        if (originalRequest._retry) {
          authStore.logout()
          return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
          await authStore.refresh()
          return api(originalRequest)
        } catch (e) {
          authStore.logout()
          return Promise.reject(e)
        }
      }

      authStore.logout()
      return Promise.reject(error)
    },
  )

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
