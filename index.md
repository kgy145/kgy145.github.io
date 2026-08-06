---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Kaguya145's Blog"
  tagline: 必须要写些什么吗...
---

<!--suppress CheckEmptyScriptTag -->
<GHReadme owner="kgy145" repo="kgy145" customTitle="README.md" />

<BlogList />


<style>
.VPHero {
  height: calc(110vh - var(--vp-nav-height));
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.VPHero::after {
  content: '';
  position: absolute;
  bottom: 40px;
  left: 50%;
  width: 24px;
  height: 24px;
  border-right: 2px solid var(--vp-c-text-2);
  border-bottom: 2px solid var(--vp-c-text-2);
  transform: translateX(-50%) rotate(45deg);
  opacity: 0.6;
  animation: arrow-breathe 2.5s ease-in-out infinite;
  transition: opacity 0.3s ease, filter 0.3s ease;
}



</style>
