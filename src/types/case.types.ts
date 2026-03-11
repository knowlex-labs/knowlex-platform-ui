// Frontend-friendly Case type with mapped status values

export type CaseType = 'civil' | 'criminal' | 'family' | 'corporate'

// Extended case status to include backend statuses
export type CaseStatus = 'active' | 'pending' | 'closed' | 'on-hold' | 'appealed' | 'blocked' | 'archived'

export interface Case {
  id: string
  caseNumber: string | null
  caseType: CaseType | null
  status: CaseStatus
  caseTitle: string | null
  judgeName: string | null
  courtName: string | null
  courtLocation: string | null
  nextHearingDate: Date | null
  createdAt: Date
  updatedAt: Date
}
