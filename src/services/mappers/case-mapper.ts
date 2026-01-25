// Map backend Case to frontend Case

import type { BackendCase, BackendCaseStatus, BackendCaseType } from '@/types/api.types'
import type { Case, CaseStatus, CaseType } from '@/types/case.types'

const caseStatusMap: Record<BackendCaseStatus, CaseStatus> = {
  ACTIVE: 'active',
  PENDING: 'pending',
  CLOSED: 'closed',
  APPEALED: 'appealed',
  BLOCKED: 'blocked',
}

const caseTypeMap: Record<BackendCaseType, CaseType> = {
  CIVIL: 'civil',
  CRIMINAL: 'criminal',
  FAMILY: 'family',
  CORPORATE: 'corporate',
}

export function mapBackendCase(backendCase: BackendCase): Case {
  return {
    id: backendCase.id,
    caseNumber: backendCase.caseNumber,
    caseType: backendCase.caseType ? caseTypeMap[backendCase.caseType] : null,
    status: caseStatusMap[backendCase.caseStatus],
    caseTitle: backendCase.caseTitle,
    judgeName: backendCase.judgeName,
    courtName: backendCase.courtName,
    courtLocation: backendCase.courtLocation,
    nextHearingDate: backendCase.nextHearingDate
      ? new Date(backendCase.nextHearingDate)
      : null,
    createdAt: new Date(backendCase.createdAt),
    updatedAt: new Date(backendCase.updatedAt),
  }
}

export function mapBackendCases(backendCases: BackendCase[]): Case[] {
  return backendCases.map(mapBackendCase)
}
