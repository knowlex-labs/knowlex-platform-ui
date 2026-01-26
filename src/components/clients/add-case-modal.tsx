import { useState } from 'react'
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
import { caseApi, clientApi } from '@/services/api'
import type { BackendCaseType, BackendCaseStatus } from '@/types'

interface AddCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
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

export function AddCaseModal({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: AddCaseModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Create the case
      const caseResponse = await caseApi.create({
        caseTitle: formData.caseTitle.trim() || undefined,
        caseNumber: formData.caseNumber.trim() || undefined,
        caseType: formData.caseType || undefined,
        caseStatus: formData.caseStatus,
        courtName: formData.courtName.trim() || undefined,
        courtLocation: formData.courtLocation.trim() || undefined,
        judgeName: formData.judgeName.trim() || undefined,
        nextHearingDate: formData.nextHearingDate || undefined,
      })

      if (caseResponse.status !== 'success') {
        throw new Error(caseResponse.message || 'Failed to create case')
      }

      const createdCase = caseResponse.data

      // Link the case to the client
      const updateResponse = await clientApi.update(clientId, {
        caseId: createdCase.id,
      })

      if (updateResponse.status !== 'success') {
        throw new Error(updateResponse.message || 'Failed to link case to client')
      }

      setFormData(initialFormData)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create case'
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
          <DialogTitle>Add Case for {clientName}</DialogTitle>
          <DialogDescription>
            Enter the case details below. All fields are optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caseTitle">Case Title</Label>
            <Input
              id="caseTitle"
              name="caseTitle"
              value={formData.caseTitle}
              onChange={handleChange}
              placeholder="e.g., Property Dispute - Smith vs. Jones"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                placeholder="e.g., CIV/2024/001"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseType">Case Type</Label>
              <Select
                id="caseType"
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">Select type</option>
                <option value="CIVIL">Civil</option>
                <option value="CRIMINAL">Criminal</option>
                <option value="FAMILY">Family</option>
                <option value="CORPORATE">Corporate</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseStatus">Case Status</Label>
            <Select
              id="caseStatus"
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
              <Label htmlFor="courtName">Court Name</Label>
              <Input
                id="courtName"
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
                placeholder="e.g., District Court"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtLocation">Court Location</Label>
              <Input
                id="courtLocation"
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
              <Label htmlFor="judgeName">Judge Name</Label>
              <Input
                id="judgeName"
                name="judgeName"
                value={formData.judgeName}
                onChange={handleChange}
                placeholder="e.g., Hon. Justice Sharma"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextHearingDate">Next Hearing Date</Label>
              <Input
                id="nextHearingDate"
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
                  Creating...
                </>
              ) : (
                'Create Case'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
