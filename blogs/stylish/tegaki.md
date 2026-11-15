---
title: Tegaki - 真正支持多语种的前端手写动画库
badge: ["软件相关"]
lastUpdated: 2026-11-16
prev: false
next: false
---

# Tegaki - 真正支持多语种的前端手写动画库

> 因为最近设计网页时想要手写动画，来代替平常快要用烂的“向上浮出”和“打字机”动画，所以一番查找找到了这个宝藏库。研究库的同时也顺便把主页的标题换成了手写的，实现了之前一直有的愿望！

前端常见的文字动画，大多停留在“逐字弹出”或者“透明度渐变”的层面。如果想要那种 3B1B 视频里“一笔一划写字”的效果，传统的做法通常是用 `stroke-dasharray` 配合 `stroke-dashoffset` 去描 SVG 的轮廓。这种做法对纯英文或者简单的图标还行，一旦碰上汉字这种多笔画、结构复杂的字符，如果字体没选对，出来的效果就像是在给空心字勾边，极其诡异。<Spoiler>尽管说想要 3B1B 式的描边填充，但最后还是回退到了直接书写（）</Spoiler>

Tegaki 完全解决了这个痛点。它不仅能做描边，还真正做到了**基于真实笔顺**的手写动画。

## 为什么选择 Tegaki？

相比于市面上其他的手写动画库，Tegaki 在几个维度上表现得非常突出：

| 特性        | 传统 SVG 描边方案     | Tegaki                   |
|:----------|:----------------|:-------------------------|
| **核心原理**  | 沿着字形外轮廓画线       | 提取字形**中心线（骨架）**，按真实笔顺模拟  |
| **汉字支持**  | 效果差，容易变成空心字描边   | 完美支持，基于 KanjiVG 等专业笔顺库   |
| **连笔效果**  | 无，容易断节          | 内置 HarfBuzz 支持，完美还原英文连笔  |
| **自定义字体** | 需要自己提取 SVG Path | 提供可视化 Studio，上传字体直接生成数据包 |

## 在 VitePress 中的配置

由于博客是 VitePress 驱动的，和普通的 Vue 项目会有细微的差别。

首先，Tegaki 官方提供了 `tegaki/vue` 组件[^1]，这对 Vue 3 的生态非常友好。你需要先在 `theme/index.ts` 中全局注册它：

```typescript
// .vitepress/theme/index.ts
import { TegakiRenderer } from 'tegaki/vue'

export default {
  enhanceApp({ app }) {
    app.component('TegakiRenderer', TegakiRenderer)
  }
}
```

这样就能在 Markdown 文件中直接调用该标签了。

