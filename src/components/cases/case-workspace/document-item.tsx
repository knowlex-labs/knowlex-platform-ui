import { useState } from 'react'
import {
  FileText,
  FileImage,
  File,
  Download,
  Loader2,
} from 'lucide-react'
import { workspaceApi } from '@/services/api/workspace-api'
import type { CaseDocument } from '@/types'

interface DocumentItemProps {
  document: CaseDocument
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toUpperCase() || ''
  if (['JPG', 'JPEG', 'PNG'].includes(ext)) {
    return FileImage
  }
  if (ext === 'PDF') {
    return FileText
  }
  if (['DOCX', 'DOC'].includes(ext)) {
    return FileText
  }
  return File
}

function getTypeBadge(type: string) {
  const config: Record<string, { color: string; text: string }> = {
    USER_UPLOADED: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', text: 'Source' },
    DRAFT: { color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', text: 'Draft' },
    JUDGMENT: { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', text: 'Judgment' },
    SUMMARY: { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', text: 'Summary' },
    BRIEF: { color: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800', text: 'Brief' },
  }

  const typeConfig = config[type]
  if (!typeConfig) {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded border bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
        {type}
      </span>
    )
  }

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${typeConfig.color}`}>
      {typeConfig.text}
    </span>
  )
}

function getStatusBadge(status: string | undefined | null) {
  const config: Record<string, { color: string; text: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', text: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', text: 'Processing' },
    completed: { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', text: 'Completed' },
    failed: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', text: 'Failed' },
    indexing_pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', text: 'Pending' },
    indexing_running: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', text: 'Processing' },
    indexing_completed: { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', text: 'Completed' },
    indexing_failed: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', text: 'Failed' },
  }

  const normalizedStatus = (!status ? 'indexing_pending' : status.toLowerCase()) || ''
  const statusConfig = config[normalizedStatus]
  const { color, text } = statusConfig || { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status || 'Unknown' }

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${color}`}>
      {text}
    </span>
  )
}

export function DocumentItem({ document }: DocumentItemProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const displayName = document.name || `${document.type} Document`
  const Icon = getFileIcon(displayName)

  // Get the appropriate status based on document type
  const status = document.type === 'DRAFT' ? document.jobStatus : document.indexingStatus

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      let url = document.signedUrl || document.storageUrl

      if (!url) {
        url = await workspaceApi.getDownloadUrl(document.id)
      }

      // Trigger download - use window.document to avoid shadowing the prop
      const link = window.document.createElement('a')
      link.href = url
      link.download = displayName
      link.target = '_blank'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to download document:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      className="group relative flex items-center gap-2 px-4 py-2.5 hover:bg-ledger-gray-50 transition-colors cursor-pointer"
      onClick={handleDownload}
    >
      {isDownloading ? (
        <Loader2 className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0 group-hover:text-kx-primary-600" />
      )}

      <Icon className="h-3.5 w-3.5 text-ledger-gray-500 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-kx-primary-900 truncate">{displayName}</p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {getTypeBadge(document.type)}
        {getStatusBadge(status)}
      </div>
    </div>
  )
}
