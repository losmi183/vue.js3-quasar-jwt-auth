<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Set Encryption Password</div>
        <div class="text-caption q-mt-sm">
          This password will be used to encrypt all sent and received messages in this conversation.
          Please select a strong password for maximum protection.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Password Input -->
        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          outlined
          dense
          class="q-mb-sm"
          @update:model-value="checkPasswordStrength"
          autocomplete="new-password"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <!-- Confirm Password -->
        <q-input
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          label="Confirm Password"
          outlined
          dense
          :rules="[(val) => val === password || 'Passwords do not match']"
          autocomplete="new-password"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
        />

        <!-- Password Strength Indicator -->
        <div class="q-mt-md">
          <div class="row items-center justify-between">
            <div class="text-caption">Password Strength:</div>
            <div class="text-caption" :class="strengthColor">
              {{ strengthText }}
            </div>
          </div>

          <!-- Strength Bar -->
          <div class="password-strength-bar q-mt-xs">
            <div
              v-for="n in 4"
              :key="n"
              class="strength-segment"
              :class="getSegmentClass(n - 1)"
            ></div>
          </div>

          <!-- Password Requirements -->
          <div class="text-caption text-grey q-mt-sm">
            <div>Password should contain:</div>
            <div class="row items-center q-mt-xs">
              <q-icon
                :name="password.length >= 8 ? 'check_circle' : 'radio_button_unchecked'"
                size="12px"
                :color="password.length >= 8 ? 'positive' : 'grey'"
                class="q-mr-xs"
              />
              <span>At least 8 characters</span>
            </div>
            <div class="row items-center q-mt-xs">
              <q-icon
                :name="hasUpperCase && hasLowerCase ? 'check_circle' : 'radio_button_unchecked'"
                size="12px"
                :color="hasUpperCase && hasLowerCase ? 'positive' : 'grey'"
                class="q-mr-xs"
              />
              <span>Uppercase & lowercase letters</span>
            </div>
            <div class="row items-center q-mt-xs">
              <q-icon
                :name="hasNumbers ? 'check_circle' : 'radio_button_unchecked'"
                size="12px"
                :color="hasNumbers ? 'positive' : 'grey'"
                class="q-mr-xs"
              />
              <span>At least one number</span>
            </div>
            <div class="row items-center q-mt-xs">
              <q-icon
                :name="hasSpecialChar ? 'check_circle' : 'radio_button_unchecked'"
                size="12px"
                :color="hasSpecialChar ? 'positive' : 'grey'"
                class="q-mr-xs"
              />
              <span>At least one special character</span>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancel" color="grey" @click="cancel" />
        <q-btn label="Set Password" color="primary" @click="setPassword" :disable="!canEnable" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  cryptPassword: String, // Password iz parenta
})

const emit = defineEmits(['update:modelValue', 'cancel', 'password-set'])

// Lokalna kopija passworda - inicijalno postavi na prop vrednost
const password = ref(props.cryptPassword || '')
const confirmPassword = ref('')
const showPassword = ref(false)
const passwordScore = ref(0)

// Kada se otvori dijalog, resetuj na prop vrednost
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      password.value = props.cryptPassword || ''
      confirmPassword.value = ''
      showPassword.value = false
      passwordScore.value = 0
      checkPasswordStrength()
    }
  },
)
watch(
  () => props.cryptPassword,
  (newVal) => {
    console.log('Dialog: cryptPassword prop changed to:', newVal)
    password.value = newVal || ''
  },
)

// Password requirements checks
const hasUpperCase = computed(() => /[A-Z]/.test(password.value))
const hasLowerCase = computed(() => /[a-z]/.test(password.value))
const hasNumbers = computed(() => /\d/.test(password.value))
const hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=[\]{};':"|,.<>?]/.test(password.value))

// Calculate password strength
const strengthText = computed(() => {
  if (!password.value) return 'Empty'

  const score = passwordScore.value
  const levels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong']
  return levels[score] || 'Weak'
})

const strengthColor = computed(() => {
  const colors = ['text-negative', 'text-orange', 'text-warning', 'text-positive', 'text-positive']
  return colors[passwordScore.value] || 'text-grey'
})

const canEnable = computed(() => {
  return password.value.length >= 4
})

function getSegmentClass(index) {
  if (!password.value) return 'empty'

  const score = passwordScore.value
  if (index <= score) {
    const colors = ['weak', 'weak', 'medium', 'strong', 'strong']
    return colors[score]
  }
  return 'empty'
}

function checkPasswordStrength() {
  if (!password.value) {
    passwordScore.value = 0
    return
  }

  let score = 0

  // 1. DUŽINA (težina 40%)
  const lengthScore = Math.min(password.value.length / 2, 10) // max 10 poena
  score += lengthScore * 0.4

  // 2. RAZNOVRSNOST (težina 60%)
  let varietyScore = 0
  if (hasUpperCase.value) varietyScore += 2.5
  if (hasLowerCase.value) varietyScore += 2.5
  if (hasNumbers.value) varietyScore += 2.5
  if (hasSpecialChar.value) varietyScore += 2.5
  // Bonus za sve 4 vrste
  if (hasUpperCase.value && hasLowerCase.value && hasNumbers.value && hasSpecialChar.value) {
    varietyScore += 5
  }

  score += varietyScore * 0.6

  // Konvertuj u skalu 0-4
  if (score < 4)
    passwordScore.value = 0 // Very Weak
  else if (score < 6)
    passwordScore.value = 1 // Weak
  else if (score < 8)
    passwordScore.value = 2 // Medium
  else if (score < 10)
    passwordScore.value = 3 // Strong
  else passwordScore.value = 4 // Very Strong
}

function setPassword() {
  console.log('setPassword called, canEnable:', canEnable.value)
  if (canEnable.value) {
    console.log('Emitting password-set with:', password.value)
    emit('password-set', password.value)
    console.log('Closing dialog...')
    emit('update:modelValue', false)
  } else {
    console.log('Cannot enable - requirements not met')
  }
}

function cancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

// Watch password changes
watch(password, checkPasswordStrength)
</script>

<style scoped lang="scss">
.password-strength-bar {
  display: flex;
  gap: 4px;
  height: 6px;
  margin: 4px 0;
}

.strength-segment {
  flex: 1;
  border-radius: 3px;
  transition: all 0.3s ease;

  &.empty {
    background-color: #e0e0e0;
  }

  &.weak {
    background-color: #f44336; // Red
  }

  &.medium {
    background-color: #ff9800; // Orange
  }

  &.strong {
    background-color: #4caf50; // Green
  }
}

.text-caption {
  font-size: 12px;
  line-height: 1.4;
}
</style>
