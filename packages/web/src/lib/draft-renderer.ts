import type { DraftSection } from '@knowlex/core/types'
import {
  documentToHtml,
  deserializeDocument,
  isRichDocumentString,
} from './drafts/document-serializer'
import { markdownToHtml, markdownSectionsToHtml } from './markdown-to-html'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Render draft content to HTML.
 *
 * All backend-generated content is markdown, so we always run it through
 * the markdown library rather than branching on contentFormat/templateType.
 *
 * Priority:
 * 1. Already-HTML (user-edited in the contentEditable editor) → use directly
 * 2. Serialized RichDocument JSON (legacy) → documentToHtml
 * 3. Everything else → markdownToHtml / markdownSectionsToHtml
 */
export function renderDraftToHtml(
  content: string,
  sections?: DraftSection[],
  _templateType?: string,
  _contentFormat?: 'markdown' | 'html' | 'plain'
): string {
  // Content is already HTML (saved from the editor after user edits)
  if (content.trim().startsWith('<')) {
    return content
  }

  // RichDocument JSON — backward compat for very old drafts
  if (isRichDocumentString(content)) {
    const richDoc = deserializeDocument(content)
    if (richDoc) {
      return documentToHtml(richDoc)
    }
  }

  // All other content is markdown
  if (sections && sections.length > 0) {
    return markdownSectionsToHtml(sections)
  }
  return markdownToHtml(content)
}

/**
 * Builds a full HTML document for DOC/PDF export.
 * If the content is already HTML (from the editor), use it directly.
 * Otherwise render as markdown.
 */
/**
 * Builds the CSS rules for export.
 * When `scope` is provided (a CSS ID selector like `#kx-pdf-render`), all rules are
 * scoped to that element so styles don't bleed into the host page when the container
 * is temporarily appended to document.body for html2pdf rendering.
 * When scope is omitted the rules use bare selectors suitable for a full HTML document.
 */
function buildExportCss(scope?: string): string {
  const root = scope ?? 'body'
  const s = scope ? `${scope} ` : ''
  return `
      ${root} {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.8;
        margin: 0;
        padding: 0;
        color: #1a1a1a;
        background: #fff;
      }
      ${s}h1 {
        font-size: 16pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
        margin-top: 12pt;
        margin-bottom: 20pt;
        padding-bottom: 8pt;
        border-bottom: 2px solid #333;
      }
      ${s}h2 {
        font-size: 13pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.3pt;
        margin-top: 22pt;
        margin-bottom: 10pt;
        padding-bottom: 4pt;
        border-bottom: 1px solid #999;
        color: #222;
      }
      ${s}h3 {
        font-size: 12pt;
        font-weight: bold;
        margin-top: 14pt;
        margin-bottom: 8pt;
        color: #333;
      }
      ${s}p {
        margin-top: 0;
        margin-bottom: 10pt;
        text-align: justify;
      }
      ${s}strong {
        font-weight: bold;
      }
      ${s}table {
        width: 100%;
        border-collapse: collapse;
        margin: 14pt 0;
        font-size: 11pt;
      }
      ${s}th, ${s}td {
        border: 1px solid #555;
        padding: 6pt 10pt;
        text-align: left;
        vertical-align: top;
      }
      ${s}th {
        background-color: #f0f0f0;
        font-weight: bold;
        font-size: 11pt;
      }
      ${s}tr:nth-child(even) {
        background-color: #fafafa;
      }
      ${s}blockquote {
        border-left: 3pt solid #888;
        padding-left: 14pt;
        margin: 14pt 0 14pt 12pt;
        color: #444;
        font-style: italic;
      }
      ${s}ul, ${s}ol {
        margin: 6pt 0 10pt 0;
        padding-left: 28pt;
        line-height: 1.8;
      }
      ${s}li {
        margin-bottom: 5pt;
        text-align: justify;
      }
      ${s}li > ul, ${s}li > ol {
        margin-top: 4pt;
        margin-bottom: 2pt;
      }
      ${s}hr {
        border: none;
        border-top: 1px solid #ccc;
        margin: 18pt 0;
      }`
}

export function buildExportBodyHtml(content: string, sections?: DraftSection[]): string {
  if (content.trim().startsWith('<')) {
    return content
  }
  if (sections && sections.length > 0) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    return sorted
      .map((s) => `<h2>${escapeHtml(s.title)}</h2>\n${markdownToHtml(s.content)}`)
      .join('\n')
  }
  return markdownToHtml(content)
}

function buildExportHtml(title: string, content: string, sections?: DraftSection[]): string {
  const bodyHtml = buildExportBodyHtml(content, sections)

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        size: A4;
        margin: 1in 1.1in 0.75in 1.1in;
        @top-left    { content: ''; }
        @top-center  { content: ''; }
        @top-right   { content: ''; }
        @bottom-left { content: ''; }
        @bottom-right { content: ''; }
        @bottom-center {
          content: counter(page);
          font-size: 10pt;
          font-family: 'Times New Roman', Times, serif;
          color: #444;
          padding-bottom: 0.2in;
        }
      }
      ${buildExportCss()}
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`
}

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

export function downloadAsTxt(title: string, content: string, sections?: DraftSection[]): void {
  let text = content
  if (sections && sections.length > 0) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    text = sorted.map((s) => `=== ${s.title.toUpperCase()} ===\n\n${s.content}`).join('\n\n')
  }
  triggerDownload(new Blob([text], { type: 'text/plain' }), `${sanitizeFilename(title)}.txt`)
}

export function printDraft(title: string, content: string, sections?: DraftSection[], _contentFormat?: string): void {
  const sects = sections?.length ? sections : undefined
  const html = buildExportHtml(title, content, sects)

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }

  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => {
    iframe.contentWindow?.print()
    setTimeout(() => { document.body.removeChild(iframe) }, 1000)
  }
}
