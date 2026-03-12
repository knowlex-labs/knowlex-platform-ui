export interface CauseListMetadata {
  remarks: string | null
  cl_number: string
  bench_type: string | null
  petitioner: string
  respondent: string
  search_tab: string
  court_hall_no: string | null
  hearing_category: string
  advocates_petitioner: string
  advocates_respondent: string
}

export interface CauseListItem {
  id: string
  causeListDate: string
  bench: string
  court: string
  caseNumber: string
  judgeName: string
  hearingType: string
  lawyerName: string
  serialNumber: number
  metadata: CauseListMetadata
  createdAt: string
}

export interface CauseListFilters {
  date?: string
}
