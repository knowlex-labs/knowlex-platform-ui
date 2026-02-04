import { useState, useEffect, useMemo, useRef } from 'react'
import { Loader2, Sparkles, Check, FileWarning, Lightbulb, FileText, FileClock, Scale, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
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
  isGenerating: boolean
  onClose: () => void
  onGenerate: (templateId: string, formData: TemplateFormData, sourceIds: string[]) => Promise<void>
  onTemplateChange?: (template: DraftTemplate) => void
  templates?: DraftTemplate[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileWarning,
  Lightbulb,
  FileText,
  FileClock,
  Scale,
}

export function TemplateFormModal({
  template,
  isOpen,
  sources,
  isGenerating,
  onClose,
  onGenerate,
  onTemplateChange,
  templates,
}: TemplateFormModalProps) {
  const [step, setStep] = useState<'select' | 'form'>('select')
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [localSourceIds, setLocalSourceIds] = useState<Set<string>>(new Set())
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)

  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select')
    }
  }, [isOpen])

  // Initialize form when template changes (default: no sources selected)
  useEffect(() => {
    if (template) {
      const initial: TemplateFormData = {}
      template.fields.forEach((field) => {
        if (field.type === 'sources') {
          initial[field.id] = []
        } else {
          initial[field.id] = ''
        }
      })
      setFormData(initial)
      setLocalSourceIds(new Set())
    }
  }, [template])

  // Close source dropdown when clicking outside
  useEffect(() => {
    if (!sourceDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sourceDropdownOpen])

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

  const handleTemplateSelect = (t: DraftTemplate) => {
    onTemplateChange?.(t)
  }

  const handleNext = () => {
    if (template) {
      setStep('form')
    }
  }

  const handleBack = () => {
    setStep('select')
  }

  const handleGenerate = async () => {
    if (!template) return
    await onGenerate(template.id, formData, Array.from(localSourceIds))
  }

  const handleClose = () => {
    setStep('select')
    onClose()
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        {step === 'select' ? (
          <>
            {/* Step 1: Template Selection */}
            <DialogHeader>
              <DialogTitle>Select Template</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <p className="text-sm text-ledger-gray-600 mb-4">
                Choose a template to start drafting your document
              </p>
              <div className="grid grid-cols-2 gap-3">
                {templates?.map((t) => {
                  const Icon = iconMap[t.icon] || FileText
                  const isSelected = template?.id === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplateSelect(t)}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-ledger-black bg-ledger-gray-50 ring-2 ring-ledger-black'
                          : 'border-ledger-gray-200 bg-white hover:border-ledger-gray-300 hover:bg-ledger-gray-50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-ledger-black text-white' : 'bg-ledger-gray-100 text-ledger-gray-600'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-medium text-ledger-black">{t.name}</p>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!template}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Step 2: Form */}
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8 p-0"
                  disabled={isGenerating}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Create {template?.name}</DialogTitle>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-2">
                {template?.fields.map((field) => {
                  if (field.type === 'sources') {
                    return (
                      <div key={field.id} className="space-y-2" ref={sourceDropdownRef}>
                        <Label>{field.label}</Label>
                        {sources.length === 0 ? (
                          <p className="text-sm text-ledger-gray-500 py-2">
                            No sources available. Add documents to the sources panel.
                          </p>
                        ) : (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setSourceDropdownOpen((open) => !open)}
                              className={cn(
                                'flex h-10 w-full items-center justify-between rounded border border-ledger-gray-300 bg-ledger-white px-3 py-2',
                                'text-sm font-sans text-ledger-black',
                                'focus:outline-none focus:ring-2 focus:ring-ledger-black focus:ring-offset-1',
                                'hover:border-ledger-gray-400 transition-colors'
                              )}
                            >
                              <span className="truncate">
                                {localSourceIds.size === 0
                                  ? 'Select documents...'
                                  : `${localSourceIds.size} document${localSourceIds.size !== 1 ? 's' : ''} selected`}
                              </span>
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 shrink-0 text-ledger-gray-500 transition-transform',
                                  sourceDropdownOpen && 'rotate-180'
                                )}
                              />
                            </button>
                            {sourceDropdownOpen && (
                              <div className="absolute z-10 mt-1 w-full rounded-lg border border-ledger-gray-200 bg-ledger-white shadow-lg max-h-48 overflow-y-auto">
                                <div className="divide-y divide-ledger-gray-100 py-1">
                                  {sources.map((source) => (
                                    <label
                                      key={source.id}
                                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-ledger-gray-50"
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
                              </div>
                            )}
                          </div>
                        )}
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
              <Button variant="outline" onClick={handleBack} disabled={isGenerating}>
                Back
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
