import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

export const useConversationStore = defineStore('conversation', () => {
  // state
  const conversations = ref({
    ids: [],
    entities: {},
  })
  const messages = ref({
    ids: [],
    entities: {},
    pagination: { cursor: null, hasMore: true, loading: false },
  })

  // getters

  // actions
  async function fetchConversations() {
    try {
      const res = await api.post('/conversation/index')
      res.data.forEach((c) => {
        if (!conversations.value.entities[c.id]) {
          conversations.value.ids.push(c.id)
        }

        conversations.value.entities[c.id] = {
          id: c.id,
          title: c.title,
          type: c.type,
          participants: c.users,
        }
      })
    } catch (error) {
      console.log(error)
    }
  }

  // async function openConversation() {
  //   try {
  //     const res = await api.post('/conversation/show')
  //     res.data.forEach((m) => {
  //       if (!messages.value.entities[m.id]) {
  //         messages.value.ids.push(m.id)
  //       }
  //       conversations.value.entities[m.id] = {
  //         id: m.id,
  //         message: m.message,
  //       }
  //     })
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  return {
    conversations,
    messages,
    fetchConversations,
  }
})
