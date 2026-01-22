import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useConversationStore } from './conversation'

export const useAuthStore = defineStore('auth', () => {
  // state
  const token = ref(null)
  const refreshToken = ref(null)
  const user = ref(null)
  const conversationStore = useConversationStore()
  const initialized = ref(false)

  // getters
  const isAuthenticated = computed(() => !!token.value)
  function getUser() {
    return user.value
  }

  async function initAuth() {
    if (initialized.value) return

    const savedToken = localStorage.getItem('token')
    const savedRefresh = localStorage.getItem('refreshToken')

    if (!savedToken || !savedRefresh) {
      initialized.value = true
      return
    }

    token.value = savedToken
    refreshToken.value = savedRefresh

    try {
      await whoami()
    } catch (error) {
      logout()
    } finally {
      initialized.value = true
    }
  }

  // actions
  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    token.value = res.data.token
    localStorage.setItem('token', token.value)
    refreshToken.value = res.data.refresh_token
    localStorage.setItem('refreshToken', refreshToken.value)
    return res.data
  }

  async function refresh() {
    if (!refreshToken.value) {
      refreshToken.value = localStorage.getItem('refreshToken')
    }
    if (!refreshToken.value) {
      return null
    }

    const res = await api.post('/auth/refresh', { refresh_token: refreshToken.value })
    token.value = res.data.token
    localStorage.setItem('token', token.value)
    refreshToken.value = res.data.refresh_token
    localStorage.setItem('refreshToken', refreshToken.value)
    return res.data
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    token.value = null
    refreshToken.value = null
    user.value = null
    conversationStore.reset()
  }

  function register(name, email, password) {
    api.post('/auth/register', { name, email, password })
  }

  async function forgotPassword(email) {
    api.post('/auth/forgot-password', { email })
  }

  async function resetPassword(password, forgotPasswordToken) {
    return api.post('/auth/reset-password', {
      password: password,
      forgot_password_token: forgotPasswordToken,
    })
  }

  async function whoami() {
    const res = await api.get('/auth/whoami')

    user.value = res.data
    user.value.avatarPath = null
    if (user.value.avatar) {
      user.value.avatarPath = import.meta.env.VITE_AVATAR_ULR + user.value.avatar
    }
  }

  // Profile
  async function profileUpdate(name, about, avatar) {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('about', about)
    if (avatar instanceof File) {
      formData.append('avatar', avatar)
    }

    return api.post('/auth/profile-update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async function passwordUpdate(password) {
    return api.post('/auth/password-update', { password })
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    initialized,
    initAuth,
    getUser,
    login,
    whoami,
    refresh,
    logout,
    register,
    forgotPassword,
    resetPassword,
    profileUpdate,
    passwordUpdate,
  }
})
