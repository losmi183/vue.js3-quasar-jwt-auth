const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function deriveKeyFromPassword(password, salt, iterations = 100000) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptMessage(plaintext, password, salt, iterations) {
  const key = await deriveKeyFromPassword(password, salt, iterations)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  // Pretvori Uint8Array u hex string
  const ivHex = Array.from(new Uint8Array(iv))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const dataHex = Array.from(new Uint8Array(ciphertext))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return {
    iv: ivHex, // string: "a1b2c3d4e5f6..."
    data: dataHex, // string: "4d2a8f1c..."
  }
}

export async function decryptMessage(encrypted, iv, password, salt, iterations) {
  const key = await deriveKeyFromPassword(password, salt, iterations)

  // Konvertuj hex string nazad u Uint8Array
  const ivArray = new Uint8Array(iv.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

  const dataArray = new Uint8Array(encrypted.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivArray }, key, dataArray)

  return decoder.decode(plaintext)
}
