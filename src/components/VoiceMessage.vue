<template>
  <div class="voice-message-container">
    <!-- Mikrofon dugme -->
    <q-btn
      v-if="!isRecording && !isProcessing"
      round
      dense
      flat
      icon="mic"
      color="primary"
      @click="checkMicrophoneSetup"
      class="voice-btn"
    />

    <!-- Recording kontrole (ostalo isto) -->
    <div v-if="isRecording" class="recording-controls">
      <div class="recording-indicator">
        <div class="pulse-animation"></div>
        <span class="recording-text">Recording...</span>
        <span class="recording-timer">{{ formattedTime }}</span>
      </div>
      <q-btn
        round
        dense
        flat
        icon="stop"
        color="negative"
        @click="stopRecording"
        class="stop-btn"
      />
    </div>

    <!-- Preview kontrole (ostalo isto) -->
    <div v-if="isProcessing && audioBlob" class="voice-preview-controls">
      <div class="preview-info">
        <span class="preview-text">Snimak: {{ formattedTime }}</span>
        <q-btn
          round
          dense
          flat
          icon="play_arrow"
          color="primary"
          @click="playPreview"
          size="sm"
          :disabled="isPlayingPreview"
        />
      </div>

      <div class="action-buttons">
        <q-btn
          round
          dense
          flat
          icon="close"
          color="negative"
          @click="discardRecording"
          class="control-btn"
          title="Odbaci"
        />

        <q-btn
          round
          dense
          flat
          icon="send"
          color="primary"
          @click="handleSendVoiceMessage"
          class="control-btn"
          title="Pošalji"
        />
      </div>
    </div>

    <audio
      v-if="audioUrl"
      ref="audioPlayer"
      :src="audioUrl"
      @ended="isPlayingPreview = false"
      hidden
    />

    <!-- NOVI: Modal za setup mikrofona -->
    <MicrophoneSetup v-model="showMicSetup" @microphone-selected="onMicrophoneSelected" />
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useConversationStore } from 'src/stores/conversation'
import MicrophoneSetup from './MicrophoneSetup.vue'

const conversationStore = useConversationStore()

const props = defineProps({
  conversationId: {
    type: [String, Number],
    required: true,
  },
})

// Stanja
const isRecording = ref(false)
const isProcessing = ref(false)
const isPlayingPreview = ref(false)
const showMicSetup = ref(false)

// Audio podaci
const mediaRecorder = ref(null)
const audioStream = ref(null)
const audioChunks = ref([])
const audioBlob = ref(null)
const audioUrl = ref(null)

// Timer
const recordingTime = ref(0)
const timerInterval = ref(null)
const audioPlayer = ref(null)

// Sačuvani mikrofon
const selectedMicrophoneId = ref(null)

