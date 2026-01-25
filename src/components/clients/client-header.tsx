import { Mail, Phone, Calendar, Building, MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ClientDetailView, CaseStatus } from '@/types'

interface ClientHeaderProps {
  client: ClientDetailView
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 text-sm font-medium rounded-sm',
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

export function ClientHeader({ client }: ClientHeaderProps) {
  const caseData = client.case

  return (
    <div className="border border-ledger-gray-200 rounded p-6">
      {/* Top Section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ledger-black">
            {client.name}
          </h2>
          <p className="text-sm text-ledger-gray-500 mt-1">
            {caseData?.caseTitle ?? 'No case assigned'}
          </p>
        </div>
        {caseData?.status && <StatusBadge status={caseData.status} />}
      </div>

      <Separator className="my-4" />

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Case Number */}
        <div>
          <p className="text-xs text-ledger-gray-500 uppercase tracking-wide mb-1">
            Case ID
          </p>
          <code className="text-sm font-mono text-ledger-black">
            {caseData?.caseNumber ?? '-'}
          </code>
        </div>

        {/* Case Type */}
        <div>
          <p className="text-xs text-ledger-gray-500 uppercase tracking-wide mb-1">
            Case Type
          </p>
          <p className="text-sm text-ledger-black capitalize">
            {caseData?.caseType ?? '-'}
          </p>
        </div>

        {/* Court */}
        {caseData?.courtName && (
          <div>
            <p className="text-xs text-ledger-gray-500 uppercase tracking-wide mb-1">
              Court
            </p>
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-ledger-gray-400" />
              <p className="text-sm text-ledger-black">
                {caseData.courtName}
              </p>
            </div>
          </div>
        )}

        {/* Next Hearing */}
        {caseData?.nextHearingDate && (
          <div>
            <p className="text-xs text-ledger-gray-500 uppercase tracking-wide mb-1">
              Next Hearing
            </p>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-ledger-gray-400" />
              <p className="text-sm text-ledger-black">
                {formatDate(caseData.nextHearingDate)}
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Contact Info */}
      <div className="flex flex-wrap gap-6">
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-ledger-gray-400" />
            <a
              href={`mailto:${client.email}`}
              className="text-sm text-ledger-black hover:underline"
            >
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-ledger-gray-400" />
            <a
              href={`tel:${client.phone}`}
              className="text-sm text-ledger-black hover:underline"
            >
              {client.phone}
            </a>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ledger-gray-400" />
            <span className="text-sm text-ledger-black">{client.address}</span>
          </div>
        )}
        <div className="text-sm text-ledger-gray-500">
          Client since: {formatDate(client.createdAt)}
        </div>
      </div>
    </div>
  )
}
