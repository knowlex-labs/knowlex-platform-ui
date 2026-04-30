// Map backend Moodboard entities to frontend equivalents (string dates → Date)

import type {
  BackendMoodboard,
  BackendMoodboardTask,
  Moodboard,
  MoodboardTask,
} from '../types/moodboard.types'

export function mapBackendTask(task: BackendMoodboardTask): MoodboardTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    imageKey: task.imageKey,
    imageUrl: task.imageUrl,
    position: task.position,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  }
}

export function mapBackendBoard(board: BackendMoodboard): Moodboard {
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    tasks: (board.tasks ?? []).map(mapBackendTask),
    createdAt: new Date(board.createdAt),
    updatedAt: new Date(board.updatedAt),
  }
}
