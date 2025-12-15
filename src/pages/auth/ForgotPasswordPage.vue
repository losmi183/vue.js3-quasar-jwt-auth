<template>
  <q-page class="flex flex-center" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
    <div class="auth-container q-pa-lg q-pa-md-md q-pa-sm-lg shadow-3 rounded-borders">
      <q-form @submit.prevent="submitForgotPassword" class="column q-gutter-md">
        <div class="text-h5 text-center text-primary q-mb-sm">Forgot password</div>
        <q-input
          filled
          v-model="email"
          label="Email"
          type="email"
          :rules="[emailRule]"
          class="full-width"
        />
        <q-btn
          label="Send recovery link"
          type="submit"
          color="primary"
          class="full-width q-py-sm"
        />
      </q-form>
      <!-- Links -->
      <div class="q-mt-md text-center column items-center">
        <div class="q-mb-xs">
          Already have account?
          <q-btn
            flat
            label="Login here"
            color="primary"
            @click="router.push('/login')"
            class="q-ml-xs"
            dense
          />
        </div>
      </div>
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

const nameRule = (val) => {
  return val?.trim().length >= 2 || 'Password must have at least 2 characters'
}

const emailRule = (val) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(val) || 'Email not valid'
}

const passwordRule = (val) => {
  return val?.trim().length >= 4 || 'Password must have at least 4 characters'
}
const errorMessage = ref(null)

async function submitForgotPassword() {
  try {
    await auth.forgotPassword(email.value)
    Notify.create({
      type: 'positive', // 'positive', 'warning', 'info'
      message: 'Please check email for password recovery',
      position: 'top-right',
      timeout: 3000,
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    const message = err.response?.data?.message || 'Forgot password failed'
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
