/**
 * Common utilities for draft template rendering
 */

// Escapes HTML entities before injecting into dangerouslySetInnerHTML
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

// Converts **bold** markers to <strong> on already-escaped text
export function renderInline(text: string): string {
    return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

// Common styles for legal documents
export const LEGAL_STYLES = {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: '12pt',
    lineHeight: '1.6',
    textAlign: 'justify',
} as const

/**
 * Generic draft renderer for unknown template types.
 * Provides basic formatting for legal-style documents.
 */
export function renderGenericDraft(content: string): string {
    const lines = content.split('\n')
    const htmlLines: string[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // Empty line → paragraph break
        if (!trimmed) {
            htmlLines.push('<div style="height:12px;"></div>')
            continue
        }

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(trimmed)) {
            htmlLines.push('<hr style="border:none;border-top:1px solid #000;margin:18px 0;" />')
            continue
        }

        // ALL CAPS lines → centered heading
        // Restrict to ASCII-only text: scripts like Devanagari have no lowercase so
        // toUpperCase() is always equal, which would turn every Hindi line into a heading.
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/^\d+\./.test(trimmed) && !trimmed.startsWith('**') && /^[\x20-\x7E]+$/.test(trimmed)) {
            htmlLines.push(`<p style="text-align:center;font-weight:700;margin:8px 0;">${escapeHtml(trimmed)}</p>`)
            continue
        }

        // Bold markdown **text**
        if (/^\*\*[^*\n]+\*\*$/.test(trimmed)) {
            const inner = trimmed.slice(2, -2)
            htmlLines.push(`<p style="font-weight:700;margin:4px 0;">${escapeHtml(inner)}</p>`)
            continue
        }

        // Numbered clause "1. …" with hanging indent
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/)
        if (numMatch) {
            htmlLines.push(`
        <p style="margin:8px 0;margin-left:40px;text-indent:-40px;text-align:justify;">
          <strong>${numMatch[1]}.</strong>&nbsp;&nbsp;${renderInline(numMatch[2])}
        </p>
      `)
            continue
        }

        // Plain line
        htmlLines.push(`<p style="margin:4px 0;text-align:justify;">${renderInline(trimmed)}</p>`)
    }

    return htmlLines.join('\n')
}
