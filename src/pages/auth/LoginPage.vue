<template>
  <q-page class="flex flex-center" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
    <div class="login-container q-pa-lg q-pa-md-md q-pa-sm-lg shadow-3 rounded-borders">
      <q-form @submit.prevent="submitLogin" class="column q-gutter-md">
        <div class="text-h5 text-center text-primary q-mb-sm">Login</div>

        <q-input
          filled
          v-model="email"
          label="Email"
          type="email"
          :rules="[emailRule]"
          class="full-width"
        />

        <q-input
          filled
          v-model="password"
          label="Password"
          type="password"
          :rules="[passwordRule]"
          class="full-width"
        />

        <q-btn label="Login" type="submit" color="primary" class="full-width q-py-sm" />
        <q-btn label="Home" @click="goHome" color="primary" class="full-width q-py-sm" />
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const emailRule = (val) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(val) || 'Email not valid'
}

const passwordRule = (val) => {
  return val?.trim().length >= 1 || 'Password must have at least 6 characters'
}
const errorMessage = ref(null)

async function submitLogin() {
  try {
    await auth.login(email.value, password.value)
    await auth.whoami()
    // router.push('/')
  } catch (err) {
    console.error('Login error:', err)
    const message = err.response?.data?.message || 'Login failed'
    errorMessage.value = message
    Notify.create({
      type: 'negative', // 'positive', 'warning', 'info'
      message: message,
      position: 'top-right',
      timeout: 3000,
    })
  }
}
function goHome() {
  router.push('/')
}
</script>
