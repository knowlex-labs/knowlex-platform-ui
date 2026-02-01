import { useState, useEffect, useMemo } from 'react'
import { Loader2, Sparkles, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { DraftTemplate, TemplateFormData, CaseSource } from '@/types'

interface TemplateFormModalProps {
  template: DraftTemplate | null
  isOpen: boolean
  sources: CaseSource[]
  selectedSourceIds: Set<string>
  isGenerating: boolean
  onClose: () => void
  onGenerate: (templateId: string, formData: TemplateFormData, sourceIds: string[]) => Promise<void>
}

export function TemplateFormModal({
  template,
  isOpen,
  sources,
  selectedSourceIds,
  isGenerating,
  onClose,
  onGenerate,
}: TemplateFormModalProps) {
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [localSourceIds, setLocalSourceIds] = useState<Set<string>>(new Set())

  // Initialize form when template changes
  useEffect(() => {
    if (template) {
      const initial: TemplateFormData = {}
      template.fields.forEach((field) => {
        if (field.type === 'sources') {
          initial[field.id] = Array.from(selectedSourceIds)
        } else {
          initial[field.id] = ''
        }
      })
      setFormData(initial)
      setLocalSourceIds(new Set(selectedSourceIds))
    }
  }, [template, selectedSourceIds])

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSourceToggle = (sourceId: string) => {
    setLocalSourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(sourceId)) {
        next.delete(sourceId)
      } else {
        next.add(sourceId)
      }
      return next
    })
  }

  const handleGenerate = async () => {
    if (!template) return
    await onGenerate(template.id, formData, Array.from(localSourceIds))
  }

  const isValid = useMemo(() => {
    if (!template) return false
    return template.fields
      .filter((f) => f.required && f.type !== 'sources')
      .every((f) => {
        const value = formData[f.id]
        return typeof value === 'string' && value.trim().length > 0
      })
  }, [template, formData])

  if (!template) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create {template.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {template.fields.map((field) => {
              if (field.type === 'sources') {
                return (
                  <div key={field.id} className="space-y-2">
                    <Label>{field.label}</Label>
                    <div className="border border-ledger-gray-200 rounded-lg max-h-[150px] overflow-y-auto">
                      {sources.length === 0 ? (
                        <p className="text-sm text-ledger-gray-500 p-3">
                          No sources available. Add documents to the sources panel.
                        </p>
                      ) : (
                        <div className="divide-y divide-ledger-gray-100">
                          {sources.map((source) => (
                            <label
                              key={source.id}
                              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-ledger-gray-50"
                            >
                              <button
                                type="button"
                                onClick={() => handleSourceToggle(source.id)}
                                className={cn(
                                  'h-4 w-4 shrink-0 rounded border flex items-center justify-center',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-black focus-visible:ring-offset-2',
                                  localSourceIds.has(source.id)
                                    ? 'bg-ledger-black border-ledger-black text-ledger-white'
                                    : 'border-ledger-gray-300 bg-ledger-white'
                                )}
                              >
                                {localSourceIds.has(source.id) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </button>
                              <span className="text-sm text-ledger-black truncate">
                                {source.originalFilename}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-ledger-gray-500">
                      {localSourceIds.size} document{localSourceIds.size !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Textarea
                      id={field.id}
                      value={(formData[field.id] as string) || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                )
              }

              return (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.id}
                    value={(formData[field.id] as string) || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!isValid || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
