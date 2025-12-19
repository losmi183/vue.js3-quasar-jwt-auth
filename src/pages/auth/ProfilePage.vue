<template>
  <q-page class="flex flex-center" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
    <div class="row q-col-gutter-xl full-width justify-center">
      <!-- PROFILE -->
      <div class="col-12 col-md-5">
        <q-card class="q-pa-lg">
          <q-form @submit.prevent="submitProfileUpdate" class="column q-gutter-md">
            <div class="text-h5 text-center text-primary">Profile</div>

            <q-input disable filled v-model="email" label="Email" />
            <q-input filled v-model="name" label="Name" :rules="[nameRule]" />
            <q-input filled v-model="about" label="About" />

            <q-file filled v-model="avatar" label="Avatar" accept="image/*" />

            <q-btn
              label="Update profile"
              type="submit"
              color="primary"
              unelevated
              class="q-mt-md"
            />
          </q-form>
        </q-card>
      </div>

      <!-- PASSWORD -->
      <div class="col-12 col-md-5">
        <q-card class="q-pa-lg">
          <q-form @submit.prevent="submitPasswordUpdate" class="column q-gutter-md">
            <div class="text-h5 text-center text-primary">Password</div>

            <q-input
              filled
              v-model="password"
              label="Password"
              type="password"
              :rules="[passwordRule]"
            />

            <q-input
              filled
              v-model="passwordRepeat"
              label="Repeat password"
              type="password"
              :rules="[passwordRepeatRule]"
            />

            <q-btn
              label="Update password"
              type="submit"
              color="primary"
              unelevated
              class="q-mt-md"
            />
          </q-form>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from 'stores/auth'
// import { Notify } from 'quasar'
import { MyNotify } from 'src/components/MyNotify'

const auth = useAuthStore()

const email = ref(null)
const name = ref(null)
const about = ref(null)
const avatar = ref(null)

const password = ref(null)
const passwordRepeat = ref(null)

const nameRule = (val) => {
  return val?.trim().length >= 2 || 'Name must have at least 2 characters'
}
const passwordRule = (val) => {
  return val?.trim().length >= 4 || 'Password must have at least 4 characters'
}
const passwordRepeatRule = (val) => {
  return val === password.value || 'Passwords do not match'
}

watch(
  () => auth.user,
  (authUser) => {
    if (!authUser) return

    email.value = authUser?.email || ''
    name.value = authUser?.name || ''
    about.value = authUser?.about || ''
  },
  { immediate: true },
)

async function submitProfileUpdate() {
  try {
    const res = await auth.profileUpdate(name.value, about.value, avatar.value)
    MyNotify.success(res.data.message)
    auth.refresh()
  } catch (err) {
    console.error('Profile update error:', err)
    const message = err.response?.data?.message || 'Profile update failed'
    MyNotify.error(err)
  }
}

async function submitPasswordUpdate() {
  try {
    const res = await auth.passwordUpdate(password.value)
    MyNotify.success(res.data.message)
  } catch (err) {
    console.error('Profile update error:', err)
    const message = err.response?.data?.message || 'Password update failed'
    MyNotify.error(err)
  }
}
</script>
