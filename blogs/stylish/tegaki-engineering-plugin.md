---
title: Tegaki 插件开发：工程制图风手写动画
badge: ["软件相关"]
lastUpdated: 2026-11-17
prev:
  text: "Tegaki - 真正支持多语种的前端手写动画库"
  link: "/blogs/stylish/tegaki"
next: false
---

# Tegaki 插件开发：工程制图风手写动画

> [上一篇](/blogs/stylish/tegaki) 只是简单介绍了一下 Tegaki 的相关用法；但仍然还是想要 3B1B 式的描边填充，这期就借助 DSH 来实现一下夙愿。以下大部分都是 DSH 生成的稿件。

效果大概是这样：`工程制图` 四个字（字体换成 Noto Sans SC），辅助线和底网格先出现，然后逐笔空心书写，写完一个字就擦掉它的辅助线并填色。

## 想要的效果

把需求拆成能落到钩子上的四件事：

1. **线分三种**：
   - **投影框线**：每个笔画墨迹包围盒的四条边，各自延长到画布的上下左右边界，像工程图的投影线；
   - **底网格**：整张画布的坐标纸衬底，静止不动；
   - **笔画轨迹**：正在画的那一笔的墨迹轮廓，也就是“空心字”的边。
2. **网格先出现**：在落笔之前，先把整段文字的投影线和底网格显示出来。
3. **逐笔空心，按字符上色**：画的时候只描轮廓；一个字符（不是整段话）的所有笔画都结束后，整字统一渐入填色，轮廓保留。
4. **字符写完擦线**：该字符的投影框线按各自方向缩回擦除，方向由线序号奇偶决定，不需要随机数，也不依赖 seed，重播/拖动进度都能复现。

## 先认识 Tegaki 的插件 API

### 插件就是一个对象

`plugins` 接收插件对象（或注册过的名字），按数组顺序执行。一个插件可以只实现需要的钩子：

| 钩子                      | 调用时机                      | 这次用在哪           |
|-------------------------|---------------------------|-----------------|
| `geometry(path, ctx)`   | 每次布局，每笔一次                 | 不用              |
| `timing(ctx)`           | 每次布局，拿到所有笔画的时间            | 笔画重叠、开场留白、时间轴尾部 |
| `outline(contour, ctx)` | 每次布局，改 clip-to-text 的字形轮廓 | 不用              |
| `paint(stroke, next)`   | 每帧、每笔                     | 空心轨迹 + 渐入填色     |
| `ink(ctx)`              | 每帧，成品墨迹后处理                | 不用              |
| `underlay(ctx)`         | 每帧，墨迹下方独立图层               | 底网格 + 投影框线      |
| `overlay(ctx)`          | 每帧，墨迹上方                   | 不用              |
| `onFrame(frame, prev)`  | 每帧后                       | 不用              |
| `bounds(ctx)`           | 布局时决定画布要多大                | 给轮廓留余量          |
| `svg(ctx)`              | 导出 SVG 时                  | 没实现，已知限制        |
| `attach(ctx)`           | 引擎开始运行插件时                 | 不用              |
| `steps`                 | 循环多套画稿                    | 不用              |

### 几个关键上下文

