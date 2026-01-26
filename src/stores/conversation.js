import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { api } from 'src/boot/axios'
import format from 'src/utils/format'
import { encryptMessage } from 'src/crypto/aesGcm'
import { decryptMessage } from 'src/crypto/aesGcm'

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
          encrypted: c.encrypted,
          type: c.type,
          salt: c.salt,
          iterations: c.iterations,
          cryptPassword: 'Secret123#',
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
      decryptExistingMessages()
    } catch (error) {
      console.log(error)
    } finally {
      conversation.pagination.loading = false
    }
  }

  async function changeEncrypted(conversationId, encrypted) {
    try {
      const res = await api.post('/conversation/change-encrypted', {
        conversationId: conversationId,
        encrypted: encrypted,
      })
      conversations.entities[conversationId].encrypted = encrypted
    } catch (error) {
      console.log(error)
    }
  }

  async function setConversationPassword(conversationId, password) {
    const conv = conversations.entities[conversationId]
    if (conv) {
      conv.cryptPassword = password

      // Dekriptuj sve postojeće enkriptovane poruke
      if (password && password.length > 0) {
        await decryptExistingMessages()
      }
    }
  }

  function clearConversationPassword(conversationId) {
    const conv = this.conversations.entities[conversationId]
    if (conv && conv.password) {
      delete conv.password
    }
  }

  async function sendMessage(conversationId, text, isEncrypted, password) {
    let encryptedData = null
    let iv = null
    let messageText = text

    if (isEncrypted) {
      const conversation = conversations.entities[conversationId]
      const encryptedResult = await encryptMessage(
        text,
        password,
        conversation.salt,
        conversation.salt.iterations,
      )
      encryptedData = encryptedResult.data
      iv = encryptedResult.iv
      messageText = null // Za kriptovane poruke šaljemo null
    }

    const res = await api.post('/conversation/send-message', {
      conversationId: conversationId,
      isEncrypted: isEncrypted,
      text: messageText,
      encryptedData: encryptedData,
      iv: iv,
    })

    const m = res.data.message
    m.message = text
    const msg = mapMessage(m)
    messages.ids.push(msg.id)
    messages.entities[msg.id] = msg
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

  async function receiveMessage(m) {
    if (messages.entities[m.id]) return

    let messageToProcess = m

    // 1. Ako je enkriptovana, dekriptuj pre mapiranja
    if (m.is_encrypted) {
      try {
        const conversationId = m.conversation_id
        const conversation = conversations.entities[conversationId]

        if (!conversation) {
          console.error('Konverzacija nije pronađena:', conversationId)
          return
        }

        // PROVERI - da li je ovo `password` ili `cryptPassword`?
        const conversationPassword = conversation.cryptPassword || conversation.password

        if (!conversationPassword) {
          console.error('Password nije pronađen za konverzaciju:', conversationId)
          // Možda prikaži nešto kao "Unesi password da vidiš poruku"
          return
        }

        // Dekriptuj
        const decryptedText = await decryptMessage(
          m.message_encrypted, // ciphertext
          m.iv,
          conversationPassword,
          conversation.salt,
          conversation.iterations,
        )

        // Kreiraj novi objekat sa dekriptovanim tekstom
        m.message = decryptedText
        m.status = 'success'
      } catch (error) {
        console.error('Decrypt error:', error)
        // Prikaži nešto kao "Nije moguće dekriptovati"
        m.message = 'Encryption failed! Wrong password'
        m.status = 'failed'
      }
    }

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
    if (conversations.entities[convId] != undefined) conversations.entities[convId].unreadCount = 0
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

    if (messages.pagination !== undefined) {
      messages.pagination.lastMessageId = null
      messages.pagination.hasMore = true
      messages.pagination.loading = false
    }

    conversationsLoaded.value = false
  }

  function mapMessage(m) {
    return {
      id: m.id,
      conversationId: m.conversation_id,
      text: m.message,
      textEncrypted: m.message_encrypted,
      isEncrypted: m.is_encrypted || false,
      type: m.type,
      iv: m.iv,
      status: m.status || null,
      attachmentPath: m.attachment_path,
      attachmentType: m.attachment_type,
      duration: m.duration,
      thumbnail: m.thumbnail,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.avatar_url,
      createdAt: m.created_at,
    }

    // u conversation.js store-u dodajemo ovu funkciju:
  }

  async function decryptExistingMessages() {
    const conversation = conversations.entities[activeConversationId.value]
    if (!conversation) return
    const messageIds = messages.ids

    for (const messageId of messageIds) {
      const msg = messages.entities[messageId]

      if (msg.conversationId == activeConversationId.value && msg.isEncrypted) {
        try {
          const decryptedText = await decryptMessage(
            msg.textEncrypted,
            msg.iv,
            conversation.cryptPassword,
            conversation.salt,
            conversation.iterations,
          )
          msg.text = decryptedText
          msg.status = 'success'
        } catch (error) {
          console.error('Error decrypting existing messages:', error)
          msg.text = 'Encryption failed! Wrong password'
          msg.status = 'failed'
        }
      }
    }
  }

  return {
    activeConversationId,
    conversations,
    messages,
    conversationsLoaded,
    fetchConversations,
    changeEncrypted,
    setConversationPassword,
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
