<template>
  <q-layout>
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleDrawer"></q-btn>

        <q-toolbar-title>Username placeholder</q-toolbar-title>

        <q-btn round flat icon="brightness_6" @click="$q.dark.toggle()"></q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above bordered>
      <q-list>
        <q-item active clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="star"></q-icon>
          </q-item-section>
          <q-item-section>star</q-item-section>
        </q-item>
        <q-item clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="send"></q-icon>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'

const auth = useAuthStore()
const drawer = ref(null)
const user = ref(null)

function toggleDrawer() {
  drawer.value = !drawer.value
}

// --- DARK MODE ---
import { Dark } from 'quasar'

// 1️⃣ Proveri localStorage prilikom mount-a
onMounted(async () => {
  // Dark theme
  const savedTheme = localStorage.getItem('dark-mode')
  if (savedTheme !== null) {
    Dark.set(savedTheme === 'true')
  }
  // Auth user check
  const user = auth.getUser
  if (!auth.getUser()) {
    await auth.refresh()
    await auth.whoami()
  }
})

watch(
  () => Dark.isActive,
  (val) => {
    localStorage.setItem('dark-mode', val)
  },
)
</script>
