import { useState, useRef, useEffect, useCallback } from 'react'
import { Wand2, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTextSelection } from '@/hooks/use-text-selection'
import { useEditorFormatting } from '@/hooks/use-editor-formatting'
import { FormattingToolbar } from './formatting-toolbar'
import {
  renderDraftToHtml,
} from '@/lib/draft-renderer'
import {
  htmlToDocument,
  serializeDocument,
} from '@/lib/drafts/document-serializer'
import type { Draft } from '@/types'

interface DraftPreviewTabProps {
  draft: Draft
  onSaveLocal: (id: string, title: string, content: string) => void
  onSaveToBackend: (id: string, title: string, content: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onSendToChat: (text: string) => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function DraftPreviewTab({
  draft,
  onSaveLocal,
  onSaveToBackend,
  onDelete,
  onSendToChat,
  onDirtyChange,
}: DraftPreviewTabProps) {
  // --- Pending state ---
  if (draft.status === 'pending') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-ledger-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="typewriter-dot" />
            <span className="typewriter-dot" />
            <span className="typewriter-dot" />
          </div>
          <p className="text-sm text-ledger-gray-500 font-medium">
            Generating your draft...
          </p>
          <p className="text-xs text-ledger-gray-400">
            This may take a minute or two. You can continue working.
          </p>
        </div>
      </div>
    )
  }

  // --- Failed state ---
  if (draft.status === 'failed') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-ledger-white">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-ledger-gray-700 font-medium">
            Draft generation failed
          </p>
          <p className="text-xs text-ledger-gray-400 text-center max-w-xs">
            Something went wrong while generating this draft. You can delete it and try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(draft.id)}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Draft
          </Button>
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
      const richDoc = htmlToDocument(editorRef.current.innerHTML)
      const serializedContent = serializeDocument(richDoc)
      isLocalEditRef.current = true
      onSaveLocal(draft.id, title, serializedContent)
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
      const richDoc = htmlToDocument(editorRef.current.innerHTML)
      const serializedContent = serializeDocument(richDoc)
      onSaveToBackend(draft.id, title, serializedContent)
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
        className="bg-white"
      />

      {/* Editable Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={flushToLocalState}
          className="h-full border border-ledger-gray-200 rounded-lg overflow-auto focus:outline-none focus:ring-2 focus:ring-ledger-gray-300 bg-white"
          style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.8', fontSize: '12pt', minHeight: '400px', padding: '40px 60px' }}
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
              className="gap-1.5 shadow-lg bg-ledger-black hover:bg-ledger-gray-800"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Fix with AI
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-ledger-gray-200 bg-ledger-gray-50 flex items-center justify-between">
        <p className="text-xs text-ledger-gray-500">
          {hasChanges ? (
            <span className="text-amber-600 font-medium">Unsaved changes</span>
          ) : (
            `Last saved: ${draft.updatedAt.toLocaleString()}`
          )}
        </p>
        <p className="text-xs text-ledger-gray-400">
          <span className="font-medium">Ctrl+S</span> to save • <span className="font-medium">Ctrl+Z</span> to undo
        </p>
      </div>
    </div>
  )
}
