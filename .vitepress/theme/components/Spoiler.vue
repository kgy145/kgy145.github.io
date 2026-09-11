<template>
  <span
      class="spoiler-wrapper"
      :class="{ 'is-hidden': !isRevealed }"
      :title="tooltip"
      :style="{ color: displayColor }"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
      @click="onClick"
      v-html="renderedContent"
  />
</template>

<script setup>
import { ref, computed, useSlots } from 'vue'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
})

const props = defineProps({
  bgColor: {
    type: String,
    default: 'var(--vp-c-bg)',
  },
  textColor: {
    type: String,
    default: 'var(--vp-c-text-1)',
  },
  tooltip: {
    type: String,
    default: '你知道的太多了',
  },
})

const slots = useSlots()

const extractText = (nodes) => {
  if (!nodes) return ''
  if (typeof nodes === 'string') return nodes
  if (Array.isArray(nodes)) {
    return nodes.map(node => extractText(node)).join('')
  }
  const children = nodes.children
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map(child => extractText(child)).join('')
  }
  return extractText(children)
}

const rawContent = computed(() => {
  const slotContent = slots.default?.()
  return extractText(slotContent) || ''
})

const renderedContent = computed(() => marked.parseInline(rawContent.value))

const mouseRevealed = ref(false)
const locked = ref(false)

const isRevealed = computed(() => locked.value || mouseRevealed.value)
const displayColor = computed(() =>
    isRevealed.value ? props.textColor : props.bgColor
)

const onMouseEnter = () => {
  if (!locked.value) mouseRevealed.value = true
}
const onMouseLeave = () => {
  if (!locked.value) mouseRevealed.value = false
}
const onClick = () => {
  locked.value = !locked.value
}
</script>

<style scoped>
.spoiler-wrapper {
  display: inline;
  cursor: pointer;
  transition: color 0.25s ease;
  border-radius: 2px;
  padding: 0 2px;
  background-color: v-bind(bgColor);
}

/* 遮挡状态：强制内部所有元素颜色继承父级 */
.spoiler-wrapper.is-hidden :deep(*) {
  color: inherit !important;
}

/* 额外处理链接下划线 */
.spoiler-wrapper.is-hidden :deep(a) {
  text-decoration: none !important;
}

/* 额外处理代码背景（如果代码有背景色） */
.spoiler-wrapper.is-hidden :deep(code) {
  background: transparent !important;
}
</style>
