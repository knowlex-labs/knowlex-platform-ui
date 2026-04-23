// Moodboard — single flat task list per user
// Backend: /api/v1/moodboard (auto-creates "My Board" on first GET)

export type MoodboardStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'

// Statuses shown on the main board (Backlog + Archived live in separate panels)
export const ACTIVE_BOARD_STATUSES: MoodboardStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

// ===== Wire (backend) shapes =====

export interface BackendMoodboardTask {
  id: string
  title: string
  description: string | null
  status: MoodboardStatus
  imageKey: string | null
  imageUrl: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface BackendMoodboard {
  id: string
  name: string
  description: string | null
  tasks: BackendMoodboardTask[]
  createdAt: string
  updatedAt: string
}

export interface MoodboardApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface BackendPresignedUploadResponse {
  uploadUrl: string
  imageKey: string
}

// ===== Request DTOs =====

export interface UpdateBoardRequest {
  name?: string
  description?: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: MoodboardStatus
  position?: number
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: MoodboardStatus
  position?: number
  imageKey?: string | null
}

// ===== Frontend-facing (Date-converted) =====

export interface MoodboardTask {
  id: string
  title: string
  description: string | null
  status: MoodboardStatus
  imageKey: string | null
  imageUrl: string | null
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface Moodboard {
  id: string
  name: string
  description: string | null
  tasks: MoodboardTask[]
  createdAt: Date
  updatedAt: Date
}
