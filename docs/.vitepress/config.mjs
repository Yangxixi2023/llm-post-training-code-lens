import { defineConfig } from 'vitepress'

const repository = 'Yangxixi2023/llm-post-training-code-lens'
const base = process.env.GITHUB_ACTIONS === 'true' ? '/llm-post-training-code-lens/' : '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'LLM Post-Training Code Lens',
  description: '大模型后训练与注意力机制的手撕代码结构背诵地图',
  base,
  cleanUrls: true,
  head: [
    ['meta', { name: 'theme-color', content: '#233e70' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }]
  ],
  themeConfig: {
    siteTitle: 'Code Lens',
    nav: [
      { text: '代码地图', link: '/' },
      { text: '教材仓库', link: 'https://github.com/walkinglabs/hands-on-modern-rl' },
      { text: 'GitHub', link: 'https://github.com/' + repository }
    ],
    outline: { level: [2, 3], label: '页面目录' },
    footer: {
      message: '面向后训练面试与代码复现的结构化速查',
      copyright: 'MIT License'
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/' + repository }]
  }
})

