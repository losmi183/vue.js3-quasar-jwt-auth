<template>
  <q-layout view="lHh Lpr lFf" v-if="auth.initialized">
    <q-header elevated>
      <q-toolbar v-if="isAuth">
        <q-btn flat dense round icon="menu" @click="toggleDrawer" />
        <q-toolbar-title>Crypt Talk</q-toolbar-title>
        <q-btn flat round dense class="q-ml-md">
          <q-avatar size="32px" class="q-mr-sm">
            <img
              v-if="getAvatarOrInitials(user).type === 'image'"
              :src="getAvatarOrInitials(user).value"
            />
            <span v-else>{{ getAvatarOrInitials(user).value }}</span>
          </q-avatar>
          <span>{{ user?.name }}</span>
          <q-icon name="arrow_drop_down" class="q-ml-xs" />
        </q-btn>
        <q-menu v-model="menu" anchor="bottom right" self="top right">
          <q-list padding>
            <q-item clickable v-ripple @click="router.push('/profile')">
              <q-item-section>Profile</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-ripple>
              <q-item-section>
                <div class="row items-center justify-between">
                  <span>Theme</span>
                  <q-toggle v-model="darkMode" @update:model-value="toggleDark" label="Dark Mode" />
                </div>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-ripple @click="logout">
              <q-item-section class="text-negative">Logout</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="isAuth" v-model="drawer" show-if-above bordered>
      <div class="q-pa-md">
        <q-input
          v-model="searchQuery"
          placeholder="Pretraži..."
          outlined
          dense
          clearable
          @update:model-value="onSearchInput"
        >
          <template v-slot:prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <q-separator />

      <div v-if="isSearching" class="q-pa-md text-center">
        <q-spinner color="primary" size="30px" />
      </div>

      <q-list v-else>
        <template v-if="!searchQuery">
          <q-item
            v-for="id in conversations.ids"
            :key="id"
            clickable
            v-ripple
            @click="openConversation(id)"
          >
            <q-item-section avatar>
              <q-avatar size="40px">
                <img
                  :src="
                    conversations.entities[id].participants[0]?.avatar_url ||
                    'images/avatar/default.png'
                  "
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>{{
              conversations.entities[id].participantsNames.display
            }}</q-item-section>
            <q-item-section side v-if="conversations.entities[id].unreadCount > 0">
              <q-badge color="green" rounded>{{ conversations.entities[id].unreadCount }}</q-badge>
            </q-item-section>
          </q-item>
        </template>

        <template v-else>
          <template v-if="searchConversations.length > 0">
            <q-item-label header class="text-weight-bold">Active Conversations</q-item-label>
            <q-item
              v-for="conv in searchConversations"
              :key="'conv-' + conv.id"
              clickable
              v-ripple
              @click="openConversation(conv.id)"
            >
              <q-item-section avatar>
                <q-avatar size="40px">
                  <img :src="conv.users[0]?.avatar_url" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ conv.title || conv.users[0]?.name }}</q-item-label>
                <q-item-label caption v-if="conv.type === 'group'">Group Chat</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator class="q-my-sm" />
          </template>

          <template v-if="searchResults.length > 0">
            <q-item-label header class="text-weight-bold">Other Users</q-item-label>
            <q-item
              v-for="user in searchResults"
              :key="'user-' + user.id"
              clickable
              v-ripple
              @click="startConversation(user.id)"
            >
              <q-item-section avatar>
                <q-avatar size="40px">
                  <img :src="user.avatar_url" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.name }}</q-item-label>
                <q-item-label caption>{{ user.email }}</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="person_add" color="primary" /></q-item-section>
            </q-item>
          </template>

          <div
            v-if="searchConversations.length === 0 && searchResults.length === 0"
            class="q-pa-xl text-center text-grey"
          >
            <q-icon name="sentiment_dissatisfied" size="48px" />
            <div class="q-mt-md">No results found for "{{ searchQuery }}"</div>
          </div>
        </template>
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
import { api } from 'src/boot/axios'
import { Dark } from 'quasar'

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

// SEARCH STATE
const searchQuery = ref('')
const searchResults = ref([]) // Ljudi bez konekcije
const searchConversations = ref([]) // Postojeći chatovi
const isSearching = ref(false)
let searchTimeout = null

function onSearchInput(value) {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!value || value.trim() === '') {
    searchResults.value = []
    searchConversations.value = []
    isSearching.value = false
    return
  }
  isSearching.value = true
  searchTimeout = setTimeout(() => performSearch(value.trim()), 300)
}

async function performSearch(query) {
  try {
    const response = await api.post('/user/search', { search: query })
    // Ovde hvatamo tvoj novi stdClass { users, conversations }
    searchResults.value = response.data.users || []
    searchConversations.value = response.data.conversations || []
  } catch (error) {
    console.error('❌ Search error:', error)
  } finally {
    isSearching.value = false
  }
}

async function startConversation(friendId) {
  try {
    const response = await api.post('/conversation/start-conversation', {
      friend_id: friendId,
    })
    const conversationId = response.data.conversation_id
    conversationStore.conversationsLoaded = false
    await conversationStore.fetchConversations()

    searchQuery.value = ''
    router.push(`/conversation/${conversationId}`)
  } catch (error) {
    console.error('❌ Error starting conversation:', error)
  }
}

function openConversation(id) {
  router.push('/conversation/' + id)
}

// ... (Ostale funkcije toggleDrawer, logout, getInitials ostaju iste) ...
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
function getAvatarOrInitials(u) {
  if (u?.avatarPath) return { type: 'image', value: u.avatarPath }
  return { type: 'initials', value: getInitials(u?.name) }
}
function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

onMounted(() => {
  const savedTheme = localStorage.getItem('dark-mode')
  if (savedTheme !== null) {
    Dark.set(savedTheme === 'true')
    darkMode.value = savedTheme === 'true'
  }
  auth.initAuth()
})

watch(
  () => auth.token,
  (val) => {
    if (val) conversationStore.fetchConversations()
  },
  { immediate: true },
)

watch(
  () => auth.user,
  (user) => {
    if (user) {
      pusherStore.init()
    } else {
      pusherStore.disconnect()
    }
  },
  { immediate: true },
)
</script>
