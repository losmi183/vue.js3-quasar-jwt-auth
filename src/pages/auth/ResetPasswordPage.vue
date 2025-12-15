<template>
  <q-page class="flex flex-center" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
    <div class="auth-container q-pa-lg q-pa-md-md q-pa-sm-lg shadow-3 rounded-borders">
      <q-form @submit.prevent="submitResetPassword" class="column q-gutter-md">
        <div class="text-h5 text-center text-primary q-mb-sm">Reset password</div>
        <q-input
          filled
          v-model="password"
          label="password"
          type="password"
          :rules="[passwordRule]"
          class="full-width"
        />
        <q-input
          filled
          v-model="passwordRepeat"
          label="repeat password"
          type="password"
          :rules="[passwordRepeatRule]"
          class="full-width"
        />
        <q-btn
          label="Send recovery link"
          type="submit"
          color="primary"
          class="full-width q-py-sm"
        />
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { Notify } from 'quasar'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const forgotPasswordToken = route.params.forgot_password_token
const password = ref('')
const passwordRepeat = ref('')

const passwordRule = (val) => {
  return val?.trim().length >= 4 || 'Password must have at least 4 characters'
}
const passwordRepeatRule = (val) => {
  return val === password.value || 'Passwords do not match'
}

const errorMessage = ref(null)

async function submitResetPassword() {
  try {
    await auth.resetPassword(password.value, forgotPasswordToken)
    Notify.create({
      type: 'positive', // 'positive', 'warning', 'info'
      message: 'Your password reseted.',
      position: 'top-right',
      timeout: 3000,
    })
    router.push('/login')
  } catch (err) {
    console.error('Reset password error:', err)
    const message = err.response?.data?.message || 'Reset password failed'
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
