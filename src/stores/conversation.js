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

        messages.entities[m.id] = {
          id: m.id,
          conversationId: m.conversation_id,
          text: m.message,
          type: m.type,
          attachmentPath: m.attachment_path,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderAvatar: m.avatar_url,
          createdAt: m.created_at,
        }
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
      const msg = {
        id: m.id,
        conversationId: m.conversation_id,
        text: m.message,
        type: 'message',
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderAvatar: m.avatar_url,
        createdAt: m.created_at,
      }
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
      const msg = {
        id: m.id,
        conversationId: m.conversation_id,
        text: m.message,
        type: m.type,
        attachmentPath: m.attachment_path,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderAvatar: m.avatar_url,
        createdAt: m.created_at,
      }
      messages.ids.push(msg.id)
      messages.entities[msg.id] = msg
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      event.target.value = null
    }
  }

  function receiveMessage(m) {
    if (messages.entities[m.id]) return

    const msg = {
      id: m.id,
      conversationId: m.conversation_id,
      text: m.message,
      type: m.type,
      attachmentPath: m.attachment_path,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.avatar_url,
      createdAt: m.created_at,
    }

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
    receiveMessage,
    markAsRead,
  }
})
