import type { BackendCase } from '../types/api.types'

/** Same primary/secondary info as case folder cards and list rows (one line for selects). */
export function formatCaseFolderLabel(
  c: Pick<BackendCase, 'id' | 'caseTitle' | 'caseNumber'>,
): string {
  const title = c.caseTitle?.trim() || 'Untitled Case'
  const num = c.caseNumber?.trim()
  if (num) return `${title} · ${num}`
  return title
}
