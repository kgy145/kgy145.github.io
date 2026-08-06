import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/**
 * 去除 Markdown 格式，保留纯文本
 */
function stripMarkdown(md: any) {
    let text = md
    text = text.replace(/```[\s\S]*?```/g, '')
    text = text.replace(/`[^`]*`/g, '')
    text = text.replace(/!\[.*?]\(.*?\)/g, '')
    text = text.replace(/\[(.*?)]\(.*?\)/g, '$1')
    text = text.replace(/^#{1,6}\s+/gm, '')
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
    text = text.replace(/([*_])(.*?)\1/g, '$2')
    text = text.replace(/^\s*[-*_]{3,}\s*$/gm, '')
    text = text.replace(/^\s*[-+*]\s+/gm, '')
    text = text.replace(/^\s*\d+\.\s+/gm, '')
    text = text.replace(/\n{2,}/g, '\n')
    return text.trim()
}

export default {
    // 监听 blogs 目录下所有 .md 文件的变化
    watch: ['blogs/*.md'],

    load(watchedFiles: any[]) {
        // 获取 VitePress 配置中的源目录，用于构造 URL
        // @ts-ignore
        const config = globalThis.VITEPRESS_CONFIG
        const srcDir = config?.srcDir || process.cwd()

        return watchedFiles
            .map((file) => {
                const content = fs.readFileSync(file, 'utf-8')
                const { data, content: markdownContent } = matter(content)

                // 标题：优先使用 frontmatter 中的 title，否则用文件名
                const title = data.title || path.basename(file, '.md')

                // 最后编辑时间：优先使用 frontmatter 中的 lastUpdated，否则取文件修改时间
                let lastUpdated = data.lastUpdated
                    ? new Date(data.lastUpdated).getTime()
                    : fs.statSync(file).mtimeMs

                // 如果 lastUpdated 是日期字符串，转为时间戳
                if (typeof lastUpdated === 'string') {
                    lastUpdated = new Date(lastUpdated).getTime()
                }

                // 读取 badges（应为数组）
                const badges = Array.isArray(data.badge) ? data.badge : []

                // 去除 markdown 格式后的纯文本
                const cleanedText = stripMarkdown(markdownContent)

                // 构造 URL（不含 base）
                const relativePath = path.relative(srcDir, file)
                const url = '/' + relativePath.replace(/\.md$/, '.html')

                return {
                    url,
                    title,
                    contentText: cleanedText,
                    lastUpdated,
                    badges,
                }
            })
            .sort((a: { lastUpdated: number }, b: { lastUpdated: number }) => b.lastUpdated - a.lastUpdated) // 按时间降序（最新在前）
    },
}