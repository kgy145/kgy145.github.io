<script setup>
import DefaultTheme from 'vitepress/theme'
import BackgroundLayer from '../components/BackgroundLayer.vue'
import { onMounted } from 'vue'
import Live2DWidget from "../components/Live2DWidget.vue";
import ScrollArrow from "../components/ScrollArrow.vue";
import Giscus from "@giscus/vue";

const { Layout } = DefaultTheme

onMounted(() => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.opacity = '0'
    setTimeout(() => {
      splash.remove()
    }, 600)
  }
})
</script>

<template>
  <Layout>
    <template #layout-top>
      <Live2DWidget />
      <BackgroundLayer />
    </template>
    <template #home-hero-after>
      <ScrollArrow />
    </template>
    <template #doc-footer-before>
      <Giscus
          id="comments"
          repo="kgy145/kgy145.github.io"
          repo-id="R_kgDOTq9f3w"
          category="Announcements"
          category-id="DIC_kwDOTq9f384DCwpe"
          mapping="pathname"
          strict="0"
          reactions-enabled="1"
          emit-metadata="0"
          input-position="top"
          theme="preferred_color_scheme"
          lang="zh-CN"
          loading="lazy"
          crossorigin="anonymous"
      />
    </template>
  </Layout>
</template>
