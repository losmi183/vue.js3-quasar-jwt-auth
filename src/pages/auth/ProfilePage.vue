<template>
  <q-page class="flex flex-center" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
    <q-form @submit.prevent="submitProfileUpdate" class="column q-gutter-md">
      <div class="text-h5 text-center text-primary q-mb-sm">Profile</div>
      <!-- <div>USER: {{ user }}</div> -->
      <q-input disable filled v-model="user.email" label="Email" type="text" class="full-width" />
      <q-input
        filled
        v-model="user.name"
        label="Name"
        type="text"
        :rules="[nameRule]"
        class="full-width"
      />
      <q-input filled v-model="user.about" label="About" type="text" class="full-width" />
      <q-input
        filled
        label="Avatar"
        type="file"
        accept="image/*"
        @update:model-value="onAvatarChange"
        class="full-width"
      />
      <div v-if="user.avatarPreview" class="flex flex-center q-mt-sm">
        <q-avatar size="96px">
          <img :src="user.avatarPreview" alt="" />
        </q-avatar>
      </div>

      <q-btn label="UPDATE PROFILE" type="submit" color="primary" class="full-width q-py-sm" />
    </q-form>
  </q-page>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useAuthStore } from 'stores/auth'
import { Notify } from 'quasar'

const auth = useAuthStore()
const user = reactive({
  email: '',
  name: '',
  about: '',
  avatar: null,
  avatarPreview: null,
})

const nameRule = (val) => {
  return val?.trim().length >= 2 || 'Name must have at least 2 characters'
}

onMounted(async () => {
  const authUser = auth.getUser()

  user.email = authUser?.email || ''
  user.name = authUser?.name || ''
  user.about = authUser?.about || ''
  user.avatar = authUser?.avatar || ''
  user.avatarPreview = authUser?.avatar || ''
})

function onAvatarChange(file) {
  if (!file) return

  user.value.avatar = file

  // cleanup prethodnog preview-a
  if (user.value.avatarPreview?.startsWith('blob:')) {
    URL.revokeObjectURL(user.value.avatarPreview)
  }

  user.value.avatarPreview = URL.createObjectURL(file)
}

async function submitProfileUpdate() {
  try {
    await auth.profileUpdate(user.value.name, user.value.about, user.value.avatar)
  } catch (err) {
    console.error('Login error:', err)
    const message = err.response?.data?.message || 'Login failed'
    Notify.create({
      type: 'negative', // 'positive', 'warning', 'info'
      message: message,
      position: 'top-right',
      timeout: 3000,
    })
  }
}
</script>
