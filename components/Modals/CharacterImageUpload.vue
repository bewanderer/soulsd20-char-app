<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ mode === 'edit' ? 'Edit' : 'Upload' }} Character Image</h2>
          <button @click="closeModal" class="btn-modal-close">×</button>
        </div>

        <div class="modal-body">
          <!-- Upload area: Show if no file selected AND (mode is upload OR no existing image) -->
          <div v-if="!selectedFile && (mode === 'upload' || !existingImage)" class="upload-area">
            <input
              ref="fileInput"
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              @change="handleFileSelect"
              class="file-input"
            />
            <div class="upload-prompt" @click="triggerFileInput">
              <div class="upload-icon">Upload</div>
              <p class="upload-text">Click to select an image</p>
              <p class="upload-hint">PNG or JPG, max 5MB</p>
            </div>
          </div>

          <!-- Cropper: Show if file selected OR (edit mode AND existing image) -->
          <div v-if="selectedFile || (mode === 'edit' && existingImage)" class="cropper-container">
            <Cropper
              ref="cropper"
              class="cropper"
              :src="imageSrc"
              :stencil-props="{
                aspectRatio: 1,
                movable: true,
                resizable: true
              }"
              :default-boundaries="'fill'"
              image-restriction="stencil"
            />
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>

        <div class="modal-footer">
          <!-- Only show "Select Different Image" in upload mode when a file is selected -->
          <button v-if="mode === 'upload' && selectedFile" @click="selectDifferentImage" class="btn-neutral">
            Select Different Image
          </button>
          <button @click="closeModal" class="btn-warning-small">Cancel</button>
          <!-- Show Save button if file selected OR in edit mode with existing image -->
          <button v-if="selectedFile || (mode === 'edit' && existingImage)" @click="saveImage" class="btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

interface Props {
  mode: 'upload' | 'edit'
  existingImage?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [imageData: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const cropper = ref<typeof Cropper | null>(null)
const selectedFile = ref<File | null>(null)
// Only set imageSrc to existing image if in edit mode, otherwise start empty
const imageSrc = ref<string>(props.mode === 'edit' ? (props.existingImage || '') : '')
const errorMessage = ref<string>('')
const isSaving = ref<boolean>(false)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // File type validation
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    errorMessage.value = 'Invalid file type. Only PNG and JPG images are allowed.'
    return
  }

  // File size validation
  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = `File size exceeds 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
    return
  }

  errorMessage.value = ''
  selectedFile.value = file

  // Read file as data URL for cropper
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function selectDifferentImage() {
  // Reset to upload mode state
  selectedFile.value = null
  imageSrc.value = ''
  errorMessage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function saveImage() {
  if (!cropper.value) {
    errorMessage.value = 'Cropper not initialized'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    // Get cropped canvas from vue-advanced-cropper
    const { canvas } = cropper.value.getResult()

    if (!canvas) {
      errorMessage.value = 'Failed to crop image'
      isSaving.value = false
      return
    }

    // Convert canvas to base64 (PNG format for quality)
    const base64Image = canvas.toDataURL('image/png', 0.9)

    // Validate base64 size (localStorage has ~5-10MB limit)
    const sizeInMB = (base64Image.length * 3) / 4 / 1024 / 1024
    if (sizeInMB > 4) {
      // Reduce quality if too large
      const reducedQualityImage = canvas.toDataURL('image/jpeg', 0.7)
      const reducedSize = (reducedQualityImage.length * 3) / 4 / 1024 / 1024

      if (reducedSize > 4) {
        errorMessage.value = 'Image too large even after compression. Please select a smaller image.'
        isSaving.value = false
        return
      }

      emit('save', reducedQualityImage)
    } else {
      emit('save', base64Image)
    }
  } catch (error) {
    errorMessage.value = 'Failed to save image. Please try again.'
    console.error('Error saving image:', error)
  } finally {
    isSaving.value = false
  }
}

function closeModal() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--padding-lg);
  border-bottom: 1px solid var(--color-border-primary);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.btn-modal-close {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.3s ease;
}

.btn-modal-close:hover {
  color: var(--color-danger);
}

.modal-body {
  padding: var(--padding-lg);
  overflow-y: auto;
  flex: 1;
}

.upload-area {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.upload-prompt {
  border: 2px dashed var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--padding-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap-md);
}

.upload-prompt:hover {
  border-color: var(--color-accent-gold-bright);
  background: rgba(212, 175, 55, 0.05);
}

.upload-icon {
  font-size: 48px;
  color: var(--color-accent-gold-bright);
  font-weight: var(--font-weight-bold);
}

.upload-text {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  margin: 0;
}

.upload-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.cropper-container {
  width: 100%;
  height: 400px;
}

.cropper {
  width: 100%;
  height: 100%;
}

.error-message {
  color: #ff4444;
  font-size: var(--font-size-sm);
  margin-top: var(--padding-md);
  text-align: center;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding: var(--padding-lg);
  border-top: 1px solid var(--color-border-primary);
}

.btn-neutral,
.btn-primary {
  padding: var(--padding-sm) var(--padding-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
}

.btn-neutral {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

.btn-neutral:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-accent-gold-bright);
}

.btn-primary {
  background: var(--color-accent-gold-bright);
  color: #1a1a1a;
  border-color: var(--color-gold-dim);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #FFD700 0%, #FFF4A3 100%);
  border-color: var(--color-gold-primary);
  box-shadow: 0 0 15px var(--color-gold-rgba-strong);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Warning Button Styles */
.btn-warning-small {
  background: var(--color-red-rgba-medium);
  border: var(--border-width-thin) solid var(--color-danger);
  color: #ffffff;
  transition: var(--transition-hover);
  padding: var(--padding-sm) var(--padding-lg);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.btn-warning-small:hover {
  background: var(--color-red-rgba-strong);
}
</style>
