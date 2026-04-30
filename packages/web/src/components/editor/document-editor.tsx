import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import {
  getEditState,
  updateEditState,
  exportGeneratedDocument,
  type EditStateResponse,
  type GeneratedDocExportFormat,
} from '@knowlex/core/api'
import { FormattingToolbar } from '../cases/case-workspace/formatting-toolbar'
import { TranslateAction } from './translate-action'
import { TransliteratePanel } from './transliterate-panel'
import { Loader2, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const AUTOSAVE_DEBOUNCE_MS = 2000

interface DocumentEditorProps {
  documentId: string
  documentTitle?: string
  /** When true, mounts the toolbar in view-only mode. Default false (edit mode). */
  readOnly?: boolean
  className?: string
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready' }
  | { phase: 'error'; message: string }

/**
 * Single canonical editor for both uploaded documents and AI-generated drafts.
 *
 * On mount, calls GET /edit-state which either returns the existing Tiptap JSON
 * or triggers a one-time PDF/DOCX→HTML conversion on the backend (Gemini Vision
 * / Mistral Pixtral). The editor loads whichever format the backend returns and,
 * after the first edit, autosaves Tiptap JSON every {@link AUTOSAVE_DEBOUNCE_MS}
 * to the same `editStatePath`.
 */
export function DocumentEditor({
  documentId,
  documentTitle,
  readOnly = false,
  className,
}: DocumentEditorProps) {
  const [loadState, setLoadState] = useState<LoadState>({ phase: 'loading' })
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showTransliterate, setShowTransliterate] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextChangeRef = useRef(true)
  // For PDF documents, the backend creates a DOCX_COPY with a different ID.
  // All write operations (autosave, export) must use this ID, not the original.
  const editingDocumentIdRef = useRef<string>(documentId)

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Start typing, or open an existing document above…',
      }),
    ],
    content: '',
    onUpdate: () => {
      // Skip the initial setContent broadcast so we don't autosave a fresh
      // conversion verbatim before the user has actually changed anything.
      if (skipNextChangeRef.current) {
        skipNextChangeRef.current = false
        return
      }
      setHasChanges(true)
      scheduleAutosave()
    },
  })

  const lastErrorAtRef = useRef<number>(0)
  const flushSave = useCallback(async () => {
    if (!editor) return
    setIsSaving(true)
    try {
      const json = JSON.stringify(editor.getJSON())
      await updateEditState(editingDocumentIdRef.current, json)
      setHasChanges(false)
    } catch (e) {
      // Surface autosave failures so the user doesn't keep typing under the
      // illusion that their work is being persisted. Throttle to one toast per
      // 10 s to avoid spamming when offline — hasChanges stays true so the next
      // attempt will retry.
      const now = Date.now()
      if (now - lastErrorAtRef.current > 10_000) {
        lastErrorAtRef.current = now
        const description = e instanceof Error ? e.message : 'Network error'
        toast({
          title: 'Failed to save changes',
          description,
          variant: 'destructive',
        })
      }
      console.warn('autosave failed', e)
    } finally {
      setIsSaving(false)
    }
  }, [editor])

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      void flushSave()
    }, AUTOSAVE_DEBOUNCE_MS)
  }, [flushSave])

  // Initial load: fetch edit state and apply to editor.
  useEffect(() => {
    if (!editor) return
    let cancelled = false
    setLoadState({ phase: 'loading' })

    getEditState(documentId)
      .then((res: EditStateResponse) => {
        if (cancelled) return
        // Use the copy's ID for all subsequent writes (differs from documentId for PDFs)
        editingDocumentIdRef.current = res.editingDocumentId ?? documentId
        skipNextChangeRef.current = true
        if (res.format === 'tiptap-json' && res.content) {
          try {
            const parsed = JSON.parse(res.content)
            editor.commands.setContent(parsed)
          } catch {
            // Backend reported tiptap-json but content didn't parse — fall back
            // to treating it as a string so the user sees something instead of a
            // blank editor.
            editor.commands.setContent(res.content)
          }
        } else {
          // HTML or markdown bootstrap — Tiptap's setContent accepts HTML directly.
          editor.commands.setContent(res.content || '')
        }
        setLoadState({ phase: 'ready' })

        // If the backend just produced a fresh HTML conversion, persist it as
        // Tiptap JSON immediately so subsequent loads skip the conversion path.
        if (res.freshConversion) {
          setTimeout(() => {
            if (cancelled) return
            void flushSave()
          }, 0)
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const message = e instanceof Error ? e.message : 'Failed to load document'
        setLoadState({ phase: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [editor, documentId, flushSave])

  // Best-effort flush on unmount so a quick close doesn't drop the latest edits.
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      if (hasChanges) void flushSave()
    }
  }, [hasChanges, flushSave])

  const onExport = useCallback(
    async (format: GeneratedDocExportFormat) => {
      if (!editor) return
      // Make sure the latest edits are persisted before export so the server
      // sees what the user sees.
      if (hasChanges) await flushSave()
      const html = editor.getHTML()
      const title = documentTitle?.trim() || 'document'
      try {
        await exportGeneratedDocument(editingDocumentIdRef.current, format, title, html)
      } catch (e) {
        const description = e instanceof Error ? e.message : 'Network error'
        toast({
          title: 'Export failed',
          description,
          variant: 'destructive',
        })
        console.warn('export failed', e)
      }
    },
    [editor, hasChanges, flushSave, documentTitle],
  )

  const toolbarHandlers = useMemo(() => {
    if (!editor) return null
    return {
      onBold: () => editor.chain().focus().toggleBold().run(),
      onItalic: () => editor.chain().focus().toggleItalic().run(),
      onUnderline: () => editor.chain().focus().toggleUnderline().run(),
      onAlignLeft: () => editor.chain().focus().setTextAlign('left').run(),
      onAlignCenter: () => editor.chain().focus().setTextAlign('center').run(),
      onAlignRight: () => editor.chain().focus().setTextAlign('right').run(),
      onBulletList: () => editor.chain().focus().toggleBulletList().run(),
      onNumberedList: () => editor.chain().focus().toggleOrderedList().run(),
      // Font-size is intentionally a no-op in v1 — Tiptap StarterKit doesn't
      // ship a TextStyle/FontSize mark and we are deferring that until users
      // ask for it.
      onFontSize: () => {},
      onSave: () => void flushSave(),
      onDownloadDoc: () => void onExport('DOCX'),
      onDownloadPdf: () => void onExport('PDF'),
      onDownloadMd: () => void onExport('MARKDOWN'),
    }
  }, [editor, flushSave, onExport])

  if (loadState.phase === 'error') {
    return (
      <div className={cn('p-6 text-sm text-red-600', className)}>
        Could not load document: {loadState.message}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-ledger-gray-900', className)}>
      {toolbarHandlers && (
        <div className="flex items-center justify-between border-b border-ledger-gray-200">
          <FormattingToolbar
            isEditing={!readOnly}
            isSaving={isSaving}
            hasChanges={hasChanges}
            documentTitle={documentTitle}
            {...toolbarHandlers}
          />
          <div className="flex items-center gap-1 px-2">
            <TranslateAction editor={editor} />
            <button
              type="button"
              onClick={() => setShowTransliterate((v) => !v)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                showTransliterate
                  ? 'bg-kx-primary-100 text-kx-primary-800'
                  : 'text-ledger-gray-600 hover:bg-ledger-gray-100',
              )}
              title="Toggle Indic typing panel"
            >
              <Languages className="h-3.5 w-3.5" />
              हिन्दी
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loadState.phase === 'loading' ? (
          <div className="flex items-center justify-center h-full text-ledger-gray-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Preparing document…
          </div>
        ) : (
          <div className="max-w-[820px] mx-auto px-10 py-8">
            <EditorContent
              editor={editor}
              className={cn(
                'focus:outline-none [&_*]:focus:outline-none',
                // Headings
                '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3',
                '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2',
                '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2',
                // Paragraphs
                '[&_p]:my-2 [&_p]:leading-relaxed',
                // Lists
                '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2',
                '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
                '[&_li]:my-0.5',
                '[&_li_ul]:list-[circle] [&_li_ul]:pl-6 [&_li_ul]:my-0',
                '[&_li_ol]:list-[lower-alpha] [&_li_ol]:pl-6 [&_li_ol]:my-0',
                // Tables — borders + padding so they look like tables, not aligned text
                '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3',
                '[&_table]:border [&_table]:border-ledger-gray-300',
                '[&_th]:border [&_th]:border-ledger-gray-300 [&_th]:px-3 [&_th]:py-2',
                '[&_th]:bg-ledger-gray-100 [&_th]:font-semibold [&_th]:text-left',
                '[&_td]:border [&_td]:border-ledger-gray-300 [&_td]:px-3 [&_td]:py-2',
                // Inline marks
                '[&_strong]:font-semibold [&_em]:italic',
                '[&_a]:text-kx-primary-700 [&_a]:underline',
                '[&_blockquote]:border-l-4 [&_blockquote]:border-ledger-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic',
                '[&_code]:bg-ledger-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm',
              )}
            />
          </div>
        )}
      </div>

      {showTransliterate && (
        <TransliteratePanel
          editor={editor}
          onClose={() => setShowTransliterate(false)}
        />
      )}
    </div>
  )
}
