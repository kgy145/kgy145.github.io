<template>
  <div class="gh-readme">
    <span v-if="showTitle" class="gh-title">{{ customTitle || `${owner}/${repo}/blob/${branch}/README.md` }}</span>
    <div v-if="loading" class="vp-doc">少女祈祷中...</div>
    <div v-else-if="error" class="vp-doc">无法加载位于{{ url }}的Markdown文档，错误信息：{{ error }}</div>
    <div v-else class="vp-doc" v-html="rendered" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  branch: { type: String, default: 'main' },
  showTitle: { type: Boolean, default: true },
  customTitle: { type: String, required: false }
})

const loading = ref(true)
const error = ref(null)
const rendered = ref('')
const url = ref('')

onMounted(async () => {
  try {
    url.value = `https://raw.githubusercontent.com/${props.owner}/${props.repo}/${props.branch}/README.md`
    const res = await fetch(url.value)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.text()
    rendered.value = marked.parse(raw)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.gh-readme {
  position: relative;
  margin: 2rem auto;
  padding: 2.5rem 2rem 1.5rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
}

.gh-readme:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.gh-readme :deep(.vp-doc) {
  margin: 0;
  padding: 0;
}

.gh-title {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  user-select: none;
}
</style>