- **`frame`**：一帧的完整状态。`frame.time` 是时间轴秒数，`frame.strokes` 是全部 placed strokes（没画到的也在），每个 `StrokeFrame` 带 `entryIndex`（属于哪个字符）、`path`、`start`、`duration`、`state`（`pending` / `drawing` / `done`）、`progress`（0–1 的绘制进度）和 `head`（笔尖位置）。
- **坐标**：所有路径和绘制上下文都在“文本框左上角为原点”的 CSS px 里，`:style="{ fontSize }"` 变了会自动缩放。
- **`paint` 的 `next`**：`paint` 是一层链。调用 `next(stroke)` 会把这一笔继续交给后面的插件和默认画笔；可以改 `style`/`path` 再传，也可以不传（这一笔就没有填色），或者多传一次。默认画笔只画“已经画到的部分”，所以 `pending` 笔画传进去什么也不显示。
- **`underlay`**：画在一张独立画布上，最后垫到墨迹下面，不受 clip-to-text 裁剪。适合画网格、参考线。它的 `ctx` 和主画布同一个变换，`ctx.canvas` 是当前画布尺寸。
- **`timing`**：返回每笔的 `{ start, duration }` 和可选的总时长；引擎会按它重排整条时间轴，`frame.time`、CSS 时间、`onComplete`、`toSVG` 都跟着走。
- **`bounds`**：插件画的、超出墨迹范围的像素靠它撑大画布；投影线画到画布边缘，所以不用额外撑，只给轮廓留一点余量。
- **`paintsDrawnOnly(factory)`**：告诉引擎这个插件的 `paint` 只处理“笔已经画到”的笔画，引擎会跳过 `pending` 笔画，也省掉一层 unclipped 画布。我们的 `paint` 只在 `state !== 'pending'` 时画，正合适。

### 用参数描述插件

`createPlugin` 把参数声明成数据，UI 可以据此生成控件，`resolve()` 会把外部输入夹到范围内：

```ts
import { createPlugin } from 'tegaki/core';

export const myPlugin = createPlugin({
  name: 'my-plugin',
  params: {
    mesh: { type: 'length', default: 0.125, unit: 'em', min: 0, max: 0.5 },
    color: { type: 'color', default: '#38bdf8' },
    opacity: { type: 'number', default: 0.35, min: 0, max: 1 },
  },
  setup({ mesh, color, opacity }) {
    return {
      underlay({ ctx, fontSize }) {
        const pitch = lengthToPx(mesh, fontSize);
        // ...
      },
    };
  },
});
```

`length` 参数统一走 `lengthToPx(length, fontSize)`：不带单位按 `em`，也可以写 `'8px'` 或 `'0.1em'`。`setup` 只调用一次（每个插件实例一次），缓存放在闭包里即可。

### 最小骨架

```ts
export const engineeringPlugin = paintsDrawnOnly(
  createPlugin({
    name: 'engineering',
    params: { /* ... */ },
    setup(options) {
      return {
        bounds({ strokes, fontSize }) { /* ... */ },
        timing({ strokes, duration }) { /* ... */ },
        underlay({ ctx, frame, fontSize }) { /* ... */ },
        paint(stroke, next) { /* ... */ },
      };
    },
  }),
);
```

这个插件只用到 `timing + underlay + paint + bounds`，没有 `geometry`——它不改笔迹形状，只改“什么时候画、画成什么样”。

## 三种线

参数分三组，颜色、粗细、不透明度各自独立；前两种把不透明度或粗细设成 `0`，`underlay` 里连计算都不做：

| 线    | 画在哪            | 参数                                                  | 设为 0 |
|------|----------------|-----------------------------------------------------|------|
| 投影框线 | `underlay`，墨迹下 | `frameColor` / `frameWidth` / `frameOpacity`        | 关闭   |
| 底网格  | `underlay`，更靠下 | `gridColor` / `gridWidth` / `gridOpacity`，间距 `mesh` | 关闭   |
| 笔画轨迹 | `paint`，属于墨迹   | `outlineColor` / `outlineWidth` / `outlineOpacity`  | 关闭   |

### 投影框线：把包围盒的四条边拉通

对每一笔取 `path.bounds()`，得到 `minX/maxX/minY/maxY`；它的左边和右边是竖线，上下边是横线。画的时候不画框，而是把竖线沿 y 拉到画布的 `top..bottom`、把横线沿 x 拉到 `left..right`，于是每个笔画的包围盒变成穿过整张画布的投影线。

画布范围从 `underlay` 的 `ctx` 反推：

