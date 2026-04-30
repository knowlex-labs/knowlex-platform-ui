import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Trash2, AlertCircle, RotateCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditorFormatting } from '@/hooks/use-editor-formatting'
import { FormattingToolbar } from '@/components/editor'
import {
  renderDraftToHtml,
  printDraft,
  buildExportBodyHtml,
} from '@/lib/draft-renderer'
import { exportGeneratedDocument } from '@knowlex/core/api/doc-processing-api'
import { draftsApi } from '@knowlex/core/api/drafts-api'
import type { CitationResult } from '@knowlex/core/api/drafts-api'
import type { Draft } from '@knowlex/core/types'
import { useToast } from '@/hooks/use-toast'

/**
 * Walk all <strong> elements in el. For each one whose text matches a key in
 * citationMap, wrap it in an <a data-citation> anchor (skip if already wrapped).
 */
function applyCitationLinks(
  el: HTMLElement,
  citationMap: Map<string, { url: string; external: boolean }>
): void {
  if (citationMap.size === 0) return
  el.querySelectorAll<HTMLElement>('strong').forEach((strong) => {
    const text = strong.textContent?.trim() ?? ''
    const info = citationMap.get(text)
    if (!info || strong.closest('a[data-citation]')) return
    const a = document.createElement('a')
    a.setAttribute('data-citation', 'true')
    a.dataset.citationUrl = info.url
    a.dataset.citationExternal = info.external ? 'true' : 'false'
    a.style.cssText =
      'text-decoration:underline;text-decoration-color:rgb(99,102,241);text-decoration-thickness:1px;cursor:pointer;'
    strong.replaceWith(a)
    a.appendChild(strong)
  })
}

// Module-level cache: survives unmount/remount race where the old component's
// state update hasn't been processed before the new instance mounts.
const draftContentCache = new Map<string, { title: string; content: string }>()

// ─── A4 paper layout constants (96 dpi) ───────────────────────────────────────
const OUTER_BG_LIGHT = '#f1f5f9' // light background between pages (ledger-gray-100)
const A4_TOTAL_H = 1122          // 297 mm × 3.7795 px/mm
const PAGE_V_PAD = 96            // 1 inch top/bottom padding inside the paper
const PAGE_H_PAD = 106           // ~1.1 inch left/right padding
const A4_CONTENT_H = A4_TOTAL_H - PAGE_V_PAD * 2  // 930 px of content per page
const PAGE_GAP = 28              // dark gap between pages (px)

/**
 * Return innerHTML with page-spacer divs removed.
 * Always call this before saving so spacers are never persisted.
 */
function getCleanHtml(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-page-spacer]').forEach((s) => s.remove())
  return clone.innerHTML
}

/**
 * Walk the direct children of the editor element, measure their heights,
 * and insert visual page-break spacers between pages.
 *
 * Each spacer renders:
 *   [white: remaining space on current page] | [bg gap] | [white: next-page top margin]
 *
 * The spacer uses negative horizontal margins to stretch to the full paper width,
 * making the gap visually span edge-to-edge like Google Docs.
 */
function repaginateEditor(el: HTMLElement): void {
  // Remove previous spacers first so measurements are clean
  el.querySelectorAll<HTMLElement>('[data-page-spacer]').forEach((s) => s.remove())

  const children = Array.from(el.children) as HTMLElement[]
  const inserts: { before: HTMLElement; remaining: number }[] = []
  let pageUsed = 0

  for (const child of children) {
    const cs = window.getComputedStyle(child)
    const mT = parseFloat(cs.marginTop) || 0
    const mB = parseFloat(cs.marginBottom) || 0
    const totalH = child.offsetHeight + mT + mB

    if (pageUsed > 0 && pageUsed + totalH > A4_CONTENT_H) {
      // Block would overflow → page break before this child
      inserts.push({ before: child, remaining: A4_CONTENT_H - pageUsed })
      pageUsed = totalH % A4_CONTENT_H
    } else {
      pageUsed = (pageUsed + totalH) % A4_CONTENT_H
    }
  }

  // Insert spacers in reverse so DOM indices stay valid
  for (let i = inserts.length - 1; i >= 0; i--) {
    const { before, remaining } = inserts[i]
    const spacerH = remaining + PAGE_GAP + PAGE_V_PAD

    const div = document.createElement('div')
    div.setAttribute('data-page-spacer', 'true')
    div.contentEditable = 'false'
    div.style.cssText = [
      `height:${spacerH}px`,
      // Stretch to full paper width by cancelling the paper's horizontal padding
      `margin:0 -${PAGE_H_PAD}px`,
      `padding:0`,
      `display:block`,
      `user-select:none`,
      `pointer-events:none`,
      // Gradient: white (rest of page) → gap color → white (next page top margin)
      `background:linear-gradient(to bottom,` +
        `white 0px,` +
        `white ${remaining}px,` +
        `var(--page-gap-bg, ${OUTER_BG_LIGHT}) ${remaining}px,` +
        `var(--page-gap-bg, ${OUTER_BG_LIGHT}) ${remaining + PAGE_GAP}px,` +
        `white ${remaining + PAGE_GAP}px` +
        `)`,
    ].join(';')

    before.parentElement!.insertBefore(div, before)
  }
}

