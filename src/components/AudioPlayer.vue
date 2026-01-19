<template>
  <div class="audio-message-container" :class="{ 'audio-me': isMe }">
    <div class="audio-player">
      <!-- Play/Pause dugme -->
      <q-btn
        round
        dense
        flat
        :icon="isCurrentlyPlaying ? 'pause' : 'play_arrow'"
        :color="isMe ? 'white' : 'primary'"
        size="sm"
        @click="togglePlayback"
        class="audio-play-btn"
      />

      <div class="audio-content">
        <!-- Progress bar -->
        <div class="audio-progress-container" @click="handleSeek">
          <div class="audio-progress-bar">
            <div class="audio-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>

        <!-- Vreme desno -->
        <div class="audio-time">
          {{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  audioUrl: {
    type: String,
    required: true,
  },
  isMe: {
    type: Boolean,
    default: false,
  },
  messageId: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
  },
})

// Reactive state
const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const totalDuration = ref(props.duration || 0)
const progress = ref(0)

// Computed properties
const isCurrentlyPlaying = computed(() => isPlaying.value)

// Format vremena u MM:SS format
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// Inicijalizacija audio elementa
const initAudio = () => {
  if (audioElement.value) return

  audioElement.value = new Audio(props.audioUrl)

  audioElement.value.addEventListener('loadedmetadata', () => {
    if (props.duration <= 0) {
      totalDuration.value = audioElement.value.duration || 0
    }
  })

  audioElement.value.addEventListener('timeupdate', () => {
    currentTime.value = audioElement.value.currentTime
    if (totalDuration.value > 0) {
      progress.value = (currentTime.value / totalDuration.value) * 100
    }
  })

  audioElement.value.addEventListener('ended', () => {
    isPlaying.value = false
    currentTime.value = 0
    progress.value = 0
    if (audioElement.value) {
      audioElement.value.currentTime = 0
    }
  })

  audioElement.value.addEventListener('error', (error) => {
    console.error('Audio error:', error)
    isPlaying.value = false
  })
}

// Kontrola playback-a
const togglePlayback = async () => {
  try {
    if (!audioElement.value) {
      initAudio()
    }

    if (isPlaying.value) {
      audioElement.value.pause()
      isPlaying.value = false
    } else {
      await audioElement.value.play()
      isPlaying.value = true
    }
  } catch (error) {
    console.error('Playback error:', error)
    isPlaying.value = false
  }
}

// Seek na audio progress baru
const handleSeek = (event) => {
  if (!audioElement.value || totalDuration.value <= 0) return

  const progressBar = event.currentTarget.querySelector('.audio-progress-bar')
  if (!progressBar) return

  const rect = progressBar.getBoundingClientRect()
  const clickPosition = event.clientX - rect.left
  const seekTime = (clickPosition / rect.width) * totalDuration.value

  audioElement.value.currentTime = Math.min(seekTime, totalDuration.value)
  currentTime.value = audioElement.value.currentTime
}

// Watch za promenu props.duration
watch(
  () => props.duration,
  (newDuration) => {
    if (newDuration > 0) {
      totalDuration.value = newDuration
    }
  },
)

onMounted(() => {
  if (props.duration > 0) {
    totalDuration.value = props.duration
  }
})

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
    audioElement.value = null
  }
})
</script>

<style scoped>
.audio-message-container {
  width: 200px; /* Isto kao thumbnail */
  margin: 8px 0;
}

.audio-player {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  gap: 12px;
  transition: background-color 0.2s ease;
}

.audio-me .audio-player {
  background: #dcf8c6; /* WhatsApp zelena za moje poruke */
  border: 1px solid #c2e0a8;
}

.audio-play-btn {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.8) !important;
}

.audio-me .audio-play-btn {
  background: rgba(255, 255, 255, 0.9) !important;
}

.audio-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.audio-progress-container {
  flex: 1;
  cursor: pointer;
  padding: 4px 0;
}

.audio-progress-bar {
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.audio-progress-fill {
  height: 100%;
  background: #34b7f1; /* WhatsApp plava za progress */
  border-radius: 2px;
  transition: width 0.1s linear;
  position: absolute;
  left: 0;
  top: 0;
}

.audio-me .audio-progress-fill {
  background: #09d261; /* WhatsApp zelena za moje poruke */
}

.audio-time {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 65px;
  text-align: right;
}

.audio-me .audio-time {
  color: #0a3d19;
}

/* Hover efekti */
.audio-progress-container:hover .audio-progress-bar {
  height: 4px;
}

.audio-progress-container:hover .audio-progress-fill {
  background: #128c7e;
}

.audio-me .audio-progress-container:hover .audio-progress-fill {
  background: #07bc4c;
}

.audio-play-btn:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Responsive */
@media (max-width: 600px) {
  .audio-message-container {
    width: 180px;
  }

  .audio-player {
    padding: 6px 10px;
    gap: 10px;
  }

  .audio-content {
    gap: 8px;
  }

  .audio-time {
    font-size: 11px;
    min-width: 60px;
  }
}

@media (max-width: 400px) {
  .audio-message-container {
    width: 160px;
  }

  .audio-player {
    padding: 5px 8px;
    gap: 8px;
  }

  .audio-time {
    font-size: 10px;
    min-width: 55px;
  }
}
</style>
