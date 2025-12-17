import { Notify } from 'quasar'

function normalizeMessage(input) {
  // 1️⃣ Frontend string
  if (typeof input === 'string') {
    return input
  }

  // 2️⃣ Axios error
  const data = input?.response?.data ?? input
  if (!data) return 'Unknown error'

  // 3️⃣ Backend vratio string
  if (typeof data === 'string') {
    return data
  }

  // 4️⃣ Laravel HttpException → message je JSON string
  if (typeof data.message === 'string') {
    try {
      const parsed = JSON.parse(data.message)
      return normalizeMessage(parsed)
    } catch {
      return data.message
    }
  }

  // 5️⃣ Laravel validation object
  if (typeof data === 'object') {
    const messages = []

    Object.values(data).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((msg) => {
          if (typeof msg === 'string') messages.push(msg)
        })
      }
    })

    if (messages.length) {
      return messages.join('\n')
    }
  }

  return 'Something went wrong'
}

function create(type, payload, options = {}) {
  Notify.create({
    type,
    message: normalizeMessage(payload),
    position: 'top-right',
    timeout: 3000,
    multiline: true,
    ...options,
  })
}

export const MyNotify = {
  success(message, options) {
    create('positive', message, options)
  },
  error(error, options) {
    create('negative', error, options)
  },
  warning(message, options) {
    create('warning', message, options)
  },
  info(message, options) {
    create('info', message, options)
  },
}
