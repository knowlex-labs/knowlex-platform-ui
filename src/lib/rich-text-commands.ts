/**
 * Rich Text Formatting Commands
 *
 * Modern replacements for the deprecated document.execCommand() API.
 * Uses Selection/Range API directly for reliable formatting behavior.
 */

/**
 * Find the nearest ancestor matching a tag name, stopping at editorRoot.
 */
function findAncestorTag(
  node: Node | null,
  tagName: string,
  editorRoot: HTMLElement
): HTMLElement | null {
  while (node && node !== editorRoot) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).tagName.toLowerCase() === tagName.toLowerCase()
    ) {
      return node as HTMLElement
    }
    node = node.parentNode
  }
  return null
}

/**
 * Get the current selection and range if valid within the editor.
 */
function getEditorSelection(editorRoot: HTMLElement | null) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !editorRoot) return null
  if (!editorRoot.contains(selection.anchorNode)) return null
  return { selection, range: selection.getRangeAt(0) }
}

/**
 * Toggle inline formatting (bold, italic, underline) on the current selection.
 *
 * If the selection is already wrapped in the given tag, the tag is removed.
 * Otherwise the selection content is extracted and wrapped in a new element.
 */
export function toggleInlineFormat(
  tagName: 'strong' | 'em' | 'u',
  editorRoot: HTMLElement | null
): boolean {
  const sel = getEditorSelection(editorRoot)
  if (!sel || sel.range.collapsed) return false

  const { selection, range } = sel

  // Check if already formatted
  const existingTag = findAncestorTag(
    range.commonAncestorContainer,
    tagName,
    editorRoot!
  )

  if (existingTag) {
    // Remove formatting: replace the tag element with its children
    const parent = existingTag.parentNode
    if (parent) {
      while (existingTag.firstChild) {
        parent.insertBefore(existingTag.firstChild, existingTag)
      }
      parent.removeChild(existingTag)
    }
  } else {
    // Apply formatting: wrap selection in a new element
    const wrapper = document.createElement(tagName)
    const fragment = range.extractContents()
    wrapper.appendChild(fragment)
    range.insertNode(wrapper)

    // Restore selection around the wrapped content
    selection.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(wrapper)
    selection.addRange(newRange)
  }

  return true
}

/**
 * Set text alignment on the block-level element containing the cursor.
 */
export function setBlockAlignment(
  align: 'left' | 'center' | 'right' | 'justify',
  editorRoot: HTMLElement | null
): boolean {
  const sel = getEditorSelection(editorRoot)
  if (!sel) return false

  const blockTags = new Set([
    'P',
    'DIV',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'LI',
    'BLOCKQUOTE',
  ])

  let node: Node | null = sel.selection.anchorNode
  while (node && node !== editorRoot) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (blockTags.has(el.tagName)) {
        el.style.textAlign = align
        return true
      }
    }
    node = node.parentNode
  }
  return false
}

/**
 * Apply font size to the current selection.
 *
 * Always uses extractContents (never surroundContents which fails on
 * cross-boundary selections). Cleans up existing font-size spans inside
 * the selection to prevent nested spans from accumulating.
 */
export function applyFontSize(
  sizePt: string,
  editorRoot: HTMLElement | null
): boolean {
  const sel = getEditorSelection(editorRoot)
  if (!sel || sel.range.collapsed) return false

  const { selection, range } = sel
  const span = document.createElement('span')
  span.style.fontSize = `${sizePt}pt`

  // Extract contents — always works, unlike surroundContents
  const fragment = range.extractContents()

  // Clean up existing font-size spans to prevent nesting
  const existingSpans = fragment.querySelectorAll('span')
  existingSpans.forEach((existingSpan) => {
    if (existingSpan.style.fontSize) {
      existingSpan.style.removeProperty('font-size')
      // If span has no remaining styles, unwrap it entirely
      if (!existingSpan.getAttribute('style')?.trim()) {
        const parent = existingSpan.parentNode
        while (existingSpan.firstChild) {
          parent?.insertBefore(existingSpan.firstChild, existingSpan)
        }
        parent?.removeChild(existingSpan)
      }
    }
  })

  span.appendChild(fragment)
  range.insertNode(span)

  // Restore selection
  selection.removeAllRanges()
  const newRange = document.createRange()
  newRange.selectNodeContents(span)
  selection.addRange(newRange)

  return true
}

/**
 * Toggle a list (ordered or unordered) for the block containing the cursor.
 *
 * If the cursor is already inside a list of the same type, the list is
 * unwrapped back into paragraphs. Otherwise the current block is converted
 * into a single-item list.
 */
export function toggleList(
  type: 'ol' | 'ul',
  editorRoot: HTMLElement | null
): boolean {
  const sel = getEditorSelection(editorRoot)
  if (!sel) return false

  let node: Node | null = sel.selection.anchorNode
  let blockEl: HTMLElement | null = null
  let listEl: HTMLElement | null = null

  while (node && node !== editorRoot) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase()
      if (tag === 'ol' || tag === 'ul') {
        listEl = node as HTMLElement
        break
      }
      if (tag === 'p' || tag === 'div') {
        blockEl = node as HTMLElement
      }
    }
    node = node.parentNode
  }

  if (listEl) {
    // Already in a list — unwrap list items into paragraphs
    const parent = listEl.parentNode
    if (parent) {
      const items = Array.from(listEl.querySelectorAll(':scope > li'))
      items.forEach((li) => {
        const p = document.createElement('p')
        while (li.firstChild) p.appendChild(li.firstChild)
        parent.insertBefore(p, listEl)
      })
      parent.removeChild(listEl)
    }
  } else if (blockEl) {
    // Convert block to list
    const list = document.createElement(type)
    const li = document.createElement('li')
    while (blockEl.firstChild) li.appendChild(blockEl.firstChild)
    list.appendChild(li)
    blockEl.parentNode?.replaceChild(list, blockEl)
  }

  return true
}
