---
layout: home
---

<div class="custom-hero">
  <svg width="0" height="0" style="position: absolute; pointer-events: none;">
    <defs>
      <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="30%" stop-color="#bd34fe" />
        <stop offset="100%" stop-color="#41d1ff" />
      </linearGradient>
    </defs>
  </svg>

  <h1 class="name">
    <TegakiRenderer 
      :font="bundle" 
      text="Kaguya145's Blog" 
      :time="{ mode: 'uncontrolled', speed: 3 }"
      :plugins="plugins" 
      :style="{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', width: '100%' }"
    ></TegakiRenderer>
  </h1>

  <div class="text-wrapper">
    <TegakiRenderer 
      :font="chi_bundle" 
      text="必须要写些什么吗..." 
      :time="{ mode: 'uncontrolled', speed: 10, delay: 1.5 }"
      :style="{ fontSize: 'clamp(1.4rem, 4vw, 2.4rem)', width: '100%', color: 'var(--vp-c-text-2)' }"
    ></TegakiRenderer>
  </div>
</div>

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
.VPHero {
  display: none !important;
}

.custom-hero {
  height: calc(110vh - var(--vp-nav-height));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
}

.custom-hero .name svg path {
  fill: url(#hero-grad) !important;
}

.custom-hero {
  margin: 0;
  font-weight: 700;
  width: 100%;
  transform: translateY(-10vh); 
}

.custom-hero {
  width: 100%;
  /* 这里的 margin-top 可以进一步微调间距 */
  margin-top: 2rem; 
  transform: translateY(-5vh); /* 跟随主标题稍微上移一点 */
}

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
import bundle from '.vitepress/theme/assets/dancing-script/bundle.ts'; 
import chi_bundle from 'tegaki/fonts/lxgw-wenkai';
import { globalGradientPlugin } from 'tegaki/vue';
import { onMounted } from 'vue';

const myGradient = globalGradientPlugin({
  colors: ['#bd34fe', '#41d1ff']
});

const plugins = [myGradient];

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
