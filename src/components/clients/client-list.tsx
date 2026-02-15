import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Plus, Phone, Mail, MessageCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ClientListSkeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/ui/error-display'
import { AddClientModal } from '@/components/clients/add-client-modal'
import { useNavigation } from '@/contexts/navigation-context'
import { useClients } from '@/hooks/use-clients'
import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CaseStatus, ClientWithCase } from '@/types'

function StatusBadge({ status }: { status: CaseStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm',
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
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// Contact action buttons component
function ContactActions({
  phone,
  email,
  onCardClick,
}: {
  phone: string | null
  email: string | null
  onCardClick: (e: React.MouseEvent) => void
}) {
  const handlePhone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (email) {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <div className="flex items-center gap-1" onClick={onCardClick}>
      {phone && (
        <>
          <button
            onClick={handlePhone}
            className="p-2 rounded-full hover:bg-ledger-gray-100 transition-colors"
            title="Call"
          >
            <Phone className="h-4 w-4 text-ledger-gray-500" />
          </button>
          <button
            onClick={handleWhatsApp}
            className="p-2 rounded-full hover:bg-ledger-gray-100 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4 text-ledger-gray-500" />
          </button>
        </>
      )}
      {email && (
        <button
          onClick={handleEmail}
          className="p-2 rounded-full hover:bg-ledger-gray-100 transition-colors"
          title="Email"
        >
          <Mail className="h-4 w-4 text-ledger-gray-500" />
        </button>
      )}
    </div>
  )
}

// Mobile card component for client
function ClientCard({ client, onClick }: { client: ClientWithCase; onClick: () => void }) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on contact buttons
    if ((e.target as HTMLElement).closest('button[title]')) {
      return
    }
    onClick()
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'w-full p-4 text-left cursor-pointer',
        'border-b border-ledger-gray-100 last:border-b-0',
        'hover:bg-ledger-gray-50 active:bg-ledger-gray-100 transition-colors'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ledger-black truncate">
            {client.name}
          </p>
          <p className="text-xs text-ledger-gray-500 truncate mt-0.5">
            {client.cases[0]?.caseTitle ?? 'No case assigned'}
          </p>
          {client.cases[0]?.caseNumber && (
            <code className="text-xs font-mono text-ledger-gray-400 mt-1 block">
              {client.cases[0].caseNumber}
            </code>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            {client.cases[0]?.status && <StatusBadge status={client.cases[0].status} />}
          </div>
          <ContactActions
            phone={client.phone}
            email={client.email}
            onCardClick={(e) => e.stopPropagation()}
          />
          {client.cases[0]?.nextHearingDate && (
            <div className="flex items-center gap-1 text-xs text-ledger-gray-400">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(client.cases[0].nextHearingDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Desktop table row component
function ClientTableRow({ client, onClick }: { client: ClientWithCase; onClick: () => void }) {
  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on contact buttons
    if ((e.target as HTMLElement).closest('button[title]')) {
      return
    }
    onClick()
  }

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'w-full grid grid-cols-12 gap-4 px-4 py-4 text-left cursor-pointer',
        'border-b border-ledger-gray-100 last:border-b-0',
        'hover:bg-ledger-gray-50 transition-colors'
      )}
    >
      <div className="col-span-3">
        <p className="text-sm font-medium text-ledger-black truncate">
          {client.name}
        </p>
        <p className="text-xs text-ledger-gray-500 truncate mt-0.5">
          {client.cases[0]?.caseTitle ?? 'No case assigned'}
        </p>
      </div>
      <div className="col-span-3">
        <code className="text-xs font-mono text-ledger-gray-600">
          {client.cases[0]?.caseNumber ?? '-'}
        </code>
      </div>
      <div className="col-span-2">
        {client.cases[0]?.status ? (
          <StatusBadge status={client.cases[0].status} />
        ) : (
          <span className="text-xs text-ledger-gray-400">-</span>
        )}
      </div>
      <div className="col-span-2">
        <ContactActions
          phone={client.phone}
          email={client.email}
          onCardClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="col-span-2">
        {client.cases[0]?.courtName ? (
          <p className="text-xs text-ledger-gray-600 truncate">
            {client.cases[0].courtName}
          </p>
        ) : (
          <span className="text-xs text-ledger-gray-400">-</span>
        )}
        {client.cases[0]?.nextHearingDate && (
          <p className="text-xs text-ledger-gray-400 mt-0.5">
            Next: {formatDate(client.cases[0].nextHearingDate)}
          </p>
        )}
      </div>
    </div>
  )
}

export function ClientList() {
  const { setSelectedClientId } = useNavigation()
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const {
    clients,
    isLoading,
    error,
    totalPages,
    currentPage,
    setPage,
    refresh,
  } = useClients({ pageSize: 20 })

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
              Clients
            </h2>
            <p className="text-sm text-ledger-gray-500 mt-1">
              Manage your client cases and activities
            </p>
          </div>
          <Button onClick={() => setShowAddClientModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
        <div className="bg-ledger-white">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-y border-ledger-gray-200 bg-ledger-gray-50">
            <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Client / Case
            </div>
            <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Case ID
            </div>
            <div className="col-span-2 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Status
            </div>
            <div className="col-span-2 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Contact
            </div>
            <div className="col-span-2 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Court
            </div>
          </div>
          <ClientListSkeleton />
        </div>
        <AddClientModal
          open={showAddClientModal}
          onOpenChange={setShowAddClientModal}
          onSuccess={refresh}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
              Clients
            </h2>
            <p className="text-sm text-ledger-gray-500 mt-1">
              Manage your client cases and activities
            </p>
          </div>
          <Button onClick={() => setShowAddClientModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
        <div className="bg-ledger-white border-y border-ledger-gray-200">
          <ErrorDisplay
            title="Failed to load clients"
            message={error}
            onRetry={refresh}
          />
        </div>
        <AddClientModal
          open={showAddClientModal}
          onOpenChange={setShowAddClientModal}
          onSuccess={refresh}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
            Clients
          </h2>
          <p className="text-sm text-ledger-gray-500 mt-1">
            Manage your client cases and activities
          </p>
        </div>
        <Button onClick={() => setShowAddClientModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="bg-ledger-white">
        {/* Desktop Table Header - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-y border-ledger-gray-200 bg-ledger-gray-50">
          <div className="col-span-4 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
            Client / Case
          </div>
          <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
            Case ID
          </div>
          <div className="col-span-2 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
            Status
          </div>
          <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
            Court
          </div>
        </div>

        {/* Table Body */}
        {clients.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-ledger-gray-500">No clients found</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-280px)]">
            {/* Mobile Card View */}
            <div className="md:hidden">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => setSelectedClientId(client.id)}
                />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              {clients.map((client) => (
                <ClientTableRow
                  key={client.id}
                  client={client}
                  onClick={() => setSelectedClientId(client.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-y border-ledger-gray-200 bg-ledger-gray-50">
            <p className="text-xs text-ledger-gray-500">
              Page {currentPage + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="h-10 w-10 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddClientModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onSuccess={refresh}
      />
    </div>
  )
}