包里内置了诸如 `caveat`, `lxgw-wenkai`（落霞孤鹜 <Spoiler>正好是博客现在用的全局字体</Spoiler>）等经典字体，但如果想要 **自定义的字体**，那么就要去 [Tegaki Studio](https://tegaki.ink/studio) 上创建专属的 bundle，并解压至 `.vitepress/theme/assets` 之类的路径。运气好的话 Studio 会直接 **内置笔画顺序方案** ，比如首页的 Dancing Script，运气不好的话就只能 **自己上传字体文件** 并进行路径标识了。

![export_button.png](/images/stylish/tegaki/export_button.png)

然后一切配置好后，就可以点击右上角的 `Export` 按钮。接下来的事情就是 **耐心、耐心、耐心** 地等着它转圈。<Spoiler>别问我它为什么这么耗时，也别问我为什么请求会蹦一堆 404，更别问我为什么就不能弄个进度条（）</Spoiler>构建时间会比较漫长，如果不放心可以按 `F12` 在 **网络选项卡** 中查看脚本是否真正在跑（如果在跑的话会疯狂向 GitHub 拉 fetch）。

接着，就如同上面所说，解压到 `assets`，并在对应界面进行导入。例如我的 Dancing Script：

```typescript
import dancingScript from './.vitepress/theme/assets/dancing-script/bundle.ts';
```

然后在 Vue 组件中进行使用：

```vue
<TegakiRenderer
    :font="dancingScript"
    text="Wonderhoy~"
    :time="{ mode: 'uncontrolled', speed: 2 }"
    :style="{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', width: '100%', color: '#FF66BB' }">
</TegakiRenderer>
```

上面代码的实现效果大致如下：

<div class="tegaki-demo-wrapper" ref="observerTarget">
<div class="tegaki-content">
<div style="flex: 1;">
<TegakiRenderer
  v-if="hasStarted"
  :key="renderKey"
  :font="dancingScript"
  text="Wonderhoy~"
  :time="{ mode: 'uncontrolled', speed: 2 }"
  :style="{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', width: '100%', color: '#FF66BB' }">
</TegakiRenderer>
</div>

<button class="tegaki-text-btn" @click="replay" title="重播动画">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
<path d="M21 3v5h-5"></path>
</svg>
重播
</button>
</div>
</div>

## 更加折腾：添加渐变色

当把主标题彻底换成 `TegakiRenderer` 的时候，发现辛辛苦苦写的  **CSS 文字渐变失效了**。于是开始继续排查。

最后发现了原因：在 DOM 树里，Tegaki 用的是 `<canvas>` 进行渲染，在文字上设置的普通纯色会被自动解析，而渐变色就不会了。于是，又回头查了它的官方文档，找到了官方的插件 `globalGradientPlugin`[^2]。翻译的文档可以点开下面的折叠块查看。

<details>
<summary>详细文档</summary>

### 文本渐变：`globalGradientPlugin`

为整段文字应用一个线性渐变（效果类似 CSS 的 `background-clip: text`）。渐变会覆盖文字的所有笔画，从一端延伸到另一端。

#### 参数说明

| 参数       | 默认值                      | 作用                           |
|:---------|:-------------------------|:-----------------------------|
| `colors` | `['#ff0000', '#0000ff']` | 渐变的色标数组，按顺序排列。               |
| `angle`  | `0`                      | 渐变角度。`0` 表示从左到右，`90` 表示从上到下。 |

#### 💡 重要注意事项

1. **优先级**：如果同时使用了多个渐变插件，**排在数组后面的会覆盖前面的**。
2. **发光特效冲突**：文字的光晕（Glow）效果使用的是文字自身（或单独设置）的颜色，**不会**跟着渐变色变化。
3. **字体回退**：在 Canvas 渲染下，如果因为字体缺失使用了回退字体（fallback font），这些回退渲染的字符**不会显示渐变**（除非开启了 `clip-to-text`）。

</details>

总之类似文档一样，填入对应的参数即可使用全局渐变了。拿主页的标题举个例子：

```typescript
import bundle from '.vitepress/theme/assets/dancing-script/bundle.ts';
import { globalGradientPlugin } from 'tegaki/vue';
```

```vue
<TegakiRenderer
    :font="dancingScript"
    text="Kaguya145's Blog"
    :time="{ mode: 'uncontrolled', speed: 3 }"
    :plugins="heroPlugins"
    :style="{ fontSize: 'clamp(2rem, 8vw, 4.5rem)', width: '100%' }">
</TegakiRenderer>
```

效果如下：

<div class="hero-gradient-demo" ref="heroObserverTarget">
<div class="tegaki-content" style="justify-content: center;">
<TegakiRenderer
  v-if="heroHasStarted"
  :key="heroRenderKey"
  :font="dancingScript"
  text="Kaguya145's Blog"
  :time="{ mode: 'uncontrolled', speed: 3 }"
  :plugins="heroPlugins"
  :style="{ fontSize: 'clamp(2rem, 8vw, 4.5rem)', width: '100%' }">
</TegakiRenderer>

<button v-show="heroHasStarted" class="tegaki-text-btn" @click="replayHero" title="重播动画">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
<path d="M21 3v5h-5"></path>
</svg>
重播
</button>
</div>
</div>

## 更加折腾：动画般的动态线条

在翻文档时，顺便发现了一个很好玩的样式插件 `boilPlugin`。在传统二维手绘动画或定格动画中，即便物体静止，因为每一帧的线条都是重新画的，画面会产生极微小的抖动，这种效果被称为 **Line Boil（线条沸腾）**。

Tegaki 完美复刻了这个细节。开启后，文字不仅是一板一眼的矢量图，更像是用笔在纸上画出来后“活”了过来，带有手绘独有的呼吸感。

<details>
<summary>详细文档</summary>

### 线条沸腾：`boilPlugin`

模拟手绘动画的线条抖动效果。文字在书写时或者写完后，线条会持续产生极微小的变形和位移。

#### 参数说明

| 参数         | 默认值     | 作用                            |
|:-----------|:--------|:------------------------------|
| `drawings` | `3`     | 生成几套不同的抖动画稿循环播放（2–8）。         |
| `fps`      | `12`    | 每秒切换画稿的次数（帧率）。8 会有明显的定格动画感。   |
| `amount`   | `0.012` | 线条偏离原位置的最大距离。                 |
| `detail`   | `0.3`   | `0` 时线条缓慢弯曲，`1` 时线条沿长度方向剧烈抖动。 |
| `width`    | `0.08`  | 笔触粗细的变化比例。                    |
| `idle`     | `false` | 设为 `true` 时，文字写完后依然保持持续沸腾状态。  |

> 官方预设：**Cartoon**（卡通，慢速弯曲持续沸腾）、**Nervous**（紧张，细碎高频率抖动）、**Sketchy**（草图，幅度较大且持续沸腾）。

</details>

配合渐变插件一起使用，演示一下：

<div class="tegaki-demo-wrapper" ref="boilObserverTarget">
<div class="tegaki-content">
<div style="flex: 1;">
<TegakiRenderer
  v-if="boilHasStarted"
  :key="boilRenderKey"
  :font="jpBundle"
  text="うわわーっ それってとってもわんだほーいだね!"
  :time="{ mode: 'uncontrolled', speed: 5 }"
  :plugins="boilAndRainbowPlugins"
  :style="{ fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)', width: '100%' }">
</TegakiRenderer>
</div>

<button v-show="boilHasStarted" class="tegaki-text-btn" @click="replayBoil" title="重播动画">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
<path d="M21 3v5h-5"></path>
</svg>
重播
</button>
</div>
</div>

<Spoiler>虽然加了抖动会让文字看起来更有灵魂，但在写大段文章时还是关掉为好，不然盯久了真的会头晕（）</Spoiler>

## 更加折腾：多多益善！

除了上面提到的渐变和沸腾，Tegaki 官方还内置了一系列样式插件：

- **`taperPlugin`（笔锋）**：模拟真实毛笔或钢笔的提按效果，让每一笔的起笔和收笔自然变细，告别机械感。通过调整 `startLength` 和 `endLength`，你可以决定笔锋的锐利程度。
- **`glowPlugin`（霓虹发光）**：给文字加上柔和的光晕。如果配合暗色背景使用，瞬间就能拥有赛博朋克般的霓虹灯管质感。它的 `radius`、`color` 和偏移量都是可调的。
- **`strokeGradientPlugin`（单笔渐变）**：和前面覆盖全文的全局渐变不同，这个插件是**针对每一笔单独渐变**。如果不传入颜色数组，它会直接生成一个饱和度极高的彩虹色，非常适合用来做炫彩的艺术字。
- **`variationPlugin`（千字千面）**：人手写出来的字是不完美的。这个插件会给文本中的每个字形加上微小的缩放、倾斜、旋转、位移甚至微微的扭曲。即使你用的是死板的电子字体，开启它之后也能瞬间拥有真实的“手写呼吸感”。
- **`annotatePlugin`（批注）**：它会在文字写完之后，自动给你画上**下划线、删除线、双划线**，甚至是用红笔**圈出重点**或者画个**方框** <Spoiler>似乎想起了xhs的模板？</Spoiler>。你可以设置它作用于全句、每一行还是每一个单词。

另外，如果你想查看或创建属于自己的插件，可以查阅[官方的插件开发文档](https://tegaki.ink/api/renderer/#plugins-1)，或者在 [Tegaki Studio](https://tegaki.ink/studio) 的 Plugins 标签页里看看官方写的 Demo。<Spoiler>让 Agent 看也是可以的！</Spoiler>

---

总之这篇推荐就是这样。有时候，发掘一个很酷的项目可能真的不需要刻意去冥思苦想，翻箱倒柜；它更像做好日常的事，发现问题了就去寻找解决方案，有造好的轮子就学习，没有或不满意现有的就自己造一个。如同沙海拾贝一样，最终驱动前进的也许就是对未知的好奇吧。

算了不煽情了，总之的总之，如果大家对于本期推荐的 Tegaki 有什么好的利用方式和自制插件一类，欢迎在下方的 Giscus 评论区分享！很期待看到大家的奇思妙想 OvO

[^1]: https://tegaki.ink/frameworks/vue/
[^2]: https://tegaki.ink/api/renderer/#text-gradient-globalgradientplugin-globalgradient

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import dancingScript from '@/../.vitepress/theme/assets/dancing-script/bundle.ts';
import jpBundle from 'tegaki/fonts/klee-one';
import { boilPlugin } from 'tegaki/core';
import { globalGradientPlugin } from 'tegaki/vue';

const observerTarget = ref(null);
const hasStarted = ref(false);
const renderKey = ref(0);

const heroObserverTarget = ref(null);
const heroHasStarted = ref(false);
const heroRenderKey = ref(0);

const boilObserverTarget = ref(null);
const boilHasStarted = ref(false);
const boilRenderKey = ref(0);
let boilTimeoutId = null;
let boilObserver = null;

let timeoutId = null;
let observer = null;
let heroTimeoutId = null;
let heroObserver = null;

const myBoil = boilPlugin({ drawings: 3, fps: 8, amount: 0.015, idle: true });
const myGradient = globalGradientPlugin({ colors: ['#bd34fe', '#41d1ff'] });
const rainbowGradient = globalGradientPlugin({
  colors: ['#FFBB00', '#FF66BB', '#33DD99', '#BB88EE']
});
const boilAndRainbowPlugins = [myBoil, rainbowGradient];

const heroPlugins = [myGradient];
const boilPlugins = [myBoil];

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        timeoutId = setTimeout(() => {
          hasStarted.value = true; 
        }, 2000);
        observer.unobserve(entry.target); 
      }
    });
  }, { threshold: 0.5 });

  if (observerTarget.value) observer.observe(observerTarget.value);

  heroObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        heroTimeoutId = setTimeout(() => {
          heroHasStarted.value = true; 
        }, 2000);
        heroObserver.unobserve(entry.target); 
      }
    });
  }, { threshold: 0.5 });

  if (heroObserverTarget.value) heroObserver.observe(heroObserverTarget.value);

  boilObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        boilTimeoutId = setTimeout(() => {
          boilHasStarted.value = true; 
        }, 2000); 
        boilObserver.unobserve(entry.target); 
      }
    });
  }, { threshold: 0.5 });

  if (boilObserverTarget.value) boilObserver.observe(boilObserverTarget.value);
});

