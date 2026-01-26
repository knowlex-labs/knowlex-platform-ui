export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  caseId: string
  caseName: string | null
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}
