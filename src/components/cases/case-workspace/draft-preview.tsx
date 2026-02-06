import { useState, useRef, useEffect } from 'react'
import { Download, Save, FileDown, FileText, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { renderDraftContent, renderDraftSections, buildExportHtml, buildExportText } from '@/lib/draft-renderer'
import type { DraftSection } from '@/types'

interface DraftPreviewProps {
  title: string
  content: string
  sections?: DraftSection[]
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
  isOpen,
  onClose,
  onSave,
  onContentChange: _onContentChange,
  onTitleChange,
}: DraftPreviewProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)

  // Sync localTitle with title prop
  useEffect(() => {
    setLocalTitle(title)
  }, [title])

  const handleTitleBlur = () => {
    onTitleChange(localTitle)
  }

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

  const hasSections = sections && sections.length > 0

  const handleDownloadTxt = () => {
    const text = buildExportText(content, sections)
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
    const htmlContent = buildExportHtml(localTitle, content, sections)
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
    const htmlContent = buildExportHtml(localTitle, content, sections)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const handleSave = () => {
    onSave(localTitle, content)
  }

  if (!isOpen) return null

  const renderedHtml = hasSections
    ? renderDraftSections(sections)
    : renderDraftContent(content)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ledger-white w-[90vw] max-w-4xl h-[85vh] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ledger-gray-200">
          <div className="flex-1 mr-4">
            <Label htmlFor="draft-title" className="sr-only">
              Draft Title
            </Label>
            <Input
              id="draft-title"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Untitled Draft"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={downloadMenuRef}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
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
            <Button size="sm" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save to Drafts
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rendered Preview */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            className="max-w-3xl mx-auto bg-ledger-white border border-ledger-gray-200 rounded-lg p-10"
            style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-ledger-gray-200 bg-ledger-gray-50">
          <p className="text-xs text-ledger-gray-500">
            Tip: Use the AI chatbot on the right to request modifications to this draft.
          </p>
        </div>
      </div>
    </div>
  )
}
