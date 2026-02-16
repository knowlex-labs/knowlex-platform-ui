import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Phone, Mail, MessageCircle, ChevronRight as ArrowRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ClientListSkeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/ui/error-display'
import { AddClientModal } from '@/components/clients/add-client-modal'
import { useNavigate } from 'react-router-dom'
import { useClients } from '@/hooks/use-clients'
import { cn } from '@/lib/utils'
import type { ClientWithCase } from '@/types'

// Contact action buttons component
function ContactActions({
  phone,
  email,
}: {
  phone: string | null
  email: string | null
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
    <div className="flex items-center gap-1">
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ledger-black truncate">
            {client.name}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {client.phone && (
              <p className="text-xs text-ledger-gray-500 truncate">{client.phone}</p>
            )}
            {client.email && (
              <p className="text-xs text-ledger-gray-500 truncate">{client.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ContactActions phone={client.phone} email={client.email} />
          <ArrowRight className="h-4 w-4 text-ledger-gray-300" />
        </div>
      </div>
    </div>
  )
}

// Desktop table row component
function ClientTableRow({ client, onClick }: { client: ClientWithCase; onClick: () => void }) {
  const handleRowClick = (e: React.MouseEvent) => {
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
      <div className="col-span-4">
        <p className="text-sm font-medium text-ledger-black truncate">
          {client.name}
        </p>
        <p className="text-xs text-ledger-gray-400 mt-0.5 capitalize">
          {client.clientType}
        </p>
      </div>
      <div className="col-span-3">
        {client.phone ? (
          <p className="text-sm text-ledger-gray-600">{client.phone}</p>
        ) : (
          <span className="text-xs text-ledger-gray-400">-</span>
        )}
      </div>
      <div className="col-span-3">
        {client.email ? (
          <p className="text-sm text-ledger-gray-600 truncate">{client.email}</p>
        ) : (
          <span className="text-xs text-ledger-gray-400">-</span>
        )}
      </div>
      <div className="col-span-2 flex items-center justify-end">
        <ContactActions phone={client.phone} email={client.email} />
      </div>
    </div>
  )
}

export function ClientList() {
  const navigate = useNavigate()
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

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
      <div>
        <h2 className="text-xl md:text-2xl font-serif font-semibold text-ledger-black">
          Clients
        </h2>
        <p className="text-sm text-ledger-gray-500 mt-1">
          Manage your client contacts
        </p>
      </div>
      <Button onClick={() => setShowAddClientModal(true)} className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Client
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="bg-ledger-white">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-y border-ledger-gray-200 bg-ledger-gray-50">
            <div className="col-span-4 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Name
            </div>
            <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Phone
            </div>
            <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
              Email
            </div>
            <div className="col-span-2 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide text-right">
              Actions
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
        {header}
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
      {header}

      <div className="bg-ledger-white">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-y border-ledger-gray-200 bg-ledger-gray-50">
          <div className="col-span-4 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
            Name
          </div>
          <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
            Phone
          </div>
          <div className="col-span-3 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">
            Email
          </div>
          <div className="col-span-2 text-xs font-medium text-ledger-gray-500 uppercase tracking-wide text-right">
            Actions
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
                  onClick={() => navigate(`/clients/${client.id}`)}
                />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              {clients.map((client) => (
                <ClientTableRow
                  key={client.id}
                  client={client}
                  onClick={() => navigate(`/clients/${client.id}`)}
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
