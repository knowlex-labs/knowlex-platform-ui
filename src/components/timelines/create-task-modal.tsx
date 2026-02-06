import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Task, TaskStatus, TaskPriority } from '@/types/task.types'

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialTask?: Task
}

export function CreateTaskModal({
  open,
  onOpenChange,
  onSubmit,
  initialTask,
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: null,
    status: 'todo',
    priority: 'medium',
    caseId: '',
    caseName: null,
    dueDate: null,
  })

  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title,
        description: initialTask.description,
        status: initialTask.status,
        priority: initialTask.priority,
        caseId: initialTask.caseId,
        caseName: initialTask.caseName,
        dueDate: initialTask.dueDate,
      })
    } else {
      setFormData({
        title: '',
        description: null,
        status: 'todo',
        priority: 'medium',
        caseId: '',
        caseName: null,
        dueDate: null,
      })
    }
  }, [initialTask, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onSubmit(formData)

    // Reset form
    setFormData({
      title: '',
      description: null,
      status: 'todo',
      priority: 'medium',
      caseId: '',
      caseName: null,
      dueDate: null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value || null,
                })
              }
              placeholder="Add task description (optional)"
              rows={3}
            />
          </div>

          {/* Case Name */}
          <div>
            <Label htmlFor="caseName">Case Name</Label>
            <Input
              id="caseName"
              value={formData.caseName || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  caseName: e.target.value || null,
                  caseId: e.target.value ? formData.caseId || 'placeholder' : '',
                })
              }
              placeholder="Enter case name (optional)"
            />
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TaskPriority })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as TaskStatus })
                }
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={
                formData.dueDate
                  ? formData.dueDate.toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dueDate: e.target.value ? new Date(e.target.value) : null,
                })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {initialTask ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
