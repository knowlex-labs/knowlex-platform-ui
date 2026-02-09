/**
 * Interim Application Template Renderer
 * 
 * Standard format for interim applications in Indian courts:
 * - Court name: centered, underlined, bold, ALL CAPS
 * - Case number: right-aligned
 * - Plaintiff details: left-aligned block, "………Plaintiff" on right
 * - "Vs." centered
 * - Defendant details: left-aligned block, "…….Defendant" on right
 * - Title: centered, underlined, bold
 * - Body text: justified
 * - Numbered clauses: hanging indent (number left, text indented)
 * - Prayer: ALL CAPS, bold
 * - Place/Date/Signature section at bottom
 */

import { escapeHtml, renderInline } from './common'

export function renderInterimApplication(content: string): string {
    const lines = content.split('\n')
    const htmlLines: string[] = []

    let isInPartyBlock = false
    let partyBlockLines: string[] = []
    let partyType: 'plaintiff' | 'defendant' | null = null

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // Empty line
        if (!trimmed) {
            // End party block if we were in one
            if (isInPartyBlock && partyBlockLines.length > 0) {
                htmlLines.push(renderPartyBlock(partyBlockLines, partyType))
                partyBlockLines = []
                isInPartyBlock = false
                partyType = null
            }
            htmlLines.push('<div style="height:12px;"></div>')
            continue
        }

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(trimmed)) {
            htmlLines.push('<hr style="border:none;border-top:1px solid #000;margin:18px 0;" />')
            continue
        }

        // Court name (IN THE HON'BLE... at top, usually ALL CAPS)
        if (i < 5 && /^IN THE HON'?BLE/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;text-decoration:underline;margin:0 0 8px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // "AT PUNE" or similar court location (ALL CAPS, centered)
        if (i < 5 && /^AT\s+[A-Z]/i.test(trimmed) && trimmed.length < 30) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;margin:0 0 16px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Civil Suit No. / Case No. - right aligned
        if (/^(Civil Suit|Case|Misc\.|Criminal|Special)\s*(No\.?|Application)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:right;font-weight:700;margin:8px 0 16px 0;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // "Vs." or "V/s" separator
        if (/^v[\/.]?s\.?$/i.test(trimmed)) {
            // End any party block first
            if (isInPartyBlock && partyBlockLines.length > 0) {
                htmlLines.push(renderPartyBlock(partyBlockLines, partyType))
                partyBlockLines = []
                isInPartyBlock = false
                partyType = null
            }
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;margin:16px 0;">Vs.</p>
      `)
            continue
        }

        // Lines ending with "…Plaintiff" or "…Defendant"
        if (/\.{2,}\s*Plaintiff$/i.test(trimmed)) {
            partyBlockLines.push(trimmed)
            htmlLines.push(renderPartyBlock(partyBlockLines, 'plaintiff'))
            partyBlockLines = []
            isInPartyBlock = false
            partyType = null
            continue
        }

        if (/\.{2,}\s*Defendant$/i.test(trimmed)) {
            partyBlockLines.push(trimmed)
            htmlLines.push(renderPartyBlock(partyBlockLines, 'defendant'))
            partyBlockLines = []
            isInPartyBlock = false
            partyType = null
            continue
        }

        // Detect start of plaintiff/defendant block (name in bold or specific patterns)
        if (!isInPartyBlock && (
            /^(Shri|Smt|Mr\.|Mrs\.|Ms\.)/i.test(trimmed) ||
            /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z]/i.test(trimmed) // Name pattern
        )) {
            isInPartyBlock = true
            partyBlockLines = [trimmed]
            continue
        }

        // Continue collecting party block lines
        if (isInPartyBlock) {
            partyBlockLines.push(trimmed)
            continue
        }

        // Title like "Affidavit For Interim Application" - centered, underlined, bold
        if (/^Affidavit\s+(For|In)/i.test(trimmed) ||
            /^(Interim|Urgent)\s+Application/i.test(trimmed) ||
            /^Application\s+(For|Under)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;text-decoration:underline;margin:24px 0 16px 0;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // Prayer section (AND FOR WHICH ACT OF KINDNESS...)
        if (/^AND FOR WHICH ACT OF KINDNESS/i.test(trimmed)) {
            htmlLines.push(`
        <p style="font-weight:700;margin:24px 0 16px 0;text-align:justify;">
          ${escapeHtml(trimmed)}
        </p>
      `)
            continue
        }

        // VERIFICATION heading
        if (/^VERIFICATION$/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:center;font-weight:700;text-decoration:underline;margin:24px 0 12px 0;">
          ${escapeHtml(trimmed.toUpperCase())}
        </p>
      `)
            continue
        }

        // Place: / Date: lines
        if (/^(Place|Date):/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:8px 0;">
          <strong>${trimmed.split(':')[0]}:</strong>${escapeHtml(trimmed.split(':').slice(1).join(':'))}
        </p>
      `)
            continue
        }

        // Advocate for the Plaintiff/Defendant - right aligned
        if (/^Advocate for the/i.test(trimmed)) {
            htmlLines.push(`
        <p style="text-align:right;margin:4px 0;">
          <strong>${escapeHtml(trimmed)}</strong>
        </p>
      `)
            continue
        }

        // Numbered clause "1. …" with hanging indent
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/)
        if (numMatch) {
            htmlLines.push(`
        <p style="margin:8px 0 8px 48px;text-indent:-48px;text-align:justify;">
          <strong>${numMatch[1]}.</strong>&nbsp;&nbsp;&nbsp;${renderInline(numMatch[2])}
        </p>
      `)
            continue
        }

        // I, [Name] - opening statement - use full justification
        if (/^I,\s+/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:8px 0;text-align:justify;text-indent:0;">
          ${renderInline(trimmed)}
        </p>
      `)
            continue
        }

        // Party detail lines (Age:, R/o:, Mob., etc.)
        if (/^(Age:|R\/o:|Mob\.|Occ:|Occupation:)/i.test(trimmed)) {
            htmlLines.push(`
        <p style="margin:2px 0;">${escapeHtml(trimmed)}</p>
      `)
            continue
        }

        // Default: justified paragraph
        htmlLines.push(`
      <p style="margin:4px 0;text-align:justify;">${renderInline(trimmed)}</p>
    `)
    }

    // Handle any remaining party block
    if (isInPartyBlock && partyBlockLines.length > 0) {
        htmlLines.push(renderPartyBlock(partyBlockLines, partyType))
    }

    return htmlLines.join('\n')
}