```ts
export function canvasBox(width, height, transform) {
  const a = transform.a || 1;
  const d = transform.d || 1;
  return {
    left: -transform.e / a,
    top: -transform.f / d,
    right: (width - transform.e) / a,
    bottom: (height - transform.f) / d,
  };
}
```

字符内相同坐标的线先合并，再按 `axis + 坐标` 排序；排序后的序号奇偶决定擦除方向（偶数向上/左，奇数向下/右）。因此方向只由几何决定，不读随机数、不需要 seed。

### 底网格：整张画布的坐标纸

按 `mesh` 在全局取整数倍位置（相对文本框原点），横竖各铺满画布。静止，不参与擦除，`mesh`、`gridWidth`、`gridOpacity` 任一为 0 就直接跳过：

```ts
export function gridPositions(from, to, pitch) {
  if (!(pitch > 0) || !(to > from)) return [];
  const out = [];
  for (let k = Math.ceil(from / pitch); k * pitch <= to; k++) out.push(k * pitch);
  return out;
}
```

画的时候把所有线收进同一个 `beginPath`，一次 `stroke()`，避免几百次绘制调用。

### 笔画轨迹：已画段的墨迹轮廓

`offsetPath(path, inkEdge(0, ±1))` 把中心线向两侧各偏移半个笔宽，正好落在墨迹边缘；把“左侧正向 + 右侧反向”接成闭合多边形，端点就停在起笔和笔尖处，得到真实墨迹的外轮廓。单点笔画直接画圆。

完整笔画（`progress === 1`）的轮廓按 `StrokePath` 缓存；只有正在画的那一两笔需要每帧重算。轮廓只描边、不填充，所以网格会从笔画内部透出来，正是“空心”。

## 四个阶段

### 1. 先出现线，再落笔

`timing` 里把所有笔画整体后移 0.25 秒：

```ts
const times = overlapTimes(strokes, overlap)
  .map((t) => ({ start: t.start + LEAD, duration: t.duration }));
```

前 0.25 秒所有笔画还是 `pending`，底网格先出现（默认 `frameShow: 'all'` 时投影线也一起出现），于是第一眼看到的是“底稿”，然后才落笔。投影线什么时候出现由 `frameShow` 控制：`'all'` 在 `t=0` 全部显示；`'char'` 让每个字符在自己的开始时刻显示，显示动画就是擦除动画的倒放（同一条线从擦除结束的那端长出来）。

### 2. 逐笔空心

`paint` 每帧对每一笔调用。`state === 'pending'` 直接返回；正在画或已画完的笔画，先按当前 `progress` 算轮廓并描边：

```ts
const hollow = hollowOf(path, progress); // 当前已画段的轮廓
if (traceHollow(ctx, hollow)) ctx.stroke();
```

轮廓从起笔点到当前笔尖，所以会跟着笔尖长出来；端点是平的，正好配平头（butt）字体的填色。

### 3. 字符完成，统一渐入上色

字符 = `entryIndex`。预先按 `entryIndex` 求每笔 `start + duration` 的最大值，得到该字符的完成时刻 `charEnd`；等 `frame.time` 越过它，用 smoothstep 渐入：

```ts
alpha = smoothstep((time - charEnd) / fade);
if (alpha > 0) {
  ctx.globalAlpha *= alpha;
  next(stroke); // 默认画笔把这一笔画实
}
```

同一个字符的所有笔共用同一个 `alpha`，所以是“整字统一上色”。填色直接用默认画笔，不 `clip()` 到轮廓：像英文 `g` 的上碗这种回环笔画，用轮廓做裁剪会把填充裁丢。轮廓端点就在笔尖处，所以平头字体的填色正好落在轮廓里；圆头字体只会多出笔端半个笔宽的圆角。轮廓在填色之后画在顶层，保留下来。

### 4. 投影线的显示与擦除

每条线有自己的方向。擦除时可见段缩向该方向的一端；显示时正好反过来，从同一端长出来（显示和擦除共用 `erase` 的时长）：

