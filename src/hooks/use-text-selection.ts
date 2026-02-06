import { useState, useCallback, useEffect } from 'react'

interface TextSelection {
  text: string
  start: number
  end: number
  rect: DOMRect | null
}

interface UseTextSelectionResult {
  selection: TextSelection | null
  clearSelection: () => void
}

export function useTextSelection(
  containerRef: React.RefObject<HTMLElement | null>
): UseTextSelectionResult {
  const [selection, setSelection] = useState<TextSelection | null>(null)

  const handleSelectionChange = useCallback(() => {
    const container = containerRef.current
    if (!container) {
      setSelection(null)
      return
    }

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelection(null)
      return
    }

    const range = sel.getRangeAt(0)
    if (!container.contains(range.commonAncestorContainer)) {
      setSelection(null)
      return
    }

    const selectedText = sel.toString()
    if (!selectedText.trim()) {
      setSelection(null)
      return
    }

    setSelection({
      text: selectedText,
      start: 0,
      end: selectedText.length,
      rect: range.getBoundingClientRect(),
    })
  }, [containerRef])

  const clearSelection = useCallback(() => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 10)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey || e.key === 'Shift') {
        setTimeout(handleSelectionChange, 10)
      }
    }

    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('keyup', handleKeyUp)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('keyup', handleKeyUp)
    }
  }, [containerRef, handleSelectionChange])

  return {
    selection,
    clearSelection,
  }
}
