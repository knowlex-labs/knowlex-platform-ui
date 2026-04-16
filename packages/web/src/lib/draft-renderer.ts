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
function buildExportHtml(title: string, content: string, sections?: DraftSection[]): string {
  let bodyHtml: string
  if (content.trim().startsWith('<')) {
    bodyHtml = content
  } else if (sections && sections.length > 0) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    bodyHtml = sorted
      .map((s) => `<h2>${escapeHtml(s.title)}</h2>\n${markdownToHtml(s.content)}`)
      .join('\n')
  } else {
    bodyHtml = markdownToHtml(content)
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        size: A4;
        /*
         * Real page margins — the content area is inset by these values.
         * Defining every margin box with content: '' suppresses Chrome's
         * own URL / date / title chrome that normally appears in these slots.
         * Only @bottom-center is given real content: the page number.
         */
        margin: 1in 1.1in 0.75in 1.1in;

        @top-left    { content: ''; }
        @top-center  { content: ''; }
        @top-right   { content: ''; }
        @bottom-left { content: ''; }
        @bottom-right { content: ''; }

        /* Page number — bottom center, 0.2 in above the page edge */
        @bottom-center {
          content: counter(page);
          font-size: 10pt;
          font-family: 'Times New Roman', Times, serif;
          color: #444;
          padding-bottom: 0.2in;
        }
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.6;
        margin: 0;
        padding: 0;
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
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 12pt 0;
        font-size: 11pt;
      }
      th, td {
        border: 1px solid #333;
        padding: 6pt 8pt;
        text-align: left;
        vertical-align: top;
      }
      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      tr:nth-child(even) {
        background-color: #fafafa;
      }
      blockquote {
        border-left: 3px solid #ccc;
        padding-left: 12pt;
        margin: 12pt 0;
        color: #555;
        font-style: italic;
      }
      ul, ol {
        margin: 8pt 0;
        padding-left: 24pt;
        line-height: 1.6;
      }
      li {
        margin-bottom: 4pt;
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

export function downloadAsDoc(title: string, content: string, sections?: DraftSection[], _contentFormat?: string): void {
  const fullHtml = buildExportHtml(title, content, sections)
  const wordDoc = fullHtml
    .replace('<html>', `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`)
    .replace('</head>', `  <meta name="ProgId" content="Word.Document">\n  <meta name="Generator" content="Knowlex Platform">\n  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->\n  </head>`)
  triggerDownload(new Blob([wordDoc], { type: 'application/msword' }), `${sanitizeFilename(title)}.doc`)
}

export function downloadAsPdf(title: string, content: string, sections?: DraftSection[], _contentFormat?: string): void {
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
