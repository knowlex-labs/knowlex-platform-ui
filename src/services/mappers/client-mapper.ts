// Map backend Client to frontend Client

import type { BackendClient, BackendClientType } from '@/types/api.types'
import type { Client, ClientType } from '@/types/client.types'

const clientTypeMap: Record<BackendClientType, ClientType> = {
  INDIVIDUAL: 'individual',
  COMPANY: 'company',
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
    createdAt: new Date(backendClient.createdAt),
    updatedAt: new Date(backendClient.updatedAt),
  }
}

export function mapBackendClients(backendClients: BackendClient[]): Client[] {
  return backendClients.map(mapBackendClient)
}
