/**
 * Rich-Text Document Model Types
 * 
 * A structured document model that persists formatting correctly.
 * Based on a block + text run architecture similar to ProseMirror/Slate.
 */

// ============================================================================
// Inline Formatting (applied to text runs)
// ============================================================================

export interface TextRun {
    text: string
    bold?: boolean
    italic?: boolean
    underline?: boolean
    fontSize?: number  // in points (pt)
}

// ============================================================================
// Block Types
// ============================================================================

export type BlockAlign = 'left' | 'center' | 'right'

export interface ParagraphBlock {
    id: string
    type: 'paragraph'
    align?: BlockAlign
    content: TextRun[]
}

export interface ListItem {
    id: string
    content: TextRun[]
}

export interface ListBlock {
    id: string
    type: 'list'
    listType: 'ordered' | 'unordered'
    align?: BlockAlign
    items: ListItem[]
}

export type Block = ParagraphBlock | ListBlock

// ============================================================================
// Document
// ============================================================================

export interface DocumentDefaults {
    fontFamily: string
    fontSize: number      // in points (pt)
    lineHeight: number    // multiplier (e.g., 1.8)
    textAlign: BlockAlign
}

export interface RichDocument {
    version: string
    defaults: DocumentDefaults
    blocks: Block[]
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_DOCUMENT_SETTINGS: DocumentDefaults = {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 12,
    lineHeight: 1.8,
    textAlign: 'left',
}

export function createEmptyDocument(): RichDocument {
    return {
        version: '1.0',
        defaults: { ...DEFAULT_DOCUMENT_SETTINGS },
        blocks: [
            {
                id: generateBlockId(),
                type: 'paragraph',
                content: [{ text: '' }],
            },
        ],
    }
}

export function generateBlockId(): string {
    return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function generateListItemId(): string {
    return `li_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}
