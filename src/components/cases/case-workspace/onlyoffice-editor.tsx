import { useEffect, useRef, useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { openEditSession } from '@/services/api/doc-processing-api'

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        containerId: string,
        config: object
      ) => { destroyEditor: () => void }
    }
  }
}

interface OnlyOfficeEditorProps {
  documentId: string
  caseId?: string | null
  onClose: () => void
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.DocsAPI) {
      resolve()
      return
    }
    // Remove any stale script with this src so we always get a fresh load
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load OnlyOffice SDK from ${src}`))
    document.head.appendChild(script)
  })
}

export function OnlyOfficeEditor({ documentId, caseId, onClose }: OnlyOfficeEditorProps) {
  const { user } = useAuth()
  const editorRef = useRef<{ destroyEditor: () => void } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleClose = () => {
    if (editorRef.current) {
      try {
        editorRef.current.destroyEditor()
      } catch { /* ignore */ }
      editorRef.current = null
    }
    onClose()
  }

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const session = await openEditSession(documentId, caseId)

        if (cancelled) return

        await loadScript(`${session.onlyOfficeServerUrl}/web-apps/apps/api/documents/api.js`)

        if (cancelled) return

        if (!window.DocsAPI) {
          throw new Error('OnlyOffice SDK did not load correctly.')
        }

        console.debug('[OnlyOffice] session response:', JSON.stringify(session, null, 2))

        editorRef.current = new window.DocsAPI.DocEditor('onlyoffice-editor-mount', {
          token: session.onlyOfficeToken,
          document: {
            fileType: session.fileType,
            title: session.title,
            url: session.docxDownloadUrl,
            key: session.editSessionKey,
          },
          editorConfig: {
            callbackUrl: session.callbackUrl,
            mode: 'edit',
          },
          events: {
            onDocumentReady: () => {
              if (!cancelled) setStatus('ready')
            },
            onError: (event: { data: string }) => {
              console.error('OnlyOffice error:', JSON.stringify(event))
            },
            onRequestClose: handleClose,
          },
          type: 'desktop',
          height: '100%',
          width: '100%',
        })

        // If onDocumentReady doesn't fire (some versions), mark ready after init
        if (!cancelled) setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to open editor.')
          setStatus('error')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor()
        } catch { /* ignore */ }
        editorRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, caseId])

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-ledger-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ledger-gray-200 dark:border-ledger-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-kx-primary-900 dark:text-kx-primary-100">
          Edit Document
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0 text-ledger-gray-500 hover:text-kx-primary-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 relative overflow-hidden">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-ledger-gray-900 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-kx-primary-500" />
            <p className="text-sm text-ledger-gray-500">Opening editor…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white dark:bg-ledger-gray-900 z-10">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600">{errorMessage ?? 'Something went wrong.'}</p>
            <Button variant="outline" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}

        {/* OnlyOffice mounts here — must be a plain div, not an iframe */}
        <div id="onlyoffice-editor-mount" className="w-full h-full" />
      </div>
    </div>
  )
}
