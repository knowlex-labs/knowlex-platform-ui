import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, FileDown, FileText, ChevronDown, Wand2, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTextSelection } from '@/hooks/use-text-selection'
import { renderDraftContent, renderDraftSections, buildExportHtml, buildExportText, getTemplateRenderer } from '@/lib/draft-renderer'
import {
  htmlToDocument,
  documentToHtml,
  serializeDocument,
  deserializeDocument,
  isRichDocumentString,
} from '@/lib/drafts/document-serializer'
import type { Draft } from '@/types'

interface DraftPreviewTabProps {
  draft: Draft
  onSave: (id: string, title: string, content: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onSendToChat: (text: string) => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function DraftPreviewTab({
  draft,
  onSave,
  onDelete,
  onSendToChat,
  onDirtyChange,
}: DraftPreviewTabProps) {
  const [title, setTitle] = useState(draft.title)
  const [content, setContent] = useState(draft.content)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const { selection, clearSelection } = useTextSelection(editorRef)

  // Sync with draft prop changes - only when draft ID changes or if we saved
  useEffect(() => {
    setTitle(draft.title)
    setContent(draft.content)
    setHasChanges(false)
    // We intentionally don't call onDirtyChange(false) here because if the parent
    // caused this re-render by saving/switching, it already knows the state.
    // Calling it might cause a loop if the parent updates state in response.
  }, [draft.id, draft.title, draft.content])

  // Track changes and notify parent
  useEffect(() => {
    const changed = title !== draft.title || content !== draft.content
    setHasChanges(changed)
    onDirtyChange?.(changed)
  }, [title, content, draft.title, draft.content, onDirtyChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setDownloadMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts (Ctrl/Cmd + S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      const isModifierPressed = e.ctrlKey || e.metaKey

      if (isModifierPressed && e.key === 's') {
        e.preventDefault()
        if (hasChanges) {
          handleSave()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, title, content])

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const hasSections = draft.sections && draft.sections.length > 0

  // Formatting commands for rich text editor
  const execFormatCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  const handleBold = () => execFormatCommand('bold')
  const handleItalic = () => execFormatCommand('italic')
  const handleUnderline = () => execFormatCommand('underline')
  const handleAlignLeft = () => execFormatCommand('justifyLeft')
  const handleAlignCenter = () => execFormatCommand('justifyCenter')
  const handleAlignRight = () => execFormatCommand('justifyRight')
  const handleBulletList = () => execFormatCommand('insertUnorderedList')
  const handleNumberedList = () => execFormatCommand('insertOrderedList')
  const handleFontSize = useCallback((size: string) => {
    // Use CSS styling instead of execCommand('fontSize') which only supports 1-7
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    // Create a span with the font size
    const span = document.createElement('span')
    span.style.fontSize = `${size}pt`

    try {
      range.surroundContents(span)
      selection.removeAllRanges()
      editorRef.current?.focus()
      setHasChanges(true)
      onDirtyChange?.(true)
    } catch {
      // If surroundContents fails (e.g., selection crosses element boundaries),
      // extract contents and wrap them
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
      editorRef.current?.focus()
      setHasChanges(true)
      onDirtyChange?.(true)
    }
  }, [onDirtyChange])

  // Handle content changes from contentEditable
  // We don't update content on every keystroke - only on save
  // This allows the DOM to maintain its formatting state
  const handleEditorInput = useCallback(() => {
    // Mark as changed but don't extract content yet
    // The full content with formatting is extracted on save
    setHasChanges(true)
    onDirtyChange?.(true)
  }, [onDirtyChange])

  const handleSave = useCallback(() => {
    if (editorRef.current) {
      // Parse the DOM to get a RichDocument with all formatting
      const richDoc = htmlToDocument(editorRef.current.innerHTML)
      // Serialize to JSON for storage
      const serializedContent = serializeDocument(richDoc)
      onSave(draft.id, title, serializedContent)
      setContent(serializedContent)
    } else {
      onSave(draft.id, title, content)
    }
    setHasChanges(false)
    onDirtyChange?.(false)
  }, [draft.id, title, content, onSave, onDirtyChange])

  const handleDelete = () => {
    if (hasChanges) {
      const confirmDelete = window.confirm('You have unsaved changes. Are you sure you want to delete this draft?')
      if (!confirmDelete) return
    }
    onDelete(draft.id)
  }

  const handleFixWithAI = () => {
    if (selection?.text) {
      onSendToChat(`Please fix or improve the following text:\n\n"${selection.text}"`)
      clearSelection()
    }
  }

  const handleDownloadTxt = () => {
    const text = buildExportText(content, hasSections ? draft.sections : undefined)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadDoc = () => {
    const htmlContent = buildExportHtml(title, content, hasSections ? draft.sections : undefined)
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = () => {
    const htmlContent = buildExportHtml(title, content, hasSections ? draft.sections : undefined)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  // Use template-based rendering if templateType is available, otherwise fallback
  // Also handles RichDocument JSON content
  const renderedHtml = (() => {
    if (hasSections) {
      return renderDraftSections(draft.sections)
    }

    // Check if content is a serialized RichDocument (JSON)
    if (isRichDocumentString(content)) {
      const richDoc = deserializeDocument(content)
      if (richDoc) {
        return documentToHtml(richDoc)
      }
    }

    // For legacy plain text content with templateType, use template renderer
    if (draft.templateType) {
      const templateRenderer = getTemplateRenderer(draft.templateType)
      return templateRenderer(content)
    }

    // Fallback: render as basic content
    return renderDraftContent(content)
  })()

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ledger-gray-200 bg-ledger-gray-50">
        <div className="flex-1 mr-4 flex items-center gap-2">
          <Label htmlFor="draft-title" className="sr-only">
            Draft Title
          </Label>
          <Input
            id="draft-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setHasChanges(true)
              onDirtyChange?.(true)
            }}
            className="text-sm font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 max-w-xs"
            placeholder="Untitled Draft"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Download Dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            >
              <Download className="h-3.5 w-3.5" />
              Download
              <ChevronDown className="h-3 w-3" />
            </Button>
            {downloadMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded border border-ledger-gray-200 bg-ledger-white shadow-md z-50">
                <button
                  onClick={() => { handleDownloadPdf(); setDownloadMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                >
                  <FileDown className="h-4 w-4" />
                  PDF
                </button>
                <button
                  onClick={() => { handleDownloadDoc(); setDownloadMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                >
                  <FileText className="h-4 w-4" />
                  DOC
                </button>
                <button
                  onClick={() => { handleDownloadTxt(); setDownloadMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                >
                  <FileText className="h-4 w-4" />
                  TXT
                </button>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-ledger-gray-200 bg-white">
        <button
          onClick={handleBold}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={handleItalic}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={handleUnderline}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-ledger-gray-300 mx-1" />
        <button
          onClick={handleAlignLeft}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleAlignCenter}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onClick={handleAlignRight}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-ledger-gray-300 mx-1" />
        <select
          onChange={(e) => handleFontSize(e.target.value)}
          className="h-8 px-2 text-sm border border-ledger-gray-200 rounded hover:bg-ledger-gray-50 focus:outline-none focus:ring-1 focus:ring-ledger-gray-300"
          defaultValue="12"
          title="Font Size"
        >
          <option value="8">8pt</option>
          <option value="10">10pt</option>
          <option value="12">12pt</option>
          <option value="14">14pt</option>
          <option value="16">16pt</option>
          <option value="18">18pt</option>
          <option value="24">24pt</option>
        </select>
        <div className="w-px h-5 bg-ledger-gray-300 mx-1" />
        <button
          onClick={handleBulletList}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={handleNumberedList}
          className="p-2 rounded hover:bg-ledger-gray-100 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          className="h-full border border-ledger-gray-200 rounded-lg overflow-auto focus:outline-none focus:ring-2 focus:ring-ledger-gray-300 bg-white"
          style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.8', fontSize: '12pt', minHeight: '400px', padding: '40px 60px' }}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
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

      {/* Footer - Keyboard shortcuts hint */}
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
