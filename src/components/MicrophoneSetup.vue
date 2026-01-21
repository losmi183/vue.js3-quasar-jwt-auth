<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Podesi mikrofon</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cancel" v-if="!isRequired" />
      </q-card-section>

      <q-card-section>
        <!-- Izbor mikrofona -->
        <q-select
          v-model="selectedDevice"
          :options="audioDevices"
          option-label="label"
          option-value="deviceId"
          label="Izaberi mikrofon"
          outlined
          @update:model-value="onDeviceChange"
        >
          <template v-slot:prepend>
            <q-icon name="mic" />
          </template>
        </q-select>

        <!-- Audio nivo indikator -->
        <div class="q-mt-md">
          <div class="text-caption q-mb-xs">Nivo zvuka:</div>
          <q-linear-progress
            :value="audioLevel / 100"
            color="primary"
            size="20px"
            class="q-mb-xs"
          />
          <div class="text-caption" :class="audioLevel > 10 ? 'text-positive' : 'text-grey'">
            {{ audioLevel > 10 ? '✅ Mikrofon radi!' : '⚠️ Pričaj da testiraš mikrofon' }}
          </div>
        </div>

        <!-- Poruka o grešci -->
        <div v-if="errorMessage" class="q-mt-md">
          <q-banner class="bg-negative text-white" rounded>
            {{ errorMessage }}
          </q-banner>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Otkaži" @click="cancel" v-if="!isRequired" />
        <q-btn
          label="Sačuvaj"
          color="primary"
          @click="save"
          :disable="!selectedDevice || audioLevel === 0"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'microphone-selected'])

const showDialog = ref(props.modelValue)
const audioDevices = ref([])
const selectedDevice = ref(null)
const audioLevel = ref(0)
const errorMessage = ref('')

// Audio context za testiranje
let audioContext = null
let analyser = null
let microphone = null
let animationFrame = null
let currentStream = null

watch(
  () => props.modelValue,
  (val) => {
    showDialog.value = val
    if (val) {
      initMicrophones()
    } else {
      cleanup()
    }
  },
)

async function initMicrophones() {
  try {
    errorMessage.value = ''

    // Traži dozvolu za mikrofon
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop()) // Odmah zatvori

    // Dobavi sve audio uređaje
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioDevices.value = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device) => ({
        label: device.label || `Mikrofon ${device.deviceId.slice(0, 8)}`,
        deviceId: device.deviceId,
      }))

    // Učitaj sačuvani izbor ili izaberi default
    const savedDeviceId = localStorage.getItem('selected-microphone')
    if (savedDeviceId) {
      selectedDevice.value = audioDevices.value.find((d) => d.deviceId === savedDeviceId)
    }

    if (!selectedDevice.value && audioDevices.value.length > 0) {
      selectedDevice.value = audioDevices.value[0]
    }

    if (selectedDevice.value) {
      startAudioTest(selectedDevice.value.deviceId)
    }
  } catch (error) {
    console.error('❌ Greška:', error)
    if (error.name === 'NotAllowedError') {
      errorMessage.value = 'Pristup mikrofonu je odbijen. Dozvoli u pregledaču.'
    } else if (error.name === 'NotFoundError') {
      errorMessage.value = 'Nije pronađen mikrofon.'
    } else {
      errorMessage.value = 'Greška pri pristupu mikrofonu.'
    }
  }
}

function onDeviceChange(device) {
  if (device) {
    startAudioTest(device.deviceId)
  }
}

async function startAudioTest(deviceId) {
  try {
    // Zaustavi prethodni test
    stopAudioTest()

    // Pokreni novi stream
    currentStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    // Proveri da li je mutiran
    const track = currentStream.getAudioTracks()[0]
    if (track.muted) {
      errorMessage.value = 'Mikrofon je mutiran u sistemu.'
      return
    }

    // Kreiraj audio context za analizu
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    microphone = audioContext.createMediaStreamSource(currentStream)
    microphone.connect(analyser)

    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Animacija - meri nivo zvuka
    function updateLevel() {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength
      audioLevel.value = Math.round(average)

      animationFrame = requestAnimationFrame(updateLevel)
    }

    updateLevel()
    errorMessage.value = ''
  } catch (error) {
    console.error('❌ Greška pri testu:', error)
    errorMessage.value = 'Ne mogu pristupiti mikrofonu.'
  }
}

function stopAudioTest() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop())
    currentStream = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  audioLevel.value = 0
}

async function save() {
  if (!selectedDevice.value) return

  try {
    // Sačuvaj izbor u storage
    await window.storage.set('selected-microphone', selectedDevice.value.deviceId)

    emit('microphone-selected', selectedDevice.value.deviceId)
    emit('update:modelValue', false)

    cleanup()
  } catch (error) {
    console.error('❌ Greška pri čuvanju:', error)
  }
}

function cancel() {
  emit('update:modelValue', false)
  cleanup()
}

function cleanup() {
  stopAudioTest()
}

onUnmounted(() => {
  cleanup()
})
</script>
