import * as React from 'react'
import { useCauseLists } from '@/hooks/use-cause-lists'
import { CauseListTable } from './cause-list-table'
import { CauseListPagination } from './cause-list-pagination'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DateSlider } from './date-slider'
import { RefreshButton } from '@/components/ui/refresh-button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { statesApi } from '@knowlex/core/api'
import type { State, Bench } from '@knowlex/core/api'
import { Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function AddBenchBanner() {
  const { updateProfile } = useAuth()
  const [states, setStates] = React.useState<State[]>([])
  const [benches, setBenches] = React.useState<Bench[]>([])
  const [selectedStateId, setSelectedStateId] = React.useState('')
  const [bench, setBench] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    statesApi.getStates().then((res) => {
      if (res.status === 'success') setStates(res.data)
    }).catch(() => {})
  }, [])

  const handleStateChange = async (stateId: string) => {
    setSelectedStateId(stateId)
    setBench('')
    setBenches([])
    if (!stateId) return
    try {
      const res = await statesApi.getBenches(stateId)
      if (res.status === 'success') setBenches(res.data)
    } catch {
      // Silently fail
    }
  }

  const handleSave = async () => {
    if (!bench) { setError('Please select a bench'); return }
    setSaving(true)
    setError('')
    try {
      await updateProfile({ bench })
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 space-y-3">
      <div>
        <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">Set your bench to view cause lists</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          Your cause list is fetched based on your bench (court location). Please select where you practice.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-amber-800 dark:text-amber-300">State</label>
          <Select
            value={selectedStateId}
            onChange={(e) => handleStateChange(e.target.value)}
            searchable
            searchPlaceholder="Search state..."
            className="h-8 text-sm w-[160px]"
          >
            <option value="">Select state</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-amber-800 dark:text-amber-300">Bench</label>
          <Select
            value={bench}
            onChange={(e) => setBench(e.target.value)}
            disabled={!selectedStateId}
            className="h-8 text-sm w-[160px]"
          >
            <option value="">Select bench</option>
            {benches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </Select>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving || !bench}>
          {saving ? 'Saving...' : 'Save Bench'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function CauseLists() {
  const { user } = useAuth()
  const {
    items,
    filters,
    setFilters,
    pagination,
    setPage,
    isLoading,
    error,
    refresh,
    triggerState,
    triggerMessage,
    triggerFetch,
  } = useCauseLists()

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const [syncDialogOpen, setSyncDialogOpen] = React.useState(false)
  const [syncDate, setSyncDate] = React.useState<Date>(new Date())

  const openSyncDialog = () => {
    const selectedDate = filters.date ?? today
    try { setSyncDate(parseISO(selectedDate)) } catch { setSyncDate(new Date()) }
    setSyncDialogOpen(true)
  }

  const isFetching = triggerState === 'triggering' || triggerState === 'polling'

  const handleSyncConfirm = () => {
    setSyncDialogOpen(false)
    triggerFetch(format(syncDate, 'yyyy-MM-dd'))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-16px)]">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="space-y-3 mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
                Cause Lists
              </h2>
              <p className="text-sm text-ledger-gray-500 mt-1">
                Your scheduled court hearings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={openSyncDialog}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                {isFetching ? 'Syncing...' : 'Sync from Court'}
              </Button>
              <RefreshButton onClick={refresh} isLoading={isLoading} />
            </div>
          </div>

          {/* Date slider — hero element */}
          <DateSlider
            value={filters.date ?? today}
            onChange={(date) => setFilters({ ...filters, date })}
          />
        </div>

        {/* Sync status banner */}
        {(triggerState === 'triggering' || triggerState === 'polling') && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            {triggerMessage}
          </div>
        )}
        {triggerState === 'completed' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {triggerMessage}
          </div>
        )}
        {triggerState === 'failed' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {triggerMessage}
          </div>
        )}

        {/* No bench banner */}
        {!user?.bench && <AddBenchBanner />}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Failed to load cause lists. Please try refreshing.
          </div>
        )}

        {/* Table */}
        <CauseListTable
          items={items}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && items.length > 0 && (
          <div className="pt-2">
            <CauseListPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              size={pagination.size}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Sync from Court dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sync from Court</DialogTitle>
            <DialogDescription>
              Pick a date to pull the latest cause list from the court website.
            </DialogDescription>
          </DialogHeader>
          <Calendar
            selected={syncDate}
            onSelect={(date) => setSyncDate(date)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSyncConfirm}>
              <Download className="h-4 w-4 mr-1.5" />
              Sync {format(syncDate, 'd MMM yyyy')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
