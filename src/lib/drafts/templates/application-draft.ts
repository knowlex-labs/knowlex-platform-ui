/**
 * General Application Draft Template Renderer
 * 
 * Standard format for general legal applications:
 * - Authority/Office heading
 * - Application title
 * - Applicant details
 * - Subject matter
 * - Body paragraphs
 * - Relief sought
 * - Signature and verification
 */

import { escapeHtml, renderInline } from './common'

export function renderApplicationDraft(content: string): string {
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

        // TO: The [Authority] heading
        if (/^(TO|To):?\s*(The|Shri|Smt)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:0 0 4px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Authority/Office title (all caps lines at top)
        if (i < 10 && trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !/^\d+\./.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:2px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Subject/Re line
        if (/^(Subject|Re|Ref|Regarding):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:16px 0 8px 0;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // Reference number/date
        if (/^(Reference|Ref\. No\.|Application No\.|Date):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:4px 0;">
          <strong>${trimmed.split(':')[0]}:</strong>${escapeHtml(trimmed.split(':').slice(1).join(':'))}
        </p>
      `)
            continue
        }

        // Salutation
        if (/^(Respected|Dear|Sir|Madam|Hon'ble)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:16px 0 8px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // PRAYER / Relief sought
        if (/^(PRAYER|RELIEF SOUGHT|WHEREFORE)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;text-decoration:underline;margin:20px 0 12px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Numbered paragraphs with hanging indent
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/)
        if (numMatch) {
            htmlLines.push(`
        <p style="margin:8px 0 8px 40px;text-indent:-40px;text-align:justify;">
          <strong>${numMatch[1]}.</strong>&nbsp;&nbsp;${renderInline(numMatch[2])}
        </p>
      `)
            continue
        }

        // Lettered paragraphs (a), (b), etc.
        const letterMatch = trimmed.match(/^\(([a-z])\)\s*(.*)/)
        if (letterMatch) {
            htmlLines.push(`
        <p style="margin:4px 0 4px 60px;text-indent:-20px;text-align:justify;">
          (${letterMatch[1]})&nbsp;${renderInline(letterMatch[2])}
        </p>
      `)
            continue
        }

        // Closing
        if (/^(Yours\s+(faithfully|truly|sincerely|obediently)|Thanking you|I shall be grateful)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:20px 0 8px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Signature block
        if (/^(Applicant|Petitioner|Sd\/-|Signature|Name|Address|Date|Place):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:4px 0;">
          <strong>${trimmed.split(':')[0]}:</strong>${escapeHtml(trimmed.split(':').slice(1).join(':'))}
        </p>
      `)
            continue
        }

        // Enclosure/Annexure
        if (/^(Encl|Enclosure|Annexure|Attachments?):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:20px 0 4px 0;">${escapeHtml(trimmed)}</p>
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
