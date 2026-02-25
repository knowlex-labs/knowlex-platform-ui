import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { caseApi } from '@/services/api'
import { useCaseTypes } from '@/hooks/use-case-types'
import type { BackendCaseType, BackendCaseStatus } from '@/types'

interface EditCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
  onSuccess: () => void
}

interface FormData {
  caseTitle: string
  caseNumber: string
  caseType: BackendCaseType | ''
  caseStatus: BackendCaseStatus
  courtName: string
  courtLocation: string
  judgeName: string
  nextHearingDate: string
}

const initialFormData: FormData = {
  caseTitle: '',
  caseNumber: '',
  caseType: '',
  caseStatus: 'PENDING',
  courtName: '',
  courtLocation: '',
  judgeName: '',
  nextHearingDate: '',
}

export function EditCaseModal({
  open,
  onOpenChange,
  caseId,
  onSuccess,
}: EditCaseModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCase, setIsLoadingCase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { caseTypes } = useCaseTypes()

  // Fetch case data when modal opens
  useEffect(() => {
    if (!open || !caseId) return

    const fetchData = async () => {
      setIsLoadingCase(true)
      setError(null)

      try {
        const caseResponse = await caseApi.getById(caseId)

        if (caseResponse.status === 'success') {
          const c = caseResponse.data
          setFormData({
            caseTitle: c.caseTitle || '',
            caseNumber: c.caseNumber || '',
            caseType: c.caseType || '',
            caseStatus: c.caseStatus,
            courtName: c.courtName || '',
            courtLocation: c.courtLocation || '',
            judgeName: c.judgeName || '',
            nextHearingDate: c.nextHearingDate || '',
          })
        }
      } catch {
        setError('Failed to load case data')
      } finally {
        setIsLoadingCase(false)
      }
    }

    fetchData()
  }, [open, caseId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError(null)

    try {
      const updateResponse = await caseApi.update(caseId, {
        caseTitle: formData.caseTitle.trim() || undefined,
        caseNumber: formData.caseNumber.trim() || undefined,
        caseType: formData.caseType || undefined,
        caseStatus: formData.caseStatus,
        courtName: formData.courtName.trim() || undefined,
        courtLocation: formData.courtLocation.trim() || undefined,
        judgeName: formData.judgeName.trim() || undefined,
        nextHearingDate: formData.nextHearingDate || undefined,
      })

      if (updateResponse.status !== 'success') {
        throw new Error(updateResponse.message || 'Failed to update case')
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update case'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isSubmitting) {
      if (!isOpen) {
        setFormData(initialFormData)
        setError(null)
      }
      onOpenChange(isOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>
            Update the case details below.
          </DialogDescription>
        </DialogHeader>

        {isLoadingCase ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-ledger-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-caseTitle">Case Title</Label>
              <Input
                id="edit-caseTitle"
                name="caseTitle"
                value={formData.caseTitle}
                onChange={handleChange}
                placeholder="e.g., Property Dispute - Smith vs. Jones"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-caseNumber">Case Number</Label>
                <Input
                  id="edit-caseNumber"
                  name="caseNumber"
                  value={formData.caseNumber}
                  onChange={handleChange}
                  placeholder="e.g., CIV/2026/001"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-caseType">Case Type</Label>
                <Select
                  id="edit-caseType"
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  searchable
                  searchPlaceholder="Search type..."
                >
                  <option value="">Select type</option>
                  {caseTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.displayName}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-caseStatus">Case Status</Label>
              <Select
                id="edit-caseStatus"
                name="caseStatus"
                value={formData.caseStatus}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="APPEALED">Appealed</option>
                <option value="BLOCKED">Blocked</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-courtName">Court Name</Label>
                <Input
                  id="edit-courtName"
                  name="courtName"
                  value={formData.courtName}
                  onChange={handleChange}
                  placeholder="e.g., District Court"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-courtLocation">Court Location</Label>
                <Input
                  id="edit-courtLocation"
                  name="courtLocation"
                  value={formData.courtLocation}
                  onChange={handleChange}
                  placeholder="e.g., Mumbai"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-judgeName">Judge Name</Label>
                <Input
                  id="edit-judgeName"
                  name="judgeName"
                  value={formData.judgeName}
                  onChange={handleChange}
                  placeholder="e.g., Hon. Justice Sharma"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nextHearingDate">Next Hearing Date</Label>
                <Input
                  id="edit-nextHearingDate"
                  name="nextHearingDate"
                  type="date"
                  value={formData.nextHearingDate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
