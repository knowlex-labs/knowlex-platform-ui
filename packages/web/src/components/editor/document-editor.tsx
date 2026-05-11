import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Paragraph from '@tiptap/extension-paragraph'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextStyle from '@tiptap/extension-text-style'
import {
  getEditState,
  updateEditState,
  resetEditState,
  exportGeneratedDocument,
  type EditStateResponse,
  type GeneratedDocExportFormat,
} from '@knowlex/core/api'
import { FormattingToolbar } from './formatting-toolbar'
import { renderDraftToHtml } from '@/lib/draft-renderer'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const AUTOSAVE_DEBOUNCE_MS = 2000

// Adds a `fontSize` attribute to the TextStyle mark so the toolbar's font-size
// dropdown can apply per-selection font sizes. StarterKit ships no FontSize
// mark; this is the standard TipTap v2 idiom.
const TextStyleWithFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.fontSize ? { style: `font-size: ${attrs.fontSize as string}` } : {},
      },
    }
  },
})

// TipTap's default Table/TableCell schemas drop the `class` and inline `style`
// attributes. The cause-title block uses a 1-row borderless table for the
// `Mob.no. NNNN ………Role` line — without these attributes, the table inherits
// the editor's default visible borders and padding. Preserve them so our CSS
// selector `.cause-title-row` and per-cell `text-align` survive round-trips.
const TableWithClass = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.class ? { class: attrs.class as string } : {},
      },
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.style ? { style: attrs.style as string } : {},
      },
    }
  },
})
const TableCellWithStyle = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.style ? { style: attrs.style as string } : {},
      },
    }
  },
})

// TipTap's bundled Paragraph schema discards inline `style` and `class`. The
// notice prompts use per-paragraph margins (e.g. `margin:0` for tight
// recipient-block lines, `margin:1rem 0 0` for block-start lines) and
// `padding:0 3.5rem;` for the body inset; without preserving these attrs
// every <p> collapses to the editor's default `[&_p]:my-2` and the layout
// flattens. Mirrors the TableWithClass / TableCellWithStyle pattern above.
const ParagraphWithStyle = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.class ? { class: attrs.class as string } : {},
      },
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.style ? { style: attrs.style as string } : {},
      },
    }
  },
})

// Heuristic: a TipTap JSON doc that still contains literal markdown markers
// inside text nodes was saved before the markdown→HTML render fix. Proper
// parsing would have promoted these to heading / bold marks, so any leftover
// is a corruption signal — re-bootstrap from source.
const MARKDOWN_LITERAL = /^##\s|^\*\*[^*]+\*\*|^\[\/\/\]:/m
// Tracks documents we've already attempted to recover during this session.
// Prevents an infinite loop in the rare case where the second GET still
// returns content that trips the heuristic (e.g. the source markdown contains
// real `**bold**` literals the user wrote). Lives at module scope so it
// survives the editor's mount/unmount cycle.
const recoveryAttempted = new Set<string>()
function looksLikeUnrenderedMarkdown(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as { type?: string; text?: string; content?: unknown[] }
  if (n.type === 'text' && typeof n.text === 'string' && MARKDOWN_LITERAL.test(n.text)) {
    return true
  }
  if (Array.isArray(n.content)) {
    return n.content.some(looksLikeUnrenderedMarkdown)
  }
  return false
}

