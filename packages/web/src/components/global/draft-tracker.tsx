import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import {
  getTrackedJob,
  getTrackedJobIds,
  subscribe,
  untrackJob,
} from '@/lib/drafts/draft-tracker'

/**
 * Globally-mounted listener for draft-generation completions. Lives inside
 * ProtectedLayout so it persists across authenticated-route navigation -
 * the "Draft ready" toast then fires no matter which page the user is on
 * when the job finishes.
 *
 * Renders no DOM. For each id in the tracker module's registry it opens
 * an SSE-backed status poll; on COMPLETED it shows a toast with an "Open"
 * action that navigates to /drafting?open=<docId>; on FAILED/CANCELLED it
 * shows an error toast. In every terminal case the id is untracked so the
 * toast fires only once.
 */
export function DraftTracker() {
  const navigate = useNavigate()
  const streamsRef = useRef<Map<string, AbortController>>(new Map())

  useEffect(() => {
    const openStreamFor = (docId: string) => {
      if (streamsRef.current.has(docId)) return
      const ctrl = workspaceApi.pollDocumentStatus(docId, {
        onStatus: (statusDoc) => {
          const s = (statusDoc.jobStatus ?? '').toString().toUpperCase()
          if (s !== 'COMPLETED' && s !== 'FAILED' && s !== 'CANCELLED') return

          streamsRef.current.get(docId)?.abort()
          streamsRef.current.delete(docId)

          const label = getTrackedJob(docId)
          if (!label) return // already toasted via another path
          untrackJob(docId)

          if (s === 'COMPLETED') {
            toast({
              title: 'Draft ready',
              description: label,
              action: (
                <ToastAction
                  altText="Open draft"
                  onClick={() => navigate(`/drafting?open=${docId}`)}
                >
                  Open
                </ToastAction>
              ),
            })
          } else {
            toast({
              title: 'Draft generation failed',
              description: 'Please try again.',
              variant: 'destructive',
            })
          }
        },
        onError: () => {
          streamsRef.current.delete(docId)
        },
        onEnd: () => {
          streamsRef.current.delete(docId)
        },
      })
      streamsRef.current.set(docId, ctrl)
    }

    // Pick up anything already in the registry (e.g. a draft submitted before
    // this component finished its first render).
    for (const id of getTrackedJobIds()) openStreamFor(id)

    const unsubscribe = subscribe(() => {
      for (const id of getTrackedJobIds()) openStreamFor(id)
    })

    return () => {
      unsubscribe()
      for (const ctrl of streamsRef.current.values()) ctrl.abort()
      streamsRef.current.clear()
    }
  }, [navigate])

  return null
}
