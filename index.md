---
layout: home

hero:
  name: "Kaguya145's Blog"
  tagline: 必须要写些什么吗...
---

<ScrollArrow />

<div class="home-content">
  <div class="left-panel">
    <BlogList :limit=10 :card=false />
  </div>
  <div class="right-panel">
    <GHReadme owner="kgy145" repo="kgy145" customTitle="README.md" />
  </div>
</div>

<style>
.home-content {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  align-items: flex-start;
}

.left-panel {
  flex: 2;
  min-width: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .home-content {
    flex-direction: column;
    gap: 1.5rem;
  }
  .left-panel,
  .right-panel {
    flex: 1;
    width: 100%;
  }
}

.right-panel .gh-readme {
  margin: 0;
}

.right-panel .gh-readme {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.dark .right-panel .gh-readme {
  background: rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  const el = document.querySelector('.home-content');
  if (!el) return;

  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
          break;
        }
      }
    },
    { threshold: 0.15 }
  );

  observer.observe(el)
})
</script>
