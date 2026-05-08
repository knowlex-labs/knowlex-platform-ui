import { useState, useEffect } from 'react'
import { Loader2, Plus } from 'lucide-react'
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
import { caseApi, clientApi, statesApi } from '@knowlex/core/api'
import type { State, Bench } from '@knowlex/core/api'
import { mapBackendClient } from '@knowlex/core/mappers'
import { useCaseTypes } from '@/hooks/use-case-types'
import { AddClientModal } from '@/components/clients/add-client-modal'
import type { BackendCaseType, BackendCaseStatus } from '@knowlex/core/types'

interface AddCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ClientOption {
  id: string
  name: string
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
  clientId: string
}

const initialFormData: FormData = {
  caseTitle: '',
  caseNumber: '',
  caseType: '',
  caseStatus: 'ACTIVE',
  courtName: '',
  courtLocation: '',
  judgeName: '',
  nextHearingDate: '',
  clientId: '',
}

export function AddCaseModal({
  open,
  onOpenChange,
  onSuccess,
}: AddCaseModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [states, setStates] = useState<State[]>([])
  const [benches, setBenches] = useState<Bench[]>([])
  const { caseTypes } = useCaseTypes()

  const [showAddClientModal, setShowAddClientModal] = useState(false)

  useEffect(() => {
    if (!open) return
    const fetchData = async () => {
      try {
        const [clientsRes, statesRes] = await Promise.all([
          clientApi.getAll({ page: 0, size: 100 }),
          statesApi.getStates(),
        ])
        if (clientsRes.status === 'success') {
          setClients(clientsRes.data.content.map((c) => {
            const client = mapBackendClient(c)
            return { id: client.id, name: client.name }
          }))
        }
        if (statesRes.status === 'success') {
          setStates(statesRes.data)
        }
      } catch {
        // Silently fail
      }
    }
    fetchData()
  }, [open])

  const handleStateChange = async (stateId: string) => {
    setFormData((prev) => ({ ...prev, courtLocation: stateId, courtName: '' }))
    setError(null)
    setBenches([])
    if (!stateId) return
    try {
      const res = await statesApi.getBenches(stateId)
      if (res.status === 'success') setBenches(res.data)
    } catch {
      // Silently fail
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.caseNumber.trim()) {
      setError('Case number is required')
      return
    }
    if (formData.caseNumber.trim().length < 3) {
      setError('Case number must be between 3 and 100 characters')
      return
    }
    if (!formData.caseTitle.trim()) {
      setError('Case title is required')
      return
    }
    if (formData.caseTitle.trim().length < 3) {
      setError('Case title must be between 3 and 500 characters')
      return
    }
    if (!formData.clientId) {
      setError('Please select a client')
      return
    }

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

      // Link the case to the selected client (skip if "other")
      if (formData.clientId !== 'other') {
        await clientApi.linkCase(formData.clientId, createdCase.id)
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
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Case</DialogTitle>
          <DialogDescription>
            Enter the case details below. Client assignment is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
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
              <Label htmlFor="courtLocation">State</Label>
              <Select
                id="courtLocation"
                name="courtLocation"
                value={formData.courtLocation}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={isSubmitting}
                searchable
                searchPlaceholder="Search state..."
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtName">Bench</Label>
              <Select
                id="courtName"
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
                disabled={isSubmitting || !formData.courtLocation}
                searchable
                searchPlaceholder="Search bench..."
              >
                <option value="">Select bench</option>
                {benches.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseType">Case Type</Label>
            <Select
              id="caseType"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="judgeName">Judge Name</Label>
              <Input
                id="judgeName"
                name="judgeName"
                value={formData.judgeName}
                onChange={handleChange}
                placeholder="e.g., Hon'ble Justice Sharma"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseStatus">Case Status</Label>
              <Select
                id="caseStatus"
                name="caseStatus"
                value={formData.caseStatus}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                placeholder="e.g., CIV/2026/001"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Assign to Client *</Label>
            <Select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              disabled={isSubmitting}
              searchable
              searchPlaceholder="Search clients..."
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
              <option value="other">Other (no client)</option>
            </Select>
            <button
              type="button"
              onClick={() => setShowAddClientModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-xs text-kx-primary-600 dark:text-kx-primary-400 hover:underline disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              Add new client
            </button>
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

    <AddClientModal
      open={showAddClientModal}
      onOpenChange={setShowAddClientModal}
      onSuccess={() => {}}
      onSuccessWithClient={(client) => {
        setClients((prev) => [...prev, client])
        setFormData((prev) => ({ ...prev, clientId: client.id }))
      }}
    />
    </>
  )
}
