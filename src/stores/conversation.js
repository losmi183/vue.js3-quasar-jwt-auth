import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { api } from 'src/boot/axios'
import format from 'src/utils/format'

export const useConversationStore = defineStore('conversation', () => {
  // state
  const activeConversationId = ref(null)

  const conversations = reactive({
    ids: [],
    entities: {},
  })
  const messages = reactive({
    ids: [],
    entities: {},
  })
  const conversationsLoaded = ref(false)

  // getters
  function getConversationById(conversationId) {
    return conversations.entities[conversationId]
  }

  // actions
  async function fetchConversations() {
    if (conversationsLoaded.value) return

    try {
      const res = await api.get('/conversation/index')

      res.data.forEach((c) => {
        if (!conversations.entities[c.id]) {
          conversations.ids.push(c.id)
        }

        conversations.entities[c.id] = {
          id: c.id,
          title: c.title,
          type: c.type,
          participants: c.users,
          participantsNames: format.calculateParticipant(c.users),
          unreadCount: c.unread_count,
          pagination: {
            lastMessageId: null,
            hasMore: true,
            loading: false,
          },
        }
      })
      conversationsLoaded.value = true
    } catch (error) {
      console.log(error)
    }
  }

  async function openConversation(conversationId) {
    const conversation = conversations.entities[conversationId]
    if (!conversation) return
    if (conversation.pagination.loading) return
    if (!conversation.pagination.hasMore) return

    conversation.pagination.loading = true

    try {
      const res = await api.post('/conversation/show', {
        conversationId,
        lastMessageId: conversation.pagination.lastMessageId,
      })

      const msgs = res.data.messages

      msgs.forEach((m) => {
        if (!messages.ids.includes(m.id)) {
          messages.ids.unshift(m.id)
        }

        messages.entities[m.id] = mapMessage(m)
      })

      if (msgs.length > 0) {
        conversation.pagination.lastMessageId = msgs[msgs.length - 1].id
      }

      conversation.pagination.hasMore = msgs.length === 20
    } catch (error) {
      console.log(error)
    } finally {
      conversation.pagination.loading = false
    }
  }

  async function sendMessage(conversationId, content) {
    try {
      const res = await api.post('/conversation/send-message', {
        conversationId,
        content,
      })

      const m = res.data.message
      const msg = mapMessage(m)
      messages.ids.push(msg.id)
      messages.entities[msg.id] = msg
    } catch (err) {
      console.log(err)
    }
  }

  async function handleFileUpload(conversationId, event) {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversation_id', conversationId)

    try {
      const response = await api.post('/conversation/send-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const m = response.data.attachment
      const msg = mapMessage(m)
      messages.ids.push(msg.id)
      messages.entities[msg.id] = msg
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      event.target.value = null
    }
  }

  async function sendVoiceMessage(conversationId, audioBlob) {
    try {
      // Kreiraj audio fajl od blob-a
      const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm',
        lastModified: Date.now(),
      })

      // Kreiraj FormData kao za regularan fajl
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('conversation_id', conversationId)

      // Pozovi postojeći API
      const response = await api.post('/conversation/send-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Obradi odgovor
      const m = response.data.attachment
      const msg = mapMessage(m)
      messages.ids.push(msg.id)
      messages.entities[msg.id] = msg

      return { success: true, message: msg }
    } catch (error) {
      console.error('Voice message upload error:', error)
      throw error
    }
  }

  function receiveMessage(m) {
    if (messages.entities[m.id]) return
    const msg = mapMessage(m)
    messages.ids.push(msg.id)
    messages.entities[msg.id] = msg

    // Poruka stigla u aktivnoj konverzaciji
    if (msg.conversationId == activeConversationId.value) {
      markAsRead(activeConversationId.value, msg.id)
    }
  }

  function markAsRead(convId, msgId) {
    api.post('/conversation/mark-as-read', {
      conversationId: convId,
      messageId: msgId,
    })
    conversations.entities[convId].unreadCount = 0
  }

  function reset() {
    conversations.ids.length = 0
    Object.keys(conversations.entities).forEach((key) => {
      delete conversations.entities[key]
    })

    messages.ids.length = 0
    Object.keys(messages.entities).forEach((key) => {
      delete messages.entities[key]
    })

    messages.pagination.lastMessageId = null
    messages.pagination.hasMore = true
    messages.pagination.loading = false

    conversationsLoaded.value = false
  }

  function mapMessage(m) {
    return {
      id: m.id,
      conversationId: m.conversation_id,
      text: m.message,
      type: m.type,
      attachmentPath: m.attachment_path,
      attachmentType: m.attachment_type,
      duration: m.duration,
      thumbnail: m.thumbnail,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.avatar_url,
      createdAt: m.created_at,
    }
  }

  return {
    activeConversationId,
    conversations,
    messages,
    conversationsLoaded,
    fetchConversations,
    reset,
    getConversationById,
    openConversation,
    sendMessage,
    handleFileUpload,
    sendVoiceMessage,
    receiveMessage,
    markAsRead,
  }
})
