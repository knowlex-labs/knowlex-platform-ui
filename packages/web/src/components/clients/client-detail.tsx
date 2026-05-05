import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ClientDetailSkeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/ui/error-display'
import { ClientHeader } from './client-header'
import { ActivityFeed } from './activity-feed'
import { EditClientModal } from './edit-client-modal'
import { DeleteClientDialog } from './delete-client-dialog'
import { useClientDetail } from '@/hooks/use-client-detail'

export function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { client, isLoading, error, refresh } = useClientDetail(clientId ?? null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const goBack = () => navigate('/clients')

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 md:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="gap-2 text-ledger-gray-600 hover:text-kx-primary-700 -ml-2 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
        </div>
        <ClientDetailSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="mb-4 md:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="gap-2 text-ledger-gray-600 hover:text-kx-primary-700 -ml-2 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
        </div>
        <div className="border border-ledger-gray-200 rounded">
          <ErrorDisplay
            title="Failed to load client"
            message={error}
            onRetry={refresh}
          />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-ledger-gray-500">Client not found</p>
        <Button
          variant="ghost"
          onClick={goBack}
          className="mt-4"
        >
          Back to Clients
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="gap-2 text-ledger-gray-600 hover:text-kx-primary-700 -ml-2 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </div>

      {/* Client Header */}
      <div className="mb-4 md:mb-6">
        <ClientHeader client={client} onEdit={() => setShowEditModal(true)} onDelete={() => setShowDeleteDialog(true)} />
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={client.activities} />

      <EditClientModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        client={client}
        onSuccess={refresh}
      />

      <DeleteClientDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        clientId={client.id}
        clientName={client.name}
        linkedCaseCount={client.caseSummaries.length}
        onSuccess={() => navigate('/clients')}
      />
    </div>
  )
}
