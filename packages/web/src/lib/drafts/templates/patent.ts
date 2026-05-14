/**
 * Patent Application Template Renderer
 * 
 * Standard format for patent applications:
 * - Form number and title
 * - Application details
 * - Inventor information
 * - Description of invention
 * - Claims
 * - Abstract
 */

import { escapeHtml, renderInline } from './common'

export function renderPatent(content: string): string {
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

        // Form number (Form 1, Form 2, etc.)
        if (/^Form\s+\d+/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:right;font-weight:700;margin:0 0 8px 0;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // Main title (PATENT APPLICATION, etc.)
        if (/^(PATENT|APPLICATION FOR PATENT|COMPLETE SPECIFICATION)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;font-size:14pt;text-decoration:underline;margin:16px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Section headers (CLAIMS, ABSTRACT, DESCRIPTION, etc.)
        if (/^(CLAIMS|ABSTRACT|DESCRIPTION|DRAWINGS|TITLE OF INVENTION|FIELD OF INVENTION|BACKGROUND|SUMMARY|DETAILED DESCRIPTION)$/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;text-decoration:underline;margin:20px 0 12px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Numbered claims with hanging indent
        const claimMatch = trimmed.match(/^(Claim\s+)?(\d+)\.\s*(.*)/)
        if (claimMatch) {
            const num = claimMatch[2]
            const text = claimMatch[3]
            htmlLines.push(`
        <p style="margin:8px 0 8px 40px;text-indent:-40px;text-align:justify;">
          <strong>${num}.</strong>&nbsp;&nbsp;${renderInline(text)}
        </p>
      `)
            continue
        }

        // Field labels (Title:, Applicant:, Inventor:, etc.)
        if (/^(Title|Applicant|Inventor|Priority|Filing Date|Application No):/i.test(trimmed)) {
            const parts = trimmed.split(':')
            const label = parts[0]
            const value = parts.slice(1).join(':').trim()
            htmlLines.push(`
        <p style="margin:4px 0;">
          <strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}
        </p>
      `)
            continue
        }

        // Figure references (Fig. 1, Figure 1, etc.)
        if (/^(Fig\.|Figure)\s+\d+/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-style:italic;margin:8px 0;">
          ${escapeHtml(trimmed)}
        </p>
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
