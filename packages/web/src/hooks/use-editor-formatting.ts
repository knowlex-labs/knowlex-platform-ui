import { useCallback, type RefObject } from 'react'
import {
  toggleInlineFormat,
  setBlockAlignment,
  applyFontSize,
  toggleList,
} from '@/lib/rich-text-commands'

/**
 * Hook that wraps rich-text formatting commands with an editor ref
 * and a dirty-state callback. Returns stable handlers ready to pass
 * to <FormattingToolbar />.
 */
export function useEditorFormatting(
  editorRef: RefObject<HTMLDivElement | null>,
  onDirtyChange?: () => void
) {
  const markDirty = useCallback(() => {
    onDirtyChange?.()
  }, [onDirtyChange])

  const focus = useCallback(() => {
    editorRef.current?.focus()
  }, [editorRef])

  const handleBold = useCallback(() => {
    toggleInlineFormat('strong', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleItalic = useCallback(() => {
    toggleInlineFormat('em', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleUnderline = useCallback(() => {
    toggleInlineFormat('u', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleAlignLeft = useCallback(() => {
    setBlockAlignment('left', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleAlignCenter = useCallback(() => {
    setBlockAlignment('center', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleAlignRight = useCallback(() => {
    setBlockAlignment('right', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleBulletList = useCallback(() => {
    toggleList('ul', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleNumberedList = useCallback(() => {
    toggleList('ol', editorRef.current)
    focus()
    markDirty()
  }, [editorRef, focus, markDirty])

  const handleFontSize = useCallback(
    (size: string) => {
      applyFontSize(size, editorRef.current)
      focus()
      markDirty()
    },
    [editorRef, focus, markDirty]
  )

  return {
    handleBold,
    handleItalic,
    handleUnderline,
    handleAlignLeft,
    handleAlignCenter,
    handleAlignRight,
    handleBulletList,
    handleNumberedList,
    handleFontSize,
  }
}
