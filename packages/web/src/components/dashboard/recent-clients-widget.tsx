import { Users, Mail } from 'lucide-react'
import type { RecentClient } from '@knowlex/core/api/dashboard-api'

interface RecentClientsWidgetProps {
  clients: RecentClient[]
  isLoading: boolean
  onClientClick: (clientId: string) => void
}

export function RecentClientsWidget({ clients, isLoading, onClientClick }: RecentClientsWidgetProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-ledger-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-ledger-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-ledger-gray-200 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-ledger-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-ledger-gray-300 rounded-lg">
        <Users className="h-12 w-12 text-ledger-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-ledger-gray-900 mb-1">No clients yet</h3>
        <p className="text-sm text-ledger-gray-500">Add a client to see them here</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {clients.map((client, index) => (
        <button
          key={client.id}
          onClick={() => onClientClick(client.id)}
          className="group w-full bg-kx-card border border-kx-card-border rounded-lg p-4 text-left shadow-sm card-elevated focus:outline-none focus:ring-2 focus:ring-kx-primary-400 focus:ring-offset-2 animate-bounce-in"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-kx-primary-100 dark:bg-kx-primary-200 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-kx-primary-700">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-ledger-gray-900 group-hover:text-kx-primary-700 transition-colors truncate">
                {client.name}
              </h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-ledger-gray-500 capitalize">
                  {client.clientType.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {client.email && (
            <div className="flex items-center gap-1 mt-2.5 pl-[52px] text-xs text-ledger-gray-500 truncate">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
