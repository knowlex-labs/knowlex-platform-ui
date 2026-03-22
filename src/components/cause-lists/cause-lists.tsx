import * as React from 'react'
import { useCauseLists } from '@/hooks/use-cause-lists'
import { CauseListTable } from './cause-list-table'
import { CauseListPagination } from './cause-list-pagination'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/ui/refresh-button'
import { useAuth } from '@/contexts/auth-context'
import { STATE_BENCH_MAP, STATES } from '@/lib/courts'

function AddBenchBanner() {
  const { updateProfile } = useAuth()
  const [state, setState] = React.useState('')
  const [bench, setBench] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

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
            value={state}
            onChange={(e) => { setState(e.target.value); setBench('') }}
            searchable
            searchPlaceholder="Search state..."
            className="h-8 text-sm w-[160px]"
          >
            <option value="">Select state</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-amber-800 dark:text-amber-300">Bench</label>
          <Select
            value={bench}
            onChange={(e) => setBench(e.target.value)}
            disabled={!state}
            className="h-8 text-sm w-[160px]"
          >
            <option value="">Select bench</option>
            {(STATE_BENCH_MAP[state] || []).map((b) => <option key={b} value={b}>{b}</option>)}
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
  } = useCauseLists()

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-16px)]">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">
              Cause Lists
            </h2>
            <p className="text-sm text-ledger-gray-500 mt-1">
              View your upcoming court hearings and cause lists
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input')
                input?.showPicker()
              }}
            >
              <Input
                type="date"
                value={filters.date ?? ''}
                onChange={(e) => setFilters({ ...filters, date: e.target.value || undefined })}
                className="h-9 text-sm cursor-pointer w-[160px]"
              />
            </button>
            <RefreshButton onClick={refresh} isLoading={isLoading} />
          </div>
        </div>

        {/* No bench banner */}
        {!user?.bench && <AddBenchBanner />}

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
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
    </div>
  )
}
