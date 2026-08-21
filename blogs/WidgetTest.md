---
layout: doc
title: 自定义组件测试
badge: ["软件相关"]
---

# 自定义组件测试

## GHReadme.vue

在页面中插入指定GitHub仓库的README.md并渲染。

### 参数列表
- `owner`**（必需）**：指定GitHub仓库的所有者（用户名或组织名）
- `repo`**（必需）**：指定GitHub仓库的名称
- `customTitle`**（可选）**：指定右上角显示的自定义标题，若未指定，则为：`${owner}/${repo}/blob/${branch}/README.md`

**输入：**
```vue
<GHReadme owner="kgy145" repo="kgy145" custom-title="README.md" />
```
**输出：**
<GHReadme owner="kgy145" repo="kgy145" custom-title="README.md" />

## GHRepo.vue

在页面中插入指定GitHub仓库链接和对应的LICENSE badge。

### 参数列表
- `owner`**（必需）**：指定GitHub仓库的所有者（用户名或组织名）
- `repo`**（必需）**：指定GitHub仓库的名称
- `customTitle`**（可选）**：指定仓库链接的自定义文字，若未指定，则为：`${owner}/${repo}`
- `displayType`**（可选）**：展示方式，可选值有`full`（链接和badge全部显示）、`link`（仅显示链接）、`license`（仅显示badge），默认值为`full`

**输入：**
```vue
- <GHRepo owner="kgy145" repo="kgy145.github.io" />
- <GHRepo owner="vuejs" repo="vitepress" customTitle="VitePress 📝💨" />
- 点击右面链接获取字体：<GHRepo owner="lxgw" repo="LxgwWenkai" display-type="link" />
- 看板娘的LICENSE是<GHRepo owner="stevenjoezhang" repo="live2d-widget" display-type="license" />
```
- <GHRepo owner="kgy145" repo="kgy145.github.io" />
- <GHRepo owner="vuejs" repo="vitepress" customTitle="VitePress 📝💨" />
- 点击链接获取字体：<GHRepo owner="lxgw" repo="LxgwWenkai" display-type="link" />
- 左下角看板娘的LICENSE是<GHRepo owner="stevenjoezhang" repo="live2d-widget" display-type="license" />

## BlogList.vue

在页面中插入博客列表，显示最近的文章。

### 参数列表

- `limit` **（可选）**：显示文章数量，默认 `5`
- `excerptLength` **（可选）**：摘要截取长度，默认 `150`
- `badgeMap` **（可选）**：自定义标签颜色映射对象，键为标签名，值为 `{ bg, color }`
- `card` **（可选）**：是否以卡片样式展示，默认 `true`

**输入：**
```vue
<BlogList :limit="3" :card="true" />
```

**输出：**
<BlogList :limit="3" :card="true" />

## MusicCard.vue

显示包含歌曲元数据，简介及网易云链接的卡片。

### 参数列表

- `title` **（必填）**：歌曲标题，类型 `String`
- `transliteration` **（可选）**：译名或副标题，类型 `String`，默认 `''`
- `singer` **（可选）**：演唱者，类型 `String`，默认 `''`
- `lyricist` **（可选）**：作词者，类型 `String`，默认 `''`
- `composer` **（可选）**：作曲者，类型 `String`，默认 `''`
- `arranger` **（可选）**：编曲者，类型 `String`，默认 `''`
- `description` **（可选）**：简介文本（纯文本），类型 `String`，默认 `''`。**若使用了默认插槽，则插槽内容完全覆盖此属性。**
- `neteaseId` **（可选）**：网易云歌曲 ID（数字或字符串），提供后将显示播放器，默认 `null`

**输入：**
```vue
<MusicCard 
    title="アスノヨゾラ哨戒班"
    transliteration="明日的夜空哨戒班"
    singer="IA"
    lyricist="Orangestar"
    composer="Orangestar"
    arranger="Orangestar"
    netease-id="1946819289">
  《明日的夜空哨戒班》（日语：アスノヨゾラ哨戒班）是Orangestar于2014年08月19日投稿的VOCALOID原创曲，是第一首由IA演唱的神话曲，同时也是第二首没有初音未来参与演唱的神话曲。
  
  _部分数据摘录自<a href="https://mzh.moegirl.org.cn/%E6%98%8E%E6%97%A5%E7%9A%84%E5%A4%9C%E7%A9%BA%E5%93%A8%E6%88%92%E7%8F%AD">萌娘百科</a>_
  
  _因为原唱是vip歌曲，所以这里放了烤版翻唱QWQ，想听原版点[这里](https://music.163.com/#/song?id=30870173)_
</MusicCard>
```

**输出：**
<MusicCard
    title="アスノヨゾラ哨戒班"
    transliteration="明日的夜空哨戒班"
    singer="IA"
    lyricist="Orangestar"
    composer="Orangestar"
    arranger="Orangestar"
    netease-id="1946819289">
《明日的夜空哨戒班》（日语：アスノヨゾラ哨戒班）是Orangestar于2014年08月19日投稿的VOCALOID原创曲，是第一首由IA演唱的神话曲，同时也是第二首没有初音未来参与演唱的神话曲。

_部分数据摘录自<a href="https://mzh.moegirl.org.cn/%E6%98%8E%E6%97%A5%E7%9A%84%E5%A4%9C%E7%A9%BA%E5%93%A8%E6%88%92%E7%8F%AD">萌娘百科</a>_

_因为原唱是vip歌曲，所以这里放了烤版翻唱QWQ，想听原版点[这里](https://music.163.com/#/song?id=30870173)_
</MusicCard>
