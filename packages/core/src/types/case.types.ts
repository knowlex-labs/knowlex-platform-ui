// Frontend-friendly Case type with mapped status values

export type CaseType = 'civil' | 'criminal' | 'family' | 'corporate'

export type CaseStatus = 'active' | 'on-hold' | 'closed'

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
