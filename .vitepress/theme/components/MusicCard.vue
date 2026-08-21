<template>
  <div class="music-card">
    <div class="music-header">
      <h2 class="music-title">{{ title }}</h2>
      <span v-if="transliteration" class="music-transliteration">{{ transliteration }}</span>
    </div>

    <ul class="music-info">
      <li v-if="singer"><strong>演唱：</strong>{{ singer }}</li>
      <li v-if="lyricist"><strong>作词：</strong>{{ lyricist }}</li>
      <li v-if="composer"><strong>作曲：</strong>{{ composer }}</li>
      <li v-if="arranger"><strong>编曲：</strong>{{ arranger }}</li>
    </ul>

    <!-- 简介：默认插槽优先，属性 description 作为后备 -->
    <div class="music-description">
      <slot>
        <p v-if="description">{{ description }}</p>
      </slot>
    </div>

    <!-- 网易云播放器 -->
    <div v-if="neteaseId" class="music-player">
      <nmp-player
          :song-id="neteaseId"
          theme="auto"
          layout="compact"
          remember="false"
      ></nmp-player>
      <div class="player-tip">
        <a :href="`https://music.163.com/song?id=${neteaseId}`" target="_blank">
          如果无法播放，点击此处跳转网易云音乐
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import "netease-mini-player-v3/auto";
defineProps({
  title: { type: String, required: true },
  transliteration: { type: String, default: '' },
  singer: { type: String, default: '' },
  lyricist: { type: String, default: '' },
  composer: { type: String, default: '' },
  arranger: { type: String, default: '' },
  description: { type: String, default: '' },
  neteaseId: { type: [String, Number], default: null },
})
</script>

<style scoped>
.music-card {
  margin: 2rem auto;
  padding: 1.5rem 2rem;
  /* 毛玻璃效果 */
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
}

.music-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 暗色模式适配 */
.dark .music-card {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.music-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.music-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.music-transliteration {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  font-weight: 400;
}

.music-info {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.6rem;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
}

.music-info li {
  margin: 0;
}

.music-info strong {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.music-description {
  margin: 0.8rem 0 1.2rem;
  padding: 0.8rem 0 0;
  border-top: 1px dashed var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.7;
  white-space: pre-wrap;
}

.music-player {
  margin-top: 0.6rem;
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
}

.player-tip {
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.player-tip a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border-bottom: 1px dotted transparent;
  transition: border-color 0.2s;
}

.player-tip a:hover {
  border-bottom-color: var(--vp-c-brand-1);
}

/* 移动端响应式 */
@media (max-width: 640px) {
  .music-card {
    padding: 1rem 1.2rem;
  }
  .music-title {
    font-size: 1.3rem;
  }
  .music-info {
    flex-direction: column;
    gap: 0.2rem;
  }
}
</style>