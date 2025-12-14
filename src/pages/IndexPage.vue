<template>
  <q-page class="flex flex-center">
    <q-btn @click="toggleAuth">toggle</q-btn>
    <q-btn @click="whoami">whoami</q-btn>
    <!-- Za neulogovane korisnike -->
    <div v-if="!isAuth">
      <div class="text-h4 text-primary q-mb-md">Crypted Talk Web Application</div>

      <div class="text-body1 q-mb-lg" style="max-width: 600px">
        Welcome to Crypted Talk — a secure communication platform where all messages are
        <b>encrypted directly in your browser</b> and can only be decrypted by the participants in
        the conversation. Even the system administrators cannot access or view your messages.
        <br /><br />
        The encryption key is <b>never transmitted over the network</b>; instead, it must be
        exchanged <b>offline or via another secure channel</b>. This ensures
        <b>maximum privacy and security</b> for all users.
      </div>

      <div>
        <q-btn label="Login" color="primary" class="q-mx-sm" to="/login" />
        <q-btn label="Register" color="secondary" class="q-mx-sm" to="/register" />
      </div>
    </div>

    <!-- Za ulogovane korisnike -->
    <div v-else class="dashboard-container">
      <div class="text-h4 text-primary q-mb-md">Welcome back, Username placeholder! 👋</div>

      <div class="text-body1 text-grey-7 q-mb-xl">Your secure communication hub</div>

      <!-- Stats cards -->
      <div class="row q-col-gutter-md justify-center q-mb-lg" style="max-width: 800px">
        <div class="col-12 col-sm-4">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="people" size="48px" color="primary" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold">8</div>
              <div class="text-caption text-grey-7">Friends</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-4">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="mark_email_unread" size="48px" color="orange" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold">3</div>
              <div class="text-caption text-grey-7">New Messages</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-4">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="chat" size="48px" color="green" class="q-mb-sm" />
              <div class="text-h5 text-weight-bold">25</div>
              <div class="text-caption text-grey-7">Total Messages</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="q-gutter-md">
        <q-btn
          label="Start New Conversation"
          color="primary"
          icon="add_comment"
          size="md"
          to="/conversations"
          class="q-px-lg"
        />
        <q-btn
          label="Manage Friends"
          color="secondary"
          icon="group"
          size="md"
          outline
          to="/friends"
          class="q-px-lg"
        />
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
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/auth'

const auth = useAuthStore()

const isAuth = ref(false)

function toggleAuth() {
  isAuth.value = !isAuth.value
}

function whoami() {
  auth.whoami()
}
</script>
