import { useState, useRef, useEffect, useCallback } from 'react'
import { Wand2, Trash2, AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTextSelection } from '@/hooks/use-text-selection'
import { useEditorFormatting } from '@/hooks/use-editor-formatting'
import { FormattingToolbar } from './formatting-toolbar'
import {
  renderDraftToHtml,
} from '@/lib/draft-renderer'
import type { Draft } from '@/types'

interface DraftPreviewTabProps {
  draft: Draft
  onSaveLocal: (id: string, title: string, content: string) => void
  onSaveToBackend: (id: string, title: string, content: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onSendToChat: (text: string) => void
  onDirtyChange?: (isDirty: boolean) => void
  onRetry?: (draftId: string) => void
}

export function DraftPreviewTab({
  draft,
  onSaveLocal,
  onSaveToBackend,
  onDelete,
  onSendToChat,
  onDirtyChange,
  onRetry,
}: DraftPreviewTabProps) {
  // --- Pending state ---
  if (draft.status === 'pending') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-ledger-white dark:bg-ledger-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="typewriter-dot" />
            <span className="typewriter-dot" />
            <span className="typewriter-dot" />
          </div>
          <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-300 font-medium">
            Generating your draft...
          </p>
          <p className="text-xs text-ledger-gray-400 dark:text-ledger-gray-500">
            This may take a minute or two. You can continue working.
          </p>
        </div>
      </div>
    )
  }

  // --- Failed state ---
  if (draft.status === 'failed') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-ledger-white dark:bg-ledger-gray-900">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-ledger-gray-700 dark:text-ledger-gray-200 font-medium">
            Draft generation failed
          </p>
          <p className="text-xs text-ledger-gray-400 dark:text-ledger-gray-500 text-center max-w-xs">
            Something went wrong while generating this draft. You can retry or delete it.
          </p>
          <div className="flex items-center gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry(draft.id)}
                className="gap-2"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(draft.id)}
              className="gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Draft
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Completed state (existing editor) ---
  return (
    <CompletedDraftEditor
      draft={draft}
      onSaveLocal={onSaveLocal}
      onSaveToBackend={onSaveToBackend}
      onDelete={onDelete}
      onSendToChat={onSendToChat}
      onDirtyChange={onDirtyChange}
    />
  )
}

