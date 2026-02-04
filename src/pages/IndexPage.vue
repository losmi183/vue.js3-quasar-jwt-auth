<template>
  <q-page class="flex flex-center">
    <!-- Za neulogovane korisnike -->
    <div v-if="!isAuth" class="home-container">
      <div class="text-h3 text-primary q-mb-md text-align-center q-mb-xl" style="font-size: 47px">
        CRYPT TALK
      </div>

      <div class="text-body1 q-mb-lg justified-text" style="max-width: 600px">
        Welcome to Crypted Talk — a secure communication platform where all messages are
        <b>encrypted directly in your browser</b> and can only be decrypted by the participants in
        the conversation. Even the system administrators cannot access or view your messages.
        <br /><br />
        The encryption key is <b>never transmitted over the network</b>; instead, it must be
        exchanged <b>offline or via another secure channel</b>. This ensures
        <b>maximum privacy and security</b> for all users.
      </div>

      <div class="row justify-center q-gutter-md">
        <q-btn
          label="Login"
          color="primary"
          class="col-xs-12 col-sm-auto q-mx-xl"
          :class="$q.screen.xs ? 'q-mb-md' : ''"
          to="/login"
        />
        <q-btn
          label="Register"
          color="secondary"
          class="col-xs-12 col-sm-auto q-mx-xl"
          to="/register"
        />
      </div>
    </div>

    <!-- Za ulogovane korisnike -->
    <div v-else class="dashboard-container home-container">
      <div class="text-h4 text-primary q-mb-md">Welcome back, {{ auth.user.name }}</div>

      <div class="text-body1 text-grey-7 q-mb-xl">Your secure communication hub</div>

      <!-- Stats cards -->
      <div class="row q-col-gutter-md justify-center q-mb-lg" style="max-width: 800px">
        <div class="col-12 col-sm-3">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="people" size="48px" color="primary" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold">
                {{ conversationStore.activeConversations }}
              </div>
              <div class="text-caption text-grey-7">Active conversations</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-3">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="mark_chat_unread" size="48px" color="orange" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold">{{ conversationStore.totalUnreadCount }}</div>
              <div class="text-caption text-grey-7">Unread Messages</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-3">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="chat" size="48px" color="green" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold">{{ conversationStore.totalMessages }}</div>
              <div class="text-caption text-grey-7">Total Messages</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-3">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="lock_person" size="48px" color="green" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold">{{ conversationStore.encryptedMessages }}</div>
              <div class="text-caption text-grey-7">Encrypted Messages</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Security reminder -->
      <div class="q-mt-xl" style="max-width: 600px">
        <q-banner rounded class="bg-blue-1 text-blue-9">
          <template v-slot:avatar>
            <q-icon name="lock" color="blue" />
          </template>
          <div class="text-body2">
            <b>Remember:</b> Your messages are end-to-end encrypted. Always exchange encryption keys
            through a secure offline channel.
          </div>
        </q-banner>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useConversationStore } from 'src/stores/conversation'

const auth = useAuthStore()
const conversationStore = useConversationStore()

const isAuth = computed(() => auth.isAuthenticated)
</script>

<style scoped>
.home-container {
  padding: 8px !important;
  max-width: 100%;
  box-sizing: border-box;
}
</style>