interface DraftPreviewTabProps {
  draft: Draft
  caseId: string
  onSaveLocal: (id: string, title: string, content: string) => void
  onSaveToBackend: (id: string, title: string, content: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onSendToChat: (text: string) => void
  onDirtyChange?: (isDirty: boolean) => void
  onRetry?: (draftId: string) => void
}

export function DraftPreviewTab({
  draft,
  caseId,
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
      <div className="flex flex-col h-full">
        {/* Greyed-out toolbar placeholder */}
        <div className="flex-shrink-0 h-9 border-b border-ledger-gray-200 bg-nb-panel flex items-center px-3 gap-2 opacity-40 pointer-events-none select-none">
          {[28, 28, 28, 16, 28, 28, 28, 16, 36, 16, 28, 28].map((w, i) => (
            <div key={i} className="h-4 rounded bg-ledger-gray-200 animate-pulse" style={{ width: w }} />
          ))}
        </div>

        <div className="flex-1 overflow-auto bg-ledger-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm">
            <div className="h-14 w-14 rounded-full bg-kx-primary-50 dark:bg-kx-primary-900/30 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-kx-primary-600 dark:text-kx-primary-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-ledger-gray-800 dark:text-ledger-gray-100">
                Generating your draft
              </p>
              <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400">
                This usually takes 1–2 minutes. You can navigate away and come back — your draft will be ready when you return.
              </p>
            </div>
          </div>
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
      caseId={caseId}
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
  caseId,
  onSaveLocal,
  onSaveToBackend,
  onDirtyChange,
}: DraftPreviewTabProps) {
  const cached = draftContentCache.get(draft.id)
  const [title, setTitle] = useState(cached?.title ?? draft.title)
  const [hasChanges, setHasChanges] = useState(!!cached)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const editorRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track whether we caused the draft.content change (to avoid re-rendering the editor)
  const isLocalEditRef = useRef(false)
  // Track whether we mounted with cached content (skip first sync effect)
  const mountedWithCacheRef = useRef(!!cached)

  const markDirty = useCallback(() => {
    setHasChanges(true)
    onDirtyChange?.(true)
  }, [onDirtyChange])

  const formatting = useEditorFormatting(editorRef, markDirty)

  // ─── Citations ────────────────────────────────────────────────────────────
  const citationMapRef = useRef<Map<string, { url: string; external: boolean }>>(new Map())

  useEffect(() => {
    draftsApi.getCitations(caseId, draft.id).then((results: CitationResult[]) => {
      const map = new Map<string, { url: string; external: boolean }>()
      for (const r of results) {
        const url = r.resolved && r.judgmentId
          ? `/judgments/${r.judgmentId}`
          : r.sccOnlineUrl
        map.set(r.caseName, { url, external: !r.resolved || !r.judgmentId })
      }
      citationMapRef.current = map
      if (editorRef.current) applyCitationLinks(editorRef.current, map)
    }).catch(() => {
      // citations are best-effort — silently ignore failures
    })
  }, [caseId, draft.id])

  // Click handler for citation links (event delegation on scroll container)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const handler = (e: MouseEvent) => {
      if (isEditing) return
      const a = (e.target as HTMLElement).closest('a[data-citation]') as HTMLAnchorElement | null
      if (!a) return
      e.preventDefault()
      const url = a.dataset.citationUrl!
      const external = a.dataset.citationExternal === 'true'
      window.open(url, '_blank', external ? 'noopener,noreferrer' : '')
    }
    container.addEventListener('click', handler)
    return () => container.removeEventListener('click', handler)
  }, [isEditing])

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Run repagination and update page counts - always shows page breaks */
  const repaginate = useCallback(() => {
    if (!editorRef.current) return
    repaginateEditor(editorRef.current)
    setTotalPages(editorRef.current.querySelectorAll('[data-page-spacer]').length + 1)
  }, [])

  // ─── Saving ───────────────────────────────────────────────────────────────

  // Capture current editor content (clean, no spacers) and save to local state + cache
  const flushToLocalState = useCallback(() => {
    if (editorRef.current) {
      isLocalEditRef.current = true
      const content = getCleanHtml(editorRef.current)
      draftContentCache.set(draft.id, { title, content })
      onSaveLocal(draft.id, title, content)
    }
  }, [draft.id, title, onSaveLocal])

  // ─── Sync from external changes (polling / new draft opened) ──────────────
  useEffect(() => {
    if (mountedWithCacheRef.current) {
      mountedWithCacheRef.current = false
      return
    }
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
        draft.templateType,
        draft.contentFormat
      )
      editorRef.current.innerHTML = html
      // Re-paginate after setting new content, then re-apply citation links
      setTimeout(() => {
        repaginate()
        if (editorRef.current) applyCitationLinks(editorRef.current, citationMapRef.current)
      }, 80)
    }
  }, [draft.id, draft.content, draft.title, draft.sections, draft.templateType, repaginate])

  // ─── Track latest content for unmount save ────────────────────────────────
  const latestContentRef = useRef<string | null>(null)
  const latestTitleRef = useRef(title)
  latestTitleRef.current = title

  const handleEditorChange = useCallback(() => {
    if (editorRef.current) {
      // Always store clean HTML (no spacers) in the ref
      latestContentRef.current = getCleanHtml(editorRef.current)
    }
  }, [])

  // ─── Auto-save on input (debounced 500 ms) ────────────────────────────────
  const handleEditorInput = useCallback(() => {
    if (!isEditing) return
    setHasChanges(true)
    onDirtyChange?.(true)
    handleEditorChange()

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      flushToLocalState()
      repaginate()
    }, 500)
  }, [isEditing, onDirtyChange, handleEditorChange, flushToLocalState, repaginate])

  // ─── Flush on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      if (latestContentRef.current !== null) {
        draftContentCache.set(draft.id, { title: latestTitleRef.current, content: latestContentRef.current })
        onSaveLocal(draft.id, latestTitleRef.current, latestContentRef.current)
        onSaveToBackend(draft.id, latestTitleRef.current, latestContentRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id])

  // ─── Flush on tab hide ────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && editorRef.current) {
        flushToLocalState()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flushToLocalState])

  // ─── Export handlers ──────────────────────────────────────────────────────
  const getCurrentContent = useCallback(
    () => (editorRef.current ? getCleanHtml(editorRef.current) : draft.content),
    [draft.content]
  )
  const getSections = useCallback(
    () => (draft.sections?.length ? draft.sections : undefined),
    [draft.sections]
  )

  const handlePrint = useCallback(
    () => printDraft(title, getCurrentContent(), getSections(), draft.contentFormat),
    [title, getCurrentContent, getSections, draft.contentFormat]
  )

  const handleServerExport = useCallback(async (format: 'PDF' | 'DOCX' | 'MARKDOWN') => {
    try {
      const content = getCurrentContent()
      const sections = getSections()
      const htmlBody = buildExportBodyHtml(content, sections)
      const markdownBody = format === 'MARKDOWN' && !content.trim().startsWith('<') ? content : undefined
      await exportGeneratedDocument(draft.id, format, title, htmlBody, markdownBody)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: message,
      })
    }
  }, [draft.id, title, getCurrentContent, getSections, toast])

  const handleDownloadDoc = useCallback(() => {
    void handleServerExport('DOCX')
  }, [handleServerExport])

  const handleDownloadPdf = useCallback(() => {
    void handleServerExport('PDF')
  }, [handleServerExport])

  const handleDownloadMd = useCallback(() => {
    void handleServerExport('MARKDOWN')
  }, [handleServerExport])

  // ─── Explicit save (Ctrl+S / Save button) ────────────────────────────────
  const handleSaveToBackend = useCallback(async () => {
    if (!editorRef.current) return
    setIsSaving(true)
    try {
      isLocalEditRef.current = true
      await onSaveToBackend(draft.id, title, getCleanHtml(editorRef.current))
      draftContentCache.delete(draft.id)
      setHasChanges(false)
      onDirtyChange?.(false)
    } finally {
      setIsSaving(false)
    }
  }, [draft.id, title, onSaveToBackend, onDirtyChange])

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
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

  // ─── Handle save & exit edit mode ────────────────────────────────────────
  const handleSaveAndExitEditMode = useCallback(async () => {
    await handleSaveToBackend()
    setIsEditing(false)
  }, [handleSaveToBackend])

  // ─── Handle cancel editing ────────────────────────────────────────────────
  const handleCancelEdit = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    draftContentCache.delete(draft.id)
    setHasChanges(false)
    onDirtyChange?.(false)
    if (editorRef.current) {
      const hasSections = draft.sections && draft.sections.length > 0
      const html = renderDraftToHtml(
        draft.content,
        hasSections ? draft.sections : undefined,
        draft.templateType,
        draft.contentFormat
      )
      editorRef.current.innerHTML = html
      setTimeout(() => {
        repaginate()
        if (editorRef.current) applyCitationLinks(editorRef.current, citationMapRef.current)
      }, 50)
    }
    setIsEditing(false)
  }, [draft, onDirtyChange, repaginate])

  // ─── Repaginate when entering/leaving edit mode ───────────────────────────
  useEffect(() => {
    repaginate()
  }, [isEditing, repaginate])

  // ─── Initial HTML ─────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialHtml = useMemo(() => {
    const cachedEntry = draftContentCache.get(draft.id)
    if (cachedEntry) return cachedEntry.content
    const hasSections = draft.sections && draft.sections.length > 0
    return renderDraftToHtml(
      draft.content,
      hasSections ? draft.sections : undefined,
      draft.templateType,
      draft.contentFormat
    )
  }, [draft.id])

  // ─── Initial pagination (runs once after first render) ───────────────────
  useEffect(() => {
    // Small delay: let the browser finish painting the injected HTML
    const timer = setTimeout(() => {
      repaginate()
      if (editorRef.current) applyCitationLinks(editorRef.current, citationMapRef.current)
    }, 120)
    return () => clearTimeout(timer)
  }, [initialHtml, repaginate])

  // ─── Scroll → page counter ────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !editorRef.current) return
    const containerEl = scrollContainerRef.current
    const containerMidY =
      containerEl.getBoundingClientRect().top + containerEl.clientHeight / 2

    const spacers = editorRef.current.querySelectorAll<HTMLElement>('[data-page-spacer]')
    let page = 1
    spacers.forEach((spacer) => {
      const rect = spacer.getBoundingClientRect()
      // Once the middle of the spacer (= page gap) scrolls above the viewport midpoint,
      // the user is on the next page.
      if (rect.top + rect.height / 2 < containerMidY) page++
    })
    setCurrentPage(page)
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <FormattingToolbar
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onBold={formatting.handleBold}
        onItalic={formatting.handleItalic}
        onUnderline={formatting.handleUnderline}
        onAlignLeft={formatting.handleAlignLeft}
        onAlignCenter={formatting.handleAlignCenter}
        onAlignRight={formatting.handleAlignRight}
        onBulletList={formatting.handleBulletList}
        onNumberedList={formatting.handleNumberedList}
        onFontSize={formatting.handleFontSize}
        onSave={handleSaveAndExitEditMode}
        onCancel={handleCancelEdit}
        onPrint={handlePrint}
        onDownloadDoc={handleDownloadDoc}
        onDownloadPdf={handleDownloadPdf}
        onDownloadMd={handleDownloadMd}
        isSaving={isSaving}
        hasChanges={hasChanges}
        documentTitle={title}
        className="bg-nb-panel"
      />

      {/* Document viewer */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-ledger-gray-100 [--page-gap-bg:#f1f5f9] dark:[--page-gap-bg:#1e293b]"
        onScroll={handleScroll}
      >
        {/* Sticky page badge */}
        <div className="sticky top-3 z-10 h-0 overflow-visible flex justify-end pr-5 pointer-events-none">
          <span className="bg-ledger-gray-600/80 text-white text-xs px-3 py-1 rounded-full font-mono tracking-wide select-none">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* A4 paper */}
        <div
          ref={editorRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={isEditing ? handleEditorInput : undefined}
          onBlur={isEditing ? flushToLocalState : undefined}
          className={cn(
            'legal-document focus:outline-none bg-white',
            isEditing ? 'cursor-text' : 'cursor-default'
          )}
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '12pt',
            lineHeight: '1.6',
            color: '#000',
            width: '794px',
            maxWidth: `calc(100% - ${PAGE_H_PAD}px)`,
            minHeight: `${A4_TOTAL_H}px`,
            padding: `${PAGE_V_PAD}px ${PAGE_H_PAD}px`,
            margin: '12px auto 20px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          }}
          dangerouslySetInnerHTML={{ __html: initialHtml }}
        />
      </div>
    </div>
  )
}
