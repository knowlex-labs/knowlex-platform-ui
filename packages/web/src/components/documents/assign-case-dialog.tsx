import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { caseApi } from '@knowlex/core/api/case-api'
import { linkDocumentToCase } from '@knowlex/core/api/doc-processing-api'
import { ApiError } from '@knowlex/core/api/api-client'
import { formatCaseFolderLabel } from '@knowlex/core/utils'
import { toast } from '@/hooks/use-toast'
import type { ProcessedDocumentInfo } from '@knowlex/core/api/doc-processing-api'
import type { BackendCase } from '@knowlex/core/types'

interface AssignCaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: ProcessedDocumentInfo | null
  onAssigned: () => void
}

export function AssignCaseDialog({ open, onOpenChange, document, onAssigned }: AssignCaseDialogProps) {
  const [cases, setCases] = useState<BackendCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [isLoadingCases, setIsLoadingCases] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedCaseId('')
    setError(null)
    setIsLoadingCases(true)
    caseApi.getAll({ size: 50 })
      .then((res) => setCases(res.data?.content ?? []))
      .catch(() => setCases([]))
      .finally(() => setIsLoadingCases(false))
  }, [open])

  const handleSubmit = async () => {
    if (!document || !selectedCaseId) return
    setIsSubmitting(true)
    setError(null)
    try {
      await linkDocumentToCase(document.id, selectedCaseId)
      toast({ title: 'Document assigned', description: 'The document has been added to the case.' })
      onAssigned()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to assign document')
    } finally {
      setIsSubmitting(false)
    }
  }

  const caseLabel = (c: BackendCase) => formatCaseFolderLabel(c)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign to Case</DialogTitle>
          <DialogDescription>
            {document ? `Attach "${document.fileName}" to an existing case.` : 'Attach this document to an existing case.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select case</Label>
            {isLoadingCases ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded border border-ledger-gray-300 text-sm text-ledger-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading cases…
              </div>
            ) : (
              <Select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                searchable
                searchPlaceholder="Search cases…"
              >
                <option value="" disabled>Choose a case</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{caseLabel(c)}</option>
                ))}
              </Select>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full"
            disabled={!selectedCaseId || isSubmitting || isLoadingCases}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Assign to Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
