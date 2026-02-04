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
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
): UseTextSelectionResult {
  const [selection, setSelection] = useState<TextSelection | null>(null)

  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      setSelection(null)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start === end) {
      setSelection(null)
      return
    }

    const selectedText = textarea.value.substring(start, end)
    if (!selectedText.trim()) {
      setSelection(null)
      return
    }

    // Get textarea position for floating icon placement
    const rect = textarea.getBoundingClientRect()

    // Calculate approximate position based on selection
    // This is a simplified approach - getting exact cursor position in textarea is complex
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20
    const textBeforeSelection = textarea.value.substring(0, start)
    const linesBeforeSelection = textBeforeSelection.split('\n').length

    const approximateTop = rect.top + (linesBeforeSelection * lineHeight)
    const selectionRect = new DOMRect(
      rect.left + rect.width / 2, // Center horizontally
      Math.min(approximateTop, rect.bottom - 40), // Clamp to textarea bounds
      100,
      20
    )

    setSelection({
      text: selectedText,
      start,
      end,
      rect: selectionRect,
    })
  }, [textareaRef])

  const clearSelection = useCallback(() => {
    setSelection(null)
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Listen for selection changes via mouseup and keyup
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleSelectionChange, 10)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only handle selection-related keys
      if (e.shiftKey || e.key === 'Shift') {
        setTimeout(handleSelectionChange, 10)
      }
    }

    const handleBlur = () => {
      // Clear selection when textarea loses focus
      setTimeout(() => {
        if (document.activeElement !== textarea) {
          setSelection(null)
        }
      }, 200)
    }

    textarea.addEventListener('mouseup', handleMouseUp)
    textarea.addEventListener('keyup', handleKeyUp)
    textarea.addEventListener('blur', handleBlur)

    return () => {
      textarea.removeEventListener('mouseup', handleMouseUp)
      textarea.removeEventListener('keyup', handleKeyUp)
      textarea.removeEventListener('blur', handleBlur)
    }
  }, [textareaRef, handleSelectionChange])

  return {
    selection,
    clearSelection,
  }
}