```ts
// dir < 0：向低端擦；向高端长（反向）
visibleWipe   = [from, to - (to - from) * erase];
visibleReveal = [from, from + (to - from) * reveal];
```

两种时机各是一个开关，组合出四种模式：

| `frameShow` | `frameHide` | 效果 |
| --- | --- | --- |
| `'all'`（默认） | `'char'`（默认） | 开场全部显示，每个字符写完擦自己的 |
| `'char'` | `'char'` | 每个字符开始时显示、结束时擦 |
| `'all'` | `'all'` | 开场全部显示，整段写完一起擦 |
| `'char'` | `'all'` | 逐字符显示，整段写完一起擦 |

字符内的所有线共用同一个进度，所以是一起动。`frameHide: 'all'` 要等最后一个字符的结束时刻 `lastEnd`，因此先写完的字符会暂时保留自己的投影线，直到整段文字写完才一起擦。

## 笔画与字符重叠

两个独立的比例，含义都是“下一笔/下一个字提前多少开始”：

- `overlap`：同一字符内，下一笔提前 `overlap × 上一笔时长`；
- `charOverlap`：下一个字符提前 `charOverlap × 上一字符绘制时长`；`charOverlap = 0` 时保留字符之间原本的空隙。

```ts
// 字符内
next.start = prev.start + prev.duration * (1 - overlap);
// 字符间：gap 是原本的空隙
start = prevEnd + gap - charOverlap * prevSpan;
```

一个字符内仍然保证不会比原计划更晚开始（已经紧凑的 bundle 不会被强行拉开）。两个比例叠加后，后面所有字符依次提前；最后再给 `fade` / `erase` 留尾巴：

```ts
duration = Math.max(
  duration + (newEnd - oldEnd),        // 原有尾部保留
  newEnd + Math.max(fade, erase),      // 最后一个字的收尾
);
```

所以 `onComplete` 会比不开插件时晚 `max(fade, erase) + LEAD`，这是有意为之。

## 完整参数表

| 参数               | 默认        | 说明                                   |
|------------------|-----------|--------------------------------------|
| `mesh`           | `0.125em` | 底网格间距；`0` 关闭                         |
| `gridColor`      | `#64748b` | 底网格颜色                                |
| `gridWidth`      | `0.005em` | 底网格线宽；`0` 关闭                         |
| `gridOpacity`    | `0.16`    | 底网格不透明度；`0` 关闭                       |
| `frameColor`     | `#38bdf8` | 投影框线颜色                               |
| `frameWidth`     | `0.008em` | 投影框线宽；`0` 关闭                         |
| `frameOpacity`   | `0.25`    | 投影框线不透明度；`0` 关闭                      |
| `frameShow`      | `'all'`   | 显示时机：`'all'` 同时 / `'char'` 逐字符（反向动画） |
| `frameHide`      | `'char'`  | 隐藏时机：`'char'` 逐字符 / `'all'` 同时       |
| `outlineColor`   | `#e2e8f0` | 笔画轨迹颜色                               |
| `outlineWidth`   | `0.012em` | 轨迹线宽；`0` 关闭                          |
| `outlineOpacity` | `0.85`    | 轨迹不透明度；`0` 关闭                        |
| `fade`           | `0.45s`   | 整字填色渐入时长                             |
| `erase`          | `0.45s`   | 投影线显示/擦除动画时长                         |
| `overlap`        | `0`       | 字符内笔画重叠比例（0–0.9）                     |
| `charOverlap`    | `0`       | 字符间重叠比例（0–0.9）                       |

想只看底网格，就把两种线都关掉：

```ts
engineeringPlugin({ frameOpacity: 0, outlineOpacity: 0 });
// 或只关投影线
engineeringPlugin({ frameOpacity: 0 });
```

## 性能上的取舍

