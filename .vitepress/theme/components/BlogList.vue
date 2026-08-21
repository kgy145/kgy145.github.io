<template>
  <div class="blog-list" :class="{ 'blog-list-card': card }">
    <ul>
      <li v-for="post in visiblePosts" :key="post.url">
        <a :href="withBase(post.url)" class="post-title">{{ post.title }}</a>
        <p class="post-excerpt">{{ excerpt(post) }}</p>
        <div class="post-meta">
          <time class="post-date">{{ formatDate(post.lastUpdated) }}</time>
          <span
              v-for="badge in post.badges"
              :key="badge"
              class="badge"
              :style="badgeStyle(badge)"
          >
            {{ badge }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '../posts.data.ts'

const props = defineProps({
  limit: {
    type: Number,
    default: 5,
  },
  excerptLength: {
    type: Number,
    default: 150,
  },
  badgeMap: {
    type: Object,
    default: () => ({}),
  },
  card: {
    type: Boolean,
    default: true,
  },
})

// 默认 badge → 背景色/文字色 映射
const defaultBadgeMap = {
  '硬件DIY': { bg: '#e67e22', color: '#fff' },
  '软件相关': { bg: '#3498db', color: '#fff' },
  '生活': { bg: '#99f312', color: '#fff' },
  'ACG': { bg: '#e382a2', color: '#fff' },
  '游戏': { bg: '#12f3e0', color: '#fff' }
}

const badgeMap = computed(() => ({
  ...defaultBadgeMap,
  ...props.badgeMap,
}))

const visiblePosts = computed(() => {
  return posts.slice(0, props.limit)
})

function excerpt(post) {
  const text = post.contentText || ''
  if (text.length <= props.excerptLength) return text
  return text.slice(0, props.excerptLength) + '...'
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function badgeStyle(badge) {
  const map = badgeMap.value
  if (map[badge]) {
    return {
      backgroundColor: map[badge].bg,
      color: map[badge].color,
    }
  }
  return {
    backgroundColor: 'var(--vp-badge-info-bg)',
    color: 'var(--vp-badge-info-text)',
  }
}
</script>

<style scoped>
/* 基础列表样式（始终存在） */
.blog-list ul {
  list-style: none;
  padding: 0;
}
.blog-list li {
  margin-bottom: 1.8rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 1.2rem;
}
.post-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.post-title:hover {
  color: var(--vp-c-brand-1);
}
.post-excerpt {
  margin: 0.5rem 0 0.4rem;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
}
.post-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.85rem;
}
.post-date {
  color: var(--vp-c-text-3);
  margin-right: 0.4rem;
}
.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  text-transform: capitalize;
}

.blog-list-card {
  margin: 2rem auto;
  padding: 1rem 1.5rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
}

.blog-list-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
</style>