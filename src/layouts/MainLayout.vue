<template>
  <q-layout>
    <q-header elevated>
      <q-toolbar v-if="isAuth">
        <q-btn flat dense round icon="menu" @click="toggleDrawer"></q-btn>

        <q-toolbar-title>Crypt Talk</q-toolbar-title>

        <q-btn flat round dense class="q-ml-md">
          <q-avatar size="32px" class="q-mr-sm">
            <template v-if="getAvatarOrInitials(user).type === 'image'">
              <img :src="getAvatarOrInitials(user).value" />
            </template>
            <template v-else>
              <span>{{ getAvatarOrInitials(user).value }}</span>
            </template>
          </q-avatar>
          <span>{{ user?.name }}</span>
          <q-icon name="arrow_drop_down" class="q-ml-xs" />
        </q-btn>

        <q-menu v-model="menu" anchor="bottom right" self="top right">
          <q-list padding>
            <!-- Profile -->
            <q-item clickable v-ripple>
              <q-item-section @click="router.push('/profile')">Profile</q-item-section>
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
        <q-item
          v-for="id in conversations.ids"
          :key="id"
          clickable
          v-ripple
          @click="openConversation(id)"
        >
          <!-- Avatar -->
          <q-item-section v-if="conversations.entities[id].type === 'private'" avatar>
            <q-avatar size="40px">
              <img :src="conversations.entities[id].participants[0].avatar_url" alt="" />
            </q-avatar>
          </q-item-section>

          <!-- Naziv konverzacije -->
          <q-item-section>
            {{ conversations.entities[id].participantsNames.display }}
          </q-item-section>

          <!-- UNREAD BADGE -->
          <q-item-section side>
            <q-badge
              v-if="conversations.entities[id].unreadCount > 0"
              color="green"
              rounded
              align="middle"
            >
              {{ conversations.entities[id].unreadCount }}
            </q-badge>
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
import { usePusherStore } from 'src/stores/pusher'
import { useConversationStore } from 'src/stores/conversation'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const pusherStore = usePusherStore()
const conversationStore = useConversationStore()
const router = useRouter()
const drawer = ref(null)
const darkMode = ref(false)
const menu = ref(false)

const isAuth = computed(() => auth.isAuthenticated)
const user = computed(() => auth.getUser())

const conversations = conversationStore.conversations

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

function getAvatarOrInitials(user) {
  if (user?.avatarPath) return { type: 'image', value: user.avatarPath }
  return { type: 'initials', value: getInitials(user?.name) }
}

function getInitials(name) {
  if (!name) return 'U' // fallback inicijal
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
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
watch(
  () => auth.token,
  (val) => {
    if (val) {
      conversationStore.fetchConversations()
    }
  },
  { immediate: true },
)

watch(
  () => auth.getUser(),
  (user) => {
    if (user) {
      pusherStore.init()
    } else {
      pusherStore.disconnect()
    }
  },
  { immediate: true },
)

function openConversation(conversationId) {
  router.push('/conversation/' + conversationId)
}
</script>
