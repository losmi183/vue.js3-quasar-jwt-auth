<template>
  <q-page class="column" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-2 text-dark'">
    <div id="conversation-container">
      <!-- Header -->
      <div id="conversation-header">
        <span v-if="conversation?.type == 'private'">
          <!-- <q-avatar size="40px">
            <img :src="conversation?.senderAvatar" alt="" />
          </q-avatar> -->
        </span>
        <span class="message-sender">
          {{ conversation?.participantsNames.display }}
        </span>
      </div>

      <!-- Messages  -->
      <div id="conversation-messages" ref="messagesContainer" @scroll="onScroll">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="message.senderId == user?.id ? 'me' : 'other'"
        >
          <!-- <div>Sender ID: {{ message.senderId }} a user id {{ user?.id }}</div> -->
          <div v-if="conversation?.type == 'group' && message.senderId != user?.id">
            <q-avatar size="40px">
              <img :src="message.senderAvatar" alt="" />
            </q-avatar>
            <span class="message-sender">
              {{ message.senderName }}
            </span>
          </div>

          <div v-if="message.type == 'message'">{{ message.text }}</div>
          <div v-else-if="message.type == 'attachment'">
            <!-- AUDIO  -->
            <div v-if="message.attachmentType == 'audio'">
              <AudioPlayer
                :audioUrl="`${message.attachmentPath}?conversationId=${conversationId}&token=${auth.token}`"
                :isMe="true"
                :messageId="message.id"
                :duration="message.duration"
              ></AudioPlayer>
            </div>

            <!-- VIDEO -->
            <div v-else-if="message.attachmentType == 'video'" class="media-container">
              <div class="video-thumbnail" @click="openMedia(message)">
                <img
                  :src="`${message.thumbnail}?conversationId=${conversationId}&token=${auth.token}`"
                  alt="video"
                  class="media-thumbnail"
                />
                <!-- Play button uvek vidljiv -->
                <div class="play-button-overlay">
                  <q-icon name="play_circle" size="48px" color="white" />
                </div>
                <!-- Trajanje u donjem desnom uglu -->
                <div class="video-duration" v-if="message.duration">
                  {{ formatDuration(message.duration) }}
                </div>
              </div>
            </div>

            <!-- IMAGE -->
            <div v-else-if="message.attachmentType == 'image'" class="media-container">
              <div class="image-thumbnail" @click="openMedia(message)">
                <img
                  :src="`${message.thumbnail}?conversationId=${conversationId}&token=${auth.token}`"
                  alt="image"
                  class="media-thumbnail"
                />
                <!-- Ikona u gornjem desnom uglu -->
                <div class="image-corner-icon">
                  <q-icon name="photo" size="16px" color="white" />
                </div>
              </div>
            </div>
          </div>

          <span class="time">{{ format.time(message.createdAt) }}</span>
        </div>
      </div>

      <div id="conversation-input" style="position: relative" class="row items-center q-gutter-sm">
        <!-- Tekstualna poruka -->
        <q-input
          v-model="newMessage"
          placeholder="Napiši poruku..."
          @keyup.enter="sendMessage"
          dense
          outlined
          rounded
          class="col"
        >
          <template v-slot:append>
            <!-- Emoji dugme -->
            <q-btn
              flat
              round
              icon="sentiment_satisfied"
              @click="showEmojiPicker = !showEmojiPicker"
            />
            <!-- Attach / file dugme -->
            <q-btn flat round icon="attach_file" @click="$refs.fileInput.click()" />
            <!-- Kamera dugme (mobilno) -->
            <q-btn flat round icon="camera_alt" @click="$refs.cameraInput.click()" />
          </template>
        </q-input>

        <!-- Pošalji dugme -->
        <q-btn label="Pošalji" color="primary" @click="sendMessage" />

        <!-- File input (skriven) -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*,video/*, audio/*"
          style="display: none"
          @change="sendAttachment"
        />

        <!-- Kamera input (skriven) -->
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          style="display: none"
          @change="sendAttachment"
        />

        <!-- Mini Emoji Picker -->
        <div v-if="showEmojiPicker" class="mini-emoji-picker">
          <div class="emoji-tabs">
            <button
              v-for="(cat, index) in emojiCategories"
              :key="cat.name"
              @click="activeCategory = index"
              :class="{ active: activeCategory === index }"
            >
              {{ cat.name }}
            </button>
          </div>

          <div class="emoji-grid">
            <span
              v-for="emoji in emojiCategories[activeCategory].emojis"
              :key="emoji"
              class="emoji"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <MediaGallery v-model="mediaGalleryOpen" :mediaIndex="mediaIndex" :media="media"></MediaGallery>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useConversationStore } from 'src/stores/conversation'
import { useRoute } from 'vue-router'
import format from 'src/utils/format'
import { emojiCategories } from 'src/data/emojiCategories'
import { api } from 'src/boot/axios'
import MediaGallery from 'src/components/MediaGallery.vue'
import AudioPlayer from 'src/components/AudioPlayer.vue'

const messagesContainer = ref(null)

const route = useRoute()
const auth = useAuthStore()
const user = computed(() => auth.user)

const conversationStore = useConversationStore()

const conversationId = computed(() => route.params.conversationId)
const conversation = computed(() => conversationStore.getConversationById(conversationId.value))

const messages = computed(() => {
  return conversationStore.messages.ids
    .map((id) => conversationStore.messages.entities[id])
    .filter((msg) => msg.conversationId == conversationId.value)
  // .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})

// console.log(messages.value)

const newMessage = ref('')
const fileInput = ref(null)
const cameraInput = ref(null)
const showEmojiPicker = ref(false)
const activeCategory = ref(0)

const mediaGalleryOpen = ref(false)

const media = computed(() => {
  return messages.value
    .filter(
      (m) =>
        m.type === 'attachment' && (m.attachmentType === 'video' || m.attachmentType === 'image'),
    )
    .map((m) => ({
      url: `${m.attachmentPath}?conversationId=${conversationId.value}&token=${auth.token}`,
      type: m.attachmentType,
      messageId: m.id,
      thumbnail: m.thumbnail, // Ako treba
    }))
})
const mediaIndex = ref(0)

function openMedia(message) {
  const index = media.value.findIndex((item) => item.messageId === message.id)
  if (index !== -1) {
    mediaIndex.value = index
    mediaGalleryOpen.value = true
  }
}

function scrollToBottom() {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

function selectEmoji(emoji) {
  newMessage.value += emoji
  showEmojiPicker.value = false // odmah zatvori picker
}

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

async function onScroll() {
  const el = messagesContainer.value
  if (!el) return
  if (el.scrollTop === 0) {
    const prevHeight = el.scrollHeight
    await conversationStore.openConversation(conversationId.value)
    await nextTick()
    el.scrollTop = el.scrollHeight - prevHeight
  }
}

function sendMessage() {
  if (!newMessage.value.trim()) return

  conversationStore.sendMessage(conversationId.value, newMessage.value)

  newMessage.value = ''
}

function sendAttachment(event) {
  conversationStore.handleFileUpload(conversationId.value, event)
}

onMounted(() => {
  scrollToBottom()
})

watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  },
)
// CHANGE CONVERSATION
watch(
  [() => conversationId.value, () => conversationStore.conversationsLoaded],
  ([id, loaded]) => {
    if (!id || !loaded) return
    conversationStore.activeConversationId = conversationId.value
    conversationStore.openConversation(id)

    conversationStore.markAsRead(conversationId.value)
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
#conversation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

#conversation-header {
  flex-shrink: 0;
  padding: 10px;
  min-height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
#conversation-messages {
  flex: 1; // zauzmi sav preostali prostor
  overflow-y: auto; // samo ovde scroll
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
}
#conversation-input {
  flex-shrink: 0;
  padding: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/** MESSAGES */
