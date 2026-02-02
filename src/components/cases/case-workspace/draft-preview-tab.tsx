import { useState, useRef, useEffect } from 'react'
import { Download, Save, FileDown, FileText, ChevronDown, Wand2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTextSelection } from '@/hooks/use-text-selection'
import type { Draft } from '@/types'

interface DraftPreviewTabProps {
  draft: Draft
  onSave: (id: string, title: string, content: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onSendToChat: (text: string) => void
}

export function DraftPreviewTab({
  draft,
  onSave,
  onDelete,
  onSendToChat,
}: DraftPreviewTabProps) {
  const [title, setTitle] = useState(draft.title)
  const [content, setContent] = useState(draft.content)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { selection, clearSelection } = useTextSelection(textareaRef)

  // Sync with draft prop changes
  useEffect(() => {
    setTitle(draft.title)
    setContent(draft.content)
    setHasChanges(false)
  }, [draft.id, draft.title, draft.content])

  // Track changes
  useEffect(() => {
    const changed = title !== draft.title || content !== draft.content
    setHasChanges(changed)
  }, [title, content, draft.title, draft.content])

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

  const handleSave = () => {
    onSave(draft.id, title, content)
    setHasChanges(false)
  }

  const handleFixWithAI = () => {
    if (selection?.text) {
      onSendToChat(`Please help me fix/improve this text:\n\n"${selection.text}"`)
      clearSelection()
    }
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([content], { type: 'text/plain' })
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
    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        margin: 1in;
      }
      h1 {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 24pt;
      }
      p {
        margin-bottom: 12pt;
        text-align: justify;
      }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${content.split('\n').map((p) => `<p>${p}</p>`).join('')}
  </body>
</html>`

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
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      @page {
        margin: 1in;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
      }
      h1 {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 24pt;
      }
      p {
        margin-bottom: 12pt;
        text-align: justify;
      }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${content.split('\n').map((p) => `<p>${p}</p>`).join('')}
  </body>
</html>`)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ledger-gray-200 bg-ledger-gray-50">
        <div className="flex-1 mr-4">
          <Label htmlFor="draft-title" className="sr-only">
            Draft Title
          </Label>
          <Input
            id="draft-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
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

          {/* Save Button */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="gap-1.5 h-8"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(draft.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 overflow-hidden relative">
        <div className="h-full border border-ledger-gray-200 rounded-lg overflow-hidden relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-6 resize-none focus:outline-none"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '12pt',
              lineHeight: '1.6',
            }}
            placeholder="Draft content..."
          />

          {/* Floating AI Fix Button */}
          {selection && selection.text.length > 0 && (
            <div
              className="absolute z-10"
              style={{
                top: Math.max(8, (selection.rect?.y || 0) - 180),
                left: '50%',
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
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-ledger-gray-200 bg-ledger-gray-50">
        <p className="text-xs text-ledger-gray-500">
          {hasChanges ? 'Unsaved changes' : `Last saved: ${draft.updatedAt.toLocaleString()}`}
        </p>
      </div>
    </div>
  )
}
