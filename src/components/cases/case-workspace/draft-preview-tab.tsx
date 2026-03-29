import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Trash2, AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditorFormatting } from '@/hooks/use-editor-formatting'
import { FormattingToolbar } from './formatting-toolbar'
import {
  renderDraftToHtml,
  printDraft,
  downloadAsPdf,
  downloadAsDoc,
} from '@/lib/draft-renderer'
import type { Draft } from '@/types'

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
  // --- Pending state: A4 skeleton document ---
  if (draft.status === 'pending') {
    return (
      <div className="flex flex-col h-full">
        {/* Greyed-out toolbar placeholder */}
        <div className="flex-shrink-0 h-11 border-b border-ledger-gray-200 dark:border-ledger-gray-700 bg-white dark:bg-ledger-gray-900 flex items-center px-4 gap-2 opacity-40 pointer-events-none select-none">
          {[48, 32, 40, 40, 28, 28, 28, 28].map((w, i) => (
            <div key={i} className={`h-5 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse`} style={{ width: w }} />
          ))}
        </div>

        {/* Outer paper background */}
        <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800 relative">
          {/* Floating status pill */}
          <div className="sticky top-3 z-10 h-0 overflow-visible flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-kx-primary-700/90 text-white text-xs px-4 py-1.5 rounded-full shadow-lg font-medium tracking-wide select-none backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white/90" />
              </span>
              Generating draft — this usually takes 1–2 minutes
            </div>
          </div>

          {/* A4 paper skeleton */}
          <div
            className="bg-white mx-auto my-4 shadow-sm"
            style={{
              width: '794px',
              maxWidth: 'calc(100% - 48px)',
              minHeight: '1122px',
              padding: '96px 106px',
            }}
          >
            {/* Case caption / court header */}
            <div className="flex flex-col items-center gap-3 mb-10">
              <div className="h-4 w-48 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
              <div className="h-4 w-64 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
              <div className="h-px w-full bg-ledger-gray-200 dark:bg-ledger-gray-700 mt-2" />
            </div>

            {/* Document title */}
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="h-6 w-72 rounded bg-ledger-gray-300 dark:bg-ledger-gray-600 animate-pulse" />
              <div className="h-4 w-48 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
            </div>

            {/* Parties section */}
            <div className="flex gap-8 mb-8">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded bg-ledger-gray-300 dark:bg-ledger-gray-600 animate-pulse" />
                <div className="h-4 w-full rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
              </div>
              <div className="w-px bg-ledger-gray-200 dark:bg-ledger-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded bg-ledger-gray-300 dark:bg-ledger-gray-600 animate-pulse" />
                <div className="h-4 w-full rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
              </div>
            </div>

            <div className="h-px w-full bg-ledger-gray-200 dark:bg-ledger-gray-700 mb-8" />

            {/* Body paragraphs */}
            {[
              [100, 88, 95, 75],
              [92, 100, 80, 88, 60],
              [100, 72, 90, 85, 95, 50],
              [88, 100, 78, 92, 65],
            ].map((widths, paraIdx) => (
              <div key={paraIdx} className="mb-6 space-y-2">
                <div className="h-3.5 w-28 rounded bg-ledger-gray-300 dark:bg-ledger-gray-600 animate-pulse mb-3" />
                {widths.map((w, lineIdx) => (
                  <div
                    key={lineIdx}
                    className="h-3.5 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ))}

            {/* Prayer section */}
            <div className="mt-10 space-y-2">
              <div className="h-3.5 w-36 rounded bg-ledger-gray-300 dark:bg-ledger-gray-600 animate-pulse mb-3" />
              {[95, 80, 88, 70, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-3.5 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>

            {/* Signature block */}
            <div className="mt-16 flex justify-between">
              <div className="space-y-2">
                <div className="h-3.5 w-32 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                <div className="h-3.5 w-24 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-32 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                <div className="h-3.5 w-24 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Status footer */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-ledger-gray-200 dark:border-ledger-gray-700 bg-ledger-gray-50 dark:bg-ledger-gray-900">
          <p className="text-xs text-ledger-gray-400 dark:text-ledger-gray-500">
            You can continue working while the draft generates.
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
  onDirtyChange,
}: DraftPreviewTabProps) {
  const cached = draftContentCache.get(draft.id)
  const [title, setTitle] = useState(cached?.title ?? draft.title)
  const [hasChanges, setHasChanges] = useState(!!cached)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
      // Re-paginate after setting new content
      setTimeout(() => repaginate(), 80)
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

  // ─── Handle mode switching ────────────────────────────────────────────────
  useEffect(() => {
    // Always show page breaks (like PDF) - repaginate handles this
    repaginate()
  }, [isEditing, repaginate])

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
  const handleDownloadDoc = useCallback(
    () => downloadAsDoc(title, getCurrentContent(), getSections(), draft.contentFormat),
    [title, getCurrentContent, getSections, draft.contentFormat]
  )
  const handleDownloadPdf = useCallback(
    () => downloadAsPdf(title, getCurrentContent(), getSections(), draft.contentFormat),
    [title, getCurrentContent, getSections, draft.contentFormat]
  )

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

  // ─── Handle save completion ─────────────────────────────────────────────────
  const handleSaveAndExitEditMode = useCallback(async () => {
    await handleSaveToBackend()
    setIsEditing(false)
  }, [handleSaveToBackend])

  // ─── Handle cancel editing ─────────────────────────────────────────────────
  const handleCancelEdit = useCallback(() => {
    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    // Discard local changes by reloading from cache or original content
    draftContentCache.delete(draft.id)
    setHasChanges(false)
    onDirtyChange?.(false)
    // Reload original content
    if (editorRef.current) {
      const hasSections = draft.sections && draft.sections.length > 0
      const html = renderDraftToHtml(
        draft.content,
        hasSections ? draft.sections : undefined,
        draft.templateType,
        draft.contentFormat
      )
      editorRef.current.innerHTML = html
      // Repaginate after content is set
      setTimeout(() => repaginate(), 50)
    }
    setIsEditing(false)
  }, [draft, onDirtyChange, repaginate])

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
    const timer = setTimeout(() => repaginate(), 120)
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
      {/* Formatting Toolbar */}
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
        isSaving={isSaving}
        hasChanges={hasChanges}
        documentTitle={title}
        className="bg-ledger-white dark:bg-ledger-gray-900"
      />

      {/* ── Document viewer: light background, A4 paper centered ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800 [--page-gap-bg:#f1f5f9] dark:[--page-gap-bg:#1e293b]"
        onScroll={handleScroll}
      >
        {/* Sticky page badge — floats top-right while scrolling */}
        <div className="sticky top-3 z-10 h-0 overflow-visible flex justify-end pr-5 pointer-events-none">
          <span className="bg-ledger-gray-600/80 text-white text-xs px-3 py-1 rounded-full font-mono tracking-wide select-none">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* A4 paper — the actual contentEditable editor */}
        <div
          ref={editorRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={isEditing ? handleEditorInput : undefined}
          onBlur={isEditing ? flushToLocalState : undefined}
          className={cn('legal-document focus:outline-none bg-white', !isEditing && 'cursor-default')}
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '12pt',
            lineHeight: '1.6',
            color: '#000',
            width: '794px',
            maxWidth: `calc(100% - ${PAGE_H_PAD}px)`,
            minHeight: `${A4_TOTAL_H}px`,
            padding: `${PAGE_V_PAD}px ${PAGE_H_PAD}px`,
            margin: '16px auto 24px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          }}
          dangerouslySetInnerHTML={{ __html: initialHtml }}
        />
      </div>

      {/* Status footer */}
      <div className="px-4 py-2 border-t border-ledger-gray-200 dark:border-ledger-gray-700 bg-ledger-gray-50 dark:bg-ledger-gray-900 flex items-center justify-between">
        <p className="text-xs text-ledger-gray-500">
          {hasChanges ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</span>
          ) : (
            `Last saved: ${draft.updatedAt.toLocaleString()}`
          )}
        </p>
        <p className="text-xs text-ledger-gray-400 dark:text-ledger-gray-500" />
      </div>
    </div>
  )
}