onBeforeUnmount(() => {
  if (timeoutId) clearTimeout(timeoutId);
  if (observer) observer.disconnect();
  if (heroTimeoutId) clearTimeout(heroTimeoutId);
  if (heroObserver) heroObserver.disconnect();
  if (boilTimeoutId) clearTimeout(boilTimeoutId);
  if (boilObserver) boilObserver.disconnect();
});

const replay = async () => {
  if (timeoutId) clearTimeout(timeoutId);
  hasStarted.value = false;
  await nextTick();
  renderKey.value += 1;
  hasStarted.value = true;
};

const replayHero = async () => {
  if (heroTimeoutId) clearTimeout(heroTimeoutId);
  heroHasStarted.value = false;
  await nextTick();
  heroRenderKey.value += 1;
  heroHasStarted.value = true;
};

const replayBoil = async () => {
  if (boilTimeoutId) clearTimeout(boilTimeoutId);
  boilHasStarted.value = false;
  await nextTick();
  boilRenderKey.value += 1;
  boilHasStarted.value = true;
};
</script>

<style>
.tegaki-demo-wrapper {
  min-height: 60px;
  display: flex;
  align-items: center;
  margin: 1rem 0;
}

.tegaki-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.tegaki-text-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--vp-c-text-2);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.tegaki-text-btn:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.hero-gradient-demo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
  text-align: center;
}
</style>
