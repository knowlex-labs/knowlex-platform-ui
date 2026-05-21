import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Phone, Mail, MessageCircle, Users, Search, LayoutGrid, List, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorDisplay } from '@/components/ui/error-display'
import { AddClientModal } from '@/components/clients/add-client-modal'
import { useNavigate } from 'react-router-dom'
import { useClients } from '@/hooks/use-clients'
import { cn } from '@/lib/utils'
import type { ClientWithCase } from '@knowlex/core/types'

type ViewMode = 'grid' | 'list'

function ContactActions({
  phone,
  email,
}: {
  phone: string | null
  email: string | null
}) {
  const handlePhone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (phone) window.location.href = `tel:${phone}`
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
    if (email) window.location.href = `mailto:${email}`
  }

  return (
    <div className="flex items-center gap-0.5">
      {phone && (
        <>
          <button
            onClick={handlePhone}
            className="p-1.5 rounded hover:bg-ledger-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Call"
          >
            <Phone className="h-3.5 w-3.5 text-ledger-gray-500" />
          </button>
          <button
            onClick={handleWhatsApp}
            className="p-1.5 rounded hover:bg-ledger-gray-100 dark:hover:bg-white/10 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5 text-ledger-gray-500" />
          </button>
        </>
      )}
      {email && (
        <button
          onClick={handleEmail}
          className="p-1.5 rounded hover:bg-ledger-gray-100 dark:hover:bg-white/10 transition-colors"
          title="Email"
        >
          <Mail className="h-3.5 w-3.5 text-ledger-gray-500" />
        </button>
      )}
    </div>
  )
}

