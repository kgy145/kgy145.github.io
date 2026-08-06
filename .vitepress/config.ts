import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kaguya145的博客小站",
  description: "记录一些创作随笔！",
  lang: "zh-cn",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '博客主页', link: '/' },
      { text: '全部随笔', link: '/articles' },
      { text: '致谢', link: '/acknowledge' },
      { text: '组件测试', link: '/blogs/WidgetTest' },
      { text: '下载站（待建）', link: 'https://pan.kgy145.top/' }
    ],

    sidebar: undefined,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kgy145' },
      { icon: 'bilibili', link: 'https://space.bilibili.com/' },
    ],

    footer: {
      message: '',
      copyright: 'Copyright © 2026 Kaguya145',
    },

    search: {
      provider: 'local'
    },

    notFound: {
      title: '啊嘞？这里什么都没有...',
      quote: '你似乎来到了一个荒无人烟的地方...要不，再检查一下你输入的url是否正确？',
      linkText: '返回主页'
    }
  },

  markdown: {
    container: {
      tipLabel: '提示',
      warningLabel: '警告',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '详细信息'
    }
  },

  lastUpdated: true
})