- 两种 `underlay` 线任一关闭时，`underlay` 连 `canvasBox` / `gridPositions` / 投影线生成都不做。
- 投影线几何按布局缓存（首笔 `path` + 笔画数作 key）；整字轮廓按 `StrokePath` 缓存。
- 底网格和投影线各自合并成一条 path，一次 `stroke()`。
- 网格线数量封顶 2000 条（底网格部分），防止把 `mesh` 调到极小后卡死（代码里有 `shortcut:` 注释）。

## 已知限制

- **没有 `svg` 钩子**：`toSVG` / CLI 导出的 SVG 只有普通填色笔画，没有网格、空心和擦除。
- **nib 端点不画轮廓**：少数带书法端点的字体，额外印章不参与空心轮廓，但填色会照常画出来。
- **圆头字体的笔端**：轮廓是平头端点，圆头字体的填色会在笔端多出半个笔宽的圆角；Noto Sans SC 这类平头字体没有这个差异。
- **填色用 `ctx.globalAlpha`**：排在本插件之后的 `paint` 钩子会跟着一起渐入；建议把本插件放在 `plugins` 最后。
- **投影线是“全画布”的**：字符多的时候线会很密，先调 `frameOpacity` / `frameWidth`。
- **只支持 canvas**：fallback 字符（字体 bundle 里没有的字符）没有笔画，也就没有这些线。
- `outlineOpacity: 0` 时空心阶段什么都看不到，字要等填色才出现，这是关掉轨迹线的必然结果。

## 演示

下面用 Noto Sans SC 的 Tegaki bundle（1110 个常用字），文字是 `工程制图`。文字和参数都可以在下面的 Playground 里即时改（会自动重播）。

<div class="tegaki-demo-wrapper" ref="observerTarget">
<div class="tegaki-content">
<div style="flex: 1;">
<TegakiRenderer
  v-if="hasStarted"
  :key="renderKey"
  :font="notoSansSc"
  :text="text"
  :time="{ mode: 'uncontrolled', speed: 1.5 }"
  :plugins="plugins"
  :style="{ fontSize: 'clamp(2.5rem, 9vw, 5rem)', width: '100%' }">
</TegakiRenderer>
</div>

<button v-show="hasStarted" class="tegaki-text-btn" @click="replay" title="重播动画">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
<path d="M21 3v5h-5"></path>
</svg>
重播
</button>
</div>
</div>

<div class="tegaki-playground">
  <div class="pg-head">
    <strong>Playground</strong>
    <span class="pg-hint">改任意参数会自动重播</span>
    <button class="tegaki-text-btn pg-reset" @click="resetSettings">重置</button>
  </div>
  <div class="pg-row pg-row-text">
    <label for="pg-text">Text</label>
    <input id="pg-text" v-model="text" type="text" spellcheck="false" autocomplete="off" placeholder="工程制图" />
  </div>
  <div class="pg-text-hint pg-hint">Noto Sans SC bundle 之外的字符会回退成普通字体，没有笔画动画。</div>
  <div v-for="control in controls" :key="control.key" class="pg-row">
    <label :for="`pg-${control.key}`">{{ control.param.label ?? control.key }}</label>
    <select
      v-if="control.param.type === 'select'"
      :id="`pg-${control.key}`"
      v-model="settings[control.key]">
      <option v-for="option in control.param.options" :key="optionValue(option)" :value="optionValue(option)">{{ optionLabel(option) }}</option>
    </select>
    <input
      v-else-if="control.param.type === 'color'"
      :id="`pg-${control.key}`"
      type="color"
      v-model="settings[control.key]" />
    <input
      v-else-if="control.param.type === 'number' || control.param.type === 'length'"
      :id="`pg-${control.key}`"
      type="range"
      :min="control.param.min ?? 0"
      :max="control.param.max ?? 1"
      :step="control.param.step ?? 0.01"
      v-model.number="settings[control.key]" />
    <output class="pg-value">{{ settings[control.key] }}</output>
  </div>
