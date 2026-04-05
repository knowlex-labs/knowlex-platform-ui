import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { BackendCase, BackendCaseStatus, UpdateCaseRequest, RespondentDetails } from '@/types'

interface CaseDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData: BackendCase | null
  onSaveCase: (data: UpdateCaseRequest) => Promise<void>
  onSaveRespondent: (name: string, details: RespondentDetails) => Promise<void>
}

const STATUS_OPTIONS: { value: BackendCaseStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ARCHIVED', label: 'Archived' },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-ledger-gray-400 mb-3">
      {children}
    </p>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium text-ledger-gray-700">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg h-9 border-ledger-gray-200 bg-nb-input text-kx-text-primary"
      />
    </div>
  )
}

export function CaseDetailsModal({
  open, onOpenChange, caseData, onSaveCase, onSaveRespondent,
}: CaseDetailsModalProps) {
  // Case fields
  const [caseTitle, setCaseTitle] = useState('')
  const [caseNumber, setCaseNumber] = useState('')
  const [caseStatus, setCaseStatus] = useState<BackendCaseStatus>('OPEN')
  const [caseType, setCaseType] = useState('')
  const [judgeName, setJudgeName] = useState('')
  const [courtName, setCourtName] = useState('')
  const [courtLocation, setCourtLocation] = useState('')
  const [nextHearingDate, setNextHearingDate] = useState('')

  // Respondent fields
  const [respondentName, setRespondentName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [country, setCountry] = useState('India')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [advocateName, setAdvocateName] = useState('')
  const [advocateEnrollment, setAdvocateEnrollment] = useState('')
  const [notes, setNotes] = useState('')

  const [isSaving, setIsSaving] = useState(false)

  // Populate fields from caseData when modal opens
  useEffect(() => {
    if (!open || !caseData) return
    setCaseTitle(caseData.caseTitle ?? '')
    setCaseNumber(caseData.caseNumber ?? '')
    setCaseStatus(caseData.caseStatus ?? 'OPEN')
    setCaseType(caseData.caseType ?? '')
    setJudgeName(caseData.judgeName ?? '')
    setCourtName(caseData.courtName ?? '')
    setCourtLocation(caseData.courtLocation ?? '')
    setNextHearingDate(caseData.nextHearingDate ?? '')
    setRespondentName(caseData.respondentName ?? '')
    const d = caseData.respondentDetails ?? {}
    setFatherName(d.fatherName ?? '')
    setAddressLine1(d.addressLine1 ?? '')
    setAddressLine2(d.addressLine2 ?? '')
    setCity(d.city ?? '')
    setState(d.state ?? '')
    setPincode(d.pincode ?? '')
    setCountry(d.country ?? 'India')
    setPhone(d.phone ?? '')
    setEmail(d.email ?? '')
    setAdvocateName(d.advocateName ?? '')
    setAdvocateEnrollment(d.advocateEnrollment ?? '')
    setNotes(d.notes ?? '')
  }, [open, caseData])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveCase({
        caseTitle: caseTitle.trim() || undefined,
        caseNumber: caseNumber.trim() || undefined,
        caseStatus,
        caseType: caseType.trim() || undefined,
        judgeName: judgeName.trim() || undefined,
        courtName: courtName.trim() || undefined,
        courtLocation: courtLocation.trim() || undefined,
        nextHearingDate: nextHearingDate || undefined,
      })
      await onSaveRespondent(respondentName.trim(), {
        fatherName: fatherName.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        advocateName: advocateName.trim() || undefined,
        advocateEnrollment: advocateEnrollment.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-ledger-gray-100">
          <DialogTitle className="text-lg font-semibold text-kx-primary-900">
            Case Details
          </DialogTitle>
          <p className="text-sm text-ledger-gray-500 mt-0.5">
            Update case information and respondent details
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* ── Case info ── */}
          <div>
            <SectionHeading>Case Information</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Case Title" value={caseTitle} onChange={setCaseTitle} placeholder="e.g., State vs. John Doe" className="col-span-2" />
              <Field label="Case Number" value={caseNumber} onChange={setCaseNumber} placeholder="e.g., CRL/12/2024" />
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-ledger-gray-700">Status</Label>
                <select
                  value={caseStatus}
                  onChange={(e) => setCaseStatus(e.target.value as BackendCaseStatus)}
                  className="flex h-9 w-full rounded-lg border border-ledger-gray-200 bg-nb-input px-3 text-sm text-kx-primary-900 focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <Field label="Case Type" value={caseType} onChange={setCaseType} placeholder="e.g., Criminal, Civil" />
            </div>
          </div>

          <Separator />

          {/* ── Court & hearing ── */}
          <div>
            <SectionHeading>Court &amp; Hearing</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Court Name" value={courtName} onChange={setCourtName} placeholder="e.g., Sessions Court, Bengaluru" />
              <Field label="Court Location" value={courtLocation} onChange={setCourtLocation} placeholder="e.g., Bengaluru, Karnataka" />
              <Field label="Judge Name" value={judgeName} onChange={setJudgeName} placeholder="e.g., Hon'ble Justice R. K. Misra" />
              <Field label="Next Hearing Date" value={nextHearingDate} onChange={setNextHearingDate} type="date" />
            </div>
          </div>

          <Separator />

          {/* ── Respondent ── */}
          <div>
            <SectionHeading>Respondent / Opposite Party</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Respondent Name" value={respondentName} onChange={setRespondentName} placeholder="e.g., State of Maharashtra" className="col-span-2" />
              <Field label="Address Line 1" value={addressLine1} onChange={setAddressLine1} placeholder="Street / building" className="col-span-2" />
              <Field label="Address Line 2" value={addressLine2} onChange={setAddressLine2} placeholder="Area / landmark (optional)" className="col-span-2" />
              <Field label="City" value={city} onChange={setCity} placeholder="e.g., Mumbai" />
              <Field label="State" value={state} onChange={setState} placeholder="e.g., Maharashtra" />
              <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="400032" />
              <Field label="Country" value={country} onChange={setCountry} placeholder="India" />
              <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91-..." />
              <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="respondent@example.com" />
              <Field label="Advocate Name" value={advocateName} onChange={setAdvocateName} placeholder="e.g., Public Prosecutor" />
              <Field label="Advocate Enrollment No." value={advocateEnrollment} onChange={setAdvocateEnrollment} placeholder="e.g., MAH/1234/2010" />
              <Field label="Father's Name" value={fatherName} onChange={setFatherName} placeholder="If applicable" />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-sm font-medium text-ledger-gray-700">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about the respondent (e.g., Through Secretary, Home Department)"
                className="resize-none min-h-[72px] rounded-lg border-ledger-gray-200 bg-nb-input"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ledger-gray-100 flex justify-end gap-3 bg-nb-panel">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-lg">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-kx-primary-600 hover:bg-kx-primary-700 text-white px-6"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
