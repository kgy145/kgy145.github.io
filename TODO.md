---
title: TODO
sidebar: false
aside: false
prev: false
next: false
---

<div class="discover">
  <h1 class="discover__title">恭喜！你发现了一张大饼！</h1>
  <img class="discover__img" src="/images/flatbread.svg" alt="pie in the sky" />
  <p>以后真的会补的喵~ 要不，你<a href="javascript:history.back()">回去</a>在下面的评论区踢我一下？</p>
</div>

<style scoped>
.discover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 0 20px;
  text-align: center;
}

.discover__title {
  font-size: 2.5rem;
  line-height: 1.3;
  margin: 0 0 2rem;
  background: linear-gradient(90deg, var(--vp-c-warning-1), var(--vp-c-brand-1));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.discover__img {
  width: 250px;
  max-width: 80%;
  height: auto;
  user-select: none;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
</style>