</div>

Playground 的控件不是手写的：参数部分遍历 `engineeringPlugin.params` 和 `.defaults` 生成（`select` 出下拉、`color` 出色板、`number` / `length` 出滑杆），Text 输入框直接改渲染用的 `text`。这也是 `createPlugin` 参数系统的一个用处。改文字或任意参数后防抖 160ms 重播一次，方便对比 `frameShow` / `frameHide` 的四种组合和 `charOverlap`。

## 代码在哪里

插件本体在 `.vitepress/theme/tegaki/engineering.ts`，目前只放在本站，之后可能整理成独立包。纯函数（分组、重排、投影线、底网格、擦除、轮廓）都有导出，配套的自检脚本是 `scripts/check-engineering.ts`，可以直接跑：

```bash
node scripts/check-engineering.ts
```

用 Noto Sans SC 的 bundle 放在 `.vitepress/theme/assets/noto-sans-sc/`，演示页靠 `import notoSansSc from '@/theme/assets/noto-sans-sc/bundle.ts'` 引入。

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import notoSansSc from '@/theme/assets/noto-sans-sc/bundle.ts';
import { engineeringPlugin } from '@/theme/tegaki/engineering';

const observerTarget = ref(null);
const hasStarted = ref(false);
const renderKey = ref(0);
let timeoutId = null;
let observer = null;

const controls = Object.entries(engineeringPlugin.params).map(([key, param]) => ({ key, param }));
const DEMO_TEXT = '工程制图';
const text = ref(DEMO_TEXT);
const settings = reactive({ ...engineeringPlugin.defaults, overlap: 0.35 });
const plugins = computed(() => [engineeringPlugin({ ...settings })]);

const optionValue = (option) => (typeof option === 'string' ? option : option.value);
const optionLabel = (option) => (typeof option === 'string' ? option : option.label);

const replay = async () => {
  if (timeoutId) clearTimeout(timeoutId);
  hasStarted.value = false;
  await nextTick();
  renderKey.value += 1;
  hasStarted.value = true;
};

let replayTimer = null;
const scheduleReplay = () => {
  if (!hasStarted.value) return;
  if (replayTimer) clearTimeout(replayTimer);
  replayTimer = setTimeout(() => {
    replayTimer = null;
    void replay();
  }, 160);
};

watch(settings, scheduleReplay, { deep: true });
watch(text, scheduleReplay);

const resetSettings = () => {
  text.value = DEMO_TEXT;
  Object.assign(settings, engineeringPlugin.defaults);
};

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
});

onBeforeUnmount(() => {
  if (timeoutId) clearTimeout(timeoutId);
  if (replayTimer) clearTimeout(replayTimer);
  if (observer) observer.disconnect();
});
</script>

<style>
.tegaki-demo-wrapper {
  min-height: 60px;
  display: flex;
  align-items: center;
  margin: 3rem 0;
  /* 和 hero 一样：canvas 绝对定位，1.8 倍行高才是它真正占的高度 */
  line-height: 1.8;
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

.tegaki-playground {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 8px 20px;
  margin: 1rem 0 2rem;
  padding: 12px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.pg-head {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pg-hint {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.pg-reset {
  margin-left: auto;
}

.pg-row-text {
  grid-column: 1 / -1;
}

.pg-row-text input[type='text'] {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.pg-text-hint {
  grid-column: 1 / -1;
  margin-top: -4px;
}

.pg-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pg-row label {
  flex: 0 0 104px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.pg-row input[type='range'] {
  flex: 1;
  min-width: 0;
}

.pg-row select {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  padding: 2px 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.pg-row input[type='color'] {
  flex: 1;
  min-width: 0;
  height: 22px;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
}

.pg-value {
  flex: 0 0 44px;
  text-align: right;
  font-size: 12px;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}
</style>
