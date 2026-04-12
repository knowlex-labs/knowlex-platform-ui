/**
 * Affidavit Template Renderer
 * 
 * Standard format for affidavits:
 * - Court/Authority heading
 * - Case details
 * - Deponent details
 * - "I, [Name]... do hereby solemnly affirm and state as follows:"
 * - Numbered statements
 * - Verification clause
 * - Place, Date, Deponent signature
 * - Before me (Notary/Oath Commissioner)
 */

import { escapeHtml, renderInline } from './common'

export function renderAffidavit(content: string): string {
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

        // AFFIDAVIT title
        if (/^AFFIDAVIT$/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;font-size:14pt;text-decoration:underline;margin:0 0 16px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Court/Authority heading (IN THE COURT OF... / BEFORE THE...)
        if (/^(IN THE|BEFORE THE)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;margin:0 0 8px 0;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // AT [Location]
        if (/^AT\s+[A-Z]/i.test(trimmed) && trimmed.length < 30) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;margin:0 0 16px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Case/Matter reference
        if (/^(In the matter of|Case No\.|Misc\.|Petition)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;margin:8px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // VERIFICATION section
        if (/^VERIFICATION$/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;text-decoration:underline;margin:24px 0 12px 0;">
          VERIFICATION
        </p>
      `)
            continue
        }

        // "I, [Name]..." opening - preserve as justified paragraph
        if (/^I,\s+/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:12px 0;text-align:justify;">${renderInline(trimmed)}</p>
      `)
            continue
        }

        // Numbered statements with hanging indent
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/)
        if (numMatch) {
            htmlLines.push(`
        <p style="margin:8px 0 8px 48px;text-indent:-48px;text-align:justify;">
          <strong>${numMatch[1]}.</strong>&nbsp;&nbsp;&nbsp;${renderInline(numMatch[2])}
        </p>
      `)
            continue
        }

        // "That" statements (continuation of numbered clauses)
        if (/^That\s+/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:4px 0;text-align:justify;padding-left:48px;">${renderInline(trimmed)}</p>
      `)
            continue
        }

        // Place/Date
        if (/^(Place|Date|Dated at):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:8px 0;">
          <strong>${trimmed.split(':')[0]}:</strong>${escapeHtml(trimmed.split(':').slice(1).join(':'))}
        </p>
      `)
            continue
        }

        // Deponent/DEPONENT
        if (/^(DEPONENT|Deponent)$/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:right;font-weight:700;margin:16px 0 4px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Before me / Notary / Oath Commissioner
        if (/^(Before me|Notary|Oath Commissioner|Verified before me)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:24px 0 4px 0;font-weight:700;">${escapeHtml(trimmed)}</p>
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