// Extracted the completed-draft editor into its own component so hooks are called unconditionally
function CompletedDraftEditor({
  draft,
  onSaveLocal,
  onSaveToBackend,
  onSendToChat,
  onDirtyChange,
}: DraftPreviewTabProps) {
  const [title, setTitle] = useState(draft.title)
  const [hasChanges, setHasChanges] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track whether we caused the draft.content change (to avoid re-rendering the editor)
  const isLocalEditRef = useRef(false)

  const { selection, clearSelection } = useTextSelection(editorRef)

  const markDirty = useCallback(() => {
    setHasChanges(true)
    onDirtyChange?.(true)
  }, [onDirtyChange])

  const formatting = useEditorFormatting(editorRef, markDirty)

  // Capture current editor content and save to local state
  const flushToLocalState = useCallback(() => {
    if (editorRef.current) {
      isLocalEditRef.current = true
      onSaveLocal(draft.id, title, editorRef.current.innerHTML)
    }
  }, [draft.id, title, onSaveLocal])

  // Sync editor HTML only when draft changes from OUTSIDE (e.g. polling, different draft opened)
  // Skip if the change came from our own auto-save (isLocalEditRef)
  useEffect(() => {
    if (isLocalEditRef.current) {
      isLocalEditRef.current = false
      return
    }
    setTitle(draft.title)
    setHasChanges(false)
    if (editorRef.current) {
      const hasSections = draft.sections && draft.sections.length > 0
      const html = renderDraftToHtml(
        draft.content,
        hasSections ? draft.sections : undefined,
        draft.templateType
      )
      editorRef.current.innerHTML = html
    }
  }, [draft.id, draft.content, draft.title, draft.sections, draft.templateType])

  // Auto-save to local state on input (debounced 500ms)
  const handleEditorInput = useCallback(() => {
    setHasChanges(true)
    onDirtyChange?.(true)

    // Debounce: save to local state after 500ms of inactivity
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      flushToLocalState()
    }, 500)
  }, [onDirtyChange, flushToLocalState])

  // Flush to local state on unmount (switching tabs)
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      // Can't call flushToLocalState here because editorRef may already be gone
      // Instead, the debounced save handles most cases
    }
  }, [])

  // Save to local state when switching away from this tab (before unmount)
  // This captures the latest DOM content before it's destroyed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && editorRef.current) {
        flushToLocalState()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flushToLocalState])

  // Explicit save to backend (Ctrl+S)
  const handleSaveToBackend = useCallback(() => {
    if (editorRef.current) {
      isLocalEditRef.current = true
      onSaveToBackend(draft.id, title, editorRef.current.innerHTML)
    }
    setHasChanges(false)
    onDirtyChange?.(false)
  }, [draft.id, title, onSaveToBackend, onDirtyChange])

  // Keyboard shortcuts (Ctrl/Cmd + S to save to backend)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveToBackend()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSaveToBackend])

  const handleFixWithAI = () => {
    if (selection?.text) {
      onSendToChat(`Please fix or improve the following text:\n\n"${selection.text}"`)
      clearSelection()
    }
  }

  const hasSections = draft.sections && draft.sections.length > 0
  const initialHtml = renderDraftToHtml(
    draft.content,
    hasSections ? draft.sections : undefined,
    draft.templateType
  )

  return (
    <div className="flex flex-col h-full">
      {/* Formatting Toolbar */}
      <FormattingToolbar
        onBold={formatting.handleBold}
        onItalic={formatting.handleItalic}
        onUnderline={formatting.handleUnderline}
        onAlignLeft={formatting.handleAlignLeft}
        onAlignCenter={formatting.handleAlignCenter}
        onAlignRight={formatting.handleAlignRight}
        onBulletList={formatting.handleBulletList}
        onNumberedList={formatting.handleNumberedList}
        onFontSize={formatting.handleFontSize}
        className="bg-ledger-white dark:bg-ledger-gray-900"
      />

      {/* Editable Content Area */}
      <div className="flex-1 p-4 overflow-auto dark:bg-ledger-gray-900">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={flushToLocalState}
          className="h-full border border-ledger-gray-200 dark:border-ledger-gray-600 rounded-lg overflow-auto focus:outline-none focus:ring-2 focus:ring-ledger-gray-300 bg-white"
          style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.8', fontSize: '12pt', minHeight: '400px', padding: '40px 60px', color: '#000' }}
          dangerouslySetInnerHTML={{ __html: initialHtml }}
        />

        {/* Floating AI Fix Button */}
        {selection && selection.text.length > 0 && (
          <div
            className="fixed z-50"
            style={{
              top: (selection.rect?.y || 0) - 40,
              left: (selection.rect?.x || 0) + ((selection.rect?.width || 0) / 2),
              transform: 'translateX(-50%)',
            }}
          >
            <Button
              size="sm"
              onClick={handleFixWithAI}
              className="gap-1.5 shadow-lg bg-kx-primary-600 hover:bg-kx-primary-700"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Fix with AI
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-ledger-gray-200 dark:border-ledger-gray-700 bg-ledger-gray-50 dark:bg-ledger-gray-900 flex items-center justify-between">
        <p className="text-xs text-ledger-gray-500">
          {hasChanges ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</span>
          ) : (
            `Last saved: ${draft.updatedAt.toLocaleString()}`
          )}
        </p>
        <p className="text-xs text-ledger-gray-400 dark:text-ledger-gray-500">
          <span className="font-medium">Ctrl+S</span> to save • <span className="font-medium">Ctrl+Z</span> to undo
        </p>
      </div>
    </div>
  )
}
