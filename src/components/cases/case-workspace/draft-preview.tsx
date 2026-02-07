import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, Save, FileDown, FileText, ChevronDown, X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { renderDraftContent, renderDraftSections, buildExportHtml, buildExportText, getTemplateRenderer } from '@/lib/draft-renderer'
import {
  htmlToDocument,
  documentToHtml,
  serializeDocument,
  deserializeDocument,
  isRichDocumentString,
} from '@/lib/drafts/document-serializer'
import type { DraftSection } from '@/types'

interface DraftPreviewProps {
  title: string
  content: string
  sections?: DraftSection[]
  templateType?: string  // e.g., 'interim-application', 'notice', 'affidavit'
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, content: string) => void | Promise<void>
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
}

export function DraftPreview({
  title,
  content,
  sections,
  templateType,
  isOpen,
  onClose,
  onSave,
  onContentChange,
  onTitleChange,
}: DraftPreviewProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const [localContent, setLocalContent] = useState(content)
  const [hasChanges, setHasChanges] = useState(false)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Sync localTitle and localContent with props
  useEffect(() => {
    setLocalTitle(title)
    setLocalContent(content)
  }, [title, content])

  const handleTitleBlur = () => {
    onTitleChange(localTitle)
  }

  // Track changes
  useEffect(() => {
    const changed = localTitle !== title || localContent !== content
    setHasChanges(changed)
  }, [localTitle, localContent, title, content])

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
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierPressed = e.ctrlKey || e.metaKey

      if (isModifierPressed && e.key === 's') {
        e.preventDefault()
        if (hasChanges) {
          handleSave()
        }
      }

      // Escape to close (with warning if unsaved)
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasChanges, localTitle, localContent])

  const hasSections = sections && sections.length > 0

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
    } catch {
      // If surroundContents fails (e.g., selection crosses element boundaries),
      // extract contents and wrap them
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
      editorRef.current?.focus()
      setHasChanges(true)
    }
  }, [])

  // Handle content changes from contentEditable
  // We don't update content on every keystroke - only mark as changed
  const handleEditorInput = useCallback(() => {
    setHasChanges(true)
  }, [])

  const handleDownloadTxt = () => {
    const text = buildExportText(localContent, sections)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${localTitle.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadDoc = () => {
    const htmlContent = buildExportHtml(localTitle, localContent, sections)
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${localTitle.replace(/[^a-z0-9]/gi, '_')}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = () => {
    const htmlContent = buildExportHtml(localTitle, localContent, sections)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const handleSave = useCallback(() => {
    if (editorRef.current) {
      // Parse the DOM to get a RichDocument with all formatting
      const richDoc = htmlToDocument(editorRef.current.innerHTML)
      // Serialize to JSON for storage
      const serializedContent = serializeDocument(richDoc)
      setLocalContent(serializedContent)
      onContentChange(serializedContent)
      onSave(localTitle, serializedContent)
    } else {
      onSave(localTitle, localContent)
    }
    setHasChanges(false)
  }, [localTitle, localContent, onSave, onContentChange])

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmClose) return
    }
    onClose()
  }

  if (!isOpen) return null

  // Use template-based rendering if templateType is available, otherwise fallback
  // Also handles RichDocument JSON content
  const renderedHtml = (() => {
    if (hasSections) {
      return renderDraftSections(sections)
    }

    // Check if content is a serialized RichDocument (JSON)
    if (isRichDocumentString(localContent)) {
      const richDoc = deserializeDocument(localContent)
      if (richDoc) {
        return documentToHtml(richDoc)
      }
    }

    // For legacy plain text content with templateType, use template renderer
    if (templateType) {
      const templateRenderer = getTemplateRenderer(templateType)
      return templateRenderer(localContent)
    }

    // Fallback: render as basic content
    return renderDraftContent(localContent)
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ledger-white w-[90vw] max-w-4xl h-[85vh] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ledger-gray-200">
          <div className="flex-1 mr-4 flex items-center gap-2">
            <Label htmlFor="draft-preview-title" className="sr-only">
              Draft Title
            </Label>
            <Input
              id="draft-preview-title"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
              placeholder="Untitled Draft"
            />
            {hasChanges && (
              <span className="text-amber-600 font-bold text-xl" title="Unsaved changes">*</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Download Dropdown */}
            <div className="relative" ref={downloadMenuRef}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              >
                <Download className="h-4 w-4" />
                Download
                <ChevronDown className="h-3 w-3" />
              </Button>
              {downloadMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded border border-ledger-gray-200 bg-ledger-white shadow-md z-50">
                  <button
                    onClick={() => { handleDownloadPdf(); setDownloadMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                  >
                    <FileDown className="h-4 w-4" />
                    Download as PDF
                  </button>
                  <button
                    onClick={() => { handleDownloadDoc(); setDownloadMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                  >
                    <FileText className="h-4 w-4" />
                    Download as DOC
                  </button>
                  <button
                    onClick={() => { handleDownloadTxt(); setDownloadMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-ledger-gray-100"
                  >
                    <FileText className="h-4 w-4" />
                    Download as TXT
                  </button>
                </div>
              )}
            </div>

            {/* Save Button */}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-1.5"
              title="Save (Ctrl+S / Cmd+S)"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>

            {/* Close Button */}
            <Button variant="ghost" size="sm" onClick={handleClose} title="Close (Esc)" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-ledger-gray-200 bg-ledger-gray-50">
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
        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            className="max-w-3xl mx-auto bg-ledger-white border border-ledger-gray-200 rounded-lg overflow-auto focus:outline-none focus:ring-2 focus:ring-ledger-gray-300"
            style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.8', fontSize: '12pt', minHeight: '400px', padding: '40px 60px' }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-ledger-gray-200 bg-ledger-gray-50 flex items-center justify-between">
          <p className="text-xs text-ledger-gray-500">
            {hasChanges ? (
              <span className="text-amber-600 font-medium">Unsaved changes</span>
            ) : (
              'All changes saved'
            )}
          </p>
          <p className="text-xs text-ledger-gray-400">
            <span className="font-medium">Ctrl+S</span> to save • <span className="font-medium">Ctrl+Z</span> to undo • <span className="font-medium">Esc</span> to close
          </p>
        </div>
      </div>
    </div>
  )
}
