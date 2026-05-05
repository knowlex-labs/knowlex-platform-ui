import { Mail, Phone, Calendar, Building, MapPin, Pencil, Trash2, ChevronRight, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ClientDetailView, ClientCaseSummary, CaseStatus } from '@knowlex/core/types'

interface ClientHeaderProps {
  client: ClientDetailView
  onEdit?: () => void
  onDelete?: () => void
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-sm',
        STATUS_COLORS[status]
      )}
    >
      {label}
    </span>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUMMARY: 'Summary',
  SYNOPSIS: 'Synopsis',
  JUDGMENT: 'Judgment',
  USER_UPLOADED: 'Document',
  TRANSLATION: 'Translation',
  PRECEDENT: 'Precedent',
  BRIEF: 'Brief',
  DOCX_COPY: 'Editable copy',
}

function formatActivityType(type: string | null | undefined): string {
  if (!type) return 'Activity'
  return ACTIVITY_TYPE_LABELS[type] ?? type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ')
}

function relativeTime(date: Date): string {
  const ms = Date.now() - date.getTime()
  if (ms < 0) return 'just now'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} month${month === 1 ? '' : 's'} ago`
  const year = Math.floor(day / 365)
  return `${year} year${year === 1 ? '' : 's'} ago`
}

function CaseCard({ summary, onClick }: { summary: ClientCaseSummary; onClick: () => void }) {
  const activity = summary.latestActivity
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border border-ledger-gray-200 rounded p-4 hover:border-kx-primary-300 hover:bg-kx-primary-50/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-base font-serif font-semibold text-kx-primary-900 truncate">
            {summary.caseTitle ?? 'Untitled case'}
          </p>
          {summary.caseNumber && (
            <code className="text-xs font-mono text-ledger-gray-500 mt-0.5 inline-block">
              {summary.caseNumber}
            </code>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={summary.caseStatus} />
          <ChevronRight className="h-4 w-4 text-ledger-gray-400 group-hover:text-kx-primary-600 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {summary.courtName && (
          <div className="flex items-center gap-1.5 text-ledger-gray-600 min-w-0">
            <Building className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0" />
            <span className="truncate">{summary.courtName}</span>
          </div>
        )}
        {summary.nextHearingDate && (
          <div className="flex items-center gap-1.5 text-ledger-gray-600">
            <Calendar className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0" />
            <span>Next hearing: {formatDate(summary.nextHearingDate)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-ledger-gray-100 flex items-center gap-1.5 text-xs">
        <Clock className="h-3.5 w-3.5 text-ledger-gray-400 flex-shrink-0" />
        {activity && activity.at ? (
          <span className="text-ledger-gray-600 truncate">
            <span className="font-medium text-kx-primary-900">{formatActivityType(activity.type)}</span>
            {activity.label ? ` · ${activity.label}` : ''}
            <span className="text-ledger-gray-400"> · {relativeTime(activity.at)}</span>
          </span>
        ) : (
          <span className="text-ledger-gray-400">No activity yet</span>
        )}
      </div>
    </button>
  )
}

export function ClientHeader({ client, onEdit, onDelete }: ClientHeaderProps) {
  const navigate = useNavigate()
  const cases = client.caseSummaries ?? []

  return (
    <div className="border border-ledger-gray-200 rounded p-4 md:p-6">
      {/* Top Section — client identity + actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-serif font-semibold text-kx-primary-900">
            {client.name}
          </h2>
          <p className="text-sm text-ledger-gray-500 mt-1">
            {cases.length === 0
              ? 'No cases linked'
              : `${cases.length} case${cases.length === 1 ? '' : 's'} linked`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Contact Info */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6">
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-ledger-gray-50 active:bg-ledger-gray-100 transition-colors min-h-[44px]"
          >
            <Mail className="h-4 w-4 text-ledger-gray-400 flex-shrink-0" />
            <span className="text-sm text-kx-primary-900 hover:underline truncate">
              {client.email}
            </span>
          </a>
        )}
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-ledger-gray-50 active:bg-ledger-gray-100 transition-colors min-h-[44px]"
          >
            <Phone className="h-4 w-4 text-ledger-gray-400 flex-shrink-0" />
            <span className="text-sm text-kx-primary-900 hover:underline">
              {client.phone}
            </span>
          </a>
        )}
        {client.address && (
          <div className="flex items-center gap-2 min-h-[44px]">
            <MapPin className="h-4 w-4 text-ledger-gray-400 flex-shrink-0" />
            <span className="text-sm text-kx-primary-900">{client.address}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-ledger-gray-500 min-h-[44px]">
          Client since: {formatDate(client.createdAt)}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Cases */}
      <div>
        <p className="text-xs text-ledger-gray-500 uppercase tracking-wide mb-3">
          Cases
        </p>
        {cases.length === 0 ? (
          <div className="text-sm text-ledger-gray-500 border border-dashed border-ledger-gray-200 rounded p-6 text-center">
            No cases linked to this client yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {cases.map((c) => (
              <CaseCard
                key={c.caseId}
                summary={c}
                onClick={() => navigate(`/cases/${c.caseId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
