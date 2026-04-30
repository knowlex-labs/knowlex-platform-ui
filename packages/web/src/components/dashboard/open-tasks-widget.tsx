import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, CheckCircle2 } from 'lucide-react'
import { moodboardApi } from '@knowlex/core/api'
import { mapBackendTask } from '@knowlex/core/mappers'
import type { MoodboardTask } from '@knowlex/core/types'
import { cn } from '@/lib/utils'
import { useSubscriptionPreferences } from '@/contexts/subscription-preferences-context'

const MAX_VISIBLE = 5

function statusDot(status: MoodboardTask['status']): string {
  if (status === 'IN_PROGRESS') return 'bg-kx-primary-500'
  return 'bg-ledger-gray-400'
}

function statusLabel(status: MoodboardTask['status']): string {
  return status === 'IN_PROGRESS' ? 'In Progress' : 'To Do'
}

export function OpenTasksWidget() {
  const navigate = useNavigate()
  const { isLocked } = useSubscriptionPreferences()
  const [tasks, setTasks] = useState<MoodboardTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // TODO: switch to a server-side filtered endpoint once available; today this
  // pulls the entire board and filters to active tasks client-side.
  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    try {
      const res = await moodboardApi.getBoard()
      if (signal?.cancelled) return
      const active = (res.data.tasks ?? [])
        .map(mapBackendTask)
        .filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS')
        .sort((a, b) => {
          // In-progress first, then TODO, then by position.
          if (a.status !== b.status) return a.status === 'IN_PROGRESS' ? -1 : 1
          return a.position - b.position
        })
      setTasks(active)
      setHasError(false)
    } catch {
      if (!signal?.cancelled) setHasError(true)
    } finally {
      if (!signal?.cancelled) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const signal = { cancelled: false }
    load(signal)
    const onFocus = () => { load() }
    window.addEventListener('focus', onFocus)
    return () => {
      signal.cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  const visible = tasks.slice(0, MAX_VISIBLE)
  const overflow = Math.max(0, tasks.length - MAX_VISIBLE)

  if (isLocked('MOODBOARD')) return null

  return (
    <div className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-kx-primary-600" />
          <h2 className="text-base font-semibold text-kx-primary-900">Open Tasks</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/moodboard')}
          className="text-xs text-kx-primary-600 hover:text-kx-primary-700 font-medium transition-colors"
        >
          View board →
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-ledger-gray-100 dark:bg-ledger-gray-700 animate-pulse" />
          ))}
        </div>
      ) : hasError ? (
        <p className="text-xs text-ledger-gray-500 py-2">Couldn't load tasks.</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-ledger-gray-300 mx-auto mb-2" />
          <p className="text-xs text-ledger-gray-500">You're all caught up</p>
        </div>
      ) : (
        <div className="space-y-1">
          {visible.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => navigate('/moodboard')}
              className="flex items-start gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-nb-sidebar-hover cursor-pointer transition-colors text-left"
              title={statusLabel(task.status)}
            >
              <span
                className={cn('mt-1.5 h-2 w-2 rounded-full flex-shrink-0', statusDot(task.status))}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-kx-text-primary truncate leading-snug">
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-[10px] text-ledger-gray-400 truncate mt-0.5">
                    {task.description}
                  </p>
                )}
              </div>
            </button>
          ))}

          {overflow > 0 && (
            <button
              type="button"
              onClick={() => navigate('/moodboard')}
              className="w-full px-2 py-1.5 text-[11px] font-medium text-kx-primary-600 hover:text-kx-primary-700 text-left transition-colors"
            >
              + {overflow} more
            </button>
          )}
        </div>
      )}
    </div>
  )
}
