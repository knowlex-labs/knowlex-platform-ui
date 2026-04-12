/**
 * Document Serializer
 * 
 * Converts between HTML (from contentEditable) and RichDocument model.
 * This ensures formatting persists correctly across save/reload.
 */

import {
    type RichDocument,
    type Block,
    type ParagraphBlock,
    type ListBlock,
    type TextRun,
    type BlockAlign,
    DEFAULT_DOCUMENT_SETTINGS,
    generateBlockId,
    generateListItemId,
} from '@knowlex/core/types/document-model.types'

// ============================================================================
// HTML → RichDocument (Parsing)
// ============================================================================

/**
 * Parse HTML string from contentEditable into a RichDocument
 */
export function htmlToDocument(html: string): RichDocument {
    // Create a temporary container to parse HTML
    const container = document.createElement('div')
    container.innerHTML = html

    const blocks: Block[] = []

    // Process each top-level element
    for (const node of Array.from(container.childNodes)) {
        const block = nodeToBlock(node)
        if (block) {
            blocks.push(block)
        }
    }

    // If no blocks were created, create one from the entire content
    if (blocks.length === 0 && html.trim()) {
        blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: [{ text: container.textContent || '' }],
        })
    }

    return {
        version: '1.0',
        defaults: { ...DEFAULT_DOCUMENT_SETTINGS },
        blocks,
    }
}

/**
 * Convert a DOM node to a Block
 */
function nodeToBlock(node: Node): Block | null {
    // Text node - wrap in paragraph
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (!text) return null
        return {
            id: generateBlockId(),
            type: 'paragraph',
            content: [{ text }],
        }
    }

    // Not an element
    if (node.nodeType !== Node.ELEMENT_NODE) return null

    const el = node as HTMLElement
    const tagName = el.tagName.toLowerCase()

    // Handle lists
    if (tagName === 'ol' || tagName === 'ul') {
        return listElementToBlock(el, tagName === 'ol' ? 'ordered' : 'unordered')
    }

    // Handle block elements (p, div, h1-h6, etc.)
    const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']
    if (blockTags.includes(tagName) || !el.parentElement) {
        return elementToBlock(el)
    }

    // Inline element at top level - wrap in paragraph
    return elementToBlock(el)
}

/**
 * Convert an element to a ParagraphBlock
 */
function elementToBlock(el: HTMLElement): ParagraphBlock {
    const align = getElementAlignment(el)
    const content = extractTextRuns(el)

    return {
        id: generateBlockId(),
        type: 'paragraph',
        ...(align && align !== 'left' ? { align } : {}),
        content: content.length > 0 ? content : [{ text: '' }],
    }
}

/**
 * Convert a list element (ol/ul) to a ListBlock
 */
function listElementToBlock(
    el: HTMLElement,
    listType: 'ordered' | 'unordered'
): ListBlock {
    const items = Array.from(el.querySelectorAll(':scope > li')).map((li) => ({
        id: generateListItemId(),
        content: extractTextRuns(li as HTMLElement),
    }))

    return {
        id: generateBlockId(),
        type: 'list',
        listType,
        items: items.length > 0 ? items : [{ id: generateListItemId(), content: [{ text: '' }] }],
    }
}

/**
 * Extract text runs with formatting from an element
 */
function extractTextRuns(el: HTMLElement): TextRun[] {
    const runs: TextRun[] = []

    function walk(node: Node, inheritedFormat: Partial<TextRun> = {}) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ''
            if (text) {
                runs.push({
                    text,
                    ...(inheritedFormat.bold ? { bold: true } : {}),
                    ...(inheritedFormat.italic ? { italic: true } : {}),
                    ...(inheritedFormat.underline ? { underline: true } : {}),
                    ...(inheritedFormat.fontSize ? { fontSize: inheritedFormat.fontSize } : {}),
                })
            }
            return
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return

        const elem = node as HTMLElement
        const tagName = elem.tagName.toLowerCase()

        // Build up formatting based on element
        const format: Partial<TextRun> = { ...inheritedFormat }

        // Check for bold
        if (tagName === 'b' || tagName === 'strong' || elem.style.fontWeight === 'bold' || elem.style.fontWeight === '700') {
            format.bold = true
        }

        // Check for italic
        if (tagName === 'i' || tagName === 'em' || elem.style.fontStyle === 'italic') {
            format.italic = true
        }

        // Check for underline
        if (tagName === 'u' || elem.style.textDecoration?.includes('underline')) {
            format.underline = true
        }

        // Check for font size
        const fontSize = parseFontSize(elem)
        if (fontSize) {
            format.fontSize = fontSize
        }

        // Recurse into children
        for (const child of Array.from(node.childNodes)) {
            walk(child, format)
        }
    }

    walk(el)
    return mergeAdjacentRuns(runs)
}

/**
 * Parse font size from an element
 */
function parseFontSize(el: HTMLElement): number | undefined {
    // Check style attribute
    const styleSize = el.style.fontSize
    if (styleSize) {
        const match = styleSize.match(/(\d+(?:\.\d+)?)(pt|px)/)
        if (match) {
            const value = parseFloat(match[1])
            const unit = match[2]
            // Convert px to pt (roughly 1.333 px = 1 pt)
            return unit === 'pt' ? value : Math.round(value * 0.75)
        }
    }

    // Check font tag size attribute (legacy)
    if (el.tagName.toLowerCase() === 'font') {
        const size = el.getAttribute('size')
        if (size) {
            // Browser font sizes 1-7 roughly map to pt sizes
            const sizeMap: Record<string, number> = {
                '1': 8,
                '2': 10,
                '3': 12,
                '4': 14,
                '5': 18,
                '6': 24,
                '7': 36,
            }
            return sizeMap[size]
        }
    }

    return undefined
}

