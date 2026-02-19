import html2pdf from 'html2pdf.js'
import type { DraftSection } from '@/types'
import {
  documentToHtml,
  deserializeDocument,
  isRichDocumentString,
} from './drafts/document-serializer'

// Re-export template-based rendering system
export { templateRenderers } from './drafts/templates'
export type { DraftTemplateType } from './drafts/templates'

import { getTemplateRenderer } from './drafts/templates'
export { getTemplateRenderer }

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
 *   Lines with leading spaces → preserved as pre-formatted
 *   everything else      → justified paragraph
 */
export function renderDraftContent(content: string): string {
  const lines = content.split('\n')
  const htmlLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line → paragraph break
    if (!trimmed) {
      htmlLines.push('<div style="height:8px;"></div>')
      continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      htmlLines.push('<hr style="border:none;border-top:1px solid #d1d5db;margin:18px 0;" />')
      continue
    }

    // Check if line has significant leading whitespace (for party details, addresses, etc.)
    const leadingSpaces = line.match(/^(\s+)/)?.[1].length || 0
    const hasIndent = leadingSpaces >= 4

    // Court name / centered heading (often in ALL CAPS at top)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes(':') && i < 10) {
      htmlLines.push(`<p style="text-align:center;font-weight:700;font-size:13px;margin:4px 0;">${escapeHtml(trimmed)}</p>`)
      continue
    }

    // "Vs." or "V/s" separator - center it
    if (/^v[\/.]?s\.?$/i.test(trimmed)) {
      htmlLines.push(`<p style="text-align:center;font-size:12px;margin:12px 0;">${escapeHtml(trimmed)}</p>`)
      continue
    }

    // Lines ending with "…Plaintiff" or "…Defendant" - right-align and preserve
    if (/\.\.\.\.*\s*(Plaintiff|Defendant)$/i.test(trimmed)) {
      htmlLines.push(`<p style="font-size:12px;margin:4px 0;text-align:right;padding-right:20px;">${escapeHtml(trimmed)}</p>`)
      continue
    }

    // Entire block is a single **…** line → heading or bold line
    if (/^\*\*[^*\n]+\*\*$/.test(trimmed)) {
      const inner = trimmed.slice(2, -2)
      const escaped = escapeHtml(inner)
      if (inner === inner.toUpperCase() || inner.endsWith(':')) {
        htmlLines.push(`<p style="text-align:center;font-weight:700;font-size:13px;margin:18px 0 10px;">${escaped}</p>`)
      } else {
        htmlLines.push(`<p style="font-weight:700;font-size:12px;margin-bottom:10px;">${escaped}</p>`)
      }
      continue
    }

    // Numbered clause "1. …"
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      htmlLines.push(`<p style="font-size:12px;margin-bottom:8px;text-align:justify;padding-left:24px;text-indent:-24px;"><strong>${numMatch[1]}.</strong> ${renderInline(numMatch[2])}</p>`)
      continue
    }

    // Key-value "**Label:** value"
    const kvMatch = trimmed.match(/^\*\*(.+?)\*\*\s*(.*)/)
    if (kvMatch) {
      htmlLines.push(`<p style="font-size:12px;margin-bottom:4px;"><strong>${escapeHtml(kvMatch[1])}</strong> ${renderInline(kvMatch[2])}</p>`)
      continue
    }

    // Preserve indentation for pre-formatted lines (like party addresses)
    if (hasIndent) {
      const paddingLeft = Math.min(leadingSpaces * 6, 120) // max 120px indent
      htmlLines.push(`<p style="font-size:12px;margin:2px 0;padding-left:${paddingLeft}px;white-space:pre-wrap;">${escapeHtml(trimmed)}</p>`)
      continue
    }

    // Plain line
    htmlLines.push(`<p style="font-size:12px;margin-bottom:4px;text-align:justify;">${renderInline(trimmed)}</p>`)
  }

  return htmlLines.join('\n')
}

/**
 * Renders structured sections into styled HTML for on-screen display.
 * Sorts by `order` and renders each section's content.
 * Section headings are typically already included in the content from the backend,
 * so we don't add extra headings here to avoid duplication.
 */
export function renderDraftSections(sections: DraftSection[]): string {
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return sorted
    .map((section) => {
      const body = renderDraftContent(section.content)
      // Add subtle separator between sections, but no extra heading
      return `<div style="margin-bottom:16px;">${body}</div>`
    })
    .join('<div style="height:12px;"></div>')
}

/**
 * Builds a full HTML document for DOC/PDF download with section-aware structure.
 */
export function buildExportHtml(title: string, content: string, sections?: DraftSection[]): string {
  let bodyHtml: string
  if (sections && sections.length > 0) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    bodyHtml = sorted
      .map((s) => `<h2>${escapeHtml(s.title)}</h2>\n${s.content.split('\n').map((p) => `<p>${renderInline(p)}</p>`).join('\n')}`)
      .join('\n')
  } else {
    bodyHtml = content.split('\n').map((p) => `<p>${renderInline(p)}</p>`).join('\n')
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
        color: #000;
        background: #fff;
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

// ============================================================================
// Shared Utilities (used by DraftPreview and DraftPreviewTab)
// ============================================================================

/**
 * Render draft content to HTML, handling all content formats:
 * 1. Structured sections → renderDraftSections
 * 2. Serialized RichDocument JSON → documentToHtml
 * 3. Plain text with templateType → template-specific renderer
 * 4. Plain text fallback → renderDraftContent
 */
export function renderDraftToHtml(
  content: string,
  sections?: DraftSection[],
  templateType?: string
): string {
  if (sections && sections.length > 0) {
    return renderDraftSections(sections)
  }

  // Content saved as HTML from the editor — return directly
  if (content.trim().startsWith('<')) {
    return content
  }

  if (isRichDocumentString(content)) {
    const richDoc = deserializeDocument(content)
    if (richDoc) {
      return documentToHtml(richDoc)
    }
  }

  if (templateType) {
    return getTemplateRenderer(templateType)(content)
  }

  return renderDraftContent(content)
}

/**
 * Trigger a file download in the browser.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9]/gi, '_')
}

/**
 * Download draft as a plain text file.
 */
export function downloadAsTxt(title: string, content: string, sections?: DraftSection[]): void {
  const text = buildExportText(content, sections)
  triggerDownload(new Blob([text], { type: 'text/plain' }), `${sanitizeFilename(title)}.txt`)
}

/**
 * Download draft as a DOC file (HTML wrapped as application/msword).
 */
export function downloadAsDoc(title: string, content: string, sections?: DraftSection[]): void {
  const html = buildExportHtml(title, content, sections)
  triggerDownload(new Blob([html], { type: 'application/msword' }), `${sanitizeFilename(title)}.doc`)
}

/**
 * Download draft as a real PDF file using html2pdf.js.
 */
export function downloadAsPdf(title: string, content: string, sections?: DraftSection[]): void {
  const html = buildExportHtml(title, content, sections)

  // Create a temporary container to render the HTML for pdf generation
  const container = document.createElement('div')
  container.innerHTML = html
  // Apply body styles directly since html2pdf renders the element, not a full document
  container.style.fontFamily = "'Times New Roman', Times, serif"
  container.style.fontSize = '12pt'
  container.style.lineHeight = '1.5'
  container.style.color = '#000'
  container.style.background = '#fff'
  container.style.padding = '0'

  html2pdf()
    .set({
      margin: [0.75, 1, 0.75, 1],
      filename: `${sanitizeFilename(title)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    })
    .from(container)
    .save()
}
