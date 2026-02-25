import { useState, useEffect } from 'react'
import { caseApi } from '@/services/api'
import type { CaseTypeOption } from '@/types'

// Module-level singleton: one fetch, shared across all hook instances
let cachedTypes: CaseTypeOption[] | null = null
let pendingFetch: Promise<CaseTypeOption[]> | null = null

function loadCaseTypes(): Promise<CaseTypeOption[]> {
  if (cachedTypes !== null) return Promise.resolve(cachedTypes)
  if (!pendingFetch) {
    pendingFetch = caseApi.getTypes()
      .then((res) => {
        if (res.status === 'success' && Array.isArray(res.data)) {
          cachedTypes = res.data
          return res.data
        }
        return []
      })
      .catch(() => {
        pendingFetch = null // allow retry on next mount
        return []
      })
  }
  return pendingFetch
}

export function useCaseTypes() {
  const [caseTypes, setCaseTypes] = useState<CaseTypeOption[]>(cachedTypes ?? [])
  const [isLoading, setIsLoading] = useState(cachedTypes === null)

  useEffect(() => {
    if (cachedTypes !== null) {
      setCaseTypes(cachedTypes)
      setIsLoading(false)
      return
    }

    let cancelled = false

    loadCaseTypes().then((types) => {
      if (!cancelled) {
        setCaseTypes(types)
        setIsLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [])

  return { caseTypes, isLoading }
}
