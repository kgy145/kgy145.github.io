---
layout: doc
title: 自定义组件测试
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
<GHReadme owner="kgy145" repo="kgy145" customTitle="README.md" />
```
**输出：**
<GHReadme owner="kgy145" repo="kgy145" customTitle="README.md" />

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
- 点击右面链接获取字体：<GHRepo owner="lxgw" repo="LxgwWenkai" displayType="link" />
- 看板娘的LICENSE是<GHRepo owner="stevenjoezhang" repo="live2d-widget" displayType="license" />
```
- <GHRepo owner="kgy145" repo="kgy145.github.io" />
- <GHRepo owner="vuejs" repo="vitepress" customTitle="VitePress 📝💨" />
- 点击右面链接获取字体：<GHRepo owner="lxgw" repo="LxgwWenkai" displayType="link" />
- 右下角看板娘的LICENSE是<GHRepo owner="stevenjoezhang" repo="live2d-widget" displayType="license" />
