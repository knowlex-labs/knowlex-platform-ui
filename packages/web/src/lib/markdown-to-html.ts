import { marked } from 'marked'
import type { DraftSection } from '@knowlex/core/types'

marked.use({ gfm: true, breaks: false })

export function markdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) return ''
  return marked.parse(markdown, { async: false }) as string
}

export function markdownSectionsToHtml(sections: DraftSection[]): string {
  const sorted = [...sections].sort((a, b) => a.order - b.order)
  return sorted
    .map((s) => `<div style="margin-bottom:16px;">${markdownToHtml(s.content)}</div>`)
    .join('<div style="height:12px;"></div>')
}