const formattedTime = computed(() => {
  const minutes = Math.floor(recordingTime.value / 60)
  const seconds = recordingTime.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// NOVA FUNKCIJA: Provera da li je mikrofon podešen
// NOVA FUNKCIJA: Provera da li je mikrofon podešen
async function checkMicrophoneSetup() {
  try {
    // Proveri da li je sačuvan izbor u localStorage
    const saved = localStorage.getItem('selected-microphone')

    if (saved) {
      selectedMicrophoneId.value = saved
      startVoiceRecording()
    } else {
      // Nema sačuvan - prikaži modal
      showMicSetup.value = true
    }
  } catch (error) {
    console.error('❌ Greška:', error)
    // Ako storage ne radi, prikaži modal
    showMicSetup.value = true
  }
}

// NOVA FUNKCIJA: Callback kada korisnik izabere mikrofon
function onMicrophoneSelected(deviceId) {
  selectedMicrophoneId.value = deviceId
  startVoiceRecording()
}

// IZMENJENA FUNKCIJA: Koristi sačuvani mikrofon
async function startVoiceRecording() {
  try {
    console.log('🎤 Počinjem snimanje...')

    audioChunks.value = []
    audioBlob.value = null
    audioUrl.value = null
    recordingTime.value = 0

    // Koristi sačuvani mikrofon
    const constraints = {
      audio: selectedMicrophoneId.value
        ? {
            deviceId: { exact: selectedMicrophoneId.value },
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
      video: false,
    }

    audioStream.value = await navigator.mediaDevices.getUserMedia(constraints)

    let options
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options = { mimeType: 'audio/webm;codecs=opus' }
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      options = { mimeType: 'audio/ogg;codecs=opus' }
    } else {
      options = { mimeType: 'audio/webm' }
    }

    mediaRecorder.value = new MediaRecorder(audioStream.value, options)

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = processRecording
    mediaRecorder.value.start(1000)
    isRecording.value = true

    startTimer()
  } catch (error) {
    console.error('❌ Greška pri snimanju:', error)
    handleRecordingError(error)
  }
}

// Ostale funkcije ostaju ISTE
function stopRecording() {
  if (!isRecording.value || !mediaRecorder.value) return

  console.log('🛑 Zaustavljam snimanje...')

  if (mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }

  if (audioStream.value) {
    audioStream.value.getTracks().forEach((track) => track.stop())
  }

  isRecording.value = false
  stopTimer()
}

function processRecording() {
  console.log('🔧 Obrada snimka...')

  const mimeType = mediaRecorder.value.mimeType || 'audio/webm'
  audioBlob.value = new Blob(audioChunks.value, { type: 'audio/webm' })
  audioUrl.value = URL.createObjectURL(audioBlob.value)
  isProcessing.value = true

  console.log(`✅ Snimljeno: ${audioBlob.value.size} bytes, ${recordingTime.value}s`)
}

function startTimer() {
  timerInterval.value = setInterval(() => {
    recordingTime.value++
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function discardRecording() {
  console.log('🗑️ Odbacujem snimak...')
  resetRecording()
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
}

async function handleSendVoiceMessage() {
  if (!audioBlob.value) {
    console.error('❌ Nema audio za slanje')
    return
  }

  conversationStore.sendVoiceMessage(props.conversationId, audioBlob.value)
  resetRecording()
}

function playPreview() {
  if (!audioUrl.value || !audioPlayer.value) return

  if (isPlayingPreview.value) {
    audioPlayer.value.pause()
    audioPlayer.value.currentTime = 0
    isPlayingPreview.value = false
  } else {
    audioPlayer.value.play()
    isPlayingPreview.value = true
  }
}

function handleRecordingError(error) {
  let message = 'Greška pri snimanju'

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      message = 'Pristup mikrofonu je odbijen'
      break
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      message = 'Nije pronađen mikrofon'
      break
    case 'NotSupportedError':
      message = 'Pregledač ne podržava snimanje'
      break
    default:
      message = 'Mikrofon je zauzet'
  }

  console.error('❌', message)
  resetRecording()
}

function resetRecording() {
  isRecording.value = false
  isProcessing.value = false
  isPlayingPreview.value = false
  recordingTime.value = 0
  audioChunks.value = []
  audioBlob.value = null

  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = null
  }

  stopTimer()
}

onUnmounted(() => {
  resetRecording()

  if (audioStream.value) {
    audioStream.value.getTracks().forEach((track) => track.stop())
  }
})
</script>

<style scoped>
.voice-message-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Snimanje u toku */
.recording-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(244, 67, 54, 0.1);
  padding: 8px 16px;
  border-radius: 24px;
  animation: fadeIn 0.3s ease;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pulse-animation {
  width: 12px;
  height: 12px;
  background-color: #f44336;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.recording-text {
  font-size: 14px;
  color: #f44336;
  font-weight: 500;
}

.recording-timer {
  font-size: 14px;
  font-family: monospace;
  color: #666;
  min-width: 40px;
}

.stop-btn {
  animation: bounce 2s infinite;
}

/* Preview mode */
.voice-preview-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(33, 150, 243, 0.1);
  padding: 8px 16px;
  border-radius: 24px;
  min-width: 220px;
  animation: fadeIn 0.3s ease;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-text {
  font-size: 14px;
  color: #2196f3;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  transition: all 0.2s;
}

.control-btn:hover {
  transform: scale(1.1);
  opacity: 0.9;
}

/* Animacije */
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
