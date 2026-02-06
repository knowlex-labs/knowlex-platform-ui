import type { DraftSection } from '@/types'

// Escapes HTML entities before injecting into dangerouslySetInnerHTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Converts **bold** markers to <strong> on already-escaped text
function renderInline(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/**
 * Converts a plain-text legal draft (with **bold** markdown conventions)
 * into styled HTML. Intended for use with dangerouslySetInnerHTML.
 *
 * Patterns recognised:
 *   **HEADING**          → centred bold heading (when ALL CAPS or ends with :)
 *   **Label:** value     → key/value row
 *   1. clause text       → indented numbered clause
 *   ---                  → horizontal rule
 *   everything else      → justified paragraph
 */
export function renderDraftContent(content: string): string {
  const blocks = content.split(/\n\n/)

  return blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(trimmed)) {
        return '<hr style="border:none;border-top:1px solid #d1d5db;margin:18px 0;" />'
      }

      // Entire block is a single **…** line → heading or bold line
      if (/^\*\*[^*\n]+\*\*$/.test(trimmed)) {
        const inner = trimmed.slice(2, -2)
        const escaped = escapeHtml(inner)
        if (inner === inner.toUpperCase() || inner.endsWith(':')) {
          return `<p style="text-align:center;font-weight:700;font-size:13px;margin:18px 0 10px;">${escaped}</p>`
        }
        return `<p style="font-weight:700;font-size:12px;margin-bottom:10px;">${escaped}</p>`
      }

      // Multi-line block → each line individually
      return trimmed
        .split('\n')
        .map((line) => {
          const t = line.trim()
          if (!t) return ''

          // Numbered clause  "1. …"
          const numMatch = t.match(/^(\d+)\.\s+(.+)/)
          if (numMatch) {
            return `<p style="font-size:12px;margin-bottom:8px;text-align:justify;padding-left:18px;"><strong>${numMatch[1]}.</strong> ${renderInline(numMatch[2])}</p>`
          }

          // Key-value  "**Label:** value"
          const kvMatch = t.match(/^\*\*(.+?)\*\*\s*(.*)/)
          if (kvMatch) {
            return `<p style="font-size:12px;margin-bottom:4px;"><strong>${escapeHtml(kvMatch[1])}</strong> ${renderInline(kvMatch[2])}</p>`
          }

          // Plain line
          return `<p style="font-size:12px;margin-bottom:8px;text-align:justify;">${renderInline(t)}</p>`
        })
        .join('')
    })
    .join('\n')
}

/**
 * Renders structured sections into styled HTML for on-screen display.
 * Sorts by `order`, renders each section with an uppercase heading + bottom border,
 * reuses `renderDraftContent()` for each section's content.
 */
export function renderDraftSections(sections: DraftSection[]): string {
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return sorted
    .map((section) => {
      const heading = `<div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:6px;margin-bottom:12px;border-bottom:1px solid #d1d5db;">${escapeHtml(section.title)}</div>`
      const body = renderDraftContent(section.content)
      return `<div style="margin-bottom:24px;">${heading}${body}</div>`
    })
    .join('')
}

/**
 * Builds a full HTML document for DOC/PDF download with section-aware structure.
 */
export function buildExportHtml(title: string, content: string, sections?: DraftSection[]): string {
  let bodyHtml: string
  if (sections && sections.length > 0) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    bodyHtml = sorted
      .map((s) => `<h2>${escapeHtml(s.title)}</h2>\n${s.content.split('\n').map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}`)
      .join('\n')
  } else {
    bodyHtml = content.split('\n').map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        margin: 1in;
      }
      h1 {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 24pt;
      }
      h2 {
        font-size: 13pt;
        font-weight: bold;
        margin-top: 18pt;
        margin-bottom: 12pt;
        text-transform: uppercase;
        border-bottom: 1px solid #ccc;
        padding-bottom: 4pt;
      }
      p {
        margin-bottom: 12pt;
        text-align: justify;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${bodyHtml}
  </body>
</html>`
}

/**
 * Builds plain-text output for TXT download with section-aware structure.
 */
export function buildExportText(content: string, sections?: DraftSection[]): string {
  if (sections && sections.length > 0) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    return sorted
      .map((s) => `=== ${s.title.toUpperCase()} ===\n\n${s.content}`)
      .join('\n\n')
  }
  return content
}
