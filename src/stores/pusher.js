import Pusher from 'pusher-js'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useConversationStore } from './conversation'

export const usePusherStore = defineStore('pusher', () => {
  let pusher = null
  let channel = null

  function init() {
    const auth = useAuthStore()
    const user = auth.getUser()

    if (!user || !auth.token) return
    if (pusher) return // vec inicijalizovan

    pusher = new window.Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      authEndpoint: `${import.meta.env.VITE_API_URL}/api/pusher/auth`,
      auth: { headers: { Authorization: `Bearer ${auth.token}` } },
    })
    channel = pusher.subscribe(`private-user-${auth.getUser().id}`)

    const conversationStore = useConversationStore()

    channel.bind('message.sent', (payload) => {
      conversationStore.receiveMessage(payload.message)
    })
  }

  function disconnect() {
    if (pusher) {
      pusher.disconnect()
      pusher = null
      channel = null
    }
  }

  return {
    init,
    disconnect,
  }
})