/**
 * Renders a party block (plaintiff or defendant) with proper formatting
 * Party details are left-aligned, and "………Plaintiff/Defendant" appears right-aligned
 */
function renderPartyBlock(lines: string[], _partyType: 'plaintiff' | 'defendant' | null): string {
    if (lines.length === 0) return ''

    const blockHtml = lines.map((line, idx) => {
        const trimmed = line.trim()

        // Line with role indicator (last detail + "………Plaintiff/Defendant")
        if (/\.{2,}\s*(Plaintiff|Defendant)$/i.test(trimmed)) {
            const parts = trimmed.split(/\.{2,}/)
            const detailPart = parts[0].trim()
            const rolePart = parts[parts.length - 1].trim()

            // If there's a detail part, show both; otherwise just show the role
            if (detailPart) {
                return `
          <p style="margin:2px 0;">${escapeHtml(detailPart)}</p>
          <p style="text-align:right;font-weight:700;margin:2px 0;">………${escapeHtml(rolePart)}</p>
        `
            } else {
                return `<p style="text-align:right;font-weight:700;margin:2px 0;">………${escapeHtml(rolePart)}</p>`
            }
        }

        // First line (name) - bold, left-aligned
        if (idx === 0) {
            return `<p style="font-weight:700;margin:2px 0;text-align:left;">${escapeHtml(trimmed)}</p>`
        }

        // Other lines (address details) - left-aligned
        return `<p style="margin:2px 0;text-align:left;">${escapeHtml(trimmed)}</p>`
    }).join('')

    return `<div style="margin:12px 0;">${blockHtml}</div>`
}
