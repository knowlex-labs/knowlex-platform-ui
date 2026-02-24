import { marked, type Renderer } from 'marked'
import type { DraftSection } from '@/types'

/**
 * Custom marked renderer that produces inline-styled HTML matching
 * the existing legal document formatting. Inline styles are necessary
 * because the output is injected into a contentEditable div where
 * external CSS classes don't reliably apply.
 */
function createLegalRenderer(): Partial<Renderer> {
  return {
    heading({ text, depth }) {
      if (depth === 1) {
        return `<p style="text-align:center;font-weight:700;font-size:16px;text-transform:uppercase;margin:16px 0 8px;">${text}</p>\n`
      }
      if (depth === 2) {
        return `<p style="text-align:center;font-weight:700;font-size:15px;margin:16px 0 8px;">${text}</p>\n`
      }
      if (depth === 3) {
        return `<p style="font-weight:700;font-size:14px;margin:12px 0 6px;">${text}</p>\n`
      }
      return `<p style="font-weight:700;font-size:13px;margin:10px 0 4px;">${text}</p>\n`
    },

    paragraph({ text }) {
      return `<p style="font-size:12px;margin:8px 0;line-height:1.6;text-align:justify;">${text}</p>\n`
    },

    strong({ text }) {
      return `<strong style="font-weight:600;">${text}</strong>`
    },

    em({ text }) {
      return `<em>${text}</em>`
    },

    hr() {
      return `<hr style="border:none;border-top:1px solid #ccc;margin:20px 0;" />\n`
    },

    list({ items, ordered }) {
      const inner = items.map((item) => item.raw).join('')
      if (ordered) {
        return `<ol style="margin:8px 0;padding-left:24px;font-size:12px;line-height:1.6;">${inner}</ol>\n`
      }
      return `<ul style="margin:8px 0;padding-left:24px;font-size:12px;line-height:1.6;">${inner}</ul>\n`
    },

    listitem({ text }) {
      return `<li style="margin-bottom:4px;text-align:justify;">${text}</li>\n`
    },

    table({ header, rows }) {
      const headerHtml = header
        .map(
          (cell) =>
            `<th style="border:1px solid #333;padding:8px 12px;text-align:left;vertical-align:top;background-color:#f5f5f5;font-weight:600;font-size:12px;">${cell.text}</th>`
        )
        .join('')

      const rowsHtml = rows
        .map((row, rowIdx) => {
          const bgStyle = rowIdx % 2 === 1 ? 'background-color:#fafafa;' : ''
          const cells = row
            .map(
              (cell) =>
                `<td style="border:1px solid #333;padding:8px 12px;text-align:left;vertical-align:top;font-size:12px;${bgStyle}">${cell.text}</td>`
            )
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('\n')

      return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
<thead><tr>${headerHtml}</tr></thead>
<tbody>${rowsHtml}</tbody>
</table>\n`
    },

    blockquote({ text }) {
      return `<blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;color:#555;font-style:italic;">${text}</blockquote>\n`
    },

    code({ text, lang }) {
      if (lang) {
        return `<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:11px;margin:12px 0;"><code>${text}</code></pre>\n`
      }
      return `<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:11px;margin:12px 0;"><code>${text}</code></pre>\n`
    },

    codespan({ text }) {
      return `<code style="background:#f5f5f5;padding:2px 4px;border-radius:2px;font-size:11px;">${text}</code>`
    },
  }
}

// Configure marked once with GFM support and our custom renderer
const legalRenderer = createLegalRenderer()

marked.use({
  renderer: legalRenderer,
  gfm: true,
  breaks: false,
})

/**
 * Converts a markdown string to inline-styled HTML suitable for
 * injection into a contentEditable div.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) return ''
  return marked.parse(markdown, { async: false }) as string
}

/**
 * Renders an array of DraftSections (with markdown content) into
 * a single HTML string with section separators.
 */
export function markdownSectionsToHtml(sections: DraftSection[]): string {
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return sorted
    .map((section) => {
      const body = markdownToHtml(section.content)
      return `<div style="margin-bottom:16px;">${body}</div>`
    })
    .join('<div style="height:12px;"></div>')
}