interface DocumentEditorProps {
  documentId: string
  documentTitle?: string
  /**
   * When true, suppresses the Edit button entirely (always view-only).
   * When false / omitted (default), the editor mounts in read-only mode but
   * shows an Edit button that toggles into edit mode with Save / Cancel.
   */
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
  const [isEditing, setIsEditing] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextChangeRef = useRef(true)
  // For PDF documents, the backend creates a DOCX_COPY with a different ID.
  // All write operations (autosave, export) must use this ID, not the original.
  const editingDocumentIdRef = useRef<string>(documentId)
  // Mirror hasChanges + flushSave into refs so the unmount-flush effect can run
  // with empty deps — otherwise its cleanup fires on every hasChanges change
  // and triggers a redundant save right after each successful autosave.
  const hasChangesRef = useRef(false)
  const flushSaveRef = useRef<() => Promise<void>>(async () => {})
  // Snapshot of editor JSON taken when entering edit mode. Cancel restores
  // from this so *every* edit since the user clicked Edit is discarded — not
  // just the edits since the most recent autosave.
  const editStartBaselineRef = useRef<object | null>(null)

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({ paragraph: false }),
      ParagraphWithStyle,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableWithClass.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCellWithStyle,
      TextStyleWithFontSize,
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
      hasChangesRef.current = true
      setHasChanges(true)
      scheduleAutosave()
    },
  })

  const lastErrorAtRef = useRef<number>(0)
  const flushSave = useCallback(async () => {
    if (!editor) return
    setIsSaving(true)
    try {
      const snapshot = editor.getJSON()
      await updateEditState(editingDocumentIdRef.current, JSON.stringify(snapshot))
      hasChangesRef.current = false
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

    const applyResponse = (res: EditStateResponse) => {
      editingDocumentIdRef.current = res.editingDocumentId ?? documentId
      skipNextChangeRef.current = true
      if (res.format === 'tiptap-json' && res.content) {
        try {
          const parsed = JSON.parse(res.content)
          editor.commands.setContent(parsed)
        } catch {
          editor.commands.setContent(res.content)
        }
      } else {
        // markdown / html / fallback — run through renderDraftToHtml so
        // markdown markers (## headings, **bold**, [//]: # link-refs) are
        // converted to HTML. The renderer passes raw HTML through unchanged,
        // so HTML bootstraps are unaffected.
        const html = renderDraftToHtml(res.content || '')
        editor.commands.setContent(html)
      }
    }

    const load = async () => {
      try {
        let res = await getEditState(documentId)
        if (cancelled) return

        // Recovery path: a saved Tiptap JSON containing literal markdown text
        // means a prior autosave landed before the markdown→HTML fix shipped.
        // Drop the corrupt blob and re-fetch — the backend will re-bootstrap
        // from the original source markdown. Guarded by `recoveryAttempted`
        // so a false-positive (real `**foo**` text the user typed) can't loop.
        if (
          res.format === 'tiptap-json' &&
          res.content &&
          !recoveryAttempted.has(documentId)
        ) {
          try {
            const parsed = JSON.parse(res.content)
            if (looksLikeUnrenderedMarkdown(parsed)) {
              recoveryAttempted.add(documentId)
              console.warn(
                `[DocumentEditor] recovering ${documentId}: stored Tiptap JSON contains markdown literals; resetting edit-state`,
              )
              await resetEditState(documentId)
              if (cancelled) return
              res = await getEditState(documentId)
              if (cancelled) return
            }
          } catch {
            // Parse failure is handled by applyResponse fallback below.
          }
        }

        applyResponse(res)
        setLoadState({ phase: 'ready' })

        // If the backend just produced a fresh HTML conversion, persist it as
        // Tiptap JSON immediately so subsequent loads skip the conversion path.
        if (res.freshConversion) {
          setTimeout(() => {
            if (cancelled) return
            void flushSave()
          }, 0)
        }
      } catch (e: unknown) {
        if (cancelled) return
        const message = e instanceof Error ? e.message : 'Failed to load document'
        setLoadState({ phase: 'error', message })
      }
    }
    void load()

    return () => {
      cancelled = true
    }
  }, [editor, documentId, flushSave])

  // Reflect isEditing in the live editor. `readOnly=true` locks editing off.
  useEffect(() => {
    if (!editor) return
    editor.setEditable(isEditing && !readOnly)
  }, [editor, isEditing, readOnly])

  // Keep flushSaveRef pointing at the current flushSave closure so the unmount
  // effect (empty deps) can call the latest version.
  useEffect(() => {
    flushSaveRef.current = flushSave
  }, [flushSave])

  // Best-effort flush on unmount so a quick close doesn't drop the latest edits.
  // Empty deps so cleanup only runs on real unmount, not on every hasChanges flip.
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      if (hasChangesRef.current) void flushSaveRef.current()
    }
  }, [])

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

  const handleEdit = useCallback(() => {
    if (!editor) return
    editStartBaselineRef.current = editor.getJSON()
    setIsEditing(true)
  }, [editor])

  const handleSave = useCallback(async () => {
    await flushSave()
    setIsEditing(false)
  }, [flushSave])

  const handleCancel = useCallback(() => {
    if (!editor) return
    // If the user never typed anything, just flip out of edit mode — no need
    // to round-trip a no-op write to the server (and no risk of a misleading
    // "Failed to save" toast on a flaky network).
    if (!hasChangesRef.current) {
      setIsEditing(false)
      return
    }
    if (editStartBaselineRef.current) {
      skipNextChangeRef.current = true
      editor.commands.setContent(editStartBaselineRef.current)
    }
    hasChangesRef.current = false
    setHasChanges(false)
    setIsEditing(false)
    // Persist the revert so the on-disk state matches what the user sees —
    // autosave may have already written the in-progress edits.
    void flushSave()
  }, [editor, flushSave])

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
      onFontSize: (size: string) => {
        if (!size) return
        editor
          .chain()
          .focus()
          .setMark('textStyle', { fontSize: `${size}pt` })
          .run()
      },
      onEdit: readOnly ? undefined : handleEdit,
      onSave: handleSave,
      onCancel: handleCancel,
      onDownloadDoc: () => void onExport('DOCX'),
      onDownloadPdf: () => void onExport('PDF'),
    }
  }, [editor, readOnly, handleEdit, handleSave, handleCancel, onExport])

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
        <FormattingToolbar
          isEditing={isEditing}
          isSaving={isSaving}
          hasChanges={hasChanges}
          {...toolbarHandlers}
        />
      )}

      <div className="flex-1 overflow-auto">
        {loadState.phase === 'loading' ? (
          <div className="flex items-center justify-center h-full text-ledger-gray-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Preparing document…
          </div>
        ) : (
          <div
            className="max-w-[820px] mx-auto px-10 py-8 text-black"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '12pt',
              lineHeight: 1.5,
            }}
          >
            <EditorContent
              editor={editor}
              className={cn(
                'focus:outline-none [&_*]:focus:outline-none',
                // Headings — keep weight, drop the size bumps so the doc reads
                // at a uniform 12pt Times New Roman.
                '[&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
                '[&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2',
                '[&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2',
                // Paragraphs — moderate spacing for readability between
                // numbered paragraphs in court drafts.
                '[&_p]:my-2 [&_p]:leading-normal',
                // Lists
                '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1',
                '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1',
                '[&_li]:my-0.5',
                '[&_li_ul]:list-[circle] [&_li_ul]:pl-6 [&_li_ul]:my-0',
                '[&_li_ol]:list-[lower-alpha] [&_li_ol]:pl-6 [&_li_ol]:my-0',
                // Default tables — visible borders so real tables look like tables.
                '[&_table]:w-full [&_table]:border-collapse [&_table]:my-2',
                '[&_table]:border [&_table]:border-ledger-gray-300',
                '[&_th]:border [&_th]:border-ledger-gray-300 [&_th]:px-3 [&_th]:py-2',
                '[&_th]:bg-ledger-gray-100 [&_th]:font-semibold [&_th]:text-left',
                '[&_td]:border [&_td]:border-ledger-gray-300 [&_td]:px-3 [&_td]:py-2',
                // Cause-title same-line Mob+Role table — explicitly borderless
                // so the role tag sits flush right next to the mobile number.
                '[&_table.cause-title-row]:my-0 [&_table.cause-title-row]:border-0',
                '[&_table.cause-title-row_td]:border-0 [&_table.cause-title-row_td]:p-0',
                '[&_table.cause-title-row_th]:border-0 [&_table.cause-title-row_th]:p-0',
                // Signature blocks (post-PRAYER 3-col, post-VERIFICATION 2-col).
                // Without explicit overrides the default [&_table]:border rules
                // above paint visible cell boxes around the row.
                '[&_table.signature-block]:my-2 [&_table.signature-block]:border-0',
                '[&_table.signature-block_td]:border-0 [&_table.signature-block_td]:p-0',
                '[&_table.signature-block_th]:border-0 [&_table.signature-block_th]:p-0',
                // MP-HC bail-form & similar court-form tables. Black 1px
                // borders, white background, 6/10 cell padding. Mirrored in
                // index.css .legal-document table.court-form rule and in
                // DraftExportHtmlBuilder.java EXPORT_CSS so PDF/DOCX match.
                '[&_table.court-form]:w-full [&_table.court-form]:border-collapse [&_table.court-form]:my-2 [&_table.court-form]:bg-white',
                '[&_table.court-form_td]:border [&_table.court-form_td]:border-black [&_table.court-form_td]:px-[10px] [&_table.court-form_td]:py-[6px] [&_table.court-form_td]:bg-white [&_table.court-form_td]:align-top',
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

    </div>
  )
}
