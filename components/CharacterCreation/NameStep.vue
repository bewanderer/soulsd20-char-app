<template>
  <div class="name-step">
    <h2 class="step-title">Character Details</h2>
    <p class="step-description">Provide basic information about your character.</p>

    <div class="input-group">
      <label for="character-name">Character Name <span class="required">*</span></label>
      <input
        id="character-name"
        v-model="localName"
        type="text"
        placeholder="Enter character name..."
        maxlength="50"
        class="name-input"
        @input="updateData"
      />
      <div class="char-count">{{ localName.length }}/50</div>
    </div>

    <div class="input-group">
      <label>Gender <span class="required">*</span></label>
      <div class="gender-options">
        <button
          v-for="option in genderOptions"
          :key="option"
          class="gender-btn"
          :class="{ selected: localGender === option }"
          @click="selectGender(option)"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <div class="input-group">
      <label for="physical-description">Physical Description <span class="optional">(Optional)</span></label>
      <textarea
        id="physical-description"
        v-model="localDescription"
        placeholder="Describe your character's appearance, distinguishing features, etc..."
        maxlength="500"
        rows="4"
        class="description-input"
        @input="updateData"
      ></textarea>
      <div class="char-count">{{ localDescription.length }}/500</div>
    </div>

    <div v-if="localName.trim().length > 0 && localGender" class="preview">
      <p class="preview-label">Preview:</p>
      <p class="preview-name">{{ localName }}</p>
      <p class="preview-gender">{{ localGender }}</p>
      <p v-if="localDescription.trim()" class="preview-description">{{ localDescription }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const localName = ref('')
const localGender = ref('')
const localDescription = ref('')

const genderOptions = ['Male', 'Female', 'Other']

onMounted(() => {
  localName.value = props.modelValue.name || ''
  localGender.value = props.modelValue.gender || ''
  localDescription.value = props.modelValue.physical_description || ''
})

function selectGender(gender: string) {
  localGender.value = gender
  updateData()
}

function updateData() {
  emit('update:modelValue', {
    ...props.modelValue,
    name: localName.value,
    gender: localGender.value,
    physical_description: localDescription.value
  })
}
</script>

<style scoped>
.name-step {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-title {
  color: var(--color-gold-primary);
  font-size: 1.5em;
  margin-bottom: 10px;
}

.step-description {
  color: #ccc;
  font-size: 0.95em;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  color: #fff;
  font-weight: bold;
}

.required {
  color: var(--color-red-bright);
}

.optional {
  color: #888;
  font-weight: normal;
  font-size: 0.9em;
}

.name-input,
.description-input {
  padding: 12px;
  font-size: 1.1em;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  transition: border-color 0.2s;
  font-family: inherit;
}

.name-input:focus,
.description-input:focus {
  outline: none;
  border-color: var(--color-gold-primary);
}

.description-input {
  resize: vertical;
  min-height: 80px;
}

.gender-options {
  display: flex;
  gap: 12px;
}

.gender-btn {
  flex: 1;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.gender-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.7);
}

.gender-btn.selected {
  border-color: var(--color-gold-primary);
  background: var(--color-gold-rgba-light);
  color: var(white);
}

.char-count {
  text-align: right;
  color: #888;
  font-size: 0.85em;
}

.preview {
  margin-top: 30px;
  padding: 20px;
  background: var(--color-gold-rgba-light);
  border: 1px solid var(--color-gold-rgba-medium);
  border-radius: 4px;
}

.preview-label {
  color: var(--color-gold-primary);
  font-size: 0.9em;
  margin-bottom: 10px;
}

.preview-name {
  color: white;
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 5px;
}

.preview-gender {
  color: #ccc;
  font-size: 1em;
  margin-bottom: 10px;
}

.preview-description {
  color: #bbb;
  font-size: 0.95em;
  line-height: 1.5;
  font-style: italic;
}
</style>
