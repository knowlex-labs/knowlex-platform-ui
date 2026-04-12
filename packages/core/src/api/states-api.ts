import { apiClient } from './api-client'

export interface State {
  id: string
  name: string
}

export interface Bench {
  id: string
  name: string
}

interface StatesResponse {
  status: string
  data: State[]
}

interface BenchesResponse {
  status: string
  data: Bench[]
}

export const statesApi = {
  getStates: (): Promise<StatesResponse> => {
    return apiClient.get<StatesResponse>('/api/v1/states')
  },

  getBenches: (stateId: string): Promise<BenchesResponse> => {
    return apiClient.get<BenchesResponse>(`/api/v1/states/${stateId}/benches`)
  },
}
