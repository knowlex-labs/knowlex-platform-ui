/**
 * Legal Notice Template Renderer
 * 
 * Standard format for legal notices:
 * - Notice header with bold title
 * - From/To sections with party details
 * - Subject line
 * - Body paragraphs (numbered or plain)
 * - Signature block
 */

import { escapeHtml, renderInline } from './common'

export function renderNotice(content: string): string {
    const lines = content.split('\n')
    const htmlLines: string[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // Empty line
        if (!trimmed) {
            htmlLines.push('<div style="height:12px;"></div>')
            continue
        }

        // Title lines (LEGAL NOTICE, DEMAND NOTICE, etc.)
        if (/^(LEGAL|DEMAND|STATUTORY|FINAL)\s+NOTICE$/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;font-size:14pt;text-decoration:underline;margin:0 0 24px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Date line (usually at top right)
        if (/^Date:/i.test(trimmed) || /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:right;margin:0 0 16px 0;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // From: / To: headers
        if (/^(From|To):$/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:16px 0 4px 0;text-decoration:underline;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // Subject: / Re: line
        if (/^(Subject|Re|Ref):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:16px 0;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // Salutation (Dear Sir/Madam, etc.)
        if (/^(Dear|Respected|Sir|Madam)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:16px 0 8px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Numbered paragraphs
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/)
        if (numMatch) {
            htmlLines.push(`
        <p style="margin:8px 0 8px 40px;text-indent:-40px;text-align:justify;">
          <strong>${numMatch[1]}.</strong>&nbsp;&nbsp;${renderInline(numMatch[2])}
        </p>
      `)
            continue
        }

        // Closing (Yours faithfully, etc.)
        if (/^(Yours\s+(faithfully|truly|sincerely)|Thanking you)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:24px 0 8px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Signature block (name after closing)
        if (/^(Sd\/-|Signed|Advocate|Through)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:8px 0;font-weight:700;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // CC: / Copy to:
        if (/^(CC|Copy\s+to):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:24px 0 4px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Default: justified paragraph
        htmlLines.push(`
      <p style="margin:4px 0;text-align:justify;">${renderInline(trimmed)}</p>
    `)
    }

    return htmlLines.join('\n')
}
