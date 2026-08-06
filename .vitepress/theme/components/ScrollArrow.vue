<template>
  <div class="scroll-arrow"
       :style="{ opacity: displayOpacity }"
       :class="{ breathing: isBreathing }">
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref, computed} from 'vue'

const scrollY = ref(0)

const displayOpacity = computed(() => {
  if (scrollY.value === 0) return undefined
  return Math.max(0, 0.75 * (1 - scrollY.value / 200))
})

// 是否处于呼吸状态（仅在滚动为 0 时）
const isBreathing = computed(() => scrollY.value === 0)

const handleScroll = () => {
  scrollY.value = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.scroll-arrow {
  position: absolute;
  bottom: 40px;
  left: 50%;
  width: 24px;
  height: 24px;
  border-right: 2px solid var(--vp-c-text-2);
  border-bottom: 2px solid var(--vp-c-text-2);
  transform: translateX(-50%) rotate(45deg);
  transition: opacity 0.1s ease;
}

.scroll-arrow.breathing {
  animation: arrow-breathe 2s ease-in-out infinite;
}

@keyframes arrow-breathe {
  0%, 100% { opacity: 0.1; }
  50%      { opacity: 0.8; }
}
</style>