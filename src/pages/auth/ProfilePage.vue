<template>
  <q-page class="flex flex-center" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
    <q-form @submit.prevent="submitProfileUpdate" class="column q-gutter-md">
      <div class="text-h5 text-center text-primary q-mb-sm">Profile</div>
      <!-- <div>USER: {{ user }}</div> -->
      <q-input disable filled v-model="email" label="Email" type="text" class="full-width" />
      <q-input
        filled
        v-model="name"
        label="Name"
        type="text"
        :rules="[nameRule]"
        class="full-width"
      />
      <q-input filled v-model="about" label="About" type="text" class="full-width" />

      <div class="q-field q-field--filled full-width q-mb-md">
        <label class="q-field__label" :class="$q.dark.isActive ? 'text-white' : 'text-grey-8'"
          >Avatar</label
        >
        <input
          filled
          label="Avatar"
          type="file"
          accept="image/*"
          @change="onFileChange"
          class="full-width"
        />
      </div>

      <q-btn label="UPDATE PROFILE" type="submit" color="primary" class="full-width q-py-sm" />
    </q-form>
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

const nameRule = (val) => {
  return val?.trim().length >= 2 || 'Name must have at least 2 characters'
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

function onFileChange(event) {
  const files = event.target.files

  if (!files || !files.length) {
    avatar.value = null
    return
  }

  avatar.value = files[0]
}

async function submitProfileUpdate() {
  try {
    const res = await auth.profileUpdate(name.value, about.value, avatar.value)
    MyNotify.success(res.data.message)
  } catch (err) {
    console.error('Profile update error:', err)
    const message = err.response?.data?.message || 'Login failed'
    MyNotify.error(err)
  }
}
</script>
