// Moodboard API service — single-board-per-user, flat task list
// All responses: { success, message, data }

import { apiClient } from './api-client'
import type {
  BackendMoodboard,
  BackendMoodboardTask,
  BackendPresignedUploadResponse,
  CreateTaskRequest,
  MoodboardApiResponse,
  UpdateBoardRequest,
  UpdateTaskRequest,
} from '../types'

const ENDPOINT = '/api/v1/moodboard'

type Resp<T> = MoodboardApiResponse<T>

export const moodboardApi = {
  // Board (auto-creates on first GET)
  getBoard: (): Promise<Resp<BackendMoodboard>> => {
    return apiClient.get<Resp<BackendMoodboard>>(ENDPOINT)
  },

  updateBoard: (data: UpdateBoardRequest): Promise<Resp<BackendMoodboard>> => {
    return apiClient.put<Resp<BackendMoodboard>>(ENDPOINT, data)
  },

  // Separate views
  getBacklog: (): Promise<Resp<BackendMoodboardTask[]>> => {
    return apiClient.get<Resp<BackendMoodboardTask[]>>(`${ENDPOINT}/backlog`)
  },

  getArchived: (): Promise<Resp<BackendMoodboardTask[]>> => {
    return apiClient.get<Resp<BackendMoodboardTask[]>>(`${ENDPOINT}/archived`)
  },

  // Tasks
  createTask: (data: CreateTaskRequest): Promise<Resp<BackendMoodboardTask>> => {
    return apiClient.post<Resp<BackendMoodboardTask>>(`${ENDPOINT}/tasks`, data)
  },

  updateTask: (taskId: string, data: UpdateTaskRequest): Promise<Resp<BackendMoodboardTask>> => {
    return apiClient.put<Resp<BackendMoodboardTask>>(`${ENDPOINT}/tasks/${taskId}`, data)
  },

  deleteTask: (taskId: string): Promise<Resp<null>> => {
    return apiClient.delete<Resp<null>>(`${ENDPOINT}/tasks/${taskId}`)
  },

  // Task images
  getImageUploadUrl: (
    taskId: string,
    filename: string
  ): Promise<Resp<BackendPresignedUploadResponse>> => {
    const query = `?filename=${encodeURIComponent(filename)}`
    return apiClient.post<Resp<BackendPresignedUploadResponse>>(
      `${ENDPOINT}/tasks/${taskId}/image-upload-url${query}`
    )
  },

  deleteTaskImage: (taskId: string): Promise<Resp<null>> => {
    return apiClient.delete<Resp<null>>(`${ENDPOINT}/tasks/${taskId}/image`)
  },

  uploadImageToS3: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`)
    }
  },
}