function ClientTableSkeleton() {
  return (
    <div className="border border-kx-card-border rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ledger-gray-50 dark:bg-ledger-gray-100 border-b border-kx-card-border">
              <th className="text-left px-4 py-3"><div className="h-3 w-12 bg-ledger-gray-200 rounded animate-pulse" /></th>
              <th className="text-left px-4 py-3 hidden sm:table-cell"><div className="h-3 w-10 bg-ledger-gray-200 rounded animate-pulse" /></th>
              <th className="text-left px-4 py-3 hidden md:table-cell"><div className="h-3 w-16 bg-ledger-gray-200 rounded animate-pulse" /></th>
              <th className="text-left px-4 py-3 hidden lg:table-cell"><div className="h-3 w-12 bg-ledger-gray-200 rounded animate-pulse" /></th>
              <th className="text-left px-4 py-3"><div className="h-3 w-14 bg-ledger-gray-200 rounded animate-pulse" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kx-card-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="bg-kx-card">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-ledger-gray-100 animate-pulse flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-ledger-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-ledger-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-28 bg-ledger-gray-100 rounded animate-pulse" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-36 bg-ledger-gray-100 rounded animate-pulse" /></td>
                <td className="px-4 py-3 hidden lg:table-cell"><div className="h-5 w-16 bg-ledger-gray-100 rounded-full animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-4 w-20 bg-ledger-gray-100 rounded animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientTableRow({ client, onClick }: { client: ClientWithCase; onClick: () => void }) {
  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button[title]')) return
    onClick()
  }

  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const activeCases = client.cases.filter((c) => c.status === 'active')

  return (
    <tr
      onClick={handleRowClick}
      className={cn(
        'bg-kx-card cursor-pointer transition-all duration-150',
        'hover:bg-kx-primary-50 dark:hover:bg-kx-primary-50',
        'border-l-2 border-l-transparent hover:border-l-kx-primary-500'
      )}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-kx-primary-600 dark:text-kx-primary-400">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-kx-text-primary truncate">{client.name}</p>
            <p className="text-xs text-ledger-gray-400 capitalize mt-0.5">{client.clientType}</p>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
        {client.phone ? (
          <span className="text-sm text-ledger-gray-600">{client.phone}</span>
        ) : (
          <span className="text-xs text-ledger-gray-400">—</span>
        )}
      </td>

      {/* Email */}
      <td className="px-4 py-3 hidden md:table-cell">
        {client.email ? (
          <span className="text-sm text-ledger-gray-600 truncate max-w-[200px] block">{client.email}</span>
        ) : (
          <span className="text-xs text-ledger-gray-400">—</span>
        )}
      </td>

      {/* Cases */}
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
        {client.cases.length > 0 ? (
          <span className={cn(
            'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
            activeCases.length > 0
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-ledger-gray-100 text-ledger-gray-600 dark:bg-ledger-gray-200 dark:text-ledger-gray-500'
          )}>
            {activeCases.length > 0 ? `${activeCases.length} active` : `${client.cases.length} case${client.cases.length !== 1 ? 's' : ''}`}
          </span>
        ) : (
          <span className="text-xs text-ledger-gray-400">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <ContactActions phone={client.phone} email={client.email} />
      </td>
    </tr>
  )
}

function ClientCard({ client, onClick }: { client: ClientWithCase; onClick: () => void }) {
  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const activeCases = client.cases.filter((c) => c.status === 'active').length

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border border-kx-card-border bg-kx-card p-4 hover:border-kx-primary-300 hover:bg-kx-primary-50/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-kx-primary-600 dark:text-kx-primary-400">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-kx-text-primary truncate">{client.name}</p>
            <p className="text-xs text-ledger-gray-500 mt-0.5 capitalize">{client.clientType}</p>
          </div>
        </div>
        <ContactActions phone={client.phone} email={client.email} />
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="text-xs text-ledger-gray-600 truncate">{client.phone || 'No phone'}</p>
        <p className="text-xs text-ledger-gray-600 truncate">{client.email || 'No email'}</p>
      </div>
      <div className="mt-3">
        <span className={cn(
          'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
          activeCases > 0
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-ledger-gray-100 text-ledger-gray-600 dark:bg-ledger-gray-200 dark:text-ledger-gray-500'
        )}>
          {activeCases > 0 ? `${activeCases} active case${activeCases > 1 ? 's' : ''}` : `${client.cases.length} total case${client.cases.length !== 1 ? 's' : ''}`}
        </span>
      </div>
    </button>
  )
}

export function ClientList() {
  const navigate = useNavigate()
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('knowlex_clients_view') as ViewMode) || 'grid'
  })
  const {
    clients,
    isLoading,
    error,
    totalElements,
    totalPages,
    currentPage,
    setPage,
    refresh,
  } = useClients({ pageSize: 20, q: searchQuery })

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('knowlex_clients_view', mode)
  }

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
      <div>
        <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
          Clients
        </h2>
        <p className="text-sm text-ledger-gray-500 mt-1">
          Manage your client contacts
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-9 rounded-lg border border-ledger-gray-200 overflow-hidden">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={cn(
              'flex items-center justify-center w-9 h-full transition-colors',
              viewMode === 'grid'
                ? 'bg-kx-primary-600 text-white'
                : 'text-ledger-gray-500 hover:bg-ledger-gray-50'
            )}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={cn(
              'flex items-center justify-center w-9 h-full transition-colors',
              viewMode === 'list'
                ? 'bg-kx-primary-600 text-white'
                : 'text-ledger-gray-500 hover:bg-ledger-gray-50'
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <Button onClick={() => setShowAddClientModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      {header}
      <div className="flex items-center gap-2 p-3 mb-4 bg-ledger-gray-50 rounded-lg border border-ledger-gray-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-gray-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name..."
            className="h-9 pl-9 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ledger-gray-400 hover:text-ledger-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <ClientTableSkeleton />
      ) : error ? (
        <div className="border border-kx-card-border rounded-lg overflow-hidden shadow-sm bg-kx-card">
          <ErrorDisplay title="Failed to load clients" message={error} onRetry={refresh} />
        </div>
      ) : clients.length === 0 ? (
        <div className="border border-kx-card-border rounded-lg overflow-hidden shadow-sm bg-kx-card">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-200 flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-ledger-gray-400" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-kx-text-primary mb-1">
              No clients yet
            </h3>
            <p className="text-sm text-ledger-gray-500 max-w-sm">
              Add your first client to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-kx-card-border rounded-lg overflow-hidden shadow-sm">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ledger-gray-50 dark:bg-ledger-gray-100 border-b border-kx-card-border">
                    <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                      Phone
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                      Cases
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-ledger-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kx-card-border">
                  {clients.map((client) => (
                    <ClientTableRow
                      key={client.id}
                      client={client}
                      onClick={() => navigate(`/clients/${client.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => navigate(`/clients/${client.id}`)}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-3 border-t border-kx-card-border bg-ledger-gray-50 dark:bg-white/[0.03]">
            <p className="text-xs text-ledger-gray-500">
              {totalElements} total · Page {Math.min(currentPage + 1, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0 || totalPages <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || totalPages <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddClientModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onSuccess={refresh}
      />
    </div>
  )
}
