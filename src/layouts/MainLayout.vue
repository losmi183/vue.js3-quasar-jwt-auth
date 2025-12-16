<template>
  <q-layout>
    <q-header elevated>
      <q-toolbar v-if="isAuth">
        <q-btn flat dense round icon="menu" @click="toggleDrawer"></q-btn>

        <q-toolbar-title>Crypt Talk</q-toolbar-title>

        <q-btn flat round dense class="q-ml-md" @click="menu = !menu">
          <q-avatar size="32px" class="q-mr-sm">
            <img src="https://i.pravatar.cc/150?img=3" alt="Avatar" />
          </q-avatar>
          <span>John Doe</span>
          <q-icon name="arrow_drop_down" class="q-ml-xs" />
        </q-btn>

        <q-menu v-model="menu" anchor="bottom right" self="top right">
          <q-list padding>
            <!-- Profile -->
            <q-item clickable v-ripple>
              <q-item-section>Settings</q-item-section>
            </q-item>

            <q-separator></q-separator>

            <!-- Theme Switch -->
            <q-item clickable v-ripple>
              <q-item-section>
                <div class="row items-center justify-between">
                  <span>Theme</span>
                  <q-toggle v-model="darkMode" @update:model-value="toggleDark" label="Dark Mode" />
                  <!-- <q-btn round flat icon="brightness_6" @click="$q.dark.toggle()"></q-btn> -->
                </div>
              </q-item-section>
            </q-item>

            <q-separator />

            <!-- Logout -->
            <q-item clickable v-ripple>
              <q-item-section @click="logout" class="text-negative">Logout</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-toolbar>
      <q-toolbar v-else>
        <!-- sve guramo desno -->
        <q-space />

        <!-- Theme toggle -->
        <div class="row items-center q-mr-md">
          <span class="q-mr-sm">Theme</span>
          <q-toggle
            v-model="darkMode"
            @update:model-value="toggleDark"
            dense
            :color="darkMode ? 'blue-5' : 'blue-5'"
            track-color="grey-3"
            thumb-color="white"
          />
        </div>

        <!-- Login -->
        <q-btn round flat dense icon="login" color="grey-3" to="/login">
          <q-tooltip>Login</q-tooltip>
        </q-btn>

        <!-- Register -->
        <q-btn round flat dense icon="person_add" color="grey-3" to="/register">
          <q-tooltip>Register</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="isAuth" v-model="drawer" show-if-above bordered>
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
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const drawer = ref(null)
const user = ref(null)
const darkMode = ref(false)

const isAuth = computed(() => auth.isAuthenticated)

function toggleDrawer() {
  drawer.value = !drawer.value
}
function toggleDark(val) {
  Dark.set(val)
  localStorage.setItem('dark-mode', val)
}

function logout() {
  auth.logout()
  router.push('/')
}

// --- DARK MODE ---
import { Dark } from 'quasar'

// 1️⃣ Proveri localStorage prilikom mount-a
onMounted(async () => {
  // Dark theme
  const savedTheme = localStorage.getItem('dark-mode')
  if (savedTheme !== null) {
    Dark.set(savedTheme === 'true')
    darkMode.value = savedTheme === 'true'
  }
  // Auth user check
  const user = auth.getUser
  if (!auth.getUser()) {
    if (await auth.refresh()) {
      await auth.whoami()
    }
  }
})

watch(
  () => Dark.isActive,
  (val) => {
    localStorage.setItem('dark-mode', val)
  },
)
</script>
