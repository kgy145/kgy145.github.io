<script setup lang="ts">
import {onMounted, ref} from 'vue'

const API_URL = 'https://uapis.cn/api/v1/random/image?category=acg'
const DEFAULT_URL = '/images/home-bg-1.webp'

const bgUrl = ref(DEFAULT_URL)
const isLoading = ref(false)
const imageOpacity = ref(1)
const toastMessage = ref('')
const toastVisible = ref(false)

let toastTimer: ReturnType<typeof setTimeout> | null = null

const getFreshUrl = () => {
  const isMobile = window.innerWidth < 768
  const type = isMobile ? 'mb' : 'pc'
  const timestamp = Date.now()
  return `${API_URL}&type=${type}&t=${timestamp}`
}

const showToast = (msg: string) => {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

const onImageLoad = () => {
  imageOpacity.value = 1
  isLoading.value = false
}

const onImageError = () => {
  bgUrl.value = DEFAULT_URL
  imageOpacity.value = 1
  isLoading.value = false
  showToast('图片加载失败，已回退默认背景')
}

const refreshBg = () => {
  if (isLoading.value) return
  isLoading.value = true
  imageOpacity.value = 0
  bgUrl.value = getFreshUrl()
}

onMounted(() => {
  const img = new Image()
  img.src = DEFAULT_URL
  img.onload = () => {
    imageOpacity.value = 1
  }
  img.onerror = () => {
    imageOpacity.value = 1
  }
})

const isSaving = ref(false)

const saveBg = async () => {

}
</script>

<template>
  <div class="bg-layer">
    <div class="bg-layer-blur"></div>
    <img
        class="bg-layer-image"
        :src="bgUrl"
        :style="{ opacity: imageOpacity }"
        @load="onImageLoad"
        @error="onImageError"
        alt="背景图片"
    />
  </div>
  <div class="footer-text">
    <span v-if="bgUrl === DEFAULT_URL">默认背景图来源 Pixiv: 48853577，</span><a
      href="#"
      :class="{ disabled: isLoading }"
      @click.prevent="refreshBg"
  >{{ isLoading ? '加载中...' : '点我随机更换背景' }}</a>
  </div>
  <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
</template>

<style scoped>
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
}

.bg-layer-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: -2;
  transition: opacity 0.6s ease;
}

.bg-layer-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  z-index: -1;
}

.dark .bg-layer-blur {
  background-color: rgba(0, 0, 0, 0.7);
}

.footer-text {
  position: fixed;
  bottom: 1%;
  right: 1%;
  color: rgba(0, 0, 0);
  font-size: 12px;
  font-family: sans-serif;
  z-index: 9999;
}

.dark .footer-text {
  color: rgba(255, 255, 255);
}

.footer-text a {
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
  transition: opacity 0.2s;
}

.footer-text a.disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: default;
}

.toast {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 999;
  font-family: sans-serif;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
