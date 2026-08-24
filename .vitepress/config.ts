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
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除搜索',
            backButtonTitle: '返回',
            noResultsText: '未找到相关结果',
            footer: {
              selectText: '选择',
              navigateText: '导航',
              closeText: '关闭'
            }
          }
        }
      }
    },

    notFound: {
      title: '啊嘞？这里什么都没有...',
      quote: '你似乎来到了一个荒无人烟的地方...要不，再检查一下你输入的url是否正确？',
      linkText: '返回主页'
    },

    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    langMenuLabel: '切换语言',
    skipToContentLabel: '跳转到内容',

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    outline: {
      label: '本页目录'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' }
    },

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

  lastUpdated: true,

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: tag => tag === 'nmp-player'
      }
    }
  }
})
