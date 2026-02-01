// axios.js boot fajl
import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useAuthStore } from 'src/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
})
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password']

function isPublicRoute(url) {
  return PUBLIC_ROUTES.some((route) => url.includes(route))
}

export default defineBoot(({ app, router }) => {
  // <--- ovde dobijamo router
  const authStore = useAuthStore()

  api.interceptors.request.use((config) => {
    if (!isPublicRoute(config.url) && authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status

      if (status === 403) {
        const originalRequest = error.config
        if (originalRequest._retry) {
          authStore.logout()
          router.push('/') // <--- direktan redirect
          return Promise.reject(error)
        }

        originalRequest._retry = true
        try {
          await authStore.refresh()
          return api(originalRequest)
        } catch (e) {
          authStore.logout()
          router.push('/') // <--- direktan redirect
          return Promise.reject(e)
        }
      }

      if (status === 401) {
        authStore.logout()
        router.push('/') // <--- direktan redirect
      }

      return Promise.reject(error)
    },
  )

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
