// Map backend Client to frontend Client

import type { BackendClient, BackendClientCaseSummary, BackendClientType } from '../types/api.types'
import type { Client, ClientCaseSummary, ClientType } from '../types/client.types'
import { mapCaseStatus } from './case-mapper'

const clientTypeMap: Record<BackendClientType, ClientType> = {
  INDIVIDUAL: 'individual',
  COMPANY: 'company',
}

function mapCaseSummary(s: BackendClientCaseSummary): ClientCaseSummary {
  const hasActivity = s.latestActivityType || s.latestActivityLabel || s.latestActivityAt
  return {
    caseId: s.caseId,
    caseNumber: s.caseNumber,
    caseTitle: s.caseTitle,
    caseType: s.caseType,
    caseStatus: mapCaseStatus(s.caseStatus),
    courtName: s.courtName,
    nextHearingDate: s.nextHearingDate ? new Date(s.nextHearingDate) : null,
    latestActivity: hasActivity
      ? {
          type: s.latestActivityType,
          label: s.latestActivityLabel,
          at: s.latestActivityAt ? new Date(s.latestActivityAt) : null,
        }
      : null,
  }
}

export function mapBackendClient(backendClient: BackendClient): Client {
  return {
    id: backendClient.id,
    name: backendClient.name,
    email: backendClient.email,
    phone: backendClient.phoneNumber, // Field name mapping: phoneNumber -> phone
    address: backendClient.address,
    clientType: clientTypeMap[backendClient.clientType],
    caseIds: backendClient.caseIds ?? [],
    caseSummaries: (backendClient.caseSummaries ?? []).map(mapCaseSummary),
    createdAt: new Date(backendClient.createdAt),
    updatedAt: new Date(backendClient.updatedAt),
  }
}

export function mapBackendClients(backendClients: BackendClient[]): Client[] {
  return backendClients.map(mapBackendClient)
}