.message {
  display: inline-block;
  max-width: 65%;
  padding: 10px 12px;
  border-radius: 12px;
  word-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 4px;
}
.message.me + .message.other,
.message.other + .message.me {
  margin-top: 12px;
}
.message.me {
  border-bottom-right-radius: 4px;
}
.message.other {
  border-bottom-left-radius: 4px;
}

/* Ime pošiljaoca iznad poruke */
.message-sender {
  margin-left: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 2px;
}

.q-dark .message-sender {
  color: #90caf9;
}

/* Tablet */
@media (max-width: 1024px) {
  .message {
    max-width: 80%;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .message {
    max-width: 100%;
  }
}

.me {
  align-self: flex-end;
  background: $message-me-light;
  text-align: right;
}
.other {
  align-self: flex-start;
  background: $message-other-light;
}
/** DARK THEME */
.body--dark .me {
  align-self: flex-end;
  background: $message-me-dark;
  color: $text-dark;
}
.body--dark .other {
  align-self: flex-start;
  background: $message-other-dark;
  color: $text-dark;
}
.time {
  display: block;
  font-size: 12px; /* malo manje od 11px */
  font-weight: 300; /* tanje od normalnog */
  text-align: right;
  margin-top: 1px; /* blago spušteno ispod teksta */
  line-height: 1; /* da bude malo niže */
}
//Emoji
.mini-emoji-picker {
  position: absolute;
  bottom: 60px;
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 6px;
  z-index: 1000;
  width: 280px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.emoji-tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 4px;
}

.emoji-tabs button {
  background: none;
  border: none;
  padding: 4px 6px;
  cursor: pointer;
}

.emoji-tabs button.active {
  border-bottom: 2px solid #1976d2;
  font-weight: bold;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.emoji {
  font-size: 24px;
  padding: 4px;
  cursor: pointer;
  transition: transform 0.1s;
}

.emoji:hover {
  transform: scale(1.2);
}

// Media CSS
.media-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.media-thumbnail {
  max-width: 200px;
  border-radius: 8px;
  display: block;
}

/* VIDEO - Play button uvek vidljiv */
.play-button-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 8px;
}

/* VIDEO - Trajanje u donjem desnom uglu */
.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* IMAGE - Ikona u gornjem desnom uglu */
.image-corner-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px;
  border-radius: 4px;
}

/* Optional: Hover efekti samo za desktop */
@media (hover: hover) and (pointer: fine) {
  .media-container:hover .media-thumbnail {
    opacity: 0.9;
  }
}
</style>
