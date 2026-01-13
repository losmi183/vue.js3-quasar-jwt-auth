<template>
  <q-dialog v-model="internalModel" maximized>
    <q-card class="bg-black flex flex-center">
      <q-btn
        icon="close"
        flat
        round
        color="white"
        class="absolute-top-right q-ma-md"
        @click="close"
      />
      <!-- LEFT ARROW -->
      <q-btn
        icon="chevron_left"
        flat
        round
        color="white"
        class="nav-arrow nav-left"
        @click="prev"
      />

      <img
        v-if="attachments[index]"
        :src="attachments[index]"
        style="max-width: 100%; max-height: 100%; object-fit: contain"
      />
      <!-- RIGHT ARROW -->
      <q-btn
        icon="chevron_right"
        flat
        round
        color="white"
        class="nav-arrow nav-right"
        @click="next"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  attachmentIndex: {
    type: Number,
    default: 0,
  },
  attachments: {
    type: Array,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const internalModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const index = ref(props.attachmentIndex)

watch(
  () => props.attachmentIndex,
  (val) => {
    const x = props.attachmentIndex
    index.value = val
  },
)

function prev() {
  index.value = (index.value - 1 + props.attachments.length) % props.attachments.length
}
function next() {
  index.value = (index.value + 1) % props.attachments.length
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.gallery-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Strelice */
.nav-arrow {
  position: fixed; /* BITNO */
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
}

/* Hover efekat */
.nav-arrow:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Ikona unutra */
.nav-arrow :deep(.q-icon) {
  font-size: 48px; /* VEĆA ikona */
  color: white;
}

/* Leva / desna pozicija */
.nav-left {
  left: 16px;
}

.nav-right {
  right: 16px;
}
</style>
