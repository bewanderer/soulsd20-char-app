<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ hasExistingImage ? 'Change' : 'Set' }} Character Image</h2>
          <button @click="closeModal" class="btn-modal-close">x</button>
        </div>

        <div class="modal-body">
          <!-- Step 1: File picker (no file selected yet) -->
          <div v-if="!localImageUrl" class="upload-area">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="file-input-hidden"
              @change="handleFileSelect"
            />

            <button @click="triggerFilePicker" class="btn-pick-file" :disabled="isUploading">
              Choose Image
            </button>
            <p class="upload-hint">JPEG, PNG, WebP or GIF. Max 5MB.</p>
          </div>

          <!-- Step 2: Cropper (file selected, crop it) -->
          <div v-if="localImageUrl" class="cropper-area">
            <Cropper
              ref="cropperRef"
              :src="localImageUrl"
              :stencil-props="{ aspectRatio: 1 }"
              :default-size="{ width: 400, height: 400 }"
              class="cropper-component"
            />

            <div class="cropper-controls">
              <button @click="clearFile" class="btn-change-file">Choose Different Image</button>
            </div>
          </div>

          <!-- Upload progress -->
          <div v-if="isUploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <p class="progress-text">Uploading...</p>
          </div>

          <!-- Error -->
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn-cancel">Cancel</button>
          <button
            v-if="hasExistingImage"
            @click="removeImage"
            class="btn-remove"
            :disabled="isUploading"
          >Remove Image</button>
          <button
            v-if="localImageUrl && !isUploading"
            @click="cropAndUpload"
            class="btn-save"
          >Upload</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { usePlayerStore } from '~/store/player'

interface Props {
  mode: 'upload' | 'edit'
  existingImage?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [imageData: string]
}>()

const playerStore = usePlayerStore()

const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<any>(null)
const localImageUrl = ref('')
const isUploading = ref(false)
const error = ref('')

const hasExistingImage = computed(() => {
  return !!(props.existingImage && props.existingImage !== '""' && props.existingImage !== '')
})

function triggerFilePicker() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  error.value = ''

  // Validate type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    error.value = 'Invalid file type. Use JPEG, PNG, WebP, or GIF.'
    return
  }

  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File too large. Maximum 5MB.'
    return
  }

  // Create local blob URL for the cropper (no CORS issues with local files)
  localImageUrl.value = URL.createObjectURL(file)
}

function clearFile() {
  if (localImageUrl.value) {
    URL.revokeObjectURL(localImageUrl.value)
  }
  localImageUrl.value = ''
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function cropAndUpload() {
  if (!cropperRef.value || !playerStore.UUID) return

  isUploading.value = true
  error.value = ''

  try {
    // Get cropped canvas from the cropper
    const { canvas } = cropperRef.value.getResult()
    if (!canvas) {
      error.value = 'Failed to crop image.'
      return
    }

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    })

    if (!blob) {
      error.value = 'Failed to process cropped image.'
      return
    }

    // Upload cropped image
    const formData = new FormData()
    formData.append('image', blob, 'portrait.jpg')

    const token = localStorage.getItem('sd20_auth_token')
    const config = useRuntimeConfig()
    const baseUrl = config.public.API_BASE_URL || 'http://127.0.0.1:8000'

    const response = await fetch(
      `${baseUrl}/api/characters/${playerStore.UUID}/upload-image/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      error.value = data.detail || `Upload failed (${response.status})`
      return
    }

    const data = await response.json()
    const imageUrl = data.image_url

    // Save the server URL as the image path
    emit('save', imageUrl)
  } catch (err) {
    error.value = 'Upload failed. Please try again.'
    console.error('[SD20] Image upload error:', err)
  } finally {
    isUploading.value = false
  }
}

function removeImage() {
  emit('save', '')
}

function closeModal() {
  // Clean up blob URL
  if (localImageUrl.value) {
    URL.revokeObjectURL(localImageUrl.value)
  }
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content {
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  max-width: clamp(28rem, 40vw, 36rem);
  width: 95%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em 1.25em;
  border-bottom: 0.0625rem solid rgba(255, 215, 0, 0.15);
}

.modal-title {
  color: var(--color-gold-primary);
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  margin: 0;
}

.btn-modal-close {
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25em 0.5em;
}

.btn-modal-close:hover {
  color: #fff;
}

.modal-body {
  padding: 1.25em;
}

/* File picker */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2em 1em;
}

.file-input-hidden {
  display: none;
}

.btn-pick-file {
  padding: 0.75em 2em;
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  border-radius: 0.375rem;
  color: #fff;
  font-weight: 600;
  font-size: clamp(0.9rem, 1.1vw, 1rem);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pick-file:hover:not(:disabled) {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
}

.btn-pick-file:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-hint {
  color: #666;
  font-size: 0.8em;
  margin-top: 0.75em;
}

/* Cropper */
.cropper-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cropper-component {
  width: 100%;
  max-height: 24rem;
  background: rgba(0, 0, 0, 0.3);
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
}

.cropper-controls {
  margin-top: 0.75em;
}

.btn-change-file {
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: #ccc;
  font-size: 0.85em;
  padding: 0.375em 1em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-file:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

/* Upload progress */
.upload-progress {
  margin-top: 1em;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  width: 100%;
  height: 100%;
  background: var(--color-gold-primary);
  animation: progress-anim 1.5s ease-in-out infinite;
}

@keyframes progress-anim {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  color: #888;
  font-size: 0.8em;
  margin-top: 0.5em;
}

/* Error */
.error-message {
  color: #ff8585;
  font-size: 0.85em;
  margin-top: 0.75em;
  text-align: center;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.625em;
  padding: 1em 1.25em;
  border-top: 0.0625rem solid rgba(255, 215, 0, 0.15);
}

.btn-cancel {
  padding: 0.5em 1.25em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-remove {
  padding: 0.5em 1.25em;
  background: rgba(255, 107, 107, 0.15);
  border: 0.0625rem solid rgba(255, 107, 107, 0.4);
  border-radius: 0.375rem;
  color: #ff8585;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: rgba(255, 107, 107, 0.25);
}

.btn-save {
  padding: 0.5em 1.25em;
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  border-radius: 0.375rem;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
}
</style>