/**
 * Get text alignment from an element
 */
function getElementAlignment(el: HTMLElement): BlockAlign | undefined {
    const textAlign = el.style.textAlign
    if (textAlign === 'center' || textAlign === 'right' || textAlign === 'left') {
        return textAlign
    }

    // Check for align attribute (legacy)
    const alignAttr = el.getAttribute('align')
    if (alignAttr === 'center' || alignAttr === 'right' || alignAttr === 'left') {
        return alignAttr
    }

    return undefined
}

/**
 * Merge adjacent text runs with identical formatting
 */
function mergeAdjacentRuns(runs: TextRun[]): TextRun[] {
    if (runs.length === 0) return runs

    const merged: TextRun[] = []
    let current = { ...runs[0] }

    for (let i = 1; i < runs.length; i++) {
        const run = runs[i]
        if (
            run.bold === current.bold &&
            run.italic === current.italic &&
            run.underline === current.underline &&
            run.fontSize === current.fontSize
        ) {
            // Same formatting, merge text
            current.text += run.text
        } else {
            // Different formatting, push current and start new
            merged.push(current)
            current = { ...run }
        }
    }
    merged.push(current)

    return merged
}

// ============================================================================
// RichDocument → HTML (Rendering)
// ============================================================================

/**
 * Render a RichDocument to HTML string
 */
export function documentToHtml(doc: RichDocument): string {
    return doc.blocks.map((block) => blockToHtml(block, doc.defaults)).join('\n')
}

/**
 * Render a block to HTML
 */
function blockToHtml(
    block: Block,
    defaults: RichDocument['defaults']
): string {
    if (block.type === 'list') {
        return listBlockToHtml(block)
    }

    return paragraphBlockToHtml(block, defaults)
}

/**
 * Render a paragraph block to HTML
 */
function paragraphBlockToHtml(
    block: ParagraphBlock,
    defaults: RichDocument['defaults']
): string {
    const align = block.align || defaults.textAlign
    const alignStyle = align !== 'left' ? `text-align:${align};` : ''
    const style = alignStyle ? ` style="${alignStyle}"` : ''

    const contentHtml = block.content.map((run) => textRunToHtml(run)).join('')

    return `<p${style}>${contentHtml || '<br>'}</p>`
}

/**
 * Render a list block to HTML
 */
function listBlockToHtml(block: ListBlock): string {
    const tag = block.listType === 'ordered' ? 'ol' : 'ul'
    const items = block.items
        .map((item) => {
            const contentHtml = item.content.map((run) => textRunToHtml(run)).join('')
            return `<li>${contentHtml || '<br>'}</li>`
        })
        .join('\n')

    return `<${tag}>\n${items}\n</${tag}>`
}

/**
 * Render a text run to HTML
 */
function textRunToHtml(run: TextRun): string {
    let html = escapeHtml(run.text)

    // Apply inline formatting (innermost first, then wrap outward)
    if (run.fontSize) {
        html = `<span style="font-size:${run.fontSize}pt">${html}</span>`
    }

    if (run.underline) {
        html = `<u>${html}</u>`
    }

    if (run.italic) {
        html = `<em>${html}</em>`
    }

    if (run.bold) {
        html = `<strong>${html}</strong>`
    }

    return html
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>')
}

// ============================================================================
// RichDocument → Plain Text (for backward compatibility)
// ============================================================================

/**
 * Extract plain text from a RichDocument
 */
export function documentToPlainText(doc: RichDocument): string {
    return doc.blocks.map((block) => blockToPlainText(block)).join('\n\n')
}

/**
 * Extract plain text from a block
 */
function blockToPlainText(block: Block): string {
    if (block.type === 'list') {
        return block.items
            .map((item, index) => {
                const prefix = block.listType === 'ordered' ? `${index + 1}. ` : '• '
                return prefix + item.content.map((run) => run.text).join('')
            })
            .join('\n')
    }

    return block.content.map((run) => run.text).join('')
}

// ============================================================================
// Plain Text → RichDocument (for migration)
// ============================================================================

/**
 * Convert plain text to a RichDocument (for migrating legacy content)
 */
export function plainTextToDocument(text: string): RichDocument {
    const paragraphs = text.split(/\n\n+/)

    const blocks: Block[] = paragraphs.map((para) => ({
        id: generateBlockId(),
        type: 'paragraph' as const,
        content: [{ text: para.replace(/\n/g, ' ') }],
    }))

    return {
        version: '1.0',
        defaults: { ...DEFAULT_DOCUMENT_SETTINGS },
        blocks: blocks.length > 0 ? blocks : [{ id: generateBlockId(), type: 'paragraph', content: [{ text: '' }] }],
    }
}

// ============================================================================
// JSON Serialization (for API storage)
// ============================================================================

/**
 * Serialize a RichDocument to JSON string for API storage
 */
export function serializeDocument(doc: RichDocument): string {
    return JSON.stringify(doc)
}

/**
 * Deserialize a JSON string to RichDocument
 * Returns null if the string is not a valid RichDocument
 */
export function deserializeDocument(json: string): RichDocument | null {
    try {
        const parsed = JSON.parse(json)
        if (parsed && typeof parsed === 'object' && parsed.version && Array.isArray(parsed.blocks)) {
            return parsed as RichDocument
        }
    } catch {
        // Not valid JSON or not a RichDocument
    }
    return null
}

/**
 * Check if a string is a serialized RichDocument (starts with {"version")
 */
export function isRichDocumentString(content: string): boolean {
    return content.trim().startsWith('{"version"')
}
