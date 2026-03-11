// Map backend Case to frontend Case

import type { BackendCase, BackendCaseStatus } from '@/types/api.types'
import type { Case, CaseStatus, CaseType } from '@/types/case.types'

const caseStatusMap: Record<BackendCaseStatus, CaseStatus> = {
  OPEN: 'active',
  PENDING: 'pending',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
}

const caseTypeMap: Record<string, CaseType> = {
  CIVIL: 'civil',
  CRIMINAL: 'criminal',
  FAMILY: 'family',
  CORPORATE: 'corporate',
  CS: 'civil',
  CA_R: 'civil',
  // Map any unknown type to civil as fallback
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
